import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = {
    id: 'cat-1',
    venueId: 'venue-1',
    name: 'Burgers',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findByVenue', () => {
    it('should return categories ordered by sortOrder', async () => {
      const categories = [mockCategory];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findByVenue('venue-1');

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { venueId: 'venue-1' },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      });
    });

    it('should return empty array if no categories found', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await service.findByVenue('venue-1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a category with default sortOrder of 0', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({
        venueId: 'venue-1',
        name: 'Burgers',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          venueId: 'venue-1',
          name: 'Burgers',
          sortOrder: 0,
        },
      });
    });

    it('should create a category with provided sortOrder', async () => {
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        sortOrder: 5,
      });

      const result = await service.create({
        venueId: 'venue-1',
        name: 'Burgers',
        sortOrder: 5,
      });

      expect(result.sortOrder).toBe(5);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          venueId: 'venue-1',
          name: 'Burgers',
          sortOrder: 5,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        name: 'Updated',
      });

      const result = await service.update('cat-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Updated' },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update isActive status', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      const result = await service.update('cat-1', { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const result = await service.remove('cat-1');

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
