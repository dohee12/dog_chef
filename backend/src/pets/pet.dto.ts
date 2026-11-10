import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// user_id 는 받지 않는다. 항상 토큰의 사용자로 저장한다.
export class CreatePetDto {
  @IsString()
  @IsNotEmpty({ message: '반려견 이름을 입력해주세요.' })
  name: string;

  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsNumber() age?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsBoolean() is_neutered?: boolean;
  @IsOptional() @IsString() image?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) allergies?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) health_conditions?: string[];
  @IsOptional() @IsString() birth_date?: string | null;
  @IsOptional() @IsString() device_id?: string;
}

export class UpdatePetDto extends PartialType(CreatePetDto) {}
