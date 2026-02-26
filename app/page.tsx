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
  distanceKm?: number | null;
}

interface NearbyRestaurant {
  osmId: string;
  name: string;
  cuisine: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  source: 'osm' | 'freshbite';
  freshbiteId: string | null;
}

interface NearbyCachePayload {
  latBucket: string;
  lngBucket: string;
  radius: number;
  savedAt: number;
  restaurants: NearbyRestaurant[];
}

const NEARBY_CACHE_KEY = 'freshbite.nearby.v1';
const NEARBY_RADIUS_M = 20000;
const NEARBY_CACHE_TTL_MS = 15 * 60 * 1000;

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

interface GooglePlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

/* ── component ── */
export default function HomePage() {
  /* ── search input state ── */
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [dishQuery, setDishQuery] = useState('');

  /* ── suggestion dropdowns (populated while typing) ── */
  const [rSuggestions, setRSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [lSuggestions, setLSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [dSuggestions, setDSuggestions] = useState<DishResult[]>([]);
  const [showRSug, setShowRSug] = useState(false);
  const [showLSug, setShowLSug] = useState(false);
  const [showDSug, setShowDSug] = useState(false);

  /* ── main results (populated on Search click) ── */
  const [restaurantResults, setRestaurantResults] = useState<RestaurantResult[]>([]);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [dishResults, setDishResults] = useState<DishResult[]>([]);

  /* ── loading states ── */
  const [rSugLoading, setRSugLoading] = useState(false);
  const [lSugLoading, setLSugLoading] = useState(false);
  const [dSugLoading, setDSugLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  /* ── nearby / geolocation state ── */
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  /* ── refs ── */
  const rTimer = useRef<NodeJS.Timeout | null>(null);
  const lTimer = useRef<NodeJS.Timeout | null>(null);
  const dTimer = useRef<NodeJS.Timeout | null>(null);
  const rBoxRef = useRef<HTMLDivElement>(null);
  const lBoxRef = useRef<HTMLDivElement>(null);
  const dBoxRef = useRef<HTMLDivElement>(null);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rBoxRef.current && !rBoxRef.current.contains(e.target as Node)) setShowRSug(false);
      if (lBoxRef.current && !lBoxRef.current.contains(e.target as Node)) setShowLSug(false);
      if (dBoxRef.current && !dBoxRef.current.contains(e.target as Node)) setShowDSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── suggestion fetchers (Google Places Autocomplete) ── */
  const fetchRSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setRSuggestions([]); return; }
    setRSugLoading(true);
    try {
      const params = new URLSearchParams({ input: q, types: 'establishment' });
      if (userLat != null && userLng != null) { params.set('lat', String(userLat)); params.set('lng', String(userLng)); }
      const res = await fetch(`/api/search/google-places?${params}`);
      if (res.ok) { const d = await res.json(); setRSuggestions(d.predictions?.slice(0, 6) ?? []); setShowRSug(true); }
    } catch { /* ignore */ } finally { setRSugLoading(false); }
  }, [userLat, userLng]);

  const fetchLSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setLSuggestions([]); return; }
    setLSugLoading(true);
    try {
      const params = new URLSearchParams({ input: q, types: 'geocode' });
      if (userLat != null && userLng != null) { params.set('lat', String(userLat)); params.set('lng', String(userLng)); }
      const res = await fetch(`/api/search/google-places?${params}`);
      if (res.ok) { const d = await res.json(); setLSuggestions(d.predictions?.slice(0, 6) ?? []); setShowLSug(true); }
    } catch { /* ignore */ } finally { setLSugLoading(false); }
  }, [userLat, userLng]);

  const fetchDSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setDSuggestions([]); return; }
    setDSugLoading(true);
    try {
      const res = await fetch(`/api/search/dishes?q=${encodeURIComponent(q)}`);
      if (res.ok) { const d = await res.json(); setDSuggestions(d.results?.slice(0, 6) ?? []); setShowDSug(true); }
    } catch { /* ignore */ } finally { setDSugLoading(false); }
  }, []);

  /* ── debounced input handlers (show suggestions while typing) ── */
  const onRestaurantInput = (v: string) => {
    setRestaurantQuery(v);
    if (rTimer.current) clearTimeout(rTimer.current);
    rTimer.current = setTimeout(() => fetchRSuggestions(v), 300);
  };
  const onLocationInput = (v: string) => {
    setLocationQuery(v);
    if (lTimer.current) clearTimeout(lTimer.current);
    lTimer.current = setTimeout(() => fetchLSuggestions(v), 300);
  };
  const onDishInput = (v: string) => {
    setDishQuery(v);
    if (dTimer.current) clearTimeout(dTimer.current);
    dTimer.current = setTimeout(() => fetchDSuggestions(v), 300);
  };

  /* ── pick a suggestion → fill the input ── */
  const pickR = (s: GooglePlaceSuggestion) => { setRestaurantQuery(s.mainText); setShowRSug(false); };
  const pickL = (s: GooglePlaceSuggestion) => {
    const label = s.mainText || s.description;
    setLocationQuery(label);
    setShowLSug(false);
  };
  const pickD = (name: string) => { setDishQuery(name); setShowDSug(false); };

  const toLocationBucket = (n: number) => n.toFixed(3);

  const toNearbyRestaurantResult = useCallback((nr: NearbyRestaurant): RestaurantResult => ({
    id: nr.freshbiteId || `osm-${nr.osmId}`,
    name: nr.name,
    city: nr.city,
    address: nr.address,
    state: nr.state,
    latitude: nr.latitude,
    longitude: nr.longitude,
    similarity: 1,
    dishCount: 0,
    distanceKm: nr.distanceKm,
  }), []);

  const mergeRestaurantResults = useCallback((
    primary: RestaurantResult[],
    secondary: RestaurantResult[],
  ): RestaurantResult[] => {
    const seen = new Set<string>();
    const out: RestaurantResult[] = [];

    for (const r of primary) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        out.push(r);
      }
    }
    for (const r of secondary) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        out.push(r);
      }
    }
    return out;
  }, []);

  const mergeNearbyLists = useCallback((
    current: NearbyRestaurant[],
    incoming: NearbyRestaurant[],
  ): NearbyRestaurant[] => {
    const map = new Map<string, NearbyRestaurant>();
    for (const r of current) {
      map.set(r.freshbiteId || `osm-${r.osmId}`, r);
    }
    for (const r of incoming) {
      const key = r.freshbiteId || `osm-${r.osmId}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, r);
        continue;
      }
      // Prefer existing DB-enriched source, but keep freshest distance if present.
      map.set(key, {
        ...existing,
        distanceKm: existing.distanceKm ?? r.distanceKm,
        source: existing.source === 'freshbite' ? existing.source : r.source,
      });
    }
    return Array.from(map.values())
      .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999))
      .slice(0, 100);
  }, []);

  /* ── SEARCH button → fire actual queries ── */
  const doSearch = useCallback(async () => {
    setSearching(true);
    setShowRSug(false);
    setShowLSug(false);
    setShowDSug(false);

    const promises: Promise<void>[] = [];
    const normalizedRestaurantQuery = restaurantQuery.trim().toLowerCase();
    const normalizedLocationQuery = locationQuery.trim();

    // Restaurant search
    if (restaurantQuery.trim().length >= 1) {
      promises.push(
        fetch(`/api/search/restaurants?q=${encodeURIComponent(restaurantQuery.trim())}`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(d => {
            const apiResults = d.results ?? [];
            // Also search within current nearby (cached 100) before network-only results.
            const localNearbyMatches = nearbyRestaurants
              .filter((nr) => {
                const haystack = [nr.name, nr.address, nr.city, nr.state].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(normalizedRestaurantQuery);
              })
              .map(toNearbyRestaurantResult);

            setRestaurantResults(mergeRestaurantResults(apiResults, localNearbyMatches));
          })
          .catch(() => {})
      );
    } else {
      // If restaurant field is empty, load all restaurants
      promises.push(
        fetch('/api/restaurants')
          .then(r => r.ok ? r.json() : [])
          .then(arr => setRestaurantResults(
            arr.slice(0, 50).map((r: Record<string, unknown>) => ({
              id: r.id, name: r.name,
              city: (r.city as string) ?? null, address: (r.address as string) ?? null,
              state: (r.state as string) ?? null,
              latitude: (r.latitude as number) ?? null, longitude: (r.longitude as number) ?? null,
              similarity: 1, dishCount: 0,
            }))
          ))
          .catch(() => {})
      );
    }

    // Location search
    if (locationQuery.trim().length >= 1) {
      promises.push(
        fetch(`/api/search/locations?q=${encodeURIComponent(locationQuery.trim())}`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(d => setLocationResults(d.results ?? []))
          .catch(() => {})
      );

      // If user searched a location, hit discover with that location text
      // and merge into current nearby + restaurant list.
      promises.push(
        fetch(`/api/discover?location=${encodeURIComponent(normalizedLocationQuery)}&radius=${NEARBY_RADIUS_M}&limit=100`)
          .then(r => r.ok ? r.json() : { restaurants: [] })
          .then((d) => {
            const discovered: NearbyRestaurant[] = (d.restaurants ?? []).slice(0, 100);

            if (typeof d.centerLat === 'number' && typeof d.centerLng === 'number') {
              setUserLat(d.centerLat);
              setUserLng(d.centerLng);
              setLocationStatus('granted');
            }

            if (discovered.length > 0) {
              setNearbyRestaurants((prev) => mergeNearbyLists(prev, discovered));
              const discoveredAsResults = discovered.map(toNearbyRestaurantResult);
              setRestaurantResults((prev) => mergeRestaurantResults(prev, discoveredAsResults));
            }
          })
          .catch(() => {})
      );
    } else {
      setLocationResults([]);
    }

    // Dish search
    if (dishQuery.trim().length >= 1) {
      promises.push(
        fetch(`/api/search/dishes?q=${encodeURIComponent(dishQuery.trim())}`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(d => setDishResults(d.results ?? []))
          .catch(() => {})
      );
    } else {
      // If dish field is empty, load all dishes
      promises.push(
        fetch('/api/dishes')
          .then(r => r.ok ? r.json() : [])
          .then(arr => setDishResults(
            arr.slice(0, 30).map((d: Record<string, unknown>) => ({
              id: d.id, dishName: d.dishName, cuisine: (d.cuisine as string) ?? null,
              description: (d.description as string) ?? null,
              restaurantId: '', restaurantName: (d.restaurantName as string) ?? '',
              city: (d.city as string) ?? null, similarity: 1,
              reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
            }))
          ))
          .catch(() => {})
      );
    }

    await Promise.all(promises);
    setSearching(false);
  }, [
    restaurantQuery,
    locationQuery,
    dishQuery,
    nearbyRestaurants,
    toNearbyRestaurantResult,
    mergeRestaurantResults,
    mergeNearbyLists,
  ]);

  /* ── initial load (all restaurants + dishes + nearby via geolocation) ── */
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
              id: r.id, name: r.name,
              city: (r.city as string) ?? null, address: (r.address as string) ?? null,
              state: (r.state as string) ?? null,
              latitude: (r.latitude as number) ?? null, longitude: (r.longitude as number) ?? null,
              similarity: 1, dishCount: 0,
            })),
          );
        }
        if (dr.ok) {
          const arr = await dr.json();
          setDishResults(
            arr.slice(0, 20).map((d: Record<string, unknown>) => ({
              id: d.id, dishName: d.dishName, cuisine: (d.cuisine as string) ?? null,
              description: (d.description as string) ?? null,
              restaurantId: '', restaurantName: (d.restaurantName as string) ?? '',
              city: (d.city as string) ?? null, similarity: 1,
              reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
            })),
          );
        }
      } catch { /* ignore */ } finally { setInitialLoaded(true); }
    })();

    // Request geolocation and fetch nearby restaurants (with local cache by location bucket)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setLocationStatus('granted');

          const latBucket = toLocationBucket(lat);
          const lngBucket = toLocationBucket(lng);

          try {
            const raw = localStorage.getItem(NEARBY_CACHE_KEY);
            if (raw) {
              const cached = JSON.parse(raw) as NearbyCachePayload;
              const isSameLocation = cached.latBucket === latBucket && cached.lngBucket === lngBucket;
              const isFresh = Date.now() - cached.savedAt < NEARBY_CACHE_TTL_MS;
              if (isSameLocation && isFresh && Array.isArray(cached.restaurants)) {
                setNearbyRestaurants(cached.restaurants.slice(0, 100));
                return;
              }
            }
          } catch {
            // ignore cache errors and continue with network fetch
          }

          setNearbyLoading(true);
          try {
            const res = await fetch(`/api/discover?lat=${lat}&lng=${lng}&radius=${NEARBY_RADIUS_M}&limit=100`);
            if (res.ok) {
              const data = await res.json();
              const restaurants: NearbyRestaurant[] = (data.restaurants ?? []).slice(0, 100);
              setNearbyRestaurants(restaurants);

              const payload: NearbyCachePayload = {
                latBucket,
                lngBucket,
                radius: NEARBY_RADIUS_M,
                savedAt: Date.now(),
                restaurants,
              };
              localStorage.setItem(NEARBY_CACHE_KEY, JSON.stringify(payload));
            }
          } catch { /* ignore */ } finally { setNearbyLoading(false); }
        },
        () => { setLocationStatus('denied'); },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  /* ── clear helpers ── */
  const clearR = () => { setRestaurantQuery(''); setRSuggestions([]); setShowRSug(false); };
  const clearL = () => { setLocationQuery(''); setLSuggestions([]); setShowLSug(false); };
  const clearD = () => { setDishQuery(''); setDSuggestions([]); setShowDSug(false); };

  const anyActive = restaurantQuery || locationQuery || dishQuery;

  /* ── haversine distance helper ── */
  const haversineKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  /* ── merge restaurant + location + nearby results ──
   *  1. Merge nearby discover results with DB restaurants
   *  2. Sort by distance (nearest first) when location is available
   *  3. Restaurant API results respect search ordering when searching
   */
  const merged = (() => {
    const out: Array<RestaurantResult & { matchSource: string; distanceKm?: number | null }> = [];
    const bothActive = restaurantQuery.length >= 1 && locationQuery.length >= 1;
    const isSearching = restaurantQuery.length >= 1 || locationQuery.length >= 1;

    if (bothActive) {
      const seen = new Set<string>();
      const locationById = new Map(locationResults.map((r) => [r.id, r]));

      for (const r of restaurantResults) {
        seen.add(r.id);
        const locMatch = locationById.get(r.id);
        const dist = (userLat != null && userLng != null && r.latitude && r.longitude)
          ? Number(haversineKm(userLat, userLng, r.latitude, r.longitude).toFixed(1))
          : null;
        out.push({
          ...r,
          distanceKm: dist,
          matchSource: locMatch ? `Name match · 📍 ${locMatch.matchedField}` : 'Name match',
        });
      }

      for (const r of locationResults) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          const dist = (userLat != null && userLng != null && r.latitude && r.longitude)
            ? Number(haversineKm(userLat, userLng, r.latitude, r.longitude).toFixed(1))
            : null;
          out.push({ ...r, distanceKm: dist, matchSource: `📍 ${r.matchedField}: ${r[r.matchedField] ?? ''}` });
        }
      }
    } else {
      const seen = new Set<string>();

      // Add DB restaurants first
      for (const r of restaurantResults) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          const dist = (userLat != null && userLng != null && r.latitude && r.longitude)
            ? Number(haversineKm(userLat, userLng, r.latitude, r.longitude).toFixed(1))
            : null;
          out.push({ ...r, distanceKm: dist, matchSource: restaurantQuery ? 'Name match' : '' });
        }
      }

      // Add location results
      for (const r of locationResults) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          const dist = (userLat != null && userLng != null && r.latitude && r.longitude)
            ? Number(haversineKm(userLat, userLng, r.latitude, r.longitude).toFixed(1))
            : null;
          out.push({ ...r, distanceKm: dist, matchSource: `📍 ${r.matchedField}: ${r[r.matchedField] ?? ''}` });
        } else {
          const existing = out.find((m) => m.id === r.id);
          if (existing && !existing.matchSource.includes('📍')) {
            existing.matchSource += ` · 📍 ${r.matchedField}`;
          }
        }
      }

      // Merge nearby discover results (only when not actively searching)
      if (!isSearching && nearbyRestaurants.length > 0) {
        for (const nr of nearbyRestaurants) {
          // Use freshbiteId if available, otherwise use osmId
          const id = nr.freshbiteId || `osm-${nr.osmId}`;
          if (!seen.has(id)) {
            seen.add(id);
            out.push({
              id,
              name: nr.name,
              city: nr.city,
              address: nr.address,
              state: nr.state,
              latitude: nr.latitude,
              longitude: nr.longitude,
              similarity: 1,
              dishCount: 0,
              distanceKm: nr.distanceKm,
              matchSource: nr.source === 'freshbite' ? '📍 Nearby' : '📍 Nearby · via OSM',
            });
          } else {
            // If already in list from DB, enrich with distance
            const existing = out.find((m) => m.id === id);
            if (existing && existing.distanceKm == null && nr.distanceKm != null) {
              existing.distanceKm = nr.distanceKm;
            }
            if (existing && !existing.matchSource.includes('Nearby')) {
              existing.matchSource = existing.matchSource ? `${existing.matchSource} · 📍 Nearby` : '📍 Nearby';
            }
          }
        }
      }
    }

    // Sort: when user has location, sort by distance (nearest first)
    // When searching, respect API ranking first
    if (isSearching) {
      const rIndex = new Map<string, number>();
      const lIndex = new Map<string, number>();
      restaurantResults.forEach((r, i) => rIndex.set(r.id, i));
      locationResults.forEach((r, i) => lIndex.set(r.id, i));

      const hasRestaurantApi = restaurantQuery.trim().length >= 1;
      const hasLocationApi = locationQuery.trim().length >= 1;

      return out.sort((a, b) => {
        const aInR = hasRestaurantApi && rIndex.has(a.id);
        const bInR = hasRestaurantApi && rIndex.has(b.id);
        const aInL = hasLocationApi && lIndex.has(a.id);
        const bInL = hasLocationApi && lIndex.has(b.id);

        const aBoth = aInR && aInL;
        const bBoth = bInR && bInL;
        if (aBoth !== bBoth) return aBoth ? -1 : 1;

        const aAny = aInR || aInL;
        const bAny = bInR || bInL;
        if (aAny !== bAny) return aAny ? -1 : 1;

        const aRank = (rIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) + (lIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER);
        const bRank = (rIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER) + (lIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER);
        return aRank - bRank;
      });
    }

    // Default: sort by distance (nearest first), null distances go to bottom
    return out.sort((a, b) => {
      const aDist = a.distanceKm ?? 99999;
      const bDist = b.distanceKm ?? 99999;
      return aDist - bDist;
    });
  })();

  /* ── handle Enter key on any input ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* ── header + search ── */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">🍽️ FreshBite</h1>
          <p className="text-lg text-gray-600 mb-6">Dish reviews that matter &mdash; see only what&apos;s fresh</p>

          {/* 3 search inputs with suggestion dropdowns */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* ── Restaurant input + suggestions ── */}
              <div ref={rBoxRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">🏪 Restaurant</label>
                <div className="relative">
                  <input
                    type="text"
                    value={restaurantQuery}
                    onChange={(e) => onRestaurantInput(e.target.value)}
                    onFocus={() => rSuggestions.length > 0 && setShowRSug(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. McDonald's, Pizza Hut..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 text-gray-900 outline-none text-sm"
                  />
                  {restaurantQuery && (
                    <button onClick={clearR} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
                  )}
                  {rSugLoading && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />}
                </div>
                {/* Suggestion dropdown */}
                {showRSug && rSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {rSuggestions.map((s) => (
                      <button
                        key={s.placeId}
                        onClick={() => pickR(s)}
                        className="w-full text-left px-3 py-2 hover:bg-green-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate block">{s.mainText}</span>
                          <span className="text-[11px] text-gray-400 truncate block">{s.secondaryText}</span>
                        </div>
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded shrink-0">Google</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Location input + suggestions ── */}
              <div ref={lBoxRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">📍 Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => onLocationInput(e.target.value)}
                    onFocus={() => lSuggestions.length > 0 && setShowLSug(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="City, address, zip, state..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 outline-none text-sm"
                  />
                  {locationQuery && (
                    <button onClick={clearL} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
                  )}
                  {lSugLoading && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                </div>
                {showLSug && lSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {lSuggestions.map((s) => (
                      <button
                        key={s.placeId}
                        onClick={() => pickL(s)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate block">{s.mainText}</span>
                          <span className="text-[11px] text-gray-400 truncate block">{s.secondaryText}</span>
                        </div>
                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">Google</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Dish input + suggestions ── */}
              <div ref={dBoxRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">🍴 Dish</label>
                <div className="relative">
                  <input
                    type="text"
                    value={dishQuery}
                    onChange={(e) => onDishInput(e.target.value)}
                    onFocus={() => dSuggestions.length > 0 && setShowDSug(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Biryani, burger, pizza..."
                    className="w-full px-3 py-3 pr-8 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-gray-900 outline-none text-sm"
                  />
                  {dishQuery && (
                    <button onClick={clearD} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
                  )}
                  {dSugLoading && <span className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />}
                </div>
                {showDSug && dSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {dSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => pickD(s.dishName)}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate block">{s.dishName}</span>
                          <span className="text-[11px] text-gray-400">at {s.restaurantName}{s.city ? ` · ${s.city}` : ''}</span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {s.cuisine && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">{s.cuisine}</span>}
                          <span className="text-[10px] text-gray-400">{s.reviewCount}r</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Search button ── */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={doSearch}
                disabled={searching}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  '🔎 Search'
                )}
              </button>
              {anyActive && (
                <button
                  onClick={() => { clearR(); clearL(); clearD(); }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Active search chips */}
            {anyActive && (
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                {restaurantQuery && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                    🏪 {restaurantQuery}
                    <button onClick={clearR} className="hover:text-green-900">✕</button>
                  </span>
                )}
                {locationQuery && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">
                    📍 {locationQuery}
                    <button onClick={clearL} className="hover:text-blue-900">✕</button>
                  </span>
                )}
                {dishQuery && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200">
                    🍴 {dishQuery}
                    <button onClick={clearD} className="hover:text-orange-900">✕</button>
                  </span>
                )}
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              Type to see suggestions, then click <strong>Search</strong> to get full results ✨
            </p>
          </div>

          {/* Nav links */}
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/discover" className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-green-200">
              🗺️ Discover Near Me
            </Link>
            <Link href="/restaurant/add" className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-gray-200">
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

      {/* ── results: restaurants (left) + dishes (right) ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: merged restaurant + location results ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🏪 Restaurants{' '}
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{merged.length}</span>
              </h2>
              <div className="flex items-center gap-2">
                {locationStatus === 'loading' && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    Locating…
                  </span>
                )}
                {nearbyLoading && (
                  <span className="text-[11px] text-blue-500 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Finding nearby…
                  </span>
                )}
                {locationStatus === 'granted' && !nearbyLoading && nearbyRestaurants.length > 0 && (
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    📍 {nearbyRestaurants.length} nearby
                  </span>
                )}
                {locationStatus === 'denied' && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title="Enable location to see nearby restaurants">
                    📍 Location off
                  </span>
                )}
                <Link href="/discover" className="text-xs text-green-600 hover:underline font-medium">Map view →</Link>
              </div>
            </div>

            {!initialLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : merged.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🏪</div>
                <p className="text-gray-500 text-sm">
                  {anyActive ? 'No restaurants match your search' : 'No restaurants yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different name or location, or{' '}
                  <Link href="/restaurant/add" className="text-green-600 hover:underline">add one</Link>
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {merged.map((r) => {
                  const isOsmOnly = r.id.startsWith('osm-');
                  const href = isOsmOnly ? '/restaurant/add' : `/restaurant/${r.id}`;
                  return (
                  <Link
                    key={r.id}
                    href={href}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">{r.name}</h3>
                          {r.similarity < 1 && r.similarity > 0 && (
                            <span className="shrink-0 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {Math.round(r.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                        {(r.address || r.city) && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            📍 {r.address}{r.address && r.city ? ', ' : ''}{r.city ?? ''}{r.state ? `, ${r.state}` : ''}
                          </p>
                        )}
                        {r.matchSource && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{r.matchSource}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 ml-3">
                        {r.distanceKm != null && (
                          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)}m` : `${r.distanceKm} km`}
                          </span>
                        )}
                        {r.dishCount > 0 && (
                          <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {r.dishCount} dish{r.dishCount > 1 ? 'es' : ''}
                          </span>
                        )}
                        <span className="text-[11px] text-green-600">View →</span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: dish results ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🍴 Dishes{' '}
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{dishResults.length}</span>
              </h2>
            </div>

            {!initialLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : dishResults.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl mb-2">🍴</div>
                <p className="text-gray-500 text-sm">
                  {dishQuery ? `No dishes match "${dishQuery}"` : 'No dishes yet — add a restaurant first!'}
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
                          <h3 className="font-semibold text-gray-900 truncate text-sm">{d.dishName}</h3>
                          {d.cuisine && (
                            <span className="shrink-0 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">{d.cuisine}</span>
                          )}
                          {d.similarity < 1 && d.similarity > 0 && (
                            <span className="shrink-0 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {Math.round(d.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">at {d.restaurantName}</p>
                        {d.description && (
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{d.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 ml-3">
                        {d.city && <span className="text-[11px] text-gray-400">📍 {d.city}</span>}
                        <span className="text-[11px] text-green-600 font-medium">
                          {d.reviewCount} review{d.reviewCount !== 1 ? 's' : ''} →
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
        Built with Next.js, Spring Boot, FastAPI &amp; PostgreSQL · Search powered by Google Places
      </div>
    </div>
  );
}
