# Build stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# CORRECT REDIRECT URI with /auth/callback
ENV VITE_GENESYS_ENVIRONMENT=euw2.pure.cloud
ENV VITE_GENESYS_CLIENT_ID=8e982e76-cfe5-43ed-8c81-1c89ccaaebfc
ENV VITE_REDIRECT_URI=https://genesysraas-488605620714.europe-west2.run.app/auth/callback
ENV VITE_RULES_TABLE_ID=8d693c19-edea-410d-b3a7-5afd6f45b3c2

RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]