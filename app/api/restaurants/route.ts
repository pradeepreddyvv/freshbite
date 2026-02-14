import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/restaurants — list all FreshBite restaurants  
 * POST /api/restaurants — create a restaurant (persist on user selection)
 *   Accepts optional osmPlaceId for dedup; upserts if osmPlaceId already exists.
 */

const log = withLogging('/api/restaurants');

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    let restaurants;
    if (q) {
      // Search FreshBite DB restaurants by name, city, address
      restaurants = await prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 50,
        orderBy: { name: 'asc' },
      });
    } else {
      restaurants = await prisma.restaurant.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
    }

    ctx.success(200, { count: restaurants.length });
    return NextResponse.json(restaurants);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    const body = await request.json();
    const { name, address, city, state, country, latitude, longitude, osmPlaceId, timezone } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      ctx.fail(400, 'Name is required');
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    // If osmPlaceId provided, upsert to avoid duplicates
    if (osmPlaceId) {
      const existing = await prisma.restaurant.findUnique({
        where: { osmPlaceId: String(osmPlaceId) },
      });

      if (existing) {
        ctx.success(200, { id: existing.id, action: 'existing' });
        return NextResponse.json(existing);
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name.trim(),
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'USA',
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        osmPlaceId: osmPlaceId ? String(osmPlaceId) : null,
        timezone: timezone || 'America/Los_Angeles',
      },
    });

    ctx.success(201, { id: restaurant.id });
    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    ctx.error(error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Handle unique constraint violation on osmPlaceId
    if (msg.includes('Unique constraint')) {
      const existing = await prisma.restaurant.findFirst({
        where: { name: { equals: (await request.clone().json()).name } },
      });
      if (existing) {
        return NextResponse.json(existing);
      }
    }
    return NextResponse.json({ error: 'Failed to create restaurant', details: msg }, { status: 500 });
  }
}
