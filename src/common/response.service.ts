import { Injectable, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

export interface IResponseOptions {
  res: Response;
  success: boolean;
  message?: string;
  data?: any;
  statusCode?: number;
}

@Injectable()
export class ResponseService {
  send({ res, success, message = '', data = null, statusCode }: IResponseOptions) {
    const status = statusCode ?? (success ? HttpStatus.OK : HttpStatus.BAD_REQUEST);

    return res.status(status).json({
      success,
      message: message,
      data: success ? data : null,
      statusCode: status,
    });
  }
}
