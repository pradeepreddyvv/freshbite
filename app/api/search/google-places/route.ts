import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, googleAutocompleteCacheKey, TTL } from '@/lib/redis';

/**
 * GET /api/search/google-places?input=...&types=...&lat=...&lng=...
 *
 * Proxies to Google Places Autocomplete API with Redis caching.
 * Keeps the API key server-side for security.
 *
 * Query params:
 *   input  — the search text (required, min 2 chars)
 *   types  — Google Places type filter (e.g. 'establishment', 'geocode', '(cities)')
 *   lat, lng — optional location bias
 *
 * Redis cache: results are cached for 1 hour per unique query.
 * If Redis is unavailable, Google API is called directly.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input')?.trim();
    const types = searchParams.get('types') || '';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!input || input.length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    /* ── Check Redis cache first ── */
    const cacheKey = googleAutocompleteCacheKey(input, types, lat ?? undefined, lng ?? undefined);
    const cached = await cacheGet<{ predictions: unknown[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    /* ── Call Google Places Autocomplete API ── */
    const params = new URLSearchParams({
      input,
      key: GOOGLE_API_KEY,
      // Bias towards US results for better quality
      components: 'country:us',
    });

    if (types) params.set('types', types);
    if (lat && lng) {
      params.set('location', `${lat},${lng}`);
      params.set('radius', '50000');
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
    );

    if (!res.ok) {
      throw new Error(`Google API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places error:', data.status, data.error_message);
      return NextResponse.json(
        { predictions: [], error: data.error_message },
        { status: 502 },
      );
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      types: p.types || [],
    }));

    /* ── Cache the result ── */
    const payload = { predictions };
    await cacheSet(cacheKey, payload, TTL.GOOGLE_AUTOCOMPLETE);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Google Places autocomplete error:', error);
    return NextResponse.json(
      { predictions: [], error: 'Search failed' },
      { status: 500 },
    );
  }
}
