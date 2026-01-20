# --- Stage 1: Build the React Application ---
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Install Dependencies
COPY package*.json ./
RUN npm install

# 2. Copy Source Code
COPY . .

# 3. Accept Build Arguments (Passed from docker-compose)
ARG VITE_PUBLIC_IP
ENV VITE_PUBLIC_IP=$VITE_PUBLIC_IP

# 4. Build the Project (Creates 'dist' folder)
RUN npm run build


# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# 1. Copy the built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. Add SPA (Single Page App) Support
# This fixes "404 Not Found" errors when refreshing pages like /invoices
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    include /etc/nginx/mime.types; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 3. Expose Port 80 (Internal Docker Network)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]