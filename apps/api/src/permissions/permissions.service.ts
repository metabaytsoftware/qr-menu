import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/client';

export const RESOURCES = [
  'analytics', 'categories', 'products', 'stations',
  'payments', 'sessions', 'orders', 'venues', 'tariffs', 'users',
] as const;

export const ACTIONS: Record<string, string[]> = {
  analytics:  ['read'],
  categories: ['read', 'write'],
  products:   ['read', 'write'],
  stations:   ['read', 'write'],
  payments:   ['read', 'write'],
  sessions:   ['read', 'write'],
  orders:     ['read', 'update_status', 'cancel'],
  venues:     ['read', 'write'],
  tariffs:    ['read', 'write'],
  users:      ['read', 'write'],
};

@Injectable()
export class PermissionsService implements OnModuleInit {
  private cache = new Map<string, boolean>();
  private cacheExpiry = 0;
  private readonly TTL = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  async hasPermission(role: string, resource: string, action: string): Promise<boolean> {
    if (role === Role.OWNER) return true;
    if (Date.now() > this.cacheExpiry) await this.refreshCache();
    return this.cache.get(`${role}:${resource}:${action}`) ?? false;
  }

  async getAll() {
    if (Date.now() > this.cacheExpiry) await this.refreshCache();
    const result: Record<string, Record<string, Record<string, boolean>>> = {};
    for (const role of Object.values(Role)) {
      result[role] = {};
      for (const resource of RESOURCES) {
        result[role][resource] = {};
        for (const action of ACTIONS[resource]) {
          result[role][resource][action] =
            role === Role.OWNER ? true : (this.cache.get(`${role}:${resource}:${action}`) ?? false);
        }
      }
    }
    return result;
  }

  async update(updates: { role: Role; resource: string; action: string; allowed: boolean }[]) {
    await Promise.all(
      updates.map((u) =>
        this.prisma.rolePermission.upsert({
          where: { role_resource_action: { role: u.role, resource: u.resource, action: u.action } },
          update: { allowed: u.allowed },
          create: u,
        }),
      ),
    );
    await this.refreshCache();
  }

  private async refreshCache() {
    const rows = await this.prisma.rolePermission.findMany();
    this.cache.clear();
    for (const r of rows) {
      this.cache.set(`${r.role}:${r.resource}:${r.action}`, r.allowed);
    }
    this.cacheExpiry = Date.now() + this.TTL;
  }
}
