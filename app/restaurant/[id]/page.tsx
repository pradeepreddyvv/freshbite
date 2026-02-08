'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
}

interface DishAtRestaurant {
  id: string;
  dishName: string;
  cuisine?: string;
  description?: string;
  price?: number;
  restaurantName: string;
}

export default function RestaurantPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [dishes, setDishes] = useState<DishAtRestaurant[]>([]);
  const [showAddDish, setShowAddDish] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  async function fetchData() {
    try {
      const [restRes, dishesRes] = await Promise.all([
        fetch(`${baseUrl}/api/restaurants`),
        fetch(`${baseUrl}/api/restaurants/${restaurantId}/dishes`),
      ]);

      if (restRes.ok) {
        const restaurants = await restRes.json();
        const found = restaurants.find((r: RestaurantInfo) => r.id === restaurantId);
        setRestaurant(found || null);
      }

      if (dishesRes.ok) {
        setDishes(await dishesRes.json());
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const body = {
      dishName: formData.get('dishName') as string,
      cuisine: formData.get('cuisine') as string || undefined,
      description: formData.get('description') as string || undefined,
      price: formData.get('price') ? Number(formData.get('price')) : undefined,
    };

    try {
      const res = await fetch(`${baseUrl}/api/restaurants/${restaurantId}/dishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to add dish');
      }

      const newDish = await res.json();
      setDishes((prev) => [newDish, ...prev]);
      setShowAddDish(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Restaurant not found</p>
        <Link href="/" className="text-green-600 hover:underline">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-green-600 hover:text-green-700 text-sm mb-6 inline-block"
        >
          ← Back to home
        </Link>

        {/* Restaurant Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏪 {restaurant.name}
          </h1>
          <p className="text-gray-600">
            📍 {restaurant.address}, {restaurant.city}
            {restaurant.state ? `, ${restaurant.state}` : ''}, {restaurant.country}
          </p>
        </div>

        {/* Dishes Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Dishes ({dishes.length})
          </h2>
          <button
            onClick={() => setShowAddDish(!showAddDish)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {showAddDish ? 'Cancel' : '+ Add Dish'}
          </button>
        </div>

        {/* Add Dish Form */}
        {showAddDish && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a Dish</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDish} className="space-y-4">
              <div>
                <label htmlFor="dishName" className="block text-sm font-medium text-gray-700 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  id="dishName"
                  name="dishName"
                  required
                  placeholder="e.g., Chicken Biryani"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    name="cuisine"
                    placeholder="e.g., Indian"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    min="0"
                    placeholder="12.99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Brief description of the dish..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Dish'}
              </button>
            </form>
          </div>
        )}

        {/* Dishes Grid */}
        {dishes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-2">No dishes added yet.</p>
            <p className="text-sm text-gray-400">
              Click &quot;+ Add Dish&quot; to add the first dish at this restaurant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dishes.map((dish) => (
              <Link
                key={dish.id}
                href={`/dish/${dish.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {dish.dishName}
                  </h3>
                  {dish.cuisine && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {dish.cuisine}
                    </span>
                  )}
                </div>

                {dish.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {dish.description}
                  </p>
                )}

                {dish.price && (
                  <p className="text-green-600 font-medium">
                    ${dish.price.toFixed(2)}
                  </p>
                )}

                <p className="text-sm text-green-600 mt-3">
                  View reviews →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
