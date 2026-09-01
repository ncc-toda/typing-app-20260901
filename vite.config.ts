import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
	fmt: {
		ignorePatterns: [
			"dist/**",
			"worker-configuration.d.ts",
			"prototypes/**",
			"docs/**",
		],
	},
	lint: {
		ignorePatterns: [
			"dist/**",
			"worker-configuration.d.ts",
			"prototypes/**",
		],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	plugins: lazyPlugins(() => [react(), cloudflare()]),
});
