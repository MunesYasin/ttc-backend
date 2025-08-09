import { IsString, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  location: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  location?: string;
}
