import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { StationType } from '../../generated/client';

export class UpdateStationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(StationType)
  @IsOptional()
  stationType?: StationType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
