import * as THREE from 'three';

export function createSoftGlow(target:THREE.Object3D,enabled=true) {
  let sprite:THREE.Sprite|undefined,texture:THREE.DataTexture|undefined;
  if(enabled) {
    const size=96,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const radius=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1);
      const glow=Math.pow(Math.max(0,1-radius*radius),3),i=(y*size+x)*4;
      data.set([115,179,255,Math.round(glow*175)],i);
    }
    texture=new THREE.DataTexture(data,size,size);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
    sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
    sprite.name='Core_Light_Spill';sprite.position.set(0,-.97,-.35);sprite.scale.set(3.6,1.5,1);target.add(sprite);
  }
  return {
    setShape:(pull:number,sx:number,sy:number,lag:number)=>{if(sprite){sprite.position.set(-pull*.72+lag,-.97*sy,-.35);sprite.scale.set(3.6*Math.max(1,sx),1.5*Math.max(.65,sy),1);}},
    dispose:()=>{if(sprite){sprite.removeFromParent();sprite.material.dispose();}texture?.dispose();},
  };
}
