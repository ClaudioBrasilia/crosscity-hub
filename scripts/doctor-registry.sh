#!/usr/bin/env bash
set -euo pipefail

PKG="${1:-vite}"
CHECK_TIMEOUT_SEC="${CHECK_TIMEOUT_SEC:-12}"

echo "== Runtime versions =="
node -v || true
npm -v || true
bun --version || true

echo
echo "== Registry config =="
echo "npm registry: $(npm config get registry)"
if [[ -f bunfig.toml ]]; then
  echo "bunfig.toml found (bun reads registry settings from npmrc/bunfig when configured)"
else
  echo "bunfig.toml not found"
fi

echo
echo "== Local npmrc files =="
for file in .npmrc "$HOME/.npmrc"; do
  if [[ -f "$file" ]]; then
    echo "-- $file"
    sed -E 's#(//[^:]+:_authToken=).*#\1***REDACTED***#' "$file"
  else
    echo "-- $file (not found)"
  fi
done

echo
echo "== Potentially relevant env vars =="
env | grep -Ei 'npm|bun|proxy|registry|token' || true

echo
echo "== Registry reachability test =="
run_check() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "${CHECK_TIMEOUT_SEC}s" "$@"
  else
    "$@"
  fi
}

set +e
run_check npm view "$PKG" version --loglevel=error >/tmp/npm-view-with-proxy.out 2>&1
WITH_PROXY=$?
run_check env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u npm_config_http_proxy -u npm_config_https_proxy npm view "$PKG" version --loglevel=error >/tmp/npm-view-no-proxy.out 2>&1
NO_PROXY_STATUS=$?
set -e

if [[ $WITH_PROXY -eq 0 ]]; then
  echo "with proxy/env: OK"
else
  echo "with proxy/env: FAIL (exit $WITH_PROXY)"
  [[ $WITH_PROXY -eq 124 ]] && echo "(timeout after ${CHECK_TIMEOUT_SEC}s)"
  tail -n 4 /tmp/npm-view-with-proxy.out || true
fi

if [[ $NO_PROXY_STATUS -eq 0 ]]; then
  echo "without proxy/env: OK"
else
  echo "without proxy/env: FAIL (exit $NO_PROXY_STATUS)"
  [[ $NO_PROXY_STATUS -eq 124 ]] && echo "(timeout after ${CHECK_TIMEOUT_SEC}s)"
  tail -n 4 /tmp/npm-view-no-proxy.out || true
fi

if [[ $WITH_PROXY -ne 0 && $NO_PROXY_STATUS -eq 0 ]]; then
  echo "hint: proxy likely blocking npm registry; try install without proxy env vars"
fi

echo
echo "== package.json vite sanity =="
if jq -e '.devDependencies.vite // .dependencies.vite' package.json >/dev/null; then
  echo "vite is declared in package.json"
else
  echo "vite is NOT declared in package.json"
fi

echo
echo "== node_modules binary check =="
if [[ -x node_modules/.bin/vite ]]; then
  echo "node_modules/.bin/vite exists"
else
  echo "node_modules/.bin/vite missing (dependencies likely not installed)"
fi
