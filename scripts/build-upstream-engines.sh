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
 sed -i 's|/colorapp2/|/TO_startup/engines/art/|g' src/App.jsx
 node "$GITHUB_WORKSPACE/scripts/adapt-coloring.mjs"
 mkdir -p public/images/coloring public/images/UI
 cp "$GITHUB_WORKSPACE/public/rybka.css" public/rybka.css
 for item in brush download undo pan; do
   case "$item" in
     brush) symbol='✎';;
     download) symbol='↓';;
     undo) symbol='↶';;
     pan) symbol='✥';;
   esac
   printf '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><text x="24" y="33" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#654936">%s</text></svg>' "$symbol" > "public/images/UI/$item.svg"
 done
 cp -R "$GITHUB_WORKSPACE/public/coloring-pages/." public/images/coloring/
 find public/images/coloring -maxdepth 1 -type f -name '*.svg' -printf '%f\\n' | sort > public/image_list.txt
 npm install --no-audit --no-fund
 npm run build -- --base=/TO_startup/engines/art/
 cp -R dist "$GITHUB_WORKSPACE/dist/engines/art"
 cp LICENSE "$GITHUB_WORKSPACE/dist/engines/art/LICENSE.txt"
)
