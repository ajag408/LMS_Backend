// src/user/entities/role.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
  import { User } from './user.entity'; // Adjust path if needed
  import { Permission } from './permission.entity'; // Adjust path if needed
  
  @Entity({ name: 'roles' }) // Specifies the table name
  export class Role {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ unique: true })
    name: string; // e.g., 'student', 'instructor', 'admin'
  
    @Column({ nullable: true })
    description: string;
  
    // Role-Permission relationship (Role is the owner)
    @ManyToMany(() => Permission, (permission) => permission.roles, {
      cascade: true, // Optional: simplifies management if permissions are tied to roles
    })
    @JoinTable({
      name: 'role_permissions', // Name of the join table
      joinColumn: { name: 'role_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    })
    permissions: Permission[];
  
    // Inverse side of the User-Role relationship
    @ManyToMany(() => User, (user) => user.roles)
    users: User[];
  }