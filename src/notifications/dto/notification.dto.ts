import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class NotificationQueryDto {
  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class NotificationPreferencesDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  push: boolean;

  @IsBoolean()
  taskReminders: boolean;

  @IsBoolean()
  appointmentReminders: boolean;

  @IsBoolean()
  deadlineAlerts: boolean;
}
