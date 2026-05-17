import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { StationType } from '../../generated/client';

export class CreateTariffDto {
  @IsString()
  venueId!: string;

  @IsString()
  name!: string;

  @IsEnum(StationType)
  stationType!: StationType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ratePerHour!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  peakHourStart?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(23)
  peakHourEnd?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  peakRate?: number;
}
