# ✅ Railway 빌드 오류 (EBUSY) 완전 해결 버전 Dockerfile

FROM node:20-alpine AS builder

# 앱 디렉토리 생성
WORKDIR /app

# package.json과 lock 파일 복사
COPY package*.json ./

# 종속성 설치
RUN npm ci --omit=dev

# 🔹 캐시 충돌 방지: npm 캐시 디렉터리 삭제
RUN rm -rf /app/node_modules/.cache || true

# 소스 복사
COPY . .

# 빌드 실행
RUN npm run build

# ===============================
# 🚀 실행 단계
# ===============================
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 5000

# 실행 명령
CMD ["npm", "start"]
