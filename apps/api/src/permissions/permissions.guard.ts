import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<{ resource: string; action: string }>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) return false;

    const allowed = await this.permissionsService.hasPermission(
      user.role,
      permission.resource,
      permission.action,
    );
    if (!allowed) throw new ForbiddenException('Bu işlem için yetkiniz yok');
    return true;
  }
}
