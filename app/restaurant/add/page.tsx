'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GooglePlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface PlaceDetails {
  name: string;
  formattedAddress: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
}

export default function AddRestaurantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* ── Google Places autocomplete state ── */
  const [nameQuery, setNameQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const sugTimer = useRef<NodeJS.Timeout | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  /* ── Form fields (auto-filled when place selected) ── */
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('USA');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Fetch Google Places suggestions ── */
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    setSugLoading(true);
    try {
      const params = new URLSearchParams({ input: q, types: 'establishment' });
      const res = await fetch(`/api/search/google-places?${params}`);
      if (res.ok) {
        const d = await res.json();
        setSuggestions(d.predictions?.slice(0, 6) ?? []);
        setShowSuggestions(true);
      }
    } catch { /* ignore */ } finally { setSugLoading(false); }
  }, []);

  const onNameInput = (v: string) => {
    setNameQuery(v);
    setName(v);
    setAutoFilled(false);
    if (sugTimer.current) clearTimeout(sugTimer.current);
    sugTimer.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  /* ── Pick a suggestion → auto-fill all fields ── */
  const pickSuggestion = async (s: GooglePlaceSuggestion) => {
    setNameQuery(s.mainText);
    setName(s.mainText);
    setShowSuggestions(false);
    setSugLoading(true);

    try {
      const res = await fetch(`/api/search/google-place-details?placeId=${s.placeId}`);
      if (res.ok) {
        const details: PlaceDetails = await res.json();
        setName(details.name || s.mainText);
        setNameQuery(details.name || s.mainText);
        setAddress(details.address || details.formattedAddress || '');
        setCity(details.city || '');
        setState(details.state || '');
        setCountry(details.country || 'USA');
        if (details.latitude != null) setLatitude(String(details.latitude));
        if (details.longitude != null) setLongitude(String(details.longitude));
        setAutoFilled(true);
      }
    } catch { /* ignore */ } finally { setSugLoading(false); }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const body = {
      name,
      address,
      city,
      state: state || undefined,
      country: country || 'USA',
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    };

    try {
      const res = await fetch(`/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create restaurant');
      }

      const restaurant = await res.json();
      router.push(`/restaurant/${restaurant.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-green-600 hover:text-green-700 text-sm mb-6 inline-block"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏪 Add a Restaurant
        </h1>
        <p className="text-gray-600 mb-8">
          Search for a restaurant using Google Places and we&apos;ll auto-fill the details for you.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          {/* ── Restaurant name with Google autocomplete ── */}
          <div ref={boxRef} className="relative">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={nameQuery}
                onChange={(e) => onNameInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                required
                placeholder="Start typing to search Google Places..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {sugLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />}
            </div>
            {/* Suggestion dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.placeId}
                    type="button"
                    onClick={() => pickSuggestion(s)}
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
            {autoFilled && (
              <p className="text-xs text-green-600 mt-1">✅ Auto-filled from Google Places</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="e.g., 123 Main Street"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g., San Francisco"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude <span className="text-gray-400 font-normal">(auto-filled)</span>
              </label>
              <input
                type="number"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                step="any"
                placeholder="e.g., 37.7749"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude <span className="text-gray-400 font-normal">(auto-filled)</span>
              </label>
              <input
                type="number"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                step="any"
                placeholder="e.g., -122.4194"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Restaurant'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Search powered by Google Places
        </p>
      </div>
    </div>
  );
}
