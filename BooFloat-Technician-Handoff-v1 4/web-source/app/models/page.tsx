'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {Download,ArrowLeft,RotateCcw,Play,Pause} from 'lucide-react';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {createReferenceGhost} from '@/lib/reference-ghost';
import {useEnvironment} from '@/lib/environment';
import {EnvironmentSwitch} from '@/components/environment-switch';
import {createSoftGlow} from '@/lib/soft-glow';
import './models.css';

export default function Models(){
  const {environment,environmentRef,setEnvironment}=useEnvironment();
  const [kind,setKind]=useState('float');const [spin,setSpin]=useState(false);const [view,setView]=useState('front');
  const host=useRef<HTMLDivElement>(null);const state=useRef({spin,view});state.current={spin,view};
  useEffect(()=>{
    const el=host.current!;const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(0,.55,6.4);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3.5;controls.maxDistance=10;controls.target.set(0,.02,0);
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
    const ambient=new THREE.HemisphereLight('#ffffff','#b3b9c9',1.1);scene.add(ambient);const light=new THREE.DirectionalLight('#fff9f4',2);light.position.set(-3,5,4);scene.add(light);
    const fill=new THREE.DirectionalLight('#d3e3ff',2);fill.position.set(3,1,-3);scene.add(fill);
    const model=createReferenceGhost(kind);scene.add(model.group);
    const underlight=new THREE.PointLight('#589aff',kind==='float'?8:0,4,2);underlight.position.set(0,-1.15,1.6);scene.add(underlight);
    const glow=createSoftGlow(model.group,kind==='float');
    const floor=new THREE.Mesh(new THREE.CircleGeometry(1.05,80),new THREE.MeshBasicMaterial({color:'#747f99',transparent:true,opacity:.055,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=kind!=='boo'?-1.115:-.89;floor.scale.y=.8;scene.add(floor);
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.setLength(w<500?8:6.4);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    let raf=0,lastView='',last=0,night=environmentRef.current==='dark'?1:0;
    const frame=(now:number)=>{
      raf=requestAnimationFrame(frame);
      const dt=Math.min((now-(last||now))/1000,.05);last=now;
      night=THREE.MathUtils.lerp(night,environmentRef.current==='dark'?1:0,1-Math.exp(-dt*7));
      scene.environmentIntensity=.85-night*.4;ambient.intensity=1.1-night*.65;light.intensity=2-night*.9;renderer.toneMappingExposure=.98-night*.04;
      if(kind==='float'){const core=model.group.getObjectByName('Blue_Base') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshPhysicalMaterial>;core.material.emissiveIntensity=3.2+night*.6;underlight.intensity=8+night*2;}
      if(lastView!==state.current.view){lastView=state.current.view;const d=el.clientWidth<500?8:6.4;if(lastView==='top')camera.position.set(0,d,.01);else if(lastView==='side')camera.position.set(d,.45,0);else camera.position.set(0,kind==='drape'?1.45:.8,d);controls.target.set(0,.02,0);model.group.rotation.y=0;}
      controls.autoRotate=state.current.spin;controls.autoRotateSpeed=1.4;controls.update();renderer.render(scene,camera);el.dataset.ready='true';el.dataset.model=kind;el.dataset.lighting=environmentRef.current;
    };raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});glow.dispose();env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[kind,environmentRef]);
  return <main className="model-studio" data-environment={environment}><header className="model-header"><a href="/"><ArrowLeft size={17}/><span>Boo Float</span></a><span>CHARACTER STUDY / 03</span><div className="model-actions"><EnvironmentSwitch value={environment} onChange={setEnvironment}/><a className="model-download" href={`/models/ghost-${kind}.glb`} download><Download size={16}/><span>GLB 模型</span></a></div></header>
    <div className="model-options"><ToggleGroup value={[kind]} onValueChange={v=>{if(v[0]){setKind(String(v[0]));setView('front');}}}><ToggleGroupItem value="float">悬浮布幔</ToggleGroupItem><ToggleGroupItem value="drape">开孔布幔</ToggleGroupItem><ToggleGroupItem value="boo">珍珠 Boo</ToggleGroupItem></ToggleGroup></div>
    <div ref={host} className="model-canvas" aria-label="可旋转的幽灵三维模型"/>
    <div className="model-title"><span>{kind==='float'?'THE FLOATING GHOST':kind==='drape'?'THE DRAPED GHOST':'THE PEARL BOO'}</span><h1>{kind==='float'?'悬浮布幔':kind==='drape'?'布幔幽灵':'珍珠 Boo'}</h1><p>{kind==='float'?'柔雾硅胶 · 垂坠白幔 · 蓝色透光':kind==='drape'?'哑光白壳 · 黑色长眼 · 八瓣裙摆':'奶白珠光 · 小巧五官 · 柔软短裙摆'}</p></div>
    <div className="model-views"><ToggleGroup value={[view]} onValueChange={v=>{if(v[0]){setView(String(v[0]));setSpin(false);}}}><ToggleGroupItem value="front">正面</ToggleGroupItem><ToggleGroupItem value="side">侧面</ToggleGroupItem><ToggleGroupItem value="top">顶面</ToggleGroupItem></ToggleGroup><button aria-label={spin?'停止旋转':'旋转模型'} title={spin?'停止旋转':'旋转模型'} onClick={()=>setSpin(!spin)}>{spin?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="重置视角" title="重置视角" onClick={()=>{setSpin(false);setView(v=>v==='front'?'front-reset':'front');}}><RotateCcw size={17}/></button></div>
  </main>;
}
