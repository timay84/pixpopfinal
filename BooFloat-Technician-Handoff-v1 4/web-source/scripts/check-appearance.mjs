import assert from 'node:assert/strict';
import {MeshPhysicalMaterial} from 'three';
import {createReferenceGhost} from '../lib/reference-ghost.js';

const {group}=createReferenceGhost('float');
const skin=group.getObjectByName('Body').material;
const core=group.getObjectByName('Blue_Base').material;
assert.ok(skin instanceof MeshPhysicalMaterial);
assert.ok(skin.roughness>=.25&&skin.roughness<=.45&&skin.clearcoat>=.4);
assert.ok(skin.transmission>0&&skin.transmission<.2);
assert.equal(skin.ior,1.41);
assert.ok(core.emissiveIntensity>=3);
assert.ok(core.emissive.b>core.emissive.r);
console.log('PASS: soft silicone surface, limited transmission, bright blue emissive core.');
