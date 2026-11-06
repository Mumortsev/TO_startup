/** Small integration/accessibility patch, applied to the pinned MIT source before building.
 * Audio synthesis, playback, project format and export logic are deliberately unchanged.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const directory = process.argv[2];
if (!directory) throw new Error("Pass the checked-out NeonDAW directory");
const html = join(directory, "index.html");
writeFileSync(
  html,
  readFileSync(html, "utf8").replace(
    ", maximum-scale=1.0, user-scalable=no",
    "",
  ),
);
const entry = join(directory, "src/main.tsx");
let main = readFileSync(entry, "utf8");
if (!main.includes("    <App />")) throw new Error("Unexpected NeonDAW entry");
main =
  "import {MotionConfig} from 'framer-motion';\n" +
  main.replace(
    "    <App />",
    '    <MotionConfig reducedMotion="user"><App /></MotionConfig>',
  );
writeFileSync(entry, main);
const css = join(directory, "src/index.css");
writeFileSync(
  css,
  readFileSync(css, "utf8") +
    "\n@media(max-width:767px){.card-sandwich h2,.card-sandwich .label-caps.truncate{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere}}\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }\n",
);
const grid = join(directory, "src/components/ChannelRack/StepGrid.tsx");
let source = readFileSync(grid, "utf8");
const selector = "      data-cell\n      data-ch={ch}";
if (!source.includes(selector)) throw new Error("Unexpected NeonDAW step grid");
source = source.replace(
  selector,
  `      data-cell
      role="button"
      tabIndex={0}
      aria-label={\`\${useProjectStore.getState().channels.find(channel => channel.id === ch)?.name ?? 'Channel'}: step \${i + 1}\`}
      aria-pressed={on}
      onKeyDown={event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        useProjectStore.getState().toggleStep(ch, i);
        if (!on) void engine.previewChannel(ch, velocity);
      }}
      data-ch={ch}`,
);
writeFileSync(grid, source);
console.log(
  "Applied reduced motion and keyboard step controls to pinned NeonDAW",
);
