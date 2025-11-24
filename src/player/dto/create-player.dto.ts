import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString, Min, Max, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { PLAYER_MESSAGES } from '../player.constant';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Rohit Sharma', description: 'Player full name' })
  @IsNotEmpty({ message: PLAYER_MESSAGES.NAME_REQUIRED })
  name: string;

  @ApiProperty({ example: '2009-05-10', description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString({}, { message: PLAYER_MESSAGES.AGE_LIMIT })
  dob: string;

  @ApiProperty({ example: 45, description: 'Jersey number between 1 and 99' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(99)
  jerseyNumber: number;

}
