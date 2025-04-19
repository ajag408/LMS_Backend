import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { testDbConfig } from './config/test-db.config';
import { MockAuthModule } from './mocks/mock-auth.module';
import { UserModule } from '../src/user/user.module';
import { User } from '../src/user/entities/user.entity';
import { Role } from '../src/user/entities/role.entity';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: any;
  let roleRepository: any;
  let authToken: string; // Will be set after login

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [        
        TypeOrmModule.forRoot(testDbConfig),
        MockAuthModule, // Use our mock auth module
        UserModule,],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    userRepository = moduleFixture.get(getRepositoryToken(User));
    roleRepository = moduleFixture.get(getRepositoryToken(Role));

    await app.init();

    // Create initial test data
    await roleRepository.save({ id: 1, name: 'admin' });
    await roleRepository.save({ id: 2, name: 'instructor' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer test-token`) // Mock token, will be accepted by MockAuthModule
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          faculty: 'Engineering',
          roleIds: ['2'], // Assuming role ID 2 exists
        })
        .expect(201)
        .expect(res => {
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer test-token`)
        .send({
          name: 'Test User',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer test-token`)
        .query({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.items).toBeDefined();
          expect(res.body.total).toBeDefined();
        });
    });

    it('should filter users by faculty', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer test-token`)
        .query({
          filterByFaculty: 'Engineering',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.items.every(user => 
            user.faculty === 'Engineering'
          )).toBe(true);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const user = await userRepository.findOne({ 
        where: { email: 'test@example.com' } 
      });

      return request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer test-token}`)
        .expect(200)
        .expect(res => {
          expect(res.body.id).toBe(user.id);
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/999999')
        .set('Authorization', `Bearer test-token}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user', async () => {
      const user = await userRepository.findOne({ 
        where: { email: 'test@example.com' } 
      });

      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer test-token`)
        .send({
          name: 'Updated Name',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.name).toBe('Updated Name');
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should soft delete user', async () => {
      const user = await userRepository.findOne({ 
        where: { email: 'test@example.com' } 
      });

      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', `Bearer test-token}`)
        .expect(204);

      const deletedUser = await userRepository.findOne({ 
        where: { id: user.id } 
      });
      expect(deletedUser.isActive).toBe(false);
    });
  });
});