import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// POST /api/chat
// STUB for V2 evidence-based chat
// Contract: must return answer + reviewIdsUsed for citation

const chatRequestSchema = z.object({
  dishAtRestaurantId: z.string(),
  question: z.string().min(1).max(500),
  window: z.enum(['24h', '48h', '5d']).optional().default('24h'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { dishAtRestaurantId, question, window } = validationResult.data;

    // STUB IMPLEMENTATION
    // V2: This would:
    // 1. Fetch reviews within the time window
    // 2. Use embeddings/LLM to find relevant reviews
    // 3. Generate answer based ONLY on those reviews
    // 4. Return reviewIds for citation links

    // For now, return a placeholder response
    return NextResponse.json({
      answer: `This is a placeholder response for your question: "${question}". In V2, this will analyze only the last ${window} of reviews for dish ${dishAtRestaurantId} and provide evidence-based answers with citations.`,
      reviewIdsUsed: [], // V2: will include actual review IDs
      window,
      metadata: {
        isStub: true,
        message: 'Chat feature coming in V2 - will use RAG over time-windowed reviews',
      },
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
