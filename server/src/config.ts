function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경 변수 ${name}이(가) 설정되지 않았습니다. server/.env를 확인하세요.`);
  }
  return value;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || undefined,
  aiModel: process.env.AI_MODEL || "claude-haiku-5-5",
  port: Number(process.env.PORT || 3000),
};

if (config.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET은 32자 이상이어야 합니다.");
}
