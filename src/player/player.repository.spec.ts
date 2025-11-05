import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { PlayerRepository } from './player.repository';
import { Player } from './entities/player.entity';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';

describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let mockPlayerModel: any;

  const mockPlayer = {
    id: 'player-uuid',
    name: 'John Doe',
    dob: new Date('2010-01-01'),
    age: 14,
    jerseyNumber: 10,
    teamId: 'team-uuid',
    photoUrl: 'https://example.com/photo.jpg',
    isApproved: false,
    save: jest.fn(),
    destroy: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'player-uuid',
      name: 'John Doe',
      jerseyNumber: 10,
      teamId: 'team-uuid',
    }),
  };

  beforeEach(async () => {
    mockPlayerModel = {
      create: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerRepository,
        {
          provide: getModelToken(Player),
          useValue: mockPlayerModel,
        },
      ],
    }).compile();

    repository = module.get<PlayerRepository>(PlayerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new player successfully', async () => {
      const playerData = {
        name: 'John Doe',
        dob: '2010-01-01',
        age: 14,
        jerseyNumber: 10,
        teamId: 'team-uuid',
        photoUrl: 'https://example.com/photo.jpg',
        isApproved: false,
      } as CreationAttributes<Player>;

      mockPlayerModel.create.mockResolvedValue(mockPlayer);

      const result = await repository.create(playerData);

      expect(mockPlayerModel.create).toHaveBeenCalledWith(playerData);
      expect(result).toEqual(mockPlayer);
    });

    it('should handle create errors', async () => {
      const playerData = {
        name: 'John Doe',
        jerseyNumber: 10,
        teamId: 'team-uuid',
      } as CreationAttributes<Player>;

      const error = new Error('Database error');
      mockPlayerModel.create.mockRejectedValue(error);

      await expect(repository.create(playerData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('countByTeamId', () => {
    it('should return count of players for a team', async () => {
      const teamId = 'team-uuid';
      const expectedCount = 5;

      mockPlayerModel.count.mockResolvedValue(expectedCount);

      const result = await repository.countByTeamId(teamId);

      expect(mockPlayerModel.count).toHaveBeenCalledWith({
        where: { teamId },
      });
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no players found for team', async () => {
      const teamId = 'team-uuid';
      mockPlayerModel.count.mockResolvedValue(0);

      const result = await repository.countByTeamId(teamId);

      expect(result).toBe(0);
    });

    it('should handle count errors', async () => {
      const teamId = 'team-uuid';
      const error = new Error('Database error');
      mockPlayerModel.count.mockRejectedValue(error);

      await expect(repository.countByTeamId(teamId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByJersey', () => {
    it('should find player by team ID and jersey number', async () => {
      const teamId = 'team-uuid';
      const jerseyNumber = 10;

      mockPlayerModel.findOne.mockResolvedValue(mockPlayer);

      const result = await repository.findByJersey(teamId, jerseyNumber);

      expect(mockPlayerModel.findOne).toHaveBeenCalledWith({
        where: { teamId, jerseyNumber },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should return null when player not found', async () => {
      const teamId = 'team-uuid';
      const jerseyNumber = 99;

      mockPlayerModel.findOne.mockResolvedValue(null);

      const result = await repository.findByJersey(teamId, jerseyNumber);

      expect(result).toBeNull();
    });

    it('should handle findOne errors', async () => {
      const teamId = 'team-uuid';
      const jerseyNumber = 10;
      const error = new Error('Database error');
      mockPlayerModel.findOne.mockRejectedValue(error);

      await expect(
        repository.findByJersey(teamId, jerseyNumber),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findAllByTeam', () => {
    it('should find all players for a team', async () => {
      const teamId = 'team-uuid';
      const mockPlayers = [mockPlayer, { ...mockPlayer, id: 'player-uuid-2' }];

      mockPlayerModel.findAll.mockResolvedValue(mockPlayers);

      const result = await repository.findAllByTeam(teamId);

      expect(mockPlayerModel.findAll).toHaveBeenCalledWith({
        where: { teamId },
      });
      expect(result).toEqual(mockPlayers);
    });

    it('should return empty array when no players found', async () => {
      const teamId = 'team-uuid';
      mockPlayerModel.findAll.mockResolvedValue([]);

      const result = await repository.findAllByTeam(teamId);

      expect(result).toEqual([]);
    });

    it('should handle findAll errors', async () => {
      const teamId = 'team-uuid';
      const error = new Error('Database error');
      mockPlayerModel.findAll.mockRejectedValue(error);

      await expect(repository.findAllByTeam(teamId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should find player by ID successfully', async () => {
      const playerId = 'player-uuid';

      mockPlayerModel.findOne.mockResolvedValue(mockPlayer);

      const result = await repository.findById(playerId);

      expect(mockPlayerModel.findOne).toHaveBeenCalledWith({
        where: { id: playerId },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should return null when player not found', async () => {
      const playerId = 'non-existent-player-id';
      mockPlayerModel.findOne.mockResolvedValue(null);

      const result = await repository.findById(playerId);

      expect(result).toBeNull();
    });

    it('should handle findOne errors', async () => {
      const playerId = 'player-uuid';
      const error = new Error('Database error');
      mockPlayerModel.findOne.mockRejectedValue(error);

      await expect(repository.findById(playerId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updatePlayerStatus', () => {
    it('should update player approval status successfully', async () => {
      const updateDto: UpdatePlayerStatusDto = {
        playerId: 'player-uuid',
        isApproved: true,
      };

      const mockUpdateResult = [1]; // Sequelize update returns [affectedRows]
      mockPlayerModel.update.mockResolvedValue(mockUpdateResult);

      const result = await repository.updatePlayerStatus(updateDto);

      expect(mockPlayerModel.update).toHaveBeenCalledWith(
        { isApproved: updateDto.isApproved },
        { where: { id: updateDto.playerId } },
      );
      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle update when player not found', async () => {
      const updateDto: UpdatePlayerStatusDto = {
        playerId: 'non-existent-player-id',
        isApproved: true,
      };

      const mockUpdateResult = [0]; // No rows affected
      mockPlayerModel.update.mockResolvedValue(mockUpdateResult);

      const result = await repository.updatePlayerStatus(updateDto);

      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle update errors', async () => {
      const updateDto: UpdatePlayerStatusDto = {
        playerId: 'player-uuid',
        isApproved: true,
      };

      const error = new Error('Database error');
      mockPlayerModel.update.mockRejectedValue(error);

      await expect(repository.updatePlayerStatus(updateDto)).rejects.toThrow(
        'Database error',
      );
    });
  });
});

