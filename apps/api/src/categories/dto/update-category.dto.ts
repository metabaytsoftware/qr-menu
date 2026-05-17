import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  public sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  public isActive?: boolean;
}
