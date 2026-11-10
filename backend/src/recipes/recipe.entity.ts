import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ default: '' })
  category: string;

  @Column({ default: '익명' })
  author: string;

  @Column({ type: 'int', default: 0 })
  cook_time: number;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ default: '' })
  difficulty: string;

  @Column({ type: 'float', default: 0 })
  safety_score: number;

  @Column({ type: 'simple-json', nullable: true })
  ingredients: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  instructions: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[] | null;

  @Column({ default: true })
  is_user_created: boolean;

  @Column({ type: 'float', nullable: true })
  calories: number | null;

  @Column({ type: 'float', nullable: true })
  protein: number | null;

  @Column({ type: 'float', nullable: true })
  fat: number | null;

  @Column({ type: 'float', nullable: true })
  carbs: number | null;

  @Column({ type: 'float', nullable: true })
  fiber: number | null;

  // 아래 셋은 좋아요/리뷰가 바뀔 때 서버가 다시 계산한다. 클라이언트가 보낸 값은 무시.
  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @Column({ type: 'int', default: 0 })
  reviews_count: number;

  @Column({ type: 'float', default: 0 })
  average_rating: number;

  @Index()
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
