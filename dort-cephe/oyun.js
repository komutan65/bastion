import * as THREE from 'three';
import {SES} from './ses.js';
/* Dört Cephe. Each client simulates its own square (and any computer rivals);
   units sent to a player are simulated by that player. Others see 2 snapshots a second. */
const A=window.ARENA;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const num=(v,d=0)=>typeof v==='number'&&isFinite(v)?v:d;

// ---------- rules ----------
const START_MONEY=200,CASTLE_HP=500,TRICKLE=0.5,MAX_TOWERS=40;
const UNITS={
  piyade:{ad:'Piyade',cost:3,odul:2,hp:60,sp:7,dmg:2,yol:'kara'},
  atli:{ad:'Su Atlısı',cost:5,odul:3,hp:80,sp:13,dmg:3,yol:'su'},
  koc:{ad:'Koçbaşı',cost:12,odul:8,hp:320,sp:4.5,dmg:12,yol:'kara'},
  balon:{ad:'Bombalı Balon',cost:15,odul:10,hp:160,sp:6,dmg:8,yol:'hava'}
};
const TOWERS={
  ok:{ad:'Okçu Kulesi',cost:20,menzil:24,dmg:9,hiz:1.6,hava:true,yer:true},
  top:{ad:'Top Kulesi',cost:45,menzil:28,dmg:26,hiz:.6,alan:6,hava:false,yer:true},
  hava:{ad:'Hava Savunması',cost:35,menzil:36,dmg:24,hiz:1.2,hava:true,yer:false},
  duvar:{ad:'Duvar',cost:8,menzil:0,dmg:0,hiz:1,hava:false,yer:false,hp:250,duvar:true}
};
const UKEYS=Object.keys(UNITS),TKEYS=Object.keys(TOWERS);
const TEAM=['#e8a33a','#4fb6e8','#e866a8','#7fd65a'];
const BIOME=[
  {ad:'Çayır',a:'#5c9a43',b:'#8fb95c',amp:2,f:.032},
  {ad:'Çöl',a:'#dcbc76',b:'#bd9150',amp:3.6,f:.02},
  {ad:'Kar',a:'#e6eef3',b:'#a9bfd0',amp:5,f:.046},
  {ad:'Volkan',a:'#463735',b:'#83503a',amp:4.2,f:.062}
];
// ---------- map ----------
const L=160,RIVER=13,ISLE=8,CASTLE=100;
const SX=[-1,1,-1,1],SZ=[-1,-1,1,1];
const seatAt=(x,z)=>(x>0?1:0)+(z>0?2:0);
const castlePos=s=>({x:SX[s]*CASTLE,z:SZ[s]*CASTLE});
const ROADS=[   // every square has its own road, in |x|,|z| coordinates
  [[100,100],[100,58],[58,58],[58,28],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[58,100],[58,62],[28,62],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[75,52],[40,75],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[65,92],[92,45],[38,40],[26,26],[13,13],[8,8],[0,0]]
];
function roadOf(s){
  const r=ROADS[s],head=r.slice(0,-3).map(p=>new THREE.Vector3(SX[s]*p[0],0,SZ[s]*p[1]));
  const c=new THREE.CatmullRomCurve3(head,false,'catmullrom',.4).getSpacedPoints(90).map(v=>({x:v.x,z:v.z}));
  for(const p of r.slice(-3))c.push({x:SX[s]*p[0],z:SZ[s]*p[1]});
  return c;
}
const ROAD=[0,1,2,3].map(roadOf);
const G=1,GN=(L*2/G|0)+1,roadD=new Float32Array(GN*GN).fill(99);
for(const r of ROAD)for(let i=0;i<r.length-1;i++)for(let k=0;k<4;k++){
  const x=lerp(r[i].x,r[i+1].x,k/4),z=lerp(r[i].z,r[i+1].z,k/4),gx=(x+L)/G|0,gz=(z+L)/G|0;
  for(let dz=-14;dz<=14;dz++)for(let dx=-14;dx<=14;dx++){
    const X=gx+dx,Z=gz+dz;if(X<0||Z<0||X>=GN||Z>=GN)continue;
    const d=Math.hypot(X*G-L-x,Z*G-L-z),n=X+Z*GN;if(d<roadD[n])roadD[n]=d}}
const roadDist=(x,z)=>roadD[clamp(Math.round((x+L)/G),0,GN-1)+clamp(Math.round((z+L)/G),0,GN-1)*GN];
function vnoise(seed){
  const a=new Float32Array(65536);let s=seed*9301+49297;for(let i=0;i<65536;i++){s=(s*9301+49297)%233280;a[i]=s/233280}
  const at=(x,y)=>a[((x&255)+((y&255)<<8))];
  return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),u=x-xi,v=y-yi,U=u*u*(3-2*u),V=v*v*(3-2*v);
    return lerp(lerp(at(xi,yi),at(xi+1,yi),U),lerp(at(xi,yi+1),at(xi+1,yi+1),U),V)}
}
const NOISE=[0,1,2,3].map(i=>vnoise(i*7+3)),fbm=(n,x,y)=>n(x,y)*.6+n(x*2.1+9,y*2.1+4)*.28+n(x*4.3+1,y*4.3+7)*.12;
const onIsle=(x,z)=>Math.max(Math.abs(x),Math.abs(z))<=ISLE;
const shoreOf=(x,z)=>Math.min(Math.abs(x)-RIVER,Math.abs(z)-RIVER);
function heightAt(x,z){
  if(onIsle(x,z))return 1;
  const sh=shoreOf(x,z);if(sh<0)return -3;
  const s=seatAt(x,z),b=BIOME[s],n=fbm(NOISE[s],(x+200)*b.f,(z+200)*b.f);
  let h=(s===1?Math.abs(Math.sin((x+z)*.05+n*4))*1.6:0)+b.amp*n;
  const c=castlePos(s);h*=smooth(4,16,roadDist(x,z))*smooth(8,24,Math.hypot(x-c.x,z-c.z));
  return lerp(.9,lerp(-1.2,1+h,smooth(0,5,sh)),smooth(0,10,L+6-Math.max(Math.abs(x),Math.abs(z))));
}
const unitY=(u,x,z)=>u.yol==='hava'?20:u.yol==='su'?Math.max(heightAt(x,z),.35):Math.max(heightAt(x,z),1);

