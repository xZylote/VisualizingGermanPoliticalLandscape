# base image
FROM node:17-alpine

# app target location
ENV APP_DIR=/var/opt/angular

# create work dir
RUN mkdir -p ${APP_DIR}

# cd into workdir
WORKDIR ${APP_DIR}

# copy code
COPY ./angular/package.json ${APP_DIR}/package.json

# run install and npm start
RUN npm install
RUN npm install --save d3
RUN npm install --save-dev @types/d3

# copy code
COPY ./angular/ ${APP_DIR}

CMD npm start -- --host 0.0.0.0 --poll 1000