import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/dishes?q=...
 *
 * Fuzzy dish search using pg_trgm on Dish.name and Dish.cuisine.
 * Returns dishes with their restaurant info, ranked by similarity.
 *
 * Returns: { results: [{ id, dishName, cuisine, restaurantName, city, similarity, reviewCount }], query }
 */

interface DishSearchResult {
  id: string;
  dishName: string;
  cuisine: string | null;
  description: string | null;
  restaurantId: string;
  restaurantName: string;
  city: string | null;
  similarity: number;
  reviewCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], query: q || '' });
    }

    // Fuzzy search on dish name and cuisine, joined with restaurant + review count
    const rows = await prisma.$queryRaw<
      Array<{
        dar_id: string;
        dish_name: string;
        cuisine: string | null;
        description: string | null;
        restaurant_id: string;
        restaurant_name: string;
        city: string | null;
        name_sim: number;
        cuisine_sim: number;
        best_sim: number;
        review_count: number;
      }>
    >`
      SELECT
        dar."id" AS dar_id,
        d."name" AS dish_name,
        d."cuisine",
        d."description",
        r."id" AS restaurant_id,
        r."name" AS restaurant_name,
        r."city",
        COALESCE(similarity(d."name", ${q}), 0)::DOUBLE PRECISION AS name_sim,
        COALESCE(similarity(d."cuisine", ${q}), 0)::DOUBLE PRECISION AS cuisine_sim,
        GREATEST(
          COALESCE(similarity(d."name", ${q}), 0),
          COALESCE(similarity(d."cuisine", ${q}), 0),
          CASE WHEN d."name" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END,
          CASE WHEN d."cuisine" ILIKE '%' || ${q} || '%' THEN 0.35 ELSE 0.0 END
        )::DOUBLE PRECISION AS best_sim,
        (SELECT COUNT(*)::INT FROM "Review" rev WHERE rev."dishAtRestaurantId" = dar."id") AS review_count
      FROM "DishAtRestaurant" dar
      JOIN "Dish" d ON d."id" = dar."dishId"
      JOIN "Restaurant" r ON r."id" = dar."restaurantId"
      WHERE
        similarity(d."name", ${q}) > 0.12
        OR similarity(d."cuisine", ${q}) > 0.15
        OR d."name" ILIKE '%' || ${q} || '%'
        OR d."cuisine" ILIKE '%' || ${q} || '%'
      ORDER BY best_sim DESC, d."name" ASC
      LIMIT 20
    `;

    const results: DishSearchResult[] = rows.map((r) => ({
      id: r.dar_id,
      dishName: r.dish_name,
      cuisine: r.cuisine,
      description: r.description,
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      city: r.city,
      similarity: Number(Number(r.best_sim).toFixed(3)),
      reviewCount: r.review_count,
    }));

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error('Dish search error:', error);
    return NextResponse.json({ results: [], query: '', error: 'Search failed' }, { status: 500 });
  }
}
