-- Cloudflare D1 (SQLite) 資料庫結構定義

DROP TABLE IF EXISTS videos;
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  platform TEXT NOT NULL,
  youtubeId TEXT,
  url TEXT NOT NULL,
  duration TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  tags TEXT NOT NULL, -- 以 JSON 陣列儲存 (例如: ["Embouchure", "Wedge"])
  notes TEXT NOT NULL, -- 以 JSON 陣列儲存 (例如: [{"time":"01:20", "timestamp":80, "title":"...", "content":"..."}])
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS concepts;
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
