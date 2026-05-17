import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTariffDto } from './dto/create-tariff.dto';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByVenue(venueId: string) {
    return this.prisma.tariff.findMany({
      where: { venueId },
      orderBy: { stationType: 'asc' },
    });
  }

  async create(dto: CreateTariffDto) {
    return this.prisma.tariff.create({
      data: {
        venueId: dto.venueId,
        name: dto.name,
        stationType: dto.stationType,
        ratePerHour: dto.ratePerHour,
        peakHourStart: dto.peakHourStart ?? null,
        peakHourEnd: dto.peakHourEnd ?? null,
        peakRate: dto.peakRate ?? null,
      },
    });
  }

  async update(id: string, dto: Partial<CreateTariffDto>) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('Tariff not found');
    return this.prisma.tariff.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('Tariff not found');
    return this.prisma.tariff.delete({ where: { id } });
  }

  /** Get effective rate for a station type at a given hour */
  async getEffectiveRate(venueId: string, stationType: string, hour: number): Promise<number> {
    const tariff = await this.prisma.tariff.findFirst({
      where: { venueId, stationType: stationType as any, isActive: true },
    });
    if (!tariff) return 0;

    const isPeak =
      tariff.peakHourStart !== null &&
      tariff.peakHourEnd !== null &&
      hour >= tariff.peakHourStart &&
      hour < tariff.peakHourEnd;

    return isPeak && tariff.peakRate ? Number(tariff.peakRate) : Number(tariff.ratePerHour);
  }
}
