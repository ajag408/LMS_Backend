import { Exclude, Expose } from 'class-transformer';

@Expose()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  faculty: string;

  @Expose()
  profileImage?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  roles: string[];

  @Exclude()
  password?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}