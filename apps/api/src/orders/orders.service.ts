import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    let venueId = dto.venueId;
    let activeSession = null;

    if (dto.stationId) {
      const station = await this.prisma.station.findUnique({
        where: { id: dto.stationId, isActive: true },
      });
      if (!station) throw new NotFoundException('Station not found');
      venueId = station.venueId;

      activeSession = await this.prisma.session.findFirst({
        where: { stationId: dto.stationId, status: { in: ['ACTIVE', 'PAUSED'] } },
      });

      if (!activeSession) {
        throw new BadRequestException('Sipariş verebilmek için istasyonda oturum başlatılmış olmalıdır');
      }
    } else if (!venueId) {
      throw new BadRequestException('Either stationId or venueId must be provided');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, venueId, isActive: true },
    });

    if (products.length > 0 && products.length !== productIds.length) {
      // Allow empty products for dummy session payments, but if products provided, all must exist
      throw new BadRequestException('One or more products not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      const unitPrice = product ? Number(product.price) : 0;
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
        venueId: venueId as string,
        stationId: dto.stationId,
        sessionId: dto.sessionId ?? activeSession?.id,
        isBillLess: dto.isBillLess ?? false,
        isOffRecord: dto.isOffRecord ?? false,
        notes: dto.notes,
        subtotal,
        taxRate,
        taxAmount,
        serviceCharge,
        totalAmount,
        status: dto.stationId ? OrderStatus.PENDING : OrderStatus.COMPLETED, // Direct sales are instantly completed
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
    const where: any = { venueId, isOffRecord: false };
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

  async getPrivateOrders(venueId: string) {
    return this.prisma.order.findMany({
      where: { venueId, isOffRecord: true },
      include: {
        items: { include: { product: true } },
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
