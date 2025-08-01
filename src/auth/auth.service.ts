import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';
import { User } from '@prisma/client';
import { handlePrismaError } from 'utilies/error-handler';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { company: true },
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        // Exclude the password property from the user object
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
