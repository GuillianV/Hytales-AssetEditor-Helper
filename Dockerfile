FROM node:23.11-alpine3.20 AS builder

WORKDIR /app

RUN mkdir -p data
RUN mkdir -p downloads

COPY modules ./modules
COPY .env .
COPY package.json .
COPY server.js .

RUN npm install

FROM node:23.11-alpine3.20 AS deployer

WORKDIR /app

COPY --from=builder /app/modules ./modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/server.js .
RUN chmod +x /app/modules/downloader/hytale-downloader-linux-amd64

ENTRYPOINT node server.js
#ENTRYPOINT tail -f /dev/null #If debug
#docker exec -it CMS sh #If debug