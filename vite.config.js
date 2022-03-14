const path = require("path");

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      fileName: (format) => `${format}.js`,
      name: "VueFemtotween",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue",
        },
        // Since we are publishing index.ts, there's no point
        // in bloating sourcemaps with another copy of it
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    target: "esnext",
    minify: false,
  },
});
