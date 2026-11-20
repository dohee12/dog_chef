import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.guard';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt.guard';
import { CreatePetDto, UpdatePetDto } from './pet.dto';
import { PetsService } from './pets.service';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.pets.findMine(user.id);
  }

  /** 하루 권장 열량 등. activity=low|moderate|high */
  @Get(':id/needs')
  needs(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('activity') activity?: 'low' | 'moderate' | 'high',
  ) {
    const a = activity && ['low', 'moderate', 'high'].includes(activity) ? activity : undefined;
    return this.pets.needs(user.id, id, a);
  }

  /** 이 반려견에게 맞는 레시피 추천 (위험·알레르기 재료 제외, 인기순) */
  @Get(':id/recommendations')
  recommendations(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    const n = Math.min(50, Math.max(1, Number(limit) || 10));
    return this.pets.recommendations(user.id, id, n);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePetDto) {
    return this.pets.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePetDto,
  ) {
    return this.pets.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.pets.remove(user.id, id);
  }
}
