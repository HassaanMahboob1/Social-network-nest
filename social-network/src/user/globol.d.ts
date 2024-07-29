// types.d.ts or global.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // Define the type of your user object here
    }
  }
}
