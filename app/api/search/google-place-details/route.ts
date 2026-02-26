import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, googlePlaceDetailsCacheKey, TTL } from '@/lib/redis';

/**
 * GET /api/search/google-place-details?placeId=...
 *
 * Proxies to Google Place Details API with Redis caching.
 * Place details are cached for 24 hours since they rarely change.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBsyesckcsLLTIxGg7FeEKpHkJn8DoUZzk';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
    }

    /* ── Check Redis cache first ── */
    const cacheKey = googlePlaceDetailsCacheKey(placeId);
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    /* ── Call Google Place Details API ── */

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_API_KEY,
      fields: [
        'name',
        'formatted_address',
        'geometry',
        'address_components',
        'formatted_phone_number',
        'website',
        'rating',
        'types',
        'place_id',
      ].join(','),
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    );

    if (!res.ok) {
      throw new Error(`Google API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || data.status },
        { status: 400 },
      );
    }

    const result = data.result;
    const components: any[] = result.address_components || [];

    const getComponent = (type: string) =>
      components.find((c) => c.types.includes(type))?.long_name || null;
    const getShortComponent = (type: string) =>
      components.find((c) => c.types.includes(type))?.short_name || null;

    const payload = {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      address:
        [getComponent('street_number'), getComponent('route')]
          .filter(Boolean)
          .join(' ') || null,
      city:
        getComponent('locality') ||
        getComponent('sublocality_level_1') ||
        getComponent('administrative_area_level_2'),
      state: getShortComponent('administrative_area_level_1'),
      country: getComponent('country'),
      latitude: result.geometry?.location?.lat || null,
      longitude: result.geometry?.location?.lng || null,
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      rating: result.rating || null,
      types: result.types || [],
    };

    /* ── Cache the result (24h) ── */
    await cacheSet(cacheKey, payload, TTL.GOOGLE_PLACE_DETAILS);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Google Place details error:', error);
    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 },
    );
  }
}
