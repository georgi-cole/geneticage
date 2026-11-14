import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildPages} from './build-pages.mjs';

// File previews use the same browser bundle and Pages mode, without a server.
await buildPages();
let html = await readFile(new URL('../dist-pages/index.html', import.meta.url), 'utf8');
const bundle = (await readFile(new URL('../dist-pages/app.js', import.meta.url), 'utf8'))
  .replace(/<\/script/gi, '<\\/script');
html = html.replace('<base href="/geneticage/">', '<base href="./">')
  .replace('<script type="module" src="./app.js"></script>', () => `<script type="module">${bundle}</script>`)
  .replace(/<link rel="manifest"[^>]*>/, '');
const stylesheetLinks = [...html.matchAll(/<link rel="stylesheet" href="\.\/([^"/]+\.css)">/g)];
for (const [link, filename] of stylesheetLinks) {
  let css = await readFile(new URL(`../dist-pages/${filename}`, import.meta.url), 'utf8');
  // Fonts are fetched with CORS even on file URLs; embed their bytes instead.
  const fonts = [...css.matchAll(/url\((['"]?)([^)'"\s]+\.(?:woff2?|ttf))\1\)/g)];
  for (const [reference, , relative] of fonts) {
    const bytes = await readFile(new URL(relative, new URL(`../dist-pages/${filename}`, import.meta.url)));
    const type = relative.endsWith('.ttf') ? 'font/ttf' : relative.endsWith('.woff2') ? 'font/woff2' : 'font/woff';
    css = css.replace(reference, `url(data:${type};base64,${bytes.toString('base64')})`);
  }
  html = html.replace(link, () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
}
const hashes = [...html.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)]
  .map(([, source]) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`);
const policy = `default-src 'none'; script-src ${hashes.join(' ')}; style-src 'unsafe-inline'; img-src 'self' data: file:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'self'; object-src 'none'`;
html = html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, () => `<meta http-equiv="Content-Security-Policy" content="${policy}">`);
const target = new URL('../dist-pages/local-preview.html', import.meta.url);
await writeFile(target, html);
console.log(`Local preview: ${fileURLToPath(target)}`);
