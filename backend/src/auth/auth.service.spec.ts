import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  const sampleUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      mockUserService.create.mockResolvedValue(sampleUser);

      const result = await service.register({ email: 'test@example.com', password: 'password123' });

      expect(result.access_token).toBe('test-token');
      expect(mockUserService.create).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: sampleUser.id, email: sampleUser.email });
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(sampleUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.access_token).toBe('test-token');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', sampleUser.passwordHash);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUserService.findByEmail.mockResolvedValue(sampleUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
