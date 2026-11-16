/* VitchMarket 3D (Three.js): la tienda como maqueta y la caja en 3D.
   Modelos CC0 de Kenney (Mini Shop, Mini Characters, Food Kit) y KayKit (Restaurant Bits), en assets/3d.
   El juego (index.html) sigue funcionando sin esto: si no hay WebGL o no se puede cargar Three.js,
   window.VM3D no llega a estar listo y se usa la vista en pixel art de siempre.
   API para el juego:
     VM3D.ok                              → true cuando ha cargado
     VM3D.store(slot, data)               → pinta la tienda en el elemento slot (cada frame)
        data = {people:[{id,x,y,r,boss,mv,b,lab,hl,info}], tasks:[{k,ic,x,y}], zone:[x,y,w,d]|null, truck}
        (coordenadas del mundo del juego: 400×260, las mismas que las cámaras)
     VM3D.till(slot, data)                → pinta la caja en 3D
        data = {cid, items:[{id,n,e,scanned,denied,damaged,hits,done,age}], queue:[{id,mood}], onScan(id)}
     VM3D.onPick = fn(info)               → al tocar a alguien en la tienda */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE='assets/3d/';
const RED=0xe5383b,WHITE=0xffffff;
const loader=new GLTFLoader(),cache={};
function load(p){
  if(!cache[p])cache[p]=loader.loadAsync(BASE+p).then(g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;});
  return cache[p];
}
async function inst(p){const g=await load(p);return SkeletonUtils.clone(g.scene);}
const W2=v=>v/20; /* 20 unidades del juego = 1 casilla 3D */
const hash=s=>{let h=0;s=String(s);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};
const MALE='abcdef'.split('').map(c=>'chars/character-male-'+c+'.glb'),FEM='abcdef'.split('').map(c=>'chars/character-female-'+c+'.glb');
function textSprite(t,bg,fg,size){
  const cv=document.createElement('canvas'),g=cv.getContext('2d'),fs=size||44;
  g.font=`700 ${fs}px Fredoka, Nunito, sans-serif`;const w=Math.ceil(g.measureText(t).width)+fs*.8,h=Math.ceil(fs*1.5);
  cv.width=w;cv.height=h;g.font=`700 ${fs}px Fredoka, Nunito, sans-serif`;
  if(bg){g.fillStyle=bg;const r=h/2;g.beginPath();g.moveTo(r,0);g.lineTo(w-r,0);g.arc(w-r,r,r,-Math.PI/2,Math.PI/2);g.lineTo(r,h);g.arc(r,r,r,Math.PI/2,Math.PI*1.5);g.fill();}
  g.fillStyle=fg||'#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,h/2+2);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));sp.userData.aspect=w/h;sp.renderOrder=10;return sp;
}
function lights(scene,shadow){
  scene.add(new THREE.HemisphereLight(0xffffff,0xffe0e0,1.1));
  const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(14,22,12);
  if(shadow){sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:60});sun.shadow.bias=-0.0005;}
  sun.target.position.set(10,0,6.5);scene.add(sun,sun.target);
}
function mkRenderer(){
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true});
  r.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));r.outputColorSpace=THREE.SRGBColorSpace;
  r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
  r.domElement.className='vm3d';return r;
}
function fit(r,slot){const w=slot.clientWidth|0,h=slot.clientHeight|0;if(!w||!h)return false;const s=r.getSize(new THREE.Vector2());if(s.x!==w||s.y!==h)r.setSize(w,h,false);return true;}

