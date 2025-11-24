import { IsUUID, IsBoolean, IsNotEmpty } from 'class-validator';
import { COACH_ERRORS } from '../coach.constant';

export class CreateCoachDto {
  @IsUUID('4', { message: COACH_ERRORS.USER_ID_INVALID })
  @IsNotEmpty({ message: COACH_ERRORS.USER_ID_REQUIRED })
  userId: string;

  @IsUUID('4', { message: COACH_ERRORS.SCHOOL_ID_INVALID })
  @IsNotEmpty({ message: COACH_ERRORS.SCHOOL_ID_REQUIRED })
  schoolId: string;

  @IsBoolean({ message: COACH_ERRORS.IS_VERIFIED_INVALID })
  @IsNotEmpty({ message: COACH_ERRORS.IS_VERIFIED_REQUIRED })
  isVerified: boolean;
}
