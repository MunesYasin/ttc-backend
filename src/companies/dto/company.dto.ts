import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { IsKsaMobile } from 'src/validators/phone-number-validatore';
import { Type } from 'class-transformer';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  notionalId: string;

  @IsString()
  commercialRegistrationNumber: string;

  @IsString()
  taxNumber: string;

  @IsString()
  address: string;

  @IsString()
  nameOfAuthorizedSignatory: string;

  @IsEmail()
  emailOfAuthorizedSignatory: string;

  @IsKsaMobile({
    message:
      'رقم جوال المفوض غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  mobileOfAuthorizedSignatory: string;

  @IsString()
  hrManager1Name: string;

  @IsEmail()
  hrManager1Email: string;

  @IsKsaMobile({
    message:
      'رقم جوال مدير الموارد البشرية الأول غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  hrManager1Mobile: string;

  @IsString()
  hrManager2Name: string;

  @IsEmail()
  hrManager2Email: string;

  @IsKsaMobile({
    message:
      'رقم جوال مدير الموارد البشرية الثاني غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  hrManager2Mobile: string;

  @IsString()
  accountantName: string;

  @IsEmail()
  accountantEmail: string;

  @IsKsaMobile({
    message:
      'رقم جوال المحاسب غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  accountantMobile: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentCompanyId?: number;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notionalId?: string;

  @IsOptional()
  @IsString()
  commercialRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  nameOfAuthorizedSignatory?: string;

  @IsOptional()
  @IsEmail()
  emailOfAuthorizedSignatory?: string;

  @IsOptional()
  @IsKsaMobile({
    message:
      'رقم جوال المفوض غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  mobileOfAuthorizedSignatory?: string;

  @IsOptional()
  @IsString()
  hrManager1Name?: string;

  @IsOptional()
  @IsEmail()
  hrManager1Email?: string;

  @IsOptional()
  @IsKsaMobile({
    message:
      'رقم جوال مدير الموارد البشرية الأول غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  hrManager1Mobile?: string;

  @IsOptional()
  @IsString()
  hrManager2Name?: string;

  @IsOptional()
  @IsEmail()
  hrManager2Email?: string;

  @IsOptional()
  @IsKsaMobile({
    message:
      'رقم جوال مدير الموارد البشرية الثاني غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  hrManager2Mobile?: string;

  @IsOptional()
  @IsString()
  accountantName?: string;

  @IsOptional()
  @IsEmail()
  accountantEmail?: string;

  @IsOptional()
  @IsKsaMobile({
    message:
      'رقم جوال المحاسب غير صحيح. تأكد من أنه رقم سعودي يبدأ بـ05 أو +9665',
  })
  @IsString()
  accountantMobile?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentCompanyId?: number;
}
