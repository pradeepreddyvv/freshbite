import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/dishes?q=...
 *
 * Standard dish search combining:
 *   1. pg_trgm similarity() — fuzzy matching on dish name and cuisine
 *   2. ILIKE — reliable substring matching
 *
 * Falls back to pure Prisma ILIKE if pg_trgm extension is not enabled.
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

    try {
      // Primary: raw SQL with pg_trgm similarity + ILIKE
      const rows = await prisma.$queryRaw<
        Array<{
          dar_id: string;
          dish_name: string;
          cuisine: string | null;
          description: string | null;
          restaurant_id: string;
          restaurant_name: string;
          city: string | null;
          score: number;
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
          GREATEST(
            COALESCE(similarity(d."name", ${q}), 0),
            COALESCE(similarity(d."cuisine", ${q}), 0),
            CASE WHEN d."name" ILIKE '%' || ${q} || '%' THEN 0.5 ELSE 0.0 END,
            CASE WHEN d."cuisine" ILIKE '%' || ${q} || '%' THEN 0.4 ELSE 0.0 END,
            CASE WHEN r."name" ILIKE '%' || ${q} || '%' THEN 0.3 ELSE 0.0 END
          )::DOUBLE PRECISION AS score,
          (SELECT COUNT(*)::INT FROM "Review" rev WHERE rev."dishAtRestaurantId" = dar."id") AS review_count
        FROM "DishAtRestaurant" dar
        JOIN "Dish" d ON d."id" = dar."dishId"
        JOIN "Restaurant" r ON r."id" = dar."restaurantId"
        WHERE
          d."name" ILIKE '%' || ${q} || '%'
          OR d."cuisine" ILIKE '%' || ${q} || '%'
          OR r."name" ILIKE '%' || ${q} || '%'
          OR similarity(d."name", ${q}) > 0.15
          OR similarity(d."cuisine", ${q}) > 0.2
        ORDER BY score DESC, d."name" ASC
        LIMIT 30
      `;

      const results: DishSearchResult[] = rows.map((r) => ({
        id: r.dar_id,
        dishName: r.dish_name,
        cuisine: r.cuisine,
        description: r.description,
        restaurantId: r.restaurant_id,
        restaurantName: r.restaurant_name,
        city: r.city,
        similarity: Number(Number(r.score).toFixed(3)),
        reviewCount: r.review_count,
      }));

      return NextResponse.json({ results, query: q });
    } catch {
      // Fallback: pg_trgm not available — pure Prisma ILIKE search
      const dishes = await prisma.dishAtRestaurant.findMany({
        where: {
          OR: [
            { dish: { name: { contains: q, mode: 'insensitive' } } },
            { dish: { cuisine: { contains: q, mode: 'insensitive' } } },
            { restaurant: { name: { contains: q, mode: 'insensitive' } } },
            { restaurant: { city: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          dish: true,
          restaurant: { select: { id: true, name: true, city: true } },
          _count: { select: { reviews: true } },
        },
        take: 30,
        orderBy: { createdAt: 'desc' },
      });

      const results: DishSearchResult[] = dishes.map((d) => ({
        id: d.id,
        dishName: d.dish.name,
        cuisine: d.dish.cuisine,
        description: d.dish.description,
        restaurantId: d.restaurant.id,
        restaurantName: d.restaurant.name,
        city: d.restaurant.city,
        similarity: 1,
        reviewCount: d._count.reviews,
      }));

      return NextResponse.json({ results, query: q });
    }
  } catch (error) {
    console.error('Dish search error:', error);
    return NextResponse.json(
      { results: [], query: '', error: 'Search failed' },
      { status: 500 },
    );
  }
}
