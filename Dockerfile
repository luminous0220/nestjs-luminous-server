FROM node:20.10.0

WORKDIR /app

COPY . .

RUN npm config set registry https://registry.npmmirror.com/

RUN npm install

RUN npm run build

EXPOSE 8182

CMD ["npm", "run", "start:prod"]