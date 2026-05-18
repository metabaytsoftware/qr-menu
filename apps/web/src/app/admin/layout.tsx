"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
  /** Hangi roller bu linki görebilir. Tanımlanmazsa herkese açık. */
  roles?: string[];
  currentRole?: string;
}

function SidebarLink({ href, icon, label, isCollapsed, onClick, roles, currentRole }: SidebarLinkProps) {
  if (roles && currentRole && !roles.includes(currentRole)) return null;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group relative flex items-center rounded-xl py-2 text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200
        ${isCollapsed ? "justify-center px-0 md:px-0" : "gap-3 px-3"}
      `}
    >
      <div className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isCollapsed ? "w-10 h-10 rounded-xl hover:bg-white/5" : ""}`}>
        {icon}
      </div>
      <span
        className={`
          transition-all duration-300 text-sm font-medium whitespace-nowrap overflow-hidden
          ${isCollapsed ? "opacity-0 w-0 md:w-0" : "opacity-100 w-auto"}
        `}
      >
        {label}
      </span>
      {/* Premium Tooltip for Collapsed State (Desktop only) */}
      {isCollapsed && (
        <span className="hidden md:block absolute left-16 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs text-white transition-all duration-200 z-50 whitespace-nowrap pointer-events-none shadow-2xl">
          {label}
        </span>
      )}
    </Link>
  );
}

function SidebarSection({ title, isCollapsed }: { title: string; isCollapsed: boolean }) {
  if (isCollapsed) {
    return <div className="border-t border-white/5 my-4 mx-3" />;
  }
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-bold transition-all duration-300">
      {title}
    </p>
  );
}

import { AuthProvider, useAuth } from "@/lib/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [venueName, setVenueName] = useState<string>("Yükleniyor...");

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const check = () =>
      fetch("/api/health", { cache: "no-store" })
        .then((r) => setApiOnline(r.ok))
        .catch(() => setApiOnline(false));
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("venueId");

    fetch("/api/venues")
      .then((r) => r.json())
      .then((venues: { id: string; name: string }[]) => {
        if (!venues || venues.length === 0) return;

        const stored = localStorage.getItem("venueId") ?? "";
        const targetId = fromQuery || stored;
        const isValid = venues.some((v) => v.id === targetId);
        const targetVenue = isValid && targetId ? venues.find(v => v.id === targetId) : venues[0];

        if (targetVenue) {
          localStorage.setItem("venueId", targetVenue.id);
          setVenueName(targetVenue.name);
        }
      })
      .catch((err) => console.error("Failed to sync venue id:", err));
  }, [isAuthenticated]);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-zinc-950 text-white relative">
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-all duration-300 cursor-pointer"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            ${isSidebarCollapsed ? "md:w-20" : "md:w-64"}
            w-64 border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl
            flex flex-col no-print print:hidden transition-all duration-300 ease-in-out
          `}
        >
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/5 h-16">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold italic text-sm flex-shrink-0">
                V
              </div>
              <span
                className={`font-bold tracking-tight transition-opacity duration-300 ${
                  isSidebarCollapsed ? "opacity-0 md:hidden" : "opacity-100"
                }`}
              >
                VENUE<span className="text-blue-500">ADMIN</span>
              </span>
            </div>
            {/* Collapse Toggle Button (Desktop only) */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Genişlet" : "Daralt"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Close Button (Mobile only) */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
            <SidebarSection title="Genel" isCollapsed={isSidebarCollapsed} />
            <SidebarLink
              href="/admin"
              label="Dashboard"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>}
            />
            <SidebarLink
              href="/admin/analytics"
              label="Analitik"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>}
            />
            <SidebarLink
              href="/admin/orders"
              label="Siparişler"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
            />
            <SidebarLink
              href="/admin/menu"
              label="Menü"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M9 9h6v6H9z"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>}
            />

            <SidebarSection title="Masa & Ödeme" isCollapsed={isSidebarCollapsed} />
            <SidebarLink
              href="/admin/quick-sale"
              label="Hızlı Satış"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
            />
            <SidebarLink
              href="/admin/stations"
              label="İstasyonlar"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" x2="12" y1="12" y2="16"/><line x1="10" x2="14" y1="14" y2="14"/></svg>}
            />
            <SidebarLink
              href="/admin/sessions"
              label="Oturumlar"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
            <SidebarLink
              href="/admin/tariffs"
              label="Tarifeler"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />

            <SidebarSection title="Sistem" isCollapsed={isSidebarCollapsed} />
            <SidebarLink
              href="/admin/settings"
              label="Ayarlar"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
            />
            <SidebarLink
              href="/admin/settings/users"
              label="Kullanıcılar"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            />
            <SidebarLink
              href="/admin/settings/permissions"
              label="Yetkiler"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            />
            <SidebarLink
              href="/admin/settings/email"
              label="E-posta"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
            />
            <SidebarLink
              href="/admin/settings/notifications"
              label="Bildirimler"
              isCollapsed={isSidebarCollapsed}
              onClick={() => setIsMobileSidebarOpen(false)}
              currentRole={user?.role}
              roles={['OWNER', 'MANAGER']}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>}
            />
          </nav>

          {/* User Profile Info Footer */}
          <div className={`p-4 border-t border-white/5 transition-all duration-300 ${isSidebarCollapsed ? "md:p-3" : "md:p-6"}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center md:flex-col gap-3" : "gap-3"}`}>
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                title={user?.email || "admin@venue.com"}
              >
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              <div className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 md:hidden" : "opacity-100"}`}>
                <p className="text-sm font-bold truncate">
                  {user
                    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin User"
                    : "Admin User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user?.email || "admin@venue.com"}</p>
              </div>

              <button
                onClick={logout}
                title="Çıkış Yap"
                className={`
                  p-2 text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer
                  ${isSidebarCollapsed ? "hover:bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center" : ""}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-zinc-950/50 backdrop-blur-md no-print print:hidden relative z-20">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Hamburger Trigger */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Menüyü Aç"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
              <h2 className="text-lg font-bold">{venueName}</h2>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-zinc-400 hover:text-white transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </button>
              <div className="h-6 w-[1px] bg-white/10" />
              <span className={`text-sm font-medium flex items-center gap-2 ${apiOnline === false ? "text-red-400" : "text-green-500"}`}>
                <span className={`w-2 h-2 rounded-full ${apiOnline === false ? "bg-red-400" : "bg-green-500 animate-pulse"}`} />
                {apiOnline === false ? "API Çevrimdışı" : apiOnline === null ? "Bağlanıyor..." : "Sistem Aktif"}
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
