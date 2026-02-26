/**
 * Kafka consumer worker — processes review submissions from the
 * "review-submissions" topic and persists them to PostgreSQL.
 *
 * Run:  npx tsx scripts/kafka-consumer.ts
 *
 * This runs as a standalone Node process separate from the Next.js app.
 * It reads messages published by the review API route and writes them
 * to the database using Prisma.
 */

import { PrismaClient } from '@prisma/client';
import { createReviewConsumer, ReviewMessage } from '../lib/kafka';

const prisma = new PrismaClient();

async function handleReview(review: ReviewMessage) {
  // Verify dish exists
  const dar = await prisma.dishAtRestaurant.findUnique({
    where: { id: review.dishAtRestaurantId },
    select: { id: true },
  });

  if (!dar) {
    console.warn(`[Consumer] Dish ${review.dishAtRestaurantId} not found — skipping`);
    return;
  }

  const created = await prisma.review.create({
    data: {
      dishAtRestaurantId: review.dishAtRestaurantId,
      rating: review.rating,
      text: review.text,
      ...(review.visitedAt ? { visitedAt: new Date(review.visitedAt) } : {}),
    },
    select: { id: true, rating: true },
  });

  console.log(
    `[Consumer] ✅ Review ${created.id} saved (rating=${created.rating}) for dish ${review.dishAtRestaurantId}`
  );
}

async function main() {
  console.log('🚀 Starting Kafka review consumer...');
  const consumer = await createReviewConsumer('freshbite-review-writer', handleReview);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down consumer...');
    await consumer.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('❌ Consumer failed:', err);
  process.exit(1);
});
