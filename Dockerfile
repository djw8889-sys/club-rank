# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# ✅ 전체 프로젝트 복사
COPY . .

# ------------------------
# Client Build (Vite + React)
# ------------------------
WORKDIR /app/client

# npm 캐시 제거 후 클린 설치
RUN rm -rf node_modules && npm ci

# tailwind/postcss 자동 설치 (필요 시)
RUN npm install -D tailwindcss postcss autoprefixer

# ✅ Vite 빌드 (루트 기준 실행으로 alias 문제 해결)
WORKDIR /app
RUN cd client && npx vite build

# ------------------------
# Server Build (Express + TypeScript)
# ------------------------
WORKDIR /app/server
RUN rm -rf node_modules && npm ci && npm run build

# ------------------------
# Stage 2: Runner
# ------------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# ✅ server 빌드 결과만 복사
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./

# ✅ 클라이언트 정적 파일 복사 (React 빌드 결과)
COPY --from=builder /app/client/dist ./public

RUN npm ci --omit=dev

EXPOSE 8080

# ✅ Express 서버 실행
CMD ["node", "dist/index.js"]
