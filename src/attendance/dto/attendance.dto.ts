import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class ClockInDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ClockOutDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateAttendanceDto {
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  userId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  minDailyHours?: string;
}
