FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

# --- Imagem de producao ---
FROM node:20-alpine AS production

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist

# CRITICO: Copiar o frontend para dentro do container
COPY frontend /app/frontend

EXPOSE 3333

CMD ["node", "dist/server.js"]
