import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: string;

  @Column({ default: '' })
  device_id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  breed: string;

  @Column({ type: 'float', default: 0 })
  age: number;

  @Column({ type: 'float', default: 0 })
  weight: number;

  @Column({ default: '' })
  gender: string;

  @Column({ default: false })
  is_neutered: boolean;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'simple-json', nullable: true })
  allergies: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  health_conditions: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  birth_date: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
