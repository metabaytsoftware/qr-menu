import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStation(stationId: string) {
    return this.prisma.session.findMany({
      where: { stationId },
      include: { orders: { include: { items: { include: { product: true } }, payments: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findActive(stationId: string) {
    return this.prisma.session.findFirst({
      where: { stationId, status: { in: ['ACTIVE', 'PAUSED'] } },
      include: { orders: { include: { items: { include: { product: true } }, payments: true } } },
    });
  }

  async start(dto: StartSessionDto) {
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId, isActive: true },
    });
    if (!station) throw new NotFoundException('Station not found');

    const existing = await this.prisma.session.findFirst({
      where: { stationId: dto.stationId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (existing) throw new BadRequestException('Station already has an active session');

    const rate = dto.hourlyRate ?? Number(station.hourlyRate ?? 0);
    return this.prisma.session.create({
      data: {
        stationId: dto.stationId,
        isBillLess: dto.isBillLess ?? false,
        hourlyRate: rate,
        status: 'ACTIVE',
      },
      include: { station: true },
    });
  }

  async pause(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'ACTIVE') throw new BadRequestException('Only active sessions can be paused');
    return this.prisma.session.update({
      where: { id },
      data: { status: 'PAUSED', pausedAt: new Date() },
    });
  }

  async resume(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'PAUSED') throw new BadRequestException('Only paused sessions can be resumed');

    const pausedSeconds = session.pausedAt
      ? Math.floor((Date.now() - session.pausedAt.getTime()) / 1000)
      : 0;

    return this.prisma.session.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        totalPaused: session.totalPaused + pausedSeconds,
      },
    });
  }

  async end(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { orders: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === 'ENDED') throw new BadRequestException('Session already ended');

    const endTime = new Date();
    const startTime = session.startTime;
    let finalTotalPaused = session.totalPaused;
    
    if (session.status === 'PAUSED' && session.pausedAt) {
      finalTotalPaused += Math.floor((endTime.getTime() - session.pausedAt.getTime()) / 1000);
    }

    const totalElapsedSeconds =
      Math.floor((endTime.getTime() - startTime.getTime()) / 1000) - finalTotalPaused;

    const hours = Math.max(0, totalElapsedSeconds / 3600);
    const sessionCharge = parseFloat((hours * Number(session.hourlyRate)).toFixed(2));

    return this.prisma.session.update({
      where: { id },
      data: { status: 'ENDED', endTime, sessionCharge },
      include: {
        orders: { include: { items: { include: { product: true } }, payments: true } },
        station: true,
      },
    });
  }

  async getSessionBill(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        station: true,
        orders: {
          include: { items: { include: { product: true } }, payments: true },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    const now = session.endTime ?? new Date();
    let finalTotalPaused = session.totalPaused;
    
    if (session.status === 'PAUSED' && session.pausedAt && !session.endTime) {
      finalTotalPaused += Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000);
    }

    const totalElapsedSeconds =
      Math.floor((now.getTime() - session.startTime.getTime()) / 1000) - finalTotalPaused;
    const hours = Math.max(0, totalElapsedSeconds / 3600);
    const sessionCharge = parseFloat((hours * Number(session.hourlyRate)).toFixed(2));

    const validOrders = session.orders.filter(o => o.status !== 'CANCELLED');
    const foodTotal = validOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const paidTotal = validOrders.reduce(
      (sum, o) => sum + o.payments.reduce((ps, p) => ps + Number(p.amount), 0),
      0,
    );
    const grandTotal = parseFloat((foodTotal + sessionCharge).toFixed(2));
    const remaining = parseFloat((grandTotal - paidTotal).toFixed(2));

    return {
      session,
      durationSeconds: totalElapsedSeconds,
      durationHours: parseFloat(hours.toFixed(4)),
      hourlyRate: Number(session.hourlyRate),
      sessionCharge,
      foodTotal,
      grandTotal,
      paidTotal,
      remaining,
    };
  }
}
