import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  Body,
  Req,
  UseInterceptors,
  BadRequestException,
  Res,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/common/roles.enum';
import * as multer from 'multer';
import { TEAM_MESSAGES } from './team.constant';
import { ResponseService } from 'src/common/response.service';
import type { Response } from 'express';
import { COACH_ERRORS } from 'src/coach/coach.constant';

@ApiTags('Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('create')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard, CoachVerifiedGuard)
  @Roles(Role.COACH)
  @ApiOperation({ summary: 'Create a team (coach only). One team per coach.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Thunder Warriors' },
        logo: { type: 'string', format: 'binary' },
      },
      required: ['name', 'logo'],
    },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(TEAM_MESSAGES.INVALID_FILE_TYPE),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async createTeam(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateTeamDto,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException(TEAM_MESSAGES.LOGO_REQUIRED);

    const coachId = req.user.coachId;
    if (!coachId) throw new BadRequestException('Invalid coach credentials.');

    const result = await this.teamService.createTeam(coachId, file, body.name);

    return {
      message: result.message,
      data: result.team,
    };
  }

  @Post('submit')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard, CoachVerifiedGuard)
  @Roles(Role.COACH)
  @ApiOperation({
    summary: 'Submit team for approval (min 11 players, max 15)',
  })
  async submitTeam(@Req() req: any) {
    const coachId = req.user.coachId;
    if (!coachId) throw new BadRequestException(COACH_ERRORS.USER_ID_REQUIRED);

    const result = await this.teamService.submitTeam(coachId);

    return {
      message: result.message,
      data: result.team,
    };
  }

  @Get('all')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all teams with coach and players (Admin only)',
  })
  async getAllTeams() {
    const teams = await this.teamService.getAllTeams();
    return {
      message: teams.message,
      data: teams.teams,
    };
  }

  @Get('school/:schoolId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get coach, team and players by school ID' })
  @ApiParam({
    name: 'schoolId',
    description: 'UUID of the school',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Fetched coach, team, and players successfully',
  })
  async getCoachTeamPlayersBySchool(@Param('schoolId') schoolId: string) {
    const data = await this.teamService.getTeamBySchoolId(schoolId);
    return {
      message: TEAM_MESSAGES.FETCH_SUCCESS,
      data,
    };
  }
}
