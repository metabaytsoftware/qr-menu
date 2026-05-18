import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId, isActive: true },
    });
    if (!station) throw new NotFoundException('Station not found');

    const activeSession = await this.prisma.session.findFirst({
      where: { stationId: dto.stationId, status: 'ACTIVE' },
    });

    if (!activeSession) {
      throw new BadRequestException('Sipariş verebilmek için istasyonda oturum başlatılmış olmalıdır');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, venueId: station.venueId, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const total = unitPrice * item.quantity;
      return { productId: item.productId, quantity: item.quantity, unitPrice, total };
    });

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const serviceCharge = dto.serviceCharge ?? 0;
    const totalAmount = parseFloat((subtotal + taxAmount + serviceCharge).toFixed(2));

    const order = await this.prisma.order.create({
      data: {
        venueId: station.venueId,
        stationId: dto.stationId,
        sessionId: dto.sessionId ?? activeSession.id,
        isBillLess: dto.isBillLess ?? false,
        notes: dto.notes,
        subtotal,
        taxRate,
        taxAmount,
        serviceCharge,
        totalAmount,
        items: { create: items },
      },
      include: {
        items: { include: { product: true } },
        station: true,
        payments: true,
      },
    });

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, station: true, payments: true },
    });
  }

  async getByVenue(venueId: string, status?: string) {
    const where: any = { venueId };
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        station: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) return order;
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { items: { include: { product: true } }, station: true, payments: true },
    });
  }

  async getOrderStatus(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, updatedAt: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
