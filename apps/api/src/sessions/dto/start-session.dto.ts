import { IsString, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class StartSessionDto {
  @IsString()
  stationId!: string;

  @IsBoolean()
  @IsOptional()
  isBillLess?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;
}
