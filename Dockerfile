# ------------------------
# Stage 1: Builder (Client + Server)
# ------------------------
FROM node:20-alpine AS builder

# 기본 작업 디렉토리
WORKDIR /app

# ✅ 모든 소스 복사 (Toaster.tsx 포함)
COPY . ./

# ------------------------
# Client Build (Vite + React)
# ------------------------
WORKDIR /app/client

# 필요한 의존성 설치
RUN npm ci

# Tailwind / PostCSS / Autoprefixer 강제 설치 (혹시 누락 방지)
RUN npm install -D tailwindcss postcss autoprefixer

# 🔥 Toaster.tsx가 반드시 존재하도록 폴더 보장 후 강제 복사
RUN mkdir -p /app/client/src/components/ui
COPY client/src/components/ui/Toaster.tsx /app/client/src/components/ui/Toaster.tsx

# Vite 빌드 실행
RUN npx vite build

# ------------------------
# Server Build (Express + TypeScript)
# ------------------------
WORKDIR /app/server

RUN npm ci
RUN npm run build

# ------------------------
# Stage 2: Runner (Production)
# ------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# 환경 변수 (Railway에서 override 가능)
ENV NODE_ENV=production
ENV PORT=8080

# ✅ server 빌드 결과만 복사
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./

# ✅ client 빌드 결과물을 server 정적 파일로 포함
COPY --from=builder /app/client/dist ./public

# ✅ 의존성 설치 (devDependencies 제외)
RUN npm ci --omit=dev

EXPOSE 8080

# ✅ 실행 명령
CMD ["node", "dist/index.js"]
