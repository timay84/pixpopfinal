let config={toy:'ghost',actions:{},camera:false}; let hidden=false; let eligible=true; let toy; let eligibilityTimer; let cameraStream; let cameraTimer; let faceDetector;
const stage=document.getElementById('stage');
let mouseEventsInteractive=false;
function updateMouseEvents(){
  const interactive=!hidden&&toy?.matches(':hover');
  if(interactive!==mouseEventsInteractive){mouseEventsInteractive=interactive;window.pixpop.setOverlayMouseEvents(interactive);}
}
function toyMarkup(){ if(config.toy==='ghost')return '<div class="toy-art"><div class="ghost-aura"></div><img src="../assets/ghost-cutout.png" alt="幽灵杆"></div>'; if(config.toy==='radish')return '<div class="toy-art"><img class="toy-sprite" src="../assets/radish-knife.png" alt="萝卜刀"></div>'; return '<div class="toy-art"><img class="toy-sprite" src="../assets/squeeze-toy.png" alt="捏捏乐"></div>'; }
function renderToy(){toy.innerHTML=toyMarkup();}
function show(){hidden=false;toy.classList.remove('hidden');eligible=true;}
function hide(){hidden=true;toy.classList.add('hidden');updateMouseEvents();}
function particleBurst(count=24,color){for(let i=0;i<count;i++){const p=document.createElement('i');p.className='particle';if(color)p.style.background=color;p.style.left=`${50+Math.random()*8-4}vw`;p.style.top=`${42+Math.random()*10-5}vh`;p.style.setProperty('--dx',`${(Math.random()-.5)*70}vw`);p.style.setProperty('--dy',`${(Math.random()-.5)*65}vh`);stage.append(p);p.addEventListener('animationend',()=>p.remove());}}
function effect(name){
  if(!toy||hidden)return; toy.classList.remove('shake','slash','pop'); void toy.offsetWidth;
  if(name==='ghost-float'){toy.classList.add('pop');}
  else if(name==='ghost-stars'){particleBurst(30,'#ffd166');toy.classList.add('shake');}
  else if(name==='ghost-dash'){toy.classList.add('slash');particleBurst(12,'#70e8ff');}
  else if(name==='ghost-burst'){particleBurst(42,'#c9a7ff');stage.append(Object.assign(document.createElement('i'),{className:'flash'}));}
  else if(name==='ghost-fall'){particleBurst(20,'#9be7ff');}
  else if(name==='knife-slash'){const c=document.createElement('i');c.className='crack';stage.append(c);c.addEventListener('animationend',()=>c.remove());toy.classList.add('slash');}
  else if(name==='knife-rain'){particleBurst(35,'#ff6b4a');toy.classList.add('shake');}
  else if(name==='knife-spin'){toy.classList.add('slash');}
  else if(name==='knife-shock'){toy.classList.add('shake');particleBurst(20,'#ffd166');}
  else if(name==='knife-burst'){particleBurst(50,'#ff8b62');}
  else if(name==='squeeze-pop'){toy.classList.add('pop');particleBurst(22,'#ff76c8');}
  else if(name==='squeeze-stars'){particleBurst(36,'#ffd166');}
  else if(name==='squeeze-squish'){toy.classList.add('pop');}
  else if(name==='squeeze-wave'){toy.classList.add('shake');particleBurst(18,'#70e8ff');}
  else if(name==='squeeze-burst'||name==='surprise'){toy.classList.add('pop');particleBurst(55,config.toy==='squeeze'?'#ff76c8':'#c9a7ff');}
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
window.pixpop.loadConfig().then(async c=>{config=c;toy=document.getElementById('toy');renderToy();await startCamera();setTimeout(show,700);});
window.pixpop.onJoystickEvent(data=>{if(data.kind==='direction'){effect(config.actions[data.value]);}if(data.kind==='action'){if(data.value==='DOUBLE'&&eligible){show();effect(config.actions.DOUBLE||'surprise');}else if(data.value==='SINGLE')effect(config.actions.SINGLE);}});
window.pixpop.onOverlayCommand(async command=>{if(command.type==='config'){config=command.config;renderToy();await stopCamera();await startCamera();show();}});
window.pixpop.onKeyboardActivity(()=>{hide();eligible=false;clearTimeout(eligibilityTimer);eligibilityTimer=setTimeout(()=>{eligible=true;},2000);});
window.pixpop.onOverlayHide(()=>hide()); window.pixpop.onOverlayShow(()=>show());
