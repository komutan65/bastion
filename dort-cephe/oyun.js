import * as THREE from 'three';
import {SES} from './ses.js';
/* Dört Cephe. Each client simulates its own square (and any computer rivals);
   units sent to a player are simulated by that player. Others see 2 snapshots a second. */
const A=window.ARENA;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const num=(v,d=0)=>typeof v==='number'&&isFinite(v)?v:d;

// ---------- rules ----------
const WALL=3,START_MONEY=200,CASTLE_HP=500,TRICKLE=0.5,MAX_TOWERS=40;
const UNITS={
  piyade:{ad:'Piyade',cost:3,odul:2,hp:60,sp:7,dmg:2,yol:'kara'},
  atli:{ad:'Su Atlısı',cost:5,odul:3,hp:80,sp:13,dmg:3,yol:'su'},
  koc:{ad:'Koçbaşı',cost:12,odul:8,hp:320,sp:4.5,dmg:12,yol:'kara'},
  balon:{ad:'Bombalı Balon',cost:15,odul:10,hp:160,sp:6,dmg:8,yol:'hava'},
  fuze:{ad:'Füze',cost:30,odul:15,hp:70,sp:32,dmg:60,yol:'fuze'}
};
const TOWERS={
  ok:{ad:'Okçu Kulesi',cost:20,menzil:24,dmg:9,hiz:1.6,hava:true,yer:true},
  top:{ad:'Top Kulesi',cost:45,menzil:28,dmg:26,hiz:.6,alan:6,hava:false,yer:true},
  hava:{ad:'Hava Savunması',cost:35,menzil:36,dmg:24,hiz:1.2,hava:true,fuze:true,yer:false},
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
  if(onIsle(x,z))return -3;
  const sh=shoreOf(x,z);if(sh<0)return -3;
  const s=seatAt(x,z),b=BIOME[s],n=fbm(NOISE[s],(x+200)*b.f,(z+200)*b.f);
  let h=(s===1?Math.abs(Math.sin((x+z)*.05+n*4))*1.6:0)+b.amp*n;
  const c=castlePos(s);h*=smooth(4,16,roadDist(x,z))*smooth(8,24,Math.hypot(x-c.x,z-c.z));
  return lerp(.9,lerp(-1.2,1+h,smooth(0,5,sh)),smooth(0,10,L+6-Math.max(Math.abs(x),Math.abs(z))));
}
const unitY=(u,x,z)=>u.yol==='hava'?20:u.yol==='fuze'?34:u.yol==='su'?(heightAt(x,z)<.2?-.75:Math.max(heightAt(x,z),.35)):Math.max(heightAt(x,z),1.08);
const flies=U=>U.yol==='hava'||U.yol==='fuze';

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
let paintAt=null,uid=1,tid=1,ended=false,target=null,build=null,picked=null,tipT=0;

