import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
  email: string;

  @IsString()
  @MinLength(6, { message: '비밀번호는 6자 이상이어야 합니다.' })
  @MaxLength(72) // bcrypt 는 72바이트 이후를 무시한다
  password: string;
}
