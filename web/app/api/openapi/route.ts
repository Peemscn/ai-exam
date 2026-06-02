export const runtime = "nodejs";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "AI Exam Lab API",
    version: "1.0.0",
    description: "REST API รวม 3 โจทย์ — Turso-backed · pino logged · rate-limited · server-side pagination",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/restaurants": {
      get: {
        summary: "ร้านอาหาร (server-side pagination)",
        tags: ["q3 food"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "ค้นหา name/category/address" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["total", "rating", "dist", "reviews"], default: "total" } },
        ],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PagedRestaurants" } } } } },
      },
    },
    "/api/feedback": {
      get: {
        summary: "feedback — list (pagination) หรือ aggregate (?by=)",
        tags: ["q1 feedback"],
        parameters: [
          { name: "by", in: "query", schema: { type: "string", enum: ["category", "sentiment", "priority", "suggested_owner"] }, description: "aggregate GROUP BY (ถ้าใส่)" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "sentiment", in: "query", schema: { type: "string", enum: ["Negative", "Neutral", "Positive"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["High", "Medium", "Low"] } },
        ],
        responses: { "200": { description: "list หรือ { by, groups } (aggregate)" } },
      },
    },
    "/api/gacha": {
      get: { summary: "10 gacha session ล่าสุด (Monte Carlo)", tags: ["q2 gacha"], responses: { "200": { description: "{ sessions }" } } },
      post: {
        summary: "บันทึกผล Monte Carlo session",
        tags: ["q2 gacha"],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/GachaSession" } } } },
        responses: { "200": { description: "{ ok }" } },
      },
    },
    "/api/ask": {
      post: {
        summary: "ถาม Claude แนะนำร้าน — rate limit 20/นาที/IP",
        tags: ["q3 food", "AI"],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { question: { type: "string" }, apiKey: { type: "string", description: "Anthropic key (user ใส่เอง)" } }, required: ["question"] } } } },
        responses: { "200": { description: "{ answer }" }, "401": { description: "ไม่มี key" }, "429": { description: "rate limited" } },
      },
    },
    "/api/scrape": {
      post: { summary: "re-scrape (local = scrape จริง · production = trigger CI)", tags: ["q3 food"], responses: { "200": { description: "{ ok, msg }" }, "500": { description: "error / ไม่มี config" } } },
    },
  },
  components: {
    schemas: {
      PagedRestaurants: {
        type: "object",
        description: "envelope: { data, meta }",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } },
          meta: {
            type: "object",
            properties: {
              total: { type: "integer" }, page: { type: "integer" }, pages: { type: "integer" },
              source: { type: "string", enum: ["turso", "json"] },
            },
          },
        },
      },
      Restaurant: {
        type: "object",
        properties: {
          name: { type: "string" }, category: { type: "string" }, rating: { type: "number" },
          reviews: { type: "integer" }, price_text: { type: "string" }, distance_m: { type: "integer" },
          total: { type: "number" }, rank: { type: "integer" },
        },
      },
      GachaSession: {
        type: "object",
        properties: { pulls: { type: "integer" }, ssr_rate: { type: "number" }, spent: { type: "integer" }, config: { type: "string" } },
      },
    },
  },
};

// GET /api/openapi → OpenAPI 3.1 spec (ใช้โดย Swagger UI ที่ /api-docs)
export async function GET() {
  return Response.json(spec);
}
