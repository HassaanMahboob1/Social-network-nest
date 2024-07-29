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
import { ModeratorService } from './moderator.service';
import { Moderator, ModeratorSchema } from './moderator.schema';
import { CreateModeratorDto } from './moderator.schema.dto';
import { PaginationDto } from 'src/app.pagination.dto';
import { CreatePostDto } from 'src/post/post.schema.dto';

@Controller('moderator')
export class ModeratorController {
  constructor(private readonly ModeratorService: ModeratorService) {}

  @Post('register')
  async create(@Body() Moderator: CreateModeratorDto): Promise<object> {
    return this.ModeratorService.createModerator(Moderator);
  }

  @Post('login')
  async login(@Body() body: any): Promise<object> {
    const { email, password } = body;
    return this.ModeratorService.loginModerator(email, password);
  }

  @Get('posts')
  async getAll(@Query() paginationDto: PaginationDto): Promise<object> {
    return this.ModeratorService.getAllPosts(paginationDto);
  }

  @Put('post/update/:id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() post: CreatePostDto,
  ): Promise<any> {
    return this.ModeratorService.updatePost(req.user.id, id, post);
  }
}