/* ===================== A: la tienda como maqueta ===================== */
const store={r:null,scene:null,cam:null,people:new Map(),ready:false,building:false,taskSp:[],hits:[],zone:null,clock:new THREE.Clock(),truck:null};
async function buildStore(){
  store.building=true;
  const S=store.scene=new THREE.Scene();lights(S,true);
  const put=async(p,x,z,ry,sc)=>{const o=await inst(p);o.position.set(x,0,z);o.rotation.y=ry||0;if(sc)o.scale.setScalar(sc);S.add(o);return o;};
  /* suelos: tienda (blanco), almacén (gris) y oficinas (madera) con instancias de las baldosas */
  const tile=async(p,x0,z0,x1,z1,tint)=>{const g=await load(p);let mesh=null;g.scene.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});
    const n=(x1-x0)*(z1-z0),m=mesh.material.clone();if(tint)m.color=new THREE.Color(tint);const im=new THREE.InstancedMesh(mesh.geometry,m,n);let k=0;const M=new THREE.Matrix4();
    for(let x=x0;x<x1;x++)for(let z=z0;z<z1;z++){M.makeTranslation(x+.5,0,z+.5);im.setMatrixAt(k++,M);}im.receiveShadow=true;S.add(im);};
  await tile('shop/floor.glb',0,0,13,13);
  await tile('shop/floor.glb',13,0,20,8,0xbfbab3);
  await tile('shop/floor-wood.glb',13,8,20,13);
  /* paredes del fondo y de la izquierda, con ventanas; tabiques del almacén y las oficinas */
  /* paredes blancas con banda roja (colores de la marca) */
  const wallM=new THREE.MeshStandardMaterial({color:0xfbf8f6,roughness:.85}),bandM=new THREE.MeshStandardMaterial({color:RED,roughness:.6});
  const wall=(x,z,w,d,h)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallM);m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;S.add(m);
    const b=new THREE.Mesh(new THREE.BoxGeometry(w+.01,.16,d+.01),bandM);b.position.set(x,h-.12,z);S.add(b);const f=new THREE.Mesh(new THREE.BoxGeometry(w+.01,.08,d+.01),bandM);f.position.set(x,.04,z);S.add(f);};
  wall(10,-.08,20.2,.16,1.6);wall(-.08,6.5,.16,13,1.6);wall(13.1,3,.12,6,.9);wall(16.6,8,6.9,.12,.9);
  /* cartel */
  const sg=textSprite('🛒 VITCHMARKET','#e5383b','#fff',80);sg.material.depthTest=true;sg.scale.set(5,5/sg.userData.aspect,1);sg.position.set(6.5,1.55,0.05);S.add(sg);
  /* neveras al fondo */
  for(let x=1;x<12;x+=1)await put('shop/freezers-standing.glb',x+.5,.45,0);
  /* 9 pasillos: estanterías mirando a los dos lados, con remates rojos */
  for(let i=0;i<9;i++){const x=W2(10+27*i+4.5);
    for(let z=0;z<6;z++){await put(z%2?'shop/shelf-bags.glb':'shop/shelf-boxes.glb',x,1.6+z,Math.PI/2);}
    await put('shop/shelf-end.glb',x,1.1,0);await put('shop/shelf-end.glb',x,7.1,Math.PI);}
  /* frutería, panadería y latas junto a las cajas */
  await put('shop/display-fruit.glb',.8,8.6,0);await put('shop/display-fruit.glb',1.5,8.6,0);await put('shop/display-bread.glb',2.4,8.6,0);await put('shop/display-cans.glb',11.6,8.4,0);
  await put('shop/freezer.glb',12.3,8.4,0);
  /* cajas registradoras */
  for(const wx of [36,104,176]){await put('shop/cash-register.glb',W2(wx+17),W2(212),Math.PI);
    const n=textSprite(String([36,104,176].indexOf(wx)+1),wx===176?'#e5383b':'#fff',wx===176?'#fff':'#e5383b',64);n.scale.set(.45,.45/n.userData.aspect*1.0,1);n.position.set(W2(wx+17),1.35,W2(212));S.add(n);}
  /* entrada: felpudo rojo */
  const mat=new THREE.Mesh(new THREE.BoxGeometry(1.6,.02,.6),new THREE.MeshStandardMaterial({color:RED}));mat.position.set(W2(249),.01,12.7);mat.receiveShadow=true;S.add(mat);
  /* almacén: cajas apiladas, carretilla, estanterías de cajas */
  const crates=['kaykit/crate.gltf','kaykit/crate_carrots.gltf','kaykit/crate_tomatoes.gltf','kaykit/crate_potatoes.gltf','kaykit/crate_lettuce.gltf'];
  for(const [wx,wy] of [[284,40],[322,40],[284,90],[322,90],[284,128]])for(let k=0;k<3;k++){const c=await put(crates[(wx+wy+k)%5],W2(wx+13)+(k%2)*.5-.25,W2(wy+7)+(k>1?.45:0),0,.42);c.position.y=0;}
  for(let z=1;z<7;z+=1)await put('shop/shelf-boxes.glb',19.4,z+.5,-Math.PI/2);
  await put('shop/hand-truck.glb',17.6,1.2,.6);
  /* oficinas: mesas y sillas */
  for(const [wx,wy] of [[284,196],[340,196],[330,236]]){await put('kaykit/kitchentable_A.gltf',W2(wx+18),W2(wy+4),0,.5);await put('kaykit/chair_A.gltf',W2(wx+18),W2(wy+4)+.55,Math.PI,.45);}
  /* camión (cuando hay aviso) */
  const tr=new THREE.Group(),tb=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.3,1.1),new THREE.MeshStandardMaterial({color:WHITE})),tc=new THREE.Mesh(new THREE.BoxGeometry(.7,1,1.1),new THREE.MeshStandardMaterial({color:RED}));
  tb.position.y=.85;tc.position.set(1.45,.7,0);tr.add(tb,tc);[-0.6,.6,1.45].forEach(x=>[-.5,.5].forEach(z=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.15,14),new THREE.MeshStandardMaterial({color:0x222222}));w.rotation.x=Math.PI/2;w.position.set(x,.22,z);tr.add(w);}));
  tr.traverse(o=>{if(o.isMesh)o.castShadow=true;});tr.position.set(18.6,0,-1.2);tr.visible=false;S.add(tr);store.truck=tr;
  /* cámara isométrica */
  store.cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);
  store.ready=true;store.building=false;
}
async function person(id,p){
  const file=p.boss?'chars/character-male-e.glb':p.r==='alm'?'chars/character-worker.glb':p.r?'shop/character-employee.glb':(hash(id)%2?MALE:FEM)[hash(id)%6];
  const g=await load(file),o=SkeletonUtils.clone(g.scene);o.scale.setScalar(p.r||p.boss?1.45:1.3);
  const mixer=new THREE.AnimationMixer(o),A={};g.animations.forEach(c=>{A[c.name]=mixer.clipAction(c);});
  const e={o,mixer,A,cur:null,x:p.x,y:p.y,lab:null,bub:null,bubT:''};
  if(p.boss){const cr=textSprite('👑','','#fff',60);cr.scale.set(.3,.3,1);cr.position.y=1.0;o.add(cr);}
  store.scene.add(o);return e;
}
function play(e,name){if(e.cur===name||!e.A[name])return;const a=e.A[name];a.reset().fadeIn(.2).play();if(e.cur&&e.A[e.cur])e.A[e.cur].fadeOut(.2);e.cur=name;}
function camFor(slot,zone){
  const w=slot.clientWidth||1,h=slot.clientHeight||1,a=w/h,cam=store.cam;
  let cx=9.6,cz=6.5,half=zone?0:7.6;
  if(zone){const [x,y,ww,d]=zone;cx=W2(x+ww/2);cz=W2(y+d/2);const sw=W2(ww)+W2(d);half=Math.max(sw*0.43/2,sw*0.72/2/a)+0.7;}
  else if(a<1.2)half=10/a;
  cam.left=-half*a;cam.right=half*a;cam.top=half;cam.bottom=-half;cam.near=.1;cam.far=200;
  cam.position.set(cx+16,17,cz+16);cam.lookAt(cx,0,cz);cam.updateProjectionMatrix();
}
function storeFrame(slot,data){
  if(!store.r){store.r=mkRenderer();store.r.domElement.addEventListener('click',storeClick);}
  if(!store.ready){if(!store.building)buildStore().catch(e=>{console.warn('VM3D',e);VM3D.ok=false;});return;}
  if(store.r.domElement.parentNode!==slot){slot.appendChild(store.r.domElement);}
  if(!fit(store.r,slot))return;
  const dt=Math.min(.1,store.clock.getDelta());
  camFor(slot,data.zone);
  /* personas */
  const seen=new Set();
  (data.people||[]).forEach(p=>{
    seen.add(p.id);let e=store.people.get(p.id);
    if(!e){if(store.people.has(p.id+':l'))return;store.people.set(p.id+':l',1);person(p.id,p).then(n=>{store.people.delete(p.id+':l');store.people.set(p.id,n);}).catch(()=>{});return;}
    const nx=W2(p.x),nz=W2(p.y),dx=nx-e.o.position.x,dz=nz-e.o.position.z;
    if(Math.hypot(dx,dz)>.002)e.o.rotation.y=Math.atan2(dx,dz);
    e.o.position.set(nx,0,nz);play(e,p.mv?'walk':'idle');e.mixer.update(dt);e.info=p.info;
    const want=p.b||'';if(want!==e.bubT){if(e.bub){e.o.remove(e.bub);e.bub=null;}if(want){e.bub=textSprite(want,'#fff','#000',56);e.bub.scale.set(.32,.32/e.bub.userData.aspect,1);e.bub.position.y=1.15;e.o.add(e.bub);}e.bubT=want;}
    if(data.zone&&p.lab&&!e.lab){e.lab=textSprite(p.lab,p.hl?'#ffd23f':'rgba(58,16,18,.85)',p.hl?'#3a1012':'#fff',40);e.lab.scale.set(.5*e.lab.userData.aspect*.4,.2,1);e.lab.position.y=1.05;e.o.add(e.lab);}
  });
  store.people.forEach((e,id)=>{if(e===1)return;if(!seen.has(id)){store.scene.remove(e.o);store.people.delete(id);}});
  /* avisos: globos sobre su sitio */
  store.taskSp.forEach(s=>store.scene.remove(s));store.taskSp=[];
  const t=performance.now()/1000;
  (data.tasks||[]).forEach((k,j)=>{const s=textSprite(k.ic||'❗','#ffd23f','#000',64);s.scale.set(.5,.5/s.userData.aspect,1);s.position.set(W2(k.x),1.5+Math.sin(t*3+j)*.08,W2(k.y));store.scene.add(s);store.taskSp.push(s);});
  store.truck.visible=!!data.truck;
  /* zona del empleado */
  if(data.zone){if(!store.zone){store.zone=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:RED,transparent:true,opacity:.18,depthWrite:false}));store.zone.rotation.x=-Math.PI/2;store.scene.add(store.zone);}
    const [x,y,w,d]=data.zone;store.zone.scale.set(W2(w),W2(d),1);store.zone.position.set(W2(x+w/2),.02,W2(y+d/2));store.zone.material.opacity=.12+.08*Math.sin(t*3);}
  else if(store.zone)store.zone.visible=false;
  store.r.render(store.scene,store.cam);
}
function storeClick(ev){
  const r=store.r.domElement.getBoundingClientRect(),v=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(v,store.cam);
  let best=null,bd=.6;store.people.forEach(e=>{if(e===1||!e.info)return;const p=e.o.position.clone();p.y=.4;const d=ray.ray.distanceToPoint(p);if(d<bd){bd=d;best=e;}});
  if(best&&VM3D.onPick)VM3D.onPick(best.info);
}

