import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateUserDto, UpdateUserDto, PaginationQueryDto, UserResponseDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Find roles if roleIds provided
    let roles: Role[] = [];
    if (createUserDto.roleIds?.length) {
      roles = await this.roleRepository.findBy({ id: In(createUserDto.roleIds.map(id => +id)) });
    }

    // Create new user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
      isActive: true
    });

    // Save user
    const savedUser = await this.userRepository.save(user);
    return this.mapToDto(savedUser);
  }

  async findAll(paginationQueryDto: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      filterByRole,
      filterByFaculty
    } = paginationQueryDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    // Apply filters
    if (filterByRole) {
      queryBuilder.andWhere('roles.id = :roleId', { roleId: +filterByRole });
    }
    if (filterByFaculty) {
      queryBuilder.andWhere('user.faculty = :faculty', { faculty: filterByFaculty });
    }

    // Apply pagination and sorting
    const [users, total] = await queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: users.map(user => this.mapToDto(user)),
      total,
      page,
      limit
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: +id },
      relations: ['roles', 'roles.permissions']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
        where: { id: +id },
        relations: ['roles', 'roles.permissions']
      });
    
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    
      if (updateUserDto.roleIds) {
        const roles = await this.roleRepository.findBy({ 
          id: In(updateUserDto.roleIds.map(id => +id)) 
        });
        user.roles = roles;
      }
    
      const { roleIds, ...updateData } = updateUserDto;
      Object.assign(user, updateData);
    
      const savedUser = await this.userRepository.save(user);
      return this.mapToDto(savedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
        where: { id: +id }
      });
    
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    // Soft delete - just mark as inactive
    user.isActive = false;
    await this.userRepository.save(user);
  }

  private mapToDto(user: User): UserResponseDto {
    const userDto = new UserResponseDto();
    Object.assign(userDto, user);
    delete userDto.password; // Ensure password is never sent
    return userDto;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOneOrFail({ 
      where: { id: +id } 
    });
    
    if (!user.password) {
      throw new Error('User has no password set');
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }
}