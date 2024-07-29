export class CreatePostDto {
  title: string;
  content: string;
  tag?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
