import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '../generated/client';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockOrder = {
    id: 'order-1',
    venueId: 'venue-1',
    stationId: 'station-1',
    status: 'PENDING' as OrderStatus,
    totalAmount: 320.9,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    station: { id: 'station-1', name: 'DEMO-01' },
  };

  const mockService = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    getByVenue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order', async () => {
      mockService.create.mockResolvedValue(mockOrder);

      const result = await controller.create({
        stationId: 'station-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(result).toEqual(mockOrder);
      expect(mockService.create).toHaveBeenCalledWith({
        stationId: 'station-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });
    });
  });

  describe('getByVenue', () => {
    it('should get orders for a venue', async () => {
      mockService.getByVenue.mockResolvedValue([mockOrder]);

      const result = await controller.getByVenue('venue-1');

      expect(result).toEqual([mockOrder]);
      expect(mockService.getByVenue).toHaveBeenCalledWith('venue-1', undefined);
    });

    it('should filter by status', async () => {
      mockService.getByVenue.mockResolvedValue([mockOrder]);

      const result = await controller.getByVenue('venue-1', 'PENDING');

      expect(result).toEqual([mockOrder]);
      expect(mockService.getByVenue).toHaveBeenCalledWith('venue-1', 'PENDING');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      mockService.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'PREPARING' as OrderStatus,
      });

      const result = await controller.updateStatus('order-1', {
        status: 'PREPARING',
      });

      expect(result.status).toBe('PREPARING');
      expect(mockService.updateStatus).toHaveBeenCalledWith(
        'order-1',
        'PREPARING',
      );
    });
  });
});
