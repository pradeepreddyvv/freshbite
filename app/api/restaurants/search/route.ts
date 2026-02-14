import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/restaurants/search?q=... — search FreshBite restaurants by name/city/address
 */

const log = withLogging('/api/restaurants/search');

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      ctx.fail(400, 'Search query required');
      return NextResponse.json({ error: 'q parameter is required' }, { status: 400 });
    }

    const restaurants = await prisma.restaurant.findMany({
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

    ctx.success(200, { count: restaurants.length, query: q });
    return NextResponse.json(restaurants);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
