import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockSession = {
    id: 'session-1',
    stationId: 'station-1',
    status: 'ACTIVE',
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: null,
    hourlyRate: 60,
    totalPaused: 0,
    pausedAt: null,
    isBillLess: false,
    orders: [],
    station: { id: 'station-1', hourlyRate: 60 },
  };

  const mockPrisma = {
    station: { findUnique: jest.fn() },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start a session successfully', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({ id: 'station-1', isActive: true, hourlyRate: 50 });
      mockPrisma.session.findFirst.mockResolvedValue(null);
      mockPrisma.session.create.mockResolvedValue(mockSession);

      const result = await service.start({ stationId: 'station-1' });

      expect(result).toEqual(mockSession);
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          stationId: 'station-1',
          isBillLess: false,
          hourlyRate: 50,
          status: 'ACTIVE',
        },
        include: { station: true },
      });
    });

    it('should throw if station not found or inactive', async () => {
      mockPrisma.station.findUnique.mockResolvedValue(null);
      await expect(service.start({ stationId: 'invalid' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if station already has an active session', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({ id: 'station-1', isActive: true });
      mockPrisma.session.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.start({ stationId: 'station-1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('pause and resume', () => {
    it('should pause an active session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.session.update.mockResolvedValue({ ...mockSession, status: 'PAUSED', pausedAt: new Date() });

      const result = await service.pause('session-1');
      expect(result.status).toBe('PAUSED');
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({ status: 'PAUSED' }),
      });
    });

    it('should resume a paused session', async () => {
      const pausedAt = new Date(Date.now() - 60000); // 1 minute ago
      mockPrisma.session.findUnique.mockResolvedValue({ ...mockSession, status: 'PAUSED', pausedAt });
      mockPrisma.session.update.mockResolvedValue({ ...mockSession, status: 'ACTIVE', pausedAt: null, totalPaused: 60 });

      const result = await service.resume('session-1');
      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          pausedAt: null,
          totalPaused: expect.any(Number),
        }),
      });
    });
  });

  describe('end and billing', () => {
    it('should end session and calculate charge correctly', async () => {
      // 1 hour elapsed, 0 paused, 60/hr -> 60 charge
      const startTime = new Date(Date.now() - 3600000);
      mockPrisma.session.findUnique.mockResolvedValue({ ...mockSession, startTime });
      mockPrisma.session.update.mockResolvedValue({ ...mockSession, status: 'ENDED', sessionCharge: 60 });

      await service.end('session-1');
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          status: 'ENDED',
          sessionCharge: 60,
        }),
        include: expect.any(Object),
      });
    });

    it('should calculate bill including food and payments', async () => {
      const startTime = new Date(Date.now() - 3600000);
      mockPrisma.session.findUnique.mockResolvedValue({
        ...mockSession,
        startTime,
        hourlyRate: 60,
        orders: [
          {
            totalAmount: 100,
            payments: [{ amount: 40 }],
          },
        ],
      });

      const bill = await service.getSessionBill('session-1');

      // 1 hour = 60 charge
      // food = 100
      // grandTotal = 160
      // paid = 40
      // remaining = 120
      expect(bill.sessionCharge).toBe(60);
      expect(bill.foodTotal).toBe(100);
      expect(bill.grandTotal).toBe(160);
      expect(bill.paidTotal).toBe(40);
      expect(bill.remaining).toBe(120);
    });
  });
});
