import { IsString, IsEmail, MinLength, IsArray, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  faculty: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];
}