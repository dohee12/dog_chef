import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePetDto, UpdatePetDto } from './pet.dto';
import { Pet } from './pet.entity';

@Injectable()
export class PetsService {
  constructor(@InjectRepository(Pet) private readonly pets: Repository<Pet>) {}

  findMine(userId: string) {
    return this.pets.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  create(userId: string, dto: CreatePetDto) {
    return this.pets.save(this.pets.create({ ...dto, user_id: userId }));
  }

  async update(userId: string, id: number, dto: UpdatePetDto) {
    const pet = await this.findOwned(userId, id);
    return this.pets.save(Object.assign(pet, dto));
  }

  async remove(userId: string, id: number) {
    await this.pets.remove(await this.findOwned(userId, id));
  }

  // 남의 반려견이면 "없음"으로 응답해 존재 여부를 숨긴다.
  private async findOwned(userId: string, id: number) {
    const pet = await this.pets.findOne({ where: { id, user_id: userId } });
    if (!pet) throw new NotFoundException('반려견을 찾을 수 없습니다.');
    return pet;
  }
}
