import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/locations?q=...
 *
 * Location-based search: find restaurants by city, address, or state.
 * Uses pg_trgm similarity for fuzzy matching + ILIKE for reliable substrings.
 *
 * Falls back to pure Prisma ILIKE if pg_trgm extension is not enabled.
 *
 * Returns: { results: [{ id, name, city, address, state, similarity, matchedField, dishCount }], query }
 */

interface LocationSearchResult {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  similarity: number;
  matchedField: 'city' | 'address' | 'state';
  dishCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
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
          city_score: number;
          address_score: number;
          state_score: number;
          best_score: number;
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
            COALESCE(similarity(r."city", ${q}), 0),
            CASE WHEN r."city" ILIKE '%' || ${q} || '%' THEN 0.5 ELSE 0.0 END
          )::DOUBLE PRECISION AS city_score,
          GREATEST(
            COALESCE(similarity(r."address", ${q}), 0),
            CASE WHEN r."address" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END
          )::DOUBLE PRECISION AS address_score,
          GREATEST(
            COALESCE(similarity(r."state", ${q}), 0),
            CASE WHEN r."state" ILIKE '%' || ${q} || '%' THEN 0.35 ELSE 0.0 END
          )::DOUBLE PRECISION AS state_score,
          GREATEST(
            COALESCE(similarity(r."city", ${q}), 0),
            COALESCE(similarity(r."address", ${q}), 0),
            COALESCE(similarity(r."state", ${q}), 0),
            CASE WHEN r."city" ILIKE '%' || ${q} || '%' THEN 0.5 ELSE 0.0 END,
            CASE WHEN r."address" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END,
            CASE WHEN r."state" ILIKE '%' || ${q} || '%' THEN 0.35 ELSE 0.0 END
          )::DOUBLE PRECISION AS best_score,
          (SELECT COUNT(*)::INT FROM "DishAtRestaurant" d WHERE d."restaurantId" = r."id") AS dish_count
        FROM "Restaurant" r
        WHERE
          r."city" ILIKE '%' || ${q} || '%'
          OR r."address" ILIKE '%' || ${q} || '%'
          OR r."state" ILIKE '%' || ${q} || '%'
          OR similarity(r."city", ${q}) > 0.2
          OR similarity(r."address", ${q}) > 0.15
          OR similarity(r."state", ${q}) > 0.3
        ORDER BY best_score DESC, r."name" ASC
        LIMIT 50
      `;

      const results: LocationSearchResult[] = rows.map((r) => {
        const citySim = Number(r.city_score);
        const addrSim = Number(r.address_score);
        const stateSim = Number(r.state_score);
        let matchedField: 'city' | 'address' | 'state' = 'city';
        if (addrSim > citySim && addrSim > stateSim) matchedField = 'address';
        else if (stateSim > citySim) matchedField = 'state';

        return {
          id: r.id,
          name: r.name,
          city: r.city,
          address: r.address,
          state: r.state,
          latitude: r.latitude,
          longitude: r.longitude,
          similarity: Number(Number(r.best_score).toFixed(3)),
          matchedField,
          dishCount: r.dish_count,
        };
      });

      return NextResponse.json({ results, query: q });
    } catch {
      // Fallback: pg_trgm not available — pure Prisma ILIKE search
      const restaurants = await prisma.restaurant.findMany({
        where: {
          OR: [
            { city: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: { select: { dishesAtRestaurant: true } },
        },
        take: 50,
        orderBy: { name: 'asc' },
      });

      const results: LocationSearchResult[] = restaurants.map((r) => {
        const cityMatch = r.city?.toLowerCase().includes(q.toLowerCase());
        const stateMatch = r.state?.toLowerCase().includes(q.toLowerCase());
        const matchedField: 'city' | 'address' | 'state' = cityMatch
          ? 'city'
          : stateMatch
            ? 'state'
            : 'address';

        return {
          id: r.id,
          name: r.name,
          city: r.city,
          address: r.address,
          state: r.state,
          latitude: r.latitude,
          longitude: r.longitude,
          similarity: 1,
          matchedField,
          dishCount: r._count.dishesAtRestaurant,
        };
      });

      return NextResponse.json({ results, query: q });
    }
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      { results: [], query: '', error: 'Search failed' },
      { status: 500 },
    );
  }
}
