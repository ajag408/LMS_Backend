// Create this file in a new config directory under test
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../src/user/entities/user.entity';
import { Role } from '../../src/user/entities/role.entity';
import { Permission } from '../../src/user/entities/permission.entity';

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'test_user', // create this
  password: 'test_password', // set this
  database: 'lms_test',
  entities: [User, Role, Permission],
  synchronize: true, // Automatically create tables in test DB
  dropSchema: true // Clean state for each test run
};