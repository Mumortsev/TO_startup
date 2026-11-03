#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/engines
git clone --depth 1 https://github.com/XanthanL/neon-daw.git /tmp/to-neon-daw
git clone --depth 1 https://github.com/jeana-hines/coloring-app.git /tmp/to-coloring-app
(
 cd /tmp/to-neon-daw
 npm install --no-audit --no-fund
 npm run build -- --base=/TO_startup/engines/music/
 cp -R dist "$GITHUB_WORKSPACE/dist/engines/music"
 cp LICENSE "$GITHUB_WORKSPACE/dist/engines/music/LICENSE.txt"
)
(
 cd /tmp/to-coloring-app
 npm install --no-audit --no-fund
 npm run build -- --base=/TO_startup/engines/art/
 cp -R dist "$GITHUB_WORKSPACE/dist/engines/art"
 cp LICENSE "$GITHUB_WORKSPACE/dist/engines/art/LICENSE.txt"
)
