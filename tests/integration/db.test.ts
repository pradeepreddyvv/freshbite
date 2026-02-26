/**
 * Integration tests — hit the live Supabase DB via Prisma.
 *
 * These tests verify that the DB schema, seed data, and queries
 * all work correctly against the real database.
 *
 * Run:  npm test
 */
import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

/* ═══════════════════════════════════════════
   Restaurant queries
   ═══════════════════════════════════════════ */
describe('Database — Restaurants', () => {
  it('has seeded restaurants', async () => {
    const count = await prisma.restaurant.count();
    expect(count).toBeGreaterThanOrEqual(25);
  });

  it('has restaurants in multiple cities', async () => {
    const cities = await prisma.restaurant.groupBy({
      by: ['city'],
      _count: true,
    });
    const cityNames = cities.map((c) => c.city).filter(Boolean);
    expect(cityNames).toContain('Tempe');
    expect(cityNames).toContain('Seattle');
    expect(cityNames).toContain('Bellevue');
  });

  it('can find a restaurant by name (case-insensitive)', async () => {
    const result = await prisma.restaurant.findMany({
      where: { name: { contains: 'curry', mode: 'insensitive' } },
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toContain('Curry');
  });

  it('has lat/lng for all restaurants', async () => {
    const withCoords = await prisma.restaurant.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });
    const total = await prisma.restaurant.count();
    expect(withCoords.length).toBe(total);
  });
});

/* ═══════════════════════════════════════════
   Dish queries
   ═══════════════════════════════════════════ */
describe('Database — Dishes', () => {
  it('has seeded dishes', async () => {
    const count = await prisma.dish.count();
    expect(count).toBeGreaterThanOrEqual(25);
  });

  it('each restaurant has at least 1 dish via DishAtRestaurant', async () => {
    const restaurants = await prisma.restaurant.findMany({
      include: { _count: { select: { dishesAtRestaurant: true } } },
    });
    for (const r of restaurants) {
      expect(r._count.dishesAtRestaurant).toBeGreaterThanOrEqual(1);
    }
  });

  it('DishAtRestaurant links are valid (dish + restaurant exist)', async () => {
    const dars = await prisma.dishAtRestaurant.findMany({
      take: 10,
      include: { dish: true, restaurant: true },
    });
    for (const dar of dars) {
      expect(dar.dish).toBeTruthy();
      expect(dar.restaurant).toBeTruthy();
      expect(dar.dish.name.length).toBeGreaterThan(0);
      expect(dar.restaurant.name.length).toBeGreaterThan(0);
    }
  });
});

/* ═══════════════════════════════════════════
   Review queries
   ═══════════════════════════════════════════ */
describe('Database — Reviews', () => {
  it('has seeded reviews', async () => {
    const count = await prisma.review.count();
    expect(count).toBeGreaterThanOrEqual(50);
  });

  it('all reviews have rating between 1 and 5', async () => {
    const invalid = await prisma.review.findMany({
      where: {
        OR: [{ rating: { lt: 1 } }, { rating: { gt: 5 } }],
      },
    });
    expect(invalid.length).toBe(0);
  });

  it('all reviews reference a valid DishAtRestaurant', async () => {
    const reviews = await prisma.review.findMany({
      take: 20,
      include: { dishAtRestaurant: true },
    });
    for (const r of reviews) {
      expect(r.dishAtRestaurant).toBeTruthy();
    }
  });

  it('can create and delete a review', async () => {
    // Get a random dish
    const dar = await prisma.dishAtRestaurant.findFirst();
    expect(dar).toBeTruthy();

    // Create
    const review = await prisma.review.create({
      data: {
        dishAtRestaurantId: dar!.id,
        rating: 4,
        text: 'Automated test review — should be deleted',
      },
    });
    expect(review.id).toBeTruthy();
    expect(review.rating).toBe(4);

    // Delete (cleanup)
    await prisma.review.delete({ where: { id: review.id } });
    const deleted = await prisma.review.findUnique({ where: { id: review.id } });
    expect(deleted).toBeNull();
  });
});

/* ═══════════════════════════════════════════
   pg_trgm extension
   ═══════════════════════════════════════════ */
describe('Database — pg_trgm extension', () => {
  it('similarity() function works', async () => {
    const result = await prisma.$queryRaw<Array<{ sim: number }>>`
      SELECT similarity('Curry Corner', 'curry')::DOUBLE PRECISION AS sim
    `;
    expect(result[0].sim).toBeGreaterThan(0);
  });

  it('fuzzy search finds restaurants with typos', async () => {
    const rows = await prisma.$queryRaw<Array<{ name: string; sim: number }>>`
      SELECT r."name", similarity(r."name", 'curri')::DOUBLE PRECISION AS sim
      FROM "Restaurant" r
      WHERE similarity(r."name", 'curri') > 0.1
      ORDER BY sim DESC
      LIMIT 5
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].name.toLowerCase()).toContain('curry');
  });

  it('fuzzy search finds dishes with typos', async () => {
    const rows = await prisma.$queryRaw<Array<{ name: string; sim: number }>>`
      SELECT d."name", similarity(d."name", 'piza')::DOUBLE PRECISION AS sim
      FROM "Dish" d
      WHERE similarity(d."name", 'piza') > 0.1
      ORDER BY sim DESC
      LIMIT 5
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // At least one result should relate to pizza
    const hasPizza = rows.some((r) => r.name.toLowerCase().includes('pizza'));
    expect(hasPizza).toBe(true);
  });

  it('ILIKE substring search works', async () => {
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT r."name" FROM "Restaurant" r
      WHERE r."name" ILIKE '%din tai%'
    `;
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});
