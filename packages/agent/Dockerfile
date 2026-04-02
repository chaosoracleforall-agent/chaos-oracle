FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy source
COPY *.ts ./
COPY *.json ./

# Don't copy .env or state files
# These come from GCP Secret Manager and persistent volume

ENV NODE_ENV=production

CMD ["npx", "ts-node", "index.ts"]
