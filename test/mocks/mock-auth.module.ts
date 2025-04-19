import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// Mock JWT strategy
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class MockJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'test-secret',
    });
  }

  async validate(payload: any) {
    // Always return a mock admin user for testing
    return {
      id: 1,
      email: 'admin@test.com',
      roles: [{ name: 'admin' }]
    };
  }
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [MockJwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class MockAuthModule {}