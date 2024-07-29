import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { AuthMiddleware } from './middleware/authmiddleware';
import { SocketModule } from './socket/socket.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ModeratorModule } from './moderator/moderator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: 'mongodb://localhost/Social-network',
      }),
    }),
    UserModule,
    PostModule,
    SocketModule,
    CheckoutModule,
    ModeratorModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule {
  /**
   * Configures the middleware for the application.
   *
   * @param {MiddlewareConsumer} consumer - The middleware consumer.
   * @return {void} This function does not return anything.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'user/register', method: RequestMethod.POST },
        { path: 'user/login', method: RequestMethod.POST },
        { path: 'moderator/register', method: RequestMethod.ALL },
        { path: 'moderator/login', method: RequestMethod.ALL },
      )
      .forRoutes(
        { path: 'user/*', method: RequestMethod.ALL },
        { path: 'post/*', method: RequestMethod.ALL },
        { path: 'checkout/', method: RequestMethod.ALL },
        { path: 'moderator/*', method: RequestMethod.ALL },
      );
  }
}
