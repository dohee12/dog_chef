import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 식약처 API 로 찾은 결과를 재료 이름별로 저장해 둔다. 같은 재료를 매번 호출하지 않기 위해서다.
 * 못 찾은 결과(found=false)도 저장해서 하루 동안은 다시 묻지 않는다.
 */
@Entity('food_cache')
export class FoodCache {
  /** 띄어쓰기를 없앤 찾은 이름 (예: 닭가슴살) */
  @PrimaryColumn()
  query: string;

  @Column({ default: false })
  found: boolean;

  @Column({ type: 'varchar', nullable: true })
  food_code: string | null;

  @Column({ type: 'varchar', nullable: true })
  matched_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  food_group: string | null;

  @Column({ type: 'simple-json', nullable: true })
  per100g: Record<string, number | null> | null;

  @UpdateDateColumn()
  fetched_at: Date;
}
