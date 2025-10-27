import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Query,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseService } from 'src/common/response.service';
import type { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { USER_ERRORS, USER_MESSAGES } from 'src/user/user.constant';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from 'src/common/roles.enum';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { AUTH_ERRORS } from './auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user (ADMIN or COACH)' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: USER_MESSAGES.REGISTERED,
        data: {
          id: 'uuid',
          name: 'John Doe',
          email: 'john@example.com',
          role: Role.COACH,
          createdAt: '2025-10-22T10:00:00.000Z',
          updatedAt: '2025-10-22T10:00:00.000Z',
        },
        statusCode: 201,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Email must be valid',
        data: null,
        statusCode: 400,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already registered',
    schema: {
      example: {
        success: false,
        message: USER_ERRORS.EMAIL_EXISTS,
        data: null,
        statusCode: 409,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        message: 'Internal server error',
        data: null,
        statusCode: 500,
      },
    },
  })
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    try {
      const user = await this.authService.register(body);
      return this.responseService.send({
        res,
        success: true,
        message: USER_MESSAGES.REGISTERED,
        data: user,
        statusCode: HttpStatus.CREATED,
      });
    } catch (error) {
      return this.responseService.send({
        res,
        success: false,
        message: error.message || USER_ERRORS.FAILED_TO_CREATE,
        data: null,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: USER_MESSAGES.LOGIN_SUCCESS,
        data: {
          id: 'uuid',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'COACH',
          token: 'jwt-token-here',
        },
        statusCode: 200,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Email must be valid',
        data: null,
        statusCode: 400,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        message: 'Invalid email or password',
        data: null,
        statusCode: 401,
      },
    },
  })
  async login(@Body() body: LoginDto, @Res() res: Response) {
    try {
      const { user, token } = await this.authService.login(
        body.email,
        body.password,
      );

      return this.responseService.send({
        res,
        success: true,
        message: USER_MESSAGES.LOGIN_SUCCESS,
        data: { ...user.toJSON(), token },
        statusCode: HttpStatus.OK,
      });
    } catch (error) {
      return this.responseService.send({
        res,
        success: false,
        message: error.message || AUTH_ERRORS.INVALID_CREDENTIALS,
        data: null,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Get('verify-email')
  @Public()
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const result = await this.authService.verifyEmail(token);
      return this.responseService.send({
        res,
        success: true,
        message: result.message,
        data: null,
        statusCode: HttpStatus.OK,
      });
    } catch (err) {
      return this.responseService.send({
        res,
        success: false,
        message: err.message || AUTH_ERRORS.EMAIL_VERIFICATION_FAILED,
        data: null,
        statusCode: err.status || HttpStatus.BAD_REQUEST,
      });
    }
  }

}
