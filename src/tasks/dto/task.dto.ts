import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  userId: number;

  @IsDateString()
  date: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  duration: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}
