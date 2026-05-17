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

const DEFAULT_TYPES: { value: StationType; label: string; icon: string }[] = [
  { value: "PLAYSTATION", label: "PlayStation", icon: "🎮" },
  { value: "TABLE", label: "Masa", icon: "🪑" },
  { value: "BAR", label: "Bar", icon: "🍺" },
  { value: "BOOTH", label: "Kabin", icon: "🏠" },
  { value: "OTHER", label: "Diğer", icon: "📍" },
];

export default function StationsPage() {
  const [activeTab, setActiveTab] = useState<"stations" | "types">("stations");
  const [stationTypes, setStationTypes] = useState(DEFAULT_TYPES);
  const [editingType, setEditingType] = useState<StationType | null>(null);
  const [typeForm, setTypeForm] = useState({ label: "", icon: "" });
  const [savingType, setSavingType] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({ label: "", icon: "📍" });
  const [savingNewType, setSavingNewType] = useState(false);
  const [customTypes, setCustomTypes] = useState<{ id: string; label: string; icon: string }[]>([]);

  const typeIcon = (t: StationType) => stationTypes.find((s) => s.value === t)?.icon ?? "📍";
  const typeLabel = (t: StationType) => stationTypes.find((s) => s.value === t)?.label ?? t;
  const STATION_TYPES = stationTypes;
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    stationType: "TABLE" as StationType,
    hourlyRate: "",
    customTypeId: "",
  });
  const [selectedQr, setSelectedQr] = useState<Station | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [venueId, setVenueId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("venueId") ?? "";
    // Accept any non-empty stored venueId (cuid format, not the legacy hardcoded value)
    if (stored && stored.length > 10) {
      setVenueId(stored);
      return;
    }
    fetch("/api/venues")
      .then((r) => r.json())
      .then((venues: { id: string }[]) => {
        if (venues?.[0]?.id) {
          localStorage.setItem("venueId", venues[0].id);
          setVenueId(venues[0].id);
        }
      })
      .catch(() => {});
  }, []);

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

  // Load station type labels and custom types from venue config
  useEffect(() => {
    if (!venueId) return;
    fetch(`/api/venues/${venueId}`)
      .then((r) => r.json())
      .then((venue) => {
        const labels = venue?.config?.stationTypeLabels as Record<string, { label: string; icon: string }> | undefined;
        if (labels) {
          setStationTypes(DEFAULT_TYPES.map((t) => ({
            ...t,
            label: labels[t.value]?.label ?? t.label,
            icon: labels[t.value]?.icon ?? t.icon,
          })));
        }
        const custom = venue?.config?.customStationTypes as { id: string; label: string; icon: string }[] | undefined;
        if (custom) setCustomTypes(custom);
      })
      .catch(() => {});
  }, [venueId]);

  const saveTypeLabel = async () => {
    if (!editingType || !venueId) return;
    setSavingType(true);
    try {
      const current = stationTypes.reduce((acc, t) => ({ ...acc, [t.value]: { label: t.label, icon: t.icon } }), {} as Record<string, { label: string; icon: string }>);
      current[editingType] = { label: typeForm.label, icon: typeForm.icon };
      await fetch(`/api/venues/${venueId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationTypeLabels: current }),
      });
      setStationTypes((prev) => prev.map((t) => t.value === editingType ? { ...t, label: typeForm.label, icon: typeForm.icon } : t));
      setEditingType(null);
    } catch {
      alert("Kaydedilemedi.");
    } finally {
      setSavingType(false);
    }
  };

  const saveNewCustomType = async () => {
    if (!newTypeForm.label.trim() || !venueId) return;
    setSavingNewType(true);
    try {
      const newEntry = { id: `custom_${Date.now()}`, label: newTypeForm.label.trim(), icon: newTypeForm.icon || "📍" };
      const updated = [...customTypes, newEntry];
      await fetch(`/api/venues/${venueId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customStationTypes: updated }),
      });
      setCustomTypes(updated);
      setNewTypeForm({ label: "", icon: "📍" });
      setShowNewTypeForm(false);
    } catch {
      alert("Kaydedilemedi.");
    } finally {
      setSavingNewType(false);
    }
  };

  const deleteCustomType = async (id: string) => {
    if (!confirm("Bu özel türü silmek istediğinize emin misiniz?")) return;
    const updated = customTypes.filter((t) => t.id !== id);
    try {
      await fetch(`/api/venues/${venueId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customStationTypes: updated }),
      });
      setCustomTypes(updated);
    } catch {
      alert("Silinemedi.");
    }
  };

  const resetForm = () => {
    setForm({ name: "", stationType: "TABLE", hourlyRate: "", customTypeId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If a custom type is selected, use OTHER as the DB enum value
    const effectiveType = form.customTypeId ? "OTHER" as StationType : form.stationType;
    const payload = {
      venueId,
      name: form.name,
      stationType: effectiveType,
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
      customTypeId: "",
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
          {activeTab === "stations" && (
            <button
              id="add-station-btn"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
            >
              + Yeni İstasyon
            </button>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {[
            { key: "stations", label: "İstasyonlar" },
            { key: "types", label: "Tür Yapılandırması" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "stations" | "types")}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-blue-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Station types tab */}
        {activeTab === "types" && (
          <div className="space-y-4">
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-zinc-300">Sistem Türleri</p>
                <p className="text-xs text-zinc-500">Görünen ad ve ikonu özelleştirin</p>
              </div>
              {stationTypes.map((t) => (
                <div key={t.value} className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4">
                  {editingType === t.value ? (
                    <>
                      <input
                        value={typeForm.icon}
                        onChange={(e) => setTypeForm((f) => ({ ...f, icon: e.target.value }))}
                        className="w-14 bg-zinc-700 border border-white/10 rounded-lg px-2 py-1.5 text-center text-lg focus:outline-none focus:border-blue-500"
                        placeholder="🎮"
                      />
                      <input
                        value={typeForm.label}
                        onChange={(e) => setTypeForm((f) => ({ ...f, label: e.target.value }))}
                        className="flex-1 bg-zinc-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button onClick={saveTypeLabel} disabled={savingType} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold disabled:opacity-50">
                        {savingType ? "..." : "Kaydet"}
                      </button>
                      <button onClick={() => setEditingType(null)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-bold">İptal</button>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl w-10 text-center">{t.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{t.label}</p>
                        <p className="text-xs text-zinc-500 font-mono">{t.value}</p>
                      </div>
                      <button
                        onClick={() => { setEditingType(t.value); setTypeForm({ label: t.label, icon: t.icon }); }}
                        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-bold"
                      >
                        Düzenle
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Custom types section */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-zinc-300">Özel Türler</p>
                  <p className="text-xs text-zinc-500 mt-0.5">İstasyon oluştururken seçilebilir özel kategoriler</p>
                </div>
                {!showNewTypeForm && (
                  <button
                    onClick={() => setShowNewTypeForm(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all"
                  >
                    + Yeni Tür Ekle
                  </button>
                )}
              </div>

              {showNewTypeForm && (
                <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                  <input
                    value={newTypeForm.icon}
                    onChange={(e) => setNewTypeForm((f) => ({ ...f, icon: e.target.value }))}
                    className="w-14 bg-zinc-700 border border-white/10 rounded-lg px-2 py-1.5 text-center text-lg focus:outline-none focus:border-blue-500"
                    placeholder="📍"
                  />
                  <input
                    value={newTypeForm.label}
                    onChange={(e) => setNewTypeForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Tür adı (örn: VR Odası, Bilardo)"
                    className="flex-1 bg-zinc-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={saveNewCustomType} disabled={savingNewType || !newTypeForm.label.trim()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold disabled:opacity-50">
                    {savingNewType ? "..." : "Ekle"}
                  </button>
                  <button onClick={() => { setShowNewTypeForm(false); setNewTypeForm({ label: "", icon: "📍" }); }} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-bold">İptal</button>
                </div>
              )}

              {customTypes.length === 0 && !showNewTypeForm && (
                <div className="text-center py-6 text-zinc-600 text-sm">Henüz özel tür yok. &quot;+ Yeni Tür Ekle&quot; ile başlayın.</div>
              )}

              {customTypes.map((t) => (
                <div key={t.id} className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4">
                  <span className="text-2xl w-10 text-center">{t.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{t.label}</p>
                    <p className="text-xs text-zinc-500 font-mono">{t.id}</p>
                  </div>
                  <button
                    onClick={() => deleteCustomType(t.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold"
                  >
                    🗑 Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "stations" && (<>

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
                  value={form.customTypeId ? `custom:${form.customTypeId}` : form.stationType}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("custom:")) {
                      setForm((f) => ({ ...f, customTypeId: val.replace("custom:", ""), stationType: "OTHER" as StationType }));
                    } else {
                      setForm((f) => ({ ...f, stationType: val as StationType, customTypeId: "" }));
                    }
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {STATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                  {customTypes.length > 0 && (
                    <optgroup label="Özel Türler">
                      {customTypes.map((t) => (
                        <option key={t.id} value={`custom:${t.id}`}>{t.icon} {t.label}</option>
                      ))}
                    </optgroup>
                  )}
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
        </>)}
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
