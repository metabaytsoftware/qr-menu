"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCategories, fetchProducts, placeOrder, addPayment, fetchPrivateOrders } from "@/lib/api";
import type { AdminCategory, AdminProduct, Order } from "@/types";

interface Props {
  onClose: () => void;
}

type Tab = "sale" | "report";

export default function PrivateSaleOverlay({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("sale");

  // Sale state
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<{ product: AdminProduct; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Report state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadData = useCallback(async () => {
    const vid = localStorage.getItem("venueId") || "";
    setVenueId(vid);
    if (!vid) { setLoading(false); return; }
    try {
      const [cats, prods] = await Promise.all([fetchCategories(vid), fetchProducts(vid)]);
      setCategories(cats.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
      setProducts(prods.filter(p => p.isActive));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const vid = localStorage.getItem("venueId") || "";
    if (!vid) return;
    setOrdersLoading(true);
    try {
      const data = await fetchPrivateOrders(vid);
      setOrders(data);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (tab === "report") void loadOrders();
  }, [tab, loadOrders]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const addToCart = (product: AdminProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === productId);
      if (existing && existing.quantity > 1) return prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.product.id !== productId);
    });
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.quantity * Number(i.product.price), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");
    try {
      const newOrder = await placeOrder({
        venueId,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        notes: "Özel Satış",
        isOffRecord: true,
      });
      await addPayment({ orderId: newOrder.id, method: paymentMethod, amount: totalAmount, note: "Özel Satış Ödemesi" });
      setSuccessMsg(`Tamamlandı — ₺${totalAmount.toFixed(2)}`);
      setCart([]);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "İşlem başarısız");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = selectedCategory === "ALL" ? products : products.filter(p => p.categoryId === selectedCategory);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
  const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const allTotal = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
              <button
                onClick={() => setTab("sale")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === "sale" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Satış
              </button>
              <button
                onClick={() => setTab("report")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === "report" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Rapor
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Sale Tab */}
        {tab === "sale" && (
          loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 animate-pulse">Yükleniyor...</div>
          ) : (
            <div className="flex-1 flex gap-0 overflow-hidden">
              {/* Products */}
              <div className="flex-1 flex flex-col min-h-0 p-4">
                <div className="flex overflow-x-auto gap-2 pb-3 mb-3 border-b border-white/5 scrollbar-hide flex-shrink-0">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === "ALL" ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                  >
                    Tümü
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 p-4 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between min-h-[100px]"
                      >
                        <span className="font-semibold text-zinc-200 text-sm line-clamp-2 leading-tight">{product.name}</span>
                        <span className="mt-2 font-bold text-blue-400">₺{Number(product.price).toFixed(2)}</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full text-center text-zinc-500 py-10 text-sm">Bu kategoride ürün bulunamadı.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="w-80 flex-shrink-0 flex flex-col border-l border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                  <span className="font-bold text-sm">Sepet</span>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-500/10 rounded-lg">
                      Temizle
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Sepet boş</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between bg-zinc-800/30 p-2.5 rounded-xl border border-white/5">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-semibold text-xs truncate">{item.product.name}</div>
                          <div className="text-xs text-blue-400 font-bold">₺{(Number(item.product.price) * item.quantity).toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-0.5">
                          <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-white font-bold text-xs">-</button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white font-bold text-xs">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-white/5 space-y-3 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Toplam</span>
                    <span className="font-black text-xl">₺{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-xl">
                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${paymentMethod === "CASH" ? "bg-green-500 text-black" : "text-zinc-400 hover:text-white"}`}
                    >
                      Nakit
                    </button>
                    <button
                      onClick={() => setPaymentMethod("CARD")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${paymentMethod === "CARD" ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Kart
                    </button>
                  </div>
                  {error && <div className="p-2 bg-red-500/10 text-red-400 text-xs rounded-lg text-center border border-red-500/20">{error}</div>}
                  {successMsg && <div className="p-2 bg-green-500/10 text-green-400 text-xs rounded-lg text-center border border-green-500/20">{successMsg}</div>}
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-black rounded-xl disabled:opacity-50 transition-all text-sm uppercase tracking-wider"
                  >
                    {isProcessing ? "İşleniyor..." : "Tamamla"}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* Report Tab */}
        {tab === "report" && (
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Bugünkü Satış</p>
                <p className="text-2xl font-black">₺{todayTotal.toFixed(2)}</p>
                <p className="text-xs text-zinc-600 mt-1">{todayOrders.length} işlem</p>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Toplam (tüm zaman)</p>
                <p className="text-2xl font-black">₺{allTotal.toFixed(2)}</p>
                <p className="text-xs text-zinc-600 mt-1">{orders.length} işlem</p>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Ortalama Sepet</p>
                <p className="text-2xl font-black">₺{orders.length > 0 ? (allTotal / orders.length).toFixed(2) : "0.00"}</p>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto">
              {ordersLoading ? (
                <div className="flex items-center justify-center h-32 text-zinc-500 animate-pulse text-sm">Yükleniyor...</div>
              ) : orders.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Henüz kayıt yok.</div>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-500">
                            {new Date(order.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === "PAID" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                            {order.paymentStatus === "PAID" ? "Ödendi" : "Bekliyor"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {order.items.map(item => (
                            <span key={item.id} className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-lg">
                              {item.quantity}× {item.product.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-lg">₺{Number(order.totalAmount).toFixed(2)}</div>
                        {order.payments[0] && (
                          <div className="text-xs text-zinc-500">{order.payments[0].method === "CASH" ? "Nakit" : "Kart"}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
