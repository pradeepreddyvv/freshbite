'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NearbyRestaurant {
  osmId: number;
  name: string;
  cuisine?: string | null;
  address?: string | null;
  city?: string | null;
  type?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  source?: string;
  freshbiteId?: string | null;
}

interface DiscoverResponse {
  location: string;
  totalResults: number;
  restaurants: NearbyRestaurant[];
}

interface DishListItem {
  id: string;
  dishName: string;
  cuisine?: string | null;
  description?: string | null;
  restaurantName: string;
  city: string;
  reviewCount: number;
}

export default function HomePage() {
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'granted' | 'denied' | 'error'>('detecting');
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [dishes, setDishes] = useState<DishListItem[]>([]);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch dishes from Spring Boot
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    fetch(`${baseUrl}/api/dishes`)
      .then(res => res.ok ? res.json() : [])
      .then(setDishes)
      .catch(() => setDishes([]));
  }, []);

  // GPS-based nearby restaurants
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus('granted');
        const { latitude, longitude } = position.coords;
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
          const res = await fetch(
            `${baseUrl}/api/discover?lat=${latitude}&lng=${longitude}&radius=5000`
          );
          if (res.ok) {
            const data: DiscoverResponse = await res.json();
            setNearbyRestaurants(data.restaurants);
            setLocationName(data.location);
          }
        } catch (err) {
          console.error('Failed to fetch nearby restaurants:', err);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationStatus('denied');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const typeEmoji = (type?: string) => {
    switch (type) {
      case 'fast_food': return '🍔';
      case 'cafe': return '☕';
      default: return '🍽️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🍽️ FreshBite
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Dish reviews that matter — see only what&apos;s fresh
          </p>
          <p className="text-md text-gray-500 max-w-2xl mx-auto">
            Quality changes daily. We show you only the most recent reviews so you can make informed decisions about what you eat today.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
            >
              🗺️ Discover Nearby Restaurants
            </Link>
            <Link
              href="/restaurant/add"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-green-700 border-2 border-green-600 font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              + Add Restaurant
            </Link>
          </div>
        </div>
      </div>

      {/* Value Propositions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Time-Based Reviews
            </h3>
            <p className="text-gray-600">
              See only the last 5 days by default. Dish quality changes with fresh ingredients, chefs, and shifts.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dish-Specific
            </h3>
            <p className="text-gray-600">
              Rate individual dishes, not restaurants. Great pasta doesn&apos;t mean great pizza.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🚦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Risk Labels
            </h3>
            <p className="text-gray-600">
              See at a glance if a dish is good, mixed, or risky today based on recent feedback.
            </p>
          </div>
        </div>

        {/* Nearby Restaurants (GPS) */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📍 Places To Eat Near You
            </h2>
            {locationName && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {locationName}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="animate-pulse">
                <div className="text-4xl mb-3">📡</div>
                <p className="text-gray-500">Detecting your location...</p>
              </div>
            </div>
          ) : locationStatus === 'denied' ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-gray-500 mb-2">
                Location access was denied. Enable it to see nearby restaurants.
              </p>
              <Link
                href="/discover"
                className="text-green-600 hover:underline text-sm"
              >
                Or search manually on the Discover page →
              </Link>
            </div>
          ) : nearbyRestaurants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-2">
                No restaurants found nearby. Try the Discover page to search a larger area.
              </p>
              <Link
                href="/discover"
                className="text-green-600 hover:underline text-sm"
              >
                Go to Discover →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyRestaurants.map((r, idx) => {
                const linkHref = r.freshbiteId
                  ? `/restaurant/${r.freshbiteId}`
                  : `/discover`;

                return (
                  <Link
                    key={`${r.osmId}-${idx}`}
                    href={linkHref}
                    className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-green-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {typeEmoji(r.type)} {r.name}
                      </h3>
                      {r.source === 'freshbite' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          On FreshBite
                        </span>
                      )}
                    </div>
                    {r.cuisine && (
                      <p className="text-xs text-gray-400 mb-1">{r.cuisine}</p>
                    )}
                    {r.address && (
                      <p className="text-sm text-gray-500 mb-2">{r.address}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      {r.distanceKm != null && (
                        <span className="text-gray-400">
                          {r.distanceKm < 1
                            ? `${Math.round(r.distanceKm * 1000)} m`
                            : `${r.distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                      <span className="text-green-600 font-medium">
                        {r.freshbiteId ? 'View dishes →' : 'View on map →'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Dishes List */}
        {dishes.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Browse Dishes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dishes.map((dishAtRestaurant) => (
                <Link
                  key={dishAtRestaurant.id}
                  href={`/dish/${dishAtRestaurant.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {dishAtRestaurant.dishName}
                    </h3>
                    {dishAtRestaurant.cuisine && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {dishAtRestaurant.cuisine}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    at {dishAtRestaurant.restaurantName}
                  </p>
                  {dishAtRestaurant.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {dishAtRestaurant.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      📍 {dishAtRestaurant.city}
                    </span>
                    <span className="text-green-600 font-medium">
                      {dishAtRestaurant.reviewCount} reviews →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">
            Built with Next.js, Spring Boot, FastAPI &amp; PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
}
