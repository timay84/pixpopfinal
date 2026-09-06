export type Mode = 'idle'|'breathe'|'tilt-left'|'tilt-right'|'stretch'|'trail'|'comet'|'orbit'|'press'|'pulse'|'rebound'|'ripple'|'echo'|'sparkle'|'blink'|'twist'|'burst'|'reform';
export type ModeInfo = {id:Mode,title:string,en:string,input:string,feeling:string,visual:string,threshold:string};
export const modes:ModeInfo[] = [
  {id:'idle',title:'轻轻漂浮',en:'Gentle float',input:'无输入',feeling:'我就在这里。',visual:'圆顶轻轻起伏，八瓣裙摆交错摆动，自然眨眼。',threshold:'力度 < 9%；上下 ±0.085'},
  {id:'breathe',title:'深呼吸',en:'Slow breathing',input:'静置 6 秒',feeling:'跟着呼吸，慢下来。',visual:'闭眼，身体与底部蓝光同步呼吸，薄光环缓慢舒展。',threshold:'6 秒无输入；呼吸周期 4.8 秒'},
  {id:'tilt-left',title:'向左牵引',en:'Pull left',input:'向左轻推',feeling:'左边也有小风景。',visual:'头部向左探出，右侧裙摆被留住，蓝色核心稍后跟随。',threshold:'X < −0.09；力度 < 45%'},
  {id:'tilt-right',title:'向右牵引',en:'Pull right',input:'向右轻推',feeling:'跟着你，向右走。',visual:'向左动作的镜像：头部先向右，下摆和短尾延迟跟上。',threshold:'X > 0.09；力度 < 45%'},
  {id:'stretch',title:'弹力布幔',en:'Elastic stretch',input:'中幅拉动',feeling:'还可以，再长一点。',visual:'身体横向拉长，下摆像软硅胶被牵住，回程拉出柔软波浪。',threshold:'方向力度 45–68%；宽度最高 1.9 倍'},
  {id:'trail',title:'超长拖尾',en:'Long ghost trail',input:'大幅左右拉动',feeling:'把风拖得长长的。',visual:'七层幽灵残影和弧形丝带向后延伸，尾部逐渐变细透明。',threshold:'方向力度 ≥68%；尾长系数 2.8'},
  {id:'comet',title:'彗星冲刺',en:'Comet rush',input:'快速甩动',feeling:'嗖——出发！',visual:'头部领跑，蓝白长尾快速扫过，星点沿尾流喷出。',threshold:'速度 >2.8/s；尾长系数 3.6'},
  {id:'orbit',title:'绕圈漂浮',en:'Orbital dance',input:'连续画圈',feeling:'绕一圈，再见到你。',visual:'幽灵沿椭圆绕行，光带跟随轨迹形成完整环绕。',threshold:'连续转向累计 >4.7 弧度'},
  {id:'press',title:'软软压扁',en:'Pressure squish',input:'向下加压',feeling:'软软地，摊开。',visual:'从圆润到扁平，底部贴住同一水平面，挤眼，裙摆向两侧铺开。',threshold:'压力 12–82%；高度最低 24%'},
  {id:'pulse',title:'蓄力震颤',en:'Overload tremble',input:'接近极限',feeling:'快……撑不住啦。',visual:'压成薄饼，高频小幅颤动；蓝光变亮，边缘出现桃红预警光。',threshold:'压力 82–92%；震颤幅度 0.025'},
  {id:'rebound',title:'弹跳回弹',en:'Spring rebound',input:'加压后松开',feeling:'啵，弹起来！',visual:'先保留压扁姿态，再拉高弹起、落下小弹两次，恢复原形。',threshold:'释放；约 2.4 秒收敛'},
  {id:'ripple',title:'涟漪扩散',en:'Ripple release',input:'快速松手',feeling:'一圈，一圈，荡开。',visual:'脚下连续三圈蓝白光环向外扩大并淡出，裙摆跟着回响。',threshold:'压力下降速度 >2.5/s'},
  {id:'echo',title:'幽灵分身',en:'Ghost echoes',input:'连续左右反转',feeling:'刚刚的我，还没走远。',visual:'三个带眼睛的半透明分身错时左右散开，再追上主体。',threshold:'1.2 秒内反向 ≥3 次'},
  {id:'sparkle',title:'星屑绽放',en:'Starlight bloom',input:'连续轻捏',feeling:'一点点，亮晶晶。',visual:'完整幽灵轻跳，青蓝、蜜桃与金色星屑从身体周围放射散开。',threshold:'1.5 秒内轻捏 ≥3 次'},
  {id:'blink',title:'眨眼点头',en:'Blink & nod',input:'轻触后松开',feeling:'收到啦。',visual:'双眼闭合再睁开，圆顶点头一次，下摆轻轻摆动。',threshold:'轻触 <250ms；压力 <45%'},
  {id:'twist',title:'旋风拧转',en:'Silicone twist',input:'快速上下往返',feeling:'转起来，松一下。',visual:'布幔从头到下摆逐层扭转，螺旋光带绕身上升，随后解开。',threshold:'1 秒内纵向反转 ≥3 次'},
  {id:'burst',title:'极限爆开',en:'Pressure pop',input:'持续极限加压',feeling:'啵！全部释放。',visual:'从薄饼爆成白色硅胶碎片和蓝色星屑，主体短暂消失；冲击环扩散后碎片聚回。',threshold:'压力 ≥92% 持续120ms；只触发一次'},
  {id:'reform',title:'碎光重生',en:'Gather & return',input:'爆开后自动',feeling:'又是完整的我。',visual:'四散碎片旋转着向中心汇聚，幽灵由小变大，蓝色核心重新亮起。',threshold:'爆开后 1.1–2.4 秒；低于20%重新蓄力'},
];
export const CYCLE=4.8;
export const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:0));
const smooth=(a:number,b:number,n:number)=>{const v=clamp((n-a)/(b-a));return v*v*(3-2*v)};
export type Motion={mode:Mode,started:number,inputX:number,inputY:number,manual:boolean,pressed:boolean,pressure:number,paused:boolean,settle:boolean,releaseX:number,releaseY:number,releaseSquish:number,releaseSx:number,releaseSy:number,releasePull:number,oneShot:boolean};
export function newMotion(mode:Mode='idle'):Motion{return {mode,started:typeof performance!=='undefined'?performance.now():0,inputX:0,inputY:0,manual:false,pressed:false,pressure:0,paused:false,settle:false,releaseX:0,releaseY:0,releaseSquish:0,releaseSx:1,releaseSy:1,releasePull:0,oneShot:false}}
export function getPose(m:Motion,now:number){
  const t=Math.max(0,(now-m.started)/1000),phase=t%CYCLE,angle=phase/CYCLE*Math.PI*2;
  let x=0,y=Math.sin(angle)*.085,sx=1,sy=1,rotation=0,trail=0,squish=0,inputX=0,inputY=0,pull=0;
  let glow=0,tailLength=1,ripple=0,sparkle=0,blink=false,wobble=0,orbit=0,twist=0,echo=0,scatter=0,bodyScale=1,overload=0,burstAge=-1;
  const calm=m.mode==='breathe';
  if(m.manual){inputX=m.inputX;inputY=m.inputY;squish=clamp(m.pressure);}
  else switch(m.mode){
    case 'breathe':{const b=Math.sin(angle);sx=1+b*.075;sy=.98+b*.085;y=b*.09;glow=.25+(b+1)*.18;ripple=(b+1)*.12;break;}
    case 'tilt-left':inputX=-.36-.12*Math.sin(angle);break;
    case 'tilt-right':inputX=.36+.12*Math.sin(angle);break;
    case 'stretch':inputX=Math.sin(angle)*.68;break;
    case 'trail':inputX=Math.sin(angle)*.95;inputY=Math.cos(angle)*-.12;break;
    case 'comet':inputX=Math.tanh(Math.sin(angle)*3)*.98;inputY=-.08;break;
    case 'orbit':inputX=Math.sin(angle)*.55;inputY=Math.cos(angle)*.50;break;
    case 'press':squish=.16+(.5-.5*Math.cos(angle))*.66;break;
    case 'pulse':squish=.84+Math.sin(phase*5)*.065;break;
    case 'rebound':{const a=phase%2.4;if(a<.5)squish=.8;else{const d=a-.5,b=Math.sin(d*8)*Math.exp(-2.8*d);y=b*1.05;sx=1-b*.28;sy=1+b*.55;ripple=clamp(b);}break;}
    case 'ripple':ripple=1;y=Math.sin(angle*2)*.15;break;
    case 'echo':inputX=Math.sin(angle)*.4;echo=1;break;
    case 'sparkle':sparkle=1;y=Math.abs(Math.sin(angle*2))*.45;sy=1+Math.sin(angle*4)*.08;break;
    case 'blink':{const a=phase%2.4;blink=a>.3&&a<.52;wobble=Math.sin(a*9)*Math.exp(-2*a);sx=1+wobble*.06;sy=1-wobble*.1;break;}
    case 'twist':twist=Math.sin(angle)*1.35;y=Math.sin(angle*2)*.12;sy=1+Math.abs(Math.sin(angle))*.2;break;
    case 'burst':{if(m.oneShot)burstAge=t;else if(phase<1.4)squish=.1+.88*smooth(0,1.4,phase);else burstAge=phase-1.4;break;}
    case 'reform':burstAge=m.oneShot?2.4:1.05+phase*.42;break;
  }
  if(m.mode==='trail')tailLength=3.4;
  if(m.mode==='comet'){tailLength=4.2;glow=.7;sparkle=.35;}
  if(m.mode==='orbit')orbit=1;
  const strength=clamp(Math.hypot(inputX,inputY));
  if(strength){x=inputX*1.48;y=-inputY*.9+Math.sin(t*11)*Math.abs(inputX)*.045;sx=1+Math.abs(inputX)*1.28+Math.sin(t*13)*Math.abs(inputX)*.045;sy=1-Math.abs(inputX)*.44+Math.max(0,-inputY)*.3;rotation=-inputX*.22+Math.sin(t*9)*inputX*.022;pull=inputX;trail=clamp((strength-.20)/.8);}
  if(orbit){sx=1.02;sy=1.04;pull=inputX*.25;trail=.12;}
  if(echo){sx=1;sy=1;pull*=.15;trail=0;}
  if(squish){sx=1+squish*.76;sy=1-squish*.88;y=-1.08*(1-sy);trail=0;pull=0;glow=squish*.6;overload=smooth(.78,.98,squish);wobble=Math.sin(t*65)*overload*.2;}
  if(m.mode==='rebound'&&m.settle){const a=t,b=Math.sin(a*8)*Math.exp(-3.4*a),r=Math.cos(a*8)*Math.exp(-4.2*a);x=m.releaseX*Math.cos(a*7.8)*Math.exp(-3.8*a);y=m.releaseY*Math.exp(-5*a)+b*(.28+m.releaseSquish*.85);sx=1+(m.releaseSx-1)*r;sy=1+(m.releaseSy-1)*r+b*m.releaseSquish*.22;pull=m.releasePull*r;rotation=-pull*.18;trail=Math.abs(pull)*.5;ripple=Math.max(0,b);}
  if(burstAge>=0){const a=burstAge;scatter=a<.10?smooth(0,.10,a):a<1.12?1:1-smooth(1.12,2.25,a);bodyScale=a<.08?1:a<1.30?0:smooth(1.30,2.42,a);squish=a<.08?.99:0;sx=a<.08?1.9:1;sy=a<.08?.11:1;y=a<.08?-.95:0;glow=.4+scatter*1.1;overload=0;ripple=a<1.45?1:0;sparkle=1;wobble=Math.sin(a*27)*scatter*.11;}
  return {x,y,sx,sy,rotation,trail,squish,calm,inputX,inputY,pull,strength:Math.max(strength,squish),t,phase,glow,tailLength,ripple,sparkle,blink,wobble,orbit,twist,echo,scatter,bodyScale,overload,burstAge};
}
