// src/user/entities/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity'; // Adjust path if needed

@Entity({ name: 'permissions' }) // Specifies the table name
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // e.g., 'create:course', 'view:users'

  @Column({ nullable: true })
  description: string;

  // Inverse side of the Role-Permission relationship
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}