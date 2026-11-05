import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const loaderRequire=createRequire(require.resolve('@esbuild-kit/core-utils'));
const parserRequire=createRequire(require.resolve('@typescript-eslint/typescript-estree'));

test('scoped minimatch upgrade bounds pattern expansion and preserves parser glob behavior',async()=>{
 const {Minimatch,minimatch}=parserRequire('minimatch');
 assert.equal(parserRequire('minimatch/package.json').version,'11.0.4');
 for(const fragment of ['**/../a/b','x/**/../a/b']){
  const matcher=new Minimatch(Array(7).fill(fragment).join('/'),{optimizationLevel:2,braceExpandMax:64});
  assert.ok(matcher.globParts.length<=64,'expansion stays within the requested work limit');
 }
 for(const [file,pattern,options] of [
  ['.config.js','*.js',{dot:true}],['src/file.ts','src/*.{ts,tsx}',{}],
  ['src/file.ts','src/!(*.test).ts',{}],['C:/project/src/file.ts','C:/**/file.ts',{platform:'win32'}],
 ])assert.equal(minimatch(file,pattern,options),true);
 assert.equal(minimatch('src/file.test.ts','src/!(*.test).ts'),false);
 const directory=await mkdtemp(path.join(tmpdir(),'kq-parser-'));
 const parser=require('@typescript-eslint/typescript-estree');
 try{
  const code='const answer = 42;';
  await writeFile(path.join(directory,'.config.js'),code);
  const options={filePath:path.join(directory,'.config.js'),tsconfigRootDir:directory,projectService:{allowDefaultProject:['*.js']}};
  assert.ok(parser.parseAndGenerateServices(code,options).services.program);
  assert.throws(()=>parser.parseAndGenerateServices(code,{...options,filePath:path.join(directory,'blocked.ts')}),/not found.*project service/is);
 }finally{parser.clearProgramCache();await rm(directory,{recursive:true,force:true});}
});

test('patched esbuild keeps TS loader transforms and source maps working',async()=>{
 assert.equal(loaderRequire('esbuild').version,'0.28.2');
 const core=require('@esbuild-kit/core-utils');
 const filename=path.join(tmpdir(),'съвместимост with spaces.ts');
 const source='export const answer: number = 42;';
 const sync=core.transformSync(source,filename);
 const context={module:{exports:{}}};vm.runInNewContext(sync.code,context);
 assert.equal(context.module.exports.answer,42);
 assert.ok(sync.map.sources.some(file=>file.includes('съвместимост with spaces.ts')));
 const asyncResult=await core.transform(source,filename);
 const imported=await import('data:text/javascript;base64,'+Buffer.from(asyncResult.code).toString('base64'));
 assert.equal(imported.answer,42);assert.ok(asyncResult.map.sourcesContent.includes(source));
 const dynamic=await core.transform('export const load = () => import("node:path");',filename);
 assert.match(dynamic.code,/import\(/);
});

test('esbuild serves normal files without granting an unrelated origin read access',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'kq-cors-'));
 const esbuild=loaderRequire('esbuild');
 const context=await esbuild.context({stdin:{contents:'console.log("synthetic fixture")'},write:false});
 try{
  await writeFile(path.join(directory,'fixture.txt'),'Synthetic compatibility fixture.');
  const server=await context.serve({host:'127.0.0.1',port:0,servedir:directory});
  const url='http://127.0.0.1:'+server.port+'/fixture.txt';
  assert.equal((await fetch(url)).status,200);
  for(const origin of ['https://untrusted.invalid','null']){
   const response=await fetch(url,{headers:{Origin:origin}});
   assert.equal(response.headers.get('access-control-allow-origin'),null);
   assert.equal(response.headers.get('access-control-allow-credentials'),null);
  }
 }finally{await context.dispose();await rm(directory,{recursive:true,force:true});}
});
