import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ResponseService } from 'src/common/response.service';
import { USER_MESSAGES } from 'src/user/user.constant';
import { AUTH_SUCCESS } from './auth.constants';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {
          register: jest.fn(), login: jest.fn(), verifyEmail: jest.fn(),
        } },
        { provide: ResponseService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should return message and data', async () => {
    const dto: any = { email: 'a@b.com' };
    service.register.mockResolvedValue({ id: 'u1' } as any);
    const res = await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: USER_MESSAGES.REGISTERED, data: { id: 'u1' } });
  });

  it('login should combine user.toJSON with token', async () => {
    const dto: any = { email: 'a@b.com', password: 'p' };
    const user = { toJSON: () => ({ id: 'u1', email: 'a@b.com' }) } as any;
    service.login.mockResolvedValue({ user, token: 'jwt' } as any);
    const res = await controller.login(dto);
    expect(service.login).toHaveBeenCalledWith('a@b.com', 'p');
    expect(res).toEqual({ message: USER_MESSAGES.LOGIN_SUCCESS, data: { id: 'u1', email: 'a@b.com', token: 'jwt' } });
  });

  it('verifyEmail should return success message', async () => {
    service.verifyEmail.mockResolvedValue(true as any);
    const res = await controller.verifyEmail('tok');
    expect(service.verifyEmail).toHaveBeenCalledWith('tok');
    expect(res).toEqual({ message: AUTH_SUCCESS.EMAIL_VERIFIED, data: null });
  });
});
