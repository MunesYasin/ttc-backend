import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  minDailyHours?: string;
}

export class CreateBulkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceDto)
  attendanceRecords: CreateAttendanceDto[];
}

export interface BulkAttendanceResponse {
  success: {
    count: number;
    records: {
      userId: number;
      userName: string;
      startDate: string;
      endDate: string;
      duration: number;
    }[];
  };
  errors: {
    count: number;
    records: {
      rowIndex: number;
      userId: number;
      userName?: string;
      error: string;
    }[];
  };
  message: string;
}