function polyPath(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));return{pts,c,len:c[c.length-1]}}
function pathFor(type,from,to){
  const a=castlePos(from),b=castlePos(to);
  if(UNITS[type].yol!=='kara')return polyPath([a,b]);
  return polyPath([...ROAD[from],...ROAD[to].slice().reverse()]);
}
function pointOn(p,s){
  let i=1;while(i<p.c.length-1&&p.c[i]<s)i++;
  const t=clamp((s-p.c[i-1])/Math.max(.001,p.c[i]-p.c[i-1]),0,1);
  return{x:lerp(p.pts[i-1].x,p.pts[i].x,t),z:lerp(p.pts[i-1].z,p.pts[i].z,t)};
}

// ---------- players ----------
const P=[0,1,2,3].map(s=>{const p=A.players[s];return{seat:s,on:!!p,bot:!!(p&&p.bot),name:p?String(p.name).slice(0,12):'',money:START_MONEY,hp:p?CASTLE_HP:0,dead:!p,towers:[],units:[],seen:performance.now()+45000,remote:new Map(),airSeen:0,t:0}});
const ME=P[A.seat],local=p=>p===ME||p.bot;
let uid=1,tid=1,ended=false,target=null,build=null,picked=null,tipT=0;

function canBuild(D,x,z,type){
  const wall=type==='duvar';
  if(seatAt(x,z)!==D.seat||shoreOf(x,z)<3||Math.max(Math.abs(x),Math.abs(z))>L-3||(!wall&&roadDist(x,z)<3.6))return false;
  const c=castlePos(D.seat);if(Math.hypot(x-c.x,z-c.z)<8||D.towers.length>=MAX_TOWERS)return false;
  return!D.towers.some(t=>Math.hypot(t.x-x,t.z-z)<(wall&&t.type==='duvar'?2.8:3.6));
}
const maxHp=t=>(TOWERS[t.type].hp||100)*t.lvl;
function addTower(D,type,x,z){
  const T=TOWERS[type];if(D.money<T.cost||!canBuild(D,x,z,type))return null;
  D.money-=T.cost;const t={id:tid++,type,x,z,lvl:1,hp:T.hp||100,cd:0,paid:T.cost,owner:D.seat};D.towers.push(t);makeTowerModel(t);markBuilt(D);return t;
}
function removeTower(D,t){D.towers=D.towers.filter(o=>o!==t);if(t.mesh)scene.remove(t.mesh);if(picked===t)pick(null);markBuilt(D)}
function upCost(t){return TOWERS[t.type].cost*t.lvl}
function upgrade(D,t){const c=upCost(t);if(t.lvl>=3||D.money<c)return;D.money-=c;t.paid+=c;t.lvl++;t.hp=maxHp(t);scene.remove(t.mesh);makeTowerModel(t);markBuilt(D)}
function sendUnit(D,to,type){
  const U=UNITS[type];if(!U||D.dead||D.money<U.cost)return false;
  const R=P[to];if(!R||R.dead||R===D)return false;
  D.money-=U.cost;
  if(local(R))spawn(R,type,D.seat);else say('send',{to,from:D.seat,type});
  return true;
}
function pathEnd(type,from,to,id){const l=pathFor(type,from,to).len;return l-(type==='balon'?2:7+id%5)}
function spawn(R,type,from){
  const u={id:uid++,type,from,path:pathFor(type,from,R.seat),s:0,hp:UNITS[type].hp,x:0,z:0,bomb:0,cd:0,end:pathEnd(type,from,R.seat,uid)};R.units.push(u);
  if(type==='balon')R.airSeen++;
}
function damageCastle(R,d){
  R.hp=Math.max(0,R.hp-d);
  if(R.hp<=0&&!R.dead)eliminate(R);
}
function eliminate(R){
  R.dead=true;R.hp=0;R.units=[];
  for(const t of R.towers.slice())if(t.mesh)t.mesh.visible=false;
  if(R===ME){say('dead',{s:R.seat});const left=P.filter(p=>p.on&&!p.dead).length+1;finish('Kulen yıkıldı',`${left}. oldun.`,true)}
  else tip(`${R.name} elendi!`);
  checkEnd();
}
function checkEnd(){
  if(ended||ME.dead)return;
  if(P.every(p=>!p.on||p===ME||p.dead))finish('ZAFER','Son ayakta kalan kule senin.',false);
}
function finish(a,b,watch){ended=true;$('aeTitle').textContent=a;$('aeText').textContent=b;$('aeWatch').hidden=!watch;$('arenaEnd').hidden=false}

