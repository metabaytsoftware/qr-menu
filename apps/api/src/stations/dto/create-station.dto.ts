import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StationType } from '../../generated/client';

export class CreateStationDto {
  @IsString()
  venueId!: string;

  @IsString()
  name!: string;

  @IsEnum(StationType)
  @IsOptional()
  stationType?: StationType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  public hourlyRate?: number;
}