/* ===================== B: la caja en 3D ===================== */
const FOODMAP=[[/manzana/i,'apple'],[/plátano|platano|banana/i,'banana'],[/naranja/i,'orange'],[/limón|limon/i,'lemon'],[/pera/i,'pear'],[/fresa/i,'strawberry'],[/uva/i,'grapes'],[/sand[ií]a/i,'watermelon'],[/piña|pina/i,'pineapple'],
 [/tomate/i,'tomato'],[/zanahoria/i,'carrot'],[/brócoli|brocoli/i,'broccoli'],[/lechuga|col\b|repollo/i,'cabbage'],[/cebolla/i,'onion'],[/pimiento/i,'paprika'],[/maíz|maiz/i,'corn'],[/berenjena/i,'eggplant'],[/champi/i,'mushroom'],[/aguacate/i,'avocado'],[/coco/i,'coconut'],
 [/queso/i,'cheese'],[/barra|baguette/i,'loaf-baguette'],[/pan\b|pan de|molde/i,'loaf'],[/croissant|cruas/i,'croissant'],[/huevo/i,'egg'],[/merluza|pescado|salmón|salmon|atún|atun/i,'fish'],[/carne|filete|pollo|ternera|hamburguesa/i,'meat-raw'],[/bacon|beicon|jam[oó]n|lomo/i,'bacon-raw'],[/salchicha|chorizo/i,'sausage'],
 [/leche|zumo|batido|yogur/i,'carton'],[/lata|atún en|conserva|lenteja|garbanzo|alubia/i,'can'],[/cola|refresco|fanta/i,'soda-can'],[/agua|botella/i,'soda-bottle'],[/aceite/i,'bottle-oil'],[/ketchup|tomate frito|salsa/i,'bottle-ketchup'],[/miel/i,'honey'],[/crema de cacahuete|mantequilla/i,'peanut-butter'],
 [/chocolate|cacao/i,'chocolate'],[/galleta/i,'cookie'],[/donut|dónut/i,'donut'],[/magdalena|muffin/i,'muffin'],[/helado/i,'ice-cream-cup'],[/pizza/i,'pizza-box'],[/vino tinto|tinto/i,'wine-red'],[/vino|cava|cerveza/i,'wine-white'],[/café|cafe/i,'cup-coffee'],[/arroz/i,'rice-ball'],[/caramelo|chuche|gominola/i,'candy-bar']];
