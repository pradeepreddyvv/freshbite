import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidTimeWindow, normalizeTimeWindow, parseTimeWindow } from '@/lib/time-window';
import { calculateRiskLabel } from '@/lib/risk-label';
import { withLogging } from '@/lib/logger';

// POST /api/alerts/run
// STUB for V2 alert evaluation
// Called by GitHub Actions cron hourly

const log = withLogging('/api/alerts/run');

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    // Verify request is authorized (in production, use a secret token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ALERTS_SECRET_TOKEN || 'dev-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      ctx.fail(401, 'Unauthorized — invalid or missing bearer token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all active alert subscriptions
    const subscriptions = await prisma.alertSubscription.findMany({
      where: { isActive: true },
      include: {
        dishAtRestaurant: {
          include: {
            dish: { select: { name: true } },
            restaurant: { select: { name: true } },
          },
        },
      },
    });

    const evaluationResults = [];

    // Evaluate each subscription
    for (const sub of subscriptions) {
      const window = isValidTimeWindow(sub.window)
        ? normalizeTimeWindow(sub.window, '24h')
        : '24h';
      const cutoffDate = parseTimeWindow(window);

      // Fetch reviews within window
      const reviews = await prisma.review.findMany({
        where: {
          dishAtRestaurantId: sub.dishAtRestaurantId,
          createdAt: { gte: cutoffDate },
        },
        select: { rating: true },
      });

      const reviewCount = reviews.length;
      const avgRating = reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;

      const riskLabel = calculateRiskLabel(avgRating, reviewCount);

      // Determine if alert should trigger
      const shouldAlert =
        avgRating !== null &&
        avgRating < sub.minRating &&
        reviewCount >= 3;

      evaluationResults.push({
        subscriptionId: sub.id,
        dishName: sub.dishAtRestaurant.dish.name,
        restaurantName: sub.dishAtRestaurant.restaurant.name,
        window,
        avgRating,
        reviewCount,
        riskLabel: riskLabel.label,
        minRating: sub.minRating,
        shouldAlert,
        // V2: would actually send notification here
        notificationSent: false,
      });
    }

    // STUB: In V2, this would actually send emails/SMS/push notifications
    const alertsTriggered = evaluationResults.filter((r) => r.shouldAlert).length;
    ctx.success(200, { evaluatedCount: subscriptions.length, alertsTriggered });

    return NextResponse.json({
      success: true,
      evaluatedCount: subscriptions.length,
      alertsTriggered,
      results: evaluationResults,
      metadata: {
        isStub: true,
        message: 'Notifications not sent in MVP - V2 will integrate email/SMS',
      },
    });
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to run alerts' },
      { status: 500 }
    );
  }
}
