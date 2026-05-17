import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct = {
    id: 'prod-1',
    venueId: 'venue-1',
    categoryId: 'cat-1',
    name: 'Gamer Burger',
    description: 'Double beef with cheese',
    price: 189.9,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', name: 'Burgers' },
  };

  const mockPrisma = {
    product: {
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
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findByVenue', () => {
    it('should return products ordered by category then name', async () => {
      const products = [mockProduct];
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await service.findByVenue('venue-1');

      expect(result).toEqual(products);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { venueId: 'venue-1' },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { name: 'asc' },
        ],
      });
    });

    it('should return empty array if no products found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await service.findByVenue('venue-1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a product with required fields', async () => {
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        venueId: 'venue-1',
        categoryId: 'cat-1',
        name: 'Gamer Burger',
        description: 'Double beef with cheese',
        price: 189.9,
      });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          venueId: 'venue-1',
          categoryId: 'cat-1',
          name: 'Gamer Burger',
          description: 'Double beef with cheese',
          price: 189.9,
          imageUrl: undefined,
        },
        include: { category: { select: { id: true, name: true } } },
      });
    });

    it('should create a product with optional imageUrl', async () => {
      mockPrisma.product.create.mockResolvedValue({
        ...mockProduct,
        imageUrl: 'https://example.com/burger.png',
      });

      const result = await service.create({
        venueId: 'venue-1',
        categoryId: 'cat-1',
        name: 'Gamer Burger',
        price: 189.9,
        imageUrl: 'https://example.com/burger.png',
      });

      expect(result.imageUrl).toBe('https://example.com/burger.png');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        price: 199.9,
      });

      const result = await service.update('prod-1', { price: 199.9 });

      expect(result.price).toBe(199.9);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { price: 199.9 },
        include: { category: { select: { id: true, name: true } } },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
