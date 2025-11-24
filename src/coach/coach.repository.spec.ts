import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { CoachRepository } from './coach.repository';
import { Coach } from './entities/coach.entity';
import { CreateCoachDto } from './dto/create-coach.dto';

describe('CoachRepository', () => {
  let repository: CoachRepository;
  let mockCoachModel: any;

  const mockUser = {
    id: 'user-uuid',
    email: 'coach@test.com',
    name: 'Coach Name',
  };

  const mockCoach = {
    id: 'coach-uuid',
    userId: 'user-uuid',
    schoolId: 'school-uuid',
    isVerified: false,
    user: mockUser,
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'coach-uuid',
      userId: 'user-uuid',
      schoolId: 'school-uuid',
      isVerified: false,
    }),
  };

  beforeEach(async () => {
    mockCoachModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachRepository,
        {
          provide: getModelToken(Coach),
          useValue: mockCoachModel,
        },
      ],
    }).compile();

    repository = module.get<CoachRepository>(CoachRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new coach successfully', async () => {
      const createCoachDto: CreateCoachDto = {
        userId: 'user-uuid',
        schoolId: 'school-uuid',
        isVerified: false,
      };

      mockCoachModel.create.mockResolvedValue(mockCoach);

      const result = await repository.create(createCoachDto);

      expect(mockCoachModel.create).toHaveBeenCalledWith(createCoachDto);
      expect(result).toEqual(mockCoach);
    });

    it('should handle create errors', async () => {
      const createCoachDto: CreateCoachDto = {
        userId: 'user-uuid',
        schoolId: 'school-uuid',
        isVerified: false,
      };

      const error = new Error('Database error');
      mockCoachModel.create.mockRejectedValue(error);

      await expect(repository.create(createCoachDto)).rejects.toThrow(
        'Database error',
      );
      expect(mockCoachModel.create).toHaveBeenCalledWith(createCoachDto);
    });
  });

  describe('findCoachBySchoolId', () => {
    it('should find coach by school ID successfully', async () => {
      const schoolId = 'school-uuid';
      mockCoachModel.findOne.mockResolvedValue(mockCoach);

      const result = await repository.findCoachBySchoolId(schoolId);

      expect(mockCoachModel.findOne).toHaveBeenCalledWith({
        where: { schoolId },
      });
      expect(result).toEqual(mockCoach);
    });

    it('should return null when coach not found', async () => {
      const schoolId = 'non-existent-school-id';
      mockCoachModel.findOne.mockResolvedValue(null);

      const result = await repository.findCoachBySchoolId(schoolId);

      expect(mockCoachModel.findOne).toHaveBeenCalledWith({
        where: { schoolId },
      });
      expect(result).toBeNull();
    });

    it('should handle findOne errors', async () => {
      const schoolId = 'school-uuid';
      const error = new Error('Database error');
      mockCoachModel.findOne.mockRejectedValue(error);

      await expect(
        repository.findCoachBySchoolId(schoolId),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByPk', () => {
    it('should find coach by primary key with user relation', async () => {
      const coachId = 'coach-uuid';
      const coachWithUser = {
        ...mockCoach,
        user: mockUser,
      };

      mockCoachModel.findByPk.mockResolvedValue(coachWithUser);

      const result = await repository.findByPk(coachId);

      expect(mockCoachModel.findByPk).toHaveBeenCalledWith(coachId, {
        include: [
          {
            model: expect.any(Function),
            attributes: ['id', 'email', 'name'],
          },
        ],
      });
      expect(result).toEqual(coachWithUser);
    });

    it('should return null when coach not found', async () => {
      const coachId = 'non-existent-coach-id';
      mockCoachModel.findByPk.mockResolvedValue(null);

      const result = await repository.findByPk(coachId);

      expect(mockCoachModel.findByPk).toHaveBeenCalledWith(coachId, {
        include: [
          {
            model: expect.any(Function),
            attributes: ['id', 'email', 'name'],
          },
        ],
      });
      expect(result).toBeNull();
    });

    it('should handle findByPk errors', async () => {
      const coachId = 'coach-uuid';
      const error = new Error('Database error');
      mockCoachModel.findByPk.mockRejectedValue(error);

      await expect(repository.findByPk(coachId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findCoachByUserId', () => {
    it('should find coach by user ID successfully', async () => {
      const userId = 'user-uuid';
      mockCoachModel.findOne.mockResolvedValue(mockCoach);

      const result = await repository.findCoachByUserId(userId);

      expect(mockCoachModel.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(mockCoach);
    });

    it('should return null when coach not found for user', async () => {
      const userId = 'non-existent-user-id';
      mockCoachModel.findOne.mockResolvedValue(null);

      const result = await repository.findCoachByUserId(userId);

      expect(mockCoachModel.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toBeNull();
    });

    it('should handle findOne errors for user ID', async () => {
      const userId = 'user-uuid';
      const error = new Error('Database error');
      mockCoachModel.findOne.mockRejectedValue(error);

      await expect(repository.findCoachByUserId(userId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});

