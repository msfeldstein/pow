# Step 1: Build the Vite app
FROM node:latest as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm run dev"]