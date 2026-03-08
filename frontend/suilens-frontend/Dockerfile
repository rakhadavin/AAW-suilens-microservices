FROM node:22-alpine
WORKDIR /app

# Aktifkan corepack + siapkan pnpm versi 9
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

COPY package.json pnpm-lock.yaml* ./
RUN corepack pnpm install --frozen-lockfile

COPY . .
EXPOSE 5173

CMD ["corepack", "pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]