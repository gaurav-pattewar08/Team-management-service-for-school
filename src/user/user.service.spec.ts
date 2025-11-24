import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            getAdmin: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByEmail should delegate to repository', async () => {
    const user = { id: 'u1', email: 'a@b.com' } as any;
    repo.findByEmail.mockResolvedValue(user);
    await expect(service.findByEmail('a@b.com')).resolves.toBe(user);
    expect(repo.findByEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('create should delegate to repository', async () => {
    const dto: any = { name: 'John' };
    const created = { id: 'u1', ...dto } as any;
    repo.create.mockResolvedValue(created);
    await expect(service.create(dto)).resolves.toBe(created);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('getAdminDetails should call repository.getAdmin', async () => {
    const admin = { id: 'admin' } as any;
    repo.getAdmin.mockResolvedValue(admin);
    await expect(service.getAdminDetails()).resolves.toBe(admin);
    expect(repo.getAdmin).toHaveBeenCalled();
  });
});
