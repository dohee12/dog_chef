import pg from "pg";
import { config } from "./config.js";

// 타입 파서: numeric은 숫자로, date는 "YYYY-MM-DD" 문자열로 받습니다.
pg.types.setTypeParser(1700, (v) => parseFloat(v)); // numeric
pg.types.setTypeParser(1082, (v) => v); // date

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return pool.query<T>(text, params);
}
