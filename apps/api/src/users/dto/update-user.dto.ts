import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../generated/client';

export class UpdateUserDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsEnum(Role) @IsOptional() role?: Role;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
