// Uso: npm i jsdom && node smoke-sala.js  (en la carpeta del juego).
// Prueba de salas sin red: dos navegadores jsdom (jefe y empleada) comparten una Firebase falsa en memoria.
// El jefe crea la sala y juega en caja; la empleada entra con el enlace, elige Almacén y hace avisos.
// Al final la empleada toma el mando (con el latido del jefe caducado) y el jefe pasa a ser empleado.
const {JSDOM}=require('jsdom');const fs=require('fs');

/* ---------- Firebase falsa (subconjunto de la API modular que usa el juego) ---------- */
const store={v:null},listeners=[];let skew=0,pushN=0;
const split=p=>String(p||'').split('/').filter(Boolean);
function getAt(p){let v=store.v;for(const k of split(p)){if(v==null||typeof v!=='object')return null;v=v[k];}return v===undefined?null:v;}
function norm(v){
  if(Array.isArray(v)){const o={};v.forEach((x,i)=>{o[i]=x;});v=o;}
  if(v&&typeof v==='object'){if(v['.sv']==='timestamp')return Date.now();const o={};for(const [k,x] of Object.entries(v)){const y=norm(x);if(y!=null)o[k]=y;}return Object.keys(o).length?o:null;}
  return v===undefined?null:v;
}
function setAt(p,val){
  val=norm(val);const ks=split(p);
  if(!ks.length){store.v=val;return;}
  if(store.v==null)store.v={};
  let o=store.v;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]];}
  if(val==null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=val;
}
/* Como Firebase: objetos con claves numéricas densas vuelven como arrays. */
function out(v){
  if(v&&typeof v==='object'){
    const ks=Object.keys(v),o={};ks.forEach(k=>{o[k]=out(v[k]);});
    if(ks.length&&ks.every(k=>/^(0|[1-9]\d*)$/.test(k))){const mx=Math.max(...ks.map(Number));if(mx<2*ks.length){const a=[];for(let i=0;i<=mx;i++)a.push(o[i]===undefined?null:o[i]);return a;}}
    return o;
  }
  return v;
}
const clone=v=>v==null?null:JSON.parse(JSON.stringify(v));
function snap(p){const raw=clone(getAt(p));return{key:split(p).pop()||null,ref:{path:p},exists:()=>raw!=null,val:()=>out(clone(raw)),
  forEach(cb){if(raw&&typeof raw==='object')Object.keys(raw).forEach(k=>cb(snap(p+'/'+k)));}};}
function notify(p){
  const a=split(p).join('/');
  listeners.slice().forEach(L=>{
    const b=split(L.path).join('/');
    if(!(a===b||a.startsWith(b+'/')||b.startsWith(a+'/')||b===''))return;
    setTimeout(()=>{if(L.off)return;
      if(L.type==='value')L.cb(snap(L.path));
      else{const v=getAt(L.path)||{};Object.keys(v).forEach(k=>{if(!L.seen.has(k)){L.seen.add(k);L.cb(snap(L.path+'/'+k));}});}
    },0);
  });
}
let uidN=0;const acts={},tillSum={served:0,sales:0},dead=new Set();
function client(){
  const uid='uid'+(++uidN);
  const ref=(db,p)=>({path:p||''});
  return async()=>({db:{},uid,ref,
    get:async r=>snap(r.path),
    set:async(r,v)=>{if(dead.has(uid))return;setAt(r.path,v);notify(r.path);},
    update:async(r,o)=>{if(dead.has(uid))return;Object.keys(o).forEach(k=>setAt(r.path+'/'+k,o[k]));notify(r.path);},
    remove:async r=>{setAt(r.path,null);notify(r.path);},
    push:async(r,v)=>{if(v&&v.k)acts[v.k]=(acts[v.k]||0)+1;if(v&&v.k==="till"&&v.d){tillSum.served+=(+v.d.served||0);tillSum.sales+=(+v.d.sales||0);}const k='a'+(++pushN);setAt(r.path+'/'+k,v);notify(r.path+'/'+k);return{key:k};},
    onValue(r,cb){if(r.path==='.info/serverTimeOffset'){setTimeout(()=>cb({val:()=>skew}),0);return()=>{};}
      const L={type:'value',path:r.path,cb};listeners.push(L);setTimeout(()=>{if(!L.off)cb(snap(r.path));},0);return()=>{L.off=1;};},
    onChildAdded(r,cb){const L={type:'child',path:r.path,cb,seen:new Set()};listeners.push(L);notify(r.path);return()=>{L.off=1;};},
    onDisconnect:()=>({set:async()=>{},remove:async()=>{},cancel:async()=>{}}),
    serverTimestamp:()=>({'.sv':'timestamp'}),
    query:r=>r,orderByChild:()=>0,limitToLast:()=>0});
}

