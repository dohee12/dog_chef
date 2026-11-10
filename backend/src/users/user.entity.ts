import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // 소셜 로그인만 쓰는 계정은 비밀번호가 없다.
  @Column({ type: 'varchar', nullable: true, select: false })
  password_hash: string | null;

  @CreateDateColumn()
  created_at: Date;
}
