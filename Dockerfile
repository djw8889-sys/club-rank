# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 모든 파일 복사
COPY . .

# ✅ client 빌드 (devDependencies 포함)
WORKDIR /app/client
RUN npm install
RUN npm run build

# ✅ server 빌드
WORKDIR /app/server
RUN npm install
RUN npm run build

# ------------------------
# Stage 2: Runner
# ------------------------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# server 빌드 산출물만 복사
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/client/dist ./public

RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/index.js"]
