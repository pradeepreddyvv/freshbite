import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getDishReviews } from '@/lib/dish-service';
import { isValidTimeWindow, normalizeTimeWindow } from '@/lib/time-window';

// GET /api/dish/[id]/reviews?window=5d
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const rawWindow = searchParams.get('window');

    // Validate window parameter
    if (rawWindow && !isValidTimeWindow(rawWindow)) {
      return NextResponse.json(
        { error: 'Invalid window parameter. Must be one of: 24h, 48h, 5d' },
        { status: 400 }
      );
    }
    const window = normalizeTimeWindow(rawWindow, '5d');
    const reviewsData = await getDishReviews(id, window);

    if (!reviewsData) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reviewsData);
  } catch (error) {
    console.error('Error fetching reviews:', error);
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
  try {
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = createReviewSchema.safeParse(body);
    if (!validationResult.success) {
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

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
