import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging } from '@/lib/logger';

/**
 * GET /api/maintenance/retention — view current retention config
 * POST /api/maintenance/retention — run cold-data cleanup
 * PUT /api/maintenance/retention — update retention config
 * 
 * Cold-data cleanup:
 * - Reviews older than keepRawDays: truncate text to "[archived]"
 *   but keep rating, createdAt, dishAtRestaurantId (for rollups).
 * - This reduces TEXT storage while preserving aggregate data.
 * - Rollups must be up-to-date before running this.
 */

const log = withLogging('/api/maintenance/retention');

export async function GET(request: NextRequest) {
  const ctx = log.start('GET', request.url);
  try {
    let config = await prisma.retentionConfig.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      config = await prisma.retentionConfig.create({
        data: { id: 'singleton' },
      });
    }
    ctx.success(200);
    return NextResponse.json(config);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to fetch retention config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const ctx = log.start('PUT', request.url);
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ALERTS_SECRET_TOKEN || 'dev-token';
    if (authHeader !== `Bearer ${expectedToken}`) {
      ctx.fail(401, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = await prisma.retentionConfig.upsert({
      where: { id: 'singleton' },
      update: {
        ...(body.keepRawDays !== undefined && { keepRawDays: body.keepRawDays }),
        ...(body.archiveEnabled !== undefined && { archiveEnabled: body.archiveEnabled }),
        ...(body.archiveDestination !== undefined && { archiveDestination: body.archiveDestination }),
        ...(body.warnAtPct !== undefined && { warnAtPct: body.warnAtPct }),
        ...(body.criticalAtPct !== undefined && { criticalAtPct: body.criticalAtPct }),
        ...(body.maxStorageMb !== undefined && { maxStorageMb: body.maxStorageMb }),
      },
      create: { id: 'singleton' },
    });
    ctx.success(200, { keepRawDays: config.keepRawDays });
    return NextResponse.json(config);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to update retention config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ALERTS_SECRET_TOKEN || 'dev-token';
    if (authHeader !== `Bearer ${expectedToken}`) {
      ctx.fail(401, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.retentionConfig.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      return NextResponse.json({ error: 'No retention config found' }, { status: 404 });
    }

    if (!config.archiveEnabled) {
      ctx.success(200, { message: 'Archival disabled' });
      return NextResponse.json({
        success: true,
        archived: 0,
        message: 'Archival is disabled. Enable it via PUT /api/maintenance/retention',
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.keepRawDays);

    // First ensure rollups are up to date for the data we're about to archive
    await prisma.$queryRaw`
      SELECT refresh_daily_rollups(
        (SELECT COALESCE(MIN(DATE("createdAt")), CURRENT_DATE) FROM "Review" WHERE "createdAt" < ${cutoffDate}),
        ${cutoffDate}::date
      )
    `;

    // Archive: replace text with "[archived]" for old reviews
    // This preserves rating, timestamps, and foreign keys for rollup integrity
    const result = await prisma.$executeRaw`
      UPDATE "Review"
      SET "text" = '[archived]'
      WHERE "createdAt" < ${cutoffDate}
        AND "text" != '[archived]'
    `;

    ctx.success(200, { archived: result, cutoffDate: cutoffDate.toISOString() });
    return NextResponse.json({
      success: true,
      archived: result,
      cutoffDate: cutoffDate.toISOString(),
      keepRawDays: config.keepRawDays,
      message: `Archived ${result} old review(s). Text replaced with "[archived]". Ratings preserved.`,
    });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json({ error: 'Failed to run retention cleanup' }, { status: 500 });
  }
}
