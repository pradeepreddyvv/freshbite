import { NextRequest, NextResponse } from 'next/server';
import { getDishSummary } from '@/lib/dish-service';
import { isValidTimeWindow, normalizeTimeWindow } from '@/lib/time-window';

// GET /api/dish/[id]/summary?window=24h
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const rawWindow = searchParams.get('window');

    // Validate window parameter
    if (rawWindow && !isValidTimeWindow(rawWindow)) {
      return NextResponse.json(
        { error: 'Invalid window parameter. Must be one of: 24h, 48h, 5d' },
        { status: 400 }
      );
    }
    const window = normalizeTimeWindow(rawWindow, '24h');
    const summary = await getDishSummary(id, window);

    if (!summary) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
