export async function getAgentConfig(db: D1Database): Promise<Record<string, string>> {
  const rows = await db.prepare('SELECT key, value FROM agent_config').all()
  const config: Record<string, string> = {}
  for (const row of rows.results ?? []) {
    config[(row as any).key] = (row as any).value
  }
  return config
}

export async function setAgentConfig(db: D1Database, key: string, value: string): Promise<void> {
  const exists = await db.prepare('SELECT key FROM agent_config WHERE key = ?').bind(key).first()
  if (exists) {
    await db.prepare('UPDATE agent_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
      .bind(value, key).run()
  } else {
    await db.prepare('INSERT INTO agent_config (key, value) VALUES (?, ?)')
      .bind(key, value).run()
  }
}

export async function saveChatMessage(db: D1Database, sessionId: string, role: string, message: string): Promise<void> {
  await db.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
    .bind(sessionId, role, message).run()
}

export async function getChatHistory(db: D1Database, sessionId: string): Promise<any[]> {
  const { results } = await db.prepare(
    'SELECT role, message, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC'
  ).bind(sessionId).all()
  return results
}
