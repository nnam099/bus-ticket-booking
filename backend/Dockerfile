FROM node:20-alpine

# Cài đặt openssl cho Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

RUN mkdir -p logs

EXPOSE 3000

CMD ["sh", "-c", "DATABASE_URL=\"$MIGRATION_DATABASE_URL\" npx prisma migrate deploy && node src/server.js"]
