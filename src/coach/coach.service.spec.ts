import { Test, TestingModule } from '@nestjs/testing';
import { CoachService } from './coach.service';
import { CoachRepository } from './coach.repository';

describe('CoachService', () => {
  let service: CoachService;
  let repo: jest.Mocked<CoachRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachService,
        {
          provide: CoachRepository,
          useValue: {
            create: jest.fn(),
            findCoachBySchoolId: jest.fn(),
            findByPk: jest.fn(),
            findCoachByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoachService>(CoachService);
    repo = module.get(CoachRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should delegate to repository', async () => {
    const dto: any = { userId: 'u1', schoolId: 's1', isVerified: false };
    const created = { id: 'c1', ...dto } as any;
    repo.create.mockResolvedValue(created);
    await expect(service.create(dto)).resolves.toBe(created);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('findBySchoolId should delegate', async () => {
    const coach = { id: 'c1' } as any;
    repo.findCoachBySchoolId.mockResolvedValue(coach);
    await expect(service.findBySchoolId('s1')).resolves.toBe(coach);
    expect(repo.findCoachBySchoolId).toHaveBeenCalledWith('s1');
  });

  it('findById should delegate to repository.findByPk', async () => {
    const coach = { id: 'c1' } as any;
    repo.findByPk.mockResolvedValue(coach);
    await expect(service.findById('c1')).resolves.toBe(coach);
    expect(repo.findByPk).toHaveBeenCalledWith('c1');
  });

  it('findByUserId should delegate', async () => {
    const coach = { id: 'c1' } as any;
    repo.findCoachByUserId.mockResolvedValue(coach);
    await expect(service.findByUserId('u1')).resolves.toBe(coach);
    expect(repo.findCoachByUserId).toHaveBeenCalledWith('u1');
  });
});
