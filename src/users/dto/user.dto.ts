import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  IsNumber,
  IsDate,
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
  @IsNumber()
  companyId: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  // Personal Information
  @IsString()
  nationalId: string;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  employeeRolesId: number;

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

  @IsString()
  department: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => (value ? parseFloat(value as string) : undefined))
  @IsNumber()
  totalSalary: number;

  @Type(() => Date)
  @IsDate()
  contractStartDate: Date;

  @Type(() => Date)
  @IsDate()
  remoteWorkDate: Date;

  @IsString()
  directManager: string;
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
  @IsNumber()
  companyId: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  // Personal Information
  @IsString()
  nationalId: string;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  employeeRolesId: number;

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

  @IsString()
  department: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => (value ? parseFloat(value as string) : undefined))
  @IsNumber()
  totalSalary: number;

  @Type(() => Date)
  @IsDate()
  contractStartDate: Date;

  @Type(() => Date)
  @IsDate()
  remoteWorkDate: Date;

  @IsString()
  directManager: string;
}
