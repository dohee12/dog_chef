import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesModule } from '../recipes/recipes.module';
import { Pet } from './pet.entity';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pet]), RecipesModule],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
