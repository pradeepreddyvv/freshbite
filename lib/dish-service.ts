import { prisma } from '@/lib/prisma';
import { calculateRiskLabel } from '@/lib/risk-label';
import { calculateReviewStats } from '@/lib/review-stats';
import { parseTimeWindow, TimeWindow } from '@/lib/time-window';
import { shouldUseRollup } from '@/lib/storage-config';
import { logger } from '@/lib/logger';

/**
 * Get stats from daily_rollup table for a given dish + window.
 * Used for 48h/5d windows to avoid scanning raw reviews.
 */
async function getStatsFromRollups(
  dishAtRestaurantId: string,
  window: TimeWindow
): Promise<{ avgRating: number | null; reviewCount: number; window: TimeWindow } | null> {
  const cutoffDate = parseTimeWindow(window);

  const rollups = await prisma.dailyRollup.findMany({
    where: {
      dishAtRestaurantId,
      rollupDate: { gte: cutoffDate },
    },
  });

  if (rollups.length === 0) {
    // Fallback: no rollups available yet, use raw reviews
    return null;
  }

  const totalReviewCount = rollups.reduce((sum: number, r) => sum + r.reviewCount, 0);
  const totalRatingSum = rollups.reduce((sum: number, r) => sum + r.ratingSum, 0);
  const avgRating = totalReviewCount > 0
    ? Number((totalRatingSum / totalReviewCount).toFixed(1))
    : null;

  return { avgRating, reviewCount: totalReviewCount, window };
}

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

  // Try rollups first for >= 48h windows
  let stats: { avgRating: number | null; reviewCount: number; window: TimeWindow };
  if (shouldUseRollup(window)) {
    const rollupStats = await getStatsFromRollups(id, window);
    if (rollupStats) {
      stats = rollupStats;
      logger.debug('getDishSummary: using rollup stats', { dishId: id, window, reviewCount: stats.reviewCount });
    } else {
      // Fallback to raw reviews
      const reviews = await prisma.review.findMany({
        where: { dishAtRestaurantId: id, createdAt: { gte: cutoffDate } },
        select: { rating: true },
      });
      stats = calculateReviewStats(reviews, window);
    }
  } else {
    const reviews = await prisma.review.findMany({
      where: { dishAtRestaurantId: id, createdAt: { gte: cutoffDate } },
      select: { rating: true },
    });
    stats = calculateReviewStats(reviews, window);
  }

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
