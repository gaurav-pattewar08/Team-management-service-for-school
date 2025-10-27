
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CoachService } from 'src/coach/coach.service';
import { Role } from 'src/common/roles.enum';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService,private readonly coachService: CoachService) {
    
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
        throw new Error('JWT_SECRET must be defined in environment configuration.');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false,
      secretOrKey: secret, 
    });
  }

  async validate(payload: JwtPayload) {
    let coachId
    if(payload.role=== Role.COACH)
    {
        const coach = await this.coachService.findByUserId(payload.sub.toString());
        if(!coach){
            throw new UnauthorizedException('Coach not found');
        }
        coachId=coach.id        
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      coachId
    };
  }
}