import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {THEMES,THEME_KEY,DEFAULT_THEME,normalizeTheme,themeBootstrap} from './public/theme-system.mjs';
import {renderThemeHome} from './public/theme-home.mjs';
import {liquidElementFrames,liquidPaintPolygon} from './public/theme-motion.mjs';

assert.deepEqual(THEMES.map(t=>t.id),['black-metal','blood-moon','bionic']);
assert.equal(new Set(THEMES.map(t=>t.icon)).size,3);
assert.equal(DEFAULT_THEME,'blood-moon');

function boot(values={},blocked=false){
  const root={dataset:{},style:{}};
  vm.runInNewContext(themeBootstrap,{document:{documentElement:root},localStorage:{getItem(key){if(blocked)throw Error('blocked');return values[key]??null;}}});
  return root;
}
assert.equal(boot().dataset.theme,'blood-moon');
assert.equal(boot({},true).dataset.theme,'blood-moon');
assert.equal(boot({[THEME_KEY]:'invalid','kq-appearance-v1':'light'}).dataset.theme,'blood-moon');
assert.equal(boot({'kq-appearance-v1':'light'}).dataset.theme,'blood-moon');
assert.equal(boot({'kq-appearance-v1':'dark'}).dataset.theme,'blood-moon');
assert.equal(boot({[THEME_KEY]:'futuristic'}).dataset.theme,'bionic');
assert.equal(normalizeTheme('futuristic'),'bionic');
for(const archived of ['royal-purple','silverbolt','moonshine']){
  assert.equal(boot({[THEME_KEY]:archived}).dataset.theme,'blood-moon');
  assert.equal(normalizeTheme(archived),'blood-moon');
}
for(const theme of THEMES){
  const result=boot({[THEME_KEY]:theme.id,'kq-appearance-v1':'light'});
  assert.equal(result.dataset.theme,theme.id);
  assert.equal(result.dataset.appearance,theme.id);
  assert.equal(result.style.colorScheme,theme.scheme);
  assert.equal(normalizeTheme(theme.id),theme.id);
}
assert.equal(normalizeTheme('<script>'),'blood-moon');
assert.equal(normalizeTheme(null,'system'),'blood-moon');

// New material paints at full opacity across a curved edge; the interface never moves.
for(const incoming of [true,false]){
 const frames=liquidElementFrames('surface',incoming,.7);
 assert.equal(frames[0].offset,0);assert.equal(frames.at(-1).offset,1);
 for(const frame of frames){assert.equal(frame.opacity,1);assert.equal(frame.filter,'none');assert.equal(frame.transform,'none');assert.match(frame.clipPath,/^polygon\(/);assert.ok(!frame.clipPath.includes('NaN'));}
 assert.notEqual(frames[0].clipPath,frames.at(-1).clipPath);
}
assert.notEqual(liquidPaintPolygon(.5,true,0),liquidPaintPolygon(.5,true,1),'Individual components have distinct liquid edges.');
const sharedHome=renderThemeHome({value:50,gap:'+5'});
for(const theme of THEMES)assert.equal(renderThemeHome({theme:theme.id,value:50,gap:'+5'}),sharedHome);
assert.match(sharedHome,/A look at the result/);assert.match(sharedHome,/Not your result/);assert.match(sharedHome,/data-action="assessments"/);
assert.ok(!sharedHome.includes('helix-sculpture'),'The decorative DNA spiral is retired.');
assert.match(sharedHome,/50/);assert.match(sharedHome,/Age at blood draw/);
assert.match(renderThemeHome({value:null,gap:'—'}),/unmeasured-mark/);
assert.ok(!renderThemeHome({value:null,gap:'—'}).includes('data-count-to'));
const css=await readFile('./public/themes.css','utf8');
const original=await readFile('./public/styles.css','utf8');
for(const theme of THEMES)assert.ok((css+original).includes(`[data-theme=${theme.id}]`));
console.log('Passed: three active themes, Blood Moon default, archived preference fallback, Bionic migration, saved/invalid/blocked-storage bootstrap, full-opacity liquid paint masks, a shared result instrument, and assessment navigation.');
