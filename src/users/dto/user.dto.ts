import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { Transform, Type } from 'class-transformer';
import { IsKsaMobile } from 'src/validators/phone-number-validatore';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // Optional because it will be set to personalEmail

  @IsEnum(Role)
  role: Role;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  // Personal Information
  @IsString()
  nationalId: string;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsOptional()
  @IsNumber()
  employeeRolesId?: number;

  @Type(() => Date)
  @IsDate()
  hijriBirthDate: Date;

  @Type(() => Date)
  @IsDate()
  gregorianBirthDate: Date;

  @IsString()
  gender: string;

  @IsString()
  address: string;

  @IsKsaMobile({
    message: 'رقم أبشر غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  absherMobile: string;

  @IsKsaMobile({
    message: 'رقم أبشر غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  contactMobile: string;

  @IsEmail()
  personalEmail: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => (value ? parseFloat(value as string) : undefined))
  @IsOptional()
  @IsNumber()
  totalSalary?: number;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  contractStartDate?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  remoteWorkDate?: Date;

  @IsOptional()
  @IsString()
  directManager?: string;
}

export class UpdateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // Optional because it will be set to personalEmail

  @IsEnum(Role)
  role: Role;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  // Personal Information
  @IsString()
  nationalId: string;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsOptional()
  @IsNumber()
  employeeRolesId?: number;

  @Type(() => Date)
  @IsDate()
  hijriBirthDate: Date;

  @Type(() => Date)
  @IsDate()
  gregorianBirthDate: Date;

  @IsString()
  gender: string;

  @IsString()
  address: string;

  @IsKsaMobile({
    message: 'رقم أبشر غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  absherMobile: string;

  @IsKsaMobile({
    message: 'رقم أبشر غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  contactMobile: string;

  @IsEmail()
  personalEmail: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => (value ? parseFloat(value as string) : undefined))
  @IsOptional()
  @IsNumber()
  totalSalary?: number;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  contractStartDate?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  remoteWorkDate?: Date;

  @IsOptional()
  @IsString()
  directManager?: string;
}

export class CreateBulkUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}