function canBuild(D,x,z,type){
  const wall=type==='duvar';
  if(seatAt(x,z)!==D.seat||shoreOf(x,z)<3||Math.max(Math.abs(x),Math.abs(z))>L-3||(!wall&&roadDist(x,z)<3.6))return false;
  const c=castlePos(D.seat);if(Math.hypot(x-c.x,z-c.z)<8||D.towers.length>=MAX_TOWERS)return false;
  return!D.towers.some(t=>Math.hypot(t.x-x,t.z-z)<(wall&&t.type==='duvar'?WALL-.1:3.6));
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
  if(type==='balon'||type==='fuze')R.airSeen++;
}
function comeHome(O,type,fallen,s,hp){
  if(O.dead||!UNITS[type])return;
  const p=pathFor(type,O.seat,fallen),at=clamp(s,0,p.len),pts=[pointOn(p,at)];
  for(let i=p.pts.length-1;i>=0;i--)if(p.c[i]<at)pts.push(p.pts[i]);
  const back=polyPath(pts);
  O.units.push({id:uid++,type,from:O.seat,path:back,s:0,hp:clamp(hp,1,UNITS[type].hp),x:pts[0].x,z:pts[0].z,bomb:0,cd:0,end:back.len,ret:true});
}
function damageCastle(R,d){
  R.hp=Math.max(0,R.hp-d);
  if(R.hp<=0&&!R.dead)eliminate(R);
}
function eliminate(R){
  R.dead=true;R.hp=0;
  for(const u of R.units){if(u.ret)continue;const O=P[u.from];if(!O)continue;
    if(local(O))comeHome(O,u.type,R.seat,u.s,u.hp);else say('home',{to:u.from,type:u.type,from:R.seat,s:Math.round(u.s),hp:Math.round(u.hp)})}
  R.units=R.units.filter(u=>u.ret&&!R.dead);
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
  const home=castlePos(D.seat);
  for(const u of D.units){
    const U=UNITS[u.type],air=U.yol==='hava';u.cd-=dt;u.bomb-=dt;
    if(u.ret){u.s+=U.sp*1.3*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;if(u.s>=u.end){u.done=true;const m=U.cost/2;D.money+=m;if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+m});SES.para()}}continue}
    if(U.yol==='fuze'){            // a missile flies straight at the castle
      u.s+=U.sp*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.t=clamp(u.s/u.path.len,0,1);
      if(u.s>=u.path.len-2){u.done=true;boom(home.x,6,home.z,9,'#ff7a2a');crater(home.x+(Math.random()-.5)*14,home.z+(Math.random()-.5)*14,7);fxAt(D,home.x,home.z,'bomba');damageCastle(D,U.dmg);if(D.dead)return}
      continue}
    const atBase=Math.hypot(u.x-home.x,u.z-home.z)<62||u.s>=u.end;
    u.scan=(u.scan||0)-dt;
    if(u.scan<=0){u.scan=.4;u.tgt=null;let bd=atBase?75:15;
      for(const t of D.towers){if(t.type==='duvar')continue;const d=Math.hypot(t.x-u.x,t.z-u.z);if(d<bd){bd=d;u.tgt=t}}}
    if(u.tgt&&u.tgt.hp<=0)u.tgt=null;
    const wall=air?null:D.towers.find(o=>o.type==='duvar'&&Math.hypot(o.x-u.x,o.z-u.z)<3);
    if(wall){u.anim=2;if(u.cd<=0){u.cd=1.2;wall.hp-=U.dmg*4;fxAt(D,u.x,u.z,'vur');if(wall.hp<=0)removeTower(D,wall)}}
    else if(u.tgt){               // walk to the nearest defence and tear it down
      const t=u.tgt,d=Math.hypot(t.x-u.x,t.z-u.z),reach=air?3:3.4;
      if(d>reach){u.x+=(t.x-u.x)/d*U.sp*dt;u.z+=(t.z-u.z)/d*U.sp*dt;u.off=true;u.face=Math.atan2(t.x-u.x,t.z-u.z)}
      else if(air?u.bomb<=0:u.cd<=0){
        if(air)u.bomb=2;else u.cd=1.2;
        t.hp-=air?40:U.dmg*4;boom(t.x,air?3:2.5,t.z,air?3:1,air?'#ff9a30':'#ffb060');fxAt(D,t.x,t.z,air?'bomba':'vur');
        if(air)crater(t.x+(Math.random()-.5)*4,t.z+(Math.random()-.5)*4,3.2);
        if(t.hp<=0){crater(t.x,t.z,3.6);removeTower(D,t);u.tgt=null}}
    }else if(u.off){              // back onto the road
      const p=pointOn(u.path,u.s),d=Math.hypot(p.x-u.x,p.z-u.z);
      if(d<1)u.off=false;else{u.x+=(p.x-u.x)/d*U.sp*dt;u.z+=(p.z-u.z)/d*U.sp*dt;u.face=Math.atan2(p.x-u.x,p.z-u.z)}
    }else if(u.s<u.end){u.s=Math.min(u.end,u.s+U.sp*dt);const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.face=null}
    else if(air){if(u.bomb<=0){u.bomb=2;const x=home.x+(Math.random()-.5)*8,z=home.z+(Math.random()-.5)*8;boom(x,6,z,4,'#ff6a30');crater(x,z,4);fxAt(D,home.x,home.z,'bomba');damageCastle(D,U.dmg);if(D.dead)return}}
    else if(u.cd<=0){u.cd=1.5;boom(u.x,3,u.z,.8,'#ffb060');damageCastle(D,U.dmg);if(D.dead)return}
    u.moving=!(u.s>=u.end&&!u.tgt&&!u.off)&&!wall;
  }
  for(const t of D.towers){
    const T=TOWERS[t.type];if(T.duvar)continue;t.cd-=dt;if(t.cd>0)continue;
    const r=T.menzil+(t.lvl-1)*3;let best=null,bd=r;
    for(const u of D.units){
      if(u.hp<=0||u.ret)continue;const Y=UNITS[u.type].yol;if(Y==='fuze'?!T.fuze:Y==='hava'?!T.hava:!T.yer)continue;
      const d=Math.hypot(u.x-t.x,u.z-t.z);if(d<bd){bd=d;best=u}}
    if(!best)continue;
    t.cd=1/T.hiz;const dmg=T.dmg*(1+.6*(t.lvl-1));
    best.hp-=dmg;shot(t,best);fxAt(D,t.x,t.z,t.type==='top'?'top':'okcu');
    if(T.alan){boom(best.x,2,best.z,T.alan*.5,'#ffd27a');for(const u of D.units)if(u!==best&&!u.ret&&!flies(UNITS[u.type])&&Math.hypot(u.x-best.x,u.z-best.z)<T.alan)u.hp-=dmg*.5}
  }
  const left=[];
  for(const u of D.units){
    if(u.done)continue;
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
  while(n-->0){const opts=UKEYS.filter(k=>UNITS[k].cost<=D.money-5&&(k!=='fuze'||D.t>150));if(!opts.length)break;sendUnit(D,to,opts[Math.random()*opts.length|0])}
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
  const s={s:A.seat,h:Math.round(ME.hp),u:ME.units.slice(0,50).map(u=>[u.id,UKEYS.indexOf(u.type),u.x|0,u.z|0,Math.ceil(u.hp/UNITS[u.type].hp*10),u.from])};
  if(ME.dirty||Date.now()%5000<500){ME.dirty=false;s.t=ME.towers.map(t=>[t.id,TKEYS.indexOf(t.type),t.x,t.z,t.lvl])}
  say('snap',s);
}
function onSnap(m){
  if(!m)return;const R=P[num(m.s,-1)];if(!R||R===ME||R.bot||!R.on)return;
  R.seen=performance.now();R.hp=clamp(num(m.h,R.hp),0,CASTLE_HP);
  if(Array.isArray(m.u)){const seen=new Set();for(const a of m.u.slice(0,50)){if(!Array.isArray(a)||!UKEYS[a[1]])continue;seen.add(a[0]);const o=R.remote.get(a[0]);if(o){o.tx=num(a[2]);o.tz=num(a[3]);o.pct=num(a[4],10)/10}else R.remote.set(a[0],{type:UKEYS[a[1]],x:num(a[2]),z:num(a[3]),tx:num(a[2]),tz:num(a[3]),pct:num(a[4],10)/10,from:clamp(num(a[5],R.seat),0,3)})}
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
     .on('broadcast',{event:'krater'},({payload})=>{if(Array.isArray(payload))crater(clamp(num(payload[0]),-L,L),clamp(num(payload[1]),-L,L),clamp(num(payload[2],3),1,8),true)})
     .on('broadcast',{event:'home'},({payload})=>{const m=payload||{};if(m.to===A.seat&&P[m.from])comeHome(ME,m.type,num(m.from),num(m.s),num(m.hp,1))})
     .on('broadcast',{event:'dead'},({payload})=>{const R=P[num(payload&&payload.s,-1)];if(R&&R!==ME&&!R.dead)eliminate(R)})
     .subscribe(s=>{if(s==='SUBSCRIBED')net.track({seat:A.seat})});
}

// ---------- scene ----------
const cv=$("game"),ov=$('ov'),oc=ov.getContext('2d');
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

function paintGround(){
  THREE.ColorManagement.enabled=false;      // the canvas wants plain sRGB values
  const SZ_=small?2048:4096,LO=small?720:1100,W=L*2+16,cv2=document.createElement('canvas');cv2.width=cv2.height=SZ_;const g=cv2.getContext('2d');
  const lo=document.createElement('canvas');lo.width=lo.height=LO;const lg=lo.getContext('2d'),id=lg.createImageData(LO,LO),a=new THREE.Color(),b=new THREE.Color(),c=new THREE.Color(),sand=new THREE.Color('#dcca96');
  for(let y=0;y<LO;y++)for(let x=0;x<LO;x++){
    const X=(x+.5)/LO*W-W/2,Z=(y+.5)/LO*W-W/2,isle=onIsle(X,Z),s=seatAt(X,Z),B=BIOME[s];a.set(B.a);b.set(B.b);
    const n=fbm(NOISE[s],X*.05+50,Z*.05+50),m=NOISE[s](X*.3+9,Z*.3+3);c.copy(a).lerp(b,clamp(n*1.7-.35+m*.25,0,1));
    const h=heightAt(X,Z),k=1+clamp(h*.035,-.1,.14);c.multiplyScalar(k);
    const sh=shoreOf(X,Z);if(!isle&&sh<6)c.lerp(sand,1-smooth(1,6,sh));
    if(isle)c.set('#8c7a5e');
    {const ed=Math.max(Math.abs(X),Math.abs(Z));if(ed>L-3)c.lerp(a.set('#39602b'),smooth(L-3,L+6,ed))}
    const o=(x+y*LO)*4;id.data[o]=c.r*255;id.data[o+1]=c.g*255;id.data[o+2]=c.b*255;id.data[o+3]=255}
  lg.putImageData(id,0,0);
  // colours above are linear, so bring them to sRGB space for the canvas
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.filter='none';g.drawImage(lo,0,0,SZ_,SZ_);
  const S=SZ_/W,px=v=>(v+W/2)*S,rnd=(()=>{let d=4711;return()=>(d=(d*16807)%2147483647)/2147483647})();
  const spots=small?70000:220000;
  const paint=[
    ['#3f7a30','#6fa346','#a6c766','#2f6226'],
    ['#b48a4c','#ecd28f','#c9a464','#9d7740'],
    ['#ffffff','#c7d6e2','#9db4c7','#eef5fa'],
    ['#2a2120','#5f3d30','#8d4a30','#1d1716']];
  for(let i=0;i<spots;i++){
    const X=(rnd()-.5)*W,Z=(rnd()-.5)*W,sh=shoreOf(X,Z);if(sh<2||onIsle(X,Z)||Math.max(Math.abs(X),Math.abs(Z))>L+8)continue;
    const s=seatAt(X,Z),p=paint[s];g.fillStyle=p[rnd()*4|0];g.globalAlpha=.16+rnd()*.3;
    const l=(s===0?1.4:s===1?3.5:2)*(1+rnd()*2.4);
    if(s===0){g.fillRect(px(X),px(Z),1.1+rnd()*.8,l*1.6)}else if(s===1){g.fillRect(px(X),px(Z),l*2.2,1)}else{g.beginPath();g.arc(px(X),px(Z),l*.6,0,6.3);g.fill()}}
  g.globalAlpha=1;
  for(let i=0;i<(small?900:2600);i++){       // meadow flowers and pebbles, lava cracks glow
    const X=(rnd()-.5)*W,Z=(rnd()-.5)*W;if(shoreOf(X,Z)<3||roadDist(X,Z)<4||Math.max(Math.abs(X),Math.abs(Z))>L)continue;const s=seatAt(X,Z);
    g.fillStyle=s===0?['#f5e38c','#f1a7c0','#fff','#c9b4f4'][rnd()*4|0]:s===1?'#8d6b3a':s===2?'#8ea6ba':'#ff7a2c';g.globalAlpha=s===3?.55:.8;
    g.beginPath();g.arc(px(X),px(Z),(s===3?1.4:1.6)*(1+rnd()),0,6.3);g.fill()}
  g.globalAlpha=1;g.lineCap='round';g.lineJoin='round';
  const stroke=(col,w,dash)=>{g.strokeStyle=col;g.lineWidth=w*S;g.setLineDash(dash?dash.map(v=>v*S):[]);
    for(const r of ROAD){g.beginPath();r.forEach((p,i)=>i?g.lineTo(px(p.x),px(p.z)):g.moveTo(px(p.x),px(p.z)));g.stroke()}};
  stroke('rgba(60,45,28,.5)',6.4);stroke('#8a7350',5.2);stroke('#a48c66',3.9);stroke('rgba(90,70,45,.42)',.5,[2.4,1.5]);
  g.setLineDash([]);
  for(let i=0;i<(small?2600:9000);i++){const r=ROAD[rnd()*4|0],p=r[rnd()*r.length|0],X=p.x+(rnd()-.5)*5,Z=p.z+(rnd()-.5)*5;g.fillStyle=['#7b6848','#b7a07a','#66543a'][rnd()*3|0];g.globalAlpha=.55;g.fillRect(px(X),px(Z),1.5+rnd()*2.5,1.2+rnd()*2)}
  g.globalAlpha=1;THREE.ColorManagement.enabled=true;return cv2;
}
function detailTile(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),id=g.createImageData(256,256);let d=99;const r=()=>(d=(d*16807)%2147483647)/2147483647;
  for(let i=0;i<256*256;i++){const v=118+r()*20+(r()<.08?(r()-.5)*90:0);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255}
  g.putImageData(id,0,0);g.globalCompositeOperation='overlay';g.filter='blur(1px)';g.drawImage(c,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function buildGround(){
  const N=small?300:460,geo=new THREE.PlaneGeometry(L*2+16,L*2+16,N,N);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,heightAt(p.getX(i),p.getZ(i)));geo.computeVertexNormals();
  const c=paintGround(),map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const mat=new THREE.MeshStandardMaterial({map,roughness:.95,metalness:0,bumpMap:map,bumpScale:small?.5:.9}),dtl=detailTile();
  mat.onBeforeCompile=sh=>{sh.uniforms.dtl={value:dtl};
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D dtl;')
      .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=texture2D(dtl,vMapUv*38.).r*1.08+texture2D(dtl,vMapUv*170.).r*1.08;');};
  const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;scene.add(m);GM={geo,N,W:L*2+16};
}
const waterU={t:{value:0},fogC:{value:SKY},sun:{value:new THREE.Vector3(-130,230,95).normalize()}};
function buildWater(){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(L*2+16,L*2+16).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:waterU,transparent:true,
    vertexShader:'varying vec3 w;void main(){vec4 v=modelMatrix*vec4(position,1.);w=v.xyz;gl_Position=projectionMatrix*viewMatrix*v;}',
    fragmentShader:`precision highp float;varying vec3 w;uniform float t;uniform vec3 fogC,sun;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float wave(vec2 p){float a=0.,s=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){a+=s*n(p);p=r*p*2.03+vec2(t*.35,-t*.22);s*=.5;}return a;}
      void main(){
        float across=abs(w.x)<abs(w.z)?abs(w.x):abs(w.z);
        float bank=min(${RIVER.toFixed(1)}-across,length(w.xz)-12.5);
        vec2 flow=abs(w.x)<abs(w.z)?vec2(0.,t*1.3*sign(w.z)):vec2(t*1.3*sign(w.x),0.);
        vec2 p=(w.xz-flow)*.42;float e=.12,c0=wave(p);
        vec3 N=normalize(vec3(c0-wave(p+vec2(e,0.)),e*2.2,c0-wave(p+vec2(0.,e))));
        vec3 V=normalize(cameraPosition-w);float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
        vec3 sky=mix(vec3(.62,.78,.9),vec3(.28,.5,.76),clamp(reflect(-V,N).y,0.,1.));
        float depth=smoothstep(.2,7.,bank);
        vec3 bed=mix(vec3(.72,.65,.46),vec3(.2,.34,.32),smoothstep(0.,2.8,bank));
        float cau=pow(n(w.xz*.9+t*.5+N.xz*2.)*n(w.xz*.7-t*.4),1.5)*1.6;bed+=cau*vec3(.3,.34,.26)*(1.-depth);
        vec3 body=mix(bed,vec3(.015,.13,.2),depth*.94);
        vec3 c=mix(body,sky,fr*.85);
        vec3 Hv=normalize(sun+V);c+=vec3(1.,.95,.82)*pow(max(dot(N,Hv),0.),420.)*1.1;
        float fm=smoothstep(.9,.05,bank+(n(w.xz*.7+t*.25)-.5)*1.5+sin(t*.8+across*.4)*.2);
        fm=max(fm,smoothstep(.72,.9,c0)*.14);
        c=mix(c,vec3(.92,.96,.95),fm*.8);
        float f=smoothstep(430.,1250.,length(w-cameraPosition));
        gl_FragColor=vec4(mix(c,fogC,f),mix(.62,.97,depth));
        #include <colorspace_fragment>
      }`}));
  m.position.y=0;scene.add(m);
}
// rings that spread out behind anything moving through the water
const RIPPLES=[],ripM=new THREE.RingGeometry(.72,1,28).rotateX(-Math.PI/2);
for(let i=0;i<46;i++){const m=new THREE.Mesh(ripM,new THREE.MeshBasicMaterial({color:'#eefaff',transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);RIPPLES.push({m,t:1})}
let ripI=0;
function ripple(x,z,size){const r=RIPPLES[ripI];ripI=(ripI+1)%RIPPLES.length;r.t=0;r.s=size;r.m.visible=true;r.m.position.set(x+(Math.random()-.5)*.8,.06,z+(Math.random()-.5)*.8)}
function drawRipples(dt){for(const r of RIPPLES){if(r.t>=1)continue;r.t+=dt/1.3;r.m.scale.setScalar(.6+r.t*r.s);r.m.material.opacity=.55*(1-r.t);if(r.t>=1)r.m.visible=false}}
function grassTex(){
  const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.fillStyle='#39602b';g.fillRect(0,0,1024,1024);
  const R=()=>Math.random(),cols=['#2d5223','#3f6d2e','#4f8237','#5f9440','#6f9f46','#2a4a24','#7a8f42','#58512f'];
  for(let i=0;i<34000;i++){const x=R()*1024,y=R()*1024,l=7+R()*20,a=-1.57+(R()-.5)*1.1,col=cols[R()*8|0];g.strokeStyle=col;g.globalAlpha=.55+R()*.4;g.lineWidth=.8+R()*1.5;
    for(const[dx,dy]of[[0,0],[1024,0],[-1024,0],[0,1024],[0,-1024]]){if(x+dx<-30||x+dx>1054||y+dy<-30||y+dy>1054)continue;g.beginPath();g.moveTo(x+dx,y+dy);g.quadraticCurveTo(x+dx+Math.cos(a)*l*.5,y+dy+Math.sin(a)*l*.5,x+dx+Math.cos(a)*l+(R()-.5)*5,y+dy+Math.sin(a)*l);g.stroke()}}
  g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function buildForest(){
  const gt=grassTex(),gm=new THREE.MeshStandardMaterial({map:gt,bumpMap:gt,bumpScale:.8,roughness:1}),F=L+8,E=1700;
  gm.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat pa=texture2D(map,vMapUv*.073).g*.6+texture2D(map,vMapUv*.0171+.3).g*.8;diffuseColor.rgb*=vec3(.62+pa*.7,.68+pa*.62,.56+pa*.5);')};
  for(const[x,z,w,d]of[[0,-(F+E/2),E*2+F*2,E],[0,F+E/2,E*2+F*2,E],[-(F+E/2),0,E,F*2],[F+E/2,0,E,F*2]]){const g=new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/34,uv.getY(i)*d/34);const m=new THREE.Mesh(g,gm);m.position.set(x,.9,z);m.receiveShadow=true;scene.add(m)}
  {const n=small?2600:8000,bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5,1),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.95,flatShading:true}),n),cc=new THREE.Color();bush.frustumCulled=false;
   let sdb=777;const Rb=()=>(sdb=(sdb*16807)%2147483647)/2147483647;let k=0;
   while(k<n){const x=(Rb()-.5)*1100,z=(Rb()-.5)*1100;if(Math.max(Math.abs(x),Math.abs(z))<F+3)continue;const sc=.55+Rb()*1.1;vp.set(x,1+sc*.3,z);qt.setFromAxisAngle(UP,Rb()*6.3);vs.set(sc*1.3,sc*.75,sc*1.3);mx.compose(vp,qt,vs);bush.setMatrixAt(k,mx);cc.setRGB(.13+Rb()*.1,.3+Rb()*.16,.09+Rb()*.06);bush.setColorAt(k,cc);k++}
   vs.set(1,1,1);bush.count=k;scene.add(bush)}
  const N=small?7000:20000,KIND=[
    {n:.5,parts:[[new THREE.CylinderGeometry(.4,.7,4,5).translate(0,2,0),'#4b3320',0],[new THREE.ConeGeometry(3.6,7,8).translate(0,6.5,0),'#2f6a33',1],[new THREE.ConeGeometry(2.7,6,8).translate(0,10.5,0),'#347539',1],[new THREE.ConeGeometry(1.7,5,8).translate(0,14,0),'#3a8040',1]]},
    {n:.33,parts:[[new THREE.CylinderGeometry(.5,.8,5,6).translate(0,2.5,0),'#5a3d24',0],[new THREE.IcosahedronGeometry(4,1).translate(0,8,0),'#4d8f3a',1],[new THREE.IcosahedronGeometry(2.9,1).translate(2.2,9.6,.8),'#5da045',1],[new THREE.IcosahedronGeometry(2.6,1).translate(-1.9,10,-1),'#468334',1]]},
    {n:.17,parts:[[new THREE.CylinderGeometry(.28,.42,9,6).translate(0,4.5,0),'#d8d4c8',0],[new THREE.IcosahedronGeometry(2.8,1).scale(1,1.5,1).translate(0,11,0),'#9dbb46',1]]}];
  let sd=12345;const R=()=>(sd=(sd*16807)%2147483647)/2147483647,col=new THREE.Color();
  const REACH=900,place=[];
  for(const K of KIND){K.ims=K.parts.map(([g,c])=>{const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.92,flatShading:true}),Math.ceil(N*K.n));m.frustumCulled=false;scene.add(m);return m});K.k=0}
  let tries=0,done=0;
  while(done<N&&tries<N*8){tries++;
    const x=(R()-.5)*REACH*2,z=(R()-.5)*REACH*2;if(Math.max(Math.abs(x),Math.abs(z))<F+11)continue;
    const r=R(),K=r<KIND[0].n?KIND[0]:r<KIND[0].n+KIND[1].n?KIND[1]:KIND[2];if(K.k>=K.ims[0].instanceMatrix.count)continue;
    const sc=.72+R()*.4;vp.set(x,.9,z);qt.setFromAxisAngle(UP,R()*6.28);vs.set(sc,sc*(.9+R()*.3),sc);mx.compose(vp,qt,vs);
    const sh=.72+R()*.42;col.setRGB(sh,sh*(.94+R()*.1),sh*.9);
    K.ims.forEach((m,i)=>{m.setMatrixAt(K.k,mx);if(KIND&&K.parts[i][2])m.setColorAt(K.k,col)});K.k++;done++}
  vs.set(1,1,1);for(const K of KIND)K.ims.forEach(m=>{m.count=K.k;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});
}
function cobble(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#6b6458';g.fillRect(0,0,512,512);
  for(let y=0;y<16;y++)for(let x=-1;x<17;x++){const v=120+Math.random()*48|0;g.fillStyle=`rgb(${v},${v-6},${v-18})`;g.beginPath();g.roundRect((x+(y%2)*.5)*32+1.5,y*32+1.5,29,29,7);g.fill()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function buildBridges(){
  const tex=cobble(),top=tex.clone();top.repeat.set(3,3);top.needsUpdate=true;const deckT=tex.clone();deckT.repeat.set(1.5,4);deckT.needsUpdate=true;
  const paved=new THREE.MeshStandardMaterial({map:top,bumpMap:top,bumpScale:.25,roughness:.85}),deck=new THREE.MeshStandardMaterial({map:deckT,bumpMap:deckT,bumpScale:.25,roughness:.85}),side=new THREE.MeshStandardMaterial({color:'#8f8a7c',roughness:.9});
  const Y=1.06;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(12.5,13.4,4,56),side);base.position.y=Y-2.02;base.receiveShadow=true;scene.add(base);
  const pl=new THREE.Mesh(new THREE.CircleGeometry(12.5,56).rotateX(-Math.PI/2),paved);pl.position.y=Y;pl.receiveShadow=true;scene.add(pl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(12.5,.32,10,72).rotateX(Math.PI/2),side);rim.position.y=Y+.08;rim.castShadow=true;scene.add(rim);
  const f=new THREE.Mesh(new THREE.CylinderGeometry(2.8,3.1,.7,28),side);f.position.y=Y+.35;f.castShadow=true;scene.add(f);
  const fw=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,.1,28),new THREE.MeshStandardMaterial({color:'#3f93a8',roughness:.2}));fw.position.y=Y+.72;scene.add(fw);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.4,.7,2.6,12),side);c.position.y=Y+1.6;c.castShadow=true;scene.add(c);
  const a0=11.5,a1=24,len=a1-a0;     // from the plaza edge to dry land, measured along the diagonal
  for(let s=0;s<4;s++){
    const g=new THREE.Group();g.rotation.y=Math.atan2(SX[s],SZ[s]);scene.add(g);
    const m=new THREE.Mesh(new THREE.BoxGeometry(6.6,.5,len),[side,side,deck,side,side,side]);m.position.set(0,Y-.25,a0+len/2);m.castShadow=m.receiveShadow=true;g.add(m);
    for(const sx of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.42,.62,len),side);r.position.set(sx*3.2,Y+.3,a0+len/2);r.castShadow=true;g.add(r);
      for(let k=0;k<3;k++){const q=new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,3.4,10),side);q.position.set(sx*2.5,Y-2,a0+2.5+k*(len-5)/2);q.castShadow=true;g.add(q)}}
  }
}
function brickTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#55534e';g.fillRect(0,0,256,256);
  for(let y=0;y<8;y++)for(let x=-1;x<6;x++){const v=128+Math.random()*50|0;g.fillStyle=`rgb(${v},${v-3},${v-10})`;g.fillRect(x*51+(y%2)*25+2,y*32+2,47,28)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1.5);t.anisotropy=8;return t}
