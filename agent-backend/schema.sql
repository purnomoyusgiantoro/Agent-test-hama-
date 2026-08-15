CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  role TEXT, -- 'user' atau 'ai'
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);