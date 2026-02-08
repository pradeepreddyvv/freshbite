import { prisma } from '@/lib/prisma';
import { calculateRiskLabel } from '@/lib/risk-label';
import { calculateReviewStats } from '@/lib/review-stats';
import { parseTimeWindow, TimeWindow } from '@/lib/time-window';

export async function getDishSummary(id: string, window: TimeWindow) {
  const dishAtRestaurant = await prisma.dishAtRestaurant.findUnique({
    where: { id },
    include: {
      dish: {
        select: {
          name: true,
          cuisine: true,
          description: true,
        },
      },
      restaurant: {
        select: {
          name: true,
          address: true,
          city: true,
        },
      },
    },
  });

  if (!dishAtRestaurant) {
    return null;
  }

  const cutoffDate = parseTimeWindow(window);
  const reviews = await prisma.review.findMany({
    where: {
      dishAtRestaurantId: id,
      createdAt: {
        gte: cutoffDate,
      },
    },
    select: {
      rating: true,
    },
  });

  const stats = calculateReviewStats(reviews, window);
  const risk = calculateRiskLabel(stats.avgRating, stats.reviewCount);

  return {
    dish: {
      id: dishAtRestaurant.id,
      name: dishAtRestaurant.dish.name,
      cuisine: dishAtRestaurant.dish.cuisine,
      description: dishAtRestaurant.dish.description,
      price: dishAtRestaurant.price,
    },
    restaurant: {
      name: dishAtRestaurant.restaurant.name,
      address: dishAtRestaurant.restaurant.address,
      city: dishAtRestaurant.restaurant.city,
    },
    stats,
    risk,
  };
}

export async function getDishReviews(id: string, window: TimeWindow) {
  const dishAtRestaurant = await prisma.dishAtRestaurant.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!dishAtRestaurant) {
    return null;
  }

  const cutoffDate = parseTimeWindow(window);
  const reviews = await prisma.review.findMany({
    where: {
      dishAtRestaurantId: id,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
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

  const stats = calculateReviewStats(reviews, window);

  return {
    reviews,
    stats,
  };
}
