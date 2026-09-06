const $ = (id) => document.getElementById(id);
const directions = ['N','NE','E','SE','S','SW','W','NW','SINGLE','DOUBLE'];
const labels = {N:'上',NE:'右上',E:'右',SE:'右下',S:'下',SW:'左下',W:'左',NW:'左上',SINGLE:'摇杆单击',DOUBLE:'摇杆双击'};
const effects = {
  ghost: [['idle','轻轻漂浮'],['breathe','深呼吸'],['tilt-left','向左牵引'],['tilt-right','向右牵引'],['stretch','弹力布幔'],['trail','超长拖尾'],['comet','彗星冲刺'],['orbit','绕圈漂浮'],['press','软软压扁'],['pulse','蓄力震颤'],['rebound','弹跳回弹'],['ripple','涟漪扩散'],['echo','幽灵分身'],['sparkle','星屑绽放'],['blink','眨眼点头'],['twist','旋风拧转'],['burst','极限爆开'],['reform','碎光重生']],
  radish: [['idle','静置回弹'],['tilt-left','左倾牵引'],['tilt-right','右倾牵引'],['stretch','刀身拉伸'],['trail','刀光拖尾'],['comet','萝卜冲刺'],['orbit','旋转挥刀'],['press','蓄力下压'],['pulse','刀锋震颤'],['rebound','弹性回弹'],['ripple','冲击涟漪'],['echo','残影分身'],['sparkle','刀光闪烁'],['blink','快速闪动'],['twist','旋拧挥刀'],['burst','刀片爆散'],['reform','碎片重组']],
  squeeze: [['idle','果冻漂浮'],['tilt-left','向左揉捏'],['tilt-right','向右揉捏'],['stretch','弹性拉伸'],['trail','果冻拖尾'],['comet','果冻冲刺'],['orbit','绕圈摇摆'],['press','软软压扁'],['pulse','蓄力颤动'],['rebound','弹性回弹'],['ripple','彩色涟漪'],['echo','果冻分身'],['sparkle','星屑绽放'],['blink','眨眼反馈'],['twist','旋转扭动'],['burst','糖果爆开'],['reform','果冻重组']]
};
const modeTables = {
  default: ['breathe','tilt-right','stretch','trail','press','tilt-left','comet','tilt-left','sparkle','reform'],
  cool: ['comet','trail','orbit','twist','pulse','echo','burst','orbit','sparkle','reform'],
  relief: ['breathe','rebound','ripple','rebound','press','ripple','echo','rebound','press','reform'],
  gentle: ['breathe','tilt-right','tilt-left','stretch','press','tilt-left','breathe','press','sparkle','reform']
};
let config; let port = null; let reader = null; let buffer = ''; let previousPressed = false; let previousDirection = ''; let singleTimer = null; let longPressTimer = null; let longPressTriggered = false; let lastPress = 0; let connected = false;

