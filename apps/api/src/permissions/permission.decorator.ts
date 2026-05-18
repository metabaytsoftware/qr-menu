import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@meta-repo/auth-api';
import { PermissionsGuard } from './permissions.guard';

export const PERMISSION_KEY = 'permission';

export const Permission = (resource: string, action: string) =>
  applyDecorators(
    SetMetadata(PERMISSION_KEY, { resource, action }),
    UseGuards(JwtAuthGuard, PermissionsGuard),
  );
