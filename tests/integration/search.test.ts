/**
 * Search endpoint tests — verify fuzzy search, typo tolerance, and ranking.
 *
 * Requires: `npm run dev` running on port 3000.
 *
 * Run:  npm test
 */
import { describe, it, expect } from 'vitest';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function api(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

/* ═══════════════════════════════════════════
   /api/search/restaurants
   ═══════════════════════════════════════════ */
describe('Search — Restaurants', () => {
  it('finds restaurant by exact name', async () => {
    const { status, data } = await api('/api/search/restaurants?q=Curry Corner');
    expect(status).toBe(200);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.results[0].name).toBe('Curry Corner');
  });

  it('finds restaurant by partial name', async () => {
    const { data } = await api('/api/search/restaurants?q=din tai');
    expect(data.results.length).toBeGreaterThanOrEqual(2);
    const names = data.results.map((r: { name: string }) => r.name);
    expect(names.some((n: string) => n.includes('Din Tai Fung'))).toBe(true);
  });

  it('finds restaurant with typo (fuzzy)', async () => {
    const { data } = await api('/api/search/restaurants?q=curri');
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.results[0].name.toLowerCase()).toContain('curry');
  });

  it('finds restaurant by city name', async () => {
    const { data } = await api('/api/search/restaurants?q=Seattle');
    expect(data.results.length).toBeGreaterThanOrEqual(5);
  });

  it('returns empty for very short queries', async () => {
    const { data } = await api('/api/search/restaurants?q=');
    expect(data.results).toEqual([]);
  });

  it('includes dishCount and similarity in results', async () => {
    const { data } = await api('/api/search/restaurants?q=curry');
    const r = data.results[0];
    expect(r).toHaveProperty('similarity');
    expect(r).toHaveProperty('dishCount');
    expect(typeof r.similarity).toBe('number');
    expect(typeof r.dishCount).toBe('number');
  });

  it('returns query echo', async () => {
    const { data } = await api('/api/search/restaurants?q=test');
    expect(data.query).toBe('test');
  });
});

/* ═══════════════════════════════════════════
   /api/search/dishes
   ═══════════════════════════════════════════ */
describe('Search — Dishes', () => {
  it('finds dish by exact name', async () => {
    const { status, data } = await api('/api/search/dishes?q=pizza');
    expect(status).toBe(200);
    expect(data.results.length).toBeGreaterThanOrEqual(3);
  });

  it('finds dish with typo (fuzzy)', async () => {
    const { data } = await api('/api/search/dishes?q=piza');
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    const hasPizza = data.results.some(
      (r: { dishName: string }) => r.dishName.toLowerCase().includes('pizza'),
    );
    expect(hasPizza).toBe(true);
  });

  it('finds dishes by cuisine', async () => {
    const { data } = await api('/api/search/dishes?q=indian');
    expect(data.results.length).toBeGreaterThanOrEqual(1);
  });

  it('finds dishes by restaurant name', async () => {
    const { data } = await api('/api/search/dishes?q=Serious Pie');
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    // The top result should be from Serious Pie
    expect(data.results[0].restaurantName).toBe('Serious Pie');
  });

  it('includes similarity and reviewCount', async () => {
    const { data } = await api('/api/search/dishes?q=pizza');
    const d = data.results[0];
    expect(d).toHaveProperty('similarity');
    expect(d).toHaveProperty('reviewCount');
    expect(d).toHaveProperty('dishName');
    expect(d).toHaveProperty('restaurantName');
  });

  it('returns empty for very short queries', async () => {
    const { data } = await api('/api/search/dishes?q=a');
    expect(data.results).toEqual([]);
  });
});

/* ═══════════════════════════════════════════
   /api/search/locations
   ═══════════════════════════════════════════ */
describe('Search — Locations', () => {
  it('finds restaurants by city', async () => {
    const { status, data } = await api('/api/search/locations?q=Tempe');
    expect(status).toBe(200);
    expect(data.results.length).toBeGreaterThanOrEqual(5);
    const allTempe = data.results.every(
      (r: { city: string | null }) => r.city === 'Tempe',
    );
    expect(allTempe).toBe(true);
  });

  it('finds restaurants by state abbreviation', async () => {
    const { data } = await api('/api/search/locations?q=AZ');
    expect(data.results.length).toBeGreaterThanOrEqual(5);
    const allAZ = data.results.every(
      (r: { state: string | null }) => r.state === 'AZ',
    );
    expect(allAZ).toBe(true);
  });

  it('handles fuzzy city name with typo', async () => {
    const { data } = await api('/api/search/locations?q=seatle');
    expect(data.results.length).toBeGreaterThanOrEqual(5);
    const hasSeattle = data.results.some(
      (r: { city: string | null }) => r.city === 'Seattle',
    );
    expect(hasSeattle).toBe(true);
  });

  it('finds restaurants by address substring', async () => {
    const { data } = await api('/api/search/locations?q=Mill Ave');
    expect(data.results.length).toBeGreaterThanOrEqual(1);
  });

  it('includes matchedField and dishCount', async () => {
    const { data } = await api('/api/search/locations?q=Tempe');
    const r = data.results[0];
    expect(r).toHaveProperty('matchedField');
    expect(r).toHaveProperty('dishCount');
    expect(['city', 'address', 'state']).toContain(r.matchedField);
  });

  it('returns empty for very short queries', async () => {
    const { data } = await api('/api/search/locations?q=a');
    expect(data.results).toEqual([]);
  });
});

/* ═══════════════════════════════════════════
   /api/restaurants/search (legacy endpoint)
   ═══════════════════════════════════════════ */
describe('Search — /api/restaurants/search (legacy)', () => {
  it('finds restaurants by name', async () => {
    const { status, data } = await api('/api/restaurants/search?q=Canlis');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].name).toBe('Canlis');
  });

  it('returns 400 when q is missing', async () => {
    const { status } = await api('/api/restaurants/search');
    expect(status).toBe(400);
  });
});
