import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Stripe from 'stripe';
import { Model } from 'mongoose';

import { User } from '../user/user.schema';

@Injectable()
export class CheckoutService {
  private stripe;
  /**
   * Constructs a new instance of the class.
   *
   * @param {Model<User>} userModel - The user model injected by NestJS.
   */
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {
    this.stripe = new Stripe(
      'sk_test_51PdrpsRxhPxn5BamJePiS65sfOwCv58CuZwJi82Agp354psOkth90SgPvC0EVdZxdbwuTd61sdNP16F4gd0zaJZb00BlJstV2I',
    );
  }

  /**
   * Stripe payment for feed. Returns a success message
   * @param {string} userId - mongo id of user.
   * @param {string} email - email of user.
   */
  async checkout(userId: string, email: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method: 'pm_card_visa', // Use a test token here
        confirm: true,
      });

      await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { type: 'paid' } },
      );
      return {
        success: true,
        message: 'Payment successful',
      };
    } catch (err) {
      return err;
    }
  }
}