// ---------- sound ----------
const floats=[];
function fxAt(D,x,z,kind){
  if(D!==ME&&Math.hypot(x-view.x,z-view.z)>view.d)return;
  if(kind==='bomba')SES.bomba();else if(kind==='top')SES.top();else if(kind==='okcu')SES.okcu();else if(kind==='vur')SES.top();
}
function ambience(){
  let horse=false,water=false,alarm=0;
  for(const D of P){
    if(!D.on)continue;
    for(const u of D.units.length?D.units:D.remote.values()){
      if(u.type!=='atli')continue;
      if(D!==ME&&Math.hypot(u.x-view.x,u.z-view.z)>view.d)continue;
      if(heightAt(u.x,u.z)<.3)water=true;else horse=true}}
  if(horse)SES.atli();if(water)SES.su();
  SES.int=clamp(ME.units.length/14,.12,1);
}
// ---------- simulation ----------
function simDefender(D,dt){
  if(D.dead)return;
  D.money+=TRICKLE*dt;D.t+=dt;
  for(const u of D.units){
    const U=UNITS[u.type],air=U.yol==='hava';u.cd-=dt;u.bomb-=dt;
    const wall=air?null:D.towers.find(o=>o.type==='duvar'&&Math.hypot(o.x-u.x,o.z-u.z)<3.4);
    if(!wall&&u.s<u.end){u.s=Math.min(u.end,u.s+U.sp*dt);const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z}
    if(wall){if(u.cd<=0){u.cd=1.2;wall.hp-=U.dmg*4;fxAt(D,u.x,u.z,'vur');if(wall.hp<=0)removeTower(D,wall)}}
    else if(air){       // a balloon keeps bombing until something shoots it down
      if(u.bomb<=0){
        const t=D.towers.find(o=>Math.hypot(o.x-u.x,o.z-u.z)<7);
        if(t){u.bomb=2;t.hp-=40;boom(t.x,3,t.z,3,'#ff9a30');fxAt(D,t.x,t.z,'bomba');if(t.hp<=0)removeTower(D,t)}
        else if(u.s>=u.end){u.bomb=2;const c=castlePos(D.seat);boom(c.x+(Math.random()-.5)*8,6,c.z+(Math.random()-.5)*8,4,'#ff6a30');fxAt(D,c.x,c.z,'bomba');damageCastle(D,U.dmg);if(D.dead)return}
      }
    }else if(u.s>=u.end&&u.cd<=0){u.cd=1.5;boom(u.x,3,u.z,.8,'#ffb060');damageCastle(D,U.dmg);if(D.dead)return}
  }
  for(const t of D.towers){
    const T=TOWERS[t.type];if(T.duvar)continue;t.cd-=dt;if(t.cd>0)continue;
    const r=T.menzil+(t.lvl-1)*3;let best=null,bd=r;
    for(const u of D.units){
      if(u.hp<=0)continue;const air=UNITS[u.type].yol==='hava';if(air?!T.hava:!T.yer)continue;
      const d=Math.hypot(u.x-t.x,u.z-t.z);if(d<bd){bd=d;best=u}}
    if(!best)continue;
    t.cd=1/T.hiz;const dmg=T.dmg*(1+.6*(t.lvl-1));
    best.hp-=dmg;shot(t,best);fxAt(D,t.x,t.z,t.type==='top'?'top':'okcu');
    if(T.alan){boom(best.x,2,best.z,T.alan*.5,'#ffd27a');for(const u of D.units)if(u!==best&&UNITS[u.type].yol!=='hava'&&Math.hypot(u.x-best.x,u.z-best.z)<T.alan)u.hp-=dmg*.5}
  }
  const left=[];
  for(const u of D.units){
    if(u.hp<=0){D.money+=UNITS[u.type].odul;boom(u.x,2,u.z,1.5,'#d0d0d0');if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+UNITS[u.type].odul});SES.para()}continue}
    left.push(u)}
  D.units=left;
}
function botThink(D){
  if(D.dead)return;
  const road=ROAD[D.seat],aa=D.towers.filter(t=>t.type==='hava').length,gr=D.towers.filter(t=>t.type==='ok'||t.type==='top').length;
  const place=type=>{
    for(let i=0;i<24;i++){
      const p=road[Math.random()*60|0],a=Math.random()*6.28,x=Math.round(p.x+Math.cos(a)*6),z=Math.round(p.z+Math.sin(a)*6);
      if(addTower(D,type,x,z))return true}
    return false};
  if(D.airSeen>aa*2&&D.money>=35&&place('hava'))return;
  const walls=D.towers.filter(t=>t.type==='duvar').length;
  if(walls<3&&D.money>=30&&Math.random()<.15){const p=road[30+Math.random()*40|0];if(addTower(D,'duvar',Math.round(p.x),Math.round(p.z)))return}
  if(gr<3+D.t/45&&D.money>=20&&place(gr>2&&Math.random()<.4&&D.money>=45?'top':'ok'))return;
  if(D.money<12||D.t<45||gr<3)return;      // build first, attack after the opening
  D.atk=(D.atk||0)-1;if(D.atk>0)return;D.atk=3+Math.random()*3|0;
  const foes=P.filter(p=>p.on&&!p.dead&&p!==D);if(!foes.length)return;
  const to=foes[Math.random()*foes.length|0].seat;
  let n=1+Math.min(3,D.t/120)*Math.random()|0;
  while(n-->0){const opts=UKEYS.filter(k=>UNITS[k].cost<=D.money-5);if(!opts.length)break;sendUnit(D,to,opts[Math.random()*opts.length|0])}
}
let botAcc=0;
function sim(dt){
  for(const D of P)if(local(D))simDefender(D,dt);
  botAcc+=dt;if(botAcc>=1){botAcc=0;for(const D of P)if(D.bot)botThink(D)}
}

