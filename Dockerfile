FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Railway injects NODE_ENV=production during build; devDeps are required for prisma/tailwind/typescript.
RUN npm ci --include=dev

COPY . .

ENV DATABASE_URL="file:/data/dev.db"
RUN npx prisma generate && npm run build

ENV NODE_ENV=production

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
  && chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /data

VOLUME ["/data"]

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/app/docker-entrypoint.sh"]
