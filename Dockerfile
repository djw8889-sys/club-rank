# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 전체 복사
COPY . .

# ✅ Client 빌드 (Vite + React)
WORKDIR /app/client
RUN npm ci
RUN npm install -g vite
RUN npm install tailwindcss postcss autoprefixer -D
RUN npm run build



# ✅ Server 빌드 (Express + TypeScript)
WORKDIR /app/server
RUN npm ci
RUN npm run build

# ------------------------
# Stage 2: Runner
# ------------------------
FROM node:20-alpine
WORKDIR /app

# Firebase 서비스 계정 키 등 환경변수 주입은 Railway secrets로 관리
ENV NODE_ENV=production

# server 빌드 결과만 복사
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./

RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/index.js"]
