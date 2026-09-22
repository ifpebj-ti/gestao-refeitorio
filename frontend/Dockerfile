FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app
COPY --chown=node:node --from=build /app ./
USER node
EXPOSE 3000
CMD ["npm", "start"]
