import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../generated/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  public status!: OrderStatus;
}
