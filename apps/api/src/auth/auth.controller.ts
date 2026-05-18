import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from '@meta-repo/auth-api';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ global: { ttl: 60000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('cloudflare-login')
  @HttpCode(HttpStatus.OK)
  async cloudflareLogin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cfJwt = req.headers['cf-access-jwt-assertion'] as string;
    const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
    const aud = process.env.CF_ACCESS_AUD;

    let email: string | undefined;

    if (cfJwt && teamDomain && aud) {
      try {
        const JWKS = createRemoteJWKSet(
          new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
        );
        const { payload } = await jwtVerify(cfJwt, JWKS, { audience: aud });
        email = payload['email'] as string;
      } catch {
        throw new UnauthorizedException('Cloudflare Access JWT doğrulanamadı');
      }
    } else {
      // CF_ACCESS_TEAM_DOMAIN/AUD tanımlı değilse header'a geri dön (dev ortamı)
      email = req.headers['cf-access-authenticated-user-email'] as string;
    }

    if (!email) {
      throw new UnauthorizedException('Cloudflare Access kimliği bulunamadı');
    }
    const result = await this.authService.cloudflareLogin(email);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Cookie temizle — JWT olsun ya da olmasın
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    // JWT varsa refresh token'ı DB'den de sil
    const token = (req.cookies as Record<string, string>)?.access_token;
    if (token) {
      try {
        await this.authService.logoutByToken(token);
      } catch {}
    }
  }

  @Get('cloudflare-user')
  @HttpCode(HttpStatus.OK)
  async getCloudflareUser(@Req() req: Request) {
    const email = req.headers['cf-access-authenticated-user-email'] as string;
    const userName = req.headers['cf-access-authenticated-user-name'] as string;

    if (!email) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      email,
      name: userName || email.split('@')[0],
      picture: null,
    };
  }
}
