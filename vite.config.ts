import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  // The default keeps GitHub Pages available; Amvera explicitly builds at /.
  const env = loadEnv(mode, '.', '');
  const siteBase = (env.SITE_BASE_PATH || '/creative_music_art_startup/').replace(/^\/+|\/+$/g, '');
  return {
    plugins: [react()],
    define: { __SITE_REVISION__: JSON.stringify(Date.now().toString(36)) },
    base: siteBase ? `/${siteBase}/` : '/',
  };
});
