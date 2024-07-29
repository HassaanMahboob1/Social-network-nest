import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: [true, 'Username is required'] })
  password: string;

  @Prop()
  age: number;

  @Prop({ required: true })
  email: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  Followers: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  Followings: string[];

  @Prop({ default: 'unpaid' })
  type: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
