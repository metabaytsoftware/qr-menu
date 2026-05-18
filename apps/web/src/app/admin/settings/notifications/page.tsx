"use client";

import { useState, useEffect, useCallback } from "react";

interface NotifPrefs {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  eventPrefs: Record<string, boolean> | null;
}

const CHANNELS = [
  {
    key: "emailEnabled" as const,
    label: "E-posta Bildirimleri",
    desc: "Önemli olaylar için e-posta alın",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    color: "blue",
  },
  {
    key: "smsEnabled" as const,
    label: "SMS Bildirimleri",
    desc: "Kritik uyarılar için SMS alın",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    color: "violet",
  },
  {
    key: "inAppEnabled" as const,
    label: "Uygulama İçi Bildirimler",
    desc: "Panel içinde anlık bildirimler",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    ),
    color: "emerald",
  },
  {
    key: "pushEnabled" as const,
    label: "Push Bildirimleri",
    desc: "Tarayıcı push bildirimleri",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <line x1="2" x2="22" y1="2" y2="22"/>
      </svg>
    ),
    color: "orange",
  },
] as const;

const EVENT_PREFS = [
  { key: "orderCreated", label: "Yeni Sipariş", desc: "Müşteri sipariş verdiğinde" },
  { key: "orderReady", label: "Sipariş Hazır", desc: "Mutfak siparişi tamamladığında" },
  { key: "sessionStart", label: "Oturum Başladı", desc: "Yeni istasyon oturumu açıldığında" },
  { key: "sessionEnd", label: "Oturum Bitti", desc: "İstasyon oturumu kapandığında" },
  { key: "paymentReceived", label: "Ödeme Alındı", desc: "Başarılı ödeme işlemlerinde" },
  { key: "lowStock", label: "Düşük Stok", desc: "Ürün stoğu azaldığında" },
] as const;

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const toggleColorMap: Record<string, string> = {
  blue: "bg-blue-600",
  violet: "bg-violet-600",
  emerald: "bg-emerald-600",
  orange: "bg-orange-600",
};

function Toggle({
  enabled,
  onChange,
  color = "blue",
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? (toggleColorMap[color] ?? "bg-blue-600") : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    pushEnabled: false,
    eventPrefs: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/prefs");
      if (!res.ok) return;
      const data = await res.json() as NotifPrefs;
      setPrefs(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const handleChannelToggle = (key: keyof Pick<NotifPrefs, "emailEnabled" | "smsEnabled" | "inAppEnabled" | "pushEnabled">, val: boolean) => {
    setPrefs((p) => ({ ...p, [key]: val }));
  };

  const handleEventToggle = (key: string, val: boolean) => {
    setPrefs((p) => ({
      ...p,
      eventPrefs: { ...(p.eventPrefs ?? {}), [key]: val },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/notifications/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      setSaveMsg("✅ Bildirim tercihleri kaydedildi.");
    } catch {
      setSaveMsg("❌ Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Tercihleri</h1>
        <p className="text-zinc-500 mt-1">
          Hangi kanallar üzerinden ve hangi olaylar için bildirim alacağınızı yapılandırın.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm animate-pulse">Tercihler yükleniyor...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Channel Toggles */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Bildirim Kanalları</h2>
            <div className="space-y-4">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.key}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[ch.color]}`}>
                      {ch.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{ch.label}</p>
                      <p className="text-xs text-zinc-500">{ch.desc}</p>
                    </div>
                  </div>
                  <Toggle
                    enabled={prefs[ch.key]}
                    onChange={(val) => handleChannelToggle(ch.key, val)}
                    color={ch.color}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Event Prefs */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <div>
              <h2 className="text-xl font-bold">Olay Bazlı Bildirimler</h2>
              <p className="text-sm text-zinc-500 mt-1">Hangi sistem olaylarında bildirim almak istediğinizi seçin</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EVENT_PREFS.map((ev) => {
                const enabled = prefs.eventPrefs?.[ev.key] ?? true;
                return (
                  <div
                    key={ev.key}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <p className="font-semibold text-sm">{ev.label}</p>
                      <p className="text-xs text-zinc-500">{ev.desc}</p>
                    </div>
                    <Toggle
                      enabled={enabled}
                      onChange={(val) => handleEventToggle(ev.key, val)}
                      color="blue"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {saveMsg && (
            <p className={`text-sm font-medium px-4 py-3 rounded-xl ${saveMsg.startsWith("✅") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {saveMsg}
            </p>
          )}

          <button
            id="notif-save-btn"
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Kaydediliyor...
              </>
            ) : "💾 Tercihleri Kaydet"}
          </button>
        </form>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .max-w-3xl { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
