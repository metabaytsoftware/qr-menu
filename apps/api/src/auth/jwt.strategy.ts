import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

function extractFromHeaderOrCookie(req: Request): string | null {
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (fromHeader) return fromHeader;
  return (req.cookies as Record<string, string>)?.access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractFromHeaderOrCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'default_secret',
      passReqToCallback: false,
    });
  }

  validate(payload: any): any {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
