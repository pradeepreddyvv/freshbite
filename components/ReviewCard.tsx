import { formatRelativeTime, formatAbsoluteDate } from '@/lib/format-time';

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string | Date;
  visitedAt?: string | Date | null;
  mealSlot?: string | null;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const createdAt = typeof review.createdAt === 'string' 
    ? new Date(review.createdAt) 
    : review.createdAt;

  const visitedAt = review.visitedAt
    ? typeof review.visitedAt === 'string'
      ? new Date(review.visitedAt)
      : review.visitedAt
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Rating & Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${
                star <= review.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-2 font-semibold text-gray-900">{review.rating}/5</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500" title={formatAbsoluteDate(createdAt)}>
            {formatRelativeTime(createdAt)}
          </div>
          <div className="text-xs text-gray-400">
            {formatAbsoluteDate(createdAt)}
          </div>
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-700 leading-relaxed">{review.text}</p>

      {/* Footer: Visited At + Meal Slot */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {visitedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            🍴 Visited: {formatAbsoluteDate(visitedAt)}
          </span>
        )}
        {review.mealSlot && (
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
            {review.mealSlot}
          </span>
        )}
      </div>
    </div>
  );
}
