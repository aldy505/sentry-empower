FROM node:20-bookworm-slim

RUN : \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        # for envsusbst
        gettext \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY package.json package-lock.json .
RUN npm install

COPY . .

ARG RELEASE 2025+compose
ARG PUBLIC_BASE_URL http://localhost:8342

RUN \
    REACT_APP_DSN=${REACT_APP_DSN} \
    REACT_APP_RELEASE=${RELEASE} \
    REACT_APP_ASPNETCORE_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_EXPRESS_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_FLASK_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_LARAVEL_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_RUBYONRAILS_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_RUBY_BACKEND=${PUBLIC_BASE_URL}/api \
    REACT_APP_SPRINGBOOT_BACKEND=${PUBLIC_BASE_URL}/api \
        ./build.sh


FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=0 /src/build /usr/share/nginx/html
EXPOSE 80