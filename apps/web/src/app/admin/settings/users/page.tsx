'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  venueId: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner', MANAGER: 'Yönetici', CASHIER: 'Kasiyer', STAFF: 'Personel',
};
const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-500/20 text-purple-300',
  MANAGER: 'bg-blue-500/20 text-blue-300',
  CASHIER: 'bg-green-500/20 text-green-300',
  STAFF: 'bg-zinc-500/20 text-zinc-300',
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', role: 'STAFF' };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'password' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [venueId, setVenueId] = useState<string>('');

  useEffect(() => {
    setVenueId(localStorage.getItem('venueId') ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/users${venueId ? `?venueId=${venueId}` : ''}`, { credentials: 'include' });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };
  const openEdit = (u: User) => {
    setSelected(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role });
    setError('');
    setModal('edit');
  };
  const openPassword = (u: User) => { setSelected(u); setNewPassword(''); setError(''); setModal('password'); };

  const handleCreate = async () => {
    setSaving(true); setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, venueId: venueId || undefined }),
      credentials: 'include',
    });
    if (res.ok) { setModal(null); load(); }
    else { const e = await res.json(); setError(Array.isArray(e.message) ? e.message[0] : e.message); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/users/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, role: form.role }),
      credentials: 'include',
    });
    if (res.ok) { setModal(null); load(); }
    else { const e = await res.json(); setError(Array.isArray(e.message) ? e.message[0] : e.message); }
    setSaving(false);
  };

  const handlePassword = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/users/${selected.id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
      credentials: 'include',
    });
    if (res.ok) { setModal(null); }
    else { const e = await res.json(); setError(Array.isArray(e.message) ? e.message[0] : e.message); }
    setSaving(false);
  };

  const handleToggleActive = async (u: User) => {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
      credentials: 'include',
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-zinc-400 text-sm mt-1">{users.length} kullanıcı</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
          + Kullanıcı Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
      ) : (
        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/80 text-left">
                <th className="px-4 py-3 text-zinc-400 font-medium">Ad Soyad</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">E-posta</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Rol</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Durum</th>
                <th className="px-4 py-3 text-zinc-400 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(u)} className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${u.isActive ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'}`}>
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(u)} className="text-zinc-400 hover:text-white transition-colors text-xs">Düzenle</button>
                    <button onClick={() => openPassword(u)} className="text-zinc-400 hover:text-yellow-400 transition-colors text-xs">Şifre</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">
              {modal === 'create' ? 'Yeni Kullanıcı' : modal === 'edit' ? 'Kullanıcıyı Düzenle' : 'Şifre Değiştir'}
            </h2>

            {modal === 'password' ? (
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre (min. 8 karakter)" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Ad" className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Soyad" className="px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
                </div>
                {modal === 'create' && (
                  <>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="E-posta" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Şifre (min. 8 karakter)" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
                  </>
                )}
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors">İptal</button>
              <button
                onClick={modal === 'create' ? handleCreate : modal === 'edit' ? handleEdit : handlePassword}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
