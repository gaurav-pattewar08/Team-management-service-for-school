// src/player/dto/update-player-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdatePlayerStatusDto {
  @ApiProperty({ example: 'player-uuid', description: 'ID of the player' })
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({ example: true, description: 'Set true to approve, false to reject' })
  @IsBoolean()
  isApproved: boolean;
}
