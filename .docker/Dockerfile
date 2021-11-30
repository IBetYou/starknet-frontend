FROM node:14-buster

WORKDIR /opt/web

COPY ./package*.json ./
RUN npm install --production --ignore-scripts=false --prefer-offline
RUN npm install --save-dev eslint@"<8.0.0"

COPY . .
ENV NODE_ENV production
RUN npm run build