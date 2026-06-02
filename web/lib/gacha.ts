// Pure gacha logic — port จาก q2/output/tests/gacha-logic.mjs (ตรรกะเดียวกับ HTML เดิม)
export const RAR = ["SSR", "SR", "R", "N"] as const;
export type Rarity = (typeof RAR)[number];
export type Rates = Record<Rarity, number>;
export type Item = { name: string; rarity: Rarity };
export type PityCtx = { on: boolean; th: number; counter: number };

export const rateTotal = (r: Rates): number => RAR.reduce((s, k) => s + (+r[k] || 0), 0);

// สุ่ม rarity ตาม cumulative rate + pity (rnd แยกเพื่อ test deterministic)
export function pickRarity(rates: Rates, ctx: PityCtx | null, rnd: () => number = Math.random): Rarity {
  if (ctx && ctx.on && ctx.counter + 1 >= ctx.th) {
    ctx.counter = 0;
    return "SSR";
  }
  const t = RAR.reduce((s, k) => s + rates[k], 0);
  let x = rnd() * t,
    acc = 0;
  let out: Rarity = "N";
  for (const k of RAR) {
    acc += rates[k];
    if (x < acc) {
      out = k;
      break;
    }
  }
  if (ctx) {
    if (out === "SSR") ctx.counter = 0;
    else ctx.counter++;
  }
  return out;
}

// budget → paid/free/total (free roll คำนวณจาก paid เท่านั้น)
export function computeRolls(budget: number, price: number, freeOn: boolean, x: number, y: number) {
  const paid = price > 0 ? Math.floor(budget / price) : 0;
  const free = freeOn ? Math.floor(paid / Math.max(1, x)) * Math.max(0, y) : 0;
  return { paid, free, total: paid + free };
}

// pool validation: ทุก rarity ที่ rate>0 ต้องมี item อย่างน้อย 1
export function missingPools(rates: Rates, pool: Item[]): Rarity[] {
  return RAR.filter((k) => rates[k] > 0 && !pool.some((p) => p.rarity === k));
}
