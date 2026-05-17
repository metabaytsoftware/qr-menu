import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockOrder = {
    id: 'order-1',
    totalAmount: 100,
    paidAmount: 0,
    paymentStatus: 'PENDING',
    payments: [],
  };

  const mockPayment = {
    id: 'pay-1',
    orderId: 'order-1',
    amount: 50,
    method: 'CASH',
    change: 0,
    createdAt: new Date(),
  };

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('addPayment', () => {
    it('should add a partial payment', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.addPayment({
        orderId: 'order-1',
        amount: 50,
        method: 'CASH',
      });

      expect(result.paidAmount).toBe(50);
      expect(result.remaining).toBe(50);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paidAmount: 50, paymentStatus: 'PARTIAL' },
      });
    });

    it('should add a full payment and handle change', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, paidAmount: 50, payments: [{ amount: 50 }] });
      mockPrisma.payment.create.mockResolvedValue({ ...mockPayment, amount: 60, change: 10 });

      const result = await service.addPayment({
        orderId: 'order-1',
        amount: 60,
        method: 'CASH',
      });

      expect(result.paidAmount).toBe(110);
      expect(result.change).toBe(10);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paidAmount: 110, paymentStatus: 'PAID' },
      });
    });

    it('should throw if order already paid', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID' });
      await expect(service.addPayment({ orderId: 'order-1', amount: 10, method: 'CASH' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('reversePayment', () => {
    it('should reverse a payment and update order status', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        order: {
          id: 'order-1',
          totalAmount: 100,
          payments: [mockPayment, { id: 'pay-2', amount: 30 }],
        },
      });

      const result = await service.reversePayment('pay-1');

      expect(result.deleted).toBe('pay-1');
      expect(result.newPaidAmount).toBe(30);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paidAmount: 30, paymentStatus: 'PARTIAL' },
      });
      expect(mockPrisma.payment.delete).toHaveBeenCalledWith({ where: { id: 'pay-1' } });
    });
  });
});
