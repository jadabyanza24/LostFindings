FROM node:20-alpine

WORKDIR /app

# Build args untuk environment variables
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY

# Set sebagai environment variables
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--no-dev", "--minify"]