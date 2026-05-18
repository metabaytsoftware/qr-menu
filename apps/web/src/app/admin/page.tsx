"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { fetchOrders } from "@/lib/api";
import type { Order } from "@/types";

const formatTime = (createdAt: string) => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}d önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s önce`;
  return `${Math.floor(diff / 86400)}g önce`;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState([
    { label: "Aktif Siparişler", value: "0", icon: "📦", color: "blue" },
    { label: "Günlük Gelir", value: "₺0", icon: "💰", color: "green" },
    { label: "Ortalama Sipariş", value: "₺0", icon: "📊", color: "purple" },
    { label: "Toplam Sipariş", value: "0", icon: "🧾", color: "orange" },
  ]);

  const load = useCallback(async () => {
    try {
      const venueId = localStorage.getItem("venueId") || "";
      const data = await fetchOrders(venueId);
      setOrders(data.slice(0, 5));

      const active = data.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;
      const validOrders = data.filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING");
      const revenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const avg = validOrders.length > 0 ? revenue / validOrders.length : 0;

      setStats([
        { label: "Aktif Siparişler", value: String(active), icon: "📦", color: "blue" },
        { label: "Günlük Gelir", value: `₺${revenue.toFixed(2)}`, icon: "💰", color: "green" },
        { label: "Ortalama Sipariş", value: `₺${avg.toFixed(2)}`, icon: "📊", color: "purple" },
        { label: "Toplam Sipariş", value: String(data.length), icon: "🧾", color: "orange" },
      ]);
    } catch {
      console.error("Failed to fetch orders");
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const recentOrders = orders;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>live</span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Son Siparişler</h3>
            <Link href="/admin/orders" className="text-sm text-blue-500 hover:underline">Tümünü Gör</Link>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">İstasyon</th>
                  <th className="px-6 py-4 font-bold">Ürünler</th>
                  <th className="px-6 py-4 font-bold">Tutar</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold">Zaman</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const statusColor = order.status === "PREPARING" ? "blue" : order.status === "PENDING" ? "orange" : "green";
                    return (
                      <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                        <td className="px-6 py-4 font-bold text-blue-500">{order.station.name}</td>
                        <td className="px-6 py-4 text-zinc-400 max-w-[160px] truncate">{order.items.map((i) => i.product.name).join(", ")}</td>
                        <td className="px-6 py-4 font-bold">₺{Number(order.totalAmount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-${statusColor}-500/10 text-${statusColor}-400`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">{formatTime(order.createdAt)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Henüz sipariş yok</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Hızlı Erişim</h3>
          <div className="space-y-3">
            <Link href="/admin/menu" className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 9h6v6H9z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
              </div>
              <div>
                <p className="font-bold text-sm">Menü Yönetimi</p>
                <p className="text-xs text-zinc-500">Ürün ve kategori ekle</p>
              </div>
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div>
                <p className="font-bold text-sm">Siparişler</p>
                <p className="text-xs text-zinc-500">Canlı sipariş yönetimi</p>
              </div>
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div>
                <p className="font-bold text-sm">Ayarlar</p>
                <p className="text-xs text-zinc-500">Venue yapılandırması</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

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
