import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuPage from './page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Admin Menu Page', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Burgers', sortOrder: 1, isActive: true, _count: { products: 2 } },
    { id: 'cat-2', name: 'Drinks', sortOrder: 2, isActive: true, _count: { products: 1 } },
  ];

  const mockProducts = [
    {
      id: 'prod-1',
      name: 'Gamer Burger',
      description: 'Double beef',
      price: 189.9,
      imageUrl: null,
      isActive: true,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Burgers' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('venueId', 'test-venue');
    (api.fetchCategories as jest.Mock).mockResolvedValue(mockCategories);
    (api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
  });

  describe('Products Tab', () => {
    it('should display products on initial load', async () => {
      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText('Gamer Burger')).toBeInTheDocument();
      });
      expect(api.fetchProducts).toHaveBeenCalled();
    });

    it('should show product count', async () => {
      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText(/1 ürün/)).toBeInTheDocument();
      });
    });

    it('should open create product modal', async () => {
      const user = userEvent.setup();
      render(<MenuPage />);

      const addButton = await screen.findByRole('button', { name: /Ürün Ekle/ });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Yeni Ürün')).toBeInTheDocument();
      });
    });

    it('should handle product creation', async () => {
      const user = userEvent.setup();
      (api.createProduct as jest.Mock).mockResolvedValue({
        id: 'prod-2',
        name: 'New Burger',
        price: 199.9,
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Burgers' },
      });

      render(<MenuPage />);

      const addButton = await screen.findByRole('button', { name: /Ürün Ekle/ });
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Gamer Burger');
      await user.type(nameInput, 'New Burger');

      const priceInput = screen.getByPlaceholderText('89.90');
      await user.type(priceInput, '199.90');

      const submitButton = screen.getByRole('button', { name: /Kaydet/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.createProduct).toHaveBeenCalled();
      });
    });

    it('should toggle product availability', async () => {
      const user = userEvent.setup();
      (api.updateProduct as jest.Mock).mockResolvedValue({
        ...mockProducts[0],
        isActive: false,
      });

      render(<MenuPage />);

      await waitFor(() => {
        expect(screen.getByText('Gamer Burger')).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /Mevcut/ });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(api.updateProduct).toHaveBeenCalledWith('prod-1', { isActive: false });
      });
    });
  });

  describe('Categories Tab', () => {
    it('should switch to categories tab', async () => {
      const user = userEvent.setup();
      render(<MenuPage />);

      const categoriesTab = await screen.findByRole('button', { name: 'Kategoriler' });
      await user.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText('Burgers')).toBeInTheDocument();
        expect(screen.getByText('Drinks')).toBeInTheDocument();
      });
    });

    it('should show category count', async () => {
      const user = userEvent.setup();
      render(<MenuPage />);

      const categoriesTab = await screen.findByRole('button', { name: 'Kategoriler' });
      await user.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText(/2 kategori/)).toBeInTheDocument();
      });
    });

    it('should open create category modal', async () => {
      const user = userEvent.setup();
      render(<MenuPage />);

      const categoriesTab = await screen.findByRole('button', { name: 'Kategoriler' });
      await user.click(categoriesTab);

      const addButton = await screen.findByRole('button', { name: /Kategori Ekle/ });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Yeni Kategori')).toBeInTheDocument();
      });
    });

    it('should show product count per category', async () => {
      const user = userEvent.setup();
      render(<MenuPage />);

      const categoriesTab = await screen.findByRole('button', { name: 'Kategoriler' });
      await user.click(categoriesTab);

      await waitFor(() => {
        expect(screen.getByText('2 ürün')).toBeInTheDocument();
      });
    });
  });
});
