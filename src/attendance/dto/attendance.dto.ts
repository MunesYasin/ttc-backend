import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ClockInDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class ClockOutDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateAttendanceDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  clockInAt?: string;

  @IsOptional()
  @IsDateString()
  clockOutAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
