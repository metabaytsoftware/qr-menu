"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchCategories, createCategory, updateCategory, deleteCategory,
} from "@/lib/api";
import type { AdminCategory, AdminProduct } from "@/types";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <input
        {...props}
        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all"
      />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
      />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ categories }: { categories: AdminCategory[] }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", imageUrl: "" });

  const load = useCallback(async () => {
    try {
      const venueId = localStorage.getItem("venueId") || "night-city-gaming";
      setProducts(await fetchProducts(venueId));
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setForm({ name: "", description: "", price: "", categoryId: categories[0]?.id ?? "", imageUrl: "" });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: AdminProduct) => {
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), categoryId: p.categoryId, imageUrl: p.imageUrl ?? "" });
    setEditing(p);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const venueId = localStorage.getItem("venueId") || "night-city-gaming";
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || undefined,
      };
      if (modal === "edit" && editing) {
        const updated = await updateProduct(editing.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createProduct({ ...payload, venueId });
        setProducts((prev) => [...prev, created]);
      }
      setModal(null);
    } catch {
      alert("İşlem başarısız. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: AdminProduct) => {
    try {
      const updated = await updateProduct(p.id, { isActive: !p.isActive });
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      alert("Durum güncellenemedi.");
    }
  };

  const handleDelete = async (p: AdminProduct) => {
    if (!confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch {
      alert("Ürün silinemedi.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-sm">{products.length} ürün</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ürün Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`bg-zinc-900/50 border rounded-3xl p-5 transition-all ${p.isActive ? "border-white/5 hover:border-blue-500/20" : "border-white/5 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{p.name}</h3>
                  <p className="text-blue-500 text-xs font-bold mt-0.5">{p.category.name}</p>
                </div>
                <span className="text-lg font-black text-white ml-2">₺{Number(p.price).toFixed(2)}</span>
              </div>
              {p.description && <p className="text-zinc-500 text-xs line-clamp-2 mb-4">{p.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => void handleToggle(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${p.isActive ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20" : "bg-zinc-800 text-zinc-400 border-white/5 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20"}`}
                >
                  {p.isActive ? "Mevcut" : "Tükendi"}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all border border-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => void handleDelete(p)} className="p-2 bg-zinc-800 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all border border-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 py-20 text-center text-zinc-600">
              <p className="text-4xl mb-3">🍔</p>
              <p>Henüz ürün yok. İlk ürünü ekleyin.</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === "edit" ? "Ürünü Düzenle" : "Yeni Ürün"} onClose={() => setModal(null)}>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input label="Ürün Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Gamer Burger" />
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Fiyat (₺)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="89.90" />
            <Textarea label="Açıklama (isteğe bağlı)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ürün hakkında kısa bir açıklama..." />
            <Input label="Görsel URL (isteğe bağlı)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold transition-all">İptal</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-3 rounded-2xl font-bold transition-all">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories, onReload }: { categories: AdminCategory[]; onReload: () => void }) {
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", sortOrder: "0" });

  const openCreate = () => {
    setForm({ name: "", sortOrder: String(categories.length) });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (c: AdminCategory) => {
    setForm({ name: c.name, sortOrder: String(c.sortOrder) });
    setEditing(c);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const venueId = localStorage.getItem("venueId") || "night-city-gaming";
      const payload = { name: form.name, sortOrder: parseInt(form.sortOrder) };
      if (modal === "edit" && editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory({ ...payload, venueId });
      }
      setModal(null);
      onReload();
    } catch {
      alert("İşlem başarısız. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: AdminCategory) => {
    try {
      await updateCategory(c.id, { isActive: !c.isActive });
      onReload();
    } catch {
      alert("Durum güncellenemedi.");
    }
  };

  const handleDelete = async (c: AdminCategory) => {
    if (c._count.products > 0) {
      alert(`Bu kategoride ${c._count.products} ürün var. Önce ürünleri silin veya taşıyın.`);
      return;
    }
    if (!confirm(`"${c.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteCategory(c.id);
      onReload();
    } catch {
      alert("Kategori silinemedi.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-sm">{categories.length} kategori</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Kategori Ekle
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
          {categories.length === 0 ? (
            <div className="py-20 text-center text-zinc-600">
              <p className="text-4xl mb-3">📂</p>
              <p>Henüz kategori yok. İlk kategoriyi ekleyin.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">Sıra</th>
                  <th className="px-6 py-4 font-bold">Kategori Adı</th>
                  <th className="px-6 py-4 font-bold">Ürün Sayısı</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                    <td className="px-6 py-4 text-zinc-500 font-mono">{c.sortOrder}</td>
                    <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{c._count.products} ürün</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => void handleToggle(c)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${c.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-zinc-800 text-zinc-500 border-white/5"}`}
                      >
                        {c.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all border border-white/5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => void handleDelete(c)} className="p-2 bg-zinc-800 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all border border-white/5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === "edit" ? "Kategoriyi Düzenle" : "Yeni Kategori"} onClose={() => setModal(null)}>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input label="Kategori Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Burgerler" />
            <Input label="Sıra No" type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} required />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl font-bold transition-all">İptal</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-3 rounded-2xl font-bold transition-all">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const venueId = localStorage.getItem("venueId") || "night-city-gaming";
      setCategories(await fetchCategories(venueId));
    } catch {
      console.error("Failed to load categories");
    }
  }, []);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menü Yönetimi</h1>
          <p className="text-zinc-500 mt-1">Ürünlerinizi ve kategorilerinizi yönetin.</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setTab("products")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === "products" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
          >
            Ürünler
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === "categories" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
          >
            Kategoriler
          </button>
        </div>
      </div>

      {tab === "products"
        ? <ProductsTab categories={categories} />
        : <CategoriesTab categories={categories} onReload={loadCategories} />
      }

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
