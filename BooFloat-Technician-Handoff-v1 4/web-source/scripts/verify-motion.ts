import {modes} from '../lib/motion';
const button=document.querySelector('#verify') as HTMLButtonElement,status=document.querySelector('#status')!,sheet=document.querySelector('#sheet') as HTMLCanvasElement,ctx=sheet.getContext('2d')!;
button.onclick=async()=>{button.disabled=true;const results=[];try{
  for(const [i,m] of modes.entries()){
    const name=`${String(i+1).padStart(2,'0')}-${m.id}`;status.textContent=name;
    const v=document.createElement('video');v.muted=true;v.preload='auto';
    const loaded=new Promise<void>((resolve,reject)=>{v.onloadeddata=()=>resolve();v.onerror=()=>reject(new Error(`Unreadable ${name}`));});v.src=`/__asset/${name}.webm`;await loaded;
    const checks=[];
    for(const [j,t] of [.25,2.05,3.4].entries()){
      const seeked=new Promise<void>(resolve=>{v.onseeked=()=>resolve()});v.currentTime=t;await seeked;ctx.drawImage(v,0,j*640,960,640);
      const pixels=ctx.getImageData(0,j*640,960,640).data;let checksum=0,white=0;
      for(let k=0;k<pixels.length;k+=16){checksum=(checksum+pixels[k]*3+pixels[k+1]*5+pixels[k+2]*7+k)%4294967296;if(pixels[k]>160&&pixels[k+1]>160&&pixels[k+2]>160)white++;}
      checks.push({time:v.currentTime,checksum,white});
    }
    if(m.id==='burst'){const png=await new Promise<Blob>(resolve=>sheet.toBlob(b=>resolve(b!)));await fetch('/__capture/17-burst-verified.png',{method:'POST',body:png});}
    results.push({id:m.id,width:v.videoWidth,height:v.videoHeight,checks,animated:new Set(checks.map(c=>c.checksum)).size===3});v.removeAttribute('src');v.load();
  }
  const report={ok:results.every(r=>r.animated&&r.width===960&&r.height===640),results};await fetch('/__capture/00-video-verification.json',{method:'POST',body:JSON.stringify(report)});status.textContent=JSON.stringify(report,null,2);document.body.dataset.complete=String(report.ok);
}catch(e){status.textContent=String(e);document.body.dataset.error=String(e);button.disabled=false;}};
