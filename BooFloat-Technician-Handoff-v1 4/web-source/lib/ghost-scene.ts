import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getPose, type Motion } from './motion';
import { createReferenceGhost } from './reference-ghost';
import {createSoftGlow} from './soft-glow';
import type {Environment} from './environment';

// All card scenes render through one offscreen WebGL context, then copy to 2D canvases.
let previewPool:{renderer:THREE.WebGLRenderer,env:THREE.WebGLRenderTarget,users:number}|undefined;
function makeRenderer(){const r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setClearColor(0,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;return r;}
function makeEnvironment(renderer:THREE.WebGLRenderer){const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();return env;}

export function createGhostScene(host: HTMLElement, ref: {current: Motion}, mini=false, lighting:{current:Environment}={current:'light'}, sampleClock?:{current:number|null}) {
  if(mini&&!previewPool){const r=makeRenderer();previewPool={renderer:r,env:makeEnvironment(r),users:0};}
  const pool=mini?previewPool:undefined;if(pool)pool.users++;
  const renderer=pool?.renderer??makeRenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,mini?1.2:1.75));
  renderer.setClearColor(0x000000,0); renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.92;
  const output=mini?document.createElement('canvas'):renderer.domElement;
  const context=mini?output.getContext('2d'):null;
  output.setAttribute('aria-label',mini?'完整幽灵动作预览':'实时 3D 幽灵');
  output.dataset.renderer=mini?'shared-webgl':'webgl';host.appendChild(output);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(34,1,.1,50);
  camera.position.set(0,.6,8); camera.lookAt(0,.05,0);
  const env=pool?.env??makeEnvironment(renderer);scene.environment=env.texture;
  const ambient=new THREE.HemisphereLight('#ffffff','#98a0cd',.9);scene.add(ambient);
  const key=new THREE.DirectionalLight('#fff5ec',2);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.DirectionalLight('#bebcfa',2.5);rim.position.set(3,-1,-3);scene.add(rim);
  const ghost=createReferenceGhost('float',mini);
  const geometry=ghost.geometry;scene.add(ghost.group);
  const deformables: {mesh:THREE.Mesh, base:Float32Array, low:Float32Array, angle:Float32Array}[]=[];
  ghost.group.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const positions=object.geometry.attributes.position;
    positions.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;
    const base=new Float32Array(positions.array),low=new Float32Array(positions.count),angle=new Float32Array(positions.count);
    for(let i=0;i<positions.count;i++) {low[i]=THREE.MathUtils.smoothstep(1.0-base[i*3+1],0,1.85);angle[i]=Math.atan2(base[i*3],base[i*3+2]);}
    deformables.push({mesh:object,base,low,angle});
  });
  const underlight=new THREE.PointLight('#589aff',8,4,2);underlight.position.set(0,-1.15,1.6);scene.add(underlight);
  const core=ghost.group.getObjectByName('Blue_Base') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshPhysicalMaterial>;
  const friends=Array.from({length:3},()=>{const friend=createReferenceGhost('float',true);friend.group.traverse(o=>{if(o instanceof THREE.Mesh){const mat=o.material as THREE.MeshPhysicalMaterial;mat.transparent=true;mat.opacity=.28;mat.depthWrite=false;mat.transmission=0;}});scene.add(friend.group);return friend.group;});
  const fragmentMaterial=new THREE.MeshStandardMaterial({color:'#cfeaff',emissive:'#287acc',emissiveIntensity:.45,roughness:.38,metalness:0});
  const fragments=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105,1),fragmentMaterial,mini?40:72);fragments.frustumCulled=false;scene.add(fragments);
  const dummy=new THREE.Object3D();
  const echoes: THREE.Mesh[]=[];
  for(let i=0;i<7;i++) {
    const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:i%2?'#dbedff':'#ffffff',transparent:true,opacity:0,depthWrite:false,side:THREE.FrontSide}));
    m.frustumCulled=false;m.renderOrder=-i-1;scene.add(m);echoes.push(m);
  }
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.25,1.266,80),new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,transparent:true,opacity:.4,depthWrite:false}));
  ring.rotation.x=-Math.PI/2.5;ring.position.set(0,-1.35,0);scene.add(ring);
  const waves=Array.from({length:3},(_,i)=>{const w=new THREE.Mesh(new THREE.RingGeometry(1,1.02,80),new THREE.MeshBasicMaterial({color:i%2?'#69cfee':'#ffffff',side:THREE.DoubleSide,transparent:true,depthWrite:false,opacity:0}));w.rotation.x=-1.07;scene.add(w);return w;});
  const spiralCurve=new THREE.CatmullRomCurve3(Array.from({length:70},(_,i)=>{const a=i/69*Math.PI*5;return new THREE.Vector3(Math.cos(a)*1.5,(i/69-.5)*2.9,Math.sin(a)*1.5)}));
  const spiral=new THREE.Mesh(new THREE.TubeGeometry(spiralCurve,96,.015,5,false),new THREE.MeshBasicMaterial({color:'#81dbef',transparent:true,opacity:0,depthWrite:false}));scene.add(spiral);
  const sparkles=new THREE.Group(); scene.add(sparkles);
  const starShape=new THREE.Shape();starShape.moveTo(0,.11);starShape.quadraticCurveTo(.015,.015,.07,0);starShape.quadraticCurveTo(.015,-.015,0,-.11);starShape.quadraticCurveTo(-.015,-.015,-.07,0);starShape.quadraticCurveTo(-.015,.015,0,.11);
  const starGeo=new THREE.ShapeGeometry(starShape);
  for(let i=0;i<(mini?20:40);i++) {const m=new THREE.Mesh(starGeo,new THREE.MeshBasicMaterial({color:['#e9c978','#75d6ef','#f3b3c4','#ffffff'][i%4],transparent:true,opacity:.8,depthWrite:false}));sparkles.add(m);}
  const trails: THREE.Mesh[]=[];
  for(let i=0;i<7;i++) {
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.6,-.65+i*.32,-.5),new THREE.Vector3(-1.7,-.53+i*.3,-.4),new THREE.Vector3(-.8,-.65+i*.27,-.3)]);
    const m=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.013,5,false),new THREE.MeshBasicMaterial({color:'#fffbff',transparent:true,opacity:0,depthWrite:false}));scene.add(m);trails.push(m);
  }
  const glow=createSoftGlow(ghost.group,true);
  let width=0,height=0,visible=true,resized=true,night=lighting.current==='dark'?1:0;
  const resize = () => { width=host.clientWidth; height=host.clientHeight; if(!width||!height)return;if(!mini)renderer.setSize(width,height,false);else{output.width=Math.round(width*Math.min(devicePixelRatio,1.2));output.height=Math.round(height*Math.min(devicePixelRatio,1.2));}camera.aspect=width/height;camera.position.z=mini?7.3:(width<650?9.0:8.4);camera.fov=34;camera.updateProjectionMatrix();resized=true; };
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});intersection.observe(host);
  let frame=0,last=0,displayTime=performance.now(),lastRender=0;
  const spring={x:0,y:0,sx:1,sy:1,rotation:0,pull:0};
  const velocity={x:0,y:0,sx:0,sy:0,rotation:0,pull:0};
  let hemX=0,hemVelocity=0,renderCount=0;
  const history:{time:number,x:number,y:number,rotation:number}[]=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inspect=!mini&&new URLSearchParams(window.location.search).has('inspect');
  let lastInspection=0;
  const animate=(now:number)=>{
    frame=requestAnimationFrame(animate);
    const elapsed=(now-(last||now))/1000,dt=Math.min(elapsed,.032);last=now;
    const paused=ref.current.paused,targetNight=lighting.current==='dark'?1:0;
    if(paused) { ref.current.started+=elapsed*1000;if(Math.abs(night-targetNight)<.001&&!resized)return; }
    displayTime=now;
    if(!visible || document.hidden || (mini && now-lastRender<65))return;
    const p=getPose(ref.current,sampleClock?.current!=null?ref.current.started+sampleClock.current*1000:displayTime);
    if(reduced) {p.x*=.25;p.y*=.25;p.trail*=.25;p.wobble=0;p.sparkle*=.3;p.scatter*=.4;p.twist*=.3;}
    night=THREE.MathUtils.lerp(night,targetNight,1-Math.exp(-dt*7));
    scene.environmentIntensity=.6-night*.22;ambient.intensity=.75-night*.25;key.intensity=1.6-night*.5;
    rim.intensity=2.2+night*.2;renderer.toneMappingExposure=.78-night*.02;
    core.material.emissiveIntensity=3.2+night*.6;underlight.intensity=8+night*2;
    const step=paused?0:mini?Math.min((now-(lastRender||now))/1000,.065):dt;
    for(const prop of ['x','y','sx','sy','rotation','pull'] as const) {
      velocity[prop]+=(p[prop]-spring[prop])*175*step;velocity[prop]*=Math.exp(-14*step);spring[prop]+=velocity[prop]*step;
    }
    hemVelocity+=(spring.x-hemX)*32*step;hemVelocity*=Math.exp(-7*step);hemX+=hemVelocity*step;
    const lag=THREE.MathUtils.clamp((hemX-spring.x)*.42,-.55,.55);
    const worldWidth=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(17))*camera.aspect;
    const modelScale=mini?Math.min(1,worldWidth/6.2):Math.min(1,worldWidth/7.4);
    ghost.group.position.set(spring.x*(mini?.28:width<650?.30:width<1050?.60:1),spring.y*modelScale,0);
    ghost.group.scale.setScalar(modelScale*p.bodyScale);ghost.group.visible=p.bodyScale>.005;
    ghost.group.rotation.set(0,Math.sin(p.t*.5)*.035+spring.pull*.07,spring.rotation+p.wobble*.12);
    const pullAmount=Math.min(1,Math.abs(spring.pull)),blink=!p.calm&&!p.blink&&p.squish<.4&&Math.sin(p.t*.91)>.997;
    glow.setShape(spring.pull,spring.sx*(1+p.glow*.25),spring.sy,lag);
    // One deformation field keeps the eyes and luminous base attached to the cloth.
    for(const {mesh,base,low,angle} of deformables) {
      const positions=mesh.geometry.attributes.position;
      for(let i=0;i<positions.count;i++) {
        const x=base[i*3],y=base[i*3+1],z=base[i*3+2],w=low[i];
        const localStretch=THREE.MathUtils.lerp(spring.sx,1+(spring.sx-1)*(.18+w*.82),pullAmount);
        const sweep=spring.pull*(.58-w*1.3)+lag*w*w;
        const clothWave=Math.sin(angle[i]*4+p.t*2.2-w*3)*(.024+pullAmount*.035)*w*w;
        const isEye=mesh.name.startsWith('Eye_');
        const eyeY=blink&&isEye?.35+(y-.35)*.1:y;
        const px=isEye?(Math.sign(x)*.27*1.02+(x-Math.sign(x)*.27)*.9+sweep*.76):x*localStretch+sweep;
        const twist=p.twist*(.22+w*.78),py=eyeY*spring.sy+clothWave;
        positions.setXYZ(i,px*Math.cos(twist)+z*Math.sin(twist),py,z*Math.cos(twist)-px*Math.sin(twist));
      }
      positions.needsUpdate=true;
      if(renderCount%(mini?4:2)===0)mesh.geometry.computeVertexNormals();
    }
    renderCount++;
    ghost.eyes.visible=!p.calm&&!p.blink&&p.squish<.4;ghost.closed.visible=p.calm||p.blink;ghost.squeezed.visible=p.squish>=.4&&!p.blink;
    core.material.emissiveIntensity=1.8+night*.7+p.glow*1.2;core.material.emissive.set(p.overload>.3?'#a84bb0':'#267cef');
    underlight.intensity=5+night*2+p.glow*3;
    underlight.position.set(ghost.group.position.x-spring.pull*.6*modelScale,ghost.group.position.y-1.05*spring.sy*modelScale,1.6*modelScale);
    const direction=spring.pull>=0?1:-1;
    history.push({time:now,x:ghost.group.position.x,y:ghost.group.position.y,rotation:spring.rotation});
    while(history.length>1&&history[0].time<now-500)history.shift();
    echoes.forEach((echo,i)=>{
      const past=history.find(h=>h.time>=now-(i+1)*55)||history[0];
      const offset=(i+1)*.18*pullAmount*modelScale*p.tailLength;
      echo.position.set(past.x-direction*offset,past.y,-.3-i*.07);
      echo.scale.set(modelScale*(1+(i+1)*.035),modelScale*(1-(i+1)*.07),modelScale*.8);echo.rotation.set(0,ghost.group.rotation.y,past.rotation);
      (echo.material as THREE.MeshBasicMaterial).opacity=p.trail*.15*(1-i*.12)*Math.min(1,p.tailLength/1.5);
    });
    trails.forEach((line,i)=>{line.scale.set(direction*modelScale*p.tailLength,modelScale*(1+p.ripple*.34),modelScale);line.position.set(ghost.group.position.x,ghost.group.position.y,0);(line.material as THREE.MeshBasicMaterial).opacity=Math.min(.9,p.trail*(.38+i*.05)+p.ripple*.12);});
    ring.position.x=ghost.group.position.x*.4;ring.scale.setScalar(p.calm?1.12+Math.sin(p.t*.9)*.12:1+p.squish*.35+p.ripple*.8+p.orbit*.12);(ring.material as THREE.MeshBasicMaterial).opacity=Math.min(.72,p.calm?.42:.18+p.ripple*.35+p.orbit*.08);
    waves.forEach((wave,i)=>{const a=(p.t*.8+i/3)%1;wave.position.set(ghost.group.position.x,-1.1*modelScale,0);wave.scale.setScalar(modelScale*(.7+a*3));wave.material.opacity=p.ripple*(1-a)*.72;});
    spiral.scale.setScalar(modelScale);spiral.rotation.y=p.t;spiral.material.opacity=Math.abs(p.twist)*.4;
    friends.forEach((friend,i)=>{friend.visible=p.echo>0;const a=p.t*1.31-i*.8;friend.position.set(ghost.group.position.x+Math.sin(a)*(i+1)*.58*modelScale,Math.cos(a)*.2*modelScale,-.6-i*.1);friend.scale.setScalar(modelScale*(.8-i*.12));});
    fragments.visible=p.scatter>.001;
    for(let i=0;i<fragments.count;i++){const a=i*2.399+p.t*(.2+(i%3)*.06),travel=p.scatter*(1.65+(i%7)*.30),returnT=1-p.scatter;dummy.position.set(Math.cos(a)*travel*modelScale,(-.5+Math.sin(a)*travel*.86)*modelScale,Math.sin(i*1.2)*travel*.48);dummy.rotation.set(i+p.t*2.5,i*.3+p.t*1.4,0);dummy.scale.set((.55+i%3*.27)*modelScale,modelScale*(.38+i%4*.15),modelScale*.62);dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);if(fragments.setColorAt)fragments.setColorAt(i,new THREE.Color(['#d9f4ff','#8ee8ff','#f4c5df','#fff3bd'][i%4]).lerp(new THREE.Color('#ffffff'),returnT*.35));}fragments.instanceMatrix.needsUpdate=true;if(fragments.instanceColor)fragments.instanceColor.needsUpdate=true;
    sparkles.children.forEach((star,i)=>{const a=i*2.399,life=(p.t*.65+i*.037)%1,active=p.sparkle>0,radius=active?.4+life*3:1.7+i*.11;star.position.set((Math.cos(a)*radius+ghost.group.position.x)*modelScale,Math.sin(a)*radius*.8*modelScale,0);star.scale.setScalar(modelScale*(active?.4+Math.sin(life*Math.PI)*.9:.55));star.rotation.z=p.t*.3+i;((star as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=active?(1-life)*p.sparkle:(i<5?.4:0);});
    if(mini)renderer.setSize(width,height,false);
    renderer.render(scene,camera);
    if(context){context.clearRect(0,0,output.width,output.height);context.drawImage(renderer.domElement,0,0,output.width,output.height);}
    lastRender=now;resized=false;
    if(inspect&&now-lastInspection>350) {
      const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
      const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let count=0,bluePixels=0,checksum=0,minX=w,minY=h,maxX=0,maxY=0;
      for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){const i=(y*w+x)*4;if(pixels[i+3]>230){count++;if(pixels[i+2]>pixels[i]+15&&pixels[i+2]>pixels[i+1]+4)bluePixels++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);checksum=(checksum+pixels[i]*3+pixels[i+1]*5+pixels[i+2]*7+x+y)>>>0;}}
      host.dataset.canvasPixels=JSON.stringify({count,bluePixels,checksum,bounds:[minX,minY,maxX,maxY],size:[w,h]});lastInspection=now;
    }
    host.dataset.ready='true';host.dataset.motion=ref.current.mode;host.dataset.model='float';host.dataset.lighting=lighting.current;
    host.dataset.frame=String(renderCount);
    host.dataset.pose=JSON.stringify({phase:+p.phase.toFixed(3),x:+spring.x.toFixed(2),y:+spring.y.toFixed(2),sx:+spring.sx.toFixed(2),sy:+spring.sy.toFixed(2),pull:+spring.pull.toFixed(2),trail:+p.trail.toFixed(2),tail:p.tailLength,scatter:+p.scatter.toFixed(2),bodyScale:+p.bodyScale.toFixed(2),pressure:p.squish});
  };
  frame=requestAnimationFrame(animate);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());glow.dispose();if(pool){pool.users--;if(!pool.users){pool.env.dispose();pool.renderer.dispose();pool.renderer.forceContextLoss();previewPool=undefined;}}else{env.dispose();renderer.dispose();renderer.forceContextLoss();}output.remove();};
}
