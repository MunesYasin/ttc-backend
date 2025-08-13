import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { Response } from 'express';
import { successResponse } from 'utilies/response';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.login(loginDto);

    // Set the token as HTTP-only cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      sameSite: 'none', // or 'strict' / 'none'
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });

    return successResponse(user, 'Login successful', 200);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
