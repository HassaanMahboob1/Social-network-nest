import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';
import { Moderator, ModeratorSchema } from './moderator.schema';
import { Post, PostSchema } from '../post/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Moderator.name, schema: ModeratorSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [ModeratorController],
  providers: [ModeratorService],
})
export class ModeratorModule {}
