import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AddPaymentDto } from './dto/add-payment.dto';

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
