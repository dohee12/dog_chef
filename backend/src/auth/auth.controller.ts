import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CredentialsDto } from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from './jwt.guard';
import { CurrentUser, JwtAuthGuard } from './jwt.guard';

// 비밀번호 대입을 막기 위해 가입·로그인은 IP 하나당 1분에 AUTH_RATE_LIMIT 번까지 (기본 10).
const AUTH_LIMIT = { default: { ttl: 60_000, limit: Number(process.env.AUTH_RATE_LIMIT ?? 10) } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @Throttle(AUTH_LIMIT)
  signUp(@Body() dto: CredentialsDto) {
    return this.auth.signUp(dto);
  }

  @Post('login')
  @Throttle(AUTH_LIMIT)
  @HttpCode(200)
  signIn(@Body() dto: CredentialsDto) {
    return this.auth.signIn(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
