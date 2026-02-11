import { NextRequest, NextResponse } from 'next/server';
import { getDishSummary } from '@/lib/dish-service';
import { isValidTimeWindow, normalizeTimeWindow } from '@/lib/time-window';
import { withLogging } from '@/lib/logger';

const log = withLogging('/api/dish/[id]/summary');

// GET /api/dish/[id]/summary?window=24h
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = log.start('GET', request.url, { dishId: params.id });
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const rawWindow = searchParams.get('window');

    // Validate window parameter
    if (rawWindow && !isValidTimeWindow(rawWindow)) {
      ctx.fail(400, 'Invalid window parameter', { rawWindow });
      return NextResponse.json(
        { error: 'Invalid window parameter. Must be one of: 24h, 48h, 5d' },
        { status: 400 }
      );
    }
    const window = normalizeTimeWindow(rawWindow, '24h');
    const summary = await getDishSummary(id, window);

    if (!summary) {
      ctx.fail(404, 'Dish not found', { dishId: id });
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    ctx.success(200, { dishId: id, window, riskLevel: summary.risk.level });
    return NextResponse.json(summary);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
