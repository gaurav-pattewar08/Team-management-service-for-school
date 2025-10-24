// // import { Module } from '@nestjs/common';
// // import { AuthService } from './auth.service';
// // import { AuthController } from './auth.controller';
// // import { UserModule } from 'src/user/user.module';
// // import { SchoolModule } from 'src/school/school.module';
// // import { CoachModule } from 'src/coach/coach.module';
// // import { ResponseService } from 'src/common/response.service';
// // import { JwtModule } from '@nestjs/jwt';
// // import { ConfigModule, ConfigService } from '@nestjs/config';
// // import { MailerService } from 'src/common/mailer.service';

// // @Module({
// //   imports: [
// //     ConfigModule, 
// //     UserModule,
// //     SchoolModule,
// //     CoachModule,
// //     JwtModule.registerAsync({
// //       imports: [ConfigModule],
// //       inject: [ConfigService],
// //       useFactory: async (configService: ConfigService) => ({
// //         secret: configService.get<string>('JWT_SECRET'),
// //       }),
// //     }),
// //   ],
// //   controllers: [AuthController],
// //   providers: [AuthService, ResponseService,MailerService],
// // })
// // export class AuthModule {}


// // import { Module } from '@nestjs/common';
// // import { AuthService } from './auth.service';
// // import { AuthController } from './auth.controller';
// // import { UserModule } from 'src/user/user.module';
// // import { SchoolModule } from 'src/school/school.module';
// // import { CoachModule } from 'src/coach/coach.module';
// // import { ResponseService } from 'src/common/response.service';
// // import { JwtModule } from '@nestjs/jwt';
// // import { ConfigModule, ConfigService } from '@nestjs/config';
// // import { JwtStrategy } from './jwt.strategy';

// // @Module({
// //   imports: [
// //     ConfigModule.forRoot({ isGlobal: true }),
// //     UserModule,
// //     SchoolModule,
// //     CoachModule,
// //     JwtModule.registerAsync({
// //       imports: [ConfigModule],
// //       inject: [ConfigService],
// //       useFactory: async (configService: ConfigService) => ({
// //         secret: configService.get<string>('JWT_SECRET'),
// //         signOptions: { expiresIn: '24h' },
// //       }),
// //     }),
// //   ],
// //   controllers: [AuthController],
// //   providers: [AuthService, ResponseService, JwtStrategy],
// // })
// // export class AuthModule {}

// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { UserModule } from 'src/user/user.module';
// import { SchoolModule } from 'src/school/school.module';
// import { CoachModule } from 'src/coach/coach.module';
// import { ResponseService } from 'src/common/response.service';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { APP_GUARD } from '@nestjs/core';
// import { AuthGuard } from './jwt-auth.guard';
// import { MailerService } from 'src/common/mailer.service';

// @Module({
//   imports: [
//     ConfigModule,
//     UserModule,
//     SchoolModule,
//     CoachModule,
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'),
//         signOptions: { expiresIn: '24h' },
//       }),
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [
//     AuthService,
//     MailerService,
//     ResponseService,
//     {
//       provide: APP_GUARD,
//       useClass: AuthGuard, // Apply globally
//     },
//   ],
// })
// export class AuthModule {}


// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { SchoolModule } from 'src/school/school.module';
import { CoachModule } from 'src/coach/coach.module';
import { ResponseService } from 'src/common/response.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from 'src/common/mailer.service';
import { PassportModule } from '@nestjs/passport'; 
import { JwtStrategy } from './jwt.strategy';     
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard'; 
import { RolesGuard } from './roles.guard';
import { CoachVerifiedGuard } from './coach-verification.guard';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    SchoolModule,
    CoachModule,
    PassportModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailerService,
    ResponseService,
    JwtStrategy, 
    RolesGuard,
    CoachVerifiedGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, 
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
