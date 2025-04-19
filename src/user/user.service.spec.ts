import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt'; // Add bcrypt
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateUserDto, UpdateUserDto, PaginationQueryDto } from './dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockRoleRepository = {
    findBy: jest.fn(),
  };

  const mockPermissionRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      faculty: 'Engineering',
      roleIds: ['1'],
    };

    it('should create a new user successfully', async () => {
      const roles = [{ id: 1, name: 'student' }];
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findBy.mockResolvedValue(roles);
      mockUserRepository.create.mockReturnValue({ 
        ...createUserDto, 
        password: 'hashed_password', // Should match bcrypt mock
        roles 
      });
      mockUserRepository.save.mockResolvedValue({ 
        id: 1, 
        ...createUserDto,
        password: 'hashed_password', // Should match bcrypt mock
        roles 
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result.password).toBeUndefined(); // Password should be excluded from response
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: createUserDto.email });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const paginationQuery: PaginationQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    it('should return paginated users', async () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];
      mockUserRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll(paginationQuery);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a user if exists', async () => {
      const user = { id: 1, name: 'Test User' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const existingUser = { 
        id: 1, 
        name: 'Old Name',
        roles: []
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({ ...existingUser, ...updateUserDto });

      const result = await service.update('1', updateUserDto);

      expect(result.name).toBe(updateUserDto.name);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete user successfully', async () => {
      const user = { id: 1, isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);

      await service.remove('1');

      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...user, isActive: false });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = { 
        id: 1, 
        password: 'hashed_password' 
      };
      mockUserRepository.findOneOrFail.mockResolvedValue(user);

      await service.changePassword('1', 'currentPassword', 'newPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword', user.password);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      const user = { 
        id: 1, 
        password: 'old_hashed_password' 
      };
      mockUserRepository.findOneOrFail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.changePassword('1', 'wrongPassword', 'newPassword')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});