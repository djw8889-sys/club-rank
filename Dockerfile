# -------------------------------
# 🧱 1단계: Builder (Client + Server 빌드)
# -------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 1️⃣ 루트 파일 전체 복사 (.dockerignore에 따라 필터링됨)
COPY . .

# 2️⃣ 클라이언트 의존성 설치 및 빌드
WORKDIR /app/client
RUN npm ci && npm run build

# 3️⃣ 서버 의존성 설치 및 빌드
WORKDIR /app/server
RUN npm ci && npm run build

# -------------------------------
# 🚀 2단계: Production Runner
# -------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# 1️⃣ 서버만 배포에 포함
COPY --from=builder /app/server/package*.json ./
RUN npm ci --omit=dev

# 2️⃣ 서버 빌드 산출물 복사
COPY --from=builder /app/server/dist ./dist

# 3️⃣ 클라이언트 정적 파일 복사 (빌드 결과물)
COPY --from=builder /app/client/dist ./public

# 4️⃣ 포트 지정 (Railway 자동 감지용)
EXPOSE 8080

# 5️⃣ 실행 명령
CMD ["node", "dist/index.js"]