// ---------- network ----------
let net=null,lastBuilt='';
const say=(event,payload)=>{if(net&&!P.every(p=>!p.on||p===ME||p.bot))net.send({type:'broadcast',event,payload})};
function markBuilt(D){D.dirty=true}
function snapshot(){
  if(ME.dead)return;
  const s={s:A.seat,h:Math.round(ME.hp),u:ME.units.slice(0,50).map(u=>[u.id,UKEYS.indexOf(u.type),u.x|0,u.z|0,Math.ceil(u.hp/UNITS[u.type].hp*10)])};
  if(ME.dirty||Date.now()%5000<500){ME.dirty=false;s.t=ME.towers.map(t=>[t.id,TKEYS.indexOf(t.type),t.x,t.z,t.lvl])}
  say('snap',s);
}
function onSnap(m){
  if(!m)return;const R=P[num(m.s,-1)];if(!R||R===ME||R.bot||!R.on)return;
  R.seen=performance.now();R.hp=clamp(num(m.h,R.hp),0,CASTLE_HP);
  if(Array.isArray(m.u)){const seen=new Set();for(const a of m.u.slice(0,50)){if(!Array.isArray(a)||!UKEYS[a[1]])continue;seen.add(a[0]);const o=R.remote.get(a[0]);if(o){o.tx=num(a[2]);o.tz=num(a[3]);o.pct=num(a[4],10)/10}else R.remote.set(a[0],{type:UKEYS[a[1]],x:num(a[2]),z:num(a[3]),tx:num(a[2]),tz:num(a[3]),pct:num(a[4],10)/10})}
    for(const k of R.remote.keys())if(!seen.has(k))R.remote.delete(k)}
  if(Array.isArray(m.t)){
    const keep=new Set();
    for(const a of m.t.slice(0,MAX_TOWERS)){
      if(!Array.isArray(a)||!TKEYS[a[1]])continue;const id=num(a[0]);keep.add(id);
      let t=R.towers.find(o=>o.id===id);const lvl=clamp(num(a[4],1),1,3);
      if(t&&t.lvl!==lvl){scene.remove(t.mesh);R.towers=R.towers.filter(o=>o!==t);t=null}
      if(!t){t={id,type:TKEYS[a[1]],x:clamp(num(a[2]),-L,L),z:clamp(num(a[3]),-L,L),lvl,hp:100,cd:0,owner:R.seat};R.towers.push(t);makeTowerModel(t)}}
    for(const t of R.towers.slice())if(!keep.has(t.id)){scene.remove(t.mesh);R.towers=R.towers.filter(o=>o!==t)}}
}
function connect(){
  if(P.every(p=>!p.on||p===ME||p.bot))return;
  net=A.sb.channel('mac-'+A.room,{config:{broadcast:{self:false},presence:{key:A.id}}});
  net.on('broadcast',{event:'snap'},({payload})=>onSnap(payload))
     .on('broadcast',{event:'send'},({payload})=>{const m=payload||{};if(m.to===A.seat&&!ME.dead&&UNITS[m.type]&&P[m.from])spawn(ME,m.type,m.from)})
     .on('broadcast',{event:'dead'},({payload})=>{const R=P[num(payload&&payload.s,-1)];if(R&&R!==ME&&!R.dead)eliminate(R)})
     .subscribe(s=>{if(s==='SUBSCRIBED')net.track({seat:A.seat})});
}

// ---------- scene ----------
const cv=$('game'),ov=$('ov'),oc=ov.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
let DPR=Math.min(2,devicePixelRatio||1);renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();const SKY=new THREE.Color('#9fc9e4');scene.background=SKY;scene.fog=new THREE.Fog(SKY,430,1250);
const camera=new THREE.PerspectiveCamera(62,1,1,2500);
scene.add(new THREE.HemisphereLight('#dff1ff','#6a5a48',1.25));
const sun=new THREE.DirectionalLight('#fff0d8',2.6);sun.position.set(-130,230,95);sun.castShadow=true;
const small=Math.min(innerWidth,innerHeight)<700;
sun.shadow.mapSize.set(small?2048:4096,small?2048:4096);
Object.assign(sun.shadow.camera,{left:-215,right:215,top:215,bottom:-215,near:10,far:620});sun.shadow.bias=-.0004;sun.shadow.normalBias=.5;scene.add(sun);

