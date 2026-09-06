export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function exportFrame(canvas:HTMLCanvasElement,name:string){canvas.toBlob(blob=>{if(blob)downloadBlob(blob,`${name}.png`);},'image/png');}
export async function recordMotion(canvas:HTMLCanvasElement,name:string,duration=4800){
  const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!type)throw new Error('当前浏览器不支持视频导出');
  const stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:5000000});
  const chunks:BlobPart[]=[];
  return new Promise<void>((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onerror=()=>{clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());reject(new Error('视频录制失败'));};
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());downloadBlob(new Blob(chunks,{type}),`${name}.${type.includes('mp4')?'mp4':'webm'}`);resolve();};
    recorder.start();timer=setTimeout(()=>recorder.stop(),duration);
  });
}
