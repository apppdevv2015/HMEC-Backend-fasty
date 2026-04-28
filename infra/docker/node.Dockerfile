# Use a slim Node.js image for production efficiency
FROM node:20-slim

WORKDIR /app

# Copy root package.json and workspace package.json files
COPY package.json ./
COPY services/ ./services/
COPY packages/ ./packages/
COPY knexfile.js ./
COPY infra/ ./infra/

# Install dependencies for the entire monorepo
RUN npm install --production

# The specific service to run will be determined by the command in docker-compose
CMD ["npm", "start"]
