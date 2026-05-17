export interface Venue {
  id: string;
  name: string;
  type: string;
  logoUrl: string | null;
}

export type StationType = 'PLAYSTATION' | 'TABLE' | 'BAR' | 'BOOTH' | 'OTHER';

export interface Station {
  id: string;
  name: string;
  qrCode: string;
  stationType: StationType;
  hourlyRate: number | null;
  isActive: boolean;
  _count?: { orders: number; sessions: number };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface MenuResponse {
  venue: Venue;
  station: Station;
  categories: Category[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Admin types
export interface AdminCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  category: { id: string; name: string };
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL_WALLET';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface OrderItem {
  id: string;
  product: { name: string; id: string };
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  change: number;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  station: { name: string; id: string };
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  isBillLess: boolean;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  sessionId: string | null;
  payments: Payment[];
}

export interface Tariff {
  id: string;
  name: string;
  stationType: StationType;
  ratePerHour: number;
  peakHourStart: number | null;
  peakHourEnd: number | null;
  peakRate: number | null;
  isActive: boolean;
}

export interface Session {
  id: string;
  stationId: string;
  station?: Station;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  isBillLess: boolean;
  hourlyRate: number;
  sessionCharge: number | null;
  totalPaused: number;
  orders?: Order[];
}

export interface SessionBill {
  session: Session;
  durationSeconds: number;
  durationHours: number;
  hourlyRate: number;
  sessionCharge: number;
  foodTotal: number;
  grandTotal: number;
  paidTotal: number;
  remaining: number;
}
