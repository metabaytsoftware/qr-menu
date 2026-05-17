import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Admin Dashboard Page', () => {
  const mockOrders = [
    {
      id: 'order-1',
      station: { name: 'DEMO-01' },
      items: [{ product: { name: 'Gamer Burger' }, quantity: 1 }],
      totalAmount: 189.9,
      status: 'PENDING' as const,
      notes: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'order-2',
      station: { name: 'Table-02' },
      items: [{ product: { name: 'Neon Fries' }, quantity: 2 }],
      totalAmount: 170.0,
      status: 'PREPARING' as const,
      notes: null,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'order-3',
      station: { name: 'DEMO-01' },
      items: [{ product: { name: 'Cyber Soda' }, quantity: 1 }],
      totalAmount: 45.0,
      status: 'COMPLETED' as const,
      notes: null,
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('venueId', 'test-venue');
    (api.fetchOrders as jest.Mock).mockResolvedValue(mockOrders);
  });

  it('should display dashboard title', async () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Siparişler')).toBeInTheDocument();
  });

  it('should load orders from API', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(api.fetchOrders).toHaveBeenCalledWith('test-venue');
    });
  });

  it('should calculate active orders stat', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Aktif Siparişler')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should calculate daily revenue stat', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Günlük Gelir')).toBeInTheDocument();
      const revenue = 189.9 + 170.0 + 45.0;
      expect(screen.getByText(`₺${revenue.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  it('should calculate average order stat', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Ortalama Sipariş')).toBeInTheDocument();
      const avg = (189.9 + 170.0 + 45.0) / 3;
      expect(screen.getByText(`₺${avg.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  it('should calculate total orders stat', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Toplam Sipariş')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should display recent orders', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('DEMO-01').length).toBeGreaterThan(0);
      expect(screen.getByText('Table-02')).toBeInTheDocument();
    });
  });

  it('should show quick access links', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Menü Yönetimi')).toBeInTheDocument();
      expect(screen.getByText('Siparişler')).toBeInTheDocument();
      expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });
  });

  it('should link to menu management', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const menuLink = screen.getByRole('link', { name: /Menü Yönetimi/i });
      expect(menuLink).toHaveAttribute('href', '/admin/menu');
    });
  });

  it('should link to orders management', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const ordersLinks = screen.getAllByRole('link', { name: /Siparişler/i });
      const adminOrdersLink = ordersLinks.find((link) => link.getAttribute('href') === '/admin/orders');
      expect(adminOrdersLink).toBeDefined();
    });
  });

  it('should poll for updates', async () => {
    jest.useFakeTimers();
    try {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(api.fetchOrders).toHaveBeenCalledTimes(1);
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(api.fetchOrders).toHaveBeenCalledTimes(2);
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
