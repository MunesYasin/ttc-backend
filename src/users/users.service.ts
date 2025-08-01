import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { EmployeeAccessPolicy } from '../policies/employee-access.policy';
import { successResponse } from '../../utilies/response';
import { handlePrismaError } from '../../utilies/error-handler';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private employeeAccessPolicy: EmployeeAccessPolicy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        include: {
          company: true,
        },
      });

      return successResponse(user, 'User created successfully', 201);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          company: true,
        },
      });

      return successResponse(users, 'Users retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOne(id: number, currentUser: User) {
    try {
      // Use ensure method which already fetches and validates access
      const user = await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
        currentUser,
        id,
      );

      return successResponse(user, 'User retrieved successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User) {
    try {
      // Use ensure method which already fetches and validates access
      const existingUser =
        await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
          currentUser,
          id,
        );
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Validate that COMPANY_ADMIN cannot change the user's company
      if (
        currentUser.role === Role.COMPANY_ADMIN &&
        updateUserDto.companyId &&
        updateUserDto.companyId !== existingUser.companyId
      ) {
        throw new ForbiddenException(
          'Company admin cannot change user company',
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          company: true,
        },
      });

      return successResponse(updatedUser, 'User updated successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: number, currentUser: User) {
    try {
      // Use ensure method which already fetches and validates access
      const user = await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
        currentUser,
        id,
      );
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const deletedUser = await this.prisma.user.delete({
        where: { id },
        include: {
          company: true,
        },
      });

      return successResponse(deletedUser, 'User deleted successfully', 200);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByCompany(companyId: number, currentUser: User) {
    try {
      // Validate access to company data first
      if (currentUser.role === Role.COMPANY_ADMIN) {
        if (currentUser.companyId !== companyId) {
          throw new ForbiddenException('Access denied to company data');
        }
      } else if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Access denied');
      }

      const users = await this.prisma.user.findMany({
        where: { companyId },
        include: {
          company: true,
        },
      });

      return successResponse(
        users,
        'Company users retrieved successfully',
        200,
      );
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
