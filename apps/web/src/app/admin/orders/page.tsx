"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOrders, updateOrderStatus } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next: OrderStatus | null }> = {
  PENDING:   { label: "Bekliyor",   color: "orange", next: "PREPARING" },
  PREPARING: { label: "Hazırlanıyor", color: "blue",   next: "SERVED" },
  SERVED:    { label: "Teslim Edildi", color: "green",  next: "COMPLETED" },
  COMPLETED: { label: "Tamamlandı", color: "zinc",   next: null },
  CANCELLED: { label: "İptal",      color: "red",    next: null },
};

const formatTime = (createdAt: string) => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}d önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s önce`;
  return `${Math.floor(diff / 86400)}g önce`;
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Tümü", value: "All" },
  { label: "Bekliyor", value: "PENDING" },
  { label: "Hazırlanıyor", value: "PREPARING" },
  { label: "Teslim", value: "SERVED" },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const venueId = localStorage.getItem("venueId") || "";
      setOrders(await fetchOrders(venueId));
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAdvance = async (order: Order) => {
    const next = STATUS_CONFIG[order.status].next;
    if (!next) return;
    setUpdating(order.id);
    try {
      const updated = await updateOrderStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      alert("Durum güncellenemedi.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!confirm("Bu siparişi iptal etmek istediğinize emin misiniz?")) return;
    setUpdating(order.id);
    try {
      const updated = await updateOrderStatus(order.id, "CANCELLED");
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      alert("İptal işlemi başarısız.");
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = filter === "All"
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siparişler</h1>
          <p className="text-zinc-500 mt-1">Canlı siparişleri takip edin ve yönetin.</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.value ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-widest">
                <th className="px-8 py-6 font-bold">Sipariş & İstasyon</th>
                <th className="px-8 py-6 font-bold">Ürünler</th>
                <th className="px-8 py-6 font-bold">Tutar</th>
                <th className="px-8 py-6 font-bold">Durum</th>
                <th className="px-8 py-6 font-bold">Zaman</th>
                <th className="px-8 py-6 font-bold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const isUpdating = updating === order.id;
                return (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                    <td className="px-8 py-6">
                      <div className="font-mono text-xs text-zinc-500">{order.id.slice(-8).toUpperCase()}</div>
                      <div className="text-blue-500 text-sm font-bold mt-0.5">{order.station.name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-zinc-400 max-w-[200px] truncate">{order.items.map((i) => i.product.name).join(", ")}</div>
                      <div className="text-[10px] text-zinc-600 mt-1">{order.items.length} kalem</div>
                    </td>
                    <td className="px-8 py-6 font-bold text-white">₺{Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-${cfg.color}-500/10 text-${cfg.color}-400 border border-${cfg.color}-500/20`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-zinc-500 text-xs">{formatTime(order.createdAt)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cfg.next && (
                          <button
                            onClick={() => void handleAdvance(order)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-bold rounded-xl transition-all border border-blue-500/20 disabled:opacity-50"
                          >
                            {isUpdating ? "..." : `→ ${STATUS_CONFIG[cfg.next].label}`}
                          </button>
                        )}
                        {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                          <button
                            onClick={() => void handleCancel(order)}
                            disabled={isUpdating}
                            className="p-1.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-xl transition-all border border-white/5 disabled:opacity-50"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-20 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-white">Sipariş bulunamadı</h3>
              <p className="text-zinc-500">Seçili filtreye uygun sipariş yok.</p>
            </div>
          )}
        </div>
      )}

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
