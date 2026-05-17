"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMenu, placeOrder } from "@/lib/api";
import type { MenuResponse, Product, CartItem } from "@/types";

export default function MenuPage({ params }: { params: Promise<{ qrCode: string }> }) {
  const [qrCode, setQrCode] = useState("");
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    params.then((p) => setQrCode(p.qrCode));
  }, [params]);

  const load = useCallback(async () => {
    if (!qrCode) return;
    try {
      const data = await fetchMenu(qrCode);
      setMenu(data);
      if (data.categories.length > 0) setActiveCat(data.categories[0].id);
    } catch {
      setError("Menü yüklenemedi. QR kodu geçersiz olabilir.");
    } finally {
      setLoading(false);
    }
  }, [qrCode]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const quantityOf = (id: string) => cart.find((i) => i.product.id === id)?.quantity ?? 0;

  const handleOrder = async () => {
    if (!menu || cart.length === 0) return;
    setOrdering(true);
    try {
      await placeOrder({
        stationId: menu.station.id,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        notes: notes || undefined,
      });
      setCart([]);
      setNotes("");
      setShowCart(false);
      setOrdered(true);
      setTimeout(() => setOrdered(false), 4000);
    } catch {
      alert("Sipariş gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-4xl mb-4">😕</p>
        <p className="text-white font-bold text-lg mb-2">Menü Bulunamadı</p>
        <p className="text-zinc-500 text-sm">{error}</p>
      </div>
    </div>
  );

  if (!menu) return null;

  const activeProducts = menu.categories.find((c) => c.id === activeCat)?.products ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Menü</p>
            <h1 className="font-bold text-lg leading-tight">{menu.venue.name}</h1>
            <p className="text-xs text-zinc-400">{menu.station.name}</p>
          </div>
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              🛒 Sepet
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[11px] flex items-center justify-center font-black">
                {cartCount}
              </span>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 max-w-lg mx-auto scrollbar-none">
          {menu.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeCat === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Success toast */}
      {ordered && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl animate-bounce">
          ✅ Siparişiniz alındı!
        </div>
      )}

      {/* Products */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {activeProducts.length === 0 && (
          <div className="text-center py-16 text-zinc-600">Bu kategoride ürün yok.</div>
        )}
        {activeProducts.map((product) => {
          const qty = quantityOf(product.id);
          return (
            <div key={product.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex gap-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-2xl">
                  🍽️
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black text-blue-400">₺{product.price.toFixed(2)}</span>
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                    >
                      + Ekle
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 font-bold text-sm transition-all">−</button>
                      <span className="font-black w-4 text-center">{qty}</span>
                      <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-sm transition-all">+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom cart bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 transition-all"
            >
              <span className="bg-blue-500 text-white text-sm px-2.5 py-0.5 rounded-lg font-black">{cartCount}</span>
              <span>Siparişi Görüntüle</span>
              <span className="font-black">₺{cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-lg mx-auto bg-zinc-900 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black">Sepetiniz</h2>
              <button onClick={() => setShowCart(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-zinc-400">₺{item.product.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-lg bg-zinc-700 font-bold text-sm">−</button>
                    <span className="font-black w-4 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} className="w-7 h-7 rounded-lg bg-blue-600 font-bold text-sm">+</button>
                  </div>
                  <span className="font-black text-blue-400 text-sm w-16 text-right">
                    ₺{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Not ekleyin (isteğe bağlı)..."
              rows={2}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 mb-5 resize-none"
            />

            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-zinc-400 font-medium">Toplam</span>
              <span className="text-2xl font-black">₺{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleOrder}
              disabled={ordering}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-lg transition-all"
            >
              {ordering ? "Gönderiliyor..." : "Sipariş Ver"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
