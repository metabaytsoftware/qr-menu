'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

const ADMIN_ROLES = ['OWNER', 'MANAGER', 'CASHIER'];

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold italic text-xl">V</div>
              <span className="text-2xl font-bold tracking-tight text-white">VENUE<span className="text-blue-500">ADMIN</span></span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-posta"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Şifre"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-zinc-400 select-none cursor-pointer">
                Beni hatırla
              </label>
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Giriş yapmış ama admin yetkisi olmayan kullanıcı
  if (isAuthenticated && user && !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/50 border border-red-500/20 p-8 rounded-3xl backdrop-blur-xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-zinc-400 text-sm mb-1">Bu paneli görüntüleme yetkiniz yok.</p>
          <p className="text-zinc-600 text-xs mb-6">Mevcut rolünüz: <span className="text-zinc-400 font-medium">{user.role}</span></p>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
