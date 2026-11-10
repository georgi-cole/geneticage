import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
if(!process.env.npm_execpath)throw Error('Run npm ci or npm run report:install.');
const result=spawnSync(process.execPath,[process.env.npm_execpath,'ci','--prefix',fileURLToPath(new URL('../report-engine/',import.meta.url)),'--ignore-scripts','--no-fund','--no-audit'],{stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
