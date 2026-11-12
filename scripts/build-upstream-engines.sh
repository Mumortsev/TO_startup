#!/usr/bin/env bash
# Reproducible upstream build. Run after `npm run build` (or set ENGINE_OUTPUT_DIR).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_BASE="${SITE_BASE_PATH:-/TO_startup/}"
SITE_BASE="/${SITE_BASE#/}"
SITE_BASE="${SITE_BASE%/}/"
REVISION=81eef8ae073bd600adeed531670167b02a7dacb5
OUTPUT="${ENGINE_OUTPUT_DIR:-$ROOT/dist/engines/music}"
BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/to-neondaw.XXXXXX")"
trap 'rm -rf "$BUILD_DIR"' EXIT

git -C "$BUILD_DIR" init --quiet
git -C "$BUILD_DIR" remote add origin https://github.com/XanthanL/neon-daw.git
git -C "$BUILD_DIR" fetch --quiet --depth 1 origin "$REVISION"
git -C "$BUILD_DIR" checkout --quiet --detach FETCH_HEAD
test "$(git -C "$BUILD_DIR" rev-parse HEAD)" = "$REVISION"
node "$ROOT/scripts/prepare-music.mjs" "$BUILD_DIR"
(
  cd "$BUILD_DIR"
  npm ci --no-audit --no-fund
  npm run build -- --base="${SITE_BASE}engines/music/"
)
mkdir -p "$OUTPUT"
cp -R "$BUILD_DIR/dist/." "$OUTPUT/"
cp "$BUILD_DIR/LICENSE" "$OUTPUT/LICENSE.txt"
printf '%s\n' "$REVISION" > "$OUTPUT/UPSTREAM_REVISION.txt"
# The curated CC BY-SA illustrations are versioned in public/coloring and copied by Vite.
test -f "$OUTPUT/index.html"
echo "NeonDAW $REVISION built in $OUTPUT"
