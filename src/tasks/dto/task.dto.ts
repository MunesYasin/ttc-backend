import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsDateString()
  date: string;

  @IsNumber()
  roleTasksId: number;

  @IsNumber()
  duration: number;

  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  attendanceRecordId: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class TaskQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 1))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 10))
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
