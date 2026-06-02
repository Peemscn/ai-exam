// REST response envelope (best practice) — consistent ทุก endpoint
//   สำเร็จ: { data, meta? }   ผิดพลาด: { error: { message, ... } }

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return Response.json(meta ? { data, meta } : { data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: { message, ...extra } }, { status });
}
