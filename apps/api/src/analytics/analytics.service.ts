import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Bugünün özet metrikleri */
  async getSummary(venueId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, activeSessions, allTimeTotals] = await Promise.all([
      this.prisma.order.findMany({
        where: { venueId, createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } },
        select: { totalAmount: true, status: true },
      }),
      this.prisma.session.count({ where: { station: { venueId }, status: 'ACTIVE' } }),
      this.prisma.order.aggregate({
        where: { venueId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const todayOrderCount = todayOrders.length;
    const avgOrderValue = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

    return {
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      todayOrderCount,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      activeSessions,
      allTimeRevenue: parseFloat(Number(allTimeTotals._sum.totalAmount ?? 0).toFixed(2)),
      allTimeOrders: allTimeTotals._count,
    };
  }

  /** Günlük gelir zaman serisi (7 veya 30 gün) */
  async getRevenueSeries(venueId: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { venueId, createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, createdAt: true },
    });

    // Group by date
    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      map.set(d.toISOString().split('T')[0], 0);
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      map.set(key, (map.get(key) ?? 0) + Number(o.totalAmount));
    }

    return Array.from(map.entries()).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
    }));
  }

  /** En çok satılan ürünler */
  async getTopProducts(venueId: string, limit: number = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { venueId, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });
    const pMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => ({
      productId: item.productId,
      name: pMap.get(item.productId)?.name ?? 'Unknown',
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: parseFloat(Number(item._sum.total ?? 0).toFixed(2)),
    }));
  }

  /** İstasyon bazlı performans */
  async getStationPerformance(venueId: string) {
    const stations = await this.prisma.station.findMany({
      where: { venueId },
      include: {
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true },
        },
        sessions: {
          where: { status: 'ENDED' },
          select: { sessionCharge: true, startTime: true, endTime: true },
        },
      },
    });

    return stations.map((s) => {
      const orderRevenue = s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const sessionRevenue = s.sessions.reduce(
        (sum, sess) => sum + Number(sess.sessionCharge ?? 0),
        0,
      );
      const totalSessionMinutes = s.sessions.reduce((sum, sess) => {
        if (sess.endTime) {
          return sum + (sess.endTime.getTime() - sess.startTime.getTime()) / 60000;
        }
        return sum;
      }, 0);

      return {
        stationId: s.id,
        name: s.name,
        stationType: s.stationType,
        orderRevenue: parseFloat(orderRevenue.toFixed(2)),
        sessionRevenue: parseFloat(sessionRevenue.toFixed(2)),
        totalRevenue: parseFloat((orderRevenue + sessionRevenue).toFixed(2)),
        sessionCount: s.sessions.length,
        avgSessionMinutes:
          s.sessions.length > 0
            ? parseFloat((totalSessionMinutes / s.sessions.length).toFixed(1))
            : 0,
      };
    });
  }

  /** Saatlik yoğunluk haritası (0-23 saat, son 30 gün) */
  async getHourlyHeatmap(venueId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const orders = await this.prisma.order.findMany({
      where: { venueId, createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, totalAmount: true },
    });

    const hourMap: Record<number, { count: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = { count: 0, revenue: 0 };

    for (const o of orders) {
      const h = o.createdAt.getHours();
      hourMap[h].count++;
      hourMap[h].revenue += Number(o.totalAmount);
    }

    return Object.entries(hourMap).map(([hour, data]) => ({
      hour: parseInt(hour),
      orderCount: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
    }));
  }

  /** Ödeme yöntemi dağılımı */
  async getPaymentMethodDistribution(venueId: string) {
    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { order: { venueId } },
      _sum: { amount: true },
      _count: true,
    });

    return payments.map((p) => ({
      method: p.method,
      count: p._count,
      total: parseFloat(Number(p._sum.amount ?? 0).toFixed(2)),
    }));
  }

  /** Kategori başına gelir ve sipariş dağılımı */
  async getCategoryBreakdown(venueId: string) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { venueId, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, total: true },
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true, name: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { venueId },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const categoryStats = new Map<string, { categoryId: string; name: string; totalQuantity: number; totalRevenue: number }>();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      const category = categoryMap.get(product.categoryId);
      if (!category) continue;

      const key = product.categoryId;
      const current = categoryStats.get(key) || {
        categoryId: product.categoryId,
        name: category.name,
        totalQuantity: 0,
        totalRevenue: 0,
      };

      current.totalQuantity += item._sum.quantity ?? 0;
      current.totalRevenue += Number(item._sum.total ?? 0);
      categoryStats.set(key, current);
    }

    return Array.from(categoryStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((c) => ({
        ...c,
        totalRevenue: parseFloat(c.totalRevenue.toFixed(2)),
      }));
  }
}
