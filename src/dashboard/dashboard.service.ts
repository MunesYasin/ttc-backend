import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';
import { getUserLocalDateString } from '../common/helpers/date.helper';
import type { User } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getEmployeeDashboard(user: User) {
    try {
      const userId = user.id;
      const today = new Date();
      const todayDateOnly = getUserLocalDateString(user.timezone);

      // Calculate date ranges
      const thisMonth = new Date();
      thisMonth.setDate(1);

      // Current week (Sunday to Thursday)
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay()); // Go to Sunday
      currentWeekStart.setHours(0, 0, 0, 0);
      const currentWeekStartYear = currentWeekStart.getFullYear();
      const currentWeekStartMonth = String(
        currentWeekStart.getMonth() + 1,
      ).padStart(2, '0');
      const currentWeekStartDay = String(currentWeekStart.getDate()).padStart(
        2,
        '0',
      );
      const currentWeekStartDateOnly = `${currentWeekStartYear}-${currentWeekStartMonth}-${currentWeekStartDay}`;

      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // Sunday + 4 = Thursday
      currentWeekEnd.setHours(23, 59, 59, 999);
      const currentWeekEndYear = currentWeekEnd.getFullYear();
      const currentWeekEndMonth = String(
        currentWeekEnd.getMonth() + 1,
      ).padStart(2, '0');
      const currentWeekEndDay = String(currentWeekEnd.getDate()).padStart(
        2,
        '0',
      );
      const currentWeekEndDateOnly = `${currentWeekEndYear}-${currentWeekEndMonth}-${currentWeekEndDay}`;

      // Previous week (Sunday to Thursday of the previous week)
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(currentWeekStart.getDate() - 7); // Go back 7 days to previous Sunday
      const previousWeekStartYear = previousWeekStart.getFullYear();
      const previousWeekStartMonth = String(
        previousWeekStart.getMonth() + 1,
      ).padStart(2, '0');
      const previousWeekStartDay = String(previousWeekStart.getDate()).padStart(
        2,
        '0',
      );
      const previousWeekStartDateOnly = `${previousWeekStartYear}-${previousWeekStartMonth}-${previousWeekStartDay}`;

      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekStart.getDate() + 4); // Previous Sunday + 4 = Previous Thursday
      previousWeekEnd.setHours(23, 59, 59, 999);
      const previousWeekEndYear = previousWeekEnd.getFullYear();
      const previousWeekEndMonth = String(
        previousWeekEnd.getMonth() + 1,
      ).padStart(2, '0');
      const previousWeekEndDay = String(previousWeekEnd.getDate()).padStart(
        2,
        '0',
      );
      const previousWeekEndDateOnly = `${previousWeekEndYear}-${previousWeekEndMonth}-${previousWeekEndDay}`;

      // Get today's attendance
      const todayAttendance = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(todayDateOnly),
          },
        },
      });

      // Get all data in parallel
      const [
        currentWeekAttendance,
        previousWeekAttendance,
        currentWeekTasks,
        previousWeekTasks,
        recentTasks,
      ] = await Promise.all([
        // Current week attendance
        this.prisma.attendanceRecord.findMany({
          where: {
            userId,
            date: {
              gte: new Date(currentWeekStartDateOnly),
              lte: new Date(currentWeekEndDateOnly),
            },
          },
        }),
        // Previous week attendance
        this.prisma.attendanceRecord.findMany({
          where: {
            userId,
            date: {
              gte: new Date(previousWeekStartDateOnly),
              lte: new Date(previousWeekEndDateOnly),
            },
          },
        }),
        // Current week tasks
        this.prisma.task.findMany({
          where: {
            userId,
            date: {
              gte: new Date(currentWeekStartDateOnly),
              lte: new Date(currentWeekEndDateOnly),
            },
          },
        }),
        // Previous week tasks
        this.prisma.task.findMany({
          where: {
            userId,
            date: {
              gte: new Date(previousWeekStartDateOnly),
              lte: new Date(previousWeekEndDateOnly),
            },
          },
        }),
        // Recent tasks (last 5)
        this.prisma.task.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Calculate current week hours
      const currentWeekHours = currentWeekAttendance.reduce((sum, record) => {
        if (record.clockInAt && record.clockOutAt) {
          const hours =
            (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      // Calculate previous week hours
      const previousWeekHours = previousWeekAttendance.reduce((sum, record) => {
        if (record.clockInAt && record.clockOutAt) {
          const hours =
            (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      // Calculate percentage difference
      const weeklyHoursChange =
        previousWeekHours > 0
          ? Math.round(
              ((currentWeekHours - previousWeekHours) / previousWeekHours) *
                10000,
            ) / 100
          : currentWeekHours > 0
            ? 100
            : 0;

      // Calculate total possible working days in current week (Sunday to Thursday = 5 days)
      const totalCurrentWeekDays = 5;
      const currentWeekPresentDays = currentWeekAttendance.filter(
        (record) => record.clockInAt,
      ).length;

      // Calculate previous week present days
      const previousWeekPresentDays = previousWeekAttendance.filter(
        (record) => record.clockInAt,
      ).length;

      // Calculate task percentage difference
      const weeklyTasksChange =
        previousWeekTasks.length > 0
          ? Math.round(
              ((currentWeekTasks.length - previousWeekTasks.length) /
                previousWeekTasks.length) *
                10000,
            ) / 100
          : currentWeekTasks.length > 0
            ? 100
            : 0;

      const dashboardData = {
        todayAttendance: {
          clockInTime: todayAttendance?.clockInAt || null,
          clockOutTime: todayAttendance?.clockOutAt || null,
        },
        weeklyStats: {
          currentWeekHours: Math.round(currentWeekHours * 100) / 100,
          hoursChangePercentage: weeklyHoursChange,
          totalWeeklyTasks: currentWeekTasks.length,
          weeklyTasksChangePercentage: weeklyTasksChange,
          absenceDays: totalCurrentWeekDays - currentWeekPresentDays,
          presentDays: currentWeekPresentDays,
          previousWeekPresentDays: previousWeekPresentDays,
          totalWorkingDays: totalCurrentWeekDays,
          attendanceRate:
            previousWeekPresentDays > 0
              ? Math.round(
                  ((currentWeekPresentDays - previousWeekPresentDays) /
                    previousWeekPresentDays) *
                    100,
                )
              : currentWeekPresentDays > 0
                ? 100
                : 0,
        },
        recentTasks: recentTasks.map((task) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            duration: task.duration,
            date: task.date,
            createdAt: task.createdAt,
          };
        }),
      };

      return successResponse(
        dashboardData,
        'Dashboard data retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getQuickStats(userId: number) {
    try {
      const today = new Date();

      // Use local date for determining "today" to avoid timezone issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateOnly = `${year}-${month}-${day}`;

      const [todayAttendance, totalTasks, thisMonthAttendance] =
        await Promise.all([
          this.prisma.attendanceRecord.findUnique({
            where: {
              userId_date: {
                userId,
                date: new Date(todayDateOnly),
              },
            },
          }),
          this.prisma.task.count({ where: { userId } }),
          this.prisma.attendanceRecord.count({
            where: {
              userId,
              date: {
                gte: (() => {
                  const thisMonth = new Date();
                  thisMonth.setDate(1);
                  return thisMonth;
                })(),
              },
              clockInAt: { not: null },
            },
          }),
        ]);

      const quickStats = {
        isClocked: !!todayAttendance?.clockInAt && !todayAttendance?.clockOutAt,
        todayStatus: todayAttendance?.clockInAt
          ? todayAttendance?.clockOutAt
            ? 'completed'
            : 'active'
          : 'not_started',
        totalTasks,
        monthlyAttendance: thisMonthAttendance,
      };

      return successResponse(
        quickStats,
        'Quick stats retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPerformanceAnalytics(userId: number) {
    try {
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);

      // Get tasks for performance metrics
      const [thisMonthTasks, lastMonthTasks, thisMonthAttendance] =
        await Promise.all([
          this.prisma.task.findMany({
            where: {
              userId,
              date: { gte: thisMonth },
            },
          }),
          this.prisma.task.findMany({
            where: {
              userId,
              date: { gte: lastMonth, lt: thisMonth },
            },
          }),
          this.prisma.attendanceRecord.findMany({
            where: {
              userId,
              date: { gte: thisMonth },
              clockInAt: { not: null },
            },
          }),
        ]);

      // Calculate performance metrics
      const thisMonthTaskHours = thisMonthTasks.reduce(
        (sum, task) => sum + task.duration,
        0,
      );
      const lastMonthTaskHours = lastMonthTasks.reduce(
        (sum, task) => sum + task.duration,
        0,
      );

      const productivity = {
        thisMonth: Math.round(thisMonthTaskHours * 100) / 100,
        lastMonth: Math.round(lastMonthTaskHours * 100) / 100,
        change:
          lastMonthTaskHours > 0
            ? Math.round(
                ((thisMonthTaskHours - lastMonthTaskHours) /
                  lastMonthTaskHours) *
                  10000,
              ) / 100
            : 0,
      };

      const taskCompletionRate = {
        thisMonth: thisMonthTasks.length,
        average:
          Math.round(
            (thisMonthTaskHours / Math.max(thisMonthTasks.length, 1)) * 100,
          ) / 100,
      };

      const attendanceRate = {
        thisMonth: thisMonthAttendance.length,
        percentage: Math.round(
          (thisMonthAttendance.length / new Date().getDate()) * 100,
        ),
      };

      const analytics = {
        productivity,
        taskCompletionRate,
        averageTaskTime: taskCompletionRate.average,
        attendanceRate,
        goals: {
          monthlyTaskHours: 160,
          attendanceTarget: 22,
          productivityTarget: 100,
        },
      };

      return successResponse(
        analytics,
        'Performance analytics retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCompanyAdminDashboard(user: User) {
    try {
      const companyId = user.companyId;
      const today = new Date();
      const todayDateOnly = getUserLocalDateString(user.timezone);

      // Calculate current week (Sunday to Thursday)
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay()); // Go to Sunday
      currentWeekStart.setHours(0, 0, 0, 0);

      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // Sunday + 4 = Thursday
      currentWeekEnd.setHours(23, 59, 59, 999);

      // Get total employees in the company
      const totalEmployees = await this.prisma.user.count({
        where: {
          companyId,
          role: 'EMPLOYEE',
        },
      });

      // Get today's attendance records for the company
      const todayAttendanceRecords =
        await this.prisma.attendanceRecord.findMany({
          where: {
            date: new Date(todayDateOnly),
            user: {
              companyId,
            },
          },
          include: {
            user: true,
          },
        });

      const todayAttendanceCount = todayAttendanceRecords.filter(
        (record) => record.clockInAt,
      ).length;

      // Get weekly tasks for the company
      const weeklyTasks = await this.prisma.task.count({
        where: {
          date: {
            gte: currentWeekStart,
            lte: currentWeekEnd,
          },
          user: {
            companyId,
          },
        },
      });

      // Get weekly total work hours
      const weeklyAttendanceRecords =
        await this.prisma.attendanceRecord.findMany({
          where: {
            date: {
              gte: currentWeekStart,
              lte: currentWeekEnd,
            },
            user: {
              companyId,
            },
            clockInAt: {
              not: null,
            },
            clockOutAt: {
              not: null,
            },
          },
        });

      const weeklyTotalHours = weeklyAttendanceRecords.reduce(
        (total, record) => {
          if (record.clockInAt && record.clockOutAt) {
            const hours =
              (record.clockOutAt.getTime() - record.clockInAt.getTime()) /
              (1000 * 60 * 60);
            return total + hours;
          }
          return total;
        },
        0,
      );

      // Calculate attendance rate
      const attendanceRate =
        totalEmployees > 0
          ? Math.round((todayAttendanceCount / totalEmployees) * 100)
          : 0;

      // Get week date range for display
      const weekStartFormatted = currentWeekStart.toLocaleDateString();
      const weekEndFormatted = currentWeekEnd.toLocaleDateString();

      const dashboardStats = {
        company: {
          totalEmployees,
          todayAttendance: {
            present: todayAttendanceCount,
            total: totalEmployees,
            rate: attendanceRate,
          },
        },
        thisWeek: {
          dateRange: `${weekStartFormatted} - ${weekEndFormatted}`,
          tasks: weeklyTasks,
          totalHours: Math.round(weeklyTotalHours * 100) / 100,
          averageHoursPerEmployee:
            totalEmployees > 0
              ? Math.round((weeklyTotalHours / totalEmployees) * 100) / 100
              : 0,
        },
        summary: {
          totalEmployees,
          todayPresentEmployees: todayAttendanceCount,
          weeklyTasks,
          weeklyTotalHours: Math.round(weeklyTotalHours * 100) / 100,
        },
      };

      return successResponse(
        dashboardStats,
        'Company admin dashboard retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getTopPerformersToday(user: User) {
    try {
      const companyId = user.companyId;
      const todayDateOnly = getUserLocalDateString(user.timezone);

      // Get today's attendance records for all employees in the company
      const todayAttendanceRecords =
        await this.prisma.attendanceRecord.findMany({
          where: {
            date: new Date(todayDateOnly),
            user: {
              companyId,
              role: 'EMPLOYEE',
            },
            clockInAt: {
              not: null,
            },
            clockOutAt: {
              not: null,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      // Calculate hours worked for each employee and sort by highest hours
      const employeesWithHours = todayAttendanceRecords
        .map((record) => {
          const hoursWorked =
            record.clockInAt && record.clockOutAt
              ? Math.round(
                  ((record.clockOutAt.getTime() - record.clockInAt.getTime()) /
                    (1000 * 60 * 60)) *
                    100,
                ) / 100
              : 0;

          return {
            employee: {
              id: record.user.id,
              name: record.user.name,
              email: record.user.email,
            },
            attendance: {
              clockInAt: record.clockInAt,
              clockOutAt: record.clockOutAt,
              hoursWorked,
              date: record.date,
            },
          };
        })
        .sort((a, b) => b.attendance.hoursWorked - a.attendance.hoursWorked)
        .slice(0, 4); // Get top 4 performers

      const topPerformers = {
        date: new Date(todayDateOnly),
        dateFormatted: new Date(todayDateOnly).toLocaleDateString(),
        totalEmployeesWorked: todayAttendanceRecords.length,
        topPerformers: employeesWithHours,
        summary: {
          highestHours:
            employeesWithHours.length > 0
              ? employeesWithHours[0].attendance.hoursWorked
              : 0,
          averageHours:
            employeesWithHours.length > 0
              ? Math.round(
                  (employeesWithHours.reduce(
                    (sum, emp) => sum + emp.attendance.hoursWorked,
                    0,
                  ) /
                    employeesWithHours.length) *
                    100,
                ) / 100
              : 0,
        },
      };

      return successResponse(
        topPerformers,
        'Top performers retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getRecentCompanyTasks(user: User) {
    try {
      const companyId = user.companyId;

      // Get the last 4 tasks for all employees in the company
      const recentTasks = await this.prisma.task.findMany({
        where: {
          user: {
            companyId,
            role: 'EMPLOYEE',
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      });

      const tasksWithDetails = recentTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        duration: task.duration,
        date: task.date,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        employee: {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email,
        },
        timeAgo: this.getTimeAgo(task.createdAt),
      }));

      const recentTasksData = {
        totalTasks: recentTasks.length,
        tasks: tasksWithDetails,
        summary: {
          totalDuration: recentTasks.reduce(
            (sum, task) => sum + task.duration,
            0,
          ),
          averageDuration:
            recentTasks.length > 0
              ? Math.round(
                  (recentTasks.reduce((sum, task) => sum + task.duration, 0) /
                    recentTasks.length) *
                    100,
                ) / 100
              : 0,
          latestTaskDate:
            recentTasks.length > 0 ? recentTasks[0].createdAt : null,
        },
      };

      return successResponse(
        recentTasksData,
        'Recent company tasks retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return ` قبل ${diffInSeconds} ثواني`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `قبل ${minutes} دقيقة`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `قبل ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `قبل ${days} يوم`;
    }
  }
}
