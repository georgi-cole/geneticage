import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['native/api-worker.mjs'],
  outfile: 'dist-native-worker/worker.mjs',
  format: 'esm',
  bundle: true,
  minify: true,
  target: 'es2022',
  external: ['node:*'],
  loader: { '.html': 'text', '.css': 'text' },
  plugins: [{
    name: 'support-scripts',
    setup(builder) {
      builder.onLoad({ filter: /[\\/]support[\\/](?:delete-account|sign-in-return)\.js$/ }, async ({ path }) => ({
        contents: await readFile(path, 'utf8'),
        loader: 'text',
      }));
    },
  }],
});
