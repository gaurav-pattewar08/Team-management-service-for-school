import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ResponseService } from './response.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly responseService: ResponseService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message ?? message;
        if (Array.isArray(message)) {
          message = message.join(', '); 
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.responseService.send({
      res,
      success: false,
      message,
      data: null,
      statusCode: status,
    });
  }
}
