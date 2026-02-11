import { prisma } from '@/lib/prisma';
import { calculateRiskLabel } from '@/lib/risk-label';
import { calculateReviewStats } from '@/lib/review-stats';
import { parseTimeWindow, TimeWindow } from '@/lib/time-window';
import { logger } from '@/lib/logger';

export async function getDishSummary(id: string, window: TimeWindow) {
  logger.debug('getDishSummary called', { dishId: id, window });
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
    logger.debug('getDishSummary: dish not found', { dishId: id });
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
  logger.debug('getDishSummary result', { dishId: id, window, reviewCount: stats.reviewCount, avgRating: stats.avgRating, risk: risk.level });

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
  logger.debug('getDishReviews called', { dishId: id, window });
  const dishAtRestaurant = await prisma.dishAtRestaurant.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!dishAtRestaurant) {
    logger.debug('getDishReviews: dish not found', { dishId: id });
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
  logger.debug('getDishReviews result', { dishId: id, window, reviewCount: reviews.length, avgRating: stats.avgRating });

  return {
    reviews,
    stats,
  };
}
