FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"
RUN npx prisma generate && npm run build

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
