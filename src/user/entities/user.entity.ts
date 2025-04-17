// src/user/entities/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    BeforeInsert,
    BeforeUpdate,
  } from 'typeorm';
  import { Role } from './role.entity'; // Adjust path if needed
  import * as bcrypt from 'bcrypt';
  
  @Entity({ name: 'users' }) // Specifies the table name
  export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password?: string; // Make optional for reading from DB without selecting it
  
    @Column({ nullable: true })
    profileImage: string;
  
    @Column({ nullable: true }) // Storing as string for now
    faculty: string;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    // User-Role relationship (User is the owner)
    @ManyToMany(() => Role, (role) => role.users, {
        cascade: true, // Optional: If deleting a user shouldn't delete roles, remove or set specific cascades
        eager: false, // Set to true if you want roles to be loaded automatically whenever you load a user
    })
    @JoinTable({
      name: 'user_roles', // Name of the join table
      joinColumn: { name: 'user_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];
  
    // --- Password Hashing Hook ---
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
      // Hash password only if it exists and has changed (or is new)
      if (this.password) {
        // Check if the password looks like a hash already - adjust salt rounds as needed (10-12 is common)
        // This simple check prevents re-hashing an already hashed password during updates
        // A more robust check might be needed depending on your hash format.
        if (!this.password.startsWith('$2b$')) { // Basic check for bcrypt hash format
           const saltRounds = 10;
           this.password = await bcrypt.hash(this.password, saltRounds);
        }
      }
    }
  }