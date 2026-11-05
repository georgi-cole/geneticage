import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Explicit discovery keeps archived browser scripts out of the test process.
// Argument arrays work on Windows and Linux without shell glob expansion.
const root=fileURLToPath(new URL('../',import.meta.url));
const tests=[
 ...readdirSync(root).filter(name=>/^test-.*\.mjs$/.test(name)),
 ...readdirSync(new URL('../tests/',import.meta.url)).filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name),
].sort();
if(!tests.length)throw Error('No application tests were discovered.');
const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