function renderPreview() {
  const toy = $('toy').value; const box = $('preview');
  box.innerHTML = toy === 'ghost' ? '<div class="boo-preview" aria-label="BooFloat 3D 幽灵预览"><span>BOOFLOAT / 3D</span></div>' : toy === 'radish' ? '<img class="toy-sprite" src="../assets/radish-knife.png" alt="萝卜刀预览">' : '<img class="toy-sprite" src="../assets/squeeze-toy.png" alt="捏捏乐预览">';
}
function renderMapping() {
  const list = effects[$('toy').value];
  $('mapping').innerHTML = directions.map(key => `<div class="map-row"><b>${labels[key]}</b><select data-action="${key}">${list.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></div>`).join('');
  directions.forEach((key, index) => { const el = document.querySelector(`[data-action="${key}"]`); const selected = config.actions[key]; const fallback = modeTables[config.mode]?.[index] || list[0][0]; el.value = list.some(([value]) => value === selected) ? selected : list.some(([value]) => value === fallback) ? fallback : list[0][0]; config.actions[key] = el.value; });
}
function applyMode(mode) {
  directions.forEach((key, i) => config.actions[key] = modeTables[mode][i]);
  config.mode = mode; renderMapping(); document.querySelectorAll('.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}
function log(message, className = '') { const line = document.createElement('div'); line.className = className; line.textContent = message; $('serialLog').append(line); $('serialLog').scrollTop = $('serialLog').scrollHeight; while ($('serialLog').children.length > 30) $('serialLog').firstChild.remove(); }
function number(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function parseLine(line) {
  const clean = line.trim(); if (!clean) return null;
  try { const json = JSON.parse(clean); return { x:number(json.x ?? json.X), y:number(json.y ?? json.Y), sw:json.sw ?? json.SW ?? json.button ?? json.pressed, direction:String(json.direction ?? json.dir ?? '').toUpperCase() }; } catch (_) {}
  const result = {}; clean.split(/[;,\s]+/).forEach(part => { const m = part.match(/^(x|y|sw|button|pressed|dir|direction)\s*[:=]\s*(.+)$/i); if (m) result[m[1].toLowerCase()] = m[2]; });
  if (Object.keys(result).length) return {x:number(result.x),y:number(result.y),sw:result.sw ?? result.button ?? result.pressed,direction:String(result.direction ?? result.dir ?? '').toUpperCase()};
  const csv = clean.split(',').map(Number); return csv.length >= 2 && csv.slice(0,2).every(Number.isFinite) ? {x:csv[0],y:csv[1],sw:csv[2],direction:''} : null;
}
function pressed(value) { return value === true || value === 1 || value === '1' || /^(high|true|down|pressed|on)$/i.test(String(value)); }
function axisDirection(x, y) { if (x === null || y === null) return ''; const dx=x-2048, dy=y-2048; if (Math.hypot(dx,dy)<330) return ''; const angle=(Math.atan2(-dy,dx)*180/Math.PI+360)%360; return ['E','NE','N','NW','W','SW','S','SE'][Math.round(angle/45)%8]; }
function processData(data) {
  const direction = ['N','NE','E','SE','S','SW','W','NW'].includes(data.direction) ? data.direction : axisDirection(data.x,data.y); const isDown = pressed(data.sw);
  const directionVector = {N:[0,-1],NE:[0.707,-0.707],E:[1,0],SE:[0.707,0.707],S:[0,1],SW:[-0.707,0.707],W:[-1,0],NW:[-0.707,-0.707]}[direction] || [0,0];
  const normalizedX = data.x === null ? directionVector[0] : Math.abs(data.x) <= 1.25 ? data.x : (data.x - 2048) / 2048;
  const normalizedY = data.y === null ? directionVector[1] : Math.abs(data.y) <= 1.25 ? data.y : (data.y - 2048) / 2048;
  window.pixpop.sendJoystickEvent({ kind:'sample', value:{ x:normalizedX, y:normalizedY, pressure:isDown ? 1 : 0, pressed:isDown } });
  // Send neutral input too, so the overlay can stop a continuous long-press move.
  if (direction !== previousDirection) window.pixpop.sendJoystickEvent({ kind:'direction', value:direction });
  previousDirection = direction;
  if (isDown && !previousPressed) {
    clearTimeout(longPressTimer); clearTimeout(singleTimer); longPressTriggered = false;
    const now = Date.now();
    if (now - lastPress < 380) { window.pixpop.sendJoystickEvent({kind:'action',value:'DOUBLE'}); lastPress = 0; }
    else {
      lastPress = now;
      longPressTimer = setTimeout(() => { longPressTriggered = true; lastPress = 0; clearTimeout(singleTimer); window.pixpop.sendJoystickEvent({kind:'action',value:'LONG'}); }, 450);
      singleTimer = setTimeout(() => { if (!longPressTriggered) window.pixpop.sendJoystickEvent({kind:'action',value:'SINGLE'}); }, 500);
    }
  } else if (!isDown && previousPressed) {
    clearTimeout(longPressTimer);
  }
  previousPressed = isDown;
}
async function readSerial() {
  const decoder = new TextDecoder();
  try { while (port?.readable) { reader=port.readable.getReader(); try { while (true) { const {value,done}=await reader.read(); if(done) break; buffer += decoder.decode(value,{stream:true}); const lines=buffer.split(/\r?\n/); buffer=lines.pop(); lines.forEach(line=>{log(line);const data=parseLine(line);if(data)processData(data);}); } } finally { reader.releaseLock(); reader=null; } } } catch(error) { log(`读取结束：${error.message}`,'error'); disconnect(); }
}
async function disconnect() { try { await reader?.cancel(); await port?.close(); } catch (_) {} reader=null; port=null; connected=false; $('status').textContent='串口未连接'; $('status').className='status'; $('connect').textContent='连接 ESP32'; }
async function connectPort(nextPort, automatic = false) {
  try {
    port = nextPort;
    await port.open({baudRate:Number($('baud').value)});
    connected = true;
    $('status').textContent = automatic ? `ESP32 已自动连接 · ${$('baud').value}` : `串口已连接 · ${$('baud').value}`;
    $('status').className = 'status ok';
    $('connect').textContent = '断开连接';
    log(automatic ? '已自动连接上次授权的 ESP32' : '连接成功', 'success');
    readSerial();
  } catch (error) {
    log(`连接失败：${error.message}`, 'error');
    await disconnect();
  }
}
async function autoConnect() {
  if (!navigator.serial) return;
  try {
    const ports = await navigator.serial.getPorts();
    if (ports.length) await connectPort(ports[0], true);
    else log('没有已授权的串口，首次请点击“连接 ESP32”。');
  } catch (error) { log(`自动连接跳过：${error.message}`, 'error'); }
}
$('connect').onclick = async () => {
  if (connected) return disconnect();
  if (!navigator.serial) return log('当前 Electron 不支持 Web Serial，请使用新版 Electron。','error');
  try { await connectPort(await navigator.serial.requestPort()); } catch(error) { log(`连接失败：${error.message}`,'error'); await disconnect(); }
};
$('toy').onchange = () => { config.toy=$('toy').value; renderPreview(); renderMapping(); document.querySelectorAll('[data-action]').forEach(el=>config.actions[el.dataset.action]=el.value); window.pixpop.sendOverlayCommand({type:'config',config}); };
document.querySelectorAll('.mode').forEach(button => button.onclick=()=>applyMode(button.dataset.mode));
$('save').onclick = async () => { config.baudRate=Number($('baud').value); config.camera=$('camera').checked; document.querySelectorAll('[data-action]').forEach(el=>config.actions[el.dataset.action]=el.value); await window.pixpop.saveConfig(config); window.pixpop.sendOverlayCommand({type:'config',config}); $('status').textContent=connected?'配置已保存 · 串口已连接':'配置已保存'; $('status').className='status ok'; };
$('close').onclick = () => { window.pixpop.closeSettings(); };
$('camera').onchange = async (event) => { if (!event.target.checked) return; try { await navigator.mediaDevices.getUserMedia({video:true}); $('cameraHint').textContent='摄像头已授权，头部追踪接口将在动画层中启用。'; $('cameraHint').className='hint success'; } catch (_) { event.target.checked=false; $('cameraHint').textContent='无法访问摄像头，请检查 Windows 隐私权限。'; $('cameraHint').className='hint error'; } };
(async function init(){ config=await window.pixpop.loadConfig(); config.actions={...config.actions}; $('toy').value=config.toy; $('baud').value=String(config.baudRate); $('camera').checked=Boolean(config.camera); renderPreview(); renderMapping(); document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===config.mode)); await autoConnect(); })();
