import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        port: process.env.PORT || 3000,
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      };
    }
  }
}
