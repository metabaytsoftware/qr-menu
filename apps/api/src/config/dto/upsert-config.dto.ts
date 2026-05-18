import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertConfigDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
