# syntax=docker/dockerfile:1
#
# Docker image for apps/web (Next.js 16, standalone output).
# Build from the REPO ROOT so the pnpm workspace resolves:
#
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_CONVEX_URL=https://<prod>.convex.cloud \
#     --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
#     -t web .
#
# NEXT_PUBLIC_* are inlined into the client bundle at build time → build args.
# Runtime secrets (CLERK_SECRET_KEY)
# are passed at `docker run` time, NOT baked into the image.

# --- base: pnpm + turbo on Node 24 (LTS) ------------------------------------
# Install pnpm directly instead of `corepack enable`: the corepack bundled in
# node alpine images often fails the pinned-pnpm download with "Cannot find
# matching keyid" (stale signing keys). A direct global install sidesteps that.
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.33.4 turbo@2
WORKDIR /app

# --- pruner: isolate web + its workspace deps ------------------------------
FROM base AS pruner
COPY . .
RUN turbo prune web --docker

# --- installer: install deps, then build the app ---------------------------
FROM base AS installer
# package.json files + lockfile + pnpm-workspace.yaml (good cache layer).
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
# Full pruned source.
COPY --from=pruner /app/out/full/ .
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
RUN turbo build --filter=web

# --- runner: minimal standalone server -------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# standalone bundle (traced node_modules + monorepo layout), then static assets.
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# public/ holds the brand mark. Standalone traces server code only, so static
# files are copied by hand — and a missing line here is a broken image in
# production that nothing in the build reports.
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3001
# Busybox wget is in the alpine base; curl is not.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
