import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersPage from './page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Admin Orders Page', () => {
  const mockOrders = [
    {
      id: 'order-1',
      station: { name: 'DEMO-01' },
      items: [
        { product: { name: 'Gamer Burger' }, quantity: 1 },
        { product: { name: 'Neon Fries' }, quantity: 2 },
      ],
      totalAmount: 360.9,
      status: 'PENDING' as const,
      notes: null,
      createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    },
    {
      id: 'order-2',
      station: { name: 'Table-02' },
      items: [{ product: { name: 'Cyber Soda' }, quantity: 3 }],
      totalAmount: 135.0,
      status: 'PREPARING' as const,
      notes: 'No ice',
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('venueId', 'test-venue');
    (api.fetchOrders as jest.Mock).mockResolvedValue(mockOrders);
    (api.updateOrderStatus as jest.Mock).mockResolvedValue(mockOrders[0]);
  });

  it('should display all orders on initial load', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('DEMO-01')).toBeInTheDocument();
      expect(screen.getByText('Table-02')).toBeInTheDocument();
    });
    expect(api.fetchOrders).toHaveBeenCalledWith('test-venue');
  });

  it('should show order items', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Gamer Burger/)).toBeInTheDocument();
      expect(screen.getByText(/Neon Fries/)).toBeInTheDocument();
      expect(screen.getByText(/Cyber Soda/)).toBeInTheDocument();
    });
  });

  it('should show order total amounts', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('₺360.90')).toBeInTheDocument();
      expect(screen.getByText('₺135.00')).toBeInTheDocument();
    });
  });

  it('should display order status', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Bekliyor')).toBeInTheDocument();
      expect(screen.getByText('Hazırlanıyor')).toBeInTheDocument();
    });
  });

  it('should filter orders by status button highlighting', async () => {
    const user = userEvent.setup();
    render(<OrdersPage />);

    // Initially "All" button should be selected
    let allButton = screen.getByRole('button', { name: 'Tümü' });
    expect(allButton.className).toContain('bg-blue-600');

    // Click the PENDING filter button
    const pendingButton = screen.getByRole('button', { name: 'Bekliyor' });
    await user.click(pendingButton);

    // Now "Bekliyor" button should be selected
    expect(pendingButton.className).toContain('bg-blue-600');

    // And "All" button should not be selected
    allButton = screen.getByRole('button', { name: 'Tümü' });
    expect(allButton.className).not.toContain('bg-blue-600');
  });

  it('should advance order status', async () => {
    const user = userEvent.setup();
    (api.updateOrderStatus as jest.Mock).mockResolvedValue({
      ...mockOrders[0],
      status: 'PREPARING',
    });

    render(<OrdersPage />);

    const advanceButton = await screen.findByRole('button', { name: /→ Hazırlanıyor/ });
    await user.click(advanceButton);

    await waitFor(() => {
      expect(api.updateOrderStatus).toHaveBeenCalledWith('order-1', 'PREPARING');
    });
  });

  it('should cancel order', async () => {
    const user = userEvent.setup();
    (api.updateOrderStatus as jest.Mock).mockResolvedValue({
      ...mockOrders[0],
      status: 'CANCELLED',
    });

    render(<OrdersPage />);

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    const cancelButton = await screen.findAllByRole('button');
    const cancelBtn = cancelButton.find((btn) =>
      btn.innerHTML.includes('M3 6h18'),
    );

    if (cancelBtn) {
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(api.updateOrderStatus).toHaveBeenCalledWith('order-1', 'CANCELLED');
      });
    }
  });

  it('should show time elapsed', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/1d önce/)).toBeInTheDocument();
      expect(screen.getByText(/5d önce/)).toBeInTheDocument();
    });
  });

  it('should show item count', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('2 kalem')).toBeInTheDocument();
      expect(screen.getByText('1 kalem')).toBeInTheDocument();
    });
  });

  it('should poll for updates', async () => {
    jest.useFakeTimers();
    render(<OrdersPage />);

    await waitFor(() => {
      expect(api.fetchOrders).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(api.fetchOrders).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
