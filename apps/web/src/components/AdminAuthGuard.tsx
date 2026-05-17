'use client';

import { useCloudflareAuth } from '@/lib/useCloudflareAuth';
import { useEffect, useState } from 'react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useCloudflareAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
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
          <div className="text-center space-y-4">
            <p className="text-zinc-300">Erişim için Cloudflare Authentication gereklidir.</p>
            <button
              onClick={() => {
                window.location.href = '/admin';
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
