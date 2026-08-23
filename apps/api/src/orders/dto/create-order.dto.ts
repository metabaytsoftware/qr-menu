import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @IsString()
  public productId!: string;

  @IsInt()
  @Min(1)
  public quantity!: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  public stationId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  public items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  public notes?: string;

  @IsOptional()
  @IsString()
  public sessionId?: string;

  @IsOptional()
  @IsBoolean()
  public isBillLess?: boolean;

  /** Tax rate as decimal e.g. 0.18 = 18% */
  @IsOptional()
  @IsNumber()
  public taxRate?: number;

  /** Service charge as fixed amount */
  @IsOptional()
  @IsNumber()
  public serviceCharge?: number;

  @IsOptional()
  @IsString()
  public venueId?: string;

  @IsOptional()
  @IsBoolean()
  public isOffRecord?: boolean;
}
