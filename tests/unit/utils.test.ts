/**
 * Unit tests for pure utility functions (no DB required).
 */
import { describe, it, expect } from 'vitest';
import { calculateRiskLabel } from '@/lib/risk-label';
import {
  isValidTimeWindow,
  normalizeTimeWindow,
  parseTimeWindow,
  getWindowLabel,
} from '@/lib/time-window';
import { calculateReviewStats } from '@/lib/review-stats';
import { formatRelativeTime } from '@/lib/format-time';

/* ═══════════════════════════════════════════
   Risk Label
   ═══════════════════════════════════════════ */
describe('calculateRiskLabel', () => {
  it('returns "no-data" when fewer than 3 reviews', () => {
    expect(calculateRiskLabel(4.5, 2).level).toBe('no-data');
    expect(calculateRiskLabel(null, 0).level).toBe('no-data');
  });

  it('returns "good" when avgRating >= 4', () => {
    expect(calculateRiskLabel(4.0, 5).level).toBe('good');
    expect(calculateRiskLabel(5.0, 10).level).toBe('good');
  });

  it('returns "mixed" when avgRating >= 3 and < 4', () => {
    expect(calculateRiskLabel(3.0, 5).level).toBe('mixed');
    expect(calculateRiskLabel(3.9, 5).level).toBe('mixed');
  });

  it('returns "risky" when avgRating < 3', () => {
    expect(calculateRiskLabel(2.9, 5).level).toBe('risky');
    expect(calculateRiskLabel(1.0, 10).level).toBe('risky');
  });

  it('includes emoji and colors in the result', () => {
    const good = calculateRiskLabel(4.5, 5);
    expect(good.emoji).toBe('🟢');
    expect(good.color).toContain('green');
    expect(good.bgColor).toContain('green');
    expect(good.label).toBe('Good today');
  });
});

/* ═══════════════════════════════════════════
   Time Window
   ═══════════════════════════════════════════ */
describe('Time Window utilities', () => {
  describe('isValidTimeWindow', () => {
    it('accepts valid windows', () => {
      expect(isValidTimeWindow('24h')).toBe(true);
      expect(isValidTimeWindow('48h')).toBe(true);
      expect(isValidTimeWindow('5d')).toBe(true);
    });

    it('rejects invalid windows', () => {
      expect(isValidTimeWindow('1h')).toBe(false);
      expect(isValidTimeWindow('7d')).toBe(false);
      expect(isValidTimeWindow('')).toBe(false);
      expect(isValidTimeWindow('random')).toBe(false);
    });
  });

  describe('normalizeTimeWindow', () => {
    it('returns the window if valid', () => {
      expect(normalizeTimeWindow('24h', '5d')).toBe('24h');
      expect(normalizeTimeWindow('48h', '5d')).toBe('48h');
    });

    it('returns fallback for invalid input', () => {
      expect(normalizeTimeWindow(null, '5d')).toBe('5d');
      expect(normalizeTimeWindow(undefined, '24h')).toBe('24h');
      expect(normalizeTimeWindow('invalid', '5d')).toBe('5d');
    });
  });

  describe('parseTimeWindow', () => {
    it('returns a Date in the past', () => {
      const now = Date.now();
      const date24h = parseTimeWindow('24h');
      const diff = now - date24h.getTime();
      // Should be approximately 24 hours (within 1 second tolerance)
      expect(diff).toBeGreaterThan(24 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000 + 1000);
    });

    it('5d returns ~5 days ago', () => {
      const now = Date.now();
      const date5d = parseTimeWindow('5d');
      const diff = now - date5d.getTime();
      expect(diff).toBeGreaterThan(5 * 24 * 60 * 60 * 1000 - 1000);
      expect(diff).toBeLessThan(5 * 24 * 60 * 60 * 1000 + 1000);
    });
  });

  describe('getWindowLabel', () => {
    it('returns human-readable labels', () => {
      expect(getWindowLabel('24h')).toBe('last 24 hours');
      expect(getWindowLabel('48h')).toBe('last 48 hours');
      expect(getWindowLabel('5d')).toBe('last 5 days');
    });
  });
});

/* ═══════════════════════════════════════════
   Review Stats
   ═══════════════════════════════════════════ */
describe('calculateReviewStats', () => {
  it('returns null avgRating for empty array', () => {
    const stats = calculateReviewStats([], '24h');
    expect(stats.avgRating).toBeNull();
    expect(stats.reviewCount).toBe(0);
    expect(stats.window).toBe('24h');
  });

  it('calculates correct average', () => {
    const reviews = [{ rating: 4 }, { rating: 5 }, { rating: 3 }];
    const stats = calculateReviewStats(reviews, '5d');
    expect(stats.avgRating).toBe(4);
    expect(stats.reviewCount).toBe(3);
  });

  it('rounds to 1 decimal place', () => {
    const reviews = [{ rating: 3 }, { rating: 4 }];
    const stats = calculateReviewStats(reviews, '24h');
    expect(stats.avgRating).toBe(3.5);
  });
});

/* ═══════════════════════════════════════════
   Format Time
   ═══════════════════════════════════════════ */
describe('formatRelativeTime', () => {
  it('returns "Just now" for very recent dates', () => {
    expect(formatRelativeTime(new Date())).toBe('Just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns "X days ago" for 2-6 days', () => {
    const threeDays = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDays)).toBe('3 days ago');
  });
});
