import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CoachService } from 'src/coach/coach.service';
import { SchoolService } from 'src/school/school.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/common/mailer.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from 'src/common/roles.enum';
import { AUTH_ERRORS, AUTH_SUCCESS } from './auth.constants';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (pwd: string) => `hashed-${pwd}`),
  compare: jest.fn(async (raw: string, hashed: string) => hashed === `hashed-${raw}`),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<UserService>;
  let coaches: jest.Mocked<CoachService>;
  let schools: jest.Mocked<SchoolService>;
  let jwt: jest.Mocked<JwtService>;
  let mailer: jest.Mocked<MailerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: { findByEmail: jest.fn(), create: jest.fn(), getAdminDetails: jest.fn() }},
        { provide: CoachService, useValue: { findBySchoolId: jest.fn(), create: jest.fn(), findById: jest.fn() }},
        { provide: SchoolService, useValue: { findByNameAndCity: jest.fn() }},
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() }},
        { provide: MailerService, useValue: { sendTemplateMail: jest.fn() }},
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    users = module.get(UserService);
    coaches = module.get(CoachService);
    schools = module.get(SchoolService);
    jwt = module.get(JwtService);
    mailer = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const baseDto: any = { name: 'N', email: 'e@e.com', password: 'p', role: Role.COACH, schoolName: 'S', schoolCity: 'C' };

    it('should throw when user already exists', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1' } as any);
      await expect(service.register(baseDto)).rejects.toThrow(HttpException);
    });

    it('should throw when school not found', async () => {
      users.findByEmail.mockResolvedValue(null);
      schools.findByNameAndCity.mockResolvedValue(null);
      await expect(service.register(baseDto)).rejects.toThrow(AUTH_ERRORS.SCHOOL_NOT_FOUND);
    });

    it('should throw when coach already assigned', async () => {
      users.findByEmail.mockResolvedValue(null);
      schools.findByNameAndCity.mockResolvedValue({ id: 's1', name: 'S' } as any);
      coaches.findBySchoolId.mockResolvedValue({ id: 'c1' } as any);
      await expect(service.register(baseDto)).rejects.toThrow(HttpException);
    });

    it('should create user and coach and send mail for coach role', async () => {
      users.findByEmail.mockResolvedValue(null);
      schools.findByNameAndCity.mockResolvedValue({ id: 's1', name: 'S' } as any);
      coaches.findBySchoolId.mockResolvedValue(null);
      users.create.mockResolvedValue({ id: 'u1', email: baseDto.email } as any);
      coaches.create.mockResolvedValue({ id: 'c1' } as any);
      jwt.sign.mockReturnValue('token');

      const res = await service.register(baseDto);
      expect(users.create).toHaveBeenCalled();
      expect(coaches.create).toHaveBeenCalled();
      expect(mailer.sendTemplateMail).toHaveBeenCalled();
      expect(res).toEqual({ user: { id: 'u1', email: baseDto.email } });
    });
  });

  describe('login', () => {
    it('should throw when user not found', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('a@b.com', 'p')).rejects.toThrow(HttpException);
    });

    it('should throw when password invalid', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1', password: 'hashed-other' } as any);
      await expect(service.login('a@b.com', 'p')).rejects.toThrow(HttpException);
    });

    it('should return token and message on success', async () => {
      users.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: Role.COACH, password: 'hashed-p' } as any);
      jwt.sign.mockReturnValue('jwt');
      const res = await service.login('a@b.com', 'p');
      expect(res).toEqual({ message: AUTH_SUCCESS.LOGIN_SUCCESS, user: { id: 'u1', email: 'a@b.com', role: Role.COACH, password: 'hashed-p' }, token: 'jwt' });
    });
  });

  describe('verifyEmail', () => {
    it('should set coach verified and return true', async () => {
      jwt.verify.mockReturnValue({ coachId: 'c1' } as any);
      const coachModel = { id: 'c1', isVerified: false, save: jest.fn() } as any;
      coaches.findById.mockResolvedValue(coachModel);
      const res = await service.verifyEmail('token');
      expect(coachModel.isVerified).toBe(true);
      expect(coachModel.save).toHaveBeenCalled();
      expect(res).toBe(true);
    });

    it('should throw bad request on any error', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('bad token'); });
      await expect(service.verifyEmail('bad')).rejects.toThrow(HttpException);
    });
  });
});
