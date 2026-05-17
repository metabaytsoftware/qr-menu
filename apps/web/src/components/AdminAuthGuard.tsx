'use client';

import { useAuthStore, LoginForm } from '@meta-repo/auth-client';
import { useEffect, useState } from 'react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
          <LoginForm 
            apiEndpoint="/api/auth/login" 
            title=""
          />
          <p className="mt-8 text-center text-zinc-500 text-sm">
            Giriş yapmak için admin bilgilerinizi kullanın.
          </p>
        </div>
        
        <style jsx global>{`
          input {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            color: white !important;
          }
          input:focus {
            border-color: #3b82f6 !important;
            outline: none !important;
          }
          button {
            background: #3b82f6 !important;
            transition: all 0.2s !important;
          }
          button:hover {
            background: #2563eb !important;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
