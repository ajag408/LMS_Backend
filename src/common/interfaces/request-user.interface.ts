import { Role } from '../../user/entities/role.entity';

export interface RequestUser {
  id: number;
  email: string;
  roles: Role[];
}