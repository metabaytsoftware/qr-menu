import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  public venueId!: string;

  @IsString()
  public name!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  public sortOrder?: number;
}
