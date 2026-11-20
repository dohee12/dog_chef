import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from '../pets/pet.entity';
import { Like } from './like.entity';
import { Recipe } from './recipe.entity';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, Like, Pet])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [TypeOrmModule, RecipesService],
})
export class RecipesModule {}
