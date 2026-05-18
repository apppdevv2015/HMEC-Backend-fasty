# Use a slim Node.js image for production efficiency
FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy monorepo configuration
COPY package.json ./

# Copy ALL services, packages and infra
COPY services/ ./services/
COPY packages/ ./packages/
COPY infra/ ./infra/

# Install dependencies for the whole monorepo
RUN npm install --production

# Generate Prisma Client using master schema
RUN npx prisma generate --schema=infra/database/prisma/schema.prisma

# Final setup
COPY knexfile.js ./

CMD ["npm", "start"]
