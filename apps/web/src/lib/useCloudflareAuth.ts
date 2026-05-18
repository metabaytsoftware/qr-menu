'use client';

import { useEffect, useState } from 'react';

interface CloudflareAuthUser {
  email: string;
  name?: string;
  picture?: string;
}

export function useCloudflareAuth() {
  const [user, setUser] = useState<CloudflareAuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/cloudflare-user');
        if (!res.ok) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const userData = await res.json();
        if (!userData.isAuthenticated) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // CF kimliğini JWT cookie'ye dönüştür
        await fetch('/api/auth/cloudflare-login', { method: 'POST', credentials: 'include' });

        setUser({
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/.cloudflare-access/logout';
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}