const brick=brickTex();
const STONE=new THREE.MeshStandardMaterial({map:brick,bumpMap:brick,bumpScale:.4,roughness:.9}),DARK=new THREE.MeshStandardMaterial({color:'#5b5d60',roughness:.8}),WOOD=new THREE.MeshStandardMaterial({color:'#6d4b2c',roughness:.8}),STEEL=new THREE.MeshStandardMaterial({color:'#3e4750',roughness:.4,metalness:.6});
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
  else if(t.type==='duvar'){const h=2.6+t.lvl*.5;add(g,new THREE.BoxGeometry(WALL,h,WALL),STONE,0,h/2,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])add(g,new THREE.BoxGeometry(.7,.7,.7),STONE,x,h+.35,z)}
  else{add(g,new THREE.BoxGeometry(3,1.2,3),DARK,0,.6,0);add(g,new THREE.CylinderGeometry(.9,1.1,1.6+t.lvl*.5,8),col,0,1.8,0);for(const dz of[-.55,.55]){const b=add(g,new THREE.CylinderGeometry(.14,.14,4,6),STEEL,.9,3.4+t.lvl*.3,dz);b.rotation.z=-.65}}
  g.position.set(t.x,heightAt(t.x,t.z),t.z);scene.add(g);t.mesh=g;
}
// units are instanced: thousands of triangles, very few draw calls
const CAP=320,SKIN='#e8c9a0',IRON='#59626c',LEATH='#5a3a22',HORSE='#6b4426';
const bx=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z),cy=(a,b,h,x,y,z,n=8)=>new THREE.CylinderGeometry(a,b,h,n).translate(x,y,z),sp=(r,x,y,z)=>new THREE.SphereGeometry(r,10,8).translate(x,y,z);
const cp=(r,l,x,y,z)=>new THREE.CapsuleGeometry(r,l,4,10).translate(x,y,z);
const LEG=(p,a,ph)=>({p,a,ph}),BOOT='#2a2622',TROU='#3b3a34';
const PARTS={
  piyade:[
    [cp(.2,.7,-.24,.72,0),TROU,LEG([-.24,1.22,0],.7,0)],[cp(.2,.7,.24,.72,0),TROU,LEG([.24,1.22,0],.7,3.14)],
    [bx(.34,.22,.52,-.24,.1,.08),BOOT,LEG([-.24,1.22,0],.7,0)],[bx(.34,.22,.52,.24,.1,.08),BOOT,LEG([.24,1.22,0],.7,3.14)],
    [cy(.36,.46,.5,0,1.42,0,12),TROU],[cy(.52,.42,1.05,0,2.1,0,12),null],[cy(.47,.47,.16,0,1.62,0,12),LEATH],
    [cp(.17,.68,-.68,2.05,0),null,LEG([-.68,2.55,0],.55,3.14)],[cp(.17,.68,.68,2.05,0),null,LEG([.68,2.55,0],.55,0)],
    [sp(.17,-.68,1.48,0),SKIN,LEG([-.68,2.55,0],.55,3.14)],[sp(.17,.68,1.48,0),SKIN,LEG([.68,2.55,0],.55,0)],
    [cy(.15,.17,.26,0,2.72,0,8),SKIN],[sp(.34,0,3.05,.02),SKIN],[new THREE.SphereGeometry(.39,12,7,0,6.3,0,1.65).translate(0,3.1,0),IRON],[cy(.48,.5,.07,0,3.03,0,16),IRON],[bx(.08,.34,.14,0,3.02,.36),IRON],
    [new THREE.CylinderGeometry(.62,.62,.09,16).rotateX(1.57).translate(-.84,2.05,.28),null,LEG([-.68,2.55,0],.3,3.14)],[sp(.14,-.84,2.05,.36),'#c9ced4',LEG([-.68,2.55,0],.3,3.14)],
    [cy(.045,.045,3.6,.76,2.3,.28,6),'#6d4b2c',LEG([.68,2.55,0],.18,0)],[new THREE.ConeGeometry(.12,.55,6).translate(.76,4.35,.28),'#c9ced4',LEG([.68,2.55,0],.18,0)]],
  atli:[
    [new THREE.CapsuleGeometry(.72,1.9,6,12).rotateX(1.57).translate(0,2.05,0),HORSE],[sp(.8,0,2.15,.95),HORSE],[sp(.78,0,2.2,-.95),HORSE],
    [new THREE.CapsuleGeometry(.36,.95,4,10).rotateX(.72).translate(0,2.95,1.75),HORSE],[new THREE.CapsuleGeometry(.24,.62,4,10).rotateX(1.3).translate(0,3.42,2.45),HORSE],[sp(.2,0,3.3,2.82),'#3b2614'],
    [new THREE.ConeGeometry(.08,.3,5).translate(-.14,3.86,2.08),HORSE],[new THREE.ConeGeometry(.08,.3,5).translate(.14,3.86,2.08),HORSE],
    [bx(.13,1.25,.5,0,3.3,1.45),'#241609'],[bx(.14,1.5,.2,0,1.75,-1.8),'#241609'],
    ...[[-.42,.95,1],[.42,.95,4.14],[-.42,-.95,3.14],[.42,-.95,0]].flatMap(([x,z,ph])=>[[cp(.15,.72,x,1.08,z),HORSE,LEG([x,1.75,z],.75,ph)],[cp(.11,.42,x,.42,z),'#3b2614',LEG([x,1.75,z],.75,ph)],[cy(.15,.17,.16,x,.08,z,8),'#17120d',LEG([x,1.75,z],.75,ph)]]),
    [cy(.74,.74,.28,0,2.82,-.12,14),'#7a2d2d'],
    // the rider: hips, thighs astride the horse, torso, arms, head, helmet, lance
    [cy(.3,.34,.42,0,3.18,-.12,10),TROU],[new THREE.CapsuleGeometry(.17,.72,4,8).rotateZ(.5).translate(-.5,2.82,-.1),TROU],[new THREE.CapsuleGeometry(.17,.72,4,8).rotateZ(-.5).translate(.5,2.82,-.1),TROU],
    [cp(.13,.55,-.72,2.15,-.04),TROU],[cp(.13,.55,.72,2.15,-.04),TROU],[bx(.26,.16,.46,-.74,1.72,.04),BOOT],[bx(.26,.16,.46,.74,1.72,.04),BOOT],
    [cy(.42,.34,.98,0,3.82,-.08,12),null],[cy(.48,.48,.14,0,3.34,-.08,12),LEATH],
    [new THREE.CapsuleGeometry(.14,.55,4,8).rotateX(.9).translate(-.5,3.92,.28),null],[new THREE.CapsuleGeometry(.14,.55,4,8).rotateX(.9).translate(.5,3.92,.28),null],
    [sp(.15,-.5,3.68,.62),SKIN],[sp(.15,.5,3.68,.62),SKIN],[cy(.13,.15,.2,0,4.38,-.08,8),SKIN],[sp(.3,0,4.68,-.06),SKIN],
    [new THREE.SphereGeometry(.35,12,7,0,6.3,0,1.65).translate(0,4.72,-.06),IRON],[new THREE.ConeGeometry(.09,.5,6).translate(0,5.22,-.06),IRON],
    [new THREE.CylinderGeometry(.045,.045,4.6,6).rotateX(1.3).translate(.5,3.95,1.5),'#6d4b2c'],[new THREE.ConeGeometry(.11,.5,6).rotateX(1.3).translate(.5,4.55,3.85),'#c9ced4']],
  koc:[[bx(2.4,.5,4.6,0,1.1,0),'#6d4b2c'],[new THREE.ConeGeometry(2.1,1.9,4).rotateY(.785).scale(.85,1,1.5).translate(0,2.9,0),null],[bx(.3,1.2,.3,-1,1.9,-1.8),'#4b3320'],[bx(.3,1.2,.3,1,1.9,-1.8),'#4b3320'],[bx(.3,1.2,.3,-1,1.9,1.8),'#4b3320'],[bx(.3,1.2,.3,1,1.9,1.8),'#4b3320'],
    [new THREE.CylinderGeometry(.34,.42,6,10).rotateX(1.57).translate(0,1.7,.8),'#59402a'],[new THREE.ConeGeometry(.5,1,10).rotateX(1.57).translate(0,1.7,4.3),IRON],
    ...[-1.3,1.3].flatMap(x=>[-1.5,1.5].map(z=>[new THREE.CylinderGeometry(.65,.65,.3,14).rotateZ(1.57).translate(x,.65,z),'#2d2a28']))],
  balon:[[new THREE.SphereGeometry(3.4,24,16).scale(1,1.2,1).translate(0,4.2,0),null],[new THREE.TorusGeometry(3.42,.13,8,32).rotateX(1.57).translate(0,4.2,0),'#fff4d6'],[new THREE.TorusGeometry(2.7,.11,8,32).rotateX(1.57).translate(0,6.6,0),'#fff4d6'],[new THREE.TorusGeometry(2.7,.11,8,32).rotateX(1.57).translate(0,1.8,0),'#fff4d6'],[new THREE.ConeGeometry(1.5,1.8,16).rotateX(3.14).translate(0,-.4,0),null],[cy(.04,.04,2.4,-.6,-1.9,-.6,4),'#3b2614'],[cy(.04,.04,2.4,.6,-1.9,-.6,4),'#3b2614'],[cy(.04,.04,2.4,-.6,-1.9,.6,4),'#3b2614'],[cy(.04,.04,2.4,.6,-1.9,.6,4),'#3b2614'],[bx(1.6,.95,1.6,0,-3.3,0),LEATH],[sp(.5,0,-4.1,0),'#1c1c1e']],
  fuze:[[new THREE.CylinderGeometry(.5,.5,4.4,14).rotateX(1.57),'#d8dde2'],[new THREE.ConeGeometry(.5,1.5,14).rotateX(1.57).translate(0,0,2.95),null],[new THREE.CylinderGeometry(.54,.54,.5,14).rotateX(1.57).translate(0,0,1.1),null],[bx(2.2,.1,.8,0,0,-1.85),'#59626c'],[bx(.1,2.2,.8,0,0,-1.85),'#59626c'],[new THREE.ConeGeometry(.38,1.5,10).rotateX(-1.57).translate(0,0,-2.9),'#ff9a30']]
};
const IM={};
function buildUnits(){
  for(const k of UKEYS){IM[k]=PARTS[k].map(([geo,col,swing])=>{
    const m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:col||'#ffffff',roughness:.7}),CAP);m.castShadow=true;m.frustumCulled=false;m.count=0;m.userData.team=!col;m.userData.swing=swing||null;
    if(!col)m.setColorAt(0,new THREE.Color('#fff'));scene.add(m);return m})}
}
const mt=new THREE.Matrix4(),mr=new THREE.Matrix4(),mb=new THREE.Matrix4(),mo=new THREE.Matrix4(),qr=new THREE.Quaternion(),XA=new THREE.Vector3(1,0,0),mx=new THREE.Matrix4(),qt=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),vp=new THREE.Vector3(),vs=new THREE.Vector3(1,1,1),tc=TEAM.map(c=>new THREE.Color(c));
function drawUnits(rdt){
  const n={};for(const k of UKEYS)n[k]=0;
  const put=(type,x,z,from,dir,moving=true,pitchY=null,pitch=0)=>{
    const i=n[type];if(i>=CAP)return;n[type]++;
    const walk=(type==='atli'?.0125:.0075)*now()+i*1.7,inW=type==='atli'&&heightAt(x,z)<.2;
    const hop=type==='balon'?Math.sin(now()/600+i)*.8:type==='koc'||type==='fuze'?0:moving?Math.abs(Math.sin(walk))*(inW?.08:.2):0;
    vp.set(x,(pitchY??unitY(UNITS[type],x,z))+hop,z);qt.setFromAxisAngle(UP,dir);
    if(pitch){qr.setFromAxisAngle(XA,pitch);qt.multiply(qr)}
    mx.compose(vp,qt,vs);
    for(const m of IM[type]){
      const sw=m.userData.swing;
      if(sw&&moving){const a=Math.sin(walk+sw.ph)*sw.a;mt.makeTranslation(sw.p[0],sw.p[1],sw.p[2]);mr.makeRotationX(a);mb.makeTranslation(-sw.p[0],-sw.p[1],-sw.p[2]);mo.copy(mx).multiply(mt).multiply(mr).multiply(mb);m.setMatrixAt(i,mo)}
      else m.setMatrixAt(i,mx);
      if(m.userData.team)m.setColorAt(i,tc[from])}};
  for(const D of P){
    if(!D.on||D.dead)continue;
    for(const u of D.units){
      const q=pointOn(u.path,u.s+.5);if(u.face!=null)u.dir=u.face;else if(Math.hypot(q.x-u.x,q.z-u.z)>.01)u.dir=Math.atan2(q.x-u.x,q.z-u.z);
      if(u.type==='fuze'){const t=u.t||0,y=6+Math.sin(t*Math.PI)*62,pt=-Math.atan2(Math.cos(t*Math.PI)*62*Math.PI,u.path.len);put('fuze',u.x,u.z,u.from,u.dir||0,false,y,pt);if(Math.random()<.45)boom(u.x,y-heightAt(u.x,u.z),u.z,.8,'#c9c9c9')}
      else{put(u.type,u.x,u.z,u.from,u.dir||0,u.moving!==false);
        if(u.type==='atli'&&heightAt(u.x,u.z)<.2&&Math.random()<rdt*7){ripple(u.x,u.z,4.5);if(Math.random()<.5)boom(u.x,.3-heightAt(u.x,u.z),u.z,.45,'#eaf7ff')}}}
    for(const o of D.remote.values()){const ox=o.x,oz=o.z;o.x=lerp(o.x,o.tx,Math.min(1,rdt*3));o.z=lerp(o.z,o.tz,Math.min(1,rdt*3));if(Math.hypot(o.x-ox,o.z-oz)>.01)o.dir=Math.atan2(o.x-ox,o.z-oz);put(o.type,o.x,o.z,num(o.from,D.seat),o.dir||0);if(o.type==='atli'&&heightAt(o.x,o.z)<.2&&Math.random()<rdt*7)ripple(o.x,o.z,4.5)}
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

// craters
let GM=null;const CR=120,crM=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),null,CR);
function craterTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,8,128,128,126);
  r.addColorStop(0,'rgba(24,17,12,.97)');r.addColorStop(.42,'rgba(50,36,24,.95)');r.addColorStop(.72,'rgba(92,70,46,.8)');r.addColorStop(.88,'rgba(70,52,36,.45)');r.addColorStop(1,'rgba(40,30,20,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
  for(let i=0;i<500;i++){const a=Math.random()*6.28,d=Math.random()*118;g.fillStyle=`rgba(${25+Math.random()*60|0},${18+Math.random()*40|0},${12+Math.random()*25|0},.55)`;g.fillRect(128+Math.cos(a)*d,128+Math.sin(a)*d,1+Math.random()*4,1+Math.random()*4)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
crM.material=new THREE.MeshStandardMaterial({map:craterTex(),transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});crM.count=0;crM.frustumCulled=false;crM.receiveShadow=true;scene.add(crM);
let crI=0;
function sinkGround(x,z,r){
  if(!GM)return;const{geo,N,W}=GM,p=geo.attributes.position,n=geo.attributes.normal,st=W/N,ix=Math.round((x+W/2)/st),iz=Math.round((z+W/2)/st),R=Math.ceil(r*1.3/st)+1;
  const at=(i,j)=>clamp(i,0,N)+clamp(j,0,N)*(N+1);
  for(let j=iz-R;j<=iz+R;j++)for(let i=ix-R;i<=ix+R;i++){if(i<0||j<0||i>N||j>N)continue;const k=at(i,j),d=Math.hypot(p.getX(k)-x,p.getZ(k)-z)/r;if(d>1.3)continue;
    p.setY(k,p.getY(k)+(d<1?-1.5*(1-d*d)*Math.min(1,r/4):.28*(1.3-d)/.3))}
  for(let j=iz-R-1;j<=iz+R+1;j++)for(let i=ix-R-1;i<=ix+R+1;i++){if(i<1||j<1||i>=N||j>=N)continue;const k=at(i,j),dx=p.getY(at(i-1,j))-p.getY(at(i+1,j)),dz=p.getY(at(i,j-1))-p.getY(at(i,j+1)),l=Math.hypot(dx,2*st,dz);n.setXYZ(k,dx/l,2*st/l,dz/l)}
  p.needsUpdate=true;n.needsUpdate=true;
}
function crater(x,z,r,remote){
  if(shoreOf(x,z)<1)return;
  qt.setFromAxisAngle(UP,Math.random()*6.28);vp.set(x,heightAt(x,z)+.12,z);vs.set(r*1.25,1,r*1.25);mx.compose(vp,qt,vs);vs.set(1,1,1);
  crM.setMatrixAt(crI,mx);crI=(crI+1)%CR;crM.count=Math.max(crM.count,crI||CR);crM.instanceMatrix.needsUpdate=true;
  sinkGround(x,z,r);
  if(!remote&&!P.every(p=>!p.on||p===ME||p.bot))say('krater',[x|0,z|0,r]);
}

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
cv.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);press=ptr.size===1?{x:e.clientX,y:e.clientY,moved:false}:null;pinch=0;paintAt=null;if(ptr.size===1&&(build==='duvar'||build==='sil')){press=null;paintTo(e.clientX,e.clientY)}else if(ptr.size===2)paintAt=null});
cv.addEventListener('pointermove',e=>{
  const o=ptr.get(e.pointerId);
  if(!o){if(build)hover(e.clientX,e.clientY);return}
  const dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;
  if(paintAt&&ptr.size===1){paintTo(e.clientX,e.clientY);if(build!=='sil')hover(e.clientX,e.clientY);return}
  if(ptr.size===2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)view.td=clamp(view.td*pinch/d,DMIN,DMAX);pinch=d;return}
  if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;
  if(press&&press.moved){const s=view.d/innerHeight*1.3;view.tx=clamp(view.tx-dx*s,-L,L);view.tz=clamp(view.tz-dy*s*1.25,-L,L)}
  if(build)hover(e.clientX,e.clientY);
});
const up=e=>{ptr.delete(e.pointerId);if(press&&!press.moved&&e.type==='pointerup')tap(e.clientX,e.clientY);press=null;paintAt=null};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();view.td=clamp(view.td*(e.deltaY>0?1.12:.89),DMIN,DMAX)},{passive:false});
const keys=new Set();
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k==='h')toggleHud();if(k==='escape'){setBuild(null);pick(null)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const snap=v=>build==='duvar'?Math.round(v/WALL)*WALL:Math.round(v);
function paintTo(sx,sy){
  const p=worldAt(sx,sy);if(!p)return;const cx=Math.round(p.x/WALL),cz=Math.round(p.z/WALL);
  if(!paintAt)paintAt={x:cx,z:cz,first:true};
  // walk the grid cell by cell so a fast drag leaves no gaps
  let n=0;while((paintAt.first||paintAt.x!==cx||paintAt.z!==cz)&&n++<80){
    if(!paintAt.first){const dx=cx-paintAt.x,dz=cz-paintAt.z;if(Math.abs(dx)>=Math.abs(dz))paintAt.x+=Math.sign(dx);else paintAt.z+=Math.sign(dz)}
    paintAt.first=false;
    if(build==='sil')eraseAt(paintAt.x*WALL,paintAt.z*WALL);else addTower(ME,'duvar',paintAt.x*WALL,paintAt.z*WALL)}
}
function eraseAt(x,z){let best=null,bd=2.6;for(const t of ME.towers){const d=Math.hypot(t.x-x,t.z-z);if(d<bd){bd=d;best=t}}if(best)sellTower(best)}
function sellTower(t){const back=Math.floor(t.paid/2);ME.money+=back;floats.push({x:t.x,z:t.z,t:0,txt:'+'+back});SES.para();removeTower(ME,t)}
function hover(sx,sy){
  const p=worldAt(sx,sy);if(!p||!build||build==='sil')return;const x=snap(p.x),z=snap(p.z);
  ring.visible=true;ring.position.set(x,heightAt(x,z)+.4,z);ring.scale.setScalar(Math.max(2.5,TOWERS[build].menzil));ring.material.color.set(canBuild(ME,x,z,build)&&ME.money>=TOWERS[build].cost?'#8dff9a':'#ff7a6a');
}
function tap(sx,sy){
  const p=worldAt(sx,sy);if(!p||ME.dead)return;
  for(const D of P)if(D.on&&D!==ME&&!D.dead&&!build){const c=castlePos(D.seat);if(Math.hypot(p.x-c.x,p.z-c.z)<16){setTarget(D.seat);return}}
  if(build==='sil'){eraseAt(p.x,p.z);return}
  if(build){
    const x=snap(p.x),z=snap(p.z);
    if(ME.money<TOWERS[build].cost)tip('Paran yetmiyor');
    else if(!addTower(ME,build,x,z))tip('Buraya kurulamaz. Kendi bölgende, yolun ve kıyının dışında bir yer seç.');
    if(TOWERS[build]&&ME.money<TOWERS[build].cost)setBuild(null);
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
function setBuild(k){build=k;for(const b of $('gDef').querySelectorAll('button'))b.classList.toggle('on',b.dataset.k===k);ring.visible=false;if(k){pick(null);tip(k==='sil'?'Silmek için yapılara dokun veya üstünden sürükle. Yarı para geri gelir.':k==='duvar'?'Parmağını veya fareyi sürükleyerek sıra sıra duvar çek':TOWERS[k].ad+': yerleştirmek için kendi bölgene dokun')}}
function mkHud(){
  for(const k of TKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=`${TOWERS[k].ad.split(' ')[0]}<small>${TOWERS[k].cost} para</small>`;b.title=TOWERS[k].hava?'Sadece balonları vurur':'Yerdeki ve sudaki askerleri vurur';b.onclick=()=>setBuild(build===k?null:k);$('gDef').append(b)}
  {const b=document.createElement('button');b.dataset.k='sil';b.innerHTML='Sil<small>yarı para</small>';b.onclick=()=>setBuild(build==='sil'?null:'sil');$('gDef').append(b)}
  for(const k of UKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=`${UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost} para</small>`;
    b.title={kara:'Ortadaki kara yolundan gider',su:'Sudan kestirme gider',hava:'Uçar, kuleleri bombalar. Okçu ve hava savunması vurur.',fuze:'Doğrudan kaleye gider. Sadece hava savunması düşürür.'}[UNITS[k].yol];
    b.onclick=()=>{const to=liveTarget();if(to==null)return;if(!sendUnit(ME,to,k))tip('Paran yetmiyor');else tip(`${UNITS[k].ad} → ${P[to].name}`)};$('gAtk').append(b)}
  for(const D of P){if(!D.on||D===ME)continue;const b=document.createElement('button');b.dataset.s=D.seat;b.textContent=D.name;b.style.borderBottom='4px solid '+TEAM[D.seat];b.onclick=()=>setTarget(D.seat);$('gTgt').append(b)}
  for(const[k,ad]of[['muzik','Müzik'],['okcu','Okçu'],['atli','Atlı'],['bomba','Bomba'],['su','Su']]){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='s_'+k;c.checked=SES.ayar[k];c.onchange=()=>SES.set(k,c.checked);l.append(c,' '+ad);$('sesP').append(l)}
  $('bSes').onclick=()=>{$('sesP').hidden=!$('sesP').hidden};
  const wake=()=>SES.init();addEventListener('pointerdown',wake);addEventListener('keydown',wake);
  document.body.dataset.tab='d';$('tabD').onclick=()=>{document.body.dataset.tab='d'};$('tabA').onclick=()=>{document.body.dataset.tab='a';setBuild(null)};
  $('bHome').onclick=()=>{view.tx=home.x*.72;view.tz=home.z*.72;view.td=150};
  $('bAll').onclick=()=>{view.tx=0;view.tz=0;view.td=DMAX};
  $('eye').onclick=toggleHud;
  $('bUp').onclick=()=>{if(picked)upgrade(ME,picked);const t=picked;pick(t)};
  $('bSell').onclick=()=>{if(picked)sellTower(picked)};
  $('aeAgain').onclick=()=>location.reload();$('aeWatch').onclick=()=>{$('arenaEnd').hidden=true};
  const box=$('rivals');
  for(const D of P){if(!D.on)continue;const b=document.createElement('button');b.style.borderLeftColor=TEAM[D.seat];b.innerHTML='<span></span><i></i>';D.row=b;
    b.onclick=()=>{if(D!==ME&&!D.dead)setTarget(D.seat)};box.append(b)}
  liveTarget();
  $('hud').hidden=false;$('eye').hidden=false;
}
function drawHud(){
  $('money').textContent=Math.floor(ME.money)+' para';
  for(const b of $('gDef').querySelectorAll('button'))b.disabled=ME.dead||(b.dataset.k!=='sil'&&ME.money<TOWERS[b.dataset.k].cost);
  for(const b of $('gAtk').querySelectorAll('button'))b.disabled=ME.dead||ME.money<UNITS[b.dataset.k].cost;
  for(const D of P){if(!D.row)continue;D.row.className=(D.dead?'dead ':'')+(target===D.seat?'on':'');const tb=$('gTgt').querySelector(`[data-s="${D.seat}"]`);if(tb)tb.disabled=D.dead;D.row.firstChild.textContent=D.name+(D===ME?' (sen)':'');D.row.lastChild.style.width=D.hp/CASTLE_HP*100+'%'}
  if(picked){$('bUp').textContent=picked.lvl>=3?'En üst seviye':`Yükselt ${upCost(picked)}`;$('bUp').disabled=picked.lvl>=3||ME.money<upCost(picked);$('bSell').textContent=`Sil +${Math.floor(picked.paid/2)}`;
    vp.set(picked.x,heightAt(picked.x,picked.z),picked.z).project(camera);$('sel').style.left=(vp.x+1)/2*innerWidth+'px';$('sel').style.top=(1-vp.y)/2*innerHeight+'px'}
}
function drawOverlay(){
  ov.width=ov.width;oc.setTransform(DPR,0,0,DPR,0,0);        // a full reset: clearRect leaves trails on iOS Safari
  const W=innerWidth,H=innerHeight,off=(x,y)=>x<-90||y<-40||x>W+90||y>H+40;
  oc.textAlign='center';oc.font=`600 ${W<620?11:13}px Georgia`;oc.lineWidth=3;oc.strokeStyle='rgba(0,0,0,.75)';
  for(const D of P){
    if(!D.on)continue;const c=castlePos(D.seat);vp.set(c.x,heightAt(c.x,c.z)+27,c.z).project(camera);if(vp.z>1)continue;
    const x=(vp.x+1)/2*W,y=(1-vp.y)/2*H;if(off(x,y))continue;
    oc.fillStyle='rgba(0,0,0,.6)';oc.fillRect(x-36,y,72,7);oc.fillStyle=D.dead?'#777':TEAM[D.seat];oc.fillRect(x-36,y,72*D.hp/CASTLE_HP,7);
    const label=D.name+(target===D.seat?' ◎ HEDEF':'');oc.strokeText(label,x,y-5);oc.fillStyle='#fff';oc.fillText(label,x,y-5)}
  if(view.d<190){
    let n=0;const bar=(type,x,z,pct)=>{
      if(n>140)return;vp.set(x,unitY(UNITS[type],x,z)+(type==='balon'?10:type==='koc'?5.5:type==='atli'?5:4.8),z).project(camera);if(vp.z>1)return;
      const sx=(vp.x+1)/2*W,sy=(1-vp.y)/2*H;if(off(sx,sy))return;n++;const w=type==='balon'||type==='koc'?30:22;
      oc.fillStyle='rgba(0,0,0,.7)';oc.fillRect(sx-w/2-1,sy-1,w+2,5);oc.fillStyle=pct>.5?'#62d98f':pct>.25?'#f2c23a':'#ec5840';oc.fillRect(sx-w/2,sy,w*clamp(pct,0,1),3)};
    for(const D of P){for(const u of D.units)bar(u.type,u.x,u.z,u.hp/UNITS[u.type].hp);for(const o of D.remote.values())bar(o.type,o.x,o.z,o.pct)}}
  oc.font='700 17px Georgia';oc.fillStyle='#ffd98a';
  for(const f of floats){vp.set(f.x,6+f.t*8,f.z).project(camera);oc.globalAlpha=1-f.t;oc.fillText(f.txt,(vp.x+1)/2*W,(1-vp.y)/2*H)}oc.globalAlpha=1;
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
  slow=fps<34?slow+dt:0;if(slow>5&&DPR>1.5){DPR=1.5;renderer.setPixelRatio(DPR);size();slow=0}
  const p=view.d*dt*1.1;
  if(keys.has('a')||keys.has('arrowleft'))view.tx-=p;if(keys.has('d')||keys.has('arrowright'))view.tx+=p;
  if(keys.has('w')||keys.has('arrowup'))view.tz-=p;if(keys.has('s')||keys.has('arrowdown'))view.tz+=p;
  view.tx=clamp(view.tx,-L,L);view.tz=clamp(view.tz,-L,L);
  for(let i=floats.length-1;i>=0;i--){floats[i].t+=dt/1.1;if(floats[i].t>=1)floats.splice(i,1)}
  ambAcc+=dt;if(ambAcc>.3){ambAcc=0;ambience()}
  waterU.t.value=t/1000;applyCam(dt);drawUnits(dt);drawFx(dt);drawRipples(dt);
  renderer.render(scene,camera);drawOverlay();
  hudAcc+=dt;if(hudAcc>.15){hudAcc=0;drawHud()}
  tipT-=dt;if(tipT<=0&&!$('tip').hidden)$('tip').hidden=true;
  requestAnimationFrame(frame);
}
buildGround();buildWater();buildBridges();buildForest();buildUnits();P.forEach(D=>{if(D.on)buildCastle(D.seat)});
size();mkHud();connect();applyCam(1);
sun.shadow.autoUpdate=true;
requestAnimationFrame(frame);
window.__O={P,sim,sendUnit,addTower,ME,finish,kill:eliminate,get ended(){return ended},get fps(){return fps},view};
