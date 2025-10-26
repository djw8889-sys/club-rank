# ===============================
# 1️⃣ Build Stage (Client + Server)
# ===============================
FROM node:20-alpine AS builder
WORKDIR /app

# 🔹 빌드 캐시 효율을 위해 package.json 먼저 복사
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 🔹 클라이언트 의존성 설치 및 빌드
WORKDIR /app/client
RUN npm ci
COPY client .
RUN npm run build

# 🔹 서버 의존성 설치 및 빌드 (dev 포함)
WORKDIR /app/server
RUN npm ci
COPY server .
RUN npm run build

# ===============================
# 2️⃣ Runtime Stage (경량 실행)
# ===============================
FROM node:20-alpine AS runner
WORKDIR /app

# 🔹 서버 실행에 필요한 파일만 복사
COPY --from=builder /app/server/package*.json ./
RUN npm ci --omit=dev

# 🔹 서버 빌드 산출물 복사
COPY --from=builder /app/server/dist ./dist

# 🔹 클라이언트 정적 파일 복사
COPY --from=builder /app/client/dist ./public

# 🔹 환경 변수 및 포트 설정
EXPOSE 8080
ENV NODE_ENV=production

# 🔹 실행 명령
CMD ["node", "dist/index.js"]
