# syntax=docker/dockerfile:1
#
# Static image for the Astro landing site (apps/landing).
# Astro builds to plain HTML/CSS/JS (no Node runtime) — served by nginx.
# Build from the REPO ROOT so the pnpm workspace resolves:
#
#   docker build -f apps/landing/Dockerfile \
#     --build-arg PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud \
#     --build-arg PUBLIC_WEB_URL=https://<web app> \
#     -t landing .
#
# Every PUBLIC_* value is inlined into the HTML at build time (see
# apps/landing/.env.example); none may be a secret. PUBLIC_CONVEX_URL is read
# once, here: the plan limits the site prints are the ones this build fetched,
# so **rebuild the image after editing a plan in the console.**

# --- base: pnpm + turbo on Node 20 -----------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.33.4 turbo@2
WORKDIR /app

# --- pruner: isolate landing + its workspace deps (e.g. @workspace/ui) ------
FROM base AS pruner
COPY . .
RUN turbo prune landing --docker

# --- builder: install + astro build → apps/landing/dist --------------------
FROM base AS builder
ARG PUBLIC_WEB_URL
ARG PUBLIC_APP_STORE_URL
ARG PUBLIC_PLAY_STORE_URL
ARG PUBLIC_APP_STORE_ID
ARG PUBLIC_CONVEX_URL
ARG PUBLIC_GA_ID
ENV PUBLIC_WEB_URL=$PUBLIC_WEB_URL \
    PUBLIC_APP_STORE_URL=$PUBLIC_APP_STORE_URL \
    PUBLIC_PLAY_STORE_URL=$PUBLIC_PLAY_STORE_URL \
    PUBLIC_APP_STORE_ID=$PUBLIC_APP_STORE_ID \
    PUBLIC_CONVEX_URL=$PUBLIC_CONVEX_URL \
    PUBLIC_GA_ID=$PUBLIC_GA_ID
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN turbo build --filter=landing

# --- runner: static files on nginx -----------------------------------------
FROM nginx:alpine AS runner
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
