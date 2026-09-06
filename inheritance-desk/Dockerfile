# A Next.js app is already frontend + backend (its API routes) in one process,
# so a single image serves both. This mirrors the multi-stage build/run split of
# the reference project, adapted to Next's standalone output.

# Stage 1: Build the app into a self-contained standalone bundle.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Minimal runtime image — just the standalone server and its assets.
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Bind all interfaces so Railway's proxy can reach the server.
ENV HOSTNAME=0.0.0.0

# Standalone ships a pruned node_modules + server.js. Static assets and public/
# are NOT included in standalone — copy them in alongside.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# government-data JSON is read from disk at runtime (process.cwd()/government-data,
# see lib/guidance/catalog.ts). File tracing already includes the JSON, but copy
# the whole pack explicitly so a runtime read never depends on a tracing glob.
COPY --from=build /app/government-data ./government-data

COPY docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
