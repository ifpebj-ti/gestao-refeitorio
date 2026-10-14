FROM node:26-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=411051502805-kktsu5dn98f504upsj8jlh1qmroq9k48.apps.googleusercontent.com
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

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