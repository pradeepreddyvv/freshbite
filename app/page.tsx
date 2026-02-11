'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ── Types ────────────────────────────────────────────── */

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
  resolvedLocation?: string;
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

/* ── Component ────────────────────────────────────────── */

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'granted' | 'denied' | 'error'>('detecting');
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [dishes, setDishes] = useState<DishListItem[]>([]);
  const [locationName, setLocationName] = useState('');
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const baseUrl = process.env.BACKEND_URL || '';

  /* ── Fetch dishes (initial + search) ─────────────────── */
  const fetchDishes = useCallback(async (query?: string) => {
    setDishesLoading(true);
    try {
      const url = query ? `${baseUrl}/api/dishes?q=${encodeURIComponent(query)}` : `${baseUrl}/api/dishes`;
      const res = await fetch(url);
      if (res.ok) setDishes(await res.json());
      else setDishes([]);
    } catch {
      setDishes([]);
    } finally {
      setDishesLoading(false);
    }
  }, [baseUrl]);

  /* ── Fetch nearby restaurants ────────────────────────── */
  const fetchNearby = useCallback(async (
    loc: { lat: number; lng: number } | null,
    locationText?: string,
    nameFilter?: string
  ) => {
    setNearbyLoading(true);
    try {
      const params = new URLSearchParams();
      if (loc && !locationText) {
        params.set('lat', loc.lat.toString());
        params.set('lng', loc.lng.toString());
      }
      if (locationText) params.set('location', locationText);
      if (nameFilter) params.set('name', nameFilter);
      params.set('radius', '5000');
      params.set('limit', '50');

      const res = await fetch(`${baseUrl}/api/discover?${params.toString()}`);
      if (res.ok) {
        const data: DiscoverResponse = await res.json();
        setNearbyRestaurants(data.restaurants);
        if (data.resolvedLocation) setLocationName(data.resolvedLocation);
      }
    } catch (err) {
      console.error('Failed to fetch nearby restaurants:', err);
    } finally {
      setNearbyLoading(false);
    }
  }, [baseUrl]);

  /* ── Initial load: GPS + all dishes ──────────────────── */
  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setNearbyLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setLocationStatus('granted');
        fetchNearby(loc);
      },
      () => {
        setLocationStatus('denied');
        setNearbyLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchNearby]);

  /* ── Unified search handler ──────────────────────────── */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setSearching(true);
      const trimmed = query.trim();

      if (!trimmed) {
        // Empty search → reset to defaults
        fetchDishes();
        if (userLocation) fetchNearby(userLocation);
        else {
          setNearbyRestaurants([]);
          setNearbyLoading(false);
        }
        setSearching(false);
        return;
      }

      // Search both restaurants and dishes in parallel
      Promise.all([
        fetchNearby(userLocation, trimmed, trimmed),
        fetchDishes(trimmed),
      ]).finally(() => setSearching(false));
    }, 400);
  }, [fetchDishes, fetchNearby, userLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearching(true);
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      fetchDishes();
      if (userLocation) fetchNearby(userLocation);
      setSearching(false);
      return;
    }
    Promise.all([
      fetchNearby(userLocation, trimmed, trimmed),
      fetchDishes(trimmed),
    ]).finally(() => setSearching(false));
  };

  const typeEmoji = (type?: string) => {
    switch (type) {
      case 'fast_food': return '🍔';
      case 'cafe': return '☕';
      default: return '🍽️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* ── Hero + Search ──────────────────────────────── */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🍽️ FreshBite
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Dish reviews that matter — see only what&apos;s fresh
          </p>

          {/* ── Unified Search Bar ────────────────────── */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by restaurant, dish, address, city, or pincode..."
                className="w-full pl-12 pr-28 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 text-gray-900 outline-none text-base shadow-sm"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Try: &quot;pizza&quot;, &quot;Phoenix&quot;, &quot;McDonald&apos;s&quot;, &quot;85281&quot;, or &quot;Italian&quot;
            </p>
          </form>

          {/* Quick links */}
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-green-200"
            >
              🗺️ Map View
            </Link>
            <Link
              href="/restaurant/add"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-gray-200"
            >
              + Add Restaurant
            </Link>
            {locationStatus === 'granted' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                GPS active{locationName ? ` · ${locationName}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Value Propositions (compact) ───────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <span className="text-2xl">⏰</span>
            <p className="text-sm font-medium text-gray-700 mt-1">Time-Based</p>
            <p className="text-xs text-gray-500">Last 5 days only</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🎯</span>
            <p className="text-sm font-medium text-gray-700 mt-1">Dish-Specific</p>
            <p className="text-xs text-gray-500">Rate dishes, not restaurants</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🚦</span>
            <p className="text-sm font-medium text-gray-700 mt-1">Risk Labels</p>
            <p className="text-xs text-gray-500">Good, mixed, or risky</p>
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ──────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left Column: Nearby Restaurants ────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📍 Nearby Restaurants
                {locationName && !searchQuery && (
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {locationName}
                  </span>
                )}
              </h2>
              <Link href="/discover" className="text-xs text-green-600 hover:underline font-medium">
                View on map →
              </Link>
            </div>

            {nearbyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : locationStatus === 'denied' && !searchQuery ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">📍</div>
                <p className="text-gray-500 text-sm mb-1">Location access denied</p>
                <p className="text-xs text-gray-400">Search by address or pincode above, or</p>
                <Link href="/discover" className="text-xs text-green-600 hover:underline">
                  go to Discover →
                </Link>
              </div>
            ) : nearbyRestaurants.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🌍</div>
                <p className="text-gray-500 text-sm">
                  {searchQuery
                    ? `No restaurants found for "${searchQuery}"`
                    : 'No restaurants found nearby'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching by city, address, or pincode
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {nearbyRestaurants.map((r, idx) => {
                  const linkHref = r.freshbiteId ? `/restaurant/${r.freshbiteId}` : `/discover`;
                  return (
                    <Link
                      key={`${r.osmId}-${idx}`}
                      href={linkHref}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {typeEmoji(r.type)} {r.name}
                            </h3>
                            {r.source === 'freshbite' && (
                              <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                FreshBite
                              </span>
                            )}
                          </div>
                          {(r.address || r.city) && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {r.address}{r.address && r.city ? ', ' : ''}{r.city || ''}
                            </p>
                          )}
                          {r.cuisine && (
                            <p className="text-[11px] text-gray-400 mt-0.5">🍴 {r.cuisine}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1 ml-3">
                          {r.distanceKm != null && (
                            <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              {r.distanceKm < 1
                                ? `${Math.round(r.distanceKm * 1000)} m`
                                : `${r.distanceKm.toFixed(1)} km`}
                            </span>
                          )}
                          <span className="text-[11px] text-green-600">
                            {r.freshbiteId ? 'View dishes →' : 'Discover →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column: Dishes ───────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🍴 {searchQuery ? 'Matching Dishes' : 'Recent Dishes'}
              </h2>
              <span className="text-xs text-gray-500">
                {dishes.length} dish{dishes.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {dishesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : dishes.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🍴</div>
                <p className="text-gray-500 text-sm">
                  {searchQuery
                    ? `No dishes found for "${searchQuery}"`
                    : 'No dishes yet. Add a restaurant and dish to get started!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {dishes.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dish/${d.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {d.dishName}
                          </h3>
                          {d.cuisine && (
                            <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              {d.cuisine}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          at {d.restaurantName}
                        </p>
                        {d.description && (
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {d.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 ml-3">
                        {d.city && (
                          <span className="text-[11px] text-gray-400">📍 {d.city}</span>
                        )}
                        <span className="text-[11px] text-green-600 font-medium">
                          {d.reviewCount} reviews →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        Built with Next.js, Spring Boot, FastAPI &amp; PostgreSQL
      </div>
    </div>
  );
}
