import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const mockCategory = {
    id: 'cat-1',
    venueId: 'venue-1',
    name: 'Burgers',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    findByVenue: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  describe('findByVenue', () => {
    it('should return categories for a venue', async () => {
      mockService.findByVenue.mockResolvedValue([mockCategory]);

      const result = await controller.findByVenue('venue-1');

      expect(result).toEqual([mockCategory]);
      expect(mockService.findByVenue).toHaveBeenCalledWith('venue-1');
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      mockService.create.mockResolvedValue(mockCategory);

      const result = await controller.create({
        venueId: 'venue-1',
        name: 'Burgers',
      });

      expect(result).toEqual(mockCategory);
      expect(mockService.create).toHaveBeenCalledWith({
        venueId: 'venue-1',
        name: 'Burgers',
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      mockService.update.mockResolvedValue({
        ...mockCategory,
        name: 'Updated',
      });

      const result = await controller.update('cat-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(mockService.update).toHaveBeenCalledWith('cat-1', {
        name: 'Updated',
      });
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockService.remove.mockResolvedValue(mockCategory);

      const result = await controller.remove('cat-1');

      expect(result).toEqual(mockCategory);
      expect(mockService.remove).toHaveBeenCalledWith('cat-1');
    });
  });
});
