FROM node:20-bookworm-slim

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm install
COPY . .

CMD ["node", "server.js"]