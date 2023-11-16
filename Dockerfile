# Step 1: Build the Vite app
FROM node:latest as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN mkdir /pow-meta
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]