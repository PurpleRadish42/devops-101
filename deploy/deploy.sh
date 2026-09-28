#!/usr/bin/env bash
# Deploy one environment on the VM. GitHub Actions runs this over SSH (or run it by hand).
# Usage: ./deploy/deploy.sh <staging|production> <image-tag>
set -euo pipefail

ENV="${1:-}"
TAG="${2:-}"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]] || [[ -z "$TAG" ]]; then
  echo "Usage: $0 <staging|production> <image-tag>" >&2
  exit 1
fi

cd "$(dirname "$0")/.." # repo root, e.g. /opt/devops-101

if [[ ! -f ".env.$ENV" ]]; then
  echo "Missing .env.$ENV - copy deploy/.env.example and edit it" >&2
  exit 1
fi

echo "==> Updating repo (compose file, scripts)"
git pull --ff-only

# -p <name> makes a separate compose "project": staging and production get
# their own containers, network and volumes on the same VM.
export IMAGE_TAG="$TAG"

echo "==> Pulling $ENV images with tag $TAG"
docker compose -p "$ENV" --env-file ".env.$ENV" pull frontend backend

echo "==> Starting $ENV"
docker compose -p "$ENV" --env-file ".env.$ENV" up -d --no-build

echo "==> Cleaning up old images"
docker image prune -f

echo "==> $ENV is now running $TAG"
