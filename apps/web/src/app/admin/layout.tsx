"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { useCloudflareAuth } from "@/lib/useCloudflareAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useCloudflareAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("venueId");
    if (fromQuery) {
      localStorage.setItem("venueId", fromQuery);
      return;
    }
    const stored = localStorage.getItem("venueId");
    if (!stored || stored === "night-city-gaming") {
      localStorage.removeItem("venueId");
      fetch("/api/venues")
        .then((r) => r.json())
        .then((venues: { id: string }[]) => {
          if (venues?.[0]?.id) {
            localStorage.setItem("venueId", venues[0].id);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-zinc-950 text-white">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl flex flex-col no-print print:hidden">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold italic text-sm">V</div>
              <span className="font-bold tracking-tight">VENUE<span className="text-blue-500">ADMIN</span></span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Genel</p>
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              Dashboard
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
              Analitik
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Siparişler
            </Link>
            <Link href="/admin/menu" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 9h6v6H9z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
              Menü
            </Link>

            <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Masa & Ödeme</p>
            <Link href="/admin/stations" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" x2="12" y1="12" y2="16"/><line x1="10" x2="14" y1="14" y2="14"/></svg>
              İstasyonlar
            </Link>
            <Link href="/admin/sessions" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Oturumlar
            </Link>
            <Link href="/admin/tariffs" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Tarifeler
            </Link>

            <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Sistem</p>
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Ayarlar
            </Link>
          </nav>

          <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-sm font-bold">{user?.name || "Admin User"}</p>
                <p className="text-xs text-zinc-500">{user?.email || "admin@venue.com"}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md no-print print:hidden relative z-20">
            <h2 className="text-lg font-bold">Night City Overview</h2>
            <div className="flex items-center gap-4">
              <button className="p-2 text-zinc-400 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </button>
              <div className="h-6 w-[1px] bg-white/10" />
              <span className="text-sm font-medium text-green-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live System
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
