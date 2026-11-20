import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesModule } from '../recipes/recipes.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RecipesModule, ReviewsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
