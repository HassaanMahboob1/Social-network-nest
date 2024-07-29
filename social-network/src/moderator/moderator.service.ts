import {
  Injectable,
  ConflictException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Moderator } from './moderator.schema';
import { Post } from '../post/post.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { CreateModeratorDto } from './moderator.schema.dto';
import { CreatePostDto } from 'src/post/post.schema.dto';
import { PaginationDto } from 'src/app.pagination.dto';

export const SECRET_OR_PRIVATE_KEY = 'abcd';

@Injectable()
export class ModeratorService {
  constructor(
    @InjectModel(Moderator.name) private ModeratorModel: Model<Moderator>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  /**
   * Creates a new moderator with the provided data.
   *
   * @param {CreateModeratorDto} Moderator - The data for creating a new moderator.
   * @return {Promise<object>} An object containing the success status, message, created moderator object, and JWT token.
   * @throws {ConflictException} If a moderator with the same email already exists.
   * @throws {InternalServerErrorException} If an error occurs while creating the moderator.
   */
  async createModerator(Moderator: CreateModeratorDto): Promise<object> {
    try {
      const existingModerator = await this.ModeratorModel.findOne({
        email: Moderator.email,
      });
      if (existingModerator) {
        throw new ConflictException('Moderator with this email already exists');
      }

      // Generate salt and hash password
      const hashedPassword = await bcrypt.hash(Moderator.password, 10);

      // Create new user with hashed password
      const newModerator = new this.ModeratorModel({
        ...Moderator,
        password: hashedPassword,
      });

      // Save new user to database
      const ModeratorObj = await newModerator.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: ModeratorObj.id, userType: 'moderator' },
        SECRET_OR_PRIVATE_KEY,
        { expiresIn: '24h' },
      );

      return {
        success: true,
        msg: 'Sign up successful',
        ModeratorObj,
        token,
      };
    } catch (error) {
      console.error('Error creating Moderator:', error);
      throw new InternalServerErrorException(
        'An error occurred while creating the user',
      );
    }
  }

  /**
   * Authenticates a moderator by checking their email and password.
   *
   * @param {string} email - The email of the moderator.
   * @param {string} password - The password of the moderator.
   * @return {Promise<any>} A promise that resolves to an object with the following properties:
   *   - success: A boolean indicating if the login was successful.
   *   - msg: A string message indicating the result of the login.
   *   - moderator: The moderator object if login was successful.
   *   - token: The JWT token if login was successful.
   * @throws {HttpException} If the moderator is not found or the password is incorrect.
   */
  async loginModerator(email: string, password: string): Promise<any> {
    try {
      const Moderator = await this.ModeratorModel.findOne({ email });
      if (!Moderator)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const isMatched = await bcrypt.compare(password, Moderator.password);
      if (isMatched) {
        const token = jwt.sign(
          { id: Moderator.id, userType: 'moderator' },
          SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' },
        );
        return { success: true, msg: 'login successful', Moderator, token };
      }

      throw new HttpException('password incorrect', HttpStatus.BAD_REQUEST);
    } catch (err) {
      return err;
    }
  }

  /**
   * Retrieves all posts based on the provided pagination parameters.
   *
   * @param {PaginationDto} paginationDto - The pagination parameters for the request.
   * @return {Promise<{ data: Post[]; page_total: number; status: number }>} - A promise that resolves to an object containing the retrieved posts, the total number of pages, and the status code.
   * @throws {InternalServerErrorException} - If an error occurs while fetching the posts.
   */
  async getAllPosts(
    paginationDto: PaginationDto,
  ): Promise<{ data: Post[]; page_total: number; status: number }> {
    try {
      const { page, limit } = paginationDto;
      const count = await this.postModel.countDocuments().exec();
      const page_total = Math.ceil(count / limit);
      const skip = (page - 1) * limit;
      const posts = await this.postModel.find().skip(skip).limit(limit).exec();

      return {
        data: posts,
        page_total,
        status: 200,
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the posts',
      );
    }
  }

  /**
   * Updates a post with the given ID using the provided data.
   *
   * @param {string} user_id - The ID of the user updating the post.
   * @param {string} id - The ID of the post to update.
   * @param {CreatePostDto} postDto - The data to update the post with.
   * @return {Promise<Post>} A promise that resolves to the updated post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {InternalServerErrorException} If there is an error updating the post.
   */
  async updatePost(
    user_id: string,
    id: string,
    postDto: CreatePostDto,
  ): Promise<Post> {
    try {
      postDto['user'] = user_id;
      const updatedPost = await this.postModel
        .findByIdAndUpdate(id, postDto, { new: true })
        .exec();
      if (!updatedPost) {
        throw new NotFoundException('Post not found');
      }
      return updatedPost;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while updating the post',
      );
    }
  }
}
