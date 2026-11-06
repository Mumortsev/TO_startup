import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], define: { __SITE_REVISION__: JSON.stringify(Date.now().toString(36)) }, base: "/TO_startup/" });
