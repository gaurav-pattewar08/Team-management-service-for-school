import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { SchoolRepository } from './school.repository';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';

describe('SchoolRepository', () => {
  let repository: SchoolRepository;
  let mockSchoolModel: any;

  const mockSchool = {
    id: 'school-uuid',
    name: 'St. Xavier High School',
    city: 'Mumbai',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'school-uuid',
      name: 'St. Xavier High School',
      city: 'Mumbai',
    }),
  };

  beforeEach(async () => {
    mockSchoolModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolRepository,
        {
          provide: getModelToken(School),
          useValue: mockSchoolModel,
        },
      ],
    }).compile();

    repository = module.get<SchoolRepository>(SchoolRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new school successfully', async () => {
      const createSchoolDto: CreateSchoolDto = {
        name: 'St. Xavier High School',
        city: 'Mumbai',
      };

      mockSchoolModel.create.mockResolvedValue(mockSchool);

      const result = await repository.create(createSchoolDto);

      expect(mockSchoolModel.create).toHaveBeenCalledWith(createSchoolDto);
      expect(result).toEqual(mockSchool);
    });

    it('should handle create errors', async () => {
      const createSchoolDto: CreateSchoolDto = {
        name: 'St. Xavier High School',
        city: 'Mumbai',
      };

      const error = new Error('Database error');
      mockSchoolModel.create.mockRejectedValue(error);

      await expect(repository.create(createSchoolDto)).rejects.toThrow(
        'Database error',
      );
      expect(mockSchoolModel.create).toHaveBeenCalledWith(createSchoolDto);
    });

    it('should create school with all required fields', async () => {
      const createSchoolDto: CreateSchoolDto = {
        name: 'ABC School',
        city: 'Delhi',
      };

      const createdSchool = {
        ...mockSchool,
        name: 'ABC School',
        city: 'Delhi',
      };

      mockSchoolModel.create.mockResolvedValue(createdSchool);

      const result = await repository.create(createSchoolDto);

      expect(result.name).toBe('ABC School');
      expect(result.city).toBe('Delhi');
    });
  });

  describe('findAll', () => {
    it('should return all schools', async () => {
      const mockSchools = [
        mockSchool,
        {
          ...mockSchool,
          id: 'school-uuid-2',
          name: 'Another School',
          city: 'Pune',
        },
      ];

      mockSchoolModel.findAll.mockResolvedValue(mockSchools);

      const result = await repository.findAll();

      expect(mockSchoolModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockSchools);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no schools exist', async () => {
      mockSchoolModel.findAll.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle findAll errors', async () => {
      const error = new Error('Database error');
      mockSchoolModel.findAll.mockRejectedValue(error);

      await expect(repository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOneById', () => {
    it('should find school by ID successfully', async () => {
      const schoolId = 'school-uuid';

      mockSchoolModel.findByPk.mockResolvedValue(mockSchool);

      const result = await repository.findOneById(schoolId);

      expect(mockSchoolModel.findByPk).toHaveBeenCalledWith(schoolId);
      expect(result).toEqual(mockSchool);
    });

    it('should return null when school not found', async () => {
      const schoolId = 'non-existent-school-id';
      mockSchoolModel.findByPk.mockResolvedValue(null);

      const result = await repository.findOneById(schoolId);

      expect(mockSchoolModel.findByPk).toHaveBeenCalledWith(schoolId);
      expect(result).toBeNull();
    });

    it('should handle findByPk errors', async () => {
      const schoolId = 'school-uuid';
      const error = new Error('Database error');
      mockSchoolModel.findByPk.mockRejectedValue(error);

      await expect(repository.findOneById(schoolId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByNameAndCity', () => {
    it('should find school by name and city successfully', async () => {
      const name = 'St. Xavier High School';
      const city = 'Mumbai';

      mockSchoolModel.findOne.mockResolvedValue(mockSchool);

      const result = await repository.findByNameAndCity(name, city);

      expect(mockSchoolModel.findOne).toHaveBeenCalledWith({
        where: { name, city },
      });
      expect(result).toEqual(mockSchool);
    });

    it('should return null when school not found', async () => {
      const name = 'Non-existent School';
      const city = 'Unknown City';

      mockSchoolModel.findOne.mockResolvedValue(null);

      const result = await repository.findByNameAndCity(name, city);

      expect(mockSchoolModel.findOne).toHaveBeenCalledWith({
        where: { name, city },
      });
      expect(result).toBeNull();
    });

    it('should handle case-sensitive name and city matching', async () => {
      const name = 'St. Xavier High School';
      const city = 'Mumbai';

      mockSchoolModel.findOne.mockResolvedValue(mockSchool);

      const result = await repository.findByNameAndCity(name, city);

      expect(result).toEqual(mockSchool);
    });

    it('should handle findOne errors', async () => {
      const name = 'St. Xavier High School';
      const city = 'Mumbai';
      const error = new Error('Database error');
      mockSchoolModel.findOne.mockRejectedValue(error);

      await expect(
        repository.findByNameAndCity(name, city),
      ).rejects.toThrow('Database error');
    });
  });
});

