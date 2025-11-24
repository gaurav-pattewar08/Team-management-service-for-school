import { Test, TestingModule } from '@nestjs/testing';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { ResponseService } from 'src/common/response.service';
import { SCHOOL_MESSAGES } from './school.constants';


describe('SchoolController', () => {
  let controller: SchoolController;
  let service: jest.Mocked<SchoolService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolController],
      providers: [
        { provide: SchoolService, useValue: { create: jest.fn() } },
        { provide: ResponseService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SchoolController>(SchoolController);
    service = module.get(SchoolService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service and return message and data', async () => {
    const dto: any = { name: 'S', city: 'C' };
    const created = { id: 's1', ...dto } as any;
    service.create.mockResolvedValue(created);

    const res = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: SCHOOL_MESSAGES.CREATED, data: created });
  });
});
