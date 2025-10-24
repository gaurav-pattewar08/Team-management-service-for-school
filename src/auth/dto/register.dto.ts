import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({ example: 'Sunrise High', description: 'School name' })
  @IsString({ message: 'School name must be a string' })
  @IsNotEmpty({ message: 'School name is required' })
  schoolName: string;

  @ApiProperty({ example: 'Pune', description: 'City of the school' })
  @IsString({ message: 'School city must be a string' })
  @IsNotEmpty({ message: 'School city is required' })
  schoolCity: string;
}
