import pino from "pino";

// pino plain JSON (ไม่มี worker transport → ปลอดภัยบน serverless/Vercel)
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined, // ไม่ใส่ pid/hostname
});

// helper: log API call + จับเวลา
export function apiLog(route: string, meta: Record<string, unknown> = {}) {
  logger.info({ route, ...meta }, `API ${route}`);
}

export function apiError(route: string, err: unknown, meta: Record<string, unknown> = {}) {
  logger.error({ route, err: (err as Error)?.message ?? String(err), ...meta }, `API ${route} error`);
}
