"use client";

export default function MenuError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-4xl mb-4">😕</p>
        <p className="text-white font-bold text-lg mb-2">Bir hata oluştu</p>
        <p className="text-zinc-500 text-sm mb-6">{error.message || "Beklenmeyen bir hata oluştu."}</p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
