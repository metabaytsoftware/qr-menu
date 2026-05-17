import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  public venueId!: string;

  @IsString()
  public categoryId!: string;

  @IsString()
  public name!: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  public price!: number;

  @IsString()
  @IsOptional()
  public imageUrl?: string;
}
