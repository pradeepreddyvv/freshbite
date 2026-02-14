import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/restaurants?q=...
 *
 * Fuzzy restaurant-name search using pg_trgm (trigram similarity).
 * Returns restaurants ranked by name similarity — tolerates typos.
 *
 * Combines:
 *   1. Trigram similarity (fuzzy) on Restaurant.name
 *   2. ILIKE fallback for substring matches the trigram might miss
 *
 * Returns: { results: [{ id, name, city, address, similarity }], query }
 */

interface RestaurantSearchResult {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  similarity: number;
  dishCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], query: q || '' });
    }

    // pg_trgm fuzzy search + ILIKE fallback, with dish count
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        city: string | null;
        address: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
        sim: number;
        dish_count: number;
      }>
    >`
      SELECT
        r."id",
        r."name",
        r."city",
        r."address",
        r."state",
        r."latitude",
        r."longitude",
        GREATEST(
          similarity(r."name", ${q}),
          CASE WHEN r."name" ILIKE '%' || ${q} || '%' THEN 0.35 ELSE 0.0 END
        )::DOUBLE PRECISION AS sim,
        (SELECT COUNT(*)::INT FROM "DishAtRestaurant" d WHERE d."restaurantId" = r."id") AS dish_count
      FROM "Restaurant" r
      WHERE
        similarity(r."name", ${q}) > 0.08
        OR r."name" ILIKE '%' || ${q} || '%'
      ORDER BY sim DESC, r."name" ASC
      LIMIT 30
    `;

    const results: RestaurantSearchResult[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      address: r.address,
      state: r.state,
      latitude: r.latitude,
      longitude: r.longitude,
      similarity: Number(Number(r.sim).toFixed(3)),
      dishCount: r.dish_count,
    }));

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error('Restaurant search error:', error);
    return NextResponse.json({ results: [], query: '', error: 'Search failed' }, { status: 500 });
  }
}
