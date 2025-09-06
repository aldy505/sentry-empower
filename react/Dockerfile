FROM node:20-bookworm-slim

RUN : \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        # for envsusbst
        gettext \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g serve

WORKDIR /src
COPY package.json package-lock.json .
RUN npm install

COPY . .

RUN \
    REACT_APP_DSN= \
    REACT_APP_RELEASE=2023+compose \
    REACT_APP_ASPNETCORE_BACKEND=http://localhost:80/api \
    REACT_APP_EXPRESS_BACKEND=http://localhost:80/api \
    REACT_APP_FLASK_BACKEND=http://localhost:80/api \
    REACT_APP_LARAVEL_BACKEND=http://localhost:80/api \
    REACT_APP_RUBYONRAILS_BACKEND=http://localhost:80/api \
    REACT_APP_RUBY_BACKEND=http://localhost:80/api \
    REACT_APP_SPRINGBOOT_BACKEND=http://localhost:80/api \
        ./build.sh

CMD ["serve", "-s", "build"]
