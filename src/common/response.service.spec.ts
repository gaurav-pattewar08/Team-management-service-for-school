import { Test, TestingModule } from '@nestjs/testing';
import { ResponseService } from './response.service';
import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

describe('ResponseService', () => {
  let service: ResponseService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseService],
    }).compile();

    service = module.get<ResponseService>(ResponseService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should send success response with default status code', () => {
      const data = { id: 1, name: 'Test' };
      
      service.send({
        res: mockResponse as Response,
        success: true,
        message: 'Success message',
        data,
        statusCode: HttpStatus.OK,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data,
        statusCode: HttpStatus.OK,
      });
    });

    it('should send error response with BAD_REQUEST status code', () => {
      service.send({
        res: mockResponse as Response,
        success: false,
        message: 'Error message',
        statusCode: HttpStatus.BAD_REQUEST,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should use default status code when not provided (success)', () => {
      const data = { result: 'data' };
      
      service.send({
        res: mockResponse as Response,
        success: true,
        message: 'Default success',
        data,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('should use default status code when not provided (failure)', () => {
      service.send({
        res: mockResponse as Response,
        success: false,
        message: 'Default error',
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle empty message string', () => {
      service.send({
        res: mockResponse as Response,
        success: true,
        message: '',
        data: {},
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '',
        data: {},
        statusCode: HttpStatus.OK,
      });
    });

    it('should handle null data', () => {
      service.send({
        res: mockResponse as Response,
        success: true,
        message: 'Message',
        data: null,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message',
        data: null,
        statusCode: HttpStatus.OK,
      });
    });


    it('should not return data when success is false', () => {
      service.send({
        res: mockResponse as Response,
        success: false,
        message: 'Error',
        data: { shouldNotAppear: 'data' },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error',
        data: null,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should return data when success is true', () => {
      const testData = { id: 123, name: 'Test' };

      service.send({
        res: mockResponse as Response,
        success: true,
        message: 'Success with data',
        data: testData,
        statusCode: HttpStatus.CREATED,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success with data',
        data: testData,
        statusCode: HttpStatus.CREATED,
      });
    });
  });
});

