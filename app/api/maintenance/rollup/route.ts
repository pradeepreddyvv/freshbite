import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * POST /api/maintenance/rollup
 * Refreshes daily rollups for recent days.
 * Called by GitHub Actions cron or manually.
 * Protected by bearer token.
 * 
 * Query params:
 *   days=N  (default: 3) — how many days back to refresh
 */

const log = withLogging('/api/maintenance/rollup');

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

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '3', 10), 365);

    // Use the SQL function to refresh rollups
    const result = await prisma.$queryRaw<[{ refresh_daily_rollups: number }]>`
      SELECT refresh_daily_rollups(
        (CURRENT_DATE - ${days}::int)::date,
        CURRENT_DATE
      )
    `;

    const rowsAffected = result[0]?.refresh_daily_rollups ?? 0;

    ctx.success(200, { days, rowsAffected });
    return NextResponse.json({
      success: true,
      days,
      rowsAffected,
      message: `Refreshed rollups for last ${days} days. ${rowsAffected} rows upserted.`,
    });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to refresh rollups' },
      { status: 500 }
    );
  }
}
