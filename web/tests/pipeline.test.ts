import { describe, it, expect } from "vitest";
import { clean, score, type RawPlace, type CleanPlace } from "@/lib/pipeline";

// score() — port จาก score.py · ตรวจสูตรแต่ละเกณฑ์ตรงกับ python (deterministic)
describe("score (port score.py)", () => {
  const base: CleanPlace = {
    name: "โค-ร-ต KORATA", area: "สยาม", category: "ภัตตาคารอาหารไทย", cuisine_osm: null,
    rating: 4.9, reviews: 2531, price: "฿200-600", price_text: "฿200-600", price_min: 200, price_max: 600,
    address: "สยามสแควร์ ซอย 3", lat: 13.7451893, lon: 100.5327919, distance_m: 152,
    hours: "เปิด 11:00", website: "http://x.com", url: "u", source_maps: "u", matched_osm: false,
  };
  const [r] = score([base]);

  it("rating_review /25", () => expect(r.scores.rating_review).toBe(21.7));
  it("group_suitability /20 (ภัตตาคาร = good)", () => expect(r.scores.group_suitability).toBe(17));
  it("price_suitability /15 (mid 400 → 200-700)", () => expect(r.scores.price_suitability).toBe(15));
  it("travel_convenience /15 (152m ≤ 300)", () => expect(r.scores.travel_convenience).toBe(15));
  it("data_completeness /15 (5/6 fields · cuisine_osm null)", () => expect(r.scores.data_completeness).toBe(12.5));
  it("uniqueness /10 (rating ≥ 4.7 → +3)", () => expect(r.scores.uniqueness).toBe(7));
  it("total = ผลรวม sub-scores", () => expect(r.total).toBe(88.2));

  it("rank เรียงตาม total มาก→น้อย", () => {
    const lo: CleanPlace = { ...base, name: "ร้านคะแนนต่ำ", rating: 3.6, reviews: 5, price_min: null, price_max: null, distance_m: 2000, address: null, hours: null, website: null };
    const out = score([lo, base]);
    expect(out[0].name).toBe("โค-ร-ต KORATA");
    expect(out[0].rank).toBe(1);
    expect(out[1].rank).toBe(2);
  });

  it("price null → 7 (กลาง)", () => {
    const [x] = score([{ ...base, price_min: null, price_max: null }]);
    expect(x.scores.price_suitability).toBe(7);
  });

  it("category weak (คาเฟ่) → base ต่ำลง", () => {
    const [x] = score([{ ...base, category: "คาเฟ่" }]);
    expect(x.scores.group_suitability).toBeLessThan(r.scores.group_suitability);
  });
});

// clean() — port จาก clean.py · filter + dedupe + price/distance
describe("clean (port clean.py)", () => {
  const mk = (name: string, reviews: number, extra: Partial<RawPlace> = {}): RawPlace => ({
    name, rating: 4.5, reviews, price: null, category: "ร้านอาหาร", area: "สยาม",
    lat: 13.7459, lon: 100.534, address: null, hours: null, website: null, url: name, ...extra,
  });

  it("กรองร้านที่ไม่มี rating หรือ reviews ออก", () => {
    const out = clean([mk("A", 100), { ...mk("B", 0), rating: null }]);
    expect(out.map((r) => r.name)).toEqual(["A"]);
  });

  it("dedupe ชื่อซ้ำ — keep ตัวที่ reviews มากกว่า", () => {
    const out = clean([mk("Sushi Place Bangkok", 100), mk("Sushi Place Bangkok", 500)]);
    expect(out).toHaveLength(1);
    expect(out[0].reviews).toBe(500);
  });

  it("parse price + คิด distance จาก center พื้นที่", () => {
    const out = clean([mk("Xyz Restaurant", 100, { price: "฿200-600", lat: 13.7451893, lon: 100.5327919 })]);
    expect(out[0].price_min).toBe(200);
    expect(out[0].price_max).toBe(600);
    expect(out[0].distance_m).toBeGreaterThan(0);
    expect(out[0].distance_m).toBeLessThan(400);
  });

  it("price '฿200+' → min เท่านั้น (max null)", () => {
    const out = clean([mk("Open Range Grill", 100, { price: "฿200+" })]);
    expect(out[0].price_min).toBe(200);
    expect(out[0].price_max).toBeNull();
  });
});
