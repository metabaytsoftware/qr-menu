'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  venueId: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      let res = await fetch('/api/auth/me', { credentials: 'include' });
      
      if (!res.ok && res.status === 401) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (refreshRes.ok) {
          res = await fetch('/api/auth/me', { credentials: 'include' });
        }
      }

      if (res.ok) {
        const data: AuthUser = await res.json();
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(Array.isArray(err.message) ? err.message[0] : (err.message || 'Giriş başarısız'));
    }
    await checkAuth();
  };

  const logout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, isLoading, login, logout };
}
