import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StationsService } from './stations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StationsService', () => {
  let service: StationsService;

  const mockStation = {
    id: 'station-1',
    venueId: 'venue-1',
    name: 'Table 1',
    qrCode: 'v1-table1-1234',
    stationType: 'TABLE',
    hourlyRate: 0,
    isActive: true,
  };

  const mockPrisma = {
    station: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a station with generated QR code', async () => {
      mockPrisma.station.create.mockResolvedValue(mockStation);

      const result = await service.create({
        venueId: 'venue-1',
        name: 'Table 1',
        stationType: 'TABLE',
      });

      expect(result).toEqual(mockStation);
      expect(mockPrisma.station.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          venueId: 'venue-1',
          name: 'Table 1',
          qrCode: expect.any(String),
        }),
      });
    });
  });

  describe('remove', () => {
    it('should delete station if no active sessions', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({
        ...mockStation,
        _count: { sessions: 0 },
      });

      await service.remove('station-1');

      expect(mockPrisma.station.delete).toHaveBeenCalledWith({ where: { id: 'station-1' } });
    });

    it('should throw if station has active sessions', async () => {
      mockPrisma.station.findUnique.mockResolvedValue({
        ...mockStation,
        _count: { sessions: 1 },
      });

      await expect(service.remove('station-1')).rejects.toThrow(BadRequestException);
    });
  });
});
