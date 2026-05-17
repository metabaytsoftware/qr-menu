import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/client';

export class AddPaymentDto {
  @IsString()
  orderId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  note?: string;
}
