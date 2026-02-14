import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * POST /api/maintenance/partitions
 * Creates next month's review partition (if table is partitioned)
 * and refreshes the partial index for recent reviews.
 * Protected by bearer token.
 */

const log = withLogging('/api/maintenance/partitions');

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ALERTS_SECRET_TOKEN || 'dev-token';
    if (authHeader !== `Bearer ${expectedToken}`) {
      ctx.fail(401, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // 1. Try to create next month's partition
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth() + 1;

    try {
      const partResult = await prisma.$queryRaw<[{ create_review_partition: string }]>`
        SELECT create_review_partition(${year}::int, ${month}::int)
      `;
      results.push(`Partition: ${partResult[0]?.create_review_partition}`);
    } catch (e) {
      results.push(`Partition creation: ${e instanceof Error ? e.message : 'error'}`);
    }

    // 2. Refresh partial index (drop + recreate with sliding window)
    try {
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "Review_recent_45d_idx"
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "Review_recent_45d_idx"
          ON "Review" ("dishAtRestaurantId", "createdAt" DESC)
          WHERE "createdAt" > (CURRENT_TIMESTAMP - INTERVAL '45 days')
      `);
      results.push('Partial index: refreshed (45-day window)');
    } catch (e) {
      results.push(`Partial index refresh: ${e instanceof Error ? e.message : 'error'}`);
    }

    ctx.success(200, { results });
    return NextResponse.json({
      success: true,
      results,
      message: 'Partition maintenance completed',
    });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to run partition maintenance' },
      { status: 500 }
    );
  }
}
