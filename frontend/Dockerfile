# ---- Stage 1: install dependencies and build ----
FROM node:24-alpine AS build
WORKDIR /app

# Copy only the lockfiles first so `npm ci` is cached until dependencies change
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: small runtime image (no source code, no dev dependencies) ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# The official node image ships a non-root "node" user
USER node

EXPOSE 3000
CMD ["node", "server.js"]
