import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  userId: string;

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
