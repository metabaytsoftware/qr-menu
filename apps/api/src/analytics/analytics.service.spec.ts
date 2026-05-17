import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    session: {
      count: jest.fn(),
    },
    station: {
      findMany: jest.fn(),
    },
    payment: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return summary metrics for a venue', async () => {
      const venueId = 'test-venue';
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      mockPrismaService.order.findMany.mockResolvedValue([
        { totalAmount: 100, status: 'COMPLETED' },
        { totalAmount: 200, status: 'COMPLETED' },
      ]);

      mockPrismaService.session.count.mockResolvedValue(3);

      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1000 },
        _count: 10,
      });

      const result = await service.getSummary(venueId);

      expect(result).toEqual({
        todayRevenue: 300,
        todayOrderCount: 2,
        avgOrderValue: 150,
        activeSessions: 3,
        allTimeRevenue: 1000,
        allTimeOrders: 10,
      });
    });

    it('should return zeros for empty venue', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.session.count.mockResolvedValue(0);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      });

      const result = await service.getSummary('empty-venue');

      expect(result.todayRevenue).toBe(0);
      expect(result.avgOrderValue).toBe(0);
      expect(result.activeSessions).toBe(0);
    });
  });

  describe('getRevenueSeries', () => {
    it('should return revenue for 7 days', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { totalAmount: 100, createdAt: new Date('2024-01-01') },
        { totalAmount: 200, createdAt: new Date('2024-01-01') },
        { totalAmount: 150, createdAt: new Date('2024-01-02') },
      ]);

      const result = await service.getRevenueSeries('venue-1', 7);

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('revenue');
    });

    it('should return revenue for 30 days', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getRevenueSeries('venue-1', 30);

      expect(result).toHaveLength(30);
    });
  });

  describe('getTopProducts', () => {
    it('should return top products sorted by quantity', async () => {
      mockPrismaService.orderItem.groupBy.mockResolvedValue([
        { productId: 'p1', _sum: { quantity: 10, total: 100 } },
        { productId: 'p2', _sum: { quantity: 5, total: 75 } },
      ]);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1', price: 10 },
        { id: 'p2', name: 'Product 2', price: 15 },
      ]);

      const result = await service.getTopProducts('venue-1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe('p1');
      expect(result[0].totalQuantity).toBe(10);
      expect(result[0].totalRevenue).toBe(100);
    });

    it('should handle missing products gracefully', async () => {
      mockPrismaService.orderItem.groupBy.mockResolvedValue([
        { productId: 'p1', _sum: { quantity: 5, total: 50 } },
      ]);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1', price: 10 },
      ]);

      const result = await service.getTopProducts('venue-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product 1');
    });
  });

  describe('getStationPerformance', () => {
    it('should return station performance metrics', async () => {
      mockPrismaService.station.findMany.mockResolvedValue([
        {
          id: 's1',
          name: 'Station 1',
          stationType: 'TABLE',
          orders: [{ totalAmount: 100 }, { totalAmount: 200 }],
          sessions: [
            {
              sessionCharge: 50,
              startTime: new Date('2024-01-01T10:00:00'),
              endTime: new Date('2024-01-01T11:00:00'),
            },
          ],
        },
      ]);

      const result = await service.getStationPerformance('venue-1');

      expect(result).toHaveLength(1);
      expect(result[0].stationId).toBe('s1');
      expect(result[0].orderRevenue).toBe(300);
      expect(result[0].sessionRevenue).toBe(50);
      expect(result[0].totalRevenue).toBe(350);
      expect(result[0].sessionCount).toBe(1);
    });
  });

  describe('getHourlyHeatmap', () => {
    it('should return hourly heatmap data', async () => {
      const now = new Date();
      mockPrismaService.order.findMany.mockResolvedValue([
        { createdAt: new Date(now.setHours(10)), totalAmount: 100 },
        { createdAt: new Date(now.setHours(10)), totalAmount: 200 },
        { createdAt: new Date(now.setHours(14)), totalAmount: 150 },
      ]);

      const result = await service.getHourlyHeatmap('venue-1');

      expect(result).toHaveLength(24);
      expect(result.find((r) => r.hour === 10)).toBeDefined();
      expect(result.find((r) => r.hour === 14)).toBeDefined();
    });
  });

  describe('getPaymentMethodDistribution', () => {
    it('should return payment method distribution', async () => {
      mockPrismaService.payment.groupBy.mockResolvedValue([
        { method: 'CASH', _count: 5, _sum: { amount: 500 } },
        { method: 'CARD', _count: 10, _sum: { amount: 1000 } },
      ]);

      const result = await service.getPaymentMethodDistribution('venue-1');

      expect(result).toHaveLength(2);
      expect(result[0].method).toBe('CASH');
      expect(result[0].count).toBe(5);
      expect(result[0].total).toBe(500);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown by revenue', async () => {
      mockPrismaService.orderItem.groupBy.mockResolvedValue([
        { productId: 'p1', _sum: { quantity: 10, total: 200 } },
        { productId: 'p2', _sum: { quantity: 5, total: 100 } },
      ]);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', categoryId: 'c1', name: 'Product 1' },
        { id: 'p2', categoryId: 'c1', name: 'Product 2' },
      ]);

      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'c1', name: 'Category 1' },
      ]);

      const result = await service.getCategoryBreakdown('venue-1');

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('c1');
      expect(result[0].name).toBe('Category 1');
      expect(result[0].totalQuantity).toBe(15);
      expect(result[0].totalRevenue).toBe(300);
    });

    it('should handle multiple categories', async () => {
      mockPrismaService.orderItem.groupBy.mockResolvedValue([
        { productId: 'p1', _sum: { quantity: 10, total: 200 } },
        { productId: 'p2', _sum: { quantity: 5, total: 150 } },
      ]);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p1', categoryId: 'c1', name: 'Product 1' },
        { id: 'p2', categoryId: 'c2', name: 'Product 2' },
      ]);

      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'c1', name: 'Category 1' },
        { id: 'c2', name: 'Category 2' },
      ]);

      const result = await service.getCategoryBreakdown('venue-1');

      expect(result).toHaveLength(2);
      expect(result[0].totalRevenue).toBeGreaterThanOrEqual(
        result[1].totalRevenue,
      );
    });

    it('should return empty array for venue with no orders', async () => {
      mockPrismaService.orderItem.groupBy.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.getCategoryBreakdown('empty-venue');

      expect(result).toEqual([]);
    });
  });
});
