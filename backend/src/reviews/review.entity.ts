import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
@Unique(['user_id', 'recipe_id']) // 한 사람당 레시피 하나에 리뷰 하나
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  recipe_id: number;

  @Column()
  user_id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', default: '' })
  comment: string;

  @Column({ type: 'simple-json', nullable: true })
  images: string[] | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
