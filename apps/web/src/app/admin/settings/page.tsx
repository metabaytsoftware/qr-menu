"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [venueName, setVenueName] = useState("Night City Cafe");

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-1">Configure your venue details and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M12 12v4"/><path d="M9 14h6"/></svg>
              </span>
              Venue Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Venue Name</label>
                <input 
                  type="text" 
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Currency Symbol</label>
                  <input 
                    type="text" 
                    defaultValue="₺"
                    className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Table Count</label>
                  <input 
                    type="number" 
                    defaultValue="10"
                    className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              </span>
              Security & Access
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-bold">Admin Password</p>
                  <p className="text-xs text-zinc-500">Update your dashboard access key.</p>
                </div>
                <button className="text-sm text-blue-500 font-bold hover:underline">Change</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-bold">Two-Factor Auth</p>
                  <p className="text-xs text-zinc-500">Add an extra layer of security.</p>
                </div>
                <div className="w-12 h-6 bg-zinc-800 rounded-full relative cursor-pointer">
                   <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-500 rounded-full" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20">
            <h3 className="text-xl font-black italic mb-2">QR SYSTEM</h3>
            <p className="text-sm text-white/80 leading-relaxed mb-6">
              Your venue is live. Customers can scan codes to order directly from their tables.
            </p>
            <div className="aspect-square bg-white rounded-3xl p-4 flex items-center justify-center">
               <div className="w-full h-full border-4 border-black/5 rounded-xl border-dashed flex flex-col items-center justify-center text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 0 2 2h3"/><path d="M12 12v.01"/><path d="M16 12v.01"/><path d="M21 12v.01"/><path d="M12 17v.01"/><path d="M12 21v.01"/></svg>
                  <p className="text-[10px] font-bold mt-2 uppercase tracking-tighter">Preview Code</p>
               </div>
            </div>
            <button className="w-full mt-6 bg-white text-blue-600 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-all">
              Download QR Pack
            </button>
          </section>

          <button className="w-full bg-zinc-900 border border-white/5 hover:border-red-500/50 text-zinc-500 hover:text-red-500 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20">
          Save Changes
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
