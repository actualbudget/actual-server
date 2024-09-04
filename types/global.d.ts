// types/global.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userSession?: any;
    }
  }
}
