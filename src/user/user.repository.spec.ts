import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../common/roles.enum';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockUserModel: any;

  const mockUser = {
    id: 'user-uuid',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: Role.COACH,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'user-uuid',
      name: 'John Doe',
      email: 'john@example.com',
      role: Role.COACH,
    }),
  };

  const mockAdminUser = {
    ...mockUser,
    id: 'admin-uuid',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  beforeEach(async () => {
    mockUserModel = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken(User),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: Role.COACH,
      };

      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await repository.create(createUserDto);

      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should create admin user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        role: Role.ADMIN,
      };

      mockUserModel.create.mockResolvedValue(mockAdminUser);

      const result = await repository.create(createUserDto);

      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockAdminUser);
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should handle create errors', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: Role.COACH,
      };

      const error = new Error('Database error');
      mockUserModel.create.mockRejectedValue(error);

      await expect(repository.create(createUserDto)).rejects.toThrow(
        'Database error',
      );
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should create user with all required fields', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123!',
        role: Role.COACH,
      };

      const createdUser = {
        ...mockUser,
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      mockUserModel.create.mockResolvedValue(createdUser);

      const result = await repository.create(createUserDto);

      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(result.role).toBe(Role.COACH);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'john@example.com';

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });

    it('should handle case-sensitive email search', async () => {
      const email = 'John@Example.com';
      const userWithDifferentCase = {
        ...mockUser,
        email: 'john@example.com',
      };

      mockUserModel.findOne.mockResolvedValue(userWithDifferentCase);

      const result = await repository.findByEmail(email);

      expect(result).toEqual(userWithDifferentCase);
    });

    it('should handle findOne errors', async () => {
      const email = 'john@example.com';
      const error = new Error('Database error');
      mockUserModel.findOne.mockRejectedValue(error);

      await expect(repository.findByEmail(email)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getAdmin', () => {
    it('should find admin user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockAdminUser);

      const result = await repository.getAdmin();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
      });
      expect(result).toEqual(mockAdminUser);
      expect(result).not.toBeNull();
      expect(result!.role).toBe(Role.ADMIN);
    });

    it('should return null when admin user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await repository.getAdmin();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
      });
      expect(result).toBeNull();
    });

    it('should not return coach user when searching for admin', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await repository.getAdmin();

      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
      });
    });

    it('should handle findOne errors for admin search', async () => {
      const error = new Error('Database error');
      mockUserModel.findOne.mockRejectedValue(error);

      await expect(repository.getAdmin()).rejects.toThrow('Database error');
    });
  });
});

