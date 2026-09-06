'use client';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Check,ChevronsRight,Circle,Cable,Eye,Ghost,HeartPulse,Moon,Orbit,Pause,Play,RotateCcw,Sparkles,Wind,Waves,Zap,Expand,Download,Video,ExternalLink,ArrowLeftRight,Shell,Bomb} from 'lucide-react';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from '@/components/ui/tooltip';
import {createGhostScene} from '@/lib/ghost-scene';
import {modes,newMotion,getPose,CYCLE,type Motion,type Mode} from '@/lib/motion';
import {createInputController,parseSensorLine,type InputSample} from '@/lib/input-controller';
import {exportFrame,recordMotion} from '@/lib/export-motion';
import {useEnvironment,type Environment} from '@/lib/environment';
import {EnvironmentSwitch} from '@/components/environment-switch';

const icons=[Wind,Moon,ArrowLeft,ArrowRight,ArrowLeftRight,ChevronsRight,Zap,Orbit,ArrowDown,HeartPulse,ArrowUp,Waves,Ghost,Sparkles,Eye,Shell,Bomb,RotateCcw];
function GhostView({motion,lighting,mini=false}:{motion:RefObject<Motion>,lighting:RefObject<Environment>,mini?:boolean}){
  const host=useRef<HTMLDivElement>(null);const [error,setError]=useState(false);
  useEffect(()=>{if(!host.current)return;try{return createGhostScene(host.current,motion,mini,lighting)}catch(e){console.error(e);setError(true)}},[motion,lighting,mini]);
  return <div ref={host} className={mini?'ghost-view mini-view':'ghost-view main-view'}>{error&&<span className="render-error">3D 画面暂不可用，请启用浏览器硬件加速。</span>}</div>;
}
function MotionCard({mode,index,selected,onSelect,paused,lighting}:{mode:typeof modes[number],index:number,selected:boolean,onSelect:()=>void,paused:boolean,lighting:RefObject<Environment>}){
  const motion=useRef(newMotion(mode.id));useEffect(()=>{motion.current.paused=paused},[paused]);const Icon=icons[index];
  return <article className="motion-card" data-mode={mode.id} data-selected={selected}>
    <button className="card-preview" aria-label={`播放${mode.title}`} aria-pressed={selected} onClick={onSelect}>
      <span className="card-top"><span className="motion-number">{String(index+1).padStart(2,'0')}</span><Icon size={18}/></span>
      <GhostView motion={motion} lighting={lighting} mini/>
      <span className="card-title">{mode.title}<span>{selected?<Check size={15}/>:<Play size={14}/>}</span></span><span className="card-english">{mode.en}</span>
    </button>
    <div className="card-bottom"><span>{mode.input}</span><a href={`/?motion=${mode.id}&solo=1`} target="_blank" rel="noreferrer" aria-label={`单独打开${mode.title}`} title={`单独打开${mode.title}`}><ExternalLink size={16}/></a></div>
  </article>;
}
function Tool({label,onClick,children,pressed,disabled}:{label:string,onClick:()=>void,children:React.ReactNode,pressed?:boolean,disabled?:boolean}){
  return <Tooltip><TooltipTrigger render={<button className="icon-button" aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}/>}>{children}</TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}
