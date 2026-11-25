// Uso: npm i jsdom && node smoke-topo.js  (en la carpeta del juego). Prueba del caso del topo en solitario con ?topo=1:
// presentación → sabotaje → el jefe lo arregla con el minijuego («🔧 Voy yo») → reunión de emergencia → votación → final del caso.
// El bot de caja cobra como siempre; vota al sospechoso con más pistas del cuaderno. Imprime el recorrido y errors: [].
const {JSDOM}=require('jsdom');const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace('dur:100','dur:'+(+process.env.DUR||60)).replace('const dt=Math.min(HC.on?HC.dt:0.1,(ts-last)/1000||0);','const dt=Math.min(HC.on?HC.dt:0.1,(ts-last)/1000||0)*'+(+process.env.SPD||3)+';').replace('function renderAll(){','window.__g=()=>({run,meta,topoW});function renderAll(){')
  .replace('<script src="productos.js"></script>','<script>'+fs.readFileSync('productos.js','utf8')+'</script>')
  .replace('<script src="firebase-config.js"></script>','<script>window.FIREBASE_CONFIG=null</script>');
const errs=[];
const dom=new JSDOM(html,{url:'http://localhost/?topo=1',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.addEventListener('error',e=>errs.push(e.message));w.AudioContext=undefined;const ce=w.console.error;w.console.error=(...a)=>errs.push('console: '+a.join(' '));
  try{['j_caja','j_alm','j_back','j_rrpp','j_rrhh','j_dir'].forEach(k=>w.localStorage.setItem('vitchmarket.guia.'+k,'1'));w.localStorage.setItem('vitchmarket.camaras','0');}catch(e){}}});
const w=dom.window,d=w.document,cl=el=>el&&el.click();
const D=[5000,2000,1000,500,200,100,50,20,10,5,2,1];
const st={intro:0,sabs:[],fixMg:0,fixClicks:0,meetings:0,votes:[],ends:[],book:0,turns:0,strip:0,dark:0};
let seenSab=null,seenEnd=null;
setInterval(()=>{try{
  const g=w.__g&&w.__g(),T=g&&g.run&&g.run.topo;
  {const x=d.querySelector('#guide.show [data-act=gclose]');if(x){cl(x);return;}}
  if(T&&T.sab&&seenSab!==T.sab.id){seenSab=T.sab.id;st.sabs.push(T.sab.k+'@'+Math.round(g.run.t));}
  if(T&&T.end&&seenEnd!==T.c){seenEnd=T.c;st.ends.push(T.end.win+':'+T.end.why+' · topo '+T.end.n+' · barra '+T.end.done+'/'+T.end.goal);}
  if(d.querySelector('#topob.show'))st.strip=1;if(d.body.classList.contains('topo-dark'))st.dark=1;
  const ov=d.querySelector('#overlay.show');
  if(ov){const b=ov.querySelector('[data-act=start],[data-act=next],[data-act=meeting],[data-act=endmeet]');if(b&&b.dataset.act==='next'){st.turns++;if(st.turns>=+(process.env.TURNS||3))return done();}cl(b);return;}
  if(!g||!g.run||g.run.over)return;
  /* minijuego: arreglo (pulsar en orden) o salir de caja */
  const mg=d.querySelector('#mg.show');
  if(mg){const fx=d.querySelectorAll('#mg [data-act=mgfix]');
    if(fx.length){st.fixMg=1;const tg=[...d.querySelectorAll('#mg .fixtg i.on')][0];const want=tg?tg.textContent:'';const b=[...fx].find(x=>x.dataset.s===want);st.fixClicks++;cl(b||fx[0]);return;}
    const lv=mg.querySelector('[data-act=leave]');if(lv){cl(lv);return;}
    cl(mg.querySelector('[data-act=leavecancel]')||mg.querySelector('button'));return;}
  /* panel del caso: en la reunión vota al que más pistas tiene; si no, cierra */
  const tw=d.querySelector('#topow.show');
  if(tw){
    if(/Reunión de emergencia/.test(tw.textContent)&&tw.querySelector('[data-act=tvote][data-v]:not([data-v=skip])')){
      st.meetings++;const sus=[...tw.querySelectorAll('.tp-sus')].map(x=>({b:x.querySelector('[data-act=tvote]'),n:x.querySelectorAll('.tp-ev i').length+(x.querySelector('.tp-bad')?2:0),name:(x.querySelector('.tp-mid b')||{}).textContent})).filter(x=>x.b).sort((a,b)=>b.n-a.n);
      st.votes.push(sus[0].name);cl(sus[0].b);return;}
    if(/Cuaderno/.test(tw.textContent))st.book=Math.max(st.book,tw.querySelectorAll('.tp-clue').length);
    cl(tw.querySelector('[data-def]')||tw.querySelector('[data-act=tclose]'));return;}
  {const sb=d.querySelector('#scene.show button[data-act=scene][data-def]')||d.querySelector('#scene.show button[data-act=scene]');if(sb){if(/HOY HAY UN TOPO/.test(d.querySelector('#scene').textContent)&&!sb.dataset.seen){sb.dataset.seen=1;st.intro++;}cl(sb);return;}}
  /* avería en marcha: el jefe va a arreglarla */
  if(T&&T.sab&&!T.meet){const fb=d.querySelector('#topob [data-act=tfix]');if(fb&&!g.run.away){cl(fb);return;}}
  /* tras un sabotaje: abrir el cuaderno y convocar reunión */
  if(T&&!T.end&&T.cl.length&&!T.sab&&!T.meet&&(T.mb.boss||0)<1&&Math.random()<.05){const bk=d.querySelector('#topob [data-act=topow][data-k=book]');if(bk&&!st.bookOpened){st.bookOpened=1;cl(bk);return;}const m=d.querySelector('#topob [data-act=tmeet]:not([disabled])');if(m){cl(m);return;}}
  const c=g.run.queue[0];if(!c||g.run.away)return;
  if(c.phase==='complaint'){cl(d.querySelector('[data-act=route][data-d='+c.complaint.dept+']'));return;}
  if(d.querySelector('[data-act=idyes]')){cl(d.querySelector(c.minor?'[data-act=idno]':'[data-act=idyes]'));return;}
  const it=d.querySelector('#belt .item');if(it){cl(it);return;}
  const pay=d.querySelector('[data-act=pay]:not([disabled])');if(pay){cl(pay);return;}
  const card=d.querySelector('[data-act=card]');if(card){cl(card);return;}
  const due=d.querySelector('.cashrow.due b');
  if(due){const c2=Math.round(parseFloat(due.textContent.replace(',','.'))*100),cur=Math.round(parseFloat(d.querySelector('.cashrow.tray b').textContent.replace(',','.'))*100);
    if(cur<c2){for(const v of D){if(c2-cur>=v){cl(d.querySelector('[data-act=den][data-v="'+v+'"]'));return;}}}
    cl(d.querySelector('[data-act=deliver]'));}
}catch(e){errs.push('BOT '+e.message+' '+(e.stack||'').split('\n')[1]);}},30);
function done(){const g=w.__g();st.topoS=g.meta.topoS;st.bajas=(g.meta.bajas||[]).slice(0,3).map(b=>b.n+': '+b.why);console.log(JSON.stringify(st,null,1));console.log('errors:',errs.slice(0,8));process.exit(0);}
setTimeout(done,+process.env.TMAX||150000);
