import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { CreatePostDto } from './post.schema.dto';
import { PostService } from './post.service';
import { Post as PostModel } from './post.schema';
import { PaginationDto } from 'src/app.pagination.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('feed')
  async feed(
    @Query() paginationDto: PaginationDto,
    @Query('sortBy') sortBy: string,
    @Query('order') order: string,
    @Request() req,
  ): Promise<any> {
    return this.postService.getFeed(paginationDto, sortBy, order, req.user.id);
  }

  @Post('create')
  async create(
    @Body() post: CreatePostDto,
    @Request() req,
  ): Promise<PostModel> {
    return this.postService.create(req.user.id, post);
  }

  @Get('all')
  async getall(@Query() paginationDto: PaginationDto): Promise<object> {
    return this.postService.getAll(paginationDto);
  }

  @Get(':id')
  async getone(@Param('id') id: string): Promise<PostModel> {
    return this.postService.getOne(id);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() post: CreatePostDto,
  ): Promise<PostModel> {
    return this.postService.update(req.user.id, id, post);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string): Promise<object> {
    return this.postService.delete(req.user.id, id);
  }
}
