FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Skip postinstall (prisma generate); schema is copied later and generate runs in build step.
RUN npm ci --include=dev --ignore-scripts

COPY . .

RUN mkdir -p /data

ENV DATABASE_URL="file:/data/dev.db"
RUN npx prisma generate && npm run build

ENV NODE_ENV=production

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
  && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/app/docker-entrypoint.sh"]
