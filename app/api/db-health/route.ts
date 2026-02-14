import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/db-health
 * Reports DB size, table sizes, index sizes, usage %, and status.
 * 
 * POST /api/db-health
 * Same as GET but also persists a snapshot to db_health_snapshot table.
 * Protected by bearer token (same as alerts).
 */

const log = withLogging('/api/db-health');

interface TableHealth {
  tableName: string;
  tableSizeMb: number;
  indexSizeMb: number;
}

interface HealthReport {
  totalSizeMb: number;
  maxStorageMb: number;
  usagePct: number;
  status: 'ok' | 'warn' | 'critical';
  tables: TableHealth[];
  reviewCount: number;
  oldestReview: string | null;
  newestReview: string | null;
  rollupCount: number;
  message: string;
}

async function generateHealthReport(): Promise<HealthReport> {
  // Get retention config
  const config = await prisma.retentionConfig.findUnique({
    where: { id: 'singleton' },
  });
  const maxStorageMb = config?.maxStorageMb ?? 512.0;
  const warnPct = config?.warnAtPct ?? 70.0;
  const critPct = config?.criticalAtPct ?? 85.0;

  // Query DB sizes using raw SQL
  const sizeRows = await prisma.$queryRaw<
    Array<{
      total_size_mb: number;
      table_name: string;
      table_size_mb: number;
      index_size_mb: number;
    }>
  >`SELECT * FROM check_db_health()`;

  const totalSizeMb = sizeRows.length > 0 ? Number(sizeRows[0].total_size_mb) : 0;
  const tables: TableHealth[] = sizeRows.map((r) => ({
    tableName: r.table_name,
    tableSizeMb: Number(Number(r.table_size_mb).toFixed(3)),
    indexSizeMb: Number(Number(r.index_size_mb).toFixed(3)),
  }));

  const usagePct = maxStorageMb > 0 ? (totalSizeMb / maxStorageMb) * 100 : 0;

  let status: 'ok' | 'warn' | 'critical' = 'ok';
  let message = `DB usage: ${totalSizeMb.toFixed(2)} MB / ${maxStorageMb} MB (${usagePct.toFixed(1)}%)`;
  if (usagePct >= critPct) {
    status = 'critical';
    message = `⚠️ CRITICAL: ${message} — consider archiving old data`;
  } else if (usagePct >= warnPct) {
    status = 'warn';
    message = `⚠ WARNING: ${message} — approaching storage limit`;
  } else {
    message = `✅ ${message}`;
  }

  // Review stats
  const reviewCount = await prisma.review.count();
  const oldestReview = await prisma.review.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  const newestReview = await prisma.review.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const rollupCount = await prisma.dailyRollup.count();

  return {
    totalSizeMb: Number(totalSizeMb.toFixed(3)),
    maxStorageMb,
    usagePct: Number(usagePct.toFixed(1)),
    status,
    tables,
    reviewCount,
    oldestReview: oldestReview?.createdAt.toISOString() ?? null,
    newestReview: newestReview?.createdAt.toISOString() ?? null,
    rollupCount,
    message,
  };
}

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    const report = await generateHealthReport();
    ctx.success(200, { status: report.status, usagePct: report.usagePct });
    return NextResponse.json(report);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to generate health report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ALERTS_SECRET_TOKEN || 'dev-token';
    if (authHeader !== `Bearer ${expectedToken}`) {
      ctx.fail(401, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await generateHealthReport();

    // Persist snapshot
    const tableSizesJson: Record<string, number> = {};
    const indexSizesJson: Record<string, number> = {};
    for (const t of report.tables) {
      tableSizesJson[t.tableName] = t.tableSizeMb;
      indexSizesJson[t.tableName + '_indexes'] = t.indexSizeMb;
    }

    await prisma.dbHealthSnapshot.create({
      data: {
        totalSizeMb: report.totalSizeMb,
        tableSizesJson: JSON.stringify(tableSizesJson),
        indexSizesJson: JSON.stringify(indexSizesJson),
        usagePct: report.usagePct,
        status: report.status,
      },
    });

    ctx.success(200, { status: report.status, usagePct: report.usagePct, snapshotSaved: true });
    return NextResponse.json({ ...report, snapshotSaved: true });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to generate/save health report' },
      { status: 500 }
    );
  }
}
