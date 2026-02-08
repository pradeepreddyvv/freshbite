import { TimeWindow } from '@/lib/time-window';

export interface ReviewStats {
  avgRating: number | null;
  reviewCount: number;
  window: TimeWindow;
}

interface ReviewRating {
  rating: number;
}

export function calculateReviewStats(
  reviews: ReviewRating[],
  window: TimeWindow
): ReviewStats {
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null;

  return {
    avgRating: avgRating !== null ? Number(avgRating.toFixed(1)) : null,
    reviewCount,
    window,
  };
}
