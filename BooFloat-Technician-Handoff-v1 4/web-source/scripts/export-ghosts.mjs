import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createReferenceGhost } from '../lib/reference-ghost.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();}); }
};
const output=new URL('../public/models/',import.meta.url);
await mkdir(output,{recursive:true});
for(const kind of ['float','drape','boo']) {
  const model=createReferenceGhost(kind);model.group.scale.setScalar(.025);
  model.group.userData={reference:kind==='float'?'Closed round dome, white flowing drapery, black oval eyes and luminous blue base':kind==='drape'?'White draped shell, black oval eyes, blue base and crown opening':'Round pearl Boo with integrated side flaps and soft scalloped hem',units:'meters',purpose:'Visual concept mesh; not an engineered print-ready enclosure'};
  const binary=await new GLTFExporter().parseAsync(model.group,{binary:true,onlyVisible:true});
  const path=new URL(`ghost-${kind}.glb`,output);await writeFile(path,Buffer.from(binary));
  const saved=await readFile(path);
  if(saved.readUInt32LE(0)!==0x46546c67 || saved.readUInt32LE(8)!==saved.length)throw new Error('Invalid GLB');
  console.log(`${path.pathname}: ${(saved.length/1024).toFixed(0)} KB; GLB 2.0 valid`);
}
