# 🚀 MatchPoint 통합 배포 Dockerfile (Firebase + Express + Vite)

FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

# npm 캐시 비활성화
ENV npm_config_cache=/tmp/.npm-cache

# Client 빌드
RUN cd client && npm ci && npm run build

# Server 빌드
RUN cd server && npm ci && npm run build

# ===============================
# 🚀 실행 단계
# ===============================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 5000
CMD ["npm", "start"]
