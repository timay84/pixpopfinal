import {clamp,getPose,newMotion,type Motion,type Mode} from './motion';
export type InputSample={x:number,y:number,pressure:number};
export function parseSensorLine(line:string):InputSample|null{
  let data:Record<string,unknown>;
  try {data=JSON.parse(line);} catch {data=Object.fromEntries([...line.matchAll(/\b(x|y|p|pressure|pressed|sw|button)\s*[:=]\s*(-?[\d.]+|true|false)\b/gi)].map(m=>[m[1].toLowerCase(),m[2]]));}
  if(!data||typeof data!=='object'||!['x','y','p','pressure','pressed','sw','button'].some(k=>k in data))return null;
  const rawX=Number(data.x??0),rawY=Number(data.y??0),raw=data.pressure??data.p??data.pressed??data.sw??data.button??0;
  const x= Math.abs(rawX)>1.25?(rawX-2048)/2048:rawX;
  const y= Math.abs(rawY)>1.25?(rawY-2048)/2048:rawY;
  const pressure=raw===true||raw==='true'?1:raw===false||raw==='false'?0:Number(raw);
  if(![x,y,pressure].every(Number.isFinite))return null;
  return {x:clamp(x,-1,1),y:clamp(y,-1,1),pressure:clamp(pressure)};
}
export function createInputController(ref:{current:Motion}){
  let input:InputSample={x:0,y:0,pressure:0},hold=false,holdAt=0,thresholdAt=-1,armed=true,lastAt=0,lastActive=0;
  let lastX=0,lastY=0,lastPressure=0,lastSignX=0,lastSignY=0,lastAngle:number|null=null,turn=0,turnAt=0,activeSince=0;
  let flipsX:number[]=[],flipsY:number[]=[],taps:number[]=[];
  let accent:Mode|null=null,accentUntil=0;
  function select(mode:Mode,now:number,manual=false){if(ref.current.mode!==mode||ref.current.manual!==manual)ref.current={...newMotion(mode),started:now,manual};}
  function release(now:number){const m=ref.current;if(!m.manual)return;const p=getPose(m,now);ref.current={...newMotion('rebound'),started:now,settle:true,releaseX:p.x,releaseY:p.y,releaseSx:p.sx,releaseSy:p.sy,releasePull:p.pull,releaseSquish:p.squish};}
  return {
    set(sample:InputSample,now:number){input={x:clamp(sample.x,-1,1),y:clamp(sample.y,-1,1),pressure:clamp(sample.pressure)};hold=false;if(!activeSince)activeSince=now;},
    hold(now:number){hold=true;holdAt=now;activeSince=now;input={x:0,y:0,pressure:0};},
    end(now:number){hold=false;input={x:0,y:0,pressure:0};release(now);},
    reset(){hold=false;input={x:0,y:0,pressure:0};thresholdAt=-1;armed=true;accent=null;activeSince=0;lastPressure=0;lastActive=0;lastSignX=0;lastSignY=0;flipsX=[];flipsY=[];taps=[];turn=0;},
    tick(now:number){
      const dt=Math.max(.016,(now-(lastAt||now))/1000);lastAt=now;
      const down=input.y>0&&input.y>Math.abs(input.x)*.9?clamp(input.y):0;
      const pressure=Math.max(input.pressure,down,hold?clamp((now-holdAt)/1600):0),direction=Math.hypot(input.x,Math.min(0,input.y));
      if(pressure<.2){armed=true;thresholdAt=-1;}
      if(ref.current.mode==='burst'&&ref.current.oneShot){if(now-ref.current.started<2450)return;if(pressure>.2){select('reform',now);ref.current.oneShot=true;return;}select('idle',now);}
      if(ref.current.mode==='reform'&&ref.current.oneShot){if(pressure>.2)return;select('idle',now);}
      if(pressure>=.92&&armed){if(thresholdAt<0)thresholdAt=now;if(now-thresholdAt>=120){ref.current={...newMotion('burst'),started:now,oneShot:true};armed=false;lastActive=now;return;}}
      else if(pressure<.92)thresholdAt=-1;
      const speed=Math.hypot(input.x-lastX,input.y-lastY)/dt,drop=(lastPressure-pressure)/dt;
      const sx=Math.abs(input.x)>.3?Math.sign(input.x):0,sy=Math.abs(input.y)>.3?Math.sign(input.y):0;
      if(sx&&lastSignX&&sx!==lastSignX)flipsX.push(now);if(sx)lastSignX=sx;
      if(sy&&lastSignY&&sy!==lastSignY)flipsY.push(now);if(sy)lastSignY=sy;
      flipsX=flipsX.filter(t=>now-t<1200);flipsY=flipsY.filter(t=>now-t<1000);
      if(pressure>.12&&lastPressure<=.12)taps.push(now);taps=taps.filter(t=>now-t<1500);
      if(Math.hypot(input.x,input.y)>.35){const a=Math.atan2(input.y,input.x);if(lastAngle!==null){const delta=Math.atan2(Math.sin(a-lastAngle),Math.cos(a-lastAngle));turn+=Math.abs(delta);}lastAngle=a;if(now-turnAt>3000){turn=0;turnAt=now;}}else lastAngle=null;
      if(taps.length>=3){accent='sparkle';accentUntil=now+1800;taps=[];}
      else if(flipsY.length>=3){accent='twist';accentUntil=now+1800;flipsY=[];}
      else if(flipsX.length>=3){accent='echo';accentUntil=now+1600;flipsX=[];}
      else if(turn>4.7){accent='orbit';accentUntil=now+2000;turn=0;}
      lastX=input.x;lastY=input.y;
      const previousPressure=lastPressure;lastPressure=pressure;
      if(pressure>.09){select(pressure>=.82?'pulse':'press',now,true);Object.assign(ref.current,{pressure,pressed:true,inputX:0,inputY:0});lastActive=now;return;}
      if(accent&&now<accentUntil){select(accent,now);lastActive=now;return;}accent=null;
      if(direction>.09){const mode:Mode=speed>2.8&&direction>.6?'comet':direction>.68?'trail':direction>.45?'stretch':input.x<0?'tilt-left':'tilt-right';select(mode,now,true);Object.assign(ref.current,{inputX:input.x,inputY:Math.min(0,input.y),pressure:0,pressed:false});lastActive=now;return;}
      if(previousPressure>.09){if(drop>2.5&&previousPressure>.45){select('ripple',now);ref.current.oneShot=true;}else if(previousPressure<.45&&now-activeSince<250){select('blink',now);ref.current.oneShot=true;}else release(now);activeSince=0;lastActive=now;}
      if(ref.current.manual)release(now);
      if(lastActive&&now-lastActive>6000)select('breathe',now);
      else if((ref.current.settle||ref.current.oneShot)&&now-ref.current.started>2450)select('idle',now);
    }
  };
}
