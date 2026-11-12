import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export async function createPagesServer(directory=fileURLToPath(new URL('../dist-pages/',import.meta.url))){
 const {basePath}=JSON.parse(await readFile(path.join(directory,'build-info.json'),'utf8'));
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
 return createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'&&basePath!=='/'){res.writeHead(302,{Location:basePath});res.end();return;}
  if(!pathname.startsWith(basePath)){res.writeHead(404);res.end();return;}
  try{
   const relative=decodeURIComponent(pathname.slice(basePath.length))||'index.html';
   const target=path.resolve(directory,relative);
   if(!target.startsWith(path.resolve(directory)+path.sep))throw Error('Invalid path');
   const data=await readFile(target);
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{
   res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(directory,'404.html')));
  }
 });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const port=Number(process.env.PAGES_PORT||4173);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('PAGES_PORT must be a valid port number.');
 const server=await createPagesServer();server.listen(port,'127.0.0.1',()=>console.log('Pages preview: http://127.0.0.1:'+port+'/geneticage/'));
}
