FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy monorepo configurations
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY database/ ./database/
COPY infra/ ./infra/
COPY services/ ./services/

# Install dependencies for the service and its packages
RUN npm install --production

# Generate Prisma Client
RUN npx prisma generate --schema=database/prisma/schema.prisma

CMD ["npx", "prisma", "db", "push", "--schema=database/prisma/schema.prisma", "--accept-data-loss"]
