import adapter from "sveltekit-adapter-chrome-extension";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: null,
      precompress: false,
      manifest: "manifest.json",
    }),
    appDir: "app",
  },
  preprocess: vitePreprocess(),
  prerender: {
    entries: ["*"],
    default: true,
  },
};

export default config;
