import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/locations?q=...
 *
 * Fuzzy location search using pg_trgm on city, address, and state.
 * Returns restaurants grouped by matching location, ranked by similarity.
 *
 * This is separate from restaurant-name search — the user types a location
 * (city, address, zip, state) and gets restaurants in that area.
 *
 * Returns: { results: [{ id, name, city, address, state, similarity, dishCount }], query }
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

    // Fuzzy search across city, address, and state with field-level scoring
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        city: string | null;
        address: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
        city_sim: number;
        address_sim: number;
        state_sim: number;
        best_sim: number;
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
        COALESCE(similarity(r."city", ${q}), 0)::DOUBLE PRECISION AS city_sim,
        COALESCE(similarity(r."address", ${q}), 0)::DOUBLE PRECISION AS address_sim,
        COALESCE(similarity(r."state", ${q}), 0)::DOUBLE PRECISION AS state_sim,
        GREATEST(
          COALESCE(similarity(r."city", ${q}), 0),
          COALESCE(similarity(r."address", ${q}), 0),
          COALESCE(similarity(r."state", ${q}), 0),
          CASE WHEN r."city" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END,
          CASE WHEN r."address" ILIKE '%' || ${q} || '%' THEN 0.35 ELSE 0.0 END,
          CASE WHEN r."state" ILIKE '%' || ${q} || '%' THEN 0.3 ELSE 0.0 END
        )::DOUBLE PRECISION AS best_sim,
        (SELECT COUNT(*)::INT FROM "DishAtRestaurant" d WHERE d."restaurantId" = r."id") AS dish_count
      FROM "Restaurant" r
      WHERE
        similarity(r."city", ${q}) > 0.1
        OR similarity(r."address", ${q}) > 0.1
        OR similarity(r."state", ${q}) > 0.1
        OR r."city" ILIKE '%' || ${q} || '%'
        OR r."address" ILIKE '%' || ${q} || '%'
        OR r."state" ILIKE '%' || ${q} || '%'
      ORDER BY best_sim DESC, r."name" ASC
      LIMIT 50
    `;

    const results: LocationSearchResult[] = rows.map((r) => {
      // Determine which field was the best match
      const citySim = Number(r.city_sim);
      const addrSim = Number(r.address_sim);
      const stateSim = Number(r.state_sim);
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
        similarity: Number(Number(r.best_sim).toFixed(3)),
        matchedField,
        dishCount: r.dish_count,
      };
    });

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ results: [], query: '', error: 'Search failed' }, { status: 500 });
  }
}
