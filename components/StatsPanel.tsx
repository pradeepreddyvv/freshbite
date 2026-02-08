import { RiskBadge } from './RiskBadge';
import { RiskLabel } from '@/lib/risk-label';
import { getWindowLabel, TimeWindow } from '@/lib/time-window';

interface StatsPanelProps {
  avgRating: number | null;
  reviewCount: number;
  window: TimeWindow;
  risk: RiskLabel;
}

export function StatsPanel({ avgRating, reviewCount, window, risk }: StatsPanelProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Freshness Banner */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-700">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">
            Showing reviews from the {getWindowLabel(window)}
          </span>
          <span className="text-gray-500">— Only fresh data matters!</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Average Rating</div>
            <div className="flex items-baseline gap-2">
              {avgRating !== null ? (
                <>
                  <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
                  <div className="text-gray-500">/ 5</div>
                  <div className="flex gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(avgRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>
          </div>

          {/* Review Count */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Reviews</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">{reviewCount}</div>
              <div className="text-gray-500">recent</div>
            </div>
          </div>

          {/* Risk Label */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
            <div className="mt-1">
              <RiskBadge risk={risk} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
