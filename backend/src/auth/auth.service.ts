import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CredentialsDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async signUp({ email, password }: CredentialsDto) {
    const normalized = email.trim().toLowerCase();
    if (await this.users.exists({ where: { email: normalized } })) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
    const user = await this.users.save(
      this.users.create({
        email: normalized,
        password_hash: await bcrypt.hash(password, 10),
      }),
    );
    return this.issue(user);
  }

  async signIn({ email, password }: CredentialsDto) {
    const user = await this.users.findOne({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, password_hash: true },
    });
    // 이메일이 없는지 비밀번호가 틀렸는지 구분해 알려주지 않는다 (계정 존재 여부 노출 방지)
    if (
      !user?.password_hash ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return this.issue(user);
  }

  async me(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('계정을 찾을 수 없습니다.');
    return { id: user.id, email: user.email };
  }

  private issue(user: Pick<User, 'id' | 'email'>) {
    return {
      access_token: this.jwt.sign({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email },
    };
  }
}
