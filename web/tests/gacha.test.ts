import { describe, it, expect } from "vitest";
import { rateTotal, pickRarity, computeRolls, missingPools, type Rates, type PityCtx, type Item } from "@/lib/gacha";

const rates: Rates = { SSR: 1, SR: 9, R: 30, N: 60 };
const fullPool: Item[] = [
  { name: "a", rarity: "SSR" }, { name: "b", rarity: "SR" }, { name: "c", rarity: "R" }, { name: "d", rarity: "N" },
];

describe("rateTotal", () => {
  it("sums to 100", () => expect(rateTotal(rates)).toBe(100));
  it("handles all zero", () => expect(rateTotal({ SSR: 0, SR: 0, R: 0, N: 0 })).toBe(0));
  it("coerces invalid to 0", () => expect(rateTotal({ SSR: NaN as unknown as number, SR: 10, R: 30, N: 60 })).toBe(100));
});

describe("pickRarity (deterministic rnd)", () => {
  it("rnd=0 → first nonzero rarity (SSR)", () => expect(pickRarity(rates, null, () => 0)).toBe("SSR"));
  it("rnd→1 → last (N)", () => expect(pickRarity(rates, null, () => 0.999)).toBe("N"));
  it("rnd in SR band → SR", () => expect(pickRarity(rates, null, () => 0.05)).toBe("SR")); // 5% → SSR(1)+SR(10) band
  it("rnd in R band → R", () => expect(pickRarity(rates, null, () => 0.3)).toBe("R")); // 30% → within R
  it("pity guarantees SSR at threshold even if rnd→N", () => {
    const ctx: PityCtx = { on: true, th: 10, counter: 9 };
    expect(pickRarity(rates, ctx, () => 0.999)).toBe("SSR");
    expect(ctx.counter).toBe(0); // reset after pity
  });
  it("pity counter increments on non-SSR", () => {
    const ctx: PityCtx = { on: true, th: 90, counter: 0 };
    pickRarity(rates, ctx, () => 0.999);
    expect(ctx.counter).toBe(1);
  });
  it("pity counter resets when SSR rolled naturally", () => {
    const ctx: PityCtx = { on: true, th: 90, counter: 50 };
    pickRarity(rates, ctx, () => 0); // SSR
    expect(ctx.counter).toBe(0);
  });
});

describe("computeRolls", () => {
  it("paid only when free off", () => expect(computeRolls(3000, 30, false, 10, 1)).toEqual({ paid: 100, free: 0, total: 100 }));
  it("free roll: every 10 paid → 1 free", () => expect(computeRolls(3000, 30, true, 10, 1)).toEqual({ paid: 100, free: 10, total: 110 }));
  it("price 0 → no rolls (no divide by zero)", () => expect(computeRolls(3000, 0, false, 10, 1)).toEqual({ paid: 0, free: 0, total: 0 }));
  it("budget < price → 0 paid", () => expect(computeRolls(20, 30, true, 10, 1).paid).toBe(0));
  it("free x=0 guarded (no divide by zero)", () => expect(computeRolls(3000, 30, true, 0, 1).free).toBe(100));
});

describe("missingPools", () => {
  it("none missing when all rarities have items", () => expect(missingPools(rates, fullPool)).toEqual([]));
  it("flags SSR when rate>0 but no item", () => {
    expect(missingPools(rates, fullPool.filter((p) => p.rarity !== "SSR"))).toEqual(["SSR"]);
  });
  it("rate 0 rarity not required", () => {
    const r0: Rates = { SSR: 0, SR: 10, R: 30, N: 60 };
    expect(missingPools(r0, fullPool.filter((p) => p.rarity !== "SSR"))).toEqual([]);
  });
});
