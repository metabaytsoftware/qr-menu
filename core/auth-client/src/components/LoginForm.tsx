'use client';

import { useState, FormEvent } from 'react';
import { useAuthStore } from '../store';
import type { User } from '@meta-repo/types';

interface LoginFormProps {
  onSuccess?: () => void;
  apiEndpoint?: string;
  title?: string;
}

export function LoginForm({ 
  onSuccess, 
  apiEndpoint = '/api/auth/login',
  title = 'Giriş Yap'
}: LoginFormProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        let errorMessage = 'Giriş başarısız';
        
        if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.map((m: any) => 
              typeof m === 'string' ? m : JSON.stringify(m)
            ).join(', ');
          } else if (typeof data.message === 'object') {
            errorMessage = JSON.stringify(data.message);
          } else {
            errorMessage = data.message;
          }
        }
        
        setError(errorMessage);
        return;
      }

      const data = await res.json();
      if (data.user && data.accessToken) {
        setAuth(data.user as User, data.accessToken as string);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ textAlign: 'center', color: 'white' }}>{title}</h1>
      {error && <p style={{ color: '#fca5a5', textAlign: 'center', fontSize: 14, margin: 0 }}>{error}</p>}
      <input
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(30, 41, 59, 0.6)',
          color: 'rgba(255, 255, 255, 0.95)',
          transition: 'border-color 0.2s, background 0.2s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
        }}
      />
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(30, 41, 59, 0.6)',
          color: 'rgba(255, 255, 255, 0.95)',
          transition: 'border-color 0.2s, background 0.2s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: 'none',
          backgroundColor: '#3b82f6',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontWeight: 'bold',
          transition: 'opacity 0.2s'
        }}
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
}