/* ---------- dos navegadores ---------- */
let html=fs.readFileSync('index.html','utf8');
html=html.replace('COMPL_P=0.14','COMPL_P=0.3').replace("Math.random()<0.55?'card'","Math.random()<0.05?'card'").replace('next:1.5','next:0.5').replace('nextTask:6','nextTask:1')
  .replace('const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));','const clamp=(v,a,b)=>Math.max(b===5?1:a,Math.min(b,v));').replace('rnd(14,24)*','rnd(2,4)*')
  .replace('Math.max(5.5,9.5-meta.day*0.6)','2').replace('<script src="productos.js"></script>','<script>'+fs.readFileSync('productos.js','utf8')+'</script>')
  .replace('<script src="firebase-config.js"></script>','');
const errs=[];
function browser(name,url){
  const dom=new JSDOM(html,{url,runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
    w.FIREBASE_CONFIG={databaseURL:'mock'};w.FB_MOCK=client();w.AudioContext=undefined;
    w.addEventListener('error',e=>errs.push(name+': '+e.message));
    const ce=w.console.error;w.console.error=(...a)=>{errs.push(name+' console: '+a.join(' '));};
  }});
  return dom.window;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cl=el=>el&&el.click();
const any=(root,s)=>{const a=root.querySelectorAll(s);return a.length?a[Math.floor(Math.random()*a.length)]:null;};
const D=[5000,2000,1000,500,200,100,50,20,10,5,2,1];
const st={hostDays:0,takes:0,mgB:0,assignReal:0};

function hostBot(d){
  {const g=d.querySelector('#guide.show [data-act=gclose],#guide.show [data-act=gpg][data-d="1"]');if(g){(typeof stats!=='undefined'?stats:st).guide=((typeof stats!=='undefined'?stats:st).guide||0)+1;g.click();return;}}
  const hire=d.querySelector('[data-act=rhire]:not([disabled])');if(hire){st.hired=(st.hired||0)+1;cl(hire);return;}
  const ov=d.querySelector('#overlay.show');
  if(ov){
    const ro=ov.querySelector('[data-act=ropen]');if(ro){cl(ro);return;}
    if(Math.random()<.6){const x=any(ov,'[data-act=emp],[data-act=fire],[data-act=req],[data-act=hirec]:not([disabled])');if(x){cl(x);return;}}
    const b=ov.querySelector('[data-act=next],[data-act=restart],[data-act=meeting],[data-act=endmeet]');
    if(b){if(b.dataset.act==='next'||b.dataset.act==='endmeet')st.hostDays++;cl(b);}return;
  }
  const mgel=d.querySelector('#mg.show');
  if(mgel){const x=any(mgel,'button:not([disabled])');if(x)cl(x);return;}
  const real=d.querySelector('#alerts [data-act=assign][data-e]:not([data-e=me])');
  if(real&&/🎮/.test(real.textContent)&&Math.random()<.3){st.assignReal++;cl(real);return;}
  const rt=d.querySelector('[data-act=route]');
  if(rt){const k=['atc','back','rrpp','alm','no'];cl(d.querySelector('[data-act=route][data-d='+k[Math.floor(Math.random()*5)]+']'));return;}
  const idy=d.querySelector('[data-act=idyes]');if(idy){cl(Math.random()<.5?idy:d.querySelector('[data-act=idno]'));return;}
  const it=d.querySelector('.item');if(it){cl(it);return;}
  const pay=d.querySelector('[data-act=pay]:not([disabled])');if(pay){cl(pay);return;}
  const card=d.querySelector('[data-act=card]');if(card){cl(card);return;}
  const due=d.querySelector('.cashrow.due b');
  if(due){const c=Math.round(parseFloat(due.textContent.replace(',','.'))*100);
    const cur=Math.round(parseFloat(d.querySelector('.cashrow.tray b').textContent.replace(',','.'))*100);
    if(cur<c){for(const v of D){if(c-cur>=v){cl(d.querySelector('[data-act=den][data-v="'+v+'"]'));return;}}}
    cl(d.querySelector('[data-act=deliver]'));}
}
let tkSeen=0;
function cashier(d){
  const rt=d.querySelector('[data-act=route]');
  if(rt){const k=['atc','back','rrpp','alm'];cl(d.querySelector('[data-act=route][data-d='+k[Math.floor(Math.random()*4)]+']'));return true;}
  const idy=d.querySelector('[data-act=idyes]');if(idy){cl(Math.random()<.5?idy:d.querySelector('[data-act=idno]'));return true;}
  const it=d.querySelector('.item');if(it){cl(it);return true;}
  const pay=d.querySelector('[data-act=pay]:not([disabled])');if(pay){cl(pay);return true;}
  const card=d.querySelector('[data-act=card]');if(card){cl(card);return true;}
  const due=d.querySelector('.cashrow.due b');
  if(due){const c=Math.round(parseFloat(due.textContent.replace(',','.'))*100);
    const cur=Math.round(parseFloat(d.querySelector('.cashrow.tray b').textContent.replace(',','.'))*100);
    if(cur<c){for(const v of D){if(c-cur>=v){cl(d.querySelector('[data-act=den][data-v="'+v+'"]'));return true;}}}
    cl(d.querySelector('[data-act=deliver]'));return true;}
  return false;
}
function memberBot(d){
  {const g=d.querySelector('#guide.show [data-act=gclose],#guide.show [data-act=gpg][data-d="1"]');if(g){(typeof stats!=='undefined'?stats:st).guide=((typeof stats!=='undefined'?stats:st).guide||0)+1;g.click();return;}}
  if(!d.querySelector('#overlay.show')&&!d.querySelector('#mg.show')&&d.querySelector('#hTill')&&d.querySelector('#hTill').textContent!=='3'){st.tillSeen=1;if(cashier(d)){st.cashierActs=(st.cashierActs||0)+1;return;}}
  if(d.querySelector('[data-act=mgtk]'))tkSeen++;
  const mgel=d.querySelector('#mg.show');
  if(mgel){const x=any(mgel,'button:not([disabled])');if(x){st.mgB++;cl(x);}return;}
  const r=d.querySelector('[data-act=rapply][data-r='+(process.env.ROLE||'alm')+']:not([disabled])');if(r){st.applied=(st.applied||0)+1;cl(r);return;}
  const t=any(d,'[data-act=rtake]:not([disabled])');if(t&&Math.random()<.5){st.takes++;cl(t);}
}

