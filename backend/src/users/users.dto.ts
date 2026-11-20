import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  /** null 이나 빈 문자열이면 닉네임을 지운다 */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 20자 이하여야 합니다.' })
  @Matches(/^[\p{L}\p{N}_ .-]+$/u, { message: '닉네임에는 글자, 숫자, 공백, _ . - 만 쓸 수 있습니다.' })
  nickname?: string | null;
}

export class ChangePasswordDto {
  @IsString() current_password: string;

  @IsString()
  @MinLength(6, { message: '새 비밀번호는 6자 이상이어야 합니다.' })
  @MaxLength(72)
  new_password: string;
}

export class DeleteAccountDto {
  @IsString() password: string;
}
