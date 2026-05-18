import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, JwtAuthGuard, CurrentUser } from '@meta-repo/auth-api';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const email = req.headers['cf-access-authenticated-user-email'] as string;
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.sub);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
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
