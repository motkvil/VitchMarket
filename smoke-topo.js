// Uso: npm i jsdom && node smoke-topo.js  (en la carpeta del juego). Prueba del caso del topo en solitario, en dos partes:
// 1) ?topo=1: presentación → sabotaje → el jefe lo arregla con el minijuego («🔧 Voy yo», a veces tocando la chincheta del mapa)
//    → reunión de emergencia con debate por turnos (una pregunta por turno: dónde estabas, quién te vio, el cuaderno) → votación → final.
// 2) ?topo=express: el caso exprés arranca solo, se juega hasta su pantalla de resultado y vuelve a la portada sin tocar la
//    partida guardada (localStorage y meta del turno 1). EXPRESS=0 se salta la segunda parte.
// El bot de caja cobra como siempre; vota al sospechoso con más pistas. Imprime el recorrido y errors: [].
const {JSDOM}=require('jsdom');const fs=require('fs');
const base=fs.readFileSync('index.html','utf8');
const D=[5000,2000,1000,500,200,100,50,20,10,5,2,1];
function play(url,opt){return new Promise(res=>{
  let html=mapHook(base).replace('dur:100','dur:'+(+process.env.DUR||60)).replace('const dt=Math.min(HC.on?HC.dt:0.1,(ts-last)/1000||0);','const dt=Math.min(HC.on?HC.dt:0.1,(ts-last)/1000||0)*'+(opt.spd||+process.env.SPD||3)+';').replace('function renderAll(){','window.__g=()=>({run,meta,topoW,daily});function renderAll(){')
    .replace('<script src="productos.js"></script>','<script>'+fs.readFileSync('productos.js','utf8')+'</script>')
    .replace('<script src="firebase-config.js"></script>','<script>window.FIREBASE_CONFIG=null</script>');
  const errs=[];
  const dom=new JSDOM(html,{url,runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
    w.addEventListener('error',e=>errs.push(e.message));w.AudioContext=undefined;w.console.error=(...a)=>errs.push('console: '+a.join(' '));
    try{['j_caja','j_alm','j_back','j_rrpp','j_rrhh','j_dir'].forEach(k=>w.localStorage.setItem('vitchmarket.guia.'+k,'1'));w.localStorage.setItem('vitchmarket.camaras','0');}catch(e){}}});
  const w=dom.window,d=w.document,cl=el=>el&&el.click();
  const st={intro:0,sabs:[],fixMg:0,fixClicks:0,mapTap:0,meetings:0,rounds:0,questions:{},debLines:0,revealed:0,votes:[],ends:[],book:0,turns:0,strip:0,dark:0};
  let seenSab=null,seenEnd=null,finished=false;
  const fin=()=>{if(finished)return;finished=true;clearInterval(iv);clearTimeout(to);try{opt.end&&opt.end(w,st);}catch(e){errs.push('END '+e.message);}w.close();res({st,errs});};
  const iv=setInterval(()=>{try{
    const g=w.__g&&w.__g(),T=g&&g.run&&g.run.topo;
    {const x=d.querySelector('#guide.show [data-act=gclose]');if(x){cl(x);return;}}
    if(T&&T.sab&&seenSab!==T.sab.id){seenSab=T.sab.id;st.sabs.push(T.sab.k+'@'+Math.round(g.run.t));}
    if(T&&T.end&&seenEnd!==T.c){seenEnd=T.c;st.ends.push(T.end.win+':'+T.end.why+' · topo '+T.end.n+' · barra '+T.end.done+'/'+T.end.goal+(T.end.mot?' · motivo: '+T.end.mot.slice(0,50)+'…':''));}
    if(d.querySelector('#topob.show'))st.strip=1;if(d.body.classList.contains('topo-dark'))st.dark=1;
    if(opt.tick&&opt.tick(w,g,st,fin))return;
    const ov=d.querySelector('#overlay.show');
    if(ov){const b=ov.querySelector('[data-act=start],[data-act=next],[data-act=meeting],[data-act=endmeet]');if(b&&b.dataset.act==='next'){st.turns++;if(st.turns>=+(process.env.TURNS||3))return fin();}cl(b);return;}
    if(!g||!g.run||g.run.over)return;
    /* minijuego: arreglo (pulsar en orden) o salir de caja */
    const mg=d.querySelector('#mg.show');
    if(mg){const fx=d.querySelectorAll('#mg [data-act=mgfix]');
      if(fx.length){st.fixMg=1;const tg=[...d.querySelectorAll('#mg .fixtg i.on')][0];const want=tg?tg.textContent:'';const b=[...fx].find(x=>x.dataset.s===want);st.fixClicks++;cl(b||fx[0]);return;}
      const lv=mg.querySelector('[data-act=leave]');if(lv){cl(lv);return;}
      cl(mg.querySelector('[data-act=leavecancel]')||mg.querySelector('button'));return;}
    /* panel del caso: en la reunión, una pregunta por turno, siguiente turno y, al votar, el que más pistas tiene */
    const tw=d.querySelector('#topow.show');
    if(tw){
      if(/Reunión de emergencia/.test(tw.textContent)){
        st.debLines=Math.max(st.debLines,tw.querySelectorAll('.tp-l').length);st.revealed=Math.max(st.revealed,tw.querySelectorAll('.tp-l.c-bad').length);
        const q=[...tw.querySelectorAll('[data-act=tdq]')];if(q.length){const b=q[Math.floor(Math.random()*q.length)];st.questions[b.dataset.q]=(st.questions[b.dataset.q]||0)+1;cl(b);return;}
        const nx=tw.querySelector('[data-act=tdnext]');if(nx){st.rounds++;cl(nx);return;}
        if(tw.querySelector('[data-act=tvote][data-v]:not([data-v=skip])')){
          st.meetings++;const sus=[...tw.querySelectorAll('.tp-sus')].map(x=>({b:x.querySelector('[data-act=tvote]'),n:x.querySelectorAll('.tp-ev i').length+(x.querySelector('.tp-bad')?2:0),name:(x.querySelector('.tp-mid b')||{}).textContent})).filter(x=>x.b).sort((a,b)=>b.n-a.n);
          st.votes.push(sus[0].name);cl(sus[0].b);return;}}
      if(/Cuaderno/.test(tw.textContent))st.book=Math.max(st.book,tw.querySelectorAll('.tp-clue').length);
      cl(tw.querySelector('[data-def]')||tw.querySelector('[data-act=tclose]'));return;}
    {const sb=d.querySelector('#scene.show button[data-act=scene][data-def]')||d.querySelector('#scene.show button[data-act=scene]');if(sb){if(/HOY HAY UN TOPO/.test(d.querySelector('#scene').textContent)&&!sb.dataset.seen){sb.dataset.seen=1;st.intro++;}cl(sb);return;}}
    /* avería en marcha: el jefe va a arreglarla (la mitad de las veces tocando la chincheta del mapa) */
    if(T&&T.sab&&!T.meet&&!g.run.away){
      if(Math.random()<.5&&w.__topoMap){const id=w.__topoMap();if(id){st.mapTap++;return;}}
      const fb=d.querySelector('#topob [data-act=tfix]');if(fb){cl(fb);return;}}
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
  const to=setTimeout(fin,opt.tmax||+process.env.TMAX||150000);
});}
/* La chincheta del mapa: toca la primera parte libre de la avería con el mismo camino que un clic en el mapa. */
const mapHook=s=>s.replace('function topoMapTake(k){','window.__topoMap=()=>{const L=topoMarksM().filter(k=>!k.w);return L.length&&topoMapTake(L[0])?L[0].id:0;};function topoMapTake(k){');
(async()=>{
  const out={};
  out.normal=await play('http://localhost/?topo=1',{});
  if(process.env.EXPRESS!=='0'){
    let pre=null;
    const r2=await play('http://localhost/?topo=express&xdur='+(+process.env.XDUR||120),{spd:+process.env.XSPD||4,tmax:+process.env.XTMAX||120000,
      tick:(w,g,st,fin)=>{
        const d=w.document;
        if(pre==null){pre={save:w.localStorage.getItem('vitchmarket.partida.v1'),car:w.localStorage.getItem('vitchmarket.carrera.v1')};}
        if(g&&g.daily&&g.daily.x)st.express=1;
        if(!st.express)return true;   /* el caso exprés arranca solo: el bot no toca la portada */
        const ov=d.querySelector('#overlay.show .sc-topox');
        if(ov){if(!st.xres){st.xres=(ov.querySelector('.reto-hero b')||{}).textContent;st.xmot=!!ov.querySelector('.tp-mot');st.xbtn=!!ov.querySelector('[data-act=topox]');w.document.querySelector('[data-act=dhome]').click();}return true;}
        if(st.xres&&!st.back){const g2=w.__g();st.back={daily:!!g2.daily,day:g2.meta.day,topoS:!!g2.meta.topoS,start:!!d.querySelector('#overlay.show .sc-start'),saveSame:w.localStorage.getItem('vitchmarket.partida.v1')===pre.save,carSame:w.localStorage.getItem('vitchmarket.carrera.v1')===pre.car};fin();return true;}
        return false;}});
    out.express=r2;
  }
  const show=r=>{console.log(JSON.stringify(r.st,null,1));console.log('errors:',r.errs.slice(0,8));};
  console.log('== Caso normal (?topo=1)');show(out.normal);
  if(out.express){console.log('== Caso exprés (?topo=express)');show(out.express);}
  const all=out.normal.errs.concat(out.express?out.express.errs:[]);
  console.log('errors:',all.slice(0,8));
  process.exit(0);
})();