(async()=>{
  try{
    const code='VITCH';
    const A=browser('jefe','http://localhost/');await sleep(400);
    const da=A.document;
    da.querySelector('#pname').value='Jefa Test';
    cl(da.querySelector('[data-act=rreg]'));await sleep(200);
    cl(da.querySelector('[data-act=rapply][data-r=jefe]'));await sleep(400);
    st.hostLobby=!!da.querySelector('[data-act=ropen]');
    setAt('rooms/'+code+'/info/dur',25);notify('rooms/'+code+'/info');
    const B=browser('empleada','http://localhost/');await sleep(400);
    const db=B.document;
    db.querySelector('#pname').value='Empleada <b>Test</b>';
    cl(db.querySelector('[data-act=rreg]'));await sleep(300);
    st.bossCardDisabled=!!db.querySelector('[data-act=rapply][data-r=jefe][disabled]');
    const hA=setInterval(()=>{try{hostBot(da);}catch(e){errs.push('BOT jefe '+e.message);}},40);
    const hB=setInterval(()=>{try{memberBot(db);}catch(e){errs.push('BOT empleada '+e.message);}},60);
    await sleep(45000);
    clearInterval(hA);clearInterval(hB);
    st.acts=acts;st.tillSum=tillSum;st.actsLeft=Object.keys(getAt('rooms/'+code+'/acts')||{}).length;
    const metaDb=getAt('rooms/'+code+'/meta')||{};
    const realEmp=Object.values(metaDb.emp||{}).find(e=>e&&e.real);
    st.tkSeen=tkSeen;st.realEmp=realEmp?{name:realEmp.name,role:realEmp.role,tasks:realEmp.st&&realEmp.st.tasks,tfail:realEmp.st&&realEmp.st.tfail,ok:realEmp.st&&realEmp.st.ok,fail:realEmp.st&&realEmp.st.fail}:null;
    st.memberView=(db.querySelector('#overlay .card h2')||{}).textContent;
    st.note=(getAt('rooms/'+code+'/notes')||{});
    // toma de mando: el latido del jefe se queda viejo
    dead.add('uid1');A.close();await sleep(200); // el navegador del jefe deja de escribir (cerrado)
    setAt('rooms/'+code+'/info/hb',Date.now()-200000);notify('rooms/'+code+'/info');
    // relevo: la empleada (Almacén) sigue moviendo la tienda como encargada
    const t0=(getAt('rooms/'+code+'/state')||{}).t;await sleep(7000);
    const rl=getAt('rooms/'+code+'/relay');st.relay=rl?rl.uid:null;st.relayT=[t0,(getAt('rooms/'+code+'/state')||{}).t];
    st.relayView=(db.querySelector('#overlay .card')||{textContent:''}).textContent.includes('encargado');
    st.empRole=(getAt('rooms/'+code+'/members')||{}).uid2;
    const boss=db.querySelector('[data-act=rboss]');st.bossBtn=!!boss;cl(boss);await sleep(500);
    st.newHost=getAt('rooms/'+code+'/info/host');
    st.afterTake=!!db.querySelector('[data-act=ropen]');
    cl(db.querySelector('[data-act=ropen]'));await sleep(1500);
    st.bRunning=!!db.querySelector('#register');
    st.realLeftInB=JSON.stringify((getAt('rooms/'+code+'/members')||{}));
  }catch(e){errs.push('TEST '+e.stack);}
  console.log(JSON.stringify(st,null,1));
  console.log('errors:',errs.slice(0,8));
  process.exit(0);
})();