function buildGround(){
  const N=small?300:460,geo=new THREE.PlaneGeometry(L*2+16,L*2+16,N,N);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color(),a=new THREE.Color(),b=new THREE.Color(),road=new THREE.Color('#8d7757'),sand=new THREE.Color('#d9c893');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);p.setY(i,heightAt(x,z));
    const s=seatAt(x,z),B=BIOME[s];a.set(B.a);b.set(B.b);
    const n=fbm(NOISE[s],x*.09+50,z*.09+50);c.copy(a).lerp(b,clamp(n*1.5-.2,0,1));
    const sh=onIsle(x,z)?9:shoreOf(x,z);if(sh<4&&!onIsle(x,z))c.lerp(sand,1-clamp(sh/4,0,1));
    if(onIsle(x,z))c.copy(road);
    const d=roadDist(x,z);if(d<3.4)c.lerp(road,1-smooth(2.2,3.4,d));
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0}));m.receiveShadow=true;scene.add(m);
}
const waterU={t:{value:0},fogC:{value:SKY}};
function buildWater(){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(L*2+16,L*2+16).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:waterU,transparent:true,
    vertexShader:'varying vec3 w;void main(){vec4 v=modelMatrix*vec4(position,1.);w=v.xyz;gl_Position=projectionMatrix*viewMatrix*v;}',
    fragmentShader:`varying vec3 w;uniform float t;uniform vec3 fogC;
      void main(){float a=sin(w.x*.21+t*1.1)+sin(w.z*.17-t*.9)+sin((w.x+w.z)*.09+t*.6)+sin((w.x-w.z)*.33+t*1.7)*.5;
      float bank=${RIVER.toFixed(1)}-min(abs(w.x),abs(w.z));
      vec3 deep=vec3(.03,.2,.33),mid=vec3(.09,.42,.5),shal=vec3(.32,.66,.62);
      vec3 c=mix(shal,mid,smoothstep(.5,4.,bank));c=mix(c,deep,smoothstep(4.,11.,bank));c+=(a*.035);
      c+=vec3(.14)*pow(max(0.,a*.3),3.);
      float fm=smoothstep(2.2,.2,bank+sin(w.x*.8+w.z*.8+t*1.4)*.5+sin(t*.9+w.x*.3-w.z*.3)*.4);c=mix(c,vec3(.93,.97,.96),fm*.75);
      float f=smoothstep(430.,1250.,length(w-cameraPosition));gl_FragColor=vec4(mix(c,fogC,f),.93);}`}));
  m.position.y=0;scene.add(m);
}
function buildForest(){
  const gm=new THREE.MeshStandardMaterial({color:'#2c5228',roughness:1}),F=L+8,E=1700;
  for(const[x,z,w,d]of[[0,-(F+E/2),E*2+F*2,E],[0,F+E/2,E*2+F*2,E],[-(F+E/2),0,E,F*2],[F+E/2,0,E,F*2]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),gm);m.position.set(x,.9,z);scene.add(m)}
  const N=small?5000:11000,trunk=new THREE.CylinderGeometry(.5,.8,5,5).translate(0,2.5,0),c1=new THREE.ConeGeometry(4.6,8,7).translate(0,8,0),c2=new THREE.ConeGeometry(3.4,7,7).translate(0,12.5,0),c3=new THREE.ConeGeometry(2.2,6,7).translate(0,16.5,0);
  const ims=[[trunk,'#4e3420'],[c1,'#ffffff'],[c2,'#ffffff'],[c3,'#ffffff']].map(([g,c])=>{const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.95,flatShading:true}),N);m.frustumCulled=false;scene.add(m);return m});
  const rnd=vnoise(77),col=new THREE.Color();let k=0,tries=0,sd=12345;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  while(k<N&&tries<N*6){tries++;
    const a=R()*6.283,r=F+2+Math.pow(R(),1.5)*980;let x=Math.cos(a)*r*1.25,z=Math.sin(a)*r*1.25;
    if(k<N*.3){const u=(R()-.5)*(F+90)*2,v=(F+1+R()*90)*(R()<.5?-1:1);if(R()<.5){x=u;z=v}else{x=v;z=u}}
    if(Math.max(Math.abs(x),Math.abs(z))<F+1)continue;
    const sc=.9+R()*1.3;vp.set(x,.9,z);qt.setFromAxisAngle(UP,R()*6.28);vs.set(sc,sc*(.85+R()*.4),sc);mx.compose(vp,qt,vs);
    const sh=.5+R()*.55;col.setRGB(.16*sh,.42*sh,.17*sh);
    ims.forEach((m,i)=>{m.setMatrixAt(k,mx);if(i)m.setColorAt(k,col)});k++}
  vs.set(1,1,1);ims.forEach(m=>{m.count=k;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});
}
function buildBridges(){
  const wood=new THREE.MeshStandardMaterial({color:'#7a5a38',roughness:.8});
  for(let s=0;s<4;s++){const b=new THREE.Mesh(new THREE.BoxGeometry(5,.5,13),wood);b.position.set(SX[s]*10.5,.85,SZ[s]*10.5);b.rotation.y=Math.atan2(SX[s],SZ[s]);b.castShadow=b.receiveShadow=true;scene.add(b)}
}
const STONE=new THREE.MeshStandardMaterial({color:'#9b9a94',roughness:.85}),DARK=new THREE.MeshStandardMaterial({color:'#5b5d60',roughness:.8}),WOOD=new THREE.MeshStandardMaterial({color:'#6d4b2c',roughness:.8}),STEEL=new THREE.MeshStandardMaterial({color:'#3e4750',roughness:.4,metalness:.6});
const teamM=TEAM.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.55}));
const add=(g,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
function buildCastle(s){
  const g=new THREE.Group(),c=castlePos(s),t=teamM[s];
  add(g,new THREE.CylinderGeometry(6.2,7,3,10),DARK,0,1.5,0);
  add(g,new THREE.CylinderGeometry(3.6,4.4,13,10),STONE,0,8,0);
  for(let i=0;i<10;i++){const a=i/10*6.283;add(g,new THREE.BoxGeometry(1,1.2,1),STONE,Math.cos(a)*3.7,15,Math.sin(a)*3.7)}
  add(g,new THREE.ConeGeometry(3.4,5,10),t,0,17.8,0);add(g,new THREE.CylinderGeometry(.09,.09,4,6),WOOD,0,21.5,0);add(g,new THREE.BoxGeometry(2,1.1,.08),t,1,22.6,0);
  for(const[x,z]of[[5.5,5.5],[-5.5,5.5],[5.5,-5.5],[-5.5,-5.5]]){add(g,new THREE.CylinderGeometry(1.1,1.3,5,8),STONE,x,2.5,z);add(g,new THREE.ConeGeometry(1.4,1.8,8),t,x,5.9,z)}
  g.position.set(c.x,heightAt(c.x,c.z),c.z);scene.add(g);
}
function makeTowerModel(t){
  const g=new THREE.Group(),col=teamM[t.owner];
  if(t.type==='ok'){add(g,new THREE.CylinderGeometry(1,1.3,4+t.lvl,6),WOOD,0,(4+t.lvl)/2,0);add(g,new THREE.CylinderGeometry(1.7,1.4,.8,6),WOOD,0,4.3+t.lvl,0);add(g,new THREE.ConeGeometry(1.9,1.5,6),col,0,5.5+t.lvl,0)}
  else if(t.type==='top'){add(g,new THREE.CylinderGeometry(1.8,2.2,2.6+t.lvl,8),STONE,0,(2.6+t.lvl)/2,0);const b=add(g,new THREE.CylinderGeometry(.5,.65,3.2,8),STEEL,.7,3.4+t.lvl,0);b.rotation.z=1.25;add(g,new THREE.SphereGeometry(.9,8,6),col,-.5,3+t.lvl,0)}
  else if(t.type==='duvar'){add(g,new THREE.BoxGeometry(3.3,2.2+t.lvl*.5,3.3),STONE,0,1.1,0);for(const[x,z]of[[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]])add(g,new THREE.BoxGeometry(.8,.7,.8),STONE,x,2.7+t.lvl*.5,z)}
  else{add(g,new THREE.BoxGeometry(3,1.2,3),DARK,0,.6,0);add(g,new THREE.CylinderGeometry(.9,1.1,1.6+t.lvl*.5,8),col,0,1.8,0);for(const dz of[-.55,.55]){const b=add(g,new THREE.CylinderGeometry(.14,.14,4,6),STEEL,.9,3.4+t.lvl*.3,dz);b.rotation.z=-.65}}
  g.position.set(t.x,heightAt(t.x,t.z),t.z);scene.add(g);t.mesh=g;
}
// units are instanced: thousands of triangles, very few draw calls
const CAP=320,PARTS={
  piyade:[[new THREE.CylinderGeometry(.4,.55,1.5,6).translate(0,.75,0),null],[new THREE.SphereGeometry(.36,8,6).translate(0,1.8,0),'#e8c9a0'],[new THREE.BoxGeometry(.1,1.8,.1).translate(.6,1.2,0),'#555']],
  atli:[[new THREE.BoxGeometry(.9,.9,2.2).translate(0,.9,0),'#5b3a22'],[new THREE.BoxGeometry(.5,.8,.7).translate(0,1.5,1.2),'#5b3a22'],[new THREE.CylinderGeometry(.33,.4,1.1,6).translate(0,1.9,-.1),null],[new THREE.SphereGeometry(.28,8,6).translate(0,2.6,-.1),'#e8c9a0']],
  koc:[[new THREE.BoxGeometry(2.2,1.5,4.2).translate(0,1.1,0),'#6d4b2c'],[new THREE.ConeGeometry(1.5,1.4,4).rotateY(.785).translate(0,2.5,0),null],[new THREE.CylinderGeometry(.3,.45,5,8).rotateX(1.57).translate(0,1.1,1),'#3e4750']],
  balon:[[new THREE.SphereGeometry(3,14,10).scale(1,1.2,1).translate(0,3,0),null],[new THREE.BoxGeometry(1.5,.9,1.5).translate(0,-1.6,0),'#6d4b2c'],[new THREE.SphereGeometry(.5,8,6).translate(0,-2.5,0),'#222']]
};
const IM={};
function buildUnits(){
  for(const k of UKEYS){IM[k]=PARTS[k].map(([geo,col])=>{
    const m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:col||'#ffffff',roughness:.7}),CAP);m.castShadow=true;m.frustumCulled=false;m.count=0;m.userData.team=!col;
    if(!col)m.setColorAt(0,new THREE.Color('#fff'));scene.add(m);return m})}
}
const mx=new THREE.Matrix4(),qt=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),vp=new THREE.Vector3(),vs=new THREE.Vector3(1,1,1),tc=TEAM.map(c=>new THREE.Color(c));
function drawUnits(rdt){
  const n={};for(const k of UKEYS)n[k]=0;
  const put=(type,x,z,from,dir,D)=>{
    const i=n[type];if(i>=CAP)return;n[type]++;
    vp.set(x,unitY(UNITS[type],x,z)+(type==='balon'?Math.sin(now()/600+i)*.8:0),z);qt.setFromAxisAngle(UP,dir);mx.compose(vp,qt,vs);
    for(const m of IM[type]){m.setMatrixAt(i,mx);if(m.userData.team)m.setColorAt(i,tc[from])}};
  for(const D of P){
    if(!D.on||D.dead)continue;
    for(const u of D.units){const q=pointOn(u.path,u.s+.5);put(u.type,u.x,u.z,u.from,Math.atan2(q.x-u.x,q.z-u.z))}
    for(const o of D.remote.values()){o.x=lerp(o.x,o.tx,Math.min(1,rdt*3));o.z=lerp(o.z,o.tz,Math.min(1,rdt*3));put(o.type,o.x,o.z,D.seat,0)}
  }
  for(const k of UKEYS)for(const m of IM[k]){m.count=n[k];m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
}
// effects
const SHOTS=240,shotPos=new Float32Array(SHOTS*6),shotLife=new Float32Array(SHOTS);let shotI=0;
const shotGeo=new THREE.BufferGeometry();shotGeo.setAttribute('position',new THREE.BufferAttribute(shotPos,3));
const shotLine=new THREE.LineSegments(shotGeo,new THREE.LineBasicMaterial({color:'#fff0b0'}));shotLine.frustumCulled=false;scene.add(shotLine);
function shot(t,u){
  const i=shotI;shotI=(shotI+1)%SHOTS;const y0=heightAt(t.x,t.z)+5,y1=unitY(UNITS[u.type],u.x,u.z)+1.2;
  shotPos.set([t.x,y0,t.z,u.x,y1,u.z],i*6);shotLife[i]=.09;
}
const booms=[];const boomGeo=new THREE.SphereGeometry(1,10,8);
function boom(x,y,z,r,col){if(booms.length>50)return;const m=new THREE.Mesh(boomGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.75}));m.position.set(x,y+heightAt(x,z),z);scene.add(m);booms.push({m,t:0,r})}
function drawFx(dt){
  for(let i=0;i<SHOTS;i++)if(shotLife[i]>0){shotLife[i]-=dt;if(shotLife[i]<=0)shotPos.fill(0,i*6,i*6+6)}
  shotGeo.attributes.position.needsUpdate=true;
  for(let i=booms.length-1;i>=0;i--){const b=booms[i];b.t+=dt/.4;b.m.scale.setScalar(.3+b.t*b.r);b.m.material.opacity=.75*(1-b.t);if(b.t>=1){scene.remove(b.m);b.m.material.dispose();booms.splice(i,1)}}
}
const ring=new THREE.Mesh(new THREE.RingGeometry(.96,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.7,side:THREE.DoubleSide,depthTest:false}));ring.visible=false;ring.renderOrder=5;scene.add(ring);

