import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsFilter } from './http-exception.filter';
import { ResponseService } from './response.service';
import { HttpException, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let responseService: ResponseService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter, ResponseService],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    let mockHost: any;

    beforeEach(() => {
      mockResponse = {
        statusCode: HttpStatus.OK,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      };
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Test error',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle HttpException with object response', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
      });
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Validation failed',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle HttpException with array message', () => {
      const exception = new BadRequestException(['Error 1', 'Error 2', 'Error 3']);
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Error 1, Error 2, Error 3',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle HttpException with empty array message', () => {
      const exception = new BadRequestException([]);
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: '',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle UnauthorizedException', () => {
      const exception = new UnauthorizedException('Unauthorized access');
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Unauthorized access',
        data: null,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should handle generic Error', () => {
      const exception = new Error('Generic error message');
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Generic error message',
        data: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle unknown exception type', () => {
      const exception = { something: 'unknown' } as any;
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Internal server error',
        data: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle HttpException with missing message in object', () => {
      const exception = new HttpException({ error: 'Unknown' }, HttpStatus.INTERNAL_SERVER_ERROR);
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Internal server error',
        data: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle HttpException with null response', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: 'Internal server error',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle Error with empty message', () => {
      const exception = new Error('');
      const sendSpy = jest.spyOn(responseService, 'send');

      filter.catch(exception, mockHost);

      expect(sendSpy).toHaveBeenCalledWith({
        res: mockResponse as Response,
        success: false,
        message: '',
        data: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

   

  });
});

