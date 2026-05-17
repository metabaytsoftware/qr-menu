"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchStations,
  createStation,
  updateStation,
  deleteStation,
  regenerateStationQr,
} from "@/lib/api";
import type { Station, StationType } from "@/types";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@meta-repo/auth-client";

const STATION_TYPES: { value: StationType; label: string; icon: string }[] = [
  { value: "PLAYSTATION", label: "PlayStation", icon: "🎮" },
  { value: "TABLE", label: "Masa", icon: "🪑" },
  { value: "BAR", label: "Bar", icon: "🍺" },
  { value: "BOOTH", label: "Kabin", icon: "🏠" },
  { value: "OTHER", label: "Diğer", icon: "📍" },
];

const typeIcon = (t: StationType) => STATION_TYPES.find((s) => s.value === t)?.icon ?? "📍";
const typeLabel = (t: StationType) => STATION_TYPES.find((s) => s.value === t)?.label ?? t;

export default function StationsPage() {
  const user = useAuthStore((state) => state.user);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    stationType: "TABLE" as StationType,
    hourlyRate: "",
  });
  const [selectedQr, setSelectedQr] = useState<Station | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const venueId = user?.venueId || (typeof window !== "undefined"
    ? localStorage.getItem("venueId") || "night-city-gaming"
    : "night-city-gaming");

  const load = useCallback(async () => {
    try {
      const data = await fetchStations(venueId);
      setStations(data);
    } catch {
      console.error("Failed to load stations");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ name: "", stationType: "TABLE", hourlyRate: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      venueId,
      name: form.name,
      stationType: form.stationType,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
    };
    try {
      if (editingId) {
        await updateStation(editingId, payload);
      } else {
        await createStation(payload);
      }
      resetForm();
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (s: Station) => {
    setForm({
      name: s.name,
      stationType: s.stationType,
      hourlyRate: s.hourlyRate ? String(s.hourlyRate) : "",
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu istasyonu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteStation(id);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegenQr = async (id: string) => {
    if (!confirm("Bu işlem mevcut fiziksel QR kodunu geçersiz kılacaktır. Emin misiniz?")) return;
    
    setIsRegenerating(true);
    try {
      await regenerateStationQr(id);
      await load();
      // If we are showing this QR in modal, update it
      if (selectedQr?.id === id) {
        const updated = (await fetchStations(venueId)).find(s => s.id === id);
        if (updated) setSelectedQr(updated);
      }
    } catch (err: any) {
      alert("QR Yenileme Hatası: " + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleActive = async (s: Station) => {
    await updateStation(s.id, { isActive: !s.isActive });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">İstasyon Yönetimi</h2>
            <p className="text-zinc-500 text-sm mt-1">Masalar, PlayStation ve diğer alanlar</p>
          </div>
          <button
            id="add-station-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
          >
            + Yeni İstasyon
          </button>
        </div>

        {showForm && (
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4">{editingId ? "İstasyonu Düzenle" : "Yeni İstasyon Ekle"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">İstasyon Adı</label>
                <input
                  id="station-name-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Örn: PS-01, Masa-05"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tür</label>
                <select
                  id="station-type-select"
                  value={form.stationType}
                  onChange={(e) => setForm((f) => ({ ...f, stationType: e.target.value as StationType }))}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {STATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Saatlik Ücret (₺)</label>
                <input
                  id="station-rate-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                  placeholder="Opsiyonel"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all">
                  {editingId ? "Güncelle" : "Ekle"}
                </button>
                <button type="button" onClick={resetForm} className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-bold transition-all">
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-zinc-500">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((station) => (
              <div
                key={station.id}
                className={`bg-zinc-900/50 border rounded-2xl p-5 transition-all ${
                  station.isActive ? "border-white/10 hover:border-white/20" : "border-red-500/20 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcon(station.stationType)}</span>
                    <div>
                      <p className="font-bold">{station.name}</p>
                      <p className="text-xs text-zinc-500">{typeLabel(station.stationType)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold ${station.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {station.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>

                {station.hourlyRate && (
                  <p className="text-sm text-blue-400 font-bold mb-2">₺{Number(station.hourlyRate).toFixed(2)}/saat</p>
                )}

                <p className="text-xs text-zinc-600 font-mono mb-4 truncate">{station.qrCode}</p>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/menu/${station.qrCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-center"
                  >
                    Menü Gör
                  </a>
                  <button
                    onClick={() => handleEdit(station)}
                    className="flex-1 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleToggleActive(station)}
                    className="flex-1 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                  >
                    {station.isActive ? "Devre Dışı" : "Aktifleştir"}
                  </button>
                  <button
                    onClick={() => setSelectedQr(station)}
                    title="QR Kodu Göster"
                    className="py-1.5 px-3 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all"
                  >
                    📷 QR
                  </button>
                  <button
                    onClick={() => handleRegenQr(station.id)}
                    title="QR Yenile"
                    disabled={isRegenerating}
                    className="py-1.5 px-3 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isRegenerating ? "..." : "🔄"}
                  </button>
                  <button
                    onClick={() => handleDelete(station.id)}
                    className="py-1.5 px-3 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {stations.length === 0 && (
              <div className="col-span-3 text-center py-16 text-zinc-500">
                <p className="text-4xl mb-3">🪑</p>
                <p>Henüz istasyon yok. İlk istasyonunuzu ekleyin.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* QR Code Modal */}
      {selectedQr && (
        <>
          {/* Screen Version (Modal) */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:hidden">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl">
              <button 
                onClick={() => setSelectedQr(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-1">{selectedQr.name}</h3>
              <p className="text-zinc-500 text-sm mb-6">{typeLabel(selectedQr.stationType)}</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl">
                <QRCodeSVG 
                  value={`${process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/menu/${selectedQr.qrCode}`} 
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              
              <p className="text-xs font-mono text-zinc-500 mb-6 break-all bg-zinc-800 p-2 rounded-lg">
                {selectedQr.qrCode}
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                >
                  🖨 Yazdır
                </button>
                <button
                  onClick={() => handleRegenQr(selectedQr.id)}
                  disabled={isRegenerating}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isRegenerating ? "Yenileniyor..." : "🔄 QR Kodu Yenile"}
                </button>
              </div>
            </div>
          </div>

          {/* Print Version (Hidden on screen) */}
          <div className="hidden print:block bg-white min-h-screen p-10">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-5xl font-bold mb-12 text-black">{selectedQr.name}</h1>
              <div className="inline-block border-[12px] border-black p-6 bg-white">
                <QRCodeSVG 
                  value={`${process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/menu/${selectedQr.qrCode}`} 
                  size={500}
                  level="H"
                />
              </div>
              <p className="mt-12 text-2xl text-black font-mono font-bold tracking-widest">{selectedQr.qrCode}</p>
              <div className="mt-16 pt-8 border-t border-zinc-200 w-full max-w-md">
                <p className="text-lg text-zinc-500 font-bold uppercase tracking-widest">QR Menü</p>
                <p className="text-sm text-zinc-400 mt-1">{venueId}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
