import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddPaymentDto } from './dto/add-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async addPayment(dto: AddPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order is already fully paid');
    }

    const alreadyPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDue = Number(order.totalAmount);
    const change = Math.max(0, alreadyPaid + dto.amount - totalDue);

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        method: dto.method,
        amount: dto.amount,
        change,
        note: dto.note,
      },
    });

    // Update order paid amount and payment status
    const newPaid = alreadyPaid + dto.amount;
    const paymentStatus = newPaid >= totalDue ? 'PAID' : 'PARTIAL';

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { paidAmount: newPaid, paymentStatus },
    });

    return { payment, paidAmount: newPaid, remaining: Math.max(0, totalDue - newPaid), change };
  }

  async getByOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { orderBy: { createdAt: 'asc' } },
        items: { include: { product: true } },
        station: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const paidTotal = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, Number(order.totalAmount) - paidTotal);

    return { order, paidTotal, remaining };
  }

  async reversePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { payments: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    await this.prisma.payment.delete({ where: { id: paymentId } });

    const remainingPayments = payment.order.payments.filter((p) => p.id !== paymentId);
    const newPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDue = Number(payment.order.totalAmount);
    const paymentStatus = newPaid >= totalDue ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING';

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { paidAmount: newPaid, paymentStatus },
    });

    return { deleted: paymentId, newPaidAmount: newPaid };
  }
}
