import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from '@meta-repo/auth-api';
import type { AuthTokens } from '@meta-repo/types';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz bilgiler');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Geçersiz bilgiler');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.venueId);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        venueId: user.venueId,
      },
      ...tokens,
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    try {
      this.jwtService.verify(rawRefreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'default_refresh_secret',
      });

      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token invalid or expired');
      }

      await this.prisma.refreshToken.delete({ where: { token: tokenHash } });

      return this.issueTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role,
        storedToken.user.venueId,
      );
    } catch (err) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

  async cloudflareLogin(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Bu e-posta ile kayıtlı aktif kullanıcı bulunamadı');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.venueId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        venueId: user.venueId,
      },
      ...tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    venueId: string | null,
  ): Promise<AuthTokens> {
    const payload: any = {
      sub: userId,
      email,
      role,
      venueId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'default_secret',
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const rawRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'default_refresh_secret',
      expiresIn: '7d',
    });

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, expiresIn: 15 * 60 };
  }
}
