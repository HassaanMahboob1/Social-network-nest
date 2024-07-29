import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { SECRET_OR_PRIVATE_KEY } from '../user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Middleware function that verifies the JWT token in the request headers.
   * If the token is valid, it adds the verified user object to the request body and user properties.
   * If the token is missing or invalid, it throws an HttpException with status UNAUTHORIZED.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The next middleware function in the Express chain.
   * @return {void}
   */
  use(req: Request, res: Response, next: NextFunction) {
    const token: string =
      req.body.token || req.query.token || req.headers.token;
    if (!token)
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized. Login required',
        },
        HttpStatus.UNAUTHORIZED,
      );

    try {
      const verified: any = jwt.verify(token, SECRET_OR_PRIVATE_KEY);

      req.body = { ...req.body, user: verified };
      req.user = verified;
    } catch (err) {
      throw new ForbiddenException();
    }
    return next();
  }
}
