import { IsString, MinLength } from 'class-validator';

export class TestSmtpDto {
  @IsString()
  to: string;

  @IsString()
  @MinLength(1)
  subject: string;
}
