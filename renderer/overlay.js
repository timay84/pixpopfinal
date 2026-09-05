let config={toy:'ghost',actions:{},camera:false}; let hidden=false; let eligible=true; let toy; let toyArt; let eligibilityTimer; let cameraStream; let cameraTimer; let faceDetector;
const stage=document.getElementById('stage');
let mouseEventsInteractive=false; let suppressMouseEvents=false;
let moveDirection=''; let moveFrame; let moveX=0; let moveY=0;
const movement={N:[0,-1],NE:[.707,-.707],E:[1,0],SE:[.707,.707],S:[0,1],SW:[-.707,.707],W:[-1,0],NW:[-.707,-.707]};
const moveSpeed=8.4;
function updateMouseEvents(){
  const overToy=!hidden&&toy?.matches(':hover');
  if(!overToy)suppressMouseEvents=false;
  const interactive=overToy&&!suppressMouseEvents;
  if(interactive!==mouseEventsInteractive){mouseEventsInteractive=interactive;window.pixpop.setOverlayMouseEvents(interactive);}
}
function toyMarkup(){ if(config.toy==='ghost')return '<div class="toy-art"><div class="ghost-aura"></div><img src="../assets/ghost-cutout.png" alt="幽灵杆"></div>'; if(config.toy==='radish')return '<div class="toy-art"><img class="toy-sprite" src="../assets/radish-knife.png" alt="萝卜刀"></div>'; return '<div class="toy-art"><img class="toy-sprite" src="../assets/squeeze-toy.png" alt="捏捏乐"></div>'; }
function renderToy(){toy.innerHTML=toyMarkup();toyArt=toy.querySelector('.toy-art');toy.style.setProperty('--move-x',`${moveX}px`);toy.style.setProperty('--move-y',`${moveY}px`);}
function show(){hidden=false;toy.classList.remove('hidden');eligible=true;if(moveDirection&&!moveFrame)moveFrame=requestAnimationFrame(moveToy);}
function hide(){hidden=true;toy.classList.add('hidden');updateMouseEvents();}
function moveToy(){
  const vector=movement[moveDirection];
  if(!vector||hidden){moveFrame=null;return;}
  const width=toy.offsetWidth||180; const height=toy.offsetHeight||260;
  const baseLeft=window.innerWidth-window.innerWidth*.07-width; const baseTop=window.innerHeight-window.innerHeight*.05-height;
  moveX=Math.max(-baseLeft,Math.min(window.innerWidth-width-baseLeft,moveX+vector[0]*moveSpeed));
  moveY=Math.max(-baseTop,Math.min(window.innerHeight-height-baseTop,moveY+vector[1]*moveSpeed));
  toy.style.setProperty('--move-x',`${moveX}px`);toy.style.setProperty('--move-y',`${moveY}px`);
  moveFrame=requestAnimationFrame(moveToy);
}
function setMoveDirection(direction){moveDirection=movement[direction]?direction:'';if(moveDirection&&!moveFrame)moveFrame=requestAnimationFrame(moveToy);}
function particleBurst(count=24,color){for(let i=0;i<count;i++){const p=document.createElement('i');p.className='particle';if(color)p.style.background=color;p.style.left=`${50+Math.random()*8-4}vw`;p.style.top=`${42+Math.random()*10-5}vh`;p.style.setProperty('--dx',`${(Math.random()-.5)*70}vw`);p.style.setProperty('--dy',`${(Math.random()-.5)*65}vh`);stage.append(p);p.addEventListener('animationend',()=>p.remove());}}
function effect(name){
  if(!toy||hidden)return; toyArt.classList.remove('shake','slash','pop','squish'); void toyArt.offsetWidth;
  if(name==='ghost-float'){toyArt.classList.add('pop');}
  else if(name==='ghost-stars'){particleBurst(30,'#ffd166');toyArt.classList.add('shake');}
  else if(name==='ghost-dash'){toyArt.classList.add('slash');particleBurst(12,'#70e8ff');}
  else if(name==='ghost-burst'){particleBurst(42,'#c9a7ff');stage.append(Object.assign(document.createElement('i'),{className:'flash'}));}
  else if(name==='ghost-fall'){particleBurst(20,'#9be7ff');}
  else if(name==='knife-slash'){const c=document.createElement('i');c.className='crack';stage.append(c);c.addEventListener('animationend',()=>c.remove());toyArt.classList.add('slash');}
  else if(name==='knife-rain'){particleBurst(35,'#ff6b4a');toyArt.classList.add('shake');}
  else if(name==='knife-spin'){toyArt.classList.add('slash');}
  else if(name==='knife-shock'){toyArt.classList.add('shake');particleBurst(20,'#ffd166');}
  else if(name==='knife-burst'){particleBurst(50,'#ff8b62');}
  else if(name==='squeeze-pop'){toyArt.classList.add('pop');particleBurst(22,'#ff76c8');}
  else if(name==='squeeze-stars'){particleBurst(36,'#ffd166');}
  else if(name==='squeeze-squish'){toyArt.classList.add('pop');}
  else if(name==='squeeze-wave'){toyArt.classList.add('shake');particleBurst(18,'#70e8ff');}
  else if(name==='squeeze-burst'||name==='surprise'){toyArt.classList.add('pop');particleBurst(55,config.toy==='squeeze'?'#ff76c8':'#c9a7ff');}
  else if(name==='hold-squish'){toyArt.classList.add('squish');}
}
async function stopCamera(){clearTimeout(cameraTimer);if(cameraStream)cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;faceDetector=null;}
async function startCamera(){
  if(!config.camera||!('mediaDevices' in navigator))return;
  if(!('FaceDetector' in window)){console.warn('FaceDetector is not available in this Electron build.');return;}
  try{
    const video=document.getElementById('camera');
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    video.srcObject=cameraStream; await video.play(); faceDetector=new FaceDetector({fastMode:true,maxDetectedFaces:1}); trackHead(video);
  }catch(error){console.warn('Camera tracking unavailable:',error.message);}
}
async function trackHead(video){
  if(!faceDetector||!cameraStream)return;
  try{const faces=await faceDetector.detect(video);if(faces.length){const box=faces[0].boundingBox;const center=(box.x+box.width/2)/video.videoWidth;const vertical=(box.y+box.height/2)/video.videoHeight;toy.style.setProperty('--look-x',`${(0.5-center)*70}px`);toy.style.setProperty('--look-y',`${(0.5-vertical)*35}px`);}}catch(_){ }
  cameraTimer=setTimeout(()=>trackHead(video),100);
}
window.addEventListener('mousemove',updateMouseEvents);
window.addEventListener('blur',()=>{suppressMouseEvents=true;mouseEventsInteractive=false;window.pixpop.setOverlayMouseEvents(false);});
window.pixpop.loadConfig().then(async c=>{config=c;toy=document.getElementById('toy');renderToy();toy.addEventListener('click',()=>{suppressMouseEvents=true;mouseEventsInteractive=false;window.pixpop.setOverlayMouseEvents(false);});await startCamera();setTimeout(show,700);});
window.pixpop.onJoystickEvent(data=>{if(data.kind==='direction'){setMoveDirection(data.value);if(data.value)effect(config.actions[data.value]);}if(data.kind==='action'){if(data.value==='DOUBLE'&&eligible){show();effect(config.actions.DOUBLE||'surprise');}else if(data.value==='SINGLE')effect(config.actions.SINGLE);else if(data.value==='LONG')effect('hold-squish');}});
window.pixpop.onOverlayCommand(async command=>{if(command.type==='config'){config=command.config;renderToy();await stopCamera();await startCamera();show();}});
window.pixpop.onKeyboardActivity(()=>{hide();eligible=false;clearTimeout(eligibilityTimer);eligibilityTimer=setTimeout(()=>{eligible=true;},2000);});
window.pixpop.onOverlayHide(()=>hide()); window.pixpop.onOverlayShow(()=>show());
