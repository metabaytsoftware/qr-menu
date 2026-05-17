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
        // Try to get user info from Cloudflare Access
        const res = await fetch('/api/auth/cloudflare-user');

        if (res.ok) {
          const userData = await res.json();
          if (userData.isAuthenticated) {
            setUser({
              email: userData.email,
              name: userData.name,
              picture: userData.picture,
            });
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
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
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to Cloudflare's logout endpoint
    window.location.href = '/.cloudflare-access/logout';
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}
