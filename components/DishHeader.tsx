'use client';

import { useRouter } from 'next/navigation';

interface DishHeaderProps {
  dishName: string;
  restaurantName: string;
  address: string;
  city: string;
  cuisine?: string | null;
  description?: string | null;
  price?: number | null;
}

export function DishHeader({
  dishName,
  restaurantName,
  address,
  city,
  cuisine,
  description,
  price,
}: DishHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{dishName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-gray-600">
              {cuisine && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                  {cuisine}
                </span>
              )}
              {price && (
                <span className="text-base sm:text-lg font-semibold text-green-600">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="mt-3 text-sm sm:text-base text-gray-700">{description}</p>
        )}

        <div className="mt-3 sm:mt-4 flex items-start gap-2 text-gray-600">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 break-words">{restaurantName}</p>
            <p className="text-sm break-words">{address}, {city}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
