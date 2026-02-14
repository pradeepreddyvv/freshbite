import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/discover — Ephemeral restaurant discovery using OSM APIs
 * 
 * This endpoint searches for restaurants near a location using:
 * 1. Nominatim (geocoding) to resolve location text → lat/lng
 * 2. Overpass API to find restaurants/cafes/fast_food near those coords
 * 3. FreshBite DB to enrich results with existing restaurant data
 * 
 * IMPORTANT: Search results are NEVER persisted. They are ephemeral.
 * Restaurants are only saved to DB when a user explicitly selects one
 * (via POST /api/restaurants).
 * 
 * Query params:
 *   lat, lng — GPS coordinates (used if no 'location' text)
 *   location — text to geocode (city, address, pincode)
 *   name — filter restaurants by name (OSM + DB)
 *   radius — search radius in meters (default: 5000)
 *   limit — max results (default: 50)
 */

const log = withLogging('/api/discover');

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  type: string;
}

interface DiscoveredRestaurant {
  osmId: string;
  name: string;
  cuisine: string | null;
  address: string | null;
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
  source: 'osm' | 'freshbite';
  freshbiteId: string | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FreshBite/1.0 (dish review app)' },
    });
    if (!res.ok) return null;
    const results: NominatimResult[] = await res.json();
    if (results.length === 0) return null;
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}

async function searchOverpass(
  lat: number,
  lng: number,
  radiusM: number,
  nameFilter?: string
): Promise<OverpassElement[]> {
  try {
    // Build Overpass query for restaurants, cafes, fast food
    const nameClause = nameFilter
      ? `["name"~"${nameFilter.replace(/['"\\]/g, '')}",i]`
      : '';
    
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"]${nameClause}(around:${radiusM},${lat},${lng});
        node["amenity"="cafe"]${nameClause}(around:${radiusM},${lat},${lng});
        node["amenity"="fast_food"]${nameClause}(around:${radiusM},${lat},${lng});
        way["amenity"="restaurant"]${nameClause}(around:${radiusM},${lat},${lng});
        way["amenity"="cafe"]${nameClause}(around:${radiusM},${lat},${lng});
        way["amenity"="fast_food"]${nameClause}(around:${radiusM},${lat},${lng});
      );
      out center 200;
    `;
    
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.elements || [];
  } catch {
    return [];
  }
}

function parseOverpassElement(el: OverpassElement, centerLat: number, centerLng: number): DiscoveredRestaurant | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const name = el.tags?.name;
  if (!lat || !lon || !name) return null;

  const amenity = el.tags?.amenity || 'restaurant';
  const type = amenity === 'fast_food' ? 'fast_food' : amenity === 'cafe' ? 'cafe' : 'restaurant';

  return {
    osmId: String(el.id),
    name,
    cuisine: el.tags?.cuisine || null,
    address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street']].filter(Boolean).join(' ') || null,
    city: el.tags?.['addr:city'] || null,
    state: el.tags?.['addr:state'] || null,
    country: el.tags?.['addr:country'] || null,
    phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
    website: el.tags?.website || el.tags?.['contact:website'] || null,
    openingHours: el.tags?.opening_hours || null,
    type,
    latitude: lat,
    longitude: lon,
    distanceKm: Number(haversineKm(centerLat, centerLng, lat, lon).toFixed(2)),
    source: 'osm',
    freshbiteId: null,
  };
}

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const rawLat = searchParams.get('lat');
    const rawLng = searchParams.get('lng');
    const location = searchParams.get('location')?.trim();
    const nameFilter = searchParams.get('name')?.trim();
    const radius = Math.min(parseInt(searchParams.get('radius') || '5000', 10), 50000);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    let centerLat: number | null = null;
    let centerLng: number | null = null;
    let resolvedLocation: string | null = null;

    // 1. Resolve center coordinates
    if (location) {
      const geo = await geocode(location);
      if (geo) {
        centerLat = geo.lat;
        centerLng = geo.lng;
        resolvedLocation = geo.displayName;
      }
    }
    
    if (centerLat === null && rawLat && rawLng) {
      centerLat = parseFloat(rawLat);
      centerLng = parseFloat(rawLng);
    }

    if (centerLat === null || centerLng === null) {
      ctx.fail(400, 'Could not determine location');
      return NextResponse.json({
        error: 'Could not determine location. Provide lat/lng or a searchable location text.',
        resolvedLocation: null,
        centerLat: 0,
        centerLng: 0,
        totalResults: 0,
        restaurants: [],
      }, { status: 400 });
    }

    // 2. Search OSM (ephemeral — results NOT stored)
    const osmElements = await searchOverpass(centerLat, centerLng, radius, nameFilter);
    const osmRestaurants = osmElements
      .map((el) => parseOverpassElement(el, centerLat!, centerLng!))
      .filter((r): r is DiscoveredRestaurant => r !== null);

    // 3. Search FreshBite DB for local restaurants near the center
    const allFreshbiteRestaurants = await prisma.restaurant.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        ...(nameFilter
          ? { name: { contains: nameFilter, mode: 'insensitive' as const } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        osmPlaceId: true,
      },
    });

    // Filter FreshBite results to within radius * 1.5
    const radiusKm = (radius / 1000) * 1.5;
    const freshbiteResults: DiscoveredRestaurant[] = allFreshbiteRestaurants
      .filter((r) => {
        if (!r.latitude || !r.longitude) return false;
        return haversineKm(centerLat!, centerLng!, r.latitude, r.longitude) <= radiusKm;
      })
      .map((r) => ({
        osmId: r.osmPlaceId || r.id,
        name: r.name,
        cuisine: null,
        address: r.address,
        city: r.city,
        state: r.state,
        country: r.country,
        phone: null,
        website: null,
        openingHours: null,
        type: 'restaurant',
        latitude: r.latitude!,
        longitude: r.longitude!,
        distanceKm: Number(haversineKm(centerLat!, centerLng!, r.latitude!, r.longitude!).toFixed(2)),
        source: 'freshbite' as const,
        freshbiteId: r.id,
      }));

    // 4. Merge: enrich OSM results with FreshBite IDs where osmPlaceId matches
    const freshbiteByOsm = new Map<string, string>();
    for (const fb of allFreshbiteRestaurants) {
      if (fb.osmPlaceId) freshbiteByOsm.set(fb.osmPlaceId, fb.id);
    }

    for (const osm of osmRestaurants) {
      const fbId = freshbiteByOsm.get(osm.osmId);
      if (fbId) {
        osm.freshbiteId = fbId;
        osm.source = 'freshbite';
      }
    }

    // 5. Deduplicate: remove FreshBite-only entries that are already in OSM results
    const osmIds = new Set(osmRestaurants.map((r) => r.osmId));
    const uniqueFreshbite = freshbiteResults.filter((fb) => !osmIds.has(fb.osmId));

    // 6. Combine and sort by distance
    const combined = [...osmRestaurants, ...uniqueFreshbite]
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, limit);

    ctx.success(200, { totalResults: combined.length, resolvedLocation, radius });
    return NextResponse.json({
      resolvedLocation,
      centerLat,
      centerLng,
      totalResults: combined.length,
      restaurants: combined,
    });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to search restaurants', resolvedLocation: null, centerLat: 0, centerLng: 0, totalResults: 0, restaurants: [] },
      { status: 500 }
    );
  }
}
