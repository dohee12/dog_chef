import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { Recipe } from './recipe.entity';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, Like])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [TypeOrmModule],
})
export class RecipesModule {}
