import { Controller, Get, Put, Body, ForbiddenException } from '@nestjs/common';
import { PermissionsService, RESOURCES, ACTIONS } from './permissions.service';
import { Permission } from './permission.decorator';
import { CurrentUser } from '@meta-repo/auth-api';
import { Role } from '../generated/client';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get('schema')
  @Permission('venues', 'read')
  getSchema() {
    return { resources: RESOURCES, actions: ACTIONS, roles: Object.values(Role) };
  }

  @Get()
  @Permission('venues', 'read')
  getAll() {
    return this.service.getAll();
  }

  @Put()
  @Permission('venues', 'write')
  async update(
    @CurrentUser() user: any,
    @Body() body: { role: Role; resource: string; action: string; allowed: boolean }[],
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Sadece Owner izinleri düzenleyebilir');
    }
    await this.service.update(body);
    return { ok: true };
  }
}
