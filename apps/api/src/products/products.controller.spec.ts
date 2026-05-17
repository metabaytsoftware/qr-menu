import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

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

  const mockService = {
    findByVenue: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  describe('findByVenue', () => {
    it('should return products for a venue', async () => {
      mockService.findByVenue.mockResolvedValue([mockProduct]);

      const result = await controller.findByVenue('venue-1');

      expect(result).toEqual([mockProduct]);
      expect(mockService.findByVenue).toHaveBeenCalledWith('venue-1');
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockService.create.mockResolvedValue(mockProduct);

      const result = await controller.create({
        venueId: 'venue-1',
        categoryId: 'cat-1',
        name: 'Gamer Burger',
        price: 189.9,
      });

      expect(result).toEqual(mockProduct);
      expect(mockService.create).toHaveBeenCalledWith({
        venueId: 'venue-1',
        categoryId: 'cat-1',
        name: 'Gamer Burger',
        price: 189.9,
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockService.update.mockResolvedValue({
        ...mockProduct,
        price: 199.9,
      });

      const result = await controller.update('prod-1', { price: 199.9 });

      expect(result.price).toBe(199.9);
      expect(mockService.update).toHaveBeenCalledWith('prod-1', {
        price: 199.9,
      });
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockService.remove.mockResolvedValue(mockProduct);

      const result = await controller.remove('prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockService.remove).toHaveBeenCalledWith('prod-1');
    });
  });
});
