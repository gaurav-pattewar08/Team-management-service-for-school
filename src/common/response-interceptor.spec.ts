import { Test, TestingModule } from '@nestjs/testing';
import { ResponseInterceptor } from './response-interceptor';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockContext: Partial<ExecutionContext>;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);

    mockResponse = {
      statusCode: HttpStatus.OK,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should return response as-is if it already has success property', (done) => {
      const data = {
        success: true,
        message: 'Already formatted',
        data: { id: 1 },
        statusCode: HttpStatus.OK,
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(data),
      } as any).subscribe((result) => {
        expect(result).toEqual(data);
        done();
      });
    });

    it('should format response with data when data.data exists', (done) => {
      const responseData = {
        message: 'Custom message',
        data: { id: 1, name: 'Test' },
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Custom message',
          data: { id: 1, name: 'Test' },
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should use default "Success" message when message is not provided', (done) => {
      const responseData = {
        data: { result: 'test' },
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Success',
          data: { result: 'test' },
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should handle simple data without data property', (done) => {
      const responseData = { id: 1, name: 'Simple' };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Success',
          data: undefined,
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should preserve custom statusCode from response', (done) => {
      mockResponse.statusCode = HttpStatus.CREATED;
      
      const responseData = {
        message: 'Created',
        data: { id: 1 },
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result.statusCode).toBe(HttpStatus.CREATED);
        done();
      });
    });

    it('should handle already formatted response with success: false', (done) => {
      const data = {
        success: false,
        message: 'Error',
        data: null,
        statusCode: HttpStatus.BAD_REQUEST,
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(data),
      } as any).subscribe((result) => {
        expect(result).toEqual(data);
        done();
      });
    });

    it('should handle null data gracefully', (done) => {
      const responseData = {
        message: 'No data',
        data: null,
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'No data',
          data: null,
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should handle undefined data gracefully', (done) => {
      const responseData = {
        message: 'Undefined data',
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Undefined data',
          data: undefined,
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should handle empty object', (done) => {
      const responseData = {};

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Success',
          data: undefined,
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should handle string response', (done) => {
      const responseData = 'Simple string response';

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'Success',
          data: undefined,
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });

    it('should handle array response', (done) => {
      const responseData = {
        message: 'List retrieved',
        data: [1, 2, 3, 4],
      };

      interceptor.intercept(mockContext as ExecutionContext, {
        handle: () => of(responseData),
      } as any).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          message: 'List retrieved',
          data: [1, 2, 3, 4],
          statusCode: HttpStatus.OK,
        });
        done();
      });
    });
  });
});

