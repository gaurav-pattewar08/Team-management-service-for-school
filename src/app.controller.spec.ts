import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: { getHello: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getHello should return value from service', () => {
    service.getHello.mockReturnValue('Hello World!');
    expect(controller.getHello()).toBe('Hello World!');
    expect(service.getHello).toHaveBeenCalled();
  });
});
