import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PlayerRepository } from './player.repository';
import { TeamRepository } from 'src/team/team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { PLAYER_MESSAGES } from './player.constant';
import { CreationAttributes } from 'sequelize';
import { Player } from './entities/player.entity';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';

@Injectable()
export class PlayerService {
  constructor(
    private readonly playerRepo: PlayerRepository,
    private readonly teamRepo: TeamRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly mailerService: MailerService,
    private readonly coachService: CoachService,
  ) {}

  private validatePhoto(file: Express.Multer.File) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!file) throw new BadRequestException(PLAYER_MESSAGES.PHOTO_REQUIRED);
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException(PLAYER_MESSAGES.INVALID_FILE_TYPE);
    if (file.size > 2 * 1024 * 1024)
      throw new BadRequestException(PLAYER_MESSAGES.FILE_TOO_LARGE);
  }

  private calculateAgeFromDob(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const m = today.getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
    return age;
  }

  async addPlayer(
    coachId: string,
    dto: { name: string; dob: string; jerseyNumber: number },
    file: Express.Multer.File,
  ) {
    const team = await this.teamRepo.findByCoachId(coachId);
    if (!team) throw new ForbiddenException(PLAYER_MESSAGES.UNAUTHORIZED);
    const count = await this.playerRepo.countByTeamId(team.id);
    if (count >= 15)
      throw new BadRequestException(PLAYER_MESSAGES.TEAM_LIMIT_EXCEEDED);

    const jerseyExists = await this.playerRepo.findByJersey(
      team.id,
      dto.jerseyNumber,
    );
    if (jerseyExists)
      throw new BadRequestException(PLAYER_MESSAGES.DUPLICATE_JERSEY);

    const age = this.calculateAgeFromDob(dto.dob);
    if (age < 10 || age > 18)
      throw new BadRequestException(PLAYER_MESSAGES.AGE_LIMIT);

    this.validatePhoto(file);
    const photoUrl = await this.cloudinary.uploadFile(file, 'player-photos');
    const player = await this.playerRepo.create({
      name: dto.name,
      dob: dto.dob,
      age,
      jerseyNumber: dto.jerseyNumber,
      photoUrl,
      teamId: team.id,
      isApproved: false,
    } as CreationAttributes<Player>);

    return { message: PLAYER_MESSAGES.CREATED, player };
  }

  async playerCountByTeamId(teamId: string) {
    const count = await this.playerRepo.countByTeamId(teamId);
    return count;
  }

  async updatePlayerStatus(dto: UpdatePlayerStatusDto) {
    const player = await this.playerRepo.findById(dto.playerId);
    if (!player) throw new NotFoundException(PLAYER_MESSAGES.PLAYER_NOT_FOUND);
    const playerData = player?.get({ plain: true });
    await this.playerRepo.updatePlayerStatus(dto);

    const coach = await this.teamRepo.findById(playerData.teamId);
    const coachData = coach?.get({ plain: true });

    if (coachData?.coach.user.email) {
      const statusText = dto.isApproved ? 'approved' : 'rejected';
      
      await this.mailerService.sendTemplateMail(
        coachData.coach.user.email,
        `Player ${statusText} by Admin`,
        'player-status',
        {
          coachName: coachData.coach.user.name,
          playerName: playerData.name,
          statusText,
        },
      );

      return {
        message: `Player has been ${dto.isApproved ? 'approved' : 'rejected'}.`,
        player,
      };
    }
  }
}
