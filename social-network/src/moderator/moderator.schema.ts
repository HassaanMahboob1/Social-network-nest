import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Moderator extends Document {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: [true, 'Username is required'] })
  password: string;

  @Prop({ required: true })
  email: string;
}

export const ModeratorSchema = SchemaFactory.createForClass(Moderator);