const foodFor=n=>{for(const [re,f] of FOODMAP)if(re.test(n))return f;return ['carton-small','can-small','bag','carton','can'][hash(n)%5];};
/* --- La caja en 3D, una sola escena: tú detrás de la cinta, el cliente de frente al otro lado y la cola detrás.
   Los productos avanzan por la cinta hacia el lector y, al escanearlos, saltan a una cesta grande a la derecha
   (≈70% del alto y hasta ≈39% del ancho del hueco, se recalcula con el tamaño de pantalla). --- */
const till={r:null,scene:null,cam:null,ready:false,building:false,items:new Map(),fly:[],inBasket:[],cid:null,onScan:null,clock:new THREE.Clock(),stripes:[],ppl:new Map(),bkSize:null,fitKey:''};
async function buildTill(){
  till.building=true;const S=till.scene=new THREE.Scene();lights(S,false);S.background=new THREE.Color(0xfdf3f3);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0xf3efea}));fl.rotation.x=-Math.PI/2;S.add(fl);
  /* el súper al fondo */
  for(let i=-5;i<=4;i++){const s=await inst(i%2?'shop/shelf-bags.glb':'shop/shelf-boxes.glb');s.position.set(i*.82-.6,0,-4.4);S.add(s);}
  for(let i=-6;i<=5;i++){const s=await inst('shop/freezers-standing.glb');s.position.set(i-.5,0,-5.6);S.add(s);}
  const wall=new THREE.Mesh(new THREE.BoxGeometry(16,3,.2),new THREE.MeshStandardMaterial({color:0xfbf8f6}));wall.position.set(-.6,1.5,-6.2);S.add(wall);
  const band=new THREE.Mesh(new THREE.BoxGeometry(16,.25,.22),new THREE.MeshStandardMaterial({color:RED}));band.position.set(-.6,2.2,-6.15);S.add(band);
  const sg=textSprite('🛒 VITCHMARKET','#e5383b','#fff',80);sg.material.depthTest=true;sg.scale.set(2.8,2.8/sg.userData.aspect,1);sg.position.set(-.9,2.5,-6);S.add(sg);
  /* mostrador blanco con banda roja; cinta negra con listones que se mueven; lector */
  const counter=new THREE.Mesh(new THREE.BoxGeometry(5.4,.78,1.1),new THREE.MeshStandardMaterial({color:0xffffff}));counter.position.set(-.7,.39,.2);S.add(counter);
  const cband=new THREE.Mesh(new THREE.BoxGeometry(5.42,.1,1.12),new THREE.MeshStandardMaterial({color:RED}));cband.position.set(-.7,.66,.2);S.add(cband);
  const belt=new THREE.Mesh(new THREE.BoxGeometry(3.6,.04,.8),new THREE.MeshStandardMaterial({color:0x2b2b2b,roughness:.9}));belt.position.set(-1.3,.8,.2);S.add(belt);
  for(let i=0;i<14;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.04,.045,.8),new THREE.MeshStandardMaterial({color:0x444444}));s.position.set(-3.1+i*.26,.805,.2);S.add(s);till.stripes.push(s);}
  const glass=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.62),new THREE.MeshStandardMaterial({color:0x111111,roughness:.2,metalness:.3}));glass.position.set(.8,.8,.2);S.add(glass);
  const laser=new THREE.Mesh(new THREE.PlaneGeometry(.42,.52),new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.55}));laser.rotation.x=-Math.PI/2;laser.position.set(.8,.83,.2);S.add(laser);till.laser=laser;
  /* la cesta (se coloca y se escala cada vez que cambia el tamaño del hueco) */
  const bk=await inst('shop/shopping-basket.glb');S.add(bk);till.basket=bk;
  const b0=new THREE.Box3().setFromObject(bk);till.bkSize=b0.getSize(new THREE.Vector3());till.bkCenter=b0.getCenter(new THREE.Vector3());
  till.cam=new THREE.PerspectiveCamera(40,1,.1,60);
  till.ready=true;till.building=false;
}
/* Cámara: la cinta llena la parte izquierda (hasta el ~60% del ancho) y abajo; el cliente queda detrás, de frente. */
function tillCamera(w,h){
  const a=w/h,cam=till.cam,vf=a<.9?52:40;cam.fov=vf;cam.aspect=a;
  const k=Math.tan(THREE.MathUtils.degToRad(vf/2))*a,Dk=2.45/1.15,cx=.9-.2*Dk,D=Dk/k;
  /* desde arriba, para ver la superficie de la cinta y los productos grandes */
  cam.position.set(cx,.85+D*.62,.2+D*.82);cam.lookAt(cx,.8,-.25);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
  /* cesta: centrada a la derecha, ≈70% del alto y como mucho ≈39% del ancho */
  const bk=till.basket,dist=Math.max(1.6,D*.55),vh=2*dist*Math.tan(THREE.MathUtils.degToRad(vf/2)),vw=vh*a;
  const s=Math.min(vh*.7/till.bkSize.y,vw*.39/Math.max(till.bkSize.x,till.bkSize.z));bk.scale.setScalar(s);
  const ndc=new THREE.Vector3(.61,-.12,.5).unproject(cam),dir=ndc.sub(cam.position).normalize(),fwd=new THREE.Vector3();cam.getWorldDirection(fwd);
  const p=cam.position.clone().add(dir.multiplyScalar(dist/dir.dot(fwd)));
  bk.position.copy(p).sub(till.bkCenter.clone().multiplyScalar(s));bk.rotation.set(0,-.35,0);
  till.bkTop=p.clone().add(new THREE.Vector3(0,till.bkSize.y*s*.15,0));till.bkR=Math.min(till.bkSize.x,till.bkSize.z)*s*.28;
}
async function tillPerson(id){
  const g=await load((hash(id)%2?MALE:FEM)[hash(id)%6]),o=SkeletonUtils.clone(g.scene);o.scale.setScalar(2.1);
  const mixer=new THREE.AnimationMixer(o),A={};g.animations.forEach(c=>{A[c.name]=mixer.clipAction(c);});
  return {o,mixer,A,cur:null};
}
function pplPlay(e,n){if(e.cur===n)return;const a=e.A[n]||e.A.idle;if(!a)return;a.reset().fadeIn(.2).play();if(e.cur&&e.A[e.cur])e.A[e.cur].fadeOut(.2);e.cur=n;}
function tillFrame(slot,data){
  if(!till.r){till.r=mkRenderer();till.r.domElement.addEventListener('click',tillClick);}
  if(!till.ready){if(!till.building)buildTill().catch(e=>{console.warn('VM3D',e);VM3D.ok=false;});return;}
  if(till.r.domElement.parentNode!==slot)slot.appendChild(till.r.domElement);
  if(!fit(till.r,slot))return;
  const dt=Math.min(.1,till.clock.getDelta()),S=till.scene;till.onScan=data.onScan;
  const w=slot.clientWidth,h=slot.clientHeight,key=w+'x'+h;if(key!==till.fitKey){till.fitKey=key;tillCamera(w,h);}
  /* cliente de delante (de frente, al otro lado de la cinta) y la cola detrás */
  const q=(data.queue||[]).slice(0,5),seen=new Set();
  q.forEach((c,i)=>{
    const id=c.id;seen.add(id);let e=till.ppl.get(id);
    if(!e){if(till.ppl.has(id+':l'))return;till.ppl.set(id+':l',1);tillPerson(id).then(n=>{till.ppl.delete(id+':l');n.o.position.set(-3.6,0,-1.4);S.add(n.o);till.ppl.set(id,n);});return;}
    const tx=i===0?-.75:-.1+(i%2?.5:-.5)-i*.05,tz=i===0?-1.35:-2.5-i*.85;
    const dx=tx-e.o.position.x,dz=tz-e.o.position.z,d=Math.hypot(dx,dz);
    if(d>.03){e.o.position.x+=dx/d*Math.min(d,dt*1.8);e.o.position.z+=dz/d*Math.min(d,dt*1.8);e.o.rotation.y=Math.atan2(dx,dz);pplPlay(e,'walk');}
    else{e.o.rotation.y+=(0-e.o.rotation.y)*Math.min(1,dt*6);pplPlay(e,i===0&&c.mood<.25?'emote-no':'idle');}
    e.mixer.update(dt);
  });
  till.ppl.forEach((e,id)=>{if(e===1)return;if(!seen.has(id)){S.remove(e.o);till.ppl.delete(id);}});
  /* cliente nuevo: se vacía la cesta */
  if(data.cid!==till.cid){till.cid=data.cid;till.inBasket.forEach(o=>S.remove(o));till.inBasket=[];till.fly.forEach(f=>S.remove(f.g));till.fly=[];till.items.forEach(m=>S.remove(m.g));till.items.clear();}
  const all=data.items||[],onBelt=all.filter(i=>!i.scanned&&!i.denied);
  till.items.forEach((m,id)=>{
    const it=all.find(i=>i.id===id);
    if(!it||it.denied){S.remove(m.g);till.items.delete(id);return;}
    if(it.scanned){till.items.delete(id);if(m.ring)m.g.remove(m.ring);if(m.age)m.g.remove(m.age);
      const k=till.inBasket.length+till.fly.length,ang=k*2.4,rr=till.bkR*(.35+.5*((k*.37)%1)),to=till.bkTop.clone().add(new THREE.Vector3(Math.cos(ang)*rr,Math.floor(k/5)*.06,Math.sin(ang)*rr));
      const sc=m.g.scale.x;till.fly.push({g:m.g,from:m.g.position.clone(),to,t:0,s0:sc,s1:sc*1.25});}
  });
  onBelt.forEach((it,k)=>{
    let m=till.items.get(it.id);
    if(!m){m={g:new THREE.Group(),it};m.g.position.set(-3.3,.82,.2);m.g.userData.id=it.id;till.items.set(it.id,m);S.add(m.g);
      inst('food/'+foodFor(it.n)+'.glb').then(o=>{const b=new THREE.Box3().setFromObject(o),sz=b.getSize(new THREE.Vector3()),s=.6/Math.max(sz.x,sz.y,sz.z);o.scale.setScalar(s);o.traverse(c=>{c.userData.id=it.id;});m.g.add(o);}).catch(()=>{});
      /* zona de toque invisible, más grande que el producto */
      const hb=new THREE.Mesh(new THREE.BoxGeometry(.66,.8,.8),new THREE.MeshBasicMaterial({visible:false}));hb.position.y=.35;hb.userData.id=it.id;m.g.add(hb);
      if(it.age){m.age=textSprite('18+','#e5383b','#fff',48);m.age.scale.set(.38,.38/m.age.userData.aspect,1);m.age.position.y=.78;m.g.add(m.age);}
    }
    m.it=it;
    const tx=.35-k*.66,tz=.2+(k%2?.06:-.06);
    m.g.position.x+=(tx-m.g.position.x)*Math.min(1,dt*3);m.g.position.z+=(tz-m.g.position.z)*Math.min(1,dt*3);
    if(it.damaged){const lab='▮'.repeat(it.done)+'▯'.repeat(it.hits-it.done);if(m.ringT!==lab){if(m.ring)m.g.remove(m.ring);m.ring=textSprite(lab,'#fff','#e5383b',44);m.ring.scale.set(.4,.4/m.ring.userData.aspect,1);m.ring.position.y=.72;m.g.add(m.ring);m.ringT=lab;}}
  });
  /* vuelo a la cesta (parábola) */
  till.fly=till.fly.filter(f=>{f.t=Math.min(1,f.t+dt*2.2);const p=f.from.clone().lerp(f.to,f.t);p.y+=Math.sin(f.t*Math.PI)*.8;f.g.position.copy(p);f.g.rotation.z+=dt*8;f.g.scale.setScalar(f.s0+(f.s1-f.s0)*f.t);
    if(f.t>=1){f.g.rotation.set(0,Math.random()*6,0);till.inBasket.push(f.g);return false;}return true;});
  till.stripes.forEach(s=>{s.position.x+=dt*.25;if(s.position.x>.45)s.position.x-=3.64;});
  till.laser.material.opacity=.35+.25*Math.sin(performance.now()/120);
  till.r.render(S,till.cam);
}
function tillClick(ev){
  const r=till.r.domElement.getBoundingClientRect(),v=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(v,till.cam);
  const objs=[];till.items.forEach(m=>objs.push(m.g));
  const hit=ray.intersectObjects(objs,true)[0];
  let id=hit?hit.object.userData.id:null;
  if(id==null){let best=null,bd=.55;till.items.forEach(m=>{const d=ray.ray.distanceToPoint(m.g.position.clone().setY(1.1));if(d<bd){bd=d;best=m;}});if(best)id=best.it.id;}
  if(id!=null&&till.onScan)till.onScan(id);
}

/* ¿Hay WebGL? Si no, no nos anunciamos y el juego sigue en 2D. */
const VM3D=window.VM3D=window.VM3D||{};
try{const c=document.createElement('canvas');if(!(c.getContext('webgl2')||c.getContext('webgl')))throw new Error('sin WebGL');
  VM3D.store=storeFrame;VM3D.till=tillFrame;VM3D.ok=true;
  load('shop/shelf-boxes.glb').catch(()=>{VM3D.ok=false;});
}catch(e){VM3D.ok=false;}
