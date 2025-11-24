import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SCHOOL_ERRORS } from '../school.constants';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'Name of the school',
    example: 'St. Xavier High School',
  })
  @IsString()
  @IsNotEmpty({ message: SCHOOL_ERRORS.NAME_REQUIRED })
  name: string;

  @ApiProperty({
    description: 'City where the school is located',
    example: 'Mumbai',
  })
  @IsString()
  @IsNotEmpty({ message: SCHOOL_ERRORS.CITY_REQUIRED })
  city: string;
}
