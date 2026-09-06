import {createServer} from 'vite';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const destination=resolve(root,'../deliverables/BooFloat-18-Motions');await mkdir(destination,{recursive:true});
const server=await createServer({root,configFile:false,server:{host:'127.0.0.1',port:3010,strictPort:true,watch:{usePolling:true}},plugins:[{name:'local-motion-export',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  const asset=req.url?.match(/^\/__asset\/([0-9]{2}-[a-z-]+\.(?:webm|png))$/);
  if(asset&&req.method==='GET'){try{res.setHeader('Content-Type',asset[1].endsWith('webm')?'video/webm':'image/png');res.end(await readFile(resolve(destination,asset[1])));}catch{res.statusCode=404;res.end();}return;}
  const match=req.url?.match(/^\/__capture\/([0-9]{2}-[a-z-]+\.(?:webm|png|json))$/);if(!match)return next();
  if(req.method!=='POST'||(req.headers.origin&&req.headers.origin!=='http://127.0.0.1:3010')){res.statusCode=403;res.end();return;}
  try{const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>30*1024*1024)throw new Error('File too large');parts.push(part);}await writeFile(resolve(destination,match[1]),Buffer.concat(parts));console.log('SAVED',match[1],size);res.end('ok');}catch(e){res.statusCode=500;res.end(String(e));}
})}}]});await server.listen();console.log('Capture: http://127.0.0.1:3010/scripts/capture.html');
