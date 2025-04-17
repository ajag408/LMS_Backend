// LMS_Backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Often used for DB credentials
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './user/entities/user.entity'; // Adjust path as needed
import { Role } from './user/entities/role.entity'; // Adjust path as needed
import { Permission } from './user/entities/permission.entity'; // Adjust path as needed

// --- Potentially other module imports (e.g., UserModule later) ---

@Module({
  imports: [
    // --- Example using TypeOrmModule.forRootAsync with ConfigService ---
    ConfigModule.forRoot({ isGlobal: true }), // Make ConfigModule available globally
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule here as well
      inject: [ConfigService], // Inject ConfigService to use environment variables
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', // Or your database type (mysql, sqlite, etc.)
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASS'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          User, // Add User entity
          Role, // Add Role entity
          Permission, // Add Permission entity
          // Add other entities here
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // true only for development (creates schema automatically)
        // autoLoadEntities: true, // Alternative: automatically loads entities registered via forFeature()
        logging: false, // Enable/disable SQL logging
        // migrations: [__dirname + '/../database/migrations/*{.ts,.js}'], // Path to migrations
        // cli: { migrationsDir: 'src/database/migrations' } // Path for CLI
      }),
    }),

    // --- Add your UserModule here later ---
    // UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}