import {createGhostScene} from '../lib/ghost-scene';
import {modes,newMotion,getPose,CYCLE} from '../lib/motion';
const host=document.getElementById('stage')!,status=document.getElementById('status')!,button=document.getElementById('start') as HTMLButtonElement;
const motion={current:newMotion()},lighting={current:'dark' as const};
const sampleClock:{current:number|null}={current:null};
const stop=createGhostScene(host,motion,false,lighting,sampleClock);
const source=host.querySelector('canvas')!,composite=document.createElement('canvas');composite.width=960;composite.height=640;
const ctx=composite.getContext('2d')!;let frame=0;
function paint(){frame=requestAnimationFrame(paint);ctx.fillStyle='#18242c';ctx.fillRect(0,0,960,640);ctx.drawImage(source,0,0,960,640);}paint();
const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function save(name:string,data:Blob){const r=await fetch(`/__capture/${name}`,{method:'POST',body:data});if(!r.ok)throw new Error(await r.text());}
button.onclick=async()=>{button.disabled=true;try{
  for(const [i,mode] of modes.entries()){
    const name=`${String(i+1).padStart(2,'0')}-${mode.id}`;status.textContent=`正在导出 ${i+1} / 18 · ${mode.title}`;
    const samples:Record<string,number>={idle:.5,breathe:1.1,'tilt-left':1,'tilt-right':1,stretch:1.1,trail:1,comet:.65,orbit:1,press:2.2,pulse:.2,rebound:.72,ripple:1.2,echo:1.4,sparkle:1.1,blink:.38,twist:1.1,burst:2.05,reform:2.2};
    sampleClock.current=samples[mode.id];motion.current=newMotion(mode.id);
    const before=Number(host.dataset.frame||0);await delay(650);
    while(Number(host.dataset.frame||0)<before+8||host.dataset.motion!==mode.id)await delay(100);
    const png=await new Promise<Blob>(resolve=>source.toBlob(b=>resolve(b!),'image/png'));await save(`${name}.png`,png);
    await save(`${name}-frame.json`,new Blob([JSON.stringify({id:mode.id,sample:samples[mode.id],actual:JSON.parse(host.dataset.pose!),frame:Number(host.dataset.frame)},null,2)],{type:'application/json'}));
    if(new URLSearchParams(location.search).has('frames'))continue;
    sampleClock.current=null;motion.current=newMotion(mode.id);const stream=composite.captureStream(24),chunks:BlobPart[]=[];
    const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))!;
    const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    const done=new Promise<void>(resolve=>{recorder.onstop=()=>resolve()});recorder.start();await delay(CYCLE*1000);recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
    await save(`${name}.webm`,new Blob(chunks,{type:mimeType}));
    const meta={id:mode.id,frames:Number(host.dataset.frame),bytes:chunks.reduce((n,b)=>n+(b as Blob).size,0),pose:getPose(motion.current,performance.now())};
    await save(`${name}.json`,new Blob([JSON.stringify(meta,null,2)],{type:'application/json'}));
  }
  status.textContent='导出完成：18 个 WebM + 18 个透明 PNG';document.body.dataset.complete='true';button.textContent='导出完成';
}catch(e){status.textContent=String(e);document.body.dataset.error=String(e);button.disabled=false;}};
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);stop()});
