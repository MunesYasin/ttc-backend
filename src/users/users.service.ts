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

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private employeeAccessPolicy: EmployeeAccessPolicy,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: {
        company: true,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        company: true,
      },
    });
  }

  async findOne(id: string, currentUser: User): Promise<User | null> {
    // Use ensure method which already fetches and validates access
    return await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
      currentUser,
      id,
    );
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
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
      throw new ForbiddenException('Company admin cannot change user company');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        company: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string, currentUser: User): Promise<User> {
    // Use ensure method which already fetches and validates access
    const user = await this.employeeAccessPolicy.ensureUserCanAccessEmployee(
      currentUser,
      id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
      include: {
        company: true,
      },
    });
  }

  async findByCompany(companyId: string, currentUser: User): Promise<User[]> {
    // Validate access to company data first
    if (currentUser.role === Role.COMPANY_ADMIN) {
      if (currentUser.companyId !== companyId) {
        throw new ForbiddenException('Access denied to company data');
      }
    } else if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        company: true,
      },
    });
  }
}
