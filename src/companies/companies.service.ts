import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import type { Company, User } from '@prisma/client';
import { CompanyAccessPolicy } from '../policies/company-access.policy';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll(): Promise<Company[]> {
    return this.prisma.company.findMany({
      include: {
        users: true,
        _count: {
          select: {
            users: true,
            reports: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user: User): Promise<Company | null> {
    // Use ensure method which already fetches and validates access
    return await this.companyAccessPolicy.ensureUserCanAccessCompany(user, id);
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    user: User,
  ): Promise<Company> {
    // Use ensure method which already validates access and fetches company
    this.companyAccessPolicy.ensureUserCanManageCompany(user, id);

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        users: true,
      },
    });
  }

  async remove(id: string, user: User): Promise<Company> {
    await this.companyAccessPolicy.ensureUserCanAccessCompany(user, id);
    return this.prisma.company.delete({
      where: { id },
    });
  }

  async generateDailyReport(
    companyId: string,
    date: Date,
    user: User,
  ): Promise<any> {
    // Use ensure method which already validates access and fetches company
    await this.companyAccessPolicy.ensureUserCanAccessCompany(user, companyId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        user: {
          companyId,
        },
      },
      include: {
        user: true,
      },
    });

    const tasks = await this.prisma.task.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        user: {
          companyId,
        },
      },
      include: {
        user: true,
      },
    });

    const reportData = {
      date: date.toISOString().split('T')[0],
      totalEmployees: attendanceRecords.length,
      totalTasksCompleted: tasks.length,
      totalHoursWorked: tasks.reduce((sum, task) => sum + task.duration, 0),
      attendanceRecords: attendanceRecords.map((record) => ({
        employeeName: record.user.name,
        clockIn: record.clockInAt,
        clockOut: record.clockOutAt,
        note: record.note,
      })),
      tasks: tasks.map((task) => ({
        employeeName: task.user.name,
        title: task.title,
        description: task.description,
        duration: task.duration,
      })),
    };

    // Save the report
    await this.prisma.dailyReport.upsert({
      where: {
        companyId_date: {
          companyId,
          date: startOfDay,
        },
      },
      update: {
        data: reportData,
      },
      create: {
        companyId,
        date: startOfDay,
        data: reportData,
      },
    });

    return reportData;
  }
}
