import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../generated/client';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrder = {
    id: 'order-1',
    venueId: 'venue-1',
    stationId: 'station-1',
    status: 'PENDING' as OrderStatus,
    totalAmount: 320.9,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 189.9,
        total: 189.9,
        product: { id: 'prod-1', name: 'Gamer Burger' },
      },
    ],
    station: { id: 'station-1', name: 'DEMO-01' },
  };

  const mockPrisma = {
    station: { findUnique: jest.fn() },
    product: { findMany: jest.fn() },
    order: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({
        id: 'station-1',
        venueId: 'venue-1',
        isActive: true,
      });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', price: 189.9 },
      ]);
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.create({
        stationId: 'station-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it('should throw if station not found', async () => {
      mockPrisma.station.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          stationId: 'invalid',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if product not found', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({
        id: 'station-1',
        venueId: 'venue-1',
      });
      mockPrisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.create({
          stationId: 'station-1',
          items: [{ productId: 'invalid', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include order notes', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({
        id: 'station-1',
        venueId: 'venue-1',
      });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', price: 189.9 },
      ]);
      mockPrisma.order.create.mockResolvedValue({
        ...mockOrder,
        notes: 'Az tuzlu',
      });

      const result = await service.create({
        stationId: 'station-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
        notes: 'Az tuzlu',
      });

      expect(result.notes).toBe('Az tuzlu');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PREPARING' as OrderStatus,
      });

      const result = await service.updateStatus('order-1', 'PREPARING');

      expect(result.status).toBe('PREPARING');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'PREPARING' },
        include: {
          items: { include: { product: true } },
          station: true,
          payments: true,
        },
      });
    });

    it('should throw if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('invalid', 'PREPARING')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should transition through all statuses', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const statuses: OrderStatus[] = [
        'PENDING',
        'PREPARING',
        'SERVED',
        'COMPLETED',
      ];

      for (const status of statuses) {
        mockPrisma.order.update.mockResolvedValue({
          ...mockOrder,
          status,
        });

        const result = await service.updateStatus('order-1', status);
        expect(result.status).toBe(status);
      }
    });

    it('should handle CANCELLED status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED' as OrderStatus,
      });

      const result = await service.updateStatus('order-1', 'CANCELLED');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getByVenue', () => {
    it('should return all orders for a venue', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.getByVenue('venue-1');

      expect(result).toEqual([mockOrder]);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { venueId: 'venue-1' },
        include: {
          items: { include: { product: true } },
          station: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.getByVenue('venue-1', 'PENDING');

      expect(result).toEqual([mockOrder]);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { venueId: 'venue-1', status: 'PENDING' },
        include: {
          items: { include: { product: true } },
          station: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should ignore invalid status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      await service.getByVenue('venue-1', 'INVALID');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { venueId: 'venue-1' },
        include: {
          items: { include: { product: true } },
          station: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no orders found', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.getByVenue('venue-1');

      expect(result).toEqual([]);
    });
  });
});
