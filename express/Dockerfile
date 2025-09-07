FROM node:22.16.0-bookworm-slim

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm install
COPY . .

CMD ["node", "--env-file-if-exists", ".env", "--import", "./instrument.js", "./server.js"]