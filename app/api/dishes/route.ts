import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/dishes — list all dishes (with optional search)
 * Query params:
 *   q — search term (matches dish name, cuisine, restaurant name, city, address)
 */

const log = withLogging('/api/dishes');

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    let dishes;
    if (q) {
      dishes = await prisma.dishAtRestaurant.findMany({
        where: {
          OR: [
            { dish: { name: { contains: q, mode: 'insensitive' } } },
            { dish: { cuisine: { contains: q, mode: 'insensitive' } } },
            { restaurant: { name: { contains: q, mode: 'insensitive' } } },
            { restaurant: { city: { contains: q, mode: 'insensitive' } } },
            { restaurant: { address: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          dish: true,
          restaurant: { select: { name: true, city: true } },
          _count: { select: { reviews: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      dishes = await prisma.dishAtRestaurant.findMany({
        include: {
          dish: true,
          restaurant: { select: { name: true, city: true } },
          _count: { select: { reviews: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    }

    const result = dishes.map((d) => ({
      id: d.id,
      dishName: d.dish.name,
      cuisine: d.dish.cuisine,
      description: d.dish.description,
      restaurantName: d.restaurant.name,
      city: d.restaurant.city || '',
      reviewCount: d._count.reviews,
    }));

    ctx.success(200, { count: result.length, query: q || 'none' });
    return NextResponse.json(result);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to fetch dishes' }, { status: 500 });
  }
}
