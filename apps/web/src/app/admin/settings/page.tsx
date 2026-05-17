"use client";

import { useState, useEffect } from "react";

interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  config: Record<string, unknown> | null;
}

export default function SettingsPage() {
  const [venueId, setVenueId] = useState("");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenMsg, setRegenMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("venueId") ?? "";
    if (stored && stored.length > 10) {
      setVenueId(stored);
    } else {
      fetch("/api/venues")
        .then((r) => r.json())
        .then((venues: { id: string }[]) => {
          if (venues?.[0]?.id) {
            localStorage.setItem("venueId", venues[0].id);
            setVenueId(venues[0].id);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!venueId) return;
    fetch(`/api/venues/${venueId}`)
      .then((r) => r.json())
      .then((v: Venue) => {
        setVenue(v);
        setForm({ name: v.name, slug: v.slug });
      })
      .catch(() => {});
  }, [venueId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, slug: form.slug }),
      });
      if (!res.ok) throw new Error("Kayıt başarısız");
      const updated = await res.json() as Venue;
      setVenue(updated);
      setForm({ name: updated.name, slug: updated.slug });
      setSaveMsg("✅ Değişiklikler kaydedildi. Yeni slug aktif: " + updated.slug);
    } catch {
      setSaveMsg("❌ Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenAllQr = async () => {
    if (!venueId) return;
    if (!confirm("Bu işlem tüm istasyonların QR kodlarını güncel slug ile yeniler. Eski fiziksel QR kodları geçersiz kalır. Emin misiniz?")) return;
    setRegenLoading(true);
    setRegenMsg("");
    try {
      const stRes = await fetch(`/api/stations/venue/${venueId}`);
      const stations = await stRes.json() as { id: string; name: string }[];
      let count = 0;
      for (const station of stations) {
        await fetch(`/api/stations/${station.id}/regenerate-qr`, { method: "POST" });
        count++;
      }
      setRegenMsg(`✅ ${count} istasyonun QR kodu başarıyla yenilendi.`);
    } catch {
      setRegenMsg("❌ QR yenileme sırasında hata oluştu.");
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-zinc-500 mt-1">Mekan bilgilerini ve sistem tercihlerini yapılandırın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">

          {/* Venue Info */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M12 12v4"/><path d="M9 14h6"/></svg>
              </span>
              Mekan Bilgileri
            </h2>

            {!venue ? (
              <div className="text-zinc-500 text-sm">Yükleniyor...</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Mekan Adı</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    QR Ön Eki (Slug)
                    <span className="ml-2 text-zinc-600 normal-case font-normal">— Tüm QR kodlarında kullanılan ön ek</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-xs text-zinc-600 ml-1">
                    Mevcut: <span className="font-mono text-zinc-400">{venue.slug}</span>
                    {form.slug !== venue.slug && (
                      <span className="ml-2 text-yellow-500">⚠ Slug değiştirildi — kaydet ve QR kodlarını yenile</span>
                    )}
                  </p>
                </div>

                {saveMsg && (
                  <p className={`text-sm font-medium px-4 py-2 rounded-xl ${saveMsg.startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {saveMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-bold transition-all"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </form>
            )}
          </section>

          {/* QR Regeneration */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-4 backdrop-blur-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center text-sm">🔄</span>
              QR Kod Yönetimi
            </h2>
            <p className="text-sm text-zinc-400">
              Slug değiştirdiyseniz mevcut istasyonların QR kodları hala eski ön eki içerir. Aşağıdaki buton ile tüm istasyonları tek seferde güncelleyin.
            </p>
            {regenMsg && (
              <p className={`text-sm font-medium px-4 py-2 rounded-xl ${regenMsg.startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                {regenMsg}
              </p>
            )}
            <button
              onClick={handleRegenAllQr}
              disabled={regenLoading}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              {regenLoading ? "Yenileniyor..." : "🔄 Tüm QR Kodlarını Yenile"}
            </button>
            <p className="text-xs text-zinc-600">⚠ Bu işlem sonrası fiziksel olarak basılmış eski QR kodlar geçersiz olur.</p>
          </section>

        </div>

        <div className="space-y-6">
          <section className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20">
            <h3 className="text-xl font-black italic mb-2">QR SYSTEM</h3>
            <p className="text-sm text-white/80 leading-relaxed mb-4">
              Mekanınız aktif. Müşteriler QR kodlarını okutarak direkt masa başından sipariş verebilir.
            </p>
            {venue && (
              <div className="bg-white/10 rounded-2xl px-4 py-3 font-mono text-xs text-white/70 break-all">
                slug: {venue.slug}
              </div>
            )}
          </section>

          <button className="w-full bg-zinc-900 border border-white/5 hover:border-red-500/50 text-zinc-500 hover:text-red-500 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Çıkış Yap
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
