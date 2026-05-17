import type { Decimal } from 'decimal.js';

export interface Dealer {
  id: string;
  name: string;
  taxNumber?: string;
  phone?: string;
  address?: string;
  region?: string;
  isActive: boolean;
  creditLimit: Decimal;
  currentBalance: Decimal;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  dealerId: string;
  orderId?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
  createdAt: string;
}

export interface AccountStatement {
  transactions: Transaction[];
  totalBalance: string;
}

export interface CreateDealerDto {
  name: string;
  taxNumber?: string;
  phone?: string;
  address?: string;
  region?: string;
}

export interface UpdateDealerDto {
  name?: string;
  taxNumber?: string;
  phone?: string;
  address?: string;
  region?: string;
}
