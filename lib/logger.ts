/**
 * Structured logger for FreshBite
 * Adds request IDs, timing, and consistent format across all API routes
 */

let requestCounter = 0;

export function generateRequestId(): string {
  requestCounter += 1;
  const ts = Date.now().toString(36);
  return `req_${ts}_${requestCounter}`;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, ctx?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const contextStr = ctx
    ? ' ' + Object.entries(ctx)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' ')
    : '';
  return `${prefix} ${message}${contextStr}`;
}

export const logger = {
  info(message: string, ctx?: LogContext) {
    console.log(formatLog('info', message, ctx));
  },
  warn(message: string, ctx?: LogContext) {
    console.warn(formatLog('warn', message, ctx));
  },
  error(message: string, ctx?: LogContext & { error?: unknown }) {
    const errorMsg = ctx?.error instanceof Error ? ctx.error.message : String(ctx?.error || '');
    const errorStack = ctx?.error instanceof Error ? ctx.error.stack : undefined;
    console.error(formatLog('error', message, { ...ctx, error: errorMsg }));
    if (errorStack) {
      console.error(errorStack);
    }
  },
  debug(message: string, ctx?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('debug', message, ctx));
    }
  },
};

/**
 * Wraps an API handler to add automatic request/response logging with timing
 */
export function withLogging(routeName: string) {
  return {
    start(method: string, url: string, extra?: Record<string, unknown>) {
      const requestId = generateRequestId();
      const startTime = Date.now();
      const path = new URL(url).pathname + new URL(url).search;

      logger.info(`→ ${method} ${routeName}`, {
        requestId,
        method,
        path,
        ...extra,
      });

      return {
        requestId,
        startTime,
        path,

        success(status: number, extra?: Record<string, unknown>) {
          const durationMs = Date.now() - startTime;
          logger.info(`← ${method} ${routeName}`, {
            requestId,
            method,
            path,
            status,
            durationMs,
            ...extra,
          });
        },

        fail(status: number, error: string, extra?: Record<string, unknown>) {
          const durationMs = Date.now() - startTime;
          logger.warn(`← ${method} ${routeName} FAILED`, {
            requestId,
            method,
            path,
            status,
            durationMs,
            error,
            ...extra,
          });
        },

        error(err: unknown) {
          const durationMs = Date.now() - startTime;
          logger.error(`✗ ${method} ${routeName} ERROR`, {
            requestId,
            method,
            path,
            durationMs,
            error: err,
          });
        },
      };
    },
  };
}
