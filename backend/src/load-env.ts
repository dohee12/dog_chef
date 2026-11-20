// .env 가 있으면 읽는다 (Node 내장 기능). 운영 서버처럼 환경 변수를 직접 주면 파일이 없어도 된다.
// main.ts 맨 위에서 import 한다: 다른 모듈이 불러와지면서 process.env 를 읽기 전에 채워져야 하기 때문.
try {
  process.loadEnvFile();
} catch {
  // .env 없음
}
