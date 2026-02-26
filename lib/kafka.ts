import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

/**
 * Kafka client for review submission pipeline.
 *
 * Topic: review-submissions
 * Producer: API route publishes review data
 * Consumer: Background worker persists reviews to DB
 *
 * Falls back to direct DB write when Kafka is unavailable.
 */

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const TOPIC = 'review-submissions';

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let producerReady = false;
let connectionFailed = false;

function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: 'freshbite-app',
      brokers: KAFKA_BROKERS,
      connectionTimeout: 3000,
      requestTimeout: 5000,
      retry: { retries: 2 },
      logLevel: logLevel.WARN,
    });
  }
  return kafka;
}

/* ── Producer ────────────────────────── */

async function getProducer(): Promise<Producer | null> {
  if (connectionFailed) return null;
  if (producerReady && producer) return producer;

  try {
    const k = getKafka();
    producer = k.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 5000,
    });
    await producer.connect();
    producerReady = true;
    console.log('[Kafka] Producer connected');
    return producer;
  } catch (err) {
    connectionFailed = true;
    console.warn('[Kafka] Producer connection failed — falling back to direct DB write', (err as Error).message);
    return null;
  }
}

export interface ReviewMessage {
  dishAtRestaurantId: string;
  rating: number;
  text: string;
  visitedAt?: string;
  submittedAt: string;
}

/**
 * Publish a review to the Kafka topic.
 * Returns true if published, false if Kafka is unavailable.
 */
export async function publishReview(review: ReviewMessage): Promise<boolean> {
  const p = await getProducer();
  if (!p) return false;

  try {
    await p.send({
      topic: TOPIC,
      messages: [{
        key: review.dishAtRestaurantId,
        value: JSON.stringify(review),
        timestamp: String(Date.now()),
      }],
    });
    return true;
  } catch (err) {
    console.error('[Kafka] Failed to publish review:', (err as Error).message);
    return false;
  }
}

/* ── Consumer (for background worker) ── */

export async function createReviewConsumer(
  groupId: string,
  handler: (review: ReviewMessage) => Promise<void>
): Promise<Consumer> {
  const k = getKafka();
  const consumer = k.consumer({ groupId });
  await consumer.connect();

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const review: ReviewMessage = JSON.parse(message.value.toString());
        await handler(review);
      } catch (err) {
        console.error('[Kafka] Consumer error processing message:', err);
      }
    },
  });

  console.log(`[Kafka] Consumer "${groupId}" listening on ${TOPIC}`);
  return consumer;
}

export { TOPIC };
