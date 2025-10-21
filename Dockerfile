# ✅ Railway 빌드 오류 (EBUSY, 권한 문제) 완전 해결 Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# package.json만 먼저 복사 (캐시 효율)
COPY package*.json ./

# 환경변수로 npm 캐시 비활성화
ENV npm_config_cache=/tmp/.npm-cache

# npm 설치
RUN npm ci --omit=dev --no-audit --prefer-offline

# 🔹 빌드 전에 node_modules 캐시 및 권한 문제 방지
RUN rm -rf /app/node_modules/.cache || true
RUN chown -R node:node /app

# 소스 복사
COPY . .

# 빌드 실행
RUN npm run build

# ===============================
# 🚀 실행 단계
# ===============================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 5000
CMD ["npm", "start"]
