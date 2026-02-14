import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/restaurants/[id]/dishes — list dishes at a restaurant
 * POST /api/restaurants/[id]/dishes — add a dish to a restaurant
 */

const log = withLogging('/api/restaurants/[id]/dishes');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = log.start('GET', request.url, { restaurantId: params.id });
  try {
    const dishes = await prisma.dishAtRestaurant.findMany({
      where: { restaurantId: params.id },
      include: {
        dish: true,
        restaurant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = dishes.map((d) => ({
      id: d.id,
      dishName: d.dish.name,
      cuisine: d.dish.cuisine,
      description: d.dish.description,
      price: d.price,
      restaurantName: d.restaurant.name,
    }));

    ctx.success(200, { count: result.length });
    return NextResponse.json(result);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to fetch dishes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = log.start('POST', request.url, { restaurantId: params.id });
  try {
    const body = await request.json();
    const { dishName, cuisine, description, price } = body;

    if (!dishName || typeof dishName !== 'string') {
      ctx.fail(400, 'Dish name required');
      return NextResponse.json({ error: 'Dish name is required' }, { status: 400 });
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
    });
    if (!restaurant) {
      ctx.fail(404, 'Restaurant not found');
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Find or create dish
    let dish = await prisma.dish.findFirst({
      where: { name: { equals: dishName, mode: 'insensitive' } },
    });
    if (!dish) {
      dish = await prisma.dish.create({
        data: {
          name: dishName,
          cuisine: cuisine || null,
          description: description || null,
        },
      });
    }

    // Create DishAtRestaurant (or return existing)
    const existing = await prisma.dishAtRestaurant.findUnique({
      where: {
        restaurantId_dishId: {
          restaurantId: params.id,
          dishId: dish.id,
        },
      },
    });
    if (existing) {
      ctx.success(200, { id: existing.id, action: 'existing' });
      return NextResponse.json({
        id: existing.id,
        dishName: dish.name,
        cuisine: dish.cuisine,
        description: dish.description,
        price: existing.price,
        restaurantName: restaurant.name,
      });
    }

    const dar = await prisma.dishAtRestaurant.create({
      data: {
        restaurantId: params.id,
        dishId: dish.id,
        price: price ? Number(price) : null,
      },
    });

    ctx.success(201, { id: dar.id });
    return NextResponse.json({
      id: dar.id,
      dishName: dish.name,
      cuisine: dish.cuisine,
      description: dish.description,
      price: dar.price,
      restaurantName: restaurant.name,
    }, { status: 201 });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to add dish' }, { status: 500 });
  }
}
