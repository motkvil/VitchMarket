// Uso: npm i jsdom && node smoke.js  (en la carpeta del juego). Bot que juega varios turnos y reporta errores JS.
const {JSDOM}=require('jsdom');const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace('dur:100','dur:12').replace('COMPL_P=0.14','COMPL_P=0.2').replace("Math.random()<0.55?'card'","Math.random()<0.05?'card'").replace('next:1.5','next:0.5').replace('nextTask:6','nextTask:1').replace('const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));','const clamp=(v,a,b)=>Math.max(b===5?1:a,Math.min(b,v));').replace('rnd(14,24)*','rnd(2,4)*').replace('Math.max(5.5,10.5-meta.day*0.7)','2').replace('<script src="productos.js"></script>','<script>'+fs.readFileSync('productos.js','utf8')+'</script>');
const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.AudioContext=undefined;}});
const w=dom.window,d=w.document;
const cl=el=>el&&el.click();
const D=[5000,2000,1000,500,200,100,50,20,10,5,2,1];
let stats={days:0,complaints:0,cash:0,ids:0,meet:0,meetings:0,assign:0};
const any=(root,s)=>{const a=root.querySelectorAll(s);return a.length?a[Math.floor(Math.random()*a.length)]:null;};
setInterval(()=>{
  try{
  const ov=d.querySelector('#overlay.show');
  if(ov){
    const b=ov.querySelector('[data-act=start],[data-act=next],[data-act=restart],[data-act=meeting],[data-act=endmeet]');
    if(Math.random()<.8){const x=any(ov,'[data-act=emp],[data-act=req],[data-act=hirec]:not([disabled])');if(x){stats.meet++;cl(x);return;}}
    const op=ov.querySelector('[data-act=ordp]');
    if(op&&Math.random()<.5){stats.ordp=(stats.ordp||0)+1;cl(op);return;}
    const og=ov.querySelector('[data-act=ordgo]:not([disabled])');
    if(og){stats.orders=(stats.orders||0)+1;cl(og);return;}
    if(b){if(b.dataset.act==='next'||b.dataset.act==='endmeet')stats.days++;if(b.dataset.act==='meeting')stats.meetings++;cl(b);}return;}
  const mgel=d.querySelector('#mg.show');
  if(mgel){const x=any(mgel,'button:not([disabled])');if(x){stats['mg_'+x.dataset.act]=(stats['mg_'+x.dataset.act]||0)+1;cl(x);}return;}
  if(Math.random()<.02){const sp=d.querySelector('[data-act=supervise]');if(sp){stats.sup=(stats.sup||0)+1;cl(sp);return;}}
  const rtn=d.querySelector('#register [data-act=return]');if(rtn&&Math.random()<.05){cl(rtn);return;}
  if(Math.random()<.3){const as=any(d,'[data-act=assign]:not([disabled])');if(as){stats.assign++;cl(as);return;}}
  const rt=d.querySelector('[data-act=route]');
  if(rt){stats.complaints++;const k=['atc','back','rrpp','alm','no'];cl(d.querySelector('[data-act=route][data-d='+k[Math.floor(Math.random()*5)]+']'));return;}
  const idy=d.querySelector('[data-act=idyes]');if(idy){stats.ids++;cl(Math.random()<.5?idy:d.querySelector('[data-act=idno]'));return;}
  const it=d.querySelector('.item');if(it){cl(it);return;}
  const pay=d.querySelector('[data-act=pay]:not([disabled])');if(pay){cl(pay);return;}
  const card=d.querySelector('[data-act=card]');if(card){cl(card);return;}
  const due=d.querySelector('.cashrow.due b');
  if(due){stats.cash++;let c=Math.round(parseFloat(due.textContent.replace(',','.'))*100);
    const tr=d.querySelector('.cashrow.tray b');let cur=Math.round(parseFloat(tr.textContent.replace(',','.'))*100);
    if(cur<c){for(const v of D){if(c-cur>=v){cl(d.querySelector('[data-act=den][data-v="'+v+'"]'));return;}}}
    cl(d.querySelector('[data-act=deliver]'));}
  }catch(e){errs.push('BOT '+e.message)}
},40);
setTimeout(()=>{console.log(JSON.stringify(stats),'overlayTxt:',(d.querySelector('#overlay h2')||{}).textContent,'errors:',errs.slice(0,5),'overlay:',d.querySelector('#overlay').className);process.exit(0)},60000);
