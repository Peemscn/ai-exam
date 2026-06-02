-- AI Exam Lab — Turso (libSQL / SQLite) schema
-- q3 restaurants · q1 feedback · q2 gacha_sessions · q3 scrape_runs

CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  area TEXT,
  category TEXT,
  cuisine_osm TEXT,
  rating REAL,
  reviews INTEGER,
  price_text TEXT,
  price_min INTEGER,
  price_max INTEGER,
  address TEXT,
  lat REAL,
  lon REAL,
  distance_m INTEGER,
  hours TEXT,
  website TEXT,
  source_maps TEXT,
  matched_osm INTEGER,
  score_rating_review REAL,
  score_group REAL,
  score_price REAL,
  score_travel REAL,
  score_data REAL,
  score_unique REAL,
  total REAL,
  rank INTEGER
);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id TEXT PRIMARY KEY,
  sentiment TEXT,
  category TEXT,
  priority TEXT,
  suggested_owner TEXT,
  confidence TEXT,
  matched_theme TEXT,
  ai_summary TEXT
);

CREATE TABLE IF NOT EXISTS gacha_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  pulls INTEGER,
  ssr_count INTEGER,
  sr_count INTEGER,
  r_count INTEGER,
  ssr_rate REAL,
  pity INTEGER,
  spent INTEGER,
  config TEXT
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at TEXT DEFAULT CURRENT_TIMESTAMP,
  source TEXT,
  count INTEGER,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_restaurants_total ON restaurants(total DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
