import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, JwtAuthGuard, CurrentUser } from '@meta-repo/auth-api';
import { Request } from 'express';

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

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.sub);
  }

  @Get('cloudflare-user')
  @HttpCode(HttpStatus.OK)
  async getCloudflareUser(@Req() req: Request) {
    const email = req.headers['cf-access-authenticated-user-email'] as string;
    const userName = req.headers['cf-access-authenticated-user-name'] as string;
    const userPhone = req.headers['cf-access-authenticated-user-phone'] as string;

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
