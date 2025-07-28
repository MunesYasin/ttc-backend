// types/express.d.ts
import { User } from '@prisma/client';

declare module 'express' {
  interface Request {
    cookies: Record<string, any>;
    user: User;
  }
}
