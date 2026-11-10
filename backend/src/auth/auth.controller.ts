import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CredentialsDto } from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from './jwt.guard';
import { CurrentUser, JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: CredentialsDto) {
    return this.auth.signUp(dto);
  }

  @Post('login')
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
