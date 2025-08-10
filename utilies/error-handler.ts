// src/common/utils/handle-prisma-error.ts
import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

export function handlePrismaError(error: any): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new BadRequestException(
          'A record with that field already exists',
        );
      case 'P2025':
        throw new BadRequestException('Record not found');
      // Add more cases as needed
    }
  }

  // if (error instanceof UnauthorizedException) {
  throw error; // allow it to bubble up
  // }

  // For other errors, return the actual error message if exists
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const message = error?.message || 'Unknown error occurred';
  throw new InternalServerErrorException(message);
}
