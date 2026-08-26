FROM node:20-alpine

# Install libc6-compat
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install all dependencies across the workspace
RUN pnpm install

# Note: The actual start command will be overridden in docker-compose.yml 
# for each specific service (e.g., pnpm --filter worker run dev)
CMD ["echo", "Please specify a service to run"]
