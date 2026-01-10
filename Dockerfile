# syntax=docker/dockerfile:1.6
# -----------------------------------------------------------------------------
# Dockerfile.bun (clones repo during build)
# Build with: DOCKER_BUILDKIT=1 docker build --ssh default -f Dockerfile.bun -t autocam-webui .
# Run with:   docker run --env-file .env -p 3000:3000 autocam-webui
# -----------------------------------------------------------------------------

FROM oven/bun:1 AS base
WORKDIR /app

# --- Fetch latest source from git (SSH) ---
FROM base AS src
RUN apt-get update && apt-get install -y --no-install-recommends \
      git openssh-client ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG REPO_SSH="git@github.com:zachariahsharma/AutoCAM-WebUI.git"
ARG REF="main"

RUN --mount=type=ssh \
    mkdir -p -m 0700 /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts && \
    git clone --depth 1 --branch "$REF" "$REPO_SSH" .

# --- Install dependencies with bun (cached layer) ---
FROM base AS deps
COPY --from=src /app/package.json /app/bun.lock* ./
RUN bun install --no-save --frozen-lockfile

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=src /app ./
RUN bun run build

# --- Production runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --no-log-init -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add entrypoint that (optionally) writes /app/.env from runtime env vars
COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bun", "./server.js"]