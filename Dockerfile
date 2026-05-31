FROM node:20-alpine

WORKDIR /app

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG APP_ENV=production
ARG APP_NAME=LostFindings
ARG API_URL

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV APP_ENV=$APP_ENV
ENV APP_NAME=$APP_NAME
ENV API_URL=$API_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 8081

# Menggunakan tunnel lebih aman saat pakai Docker agar HP bisa langsung konek
CMD ["npx", "expo", "start", "--tunnel"]