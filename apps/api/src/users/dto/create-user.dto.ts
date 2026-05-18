import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/client';

export class CreateUserDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsEnum(Role) role!: Role;
  @IsString() @IsOptional() venueId?: string;
}
