import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CoachService } from 'src/coach/coach.service';
import { SchoolService } from 'src/school/school.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/roles.enum';
import { USER_ERRORS } from 'src/user/user.constant';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/common/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly coachService: CoachService,
    private readonly schoolService: SchoolService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,

  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password, role, schoolName, schoolCity } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new HttpException(USER_ERRORS.EMAIL_EXISTS, HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (role === Role.COACH) {
      const school = await this.schoolService.findByNameAndCity(schoolName, schoolCity);
      if (!school) {
        throw new HttpException('School not found', HttpStatus.NOT_FOUND);
      }

      const existingCoach = await this.coachService.findBySchoolId(school.id);
      if (existingCoach) {
        throw new HttpException(
          `A coach is already assigned to the school "${school.name}"`,
          HttpStatus.CONFLICT,
        );
      }

     const coach= await this.coachService.create({
        userId: user.id,
        schoolId: school.id,
        isVerified: false,
      });

      const verificationToken = this.jwtService.sign(
          { userId: user.id, coachId: coach.id },
        );

        const verificationLink = `${process.env.APP_URL}/auth/verify-email?token=${verificationToken}`;

        await this.mailerService.sendMail(
          email,
          'Verify your email',
          `<p>Hello ${name},</p>
           <p>Click to verify your email:</p>
           <a href="${verificationLink}">Verify Email</a>`,
        );
    }
    return user
  }


  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new HttpException(USER_ERRORS.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(USER_ERRORS.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }

  async verifyEmail(token: string) {
      const payload: any = this.jwtService.verify(token);
      const coach = await this.coachService.findById(payload.coachId);
      if (!coach) {
        throw new HttpException('Coach not found', HttpStatus.NOT_FOUND);
      }
      coach.isVerified = true;
      await coach.save();
      return { message: 'Email verified successfully' };
    }
  }


