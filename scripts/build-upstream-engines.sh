#!/usr/bin/env bash
set -euo pipefail
mkdir -p dist/engines
git clone --depth 1 https://github.com/XanthanL/neon-daw.git /tmp/to-neon-daw
(
 cd /tmp/to-neon-daw
 npm install --no-audit --no-fund
 npm run build -- --base=/TO_startup/engines/music/
 cp -R dist "$GITHUB_WORKSPACE/dist/engines/music"
 cp LICENSE "$GITHUB_WORKSPACE/dist/engines/music/LICENSE.txt"
)
