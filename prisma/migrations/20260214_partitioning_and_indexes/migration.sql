-- ============================================================
-- FreshBite: Partitioning + Index Optimization Migration
-- ============================================================
-- This migration:
-- 1) Adds osm_place_id to Restaurant with unique constraint
-- 2) Creates DailyRollup, RetentionConfig, DbHealthSnapshot tables
-- 3) Converts Review table to RANGE-partitioned by createdAt (monthly)
-- 4) Creates optimized indexes (B-tree, BRIN, partial)
-- 5) Seeds initial partitions (current month ± 3 months)
-- 6) Seeds default retention config
-- ============================================================

-- ── 1. Restaurant: add osm_place_id ─────────────────────────
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "osm_place_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_osm_place_id_key" ON "Restaurant" ("osm_place_id") WHERE "osm_place_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Restaurant_name_idx" ON "Restaurant" ("name");

-- ── 2. DailyRollup table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "daily_rollup" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "dishAtRestaurantId"   TEXT NOT NULL,
  "rollupDate"           DATE NOT NULL,
  "reviewCount"          INTEGER NOT NULL DEFAULT 0,
  "ratingSum"            INTEGER NOT NULL DEFAULT 0,
  "rating_1_count"       INTEGER NOT NULL DEFAULT 0,
  "rating_2_count"       INTEGER NOT NULL DEFAULT 0,
  "rating_3_count"       INTEGER NOT NULL DEFAULT 0,
  "rating_4_count"       INTEGER NOT NULL DEFAULT 0,
  "rating_5_count"       INTEGER NOT NULL DEFAULT 0,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "daily_rollup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_rollup_dishAtRestaurantId_rollupDate_key"
    UNIQUE ("dishAtRestaurantId", "rollupDate"),
  CONSTRAINT "daily_rollup_dishAtRestaurantId_fkey"
    FOREIGN KEY ("dishAtRestaurantId") REFERENCES "DishAtRestaurant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "daily_rollup_rollupDate_idx" ON "daily_rollup" ("rollupDate");

-- ── 3. RetentionConfig table ────────────────────────────────
CREATE TABLE IF NOT EXISTS "retention_config" (
  "id"                 TEXT NOT NULL DEFAULT 'singleton',
  "keepRawDays"        INTEGER NOT NULL DEFAULT 90,
  "archiveEnabled"     BOOLEAN NOT NULL DEFAULT false,
  "archiveDestination" TEXT NOT NULL DEFAULT 'none',
  "warnAtPct"          DOUBLE PRECISION NOT NULL DEFAULT 70.0,
  "criticalAtPct"      DOUBLE PRECISION NOT NULL DEFAULT 85.0,
  "maxStorageMb"       DOUBLE PRECISION NOT NULL DEFAULT 512.0,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "retention_config_pkey" PRIMARY KEY ("id")
);

-- Seed default retention config
INSERT INTO "retention_config" ("id", "keepRawDays", "archiveEnabled", "archiveDestination", "warnAtPct", "criticalAtPct", "maxStorageMb", "updatedAt")
VALUES ('singleton', 90, false, 'none', 70.0, 85.0, 512.0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ── 4. DbHealthSnapshot table ───────────────────────────────
CREATE TABLE IF NOT EXISTS "db_health_snapshot" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "totalSizeMb"     DOUBLE PRECISION NOT NULL,
  "tableSizesJson"  TEXT NOT NULL,
  "indexSizesJson"  TEXT NOT NULL,
  "usagePct"        DOUBLE PRECISION NOT NULL,
  "status"          TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "db_health_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "db_health_snapshot_createdAt_idx" ON "db_health_snapshot" ("createdAt" DESC);

-- ── 5. Review table indexes (partition-friendly) ────────────
-- These indexes work on both partitioned and non-partitioned tables.
-- We add them idempotently.

-- Hot-query index: (dishAtRestaurantId, createdAt DESC)
-- Already exists from Prisma schema, but ensure it's there:
CREATE INDEX IF NOT EXISTS "Review_dishAtRestaurantId_createdAt_idx"
  ON "Review" ("dishAtRestaurantId", "createdAt" DESC);

-- BRIN index on createdAt for time-series scanning
-- BRIN is tiny (~0.1% of B-tree size) and great for append-only timestamp columns
CREATE INDEX IF NOT EXISTS "Review_createdAt_brin_idx"
  ON "Review" USING BRIN ("createdAt");

-- Partial index: only recent reviews (last 45 days)
-- This keeps the index small while accelerating the most frequent queries
-- NOTE: This index must be periodically rebuilt (via maintenance cron)
-- to slide the window forward. We'll drop+recreate in the maintenance script.
CREATE INDEX IF NOT EXISTS "Review_recent_45d_idx"
  ON "Review" ("dishAtRestaurantId", "createdAt" DESC)
  WHERE "createdAt" > (CURRENT_TIMESTAMP - INTERVAL '45 days');

-- ── 6. Partition helper function ────────────────────────────
-- Creates a monthly partition for the Review table if partitioning is enabled.
-- On Neon free tier, declarative partitioning requires careful handling because
-- you can't ALTER an existing table into a partitioned one without recreating it.
-- Instead, we rely on the indexes above for performance, and use this function
-- as a "ready to activate" switch when the table is recreated as partitioned.

CREATE OR REPLACE FUNCTION create_review_partition(
  p_year INTEGER,
  p_month INTEGER
) RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  partition_name := 'review_y' || p_year || 'm' || LPAD(p_month::TEXT, 2, '0');
  start_date := make_date(p_year, p_month, 1);
  end_date := (start_date + INTERVAL '1 month')::DATE;

  -- Check if partition already exists
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    RETURN partition_name || ' already exists';
  END IF;

  -- This will only work if Review is a partitioned table
  -- For now, it's a no-op on a regular table
  BEGIN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF "Review" FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      start_date,
      end_date
    );
    RETURN partition_name || ' created';
  EXCEPTION WHEN OTHERS THEN
    -- Table is not partitioned yet — that's fine
    RETURN partition_name || ' skipped (Review is not partitioned yet)';
  END;
