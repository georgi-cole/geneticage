import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildPages} from '../scripts/build-pages.mjs';
import {createPagesServer} from '../scripts/serve-pages.mjs';
import {themeBootstrap} from '../public/theme-system.mjs';
import {languageBootstrap} from '../public/language-system.mjs';
import {launchGateStyles} from '../public/launch-screen.mjs';

test('Pages export works under the project path and publishes only static browser resources',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'kq-pages-'));
 let server;
 try{
  const output=await buildPages({directory:path.join(directory,'dist-pages')});
  const files=await readdir(output);
  assert.ok(!files.includes('api')&&!files.includes('lib')&&!files.includes('app.mjs'));
  const html=await readFile(path.join(output,'index.html'),'utf8');
  assert.match(html,/<base href="\/geneticage\/">/);assert.match(html,/data-hosting="pages"/);
  assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
  assert.match(html,/<html[^>]+data-launch="pending"/);
  assert.ok(html.indexOf(launchGateStyles)>0&&html.indexOf(launchGateStyles)<html.indexOf('<body>'));
  for(const script of [themeBootstrap,languageBootstrap])assert.ok(html.includes('sha256-'+createHash('sha256').update(script).digest('base64')));
  assert.ok(!html.includes('src="/assets/'));
  const bundle=await readFile(path.join(output,'app.js'),'utf8');
  assert.ok(!bundle.includes('"/assets/'));assert.ok(!bundle.includes('ASSESSMENT_ENCRYPTION_KEY'));
  server=await createPagesServer(output);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  assert.equal((await fetch(origin+'/',{redirect:'manual'})).headers.get('location'),'/geneticage/');
  for(const filename of ['index.html','app.js','themes.css','launch-screen.css','assets/kolequant-mark.webp','manifest.webmanifest'])assert.equal((await fetch(origin+'/geneticage/'+filename)).status,200,filename);
  assert.match((await fetch(origin+'/geneticage/app.js')).headers.get('content-type'),/javascript/);
  const missing=await fetch(origin+'/geneticage/missing');assert.equal(missing.status,404);assert.equal(await missing.text(),html);
  // A second build replaces only a recognized, non-linked output directory.
  await buildPages({directory:output});
  await assert.rejects(buildPages({directory,basePath:'/geneticage/'}),/must be named dist-pages/);
  await assert.rejects(buildPages({directory:output,basePath:'/../'}),/absolute Pages/);
 }finally{
  if(server)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
  await rm(directory,{recursive:true,force:true});
 }
});
