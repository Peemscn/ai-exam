import { createClient, type Client } from "@libsql/client";

// Turso (libSQL) client — ใช้ remote ถ้ามี env, ไม่งั้น fallback local file (dev)
let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  _db = createClient(
    url ? { url, authToken } : { url: "file:local.db" }
  );
  return _db;
}

// มี Turso remote ตั้งไว้ไหม (ถ้าไม่มี → page อ่าน JSON fallback แทน DB)
export const hasRemoteDb = (): boolean => !!process.env.TURSO_DATABASE_URL;
