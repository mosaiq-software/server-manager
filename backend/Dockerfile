FROM node:20

RUN apt-get update && apt-get install -y 

COPY . /app

WORKDIR /app

RUN npm ci

CMD ["npm", "run", "start:prod"]