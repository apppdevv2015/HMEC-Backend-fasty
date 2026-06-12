FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy monorepo configurations
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY database/ ./database/
COPY infra/ ./infra/
COPY services/api-gateway/ ./services/api-gateway/
COPY services/auth-service/swagger/ ./services/auth-service/swagger/
COPY services/component-intelligence-service/swagger/ ./services/component-intelligence-service/swagger/

# Install dependencies for the service and its packages
RUN npm install --production

# Generate Prisma Client
RUN npx prisma generate --schema=database/prisma/schema.prisma

CMD ["npm", "start", "--workspace=services/api-gateway"]
