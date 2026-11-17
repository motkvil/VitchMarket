// Simulación económica: juega N turnos en solitario con un jugador que falla ERR de las veces y saca las cuentas de cada cierre.
// Uso: npm i jsdom && ERR=0.05 DAYS=15 SPD=6 node sim.js index.html   (SPD acelera el reloj del juego)
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const file=process.argv[2];const dir=path.dirname(file);
const ERR=+process.env.ERR||0,DAYS=+process.env.DAYS||15,SPD=+process.env.SPD||6;
let html=fs.readFileSync(file,'utf8');
html=html.replace('const dt=Math.min(0.1,(ts-last)/1000||0);','const dt=Math.min(0.1,(ts-last)/1000||0)*'+SPD+';')
 .replace('},1200);','},'+Math.round(1200/SPD)+');')
 .replace('function renderAll(){','window.__g=()=>({run,meta,lastEnd,front});function renderAll(){')
 .replace('<script src="productos.js"></script>','<script>'+fs.readFileSync(dir+'/productos.js','utf8')+'</script>')
 .replace('<script src="firebase-config.js"></script>','<script>window.FIREBASE_CONFIG=null</script>');
const errs=[];
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.AudioContext=undefined;try{['j_caja','j_alm','j_back','j_rrpp','j_rrhh','j_dir'].forEach(k=>w.localStorage.setItem('vitchmarket.guia.'+k,'1'));w.localStorage.setItem('vitchmarket.camaras','0');}catch(e){}}});
const w=dom.window,d=w.document,cl=el=>el&&el.click(),bad=()=>Math.random()<ERR;
const D=[5000,2000,1000,500,200,100,50,20,10,5,2,1];
const rows=[];let lastDay=0,over=null;
const fmt=c=>(c/100).toFixed(0);
setInterval(()=>{try{
  const g=w.__g&&w.__g();
  {const x=d.querySelector('#guide.show [data-act=gclose]');if(x){cl(x);return;}}
  const ov=d.querySelector('#overlay.show');
  if(ov){
    if(g&&g.lastEnd&&g.lastEnd.fin&&g.run&&g.run.over&&lastDay!==g.meta.day){lastDay=g.meta.day;const f=g.lastEnd.fin,r=g.run;
      rows.push([g.meta.day,r.served,r.angry,r.errors,fmt(f.S),fmt(f.O||0),fmt(f.cogs),fmt(f.P),fmt(f.FX||0),fmt(f.K),fmt(f.F),fmt(f.oth),fmt(f.iva+f.is),fmt(f.net),fmt(f.B),fmt(g.meta.money),g.meta.rep.toFixed(1),g.meta.emp.length,Object.values(g.meta.stock).filter(v=>v<=0).length,Object.values(g.meta.back).reduce((a,b)=>a+b,0),g.meta.emp.filter(e=>e.role==='alm').map(e=>(r.duty[e.id]||{}).st+':'+Math.round(e.moral)).join(','),g.meta.emp.map(e=>e.role+':'+((r.duty[e.id]||{}).st)).join(' ')]);}
    const h=ov.querySelector('h2');if(h&&/Quiebra|Concurso|despedido/.test(h.textContent)){over=h.textContent;finish();return;}
    if(rows.length>=DAYS){finish();return;}
    const b=ov.querySelector('[data-act=start],[data-act=next],[data-act=meeting],[data-act=endmeet]');cl(b);return;}
  if(!g||!g.run||g.run.over)return;
  const mg=d.querySelector('#mg.show');if(mg){cl(mg.querySelector('[data-act=leavecancel]')||mg.querySelector('button'));return;}
  {const sb=d.querySelector('#scene.show button[data-act=scene][data-def]')||d.querySelector('#scene.show button[data-act=scene]');if(sb){cl(sb);return;}}
  const c=g.front();if(!c)return;
  if(c.phase==='complaint'){const q=c.complaint;cl(d.querySelector('[data-act=route][data-d='+(bad()?'no':q.dept)+']'));return;}
  if(d.querySelector('[data-act=idyes]')){cl(d.querySelector(((!c.minor)!==bad())?'[data-act=idyes]':'[data-act=idno]'));return;}
  const it=d.querySelector('#belt .item');if(it){cl(it);return;}
  if(c.phase==='scan'&&c.bag!==c.wantsBag&&!bad()){cl(d.querySelector('[data-act=bag]'));return;}
  const pay=d.querySelector('[data-act=pay]:not([disabled])');if(pay){cl(pay);return;}
  const card=d.querySelector('[data-act=card]');if(card){cl(card);return;}
  const due=d.querySelector('.cashrow.due b');
  if(due){const need=c.given-(c.items.reduce((s,i)=>s+(i.scanned?i.p:0),0)+(c.bag?15:0)),cur=g.run.tray.reduce((s,v)=>s+v,0);
    if(cur<need){for(const v of D){if(need-cur>=v){cl(d.querySelector('[data-act=den][data-v="'+v+'"]'));return;}}}
    if(bad()&&cur===need)cl(d.querySelector('[data-act=den][data-v="100"]'));
    cl(d.querySelector('[data-act=deliver]'));}
}catch(e){errs.push('BOT '+e.message)}},40);
function finish(){
  console.log('ERR='+ERR+(over?' FIN: '+over:''));
  console.log(['T','atend','enf','err','ventas','otras','coste','nómina','fijos','recl','multas','otros','imp','NETO','compras','BOTE','rep','plant','agot','muelle','alm','turno'].join('\t'));
  rows.forEach(r=>console.log(r.join('\t')));
  console.log('errors',errs.slice(0,5));process.exit(0);}
setTimeout(finish,+process.env.TMAX||420000);
