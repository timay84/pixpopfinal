import * as THREE from 'three';

const profiles = {
  float: [[0,1.14],[.29,1.105],[.57,1.005],[.76,.82],[.86,.57],[.94,.20],[1.055,-.20],[1.22,-.57],[1.31,-.76],[1.295,-.85],[1.245,-.88],[1.19,-.81],[1.045,-.43],[.89,.05],[.78,.53],[.63,.78],[.40,.94],[0,.985]],
  drape: [[.245,1.105],[.34,1.10],[.57,1.01],[.76,.83],[.86,.58],[.93,.22],[1.04,-.20],[1.22,-.59],[1.32,-.79],[1.29,-.88],[1.23,-.90],[1.18,-.82],[1.04,-.47],[.89,.04],[.79,.52],[.65,.77],[.44,.91],[.235,.955],[.215,1.035],[.245,1.105]],
  boo: [[0,1.02],[.32,.98],[.62,.85],[.82,.65],[.93,.38],[.99,.04],[1.045,-.27],[1.08,-.52],[1.01,-.70],[.83,-.78],[.51,-.69],[0,-.67]],
};

function lathe(profile, kind, mini=false) {
  const curve = new THREE.SplineCurve(profile.map(p=>new THREE.Vector2(...p)));
  const g = new THREE.LatheGeometry(curve.getPoints(mini?38:90),mini?48:112);
  const p=g.attributes.position, colors=[];
  const white=new THREE.Color('#fffdf8'), lavender=new THREE.Color('#b5abea'),ice=new THREE.Color('#aacdff');
  for(let i=0;i<p.count;i++) {
    let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const r=Math.hypot(x,z), a=Math.atan2(x,z), low=THREE.MathUtils.smoothstep(-y,-.08,.85);
    if(kind!=='boo') {
      const fold=Math.cos(a*8)*(kind==='float'?.095:.065)*low;
      if(r>.01) { x*=1+fold/r; z*=1+fold/r; }
      y-=Math.cos(a*8)*.065*low;
    } else {
      const side=Math.pow(Math.abs(Math.sin(a)),18);
      const flap=.22*Math.exp(-Math.pow((y+.12)/.19,2))*side;
      if(r>.01) {x*=1+flap/r;z*=1+flap/r;}
      y-=Math.cos(a*5)*.095*low*Math.min(r*2,1);
    }
    p.setXYZ(i,x,y,z*(kind!=='boo'?.88:.86));
    const color=white.clone().lerp(lavender,kind==='boo'?THREE.MathUtils.smoothstep(-y,.20,.82)*.76:0);
    if(kind==='float')color.lerp(ice,THREE.MathUtils.smoothstep(-y,.25,.95)*.28);
    colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  return g;
}

function surfaceRadius(y,kind) {
  const p=profiles[kind].slice(0,9);
  for(let i=0;i<p.length-1;i++) if(y<=p[i][1] && y>=p[i+1][1]) {
    const t=(p[i][1]-y)/(p[i][1]-p[i+1][1]);return THREE.MathUtils.lerp(p[i][0],p[i+1][0],t);
  }
  return .92;
}

export function createReferenceGhost(kind='drape',mini=false) {
  const cloth=kind!=='boo';
  const group=new THREE.Group();group.name=kind==='float'?'Ghost_Float':kind==='drape'?'Ghost_Draped_Shell':'Boo_Pearl';
  const geometry=lathe(profiles[kind],kind,mini);
  const skin=new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:cloth?.3:.22,metalness:0,clearcoat:cloth?.4:.8,clearcoatRoughness:.2,side:THREE.DoubleSide});
  if(kind==='float')skin.setValues({roughness:.40,clearcoat:.50,clearcoatRoughness:.22,sheen:.64,sheenRoughness:.46,sheenColor:new THREE.Color('#edf5ff'),ior:1.41,transmission:.12,thickness:.46,attenuationColor:new THREE.Color('#a6caff'),attenuationDistance:.9,iridescence:.05,iridescenceIOR:1.36});
  skin.name=kind==='float'?'Milky_Silicone':'Pearl_Shell';
  const body=new THREE.Mesh(geometry,skin);body.name='Body';group.add(body);
  const ink=new THREE.MeshPhysicalMaterial({color:cloth?'#05080c':'#32274c',roughness:.29,clearcoat:.55,clearcoatRoughness:.2,envMapIntensity:.45});
  const eyes=new THREE.Group();eyes.name='Eyes';group.add(eyes);
  const depth=cloth?.88:.86;
  function facePatch(name,cx,cy,rx,ry,bulge,material) {
    const geo=new THREE.SphereGeometry(1,mini?16:32,mini?12:24),p=geo.attributes.position;
    for(let i=0;i<p.count;i++) {
      const x=cx+p.getX(i)*rx,y=cy+p.getY(i)*ry,r=surfaceRadius(y,kind);
      const surface=Math.sqrt(Math.max(.05,r*r-x*x))*depth;
      p.setXYZ(i,x,y,surface+.02+p.getZ(i)*bulge);
    }
    geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.name=name;return mesh;
  }
  for(const side of [-1,1]) eyes.add(facePatch(side<0?'Eye_Left':'Eye_Right',side*(cloth?.27:.265),cloth?.35:.31,cloth?.098:.088,cloth?.218:.133,.025,ink));
  let mouth=new THREE.Group();mouth.name='Mouth';
  if(kind==='boo') {
    mouth.add(facePatch('Smile',0,.10,.057,.061,.022,ink));
    const pink=new THREE.MeshPhysicalMaterial({color:'#f1acc4',roughness:.55,transparent:true,opacity:.72});
    for(const side of [-1,1]) group.add(facePatch(side<0?'Blush_Left':'Blush_Right',side*.49,.115,.116,.074,.008,pink));
  }
  group.add(mouth);
  if(cloth) {
    const baseGeo=new THREE.LatheGeometry(new THREE.SplineCurve([[0,-1.11],[.7,-1.11],[.94,-1.05],[1.075,-.94],[1.08,-.83],[.97,-.79],[0,-.79]].map(p=>new THREE.Vector2(...p))).getPoints(44),96);
    baseGeo.scale(1,1,.88);
    const baseMaterial=new THREE.MeshPhysicalMaterial({color:kind==='float'?'#b7d6ff':'#83a4d4',emissive:kind==='float'?'#327fff':'#000000',emissiveIntensity:kind==='float'?3.2:.55,roughness:kind==='float'?.55:.32,clearcoat:kind==='float'?.08:.35,ior:1.41,side:THREE.DoubleSide});
    baseMaterial.name='Diffused_Blue_Core';
    const base=new THREE.Mesh(baseGeo,baseMaterial);base.name='Blue_Base';group.add(base);
  }
  if(kind==='drape') {
    const inner=new THREE.Mesh(new THREE.CylinderGeometry(.206,.206,.20,64,1,true),new THREE.MeshStandardMaterial({color:'#7193bf',roughness:.6,side:THREE.DoubleSide}));inner.position.y=.97;inner.name='Top_Opening_Liner';group.add(inner);
    const recess=new THREE.Mesh(new THREE.CircleGeometry(.207,64),new THREE.MeshBasicMaterial({color:'#7796c4',side:THREE.DoubleSide}));recess.rotation.x=-Math.PI/2;recess.position.y=.865;recess.name='Recessed_Blue_Insert';group.add(recess);
  }
  const closed=new THREE.Group(),squeezed=new THREE.Group();closed.visible=false;squeezed.visible=false;
  for(const side of [-1,1]) {
    const cx=side*.265,cy=cloth?.35:.31;
    const r=surfaceRadius(cy,kind),z=Math.sqrt(r*r-cx*cx)*depth+.052;
    const addLine=(target,points)=>target.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],z))),20,.018,7,false),ink));
    addLine(closed,[[cx-.09,cy],[cx,cy-.045],[cx+.09,cy]]);
    addLine(squeezed,[[cx-side*.07,cy+.07],[cx+side*.055,cy],[cx-side*.07,cy-.06]]);
  }
  group.add(closed,squeezed);
  const armL=new THREE.Group(),armR=new THREE.Group();
  group.add(armL,armR);group.updateMatrixWorld(true);
  return {group,geometry,eyes,closed,squeezed,mouth,armL,armR};
}
