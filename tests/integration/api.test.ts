/**
 * API integration tests — hit the running Next.js dev server.
 *
 * These tests verify that all API endpoints return correct responses.
 * Requires: `npm run dev` running on port 3000.
 *
 * Run:  npm test
 */
import { describe, it, expect } from 'vitest';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return { status: res.status, data: await res.json() };
}

/* ═══════════════════════════════════════════
   GET /api/restaurants
   ═══════════════════════════════════════════ */
describe('GET /api/restaurants', () => {
  it('returns a list of restaurants', async () => {
    const { status, data } = await api('/api/restaurants');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(25);
  });

  it('each restaurant has required fields', async () => {
    const { data } = await api('/api/restaurants');
    const r = data[0];
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('name');
    expect(r).toHaveProperty('city');
    expect(r).toHaveProperty('state');
    expect(r).toHaveProperty('latitude');
    expect(r).toHaveProperty('longitude');
  });

  it('supports search with ?q parameter', async () => {
    const { status, data } = await api('/api/restaurants?q=curry');
    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].name.toLowerCase()).toContain('curry');
  });
});

/* ═══════════════════════════════════════════
   GET /api/dishes
   ═══════════════════════════════════════════ */
describe('GET /api/dishes', () => {
  it('returns a list of dishes', async () => {
    const { status, data } = await api('/api/dishes');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(10);
  });

  it('each dish has required fields', async () => {
    const { data } = await api('/api/dishes');
    const d = data[0];
    expect(d).toHaveProperty('id');
    expect(d).toHaveProperty('dishName');
    expect(d).toHaveProperty('restaurantName');
    expect(d).toHaveProperty('reviewCount');
  });

  it('supports search with ?q parameter', async () => {
    const { status, data } = await api('/api/dishes?q=pizza');
    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════════════════════════════════════
   GET /api/dish/[id]/summary
   ═══════════════════════════════════════════ */
describe('GET /api/dish/[id]/summary', () => {
  let dishId: string;

  it('fetches a dish ID first', async () => {
    const { data } = await api('/api/dishes');
    dishId = data[0].id;
    expect(dishId).toBeTruthy();
  });

  it('returns dish summary with risk label', async () => {
    const { status, data } = await api(`/api/dish/${dishId}/summary`);
    expect(status).toBe(200);
    expect(data).toHaveProperty('dish');
    expect(data).toHaveProperty('restaurant');
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('risk');
    expect(data.dish).toHaveProperty('name');
    expect(data.restaurant).toHaveProperty('name');
    expect(data.risk).toHaveProperty('level');
    expect(data.risk).toHaveProperty('emoji');
  });

  it('returns 404 for non-existent dish', async () => {
    const { status } = await api('/api/dish/nonexistent-id-xyz/summary');
    expect(status).toBe(404);
  });

  it('rejects invalid window parameter', async () => {
    const { status } = await api(`/api/dish/${dishId}/summary?window=99z`);
    expect(status).toBe(400);
  });
});

/* ═══════════════════════════════════════════
   GET /api/dish/[id]/reviews
   ═══════════════════════════════════════════ */
describe('GET /api/dish/[id]/reviews', () => {
  let dishId: string;

  it('fetches a dish ID first', async () => {
    const { data } = await api('/api/dishes');
    dishId = data[0].id;
    expect(dishId).toBeTruthy();
  });

  it('returns reviews with stats', async () => {
    const { status, data } = await api(`/api/dish/${dishId}/reviews?window=5d`);
    expect(status).toBe(200);
    expect(data).toHaveProperty('reviews');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.reviews)).toBe(true);
    expect(data.stats).toHaveProperty('avgRating');
    expect(data.stats).toHaveProperty('reviewCount');
  });

  it('returns 404 for non-existent dish', async () => {
    const { status } = await api('/api/dish/nonexistent-id-xyz/reviews');
    expect(status).toBe(404);
  });
});

/* ═══════════════════════════════════════════
   POST /api/dish/[id]/reviews
   ═══════════════════════════════════════════ */
describe('POST /api/dish/[id]/reviews', () => {
  let dishId: string;

  it('fetches a dish ID first', async () => {
    const { data } = await api('/api/dishes');
    dishId = data[0].id;
    expect(dishId).toBeTruthy();
  });

  it('creates a review successfully', async () => {
    const { status, data } = await api(`/api/dish/${dishId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        text: 'Automated test review — vitest integration test',
      }),
    });
    // 201 = direct DB write, 202 = queued via Kafka
    expect([201, 202]).toContain(status);
    if (status === 201) {
      expect(data).toHaveProperty('id');
      expect(data.rating).toBe(5);
    }
    if (status === 202) {
      expect(data).toHaveProperty('accepted');
    }
  });

  it('rejects invalid rating', async () => {
    const { status } = await api(`/api/dish/${dishId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 10, text: 'Too high' }),
    });
    expect(status).toBe(400);
  });

  it('rejects empty text', async () => {
    const { status } = await api(`/api/dish/${dishId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 3, text: '' }),
    });
    expect(status).toBe(400);
  });

  it('rejects non-existent dish', async () => {
    const { status } = await api('/api/dish/nonexistent-id/reviews', {
      method: 'POST',
      body: JSON.stringify({ rating: 3, text: 'Ghost dish' }),
    });
    expect(status).toBe(404);
  });
});

/* ═══════════════════════════════════════════
   GET /api/restaurants/[id]/dishes
   ═══════════════════════════════════════════ */
describe('GET /api/restaurants/[id]/dishes', () => {
  it('returns dishes for a restaurant', async () => {
    const { data: restaurants } = await api('/api/restaurants');
    const restId = restaurants[0].id;
    const { status, data } = await api(`/api/restaurants/${restId}/dishes`);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});
