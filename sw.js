/* Service worker de VitchMarket: hace el juego instalable y que funcione sin conexión.
   - index.html: primero la red (para recibir versiones nuevas) y, si no hay, la copia guardada.
   - Lo demás de la propia web (catálogo, sprites, iconos, fuentes de Google): primero la copia, y se refresca por detrás.
   - Firebase y sus scripts (gstatic, firebaseio…) nunca se guardan: la tienda compartida va siempre en directo.
   Sube CACHE en cada cambio de esta lista para borrar las copias viejas. */
const CACHE='vitchmarket-v25';
const SHELL=['./','./index.html','./productos.js','./firebase-config.js','./manifest.webmanifest',
  './assets/pix/urban.png','./assets/pix/indoor.png',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/maskable-192.png','./assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png','./assets/icons/favicon-32.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const live=u=>/firebase|gstatic\.com\/firebasejs|googleapis\.com\/(identitytoolkit|securetoken)/.test(u);
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(live(r.url))return;
  const same=u.origin===self.location.origin,fonts=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!fonts)return;
  if(r.mode==='navigate'||(same&&/\/(index\.html)?$/.test(u.pathname))){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return res;})
      .catch(()=>caches.match('./index.html').then(m=>m||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;}).catch(()=>m);
    return m||net;
  }));
});
