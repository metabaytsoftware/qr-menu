"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCategories, fetchProducts, placeOrder, addPayment } from "@/lib/api";
import type { AdminCategory, AdminProduct } from "@/types";

export default function QuickSalePage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Cart State
  const [cart, setCart] = useState<{ product: AdminProduct; quantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

  const loadData = useCallback(async () => {
    try {
      const vid = localStorage.getItem("venueId") || "";
      setVenueId(vid);
      if (!vid) return;

      const [cats, prods] = await Promise.all([
        fetchCategories(vid),
        fetchProducts(vid),
      ]);
      setCategories(cats.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      setProducts(prods.filter(p => p.isActive));
    } catch {
      setError("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const addToCart = (product: AdminProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Create the direct order
      const newOrder = await placeOrder({
        venueId,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        notes: "Tezgah / Hızlı Satış",
      });

      // 2. Add payment to complete it
      await addPayment({
        orderId: newOrder.id,
        method: paymentMethod,
        amount: totalAmount,
        note: "Hızlı Satış Ödemesi",
      });

      setSuccessMsg(`Satış başarıyla tamamlandı (₺${totalAmount.toFixed(2)})`);
      clearCart();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Satış işlemi başarısız oldu");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = selectedCategory === "ALL" 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

  if (loading) {
    return <div className="text-zinc-500 animate-pulse flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left Area: Products */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
        {/* Categories Header */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-white/5 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === "ALL" ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Tümü
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 p-4 rounded-xl text-left transition-all active:scale-95 group flex flex-col justify-between min-h-[120px]"
              >
                <div className="font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-tight">
                  {product.name}
                </div>
                <div className="mt-2 font-bold text-blue-400 text-lg">
                  ₺{Number(product.price).toFixed(2)}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 py-10">Bu kategoride ürün bulunamadı.</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className="w-full md:w-96 flex flex-col bg-zinc-900/80 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex-shrink-0">
        <div className="p-4 bg-zinc-800/50 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-lg">Hızlı Satış Sepeti</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-500/10 rounded-lg">
              Temizle
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <p className="text-sm">Sepetiniz boş</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-xl border border-white/5">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-semibold text-sm truncate">{item.product.name}</div>
                  <div className="text-xs text-blue-400 font-bold">₺{(Number(item.product.price) * item.quantity).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-1">
                  <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-white font-bold">
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white font-bold">
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-4 bg-zinc-800/80 border-t border-white/5 space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="text-zinc-400">Toplam:</span>
            <span className="font-black text-2xl text-white">₺{totalAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl">
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === "CASH" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              Nakit Ödeme
            </button>
            <button
              onClick={() => setPaymentMethod("CARD")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                paymentMethod === "CARD" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              Kredi Kartı
            </button>
          </div>

          {error && <div className="p-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg text-center border border-red-500/20">{error}</div>}
          {successMsg && <div className="p-2 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg text-center border border-green-500/20">{successMsg}</div>}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-xl disabled:opacity-50 transition-all uppercase tracking-wider"
          >
            {isProcessing ? "İşleniyor..." : "Satışı Tamamla"}
          </button>
        </div>
      </div>
    </div>
  );
}
