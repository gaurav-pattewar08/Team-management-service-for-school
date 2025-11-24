import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { TeamRepository } from './team.repository';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';

describe('TeamRepository', () => {
  let repository: TeamRepository;
  let mockTeamModel: any;

  const mockUser = {
    id: 'user-uuid',
    name: 'Coach Name',
    email: 'coach@test.com',
    role: 'COACH',
  };

  const mockCoach = {
    id: 'coach-uuid',
    userId: 'user-uuid',
    schoolId: 'school-uuid',
    isVerified: true,
    user: mockUser,
  };

  const mockPlayer = {
    id: 'player-uuid',
    name: 'Player Name',
    dob: new Date('2010-01-01'),
    jerseyNumber: 10,
    photoUrl: 'https://example.com/photo.jpg',
    isApproved: true,
  };

  const mockTeam = {
    id: 'team-uuid',
    name: 'Thunder Warriors',
    coachId: 'coach-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    coach: mockCoach,
    players: [mockPlayer],
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'team-uuid',
      name: 'Thunder Warriors',
      coachId: 'coach-uuid',
    }),
  };

  beforeEach(async () => {
    mockTeamModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamRepository,
        {
          provide: getModelToken(Team),
          useValue: mockTeamModel,
        },
      ],
    }).compile();

    repository = module.get<TeamRepository>(TeamRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new team successfully', async () => {
      const teamData = {
        name: 'Thunder Warriors',
        coachId: 'coach-uuid',
      } as CreationAttributes<Team>;

      mockTeamModel.create.mockResolvedValue(mockTeam);

      const result = await repository.create(teamData);

      expect(mockTeamModel.create).toHaveBeenCalledWith(teamData);
      expect(result).toEqual(mockTeam);
    });

    it('should handle create errors', async () => {
      const teamData = {
        name: 'Thunder Warriors',
        coachId: 'coach-uuid',
      } as CreationAttributes<Team>;

      const error = new Error('Database error');
      mockTeamModel.create.mockRejectedValue(error);

      await expect(repository.create(teamData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByCoachId', () => {
    it('should find team by coach ID with players', async () => {
      const coachId = 'coach-uuid';
      const teamWithPlayers = {
        ...mockTeam,
        players: [mockPlayer],
      };

      mockTeamModel.findOne.mockResolvedValue(teamWithPlayers);

      const result = await repository.findByCoachId(coachId);

      expect(mockTeamModel.findOne).toHaveBeenCalledWith({
        where: { coachId },
        include: [expect.any(Function)],
      });
      expect(result).toEqual(teamWithPlayers);
    });

    it('should return null when team not found', async () => {
      const coachId = 'non-existent-coach-id';
      mockTeamModel.findOne.mockResolvedValue(null);

      const result = await repository.findByCoachId(coachId);

      expect(result).toBeNull();
    });

    it('should handle findOne errors', async () => {
      const coachId = 'coach-uuid';
      const error = new Error('Database error');
      mockTeamModel.findOne.mockRejectedValue(error);

      await expect(repository.findByCoachId(coachId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByName', () => {
    it('should find team by name successfully', async () => {
      const name = 'Thunder Warriors';

      mockTeamModel.findOne.mockResolvedValue(mockTeam);

      const result = await repository.findByName(name);

      expect(mockTeamModel.findOne).toHaveBeenCalledWith({
        where: { name },
      });
      expect(result).toEqual(mockTeam);
    });

    it('should return null when team not found', async () => {
      const name = 'Non-existent Team';
      mockTeamModel.findOne.mockResolvedValue(null);

      const result = await repository.findByName(name);

      expect(result).toBeNull();
    });

    it('should handle findOne errors for name search', async () => {
      const name = 'Thunder Warriors';
      const error = new Error('Database error');
      mockTeamModel.findOne.mockRejectedValue(error);

      await expect(repository.findByName(name)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should find team by ID with coach and user relations', async () => {
      const teamId = 'team-uuid';
      const teamWithRelations = {
        ...mockTeam,
        coach: {
          ...mockCoach,
          user: mockUser,
        },
      };

      mockTeamModel.findByPk.mockResolvedValue(teamWithRelations);

      const result = await repository.findById(teamId);

      expect(mockTeamModel.findByPk).toHaveBeenCalledWith(teamId, {
        include: [
          {
            model: expect.any(Function),
            include: [
              {
                model: expect.any(Function),
              },
            ],
          },
        ],
      });
      expect(result).toEqual(teamWithRelations);
    });

    it('should return null when team not found', async () => {
      const teamId = 'non-existent-team-id';
      mockTeamModel.findByPk.mockResolvedValue(null);

      const result = await repository.findById(teamId);

      expect(result).toBeNull();
    });

    it('should handle findByPk errors', async () => {
      const teamId = 'team-uuid';
      const error = new Error('Database error');
      mockTeamModel.findByPk.mockRejectedValue(error);

      await expect(repository.findById(teamId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should find all teams with coach and player relations', async () => {
      const mockTeams = [
        {
          ...mockTeam,
          coach: {
            ...mockCoach,
            user: mockUser,
          },
          players: [mockPlayer],
        },
      ];

      mockTeamModel.findAll.mockResolvedValue(mockTeams);

      const result = await repository.findAll();

      expect(mockTeamModel.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: expect.any(Function),
            as: 'coach',
            include: [
              {
                model: expect.any(Function),
                as: 'user',
                attributes: ['name', 'email'],
              },
            ],
            attributes: ['id'],
          },
          {
            model: expect.any(Function),
            attributes: [
              'id',
              'name',
              'dob',
              'jerseyNumber',
              'photoUrl',
              'isApproved',
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual(mockTeams);
    });

    it('should return empty array when no teams exist', async () => {
      mockTeamModel.findAll.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle findAll errors', async () => {
      const error = new Error('Database error');
      mockTeamModel.findAll.mockRejectedValue(error);

      await expect(repository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('getByCoachId', () => {
    it('should get team by coach ID with full relations', async () => {
      const coachId = 'coach-uuid';
      const teamWithFullRelations = {
        ...mockTeam,
        coach: {
          ...mockCoach,
          user: mockUser,
        },
        players: [mockPlayer],
      };

      mockTeamModel.findOne.mockResolvedValue(teamWithFullRelations);

      const result = await repository.getByCoachId(coachId);

      expect(mockTeamModel.findOne).toHaveBeenCalledWith({
        where: { coachId },
        include: [
          {
            model: expect.any(Function),
            as: 'coach',
            include: [
              {
                model: expect.any(Function),
                as: 'user',
                attributes: ['id', 'name', 'email', 'role'],
              },
            ],
            attributes: ['id', 'isVerified', 'schoolId'],
          },
          {
            model: expect.any(Function),
            as: 'players',
            attributes: [
              'id',
              'name',
              'dob',
              'age',
              'jerseyNumber',
              'photoUrl',
              'isApproved',
            ],
          },
        ],
        attributes: ['id', 'name'],
      });
      expect(result).toEqual(teamWithFullRelations);
    });

    it('should return null when team not found for coach', async () => {
      const coachId = 'non-existent-coach-id';
      mockTeamModel.findOne.mockResolvedValue(null);

      const result = await repository.getByCoachId(coachId);

      expect(result).toBeNull();
    });

    it('should handle findOne errors in getByCoachId', async () => {
      const coachId = 'coach-uuid';
      const error = new Error('Database error');
      mockTeamModel.findOne.mockRejectedValue(error);

      await expect(repository.getByCoachId(coachId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});

