export type Scores = {
  rating_review: number;
  group_suitability: number;
  price_suitability: number;
  travel_convenience: number;
  data_completeness: number;
  uniqueness: number;
};

export type Restaurant = {
  rank: number;
  name: string;
  area: string;
  category: string;
  cuisine_osm: string | null;
  rating: number;
  reviews: number;
  price_text: string;
  price_min: number | null;
  price_max: number | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  distance_m: number | null;
  hours: string | null;
  website: string | null;
  source_maps: string;
  matched_osm: boolean;
  scores: Scores;
  total: number;
};

export const SCORING: { label: string; key: keyof Scores; weight: number }[] = [
  { label: "Rating & Review", key: "rating_review", weight: 25 },
  { label: "Group Suitability", key: "group_suitability", weight: 20 },
  { label: "Price Suitability", key: "price_suitability", weight: 15 },
  { label: "Travel Convenience", key: "travel_convenience", weight: 15 },
  { label: "Data Completeness", key: "data_completeness", weight: 15 },
  { label: "Uniqueness", key: "uniqueness", weight: 10 },
];

// ---------- q1 feedback ----------
export type Feedback = {
  feedback_id: string;
  sentiment: string;
  category: string;
  priority: string;
  ai_summary: string;
  suggested_owner: string;
  confidence: string;
  review_note: string;
  matched_theme: string;
};

type NP = { n: number; pct: number };
export type Insights = {
  total: number;
  sentiment: Record<string, NP>;
  category: Record<string, NP>;
  priority: Record<string, NP>;
  owner: Record<string, number>;
  segments: Record<string, number>;
  top_issues: { theme: string; count: number; category: string; sentiment: string; summary: string }[];
  high_priority_total: number;
  high_priority_by_category: Record<string, number>;
  segment_sentiment: Record<string, { total: number; Negative: number; Neutral: number; Positive: number; neg_pct: number }>;
  risk_revenue: { total_negative_monetization: number; from_paying_segments: number; whale_monetization_neg: number };
  risk_retention: { new_returning_negative: number; new_returning_total: number };
  opportunity_positive: { theme: string; count: number }[];
};
