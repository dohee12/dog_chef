import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

type AuthedRequest = Request & { user?: AuthUser };

function readUser(jwt: JwtService, req: AuthedRequest): AuthUser | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  try {
    const payload = jwt.verify<{ sub: string; email: string }>(header.slice(7));
    return { id: payload.sub, email: payload.email };
  } catch {
    return undefined;
  }
}

/** 로그인 필수. 토큰이 없거나 틀리면 401. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const user = readUser(this.jwt, req);
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    req.user = user;
    return true;
  }
}

/** 로그인 선택. 토큰이 있으면 user 를 채우고, 없어도 통과 (예: 좋아요 표시). */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    req.user = readUser(this.jwt, req);
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
