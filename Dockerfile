FROM node:20-alpine AS deps

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache \
    pixman \
    cairo \
    pango \
    libjpeg-turbo \
    giflib

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache \
    pixman \
    cairo \
    pango \
    libjpeg-turbo \
    giflib

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/generated ./generated

EXPOSE 3002
CMD ["npm", "run", "start"]
