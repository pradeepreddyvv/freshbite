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
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dishName}</h1>
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              {cuisine && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                  {cuisine}
                </span>
              )}
              {price && (
                <span className="text-lg font-semibold text-green-600">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="mt-3 text-gray-700">{description}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="font-semibold text-gray-900">{restaurantName}</p>
            <p className="text-sm">{address}, {city}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
