#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_TARGET:?Set DEPLOY_TARGET to an rsync destination such as user@example.com:/var/www/dsa3/}"

bun run build
rsync -avp --delete ./dist/ "${DEPLOY_TARGET%/}/"
