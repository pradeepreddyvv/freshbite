'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ── types ── */
interface RestaurantResult {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  similarity: number;
  dishCount: number;
}

interface LocationResult {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  similarity: number;
  matchedField: 'city' | 'address' | 'state';
  dishCount: number;
}

interface DishResult {
  id: string;
  dishName: string;
  cuisine: string | null;
  description: string | null;
  restaurantId: string;
  restaurantName: string;
  city: string | null;
  similarity: number;
  reviewCount: number;
}

/* ── component ── */
export default function HomePage() {
  /* ── independent search state for each field ── */
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [dishQuery, setDishQuery] = useState('');

  const [restaurantResults, setRestaurantResults] = useState<RestaurantResult[]>([]);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [dishResults, setDishResults] = useState<DishResult[]>([]);

  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dishLoading, setDishLoading] = useState(false);

  const [initialLoaded, setInitialLoaded] = useState(false);

  /* debounce refs (one per field) */
  const rTimer = useRef<NodeJS.Timeout | null>(null);
  const lTimer = useRef<NodeJS.Timeout | null>(null);
  const dTimer = useRef<NodeJS.Timeout | null>(null);

  /* ── 3 independent search functions ── */
  const searchRestaurants = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setRestaurantResults([]);
      return;
    }
    setRestaurantLoading(true);
    try {
      const res = await fetch(`/api/search/restaurants?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurantResults(data.results ?? []);
      }
    } catch {
      /* network error – leave results as-is */
    } finally {
      setRestaurantLoading(false);
    }
  }, []);

  const searchLocations = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setLocationResults([]);
      return;
    }
    setLocationLoading(true);
    try {
      const res = await fetch(`/api/search/locations?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setLocationResults(data.results ?? []);
      }
    } catch {
      /* network error */
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const searchDishes = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setDishResults([]);
      return;
    }
    setDishLoading(true);
    try {
      const res = await fetch(`/api/search/dishes?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setDishResults(data.results ?? []);
      }
    } catch {
      /* network error */
    } finally {
      setDishLoading(false);
    }
  }, []);

  /* ── initial load (all restaurants + dishes) ── */
  useEffect(() => {
    (async () => {
      try {
        const [rr, dr] = await Promise.all([
          fetch('/api/restaurants'),
          fetch('/api/dishes'),
        ]);

        if (rr.ok) {
          const arr = await rr.json();
          setRestaurantResults(
            arr.slice(0, 30).map((r: Record<string, unknown>) => ({
              id: r.id,
              name: r.name,
              city: (r.city as string) ?? null,
              address: (r.address as string) ?? null,
              state: (r.state as string) ?? null,
              latitude: (r.latitude as number) ?? null,
              longitude: (r.longitude as number) ?? null,
              similarity: 1,
              dishCount: 0,
            })),
          );
        }

        if (dr.ok) {
          const arr = await dr.json();
          setDishResults(
            arr.slice(0, 20).map((d: Record<string, unknown>) => ({
              id: d.id,
              dishName: d.dishName,
              cuisine: (d.cuisine as string) ?? null,
              description: (d.description as string) ?? null,
              restaurantId: '',
              restaurantName: (d.restaurantName as string) ?? '',
              city: (d.city as string) ?? null,
              similarity: 1,
              reviewCount:
                typeof d.reviewCount === 'number' ? d.reviewCount : 0,
            })),
          );
        }
      } catch {
        /* ignore */
      } finally {
        setInitialLoaded(true);
      }
    })();
  }, []);

  /* ── debounced input handlers (each field independent) ── */
  const onRestaurantInput = (v: string) => {
    setRestaurantQuery(v);
    if (rTimer.current) clearTimeout(rTimer.current);
    rTimer.current = setTimeout(() => searchRestaurants(v), 350);
  };

  const onLocationInput = (v: string) => {
    setLocationQuery(v);
    if (lTimer.current) clearTimeout(lTimer.current);
    lTimer.current = setTimeout(() => searchLocations(v), 350);
  };

  const onDishInput = (v: string) => {
    setDishQuery(v);
    if (dTimer.current) clearTimeout(dTimer.current);
    dTimer.current = setTimeout(() => searchDishes(v), 350);
  };

  /* ── clear helpers ── */
  const clearR = () => {
    setRestaurantQuery('');
    setRestaurantResults([]);
  };
  const clearL = () => {
    setLocationQuery('');
    setLocationResults([]);
  };
  const clearD = () => {
    setDishQuery('');
    setDishResults([]);
  };

  const anyActive = restaurantQuery || locationQuery || dishQuery;

  /* ── merge restaurant + location results (de-dup by id) ── */
  const merged = (() => {
    const seen = new Set<string>();
    const out: Array<RestaurantResult & { matchSource: string }> = [];

    for (const r of restaurantResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        out.push({
          ...r,
          matchSource: restaurantQuery ? 'Name match' : '',
        });
      }
    }

    for (const r of locationResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        out.push({
          ...r,
          matchSource: `📍 ${r.matchedField}: ${r[r.matchedField] ?? ''}`,
        });
      } else {
        const existing = out.find((m) => m.id === r.id);
        if (existing && !existing.matchSource.includes('📍')) {
          existing.matchSource += ` · 📍 ${r.matchedField}`;
        }
      }
    }

    return out;
  })();

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* ── header + 3 search inputs ── */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🍽️ FreshBite
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Dish reviews that matter &mdash; see only what&apos;s fresh
          </p>

          {/* 3 independent search boxes */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Restaurant name search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">
                  🏪 Restaurant
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={restaurantQuery}
                    onChange={(e) => onRestaurantInput(e.target.value)}
                    placeholder="e.g. McDonald's, Pizza Hut..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 text-gray-900 outline-none text-sm"
                  />
                  {restaurantQuery && (
                    <button
                      onClick={clearR}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  )}
                  {restaurantLoading && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Location search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">
                  📍 Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => onLocationInput(e.target.value)}
                    placeholder="City, address, zip, state..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 outline-none text-sm"
                  />
                  {locationQuery && (
                    <button
                      onClick={clearL}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  )}
                  {locationLoading && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Dish search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">
                  🍴 Dish
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dishQuery}
                    onChange={(e) => onDishInput(e.target.value)}
                    placeholder="Biryani, burger, pizza..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-gray-900 outline-none text-sm"
                  />
                  {dishQuery && (
                    <button
                      onClick={clearD}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  )}
                  {dishLoading && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            </div>

            {/* Active search chips */}
            {anyActive && (
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                {restaurantQuery && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                    🏪 {restaurantQuery}
                    <button onClick={clearR} className="hover:text-green-900">
                      ✕
                    </button>
                  </span>
                )}
                {locationQuery && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">
                    📍 {locationQuery}
                    <button onClick={clearL} className="hover:text-blue-900">
                      ✕
                    </button>
                  </span>
                )}
                {dishQuery && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200">
                    🍴 {dishQuery}
                    <button onClick={clearD} className="hover:text-orange-900">
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              Powered by fuzzy search &mdash; typos like &quot;piza&quot; or
              &quot;paradse&quot; still work ✨
            </p>
          </div>

          {/* Nav links */}
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-green-200"
            >
              🗺️ Discover Near Me
            </Link>
            <Link
              href="/restaurant/add"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-gray-200"
            >
              + Add Restaurant
            </Link>
          </div>
        </div>
      </div>

      {/* ── feature highlights ── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <span className="text-2xl">⏰</span>
            <p className="text-sm font-medium text-gray-700 mt-1">Time-Based</p>
            <p className="text-xs text-gray-500">Last 5 days only</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🎯</span>
            <p className="text-sm font-medium text-gray-700 mt-1">
              Dish-Specific
            </p>
            <p className="text-xs text-gray-500">Rate dishes, not restaurants</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🚦</span>
            <p className="text-sm font-medium text-gray-700 mt-1">Risk Labels</p>
            <p className="text-xs text-gray-500">Good, mixed, or risky</p>
          </div>
        </div>
      </div>

      {/* ── results: restaurants (left) + dishes (right) ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── LEFT: merged restaurant + location results ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🏪 Restaurants{' '}
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {merged.length}
                </span>
              </h2>
              <Link
                href="/discover"
                className="text-xs text-green-600 hover:underline font-medium"
              >
                Map view →
              </Link>
            </div>

            {!initialLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : merged.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🏪</div>
                <p className="text-gray-500 text-sm">
                  {anyActive
                    ? 'No restaurants match your search'
                    : 'No restaurants yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different name or location, or{' '}
                  <Link
                    href="/restaurant/add"
                    className="text-green-600 hover:underline"
                  >
                    add one
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {merged.map((r) => (
                  <Link
                    key={r.id}
                    href={`/restaurant/${r.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {r.name}
                          </h3>
                          {r.similarity < 1 && r.similarity > 0 && (
                            <span className="shrink-0 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {Math.round(r.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                        {(r.address || r.city) && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            📍 {r.address}
                            {r.address && r.city ? ', ' : ''}
                            {r.city ?? ''}
                            {r.state ? `, ${r.state}` : ''}
                          </p>
                        )}
                        {r.matchSource && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {r.matchSource}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 ml-3">
                        {r.dishCount > 0 && (
                          <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {r.dishCount} dish{r.dishCount > 1 ? 'es' : ''}
                          </span>
                        )}
                        <span className="text-[11px] text-green-600">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: dish results ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🍴 Dishes{' '}
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {dishResults.length}
                </span>
              </h2>
            </div>

            {!initialLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : dishResults.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🍴</div>
                <p className="text-gray-500 text-sm">
                  {dishQuery
                    ? `No dishes match "${dishQuery}"`
                    : 'No dishes yet — add a restaurant first!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {dishResults.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dish/${d.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {d.dishName}
                          </h3>
                          {d.cuisine && (
                            <span className="shrink-0 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">
                              {d.cuisine}
                            </span>
                          )}
                          {d.similarity < 1 && d.similarity > 0 && (
                            <span className="shrink-0 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {Math.round(d.similarity * 100)}% match
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
                          <span className="text-[11px] text-gray-400">
                            📍 {d.city}
                          </span>
                        )}
                        <span className="text-[11px] text-green-600 font-medium">
                          {d.reviewCount} review
                          {d.reviewCount !== 1 ? 's' : ''} →
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

      {/* ── footer ── */}
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        Built with Next.js, Spring Boot, FastAPI &amp; PostgreSQL · Search
        powered by pg_trgm
      </div>
    </div>
  );
}
