import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { ResponseService } from 'src/common/response.service';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SCHOOL_ERRORS, SCHOOL_MESSAGES } from './school.constants';
import { Public } from 'src/auth/public.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/common/roles.enum';

@ApiTags('Schools')
@Controller('schools')
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new school' })
  @ApiBody({ type: CreateSchoolDto })
  @ApiCreatedResponse({
    description: 'School created successfully',
    schema: {
      example: {
        success: true,
        message: SCHOOL_MESSAGES.CREATED,
        data: {
          id: 'uuid',
          name: 'Sunrise High',
          city: 'Pune',
          createdAt: '2025-10-22T10:00:00.000Z',
          updatedAt: '2025-10-22T10:00:00.000Z',
        },
        statusCode: 201,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Duplicate school error',
    schema: {
      example: {
        success: false,
        message: SCHOOL_ERRORS.DUPLICATE_SCHOOL('Sunrise High', 'Pune'),
        data: null,
        statusCode: 409,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Validation failed',
        data: null,
        statusCode: 400,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        message: SCHOOL_ERRORS.FAILED_TO_CREATE,
        data: null,
        statusCode: 500,
      },
    },
  })
  async create(@Body() createSchoolDto: CreateSchoolDto, @Res() res: Response) {
    try {
      const schoolData = await this.schoolService.create(createSchoolDto);
      return this.responseService.send({
        res,
        success: true,
        message: SCHOOL_MESSAGES.CREATED,
        data: schoolData,
        statusCode: HttpStatus.CREATED,
      });
    } catch (error: any) {
      return this.responseService.send({
        res,
        success: false,
        message: error.message || SCHOOL_ERRORS.FAILED_TO_CREATE,
        data: null,
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
