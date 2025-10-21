# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 전체 복사
COPY . .

# ✅ Client 빌드 (Vite + React)
WORKDIR /app/client
# devDependencies 포함 설치
RUN npm install

RUN npx vite build

# ✅ Server 빌드 (Express + TypeScript)
WORKDIR /app/server
RUN npm install
RUN npm run build

# ------------------------
# Stage 2: Runner
# ------------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# server 빌드 결과만 복사
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/client/dist ./public

RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/index.js"]
