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
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/common/roles.enum';
import { PLAYER_MESSAGES } from './player.constant';
import { ResponseService } from 'src/common/response.service';
import * as multer from 'multer';
import type { Response } from 'express';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';

@ApiTags('Player')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('add')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard, CoachVerifiedGuard)
  @Roles(Role.COACH)
  @ApiOperation({ summary: 'Add a player to coach’s team' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Rohit Sharma' },
        dob: { type: 'string', format: 'date', example: '2009-05-10' },
        jerseyNumber: { type: 'integer', example: 45 },
        photo: { type: 'string', format: 'binary' },
      },
      required: ['name', 'dob', 'jerseyNumber', 'photo'],
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(PLAYER_MESSAGES.INVALID_FILE_TYPE),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async addPlayer(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreatePlayerDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      if (!file) throw new BadRequestException(PLAYER_MESSAGES.PHOTO_REQUIRED);

      const coachId = req.user.coachId;
      const result = await this.playerService.addPlayer(coachId, body, file);

      return this.responseService.send({
        res,
        success: true,
        message: result.message,
        data: result.player,
        statusCode: HttpStatus.CREATED,
      });
    } catch (error) {
      return this.responseService.send({
        res,
        success: false,
        message: error.message,
        data: null,
        statusCode: error.statusCode,
      });
    }
  }

  @Patch('status')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin can approve or reject a player' })
  async updateStatus(@Body() dto: UpdatePlayerStatusDto,@Res() res: Response) {
    try {
    const result=  await this.playerService.updatePlayerStatus(dto);
    return this.responseService.send({
        res,
        success: true,
        message: "Player status updated successfully.",
        data: null,
        statusCode: HttpStatus.OK,
      });
      
    } catch (error) {
      return this.responseService.send({
        res,
        success: false,
        message: error.message,
        data: null,
        statusCode: error.statusCode,
      });
    }
  }
}
