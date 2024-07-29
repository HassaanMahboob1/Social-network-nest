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
import { UserService } from './user.service';
import { User, UserSchema } from './user.schema';
import { CreateUserDto } from './users.schema.dto';
import { PaginationDto } from 'src/app.pagination.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async create(@Body() user: CreateUserDto): Promise<object> {
    return this.userService.create(user);
  }

  @Post('login')
  async login(@Body() body: any): Promise<object> {
    const { email, password } = body;
    return this.userService.login(email, password);
  }

  @Post('follow-user/:id')
  async followUser(@Request() req, @Param('id') id: string): Promise<object> {
    return this.userService.followUser(req.user.id, id);
  }

  @Post('unfollow-user/:id')
  async unfollowUser(@Request() req, @Param('id') id: string): Promise<object> {
    return this.userService.unfollowUser(req.user.id, id);
  }

  @Get()
  async getall(@Query() paginationDto: PaginationDto): Promise<object> {
    return this.userService.getall(paginationDto);
  }

  @Get(':id')
  async getone(@Param('id') id: string): Promise<User> {
    return this.userService.getone(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() user: CreateUserDto,
  ): Promise<any> {
    return this.userService.update(req.user.id, id, user);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string): Promise<User> {
    return this.userService.deleteuser(req.user.id, id);
  }
}
