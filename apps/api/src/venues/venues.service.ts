import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.venue.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, type: true },
      orderBy: { name: 'asc' },
    });
  }
}
