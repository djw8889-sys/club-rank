# ===============================
# 1️⃣ Base Stage
# ===============================
FROM node:20-alpine AS base
ARG CACHEBUST=1
WORKDIR /app

# ===============================
# 2️⃣ Dependencies Stage (캐시 분리)
# ===============================
FROM base AS deps

# ---- Client deps ----
COPY client/package*.json ./client/
RUN cd client && npm ci

# ---- Server deps ----
COPY server/package*.json ./server/
RUN cd server && npm ci

# ===============================
# 3️⃣ Build Stage
# ===============================
FROM base AS builder

# ---- Copy deps from cache ----
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# ---- Copy source ----
COPY client ./client
COPY server ./server

# ---- Ensure tsconfig is available ----
COPY server/tsconfig.json ./server/tsconfig.json

# ---- Build Client ----
RUN cd client && npm run build

# ---- Build Server ----
RUN cd server && npx tsc --project tsconfig.json

# ===============================
# 4️⃣ Runtime Stage
# ===============================
FROM node:20-alpine AS runner
WORKDIR /app

# ---- Install minimal runtime deps ----
COPY server/package*.json ./
RUN npm ci --omit=dev

# ---- Copy built artifacts ----
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/public ./public

# ---- Env & Ports ----
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
