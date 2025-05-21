import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.callz.torndeck.sdPlugin";

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "src/plugin.ts",

  // 1) Use `dir` instead of `file`
  output: {
    dir:    `${sdPlugin}/bin`,    // emit into a folder instead of a single file
    format: "esm",                // keep module format (you already emit package.json as module)
    sourcemap: isWatching,
    sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
      url.pathToFileURL(
        path.resolve(path.dirname(sourcemapPath), relativeSourcePath)
      ).href,

    // 2) Inline any dynamic imports so you don’t ship extra .js files
    inlineDynamicImports: true,
  },

  plugins: [
    {
      name: "watch-externals",
      buildStart() {
        this.addWatchFile(`${sdPlugin}/manifest.json`);
      },
    },

    typescript({
      mapRoot: isWatching ? "./" : undefined,
    }),

    nodeResolve({
      browser:     false,
      exportConditions: ["node"],
      preferBuiltins:  true,
    }),

    commonjs(),

    // only minify in production
    !isWatching && terser(),

    {
      name: "emit-module-package-file",
      generateBundle() {
        this.emitFile({
          fileName: "package.json",
          source:   `{ "type": "module" }`,
          type:     "asset",
        });
      },
    },
  ],
};
