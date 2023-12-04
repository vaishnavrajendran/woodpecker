FROM node:alpine

RUN mkdir /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV MONGO_URI=mongodb://localhost:27017/
ENV sessionSecret=your-secret

CMD ["npm", "start"]

EXPOSE 3000