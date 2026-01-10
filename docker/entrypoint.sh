#!/bin/sh
set -eu

ENV_FILE="/app/.env"

# Only generate if missing (so you can still mount your own .env)
if [ ! -f "$ENV_FILE" ]; then
  {
    echo "MONGODB_URI=${MONGODB_URI:-}"
    echo "ADMIN_DB_URL=${ADMIN_DB_URL:-}"
    echo "DATABASE_URL=${DATABASE_URL:-}"
    echo "SMTP_SENDER=${SMTP_SENDER:-}"
    echo "SMTP_HOST=${SMTP_HOST:-}"
    echo "SMTP_USER=${SMTP_USER:-}"
    echo "SMTP_PASS=${SMTP_PASS:-}"
    echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}"
    echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}"
    echo "AWS_REGION=${AWS_REGION:-}"
    echo "AUTOCAM_BUCKET=${AUTOCAM_BUCKET:-}"
    echo "BASE_URL=${BASE_URL:-}"
    echo "BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-}"
  } > "$ENV_FILE"
fi

exec "$@"