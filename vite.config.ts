import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const isVitest = Boolean(process.env.VITEST);

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "dist/**",
      "worker-configuration.d.ts",
      "prototypes/**",
      "docs/**",
      ".agents/**",
      ".cursor/**",
    ],
  },
  lint: {
    ignorePatterns: [
      "dist/**",
      "worker-configuration.d.ts",
      "prototypes/**",
      ".agents/**",
      ".cursor/**",
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  // Vitest は Node 用 resolve.external を入れるため、Workers プラグインと同時に使えない。
  plugins: isVitest ? [react()] : lazyPlugins(() => [react(), cloudflare()]),
});
