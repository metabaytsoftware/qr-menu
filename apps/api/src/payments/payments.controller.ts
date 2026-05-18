import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { PaymentsService } from './payments.service';
import { AddPaymentDto } from './dto/add-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Permission('payments', 'read')
  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.service.getByOrder(orderId);
  }

  @Permission('payments', 'write')
  @Post()
  addPayment(@Body() dto: AddPaymentDto) {
    return this.service.addPayment(dto);
  }

  @Permission('payments', 'write')
  @Delete(':id/reverse')
  reverse(@Param('id') id: string) {
    return this.service.reversePayment(id);
  }
}
