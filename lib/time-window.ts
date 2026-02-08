/**
 * Window parser - converts time window strings to Date cutoff
 * Supported formats: 24h, 48h, 5d
 */
export const TIME_WINDOWS = ['24h', '48h', '5d'] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

export function parseTimeWindow(window: TimeWindow): Date {
  const now = new Date();

  switch (window) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '48h':
      return new Date(now.getTime() - 48 * 60 * 60 * 1000);
    case '5d':
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  }
}

export function isValidTimeWindow(window: string): window is TimeWindow {
  return TIME_WINDOWS.includes(window as TimeWindow);
}

export function normalizeTimeWindow(
  window: string | undefined | null,
  fallback: TimeWindow
): TimeWindow {
  if (window && isValidTimeWindow(window)) {
    return window;
  }
  return fallback;
}

export function getWindowLabel(window: TimeWindow): string {
  switch (window) {
    case '24h':
      return 'last 24 hours';
    case '48h':
      return 'last 48 hours';
    case '5d':
      return 'last 5 days';
  }
}
