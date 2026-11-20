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

  // 리뷰 등에 보여줄 이름. 비어 있으면 이메일 앞부분을 가려서 보여준다.
  @Column({ type: 'varchar', nullable: true })
  nickname: string | null;

  @CreateDateColumn()
  created_at: Date;
}

/** 남에게 보여줄 이름: 닉네임, 없으면 이메일 앞 두 글자 + *** (이메일 전체는 공개하지 않는다) */
export function displayName(user?: Pick<User, 'email' | 'nickname'> | null): string {
  if (!user) return '알 수 없음';
  if (user.nickname) return user.nickname;
  const local = user.email.split('@')[0];
  return local.slice(0, 2) + '***';
}
