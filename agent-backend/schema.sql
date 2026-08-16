CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  role TEXT, -- 'user' atau 'ai'
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  shopee_url TEXT NOT NULL,
  keywords TEXT NOT NULL, -- comma-separated keywords, e.g. "ulat,hama,daun berlubang"
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default configuration values
INSERT OR IGNORE INTO agent_config (key, value) VALUES
  ('agent_name', 'PlantGuard AI'),
  ('model_name', 'gemini-2.5-flash'),
  ('temperature', '0.7'),
  ('system_prompt', 'Kamu adalah ahli pertanian dan fitopatologi bernama PlantGuard AI. Tugasmu adalah menganalisis gambar tanaman untuk mendeteksi hama dan penyakit, lalu memberikan saran penanganan. Selalu jawab dalam Bahasa Indonesia.');