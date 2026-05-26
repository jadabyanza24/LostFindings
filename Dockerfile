FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Expose Metro bundler port
EXPOSE 8081

CMD ["npx", "expo", "start", "--no-dev", "--minify"]