type SerialPortLike={open:(options:{baudRate:number})=>Promise<void>,close:()=>Promise<void>,readable:ReadableStream<Uint8Array>};
export default function Home(){
  const {environment,environmentRef,setEnvironment}=useEnvironment(),motion=useRef(newMotion());
  const driver=useRef(createInputController(motion)),live=useRef(false);
  const [selected,setSelected]=useState<Mode>('idle'),[paused,setPaused]=useState(false),[auto,setAuto]=useState(false),[solo,setSolo]=useState(false),[recording,setRecording]=useState(false),[notice,setNotice]=useState('');
  const [readout,setReadout]=useState({x:0,y:0,strength:0,pressure:0});
  const [sensor,setSensor]=useState<'ready'|'connecting'|'connected'|'unsupported'|'error'>('ready');
  const serial=useRef<{reader:ReadableStreamDefaultReader<Uint8Array>|null,port:SerialPortLike|null,busy:boolean,closing:boolean}>({reader:null,port:null,busy:false,closing:false});
  const stage=useRef<HTMLElement>(null),stick=useRef<HTMLSpanElement>(null),keys=useRef(new Set<string>()),drag=useRef<{id:number,x:number,y:number,joystick:boolean}|null>(null);
  function choose(mode:Mode){driver.current.reset();live.current=false;motion.current=newMotion(mode);setSelected(mode);setPaused(false);}
  function startInput(){live.current=true;setAuto(false);setPaused(false);motion.current.paused=false;}
  function setInput(sample:InputSample){startInput();driver.current.set(sample,performance.now());}
  function release(){driver.current.end(performance.now());}
  function startPointer(e:React.PointerEvent,joystick=false){if(e.button!==0||drag.current||recording)return;e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,joystick};startInput();driver.current.hold(performance.now());}
  function movePointer(e:React.PointerEvent){const d=drag.current;if(!d||d.id!==e.pointerId)return;const range=d.joystick?46:Math.max(85,Math.min(190,(stage.current?.clientWidth??700)*.25));let x=(e.clientX-d.x)/range,y=(e.clientY-d.y)/range;const length=Math.hypot(x,y);if(length<.08)return;if(length>1){x/=length;y/=length;}setInput({x,y,pressure:e.pointerType==='pen'?e.pressure:0});}
  function endPointer(e:React.PointerEvent){if(drag.current?.id!==e.pointerId)return;drag.current=null;release();}
  useEffect(()=>{const query=new URLSearchParams(location.search);const id=query.get('motion')??document.documentElement.dataset.motion;if(modes.some(m=>m.id===id))choose(id as Mode);setSolo(query.get('solo')==='1'||document.documentElement.dataset.solo==='true');},[]);
  useEffect(()=>{let frame=0,lastRead=0;function tick(now:number){frame=requestAnimationFrame(tick);if(live.current&&!motion.current.paused)driver.current.tick(now);if(now-lastRead<60)return;lastRead=now;const m=motion.current,p=getPose(m,now);setSelected(m.mode);setReadout({x:Math.round(p.inputX*100),y:Math.round(-p.inputY*100),strength:Math.round(p.strength*100),pressure:Math.round(p.squish*100)});if(stick.current)stick.current.style.transform=`translate(${p.inputX*30}px,${(p.squish||p.inputY)*30}px) scale(${1-p.squish*.12})`;}frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[]);
  useEffect(()=>{if(!auto||paused)return;const timer=setInterval(()=>choose(modes[(modes.findIndex(m=>m.id===motion.current.mode)+1)%modes.length].id),CYCLE*1000);return()=>clearInterval(timer)},[auto,paused]);
  useEffect(()=>{const handled=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space'];
    function apply(){const k=keys.current;if(!k.size){release();return;}if(k.has('Space')||k.has('ArrowDown')||k.has('KeyS')){startInput();driver.current.hold(performance.now());return;}const x=Number(k.has('ArrowRight')||k.has('KeyD'))-Number(k.has('ArrowLeft')||k.has('KeyA')),y=-Number(k.has('ArrowUp')||k.has('KeyW'));setInput({x:x*.95,y:y*.85,pressure:0});}
    function down(e:KeyboardEvent){if(!handled.includes(e.code)||e.repeat||(e.target as HTMLElement).closest('input,textarea,select,button,a'))return;e.preventDefault();keys.current.add(e.code);apply();}
    function up(e:KeyboardEvent){if(keys.current.delete(e.code)){e.preventDefault();apply();}}
    function blur(){keys.current.clear();drag.current=null;release();}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)};
  },[]);
  async function disconnect(){serial.current.closing=true;await serial.current.reader?.cancel().catch(()=>{});}
  async function connectSensor(){
    if(serial.current.busy){if(sensor==='connected')await disconnect();return;}
    const api=(navigator as Navigator&{serial?:{requestPort:()=>Promise<SerialPortLike>}}).serial;
    if(!api){setSensor('unsupported');setNotice('请在支持串口连接的桌面浏览器中打开此网页。');return;}
    serial.current.busy=true;serial.current.closing=false;setSensor('connecting');let port:SerialPortLike|null=null,reader:ReadableStreamDefaultReader<Uint8Array>|null=null,failed=false;
    try{port=await api.requestPort();await port.open({baudRate:115200});reader=port.readable.getReader();serial.current.port=port;serial.current.reader=reader;setSensor('connected');const decoder=new TextDecoder();let buffer='';
      while(!serial.current.closing){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=(lines.pop()??'').slice(-4096);for(const line of lines){const sample=parseSensorLine(line);if(sample)setInput(sample);}}
    }catch(e){failed=!(e instanceof DOMException&&e.name==='NotFoundError');if(failed)setNotice('连接中断，请检查手柄后重新连接。');}
    finally{reader?.releaseLock();await port?.close().catch(()=>{});serial.current={reader:null,port:null,busy:false,closing:false};release();setSensor(failed?'error':'ready');}
  }
  useEffect(()=>()=>{void disconnect()},[]);
  const info=modes.find(m=>m.id===selected)??modes[0],index=modes.indexOf(info),name=`${String(index+1).padStart(2,'0')}-${selected}`;
  async function exportVideo(){const canvas=stage.current?.querySelector('canvas');if(!canvas||recording)return;setAuto(false);choose(selected);setRecording(true);try{await recordMotion(canvas,name);setNotice('单个动作视频已导出。');}catch(e){setNotice((e as Error).message)}finally{setRecording(false)}}
  function exportPNG(){const canvas=stage.current?.querySelector('canvas');if(canvas)exportFrame(canvas,name);}
  const isCalm=selected==='breathe',phaseLabel=selected==='burst'?'爆开 / 聚合':readout.pressure>=82?'极限蓄力':readout.pressure>9?'向下挤压':'自由动作';
  return <TooltipProvider delay={250}><main className={`boo-app ${solo?'solo-mode':''}`} data-environment={environment}>
    <header className="app-header"><a className="brand" href="/" aria-label="Boo Float 首页"><Ghost strokeWidth={1.8}/><span>Boo Float<span className="brand-dot">.</span></span></a>
      {solo?<a className="back-link" href="/"><ArrowLeft size={16}/>全部动作</a>:<ToggleGroup className="view-modes" value={[isCalm?'calm':'play']} onValueChange={v=>{if(v[0]){setAuto(false);choose(v[0]==='calm'?'breathe':'idle')}}}><ToggleGroupItem value="play" aria-label="自由玩耍"><Sparkles size={15}/><span>自由玩耍</span></ToggleGroupItem><ToggleGroupItem value="calm" aria-label="静心时刻"><Moon size={15}/><span>静心时刻</span></ToggleGroupItem></ToggleGroup>}
      <div className="header-environment"><button className={`sensor-button ${sensor}`} onClick={connectSensor} title={sensor==='connected'?'断开手柄':'连接手柄'} aria-label={sensor==='connected'?'断开手柄':'连接手柄'}><Cable size={16}/><span>{sensor==='connected'?'手柄已连接':sensor==='connecting'?'连接中':sensor==='error'?'重试连接':'连接手柄'}</span></button><EnvironmentSwitch value={environment} onChange={setEnvironment}/></div>
    </header>
    <section ref={stage} className={`playground ${isCalm?'calm':''}`} aria-label="幽灵互动舞台" onPointerDown={e=>startPointer(e)} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer}>
      <img className="cloudscape" src="/cloudscape.webp" alt="" draggable={false}/><div className="sky-wash"/>
      <div className="stage-heading"><span className="eyebrow">BOO / MOTION {String(index+1).padStart(2,'0')}</span><h1>{info.title}</h1><span className="handwritten">{info.en}</span></div>
      <GhostView motion={motion} lighting={environmentRef}/>
      <div className="stage-tools" onPointerDown={e=>e.stopPropagation()}><Tool label={paused?'继续动画':'暂停动画'} disabled={recording} pressed={paused} onClick={()=>{motion.current.paused=!paused;setPaused(!paused)}}>{paused?<Play size={18}/>:<Pause size={18}/>}</Tool><Tool label="重播当前动作" disabled={recording} onClick={()=>choose(selected)}><RotateCcw size={18}/></Tool><Tool label="导出当前帧 PNG" onClick={exportPNG}><Download size={18}/></Tool><Tool label={recording?'正在录制':'导出单个动作视频'} disabled={recording} onClick={exportVideo}><Video size={18}/></Tool>{!solo&&<a className="icon-button" href={`/?motion=${selected}&solo=1`} target="_blank" rel="noreferrer" aria-label="单独预览当前动作" title="单独预览当前动作"><Expand size={18}/></a>}</div>
      {recording&&<span role="status" className="recording-status">录制中 · 4.8s</span>}
      <div className="stage-caption"><Ghost size={19}/><span>{info.feeling}</span><i/></div>
      <div className="joystick-dock" onPointerDown={e=>e.stopPropagation()}><div className="joystick-base" onPointerDown={e=>startPointer(e,true)} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer} aria-label="方向与压力手柄"><span className="axis axis-h"/><span className="axis axis-v"/><span className="joystick-knob" ref={stick}><Circle size={19}/></span></div><button className="press-button" onPointerDown={e=>startPointer(e)} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer} onKeyDown={e=>{if(!e.repeat&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();startInput();driver.current.hold(performance.now())}}} onKeyUp={e=>{if(e.code==='Space'||e.code==='Enter')release()}}><ArrowDown size={16}/>加压</button></div>
    </section>
    <div className="live-strip"><span className="live-label"><i/>{phaseLabel}</span><span className="axis-readout">X <b>{readout.x}</b><span>Y <b>{readout.y}</b></span></span><div className={`strength ${readout.pressure>=82?'overload':''}`}><span>力度</span><span className="strength-track"><i style={{width:`${readout.strength}%`}}/><em/></span><b>{readout.strength}%</b></div><span className="live-source">{String(index+1).padStart(2,'0')} / 18</span></div>
    {notice&&<button className="notice" role="status" onClick={()=>setNotice('')}>{notice}<Check size={16}/></button>}
    {solo?<section className="solo-feedback"><div className="solo-nav"><a href={`/?solo=1&motion=${modes[(index+17)%18].id}`} aria-label="上一个动作"><ArrowLeft size={20}/></a><span>{String(index+1).padStart(2,'0')} / 18</span><a href={`/?solo=1&motion=${modes[(index+1)%18].id}`} aria-label="下一个动作"><ArrowRight size={20}/></a></div><dl><div><dt>动作输入</dt><dd>{info.input}</dd></div><div><dt>视觉反馈</dt><dd>{info.visual}</dd></div><div><dt>触发参数</dt><dd>{info.threshold}</dd></div></dl></section>:<>
      <section className="motion-library" aria-label="十八种幽灵动作"><div className="library-heading"><div><span className="eyebrow">MOTION COLLECTION / 18</span><h2>每一面，都有点不一样。</h2></div><button className={`sequence-button ${auto?'active':''}`} aria-pressed={auto} onClick={()=>{if(!auto)choose('idle');setAuto(!auto)}}>{auto?<Pause size={16}/>:<Play size={16}/>}<span>{auto?'停止轮播':'播放全套动作'}</span></button></div><div className="motion-grid">{modes.map((mode,i)=><MotionCard key={mode.id} mode={mode} index={i} selected={selected===mode.id} onSelect={()=>{setAuto(false);choose(mode.id);stage.current?.scrollIntoView({behavior:'smooth',block:'start'})}} paused={paused} lighting={environmentRef}/>)}</div></section>
      <section className="feedback-table" aria-label="动作视觉反馈对照表"><div className="library-heading"><div><span className="eyebrow">ACTION / RESPONSE</span><h2>动作与视觉反馈</h2></div></div><div className="table-scroll"><table><thead><tr><th>动作</th><th>输入</th><th>视觉反馈</th><th>触发条件</th></tr></thead><tbody>{modes.map((mode,i)=><tr key={mode.id}><td><strong>{String(i+1).padStart(2,'0')} {mode.title}</strong></td><td>{mode.input}</td><td>{mode.visual}</td><td>{mode.threshold}</td></tr>)}</tbody></table></div></section></>}
    <footer><span>Boo Float</span><p>Small moves. Lighter minds.</p><span className="footer-end">PLAY · RELEASE · RETURN<Ghost size={18}/></span></footer>
  </main></TooltipProvider>;
}
