import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withLogging } from '@/lib/logger';

// POST /api/chat
// Proxies to Spring Boot ChatController → FastAPI LLM service
// Flow: Frontend → Next.js → Spring Boot → FastAPI → response

const log = withLogging('/api/chat');

const chatRequestSchema = z.object({
  dishAtRestaurantId: z.string(),
  question: z.string().min(1).max(500),
  window: z.enum(['24h', '48h', '5d']).optional().default('24h'),
});

export async function POST(request: NextRequest) {
  const ctx = log.start('POST', request.url);
  try {
    const body = await request.json();

    // Validate input
    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      ctx.fail(400, 'Validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { dishAtRestaurantId, question, window } = validationResult.data;

    // Proxy to Spring Boot ChatController which fetches reviews + calls FastAPI
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    ctx.success(200, { dishId: dishAtRestaurantId, window, questionLength: question.length, backendUrl });

    const springResponse = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishAtRestaurantId, question, window }),
    });

    if (!springResponse.ok) {
      const errorText = await springResponse.text();
      ctx.fail(springResponse.status, 'Spring Boot chat failed', { error: errorText });
      return NextResponse.json(
        { error: 'Chat service error', details: errorText },
        { status: springResponse.status }
      );
    }

    const data = await springResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    ctx.error(error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
