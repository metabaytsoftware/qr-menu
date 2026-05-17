"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchStations,
  fetchActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  fetchSessionBill,
  addPayment,
  fetchOrders,
} from "@/lib/api";
import type { Station, Session, SessionBill } from "@/types";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function SessionCard({
  station,
  onRefresh,
  venueId,
}: {
  station: Station;
  onRefresh: () => void;
  venueId: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [bill, setBill] = useState<SessionBill | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startForm, setStartForm] = useState({ isBillLess: false, hourlyRate: "" });
  const [showStart, setShowStart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ method: "CASH", amount: "", note: "" });
  const [payError, setPayError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const loadSession = useCallback(async () => {
    try {
      const s = await fetchActiveSession(station.id);
      setSession(s);
      if (s) {
        const b = await fetchSessionBill(s.id);
        setBill(b);
        setElapsed(b.durationSeconds);
      } else {
        setBill(null);
        setElapsed(0);
      }
    } catch {
      setSession(null);
    }
  }, [station.id]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (session?.status === "ACTIVE") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [session?.status]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startSession({
        stationId: station.id,
        isBillLess: startForm.isBillLess,
        hourlyRate: startForm.hourlyRate ? parseFloat(startForm.hourlyRate) : undefined,
      });
      setShowStart(false);
      await loadSession();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    if (!session) return;
    await pauseSession(session.id);
    await loadSession();
  };

  const handleResume = async () => {
    if (!session) return;
    await resumeSession(session.id);
    await loadSession();
  };

  const handleEnd = async () => {
    if (!session) return;
    if (!confirm("Oturumu kapatmak istediğinize emin misiniz?")) return;
    await endSession(session.id);
    await loadSession();
    onRefresh();
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;
    setPayError("");
    try {
      // Find the order to pay for (session's first unpaid order, or create a dummy flow)
      const orders = await fetchOrders(venueId);
      const sessionOrders = orders.filter((o) => o.sessionId === session?.id && o.paymentStatus !== "PAID");
      if (sessionOrders.length === 0) {
        setPayError("Bu oturumda ödeme bekleyen sipariş yok.");
        return;
      }
      await addPayment({
        orderId: sessionOrders[0].id,
        method: payForm.method as any,
        amount: parseFloat(payForm.amount),
        note: payForm.note || undefined,
      });
      setPayForm({ method: "CASH", amount: "", note: "" });
      setShowPayment(false);
      await loadSession();
    } catch (err: any) {
      setPayError(err.message);
    }
  };

  const isActive = session?.status === "ACTIVE";
  const isPaused = session?.status === "PAUSED";

  return (
    <div className={`bg-zinc-900/50 border rounded-2xl p-5 transition-all ${
      isActive ? "border-green-500/30" : isPaused ? "border-yellow-500/30" : "border-white/10"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold">{station.name}</p>
          <p className="text-xs text-zinc-500">{station.stationType} {station.hourlyRate ? `· ₺${Number(station.hourlyRate)}/saat` : ""}</p>
        </div>
        {session ? (
          <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
            isActive ? "bg-green-500/15 text-green-400" : isPaused ? "bg-yellow-500/15 text-yellow-400" : "bg-zinc-700 text-zinc-400"
          }`}>
            {isActive ? "🟢 Aktif" : isPaused ? "⏸ Duraklı" : "⏹ Kapandı"}
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-lg font-bold bg-zinc-800 text-zinc-500">Boş</span>
        )}
      </div>

      {session && bill && (
        <div className="space-y-2 mb-4">
          <div className="text-3xl font-black text-center font-mono tracking-tight text-green-400">
            {formatDuration(elapsed)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <p className="text-zinc-500">Masa Ücreti</p>
              <p className="font-bold text-purple-400">₺{bill.sessionCharge.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <p className="text-zinc-500">Yiyecek/İçecek</p>
              <p className="font-bold text-blue-400">₺{bill.foodTotal.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <p className="text-zinc-500">Ödenen</p>
              <p className="font-bold text-green-400">₺{bill.paidTotal.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-3">
              <p className="text-zinc-500">Kalan</p>
              <p className={`font-bold ${bill.remaining > 0 ? "text-red-400" : "text-green-400"}`}>
                ₺{bill.remaining.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs text-zinc-400">Toplam</span>
            <span className="font-black text-white">₺{bill.grandTotal.toFixed(2)}</span>
          </div>
          {session.isBillLess && (
            <div className="text-xs text-center text-orange-400 bg-orange-500/10 rounded-lg py-1">
              🔓 Adisyonsuz Masa
            </div>
          )}
        </div>
      )}

      {!session && !showStart && (
        <button
          id={`start-session-${station.id}`}
          onClick={() => setShowStart(true)}
          className="w-full py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-xl text-sm font-bold transition-all"
        >
          ▶ Oturum Başlat
        </button>
      )}

      {showStart && !session && (
        <div className="space-y-3 border border-white/10 rounded-xl p-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Saatlik Ücret (₺) — Boş bırakılırsa istasyon ücreti kullanılır</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={startForm.hourlyRate}
              onChange={(e) => setStartForm((f) => ({ ...f, hourlyRate: e.target.value }))}
              placeholder={station.hourlyRate ? `₺${Number(station.hourlyRate)}` : "0.00"}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={startForm.isBillLess}
              onChange={(e) => setStartForm((f) => ({ ...f, isBillLess: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Adisyonsuz Masa (sadece masa ücreti)</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              Başlat
            </button>
            <button
              onClick={() => setShowStart(false)}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-bold transition-all"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {session && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {isActive && (
              <button onClick={handlePause} className="flex-1 py-2 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 rounded-xl text-xs font-bold transition-all">
                ⏸ Duraklat
              </button>
            )}
            {isPaused && (
              <button onClick={handleResume} className="flex-1 py-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-xl text-xs font-bold transition-all">
                ▶ Devam
              </button>
            )}
            <button onClick={handleEnd} className="flex-1 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl text-xs font-bold transition-all">
              ⏹ Kapat
            </button>
          </div>
          {bill && bill.remaining > 0 && (
            <button
              onClick={() => setShowPayment((v) => !v)}
              className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold transition-all"
            >
              💳 Ödeme Al
            </button>
          )}
          {showPayment && (
            <form onSubmit={handlePay} className="border border-white/10 rounded-xl p-3 space-y-2">
              <select
                value={payForm.method}
                onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                <option value="CASH">💵 Nakit</option>
                <option value="CARD">💳 Kredi Kartı</option>
                <option value="DIGITAL_WALLET">📱 Dijital Cüzdan</option>
              </select>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder={`Tutar (Kalan: ₺${bill?.remaining.toFixed(2)})`}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              {payError && <p className="text-red-400 text-xs">{payError}</p>}
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all">
                Ödemeyi Kaydet
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const venueId =
    typeof window !== "undefined"
      ? localStorage.getItem("venueId") ?? ""
      : "";

  const load = useCallback(async () => {
    try {
      const data = await fetchStations(venueId);
      setStations(data.filter((s) => s.isActive));
    } catch {
      console.error("Failed to load stations");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Oturum Yönetimi</h2>
        <p className="text-zinc-500 text-sm mt-1">İstasyon oturumları, süre takibi ve ödeme</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-500">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station) => (
            <SessionCard key={station.id} station={station} onRefresh={load} venueId={venueId} />
          ))}
          {stations.length === 0 && (
            <div className="col-span-3 text-center py-16 text-zinc-500">
              <p className="text-4xl mb-3">🪑</p>
              <p>Aktif istasyon yok. Önce istasyon ekleyin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
