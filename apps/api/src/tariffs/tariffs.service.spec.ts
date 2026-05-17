import { Test, TestingModule } from '@nestjs/testing';
import { TariffsService } from './tariffs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TariffsService', () => {
  let service: TariffsService;

  const mockTariff = {
    id: 'tariff-1',
    venueId: 'venue-1',
    stationType: 'PC',
    ratePerHour: 50,
    peakHourStart: 18,
    peakHourEnd: 22,
    peakRate: 75,
    isActive: true,
  };

  const mockPrisma = {
    tariff: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TariffsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TariffsService>(TariffsService);
    jest.clearAllMocks();
  });

  describe('getEffectiveRate', () => {
    it('should return normal rate outside peak hours', async () => {
      mockPrisma.tariff.findFirst.mockResolvedValue(mockTariff);

      const rate = await service.getEffectiveRate('venue-1', 'PC', 14); // 2 PM

      expect(rate).toBe(50);
    });

    it('should return peak rate during peak hours', async () => {
      mockPrisma.tariff.findFirst.mockResolvedValue(mockTariff);

      const rate = await service.getEffectiveRate('venue-1', 'PC', 19); // 7 PM

      expect(rate).toBe(75);
    });

    it('should return 0 if no tariff found', async () => {
      mockPrisma.tariff.findFirst.mockResolvedValue(null);

      const rate = await service.getEffectiveRate('venue-1', 'OTHER', 14);

      expect(rate).toBe(0);
    });
  });
});
