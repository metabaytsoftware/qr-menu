import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByVenue(venueId: string) {
    return this.prisma.station.findMany({
      where: { venueId },
      include: { _count: { select: { orders: true, sessions: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: { _count: { select: { orders: true, sessions: true } } },
    });
    if (!station) throw new NotFoundException('Station not found');
    return station;
  }

  async create(dto: CreateStationDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: dto.venueId }, select: { slug: true } });
    const prefix = venue?.slug ?? dto.venueId;
    const qrCode = `${prefix}-${dto.name}-${randomUUID().slice(0, 8)}`.toLowerCase().replace(/\s+/g, '-');
    return this.prisma.station.create({
      data: {
        venueId: dto.venueId,
        name: dto.name,
        qrCode,
        stationType: dto.stationType ?? 'TABLE',
        customType: dto.customType ?? null,
        hourlyRate: dto.hourlyRate ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateStationDto) {
    await this.findOne(id);
    return this.prisma.station.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.stationType !== undefined && { stationType: dto.stationType }),
        ...(dto.customType !== undefined && { customType: dto.customType }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: { _count: { select: { sessions: { where: { status: 'ACTIVE' } } } } },
    });
    if (!station) throw new NotFoundException('Station not found');
    if (station._count.sessions > 0) {
      throw new BadRequestException('Cannot delete station with active sessions');
    }
    return this.prisma.station.delete({ where: { id } });
  }

  async regenerateQr(id: string) {
    const station = await this.findOne(id);
    const venue = await this.prisma.venue.findUnique({ where: { id: station.venueId }, select: { slug: true } });
    const prefix = venue?.slug ?? station.venueId;
    const qrCode = `${prefix}-${station.name}-${randomUUID().slice(0, 8)}`.toLowerCase().replace(/\s+/g, '-');
    return this.prisma.station.update({ where: { id }, data: { qrCode } });
  }
}
