"use client";

import { useState, useEffect, useCallback } from "react";

interface ConfigRow {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
}

const SMTP_KEYS = [
  { key: "smtp.host", label: "SMTP Sunucu (Host)", placeholder: "smtp.gmail.com", isSecret: false, type: "text" },
  { key: "smtp.port", label: "Port", placeholder: "587", isSecret: false, type: "number" },
  { key: "smtp.secure", label: "SSL/TLS (true/false)", placeholder: "false", isSecret: false, type: "text" },
  { key: "smtp.user", label: "Kullanıcı Adı / E-posta", placeholder: "noreply@mekan.com", isSecret: false, type: "email" },
  { key: "smtp.pass", label: "Şifre / App Password", placeholder: "••••••••", isSecret: true, type: "password" },
  { key: "smtp.from", label: "Gönderen Adres (From)", placeholder: "Mekan Admin <noreply@mekan.com>", isSecret: false, type: "text" },
] as const;

type SmtpForm = Record<string, string>;

export default function EmailSettingsPage() {
  const [form, setForm] = useState<SmtpForm>({
    "smtp.host": "",
    "smtp.port": "587",
    "smtp.secure": "false",
    "smtp.user": "",
    "smtp.pass": "",
    "smtp.from": "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testSubject, setTestSubject] = useState("SMTP Test E-postası");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) return;
      const rows: ConfigRow[] = await res.json();
      const updates: SmtpForm = {};
      for (const row of rows) {
        if (row.key.startsWith("smtp.") && !row.isSecret) {
          updates[row.key] = row.value;
        }
      }
      setForm((prev) => ({ ...prev, ...updates }));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const configs = SMTP_KEYS.map(({ key, isSecret }) => ({
        key,
        value: form[key] ?? "",
        isSecret,
        description: `SMTP configuration: ${key}`,
      })).filter((c) => c.value !== "");

      const res = await fetch("/api/config/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg("✅ SMTP ayarları başarıyla kaydedildi.");
    } catch {
      setSaveMsg("❌ Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testTo) return;
    setTesting(true);
    setTestMsg("");
    setTestSuccess(null);
    try {
      const res = await fetch("/api/config/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, subject: testSubject }),
      });
      const data = await res.json() as { ok: boolean; message: string };
      setTestSuccess(data.ok);
      setTestMsg(data.message);
    } catch {
      setTestSuccess(false);
      setTestMsg("Sunucu bağlantı hatası.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-posta Ayarları</h1>
        <p className="text-zinc-500 mt-1">
          SMTP sunucu yapılandırmasını yönetin ve test e-postası gönderin.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm animate-pulse">Yapılandırma yükleniyor...</div>
      ) : (
        <>
          {/* SMTP Config Card */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold">SMTP Yapılandırması</h2>
                <p className="text-zinc-500 text-sm">Sistem e-postalarının gönderileceği sunucu bilgileri</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SMTP_KEYS.map(({ key, label, placeholder, type }) => (
                  <div key={key} className={key === "smtp.from" || key === "smtp.user" ? "md:col-span-2" : ""}>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                      {label}
                    </label>
                    <input
                      id={`smtp-field-${key.replace(".", "-")}`}
                      type={type}
                      placeholder={placeholder}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                    />
                  </div>
                ))}
              </div>

              {saveMsg && (
                <p className={`text-sm font-medium px-4 py-3 rounded-xl ${saveMsg.startsWith("✅") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {saveMsg}
                </p>
              )}

              <button
                id="smtp-save-btn"
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Kaydediliyor...
                  </>
                ) : "💾 Ayarları Kaydet"}
              </button>
            </form>
          </section>

          {/* Test Email Card */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold">Test E-postası Gönder</h2>
                <p className="text-zinc-500 text-sm">Kayıtlı SMTP ayarlarını doğrulamak için test gönderin</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                  Alıcı E-posta
                </label>
                <input
                  id="test-smtp-to"
                  type="email"
                  placeholder="test@ornek.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                  Konu
                </label>
                <input
                  id="test-smtp-subject"
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {testMsg && (
                <p className={`text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 ${testSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  <span>{testSuccess ? "✅" : "❌"}</span>
                  {testMsg}
                </p>
              )}

              <button
                id="smtp-test-btn"
                onClick={handleTest}
                disabled={testing || !testTo}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
                    </svg>
                    Test Gönder
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Info Card */}
          <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-[2rem] p-6 space-y-3">
            <h3 className="font-bold text-blue-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Popüler Sağlayıcı Ayarları
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-400">
              <div className="bg-white/5 rounded-xl p-3 space-y-1">
                <p className="font-bold text-white">Gmail</p>
                <p>Host: smtp.gmail.com</p>
                <p>Port: 587 / Secure: false</p>
                <p className="text-zinc-500">App Password kullanın</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 space-y-1">
                <p className="font-bold text-white">SendGrid</p>
                <p>Host: smtp.sendgrid.net</p>
                <p>Port: 587 / Secure: false</p>
                <p className="text-zinc-500">User: apikey</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 space-y-1">
                <p className="font-bold text-white">Mailgun</p>
                <p>Host: smtp.mailgun.org</p>
                <p>Port: 587 / Secure: false</p>
                <p className="text-zinc-500">SMTP credentials</p>
              </div>
            </div>
          </section>
        </>
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
