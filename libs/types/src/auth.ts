import type { Role } from './common';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  dealerId: string | null;
  venueId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  dealerId: string | null;
  venueId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
