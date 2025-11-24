import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TEAM_MESSAGES } from '../team.constant';

export class CreateTeamDto {
  @ApiProperty({ example: 'Thunder Warriors', description: 'Unique team name' })
  @IsNotEmpty({ message: TEAM_MESSAGES.NAME_REQUIRED })
  @IsString()
  name: string;

  @IsOptional()
  coachId?: string;
}
