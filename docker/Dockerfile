FROM node:24-slim AS frontend

WORKDIR /build

COPY ./frontend/package.json ./frontend/package-lock.json /build/

RUN npm ci

COPY ./frontend /build

RUN npm run build

FROM node:24-slim AS results

WORKDIR /build

COPY ./results/package.json ./results/package-lock.json /build/

RUN npm ci

COPY ./results /build

RUN npm run build

FROM nginx:1.30-alpine-slim

COPY --from=frontend /build/dist /var/www

COPY --from=results /build/dist/ChannelsDB /var/www/detail

CMD ["nginx", "-g", "daemon off;"]