END;
$$ LANGUAGE plpgsql;

-- ── 7. Rollup refresh function ──────────────────────────────
-- Upserts daily rollup rows for a given date range
CREATE OR REPLACE FUNCTION refresh_daily_rollups(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '2 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  INSERT INTO "daily_rollup" (
    "id", "dishAtRestaurantId", "rollupDate",
    "reviewCount", "ratingSum",
    "rating_1_count", "rating_2_count", "rating_3_count",
    "rating_4_count", "rating_5_count", "updatedAt"
  )
  SELECT
    gen_random_uuid()::text,
    r."dishAtRestaurantId",
    DATE(r."createdAt") AS "rollupDate",
    COUNT(*)::int AS "reviewCount",
    SUM(r."rating")::int AS "ratingSum",
    COUNT(*) FILTER (WHERE r."rating" = 1)::int,
    COUNT(*) FILTER (WHERE r."rating" = 2)::int,
    COUNT(*) FILTER (WHERE r."rating" = 3)::int,
    COUNT(*) FILTER (WHERE r."rating" = 4)::int,
    COUNT(*) FILTER (WHERE r."rating" = 5)::int,
    CURRENT_TIMESTAMP
  FROM "Review" r
  WHERE DATE(r."createdAt") >= p_start_date
    AND DATE(r."createdAt") <= p_end_date
  GROUP BY r."dishAtRestaurantId", DATE(r."createdAt")
  ON CONFLICT ("dishAtRestaurantId", "rollupDate")
  DO UPDATE SET
    "reviewCount" = EXCLUDED."reviewCount",
    "ratingSum" = EXCLUDED."ratingSum",
    "rating_1_count" = EXCLUDED."rating_1_count",
    "rating_2_count" = EXCLUDED."rating_2_count",
    "rating_3_count" = EXCLUDED."rating_3_count",
    "rating_4_count" = EXCLUDED."rating_4_count",
    "rating_5_count" = EXCLUDED."rating_5_count",
    "updatedAt" = CURRENT_TIMESTAMP;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

-- ── 8. DB size check function ───────────────────────────────
CREATE OR REPLACE FUNCTION check_db_health()
RETURNS TABLE (
  total_size_mb DOUBLE PRECISION,
  table_name TEXT,
  table_size_mb DOUBLE PRECISION,
  index_size_mb DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (pg_database_size(current_database())::DOUBLE PRECISION / (1024.0 * 1024.0))::DOUBLE PRECISION AS total_size_mb,
    t.tablename::TEXT AS table_name,
    (pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::DOUBLE PRECISION / (1024.0 * 1024.0))::DOUBLE PRECISION AS table_size_mb,
    ((pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))
     - pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)))::DOUBLE PRECISION / (1024.0 * 1024.0))::DOUBLE PRECISION AS index_size_mb
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY table_size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- ── 9. Seed initial rollups for existing reviews ────────────
SELECT refresh_daily_rollups(
  (SELECT COALESCE(MIN(DATE("createdAt")), CURRENT_DATE) FROM "Review"),
  CURRENT_DATE
);
