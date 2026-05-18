import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@meta-repo/auth-api';
import { PaymentsService } from './payments.service';
import { AddPaymentDto } from './dto/add-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.service.getByOrder(orderId);
  }

  @Post()
  addPayment(@Body() dto: AddPaymentDto) {
    return this.service.addPayment(dto);
  }

  @Delete(':id/reverse')
  reverse(@Param('id') id: string) {
    return this.service.reversePayment(id);
  }
}
