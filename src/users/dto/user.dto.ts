import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @IsString()
  timezone?: string; // Optional timezone field for user
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  companyId?: number;
}
