import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from './school.service';
import { SchoolRepository } from './school.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SCHOOL_ERRORS } from './school.constants';

describe('SchoolService', () => {
  let service: SchoolService;
  let repo: jest.Mocked<SchoolRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolService,
        {
          provide: SchoolRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            findByNameAndCity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SchoolService>(SchoolService);
    repo = module.get(SchoolRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw when duplicate school exists', async () => {
    repo.findByNameAndCity.mockResolvedValue({ id: 's1', name: 'A', city: 'B' } as any);
    await expect(service.create({ name: 'A', city: 'B' })).rejects.toThrow(HttpException);
    await expect(service.create({ name: 'A', city: 'B' })).rejects.toThrow(
      SCHOOL_ERRORS.DUPLICATE_SCHOOL('A', 'B'),
    );
  });

  it('create should call repository when no duplicate', async () => {
    repo.findByNameAndCity.mockResolvedValue(null);
    const created = { id: 's1', name: 'A', city: 'B' } as any;
    repo.create.mockResolvedValue(created);
    await expect(service.create({ name: 'A', city: 'B' })).resolves.toBe(created);
    expect(repo.create).toHaveBeenCalledWith({ name: 'A', city: 'B' });
  });

  it('findOneById should delegate', async () => {
    const school = { id: 's1' } as any;
    repo.findOneById.mockResolvedValue(school);
    await expect(service.findOneById('s1')).resolves.toBe(school);
  });

  it('findByNameAndCity should delegate', async () => {
    const school = { id: 's1' } as any;
    repo.findByNameAndCity.mockResolvedValue(school);
    await expect(service.findByNameAndCity('A', 'B')).resolves.toBe(school);
  });
});
