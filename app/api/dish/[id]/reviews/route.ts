import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getDishReviews } from '@/lib/dish-service';
import { isValidTimeWindow, normalizeTimeWindow } from '@/lib/time-window';
import { withLogging } from '@/lib/logger';

const log = withLogging('/api/dish/[id]/reviews');

// GET /api/dish/[id]/reviews?window=5d
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = log.start('GET', request.url, { dishId: params.id });
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const rawWindow = searchParams.get('window');

    // Validate window parameter
    if (rawWindow && !isValidTimeWindow(rawWindow)) {
      ctx.fail(400, 'Invalid window parameter', { rawWindow });
      return NextResponse.json(
        { error: 'Invalid window parameter. Must be one of: 24h, 48h, 5d' },
        { status: 400 }
      );
    }
    const window = normalizeTimeWindow(rawWindow, '5d');
    const reviewsData = await getDishReviews(id, window);

    if (!reviewsData) {
      ctx.fail(404, 'Dish not found', { dishId: id });
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    ctx.success(200, { dishId: id, window, reviewCount: reviewsData.reviews.length });
    return NextResponse.json(reviewsData);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/dish/[id]/reviews
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(1000),
  visitedAt: z.string().datetime().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = log.start('POST', request.url, { dishId: params.id });
  try {
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = createReviewSchema.safeParse(body);
    if (!validationResult.success) {
      ctx.fail(400, 'Validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { rating, text, visitedAt } = validationResult.data;

    // Verify dish exists
    const dishAtRestaurant = await prisma.dishAtRestaurant.findUnique({
      where: { id },
    });

    if (!dishAtRestaurant) {
      ctx.fail(404, 'Dish not found', { dishId: id });
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    // Create review with server-generated UTC timestamp
    const review = await prisma.review.create({
      data: {
        dishAtRestaurantId: id,
        rating,
        text,
        ...(visitedAt ? { visitedAt: new Date(visitedAt) } : {}),
        // createdAt defaults to now() in UTC via Prisma
        // mealSlot is null for MVP (V2 feature)
      },
      select: {
        id: true,
        rating: true,
        text: true,
        createdAt: true,
        visitedAt: true,
        mealSlot: true,
      },
    });

    ctx.success(201, { dishId: id, rating, reviewId: review.id });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    ctx.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create review', details: message },
      { status: 500 }
    );
  }
}
