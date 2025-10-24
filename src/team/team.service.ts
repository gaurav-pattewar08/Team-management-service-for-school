import { Injectable, BadRequestException } from '@nestjs/common';
import { TeamRepository } from './team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { TEAM_MESSAGES } from './team.constant';
import { CreationAttributes } from 'sequelize';
import { Team } from './entities/team.entity';
import { PlayerService } from 'src/player/player.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TeamService {
  constructor(
    private readonly teamRepo: TeamRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly playService: PlayerService,
    private readonly mailerService: MailerService,
    private readonly coachServce: CoachService,
    private readonly userService: UserService,
  ) {}

  private validateLogo(file: Express.Multer.File) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!file) throw new BadRequestException(TEAM_MESSAGES.LOGO_REQUIRED);
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException(TEAM_MESSAGES.INVALID_FILE_TYPE);
    if (file.size > 2 * 1024 * 1024)
      throw new BadRequestException(TEAM_MESSAGES.FILE_TOO_LARGE);
  }

  async createTeam(coachId: string, file: Express.Multer.File, name: string) {
    const existing = await this.teamRepo.findByCoachId(coachId);
    if (existing)
      throw new BadRequestException(TEAM_MESSAGES.COACH_TEAM_EXISTS);

    const nameExists = await this.teamRepo.findByName(name);
    if (nameExists) throw new BadRequestException(TEAM_MESSAGES.NAME_EXISTS);

    this.validateLogo(file);
    const logoUrl = await this.cloudinary.uploadFile(file, 'team-logos');

    const team = await this.teamRepo.create({
      name,
      logoUrl,
      coachId,
    } as CreationAttributes<Team>);

    return { message: TEAM_MESSAGES.CREATED, team };
  }

  async getTeamByCoach(coachId: string) {
    return this.teamRepo.findByCoachId(coachId);
  }

  async submitTeam(coachId: string) {
    const team = await this.teamRepo.findByCoachId(coachId);
    const teamData = team?.get({ plain: true });
    if (!team) throw new BadRequestException(TEAM_MESSAGES.TEAM_NOT_FOUND);

    const coachDeatils = await this.coachServce.findById(coachId);

    const playersCount = await this.playService.playerCountByTeamId(team.id);

    if (playersCount < 1)
      throw new BadRequestException(TEAM_MESSAGES.MIN_PLAYERS_REQUIRED);

    if (playersCount > 5)
      throw new BadRequestException(TEAM_MESSAGES.MAX_PLAYERS_EXCEEDED);

    await this.mailerService.sendMail(
      coachDeatils!.user.email,
      'Team Registration Submitted Successfully',
      `
    <p>Dear ${coachDeatils?.user.name},</p>
    <p>Your team "<strong>${teamData?.name}</strong>" has been successfully submitted with <strong>${playersCount}</strong> players.</p>
    <p>We’ll notify you once it’s reviewed by the admin.</p>
    <p>Thank you for being part of the IPL App!</p>
  `,
    );

    const admin = await this.userService.getAdminDetails(); 

    await this.mailerService.sendMail(
      admin!.email,
      'New Team Submitted for Approval',
      `
        <p>Dear ${admin!.name},</p>
        <p>A new team "<strong>${teamData!.name}</strong>" has been submitted by ${coachDeatils?.user.name} (${coachDeatils?.user.email}).</p>
        <p>It has <strong>${playersCount}</strong> players. Please review and approve the team.</p>
        <p>Thank you!</p>
      `,
    );

    return { message: TEAM_MESSAGES.TEAM_SUBMITTED, team };
  }

  async getTeamById(id: string) {
    return this.teamRepo.findById(id);
  }
}
