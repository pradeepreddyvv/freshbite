'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { MapRestaurant } from '@/components/RestaurantDiscoveryMap';

const RestaurantDiscoveryMap = dynamic(
  () => import('@/components/RestaurantDiscoveryMap'),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center min-h-[400px]">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">🗺️</div>
        <p>Loading map...</p>
      </div>
    </div>
  );
}

interface DiscoveredRestaurant {
  osmId: string | null;
  name: string;
  cuisine: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  type: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  source: string;
  freshbiteId: string | null;
}

interface DiscoverResponse {
  resolvedLocation: string | null;
  centerLat: number;
  centerLng: number;
  totalResults: number;
  restaurants: DiscoveredRestaurant[];
}

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
  { label: '50 km', value: 50000 },
];

const TYPE_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  fast_food: '🍔',
  cafe: '☕',
};

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5000);
  const [results, setResults] = useState<DiscoveredRestaurant[]>([]);
  const [resolvedLocation, setResolvedLocation] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importForm, setImportForm] = useState<{ address: string; city: string }>({ address: '', city: '' });
  const [error, setError] = useState<string | null>(null);
  const initialSearchDone = useRef(false);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSelectRestaurant = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id && listContainerRef.current) {
      const el = listContainerRef.current.querySelector(`[data-rid="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setLocationStatus('granted');
        if (!initialSearchDone.current) {
          initialSearchDone.current = true;
          doSearch(loc, '', radius);
        }
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unified search: the query can be a location, restaurant name, address, or pincode
  const doSearch = async (
    loc: { lat: number; lng: number } | null,
    query: string,
    radiusM: number
  ) => {
    if (!loc && !query) {
      setError('Please enter a location, address, restaurant name, or pincode — or enable GPS.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.BACKEND_URL || '';
      const params = new URLSearchParams();

      if (query.trim()) {
        // Send the same query as both location and name — the backend
        // will geocode it as a location AND filter by restaurant name
        params.set('location', query.trim());
        params.set('name', query.trim());
      } else if (loc) {
        params.set('lat', loc.lat.toString());
        params.set('lng', loc.lng.toString());
      }

      params.set('radius', radiusM.toString());
      params.set('limit', '150');

      const res = await fetch(`${baseUrl}/api/discover?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      const data: DiscoverResponse = await res.json();
      setResults(data.restaurants);
      setTotalResults(data.totalResults);
      setResolvedLocation(data.resolvedLocation);
      setMapCenter({ lat: data.centerLat, lng: data.centerLng });
    } catch (err: unknown) {
      console.error('Discover error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(userLocation, searchQuery, radius);

  const mapRestaurants: MapRestaurant[] = results.map((r, i) => ({
    id: r.osmId || `osm-${i}`,
    name: r.name,
    address: r.address || '',
    city: r.city || '',
    cuisine: r.cuisine || undefined,
    type: r.type,
    source: r.source,
    latitude: r.latitude,
    longitude: r.longitude,
    distanceKm: r.distanceKm,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">🗺️ Discover Restaurants</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {locationStatus === 'granted' && (
              <span className="text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                GPS active
              </span>
            )}
            {locationStatus === 'denied' && (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                GPS denied — type a location
              </span>
            )}
            {locationStatus === 'pending' && (
              <span className="text-gray-500">Detecting location...</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Search */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Single search input */}
            <div className="md:col-span-7">
              <label className="block text-xs font-medium text-gray-500 mb-1">🔍 Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Restaurant name, city, address, or pincode..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900 outline-none text-sm"
              />
              {userLocation && !searchQuery && (
                <p className="text-[10px] text-gray-400 mt-0.5">Leave empty to use GPS location</p>
              )}
            </div>

            {/* Radius */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">📏 Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900 outline-none text-sm bg-white"
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="md:col-span-3 flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  '🔎 Search'
                )}
              </button>
              {userLocation && (
                <button
                  onClick={() => { setSearchQuery(''); doSearch(userLocation, '', radius); }}
                  disabled={loading}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-3 rounded-lg transition-colors text-sm"
                  title="Search near me"
                >
                  📍
                </button>
              )}
            </div>
          </div>

          {/* Status banners */}
          {resolvedLocation && (
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              📌 Showing results near: <strong className="text-gray-700">{resolvedLocation}</strong>
              {' · '}{totalResults} results
            </div>
          )}
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Restaurant</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Fast Food</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Café</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Your Location</span>
          </div>
        </div>

        {/* Main Layout: Map + List */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 h-[500px] lg:h-[600px]">
            <RestaurantDiscoveryMap
              restaurants={mapRestaurants}
              userLocation={userLocation}
              mapCenter={mapCenter}
              onRestaurantClick={handleSelectRestaurant}
              selectedId={selectedId}
            />
          </div>

          {/* Results List */}
          <div ref={listContainerRef} className="lg:col-span-2 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            <p className="text-sm text-gray-500 mb-2">
              {results.length} restaurant{results.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>

            {results.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-4xl mb-3">🌍</div>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'No restaurants found — try a different search or larger radius'
                    : 'Enter a location or allow GPS to discover restaurants'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Search by restaurant name, city, address, or pincode
                </p>
              </div>
            )}

            {results.map((r, i) => {
              const rid = r.osmId || `osm-${i}`;
              const typeEmoji = TYPE_EMOJIS[r.type] || '🍽️';
              const typeLabel = r.type === 'fast_food' ? 'Fast Food' : r.type === 'cafe' ? 'Café' : 'Restaurant';

              const handleCardClick = () => {
                handleSelectRestaurant(rid);
                if (r.freshbiteId) router.push(`/restaurant/${r.freshbiteId}`);
              };

              const handleImport = async (e: React.MouseEvent, overrides?: { address: string; city: string }) => {
                e.stopPropagation();
                const address = overrides?.address || r.address || '';
                const city = overrides?.city || r.city || '';

                if (!address && !city && !overrides) {
                  setImportingId(rid);
                  setImportForm({ address: '', city: '' });
                  return;
                }

                try {
                  const baseUrl = process.env.BACKEND_URL || '';
                  const res = await fetch(`${baseUrl}/api/restaurants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: r.name,
                      address: address || undefined,
                      city: city || undefined,
                      state: r.state || undefined,
                      country: r.country || undefined,
                      latitude: r.latitude,
                      longitude: r.longitude,
                    }),
                  });
                  if (res.ok) {
                    const created = await res.json();
                    setImportingId(null);
                    router.push(`/restaurant/${created.id}`);
                  }
                } catch (err) {
                  console.error('Import failed:', err);
                }
              };

              return (
                <div
                  key={rid}
                  data-rid={rid}
                  onClick={handleCardClick}
                  className={`cursor-pointer w-full text-left bg-white rounded-lg border p-3.5 hover:shadow-md transition-all ${
                    selectedId === rid
                      ? 'border-green-500 ring-2 ring-green-200 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {typeEmoji} {r.name}
                        </h3>
                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          r.type === 'fast_food' ? 'bg-amber-50 text-amber-700'
                          : r.type === 'cafe' ? 'bg-purple-50 text-purple-700'
                          : 'bg-red-50 text-red-700'
                        }`}>
                          {typeLabel}
                        </span>
                      </div>

                      {(r.address || r.city) && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          📍 {r.address || ''}{r.address && r.city ? `, ${r.city}` : r.city || ''}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {r.cuisine && <span className="text-[11px] text-gray-400">🍴 {r.cuisine}</span>}
                        {r.phone && <span className="text-[11px] text-gray-400">📞 {r.phone}</span>}
                        {r.openingHours && <span className="text-[11px] text-gray-400">🕐 {r.openingHours}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      {r.distanceKm != null && (
                        <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {r.distanceKm} km
                        </span>
                      )}
                      {r.website && (
                        <a
                          href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-blue-500 hover:underline mt-1"
                        >
                          website ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {r.freshbiteId ? (
                      <span className="text-xs text-green-600 font-medium">
                        ✅ On FreshBite — View dishes →
                      </span>
                    ) : importingId === rid ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs text-amber-600 font-medium">📍 Address info missing — please fill in:</p>
                        {!r.address && (
                          <input
                            type="text"
                            placeholder="Street address (optional)"
                            value={importForm.address}
                            onChange={(e) => setImportForm(f => ({ ...f, address: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                        )}
                        {!r.city && (
                          <input
                            type="text"
                            placeholder="City (optional)"
                            value={importForm.city}
                            onChange={(e) => setImportForm(f => ({ ...f, city: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleImport(e, {
                              address: importForm.address || r.address || '',
                              city: importForm.city || r.city || '',
                            })}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded-md transition-colors"
                          >
                            Add to FreshBite
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImport(e, { address: '', city: '' }); }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                          >
                            Skip
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setImportingId(null); }}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleImport}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1 rounded-md transition-colors"
                      >
                        + Add to FreshBite
                      </button>
                    )}
                    {r.source === 'freshbite' && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-2">FreshBite</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Data powered by <strong>OpenStreetMap</strong> (Overpass API + Nominatim) — free & open-source 🌍
        </div>
      </div>
    </div>
  );
}
