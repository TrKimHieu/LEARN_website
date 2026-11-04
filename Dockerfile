# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor vendor
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
# Empty (default) = relative /api paths behind a same-origin reverse proxy (ADR 017).
# Set an absolute API origin only when web and API are served from different origins.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static .next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
