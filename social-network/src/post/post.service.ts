import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from './post.schema';
import { User } from 'src/user/user.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from './post.schema.dto';
import { PaginationDto } from 'src/app.pagination.dto';
import { SocketsGateway } from 'src/socket/socket.gateway';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly socketsgateway: SocketsGateway,
  ) {}

  /**
   * Creates a new post for a user.
   *
   * @param {string} userId - The ID of the user creating the post.
   * @param {CreatePostDto} post - The data for the new post.
   * @return {Promise<Post>} The newly created post.
   * @throws {NotFoundException} If the user is not found.
   * @throws {InternalServerErrorException} If there is an error creating the post.
   */
  async create(userId: string, post: CreatePostDto): Promise<Post> {
    try {
      const creator = await this.userModel.findById(userId).exec();
      if (!creator) {
        throw new NotFoundException('User not found');
      }

      const newPost = new this.postModel({
        ...post,
        user: creator._id,
      });

      await newPost.save();
      this.socketsgateway.handleMessage(newPost);
      return newPost;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while creating the post',
      );
    }
  }

  /**
   * Retrieves all posts based on the provided pagination parameters.
   *
   * @param {PaginationDto} paginationDto - The pagination parameters for the request.
   * @return {Promise<{ data: Post[]; page_total: number; status: number }>} - A promise that resolves to an object containing the retrieved posts, the total number of pages, and the status code.
   * @throws {InternalServerErrorException} - If an error occurs while fetching the posts.
   */
  async getAll(
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
   * Retrieves a feed of posts for a given user, based on pagination, sorting, and type.
   *
   * @param {PaginationDto} paginationDto - The pagination parameters for the feed.
   * @param {string} sortBy - The field to sort the posts by.
   * @param {string} order - The order to sort the posts in.
   * @param {string} userId - The ID of the user to retrieve the feed for.
   * @return {Promise<{ data: Post[]; page_total: number; status: number; note?: string; }>} - The feed of posts, along with pagination information and a status code.
   * @throws {NotFoundException} If the user is not found.
   * @throws {InternalServerErrorException} If there is an error retrieving the feed.
   */
  async getFeed(
    paginationDto: PaginationDto,
    sortBy: string,
    order: string,
    userId: string,
  ): Promise<{
    data: Post[];
    page_total: number;
    status: number;
    note?: string;
  }> {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('Followings type')
        .exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { type, Followings } = user;
      const { page, limit } = paginationDto;
      const count = await this.postModel
        .countDocuments({ user: { $in: Followings } })
        .exec();
      const page_total = Math.ceil(count / limit);
      const skip = (page - 1) * limit;

      const sortCriteria = {};
      if (sortBy) {
        sortCriteria[sortBy] = order === 'desc' ? -1 : 1;
      }
      let posts;
      if (type === 'paid') {
        posts = await this.postModel
          .find({ user: { $in: Followings } })
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec();
      } else if (type === 'unpaid') {
        posts = await this.postModel
          .find({ user: { $in: Followings } })
          .sort(sortCriteria)
          .skip(skip)
          .limit(1)
          .lean()
          .exec(); // Limit to 1 post
      }

      // Remove user field from each post
      posts = posts.map((post) => {
        const { user, ...rest } = post;
        return rest;
      });

      const response = {
        data: posts,
        page_total,
        status: 200,
      };

      if (type === 'unpaid' && posts.length === 1) {
        response['note'] = 'Please subscribe to view more posts.';
      }

      return response;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the feed',
      );
    }
  }

  /**
   * Retrieves a single post by its ID.
   *
   * @param {string} id - The ID of the post to retrieve.
   * @return {Promise<Post>} A promise that resolves to the retrieved post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {InternalServerErrorException} If there was an error fetching the post.
   */
  async getOne(id: string): Promise<Post> {
    try {
      const post = await this.postModel.findById(id).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return post;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the post',
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
  async update(
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

  /**
   * Deletes a post if the authenticated user is the same as the user who created the post.
   *
   * @param {string} auth_id - The ID of the authenticated user.
   * @param {string} id - The ID of the post to be deleted.
   * @return {Promise<{ success: boolean; msg: string }>} A promise that resolves to an object with a success flag and a message.
   * @throws {BadRequestException} If the authenticated user is not the same as the user who created the post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {InternalServerErrorException} If there was an error deleting the post.
   */
  async delete(
    auth_id: string,
    id: string,
  ): Promise<{ success: boolean; msg: string }> {
    const to_be_deletedPost = await this.postModel.findById(id).exec();
    if (to_be_deletedPost.user.toString() !== auth_id) {
      throw new BadRequestException('You can delete your own User only.');
    }
    try {
      const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
      if (!deletedPost) {
        throw new NotFoundException('Post not found');
      }
      return { success: true, msg: 'Post deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while deleting the post',
      );
    }
  }
}
