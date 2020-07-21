FROM node:12.18.2

ENV NODE_ENV prod
ENV NODE_CONFIG_ENV prod

# build packages first
WORKDIR /tmp
COPY package.json package-lock.json lerna.json /tmp/
ADD packages /tmp/packages

# lerna isn't configured correctly, should remove it?
RUN cd packages/ts-rpc-client npm i && npm run build
RUN cd packages/ts-rpc-server npm i && npm run build
RUN cd packages/ts-rpc-reflect npm i && npm run build
RUN cd packages/ts-rpc-lib npm i && npm run build
RUN cd packages/ts-rpc-angular npm i && npm run build

# align package destination with example package.json expectations
RUN mv packages /packages

# build example app (prod)
WORKDIR /usr/src/app
COPY example/angular/universal/package.json ./package.json
COPY example/angular/universal/package-lock.json ./package-lock.json
RUN npm i
COPY example/angular/universal .
RUN npm run build:ssr
RUN ln -s node_modules dist/server/node_modules
EXPOSE 8081 4200
CMD [ "node", "dist/server/main.js" ]
