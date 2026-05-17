import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SessionsPage from './page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Sessions Page', () => {
  const mockStations = [
    {
      id: 'station-1',
      name: 'PS-01',
      stationType: 'PLAYSTATION',
      hourlyRate: 50,
      isActive: true,
    },
  ];

  const mockActiveSession = {
    id: 'session-1',
    status: 'ACTIVE',
    startTime: new Date().toISOString(),
  };

  const mockBill = {
    sessionCharge: 25,
    foodTotal: 100,
    paidTotal: 40,
    grandTotal: 125,
    remaining: 85,
    durationSeconds: 1800,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('venueId', 'test-venue');
    (api.fetchStations as jest.Mock).mockResolvedValue(mockStations);
    (api.fetchActiveSession as jest.Mock).mockResolvedValue(null);
  });

  it('should display loading state initially', () => {
    render(<SessionsPage />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('should load and display stations', async () => {
    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('PS-01')).toBeInTheDocument();
      expect(screen.getByText('▶ Oturum Başlat')).toBeInTheDocument();
    });
  });

  it('should show start session form when button clicked', async () => {
    render(<SessionsPage />);

    await waitFor(() => screen.getByText('▶ Oturum Başlat'));
    fireEvent.click(screen.getByText('▶ Oturum Başlat'));

    expect(screen.getByText('Başlat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('₺50')).toBeInTheDocument();
  });

  it('should call startSession API when form submitted', async () => {
    (api.startSession as jest.Mock).mockResolvedValue({ id: 'new-session' });
    render(<SessionsPage />);

    await waitFor(() => screen.getByText('▶ Oturum Başlat'));
    fireEvent.click(screen.getByText('▶ Oturum Başlat'));
    fireEvent.click(screen.getByText('Başlat'));

    await waitFor(() => {
      expect(api.startSession).toHaveBeenCalledWith({
        stationId: 'station-1',
        isBillLess: false,
        hourlyRate: undefined,
      });
    });
  });

  it('should display active session and billing info', async () => {
    (api.fetchActiveSession as jest.Mock).mockResolvedValue(mockActiveSession);
    (api.fetchSessionBill as jest.Mock).mockResolvedValue(mockBill);

    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('🟢 Aktif')).toBeInTheDocument();
      expect(screen.getByText('₺25.00')).toBeInTheDocument(); // sessionCharge
      expect(screen.getByText('₺100.00')).toBeInTheDocument(); // foodTotal
      expect(screen.getByText('₺85.00')).toBeInTheDocument(); // remaining
    });
  });
});
