import { Controller, Post, Body, Request } from '@nestjs/common';

import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('/')
  async checkout(
    @Body('user') user: { id: string },
    @Body('email') email: string,
    @Request() req,
  ) {
    return await this.checkoutService.checkout(req.user.id, email);
  }
}
