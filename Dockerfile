FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY src ./src
COPY views ./views
COPY .env.example ./

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_PATH=/app/data/boring-money.db

EXPOSE 3000

CMD ["node", "src/server.js"]
