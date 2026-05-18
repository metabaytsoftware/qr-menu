'use client';

import { useEffect, useState, useCallback } from 'react';

type Matrix = Record<string, Record<string, Record<string, boolean>>>;
type Schema = { resources: string[]; actions: Record<string, string[]>; roles: string[] };

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Yönetici',
  CASHIER: 'Kasiyer',
  STAFF: 'Personel',
};

const RESOURCE_LABELS: Record<string, string> = {
  analytics: 'Analitik',
  categories: 'Kategoriler',
  products: 'Ürünler',
  stations: 'İstasyonlar',
  payments: 'Ödemeler',
  sessions: 'Oturumlar',
  orders: 'Siparişler',
  venues: 'Mekan Ayarları',
  tariffs: 'Tarifeler',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'Görüntüle',
  write: 'Düzenle',
  update_status: 'Durum Güncelle',
  cancel: 'İptal Et',
};

export default function PermissionsPage() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [matrix, setMatrix] = useState<Matrix>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [schemaRes, matrixRes] = await Promise.all([
      fetch('/api/permissions/schema', { credentials: 'include' }),
      fetch('/api/permissions', { credentials: 'include' }),
    ]);
    if (schemaRes.ok) setSchema(await schemaRes.json());
    if (matrixRes.ok) setMatrix(await matrixRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (role: string, resource: string, action: string) => {
    if (role === 'OWNER') return; // OWNER her zaman açık
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [resource]: {
          ...prev[role]?.[resource],
          [action]: !prev[role]?.[resource]?.[action],
        },
      },
    }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const updates: { role: string; resource: string; action: string; allowed: boolean }[] = [];
    for (const role of Object.keys(matrix)) {
      if (role === 'OWNER') continue;
      for (const resource of Object.keys(matrix[role] ?? {})) {
        for (const action of Object.keys(matrix[role][resource] ?? {})) {
          updates.push({ role, resource, action, allowed: matrix[role][resource][action] });
        }
      }
    }
    await fetch('/api/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      credentials: 'include',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yetki Yönetimi</h1>
          <p className="text-zinc-400 text-sm mt-1">Rollerin hangi işlemleri yapabileceğini belirleyin</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80">
              <th className="text-left px-4 py-3 text-zinc-400 font-medium w-48">Kaynak / İşlem</th>
              {schema.roles.map(role => (
                <th key={role} className="px-4 py-3 text-center text-zinc-300 font-semibold">
                  {ROLE_LABELS[role] ?? role}
                  {role === 'OWNER' && <span className="ml-1 text-xs text-zinc-500">(tam)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schema.resources.map((resource, ri) => (
              schema.actions[resource].map((action, ai) => (
                <tr
                  key={`${resource}-${action}`}
                  className={`border-t border-white/5 ${ai === 0 && ri > 0 ? 'border-t-2 border-white/10' : ''} hover:bg-white/[0.02] transition-colors`}
                >
                  <td className="px-4 py-3 text-zinc-300">
                    {ai === 0 && (
                      <span className="font-semibold text-white">
                        {RESOURCE_LABELS[resource] ?? resource}
                      </span>
                    )}
                    <span className={`${ai === 0 ? 'block' : ''} text-xs text-zinc-500 mt-0.5`}>
                      {ACTION_LABELS[action] ?? action}
                    </span>
                  </td>
                  {schema.roles.map(role => {
                    const allowed = role === 'OWNER' ? true : (matrix[role]?.[resource]?.[action] ?? false);
                    const isOwner = role === 'OWNER';
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggle(role, resource, action)}
                          disabled={isOwner}
                          className={`w-10 h-6 rounded-full transition-colors relative ${
                            allowed ? 'bg-blue-600' : 'bg-zinc-700'
                          } ${isOwner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                            allowed ? 'left-5' : 'left-1'
                          }`} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
