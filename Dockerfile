FROM node:12.18.2

ENV NODE_ENV prod
ENV NODE_CONFIG_ENV prod

# build packages first
WORKDIR /tmp
COPY package.json yarn.lock lerna.json /tmp/
ADD packages /tmp/packages
RUN yarn && yarn build
# align package destination with example package.json expectations
RUN mv packages /packages

# build example app (prod)
WORKDIR /usr/src/app
COPY example/angular/universal/package.json ./package.json
COPY example/angular/universal/yarn.lock ./yarn.lock
RUN yarn
COPY example/angular/universal .
RUN yarn run build:ssr && \
    yarn cache clean
RUN ln -s node_modules dist/server/node_modules
EXPOSE 8081 4200
CMD [ "node", "dist/server/main.js" ]