// ---------- camera and input ----------
const home=castlePos(A.seat),view={x:home.x*.72,z:home.z*.72,d:150,tx:home.x*.72,tz:home.z*.72,td:150};
const DMIN=30,DMAX=420;
function applyCam(dt){
  const k=Math.min(1,dt*9);view.x=lerp(view.x,view.tx,k);view.z=lerp(view.z,view.tz,k);view.d=lerp(view.d,view.td,k);
  camera.position.set(view.x,view.d*.82,view.z+view.d*.58);camera.lookAt(view.x,0,view.z);
}
function size(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  ov.width=w*DPR;ov.height=h*DPR;oc.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',size);
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),groundP=new THREE.Plane(new THREE.Vector3(0,1,0),-1),hit=new THREE.Vector3();
function worldAt(sx,sy){ndc.set(sx/innerWidth*2-1,1-sy/innerHeight*2);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(groundP,hit)?{x:hit.x,z:hit.z}:null}
const ptr=new Map();let press=null,pinch=0;
cv.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);press=ptr.size===1?{x:e.clientX,y:e.clientY,moved:false}:null;pinch=0});
cv.addEventListener('pointermove',e=>{
  const o=ptr.get(e.pointerId);
  if(!o){if(build)hover(e.clientX,e.clientY);return}
  const dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;
  if(ptr.size===2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)view.td=clamp(view.td*pinch/d,DMIN,DMAX);pinch=d;return}
  if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;
  if(press&&press.moved){const s=view.d/innerHeight*1.3;view.tx=clamp(view.tx-dx*s,-L,L);view.tz=clamp(view.tz-dy*s*1.25,-L,L)}
  if(build)hover(e.clientX,e.clientY);
});
const up=e=>{ptr.delete(e.pointerId);if(press&&!press.moved&&e.type==='pointerup')tap(e.clientX,e.clientY);press=null};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();view.td=clamp(view.td*(e.deltaY>0?1.12:.89),DMIN,DMAX)},{passive:false});
const keys=new Set();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k==='h')toggleHud();if(k==='escape'){setBuild(null);pick(null)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function hover(sx,sy){
  const p=worldAt(sx,sy);if(!p||!build)return;const x=Math.round(p.x),z=Math.round(p.z);
  ring.visible=true;ring.position.set(x,heightAt(x,z)+.4,z);ring.scale.setScalar(Math.max(2.5,TOWERS[build].menzil));ring.material.color.set(canBuild(ME,x,z,build)&&ME.money>=TOWERS[build].cost?'#8dff9a':'#ff7a6a');
}
function tap(sx,sy){
  const p=worldAt(sx,sy);if(!p||ME.dead)return;
  for(const D of P)if(D.on&&D!==ME&&!D.dead&&!build){const c=castlePos(D.seat);if(Math.hypot(p.x-c.x,p.z-c.z)<16){setTarget(D.seat);return}}
  if(build){
    const x=Math.round(p.x),z=Math.round(p.z);
    if(ME.money<TOWERS[build].cost)tip('Paran yetmiyor');
    else if(!addTower(ME,build,x,z))tip('Buraya kurulamaz. Kendi bölgende, yolun ve kıyının dışında bir yer seç.');
    if(ME.money<TOWERS[build].cost)setBuild(null);
    return}
  let best=null,bd=4.5;for(const t of ME.towers){const d=Math.hypot(t.x-p.x,t.z-p.z);if(d<bd){bd=d;best=t}}
  pick(best);
}
function pick(t){picked=t;if(!t)ring.visible=build?ring.visible:false;$('sel').hidden=!t;if(t){ring.visible=true;ring.position.set(t.x,heightAt(t.x,t.z)+.4,t.z);ring.scale.setScalar(Math.max(2.5,TOWERS[t.type].menzil+(t.lvl-1)*3));ring.material.color.set('#fff')}}

// ---------- hud ----------
function setTarget(s){target=s;for(const b of $('gTgt').querySelectorAll('button'))b.classList.toggle('on',+b.dataset.s===s);if(s!=null)tip('Hedef: '+P[s].name)}
function liveTarget(){if(target!=null&&!P[target].dead)return target;const f=P.find(p=>p.on&&!p.dead&&p!==ME);setTarget(f?f.seat:null);return target}
function toggleHud(){const off=document.body.classList.toggle('nohud');$('eye').textContent=off?'🙈':'👁'}
function tip(m){$('tip').textContent=m;$('tip').hidden=false;tipT=3}
function setBuild(k){build=k;for(const b of $('gDef').querySelectorAll('button'))b.classList.toggle('on',b.dataset.k===k);ring.visible=false;if(k){pick(null);tip(TOWERS[k].ad+': yerleştirmek için kendi bölgene dokun')}}
function mkHud(){
  for(const k of TKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=`${TOWERS[k].ad.split(' ')[0]}<small>${TOWERS[k].cost} para</small>`;b.title=TOWERS[k].hava?'Sadece balonları vurur':'Yerdeki ve sudaki askerleri vurur';b.onclick=()=>setBuild(build===k?null:k);$('gDef').append(b)}
  for(const k of UKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=`${UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost} para</small>`;
    b.title={kara:'Ortadaki kara yolundan gider',su:'Sudan kestirme gider',hava:'Uçar, kuleleri bombalar. Sadece hava savunması vurur.'}[UNITS[k].yol];
    b.onclick=()=>{const to=liveTarget();if(to==null)return;if(!sendUnit(ME,to,k))tip('Paran yetmiyor');else tip(`${UNITS[k].ad} → ${P[to].name}`)};$('gAtk').append(b)}
  for(const D of P){if(!D.on||D===ME)continue;const b=document.createElement('button');b.dataset.s=D.seat;b.textContent=D.name;b.style.borderBottom='4px solid '+TEAM[D.seat];b.onclick=()=>setTarget(D.seat);$('gTgt').append(b)}
  for(const[k,ad]of[['muzik','Müzik'],['okcu','Okçu'],['atli','Atlı'],['bomba','Bomba'],['su','Su']]){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='s_'+k;c.checked=SES.ayar[k];c.onchange=()=>SES.set(k,c.checked);l.append(c,' '+ad);$('sesP').append(l)}
  $('bSes').onclick=()=>{$('sesP').hidden=!$('sesP').hidden};
  const wake=()=>SES.init();addEventListener('pointerdown',wake);addEventListener('keydown',wake);
  $('bHome').onclick=()=>{view.tx=home.x*.72;view.tz=home.z*.72;view.td=150};
  $('bAll').onclick=()=>{view.tx=0;view.tz=0;view.td=DMAX};
  $('eye').onclick=toggleHud;
  $('bUp').onclick=()=>{if(picked)upgrade(ME,picked);const t=picked;pick(t)};
  $('bSell').onclick=()=>{if(picked){ME.money+=Math.round(picked.paid/2);removeTower(ME,picked)}};
  $('aeAgain').onclick=()=>location.reload();$('aeWatch').onclick=()=>{$('arenaEnd').hidden=true};
  const box=$('rivals');
  for(const D of P){if(!D.on)continue;const b=document.createElement('button');b.style.borderLeftColor=TEAM[D.seat];b.innerHTML='<span></span><i></i>';D.row=b;
    b.onclick=()=>{if(D!==ME&&!D.dead)setTarget(D.seat)};box.append(b)}
  liveTarget();
  $('hud').hidden=false;$('eye').hidden=false;
}
function drawHud(){
  $('money').textContent=Math.floor(ME.money)+' para';
  for(const b of $('gDef').querySelectorAll('button'))b.disabled=ME.dead||ME.money<TOWERS[b.dataset.k].cost;
  for(const b of $('gAtk').querySelectorAll('button'))b.disabled=ME.dead||ME.money<UNITS[b.dataset.k].cost;
  for(const D of P){if(!D.row)continue;D.row.className=(D.dead?'dead ':'')+(target===D.seat?'on':'');const tb=$('gTgt').querySelector(`[data-s="${D.seat}"]`);if(tb)tb.disabled=D.dead;D.row.firstChild.textContent=D.name+(D===ME?' (sen)':'');D.row.lastChild.style.width=D.hp/CASTLE_HP*100+'%'}
  if(picked){$('bUp').textContent=picked.lvl>=3?'En üst seviye':`Yükselt ${upCost(picked)}`;$('bUp').disabled=picked.lvl>=3||ME.money<upCost(picked);$('bSell').textContent=`Sat +${Math.round(picked.paid/2)}`;
    vp.set(picked.x,heightAt(picked.x,picked.z),picked.z).project(camera);$('sel').style.left=(vp.x+1)/2*innerWidth+'px';$('sel').style.top=(1-vp.y)/2*innerHeight+'px'}
}
function drawOverlay(){
  oc.clearRect(0,0,innerWidth,innerHeight);oc.textAlign='center';oc.font='600 13px Georgia';
  for(const D of P){
    if(!D.on)continue;const c=castlePos(D.seat);vp.set(c.x,heightAt(c.x,c.z)+27,c.z).project(camera);if(vp.z>1)continue;
    const x=(vp.x+1)/2*innerWidth,y=(1-vp.y)/2*innerHeight;
    oc.fillStyle='rgba(0,0,0,.6)';oc.fillRect(x-36,y,72,7);oc.fillStyle=D.dead?'#777':TEAM[D.seat];oc.fillRect(x-36,y,72*D.hp/CASTLE_HP,7);
    oc.fillStyle='#fff';oc.shadowColor='#000';oc.shadowBlur=3;oc.fillText(D.name+(target===D.seat?'  ◎ HEDEF':''),x,y-5);oc.shadowBlur=0}
  if(view.d<260){let n=0;const bar=(type,x,z,pct)=>{if(pct>=1||n>70)return;n++;vp.set(x,unitY(UNITS[type],x,z)+(type==='balon'?8:type==='koc'?4:3.2),z).project(camera);const sx=(vp.x+1)/2*innerWidth,sy=(1-vp.y)/2*innerHeight;oc.fillStyle='rgba(0,0,0,.65)';oc.fillRect(sx-12,sy,24,4);oc.fillStyle='#62c98f';oc.fillRect(sx-12,sy,24*Math.max(0,pct),4)};
    for(const D of P){for(const u of D.units)bar(u.type,u.x,u.z,u.hp/UNITS[u.type].hp);for(const o of D.remote.values())bar(o.type,o.x,o.z,o.pct)}}
  oc.font='700 17px Georgia';oc.fillStyle='#ffd98a';
  for(const f of floats){vp.set(f.x,6+f.t*8,f.z).project(camera);oc.globalAlpha=1-f.t;oc.fillText(f.txt,(vp.x+1)/2*innerWidth,(1-vp.y)/2*innerHeight)}oc.globalAlpha=1
}

// ---------- main ----------
const now=()=>performance.now();
let ambAcc=0,lastSim=now(),snapAcc=0,hudAcc=0,lastF=now(),fps=60,slow=0;
setInterval(()=>{           // runs even when the tab is in the background
  const t=now(),dt=Math.min(1,(t-lastSim)/1000);lastSim=t;
  for(let r=dt;r>0;r-=.05)sim(Math.min(r,.05));
  snapAcc+=dt;if(snapAcc>=.5){snapAcc=0;snapshot();for(const D of P)if(D.on&&D!==ME&&!D.bot&&!D.dead&&t-D.seen>25000)eliminate(D);checkEnd()}
},33);
function frame(t){
  const dt=Math.min(.1,(t-lastF)/1000);lastF=t;fps=lerp(fps,1/Math.max(dt,.001),.05);
  slow=fps<34?slow+dt:0;if(slow>4&&DPR>1){DPR=1;renderer.setPixelRatio(1);size();slow=0}
  const p=view.d*dt*1.1;
  if(keys.has('a')||keys.has('arrowleft'))view.tx-=p;if(keys.has('d')||keys.has('arrowright'))view.tx+=p;
  if(keys.has('w')||keys.has('arrowup'))view.tz-=p;if(keys.has('s')||keys.has('arrowdown'))view.tz+=p;
  view.tx=clamp(view.tx,-L,L);view.tz=clamp(view.tz,-L,L);
  for(let i=floats.length-1;i>=0;i--){floats[i].t+=dt/1.1;if(floats[i].t>=1)floats.splice(i,1)}
  ambAcc+=dt;if(ambAcc>.3){ambAcc=0;ambience()}
  waterU.t.value=t/1000;applyCam(dt);drawUnits(dt);drawFx(dt);
  renderer.render(scene,camera);drawOverlay();
  hudAcc+=dt;if(hudAcc>.15){hudAcc=0;drawHud()}
  tipT-=dt;if(tipT<=0&&!$('tip').hidden)$('tip').hidden=true;
  requestAnimationFrame(frame);
}
buildGround();buildWater();buildBridges();buildForest();buildUnits();P.forEach(D=>{if(D.on)buildCastle(D.seat)});
size();mkHud();connect();applyCam(1);
sun.shadow.autoUpdate=true;
requestAnimationFrame(frame);
window.__O={P,sim,sendUnit,addTower,ME,finish,get ended(){return ended},get fps(){return fps},view};
