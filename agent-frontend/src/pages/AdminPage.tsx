import { useState, useEffect } from 'react'
import { Leaf, Save, LogOut, MessageSquare, Settings, ChevronLeft, Loader2 } from 'lucide-react'

interface AgentConfig {
  agent_name: string;
  system_prompt: string;
  model_name: string;
  temperature: string;
}

interface ChatHistoryItem {
  id: number;
  session_id: string;
  role: string;
  message: string;
  created_at: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config')
  const [config, setConfig] = useState<AgentConfig>({
    agent_name: 'PlantGuard AI',
    system_prompt: '',
    model_name: 'gemini-2.5-flash',
    temperature: '0.7'
  })
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

  const handleLogin = async () => {
    setLoginError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToken(data.token)
        setIsLoggedIn(true)
      } else {
        setLoginError(data.error || 'Login gagal')
      }
    } catch {
      setLoginError('Tidak dapat terhubung ke server')
    }
  }

  const fetchConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.config) {
        setConfig({
          agent_name: data.config.agent_name || 'PlantGuard AI',
          system_prompt: data.config.system_prompt || '',
          model_name: data.config.model_name || 'gemini-2.5-flash',
          temperature: data.config.temperature || '0.7'
        })
      }
    } catch (err) {
      console.error('Failed to fetch config:', err)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const fetchHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.history) {
        setHistory(data.history)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchConfig()
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn && activeTab === 'history') {
      fetchHistory()
    }
  }, [isLoggedIn, activeTab])

  // ── Login Screen ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <Leaf size={28} />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">PlantGuard AI</p>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Masukkan password admin"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {loginError && (
              <p className="text-red-600 text-sm mt-2">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full mt-4 bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Masuk
            </button>
          </div>

          <a href="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
            <ChevronLeft size={16} /> Kembali ke Chat
          </a>
        </div>
      </div>
    )
  }

  // ── Admin Dashboard ──
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Leaf size={24} className="text-primary" />
          <h1 className="text-lg font-display font-bold text-foreground">PlantGuard AI <span className="text-muted-foreground font-normal text-sm">Admin</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Chat</a>
          <button
            onClick={() => { setIsLoggedIn(false); setToken(''); setPassword('') }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-600 transition-colors"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'config' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings size={16} /> Konfigurasi Agent
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare size={16} /> Riwayat Chat
          </button>
        </div>

        {/* ── Config Tab ── */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Agent Name */}
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Nama Agent</label>
                  <input
                    type="text"
                    value={config.agent_name}
                    onChange={e => setConfig({ ...config, agent_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Model & Temperature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                    <label className="block text-sm font-medium text-foreground mb-2">Model AI</label>
                    <select
                      value={config.model_name}
                      onChange={e => setConfig({ ...config, model_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Cepat)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Akurat)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Hemat)</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Temperature: {config.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={e => setConfig({ ...config, temperature: e.target.value })}
                      className="w-full accent-primary mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Fokus (0)</span>
                      <span>Kreatif (1)</span>
                    </div>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                  <label className="block text-sm font-medium text-foreground mb-2">System Prompt</label>
                  <p className="text-xs text-muted-foreground mb-3">Instruksi ini menentukan bagaimana agent merespons. Tulis dalam bahasa yang jelas dan spesifik.</p>
                  <textarea
                    value={config.system_prompt}
                    onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y font-mono text-sm"
                  />
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3">
                  {saveSuccess && (
                    <span className="text-sm text-primary font-medium">Tersimpan!</span>
                  )}
                  <button
                    onClick={saveConfig}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Simpan Perubahan
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Belum ada riwayat chat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Session</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pesan</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{item.id}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.session_id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-secondary/30 text-secondary-foreground'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{item.message}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{item.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
