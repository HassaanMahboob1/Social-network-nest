import {
  Injectable,
  ConflictException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from './users.schema.dto';
import { PaginationDto } from 'src/app.pagination.dto';

export const SECRET_OR_PRIVATE_KEY =
  process.env.SECRET_OR_PRIVATE_KEY || 'abcd';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Creates a new user with the provided user data.
   *
   * @param {CreateUserDto} user - The user data to create a new user.
   * @return {Promise<object>} An object containing the success status, message, created user object, and JWT token.
   * @throws {ConflictException} If a user with the same email already exists.
   * @throws {InternalServerErrorException} If an error occurs while creating the user.
   */
  async create(user: CreateUserDto): Promise<object> {
    try {
      const existingUser = await this.userModel.findOne({ email: user.email });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Generate salt and hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Create new user with hashed password
      const newUser = new this.userModel({
        ...user,
        password: hashedPassword,
      });

      // Save new user to database
      const userObj = await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: userObj.id, userType: 'user' },
        SECRET_OR_PRIVATE_KEY,
        { expiresIn: '24h' },
      );

      return {
        success: true,
        msg: 'Sign up successful',
        userObj,
        token,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException(
        'An error occurred while creating the user',
      );
    }
  }

  /**
   * Authenticates a user by checking their email and password.
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @return {Promise<any>} A promise that resolves to an object with the following properties:
   *   - success: A boolean indicating if the login was successful.
   *   - msg: A string message indicating the result of the login.
   *   - user: The user object if login was successful.
   *   - token: The JWT token if login was successful.
   * @throws {HttpException} If the user is not found or the password is incorrect.
   */
  async login(email: string, password: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const isMatched = await bcrypt.compare(password, user.password);
      if (isMatched) {
        const token = jwt.sign(
          { id: user.id, userType: 'user' },
          SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' },
        );
        return { success: true, msg: 'login successful', user, token };
      }

      throw new HttpException('password incorrect', HttpStatus.BAD_REQUEST);
    } catch (err) {
      return err;
    }
  }

  /**
   * Follows a user by adding them to the "Followings" array of the current user and adding the current user to the "Followers" array of the user to follow.
   *
   * @param {string} user_id - The ID of the current user.
   * @param {string} follow_to - The ID of the user to follow.
   * @return {Promise<object>} A promise that resolves to an object containing a success message and the updated user object.
   * @throws {HttpException} If the current user or the user to follow is not found, or if the current user is already following the user to follow.
   * @throws {HttpException} If an error occurs during the process.
   */
  async followUser(user_id: string, follow_to: string): Promise<object> {
    try {
      const user: User = await this.userModel.findById(user_id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const follow_to_user: any = await this.userModel.findById(follow_to);
      if (!follow_to_user) {
        throw new HttpException(
          'User to follow not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (user.Followings.includes(follow_to)) {
        throw new HttpException(
          'User already followed',
          HttpStatus.BAD_REQUEST,
        );
      }

      user.Followings.push(follow_to);
      follow_to_user.Followers.push(user_id);

      await Promise.all([user.save(), follow_to_user.save()]);

      return { message: 'User followed successfully', user };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Unfollows a user.
   *
   * @param {string} user_id - The ID of the user performing the unfollow action.
   * @param {string} unfollow_to - The ID of the user to be unfollowed.
   * @return {Promise<object>} An object indicating the success of the unfollow action and a message.
   * @throws {HttpException} If the user to unfollow or the user performing the action is not found,
   * or if the user is not followed or is not a follower.
   */
  async unfollowUser(user_id: string, unfollow_to: string): Promise<object> {
    try {
      const [userToUnfollow, user] = await Promise.all([
        this.userModel.findOne({ _id: unfollow_to }),
        this.userModel.findOne({ _id: user_id }),
      ]);

      if (!userToUnfollow) {
        throw new HttpException(
          'User to Unfollow not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const indexOfUserFollowing: number = user.Followings.findIndex(
        (id) => id.toString() === unfollow_to,
      );

      if (indexOfUserFollowing === -1) {
        throw new HttpException('User not followed', HttpStatus.BAD_REQUEST);
      }

      user.Followings.splice(indexOfUserFollowing, 1);

      const indexToRemove = userToUnfollow.Followers.findIndex(
        (id) => id.toString() === user_id,
      );

      if (indexToRemove === -1) {
        throw new HttpException('User not a follower', HttpStatus.BAD_REQUEST);
      }

      userToUnfollow.Followers.splice(indexToRemove, 1);

      await Promise.all([user.save(), userToUnfollow.save()]);

      return {
        success: true,
        msg: 'User unfollowed successfully',
      };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        err.message,
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves a paginated list of users from the database.
   *
   * @param {PaginationDto} paginationDto - The pagination parameters for the query.
   * @return {Promise<object>} A promise that resolves to an object containing the paginated list of users, the total number of pages, and the HTTP status code.
   * @throws {InternalServerErrorException} If an error occurs while retrieving the users.
   */
  async getall(paginationDto: PaginationDto): Promise<object> {
    try {
      const { page, limit } = paginationDto;
      const count = await this.userModel.countDocuments({}).exec();
      const page_total = Math.floor((count - 1) / limit) + 1;
      const skip = (page - 1) * limit;
      const users = await this.userModel.find().skip(skip).limit(limit).exec();
      return {
        data: users,
        page_total: page_total,
        status: 200,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to update the user');
    }
  }

  /**
   * Retrieves a user by their ID.
   *
   * @param {string} id - The ID of the user to retrieve.
   * @return {Promise<User>} A promise that resolves to the user with the specified ID.
   * @throws {InternalServerErrorException} If there was an error retrieving the user.
   */
  async getone(id: string): Promise<User> {
    try {
      const user = this.userModel.findById(id).exec();
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update the user');
    }
  }

  /**
   * Updates a user's information.
   *
   * @param {string} auth_id - The ID of the authenticated user.
   * @param {string} id - The ID of the user to be updated.
   * @param {CreateUserDto} user - The updated user information.
   * @return {Promise<User>} The updated user object.
   * @throws {BadRequestException} If the authenticated user is not the same as the user to be updated.
   * @throws {InternalServerErrorException} If there is an error updating the user.
   */
  async update(
    auth_id: string,
    id: string,
    user: CreateUserDto,
  ): Promise<User> {
    if (auth_id !== id) {
      throw new BadRequestException('You can update your own User only.');
    }
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, user, {
          new: true,
        })
        .exec();
      // Generate salt and hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      updatedUser.password = hashedPassword;
      updatedUser.save();
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update the user');
    }
  }

  /**
   * Deletes a user by their ID.
   *
   * @param {string} auth_id - The ID of the authenticated user.
   * @param {string} id - The ID of the user to be deleted.
   * @return {Promise<User>} A promise that resolves to the deleted user.
   * @throws {BadRequestException} If the authenticated user is not the same as the user to be deleted.
   * @throws {InternalServerErrorException} If there was an error deleting the user.
   */
  async deleteuser(auth_id: string, id: string): Promise<User> {
    if (auth_id !== id) {
      throw new BadRequestException('You can delete your own User only.');
    }
    try {
      const deletedUser = this.userModel.findByIdAndDelete(id).exec();
      return deletedUser;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update the user');
    }
  }
}
