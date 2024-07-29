export class CreateUserDto {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  age?: number;
  email: string;
  Followers?: string[];
  Followings?: string[];
  type?: string;
}
