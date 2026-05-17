"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  fetchAnalyticsSummary,
  fetchAnalyticsRevenue,
  fetchAnalyticsTopProducts,
  fetchAnalyticsStationPerformance,
  fetchAnalyticsHourlyHeatmap,
  fetchAnalyticsPaymentDistribution,
  fetchAnalyticsCategoryBreakdown,
} from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// ─── Types ─────────────────────────────────────────────────────────────────

interface Summary {
  todayRevenue: number;
  todayOrderCount: number;
  avgOrderValue: number;
  activeSessions: number;
  allTimeRevenue: number;
  allTimeOrders: number;
}

interface RevenueSeries {
  date: string;
  revenue: number;
}

interface TopProduct {
  productId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface StationPerf {
  stationId: string;
  name: string;
  stationType: string;
  orderRevenue: number;
  sessionRevenue: number;
  totalRevenue: number;
  sessionCount: number;
  avgSessionMinutes: number;
}

interface HourlyData {
  hour: number;
  orderCount: number;
  revenue: number;
}

interface PaymentDist {
  method: string;
  count: number;
  total: number;
}

interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent: string;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
}) {
  return (
    <div className="relative rounded-2xl border border-white/5 bg-zinc-900/60 p-6 flex flex-col gap-3 overflow-hidden backdrop-blur-md">
      {/* Glow */}
      <div
        className={`absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl opacity-20 ${accent}`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          {label}
        </span>
        <span
          className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="text-sm text-zinc-500">{sub}</p>}
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trend.direction === "up"
              ? "text-emerald-400"
              : trend.direction === "down"
              ? "text-red-400"
              : "text-zinc-400"
          }`}
        >
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "—"}{" "}
          {trend.text}
        </div>
      )}
    </div>
  );
}

// ─── Hourly Heatmap ────────────────────────────────────────────────────────

function HourlyHeatmap({ data }: { data: HourlyData[] }) {
  const max = Math.max(...data.map((d) => d.orderCount), 1);
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Saatlik Sipariş Yoğunluğu{" "}
        <span className="text-zinc-600 font-normal">(son 30 gün)</span>
      </h3>
      <div className="grid grid-cols-12 gap-1.5">
        {data.map((d) => {
          const intensity = d.orderCount / max;
          const bg =
            intensity === 0
              ? "bg-zinc-800"
              : intensity < 0.25
              ? "bg-blue-900/60"
              : intensity < 0.5
              ? "bg-blue-700/70"
              : intensity < 0.75
              ? "bg-blue-500/80"
              : "bg-blue-400";
          return (
            <div
              key={d.hour}
              title={`${d.hour}:00 — ${d.orderCount} sipariş / ₺${d.revenue}`}
              className={`h-8 rounded-md ${bg} cursor-pointer transition-all hover:scale-110 hover:opacity-100 flex items-center justify-center`}
            >
              <span className="text-[8px] text-white/40 font-mono">{d.hour}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-600">
        <div className="w-4 h-4 rounded bg-zinc-800" /> Düşük
        <div className="w-4 h-4 rounded bg-blue-700/70" /> Orta
        <div className="w-4 h-4 rounded bg-blue-400" /> Yüksek
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState("");
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenue, setRevenue] = useState<RevenueSeries[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [stations, setStations] = useState<StationPerf[]>([]);
  const [heatmap, setHeatmap] = useState<HourlyData[]>([]);
  const [paymentDist, setPaymentDist] = useState<PaymentDist[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("venueId");
      if (stored) setVenueId(stored);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAnalyticsSummary(venueId),
      fetchAnalyticsRevenue(venueId, period),
      fetchAnalyticsTopProducts(venueId, 8),
      fetchAnalyticsStationPerformance(venueId),
      fetchAnalyticsHourlyHeatmap(venueId),
      fetchAnalyticsPaymentDistribution(venueId),
      fetchAnalyticsCategoryBreakdown(venueId),
    ])
      .then(([sum, rev, top, stat, heat, pay, cat]) => {
        setSummary(sum);
        setRevenue(Array.isArray(rev) ? rev : []);
        setTopProducts(Array.isArray(top) ? top : []);
        setStations(Array.isArray(stat) ? stat : []);
        setHeatmap(Array.isArray(heat) ? heat : []);
        setPaymentDist(Array.isArray(pay) ? pay : []);
        setCategoryBreakdown(Array.isArray(cat) ? cat : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [venueId, period]);

  // ── Chart configs ──

  const revenueChartData = {
    labels: revenue.map((r) => {
      const d = new Date(r.date);
      return d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Gelir (₺)",
        data: revenue.map((r) => r.revenue),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts.map((p) =>
      p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name
    ),
    datasets: [
      {
        label: "Satış Adedi",
        data: topProducts.map((p) => p.totalQuantity),
        backgroundColor: "rgba(99,102,241,0.7)",
        borderColor: "rgba(99,102,241,1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const paymentChartData = {
    labels: paymentDist.map((p) =>
      p.method === "CASH" ? "Nakit" : p.method === "CARD" ? "Kart" : "Dijital"
    ),
    datasets: [
      {
        data: paymentDist.map((p) => p.total),
        backgroundColor: ["#10b981", "#3b82f6", "#a855f7"],
        borderWidth: 0,
      },
    ],
  };

  const categoryChartData = {
    labels: categoryBreakdown.map((c) =>
      c.name.length > 15 ? c.name.slice(0, 13) + "…" : c.name
    ),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.totalRevenue),
        backgroundColor: [
          "#ec4899",
          "#f59e0b",
          "#10b981",
          "#06b6d4",
          "#6366f1",
          "#8b5cf6",
          "#ef4444",
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: { color: "#71717a", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: { color: "#71717a", font: { size: 11 } },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 gap-3">
        <svg
          className="animate-spin w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        Analitik veriler yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitik</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gelir, ürün ve istasyon performans verileri
          </p>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 rounded-xl p-1">
          {(["7d", "30d"] as const).map((p) => (
            <button
              key={p}
              id={`period-${p}`}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {p === "7d" ? "7 Gün" : "30 Gün"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Bugünkü Gelir"
            value={fmt(summary.todayRevenue)}
            sub={`${summary.todayOrderCount} sipariş`}
            icon="💰"
            accent="bg-emerald-400"
            trend={{ direction: "up", text: "Bugün" }}
          />
          <KpiCard
            label="Ort. Sipariş Tutarı"
            value={fmt(summary.avgOrderValue)}
            sub="Bugün ortalama"
            icon="🧾"
            accent="bg-blue-400"
          />
          <KpiCard
            label="Aktif Oturumlar"
            value={String(summary.activeSessions)}
            sub="Şu an aktif"
            icon="🎮"
            accent="bg-purple-400"
            trend={{
              direction: summary.activeSessions > 0 ? "up" : "neutral",
              text: summary.activeSessions > 0 ? "Canlı" : "Boş",
            }}
          />
          <KpiCard
            label="Toplam Gelir"
            value={fmt(summary.allTimeRevenue)}
            sub={`${summary.allTimeOrders} toplam sipariş`}
            icon="📈"
            accent="bg-amber-400"
          />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
        <h3 className="text-sm font-semibold text-zinc-300 mb-6">
          Gelir Trendi{" "}
          <span className="text-zinc-600 font-normal">
            (son {period === "7d" ? "7" : "30"} gün)
          </span>
        </h3>
        <div style={{ height: 240 }}>
          <Line data={revenueChartData} options={chartOpts as any} />
        </div>
      </div>

      {/* Top Products + Payment Distribution + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-6">
            En Çok Satan Ürünler
          </h3>
          <div style={{ height: 240 }}>
            <Bar
              data={topProductsChartData}
              options={{
                ...chartOpts,
                indexAxis: "y",
                plugins: { legend: { display: false } },
              } as any}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-6">
            Kategori Geliri
          </h3>
          {categoryBreakdown.length > 0 ? (
            <div style={{ height: 240 }} className="flex items-center">
              <Doughnut
                data={categoryChartData}
                options={{
                  cutout: "60%",
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: { color: "#71717a", boxWidth: 12, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
              Henüz veri yok
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-6">
            Ödeme Yöntemi
          </h3>
          {paymentDist.length > 0 ? (
            <div style={{ height: 240 }} className="flex items-center">
              <Doughnut
                data={paymentChartData}
                options={{
                  cutout: "65%",
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom",
                      labels: { color: "#71717a", boxWidth: 12, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
              Henüz ödeme yok
            </div>
          )}
        </div>
      </div>

      {/* Hourly Heatmap */}
      {heatmap.length > 0 && <HourlyHeatmap data={heatmap} />}

      {/* Station Performance */}
      {stations.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            İstasyon Performansı
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-zinc-500 text-xs uppercase tracking-widest">
                  <th className="pb-3 pr-4">İstasyon</th>
                  <th className="pb-3 pr-4">Tip</th>
                  <th className="pb-3 pr-4 text-right">Sipariş Geliri</th>
                  <th className="pb-3 pr-4 text-right">Oturum Geliri</th>
                  <th className="pb-3 pr-4 text-right">Toplam</th>
                  <th className="pb-3 text-right">Ort. Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stations
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map((s) => (
                    <tr key={s.stationId} className="text-zinc-300 hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 font-medium">{s.name}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs">
                          {s.stationType}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">{fmt(s.orderRevenue)}</td>
                      <td className="py-3 pr-4 text-right text-purple-400">
                        {fmt(s.sessionRevenue)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-white">
                        {fmt(s.totalRevenue)}
                      </td>
                      <td className="py-3 text-right text-zinc-500">
                        {s.avgSessionMinutes > 0
                          ? `${s.avgSessionMinutes} dk`
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
