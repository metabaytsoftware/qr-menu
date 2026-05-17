import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venue.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, type: true, config: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, type: true, config: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    await this.findOne(id);
    return this.prisma.venue.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
      },
      select: { id: true, name: true, slug: true, type: true, config: true },
    });
  }

  async updateConfig(id: string, config: Record<string, unknown>) {
    const venue = await this.findOne(id);
    const merged = { ...(venue.config as Record<string, unknown> ?? {}), ...config };
    return this.prisma.venue.update({
      where: { id },
      data: { config: merged as object },
      select: { id: true, name: true, config: true },
    });
  }
}

