import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,readdir,realpath,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {shell} from '../public/app-shell.mjs';
import {themeBootstrap} from '../public/theme-system.mjs';
import {languageBootstrap} from '../public/language-system.mjs';
import {launchBootstrap} from '../public/launch-screen.mjs';
import {APP_NAME,PUBLISHER_NAME} from '../public/brand.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const project='kolequant-age-pages';
const relativeAssets=text=>text.replaceAll('/assets/','./assets/');
const hash=text=>"'sha256-"+createHash('sha256').update(text).digest('base64')+"'";

export async function buildPages({directory=path.join(root,'dist-pages'),basePath='/geneticage/'}={}){
 if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath))throw Error('Use an absolute Pages directory path ending in /.');
 const output=path.resolve(directory);
 // Only replace this builder's own output, never a source directory or junction.
 if(path.basename(output)!=='dist-pages')throw Error('Pages output must be named dist-pages.');
 await mkdir(path.dirname(output),{recursive:true});
 try{
  const resolved=await realpath(output);
  if(resolved!==path.join(await realpath(path.dirname(output)),'dist-pages'))throw Error('Refusing to replace a linked output directory.');
  const entries=await readdir(output);
  if(entries.length){const info=JSON.parse(await readFile(path.join(output,'build-info.json'),'utf8'));if(info.project!==project)throw Error('Unrecognized Pages output.');}
  await rm(output,{recursive:true});
 }catch(error){if(error.code!=='ENOENT')throw error;}
 await mkdir(output);
 const bundled=await build({absWorkingDir:root,entryPoints:['public/app.mjs'],bundle:true,platform:'browser',format:'esm',target:'es2022',write:false,logLevel:'silent'});
 await writeFile(path.join(output,'app.js'),relativeAssets(bundled.outputFiles[0].text));
 // The publication contains public media/styles and the browser bundle only.
 const publicRoot=path.join(root,'public');
 for(const entry of await readdir(publicRoot,{withFileTypes:true})){
  if(entry.isDirectory()){
   if(entry.name==='assets')await cp(path.join(publicRoot,entry.name),path.join(output,entry.name),{recursive:true});
  }else if(/\.(css|svg)$/.test(entry.name)){
   await writeFile(path.join(output,entry.name),relativeAssets(await readFile(path.join(publicRoot,entry.name),'utf8')));
  }
 }
 const csp=["default-src 'self'",`script-src 'self' ${hash(themeBootstrap)} ${hash(languageBootstrap)} ${hash(launchBootstrap)}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data:","font-src 'self'","connect-src 'none'","form-action 'none'","base-uri 'self'","object-src 'none'"].join('; ');
 const html=`<!doctype html><html lang="en" data-hosting="pages"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base href="${basePath}"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><title>${APP_NAME}</title><meta name="application-name" content="${APP_NAME}"><meta name="apple-mobile-web-app-title" content="${APP_NAME}"><meta name="description" content="Explore ${APP_NAME} by ${PUBLISHER_NAME}. Answers stay in this page's memory."><meta name="theme-color" content="#090909"><link rel="icon" href="./favicon.svg"><link rel="manifest" href="./manifest.webmanifest"><script>${themeBootstrap}</script><script>${languageBootstrap}</script><script>${launchBootstrap}</script>${['styles','fonts','themes','app-screens','assessment-report','launch-screen'].map(name=>`<link rel="stylesheet" href="./${name}.css">`).join('')}</head><body>${relativeAssets(shell)}<script type="module" src="./app.js"></script></body></html>`;
 await Promise.all([
  writeFile(path.join(output,'index.html'),html),
  writeFile(path.join(output,'404.html'),html),
  writeFile(path.join(output,'.nojekyll'),''),
  writeFile(path.join(output,'manifest.webmanifest'),JSON.stringify({name:APP_NAME,short_name:APP_NAME,start_url:'./',scope:'./',display:'standalone',background_color:'#090909',theme_color:'#090909',icons:[{src:'./icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},null,2)),
  writeFile(path.join(output,'build-info.json'),JSON.stringify({project,basePath},null,2)),
 ]);
 return output;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log('Pages preview built: '+await buildPages());
