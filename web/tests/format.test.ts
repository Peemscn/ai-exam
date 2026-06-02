import { describe, it, expect } from "vitest";
import { fmtDist, fmtReviews, medal, totalClass, rankClass } from "@/lib/format";

describe("fmtDist", () => {
  it("null → em dash", () => expect(fmtDist(null)).toBe("—"));
  it("< 1000 → meters", () => expect(fmtDist(500)).toBe("500 ม."));
  it(">= 1000 → km 1 decimal", () => expect(fmtDist(1500)).toBe("1.5 กม."));
  it("exactly 1000 → km", () => expect(fmtDist(1000)).toBe("1.0 กม."));
});

describe("totalClass", () => {
  it(">= 75 → good", () => expect(totalClass(80)).toBe("good"));
  it("60-74 → ok", () => expect(totalClass(65)).toBe("ok"));
  it("< 60 → warn", () => expect(totalClass(50)).toBe("warn"));
  it("boundary 75 → good", () => expect(totalClass(75)).toBe("good"));
});

describe("rankClass", () => {
  it("rank 1/2/3 → r1/r2/r3", () => {
    expect(rankClass(1)).toBe("r1");
    expect(rankClass(2)).toBe("r2");
    expect(rankClass(3)).toBe("r3");
  });
  it("rank > 3 → empty", () => expect(rankClass(4)).toBe(""));
});

describe("fmtReviews", () => {
  it("adds thousands separator", () => expect(fmtReviews(1234)).toBe("1,234"));
  it("small number unchanged", () => expect(fmtReviews(42)).toBe("42"));
});

describe("medal", () => {
  it("top 3 → medals", () => {
    expect(medal(0)).toBe("🥇");
    expect(medal(1)).toBe("🥈");
    expect(medal(2)).toBe("🥉");
  });
  it("4th+ → #n", () => expect(medal(3)).toBe("#4"));
});
