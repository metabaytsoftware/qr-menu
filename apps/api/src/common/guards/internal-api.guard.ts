import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('INTERNAL_API_SECRET');
    if (!secret) return true; // Dev ortamında env var yoksa izin ver

    const request = context.switchToHttp().getRequest<Request>();

    // Cloud Run health check için muaf tut
    if (request.path === '/api/health') return true;

    const header = request.headers['x-internal-api-secret'];
    if (header !== secret) {
      throw new ForbiddenException('Access denied');
    }
    return true;
  }
}
