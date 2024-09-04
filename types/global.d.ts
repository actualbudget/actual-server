// types/global.d.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from 'express';
/* eslint-enable @typescript-eslint/no-unused-vars */

declare global {
  namespace Express {
    interface Request {
      userSession?: {
        expires_at?: number;
        token: string;
        user_id?: string;
      };
    }
  }
}
