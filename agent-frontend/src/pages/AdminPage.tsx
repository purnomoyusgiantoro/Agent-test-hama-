import { useState, useEffect, useRef } from 'react'
import { Leaf, Save, LogOut, MessageSquare, Settings, ChevronLeft, Loader2, Package, Plus, Pencil, Trash2, X, ExternalLink, UploadCloud, Download } from 'lucide-react'

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

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  shopee_url: string;
  keywords: string;
  is_active: number;
}

const emptyProduct = { name: '', price: 0, image_url: '', shopee_url: '', keywords: '', is_active: 1 }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'history' | 'products'>('config')
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

  // Product state
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isUploadingCSV, setIsUploadingCSV] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

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

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.products) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn && activeTab === 'products') {
      fetchProducts()
    }
  }, [isLoggedIn, activeTab])

  // ── CSV Import ──
  const handleDownloadTemplate = () => {
    const csvContent = "name,price,image_url,shopee_url,keywords\nNama Produk Contoh,85000,https://...,https://shopee.co.id/...,\"ulat,hama,daun\"\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "template_produk.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCSV(true)
    try {
      const text = await file.text()
      // Basic CSV parser (handles simple cases, assuming keywords might be quoted if they contain commas)
      const rows = text.split('\n').filter(row => row.trim().length > 0)
      if (rows.length <= 1) throw new Error('File CSV kosong atau tidak valid')

      // Skip header
      const productsToInsert = []
      for (let i = 1; i < rows.length; i++) {
        // Regex to split by comma but ignore commas inside quotes
        const match = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        if (!match || match.length < 5) continue
        
        const cols = match.map(c => c.replace(/^"|"$/g, '').trim())
        
        productsToInsert.push({
          name: cols[0],
          price: parseInt(cols[1].replace(/\D/g, '')) || 0,
          image_url: cols[2],
          shopee_url: cols[3],
          keywords: cols[4] || cols.slice(4).join(','), // fallback if split incorrectly
          is_active: 1
        })
      }

      if (productsToInsert.length === 0) {
        alert('Tidak ada data produk yang valid untuk diimport.')
        return
      }

      const res = await fetch(`${API_URL}/api/admin/products/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ products: productsToInsert })
      })
      
      const data = await res.json()
      if (data.success) {
        alert(`Berhasil mengimport ${data.inserted} produk!`)
        fetchProducts() // Refresh list
      } else {
        alert(data.error || 'Gagal mengimport CSV')
      }
    } catch (err: any) {
      alert('Error membaca file: ' + err.message)
    } finally {
      setIsUploadingCSV(false)
      if (csvInputRef.current) csvInputRef.current.value = ''
    }
  }

  // ── Login Screen ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-white border border-border shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
              <Leaf size={28} />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1.5">PlantGuard AI</p>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            />
            {loginError && (
              <p className="text-red-500 text-sm mt-3 text-center">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full mt-6 bg-foreground text-background shadow-sm font-medium py-3 rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Masuk
            </button>
          </div>

          <a href="/" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-8 transition-colors">
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
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'config' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings size={16} /> Konfigurasi
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'products' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package size={16} /> Produk
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare size={16} /> Riwayat
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

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg font-display font-bold text-foreground">Kelola Produk Shopee</h2>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm"
                  title="Download template CSV"
                >
                  <Download size={16} /> Template CSV
                </button>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={csvInputRef} 
                  onChange={handleImportCSV} 
                />
                <button
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isUploadingCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50"
                  title="Upload CSV massal"
                >
                  {isUploadingCSV ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Import CSV
                </button>

                <button
                  onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm(emptyProduct) }}
                  className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors shadow-sm"
                >
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                  <button onClick={() => setShowProductForm(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nama Produk</label>
                    <input
                      value={productForm.name}
                      onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Pestisida XYZ 500ml"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Harga (Rp)</label>
                    <input
                      type="number"
                      value={productForm.price || ''}
                      onChange={e => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                      placeholder="85000"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">URL Gambar</label>
                    <input
                      value={productForm.image_url}
                      onChange={e => setProductForm(p => ({ ...p, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">URL Shopee</label>
                    <input
                      value={productForm.shopee_url}
                      onChange={e => setProductForm(p => ({ ...p, shopee_url: e.target.value }))}
                      placeholder="https://shopee.co.id/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Kata Kunci <span className="text-muted-foreground font-normal">(pisahkan dengan koma)</span></label>
                    <input
                      value={productForm.keywords}
                      onChange={e => setProductForm(p => ({ ...p, keywords: e.target.value }))}
                      placeholder="ulat, hama, daun berlubang, kutu daun"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-slate-50 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Produk akan muncul di chat jika kata kunci ini ditemukan dalam jawaban AI.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowProductForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      setIsSavingProduct(true)
                      try {
                        const url = editingProduct
                          ? `${API_URL}/api/admin/products/${editingProduct.id}`
                          : `${API_URL}/api/admin/products`
                        const method = editingProduct ? 'PUT' : 'POST'
                        await fetch(url, {
                          method,
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify(productForm)
                        })
                        setShowProductForm(false)
                        setEditingProduct(null)
                        setProductForm(emptyProduct)
                        // Refresh products
                        const res = await fetch(`${API_URL}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
                        const data = await res.json()
                        if (data.success) setProducts(data.products)
                      } catch (err) {
                        console.error(err)
                      } finally {
                        setIsSavingProduct(false)
                      }
                    }}
                    disabled={!productForm.name || !productForm.shopee_url || !productForm.keywords || isSavingProduct}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSavingProduct ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                </div>
              </div>
            )}

            {/* Product List */}
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada produk. Klik "Tambah Produk" untuk mulai.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white border border-border rounded-2xl p-4 flex gap-4 items-start hover:shadow-sm transition-shadow">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="10">No Img</text></svg>' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-foreground text-sm truncate">{product.name}</h4>
                          <p className="text-sm font-bold text-orange-600 mt-0.5">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditingProduct(product); setProductForm(product); setShowProductForm(true) }}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Hapus produk ini?')) return
                              await fetch(`${API_URL}/api/admin/products/${product.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              })
                              setProducts(prev => prev.filter(p => p.id !== product.id))
                            }}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {product.keywords.split(',').map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded-full">{kw.trim()}</span>
                        ))}
                      </div>
                      <a href={product.shopee_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 mt-2 transition-colors">
                        <ExternalLink size={11} /> Buka di Shopee
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
