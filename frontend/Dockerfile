FROM node:26-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app

# Cria um usuário não-root para o Node.js
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

COPY --from=build --chown=nextjs:nodejs /app ./
EXPOSE 3000
CMD ["npm", "start"]