import assert from 'node:assert/strict';
import {getPose,newMotion,modes} from '../lib/motion.ts';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){return next(specifier==='./motion'?'./motion.ts':specifier,context);}});
const {createInputController,parseSensorLine}=await import('../lib/input-controller.ts');

const poseAt=(motion,t=0)=>getPose({...motion,started:0},t*1000);
for(const strength of [.2,.55,1]) {
  const right=poseAt({...newMotion(),manual:true,inputX:strength});
  const left=poseAt({...newMotion(),manual:true,inputX:-strength});
  assert.equal(left.x,-right.x);assert.equal(left.pull,-right.pull);
  assert.equal(left.sx,right.sx);assert.equal(left.sy,right.sy);
  assert.ok(right.sx>=1+strength*.9);
}
for(const start of [{manual:true,inputX:1},{manual:true,inputX:-1},{manual:true,pressed:true,pressure:.85}]) {
  const before=poseAt({...newMotion(),...start});
  const release={...newMotion('rebound'),settle:true,releaseX:before.x,releaseY:before.y,releaseSx:before.sx,releaseSy:before.sy,releasePull:before.pull,releaseSquish:start.pressed?1:.12};
  const after=poseAt(release);
  for(const key of ['x','y','sx','sy','pull'])assert.ok(Math.abs(after[key]-before[key])<1e-9,`release continuity: ${key}`);
  const settled=poseAt(release,2.5);
  assert.ok(Math.abs(settled.x)<.001);assert.ok(Math.abs(settled.sx-1)<.001);
}
for(const {id} of modes)for(let t=0;t<10;t+=.016) {
  const pose=poseAt(newMotion(id),t);
  for(const value of Object.values(pose))if(typeof value==='number')assert.ok(Number.isFinite(value));
  assert.ok(pose.sx>.3&&pose.sy>.1);
}
assert.equal(modes.length,18);
const ref={current:newMotion()},driver=createInputController(ref);
driver.set({x:0,y:.6,pressure:0},100);driver.tick(100);
assert.equal(ref.current.mode,'press');assert.equal(getPose(ref.current,100).squish,.6);
driver.set({x:0,y:0,pressure:.86},200);driver.tick(200);assert.equal(ref.current.mode,'pulse');
driver.set({x:0,y:0,pressure:.95},300);driver.tick(300);driver.tick(410);assert.notEqual(ref.current.mode,'burst');driver.tick(430);assert.equal(ref.current.mode,'burst');
const popped=getPose(ref.current,800);assert.equal(popped.bodyScale,0);assert.ok(popped.scatter>.9);
driver.tick(2950);assert.equal(ref.current.mode,'reform');driver.tick(4000);assert.equal(ref.current.mode,'reform');
driver.set({x:0,y:0,pressure:0},4100);driver.tick(4100);driver.set({x:0,y:0,pressure:1},4200);driver.tick(4200);driver.tick(4340);assert.equal(ref.current.mode,'burst');
assert.equal(parseSensorLine('noise'),null);assert.equal(parseSensorLine('{"x":"broken"}'),null);assert.equal(parseSensorLine('{"pressure":0.7}')?.pressure,.7);assert.equal(parseSensorLine('x:0.5,y:0,p:false')?.pressure,0);
const hidden=getPose({...newMotion('burst'),started:0,oneShot:true},500),rebuilt=getPose({...newMotion('burst'),started:0,oneShot:true},2500);assert.equal(hidden.bodyScale,0);assert.equal(rebuilt.bodyScale,1);assert.equal(rebuilt.scatter,0);
console.log('PASS: 18 finite modes, symmetric drag, continuous release, analog downward pressure, 120ms threshold, burst disappearance, reconstruction, rearm, and invalid sensor packets.');
