import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Permission } from '../permissions/permission.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public — müşteri sipariş verir
  @Throttle({ global: { ttl: 60000, limit: 10 } })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Permission('orders', 'read')
  @Get(':venueId')
  getByVenue(@Param('venueId') venueId: string, @Query('status') status?: string) {
    return this.ordersService.getByVenue(venueId, status);
  }

  @Permission('orders', 'read')
  @Get(':venueId/private')
  getPrivateOrders(@Param('venueId') venueId: string) {
    return this.ordersService.getPrivateOrders(venueId);
  }

  @Permission('orders', 'update_status')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Permission('orders', 'cancel')
  @Post(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  // Public — müşteri kendi siparişini takip eder
  @Get(':id/status')
  getOrderStatus(@Param('id') id: string) {
    return this.ordersService.getOrderStatus(id);
  }
}
