import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/restaurants?q=...
 *
 * Standard restaurant search combining:
 *   1. pg_trgm similarity() — fuzzy, typo-tolerant ranking
 *   2. ILIKE — reliable substring matching (never misses exact substrings)
 *
 * Falls back to pure Prisma ILIKE if pg_trgm extension is not enabled.
 *
 * Returns: { results: [{ id, name, city, address, state, similarity, dishCount }], query }
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

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [], query: q || '' });
    }

    try {
      // Primary: raw SQL with pg_trgm similarity + ILIKE
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          city: string | null;
          address: string | null;
          state: string | null;
          latitude: number | null;
          longitude: number | null;
          score: number;
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
            COALESCE(similarity(r."name", ${q}), 0),
            COALESCE(similarity(r."city", ${q}), 0),
            CASE WHEN r."name" ILIKE '%' || ${q} || '%' THEN 0.5 ELSE 0.0 END,
            CASE WHEN r."city" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END,
            CASE WHEN r."address" ILIKE '%' || ${q} || '%' THEN 0.3 ELSE 0.0 END
          )::DOUBLE PRECISION AS score,
          (SELECT COUNT(*)::INT FROM "DishAtRestaurant" d WHERE d."restaurantId" = r."id") AS dish_count
        FROM "Restaurant" r
        WHERE
          r."name" ILIKE '%' || ${q} || '%'
          OR r."city" ILIKE '%' || ${q} || '%'
          OR r."address" ILIKE '%' || ${q} || '%'
          OR r."state" ILIKE '%' || ${q} || '%'
          OR similarity(r."name", ${q}) > 0.15
          OR similarity(r."city", ${q}) > 0.2
        ORDER BY score DESC, r."name" ASC
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
        similarity: Number(Number(r.score).toFixed(3)),
        dishCount: r.dish_count,
      }));

      return NextResponse.json({ results, query: q });
    } catch {
      // Fallback: pg_trgm not available — pure Prisma ILIKE search
      const words = q.split(/\s+/).filter(Boolean);
      const restaurants = await prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
            ...words.flatMap((w) => [
              { name: { contains: w, mode: 'insensitive' as const } },
              { city: { contains: w, mode: 'insensitive' as const } },
            ]),
          ],
        },
        include: {
          _count: { select: { dishesAtRestaurant: true } },
        },
        take: 30,
        orderBy: { name: 'asc' },
      });

      const results: RestaurantSearchResult[] = restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        address: r.address,
        state: r.state,
        latitude: r.latitude,
        longitude: r.longitude,
        similarity: 1,
        dishCount: r._count.dishesAtRestaurant,
      }));

      return NextResponse.json({ results, query: q });
    }
  } catch (error) {
    console.error('Restaurant search error:', error);
    return NextResponse.json(
      { results: [], query: '', error: 'Search failed' },
      { status: 500 },
    );
  }
}
