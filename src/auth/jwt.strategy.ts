import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'edemic@223', // Replace with your secret key
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId, // Include tenantId in the JWT payload
    };
  }
}