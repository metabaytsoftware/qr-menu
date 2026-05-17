"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTariffs, createTariff, updateTariff, deleteTariff } from "@/lib/api";
import type { Tariff, StationType } from "@/types";

const STATION_TYPES: { value: StationType; label: string; icon: string }[] = [
  { value: "PLAYSTATION", label: "PlayStation", icon: "🎮" },
  { value: "TABLE", label: "Masa", icon: "🪑" },
  { value: "BAR", label: "Bar", icon: "🍺" },
  { value: "BOOTH", label: "Kabin", icon: "🏠" },
  { value: "OTHER", label: "Diğer", icon: "📍" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i.toString().padStart(2, "0")}:00` }));

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    stationType: "TABLE" as StationType,
    ratePerHour: "",
    peakHourStart: "",
    peakHourEnd: "",
    peakRate: "",
  });

  const venueId =
    typeof window !== "undefined"
      ? localStorage.getItem("venueId") ?? ""
      : "";

  const load = useCallback(async () => {
    try {
      const data = await fetchTariffs(venueId);
      setTariffs(data);
    } catch {
      console.error("Failed to load tariffs");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ name: "", stationType: "TABLE", ratePerHour: "", peakHourStart: "", peakHourEnd: "", peakRate: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      venueId,
      name: form.name,
      stationType: form.stationType,
      ratePerHour: parseFloat(form.ratePerHour),
      peakHourStart: form.peakHourStart ? parseInt(form.peakHourStart) : undefined,
      peakHourEnd: form.peakHourEnd ? parseInt(form.peakHourEnd) : undefined,
      peakRate: form.peakRate ? parseFloat(form.peakRate) : undefined,
    };
    try {
      if (editingId) {
        await updateTariff(editingId, payload);
      } else {
        await createTariff(payload);
      }
      resetForm();
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (t: Tariff) => {
    setForm({
      name: t.name,
      stationType: t.stationType,
      ratePerHour: String(t.ratePerHour),
      peakHourStart: t.peakHourStart !== null ? String(t.peakHourStart) : "",
      peakHourEnd: t.peakHourEnd !== null ? String(t.peakHourEnd) : "",
      peakRate: t.peakRate !== null ? String(t.peakRate) : "",
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu tarifyi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteTariff(id);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const stIcon = (t: StationType) => STATION_TYPES.find((s) => s.value === t)?.icon ?? "📍";
  const stLabel = (t: StationType) => STATION_TYPES.find((s) => s.value === t)?.label ?? t;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tarife Yönetimi</h2>
          <p className="text-zinc-500 text-sm mt-1">Saatlik ücret kuralları ve zirve saatler</p>
        </div>
        <button
          id="add-tariff-btn"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all"
        >
          + Yeni Tarife
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-4">{editingId ? "Tarife Düzenle" : "Yeni Tarife Ekle"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tarife Adı</label>
                <input
                  id="tariff-name-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Örn: Hafta Sonu, Standart"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">İstasyon Türü</label>
                <select
                  id="tariff-type-select"
                  value={form.stationType}
                  onChange={(e) => setForm((f) => ({ ...f, stationType: e.target.value as StationType }))}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  {STATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Normal Ücret (₺/saat)</label>
                <input
                  id="tariff-rate-input"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.ratePerHour}
                  onChange={(e) => setForm((f) => ({ ...f, ratePerHour: e.target.value }))}
                  placeholder="50.00"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <p className="text-xs text-zinc-400 mb-3 font-medium">Zirve Saat (Opsiyonel)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Başlangıç Saati</label>
                  <select
                    id="peak-start-select"
                    value={form.peakHourStart}
                    onChange={(e) => setForm((f) => ({ ...f, peakHourStart: e.target.value }))}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Yok</option>
                    {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Bitiş Saati</label>
                  <select
                    id="peak-end-select"
                    value={form.peakHourEnd}
                    onChange={(e) => setForm((f) => ({ ...f, peakHourEnd: e.target.value }))}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Yok</option>
                    {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Zirve Ücret (₺/saat)</label>
                  <input
                    id="peak-rate-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.peakRate}
                    onChange={(e) => setForm((f) => ({ ...f, peakRate: e.target.value }))}
                    placeholder="75.00"
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold transition-all">
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
        <div className="space-y-3">
          {tariffs.map((tariff) => (
            <div key={tariff.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all">
              <span className="text-2xl">{stIcon(tariff.stationType)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{tariff.name}</p>
                  <span className="text-xs text-zinc-500">— {stLabel(tariff.stationType)}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-purple-400 font-bold">₺{Number(tariff.ratePerHour).toFixed(2)}/saat</span>
                  {tariff.peakRate && tariff.peakHourStart !== null && (
                    <span className="text-xs text-orange-400">
                      Zirve {tariff.peakHourStart}:00–{tariff.peakHourEnd}:00 → ₺{Number(tariff.peakRate).toFixed(2)}/saat
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(tariff)} className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all">
                  Düzenle
                </button>
                <button onClick={() => handleDelete(tariff.id)} className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                  Sil
                </button>
              </div>
            </div>
          ))}
          {tariffs.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-4xl mb-3">💰</p>
              <p>Henüz tarife yok. İlk tarifeyi oluşturun.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
