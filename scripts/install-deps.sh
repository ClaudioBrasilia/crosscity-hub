#!/usr/bin/env bash
set -euo pipefail

REGISTRY_URL="${NPM_REGISTRY_URL:-https://registry.npmjs.org/}"
TOKEN="${NPM_TOKEN:-}"
USE_BUN_FIRST="${USE_BUN_FIRST:-1}"
CLEAN_LOCKS="${CLEAN_LOCKS:-0}"
CHECK_TIMEOUT_SEC="${CHECK_TIMEOUT_SEC:-12}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required" >&2
  exit 1
fi

HOST="$(echo "$REGISTRY_URL" | sed -E 's#^https?://##; s#/$##')"
TMP_NPMRC="$(mktemp)"
trap 'rm -f "$TMP_NPMRC"' EXIT

echo "registry=${REGISTRY_URL}" > "$TMP_NPMRC"
if [[ -n "$TOKEN" ]]; then
  echo "//${HOST}/:_authToken=${TOKEN}" >> "$TMP_NPMRC"
  echo "Using token from NPM_TOKEN for ${HOST}"
else
  echo "No NPM_TOKEN provided; attempting anonymous install against ${REGISTRY_URL}"
fi

export NPM_CONFIG_USERCONFIG="$TMP_NPMRC"

run_check() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "${CHECK_TIMEOUT_SEC}s" "$@"
  else
    "$@"
  fi
}

check_registry() {
  local mode="$1"
  if [[ "$mode" == "no-proxy" ]]; then
    run_check env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u npm_config_http_proxy -u npm_config_https_proxy npm view vite version --loglevel=error >/dev/null 2>&1
  else
    run_check npm view vite version --loglevel=error >/dev/null 2>&1
  fi
}

PROXY_MODE="with-proxy"
if check_registry "with-proxy"; then
  echo "Registry reachable with current proxy/environment settings."
elif check_registry "no-proxy"; then
  PROXY_MODE="no-proxy"
  echo "Registry only reachable without proxy. Install will run with proxy vars disabled."
else
  echo "Registry is unreachable in both modes (with proxy and without proxy)." >&2
  echo "Set NPM_REGISTRY_URL/NPM_TOKEN correctly or verify corporate proxy policy." >&2
  exit 2
fi

run_cmd() {
  if [[ "$PROXY_MODE" == "no-proxy" ]]; then
    env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u npm_config_http_proxy -u npm_config_https_proxy "$@"
  else
    "$@"
  fi
}

echo "Cleaning previous install state..."
rm -rf node_modules
if [[ "$CLEAN_LOCKS" == "1" ]]; then
  rm -f bun.lockb package-lock.json
fi

if [[ "$USE_BUN_FIRST" == "1" ]] && command -v bun >/dev/null 2>&1; then
  echo "Trying bun install..."
  if run_cmd bun install; then
    echo "bun install succeeded"
    exit 0
  fi
  echo "bun install failed; falling back to npm install"
fi

echo "Running npm install..."
run_cmd npm install

echo "Dependencies installed successfully"
