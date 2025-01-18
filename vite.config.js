import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

// export default defineConfig({
// 	plugins: [sveltekit()],
// 	optimizeDeps: {
// 		include: ['mermaid'],
// 	  },
// 	  envPrefix: 'MERMAID_'
// });

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: ["mermaid"],
  },
  envPrefix: "MERMAID_",
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "./src/lib"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{js,ts}"],
    // Svelteコンポーネントのテストに必要な設定
    // deps: {
    //   inline: ["mermaid"],
    // },
    deps: {
      optimizer: {
        web: {
          include: ["mermaid"]
        }
      }
    },
    coverage: {
      exclude: [
        "**/build/**",
        "**/.svelte-kit/**",
        "**/tests/**",
        "**.config.js",
        "**/estimateConnectionSpeed.js",
        "chromePackage.js",
        "vite.config.js",
        "src/routes/+layout.js",
        "src/routes/+page.js",
        "build.js",
        "static/background.js",
        "src/lib/index.js",
      ],
      reporter: ["text", "json-summary", "json"],
    },
    setupFiles: ["./tests/setup.js"],
  },
});
