import { getDb, hasRemoteDb } from "@/lib/db";
import { apiLog, apiError } from "@/lib/logger";
import { ok, fail } from "@/lib/response";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runtime = "nodejs";

// POST /api/scrape → re-scrape (local = scrape จริง ผ่าน pipeline · production = trigger CI)
//   → { data: { msg } } | { error }
export async function POST() {
  const t0 = Date.now();
  const isLocal = !process.env.VERCEL;

  if (isLocal) {
    try {
      const cwd = process.cwd();
      const useApify = !!process.env.APIFY_TOKEN;
      if (useApify) await execAsync("bun --env-file=.env scripts/scrape-apify.mjs", { cwd, timeout: 240_000 }); // Apify (primary)
      else await execAsync("node scripts/scrape.mjs", { cwd, timeout: 180_000 }); // chromium (fallback — lite)
      await execAsync("python3 scripts/clean.py", { cwd, timeout: 30_000 });
      await execAsync("python3 scripts/score.py", { cwd, timeout: 30_000 });
      let reseeded = false;
      if (hasRemoteDb()) { await execAsync("node --env-file=.env db/seed.mjs", { cwd, timeout: 60_000 }); reseeded = true; }
      const sec = Math.round((Date.now() - t0) / 1000);
      apiLog("/api/scrape", { mode: "local", reseeded, ms: Date.now() - t0 });
      return ok({ msg: `scrape สดเสร็จใน ${sec}s (${useApify ? "Apify" : "chromium"})${reseeded ? " + reseed Turso" : ""} — รีเฟรชดูข้อมูลใหม่` });
    } catch (e) {
      apiError("/api/scrape", e, { mode: "local" });
      return fail("scrape local ล้มเหลว — ต้องมี chromium + python3. " + (e as Error).message.slice(0, 160), 500);
    }
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return fail("production: ตั้ง GITHUB_TOKEN + GITHUB_REPO เพื่อ trigger CI re-scrape", 500);
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json" },
      body: JSON.stringify({ ref: "main" }),
    });
    if (r.status === 204) {
      if (hasRemoteDb()) {
        try {
          const db = getDb();
          await db.execute({ sql: "INSERT INTO scrape_runs (source, count, note) VALUES (?, ?, ?)", args: ["ci-trigger", 0, "workflow_dispatch via /api/scrape"] });
        } catch { /* optional */ }
      }
      apiLog("/api/scrape", { mode: "ci", triggered: true, ms: Date.now() - t0 });
      return ok({ msg: "trigger CI re-scrape แล้ว — อัปเดต + redeploy ใน ~2-3 นาที" });
    }
    const j = await r.json().catch(() => ({}));
    apiError("/api/scrape", new Error(`GitHub ${r.status}`), { status: r.status });
    return fail(j.message ?? `GitHub API ${r.status}`, r.status);
  } catch (e) {
    apiError("/api/scrape", e);
    return fail((e as Error).message, 500);
  }
}
