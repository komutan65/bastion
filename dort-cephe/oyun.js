import * as THREE from 'three';
import {SES} from './ses.js?v=20261108e';
/* Dört Cephe. Each client simulates its own square (and any computer rivals);
   units sent to a player are simulated by that player. Others see 2 snapshots a second. */
const A=window.ARENA,EN=window.LANG==='en',TL=(t,e)=>EN?e:t;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const num=(v,d=0)=>typeof v==='number'&&isFinite(v)?v:d;

// ---------- rules ----------
let BUILD_T={denizalti:16,gemi:20},TBUILD={ok:7,top:10,hava:9,roket:14,duvar:2.5},WMAX=12,RUNWAY_COST=150,RUNWAY_T=12,YARD_COST=100,YARD_T=15,MAX_SHIPS=2,PLANE_T=12,SHIP_SEE=80,SHIP_STAND=95,SUB_TIME=16,WALL=3,START_MONEY=200,CASTLE_HP=500,TRICKLE=0.5,MAX_TOWERS=40;
// a base trains one soldier at a time and fields a limited army, so nobody can flood the map
let TRAIN={piyade:2,atli:3,koc:7,balon:6},POP={piyade:1,atli:1,koc:3,balon:2},POP_CAP=40,FUZE_CD=20,DBR_FIX=100,VER='13';
// the lesson: an empty 1v1 map where nothing costs anything and nothing has to be waited for
const TUT=!!(A&&A.tutorial);
if(TUT){BUILD_T={denizalti:.5,gemi:.5};for(const k in TBUILD)TBUILD[k]=.2;RUNWAY_T=YARD_T=PLANE_T=.5;FUZE_CD=.5;TRAIN={piyade:.2,atli:.2,koc:.2,balon:.2}}
const UNITS={
  piyade:{ad:TL('Piyade','Infantry'),cost:3,odul:2,hp:90,sp:7,dmg:2,yol:'kara'},
  atli:{ad:TL('Su Atlısı','Water Rider'),cost:6,odul:3,hp:80,sp:13,dmg:3,yol:'su'},
  koc:{ad:TL('Koçbaşı','Battering Ram'),cost:12,odul:8,hp:320,sp:4.5,dmg:12,yol:'kara'},
  balon:{ad:TL('Bombalı Balon','Bomb Balloon'),cost:15,odul:10,hp:160,sp:6,dmg:8,yol:'hava'},
  fuze:{ad:TL('Füze','Missile'),cost:30,odul:15,hp:70,sp:32,dmg:60,yol:'fuze'},
  denizalti:{ad:TL('Denizaltı','Submarine'),cost:40,odul:12,hp:220,sp:11,dmg:0,yol:'deniz'},
  dalgic:{ad:TL('Balık Adam','Frogman'),cost:0,odul:2,hp:50,sp:8.5,dmg:3,yol:'su',gizli:true},
  isci:{ad:TL('İşçi','Worker'),cost:0,odul:0,hp:45,sp:10,dmg:0,yol:'kara',gizli:true},
  gemi:{ad:TL('Savaş Gemisi','Warship'),kisa:TL('Gemi','Ship'),cost:55,odul:25,hp:750,sp:7,dmg:0,yol:'deniz'},
  ucak:{ad:TL('Bombardıman Uçağı','Bomber'),kisa:TL('Uçak','Plane'),cost:70,odul:35,hp:950,sp:24,dmg:15,yol:'ucak'}
};
const TOWERS={
  ok:{ad:TL('Okçu Kulesi','Archer Tower'),cost:20,menzil:24,dmg:15,hiz:1.6,hp:160,hava:true,yer:true},
  top:{ad:TL('Top Kulesi','Cannon Tower'),cost:45,menzil:38,dmg:38,hiz:.6,alan:5,hp:240,hava:false,yer:true,gemi:true},
  hava:{ad:TL('Hava Savunması','Air Defense'),cost:35,menzil:36,dmg:24,hiz:1.2,hp:150,hava:true,fuze:true,ucak:true,yer:false},
  roket:{ad:TL('Roket Rampası','Rocket Launcher'),cost:60,menzil:72,dmg:240,hiz:.3,hp:150,hava:true,fuze:true,ucak:true,yer:false,gudumlu:true},
  duvar:{ad:TL('Duvar','Wall'),cost:8,menzil:0,dmg:0,hiz:1,hava:false,yer:false,hp:250,duvar:true}
};
// the castle's own archers: enough to see off a handful of raiders, not an army
const KEEP={menzil:28,dmg:14,hiz:1.4};
// how hard each kind hits buildings: swords and hooves barely dent stone, the ram is made for it
// how hard each kind hits other soldiers (times its damage)
const UV={piyade:5,atli:5,koc:1.5,dalgic:1.6,isci:0};
const BLD={piyade:3.5,atli:2,koc:5,dalgic:4,balon:40};
const UKEYS=Object.keys(UNITS),TKEYS=Object.keys(TOWERS),BUY=UKEYS.filter(k=>!UNITS[k].gizli),BRIDGE_COST=60;
const TEAM=['#e8a33a','#4fb6e8','#e866a8','#7fd65a'];
const BIOME=[
  {ad:TL('Çayır','Meadow'),a:'#5c9a43',b:'#8fb95c',amp:2,f:.032},
  {ad:TL('Çöl','Desert'),a:'#dcbc76',b:'#bd9150',amp:3.6,f:.02},
  {ad:TL('Kar','Snow'),a:'#e6eef3',b:'#a9bfd0',amp:5,f:.046},
  {ad:TL('Volkan','Volcano'),a:'#463735',b:'#83503a',amp:4.2,f:.062}
];
// ---------- map ----------
const L=160,RIVER=13,ISLE=8,CASTLE=100,WL=1.5;   // WL: how far inland of the river line the water ends
const SX=[-1,1,-1,1],SZ=[-1,-1,1,1];
// 1v1: two base islands left and right, an empty island between them, and stone bridges over the two channels
const DUEL=!!(A&&A.duel),DCX=106,DMID=34,DIN=62;
const DBR=[{a:{x:-70,z:-30},b:{x:-26,z:-30},main:0},{a:{x:-70,z:56},b:{x:-26,z:56}},{a:{x:26,z:30},b:{x:70,z:30},main:1},{a:{x:26,z:-56},b:{x:70,z:-56}}];
const seatAt=(x,z)=>DUEL?(x>0?1:0):(x>0?1:0)+(z>0?2:0);
const biomeAt=(x,z)=>DUEL&&Math.abs(x)<DIN-6?0:seatAt(x,z);
const castlePos=s=>DUEL?{x:SX[s]*DCX,z:0}:{x:SX[s]*CASTLE,z:SZ[s]*CASTLE};
const ROADS=[   // every square has its own road, in |x|,|z| coordinates
  [[100,100],[100,58],[58,58],[58,28],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[58,100],[58,62],[28,62],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[75,52],[40,75],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[65,92],[92,45],[38,40],[26,26],[13,13],[8,8],[0,0]]
];
function duelRoad(s){
  const k=[[-106,0],[-98,-14],[-86,-26],[-74,-30],[-62,-30],[-48,-30],[-34,-30],[-22,-29],[-12,-20],[-5,-8],[0,0]].map(([x,z])=>new THREE.Vector3(s?-x:x,0,s?-z:z));
  return new THREE.CatmullRomCurve3(k,false,'catmullrom',.2).getSpacedPoints(110).map(v=>({x:v.x,z:v.z}));
}
function roadOf(s){if(DUEL)return duelRoad(s);
  const r=ROADS[s],head=r.slice(0,-3).map(p=>new THREE.Vector3(SX[s]*p[0],0,SZ[s]*p[1]));
  const c=new THREE.CatmullRomCurve3(head,false,'catmullrom',.4).getSpacedPoints(90).map(v=>({x:v.x,z:v.z}));
  for(const p of r.slice(-3))c.push({x:SX[s]*p[0],z:SZ[s]*p[1]});
  return c;
}
const ROAD=(DUEL?[0,1]:[0,1,2,3]).map(roadOf);
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
const onIsle=(x,z)=>!DUEL&&Math.max(Math.abs(x),Math.abs(z))<=ISLE;
// the river cross opens into an uneven sea that wraps round the whole map
const VIEW=240,SEA=345,COAST_N=vnoise(41),BOX=(x,z)=>{const a=Math.abs(x),b=Math.abs(z),m=Math.max(a,b,1),p=a/m,q=b/m;return m*Math.pow(p**6+q**6,1/6)};
const wob=(x,z,k)=>fbm(COAST_N,(x+500)*k,(z+500)*k)*2-1;
const coastD=(x,z)=>Math.min(160,Math.max(132,146+wob(x,z,.017)*30))-BOX(x,z);     // >0 on the map's land
const outerD=(x,z)=>BOX(x,z)-(236+wob(x+90,z+70,.011)*30);          // >0 on the far shore
function duelIsles(x,z){
  const w=wob(x,z,.02)*9,ax=Math.abs(x),side=x<0?-1:1;
  const base=Math.min(ax-DIN,(150+w)-ax,(100+w)-Math.abs(z));       // the inner edges stay straight for the bridges
  const mid=Math.min(DMID-ax,(72+w*.7)-Math.abs(z));
  return Math.max(base,mid);
}
const shoreOf=DUEL?(x,z)=>Math.max(duelIsles(x,z),outerD(x,z)):(x,z)=>Math.max(Math.min(Math.abs(x)-RIVER,Math.abs(z)-RIVER,coastD(x,z)),outerD(x,z));     // the river cross stops at the open sea: the far shore runs unbroken
// craters are kept in a grid so units and buildings feel them
const CRD=new Float32Array(GN*GN);let anyCrater=false;
function sunk(x,z){
  if(!anyCrater)return 0;
  const X=clamp(x+L,0,GN-1.001),Z=clamp(z+L,0,GN-1.001),i=X|0,j=Z|0,u=X-i,v=Z-j,k=i+j*GN;
  return lerp(lerp(CRD[k],CRD[k+1],u),lerp(CRD[k+GN],CRD[k+GN+1],u),v);
}
const heightAt=(x,z)=>baseHeight(x,z)-sunk(x,z);
function baseHeight(x,z){
  if(onIsle(x,z))return -3;
  const sh=shoreOf(x,z);if(sh<WL)return -2.8*smooth(WL,WL-8,sh)-1.6*smooth(WL-6,WL-22,sh);    // the bed shelves down gently
  const s=biomeAt(x,z),b=BIOME[s],n=fbm(NOISE[s],(x+200)*b.f,(z+200)*b.f);
  let h=(s===1?Math.abs(Math.sin((x+z)*.05+n*4))*1.6:0)+b.amp*n;
  const c=castlePos(s);h*=smooth(4,16,roadDist(x,z))*smooth(8,24,Math.hypot(x-c.x,z-c.z));
  let y=lerp(.5*smooth(WL,WL+5,sh),1+h,smooth(WL+3,WL+14,sh));          // beach, then a long rise to the land
  y=lerp(y,1.04,smooth(9,3.6,roadDist(x,z))*smooth(WL,WL+3,sh));         // the roads run out on a ramp to meet the bridges
  return y;
}
const bridges=[];
const segD=(x,z,b)=>{const dx=b.b.x-b.a.x,dz=b.b.z-b.a.z,t=clamp(((x-b.a.x)*dx+(z-b.a.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-b.a.x-dx*t,z-b.a.z-dz*t)};
const onBridge=(x,z)=>bridges.some(b=>segD(x,z,b)<3.6);
const onDeck=(x,z)=>{if(DUEL)return onDeckFixed(x,z)||onBridge(x,z);const r=Math.hypot(x,z);return(!fountainDown&&(r<13||(r<25&&roadDist(x,z)<4.5)))||onBridge(x,z);return r<13||(r<25&&roadDist(x,z)<4.5)||onBridge(x,z)};
const unitY=(u,x,z)=>u.yol==='ucak'?28:u.yol==='hava'?20:u.yol==='fuze'?34:u.yol==='deniz'?-.45:u.yol==='su'?(onBridge(x,z)?1.08:Math.max(heightAt(x,z),-.75)):onDeck(x,z)?1.08:deckY(x,z);
const deckY=(x,z)=>{const h=heightAt(x,z);return h<1.08&&nearDeck(x,z)?1.08:Math.max(h,.2)};
const flies=U=>U.yol==='hava'||U.yol==='fuze'||U.yol==='ucak';
const fighter=t=>!flies(UNITS[t])&&UNITS[t].yol!=='deniz';
// walking routes: land, the fixed bridges, and any bridge players have built
const NC=4,NN=(L*2/NC|0)+1;let navLand=null;
function navMask(){
  if(!navLand){navLand=new Uint8Array(NN*NN);for(let j=0;j<NN;j++)for(let i=0;i<NN;i++){const x=i*NC-L,z=j*NC-L;navLand[i+j*NN]=((shoreOf(x,z)>WL+.5||onDeckFixed(x,z))&&Math.hypot(x,z)>=4.5)?1:0}}
  const m=navLand.slice();
  for(const b of bridges)for(let k=0;k<=40;k++){const x=lerp(b.a.x,b.b.x,k/40),z=lerp(b.a.z,b.b.z,k/40);m[Math.round((x+L)/NC)+Math.round((z+L)/NC)*NN]=1}
  return m;
}
const nearDeck=(x,z)=>(DUEL?DBR.some(b=>!b.down&&segD(x,z,b)<5.4):(!fountainDown&&Math.hypot(x,z)<27&&(Math.hypot(x,z)<14.5||roadDist(x,z)<6)))||bridges.some(b=>segD(x,z,b)<5.2);
const onDeckFixed=(x,z)=>{if(DUEL)return DBR.some(b=>!b.down&&segD(x,z,b)<3.6);if(fountainDown)return false;const r=Math.hypot(x,z);return r<13||(r<25&&roadDist(x,z)<4.5)};
const navIdx=(m,p)=>{const a=clamp(Math.round((p.x+L)/NC),0,NN-1),b=clamp(Math.round((p.z+L)/NC),0,NN-1);for(let r=0;r<8;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const n=clamp(a+i,0,NN-1)+clamp(b+j,0,NN-1)*NN;if(m[n])return n}return -1};
function clearLine(m,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/2);for(let k=0;k<=n;k++){const x=lerp(a.x,b.x,k/n),z=lerp(a.z,b.z,k/n);if(!m[clamp(Math.round((x+L)/NC),0,NN-1)+clamp(Math.round((z+L)/NC),0,NN-1)*NN])return false}return true}
function nav(a,b,m=navMask()){
  if(clearLine(m,a,b))return[a,b];
  const s=navIdx(m,a),e=navIdx(m,b);if(s<0||e<0)return null;
  const prev=new Int32Array(NN*NN).fill(-1),q=[s];prev[s]=s;
  for(let h=0;h<q.length&&prev[e]<0;h++){const c=q[h],x=c%NN,z=c/NN|0;
    for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const X=x+dx,Z=z+dz;if(X<0||Z<0||X>=NN||Z>=NN)continue;const n=X+Z*NN;if(m[n]&&prev[n]<0){prev[n]=c;q.push(n)}}}
  if(prev[e]<0)return null;
  const cells=[];for(let c=e;;c=prev[c]){cells.unshift({x:(c%NN)*NC-L,z:(c/NN|0)*NC-L});if(c===s)break}
  const out=[a];let i=0;const all=[a,...cells,b];                       // pull the string tight
  while(i<all.length-1){let j=all.length-1;while(j>i+1&&!clearLine(m,all[i],all[j]))j--;out.push(all[j]);i=j}
  return out;
}
function navRoute(pts){const m=navMask(),out=[pts[0]];for(let i=1;i<pts.length;i++){const l=nav(pts[i-1],pts[i],m);if(!l)continue;out.push(...l.slice(1))}return out}
// sailing routes: open water only (not the inner rivers), on a grid that reaches out to the far shore
const SC=5,SN=(VIEW*2/SC|0)+1;let seaM=null;
function seaMask(){if(!seaM){seaM=new Uint8Array(SN*SN);for(let j=0;j<SN;j++)for(let i=0;i<SN;i++){const x=i*SC-VIEW,z=j*SC-VIEW;seaM[i+j*SN]=shoreOf(x,z)<-5&&(DUEL?!DBR.some(b=>segD(x,z,b)<9):BOX(x,z)>118)?1:0}}return seaM}
const sIdx=(x,z)=>clamp(Math.round((x+VIEW)/SC),0,SN-1)+clamp(Math.round((z+VIEW)/SC),0,SN-1)*SN,sPt=c=>({x:(c%SN)*SC-VIEW,z:(c/SN|0)*SC-VIEW});
function seaClear(m,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/2.5));for(let k=0;k<=n;k++)if(!m[sIdx(lerp(a.x,b.x,k/n),lerp(a.z,b.z,k/n))])return false;return true}
function seaNear(m,p){const a=clamp(Math.round((p.x+VIEW)/SC),0,SN-1),b=clamp(Math.round((p.z+VIEW)/SC),0,SN-1);
  for(let r=0;r<20;r++){let best=-1,bd=1e9;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;const X=a+i,Z=b+j;if(X<0||Z<0||X>=SN||Z>=SN)continue;const n=X+Z*SN;if(m[n]){const q=sPt(n),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;best=n}}}if(best>=0)return best}return -1}
function seaNav(a,b,m=seaMask()){
  const aw=!!m[sIdx(a.x,a.z)],bw=!!m[sIdx(b.x,b.z)];if(aw&&bw&&seaClear(m,a,b))return[a,b];
  const s=seaNear(m,a),e=seaNear(m,b);if(s<0||e<0)return null;
  const prev=new Int32Array(SN*SN).fill(-1),q=[s];prev[s]=s;
  for(let h=0;h<q.length&&prev[e]<0;h++){const c=q[h],x=c%SN,z=c/SN|0;
    for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const X=x+dx,Z=z+dz;if(X<0||Z<0||X>=SN||Z>=SN)continue;const n=X+Z*SN;if(m[n]&&prev[n]<0){prev[n]=c;q.push(n)}}}
  let E=e,end=bw;if(prev[e]<0){end=false;let bd=1e9;for(const c of q){const p=sPt(c),d=Math.hypot(p.x-b.x,p.z-b.z);if(d<bd){bd=d;E=c}}}   // cut off: get as close as the water allows
  const cells=[];for(let c=E;;c=prev[c]){cells.unshift(sPt(c));if(c===s)break}
  const all=[aw?a:cells[0],...cells,...(end?[b]:[])],out=[all[0]];let i=0;
  while(i<all.length-1){let j=all.length-1;while(j>i+1&&!seaClear(m,all[i],all[j]))j--;out.push(all[j]);i=j}
  if(!aw)out.unshift(a);return out;
}
function seaRoute(pts){const m=seaMask(),out=[pts[0]];for(let i=1;i<pts.length;i++){const l=seaNav(out[out.length-1],pts[i],m);if(l)out.push(...l.slice(1))}return out}
const lenOf=p=>{let l=0;for(let i=1;i<p.length;i++)l+=Math.hypot(p[i].x-p[i-1].x,p[i].z-p[i-1].z);return l};
// the submarine lies off a base's far corner and lands its divers behind it
const rear=s=>DUEL?{x:SX[s]*196,z:0}:{x:SX[s]*168,z:SZ[s]*168};
const lane=(a,b)=>DUEL&&a.x!==b.x?[{x:a.x,z:-150},{x:b.x,z:-150}]:[];
function seaPath(from,to){
  const a=rear(from),b=rear(to),pts=[a];if(DUEL)pts.push(...lane(a,b));else if(SX[from]!==SX[to]&&SZ[from]!==SZ[to])pts.push({x:b.x,z:a.z});pts.push(b);
  const c=castlePos(to);let t=0;while(t<1&&shoreOf(lerp(b.x,c.x,t),lerp(b.z,c.z,t))<-10)t+=.02;pts.unshift(LAUNCH[from].park);pts.push({x:lerp(b.x,c.x,t),z:lerp(b.z,c.z,t)});return[LAUNCH[from].st,LAUNCH[from].mid,...roundPath(pts,48)];
}

// a smooth bend at every corner, so nothing snaps round at a sharp angle
function roundPath(pts,Rr=30){
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],c=pts[i],b=pts[i+1],la=Math.hypot(c.x-a.x,c.z-a.z)||1,lb=Math.hypot(b.x-c.x,b.z-c.z)||1,r=Math.min(Rr,la*.45,lb*.45);
    if(r<.5){out.push(c);continue}
    const p={x:c.x+(a.x-c.x)/la*r,z:c.z+(a.z-c.z)/la*r},q={x:c.x+(b.x-c.x)/lb*r,z:c.z+(b.z-c.z)/lb*r};
    for(let k=0;k<=8;k++){const t=k/8,u=1-t;out.push({x:u*u*p.x+2*u*t*c.x+t*t*q.x,z:u*u*p.z+2*u*t*c.z+t*t*q.z})}}
  out.push(pts[pts.length-1]);return out;
}
// soldiers cross the plaza round the fountain, never through it
function plazaArc(from,to,id,r=7.5){
  const a0=Math.atan2(SZ[from],SX[from]),a1=Math.atan2(SZ[to],SX[to]);let d=a1-a0;
  while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;if(Math.abs(Math.abs(d)-Math.PI)<.01)d=(id%2?1:-1)*Math.PI;
  const out=[];for(let k=0;k<=10;k++){const a=a0+d*k/10;out.push({x:Math.cos(a)*r,z:Math.sin(a)*r})}return out;
}
const PLAZA_COST=120;
function buildYard(D){if(D.ysState||D.money<YARD_COST)return false;D.money-=YARD_COST;D.ysState=1;D.ysT=YARD_T;markBuilt(D);return true}
// warships on the water (or being built) that belong to a base, wherever they are simulated
function fleet(seat){let n=0;const O=P[seat];if(O&&O.yard&&O.yard.type==='gemi')n++;if(O&&O.yardV&&O.yardV.type==='gemi')n++;
  for(const D of P){if(!D.on)continue;for(const u of D.units)if(u.type==='gemi'&&u.from===seat&&u.fall==null&&!u.done)n++;if(!local(D))for(const o of D.remote.values())if(o.type==='gemi'&&o.from===seat&&!(o.fl&2))n++}return n}
function buildRunway(D){if(!RWY[D.seat]||D.rwState||D.money<RUNWAY_COST)return false;D.money-=RUNWAY_COST;D.rwState=1;D.rwT=RUNWAY_T;markBuilt(D);return true}
function refund(seat,m){const O=P[seat];if(!O||O.dead)return;if(local(O)){O.money+=m;if(O===ME){const c=RWY[seat]?RWY[seat].c:castlePos(seat);floats.push({x:c.x,z:c.z,t:0,txt:'+'+m});SES.para()}}else say('iade',{to:seat,m})}
function bridgeRoad(from,to,A,B){
  const best=(r,P0)=>{let c=0,bi=0,bv=1e9;for(let k=0;k<r.length-3;k++){if(k)c+=Math.hypot(r[k].x-r[k-1].x,r[k].z-r[k-1].z);const v=c+Math.hypot(r[k].x-P0.x,r[k].z-P0.z)*1.15;if(v<bv){bv=v;bi=k}}return bi};
  const ra=ROAD[from],rb=ROAD[to],i=best(ra,A),j=best(rb,B);
  return[...ra.slice(0,i+1),A,B,...rb.slice(0,j+1).reverse()];
}
// the road through the plaza while it stands; built bridges when they save the walk; otherwise any way over land
function landRoute(from,to,id=0){
  if(DUEL){if(DBR.every(b=>b.main==null||!b.down))return landPath(from,to,id);return nav(castlePos(from),castlePos(to))}
  const c=[];if(!fountainDown)c.push(landPath(from,to,id));
  for(const b of bridges){const sa=seatAt(b.a.x,b.a.z),sb=seatAt(b.b.x,b.b.z);
    if(sa===from&&sb===to)c.push(bridgeRoad(from,to,b.a,b.b));else if(sb===from&&sa===to)c.push(bridgeRoad(from,to,b.b,b.a))}
  if(!c.length&&bridges.length){const n=nav(castlePos(from),castlePos(to));if(n)c.push(n)}
  if(!c.length)return null;
  return c.sort((p,q)=>lenOf(p)-lenOf(q))[0];
}
// soldiers walk round their own walls instead of through them
function detour(pts,towers){
  const W=towers.filter(t=>t.type==='duvar');if(!W.length)return pts;
  const inW=p=>W.some(t=>Math.max(Math.abs(t.x-p.x),Math.abs(t.z-p.z))<2.7);
  const d=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/1.5));for(let k=0;k<n;k++)d.push({x:lerp(a.x,b.x,k/n),z:lerp(a.z,b.z,k/n)})}d.push(pts[pts.length-1]);
  if(!d.some(inW))return pts;
  const m=navMask();for(const t of W){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=Math.round((t.x+L)/NC)+i,Z=Math.round((t.z+L)/NC)+j;if(X<0||Z<0||X>=NN||Z>=NN)continue;if(Math.abs(X*NC-L-t.x)<3.6&&Math.abs(Z*NC-L-t.z)<3.6)m[X+Z*NN]=0}}
  const out=[];let i=0;
  while(i<d.length){if(!inW(d[i])||i===0){out.push(d[i]);i++;continue}
    let j=i;while(j<d.length&&inW(d[j]))j++;
    const a=out[out.length-1],b=d[Math.min(j+2,d.length-1)],n=nav(a,b,m);
    if(n)out.push(...n.slice(1));else out.push(...d.slice(i,Math.min(j+3,d.length)));
    i=Math.min(j+3,d.length)}
  return out;
}
// an attacker who meets an enemy wall looks for a way round it first
function wallWay(u,D){
  const W=D.towers.filter(t=>t.type==='duvar'&&!(t.bt>0));if(!W.length||!u.path)return false;
  const rest=[{x:u.x,z:u.z}];for(let i=0;i<u.path.pts.length;i++)if(u.path.c[i]>u.s+.5)rest.push(u.path.pts[i]);
  if(rest.length<2){if(!u.aim)return false;rest.push(u.aim)}
  const back=u.path.len-u.end,old=Math.max(1,u.path.len-u.s),n=detour(rest,W);if(!n||n.length<2)return false;
  const q=polyPath(n);if(q.len>old*2.6+40)return false;
  for(let k=3;k<=q.len-4;k+=1.5){const p=pointOn(q,k);if(W.some(t=>Math.max(Math.abs(t.x-p.x),Math.abs(t.z-p.z))<2.2))return false}
  u.path=q;u.s=0;u.end=Math.max(0,q.len-back);u.off=false;u.reS=false;u.lane=0;u.lx=u.lz=0;return true}
const landPath=(from,to,id)=>DUEL?[...ROAD[from].slice(0,-1),...ROAD[to].slice().reverse()]:[...ROAD[from].slice(0,-1),...plazaArc(from,to,id),...ROAD[to].slice(0,-1).reverse()];
// riders keep to the rivers when the target is across the map, and swim round the plaza
function riderPath(from,to,id){
  const a=castlePos(from),b=castlePos(to);
  if(DUEL){const k=id%2?1:-1;return roundPath([a,{x:a.x*.55,z:44*k},{x:b.x*.55,z:44*k},b],22)}
  if(SX[from]===SX[to]||SZ[from]===SZ[to])return[a,b];
  const vx=id%2===0,r=19,
    p1=vx?{x:0,z:SZ[from]*58}:{x:SX[from]*58,z:0},a0=vx?Math.atan2(SZ[from],0):Math.atan2(0,SX[from]),
    p5=vx?{x:SX[to]*58,z:0}:{x:0,z:SZ[to]*58},a1=vx?Math.atan2(0,SX[to]):Math.atan2(SZ[to],0);
  let d=a1-a0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
  const arc=[];for(let k=0;k<=8;k++){const t=a0+d*k/8;arc.push({x:Math.cos(t)*r,z:Math.sin(t)*r})}
  return roundPath([a,p1,...arc,p5,b],22);
}
// every base gets a dock on its outer coast and a strip of land kept free for a runway
function dockOf(s){
  const c=castlePos(s),dx=DUEL?SX[s]:SX[s]/Math.SQRT2,dz=DUEL?0:SZ[s]/Math.SQRT2;let land=null;
  for(let k=0;k<160;k++){const x=c.x+dx*k,z=c.z+dz*k,sh=shoreOf(x,z);if(sh>WL+3)land={x,z};else if(land&&sh<-6)return{land,sea:{x,z},ang:Math.atan2(dx,dz)}}
  return{land:land||c,sea:rear(s),ang:Math.atan2(dx,dz)};
}
const DOCK=[0,1,2,3].map(dockOf);
// a new hull slides down the slipway, then sails clear of the pier and waits there
// six bombing runs, top to bottom, spread evenly over the land of the base they cross
const LANES=6,laneZs=[];
function laneZ(to,l){if(!laneZs[to]){const c=castlePos(to);let lo=1e9,hi=-1e9;for(let z=c.z-150;z<=c.z+150;z+=3)for(const dx of[-30,0,30]){const x=c.x+dx;if(seatAt(x,z)===to&&shoreOf(x,z)>3&&outerD(x,z)<-8&&Math.abs(z-c.z)<130){lo=Math.min(lo,z);hi=Math.max(hi,z)}}
  if(lo>hi){lo=c.z-50;hi=c.z+50}lo+=9;hi-=9;laneZs[to]=Array.from({length:LANES},(_,i)=>Math.round(lo+(hi-lo)*i/(LANES-1)))}return laneZs[to][clamp(l|0,0,LANES-1)]}
const LAUNCH=[0,1,2,3].map(s=>{const d=DOCK[s],a=d.ang,w=(x,z)=>({x:d.land.x+x*Math.cos(a)+z*Math.sin(a),z:d.land.z-x*Math.sin(a)+z*Math.cos(a)});
  let k=26,pk=w(-7,5+k);while(k<90&&shoreOf(pk.x,pk.z)>-7){k+=4;pk=w(-7,5+k)}return{st:w(-7,5),mid:w(-7,21),park:pk}});
function runwayOf(s){
  const c=castlePos(s),dk=DOCK[s].land;let best=null,bv=-1e9;
  for(let ax=36;ax<=146;ax+=5)for(let az=DUEL?-90:36;az<=(DUEL?90:146);az+=5)for(const o of[0,1]){
    const cx=SX[s]*ax,cz=DUEL?az:SZ[s]*az,ux=o,uz=1-o;let ok=true,lo=1e9,hi=-1e9;
    for(let k=-28;k<=28&&ok;k+=4)for(const w of[-5,0,5]){const x=cx+ux*k-uz*w,z=cz+uz*k+ux*w;
      if(seatAt(x,z)!==s||shoreOf(x,z)<WL+4||roadDist(x,z)<7.5||Math.hypot(x-c.x,z-c.z)<17||Math.hypot(x-dk.x,z-dk.z)<15||Math.max(Math.abs(x),Math.abs(z))>L-4){ok=false;break}
      const h=baseHeight(x,z);lo=Math.min(lo,h);hi=Math.max(hi,h)}
    if(!ok)continue;const v=-Math.hypot(cx-c.x,cz-c.z)*.6-(hi-lo)*9;if(v>bv){bv=v;best={c:{x:cx,z:cz},ux,uz}}}
  if(!best)return null;const{c:m,ux,uz}=best,len=54;
  let a={x:m.x-ux*len/2,z:m.z-uz*len/2},b={x:m.x+ux*len/2,z:m.z+uz*len/2};
  if(Math.hypot(b.x-c.x,b.z-c.z)<Math.hypot(a.x-c.x,a.z-c.z))[a,b]=[b,a];
  return{a,b,c:m,ux,uz,len};
}
const RWY=[0,1,2,3].map(runwayOf);
// the muster field: trained soldiers wait here, a little way out of the castle beside the road, and heal while they wait
const RALLY=[0,1,2,3].map(s=>{const r=ROAD[s];if(!r)return castlePos(s);const c=castlePos(s);let i=0;while(i<r.length-2&&Math.hypot(r[i].x-c.x,r[i].z-c.z)<36)i++;
  const p=r[i],q=r[i+1],l=Math.hypot(q.x-p.x,q.z-p.z)||1,nx=-(q.z-p.z)/l,nz=(q.x-p.x)/l,rw=RWY[s],dk=DOCK[s];
  const ok=(x,z)=>{for(let a=0;a<6.28;a+=.52)for(const rr of[0,6,11]){const X=x+Math.cos(a)*rr,Z=z+Math.sin(a)*rr;if(seatAt(X,Z)!==s||shoreOf(X,Z)<WL+3||Math.max(Math.abs(X),Math.abs(Z))>L-3)return false}
    if(rw){const dx=x-rw.c.x,dz=z-rw.c.z;if(Math.abs(dx*rw.ux+dz*rw.uz)<42&&Math.abs(-dx*rw.uz+dz*rw.ux)<20)return false}return Math.hypot(x-dk.land.x,z-dk.land.z)>24&&Math.hypot(x-c.x,z-c.z)>18};
  for(const k of[15,-15,19,-19,12,-12,24,-24])for(const back of[0,8,-8]){const x=p.x+nx*k-(q.x-p.x)/l*back,z=p.z+nz*k-(q.z-p.z)/l*back;if(ok(x,z))return{x:Math.round(x),z:Math.round(z)}}
  return{x:Math.round(p.x+nx*14),z:Math.round(p.z+nz*14)}});
function reserved(s,x,z){
  {const q=RALLY[s];if(q&&Math.hypot(x-q.x,z-q.z)<12.5)return true}
  const r=RWY[s];if(r){const dx=x-r.c.x,dz=z-r.c.z,a=dx*r.ux+dz*r.uz,b=-dx*r.uz+dz*r.ux;if(Math.abs(a)<31&&Math.abs(b)<8)return true}
  const d=DOCK[s];return Math.hypot(x-d.land.x,z-d.land.z)<12;
}
function polyPath(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));return{pts,c,len:c[c.length-1]}}
function pathFor(type,from,to,id=0){
  const a=castlePos(from),b=castlePos(to);
  if(type==='atli')return polyPath(riderPath(from,to,id));
  if(UNITS[type].yol!=='kara')return polyPath([a,b]);
  return polyPath(landRoute(from,to,id)||[a,b]);
}
function pointOn(p,s){
  let i=1;while(i<p.c.length-1&&p.c[i]<s)i++;
  const t=clamp((s-p.c[i-1])/Math.max(.001,p.c[i]-p.c[i-1]),0,1);
  return{x:lerp(p.pts[i-1].x,p.pts[i].x,t),z:lerp(p.pts[i-1].z,p.pts[i].z,t)};
}

// ---------- players ----------
let fountainDown=false,downAt=0;
const P=[0,1,2,3].map(s=>{const p=A.players[s];return{seat:s,on:!!p,bot:!!(p&&p.bot),name:p?String(p.name).slice(0,12):'',money:START_MONEY,hp:p?CASTLE_HP:0,dead:!p,towers:[],units:[],seen:performance.now()+45000,remote:new Map(),airSeen:0,t:0}});
const ME=P[A.seat],local=p=>p===ME||p.bot;
const ALLY=[[],[],[],[]],allied=(a,b)=>a===b||!!ALLY[a][b];
let askFrom=0,aim=null,route=null,draft=null,paintAt=null,uid=1+(A.seat|0)*1000000,tid=1,ended=false,target=null,build=null,picked=null,tipT=0;

function canBuild(D,x,z,type){
  const wall=type==='duvar';
  if(seatAt(x,z)!==D.seat||(DUEL&&Math.abs(x)<DIN-4)||shoreOf(x,z)<WL+2.5||Math.max(Math.abs(x),Math.abs(z))>L-3||(!wall&&roadDist(x,z)<3.6))return false;
  const c=castlePos(D.seat);if(Math.hypot(x-c.x,z-c.z)<CH*1.42+2.2||D.towers.length>=MAX_TOWERS)return false;
  if(reserved(D.seat,x,z))return false;
  return!D.towers.some(t=>Math.hypot(t.x-x,t.z-z)<(wall&&t.type==='duvar'?WALL-.1:3.6));
}
const shipR=t=>78+t.lvl*6,maxHp=t=>(TOWERS[t.type].hp||100)*t.lvl;
function addTower(D,type,x,z){
  const T=TOWERS[type];if(D.money<T.cost||!canBuild(D,x,z,type))return null;
  D.money-=T.cost;const t={id:tid++,type,x,z,lvl:1,hp:T.hp||100,cd:0,paid:T.cost,owner:D.seat,bt:TBUILD[type],BT:TBUILD[type]};clearProps(x,z,type==='duvar'?2.2:3.8);D.towers.push(t);makeTowerModel(t);t.mesh.sy=.12;markBuilt(D);hire(D);return t;
}
function removeTower(D,t){D.towers=D.towers.filter(o=>o!==t);if(D.bot&&t.type!=='duvar')(D.lost||(D.lost=[])).push({x:t.x,z:t.z,t:D.t||0});dropModel(t.mesh);if(picked===t)pick(null);markBuilt(D)}
function upCost(t){return TOWERS[t.type].cost*t.lvl}
function upgrade(D,t){const c=upCost(t);if(t.lvl>=3||D.money<c||t.bt>0)return;D.money-=c;t.paid+=c;t.up=true;t.bt=t.BT=TBUILD[t.type]*.7;markBuilt(D);hire(D)}
// ---------- builders ----------
// every new tower or upgrade needs workers on site; they walk out from the castle, can be cut down, and a lost one costs time
const want=t=>t.type==='duvar'?1:2;
function hire(D){
  if(D.dead)return;const home=castlePos(D.seat),ws=D.units.filter(u=>u.type==='isci'&&u.hp>0&&!u.done);let n=ws.length;
  for(const t of D.towers){if(!(t.bt>0))continue;let have=ws.filter(u=>u.site===t.id).length;
    while(have<want(t)){const idle=ws.find(u=>u.site==null);
      if(idle){sendWorker(idle,t);have++;continue}
      if(n>=WMAX)return;const gq=gateNear(D.seat,t.x,t.z),gx=gq.x+(Math.random()-.5)*1.6,gz=gq.z+(Math.random()-.5)*1.6,id=uid++,u={id,type:'isci',from:D.seat,s:0,hp:UNITS.isci.hp,x:gx,z:gz,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0,slot:have};
      D.units.push(u);ws.push(u);n++;sendWorker(u,t);have++}}
}
function sendWorker(u,t){
  const a=(u.id%5)*1.256+(u.slot||0)*Math.PI,r=t.type==='duvar'?2.4:3.1,spot={x:t.x+Math.cos(a)*r,z:t.z+Math.sin(a)*r};
  u.site=t.id;u.path=polyPath(nav({x:u.x,z:u.z},spot)||[{x:u.x,z:u.z},spot]);u.s=0;u.end=u.path.len;u.home=false;u.atk=false;
}
function workerTick(D,u,dt,home){
  if(u.foe&&Math.hypot(u.foe.x-u.x,u.foe.z-u.z)<3.2)u.fk=true;
  const t=u.site!=null?D.towers.find(o=>o.id===u.site):null;
  if(u.site!=null&&(!t||!(t.bt>0))){u.site=null;hire(D);if(u.site==null){u.home=true;const gq=gateNear(D.seat,u.x,u.z);u.path=polyPath(nav({x:u.x,z:u.z},gq)||[{x:u.x,z:u.z},gq]);u.s=0;u.end=u.path.len}}     // back in through the nearest gate
  if(u.s<u.end){const step=UNITS.isci.sp*dt*drag(u,dt);u.s=Math.min(u.end,u.s+step);const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.atk=false;u.moving=true;u.face=null;return}
  if(u.home||u.site==null){u.done=true;return}
  u.moving=false;u.atk=true;u.cdM=.8;u.face=Math.atan2(t.x-u.x,t.z-u.z);if(u.cd<=0){u.cd=.8;if(Math.random()<.35)sparks(t.x+(u.x-t.x)*.4,t.z+(u.z-t.z)*.4)}
}
function siteTick(D,dt){
  D.hireT=(D.hireT||0)-dt;let need=false;
  for(const t of D.towers){if(!(t.bt>0))continue;need=true;
    let k=0;for(const u of D.units)if(u.type==='isci'&&u.site===t.id&&u.atk&&u.hp>0)k++;
    t.bt-=dt*(TUT?99:k/want(t));
    if(!t.up&&t.mesh){const sy=.12+.88*clamp(1-t.bt/t.BT,0,1);if(Math.abs((t.mesh.sy||1)-sy)>.02||t.bt<=0){t.mesh.sy=t.bt<=0?1:sy;t.mesh.tpl.dirty=true}}
    if(t.bt<=0){t.bt=0;if(t.up){t.up=false;t.lvl++;t.hp=maxHp(t);dropModel(t.mesh);makeTowerModel(t);if(picked===t)pick(t)}
      markBuilt(D);boom(t.x,1,t.z,1,'#c9c9c9');if(D===ME){tip((EN?`${TOWERS[t.type].ad} ready`:`${TOWERS[t.type].ad} hazır`));SES.para()}}}
  if(need){D.dirty=true;if(D.hireT<=0){D.hireT=.6;hire(D)}}
}
function sendUnit(D,to,type,o){
  const U=UNITS[type],built=!!(o&&o.built);if(!U||D.dead||(!built&&D.money<U.cost))return false;
  const R=P[to];if(!R||R.dead||(R===D&&type!=='fuze')||(R!==D&&allied(D.seat,to)))return false;
  if(UNITS[type].yol==='kara'&&!(o&&o.via)&&!landRoute(D.seat,to,0))return false;
  if(!built&&R.units.length+R.remote.size>150)return false;
  if(type==='ucak'&&!built&&D.rwState!==2)return false;
  if(type==='ucak'&&!built){if(D.hg)return false;D.money-=U.cost;D.hg={t:PLANE_T,T:PLANE_T,to,lane:clamp(num(o&&o.lane,2)|0,0,LANES-1)};return true}   // a bomber is built, then takes off by itself for the run its owner chose
  if(type==='fuze'&&!built){if(D.fcd>0)return false;D.fcd=FUZE_CD}
  if((type==='denizalti'||type==='gemi')&&!built){if(D.yard||D.ysState!==2||(type==='gemi'&&fleet(D.seat)>=MAX_SHIPS))return false;D.money-=U.cost;D.yard={type,to,t:BUILD_T[type],T:BUILD_T[type]};return true}
  if(!built)D.money-=U.cost;
  if(local(R))spawn(R,type,D.seat,o);else say('send',{to,from:D.seat,type,o});
  return true;
}
const toPt=a=>Array.isArray(a)?{x:clamp(num(a[0]),-VIEW,VIEW),z:clamp(num(a[1]),-VIEW,VIEW)}:null;
function spawn(R,type,from,o){
  if(o&&o.cmd){const st=toPt(o.start),U=UNITS[type],via=Array.isArray(o.via)?o.via.slice(0,60).map(toPt).filter(Boolean):[];if(!st||!U||!CMDABLE.has(type)||!via.length)return;
    const id=typeof o.keep==='number'&&!R.units.some(q=>q.id===o.keep)?o.keep:uid++,u={id,type,from,path:polyPath([st,{x:st.x+.01,z:st.z}]),s:0,hp:clamp(num(o.hp,U.hp),1,U.hp),x:st.x,z:st.z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0};
    R.units.push(u);setRoute(u,R,via);if(o.rally)u.goRally=true;if(typeof o.lock==='number'){u.lock=o.lock;u.hold=true;u.siege=false;u.ftgt=null;const t=unitById(o.lock);u.lockK=t?t.type:null}return}
  const id=uid++,at=type==='fuze'&&o?toPt(o.at):null,via=(type==='atli'||type==='ucak'||type==='balon'||UNITS[type].yol==='kara')&&o&&Array.isArray(o.via)?o.via.slice(0,48).map(toPt).filter(Boolean):null;
  const U=UNITS[type],a=castlePos(from),b=castlePos(R.seat);let pts;
  if(at)pts=[a,at];
  else if(type==='gemi'&&o&&Array.isArray(o.start)&&toPt(o.start))pts=shipPath(toPt(o.start),clamp(num(o.via)|0,0,3),R.seat,false);
  else if(type==='denizalti'||type==='gemi')pts=seaPath(from,R.seat);
  else if(type==='ucak')pts=RWY[from]?[RWY[from].a,RWY[from].b]:[a,b];
  else if(U.yol==='kara')pts=detour(via&&via.length?[a,...via,b]:(landRoute(from,R.seat,id)||[a,b]),P[from]?P[from].towers:[]);
  else if(type==='atli')pts=via&&via.length?roundPath([a,...via,b],12):riderPath(from,R.seat,id);
  else if(type==='balon'&&via&&via.length)pts=roundPath([a,via[0],b],40);
  else pts=[a,b];
  const path=polyPath(pts);
  const u={id,type,from,path,s:0,hp:UNITS[type].hp,x:0,z:0,bomb:0,cd:0,end:path.len-(type==='balon'?2:type==='denizalti'?22:7+id%5),lane:((id*7)%5-2)*.85,lx:0,lz:0,vx:0,vz:0};u.x=path.pts[0].x;u.z=path.pts[0].z;R.units.push(u);
  if(type==='gemi'&&o&&o.hp)u.hp=clamp(num(o.hp,U.hp),1,U.hp);
  if(type==='ucak'){const side=Math.sign(b.x-a.x)||-SX[R.seat],z=laneZ(R.seat,clamp(num(o&&o.lane,2)|0,0,LANES-1));u.via=[{x:b.x-side*75,z},{x:b.x+side*80,z}];u.lane=0}
  if(type==='ucak'&&o&&o.hp)u.hp=clamp(num(o.hp,U.hp),1,U.hp);
  if(type==='gemi'){let e=path.len-20;for(let q=0;q<path.len;q+=2){const p=pointOn(path,q);if(Math.hypot(p.x-b.x,p.z-b.z)<80){e=q;break}}u.end=e}
  if(type==='ucak'){u.ph=RWY[from]?'roll':'fly';u.spd=0;u.nb=0;u.dropT=0;u.hd=Math.atan2(pts[1].x-pts[0].x,pts[1].z-pts[0].z);u.alt=RWY[from]?heightAt(u.x,u.z)+1.3:28}
  if(type==='fuze'){const e=path.pts[path.pts.length-1];u.tx=e.x;u.tz=e.z;if(o&&typeof o.lock==='number')u.lockT=o.lock}
  if(type==='balon'||type==='fuze')R.airSeen++;
}
// ---------- orders ----------
// soldiers, riders, balloons, ships and submarines can be picked out and sent along a drawn line
const CMDABLE=new Set(['piyade','atli','koc','balon','denizalti','gemi','dalgic']);
const naval=t=>t==='gemi'||t==='denizalti';
// an enemy submarine runs deep: you only make it out once one of your warships is near it, or it is right off your shore
let seenSh=[],seenT=0;
function subSeen(x,z,from){if(allied(from,ME.seat))return true;const t=now();if(t-seenT>400){seenT=t;seenSh=myUnits().filter(c=>c.type==='gemi')}
  return seenSh.some(c=>Math.hypot(c.x-x,c.z-z)<34)||(!ME.dead&&(c=>Math.hypot(c.x-x,c.z-z)<72)(castlePos(ME.seat)))}
function landNear(x,z,r){let best=null,bd=1e9;for(let a=0;a<6.28;a+=.2)for(let k=3;k<=r;k+=2){const X=x+Math.cos(a)*k,Z=z+Math.sin(a)*k;if(shoreOf(X,Z)>WL+2){if(k<bd){bd=k;best={x:X,z:Z}}break}}return best}
function setRoute(u,D,pts){
  const U=UNITS[u.type],cur={x:u.x,z:u.z},e=pts[pts.length-1];let p;
  if(naval(u.type))p=roundPath(seaRoute([cur,...pts]),18);
  else if(U.yol==='kara'){p=tidyRoute([cur,...pts]);if(p&&p.length>2){const r=roundPath(p,7);if(r.every(q=>canStand(u,q.x,q.z)))p=r}}     // soft bends wherever the ground allows
  else if(U.yol==='su'){p=roundPath([cur,...pts],8);
    // riders swim only a bridge's length from land: a longer crossing goes round by land and bridges instead
    if(u.type==='atli'){const q=polyPath(p);let deep=false;for(let k=0;k<=q.len&&!deep;k+=3){const o=pointOn(q,k);if(shoreOf(o.x,o.z)<-RIDE_SEA)deep=true}
      if(deep){const t=tidyRoute([cur,...pts]);p=t&&t.length>=2?t:[cur,{x:cur.x+.01,z:cur.z}];if(D===ME&&u.from===ME.seat&&now()-lockTipT>4000){lockTipT=now();tip(TL('Atlılar açık denize çıkamaz, karadan dolaşıyorlar','Riders cannot cross open sea, they go round by land'))}}}}
  else p=[cur,...pts];
  if(p)p=p.filter(q=>q&&isFinite(q.x)&&isFinite(q.z));
  if(!p||p.length<2)p=[cur,{x:cur.x+.01,z:cur.z}];
  u.path=polyPath(p);u.s=0;u.end=u.path.len;u.off=false;u.reS=false;u.tgt=null;u.cmd=true;u.wtry=0;u.lx=u.lz=0;u.ox=u.oz=0;u.rs=null;u.goRally=false;
  const foe=D.seat!==u.from&&!allied(D.seat,u.from),c=castlePos(D.seat);
  let tw=null,bd=naval(u.type)?26:12;if(foe)for(const t of D.towers){const d=Math.hypot(t.x-e.x,t.z-e.z);if(d<bd){bd=d;tw=t}}
  u.ftgt=tw;u.siege=foe&&Math.hypot(c.x-e.x,c.z-e.z)<(naval(u.type)?40:20);
  u.aim=foe&&(tw||u.siege)?{x:e.x,z:e.z}:null;u.hold=!(tw||u.siege);
  if(u.siege&&!naval(u.type)&&!tw){u.end=Math.max(0,u.path.len-(5.5+u.id%5));u.lane=((u.id*7)%5-2)*.85}
  if(u.type==='gemi'&&u.aim){u.end=u.path.len;for(let q=0;q<=u.path.len;q+=2){const r=pointOn(u.path,q);if(Math.hypot(r.x-u.aim.x,r.z-u.aim.z)<=SHIP_STAND){u.end=q;break}}}   // stop as soon as the guns reach
  if(u.type==='denizalti'){const q=u.path.pts[u.path.pts.length-1],l=landNear(q.x,q.z,55);u.land=l&&seatAt(l.x,l.z)===D.seat?l:null;u.hold=!(foe&&u.land)}
}
// a finished bomber waits at the head of its runway, a finished warship at its dock, until they are sent
function parkPlane(D){const r=RWY[D.seat];if(!r)return;const k=D.units.filter(u=>u.type==='ucak'&&u.ph==='park').length,dx=(r.b.x-r.a.x)/r.len,dz=(r.b.z-r.a.z)/r.len,x=r.a.x+dx*(4+k*9),z=r.a.z+dz*(4+k*9);
  D.units.push({id:uid++,type:'ucak',from:D.seat,path:polyPath([{x,z},{x:x+.01,z}]),s:0,hp:UNITS.ucak.hp,x,z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0,ph:'park',hd:Math.atan2(dx,dz),alt:heightAt(x,z)+1.3,spd:0,nb:0,dropT:0})}
function parkShip(D,type){const L0=LAUNCH[D.seat],k=D.units.filter(u=>u.type==='gemi'&&u.from===D.seat&&u.hold).length,p=L0.park,q={x:p.x+(k%2?9:-9)*Math.cos(DOCK[D.seat].ang),z:p.z-(k%2?9:-9)*Math.sin(DOCK[D.seat].ang)},path=polyPath([L0.st,L0.mid,shoreOf(q.x,q.z)<-5?q:p]);
  D.units.push({id:uid++,type,from:D.seat,path,s:0,hp:UNITS[type].hp,x:L0.st.x,z:L0.st.z,bomb:0,cd:0,end:path.len,lane:0,lx:0,lz:0,vx:0,vz:0,hold:true,cmd:true})}
// ---------- training and the muster field ----------
const TQ=[];let tqT=0;
function popOf(seat){let n=0;for(const D of P){if(!D.on)continue;
  if(local(D)){for(const u of D.units)if(u.from===seat&&POP[u.type]&&!u.done&&!u.ret&&u.hp>0&&u.fall==null)n+=POP[u.type]}
  else for(const o of D.remote.values())if(o.from===seat&&POP[o.type]&&!(o.fl&2))n+=POP[o.type]}
  if(seat===ME.seat)for(const k of TQ)n+=POP[k];return n}
function trainBuy(k){
  if(ME.dead)return;const U=UNITS[k];
  if(popOf(ME.seat)+POP[k]>POP_CAP){tip(EN?`Army is full (${POP_CAP}). Send troops out or lose some first.`:`Ordu dolu (${POP_CAP}). Önce birlik gönder.`);return}
  if(TQ.length>=10){tip(TL('Eğitim sırası dolu (10)','Training queue is full (10)'));return}
  if(ME.money<U.cost){tip(TL('Altının yetmiyor','Not enough gold'));return}
  ME.money-=U.cost;if(!TQ.length)tqT=TRAIN[k];TQ.push(k);
  tip(EN?`${U.ad} in training (${TRAIN[k]} s), then waits on the muster field`:`${U.ad} eğitiliyor (${TRAIN[k]} sn), sonra birlik alanında bekler`)}
function trainTick(dt){if(!TQ.length)return;if(ME.dead){TQ.length=0;return}tqT-=dt;if(tqT>0)return;const k=TQ.shift();muster(ME,k);if(TQ.length)tqT=TRAIN[TQ[0]]}
const slotAt=(s,k)=>{const R=RALLY[s],r=1.9*Math.sqrt(k+.6),a=k*2.39996;return{x:R.x+Math.cos(a)*r,z:R.z+Math.sin(a)*r}};
function toSlot(D,u){const used=new Set();for(const o of D.units)if(o!==u&&o.rs!=null&&o.from===D.seat)used.add(o.rs);let k=0;while(used.has(k))k++;setRoute(u,D,[slotAt(D.seat,k)]);u.rs=k;u.hold=true}
function muster(D,k){
  const R0=RALLY[D.seat],gq=gateNear(D.seat,R0.x,R0.z),st={x:gq.x+(Math.random()-.5)*1.5,z:gq.z+(Math.random()-.5)*1.5},U=UNITS[k];     // out through the gate facing the muster field
  const u={id:uid++,type:k,from:D.seat,path:polyPath([st,{x:st.x+.01,z:st.z}]),s:0,hp:U.hp,x:st.x,z:st.z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0};
  D.units.push(u);toSlot(D,u);if(D===ME)SES.para()}
function atRally(){const out={piyade:[],atli:[],koc:[],balon:[]};for(const u of ME.units)if(u.from===ME.seat&&u.rs!=null&&out[u.type]&&!u.done&&u.hp>0&&u.fall==null)out[u.type].push(u);for(const k in out)out[k].sort((a,b)=>b.hp/UNITS[b.type].hp-a.hp/UNITS[a.type].hp);return out}
function applyCmd(D,ids,pts,by,rally,lock,lockAt){
  const set=new Set(ids);
  for(const u of D.units){if(!set.has(u.id)||u.from!==by||u.ret||u.done||u.fall!=null||u.hp<=0||!CMDABLE.has(u.type)||u.dove!=null)continue;
    if(rally){if(naval(u.type))continue;const R=RALLY[by];          // back to the muster field to heal
      if(D.seat===by){setRoute(u,D,[R]);u.goRally=true;continue}
      u.done=true;const o={start:[Math.round(u.x),Math.round(u.z)],via:[[R.x,R.z]],hp:Math.round(u.hp),cmd:1,keep:u.id,rally:1};
      if(local(P[by]))spawn(P[by],u.type,by,o);else say('send',{to:by,from:by,type:u.type,o});continue}
    const e=pts&&pts[pts.length-1];let S=lockAt!=null&&P[lockAt]&&P[lockAt].on&&!P[lockAt].dead?lockAt:e?seatAt(e.x,e.z):D.seat;const T=P[S];
    if(!T||!T.on||T.dead||(S!==by&&allied(S,by)))S=D.seat;
    if(u.type==='ucak'){           // bombers fly the drawn line and drop their load over the base they cross
      if(!pts)continue;
      if(u.ph==='park'){if(S===by||S===D.seat&&allied(S,by)){if(by===ME.seat)tip(TL('Uçağın yolunu düşman üssünün üstünden geçecek şekilde çiz','Draw the bomber\'s line across an enemy base'));continue}
        u.done=true;const o={via:pts.slice(0,48).map(p=>[Math.round(p.x),Math.round(p.z)]),hp:Math.round(u.hp)};if(local(P[S]))spawn(P[S],'ucak',by,o);else say('send',{to:S,from:by,type:'ucak',o});continue}
      if(S===D.seat&&u.ph!=='roll'){u.via=pts.slice(0,48).map(p=>({x:p.x,z:p.z}));u.wi=0;if(u.ph==='home'||u.ph==='land'||u.ph==='bomb')u.ph='fly'}continue}
    if(!pts){setRoute(u,D,[{x:u.x+.01,z:u.z}]);u.hold=true;u.ftgt=null;u.siege=false;u.aim=null;continue}
    if(S===D.seat){setRoute(u,D,pts);if(lock!=null){u.lock=lock;u.hold=true;u.siege=false;u.ftgt=null;u.rp2=3;const t=unitById(lock);u.lockK=t?t.type:null}continue}
    u.done=true;const o={start:[Math.round(u.x),Math.round(u.z)],via:pts.map(p=>[Math.round(p.x),Math.round(p.z)]),hp:Math.round(u.hp),cmd:1,keep:u.id,lock};
    if(local(P[S]))spawn(P[S],u.type,by,o);else say('send',{to:S,from:by,type:u.type,o})}
}
// warships and submarines never sit inside one another
function navalSep(D,dt){
  const all=[];for(const E of P){if(!E.on)continue;for(const o of E.units)if(naval(o.type)&&o.fall==null&&!o.done&&o.dove==null)all.push(o);if(!local(E))for(const o of E.remote.values())if(naval(o.type)&&!(o.fl&2))all.push({x:o.tx,z:o.tz,type:o.type,moving:!(o.fl&4)})}
  for(const u of D.units){if(!naval(u.type)||u.fall!=null||u.dove!=null||u.done)continue;let px=0,pz=0,under=false;
    const go=u.moving!==false&&u.s<u.end,h=go?pointOn(u.path,u.s+4):null,hx=h?h.x-u.x:0,hz=h?h.z-u.z:0,hl=Math.hypot(hx,hz)||1;
    for(const o of all){if(o===u)continue;const m=(u.type==='gemi'?6.5:3.6)+(o.type==='gemi'?6.5:3.6),dx=u.x-o.x,dz=u.z-o.z,d=Math.hypot(dx,dz);
      if(d>=m+6)continue;
      if(u.type!==o.type){if(u.type==='denizalti'&&d<m+2)under=true;continue}     // a submarine slips under a warship instead of bumping it
      const oGo=o.moving!==false&&(o.s==null||o.s<o.end);
      if(!go&&oGo)continue;                          // a ship lying still is never shoved by one going past
      if(go&&(hx*-dx+hz*-dz)/hl>0&&d<m+5){const side=(hx*-dz-hz*-dx)>0?-1:1;px+=-hz/hl*side*2.2;pz+=hx/hl*side*2.2}   // something ahead: steer round it
      if(d<m){if(d<.05){px+=(u.id%2?1:-1)*m;continue}const k=(m-d)/d*(go&&!oGo?1.6:1);px+=dx*k;pz+=dz*k}}
    u.under=under;
    let ax=-(u.ox||0)*dt*.12+px*Math.min(1,dt*2.5),az=-(u.oz||0)*dt*.12+pz*Math.min(1,dt*2.5);
    if(shoreOf(u.x+ax,u.z+az)>-3){ax*=.2;az*=.2}
    u.ox=clamp((u.ox||0)+ax,-18,18);u.oz=clamp((u.oz||0)+az,-18,18);u.x+=ax;u.z+=az}
}
// a warship that has sunk its target sails on to the nearest enemy, or home by sea if none is left
function shipPath(st,via,to,home){
  const a=rear(via),b=rear(to),pts=[st,a];if(via!==to){if(DUEL)pts.push(...lane(a,b));else if(SX[via]!==SX[to]&&SZ[via]!==SZ[to])pts.push({x:b.x,z:a.z});pts.push(b)}
  if(home)pts.push(DOCK[to].sea);else{const c=castlePos(to);let t=0;while(t<1&&shoreOf(lerp(b.x,c.x,t),lerp(b.z,c.z,t))<-2)t+=.02;pts.push({x:lerp(b.x,c.x,t),z:lerp(b.z,c.z,t)})}
  return roundPath(pts,48);
}
function shipOn(O,fallen,hp,x,z){
  const foes=P.filter(p=>p.on&&!p.dead&&p!==O&&p.seat!==fallen&&!allied(p.seat,O.seat)).sort((a,b)=>{const A=castlePos(a.seat),B=castlePos(b.seat);return Math.hypot(A.x-x,A.z-z)-Math.hypot(B.x-x,B.z-z)});
  if(foes.length){const R=foes[0],o={start:[Math.round(x),Math.round(z)],via:fallen,hp:Math.round(hp)};if(local(R))spawn(R,'gemi',O.seat,o);else say('send',{to:R.seat,from:O.seat,type:'gemi',o});if(O===ME)tip((EN?`Ship heading for ${R.name}`:`Gemi ${R.name} üstüne gidiyor`));return}
  const back=polyPath(shipPath({x,z},fallen,O.seat,true));
  O.units.push({id:uid++,type:'gemi',from:O.seat,path:back,s:0,hp:clamp(hp,1,UNITS.gemi.hp),x,z,bomb:0,cd:0,end:back.len,ret:true});
}
function comeHome(O,type,fallen,s,hp,x,z){
  if(O.dead||!UNITS[type])return;
  if(type==='gemi'&&x!=null){shipOn(O,clamp(fallen|0,0,3),hp,x,num(z));return}
  const p=pathFor(type,O.seat,fallen),at=clamp(s,0,p.len),pts=[pointOn(p,at)];
  for(let i=p.pts.length-1;i>=0;i--)if(p.c[i]<at)pts.push(p.pts[i]);
  const back=polyPath(x!=null?(UNITS[type].yol==='kara'?(nav({x,z:num(z)},castlePos(O.seat))||[{x,z:num(z)},castlePos(O.seat)]):[{x,z:num(z)},castlePos(O.seat)]):pts);pts[0]=back.pts[0];
  O.units.push({id:uid++,type,from:O.seat,path:back,s:0,hp:clamp(hp,1,UNITS[type].hp),x:pts[0].x,z:pts[0].z,bomb:0,cd:0,end:back.len,ret:true});
}
function damageCastle(R,d){
  R.hp=Math.max(0,R.hp-d);
  if(R.hp<=0&&!R.dead)eliminate(R);
}
function eliminate(R){
  R.dead=true;R.hp=0;
  for(const u of R.units){if(u.ret||u.hp<=0||u.type==='denizalti')continue;const O=P[u.from];if(!O)continue;
    if(local(O))comeHome(O,u.type,R.seat,u.s,u.hp,u.x,u.z);else say('home',{to:u.from,type:u.type,from:R.seat,s:Math.round(u.s),hp:Math.round(u.hp),x:Math.round(u.x),z:Math.round(u.z)})}
  R.units=R.units.filter(u=>u.ret&&!R.dead);
  for(const t of R.towers.slice())if(t.mesh)t.mesh.visible=false;
  if(R===ME){say('dead',{s:R.seat});const left=P.filter(p=>p.on&&!p.dead).length+1;finish(TL('Kulen yıkıldı','Your tower fell'),(EN?`You placed ${left}.`:`${left}. oldun.`),true)}
  else tip((EN?`${R.name} is out!`:`${R.name} elendi!`));
  checkEnd();
}
function checkEnd(){
  if(ended||ME.dead)return;
  if(P.every(p=>!p.on||p.dead||allied(p.seat,ME.seat)))finish(TL('ZAFER','VICTORY'),P.some(p=>p.on&&!p.dead&&p!==ME)?TL('İttifakınız ayakta kaldı.','Your alliance stands.'):TL('Son ayakta kalan kule senin.','Yours is the last tower standing.'),false);
}
function finish(a,b,watch){ended=true;$('aeTitle').textContent=a;$('aeText').textContent=b;$('aeWatch').hidden=!watch;$('arenaEnd').hidden=false}

// ---------- sound ----------
const floats=[],marks=[];
// loudness follows how close the noise is to your own castle: your base is loud, the far side of the map a whisper
function nearHome(x,z){const c=castlePos(ME.seat),d=Math.hypot(x-c.x,z-c.z),k=clamp(1.12-d/165,0,1);return k*k}
function fxAt(D,x,z,kind){
  const zoom=view.d<95?clamp(1.1-Math.hypot(x-view.x,z-view.z)/view.d,0,1)*.45:0,v=Math.max(nearHome(x,z),zoom);if(v<.04)return;
  const p=clamp((x-view.x)/(view.d*.8),-1,1)*.7,f=SES[kind==='vur'?'kilic':kind];
  if(f)f.call(SES,v,p);
}
function ambience(){
  let horse=0,water=0;
  for(const D of P){
    if(!D.on)continue;
    for(const u of D.units.length?D.units:D.remote.values()){
      if(u.type!=='atli')continue;const v=nearHome(u.x,u.z);
      if(heightAt(u.x,u.z)<.3)water=Math.max(water,v);else horse=Math.max(horse,v)}}
  if(horse>.06)SES.atli(horse);if(water>.06)SES.su(water);
  SES.int=clamp(ME.units.length/14,.12,1);
}
// ---------- simulation ----------
// a shell-hole is hard going: deeper means slower, and climbing out is slower still
function drag(u,dt){
  const d=sunk(u.x,u.z);if(d<.05){u.pd=0;return 1}
  const out=d<(u.pd||0);u.pd=d;
  if(Math.random()<dt*3)boom(u.x,.4,u.z,.7,'#9a8468');
  return Math.max(.15,(out?.7:1)/(1+d*(u.type==='koc'?1.5:.9)));
}
function blast(D,x,z,r,towerDmg,castleDmg,from,unitDmg){
  hitWorld(x,z,r);
  if(D.seat===from){for(const o of D.units)if(unitDmg&&o.from!==from&&!o.ret&&!flies(UNITS[o.type])&&Math.hypot(o.x-x,o.z-z)<r)o.hp-=unitDmg;return}
  for(const t of D.towers.slice()){const d=Math.hypot(t.x-x,t.z-z);if(d>=r)continue;t.hp-=towerDmg*(1-d/r*.6);t.shake=.3;if(t.hp<=0){explode(t.x,t.z,2);crater(t.x,t.z,3.6);removeTower(D,t)}}
  if(unitDmg)for(const o of D.units)if(o.from!==from&&!o.ret&&!flies(UNITS[o.type])&&Math.hypot(o.x-x,o.z-z)<r)o.hp-=unitDmg;
  const c=castlePos(D.seat);if(castleDmg&&Math.hypot(c.x-x,c.z-z)<12)damageCastle(D,castleDmg);
}
// missiles and crashes can also wreck the shared fountain and built bridges
function hitWorld(x,z,r){
  if(!DUEL&&!fountainDown&&Math.hypot(x,z)<r+6)breakFountain();
  if(DUEL)DBR.forEach((b,i)=>{if(!b.down&&segD(x,z,b)<r+1.5)breakDuelBridge(i)});
  for(const b of bridges.slice())if(segD(x,z,b)<r+1.5)breakBridge(b);
}
// soldiers keep clear of each other, and fight any enemy they run into
// a unit anywhere on the map by id: the real one where this screen runs it, else the last snapshot of it
function unitById(id){for(const D of P){if(!D.on)continue;if(local(D)){const u=D.units.find(o=>o.id===id);if(u)return u}else{const o=D.remote.get(id);if(o&&!(o.fl&2))return{remote:true,x:o.tx,z:o.tz,type:o.type,from:o.from,hp:1}}}return null}
// where a soldier may set foot: foot soldiers keep to land and bridges, riders may swim a bridge's length out to sea
const RIDE_SEA=26;
function canStand(u,x,z){const Y=UNITS[u.type].yol;if(u.type==='dalgic'||Y==='hava')return true;const s=shoreOf(x,z);if(u.type==='atli')return s>-RIDE_SEA;
  return s>.4||onDeckFixed(x,z)||bridges.some(b=>segD(x,z,b)<3)}
// the tapped enemy is down: hold the ground where the fight ended
// the target the player picked is gone: go straight on to the nearest enemy of the same kind close by
function relock(u,D){const was=u.lockK;u.lockK=null;if(!was)return false;let best=null,bd=48;
  for(const o of D.units){if(o.hp<=0||o.done||o.ret||o.fall!=null||o.dove!=null||allied(o.from,u.from)||!canLock(u.type,o))continue;
    if(fighter(u.type)&&naval(o.type)!==naval(was))continue;const d=Math.hypot(o.x-u.x,o.z-u.z);if(d<bd){bd=d;best=o}}
  if(!best)return false;u.lock=best.id;u.lockK=best.type;u.hold=true;u.siege=false;u.ftgt=null;u.rp2=0;u.foe=null;u.stuck=0;return true}
function standHere(u){u.path=polyPath([{x:u.x,z:u.z},{x:u.x+.01,z:u.z}]);u.s=0;u.end=0;u.off=false;u.reS=false;u.hold=true;u.siege=false;u.ftgt=null;u.rs=null}
function scanFoes(D){
  const all=[];
  for(const E of P){for(const o of E.units)if(o.hp>0&&!o.ret&&!o.done&&o.fall==null&&!(o.emerge>0)&&o.dove==null&&(fighter(o.type)||naval(o.type)))all.push({id:o.id,ref:o,x:o.x,z:o.z,from:o.from,type:o.type,nav:naval(o.type)});
    if(!local(E))for(const[k,o]of E.remote)if(!(o.fl&2)&&(fighter(o.type)||naval(o.type)))all.push({id:k,x:o.tx,z:o.tz,from:o.from,type:o.type,nav:naval(o.type)})}
  const tnow=now();
  for(const u of D.units){if(u.ret||u.fall!=null||!fighter(u.type)){u.foe=null;continue}
    u.vx=u.vz=0;
    if(u.lock!=null){const e=all.find(q=>q.id===u.lock);if(e&&!allied(e.from,u.from)&&Math.hypot(e.x-u.x,e.z-u.z)<160){u.foe=e;continue}u.lock=null;if(!relock(u,D))standHere(u);else continue}   // a target the player tapped
    // at home soldiers go for raiders they see; out on a march they only fight what they bump into
    let best=u.type==='isci'?6:u.from===D.seat?(u.rs!=null?28:22):7,f=null;for(const e of all){if(allied(e.from,u.from)||(e.nav&&u.type!=='dalgic')||(u.ign===e.id&&tnow<u.ignT))continue;const d=Math.hypot(e.x-u.x,e.z-u.z);if(d<best){best=d;f=e}}
    u.foe=f}
  const n=D.units.length;
  for(let i=0;i<n;i++){const a=D.units[i];if(!fighter(a.type)||a.ret)continue;const ra=a.type==='koc'?2.3:a.type==='atli'?1.5:.85;
    for(let j=i+1;j<n;j++){const b=D.units[j];if(!fighter(b.type)||b.ret)continue;const m=ra+(b.type==='koc'?2.3:b.type==='atli'?1.5:.85),dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||.01;
      if(d<m){const k=(m-d)/d*5;a.vx-=dx*k;a.vz-=dz*k;b.vx+=dx*k;b.vz+=dz*k}}}
}
function simDefender(D,dt){
  if(D.dead)return;
  D.money+=(1+Math.min(2,D.t/150))*dt;D.t+=dt;          // income grows as the match goes on
  const home=castlePos(D.seat);
  D.foeAcc=(D.foeAcc||0)+dt;if(D.foeAcc>=.2){D.foeAcc=0;scanFoes(D)}
  siteTick(D,dt);
  for(const u of D.units){
    const U=UNITS[u.type],air=U.yol==='hava';u.cd-=dt;u.bomb-=dt;u.atk=false;
    if(u.type==='isci'){workerTick(D,u,dt,home);continue}
    if(u.type==='gemi'){          // sail into range of the target's coast, then shell it
      if(u.ret){u.s+=U.sp*1.2*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.moving=true;if(u.s>=u.end){u.done=true;const m=Math.round(U.cost/2);if(u.from!==D.seat){refund(u.from,m);continue}D.money+=m;if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+m});SES.para();tip(TL('Gemi limana döndü','Ship is back in port'))}}continue}
      if(u.s<u.end){u.s=Math.min(u.end,u.s+U.sp*dt);u.moving=true}else u.moving=false;
      {const p=pointOn(u.path,u.s);u.x=p.x+(u.ox||0);u.z=p.z+(u.oz||0)}
      // enemy warships that sight each other trade broadsides; each side counts the hits it takes
      u.sf=(u.sf||0)-dt;if(u.sf<=0){u.sf=.5;u.foeS=null;let bd=180;
        // a target the player tapped (ship, submarine, troops on a shore): close in and shell it
        if(u.lock!=null){const tr=unitById(u.lock);if(!tr||tr.hp<=0||tr.done||tr.ret||tr.fall!=null||allied(tr.from,u.from)){u.lock=null;u.end=u.s;relock(u,D)}
          else{const d=Math.hypot(tr.x-u.x,tr.z-u.z);u.foeS={x:tr.x,z:tr.z,ref:tr.remote?null:tr};bd=-1;
            if(d>62&&(u.rp2=(u.rp2||0)-.5)<=0){u.rp2=3;const L0=u.lock;setRoute(u,D,[{x:tr.x,z:tr.z}]);u.lock=L0;u.hold=true}else if(d<=58)u.end=u.s}}
        if(bd>0)for(const E of P){if(!E.on)continue;const lo=local(E);for(const o of lo?E.units:E.remote.values()){if(o===u||o.type!=='gemi')continue;const of=lo?o.from:num(o.from,E.seat);if(allied(of,u.from)||(lo?o.fall!=null||o.done||o.ret:o.fl&2))continue;
          const ox=lo?o.x:o.tx,oz=lo?o.z:o.tz,d=Math.hypot(ox-u.x,oz-u.z),rng=E===D&&u.from===D.seat?175:SHIP_SEE;if(d<bd&&d<rng){bd=d;u.foeS={x:ox,z:oz,ref:lo?o:null,id:o.id||null}}}}
        // a warship at home goes out by itself to meet one shelling the base
        if(u.foeS&&u.lock==null&&u.from===D.seat&&!u.moving&&u.foeS.ref&&Math.hypot(u.foeS.x-u.x,u.foeS.z-u.z)>85){u.lock=u.foeS.ref.id;u.lockK='gemi';u.rp2=0;u.hold=true}}
      if(u.foeS){const e=u.foeS,ref=e.ref;if(ref){e.x=ref.x;e.z=ref.z}u.c2=(u.c2||0)-dt;u.face=Math.atan2(e.x-u.x,e.z-u.z);
        if(u.c2<=0&&Math.hypot(e.x-u.x,e.z-u.z)<90){u.c2=3;const d=Math.hypot(e.x-u.x,e.z-u.z),from=u.from;
          // shells land on the target where this screen runs it; a ship simulated elsewhere is hurt there, so here we trade hits as before
          for(let k=0;k<2;k++){const ox=Math.sin(u.face)*(k?-6:5),oz=Math.cos(u.face)*(k?-6:5);shell(D,u.x+ox,2.4,u.z+oz,e.x+(Math.random()-.5)*5,e.z+(Math.random()-.5)*5,1+d/70+k*.3,8+d*.1,'top',(x,z)=>{
            if(ref&&!ref.done&&Math.hypot(ref.x-x,ref.z-z)<7){ref.hp-=naval(ref.type)?34:45;ref.fk=ref.fk||from!==D.seat;explode(x,z,1.2)}else{splash(x,z,2.2);fxAt(D,x,z,'dalga')}});flame(u.x+ox,2.8,u.z+oz,3.2,.2);puff(u.x+ox,3.2,u.z+oz,2.2,2.2,.72,1,.5)}
          fxAt(D,u.x,u.z,'top');if(!ref)u.dmgT=1.2+Math.random()*.6}}
      if(u.dmgT>0){u.dmgT-=dt;if(u.dmgT<=0){u.hp-=60;explode(u.x+(Math.random()-.5)*4,u.z+(Math.random()-.5)*4,1.2)}}
      if(u.foeS||u.moving||u.hold||allied(u.from,D.seat)){}
      else{u.atk=!u.noT;u.cdM=3.4;
        if(u.cd<=0){u.cd=3.4;let tg=null,bd=u.aim?32:105;const ref=u.aim||u;for(const t of D.towers){const d=Math.hypot(t.x-ref.x,t.z-ref.z);if(d<bd&&Math.hypot(t.x-u.x,t.z-u.z)<125){bd=d;tg=t}}
          if(!tg&&Math.hypot(home.x-u.x,home.z-u.z)>(u.siege?125:110)){u.atk=false;u.noT=true;u.cd=.6;continue}u.noT=false;
          const tx=tg?tg.x:home.x,tz=tg?tg.z:home.z,d=Math.hypot(tx-u.x,tz-u.z),from=u.from;u.face=Math.atan2(tx-u.x,tz-u.z);
          for(let k=0;k<2;k++){const ox=Math.sin(u.face)*(k?-6:5),oz=Math.cos(u.face)*(k?-6:5);
            shell(D,u.x+ox,2.4,u.z+oz,tx+(Math.random()-.5)*7,tz+(Math.random()-.5)*7,1.2+d/70+k*.35,12+d*.12,'top',(x,z)=>{explode(x,z,1.5);crater(x,z,3.2);fxAt(D,x,z,'bomba');blast(D,x,z,5.5,55,20,from,30)});
            flame(u.x+ox,2.8,u.z+oz,3.2,.2);puff(u.x+ox,3.2,u.z+oz,2.2,2.2,.72,1,.5)}
          fxAt(D,u.x,u.z,'top')}}
      continue}
    if(U.yol==='ucak'){planeTick(D,u,dt,home);if(D.dead)return;continue}
    if(U.yol==='deniz'){          // sail round the coast, then land the divers
      if(u.dove!=null){u.dove+=dt;u.moving=false;if(u.dove>2.4)u.done=true;continue}
      if(u.s<u.end){u.s=Math.min(u.end,u.s+U.sp*dt);u.moving=true}else u.moving=false;
      {const p=pointOn(u.path,u.s);u.x=p.x+(u.ox||0);u.z=p.z+(u.oz||0)}
      if(u.moving&&!u.hold&&!u.cmd&&!allied(u.from,D.seat)&&u.s>u.path.len*.5&&(u.lk=(u.lk||0)-dt)<=0){u.lk=.5;const l=landNear(u.x,u.z,30);if(l&&seatAt(l.x,l.z)===D.seat){u.land=l;u.end=u.s;u.moving=false}}     // stop well out at sea, like a warship
      if(!u.moving&&!u.hold&&!allied(u.from,D.seat)){       // lie offshore, dive, and let the divers swim up onto the island
        const l=u.land||landNear(u.x,u.z,58);if(!l||seatAt(l.x,l.z)!==D.seat){u.hold=true;continue}
        u.dove=0;ripple(u.x,u.z,6);ripple(u.x,u.z,3.5);fxAt(D,u.x,u.z,'dalga');
        for(let i=0;i<10;i++){const a=i*.628+.3,x=u.x+Math.cos(a)*(1.2+(i%2)*1.6),z=u.z+Math.sin(a)*(1.2+(i%2)*1.6),id=uid++,lx=l.x+Math.cos(a)*3.5,lz=l.z+Math.sin(a)*3.5,path=polyPath([{x,z},{x:lx,z:lz},home]);
          D.units.push({id,type:'dalgic',from:u.from,path,s:0,hp:UNITS.dalgic.hp,x,z,bomb:0,cd:0,end:path.len-(13+id%4),lane:0,lx:0,lz:0,vx:0,vz:0,emerge:1.6+i*.15})}
        if(D===ME)tip(TL('Düşman balık adamlar denizden çıkıyor!','Enemy frogmen are coming up out of the sea!'))}
      continue}
    if(u.fall!=null){               // a shot-down balloon drops and bursts where it lands
      u.fall+=dt;
      if(u.type==='gemi'){     // a sunk warship blows up, burns, tips its bow up and goes down
        const sx=Math.sin(u.dir||0),sz=Math.cos(u.dir||0),rx=(Math.random()-.5)*2.4,rk=(Math.random()-.5)*12;
        if(u.fall<=dt*1.5){boom(u.x,3,u.z,6,'#ff7a2a');boom(u.x+sx*4,4,u.z+sz*4,4,'#ffe08a');splash(u.x,u.z,5);fxAt(D,u.x,u.z,'bomba')}
        if(u.fall<3.2&&Math.random()<dt*2.2){boom(u.x+sx*rk+sz*rx,2.5,u.z+sz*rk-sx*rx,2.5+Math.random()*2,Math.random()<.5?'#ff7a2a':'#ffb347');fxAt(D,u.x,u.z,'top')}
        if(u.fall<4&&Math.random()<dt*9)flame(u.x+sx*rk*.6,2.6-u.fall*.5,u.z+sz*rk*.6,2.4,.3);
        if(Math.random()<dt*6)puff(u.x+(Math.random()-.5)*6,2,u.z+(Math.random()-.5)*6,2.4,3.2,.18,2,.6);
        if(u.fall>2.5&&Math.random()<dt*3)ripple(u.x,u.z,9);
        if(u.fall>6)u.done=true;continue}
      if(u.type==='ucak'){u.x+=Math.sin(u.hd||0)*U.sp*.75*dt;u.z+=Math.cos(u.hd||0)*U.sp*.75*dt;u.y=u.y0-8*u.fall*u.fall;u.alt=u.y;
        if(Math.random()<dt*16){puff(u.x,u.y,u.z,1.8,2.6,.14,.5,.3);flame(u.x,u.y,u.z,2.2,.25)}
        if(u.y<=Math.max(heightAt(u.x,u.z),0)+1){u.done=true;explode(u.x,u.z,4);crater(u.x,u.z,5);fxAt(D,u.x,u.z,'bomba');blast(D,u.x,u.z,10,110,30,u.from,50);if(D.dead)return}
        continue}
      u.y=20-13*u.fall*u.fall;
      if(u.y<=Math.max(heightAt(u.x,u.z),0)+1){u.done=true;boom(u.x,3,u.z,7,'#ff7a2a');boom(u.x,5,u.z,4,'#ffd27a');explode(u.x,u.z,3);crater(u.x,u.z,4);fxAt(D,u.x,u.z,'bomba');blast(D,u.x,u.z,8,90,U.dmg*2,u.from,45);if(D.dead)return}
      continue}
    if(u.ret){u.s+=U.sp*1.3*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;if(u.s>=u.end){u.done=true;const m=Math.round(U.cost/2);if(u.from!==D.seat){refund(u.from,m);continue}D.money+=m;if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+m});SES.para()}}continue}
    if(U.yol==='fuze'){            // a missile flies to the spot its owner picked, or chases the ship or soldier it was fired at
      if(u.lockT!=null){const tr=unitById(u.lockT);
        if(tr&&tr.hp>0&&!tr.done&&tr.fall==null){const a=u.path.pts[0],f=u.s/Math.max(1,u.path.len);u.path=polyPath([a,{x:tr.x,z:tr.z}]);u.s=f*u.path.len;u.tx=tr.x;u.tz=tr.z;u.ey=flies(UNITS[tr.type])?airY(tr):6;u.lockR=tr.remote?null:tr}else u.lockT=null}
      u.s+=U.sp*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.t=clamp(u.s/u.path.len,0,1);
      if(u.s>=u.path.len-2){u.done=true;const lr=u.lockR;if(lr&&!lr.done&&lr.hp>0&&Math.hypot(lr.x-u.tx,lr.z-u.tz)<9){lr.hp-=220;lr.fk=true;if(lr.type==='ucak'||lr.type==='balon')boom(lr.x,lr.alt||20,lr.z,6,'#ff7a2a')}if((u.ey||6)>10){boom(u.tx,u.ey,u.tz,8,'#ff7a2a');boom(u.tx,u.ey+2,u.tz,4,'#ffe08a');fxAt(D,u.tx,u.tz,'bomba')}else{boom(u.tx,6,u.tz,9,'#ff7a2a');boom(u.tx,9,u.tz,5,'#ffe08a');explode(u.tx,u.tz,5);crater(u.tx,u.tz,7);fxAt(D,u.tx,u.tz,'bomba');blast(D,u.tx,u.tz,9,150,U.dmg,u.from,80)}if(D.dead)return}
      continue}
    if(u.emerge>0)u.emerge-=dt;
    if(u.from===D.seat&&u.s>=u.end&&!u.foe){if(u.goRally){u.goRally=false;toSlot(D,u)}else if(u.rs!=null&&u.hp<U.hp){u.hp=Math.min(U.hp,u.hp+U.hp*.035*dt);if(D===ME&&Math.random()<dt*.8)floats.push({x:u.x,z:u.z,t:.3,txt:'+',heal:1})}}
    const own=allied(u.from,D.seat),dh=Math.hypot(u.x-home.x,u.z-home.z),atBase=u.cmd?u.s>=u.end&&dh<62:dh<62||u.s>=u.end,step=U.sp*dt*(air?1:drag(u,dt));
    u.scan=(u.scan||0)-dt;
    if(air&&u.lock!=null){const tr=unitById(u.lock);
      if(!tr||tr.hp<=0||tr.done||tr.ret||tr.fall!=null||allied(tr.from,u.from)){u.lock=null;if(!relock(u,D))standHere(u)}
      else{const d=Math.hypot(tr.x-u.x,tr.z-u.z);if(d>1.5){const k=Math.min(d,step);u.x+=(tr.x-u.x)/d*k;u.z+=(tr.z-u.z)/d*k;u.moving=true}else u.moving=false;u.atk=d<4;u.cdM=2;
        if(d<4&&u.bomb<=0){u.bomb=2;if(!tr.remote){tr.hp-=BLD.balon*(naval(tr.type)?1.5:1);if(u.from===D.seat)tr.byHome=true;else tr.fk=true}boom(tr.x,naval(tr.type)?2:2.5,tr.z,3,'#ff9a30');explode(tr.x,tr.z,1.2);if(naval(tr.type))splash(tr.x,tr.z,2.6);fxAt(D,tr.x,tr.z,'bomba')}
        continue}}
    if(u.foe&&u.foe.ref&&(u.foe.ref.hp<=0||u.foe.ref.done||u.foe.ref.ret)){const L=u.lock!=null;u.foe=null;u.lock=null;if(L&&!relock(u,D))standHere(u)}
    if(u.foe){
      const e=u.foe,ex=e.ref?e.ref.x:e.x,ez=e.ref?e.ref.z:e.z,d=Math.hypot(ex-u.x,ez-u.z),gun=u.type==='dalgic',gap=(u.type==='koc'?4:gun?11:2.4)+(e.nav?3.8:0);u.face=Math.atan2(ex-u.x,ez-u.z);
      if(d>gap){const k=Math.min(d-gap+.2,step*1.2),nx=u.x+(ex-u.x)/d*k,nz=u.z+(ez-u.z)/d*k;u.atk=false;
        if(canStand(u,nx,nz)){u.x=nx;u.z=nz;u.off=true;u.reS=false;u.stuck=0}
        else if((u.stuck=(u.stuck||0)+dt)>(u.lock!=null?12:3)){u.ign=e.id;u.ignT=now()+8000;if(u.lock!=null){standHere(u);if(D===ME&&u.from===ME.seat&&now()-(lockTipT||0)>4000){lockTipT=now();tip(TL('Askerlerin oraya yetişemiyor (su). Balon, gemi ya da füze gönder.','Your troops cannot reach it (water). Send balloons, a ship or a missile.'))}}u.foe=null;u.lock=null;u.stuck=0}
        u.moving=!!u.foe;continue}
      else{u.atk=true;u.cdM=gun?.45:1.2;if(u.cd<=0){u.cd=u.cdM;
        // the blow lands on the enemy; a fighter simulated on another screen is hurt there, so here we only trade blows as before
        const hit=U.dmg*(UV[u.type]||5);if(e.ref){const r=e.ref;r.hp-=hit;if(u.from===D.seat)r.byHome=true;else r.fk=true;if(!r.foe&&fighter(r.type)&&r.type!=='isci')r.foe={id:u.id,ref:u,x:u.x,z:u.z,from:u.from,type:u.type}}   // whoever is struck turns and fights back
        else u.hp-=UNITS[e.type].dmg*(UV[e.type]||5)*.5;
        if(gun)gunFx(D,u,ex,unitY(UNITS[e.type],ex,ez)+1.8,ez);else{sparks(u.x,u.z);fxAt(D,u.x,u.z,'vur')}}}
      u.moving=!u.atk;continue}
    if(u.scan<=0){u.scan=.4;u.tgt=null;
      if(!own){if(u.ftgt&&u.s>=u.end&&u.ftgt.hp>0&&D.towers.includes(u.ftgt))u.tgt=u.ftgt;
        else{let bd=atBase?75:u.cmd?(u.s>=u.end?24:10):15;const ax=u.aim&&u.s>=u.end?u.aim:null;
          for(const t of D.towers){if(t.type==='duvar')continue;const d=Math.hypot(t.x-u.x,t.z-u.z);if(d>=bd)continue;const k=ax?Math.hypot(t.x-ax.x,t.z-ax.z)*.8+d*.2:d;if(k<(u.tk??1e9)||!u.tgt){u.tk=k;u.tgt=t}}u.tk=null}}}
    if(u.tgt&&u.tgt.hp<=0)u.tgt=null;
    const fw=u.s<u.end-.5?pointOn(u.path,u.s+2.5):null;     // only a wall in the way counts, not one brushed in passing
    let wall=air||own?null:D.towers.find(o=>o.type==='duvar'&&!(o.bt>0)&&Math.max(Math.abs(o.x-u.x),Math.abs(o.z-u.z))<2.5&&(!fw||(o.x-u.x)*(fw.x-u.x)+(o.z-u.z)*(fw.z-u.z)>.55*Math.hypot(o.x-u.x,o.z-u.z)*Math.hypot(fw.x-u.x,fw.z-u.z)));
    if(wall&&(u.wtry||0)<2){u.wtry=(u.wtry||0)+1;if(wallWay(u,D))wall=null}     // a gap in the wall: walk through it, only break the wall when there is no way round
    if(wall){u.atk=true;u.cdM=1.2;u.face=Math.atan2(wall.x-u.x,wall.z-u.z);if(u.cd<=0){u.cd=1.2;wall.hp-=U.dmg*(BLD[u.type]||4);wall.shake=.25;sparks(wall.x,wall.z);fxAt(D,u.x,u.z,'vur');if(wall.hp<=0)removeTower(D,wall)}}
    else if(u.tgt&&u.type==='dalgic'&&Math.hypot(u.tgt.x-u.x,u.tgt.z-u.z)<12){   // divers open fire from range
      const t=u.tgt;u.atk=true;u.cdM=.45;u.face=Math.atan2(t.x-u.x,t.z-u.z);
      if(u.cd<=0){u.cd=.45;t.hp-=2.4;t.shake=.12;gunFx(D,u,t.x,heightAt(t.x,t.z)+2.5,t.z);if(t.hp<=0){explode(t.x,t.z,2);crater(t.x,t.z,3.6);removeTower(D,t);u.tgt=null}}}
    else if(u.tgt){               // surround the nearest defence and tear it down
      const t=u.tgt,a=u.id*2.399,r=u.type==='koc'?4.6:air?0:3,gx=t.x+Math.cos(a)*r,gz=t.z+Math.sin(a)*r,d=Math.hypot(gx-u.x,gz-u.z);
      if(d>.8){u.x+=(gx-u.x)/d*step;u.z+=(gz-u.z)/d*step;u.off=true;u.reS=false;u.face=Math.atan2(gx-u.x,gz-u.z)}
      else{u.atk=!air;u.cdM=1.2;u.face=Math.atan2(t.x-u.x,t.z-u.z);
       if(air?u.bomb<=0:u.cd<=0){
        if(air)u.bomb=2;else u.cd=1.2;
        t.hp-=air?BLD.balon:U.dmg*(BLD[u.type]||4);t.shake=.25;boom(t.x,air?3:2.5,t.z,air?3:1,air?'#ff9a30':'#ffb060');if(air)explode(t.x,t.z,1.2);else sparks(t.x,t.z);fxAt(D,t.x,t.z,air?'bomba':'vur');
        if(air)crater(t.x+(Math.random()-.5)*4,t.z+(Math.random()-.5)*4,3.2);
        if(t.hp<=0){explode(t.x,t.z,2);crater(t.x,t.z,3.6);removeTower(D,t);u.tgt=null}}}
    }else if(u.off){              // back onto the road, at the nearest point still ahead
      if(!u.reS){u.reS=true;let bs=u.s,bd=1e9;for(let s2=u.s;s2<=u.end;s2+=2){const q=pointOn(u.path,s2),d=Math.hypot(q.x-u.x,q.z-u.z);if(d<bd){bd=d;bs=s2}}u.s=bs}
      const p=pointOn(u.path,u.s),d=Math.hypot(p.x-u.x,p.z-u.z);
      if(d<1)u.off=false;else{u.x+=(p.x-u.x)/d*step;u.z+=(p.z-u.z)/d*step;u.face=Math.atan2(p.x-u.x,p.z-u.z)}
    }else if(u.s<u.end){u.s=Math.min(u.end,u.s+step);const p=pointOn(u.path,u.s),q=pointOn(u.path,u.s+1.2),l=Math.hypot(q.x-p.x,q.z-p.z)||1;
      u.lx=clamp(u.lx+u.vx*dt,-2.2,2.2);u.lz=clamp(u.lz+u.vz*dt,-2.2,2.2);
      const c=air?0:u.lane;let nx=p.x+(q.z-p.z)/l*c+u.lx,nz=p.z-(q.x-p.x)/l*c+u.lz;
      if(!air&&U.yol!=='deniz'&&nearDeck(nx,nz)&&!canStand(u,nx,nz)){u.lx*=.5;u.lz*=.5;nx=p.x;nz=p.z}     // a side-step that would leave the bridge or the bank keeps to the middle of the way
      u.x=nx;u.z=nz;u.face=null;u.road=true}
    else if(!own&&u.cmd&&u.siege&&dh>(air?7:16)){            // sent at the castle but not there yet: close in, never strike from afar
      if(air){u.x+=(home.x-u.x)/dh*step;u.z+=(home.z-u.z)/dh*step}
      else if(!u.rp){u.rp=1;const n=U.yol==='kara'?nav({x:u.x,z:u.z},home):[{x:u.x,z:u.z},home];if(n){u.path=polyPath(n);u.s=0;u.end=Math.max(0,u.path.len-(5.5+u.id%5))}else u.siege=false}
      else u.siege=false}
    else if(own||(u.cmd&&!u.siege&&dh>20)){u.atk=false}         // a held position: stand and wait for orders
    else if(air){if(u.bomb<=0){u.bomb=2;const x=home.x+(Math.random()-.5)*8,z=home.z+(Math.random()-.5)*8;boom(x,6,z,4,'#ff6a30');crater(x,z,4);fxAt(D,home.x,home.z,'bomba');damageCastle(D,U.dmg);if(D.dead)return}}
    else{const g=u.type==='dalgic';u.atk=true;u.cdM=g?.45:1.5;u.face=Math.atan2(home.x-u.x,home.z-u.z);if(u.cd<=0){u.cd=u.cdM;if(g)gunFx(D,u,home.x+(Math.random()-.5)*5,heightAt(home.x,home.z)+5+Math.random()*6,home.z+(Math.random()-.5)*5);else boom(u.x+Math.sin(u.face)*2.5,3,u.z+Math.cos(u.face)*2.5,.8,'#ffb060');damageCastle(D,g?.8:U.dmg);if(D.dead)return}}
    u.moving=!u.atk&&!(u.s>=u.end&&!u.tgt&&!u.off);
    if(!air&&!u.road&&(u.vx||u.vz)){const nx=u.x+u.vx*dt,nz=u.z+u.vz*dt;if(canStand(u,nx,nz)){u.x=nx;u.z=nz}}u.road=false;   // jostling never shoves anyone off a bridge
  }
  navalSep(D,dt);
  for(const t of D.towers){
    const T=TOWERS[t.type];if(T.duvar||(t.bt>0&&!t.up))continue;t.cd-=dt;if(t.cd>0)continue;
    const r=T.menzil+(t.lvl-1)*3;let best=null,bd=1e9;
    for(const u of D.units){
      if(u.hp<=0||u.ret||u.from===D.seat||u.fall!=null||u.emerge>0||u.dove!=null||allied(u.from,D.seat))continue;const Y=UNITS[u.type].yol;let rr=r;
      if(u.type==='gemi'){if(!T.gemi)continue;rr=shipR(t)}
      else if(Y==='ucak'?(!T.ucak||u.ph==='roll'):Y==='fuze'?!T.fuze:Y==='hava'?!T.hava:!T.yer)continue;
      const d=Math.hypot(u.x-t.x,u.z-t.z);if(d<rr&&d<bd){bd=d;best=u}}
    if(!best)continue;
    t.cd=1/T.hiz;const dmg=T.dmg*(1+.6*(t.lvl-1));
    if(T.gudumlu){homing(D,t.x,heightAt(t.x,t.z)+4.5,t.z,best,dmg);fxAt(D,t.x,t.z,'roket');continue}
    best.hp-=best.type==='fuze'?dmg*1.8:dmg;shot(t,best);fxAt(D,t.x,t.z,t.type==='top'?'top':t.type==='hava'?'flak':'okcu');
    if(T.alan){boom(best.x,2,best.z,T.alan*.5,'#ffd27a');for(const u of D.units){if(u===best||u.ret||flies(UNITS[u.type])||allied(u.from,D.seat))continue;const d=Math.hypot(u.x-best.x,u.z-best.z);if(d<T.alan)u.hp-=dmg*.45*(1-d/T.alan*.6)}}
  }
  D.kcd=(D.kcd||0)-dt;if(D.kcd<=0){let best=null,bd=KEEP.menzil;
    for(const u of D.units){if(u.hp<=0||u.ret||u.fall!=null||u.emerge>0||u.dove!=null||allied(u.from,D.seat))continue;const Y=UNITS[u.type].yol;if(Y==='deniz'||Y==='ucak'||Y==='fuze')continue;const d=Math.hypot(u.x-home.x,u.z-home.z);if(d<bd){bd=d;best=u}}
    if(best){D.kcd=1/KEEP.hiz;best.hp-=KEEP.dmg;tracer(home.x,heightAt(home.x,home.z)+15,home.z,best.x,unitY(UNITS[best.type],best.x,best.z)+1.2,best.z);fxAt(D,home.x,home.z,'okcu')}else D.kcd=.3}
  const left=[];
  for(const u of D.units){
    if(u.done)continue;
    if(u.fall!=null){left.push(u);continue}
    if(u.type==='isci'&&u.hp<=0){sparks(u.x,u.z);boom(u.x,1,u.z,.8,'#d0d0d0');const t=D.towers.find(o=>o.id===u.site);if(t&&t.bt>0){t.bt+=3;t.BT=Math.max(t.BT,t.bt)}if(D===ME)tip(TL('Bir işçin öldü, yapım uzadı','A worker died, building takes longer'));continue}
    if(u.hp<=0&&u.fk&&!u.byHome&&u.type!=='balon'){sparks(u.x,u.z);continue}     // fell in a fight between attackers: no bounty
    if(u.hp<=0){const bty=!allied(u.from,D.seat);if(bty)D.money+=UNITS[u.type].odul;boom(u.x,u.type==='balon'?20:2,u.z,1.5,'#d0d0d0');if(D===ME&&bty){floats.push({x:u.x,z:u.z,t:0,txt:'+'+UNITS[u.type].odul});SES.para()}
      if(u.type==='balon'||u.type==='ucak'||u.type==='gemi'){u.fall=0;u.y=u.type==='ucak'?u.alt:20;u.y0=u.y;if(u.type!=='balon')explode(u.x,u.z,2);left.push(u)}
      continue}
    left.push(u)}
  D.units=left;
}
// the bomber: rolls down its runway (crushing anyone in the way), climbs, carpets the target base, flies home and lands
function crush(u){
  const O=P[u.from];if(!O)return;
  if(local(O)){for(const o of O.units)if(fighter(o.type)&&!o.ret&&o.hp>0&&!allied(o.from,u.from)&&Math.hypot(o.x-u.x,o.z-u.z)<4.4){o.hp=0;o.fk=true;sparks(o.x,o.z)}}
  else{u.ezT=(u.ezT||0)-.05;if(u.ezT<=0){u.ezT=.2;say('ez',{to:u.from,x:Math.round(u.x),z:Math.round(u.z)})}}
}
function planeTick(D,u,dt,home){
  const U=UNITS.ucak,rw=RWY[u.from];u.t2=(u.t2||0)+dt;
  const steer=(tx,tz,rate)=>{let d=Math.atan2(tx-u.x,tz-u.z)-u.hd;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;u.hd+=clamp(d,-1,1)*rate*dt},fwd=sp=>{u.x+=Math.sin(u.hd)*sp*dt;u.z+=Math.cos(u.hd)*sp*dt};
  if(u.ph==='park'){u.alt=heightAt(u.x,u.z)+1.3;u.moving=false;return}
  const drop=()=>{u.dropT-=dt;if(u.dropT>0||u.nb>=10)return;u.dropT=.3;u.nb++;const from=u.from;
    shell(D,u.x,u.alt-1.2,u.z,u.x+Math.sin(u.hd)*12,u.z+Math.cos(u.hd)*12,1.45,0,'bomb',(x,z)=>{explode(x,z,2.6);crater(x,z,4.4);fxAt(D,x,z,'bomba');blast(D,x,z,8,150,45,from,75);if(D.seat!==from)for(const t of D.towers.slice())if(t.type==='duvar'&&Math.hypot(t.x-x,t.z-z)<7){explode(t.x,t.z,1.6);removeTower(D,t)}})};     // heavy bombs: walls under them go down outright
  const over=()=>seatAt(u.x,u.z)===D.seat&&(Math.hypot(u.x-home.x,u.z-home.z)<46||D.towers.some(t=>t.type!=='duvar'&&Math.hypot(t.x-u.x,t.z-u.z)<9));
  if(u.ph==='roll'){const dx=rw.b.x-rw.a.x,dz=rw.b.z-rw.a.z,l=Math.hypot(dx,dz);u.spd=Math.min(U.sp,u.spd+dt*8);u.x+=dx/l*u.spd*dt;u.z+=dz/l*u.spd*dt;
    const gone=Math.hypot(u.x-rw.a.x,u.z-rw.a.z);u.alt=heightAt(u.x,u.z)+1.3+Math.max(0,gone-l*.65)*.5;crush(u);if(gone>=l){u.ph='fly';fxAt(D,u.x,u.z,'roket')}return}
  if(u.ph!=='land')u.alt=Math.min(28,u.alt+dt*5);
  if(u.ph==='fly'&&u.via&&(u.wi||0)<u.via.length){const wi=u.wi||0,w=u.via[wi];steer(w.x,w.z,1.1);fwd(U.sp);
    // a waypoint inside the turning circle would have the bomber circling it for ever: once it is behind, take the next one
    const dx=w.x-u.x,dz=w.z-u.z,d=Math.hypot(dx,dz)||1,ahead=(dx*Math.sin(u.hd)+dz*Math.cos(u.hd))/d;if(d<14||(d<70&&ahead<-.2))u.wi=wi+1;
    if(wi===1){const a=u.via[0],b=u.via[1],l2=(b.x-a.x)**2+(b.z-a.z)**2,t=((u.x-a.x)*(b.x-a.x)+(u.z-a.z)*(b.z-a.z))/l2;if(t>.26&&seatAt(u.x,u.z)===D.seat)drop()}
    if(u.wi>=u.via.length||u.t2>110)u.ph='home';return}
  if(u.ph==='fly'){steer(home.x,home.z,.9);fwd(U.sp);if(Math.hypot(u.x-home.x,u.z-home.z)<46&&seatAt(u.x,u.z)===D.seat){u.ph='bomb';u.dropT=0}return}
  if(u.ph==='bomb'){fwd(U.sp);drop();
    if(u.nb>=10||Math.hypot(u.x-home.x,u.z-home.z)>54)u.ph='home';return}
  const c=rw?rw.c:castlePos(u.from);
  if(u.ph==='home'){steer(c.x,c.z,.8);fwd(U.sp);if(Math.hypot(u.x-c.x,u.z-c.z)<70)u.ph='land';if(u.t2>140)u.done=true;return}
  const gy=Math.max(heightAt(u.x,u.z),0)+1.3;steer(c.x,c.z,1.3);fwd(U.sp*.7);u.alt=Math.max(gy,u.alt-dt*6);
  if(u.alt<=gy+.05&&Math.hypot(u.x-c.x,u.z-c.z)<34){u.done=true;refund(u.from,Math.round(U.cost/2))}else if(u.t2>160)u.done=true;
}
// shells, bombs and guided rockets
const SHELLS=[];
function shell(D,x0,y0,z0,x1,z1,dur,arc,kind,onHit){SHELLS.push({D,x0,y0,z0,x1,z1,t:0,dur,arc,kind,onHit})}
function homing(D,x,y,z,tgt,dmg){SHELLS.push({D,kind:'roket',x,y,z,tgt,dmg,vx:0,vy:26,vz:0,t:0})}
// a missile's arc: lower on short hops, so it never shoots up past a close-in camera
const fuzeH=u=>Math.min(62,12+u.path.len*.22),fuzeY=u=>6+((u.ey||6)-6)*(u.t||0)+Math.sin((u.t||0)*Math.PI)*fuzeH(u);
const airY=o=>o.type==='balon'?(o.fall!=null&&o.y!=null?o.y:20):o.type==='ucak'?(o.alt||28):unitY(UNITS[o.type],o.x,o.z)+1;
const altOf=u=>u.type==='ucak'?u.alt:u.type==='balon'?(u.fall!=null?u.y:20):u.type==='fuze'?fuzeY(u):unitY(UNITS[u.type],u.x,u.z)+1.5;
function simShells(dt){
  for(let i=SHELLS.length-1;i>=0;i--){const s=SHELLS[i];s.t+=dt;
    if(s.kind==='roket'){const u=s.tgt,alive=u&&u.hp>0&&s.D.units.includes(u);
      if(alive){const dx=u.x-s.x,dy=altOf(u)-s.y,dz=u.z-s.z,d=Math.hypot(dx,dy,dz)||1,k=Math.min(1,dt*5);s.vx=lerp(s.vx,dx/d*75,k);s.vy=lerp(s.vy,dy/d*75,k);s.vz=lerp(s.vz,dz/d*75,k);
        if(d<3.2){u.hp-=s.dmg;flame(s.x,s.y,s.z,6,.35);for(let j=0;j<3;j++)puff(s.x,s.y,s.z,2,2.4,.3,.5,.8);SHELLS.splice(i,1);continue}}
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;if(s.t>4||(!alive&&s.t>1.5)){flame(s.x,s.y,s.z,4,.3);SHELLS.splice(i,1)}continue}
    if(s.t>=s.dur){SHELLS.splice(i,1);s.onHit(s.x1,s.z1)}}
}
function botThink(D){
  if(D.dead||TUT)return;
  const road=ROAD[D.seat],aa=D.towers.filter(t=>t.type==='hava').length,gr=D.towers.filter(t=>t.type==='ok'||t.type==='top').length;
  const home=castlePos(D.seat),ships=D.units.filter(u=>u.type==='gemi'&&u.from!==D.seat&&!allied(u.from,D.seat)&&u.fall==null&&!u.done&&!u.ret&&Math.hypot(u.x-home.x,u.z-home.z)<150);
  D.lost=(D.lost||[]).filter(l=>D.t-l.t<120);
  // a spot where a tower was just knocked down, or right under an enemy warship's guns, is a poor place to build again
  const bad=(x,z)=>D.lost.some(l=>Math.hypot(l.x-x,l.z-z)<9)||ships.some(u=>Math.hypot(u.x-x,u.z-z)<45);
  const place=type=>{
    for(let i=0;i<30;i++){
      const p=road[Math.random()*60|0],a=Math.random()*6.28,r=5+Math.random()*7,x=Math.round(p.x+Math.cos(a)*r),z=Math.round(p.z+Math.sin(a)*r);
      if(i<24&&bad(x,z))continue;
      if(addTower(D,type,x,z))return true}
    return false};
  // a small guard waits on the muster field and meets raiders before they reach the walls
  if(D.t>50&&D.money>25&&popOf(D.seat)<POP_CAP&&D.units.filter(u=>u.rs!=null&&u.from===D.seat).length<(D.t>300?7:4)&&Math.random()<.2){const k=Math.random()<.35?'atli':'piyade';D.money-=UNITS[k].cost;muster(D,k);return}
  // a warship shelling the base: lock a missile on it, and send a ship of our own after it
  if(ships.length){const sh=ships.sort((a,b)=>a.hp-b.hp)[0];
    if(!(D.fcd>0)&&D.money>=UNITS.fuze.cost&&!D.units.some(m=>m.type==='fuze'&&m.lockT===sh.id)&&sendUnit(D,D.seat,'fuze',{at:[Math.round(sh.x),Math.round(sh.z)],lock:sh.id}))return;
    if(D.ysState===2&&!D.yard&&D.money>=UNITS.gemi.cost&&fleet(D.seat)<MAX_SHIPS&&!P[sh.from].dead&&sendUnit(D,sh.from,'gemi'))return;
    if(!D.ysState&&D.money>=YARD_COST&&D.t>60&&buildYard(D))return}
  if(D.airSeen>aa*2&&D.money>=35&&place('hava'))return;
  if(gr>=4&&!D.ysState&&D.t>100){if(buildYard(D))return;if(Math.random()<.75)return}       // save up for the shipyard, then the runway
  if(gr>=5&&D.ysState&&!D.rwState&&D.t>200){if(buildRunway(D))return;if(Math.random()<.6)return}
  const walls=D.towers.filter(t=>t.type==='duvar').length;
  if(walls<3&&D.money>=30&&Math.random()<.15){const p=road[30+Math.random()*40|0];if(addTower(D,'duvar',Math.round(p.x),Math.round(p.z)))return}
  if(gr<3+D.t/45&&D.money>=20&&place(gr>2&&Math.random()<.4&&D.money>=45?'top':'ok'))return;
  if(!D.rwState&&D.t>150&&D.money>RUNWAY_COST+60&&Math.random()<.06&&buildRunway(D))return;
  if(D.towers.filter(t=>t.type==='roket').length<1&&D.t>240&&D.money>90&&place('roket'))return;
  if(fountainDown&&now()-downAt>100000&&D.money>=PLAZA_COST+60&&Math.random()<.01){D.money-=PLAZA_COST;repairPlaza();return}
  if(DUEL&&D.money>=DBR_FIX+80&&Math.random()<.02){const i=DBR.findIndex(b=>b.down&&b.main!=null&&now()-b.downAt>60000);if(i>=0){D.money-=DBR_FIX;fixDuelBridge(i);return}}
  if(D.money<12||D.t<45||gr<3)return;      // build first, attack after the opening
  D.atk=(D.atk||0)-1;if(D.atk>0)return;D.atk=3+Math.random()*3|0;
  const foes=P.filter(p=>p.on&&!p.dead&&!allied(p.seat,D.seat));if(!foes.length)return;
  if(D.t>300&&Math.random()<.02&&!ALLY[D.seat].some(Boolean)){                 // bots gang up on whoever is far ahead
    const top=foes.slice().sort((a,b)=>b.towers.length-a.towers.length)[0],mate=foes.find(p=>p.bot&&p!==top&&!ALLY[p.seat].some(Boolean));
    if(mate&&top.towers.length>=D.towers.length*1.5)setAlly(D.seat,mate.seat,true)}
  const call=D.join&&D.join.until>D.t&&!P[D.join.to].dead?D.join.to:null;
  // pick a foe with a plan: keep on the one we are already hurting, else the weakest castle, sometimes anyone
  if(D.foc!=null&&(P[D.foc].dead||allied(D.foc,D.seat)||Math.random()<.08))D.foc=null;
  if(D.foc==null)D.foc=Math.random()<.6?foes.slice().sort((a,b)=>a.hp+a.towers.length*25-(b.hp+b.towers.length*25))[0].seat:foes[Math.random()*foes.length|0].seat;
  const to=call!=null&&!allied(call,D.seat)?call:D.foc;
  // save up for a real wave instead of trickling soldiers in one by one
  if(D.t>90&&D.money<Math.min(130,25+D.t/7)&&Math.random()<.65){D.atk=2;return}
  const T=P[to],tAir=T.towers.filter(t=>t.type==='hava'||t.type==='roket'||t.type==='ok').length,tGnd=T.towers.filter(t=>t.type==='ok'||t.type==='top').length,tWall=T.towers.filter(t=>t.type==='duvar').length;
  const W={piyade:3,atli:3,koc:tGnd>3||tWall>2?4:1,balon:tAir<3?5:tAir<6?2:.6,fuze:T.towers.length>4?2:.5,denizalti:2,gemi:2.5,ucak:3};
  const side=Math.random()<.5?-1:1,c0=castlePos(D.seat),c1=castlePos(to),mx=(c0.x+c1.x)/2,mz=(c0.z+c1.z)/2,dl=Math.hypot(c1.x-c0.x,c1.z-c0.z)||1,off=side*(25+Math.random()*55),bv=[[Math.round(mx-(c1.z-c0.z)/dl*off),Math.round(mz+(c1.x-c0.x)/dl*off)]];
  const big=T.towers.filter(t=>t.type==='top'||t.type==='roket'||t.type==='hava').sort((a,b)=>TOWERS[b.type].cost-TOWERS[a.type].cost);
  let n=1+Math.min(4,D.t/100)*Math.random()|0;if(D.money>100)n+=2;
  while(n-->0){const opts=BUY.filter(k=>UNITS[k].cost<=D.money-5&&(k!=='fuze'||D.t>150)&&((k!=='denizalti'&&k!=='gemi')||(D.t>120&&!D.yard&&D.ysState===2&&(k!=='gemi'||fleet(D.seat)<MAX_SHIPS)))&&(k!=='ucak'||(D.rwState===2&&!D.hg))&&(k!=='fuze'||!(D.fcd>0))&&(!POP[k]||popOf(D.seat)+POP[k]<=POP_CAP));if(!opts.length)break;let sum=0;for(const k of opts)sum+=W[k]||1;let r=Math.random()*sum,k=opts[0];for(const q of opts){r-=W[q]||1;if(r<=0){k=q;break}}const ts=T.towers;
    sendUnit(D,to,k,k==='fuze'&&ts.length?(t=>({at:[t.x,t.z]}))(big.length&&Math.random()<.7?big[0]:ts[Math.random()*ts.length|0]):k==='ucak'?{lane:Math.random()*LANES|0}:k==='balon'?{via:bv}:undefined)}
}
let botAcc=0;
function sim(dt){
  if(TUT)tutTick(dt);
  simShells(dt);
  for(const D of P){if(!local(D)||D.dead)continue;
    if(D.fcd>0)D.fcd-=dt;
    if(D.hg){D.hg.t-=dt;if(D.hg.t<=0){const q=D.hg;D.hg=null;let to=q.to;if(!P[to]||P[to].dead||allied(D.seat,to)){const f=P.filter(p=>p.on&&!p.dead&&!allied(p.seat,D.seat));to=f.length?f[Math.random()*f.length|0].seat:null}
      if(to==null||!sendUnit(D,to,'ucak',{built:true,lane:q.lane}))D.money+=UNITS.ucak.cost;else if(D===ME)tip(EN?`Bomber took off for ${P[to].name}: run ${q.lane+1}`:`Uçak kalktı: ${P[to].name}, ${q.lane+1}. hattı bombalayacak`)}}
    if(D===ME)trainTick(dt);
    if(D.ysState===1){D.ysT-=dt;if(D.ysT<=0){D.ysState=2;markBuilt(D);if(D===ME)tip(TL('Tersane hazır! Artık gemi ve denizaltı yapabilirsin.','Shipyard ready! You can build ships and submarines now.'))}}
    if(D.rwState===1){D.rwT-=dt;if(D.rwT<=0){D.rwState=2;markBuilt(D);if(D===ME)tip(TL('Pist hazır! Artık uçak gönderebilirsin.','Runway ready! You can send planes now.'))}}
    if(!D.yard)continue;const q=D.yard;q.t-=dt;if(q.t>0)continue;D.yard=null;
    let to=q.to;if(!P[to]||P[to].dead||allied(D.seat,to)){const f=P.filter(p=>p.on&&!p.dead&&!allied(p.seat,D.seat));to=f.length?f[Math.random()*f.length|0].seat:null}
    if(D===ME&&q.type==='gemi'){parkShip(D,'gemi');tip(TL('Gemi hazır, limanda bekliyor! Gemiye dokun, sonra gideceği yolu çiz.','Warship ready at the dock! Tap it, then draw where it should go.'));continue}
    if(to==null||!sendUnit(D,to,q.type,{built:true}))D.money+=UNITS[q.type].cost;else if(D===ME)tip((EN?`${UNITS[q.type].kisa||UNITS[q.type].ad} launched, heading for ${P[to].name}`:`${UNITS[q.type].kisa||UNITS[q.type].ad} denize indi, ${P[to].name} üstüne gidiyor`))}
  for(const D of P)if(local(D))simDefender(D,dt);
  botAcc+=dt;if(botAcc>=1){botAcc=0;for(const D of P)if(D.bot)botThink(D)}
}

// ---------- network ----------
let net=null,lastBuilt='';
const say=(event,payload)=>{if(net&&!P.every(p=>!p.on||p===ME||p.bot))net.send({type:'broadcast',event,payload})};
function markBuilt(D){D.dirty=true}
function snapshot(){
  if(ME.dead)return;
  const s={s:A.seat,h:Math.round(ME.hp),rw:ME.rwState||0,ys:ME.ysState||0,yd:ME.yard?[UKEYS.indexOf(ME.yard.type),Math.round((1-ME.yard.t/ME.yard.T)*100)]:0,u:ME.units.filter(u=>u.type!=='isci'||u.hp>0).slice(0,90).map(u=>[u.id,UKEYS.indexOf(u.type),u.x|0,u.z|0,Math.ceil(u.hp/UNITS[u.type].hp*10),u.from,(u.atk?1:0)|(u.fall!=null?2:0)|(u.moving===false?4:0)])};
  if(ME.dirty||Date.now()%5000<500){ME.dirty=false;s.t=ME.towers.map(t=>[t.id,TKEYS.indexOf(t.type),t.x,t.z,t.lvl,t.bt>0&&!t.up?Math.round((1-t.bt/t.BT)*100):100])}
  say('snap',s);
}
function onSnap(m){
  if(!m)return;const R=P[num(m.s,-1)];if(!R||R===ME||R.bot||!R.on)return;
  R.seen=performance.now();R.hp=clamp(num(m.h,R.hp),0,CASTLE_HP);R.rwState=clamp(num(m.rw),0,2);R.ysState=clamp(num(m.ys),0,2);
  {const y=Array.isArray(m.yd)&&UKEYS[m.yd[0]]?{type:UKEYS[m.yd[0]],f:clamp(num(m.yd[1])/100,0,1)}:null;R.yardV=y}
  if(Array.isArray(m.u)){const seen=new Set();for(const a of m.u.slice(0,90)){if(!Array.isArray(a)||!UKEYS[a[1]])continue;seen.add(a[0]);const o=R.remote.get(a[0]),fl=num(a[6]);if(o){o.tx=num(a[2]);o.tz=num(a[3]);o.pct=num(a[4],10)/10;o.fl=fl}else R.remote.set(a[0],{type:UKEYS[a[1]],x:num(a[2]),z:num(a[3]),tx:num(a[2]),tz:num(a[3]),pct:num(a[4],10)/10,from:clamp(num(a[5],R.seat),0,3),fl,sd:Math.random(),ft:0})}
    for(const k of R.remote.keys())if(!seen.has(k))R.remote.delete(k)}
  if(Array.isArray(m.t)){
    const keep=new Set();
    for(const a of m.t.slice(0,MAX_TOWERS)){
      if(!Array.isArray(a)||!TKEYS[a[1]])continue;const id=num(a[0]);keep.add(id);
      let t=R.towers.find(o=>o.id===id);const lvl=clamp(num(a[4],1),1,3);
      if(t&&t.lvl!==lvl){dropModel(t.mesh);R.towers=R.towers.filter(o=>o!==t);t=null}
      if(!t){t={id,type:TKEYS[a[1]],x:clamp(num(a[2]),-L,L),z:clamp(num(a[3]),-L,L),lvl,hp:100,cd:0,owner:R.seat};R.towers.push(t);makeTowerModel(t)}
      {const pr=clamp(num(a[5],100),0,100)/100,sy=pr>=1?1:.12+.88*pr;if(t.mesh&&t.mesh.sy!==sy){t.mesh.sy=sy;t.mesh.tpl.dirty=true}}}
    for(const t of R.towers.slice())if(!keep.has(t.id)){dropModel(t.mesh);R.towers=R.towers.filter(o=>o!==t)}}
}
function connect(){
  if(P.every(p=>!p.on||p===ME||p.bot))return;
  net=A.sb.channel('mac-'+A.room,{config:{broadcast:{self:false},presence:{key:A.id}}});
  net.on('broadcast',{event:'snap'},({payload})=>onSnap(payload))
     .on('broadcast',{event:'send'},({payload})=>{const m=payload||{};if(m.to===A.seat&&!ME.dead&&UNITS[m.type]&&P[m.from])spawn(ME,m.type,m.from,m.o)})
     .on('broadcast',{event:'cmd'},({payload})=>{const m=payload||{};if(m.to===A.seat&&Array.isArray(m.ids))applyCmd(ME,m.ids.slice(0,90).map(v=>num(v)),Array.isArray(m.p)?m.p.slice(0,40).map(toPt).filter(Boolean):null,clamp(num(m.by),0,3),!!m.r,typeof m.k==='number'?m.k:null,typeof m.ks==='number'?clamp(m.ks,0,3):null)})
     .on('broadcast',{event:'krater'},({payload})=>{if(Array.isArray(payload))crater(clamp(num(payload[0]),-L,L),clamp(num(payload[1]),-L,L),clamp(num(payload[2],3),1,8),true)})
     .on('broadcast',{event:'home'},({payload})=>{const m=payload||{};if(m.to===A.seat&&P[m.from])comeHome(ME,m.type,num(m.from),num(m.s),num(m.hp,1),m.x==null?null:num(m.x),num(m.z))})
     .on('broadcast',{event:'kopru'},({payload})=>{const m=payload||{};if(typeof m.id==='string'&&Array.isArray(m.a)&&Array.isArray(m.b))addBridge(m.id,toPt(m.a),toPt(m.b),clamp(num(m.o),0,3),true)})
     .on('broadcast',{event:'kopruyik'},({payload})=>{const b=bridges.find(o=>o.id===(payload&&payload.id));if(b)breakBridge(b,true)})
     .on('broadcast',{event:'chat'},({payload})=>onChat(payload))
     .on('broadcast',{event:'yenimac'},({payload})=>onNewMatch(payload))
     .on('broadcast',{event:'cesme'},()=>breakFountain(true))
     .on('broadcast',{event:'dkopru'},({payload})=>breakDuelBridge(clamp(num(payload&&payload.i,-1),-1,3),true))
     .on('broadcast',{event:'dkopruonar'},({payload})=>fixDuelBridge(clamp(num(payload&&payload.i,-1),-1,3),true))
     .on('broadcast',{event:'onar'},()=>repairPlaza(true))
     .on('broadcast',{event:'iade'},({payload})=>{const m=payload||{};if(m.to===A.seat&&!ME.dead){ME.money+=clamp(num(m.m),0,100);SES.para()}})
     .on('broadcast',{event:'ez'},({payload})=>{const m=payload||{};if(m.to!==A.seat)return;const x=num(m.x),z=num(m.z);for(const o of ME.units)if(fighter(o.type)&&!o.ret&&Math.hypot(o.x-x,o.z-z)<4.6){o.hp=0;o.fk=true;sparks(o.x,o.z)}})
     .on('broadcast',{event:'ittifak'},({payload})=>{const m=payload||{};if(m.to===A.seat&&P[m.from])askAlly(m.from)})
     .on('broadcast',{event:'ittifakset'},({payload})=>{const m=payload||{};if(P[m.a]&&P[m.b])setAlly(m.a,m.b,!!m.on,true)})
     .on('broadcast',{event:'ortak'},({payload})=>{const m=payload||{};if(m.a===A.seat&&P[m.to]&&P[m.from]){setTarget(m.to);tip((EN?`${P[m.from].name} asks for a joint attack on ${P[m.to].name}`:`${P[m.from].name} ortak saldırı istiyor: ${P[m.to].name}`))}})
     .on('broadcast',{event:'dead'},({payload})=>{const R=P[num(payload&&payload.s,-1)];if(R&&R!==ME&&!R.dead)eliminate(R)})
     .subscribe(s=>{if(s==='SUBSCRIBED')net.track({seat:A.seat})});
}

// ---------- scene ----------
const cv=$("game"),ov=$('ov'),oc=ov.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
// picture settings: High (default), Balanced, or Battery saver, remembered on this device
const GFX={yuksek:{dpr:[1.45,2],sh:true,cap:12},dengeli:{dpr:[1.15,1.5],sh:true,cap:12},pil:{dpr:[1,1.15],sh:false,cap:31}},SMALL=Math.min(innerWidth,innerHeight)<700;
let gfxMode='yuksek';try{const g=localStorage.getItem('cephe_gfx');if(GFX[g])gfxMode=g}catch(e){}
let DPR=Math.min(GFX[gfxMode].dpr[SMALL?0:1],devicePixelRatio||1),DPR0=DPR,frameCap=GFX[gfxMode].cap;renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();const SKY=new THREE.Color('#9fc9e4');scene.background=SKY;scene.fog=new THREE.Fog(SKY,430,1250);
const camera=new THREE.PerspectiveCamera(62,1,1,2500);
scene.add(new THREE.HemisphereLight('#dff1ff','#6a5a48',1.02));
const sun=new THREE.DirectionalLight('#fff0d8',3);sun.position.set(-175,185,125);sun.castShadow=true;
const small=Math.min(innerWidth,innerHeight)<700;
{const lowMem=(navigator.deviceMemory||8)<=4,S0=small?(lowMem?1536:2048):3072;sun.shadow.mapSize.set(S0,S0)}scene.add(sun.target);const SUN_DIR=new THREE.Vector3(-175,185,125).normalize();
Object.assign(sun.shadow.camera,{left:-240,right:240,top:240,bottom:-240,near:10,far:680});sun.shadow.radius=2.5;sun.shadow.bias=-.0004;sun.shadow.normalBias=.18;scene.add(sun);

function paintGround(){
  THREE.ColorManagement.enabled=false;      // the canvas wants plain sRGB values
  const SZ_=small?2048:4096,LO=small?720:1100,W=L*2+16,cv2=document.createElement('canvas');cv2.width=cv2.height=SZ_;const g=cv2.getContext('2d');
  const lo=document.createElement('canvas');lo.width=lo.height=LO;const lg=lo.getContext('2d'),id=lg.createImageData(LO,LO),a=new THREE.Color(),b=new THREE.Color(),c=new THREE.Color(),sand=new THREE.Color('#dcca96');
  for(let y=0;y<LO;y++)for(let x=0;x<LO;x++){
    const X=(x+.5)/LO*W-W/2,Z=(y+.5)/LO*W-W/2,isle=onIsle(X,Z),s=biomeAt(X,Z),B=BIOME[s];a.set(B.a);b.set(B.b);
    const n=fbm(NOISE[s],X*.05+50,Z*.05+50),m=NOISE[s](X*.3+9,Z*.3+3);c.copy(a).lerp(b,clamp(n*1.7-.35+m*.25,0,1));
    const h=heightAt(X,Z),k=1+clamp(h*.035,-.1,.14);c.multiplyScalar(k);
    const sh=shoreOf(X,Z);if(!isle&&sh<WL+8)c.lerp(sand,1-smooth(WL+2,WL+8,sh));if(!isle&&sh<WL+1.5)c.multiplyScalar(lerp(.66,1,smooth(WL-.5,WL+1.5,sh)));
    if(isle)c.set('#8c7a5e');
    const o=(x+y*LO)*4;id.data[o]=c.r*255;id.data[o+1]=c.g*255;id.data[o+2]=c.b*255;id.data[o+3]=255}
  lg.putImageData(id,0,0);
  // colours above are linear, so bring them to sRGB space for the canvas
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.filter='none';g.drawImage(lo,0,0,SZ_,SZ_);
  const S=SZ_/W,px=v=>(v+W/2)*S,rnd=(()=>{let d=4711;return()=>(d=(d*16807)%2147483647)/2147483647})();
  const spots=small?26000:80000;
  const paint=[
    ['#3f7a30','#6fa346','#a6c766','#2f6226'],
    ['#b48a4c','#ecd28f','#c9a464','#9d7740'],
    ['#ffffff','#c7d6e2','#9db4c7','#eef5fa'],
    ['#2a2120','#5f3d30','#8d4a30','#1d1716']];
  for(let i=0;i<spots;i++){
    const X=(rnd()-.5)*W,Z=(rnd()-.5)*W,sh=shoreOf(X,Z);if(sh<WL+2||onIsle(X,Z))continue;
    const s=biomeAt(X,Z),p=paint[s];g.fillStyle=p[rnd()*4|0];g.globalAlpha=.08+rnd()*.16;
    const l=(s===0?1.4:s===1?3.5:2)*(1+rnd()*2.4);
    if(s===0){g.fillRect(px(X),px(Z),1.1+rnd()*.8,l*1.6)}else if(s===1){g.fillRect(px(X),px(Z),l*2.2,1)}else{g.beginPath();g.arc(px(X),px(Z),l*.6,0,6.3);g.fill()}}
  g.globalAlpha=1;
  for(let i=0;i<(small?900:2600);i++){       // meadow flowers and pebbles, lava cracks glow
    const X=(rnd()-.5)*W,Z=(rnd()-.5)*W;if(shoreOf(X,Z)<WL+3||roadDist(X,Z)<4)continue;const s=biomeAt(X,Z);
    g.fillStyle=s===0?['#f5e38c','#f1a7c0','#fff','#c9b4f4'][rnd()*4|0]:s===1?'#8d6b3a':s===2?'#8ea6ba':'#ff7a2c';g.globalAlpha=s===3?.55:.8;
    g.beginPath();g.arc(px(X),px(Z),(s===3?1.4:1.6)*(1+rnd()),0,6.3);g.fill()}
  g.globalAlpha=1;g.lineCap='round';g.lineJoin='round';
  const stroke=(col,w,dash)=>{g.strokeStyle=col;g.lineWidth=w*S;g.setLineDash(dash?dash.map(v=>v*S):[]);
    for(const r of ROAD){g.beginPath();r.forEach((p,i)=>i?g.lineTo(px(p.x),px(p.z)):g.moveTo(px(p.x),px(p.z)));g.stroke()}};
  stroke('rgba(60,45,28,.5)',6.4);stroke('#8a7350',5.2);stroke('#a48c66',3.9);stroke('rgba(90,70,45,.42)',.5,[2.4,1.5]);
  g.setLineDash([]);
  for(let i=0;i<(small?2600:9000);i++){const r=ROAD[rnd()*ROAD.length|0],p=r[rnd()*r.length|0],X=p.x+(rnd()-.5)*5,Z=p.z+(rnd()-.5)*5;g.fillStyle=['#7b6848','#b7a07a','#66543a'][rnd()*3|0];g.globalAlpha=.55;g.fillRect(px(X),px(Z),1.5+rnd()*2.5,1.2+rnd()*2)}
  g.globalAlpha=1;THREE.ColorManagement.enabled=true;return cv2;
}
function detailTile(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),id=g.createImageData(256,256);let d=99;const r=()=>(d=(d*16807)%2147483647)/2147483647;
  for(let i=0;i<256*256;i++){const v=118+r()*20+(r()<.08?(r()-.5)*90:0);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255}
  g.putImageData(id,0,0);g.globalCompositeOperation='overlay';g.filter='blur(1px)';g.drawImage(c,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
function buildGround(){
  const N=small?340:600,geo=new THREE.PlaneGeometry(L*2+16,L*2+16,N,N);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,heightAt(p.getX(i),p.getZ(i)));geo.computeVertexNormals();geo.setAttribute('aDark',new THREE.BufferAttribute(new Float32Array(p.count),1));
  const c=paintGround(),map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const mat=new THREE.MeshStandardMaterial({map,roughness:.95,metalness:0,bumpMap:map,bumpScale:small?.5:.9}),dtl=detailTile();
  mat.onBeforeCompile=sh=>{sh.uniforms.dtl={value:dtl};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aDark;varying float vDark;').replace('#include <begin_vertex>','#include <begin_vertex>\nvDark=aDark;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D dtl;varying float vDark;')
      .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=texture2D(dtl,vMapUv*38.).r*1.08+texture2D(dtl,vMapUv*170.).r*1.08;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.2,.16,.13)+vec3(.05,.035,.02),vDark);');};
  const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;scene.add(m);GM={geo,N,W:L*2+16};
}
let waterM=null;
const waterU={pr:{value:DUEL?-1:12.5},t:{value:0},fogC:{value:SKY},sun:{value:new THREE.Vector3(-175,185,125).normalize()}};
// distance to the shore, baked: the sea's edge is too uneven to write as a formula in the shader
// one random value per texel; read with a smoothed coordinate it gives the same soft value noise as hashing, at a fraction of the cost
function noiseTex(){const N=256,d=new Uint8Array(N*N*4);let r=12345;for(let i=0;i<N*N;i++){r=(r*1103515245+12345)>>>0;d[i*4]=r>>>24;d[i*4+3]=255}const t=new THREE.DataTexture(d,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;return t}
function bankTex(){
  const n=small?512:1024,d=new Uint16Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)d[i+j*n]=THREE.DataUtils.toHalfFloat(WL-shoreOf((i+.5)/n*SEA*2-SEA,(j+.5)/n*SEA*2-SEA));
  const t=new THREE.DataTexture(d,n,n,THREE.RedFormat,THREE.HalfFloatType);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
function buildOuter(){                 // one seamless sheet from the sea floor out to the mountains, finest near the middle
  const N=small?300:420,E=1150,geo=new THREE.PlaneGeometry(2,2,N,N).rotateX(-Math.PI/2),p=geo.attributes.position,uv=geo.attributes.uv,sa=new Float32Array(p.count),se=new Float32Array(p.count);
  const warp=u=>Math.sign(u)*E*Math.pow(Math.abs(u),1.6);
  for(let i=0;i<p.count;i++){const x=warp(p.getX(i)),z=warp(p.getZ(i)),d=outerD(x,z);p.setXYZ(i,x,landH(x,z),z);uv.setXY(i,x/34,z/34);sa[i]=1-smooth(4,14,d);se[i]=d<0?1:0}
  geo.setAttribute('aSand',new THREE.BufferAttribute(sa,1));geo.setAttribute('aSea',new THREE.BufferAttribute(se,1));geo.computeVertexNormals();geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,terrainMat());m.position.y=-.02;m.receiveShadow=true;scene.add(m);
}
function buildWater(){
  waterU.bk={value:bankTex()};waterU.nz={value:noiseTex()};
  const m=new THREE.Mesh(new THREE.PlaneGeometry(SEA*2,SEA*2).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:waterU,transparent:true,
    vertexShader:'varying vec3 w;void main(){vec4 v=modelMatrix*vec4(position,1.);w=v.xyz;gl_Position=projectionMatrix*viewMatrix*v;}',
    fragmentShader:`precision highp float;varying vec3 w;uniform float t;uniform vec3 fogC,sun;uniform sampler2D bk,nz;uniform float pr;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return texture2D(nz,(i+f+.5)/256.).r;}
      float wave(vec2 p){float a=0.,s=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){a+=s*n(p);p=r*p*2.03+vec2(t*.35,-t*.22);s*=.5;}return a;}
      float wave3(vec2 p){float a=0.,s=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<3;i++){a+=s*n(p);p=r*p*2.03+vec2(t*.35,-t*.22);s*=.5;}return a+.0625;}
      vec2 fdir(vec2 q){            // the rivers run outward; past the mouths the sea only drifts, so nothing swirls
        ${DUEL?'return vec2(.22,.14);':''}
        float ax=abs(q.x),az=abs(q.y),sf=smoothstep(95.,175.,max(ax,az));
        vec2 riv=mix(vec2(clamp(q.x/14.,-1.,1.),0.),vec2(0.,clamp(q.y/14.,-1.,1.)),smoothstep(-18.,18.,az-ax))*1.15;
        return mix(riv,vec2(.22,.14),sf);
      }
      void main(){
        float across=abs(w.x)<abs(w.z)?abs(w.x):abs(w.z),along=abs(w.x)<abs(w.z)?w.z:w.x;
        float bank=min(texture2D(bk,(w.xz+${SEA.toFixed(1)})/${(SEA*2).toFixed(1)}).r,pr>0.?length(w.xz)-pr:99.);float rv=${DUEL?'0.':'1.-smoothstep(14.,24.,across)'};
        if(bank<-1.5)discard;     // never show through a crater dug below the waterline
        vec2 fd=fdir(w.xz);float ph=fract(t*.09),ph2=fract(t*.09+.5),wb=abs(ph*2.-1.);
        vec2 pa=(w.xz-fd*ph*17.)*.42,pb=(w.xz-fd*ph2*17.)*.42+vec2(7.31,3.17);float e=.12;
        float c0=mix(wave(pa),wave(pb),wb);
        float c3=mix(wave3(pa),wave3(pb),wb);vec3 N=normalize(vec3(c3-mix(wave3(pa+vec2(e,0.)),wave3(pb+vec2(e,0.)),wb),e*2.2,c3-mix(wave3(pa+vec2(0.,e)),wave3(pb+vec2(0.,e)),wb)));
        vec3 V=normalize(cameraPosition-w);float fr=.03+.97*pow(1.-max(dot(N,V),0.),5.);
        vec3 sky=mix(vec3(.66,.8,.92),vec3(.26,.48,.76),clamp(reflect(-V,N).y,0.,1.));
        float depth=smoothstep(.1,8.,bank);
        vec3 body=mix(vec3(.2,.62,.6),vec3(.03,.32,.42),smoothstep(0.,3.5,bank));
        body=mix(body,vec3(.01,.11,.2),smoothstep(3.,10.,bank));body=mix(body,vec3(.008,.07,.16),smoothstep(14.,60.,bank));
        float cau=pow(n(w.xz*.9+t*.5+N.xz*2.)*n(w.xz*.7-t*.4),1.5)*1.8;body+=cau*vec3(.3,.36,.3)*(1.-depth);
        float st=n(vec2(across*1.3+N.x*2.,along*.1-t*.7*sign(along)))*n(vec2(across*.5,along*.22-t*.45*sign(along)));
        body+=vec3(.06,.11,.13)*smoothstep(.15,.6,st)*smoothstep(.5,3.,bank)*rv*(1.-smoothstep(95.,165.,max(abs(w.x),abs(w.z))));
        vec3 c=mix(body,sky,fr*.85);
        vec3 Hv=normalize(sun+V);float sp=pow(max(dot(N,Hv),0.),420.);
        c+=vec3(1.,.95,.82)*sp*1.25+vec3(1.)*smoothstep(.76,.86,n(w.xz*2.3+N.xz*7.+t*.6))*pow(max(dot(N,Hv),0.),60.)*.3;
        float wob=(n(w.xz*.55+t*.2)-.5)*1.3;
        float edge=smoothstep(.5,.0,bank-.15+wob*1.1+sin(t*.8+along*.2)*.14);
        float roll=smoothstep(.8,.98,sin(bank*2.3-t*1.25+wob*3.))*(1.-smoothstep(.3,3.6,bank))*smoothstep(.25,.6,n(w.xz*.8-t*.1)+.15);
        float fm=max(max(edge,roll),smoothstep(.72,.9,c0)*.14);
        c=mix(c,vec3(.93,.97,.96),fm*.85);
        float f=smoothstep(430.,1250.,length(w-cameraPosition));
        gl_FragColor=vec4(mix(c,fogC,f),max(mix(.42,.97,depth)*smoothstep(-.1,.8,bank),fm*.9));
        #include <colorspace_fragment>
      }`}));
  m.position.y=0;scene.add(m);waterM=m;
}
// rings that spread out behind anything moving through the water
const RIPPLES=[],ripM=new THREE.RingGeometry(.72,1,28).rotateX(-Math.PI/2);
for(let i=0;i<46;i++){const m=new THREE.Mesh(ripM,new THREE.MeshBasicMaterial({color:'#eefaff',transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);RIPPLES.push({m,t:1})}
let ripI=0;
function ripple(x,z,size){const r=RIPPLES[ripI];ripI=(ripI+1)%RIPPLES.length;r.t=0;r.s=size;r.m.visible=true;r.m.position.set(x+(Math.random()-.5)*.8,.06,z+(Math.random()-.5)*.8)}
function drawRipples(dt){for(const r of RIPPLES){if(r.t>=1)continue;r.t+=dt/1.3;r.m.scale.setScalar(.6+r.t*r.s);r.m.material.opacity=.55*(1-r.t);if(r.t>=1)r.m.visible=false}}
const FDENS=new THREE.DataTexture(new Float32Array(256*256),256,256,THREE.RedFormat,THREE.FloatType);FDENS.magFilter=FDENS.minFilter=THREE.LinearFilter;
// rolling hills beyond the far shore
const HILL=vnoise(55),RIDGE=vnoise(77);
// the land beyond the sea: a beach, rolling hills, then a ring of rocky mountains with snow on the peaks
function ridged(x,z){let a=0,s=.55,f=1,w=1;for(let i=0;i<4;i++){const n=1-Math.abs(RIDGE(x*f+i*17.3,z*f+i*9.1)*2-1);a+=n*n*s*w;w=clamp(n*1.4,0,1);s*=.5;f*=2.07}return a}
function landH(x,z){
  const d=outerD(x,z);if(d<0)return Math.max(-7,d*.6);
  const hill=Math.max(0,fbm(HILL,x*.006+7,z*.006+3)*34+fbm(HILL,x*.028+3,z*.028+9)*6-12);
  const bump=(fbm(HILL,x*.03+11,z*.03+5)-.5)*2.2*smooth(4,24,d);
  const mt=ridged(x*.0042+3.1,z*.0042+7.7)*260*smooth(130,430,d)+46*smooth(150,520,d);
  return Math.min(.9,d*.14)+hill*smooth(6,90,d)+bump+mt;
}
function outerH(x,z){const m=Math.max(Math.abs(x),Math.abs(z));return m<SEA-28?landH(x,z)-30:landH(x,z)}
let TERRM=null;
function terrainMat(){
  if(TERRM)return TERRM;
  const gt=grassTex(),m=new THREE.MeshStandardMaterial({map:gt,bumpMap:gt,bumpScale:.8,roughness:1});
  m.onBeforeCompile=sh=>{sh.uniforms.fd={value:FDENS};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aSand,aSea;varying vec3 vW,vWN;varying float vSand,vSea;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);vSand=aSand;vSea=aSea;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D fd;varying vec3 vW,vWN;varying float vSand,vSea;
float th(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float tn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(th(i),th(i+vec2(1,0)),f.x),mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x),f.y);}
float tf(vec2 p){return tn(p)*.55+tn(p*2.07+3.1)*.28+tn(p*4.3+7.7)*.17;}`)
      .replace('#include <map_fragment>',`#include <map_fragment>
{vec2 q=vW.xz;float n1=tf(q*.011),n2=tf(q*.07),n3=tn(q*.9),slope=1.-clamp(normalize(vWN).y,0.,1.),H=vW.y;
 vec3 gr=diffuseColor.rgb;float pa=texture2D(map,vMapUv*.073).g*.6+texture2D(map,vMapUv*.0171+.3).g*.8;gr*=.86+pa*.17;
 gr*=mix(vec3(.7,.84,.58),vec3(1.05,.95,.66),smoothstep(.3,.7,n1))*mix(1.,.82,smoothstep(.45,.8,n2));                        // lush and sun-dried meadows
 gr=mix(gr,gr*vec3(1.05,.92,.66),smoothstep(25.,90.,H)*.7);                                  // thinner, browner grass up high
 vec3 dirt=vec3(.17,.105,.055)*(.72+.5*n3)*(.82+.36*n2);
 float dm=clamp(smoothstep(.6,.78,n2*.65+n1*.45)+smoothstep(.2,.36,slope+(n3-.5)*.08),0.,1.);
 vec3 c=mix(gr,dirt,dm*.85);
 float str=tn(vec2(H*.45+n2*3.,(q.x+q.y)*.012));
 vec3 rock=mix(vec3(.13,.12,.11),vec3(.27,.25,.22),str)*(.8+.4*n3)*(.85+.3*n1);
 float rm=smoothstep(.34,.52,slope+(n2-.5)*.18)+smoothstep(95.,150.,H+n2*30.)*.75;
 c=mix(c,rock,clamp(rm,0.,1.));
 float sm=smoothstep(150.,190.,H+n2*35.)*(1.-smoothstep(.5,.75,slope));
 c=mix(c,vec3(.82,.85,.9)*(.9+.1*n3),sm);
 float dn=texture2D(fd,(vW.xz+1000.)/2000.).r;c*=mix(vec3(1.),vec3(.5,.52,.42),smoothstep(.05,.9,dn)*(1.-clamp(rm,0.,1.)));
 vec3 sand=vec3(.69,.57,.33)*(.9+.2*n3);c=mix(c,sand,vSand);c*=mix(1.,.6,vSea);
 diffuseColor.rgb=c;}`)};
  TERRM=m;return m;
}
const outerY=(x,z)=>landH(x,z);
const outerSlope=(x,z)=>{const a=landH(x+3,z)-landH(x-3,z),b=landH(x,z+3)-landH(x,z-3);return Math.hypot(a,b)/6};
const WIND={value:0};let TGC=null;
function treeGeos(){
  if(TGC)return TGC;
  const jig=(geo,amt,seed)=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=Math.sin(x*12.9898+y*78.233+z*37.719+seed)*43758.5453,r=(h-Math.floor(h))-.5;const l=Math.hypot(x,z)||1;p.setXYZ(i,x+x/l*r*amt,y+r*amt*.5,z+z/l*r*amt)}geo.computeVertexNormals();return geo};
  const merge=list=>{let n=0;const ng=list.map(g=>g.index?g.toNonIndexed():g);for(const g of ng)n+=g.attributes.position.count;const P3=new Float32Array(n*3),N3=new Float32Array(n*3),C3=new Float32Array(n*3),U2=new Float32Array(n*2);let o=0;
    for(const g of ng){const p=g.attributes.position,nm=g.attributes.normal,uv=g.attributes.uv;let lo=1e9,hi=-1e9;for(let i=0;i<p.count;i++){lo=Math.min(lo,p.getY(i));hi=Math.max(hi,p.getY(i))}
      for(let i=0;i<p.count;i++){P3.set([p.getX(i),p.getY(i),p.getZ(i)],(o+i)*3);N3.set([nm.getX(i),nm.getY(i),nm.getZ(i)],(o+i)*3);if(uv)U2.set([uv.getX(i)*3,uv.getY(i)*3],(o+i)*2);const k=.55+.55*(p.getY(i)-lo)/(hi-lo||1);C3.set([k,k,k],(o+i)*3)}o+=p.count}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P3,3));g.setAttribute('normal',new THREE.BufferAttribute(N3,3));g.setAttribute('color',new THREE.BufferAttribute(C3,3));g.setAttribute('uv',new THREE.BufferAttribute(U2,2));return g};
  const leafTex=needle=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#9a9a9a';g.fillRect(0,0,256,256);
    for(let i=0;i<(needle?2600:1500);i++){const x=Math.random()*256,y=Math.random()*256,v=110+Math.random()*145|0;g.fillStyle=`rgb(${v},${v},${v})`;
      if(needle){g.fillRect(x,y,1.2,5+Math.random()*9)}else{g.beginPath();g.ellipse(x,y,2+Math.random()*4,1.5+Math.random()*3,Math.random()*3,0,6.3);g.fill()}}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  const LT=[leafTex(0),leafTex(1)];
  const pine=merge([0,1,2,3,4,5].map(i=>jig(new THREE.ConeGeometry(3.6-i*.5,3.9-i*.22,12,2).translate(0,3.8+i*2.15,0),.6,i))),
        broad=merge([[0,8.2,0,2.9],[1.9,9.4,.6,2.2],[-1.7,9.6,-.8,2.1],[.4,10.9,-1.2,1.9],[-.6,7.4,1.5,1.9],[1.2,7.6,-1.4,1.7],[-1.5,8.6,1.2,1.6]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,2).translate(x,y,z),.6,i+9))),
        birch=merge([[0,10.5,0,2],[.9,12,.4,1.5],[-.7,12.4,-.3,1.4],[.2,13.4,.6,1.2]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,2).scale(1,1.35,1).translate(x,y,z),.45,i+20))),
        dead=merge([new THREE.CylinderGeometry(.18,.42,7,7).translate(0,3.5,0),new THREE.CylinderGeometry(.06,.14,2.8,5).rotateZ(.9).translate(1,5.2,0),new THREE.CylinderGeometry(.05,.12,2.2,5).rotateZ(-1).translate(-.85,4.4,.2),new THREE.CylinderGeometry(.05,.1,1.8,5).rotateX(.9).translate(0,6,.7)]);
  const mat=(c,needle)=>{const m=new THREE.MeshStandardMaterial({color:c,map:LT[needle?1:0],roughness:.9,vertexColors:true});
    m.onBeforeCompile=sh=>{sh.uniforms.uT=WIND;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*.05+instanceMatrix[3].z*.07;\n#else\nfloat ph=0.;\n#endif\nfloat sw=(sin(uT*1.4+ph)+.5*sin(uT*2.9+ph*1.7))*.012*position.y*position.y/12.;transformed.x+=sw;transformed.z+=sw*.6;')};return m};
  // far-off copies with a fraction of the triangles: a tree a few pixels tall looks the same either way
  const pineL=merge([0,1,2,3,4,5].map(i=>jig(new THREE.ConeGeometry(3.6-i*.5,3.9-i*.22,6,1).translate(0,3.8+i*2.15,0),.35,i))),
        broadL=merge([[0,8.2,0,2.9],[1.9,9.4,.6,2.2],[-1.7,9.6,-.8,2.1],[.4,10.9,-1.2,1.9],[-.6,7.4,1.5,1.9],[1.2,7.6,-1.4,1.7],[-1.5,8.6,1.2,1.6]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,0).translate(x,y,z),.35,i+9))),
        birchL=merge([[0,10.5,0,2],[.9,12,.4,1.5],[-.7,12.4,-.3,1.4],[.2,13.4,.6,1.2]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,0).scale(1,1.35,1).translate(x,y,z),.3,i+20)));
  // a bush: a few leafy lumps of different sizes, wider than tall, not one round ball
  const bush=merge([[0,.55,0,1.15],[.95,.42,.35,.85],[-.85,.4,-.25,.8],[.2,.38,-.95,.75],[-.3,.85,.55,.7]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,0).scale(1,.78,1).translate(x,y,z),.28,i+40)));
  TGC={pine,broad,birch,dead,mat,pineL,broadL,birchL,bush,trunk:new THREE.CylinderGeometry(.3,.55,5,7).translate(0,2.5,0),trunk2:new THREE.CylinderGeometry(.42,.75,7,7).translate(0,3.5,0)};return TGC;
}
function grassTex(){
  const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.fillStyle='#6fa24b';g.fillRect(0,0,1024,1024);
  const R=()=>Math.random(),cols=['#5c9a43','#6fa84e','#8fb95c','#4f8a3a','#7cae52','#5a8f3f','#9cbf62','#64953f'];
  for(let i=0;i<34000;i++){const x=R()*1024,y=R()*1024,l=7+R()*20,a=-1.57+(R()-.5)*1.1,col=cols[R()*8|0];g.strokeStyle=col;g.globalAlpha=.55+R()*.4;g.lineWidth=.8+R()*1.5;
    for(const[dx,dy]of[[0,0],[1024,0],[-1024,0],[0,1024],[0,-1024]]){if(x+dx<-30||x+dx>1054||y+dy<-30||y+dy>1054)continue;g.beginPath();g.moveTo(x+dx,y+dy);g.quadraticCurveTo(x+dx+Math.cos(a)*l*.5,y+dy+Math.sin(a)*l*.5,x+dx+Math.cos(a)*l+(R()-.5)*5,y+dy+Math.sin(a)*l);g.stroke()}}
  g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
const FTILES=[];
function forestLOD(){const cx=camera.position.x,cz=camera.position.z,R=REACH_T/2;for(const t of FTILES){const near=view.d<330&&Math.hypot(t.x-cx,t.z-cz)-R*1.4<190;if(t.near===near)continue;t.near=near;for(const m of t.hi)m.visible=near;for(const m of t.lo)m.visible=!near}}
const REACH_T=680*2/6;
function buildForest(){
  const gm=terrainMat(),F=SEA,E=1700;
  // (the land beyond the sea is part of buildOuter's sheet)
  if(0)for(const[x,z,w,d]of[[0,-(F+E/2),E*2+F*2,E],[0,F+E/2,E*2+F*2,E],[-(F+E/2),0,E,F*2],[F+E/2,0,E,F*2]]){const g=new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/34,uv.getY(i)*d/34);const m=new THREE.Mesh(g,gm);m.position.set(x,.9,z);m.receiveShadow=true;scene.add(m)}
  {const n=small?1300:3400,bush=new THREE.InstancedMesh(treeGeos().bush,treeGeos().mat('#ffffff',0),n),cc=new THREE.Color();bush.frustumCulled=false;
   let sdb=777;const Rb=()=>(sdb=(sdb*16807)%2147483647)/2147483647;let k=0;
   while(k<n){const x=(Rb()-.5)*1100,z=(Rb()-.5)*1100;if(outerD(x,z)<4||landH(x,z)>120||outerSlope(x,z)>.5)continue;const sc=.55+Rb()*1.1;vp.set(x,outerY(x,z)+sc*.25,z);qt.setFromAxisAngle(UP,Rb()*6.3);vs.set(sc*1.25*(.85+Rb()*.3),sc*(.8+Rb()*.4),sc*1.25*(.85+Rb()*.3));vp.y-=sc*.25;mx.compose(vp,qt,vs);bush.setMatrixAt(k,mx);const sh=.85+Rb()*.3;cc.setRGB((.3+Rb()*.12)*sh,(.5+Rb()*.14)*sh,(.18+Rb()*.08)*sh);bush.setColorAt(k,cc);k++}
   vs.set(1,1,1);bush.count=k;scene.add(bush)}
  const TG=treeGeos(),{pine,broad,birch}=TG;
  const N=small?4800:11500,KIND=[
    {n:.55,parts:[[TG.trunk,'#4b3320',0],[pine,'#3f7a37',1,1,TG.pineL]]},
    {n:.33,parts:[[TG.trunk2,'#55392a',0],[broad,'#4a7f34',1,0,TG.broadL]]},
    {n:.12,parts:[[new THREE.CylinderGeometry(.22,.34,11,7).translate(0,5.5,0),'#ddd8cb',0],[birch,'#86a845',1,0,TG.birchL]]}];
  let sd=12345;const R=()=>(sd=(sd*16807)%2147483647)/2147483647,col=new THREE.Color(),grove=vnoise(91);
  const REACH=680,DN=256,dens=new Float32Array(DN*DN);
  // the forest is cut into tiles so whatever is off screen is not drawn at all
  const TS=6,tileOf=(x,z)=>clamp(Math.floor((x+REACH)/(2*REACH)*TS),0,TS-1)+clamp(Math.floor((z+REACH)/(2*REACH)*TS),0,TS-1)*TS;
  for(const K of KIND){K.mats=K.parts.map(([g,c,leafy,needle])=>leafy?TG.mat(c,needle):new THREE.MeshStandardMaterial({color:c,roughness:.93}));K.cap=Math.ceil(N*K.n);K.k=0;K.tiles=[...Array(TS*TS)].map(()=>({m:[],c:[]}))}
  let tries=0,done=0;
  while(done<N&&tries<N*12){tries++;
    const x=(R()-.5)*REACH*2,z=(R()-.5)*REACH*2;if(outerD(x,z)<10)continue;{const hh=landH(x,z),sl=outerSlope(x,z);if(hh>105+R()*25||sl>.42+R()*.12)continue}
    const g=fbm(grove,x*.007+40,z*.007+40);if(R()>smooth(.22,.5,g)*.9+.1)continue;          // groves and clearings
    const r=R(),K=r<KIND[0].n?KIND[0]:r<KIND[0].n+KIND[1].n?KIND[1]:KIND[2];if(K.k>=K.cap)continue;
    const sc=.75+R()*.75*(.6+g);vp.set(x,outerY(x,z)-.15,z);qt.setFromAxisAngle(UP,R()*6.28);vs.set(sc*(.9+R()*.2),sc*(.85+R()*.35),sc*(.9+R()*.2));mx.compose(vp,qt,vs);
    const sh=.78+R()*.34;col.setRGB(sh*(.92+R()*.12),sh,sh*(.85+R()*.15));
    {const T=K.tiles[tileOf(x,z)];T.m.push(mx.clone());T.c.push(col.clone())}K.k++;done++;
    const gx=Math.round((x+REACH)/(2*REACH)*DN),gz=Math.round((z+REACH)/(2*REACH)*DN);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=gx+i,Z=gz+j;if(X>=0&&Z>=0&&X<DN&&Z<DN)dens[X+Z*DN]=Math.min(1,dens[X+Z*DN]+(i||j?.12:.3))}}
  vs.set(1,1,1);
  for(const K of KIND)K.tiles.forEach((T,ti)=>{if(!T.m.length)return;const ft={x:-REACH+(ti%TS+.5)*2*REACH/TS,z:-REACH+((ti/TS|0)+.5)*2*REACH/TS,hi:[],lo:[]};FTILES.push(ft);
    K.parts.forEach(([g,,leafy,,gl],i)=>{const mk=geo=>{const m=new THREE.InstancedMesh(geo,K.mats[i],T.m.length);T.m.forEach((q,j)=>{m.setMatrixAt(j,q);if(leafy)m.setColorAt(j,T.c[j])});m.computeBoundingSphere();scene.add(m);return m};
      const h=mk(g);if(gl){const l=mk(gl);l.visible=false;ft.hi.push(h);ft.lo.push(l)}})});
  forestLOD();
  {const big=new Float32Array(256*256);for(let j=0;j<256;j++)for(let i=0;i<256;i++){const x=i/256*2000-1000,z=j/256*2000-1000,I=Math.round((x+REACH)/(2*REACH)*DN),J=Math.round((z+REACH)/(2*REACH)*DN);big[i+j*256]=I>=0&&J>=0&&I<DN&&J<DN?dens[I+J*DN]:.6}FDENS.image.data.set(big)}FDENS.needsUpdate=true;
}
function buildDetail(){
  const TG=treeGeos(),rock=(()=>{const g=new THREE.DodecahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=Math.sin(x*41.3+y*17.7+z*29.1)*43758.5;const r=1+((h-Math.floor(h))-.5)*.35;p.setXYZ(i,x*r,y*r*.7,z*r)}g.computeVertexNormals();return g})();
  const cap=small?60:110,mk=(geo,mat)=>{const m=new THREE.InstancedMesh(geo,mat,cap);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.count=cap;mx.makeScale(0,0,0);for(let i=0;i<cap;i++)m.setMatrixAt(i,mx);scene.add(m);return m};
  PROPM={
    pine:[mk(TG.trunk,new THREE.MeshStandardMaterial({color:'#4b3320',roughness:.95})),mk(TG.pine,TG.mat('#3f7a37',1))],
    broad:[mk(TG.trunk2,new THREE.MeshStandardMaterial({color:'#55392a',roughness:.95})),mk(TG.broad,TG.mat('#4a7f34',0))],
    dead:[mk(TG.dead,new THREE.MeshStandardMaterial({color:'#3b2d24',roughness:1}))],
    rock:[mk(rock,new THREE.MeshStandardMaterial({color:'#fff',roughness:.92,flatShading:true}))]};
  const n={pine:0,broad:0,dead:0,rock:0},col=new THREE.Color(),RC=['#8b8a80','#c2a571','#aeb8bf','#3b322e'];
  let sd=4242;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;let tries=0;
  while(tries++<6000&&PROPS.length<cap*3){
    const x=(R()-.5)*L*2,z=(R()-.5)*L*2,s=seatAt(x,z),c=castlePos(s);
    if(shoreOf(x,z)<WL+5||roadDist(x,z)<7.5||Math.hypot(x-c.x,z-c.z)<20||reserved(s,x,z)||Math.hypot(x,z)<30)continue;
    if(PROPS.some(p=>Math.hypot(p.x-x,p.z-z)<9))continue;
    const r=R(),k=biomeAt(x,z)===0?(r<.4?'broad':r<.75?'pine':'rock'):s===1?(r<.18?'dead':'rock'):s===2?(r<.6?'pine':'rock'):(r<.45?'dead':'rock');
    if(n[k]>=cap)continue;const i=n[k]++,y=baseHeight(x,z),sc=k==='rock'?.9+R()*1.6:.55+R()*.35,rot=R()*6.28;
    qt.setFromAxisAngle(UP,rot);vp.set(x,y-(k==='rock'?.25*sc:.1),z);vs.set(sc,sc*(k==='rock'?.8+R()*.5:1),sc);mx.compose(vp,qt,vs);
    if(k==='rock')col.set(RC[s]).multiplyScalar(.8+R()*.35);else if(s===2)col.setRGB(.85,.92,.95);else col.setRGB(.8+R()*.3,.85+R()*.25,.8+R()*.2);
    for(const m of PROPM[k]){m.setMatrixAt(i,mx);if(k==='rock'||m.material.vertexColors)m.setColorAt(i,col)}
    PROPS.push({k,i,x,z,y,s:sc,rot,col:col.clone(),alive:true})}
  vs.set(1,1,1);for(const k in PROPM)for(const m of PROPM[k]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
}
// builders swing hammers while a ship, submarine or runway is under way
function worker(){
  const g=new THREE.Group(),arm=new THREE.Group();
  add(g,new THREE.CylinderGeometry(.16,.18,.9,8),new THREE.MeshStandardMaterial({color:'#2d3a52'}),-.18,.45,0);add(g,new THREE.CylinderGeometry(.16,.18,.9,8),new THREE.MeshStandardMaterial({color:'#2d3a52'}),.18,.45,0);
  add(g,new THREE.CylinderGeometry(.42,.36,1.05,10),new THREE.MeshStandardMaterial({color:'#ee7d22',roughness:.7}),0,1.42,0);add(g,new THREE.SphereGeometry(.27,10,8),SKINM,0,2.18,0);
  add(g,new THREE.SphereGeometry(.31,10,6,0,6.3,0,1.6),new THREE.MeshStandardMaterial({color:'#f4c430',roughness:.5}),0,2.28,0);
  arm.position.set(.5,1.82,0);g.add(arm);add(arm,new THREE.CapsuleGeometry(.11,.55,4,8).translate(0,-.35,0),new THREE.MeshStandardMaterial({color:'#ee7d22'}),0,0,0);
  add(arm,new THREE.CylinderGeometry(.04,.04,.75,6).rotateX(Math.PI/2).translate(0,-.72,.3),WOOD,0,0,0);add(arm,new THREE.BoxGeometry(.18,.18,.38),IRONM,0,-.72,.68);
  return{g,arm,ph:Math.random()*6};
}
function drape(c,ux,uz,len,w,mat,yoff){
  const nl=18,nw=3,P3=[],UV=[],ix=[];
  for(let i=0;i<=nl;i++)for(let j=0;j<=nw;j++){const a=-len/2+len*i/nl,b=-w/2+w*j/nw,x=c.x+ux*a-uz*b,z=c.z+uz*a+ux*b;P3.push(x,baseHeight(x,z)+yoff,z);UV.push(j/nw,i/nl*len/9)}
  for(let i=0;i<nl;i++)for(let j=0;j<nw;j++){const k=i*(nw+1)+j;ix.push(k,k+1,k+nw+1,k+1,k+nw+2,k+nw+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P3,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(ix);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.receiveShadow=true;scene.add(m);return m;
}
function asphaltTex(){const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');g.fillStyle='#3a3c3f';g.fillRect(0,0,64,256);
  for(let i=0;i<900;i++){const v=40+Math.random()*30|0;g.fillStyle=`rgb(${v},${v},${v+2})`;g.fillRect(Math.random()*64,Math.random()*256,1.5,1.5)}
  g.fillStyle='#e8e8e2';g.fillRect(3,0,3,256);g.fillRect(58,0,3,256);for(let y=0;y<256;y+=64)g.fillRect(30,y+8,4,36);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
const SITES=[];
function buildSites(){
  const asph=new THREE.MeshStandardMaterial({map:asphaltTex(),roughness:.9}),dirt=new THREE.MeshStandardMaterial({color:'#7a6347',roughness:1});
  for(let s=0;s<4;s++){if(!P[s].on)continue;const S={};SITES[s]=S;
    // the dock: a pier out to sea, a slipway, a crane and a shed
    const d=DOCK[s],g=new THREE.Group(),y0=Math.max(baseHeight(d.land.x,d.land.z),.6);
    add(g,new THREE.BoxGeometry(7,.5,20),PLANK,0,1.1,6);for(let k=0;k<5;k++)for(const x of[-3,3])add(g,new THREE.CylinderGeometry(.3,.3,6,8),WOOD,x,-1.6,-2+k*4.5);
    add(g,new THREE.BoxGeometry(5,.3,16).rotateX(.12),DARK,-7,-.2,5);add(g,new THREE.BoxGeometry(6,3.6,6),PLANK,8,1.8,-3);add(g,new THREE.ConeGeometry(4.6,2.2,4).rotateY(Math.PI/4),teamM[s],8,4.7,-3);
    add(g,new THREE.BoxGeometry(.5,9,.5),STEEL,3.5,4.5,10);add(g,new THREE.BoxGeometry(.4,.4,9),STEEL,3.5,9,7);add(g,new THREE.CylinderGeometry(.04,.04,4,4),STEEL,3.5,7,3);
    const dk=mergeModel(g);dk.position.set(d.land.x,y0-1,d.land.z);dk.rotation.y=d.ang;scene.add(dk);S.dk=dk;
    S.yRes=new THREE.Mesh(new THREE.CircleGeometry(10,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:.25,depthWrite:false}));S.yRes.position.set(d.land.x,y0+.25,d.land.z);scene.add(S.yRes);
    const hull=new THREE.Group();hull.position.set(-7,.4,5);dk.add(hull);
    add(hull,new THREE.BoxGeometry(3.6,2,11),new THREE.MeshStandardMaterial({color:'#4a535c',roughness:.6}),0,1,0);add(hull,new THREE.ConeGeometry(2.5,3.5,4).rotateX(Math.PI/2).rotateZ(Math.PI/4).scale(1,.72,1),new THREE.MeshStandardMaterial({color:'#4a535c'}),0,1,7.2);
    for(const z of[-5,0,5])for(const x of[-2.4,2.4])add(hull,new THREE.CylinderGeometry(.08,.08,4.4,5),WOOD,x,2.2,z);
    hull.visible=false;S.hull=hull;S.hz=5;
    S.dw=[0,1,2].map(i=>{const w=worker();w.g.position.set(-4.4+(i===1?-5.2:0),1.35,1+i*3.5);w.g.rotation.y=i===1?Math.PI/2:-Math.PI/2;dk.add(w.g);w.g.visible=false;return w});
    {        // the muster field of every player: a trodden patch with the team's banners at its edge
      const R=RALLY[s],cg=new THREE.CircleGeometry(12.5,48,0,6.2832).rotateX(-Math.PI/2),cp=cg.attributes.position;for(let i=0;i<cp.count;i++)cp.setY(i,baseHeight(R.x+cp.getX(i),R.z+cp.getZ(i))+.14);
      const cm=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:s===A.seat?.28:.2,depthWrite:false}));cm.position.set(R.x,0,R.z);scene.add(cm);
      for(let i=0;i<5;i++){const a=i/5*6.283+.4,x=R.x+Math.cos(a)*13,z=R.z+Math.sin(a)*13,fg=new THREE.Group();fg.position.set(x,baseHeight(x,z),z);add(fg,new THREE.CylinderGeometry(.08,.1,4.2,6),WOOD,0,2.1,0);add(fg,new THREE.BoxGeometry(.05,.8,1.3),teamM[s],0,3.7,.66);scene.add(fg)}}
    // the runway strip: marked out, then dirt while it is built, then tarmac
    const r=RWY[s];if(!r)continue;
    S.rRes=drape(r.c,r.ux,r.uz,r.len,9,new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:.22,depthWrite:false}),.18);
    S.rDirt=drape(r.c,r.ux,r.uz,r.len,9,dirt,.12);S.rAsph=drape(r.c,r.ux,r.uz,r.len,9,asph,.16);S.rDirt.visible=S.rAsph.visible=false;
    S.rw=[0,1,2].map(i=>{const w=worker();const a=(i-1)*14;w.g.position.set(r.c.x+r.ux*a+r.uz*5.5,baseHeight(r.c.x+r.ux*a+r.uz*5.5,r.c.z+r.uz*a-r.ux*5.5),r.c.z+r.uz*a-r.ux*5.5);w.g.rotation.y=Math.atan2(-r.uz,r.ux);scene.add(w.g);w.g.visible=false;return w});
  }
}
function updateSites(dt){
  const swing=(ws,on)=>{for(const w of ws){w.g.visible=on;if(on){w.arm.rotation.x=-1.3+Math.sin(now()*.011+w.ph)*1.05;if(Math.sin(now()*.011+w.ph)>.97&&Math.random()<.3){const p=new THREE.Vector3();w.arm.getWorldPosition(p);sparks(p.x,p.z)}}}};
  for(let s=0;s<4;s++){const S=SITES[s],D=P[s];if(!S)continue;
    const st=D.dead?0:(D.rwState||0);if(S.rRes){S.rRes.visible=st===0&&!D.dead;S.rDirt.visible=st===1;S.rAsph.visible=st===2;swing(S.rw,st===1)}
    const y=local(D)?(D.yard?{type:D.yard.type,f:1-D.yard.t/D.yard.T}:null):D.yardV;
    if(D.launchT>0){D.launchT-=dt;const k=1-D.launchT/1.6;S.hull.visible=true;S.hull.scale.y=1;S.hull.position.z=S.hz+k*16;S.hull.position.y=.4-k*1.6;if(Math.random()<dt*8)splash(S.hull.getWorldPosition(tv).x,tv.z,2);if(D.launchT<=0)S.hull.visible=false}
    else if(y){S.hull.visible=true;S.hull.position.set(-7,.4,S.hz);S.hull.scale.set(y.type==='gemi'?1:.75,.15+.85*y.f,y.type==='gemi'?1:.8)}
    else S.hull.visible=false;
    const ys=D.dead?0:(D.ysState||0);S.yRes.visible=ys===0&&!D.dead;S.dk.visible=ys>0;
    {const k=ys===1?clamp(1-(local(D)?D.ysT/YARD_T:.5),0,1):1,sy=ys===1?.15+.85*k:1;if(S.dk.scale.y!==sy){S.dk.scale.y=sy;for(const w of S.dw)w.g.scale.y=1/sy}}
    swing(S.dw,(!!y||ys===1)&&!D.dead)}
}
// trees and rocks scattered over the bases; a blast or a new building knocks them down
const PROPS=[];let PROPM=null;
function clearProps(x,z,r){for(const p of PROPS)if(p.alive&&Math.hypot(p.x-x,p.z-z)<r)breakProp(p,x,z)}
function breakProp(p,fx,fz){
  p.alive=false;const k=PROPM[p.k];mx.makeScale(0,0,0);for(const m of k)m.setMatrixAt(p.i,mx),m.instanceMatrix.needsUpdate=true;
  if(p.k==='rock'){burst(p.x,p.y+.6,p.z,9,['#8b8a80','#6e6c66','#a7a49a'],6,1.2,.35);puff(p.x,p.y+.5,p.z,1.6,1.8,.55,.6,.5);return}
  // a falling tree reuses its own forest material, so knocking one down never builds a new shader
  let dx=p.x-fx,dz=p.z-fz;const l=Math.hypot(dx,dz)||1;
  if(FALLP.length>=FALLCAP)FALLP.shift();
  FALLP.push({p,t:0,ax:new THREE.Vector3(dz/l,0,-dx/l)});burst(p.x,p.y+6*p.s,p.z,10,['#3f6d2e','#5f9440','#2d5223'],5,1.4,.22);
}
const FALLP=[],FALLCAP=48,FALLM={},qa=new THREE.Quaternion();
function fallPool(k){
  if(!FALLM[k])FALLM[k]=PROPM[k].map(m=>{const f=new THREE.InstancedMesh(m.geometry,m.material,FALLCAP);f.castShadow=true;f.receiveShadow=true;f.frustumCulled=false;f.count=0;f.visible=false;if(m.instanceColor)f.setColorAt(0,new THREE.Color(1,1,1));scene.add(f);return f});
  return FALLM[k];
}
function animProps(dt){
  const n={};
  for(let i=FALLP.length-1;i>=0;i--){const f=FALLP[i];f.t+=dt;if(f.t>7)FALLP.splice(i,1)}
  for(const f of FALLP){const p=f.p,a=Math.min(1.45,f.t*f.t*2.2),y=p.y-(f.t>5?(f.t-5)*1.5:0);
    if(f.t>.85&&!f.hit){f.hit=true;puff(p.x,y+1,p.z,2.4,2.2,.6,.6,1)}
    qa.setFromAxisAngle(f.ax,a);qt.setFromAxisAngle(UP,p.rot).premultiply(qa);vp.set(p.x,y,p.z);vs.setScalar(p.s);mx.compose(vp,qt,vs);
    const ms=fallPool(p.k),i=n[p.k]=(n[p.k]||0);n[p.k]++;for(const m of ms){m.setMatrixAt(i,mx);if(m.instanceColor)m.setColorAt(i,p.col)}}
  vs.set(1,1,1);
  for(const k in FALLM){const c=n[k]||0;for(const m of FALLM[k]){if(!c&&!m.visible)continue;m.count=c;m.visible=c>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
}
function cobble(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#6b6458';g.fillRect(0,0,512,512);
  for(let y=0;y<16;y++)for(let x=-1;x<17;x++){const v=120+Math.random()*48|0;g.fillStyle=`rgb(${v},${v-6},${v-18})`;g.beginPath();g.roundRect((x+(y%2)*.5)*32+1.5,y*32+1.5,29,29,7);g.fill()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
let plaza=null;
function buildBridges(rise){
  if(DUEL){buildDuelBridges();return}
  const tex=cobble(),top=tex.clone();top.repeat.set(3,3);top.needsUpdate=true;const deckT=tex.clone();deckT.repeat.set(1.5,4);deckT.needsUpdate=true;
  const paved=new THREE.MeshStandardMaterial({map:top,bumpMap:top,bumpScale:.25,roughness:.85}),deck=new THREE.MeshStandardMaterial({map:deckT,bumpMap:deckT,bumpScale:.25,roughness:.85}),side=new THREE.MeshStandardMaterial({color:'#8f8a7c',roughness:.9});
  const Y=1.06,G=new THREE.Group();scene.add(G);const pieces=[],spans=[];
  for(let k=0;k<8;k++){const th=k*Math.PI/4,mid=th+Math.PI/8,cx=Math.sin(mid)*7,cz=Math.cos(mid)*7,pg=new THREE.Group();pg.position.set(cx,0,cz);G.add(pg);
    const w=new THREE.Mesh(new THREE.CylinderGeometry(12.5,13.4,4,6,1,false,th,Math.PI/4),[side,paved,side]);w.position.set(-cx,Y-2,-cz);w.castShadow=w.receiveShadow=true;pg.add(w);
    const r=new THREE.Mesh(new THREE.TorusGeometry(12.5,.32,8,8,Math.PI/4).rotateX(Math.PI/2).rotateY(th-Math.PI/4),side);r.position.set(-cx,Y+.08,-cz);r.castShadow=true;pg.add(r);
    pieces.push({o:pg,dir:mid})}
  const fountain=new THREE.Group();G.add(fountain);
  const f=new THREE.Mesh(new THREE.CylinderGeometry(2.8,3.1,.7,28),side);f.position.y=Y+.35;f.castShadow=true;fountain.add(f);
  const fw=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,.1,28),new THREE.MeshStandardMaterial({color:'#3f93a8',roughness:.2}));fw.position.y=Y+.72;fountain.add(fw);
  const col=new THREE.Group();col.position.y=Y+.3;fountain.add(col);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.4,.7,2.6,12),side);c.position.y=1.3;c.castShadow=true;col.add(c);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(1.1,.5,.4,16),side);bowl.position.y=2.7;bowl.castShadow=true;col.add(bowl);
  const a0=11.5,a1=24,len=a1-a0;     // from the plaza edge to dry land, measured along the diagonal
  for(let s=0;s<4;s++){
    const g=new THREE.Group();g.rotation.y=Math.atan2(SX[s],SZ[s]);G.add(g);const pv=new THREE.Group();pv.position.z=a1;g.add(pv);
    const m=new THREE.Mesh(new THREE.BoxGeometry(6.6,.5,len),[side,side,deck,side,side,side]);m.position.set(0,Y-.25,a0+len/2-a1);m.castShadow=m.receiveShadow=true;pv.add(m);
    for(const sx of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.42,.62,len),side);r.position.set(sx*3.2,Y+.3,a0+len/2-a1);r.castShadow=true;pv.add(r);
      for(let k=0;k<3;k++){const q=new THREE.Mesh(new THREE.CylinderGeometry(.55,.75,3.4,10),side);q.position.set(sx*2.5,Y-2,a0+2.5+k*(len-5)/2-a1);q.castShadow=true;pv.add(q)}}
    spans.push(pv)}
  plaza={G,pieces,spans,fountain,col};
  if(rise){G.position.y=-9;FALL.push({kind:'rise',o:G,t:0})}
}
let DBM=null;
function buildDuelBridges(){for(const b of DBR)buildDuelBridge(b)}
function buildDuelBridge(b){
  if(!DBM){const tex=cobble(),deckT=tex.clone();deckT.repeat.set(1.5,6);deckT.needsUpdate=true;DBM={deck:new THREE.MeshStandardMaterial({map:deckT,bumpMap:deckT,bumpScale:.25,roughness:.85}),side:new THREE.MeshStandardMaterial({color:'#8f8a7c',roughness:.9})}}
  const{deck,side}=DBM,Y=1.06;
  {const g=new THREE.Group(),l=Math.hypot(b.b.x-b.a.x,b.b.z-b.a.z);g.position.set((b.a.x+b.b.x)/2,0,(b.a.z+b.b.z)/2);g.rotation.y=Math.atan2(b.b.x-b.a.x,b.b.z-b.a.z);
    const m=new THREE.Mesh(new THREE.BoxGeometry(6.6,.6,l),[side,side,deck,side,side,side]);m.position.y=Y-.3;m.castShadow=m.receiveShadow=true;g.add(m);
    for(const sx of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.42,.62,l),side);r.position.set(sx*3.2,Y+.3,0);r.castShadow=true;g.add(r);
      for(let k=0;k<4;k++){const q=new THREE.Mesh(new THREE.CylinderGeometry(.6,.85,4,10),side);q.position.set(sx*2.5,Y-2.4,-l/2+6+k*(l-12)/3);q.castShadow=true;g.add(q)}
      for(let k=0;k<2;k++){const q=new THREE.Mesh(new THREE.BoxGeometry(.8,1.6,.8),side);q.position.set(sx*3.2,Y+.6,(k?1:-1)*(l/2-.6));q.castShadow=true;g.add(q)}}
    scene.add(g);b.g=g}
}
// the 1v1 stone bridges go down like the plaza: any blast on them, and they can be rebuilt for gold
function breakDuelBridge(i,remote){
  const b=DBR[i];if(!b||b.down)return;b.down=true;b.downAt=now();navLand=null;const g=b.g;b.g=null;
  if(g){g.updateMatrixWorld(true);for(const m of[...g.children]){const v=new THREE.Vector3(),q=new THREE.Quaternion();m.getWorldPosition(v);m.getWorldQuaternion(q);const w=new THREE.Group();w.position.copy(v);w.quaternion.copy(q);m.position.set(0,0,0);m.quaternion.identity();w.add(m);scene.add(w);wreck.push({g:w,t:-Math.random()*.1,r:.4+Math.random()*1.2})}scene.remove(g)}
  const mx0=(b.a.x+b.b.x)/2,mz0=(b.a.z+b.b.z)/2;explode(mx0,mz0,3);quake=Math.max(quake,1.6*clamp(1-Math.hypot(mx0-view.x,mz0-view.z)/(view.d*1.4),0,1));
  for(let k=0;k<=8;k++){const x=lerp(b.a.x,b.b.x,k/8),z=lerp(b.a.z,b.b.z,k/8);burst(x,1.5,z,5,['#8f8a7c','#6e6a60','#b0ab9c'],8,1.3,.35);if(k%2)splash(x,z,2.4)}
  SES.bomba();setTimeout(()=>SES.bomba(),300);tip(TL('Taş köprü yıkıldı! Köprü aracıyla onarabilirsin.','A stone bridge fell! Rebuild it with the Bridge tool.'));
  for(const D of P)if(local(D))for(const u of D.units){
    if(!fighter(u.type)||u.ret||UNITS[u.type].yol!=='kara')continue;
    if(segD(u.x,u.z,b)<4.2){u.hp=0;u.fk=true;splash(u.x,u.z,1.5);continue}
    if(!u.path.pts.some((p,k)=>u.path.c[k]>u.s&&segD(p.x,p.z,b)<5))continue;
    const e=u.path.pts[u.path.pts.length-1],n=nav({x:u.x,z:u.z},e)||nav({x:u.x,z:u.z},castlePos(seatAt(u.x,u.z)));
    if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(u.cmd?0:7+u.id%5);u.off=false;u.reS=false}else{u.path=polyPath([{x:u.x,z:u.z},{x:u.x+.01,z:u.z}]);u.s=0;u.end=0;u.cmd=true;u.hold=true}}
  if(!remote)say('dkopru',{i});
}
function fixDuelBridge(i,remote){
  const b=DBR[i];if(!b||!b.down)return;b.down=false;navLand=null;buildDuelBridge(b);
  for(const m of b.g.children){m.userData.y=m.position.y;m.position.y-=9}FALL.push({kind:'rise2',o:b.g,t:0});
  SES.para();tip(TL('Taş köprü yeniden yapıldı','The stone bridge is rebuilt'));if(!remote)say('dkopruonar',{i});
}
const duelBridgeAt=p=>{let bi=-1,bd=10;DBR.forEach((b,i)=>{const d=segD(p.x,p.z,b);if(d<bd){bd=d;bi=i}});return bi};
function brickTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#55534e';g.fillRect(0,0,256,256);
  for(let y=0;y<8;y++)for(let x=-1;x<6;x++){const v=128+Math.random()*50|0;g.fillStyle=`rgb(${v},${v-3},${v-10})`;g.fillRect(x*51+(y%2)*25+2,y*32+2,47,28)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,1.5);t.anisotropy=8;return t}
const brick=brickTex();
const STONE=new THREE.MeshStandardMaterial({map:brick,bumpMap:brick,bumpScale:.4,roughness:.9}),DARK=new THREE.MeshStandardMaterial({color:'#5b5d60',roughness:.8}),WOOD=new THREE.MeshStandardMaterial({color:'#6d4b2c',roughness:.8}),STEEL=new THREE.MeshStandardMaterial({color:'#3e4750',roughness:.4,metalness:.6});
function plankTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#7a5432';g.fillRect(0,0,128,128);
  for(let x=0;x<128;x+=16){g.fillStyle=`rgb(${100+Math.random()*30|0},${68+Math.random()*20|0},${40+Math.random()*12|0})`;g.fillRect(x+1,0,14,128);g.fillStyle='rgba(40,25,12,.5)';g.fillRect(x,0,1.5,128)}
  for(let i=0;i<260;i++){g.fillStyle=`rgba(50,32,16,${Math.random()*.35})`;g.fillRect(Math.random()*128,Math.random()*128,1,6+Math.random()*20)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
const plk=plankTex(),PLANK=new THREE.MeshStandardMaterial({map:plk,bumpMap:plk,bumpScale:.3,roughness:.85}),SKINM=new THREE.MeshStandardMaterial({color:'#e8c9a0',roughness:.7}),IRONM=new THREE.MeshStandardMaterial({color:'#6b747d',roughness:.45,metalness:.5});
const teamM=TEAM.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.55}));
function mergeModel(g){
  g.updateMatrixWorld(true);const by=new Map();
  g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;let a=by.get(o.material);if(!a)by.set(o.material,a=[]);const q=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());q.applyMatrix4(o.matrixWorld);a.push(q)});
  const out=new THREE.Group();
  for(const[mat,list]of by){let n=0;for(const q of list)n+=q.attributes.position.count;const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let o=0;
    for(const q of list){P3.set(q.attributes.position.array,o*3);N3.set(q.attributes.normal.array,o*3);if(q.attributes.uv)U2.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count;q.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));mg.computeBoundingSphere();
    const m=new THREE.Mesh(mg,mat);m.castShadow=m.receiveShadow=true;out.add(m)}
  return out;
}
// towers are instanced too: one template per type and level, so a full base costs a handful of draw calls
const TEAM_W=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.55}),GOLD=new THREE.MeshStandardMaterial({color:'#ffd24a',metalness:.7,roughness:.3}),TPL=new Map(),TCAP=200;
function towerTpl(type,lvl){
  const key=type+lvl;let T=TPL.get(key);if(T)return T;
  const t={type,lvl,owner:-1};const g=new THREE.Group();buildTower(g,t,TEAM_W);g.updateMatrixWorld(true);
  const by=new Map();
  g.traverse(o=>{if(!o.isMesh)return;let a=by.get(o.material);if(!a)by.set(o.material,a=[]);const q=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());q.applyMatrix4(o.matrixWorld);a.push(q)});
  const ims=[];
  for(const[mat,list]of by){let n=0;for(const q of list)n+=q.attributes.position.count;const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let o=0;
    for(const q of list){P3.set(q.attributes.position.array,o*3);N3.set(q.attributes.normal.array,o*3);if(q.attributes.uv)U2.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count;q.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));mg.computeBoundingBox();mg.computeBoundingSphere();
    const m=new THREE.InstancedMesh(mg,mat,TCAP);m.castShadow=m.receiveShadow=true;m.count=0;m.visible=false;if(mat===TEAM_W)m.setColorAt(0,tc[0]);scene.add(m);ims.push(m)}
  g.traverse(o=>{if(o.geometry)o.geometry.dispose()});
  T={top:t.top,ims,list:[],dirty:true};TPL.set(key,T);return T;
}
function drawTowers(){
  for(const T of TPL.values()){
    let shaking=false;for(const h of T.list)if(h.shake>0){shaking=true;break}
    if(!T.dirty&&!shaking)continue;
    let k=0;for(const h of T.list){if(!h.visible||k>=TCAP)continue;
      if(h.shake>0){const a=h.shake*1.3;vp.set(h.x+Math.sin(now()*.07)*a,h.y,h.z+Math.cos(now()*.09)*a);qt.setFromAxisAngle(ZF,Math.sin(now()*.05)*a*.12)}else{vp.set(h.x,h.y,h.z);qt.identity()}
      vs.set(1,h.sy||1,1);mx.compose(vp,qt,vs);for(const m of T.ims){m.setMatrixAt(k,mx);if(m.instanceColor)m.setColorAt(k,tc[h.owner])}k++}
    vs.set(1,1,1);
    for(const m of T.ims){m.count=k;m.visible=k>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;if(T.mem&&k)m.computeBoundingSphere()}
    T.dirty=false;T.mem=false}
}
const dropModel=h=>{if(!h)return;if(h.tpl){const T=h.tpl,i=T.list.indexOf(h);if(i>=0)T.list.splice(i,1);T.dirty=T.mem=true;return}scene.remove(h);h.traverse(o=>{if(o.geometry)o.geometry.dispose()})};
const add=(g,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
// the castle: a walled square with a gate on every side, corner towers, and the tall keep in the middle with its archers
const CH=7.2,GATEM=new THREE.MeshStandardMaterial({color:'#2a1d12',roughness:.9}),BOWM=new THREE.MeshStandardMaterial({color:'#6b4426',roughness:.8});     // half the width of the castle wall
function castleAng(s){const c=castlePos(s),r=ROAD[s];if(r)for(const p of r)if(Math.hypot(p.x-c.x,p.z-c.z)>14)return Math.atan2(p.z-c.z,p.x-c.x);return 0}
const CANG=[0,1,2,3].map(castleAng);
function gates(s){const c=castlePos(s),a=CANG[s];return[0,1,2,3].map(i=>{const b=a+i*Math.PI/2;return{x:c.x+Math.cos(b)*(CH+2),z:c.z+Math.sin(b)*(CH+2)}})}
const gateNear=(s,x,z)=>{let b=null,bd=1e9;for(const q of gates(s)){const d=Math.hypot(q.x-x,q.z-z);if(d<bd){bd=d;b=q}}return b};
function buildCastle(s){
  const g=new THREE.Group(),c=castlePos(s),t=teamM[s],h0=heightAt(c.x,c.z),a=CANG[s];g.rotation.y=-a;
  const gy=(lx,lz)=>{const X=c.x+lx*Math.cos(a)-lz*Math.sin(a),Z=c.z+lx*Math.sin(a)+lz*Math.cos(a);return Math.max(heightAt(X,Z),h0-1.2)-h0};
  const H=CH,WH=4.2,TH=1.3,gap=1.9;
  add(g,new THREE.BoxGeometry(H*2,.5,H*2),DARK,0,.05,0);
  // curtain walls, each split by a gate in its middle
  for(let k=0;k<4;k++){const sg=new THREE.Group();sg.rotation.y=k*Math.PI/2;g.add(sg);
    for(const sd of[-1,1]){const l=H-gap-1.2,mx=sd*(gap+1.2+l/2);const y=gy(H,mx);
      add(sg,new THREE.BoxGeometry(TH,WH,l),STONE,H,y+WH/2,mx);add(sg,new THREE.BoxGeometry(TH+.5,.3,l),DARK,H,y+WH+.15,mx);
      for(let m=-l/2+.45;m<l/2;m+=1.1)add(sg,new THREE.BoxGeometry(TH+.3,.7,.55),STONE,H+.15,y+WH+.65,mx+m);
      add(sg,new THREE.CylinderGeometry(.95,1.1,WH+2.6,10),STONE,H,y+(WH+2.6)/2,sd*(gap+.6));     // gatehouse towers
      add(sg,new THREE.ConeGeometry(1.25,1.8,10),t,H,y+WH+3.5,sd*(gap+.6))}
    const y=gy(H,0);
    add(sg,new THREE.BoxGeometry(TH+.6,1.4,gap*2+.2),STONE,H,y+WH+.4,0);     // the arch over the gate
    add(sg,new THREE.BoxGeometry(.25,2.2,gap*2-.3),GATEM,H+.55,y+WH-1.4,0);     // the raised portcullis
    add(sg,new THREE.BoxGeometry(.06,1.1,.8),t,H+.95,y+WH-.2,0)}
  // corner towers
  for(const[x,z]of[[H,H],[-H,H],[H,-H],[-H,-H]]){const y=gy(x,z);add(g,new THREE.CylinderGeometry(1.55,1.8,WH+3.6,12),STONE,x,y+(WH+3.6)/2,z);
    for(let i=0;i<8;i++){const b=i/8*6.283;add(g,new THREE.BoxGeometry(.55,.65,.55),STONE,x+Math.cos(b)*1.45,y+WH+3.9,z+Math.sin(b)*1.45)}
    add(g,new THREE.ConeGeometry(1.95,2.6,12),t,x,y+WH+5.4,z)}
  // the keep
  add(g,new THREE.CylinderGeometry(3.4,4.1,13,12),STONE,0,6.5,0);add(g,new THREE.CylinderGeometry(3.9,3.9,.35,12),DARK,0,13.1,0);
  for(let i=0;i<12;i++){const b=i/12*6.283;add(g,new THREE.BoxGeometry(.9,1.1,.8),STONE,Math.cos(b)*3.55,13.8,Math.sin(b)*3.55)}
  for(let i=0;i<6;i++){const b=i/6*6.283+.3;add(g,new THREE.BoxGeometry(.5,1,.12),DARK,Math.cos(b)*3.45,8.5,Math.sin(b)*3.45).rotation.y=-b+Math.PI/2}     // arrow slits
  add(g,new THREE.BoxGeometry(1.5,2.4,.3),GATEM,3.75,1.2,0).rotation.y=Math.PI/2;
  // archers on the wall walks, looking out over the battlements
  const bow=BOWM;
  for(let k=0;k<4;k++)for(const m of[-4.3,4.3]){const b=k*Math.PI/2,lx=(H-.35)*Math.cos(b)-m*Math.sin(b),lz=(H-.35)*Math.sin(b)+m*Math.cos(b),ag=new THREE.Group();ag.position.set(lx,gy(lx,lz)+WH+.15,lz);ag.rotation.y=-b+Math.PI/2;g.add(ag);
    add(ag,new THREE.CylinderGeometry(.3,.36,1.15,8),t,0,.58,0);add(ag,new THREE.SphereGeometry(.26,10,8),SKINM,0,1.4,0);add(ag,new THREE.SphereGeometry(.29,10,6,0,6.3,0,1.6),IRONM,0,1.48,0);
    add(ag,new THREE.TorusGeometry(.6,.045,5,12,Math.PI),bow,.3,1,.35).rotation.set(0,0,Math.PI/2)}
  add(g,new THREE.ConeGeometry(3.1,4.4,12),t,0,17,0);add(g,new THREE.CylinderGeometry(.09,.09,4,6),WOOD,0,20.6,0);add(g,new THREE.BoxGeometry(2,1.1,.08),t,1,21.7,0);
  const mg=mergeModel(g);mg.position.set(c.x,h0,c.z);scene.add(mg);
}
function makeTowerModel(t){
  const T=towerTpl(t.type,t.lvl);if(T.top!=null)t.top=T.top;
  const h={tpl:T,x:t.x,y:heightAt(t.x,t.z),z:t.z,owner:t.owner,shake:0,_v:true,get visible(){return this._v},set visible(v){if(v!==this._v){this._v=v;T.dirty=T.mem=true}}};
  T.list.push(h);T.dirty=T.mem=true;t.mesh=h;
}
function buildTower(g,t,col){
  if(t.type==='ok'){
    const h=4.2+t.lvl*1.1,b0=1.1,top=b0+h,w=1.25;t.top=top+1.6;
    add(g,new THREE.CylinderGeometry(1.95,2.2,b0,10),STONE,0,b0/2,0);add(g,new THREE.CylinderGeometry(2.05,2.05,.18,10),DARK,0,b0+.05,0);
    for(const[x,z]of[[-w,-w],[w,-w],[-w,w],[w,w]]){const p=add(g,new THREE.CylinderGeometry(.17,.24,h,7),PLANK,x*.92,b0+h/2,z*.92);p.rotation.set(z*.03,0,-x*.03)}
    for(let side=0;side<4;side++){const gs=new THREE.Group();gs.rotation.y=side*Math.PI/2;g.add(gs);
      for(let k=0;k<Math.max(2,t.lvl+1);k++){const y0=b0+.3+k*h/(t.lvl+1.4),y1=y0+h/(t.lvl+1.4)-.25,l=Math.hypot(2*w,y1-y0);
        for(const sg of[1,-1]){const br=add(gs,new THREE.BoxGeometry(l,.13,.12),WOOD,0,(y0+y1)/2,w*.92);br.rotation.z=sg*Math.atan2(y1-y0,2*w)}}
      add(gs,new THREE.BoxGeometry(2*w+.3,.16,.16),WOOD,0,b0+h*.5,w*.92)}
    add(g,new THREE.BoxGeometry(3.7,.32,3.7),PLANK,0,top+.16,0);
    for(let side=0;side<4;side++){const gs=new THREE.Group();gs.rotation.y=side*Math.PI/2;g.add(gs);
      add(gs,new THREE.BoxGeometry(3.7,.42,.16),PLANK,0,top+.52,1.77);
      for(const x of[-1.45,-.48,.48,1.45])add(gs,new THREE.BoxGeometry(.5,.55,.18),PLANK,x,top+1,1.77)}
    for(const[x,z]of[[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]])add(g,new THREE.CylinderGeometry(.11,.11,2.6,6),WOOD,x,top+1.45,z);
    const roof=add(g,new THREE.ConeGeometry(2.75,2.1,4,1),col,0,top+3.75,0);roof.rotation.y=Math.PI/4;
    add(g,new THREE.ConeGeometry(2.95,.22,4,1,true),WOOD,0,top+2.76,0).rotation.y=Math.PI/4;
    add(g,new THREE.CylinderGeometry(.05,.05,1.8,6),WOOD,0,top+5.5,0);const fl=add(g,new THREE.BoxGeometry(.9,.55,.04),col,.47,top+6.05,0);fl.castShadow=false;
    // the archer on the platform
    add(g,new THREE.CylinderGeometry(.3,.38,.95,10),col,.55,top+.95,.55);add(g,new THREE.SphereGeometry(.25,10,8),SKINM,.55,top+1.62,.55);
    add(g,new THREE.SphereGeometry(.28,10,6,0,6.3,0,1.6),IRONM,.55,top+1.68,.55);
    const bow=add(g,new THREE.TorusGeometry(.62,.035,6,16,2.4),WOOD,.95,top+1.25,.95);bow.rotation.set(0,Math.PI/4,1.95);
    if(t.lvl>=2)add(g,new THREE.CylinderGeometry(2.25,2.25,.2,10),IRONM,0,b0*.55,0);
    if(t.lvl>=3)add(g,new THREE.SphereGeometry(.3,10,8),GOLD,0,top+4.9,0);
  }
  else if(t.type==='top'){add(g,new THREE.CylinderGeometry(1.8,2.2,2.6+t.lvl,8),STONE,0,(2.6+t.lvl)/2,0);const b=add(g,new THREE.CylinderGeometry(.5,.65,3.2,8),STEEL,.7,3.4+t.lvl,0);b.rotation.z=1.25;add(g,new THREE.SphereGeometry(.9,8,6),col,-.5,3+t.lvl,0)}
  else if(t.type==='roket'){
    add(g,new THREE.CylinderGeometry(2.1,2.4,1,10),DARK,0,.5,0);add(g,new THREE.BoxGeometry(1.4,1.4,1.4),STEEL,0,1.6,0);
    const rack=new THREE.Group();rack.position.y=2.6;rack.rotation.x=-.55;g.add(rack);add(rack,new THREE.BoxGeometry(2.6,1.3,3.2),col,0,0,0);
    for(const x of[-.65,0,.65])for(const y of[-.3,.3]){add(rack,new THREE.CylinderGeometry(.22,.22,3.4,8).rotateX(Math.PI/2),STEEL,x,y,.15);add(rack,new THREE.ConeGeometry(.2,.5,8).rotateX(Math.PI/2),IRONM,x,y,1.95)}
    add(g,new THREE.BoxGeometry(.2,1.6,.2),STEEL,1.6,1.8,-1);add(g,new THREE.TorusGeometry(.5,.06,6,16).rotateY(.6),STEEL,1.6,2.8,-1);t.top=3.4}
  else if(t.type==='duvar'){const h=2.6+t.lvl*.5;add(g,new THREE.BoxGeometry(WALL,h,WALL),STONE,0,h/2,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])add(g,new THREE.BoxGeometry(.7,.7,.7),STONE,x,h+.35,z)}
  else{add(g,new THREE.BoxGeometry(3,1.2,3),DARK,0,.6,0);add(g,new THREE.CylinderGeometry(.9,1.1,1.6+t.lvl*.5,8),col,0,1.8,0);for(const dz of[-.55,.55]){const b=add(g,new THREE.CylinderGeometry(.14,.14,4,6),STEEL,.9,3.4+t.lvl*.3,dz);b.rotation.z=-.65}}
}
// units are instanced: thousands of triangles, very few draw calls
const CAP=320,SKIN='#e8c9a0',IRON='#59626c',LEATH='#5a3a22',HORSE='#6b4426';
const bx=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z),cy=(a,b,h,x,y,z,n=8)=>new THREE.CylinderGeometry(a,b,h,n).translate(x,y,z),sp=(r,x,y,z)=>new THREE.SphereGeometry(r,10,8).translate(x,y,z);
const cp=(r,l,x,y,z)=>new THREE.CapsuleGeometry(r,l,4,10).translate(x,y,z);
const LEG=(p,a,ph,k)=>({p,a,ph,k}),BOOT='#2a2622',TROU='#3b3a34';
const PARTS={
  piyade:[
    [cp(.2,.7,-.24,.72,0),TROU,LEG([-.24,1.22,0],.7,0)],[cp(.2,.7,.24,.72,0),TROU,LEG([.24,1.22,0],.7,3.14)],
    [bx(.34,.22,.52,-.24,.1,.08),BOOT,LEG([-.24,1.22,0],.7,0)],[bx(.34,.22,.52,.24,.1,.08),BOOT,LEG([.24,1.22,0],.7,3.14)],
    [cy(.36,.46,.5,0,1.42,0,12),TROU],[cy(.52,.42,1.05,0,2.1,0,12),null],[cy(.47,.47,.16,0,1.62,0,12),LEATH],
    [cp(.17,.68,-.68,2.05,0),null,LEG([-.68,2.55,0],.55,3.14)],[cp(.17,.68,.68,2.05,0),null,LEG([.68,2.55,0],.55,0,'arm')],
    [sp(.17,-.68,1.48,0),SKIN,LEG([-.68,2.55,0],.55,3.14)],[sp(.17,.68,1.48,0),SKIN,LEG([.68,2.55,0],.55,0,'arm')],
    [cy(.15,.17,.26,0,2.72,0,8),SKIN],[sp(.34,0,3.05,.02),SKIN],[new THREE.SphereGeometry(.39,12,7,0,6.3,0,1.65).translate(0,3.1,0),IRON],[cy(.48,.5,.07,0,3.03,0,16),IRON],[bx(.08,.34,.14,0,3.02,.36),IRON],
    [new THREE.CylinderGeometry(.62,.62,.09,16).rotateX(1.57).translate(-.84,2.05,.28),null,LEG([-.68,2.55,0],.3,3.14)],[sp(.14,-.84,2.05,.36),'#c9ced4',LEG([-.68,2.55,0],.3,3.14)],
    [cy(.045,.045,3.6,.76,2.3,.28,6),'#6d4b2c',LEG([.68,2.55,0],.18,0,'spear')],[new THREE.ConeGeometry(.12,.55,6).translate(.76,4.35,.28),'#c9ced4',LEG([.68,2.55,0],.18,0,'spear')]],
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
    [new THREE.CylinderGeometry(.34,.42,6,10).rotateX(1.57).translate(0,1.7,.8),'#59402a',LEG([0,0,0],0,0,'ram')],[new THREE.ConeGeometry(.5,1,10).rotateX(1.57).translate(0,1.7,4.3),IRON,LEG([0,0,0],0,0,'ram')],
    ...[-1.3,1.3].flatMap(x=>[-1.5,1.5].map(z=>[new THREE.CylinderGeometry(.65,.65,.3,14).rotateZ(1.57).translate(x,.65,z),'#2d2a28']))],
  balon:[[new THREE.SphereGeometry(3.4,24,16).scale(1,1.2,1).translate(0,4.2,0),null],[new THREE.TorusGeometry(3.42,.13,8,32).rotateX(1.57).translate(0,4.2,0),'#fff4d6'],[new THREE.TorusGeometry(2.7,.11,8,32).rotateX(1.57).translate(0,6.6,0),'#fff4d6'],[new THREE.TorusGeometry(2.7,.11,8,32).rotateX(1.57).translate(0,1.8,0),'#fff4d6'],[new THREE.ConeGeometry(1.5,1.8,16).rotateX(3.14).translate(0,-.4,0),null],[cy(.04,.04,2.4,-.6,-1.9,-.6,4),'#3b2614'],[cy(.04,.04,2.4,.6,-1.9,-.6,4),'#3b2614'],[cy(.04,.04,2.4,-.6,-1.9,.6,4),'#3b2614'],[cy(.04,.04,2.4,.6,-1.9,.6,4),'#3b2614'],[bx(1.6,.95,1.6,0,-3.3,0),LEATH],[sp(.5,0,-4.1,0),'#1c1c1e']],
  dalgic:[
    [cp(.2,.7,-.24,.72,0),'#16191d',LEG([-.24,1.22,0],.7,0)],[cp(.2,.7,.24,.72,0),'#16191d',LEG([.24,1.22,0],.7,3.14)],
    [bx(.42,.08,1,-.24,.05,.3),'#e8c23a',LEG([-.24,1.22,0],.7,0)],[bx(.42,.08,1,.24,.05,.3),'#e8c23a',LEG([.24,1.22,0],.7,3.14)],
    [cy(.5,.42,1.5,0,1.95,0,12),'#16191d'],[cy(.47,.47,.2,0,2.25,0,12),null],[cy(.22,.22,1.05,0,2.1,-.56,10),'#c9b23a'],[cy(.08,.08,.5,0,2.75,-.56,6),'#59626c'],
    [new THREE.CapsuleGeometry(.15,.6,4,8).translate(0,-.42,0).rotateX(-1.3).rotateY(.55).translate(-.6,2.5,0),'#16191d'],
    [new THREE.CapsuleGeometry(.15,.6,4,8).translate(0,-.42,0).rotateX(-1.3).rotateY(-.55).translate(.6,2.5,0),'#16191d'],
    [sp(.14,-.2,2.27,.68),'#16191d'],[sp(.14,.2,2.27,.68),'#16191d'],
    [sp(.33,0,3.02,.02),'#16191d'],[bx(.52,.22,.12,0,3.08,.33),'#8fe0ff'],[cy(.05,.05,.8,.24,3.4,.05,6),'#e8c23a'],
    [bx(.2,.28,1.15,0,2.28,.86),'#1d2024',LEG([0,0,0],0,0,'gun')],[new THREE.CylinderGeometry(.055,.055,.75,8).rotateX(1.57).translate(0,2.33,1.8),'#0e0f11',LEG([0,0,0],0,0,'gun')],
    [bx(.12,.42,.2,0,1.98,.88),'#0e0f11',LEG([0,0,0],0,0,'gun')],[bx(.15,.24,.42,0,2.24,.14),'#3b2a1c',LEG([0,0,0],0,0,'gun')],[bx(.06,.12,.3,0,2.48,.95),'#0e0f11',LEG([0,0,0],0,0,'gun')]],
  isci:[
    [cp(.2,.7,-.24,.72,0),'#2d3a52',LEG([-.24,1.22,0],.7,0)],[cp(.2,.7,.24,.72,0),'#2d3a52',LEG([.24,1.22,0],.7,3.14)],
    [bx(.34,.22,.52,-.24,.1,.08),BOOT,LEG([-.24,1.22,0],.7,0)],[bx(.34,.22,.52,.24,.1,.08),BOOT,LEG([.24,1.22,0],.7,3.14)],
    [cy(.36,.44,.5,0,1.42,0,12),'#2d3a52'],[cy(.52,.42,1.05,0,2.1,0,12),'#ee7d22'],[cy(.53,.5,.16,0,2.25,0,12),null],[cy(.47,.47,.12,0,1.62,0,12),LEATH],
    [cp(.17,.68,-.68,2.05,0),'#ee7d22',LEG([-.68,2.55,0],.55,3.14)],[sp(.17,-.68,1.48,0),SKIN,LEG([-.68,2.55,0],.55,3.14)],
    [cp(.17,.68,.68,2.05,0),'#ee7d22',LEG([.68,2.55,0],.55,0,'arm')],[sp(.17,.68,1.48,0),SKIN,LEG([.68,2.55,0],.55,0,'arm')],
    [new THREE.CylinderGeometry(.05,.05,1.05,6).rotateX(1.57).translate(.68,1.48,.5),'#6d4b2c',LEG([.68,2.55,0],.55,0,'arm')],[bx(.24,.24,.5,.68,1.48,1.05),'#59626c',LEG([.68,2.55,0],.55,0,'arm')],
    [cy(.15,.17,.26,0,2.72,0,8),SKIN],[sp(.34,0,3.02,.02),SKIN],[new THREE.SphereGeometry(.4,12,7,0,6.3,0,1.6).translate(0,3.1,0),'#f4c430'],[cy(.52,.52,.06,0,3.1,0,16),'#f4c430']],
  denizalti:[[new THREE.CapsuleGeometry(1.5,10,6,16).rotateX(1.57).scale(1,.8,1),'#2f3a44'],[bx(1.4,1.7,3,0,1.7,.6),'#2f3a44'],[bx(1.5,.3,3.1,0,2.2,.6),null],[cy(.09,.09,1.6,.2,3,1.1,6),'#59626c'],[bx(4.2,.14,1,0,0,-5.4),'#59626c'],[bx(.14,2.8,1,0,0,-5.4),'#59626c']],
  gemi:[[bx(4.4,2.2,15,0,-.2,-1),'#3c454f'],[new THREE.ConeGeometry(3.1,5.2,4).rotateX(Math.PI/2).rotateZ(Math.PI/4).scale(1,.72,1).translate(0,-.2,8.8),'#3c454f'],[bx(4.5,.38,14.6,0,.6,-1),null],
    [bx(4.1,.14,15.4,0,.98,-.6),'#7b6a52'],[bx(2.7,2.1,4.2,0,2.1,-2.6),'#a3abb3'],[bx(2.3,1.1,2.5,0,3.7,-2.9),'#bcc4cb'],[bx(2.32,.35,2.52,0,3.85,-2.9),'#29323a'],
    [new THREE.CylinderGeometry(.62,.75,2.6,12).translate(0,4,-5.3),null],[new THREE.CylinderGeometry(.66,.66,.3,12).translate(0,5.3,-5.3),'#1e2328'],[cy(.08,.08,4.6,0,5.6,-1.6,6),'#59626c'],[bx(2,.08,.08,0,7.2,-1.6),'#59626c'],
    [new THREE.CylinderGeometry(.95,1.05,.75,14).translate(0,1.4,3.4),'#59626c'],[new THREE.CylinderGeometry(.13,.15,3,8).rotateX(Math.PI/2).translate(-.3,1.55,5.1),'#2b3036'],[new THREE.CylinderGeometry(.13,.15,3,8).rotateX(Math.PI/2).translate(.3,1.55,5.1),'#2b3036'],
    [new THREE.CylinderGeometry(.95,1.05,.75,14).translate(0,1.4,-7.2),'#59626c'],[new THREE.CylinderGeometry(.13,.15,3,8).rotateX(Math.PI/2).translate(-.3,1.55,-8.9),'#2b3036'],[new THREE.CylinderGeometry(.13,.15,3,8).rotateX(Math.PI/2).translate(.3,1.55,-8.9),'#2b3036']],
  ucak:[[new THREE.CapsuleGeometry(.95,8.6,6,12).rotateX(Math.PI/2),'#6f7d5c'],[new THREE.ConeGeometry(.95,1.6,12).rotateX(Math.PI/2).translate(0,0,5.9),'#5d6a4c'],[sp(.72,0,.62,3.2),'#8fd0ff'],
    [bx(16,.26,2.7,0,-.1,.6),'#6f7d5c'],[bx(1.1,.28,2.72,-7.6,-.1,.6),null],[bx(1.1,.28,2.72,7.6,-.1,.6),null],[new THREE.CylinderGeometry(1,1,.8,14).rotateX(Math.PI/2).translate(0,0,-1.6),null],
    [bx(.22,2.4,1.9,0,1.35,-4.7),'#6f7d5c'],[bx(5.8,.2,1.5,0,.35,-4.8),'#6f7d5c'],
    [new THREE.CylinderGeometry(.55,.62,2.6,12).rotateX(Math.PI/2).translate(-3.4,-.25,1.3),'#3c4238'],[new THREE.CylinderGeometry(.55,.62,2.6,12).rotateX(Math.PI/2).translate(3.4,-.25,1.3),'#3c4238'],
    [bx(3.2,.14,.28,-3.4,-.25,2.7),'#1c1c1c',{p:[-3.4,-.25,2.7],k:'prop'}],[bx(3.2,.14,.28,3.4,-.25,2.7),'#1c1c1c',{p:[3.4,-.25,2.7],k:'prop'}],
    [bx(.55,.55,1.5,-.7,-1.05,.2),'#2a2a2a'],[bx(.55,.55,1.5,.7,-1.05,.2),'#2a2a2a']],
  fuze:[[new THREE.CylinderGeometry(.5,.5,4.4,14).rotateX(1.57),'#d8dde2'],[new THREE.ConeGeometry(.5,1.5,14).rotateX(1.57).translate(0,0,2.95),null],[new THREE.CylinderGeometry(.54,.54,.5,14).rotateX(1.57).translate(0,0,1.1),null],[bx(2.2,.1,.8,0,0,-1.85),'#59626c'],[bx(.1,2.2,.8,0,0,-1.85),'#59626c'],[new THREE.ConeGeometry(.38,1.5,10).rotateX(-1.57).translate(0,0,-2.9),'#ff9a30']]
};
// one shared material for every unit part: fixed colours ride in the vertices, team parts take the instance colour
const UNIT_M=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.7,vertexColors:true});
UNIT_M.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aTeam;').replace('#include <color_vertex>',THREE.ShaderChunk.color_vertex.replace('vColor.rgb *= instanceColor.rgb;','vColor.rgb *= mix(vec3(1.0),instanceColor.rgb,aTeam);'))};
UNIT_M.customProgramCacheKey=()=>'unitTeam';
const IM={};
function buildUnits(){
  const c=new THREE.Color();
  for(const k of UKEYS){
    const groups=new Map();      // parts that move together are drawn together
    for(const[geo,col,swing]of PARTS[k]){const key=swing?JSON.stringify(swing):'';let g=groups.get(key);if(!g)groups.set(key,g={swing:swing||null,list:[]});g.list.push([geo,col])}
    IM[k]=[...groups.values()].map(({swing,list})=>{
      let n=0;const ng=list.map(([geo,col])=>{const q=geo.index?geo.toNonIndexed():geo;n+=q.attributes.position.count;return[q,col]});
      const P3=new Float32Array(n*3),N3=new Float32Array(n*3),C3=new Float32Array(n*3),T1=new Float32Array(n);let o=0;
      for(const[q,col]of ng){const cnt=q.attributes.position.count;P3.set(q.attributes.position.array,o*3);N3.set(q.attributes.normal.array,o*3);c.set(col||'#ffffff');
        for(let i=0;i<cnt;i++){C3[(o+i)*3]=c.r;C3[(o+i)*3+1]=c.g;C3[(o+i)*3+2]=c.b;T1[o+i]=col?0:1}o+=cnt}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P3,3));g.setAttribute('normal',new THREE.BufferAttribute(N3,3));g.setAttribute('color',new THREE.BufferAttribute(C3,3));g.setAttribute('aTeam',new THREE.BufferAttribute(T1,1));
      const m=new THREE.InstancedMesh(g,UNIT_M,CAP);m.castShadow=true;m.frustumCulled=false;m.count=0;m.visible=false;m.userData.swing=swing;
      m.setColorAt(0,c.set('#fff'));scene.add(m);return m})}
}
const angLerp=(a,b,t)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t};
const mt=new THREE.Matrix4(),mr=new THREE.Matrix4(),mb=new THREE.Matrix4(),mo=new THREE.Matrix4(),qr=new THREE.Quaternion(),XA=new THREE.Vector3(1,0,0),mx=new THREE.Matrix4(),qt=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),vp=new THREE.Vector3(),vs=new THREE.Vector3(1,1,1),tc=TEAM.map(c=>new THREE.Color(c));
function drawUnits(rdt){
  const n={};for(const k of UKEYS)n[k]=0;
  const turn=(p,a)=>{mt.makeTranslation(p[0],p[1],p[2]);mr.makeRotationX(a);mb.makeTranslation(-p[0],-p[1],-p[2]);return mo.copy(mx).multiply(mt).multiply(mr).multiply(mb)};
  // atk: 0..1 through one blow. f: pulled back (-.5) to fully struck (1)
  const put=(type,x,z,from,dir,moving=true,pitchY=null,pitch=0,atk=null)=>{
    const i=n[type];if(i>=CAP)return;n[type]++;
    let f=0,lunge=0;
    if(atk!=null){moving=false;f=atk<.2?1-atk/.2:atk<.8?-(atk-.2)/.6*.5:lerp(-.5,1,(atk-.8)/.2);
      lunge=type==='piyade'?.38*f:type==='atli'?.7*f:type==='koc'?.12*f:0;
      if(type==='piyade')pitch=.06+.2*Math.max(f,0);else if(type==='atli')pitch=f<0?f*.55:f*.12}
    const walk=(type==='atli'?.0125:.0075)*now()+i*1.7,inW=type==='atli'&&heightAt(x,z)<.2;
    const hop=type==='balon'?Math.sin(now()/600+i)*.8:type==='koc'||type==='fuze'||type==='denizalti'||type==='gemi'||type==='ucak'?0:moving?Math.abs(Math.sin(walk))*(inW?.08:.2):0;
    vp.set(x+Math.sin(dir)*lunge,(pitchY??unitY(UNITS[type],x,z))+hop,z+Math.cos(dir)*lunge);qt.setFromAxisAngle(UP,dir);
    if(pitch){qr.setFromAxisAngle(XA,pitch);qt.multiply(qr)}
    mx.compose(vp,qt,vs);
    const arm=-1.15-.35*f;
    for(const m of IM[type]){
      const sw=m.userData.swing;
      if(sw&&sw.k==='prop'){mt.makeTranslation(sw.p[0],sw.p[1],sw.p[2]);mr.makeRotationZ(now()*.045);mb.makeTranslation(-sw.p[0],-sw.p[1],-sw.p[2]);m.setMatrixAt(i,mo.copy(mx).multiply(mt).multiply(mr).multiply(mb))}
      else if(sw&&atk!=null){
        if(sw.k==='arm')m.setMatrixAt(i,turn(sw.p,arm));
        else if(sw.k==='spear'){mt.makeTranslation(.76,2.55-1.07*Math.cos(arm),-1.07*Math.sin(arm)+.5*f);mr.makeRotationX(1.45);mb.makeTranslation(-.76,-1.75,-.28);m.setMatrixAt(i,mo.copy(mx).multiply(mt).multiply(mr).multiply(mb))}
        else if(sw.k==='gun'){mt.makeTranslation(0,0,-.16*Math.max(0,Math.sin(atk*Math.PI*6)));m.setMatrixAt(i,mo.copy(mx).multiply(mt))}
        else if(sw.k==='ram'){mt.makeTranslation(0,0,1.7*f);m.setMatrixAt(i,mo.copy(mx).multiply(mt))}
        else if(type==='piyade')m.setMatrixAt(i,turn(sw.p,(sw.ph<1?1:-1)*sw.a*.45));
        else if(type==='atli'&&sw.p[2]>0)m.setMatrixAt(i,turn(sw.p,Math.sin(atk*12.6)*.8));
        else m.setMatrixAt(i,mx)}
      else if(sw&&moving)m.setMatrixAt(i,turn(sw.p,Math.sin(walk+sw.ph)*sw.a));
      else m.setMatrixAt(i,mx);
      m.setColorAt(i,tc[from])}};
  for(const D of P){
    if(!D.on||D.dead)continue;
    for(const u of D.units){
      if(u.type==='fuze'){const a=u.path.pts[0],e=u.path.pts[u.path.pts.length-1];u.dir=Math.atan2(e.x-a.x,e.z-a.z);const t=u.t||0,H=fuzeH(u),y=fuzeY(u),pt=-Math.atan2(Math.cos(t*Math.PI)*H*Math.PI,Math.max(u.path.len,1));put('fuze',u.x,u.z,u.from,u.dir,false,y,pt);
        {const b=Math.sin(u.dir),c=Math.cos(u.dir),far=camera.position.distanceToSquared(vp.set(u.x,y,u.z))>400;if(far&&Math.random()<.7)puff(u.x-b*3,y,u.z-c*3,1.3,2.2,.88,.3,.25);flame(u.x-b*3.2,y,u.z-c*3.2,1.6,.12)}continue}
      // face the way they actually move, turning smoothly, so nobody runs sideways
      let want=u.dir;
      if(u.type==='ucak')want=u.hd;
      else if(u.atk&&u.face!=null)want=u.face;
      else if(u.px!=null){const dx=u.x-u.px,dz=u.z-u.pz;if(dx*dx+dz*dz>1e-4)want=Math.atan2(dx,dz)}
      else{const q=pointOn(u.path,u.s+.5);want=Math.atan2(q.x-u.x,q.z-u.z)}
      u.px=u.x;u.pz=u.z;u.dir=u.dir==null?want:angLerp(u.dir,want,Math.min(1,rdt*(u.type==='gemi'?2:u.type==='ucak'?20:10)));
      if(u.type==='ucak'){put('ucak',u.x,u.z,u.from,u.dir,true,u.fall!=null?u.y:u.alt,u.fall!=null?.5:u.ph==='roll'?0:u.ph==='land'?.07:-.06);
        if(u.hp<UNITS.ucak.hp*.4&&Math.random()<rdt*8)puff(u.x,u.alt,u.z,1.4,2,.2,.4,.2);continue}
      if(u.type==='gemi'){put('gemi',u.x,u.z,u.from,u.dir,false,u.fall!=null?-.45-Math.max(0,u.fall-.6)**1.6*.9:-.45+Math.sin(now()/700+u.id)*.12,u.fall!=null?Math.min(.55,u.fall*.16):0);
        if(u.moving&&Math.random()<rdt*3)ripple(u.x-Math.sin(u.dir)*7,u.z-Math.cos(u.dir)*7,7);continue}
      if(u.fall!=null){put('balon',u.x,u.z,u.from,u.dir||0,false,u.y,u.fall*1.1);continue}
      let hid=false;if(u.type==='denizalti'){hid=!subSeen(u.x,u.z,u.from);u.dy=lerp(u.dy==null?-.45:u.dy,u.under||hid?-2.9:u.moving!==false?-1.25:-.7,Math.min(1,rdt*1.5))}
      put(u.type,u.x,u.z,u.from,u.dir||0,u.moving!==false,u.dove!=null?-.45-u.dove*1.5:u.type==='denizalti'&&u.dy<-.5?u.dy:u.emerge>0?unitY(UNITS[u.type],u.x,u.z)-u.emerge*1.3:null,0,u.atk?clamp(1-u.cd/(u.cdM||1.2),0,1):null);
      if((u.type==='atli'||u.type==='dalgic'||u.type==='denizalti'&&!hid)&&heightAt(u.x,u.z)<.2&&Math.random()<rdt*7){ripple(u.x,u.z,4.5);if(Math.random()<.5)boom(u.x,.3-heightAt(u.x,u.z),u.z,.45,'#eaf7ff')}}
    for(const o of D.remote.values()){const ox=o.x,oz=o.z;o.x=lerp(o.x,o.tx,Math.min(1,rdt*3));o.z=lerp(o.z,o.tz,Math.min(1,rdt*3));if(Math.hypot(o.x-ox,o.z-oz)>.01)o.dir=Math.atan2(o.x-ox,o.z-oz);const of=num(o.from,D.seat),oh=o.type==='denizalti'&&!subSeen(o.x,o.z,of);if(o.fl&2){o.ft+=rdt;if(naval(o.type)){put(o.type,o.x,o.z,of,o.dir||0,false,-.45-Math.max(0,o.ft-.6)**1.6*.9,Math.min(.55,o.ft*.16));if(o.ft<3&&Math.random()<rdt*2)boom(o.x+(Math.random()-.5)*8,2.5,o.z+(Math.random()-.5)*8,3,'#ff7a2a')}else put(o.type,o.x,o.z,of,o.dir||0,false,Math.max(1,20-13*o.ft*o.ft),o.ft*1.1)}else put(o.type,o.x,o.z,of,o.dir||0,!(o.fl&4),o.type==='denizalti'?(oh?-2.9:-1.25):null,0,o.fl&1?(now()/1200+o.sd)%1:null);if((o.type==='atli'||o.type==='dalgic'||o.type==='denizalti'&&!oh)&&heightAt(o.x,o.z)<.2&&Math.random()<rdt*7)ripple(o.x,o.z,4.5)}
  }
  for(const k of UKEYS)for(const m of IM[k]){const was=m.count;m.count=n[k];m.visible=n[k]>0;if(n[k]||was){m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true}}
}
// effects
const SHOTS=240,shotPos=new Float32Array(SHOTS*6),shotLife=new Float32Array(SHOTS);let shotI=0;
const shotGeo=new THREE.BufferGeometry();shotGeo.setAttribute('position',new THREE.BufferAttribute(shotPos,3));
const shotLine=new THREE.LineSegments(shotGeo,new THREE.LineBasicMaterial({color:'#fff0b0'}));shotLine.frustumCulled=false;scene.add(shotLine);
function tracer(ax,ay,az,bx2,by,bz,life=.09){const i=shotI;shotI=(shotI+1)%SHOTS;shotPos.set([ax,ay,az,bx2,by,bz],i*6);shotLife[i]=life}
function shot(t,u){tracer(t.x,heightAt(t.x,t.z)+(t.top||5),t.z,u.x,unitY(UNITS[u.type],u.x,u.z)+1.2,u.z)}
function gunFx(D,u,x,y,z){
  const s=Math.sin(u.face||0),c=Math.cos(u.face||0),mx0=u.x+s*2.2,my=unitY(UNITS.dalgic,u.x,u.z)+2.33,mz=u.z+c*2.2;
  tracer(mx0,my,mz,x+(Math.random()-.5)*1.2,y+(Math.random()-.5),z+(Math.random()-.5)*1.2,.06);
  if(Math.random()<.6)flame(mx0,my,mz,.9,.07);fxAt(D,u.x,u.z,'tufek');
}
// debris and smoke share one instanced pool, so a big blast costs a single draw call
const PN=420,pts=[],pGeo=new THREE.IcosahedronGeometry(1,0),pMesh=new THREE.InstancedMesh(pGeo,new THREE.MeshBasicMaterial({color:'#fff'}),PN),pc=new THREE.Color();pMesh.frustumCulled=false;pMesh.setColorAt(0,pc);pMesh.count=0;scene.add(pMesh);
function burst(x,y,z,n,col,sp,life,size,grav=26,rise=0){
  for(let i=0;i<n&&pts.length<PN;i++){const a=Math.random()*6.28,e=Math.random(),s=sp*(.35+Math.random()*.75);pts.push({x,y,z,vx:Math.cos(a)*s*(1-e*.5),vy:s*(.4+e)+rise,vz:Math.sin(a)*s*(1-e*.5),t:0,l:life*(.6+Math.random()*.6),s:size*(.6+Math.random()*.8),g:grav,c:Array.isArray(col)?col[Math.random()*col.length|0]:col})}
}
function drawParts(dt){
  let k=0;for(let i=pts.length-1;i>=0;i--){const p=pts[i];p.t+=dt;if(p.t>=p.l){pts.splice(i,1);continue}
    p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.1&&p.g>0){p.y=.1;p.vy*=-.3;p.vx*=.6;p.vz*=.6}
    const q=1-p.t/p.l,sz=p.g<0?p.s*(1+p.t*2.2):p.s*Math.min(1,q*2);
    qt.setFromAxisAngle(UP,p.t*5);vp.set(p.x,p.y,p.z);vs.setScalar(sz);mx.compose(vp,qt,vs);pMesh.setMatrixAt(k,mx);pMesh.setColorAt(k,pc.set(p.c).multiplyScalar(p.g<0?.45+q*.55:1));k++}
  vs.set(1,1,1);pMesh.count=k;pMesh.instanceMatrix.needsUpdate=true;if(pMesh.instanceColor)pMesh.instanceColor.needsUpdate=true;
}
// a ring of pressure along the ground, plus a shake of the camera if it is close
const SHOCK=[];for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.84,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe2b0',transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);SHOCK.push({m,t:1,r:1})}
let shockI=0,quake=0;
function explode(x,z,big){
  const y=Math.max(heightAt(x,z),.2),wet=shoreOf(x,z)<WL;
  if(wet){splash(x,z,big*1.6);SES.dalga(.6*Math.max(.15,nearHome(x,z)))}else{
    flame(x,y+1,z,4+big*3,.35);
    for(let i=0;i<Math.round(3+big*2);i++){const a=Math.random()*6.28,s=big*(2+Math.random()*3);flame(x,y+1,z,1.8+big*.9,.5,Math.cos(a)*s,s*.8,Math.sin(a)*s)}
    burst(x,y+1,z,Math.round(9*big),['#5b4a38','#3a2f26','#7a6650'],big*3,1.1,.28+big*.05);
    burst(x,y+1,z,Math.round(3*big),['#ffd27a','#ff9a30'],big*4,.6,.12,18);
    for(let i=0;i<Math.round(3+big*2.5);i++)puff(x+(Math.random()-.5)*big*2,y+1.5+Math.random()*big,z+(Math.random()-.5)*big*2,1.6+big*.9,3.4+big*.6,.13+Math.random()*.12,2.4+big*.5,big*.6);
    for(let i=0;i<Math.round(2+big);i++)puff(x,y+.5,z,1.2+big*.6,2.2,.42,.8,big*1.4)}
  const s=SHOCK[shockI];shockI=(shockI+1)%SHOCK.length;s.t=0;s.r=big*5;s.m.visible=true;s.m.position.set(x,y+.5,z);
  quake=Math.max(quake,big*.35*clamp(1-Math.hypot(x-view.x,z-view.z)/(view.d*1.4),0,1));
}
function splash(x,z,big){burst(x,.3,z,Math.round(8*big),['#ffffff','#d8f2ff','#9fdcf0'],big*2.4,.9,.22+big*.04,22);ripple(x,z,big*2.5);ripple(x,z,big*1.4)}
function sparks(x,z){const y=Math.max(heightAt(x,z),.2)+2;burst(x,y,z,4,['#ffe9a0','#fff','#ffb050'],7,.28,.09,20)}
function smokeTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.scale(2,2);
  for(let i=0;i<22;i++){const a=Math.random()*6.28,d=Math.random()*24,x=64+Math.cos(a)*d,y=64+Math.sin(a)*d,r=16+Math.random()*22,gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.6,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}
  const id=g.getImageData(0,0,256,256);for(let i=0;i<id.data.length;i+=4){const k=.86+Math.random()*.14;id.data[i]*=k;id.data[i+1]*=k;id.data[i+2]*=k}g.putImageData(id,0,0);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function fireTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,235,170,.9)');gr.addColorStop(.6,'rgba(255,140,40,.35)');gr.addColorStop(1,'rgba(255,80,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const LIGHT_V=new THREE.Vector3(0,1,0);
function spritePool(tex,cap,additive){
  const q=new THREE.PlaneGeometry(1,1),geo=new THREE.InstancedBufferGeometry();geo.index=q.index;geo.setAttribute('position',q.attributes.position);geo.setAttribute('uv',q.attributes.uv);
  const P3=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3),C4=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4),S2=new THREE.InstancedBufferAttribute(new Float32Array(cap*2),2);
  for(const a of[P3,C4,S2])a.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('iPos',P3);geo.setAttribute('iCol',C4);geo.setAttribute('iSR',S2);geo.instanceCount=0;
  const mat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},fogC:{value:SKY},lv:{value:LIGHT_V}},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
    vertexShader:`attribute vec3 iPos;attribute vec4 iCol;attribute vec2 iSR;varying vec2 vUv,vQ;varying vec4 vC;varying float vSh,vF;
      void main(){vUv=uv;vC=iCol;vec4 mv=modelViewMatrix*vec4(iPos,1.);float c=cos(iSR.y),s=sin(iSR.y);vec2 q=mat2(c,s,-s,c)*position.xy;vQ=q;vSh=.72+.5*(q.y+.5);mv.xy+=q*iSR.x;vF=smoothstep(430.,1250.,-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D map;uniform vec3 fogC,lv;varying vec2 vUv,vQ;varying vec4 vC;varying float vSh,vF;
      void main(){vec4 t=texture2D(map,vUv);vec2 d=vQ*2.;vec3 nn=normalize(vec3(d,sqrt(max(0.,1.-dot(d,d)))+.35));float lit=.42+.78*max(dot(nn,lv),0.);vec3 c=vC.rgb*t.rgb*${additive?'1.':'lit'};gl_FragColor=vec4(${additive?'c':'mix(c,fogC,vF)'},t.a*vC.a);
      #include <colorspace_fragment>
      }`});
  const m=new THREE.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=additive?4:3;scene.add(m);
  return{list:[],cap,geo,P3,C4,S2};
}
const SMOKE=spritePool(smokeTex(),small?260:450,false),FIRE=spritePool(fireTex(),small?120:240,true);
function puff(x,y,z,size,life,grey,vy=2.6,spread=1){if(SMOKE.list.length>=SMOKE.cap)SMOKE.list.shift();
  SMOKE.list.push({x,y,z,vx:(Math.random()-.5)*spread*2+.6,vy:vy*(.6+Math.random()*.6),vz:(Math.random()-.5)*spread*2+.25,t:0,l:life*(.75+Math.random()*.5),s:size*(.7+Math.random()*.5),g:size*(1.2+Math.random()),r:Math.random()*6.28,w:(Math.random()-.5)*.6,c:grey})}
function flame(x,y,z,size,life,vx=0,vy=0,vz=0){if(FIRE.list.length>=FIRE.cap)FIRE.list.shift();FIRE.list.push({x,y,z,vx,vy,vz,t:0,l:life*(.8+Math.random()*.4),s:size*(.8+Math.random()*.4),r:Math.random()*6.28})}
function drawSprites(dt){
  LIGHT_V.copy(SUN_DIR).transformDirection(camera.matrixWorldInverse);
  {const L0=SMOKE.list;let k=0;for(let i=L0.length-1;i>=0;i--){const p=L0[i];p.t+=dt;if(p.t>=p.l){L0.splice(i,1);continue}}
   for(const p of L0){const f=p.t/p.l,dmp=Math.exp(-dt*.9);p.vx*=dmp;p.vz*=dmp;p.vy*=Math.exp(-dt*.35);p.x+=(p.vx+.7)*dt;p.y+=p.vy*dt;p.z+=(p.vz+.3)*dt;p.r+=p.w*dt;
     const g=p.c+(1-p.c)*f*.5,a=Math.min(1,p.t/.25)*Math.pow(1-f,1.6)*.72;
     SMOKE.P3.setXYZ(k,p.x,p.y,p.z);SMOKE.C4.setXYZW(k,g,g*.98,g*.95,a);SMOKE.S2.setXY(k,p.s+p.g*Math.sqrt(p.t),p.r);k++}
   SMOKE.geo.instanceCount=k;for(const a of[SMOKE.P3,SMOKE.C4,SMOKE.S2])a.needsUpdate=true}
  {const L0=FIRE.list;let k=0;for(let i=L0.length-1;i>=0;i--){const p=L0[i];p.t+=dt;if(p.t>=p.l)L0.splice(i,1)}
   for(const p of L0){const f=p.t/p.l;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vx*=.9;p.vz*=.9;p.vy=p.vy*.9+dt*6;
     FIRE.P3.setXYZ(k,p.x,p.y,p.z);FIRE.C4.setXYZW(k,1,lerp(.95,.4,f),lerp(.75,.08,f),(1-f)*(1-f));FIRE.S2.setXY(k,p.s*(.6+f*.9),p.r);k++}
   FIRE.geo.instanceCount=k;for(const a of[FIRE.P3,FIRE.C4,FIRE.S2])a.needsUpdate=true}
}
// every flash in the game goes through here: fire for blasts, soft puffs for dust, trails and splashes
function boom(x,y,z,r,col){
  const yy=y+heightAt(x,z);
  if(col==='#eaf7ff'||col==='#ffffff'){burst(x,Math.max(yy,.2),z,3,['#ffffff','#d8f2ff'],r*3,.6,.12,22);return}
  if(col==='#c9c9c9'){puff(x,yy,z,1.4,2.4,.86,.4,.3);return}
  if(col==='#d0d0d0'){puff(x,yy,z,1.6,1.4,.62,1.4,.6);return}
  if(col==='#9a8468'){puff(x,yy,z,1.1,1.1,.5,.8,.4);return}
  flame(x,yy,z,r*2.4,.32);if(r>1.2)flame(x+(Math.random()-.5)*r,yy+r*.4,z+(Math.random()-.5)*r,r*1.7,.45,0,2,0);
  const n=r<1.1?(Math.random()<.3?1:0):Math.min(4,Math.round(r*.7));for(let i=0;i<n;i++)puff(x+(Math.random()-.5)*r,yy+r*.3,z+(Math.random()-.5)*r,r*.9,2.2+r*.35,.18+Math.random()*.12,2+r*.3,r*.4);
}
const SHM=new THREE.InstancedMesh(new THREE.SphereGeometry(.5,10,8),new THREE.MeshStandardMaterial({color:'#24272a',roughness:.5,metalness:.4}),220);SHM.frustumCulled=false;SHM.count=0;scene.add(SHM);
const RKM=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.2,1.8,8).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:'#e8eaec',roughness:.4}),80);RKM.frustumCulled=false;RKM.count=0;scene.add(RKM);
const ZF=new THREE.Vector3(0,0,1),tv=new THREE.Vector3();
function drawShells(dt){
  let a=0,b=0;
  for(const s of SHELLS){
    if(s.kind==='roket'){tv.set(s.vx,s.vy,s.vz).normalize();qt.setFromUnitVectors(ZF,tv);vp.set(s.x,s.y,s.z);mx.compose(vp,qt,vs);if(b<80)RKM.setMatrixAt(b++,mx);puff(s.x,s.y,s.z,.9,1.6,.9,.2,.15);flame(s.x-tv.x,s.y-tv.y,s.z-tv.z,1.4,.08);continue}
    const k=Math.min(1,s.t/s.dur),gy=Math.max(heightAt(s.x1,s.z1),0),x=lerp(s.x0,s.x1,k),z=lerp(s.z0,s.z1,k),y=s.kind==='bomb'?lerp(s.y0,gy,k*k):lerp(s.y0,gy,k)+s.arc*4*k*(1-k);
    qt.identity();vp.set(x,y,z);vs.set(s.kind==='bomb'?.8:.7,s.kind==='bomb'?.8:.7,s.kind==='bomb'?1.8:.7);mx.compose(vp,qt,vs);if(a<220)SHM.setMatrixAt(a++,mx);
    if(s.kind==='top'&&Math.random()<dt*14)puff(x,y,z,.7,1.1,.75,0,.1)}
  vs.set(1,1,1);SHM.count=a;RKM.count=b;SHM.instanceMatrix.needsUpdate=true;RKM.instanceMatrix.needsUpdate=true;
}
function drawFx(dt){
  drawShells(dt);updateSites(dt);
  drawParts(dt);
  for(const s of SHOCK){if(s.t>=1)continue;s.t+=dt/.55;s.m.scale.setScalar(.5+s.t*s.r);s.m.material.opacity=.7*(1-s.t);if(s.t>=1)s.m.visible=false}
  for(let i=wreck.length-1;i>=0;i--){const w=wreck[i];w.t+=dt;w.g.position.y-=dt*(1+w.t*7);w.g.rotation.x+=dt*w.r;w.g.rotation.z-=dt*w.r*.6;if(w.t>1.5){scene.remove(w.g);w.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});wreck.splice(i,1)}}
  for(let i=0;i<SHOTS;i++)if(shotLife[i]>0){shotLife[i]-=dt;if(shotLife[i]<=0)shotPos.fill(0,i*6,i*6+6)}
  shotGeo.attributes.position.needsUpdate=true;
  for(const D of P)for(const t of D.towers)if(t.shake>0&&t.mesh){t.shake-=dt;t.mesh.shake=Math.max(t.shake,0);if(t.shake<=0)t.mesh.tpl.dirty=true}
  drawTowers();
  drawSprites(dt);animPlaza(dt);animProps(dt);WIND.value=now()/1000;
}
const wreck=[];
// ---------- bridges and the fountain ----------
function bridgeSpot(p){
  if(DUEL){const c=p.x<0?-48:48;if(Math.abs(p.x-c)>18||Math.abs(p.z)>64)return null;const a={x:c-24,z:Math.round(p.z)},b={x:c+24,z:a.z};
    if(shoreOf(a.x,a.z)<WL+3||shoreOf(b.x,b.z)<WL+3||DBR.some(o=>Math.abs(o.a.z-a.z)<14&&Math.sign(o.a.x)===Math.sign(c))||bridges.some(o=>Math.min(segD(a.x,a.z,o),segD(b.x,b.z,o))<16))return null;return{a,b}}
  const hor=Math.abs(p.x)<RIVER+WL+2&&Math.abs(p.z)>30,ver=Math.abs(p.z)<RIVER+WL+2&&Math.abs(p.x)>30;if(!hor&&!ver)return null;
  const a=hor?{x:-23,z:Math.round(p.z)}:{x:Math.round(p.x),z:-23},b=hor?{x:23,z:a.z}:{x:a.x,z:23};
  if(shoreOf(a.x,a.z)<WL+3||shoreOf(b.x,b.z)<WL+3)return null;
  if(bridges.some(o=>Math.min(segD(a.x,a.z,o),segD(b.x,b.z,o))<16))return null;
  return{a,b};
}
function addBridge(id,a,b,owner,remote){
  if(!a||!b||bridges.some(o=>o.id===id))return;
  const g=new THREE.Group(),l=Math.hypot(b.x-a.x,b.z-a.z),n=9,c=l/n;g.position.set((a.x+b.x)/2,1.06,(a.z+b.z)/2);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
  for(let i=0;i<n;i++){const z=-l/2+c*(i+.5),sec=new THREE.Group();sec.position.z=z;g.add(sec);add(sec,new THREE.BoxGeometry(6.6,.4,c-.1),WOOD,0,-.2,0);add(sec,new THREE.BoxGeometry(.3,.8,c-.1),WOOD,3.2,.35,0);add(sec,new THREE.BoxGeometry(.3,.8,c-.1),WOOD,-3.2,.35,0);if(i%2)for(const x of[-2.6,2.6])add(sec,new THREE.CylinderGeometry(.4,.5,4,8),WOOD,x,-2.2,0)}
  add(g,new THREE.BoxGeometry(.3,2.4,.3),teamM[owner],3.2,1.2,-l/2+.5);add(g,new THREE.BoxGeometry(.3,2.4,.3),teamM[owner],-3.2,1.2,l/2-.5);
  scene.add(g);bridges.push({id,a,b,owner,g});
  if(!remote)say('kopru',{id,a:[a.x,a.z],b:[b.x,b.z],o:owner});
}
function breakBridge(b,remote){
  const i=bridges.indexOf(b);if(i<0)return;bridges.splice(i,1);
  const l=[...b.g.children];b.g.updateMatrixWorld(true);
  for(const sec of l){const v=new THREE.Vector3();sec.getWorldPosition(v);const q=new THREE.Group();q.position.copy(v);q.rotation.y=b.g.rotation.y;sec.position.set(0,0,0);q.add(sec);scene.add(q);wreck.push({g:q,t:-Math.random()*.35,r:1+Math.random()*2});burst(v.x,1.5,v.z,4,['#6d4b2c','#4b3320'],8,1.1,.3);splash(v.x,v.z,2.2)}
  scene.remove(b.g);explode((b.a.x+b.b.x)/2,(b.a.z+b.b.z)/2,3);SES.bomba();tip(TL('Köprü yıkıldı!','Bridge destroyed!'));
  for(const D of P)if(local(D))for(const u of D.units){
    if(!fighter(u.type)||u.ret)continue;
    if(segD(u.x,u.z,b)<4&&UNITS[u.type].yol==='kara'){u.hp=0;u.fk=true;continue}
    if(UNITS[u.type].yol==='kara'&&u.path.pts.some(p=>segD(p.x,p.z,b)<4||false)){const h=castlePos(D.seat),n=nav({x:u.x,z:u.z},h);if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(7+u.id%5)}}}
  if(!remote)say('kopruyik',{id:b.id});
}
const FALL=[];
function animPlaza(dt){
  for(let i=FALL.length-1;i>=0;i--){const f=FALL[i];f.t+=dt;
    if(f.kind==='rise2'){const k=Math.min(1,f.t/1.8),e=1-Math.pow(1-k,3);for(const m of f.o.children)m.position.y=m.userData.y-9*(1-e);if(k>=1)FALL.splice(i,1);continue}
    if(f.kind==='rise'){const k=Math.min(1,f.t/2.2),e=1-Math.pow(1-k,3);f.o.position.y=-9*(1-e);
      if(Math.random()<dt*14){const a=Math.random()*6.28,r=10+Math.random()*5;puff(Math.cos(a)*r,1,Math.sin(a)*r,2.2,2.4,.62,1.4,.8);if(k<.7)splash(Math.cos(a)*r,Math.sin(a)*r,1.2)}
      if(k>=1){f.o.position.y=0;FALL.splice(i,1)}continue}
    if(f.t<0){if(f.o.position){f.o.position.x=f.x0+(Math.random()-.5)*.25;f.o.position.z=f.z0+(Math.random()-.5)*.25}continue}
    if(!f.go){f.go=true;f.o.position.x=f.x0;f.o.position.z=f.z0}
    f.vy+=dt*(f.kind==='span'?7:9);f.o.position.y-=f.vy*dt;
    if(f.kind==='span'){f.o.rotation.x=Math.max(-.85,f.o.rotation.x-dt*(.6+f.t*1.4))}
    else{f.a=Math.min(f.amax,f.a+dt*f.spin);f.o.quaternion.setFromAxisAngle(f.ax,f.a);f.o.position.x+=f.ox*dt;f.o.position.z+=f.oz*dt}
    if(!f.wet&&f.o.position.y<-1.2){f.wet=true;const p=new THREE.Vector3();f.o.getWorldPosition(p);splash(p.x,p.z,f.kind==='span'?3:2.6);puff(p.x,.6,p.z,2.4,2.8,.85,1.2,.6)}
    if(f.o.position.y<-16){f.o.visible=false;FALL.splice(i,1)}}
}
// the fountain gives way and takes the whole plaza and its four bridges into the river
function breakFountain(remote){
  if(fountainDown||!plaza)return;fountainDown=true;navLand=null;downAt=now();
  const{pieces,spans,col,fountain}=plaza;
  explode(0,0,4);quake=Math.max(quake,2.2);
  burst(0,3,0,80,['#ffffff','#bfeaff','#7fd0ee'],17,1.7,.28,20);
  for(let i=0;i<10;i++)puff((Math.random()-.5)*14,1.5,(Math.random()-.5)*14,3+Math.random()*2,4.2,.58,1.6,1.2);
  for(const p of pieces){const ax=new THREE.Vector3(Math.cos(p.dir),0,-Math.sin(p.dir));
    FALL.push({kind:'piece',o:p.o,t:-.35-Math.random()*.55,x0:p.o.position.x,z0:p.o.position.z,vy:0,a:0,amax:.6+Math.random()*.6,spin:.7+Math.random()*.6,ax,ox:Math.sin(p.dir)*1.2,oz:Math.cos(p.dir)*1.2})}
  FALL.push({kind:'piece',o:col,t:0,x0:0,z0:0,vy:-2,a:0,amax:1.5,spin:2.2,ax:new THREE.Vector3(1,0,.3).normalize(),ox:.4,oz:.2});
  FALL.push({kind:'piece',o:fountain,t:-.2,x0:0,z0:0,vy:0,a:0,amax:.3,spin:.4,ax:new THREE.Vector3(0,0,1),ox:0,oz:0});
  for(const sp of spans)FALL.push({kind:'span',o:sp,t:-.6-Math.random()*.5,x0:sp.position.x,z0:sp.position.z,vy:0});
  for(let k=0;k<14;k++){const a=Math.random()*6.28,r=Math.random()*11;burst(Math.cos(a)*r,1.5,Math.sin(a)*r,4,['#8f8a7c','#6e6a60','#b0ab9c'],9,1.4,.4)}
  waterU.pr.value=-1;
  // whoever stood on the plaza goes into the river; anyone still heading for it turns round
  for(const D of P)if(local(D))for(const u of D.units){
    if(!fighter(u.type)||u.ret||UNITS[u.type].yol!=='kara')continue;
    if(Math.hypot(u.x,u.z)<26&&(Math.hypot(u.x,u.z)<13.5||roadDist(u.x,u.z)<5)){u.hp=0;u.fk=true;splash(u.x,u.z,1.5);continue}
    if(!u.path.pts.some((p,i)=>u.path.c[i]>u.s&&Math.hypot(p.x,p.z)<14))continue;
    const h=castlePos(D.seat),n=seatAt(u.x,u.z)===D.seat?nav({x:u.x,z:u.z},h):null;
    if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(7+u.id%5);u.off=false;continue}
    u.done=true;const O=P[u.from];if(O&&!O.dead){if(local(O))comeHome(O,u.type,D.seat,0,u.hp,u.x,u.z);else say('home',{to:u.from,type:u.type,from:D.seat,s:0,hp:Math.round(u.hp),x:Math.round(u.x),z:Math.round(u.z)})}}
  SES.bomba();setTimeout(()=>SES.bomba(),350);tip(TL('Orta meydan çöktü! Kara askerleri köprü kurulana ya da meydan onarılana kadar geçemez.',"The central plaza collapsed! Land troops can't cross until a bridge is built or the plaza is repaired."));if(!remote)say('cesme',{});
}
function repairPlaza(remote){
  if(!fountainDown)return;
  if(plaza){scene.remove(plaza.G);for(let i=FALL.length-1;i>=0;i--)if(FALL[i].kind!=='rise')FALL.splice(i,1)}
  fountainDown=false;navLand=null;waterU.pr.value=12.5;buildBridges(true);SES.para();
  tip(TL('Orta meydan onarıldı. Kara yolu yeniden açık.','The plaza is repaired. The land road is open again.'));if(!remote)say('onar',{});
}
const ring=new THREE.Mesh(new THREE.RingGeometry(.96,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.7,side:THREE.DoubleSide,depthTest:false}));ring.visible=false;ring.renderOrder=5;scene.add(ring);
const ring2=ring.clone();ring2.material=ring.material.clone();ring2.material.color.set('#7fd0ff');ring2.visible=false;scene.add(ring2);

// craters
let GM=null;const craterDepth=r=>1.5*Math.min(1.3,r/4);
function sinkGround(x,z,r){
  if(!GM)return;const{geo,N,W}=GM,dk=geo.attributes.aDark,p=geo.attributes.position,n=geo.attributes.normal,st=W/N,ix=Math.round((x+W/2)/st),iz=Math.round((z+W/2)/st),R=Math.ceil(r*1.3/st)+1;
  const at=(i,j)=>clamp(i,0,N)+clamp(j,0,N)*(N+1);
  for(let j=iz-R;j<=iz+R;j++)for(let i=ix-R;i<=ix+R;i++){if(i<0||j<0||i>N||j>N)continue;const k=at(i,j),d=Math.hypot(p.getX(k)-x,p.getZ(k)-z)/r;if(d>1.3)continue;
    p.setY(k,p.getY(k)+(d<1?-craterDepth(r)*(1-d*d):.28*(1.3-d)/.3));
    dk.setX(k,Math.max(dk.getX(k),clamp((1.25-d)/.55,0,1)*(.72+Math.random()*.28)))}
  for(let j=iz-R-1;j<=iz+R+1;j++)for(let i=ix-R-1;i<=ix+R+1;i++){if(i<1||j<1||i>=N||j>=N)continue;const k=at(i,j),dx=p.getY(at(i-1,j))-p.getY(at(i+1,j)),dz=p.getY(at(i,j-1))-p.getY(at(i,j+1)),l=Math.hypot(dx,2*st,dz);n.setXYZ(k,dx/l,2*st/l,dz/l)}
  const r0=clamp(iz-R-1,0,N),r1=clamp(iz+R+1,0,N),st0=r0*(N+1),cnt=(r1-r0+1)*(N+1);
  for(const[a,k]of[[p,3],[n,3],[dk,1]]){if(a.addUpdateRange)a.addUpdateRange(st0*k,cnt*k);a.needsUpdate=true}
}
function crater(x,z,r,remote){
  if(shoreOf(x,z)<WL+1||onDeck(x,z))return;
  sinkGround(x,z,r);anyCrater=true;clearProps(x,z,r+1.6);
  const R=Math.ceil(r),cx=Math.round(x),cz=Math.round(z),D=craterDepth(r);
  for(let j=cz-R;j<=cz+R;j++)for(let i=cx-R;i<=cx+R;i++){const X=i+L,Z=j+L;if(X<0||Z<0||X>=GN||Z>=GN)continue;const d=Math.hypot(i-x,j-z)/r;if(d<1)CRD[X+Z*GN]=Math.min(5,CRD[X+Z*GN]+D*(1-d*d))}
  if(!remote&&!P.every(p=>!p.on||p===ME||p.bot))say('krater',[x|0,z|0,r]);
}

// ---------- camera and input ----------
const home=castlePos(A.seat),view={x:home.x*.72,z:home.z*.72,d:150,tx:home.x*.72,tz:home.z*.72,td:150};
const DMIN=30,DMAX=560;
function followSun(){
  const ext=clamp(view.d*1.05,45,260),tex=2*ext/sun.shadow.mapSize.x,x=Math.round(view.x/tex)*tex,z=Math.round(view.z/tex)*tex;
  sun.target.position.set(x,0,z);sun.position.set(x+SUN_DIR.x*320,SUN_DIR.y*320,z+SUN_DIR.z*320);
  const c=sun.shadow.camera;if(Math.abs(c.right-ext)>.5){c.left=c.bottom=-ext;c.right=c.top=ext;c.near=40;c.far=720;c.updateProjectionMatrix()}
}
function applyCam(dt){
  const k=Math.min(1,dt*9);view.x=lerp(view.x,view.tx,k);view.z=lerp(view.z,view.tz,k);view.d=lerp(view.d,view.td,k);
  quake*=Math.max(0,1-dt*6);const qx=quake?(Math.random()-.5)*quake:0,qz=quake?(Math.random()-.5)*quake:0;
  camera.position.set(view.x+qx,view.d*.82,view.z+view.d*.58+qz);camera.lookAt(view.x+qx,0,view.z+qz);followSun();
}
function size(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  ov.width=w*DPR;ov.height=h*DPR;oc.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',size);
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),groundP=new THREE.Plane(new THREE.Vector3(0,1,0),-1),hit=new THREE.Vector3();
// where a tap lands on the ground: start on the flat, then follow the hills so a tap on a raised spot hits that spot
function worldAt(sx,sy){ndc.set(sx/innerWidth*2-1,1-sy/innerHeight*2);ray.setFromCamera(ndc,camera);const o=ray.ray.origin,d=ray.ray.direction;
  if(d.y>-1e-4)return ray.ray.intersectPlane(groundP,hit)?{x:hit.x,z:hit.z}:null;
  const g=t=>o.y+d.y*t-Math.max(0,heightAt(o.x+d.x*t,o.z+d.z*t));     // above the ground while > 0
  let a=Math.max(0,(40-o.y)/d.y),b=(-1-o.y)/d.y;const N=40,st=(b-a)/N;let t0=a,hitT=b;
  for(let k=1;k<=N;k++){const t=a+st*k;if(g(t)<=0){let lo=t-st,hi=t;for(let i=0;i<7;i++){const m=(lo+hi)/2;if(g(m)>0)lo=m;else hi=m}hitT=hi;break}}
  return{x:o.x+d.x*hitT,z:o.z+d.z*hitT}}
const ptr=new Map();let press=null,pinch=0;
let lastDown={t:0,x:0,y:0},boxS=null,cmdDraft=null,tapT=0;
cv.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);press=ptr.size===1?{x:e.clientX,y:e.clientY,moved:false}:null;pinch=0;paintAt=null;
  {const t=now(),dbl=t-lastDown.t<330&&Math.hypot(e.clientX-lastDown.x,e.clientY-lastDown.y)<45;lastDown={t,x:e.clientX,y:e.clientY};
   if(ptr.size===1&&!build&&(aim==='sec'||(!aim&&dbl))){clearTimeout(tapT);press=null;cmdDraft=null;boxS={x0:e.clientX,y0:e.clientY,x1:e.clientX,y1:e.clientY};lastDown.t=0;return}
   if(ptr.size===1&&!build&&!aim&&SEL.length){const p=worldAt(e.clientX,e.clientY);cmdDraft=p?[clampV(p)]:null}
   if(ptr.size===2){boxS=null;cmdDraft=null}}
  if(ptr.size===1&&(build==='duvar'||build==='sil')){press=null;paintTo(e.clientX,e.clientY)}else if(ptr.size===1&&aim==='rota'){press=null;draft=[];drawRoute(e.clientX,e.clientY)}else if(ptr.size===2){paintAt=null;draft=null}});
cv.addEventListener('pointermove',e=>{
  const o=ptr.get(e.pointerId);
  if(!o){if(build||aim==='fuze')hover(e.clientX,e.clientY);return}
  const dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;
  if(boxS&&ptr.size===1){boxS.x1=e.clientX;boxS.y1=e.clientY;return}
  if(cmdDraft&&ptr.size===1&&press){if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;if(press.moved){const p=worldAt(e.clientX,e.clientY);if(p){const q=clampV(p),l=cmdDraft[cmdDraft.length-1];if(Math.hypot(q.x-l.x,q.z-l.z)>=4)cmdDraft.push(q)}}return}
  if(draft&&ptr.size===1){drawRoute(e.clientX,e.clientY);return}
  if(paintAt&&ptr.size===1){paintTo(e.clientX,e.clientY);if(build!=='sil')hover(e.clientX,e.clientY);return}
  if(ptr.size===2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)view.td=clamp(view.td*pinch/d,DMIN,DMAX);pinch=d;
    const s=view.d/innerHeight*1.3*.5;view.tx=clamp(view.tx-dx*s,-VIEW,VIEW);view.tz=clamp(view.tz-dy*s*1.25,-VIEW,VIEW);return}
  if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;
  if(press&&press.moved){const s=view.d/innerHeight*1.3;view.tx=clamp(view.tx-dx*s,-VIEW,VIEW);view.tz=clamp(view.tz-dy*s*1.25,-VIEW,VIEW)}
  if(build||aim==='fuze')hover(e.clientX,e.clientY);
});
const up=e=>{ptr.delete(e.pointerId);const pr=press;press=null;paintAt=null;
  try{
  if(boxS){const b=boxS;boxS=null;if(e.type==='pointerup')endBox(b);return}
  if(cmdDraft){const d=cmdDraft;cmdDraft=null;if(pr&&pr.moved&&e.type==='pointerup'&&d.length>1){order(d,[e.clientX,e.clientY]);return}}
  if(draft)endRoute(e.type==='pointerup');if(pr&&!pr.moved&&e.type==='pointerup')tap(e.clientX,e.clientY);
  }catch(err){oops(err)}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();view.td=clamp(view.td*(e.deltaY>0?1.12:.89),DMIN,DMAX)},{passive:false});
const keys=new Set();
addEventListener('keydown',e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'))return;const k=e.key.toLowerCase();keys.add(k);if(k==='h')toggleHud();if(k==='escape'){setBuild(null);setAim(null);pick(null);SEL=[];syncCmd()}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
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
  const p=worldAt(sx,sy);if(p&&aim==='fuze'){ring.visible=true;ring.position.set(p.x,Math.max(heightAt(p.x,p.z),0)+.4,p.z);ring.scale.setScalar(9);ring.material.color.set(fuzeTo(p)!=null?'#ff5a3a':'#888');return}
  if(p&&build==='kopru'&&fountainDown&&Math.hypot(p.x,p.z)<22){ring.visible=true;ring.position.set(0,1.2,0);ring.scale.setScalar(13);ring.material.color.set(ME.money>=PLAZA_COST?'#8dff9a':'#ff7a6a');return}
  if(p&&build==='kopru'&&DUEL){const i=duelBridgeAt(p);if(i>=0&&DBR[i].down){const b=DBR[i];ring.visible=true;ring.position.set((b.a.x+b.b.x)/2,1.2,(b.a.z+b.b.z)/2);ring.scale.setScalar(16);ring.material.color.set(ME.money>=DBR_FIX?'#8dff9a':'#ff7a6a');return}}
  if(p&&build==='kopru'){const b=bridgeSpot(p);ring.visible=true;ring.position.set(p.x,1.2,p.z);ring.scale.setScalar(6);ring.material.color.set(b&&ME.money>=BRIDGE_COST?'#8dff9a':'#ff7a6a');return}
  if(!p||!build||build==='sil')return;const x=snap(p.x),z=snap(p.z);
  ring.visible=true;ring.position.set(x,heightAt(x,z)+.4,z);ring.scale.setScalar(Math.max(2.5,TOWERS[build].menzil));ring.material.color.set(canBuild(ME,x,z,build)&&ME.money>=TOWERS[build].cost?'#8dff9a':'#ff7a6a');
}
// ---------- picking units and giving orders ----------
let SEL=[],selSeen=new Map(),cmdShow=null,infoU=null,infoT=0;
const clampV=p=>({x:Math.round(clamp(p.x,-VIEW,VIEW)),z:Math.round(clamp(p.z,-VIEW,VIEW))});
const URANGE={piyade:2.5,atli:2.5,koc:4.6,dalgic:12,balon:3,gemi:105,denizalti:34,ucak:6.5,fuze:9,isci:1.5};
function myUnits(){const out=[];for(const D of P){if(!D.on)continue;
  if(local(D)){for(const u of D.units)if(u.from===ME.seat&&CMDABLE.has(u.type)&&!u.ret&&!u.done&&u.fall==null&&u.hp>0&&u.dove==null)out.push({id:u.id,x:u.x,z:u.z,type:u.type,D})}
  else for(const[id,o]of D.remote)if(o.from===ME.seat&&CMDABLE.has(o.type)&&!(o.fl&2))out.push({id,x:o.x,z:o.z,type:o.type,D})}return out}
function scrOf(x,y,z){vp.set(x,y,z).project(camera);return vp.z>1?null:[(vp.x+1)/2*innerWidth,(1-vp.y)/2*innerHeight]}
function unitAtScreen(sx,sy){let best=null,bd=22;
  for(const D of P){if(!D.on)continue;const list=local(D)?D.units.filter(u=>!u.done&&u.fall==null&&u.dove==null).map(u=>({id:u.id,x:u.x,z:u.z,type:u.type,from:u.from,pct:u.hp/UNITS[u.type].hp,sim:D.seat,dir:u.dir})):[...D.remote].filter(([,o])=>!(o.fl&2)).map(([id,o])=>({id,x:o.x,z:o.z,type:o.type,from:o.from,pct:o.pct,sim:D.seat,dir:o.dir}));
    for(const c of list){if(c.type==='isci'&&c.from!==ME.seat)continue;if(c.type==='denizalti'&&!subSeen(c.x,c.z,num(c.from,D.seat)))continue;const q=scrOf(c.x,unitY(UNITS[c.type],c.x,c.z)+1.5,c.z);if(!q)continue;let d=Math.hypot(q[0]-sx,q[1]-sy);
      if(naval(c.type)){const L=c.type==='gemi'?8:5.5,a=c.dir||0,y=unitY(UNITS[c.type],c.x,c.z)+1.5,q1=scrOf(c.x+Math.sin(a)*L,y,c.z+Math.cos(a)*L),q2=scrOf(c.x-Math.sin(a)*L,y,c.z-Math.cos(a)*L);     // a warship is long: a tap anywhere on the hull counts
        if(q1&&q2){const vx=q2[0]-q1[0],vy=q2[1]-q1[1],l2=vx*vx+vy*vy||1,t=clamp(((sx-q1[0])*vx+(sy-q1[1])*vy)/l2,0,1);d=Math.min(d,Math.hypot(q1[0]+vx*t-sx,q1[1]+vy*t-sy)*.7)}}
      if(d<bd){bd=d;best=c}}}
  return best}
function unitInfo(c){
  const U=UNITS[c.type],r=URANGE[c.type]||3;infoU=c.id;infoT=5;ring2.visible=false;
  ring.visible=true;ring.position.set(c.x,Math.max(heightAt(c.x,c.z),0)+.4,c.z);ring.scale.setScalar(Math.max(2.5,r));ring.material.color.set(c.from===ME.seat?'#9df0b4':'#ff8a6a');
  const note=c.type==='gemi'?TL('kıyıdaki kuleleri uzaktan döver','shells coastal towers from afar'):c.type==='denizalti'?TL('kıyıya yakın dalar, balık adam çıkarır','dives near a shore and lands frogmen'):c.type==='dalgic'?TL('tüfekle uzaktan ateş eder','fires a rifle from range'):r<5?TL('yakın dövüş','melee'):'';
  tip(`${U.ad} · ${TL('Menzil','Range')} ${r}${note?' · '+note:''}${c.pct!=null?' · '+TL('Can','HP')+' %'+Math.round(clamp(c.pct,0,1)*100):''}`)}
function towerInfo(t){
  const T=TOWERS[t.type],r=T.menzil+(t.lvl-1)*3;infoU=null;infoT=t.owner===ME.seat?1e9:5;
  ring.visible=!T.duvar;ring.position.set(t.x,heightAt(t.x,t.z)+.4,t.z);ring.scale.setScalar(Math.max(2.5,r));ring.material.color.set(t.owner===ME.seat?'#fff':'#ff8a6a');
  ring2.visible=!!T.gemi;if(T.gemi){ring2.position.set(t.x,heightAt(t.x,t.z)+.45,t.z);ring2.scale.setScalar(shipR(t))}
  tip(T.duvar?`${T.ad} · ${TL('Dayanıklılık','Toughness')} ${maxHp(t)}`:`${T.ad} ${TL('Sv','Lv')}${t.lvl} · ${TL('Menzil','Range')} ${r} · ${TL('Hasar','Damage')} ${Math.round(T.dmg*(1+.6*(t.lvl-1)))}${T.gemi?' · '+TL('Gemilere','Ships')+' '+shipR(t)+TL(' (mavi halka)',' (blue ring)'):''}`)}
function syncCmd(){const n=SEL.length;$('cmdBar').hidden=!n||ME.dead||laneTo!=null||!$('rallyP').hidden;if(n)$('cmdTxt').textContent=innerWidth<620?(EN?`${n} picked · draw or tap`:`${n} seçili · çiz ya da dokun`):EN?`${n} selected · drag a path or tap a spot (enemy = attack, empty = wait)`:`${n} birlik seçili · yol çiz ya da bir yere dokun (düşman = saldır, boş yer = bekle)`}
function endBox(b){
  if(aim==='sec')setAim(null);
  const x0=Math.min(b.x0,b.x1),x1=Math.max(b.x0,b.x1),y0=Math.min(b.y0,b.y1),y1=Math.max(b.y0,b.y1);
  if(x1-x0<14&&y1-y0<14&&SEL.length){const p=worldAt(b.x1,b.y1);if(p)order([clampV(p)],[b.x1,b.y1]);return}   // a double tap with units picked is just an order
  if(x1-x0<14&&y1-y0<14){tip(TL('Seçmek için çift dokunup sürükleyerek kare çiz','Double-tap and drag to draw a box'));return}
  SEL=[];for(const c of myUnits()){const q=scrOf(c.x,unitY(UNITS[c.type],c.x,c.z)+1,c.z);if(q&&q[0]>=x0&&q[0]<=x1&&q[1]>=y0&&q[1]<=y1)SEL.push(c.id)}
  selSeen.clear();const t=now();for(const id of SEL)selSeen.set(id,t);syncCmd();
  tip(SEL.length?(EN?`${SEL.length} selected`:`${SEL.length} birlik seçildi`):TL('Karede senin birliğin yok','None of your units in the box'))}
// the finger lands near a tower or castle on screen: aim at that building, not at the ground behind it
function snapTarget(pts,scr){if(!pts||!scr)return pts;let best=null,bd=48;
  for(const D of P){if(D===ME||!D.on||D.dead||allied(D.seat,ME.seat))continue;
    for(const t of D.towers){if(t.type==='duvar')continue;const q=scrOf(t.x,heightAt(t.x,t.z)+3,t.z);if(!q)continue;const d=Math.hypot(q[0]-scr[0],q[1]-scr[1]);if(d<bd){bd=d;best=t}}
    const c=castlePos(D.seat),q=scrOf(c.x,heightAt(c.x,c.z)+10,c.z);if(q){const d=Math.hypot(q[0]-scr[0],q[1]-scr[1])*.55;if(d<bd){bd=d;best=c}}}
  if(best){pts=pts.slice();pts[pts.length-1]={x:Math.round(best.x),z:Math.round(best.z)}}return pts}
function order(pts,scr){
  if(!SEL.length)return;pts=snapTarget(pts,scr);const want=new Set(SEL),g=new Map();
  for(const c of myUnits())if(want.has(c.id)){if(!g.has(c.D))g.set(c.D,[]);g.get(c.D).push(c.id)}
  if(pts&&pts.length>18){const n=18,q=[];for(let i=0;i<n;i++)q.push(pts[Math.round(i*(pts.length-1)/(n-1))]);pts=q}
  for(const[D,ids]of g){if(local(D))applyCmd(D,ids,pts,ME.seat);else say('cmd',{to:D.seat,by:ME.seat,ids,p:pts?pts.map(p=>[p.x,p.z]):null})}
  if(pts){const e=pts[pts.length-1],R=P[seatAt(e.x,e.z)],foe=R&&R.on&&!R.dead&&!allied(R.seat,ME.seat);cmdShow={pts,t:3,col:foe?'#ff7a5a':'#9df0b4'};tip(foe?TL('Saldırı emri verildi','Attack order given'):TL('Gidip orada bekleyecekler','They will go and wait there'))}
  else tip(TL('Birlikler olduğu yerde bekliyor','Units are holding position'))}
// who can go for what: soldiers fight on foot (ships only from the shore), balloons bomb anything below them, warships shell anything afloat or on a shore
const canLock=(m,c)=>!flies(UNITS[c.type])&&(m==='balon'||m==='gemi'||fighter(m));
function lockOrder(c){
  const want=new Set(SEL),g=new Map(),pts=[{x:Math.round(c.x),z:Math.round(c.z)}];
  for(const m of myUnits())if(want.has(m.id)&&canLock(m.type,c)){if(!g.has(m.D))g.set(m.D,[]);g.get(m.D).push(m.id)}
  if(!g.size){tip(flies(UNITS[c.type])?TL('Uçanları sadece kuleler ve füze vurur','Only towers and missiles can hit fliers'):TL('Seçili birliklerin buna saldıramaz','Your picked units cannot attack that'));return}
  const at=c.sim!=null?c.sim:null;
  for(const[D,ids]of g){if(local(D))applyCmd(D,ids,pts,ME.seat,false,c.id,at);else say('cmd',{to:D.seat,by:ME.seat,ids,p:pts.map(p=>[p.x,p.z]),k:c.id,ks:at})}
  cmdShow={pts,t:2.5,col:'#ff5a3a',lock:c.id};tip(TL('Saldır! Birliklerin o düşmana kilitlendi','Attack! Your units are locked on that enemy'))}
// pull the picked units back to the muster field, where they heal
function orderRally(){
  if(!SEL.length)return;const want=new Set(SEL),g=new Map();
  for(const c of myUnits())if(want.has(c.id)&&!naval(c.type)){if(!g.has(c.D))g.set(c.D,[]);g.get(c.D).push(c.id)}
  for(const[D,ids]of g){if(local(D))applyCmd(D,ids,null,ME.seat,true);else say('cmd',{to:D.seat,by:ME.seat,ids,p:null,r:1})}
  cmdShow={pts:[RALLY[ME.seat]],t:3,col:'#9df0b4'};tip(TL('Birlik alanına dönüyorlar, orada yavaş yavaş iyileşecekler','Heading back to the muster field to heal'));SEL=[];syncCmd()}
// the army panel: how many of each kind to send from the muster field
const RSEL={piyade:0,atli:0,koc:0,balon:0};
function mkRally(){const p=$('rallyP');p.textContent='';
  const top=document.createElement('div');top.id='rTop';p.append(top);
  for(const k in RSEL){const r=document.createElement('div');r.className='rrow';r.dataset.k=k;
    const n=document.createElement('span');n.className='rn';const m=document.createElement('button');m.textContent='−';const c=document.createElement('b');const pl=document.createElement('button');pl.textContent='+';const al=document.createElement('button');al.textContent=TL('Hepsi','All');
    m.onclick=()=>{RSEL[k]=Math.max(0,RSEL[k]-1);drawRally()};pl.onclick=()=>{RSEL[k]++;drawRally()};al.onclick=()=>{RSEL[k]=1e3;drawRally()};r.append(n,m,c,pl,al);p.append(r)}
  const f=document.createElement('div');f.className='rfoot';
  const go=document.createElement('button');go.className='go';go.textContent=TL('Seç ve gönder','Pick and send');go.onclick=()=>{const R=atRally(),ids=[];for(const k in RSEL)for(const u of R[k].slice(0,RSEL[k]))ids.push(u.id);
    if(!ids.length){tip(TL('Birlik alanında seçili asker yok','No troops picked on the muster field'));return}
    SEL=ids;selSeen.clear();const t=now();for(const id of ids)selSeen.set(id,t);openRally(false);syncCmd();tip(EN?`${ids.length} picked: draw a path or tap an enemy tower or castle`:`${ids.length} asker seçildi: yol çiz ya da düşman kulesine / kalesine dokun`)};
  const all=document.createElement('button');all.textContent=TL('Hepsini seç','Pick all');all.onclick=()=>{for(const k in RSEL)RSEL[k]=1e3;drawRally()};
  const x=document.createElement('button');x.textContent=TL('Kapat','Close');x.onclick=()=>openRally(false);
  f.append(all,go,x);p.append(f)}
function openRally(on){$('rallyP').hidden=!on;syncCmd();if(on){const R=atRally();for(const k in RSEL)RSEL[k]=R[k].length;drawRally();view.tx=RALLY[ME.seat].x;view.tz=RALLY[ME.seat].z;view.td=Math.min(view.td,120)}}
function drawRally(){const p=$('rallyP');if(p.hidden)return;const R=atRally();
  for(const r of p.querySelectorAll('.rrow')){const k=r.dataset.k,have=R[k].length;RSEL[k]=clamp(RSEL[k],0,have);r.querySelector('.rn').textContent=UNITS[k].ad;r.querySelector('b').textContent=`${RSEL[k]} / ${have}`;r.classList.toggle('none',!have)}
  const q=TQ.length?(EN?` · training ${TQ.length}`:` · eğitimde ${TQ.length}`):'';$('rTop').textContent=(EN?`Army ${popOf(ME.seat)}/${POP_CAP}`:`Ordu ${popOf(ME.seat)}/${POP_CAP}`)+q}
// the bomber's run: across the top, the middle or the bottom of the enemy island
let laneTo=null;
function laneAsk(to){laneTo=to;$('laneBar').hidden=to==null;syncCmd();if(to!=null){setAim(null);setBuild(null);const c=castlePos(to);view.tx=c.x;view.tz=c.z;view.td=Math.max(view.td,170)}}
function laneLine(to,l){const a=castlePos(ME.seat),b=castlePos(to),side=Math.sign(b.x-a.x)||-SX[to],z=laneZ(to,l);return[{x:b.x-side*75,z},{x:b.x+side*80,z}]}
function tap(sx,sy){
  const p=worldAt(sx,sy);if(!p||ME.dead)return;
  if(aim==='fuze'){const c=unitAtScreen(sx,sy);fireAt(c&&!allied(c.from,ME.seat)&&c.type!=='isci'&&c.type!=='fuze'?c:p,!!c&&!allied(c.from,ME.seat)&&c.type!=='isci'&&c.type!=='fuze');return}
  if(aim==='rota')return;
  if(!build){const c=unitAtScreen(sx,sy);
    if(c&&SEL.length&&!allied(c.from,ME.seat)&&c.type!=='isci'){lockOrder(c);return}   // picked units go for the enemy tapped
    if(c&&!(SEL.length&&c.from!==ME.seat)){if(c.from===ME.seat&&CMDABLE.has(c.type)){SEL=[c.id];selSeen.clear();selSeen.set(c.id,now());syncCmd()}pick(null);unitInfo(c);return}
    if(SEL.length){clearTimeout(tapT);const q=clampV(p);tapT=setTimeout(()=>order([q],[sx,sy]),320);return}}
  for(const D of P)if(D.on&&D!==ME&&!D.dead&&!build){const c=castlePos(D.seat);if(Math.hypot(p.x-c.x,p.z-c.z)<16){setTarget(D.seat);return}}
  if(build==='sil'){eraseAt(p.x,p.z);return}
  if(build==='kopru'&&fountainDown&&Math.hypot(p.x,p.z)<22){if(ME.money<PLAZA_COST){tip((EN?`Repairing the plaza costs ${PLAZA_COST} gold`:`Meydanı onarmak: ${PLAZA_COST} {au}`));return}ME.money-=PLAZA_COST;repairPlaza();setBuild(null);return}
  if(build==='kopru'&&DUEL){const i=duelBridgeAt(p);if(i>=0&&DBR[i].down){if(ME.money<DBR_FIX){tip((EN?`Rebuilding costs ${DBR_FIX} gold`:`Onarmak: ${DBR_FIX} {au}`));return}ME.money-=DBR_FIX;fixDuelBridge(i);setBuild(null);return}}
  if(build==='kopru'){const b=bridgeSpot(p);
    if(!b)tip(TL('Köprü için nehrin üstüne dokun (ortadan biraz uzakta)','Tap on the river to build a bridge (a bit away from the middle)'));
    else if(seatAt(b.a.x,b.a.z)!==ME.seat&&seatAt(b.b.x,b.b.z)!==ME.seat)tip(TL('Köprü bir ucuyla senin kıyına değmeli','One end of the bridge must touch your shore'));
    else if(ME.money<BRIDGE_COST)tip(TL('Altının yetmiyor','Not enough gold'));
    else{ME.money-=BRIDGE_COST;addBridge(A.seat+'k'+(uid++),b.a,b.b,ME.seat);SES.para();explode(p.x,p.z,.6);setBuild(null);tip(TL('Köprü kuruldu. Askerler kısa yoldan geçer.','Bridge built. Troops take the shortcut.'))}
    return}
  if(build){
    let x=snap(p.x),z=snap(p.z);
    // a finger is wider than the grid: if the exact spot is taken, use the nearest free one right next to it
    if(TOWERS[build]&&!canBuild(ME,x,z,build)){const st=build==='duvar'?WALL:1;let bd=1e9;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]){const X=snap(p.x+dx*st),Z=snap(p.z+dz*st);if(canBuild(ME,X,Z,build)){const d=Math.hypot(X-p.x,Z-p.z);if(d<bd){bd=d;x=X;z=Z}}}}
    if(ME.money<TOWERS[build].cost)tip(TL('Altının yetmiyor','Not enough gold'));
    else if(!addTower(ME,build,x,z))tip(TL('Buraya kurulamaz. Kendi bölgende, yolun ve kıyının dışında bir yer seç.',"Can't build here. Pick a spot in your area, off the road and shore."));
    if(TOWERS[build]&&ME.money<TOWERS[build].cost)setBuild(null);
    return}
  let best=null,bd=4.5;for(const t of ME.towers){const d=Math.hypot(t.x-p.x,t.z-p.z);if(d<bd){bd=d;best=t}}
  pick(best);if(best)return;
  for(const D of P){if(D===ME||!D.on||D.dead)continue;for(const t of D.towers){const d=Math.hypot(t.x-p.x,t.z-p.z);if(d<bd){bd=d;best=t}}}
  if(best)towerInfo(best);
}
// a missile can land anywhere on the map, sea, fountain and bridges included
function fuzeTo(p){
  if(Math.max(Math.abs(p.x),Math.abs(p.z))>VIEW)return null;
  const R=P[seatAt(p.x,p.z)];if(R&&R!==ME&&allied(R.seat,ME.seat)&&R.on&&!R.dead)return null;
  return R&&R.on&&!R.dead&&R!==ME?R.seat:ME.seat;
}
function fireAt(p,locked){
  // tapped on an enemy unit: the missile locks on and follows it, at sea or on the move
  const to=locked&&P[p.sim]&&P[p.sim].on&&!P[p.sim].dead?p.sim:fuzeTo(p);if(to==null){tip(TL('Müttefikine füze atamazsın',"You can't fire at an ally"));return}
  const x=Math.round(p.x),z=Math.round(p.z);
  if(!sendUnit(ME,to,'fuze',locked?{at:[x,z],lock:p.id}:{at:[x,z]})){tip(TL('Altının yetmiyor','Not enough gold'));setAim(null);return}
  tutFlags.fuze=1;const c=castlePos(ME.seat);if(!locked)marks.push({x,z,t:Math.hypot(x-c.x,z-c.z)/UNITS.fuze.sp});else cmdShow={pts:[{x,z}],t:2.5,col:'#ff5a3a',lock:p.id};setAim(null);
  tip(locked?(EN?`Missile locked on the ${UNITS[p.type].ad}!`:`Füze ${UNITS[p.type].ad} hedefine kilitlendi!`):TL('Füze yolda!','Missile on its way!'));
}
// the route: drag a line, and every soldier and rider sent afterwards follows it
const clampPt=p=>({x:Math.round(clamp(p.x,-L,L)),z:Math.round(clamp(p.z,-L,L))});
function tidyRoute(pts){
  const m=navMask(),dry=pts.filter(p=>m[clamp(Math.round((p.x+L)/NC),0,NN-1)+clamp(Math.round((p.z+L)/NC),0,NN-1)*NN]);
  if(dry.length<2)return dry.length?[dry[0],{x:dry[0].x+.01,z:dry[0].z}]:[pts[0],{x:pts[0].x+.01,z:pts[0].z}];
  let out=(navRoute(dry)||[]).filter(Boolean);if(out.length<2)return[pts[0],{x:pts[0].x+.01,z:pts[0].z}];
  for(let pass=0;pass<3;pass++){const k=[out[0]];for(let i=1;i<out.length-1;i++){const a=k[k.length-1],b=out[i+1],c=out[i];
      if(clearLine(m,a,b)&&segD(c.x,c.z,{a,b})<7)continue;k.push(c)}k.push(out[out.length-1]);out=k}
  return out;
}
function routeFor(k,to){
  if(!route)return undefined;const via=k==='atli'?route:tidyRoute([castlePos(ME.seat),...route,castlePos(to)]).slice(1,-1);
  return{via:via.slice(0,48).map(p=>[Math.round(p.x),Math.round(p.z)])};
}
function drawRoute(sx,sy){
  const p=worldAt(sx,sy);if(!p||!draft)return;const q=clampPt(p),e=draft[draft.length-1];
  if(!e||Math.hypot(q.x-e.x,q.z-e.z)>=4)draft.push(q);
}
function endRoute(ok){
  const d=draft;draft=null;if(!ok||!d||d.length<2){if(ok)tip(TL('Rota için parmağını veya fareyi sürükle','Drag your finger or mouse to draw a route'));return}
  const n=Math.min(14,d.length),pts=[];for(let i=0;i<n;i++)pts.push(d[Math.round(i*(d.length-1)/Math.max(1,n-1))]);
  route=pts;const e=pts[pts.length-1],R=P[seatAt(e.x,e.z)];if(R&&R.on&&!R.dead&&R!==ME)setTarget(R.seat);
  setAim(null);tip(TL('Rota hazır. Askerler, atlılar ve uçaklar bu yoldan gider.','Route ready. Troops, riders and planes will follow it.'));
}
function setAim(k){
  aim=k;draft=null;ring.visible=false;ring2.visible=false;if(k){setBuild(null);pick(null);if(k!=='sec'){view.tx=0;view.tz=0;view.td=Math.max(view.td,DMAX*.8)}}
  $('aimBar').hidden=!k;if(k)$('aimTxt').textContent=k==='fuze'?TL('FÜZE: Bir yere ya da düşman birliğine dokun (birliğe kilitlenir)','MISSILE: tap a spot, or an enemy unit to lock on'):k==='sec'?TL('SEÇ: birliklerinin etrafına sürükleyerek kare çiz','SELECT: drag a box around your units'):TL('ROTA: Askerlerin ve uçakların gideceği yolu parmağınla çiz','ROUTE: draw the path for troops and planes');
  const f=$('gAtk').querySelector('[data-k=fuze]');if(f)f.classList.toggle('on',k==='fuze');
  {const s=$('bSec');if(s)s.classList.toggle('on',k==='sec')}const b=$('bRota');if(b){b.classList.toggle('on',k==='rota');b.innerHTML=k==='rota'?TL('Vazgeç<small>rota</small>','Cancel<small>route</small>'):route?TL('Rotayı sil<small>asker</small>','Clear route<small>troops</small>'):TL('Rota çiz<small>asker</small>','Draw route<small>troops</small>')}
}
function pick(t){picked=t;if(!t){ring.visible=build?ring.visible:false;ring2.visible=false;infoU=null}$('sel').hidden=!t;if(t)towerInfo(t)}

// ---------- settings ----------
function setGfx(m){if(!GFX[m])return;gfxMode=m;try{localStorage.setItem('cephe_gfx',m)}catch(e){}const G=GFX[m];DPR0=DPR=Math.min(G.dpr[SMALL?0:1],devicePixelRatio||1);renderer.setPixelRatio(DPR);size();sun.castShadow=G.sh;sun.shadow.needsUpdate=true;frameCap=G.cap;drawSettings()}
// a new match with the same players: everyone's screen reloads straight into it
function bye(){SES.pause();setTimeout(()=>location.reload(),160)}
function restartWith(m){try{sessionStorage.setItem('cephe_auto',JSON.stringify({m,id:A.id}))}catch(e){}beat(true);SES.pause();setTimeout(()=>location.reload(),350)}
function newMatch(){const m={room:'r'+Math.random().toString(36).slice(2,12),players:A.players,duel:DUEL,tutorial:TUT};say('yenimac',{m,by:ME.seat});tip(TL('Yeni maç başlıyor…','A new match is starting…'));restartWith(m)}
function onNewMatch(x){if(!x||!x.m||!Array.isArray(x.m.players)||!x.m.players.some(p=>p&&p.id===A.id)||typeof x.m.room!=='string')return;const by=clamp(num(x.by,0),0,3);
  tip((P[by]?P[by].name:'')+TL(' yeni maç başlattı',' started a new match'));restartWith({room:x.m.room.slice(0,40),players:x.m.players.slice(0,4),duel:!!x.m.duel,tutorial:false})}
let setSure=null;
function drawSettings(){const p=$('setP');if(p.hidden)return;
  $('setNew').textContent=setSure==='new'?TL('Emin misin? Başlat','Sure? Start it'):TL('Yeni maç (baştan)','New match (restart)');
  $('setQuit').textContent=setSure==='quit'?TL('Emin misin? Çık','Sure? Leave'):TL('Ana menüye dön','Back to main menu');
  for(const b of p.querySelectorAll('[data-g]'))b.classList.toggle('on',b.dataset.g===gfxMode)}
function mkSettings(){
  const p=$('setP'),open=on=>{p.hidden=!on;setSure=null;$('helpP').hidden=true;if(on){$('sesP').hidden=true;$('chatP').hidden=true}document.body.classList.toggle('chatting',on);drawSettings()};
  $('setB').onclick=()=>open(p.hidden);$('setX').onclick=()=>open(false);
  $('setNew').onclick=()=>{if(setSure!=='new'){setSure='new';drawSettings();return}open(false);newMatch()};
  $('setQuit').onclick=()=>{if(setSure!=='quit'){setSure='quit';drawSettings();return}beat(true);bye()};
  $('setSes').onclick=()=>{open(false);$('sesP').hidden=false};
  $('setHelp').onclick=()=>{p.hidden=true;$('helpP').hidden=false};$('helpX').onclick=()=>{$('helpP').hidden=true;document.body.classList.remove('chatting')};
  for(const b of p.querySelectorAll('[data-g]'))b.onclick=()=>setGfx(b.dataset.g);
  $('helpT').innerHTML='';const L=EN?[
   ['Camera','Drag with one finger to move, pinch to zoom. "My base" and "Whole map" jump the view.'],
   ['Defense','Pick a tower, then tap your own land. Tap a tower to upgrade or remove it.'],
   ['Army','Attack → train troops. They wait on the flagged field in front of your castle and heal there.'],
   ['Send','Army → Pick and send, then tap an enemy tower or castle, or draw a path with your finger.'],
   ['Select','Double-tap and drag a box round your units. Tap one unit to pick just that one.'],
   ['Lock on','With units picked, tap an enemy soldier, ship or submarine: they go for it. "To muster" pulls them back to heal.'],
   ['Missile','Missile → tap a spot, or tap an enemy unit and it follows it.'],
   ['Ships','Shipyard first, then Ship. Tap your ship and draw where it goes, or tap an enemy to fight it.'],
   ['Bomber','Runway first, then Plane, and pick one of the runs 1-6 over the enemy base.']]:[
   ['Kamera','Bir parmakla kaydır, iki parmakla yakınlaştır. "Üssüm" ve "Tüm harita" görüntüyü taşır.'],
   ['Savunma','Bir kule seç, sonra kendi toprağına dokun. Kuleye dokunup yükseltebilir ya da silebilirsin.'],
   ['Ordu','Saldırı → asker eğit. Askerler kalenin önündeki bayraklı alanda bekler ve orada iyileşir.'],
   ['Gönder','Birlik → Seç ve gönder, sonra düşman kulesine ya da kalesine dokun ya da parmağınla yol çiz.'],
   ['Seçmek','Çift dokunup sürükleyerek birliklerinin etrafına kare çiz. Tek birliğe dokunursan sadece onu seçersin.'],
   ['Kilitlen','Birlik seçiliyken düşman askerine, gemisine ya da denizaltısına dokun: ona saldırırlar. "Birliğe dön" geri çekip iyileştirir.'],
   ['Füze','Füze → bir yere ya da düşman birliğine dokun; birliğe dokunursan peşinden gider.'],
   ['Gemi','Önce Tersane, sonra Gemi. Gemine dokunup yol çiz ya da bir düşmana dokunup onunla savaştır.'],
   ['Uçak','Önce Pist, sonra Uçak ve düşman üssünün üstündeki 1-6 hatlardan birini seç.']];
  for(const[h,t]of L){const d=document.createElement('div'),b=document.createElement('b');b.textContent=h+': ';d.append(b,document.createTextNode(t));$('helpT').append(d)}
  $('setP').append($('bSes'));$('bSes').hidden=true}
// ---------- chat ----------
// everyone, your allies only, or one player in private; plain text, kept short
let chatN=0,chatLast=0;
function chatTargets(){const sel=$('chatTo'),cur=sel.value;sel.textContent='';const opt=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;sel.append(o)};
  opt('all',TL('Herkese','Everyone'));if(P.some(D=>D.on&&D!==ME&&allied(D.seat,ME.seat)))opt('ally',TL('İttifaka','Allies'));
  for(const D of P)if(D.on&&D!==ME&&!D.bot)opt(String(D.seat),TL('Özel: ','Private: ')+D.name);
  if([...sel.options].some(o=>o.value===cur))sel.value=cur}
function chatShow(from,to,txt,sys){const log=$('chatLog'),d=document.createElement('div');
  if(sys){d.className='sys';d.textContent=txt}
  else{const n=document.createElement('b');n.style.color=TEAM[from];n.textContent=(P[from]?P[from].name:'?')+(to==='ally'?TL(' (ittifak)',' (allies)'):typeof to==='number'?(from===ME.seat?' → '+(P[to]?P[to].name:'?'):TL(' (özel)',' (private)')):'')+': ';d.append(n,document.createTextNode(txt))}
  log.append(d);while(log.children.length>60)log.firstChild.remove();log.scrollTop=log.scrollHeight;
  if($('chatP').hidden&&!sys&&from!==ME.seat){chatN++;chatBadge();tip((P[from]?P[from].name:'')+': '+txt.slice(0,60))}}
function chatBadge(){const b=$('chatB');let i=b.querySelector('i');if(!chatN){if(i)i.remove();return}if(!i){i=document.createElement('i');b.append(i)}i.textContent=chatN>9?'9+':chatN}
function chatSend(){const inp=$('chatIn'),txt=inp.value.replace(/\s+/g,' ').trim().slice(0,120);if(!txt)return;const t=now();if(t-chatLast<700)return;chatLast=t;inp.value='';
  const v=$('chatTo').value,to=v==='all'||v==='ally'?v:clamp(num(+v,-1),-1,3);if(to===-1)return;
  chatShow(ME.seat,to,txt);if(P.every(p=>!p.on||p===ME||p.bot))chatShow(0,0,TL('(Yapay zekalar sohbete katılmaz)','(Computer players do not chat)'),true);else say('chat',{from:ME.seat,to,txt})}
function onChat(m){if(!m||typeof m.txt!=='string')return;const from=clamp(num(m.from,-1),-1,3);if(from<0||!P[from]||!P[from].on||from===ME.seat)return;const txt=m.txt.replace(/\s+/g,' ').trim().slice(0,120);if(!txt)return;
  const to=m.to==='all'||m.to==='ally'?m.to:num(m.to,-1);
  if(to==='ally'&&!allied(from,ME.seat))return;if(typeof to==='number'&&to!==ME.seat)return;chatShow(from,to,txt)}
function mkChat(){
  const chatOpen=on=>{const p=$('chatP');p.hidden=!on;document.body.classList.toggle('chatting',on);if(on){chatTargets();chatN=0;chatBadge();const l=$('chatLog');l.scrollTop=l.scrollHeight}else $('chatIn').blur()};
  $('chatB').onclick=()=>chatOpen($('chatP').hidden);$('chatX').onclick=()=>chatOpen(false);
  $('chatGo').onclick=chatSend;$('chatIn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();chatSend()}if(e.key==='Escape')chatOpen(false)});
  for(const ev of['pointerdown','touchstart','wheel'])$('chatP').addEventListener(ev,e=>e.stopPropagation(),{passive:true});
  chatShow(0,0,TL('Sohbet: herkese, ittifakına ya da bir oyuncuya özel yazabilirsin.','Chat: write to everyone, your allies, or one player in private.'),true)}
// ---------- hud ----------
function setTarget(s){target=s;for(const b of $('gTgt').querySelectorAll('button'))b.classList.toggle('on',+b.dataset.s===s);if(s!=null)tip(TL('Hedef: ','Target: ')+P[s].name)}
function liveTarget(){if(target!=null&&!P[target].dead)return target;const f=P.find(p=>p.on&&!p.dead&&!allied(p.seat,ME.seat));setTarget(f?f.seat:null);return target}
function toggleHud(){const off=document.body.classList.toggle('nohud');$('eye').textContent=off?'🙈':'👁'}
let moneyShown=null;
// a tip may carry {au}: the gold coin
function tip(m){const el=$('tip');el.textContent='';String(m).split('{au}').forEach((t,i)=>{if(i){const c=document.createElement('i');c.className='au';el.append(c)}el.append(t)});el.hidden=false;tipT=3}
function setBuild(k){if(k&&aim)setAim(null);build=k;for(const b of $('gDef').querySelectorAll('button'))b.classList.toggle('on',b.dataset.k===k);ring.visible=false;if(k){pick(null);tip(k==='kopru'?(DUEL&&DBR.some(b=>b.down)?(EN?`Bridge: tap the river, or tap a fallen stone bridge to rebuild it (${DBR_FIX} gold)`:`Köprü: nehrin üstüne dokun ya da yıkık taş köprüye dokunup onar (${DBR_FIX} {au})`):fountainDown?(EN?`Bridge: tap the river. Tap the middle to repair the plaza (${PLAZA_COST} gold)`:`Köprü: nehrin üstüne dokun. Yıkık meydanı onarmak için ortaya dokun (${PLAZA_COST} {au})`):TL('Köprü: nehrin üstünde bir yere dokun','Bridge: tap a spot on the river')):k==='sil'?TL('Silmek için yapılara dokun veya üstünden sürükle. Altının yarısı geri gelir.','Tap or drag over buildings to remove them. You get half back.'):k==='duvar'?TL('Parmağını veya fareyi sürükleyerek sıra sıra duvar çek','Drag to lay a line of walls'):TOWERS[k].ad+TL(': yerleştirmek için kendi bölgene dokun',': tap your area to place it'))}}
function mkHud(){
  for(const k of TKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=(EN?`${TOWERS[k].ad.split(' ')[0]}<small>${TOWERS[k].cost}<i class="au"></i></small>`:`${TOWERS[k].ad.split(' ')[0]}<small>${TOWERS[k].cost}<i class="au"></i></small>`);b.title=k==='roket'?TL('Güdümlü roket atar: uçağa, balona ve füzeye kilitlenir','Fires guided rockets: locks onto planes, balloons and missiles'):k==='hava'?TL('Balon, füze ve uçakları vurur','Shoots balloons, missiles and planes'):k==='top'?TL('Yerdeki askerleri ve uzaktaki savaş gemilerini vurur','Hits ground troops and distant warships'):TL('Yerdeki ve sudaki askerleri vurur','Hits troops on land and in water');b.onclick=()=>setBuild(build===k?null:k);$('gDef').append(b)}
  {const b=document.createElement('button');b.dataset.k='sil';b.innerHTML=TL('Sil<small>yarısı geri</small>','Remove<small>half back</small>');b.onclick=()=>setBuild(build==='sil'?null:'sil');$('gDef').append(b)}
  {const b=document.createElement('button');b.dataset.k='kopru';b.title=TL('Nehrin üstüne köprü kurar. Füzeyle yıkılabilir.','Builds a bridge over the river. Missiles can destroy it.');b.innerHTML=(EN?`Bridge<small>${BRIDGE_COST}<i class="au"></i></small>`:`Köprü<small>${BRIDGE_COST}<i class="au"></i></small>`);b.onclick=()=>setBuild(build==='kopru'?null:'kopru');$('gDef').append(b)}
  {const b=document.createElement('button');b.id='bTersane';b.title=TL('Limana tersane kurar. Gemi ve denizaltı yapmak için gerekir.','Builds a shipyard at your dock. Needed for ships and submarines.');b.onclick=()=>{if(ME.ysState===2){tip(TL('Tersane hazır','Shipyard ready'));return}if(ME.ysState===1){tip(TL('Tersane yapılıyor','Shipyard under construction'));return}if(buildYard(ME)){tip((EN?`Building shipyard: ${YARD_T} s`:`Tersane yapılıyor: ${YARD_T} sn`));view.tx=DOCK[ME.seat].land.x;view.tz=DOCK[ME.seat].land.z;view.td=Math.min(view.td,110)}else tip(TL('Altının yetmiyor','Not enough gold'))};$('gDef').append(b)}
  {const b=document.createElement('button');b.id='bPist';b.title=TL('Üssündeki ayrılmış alana pist yapar. Uçak göndermek için gerekir.','Builds a runway on your reserved strip. Needed to send planes.');b.onclick=()=>{if(!RWY[ME.seat]){tip(TL('Bu üste pist alanı yok','This base has no runway site'));return}if(ME.rwState===2){tip(TL('Pist hazır','Runway ready'));return}if(ME.rwState===1){tip(TL('Pist yapılıyor','Runway under construction'));return}if(buildRunway(ME)){tip((EN?`Building runway: ${RUNWAY_T} s`:`Pist yapılıyor: ${RUNWAY_T} sn`));view.tx=RWY[ME.seat].c.x;view.tz=RWY[ME.seat].c.z;view.td=Math.min(view.td,120)}else tip(TL('Altının yetmiyor','Not enough gold'))};$('gDef').append(b)}
  for(const k of BUY){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=(EN?`${UNITS[k].kisa||UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost}<i class="au"></i></small>`:`${UNITS[k].kisa||UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost}<i class="au"></i></small>`);
    b.title=k==='gemi'?TL('Tersanede 20 saniyede yapılır, sonra limanda bekler. Gemiye dokunup yol çiz: düşmana dokunursan oraya menzili yetince ateş eder, boş denize dokunursan orada bekler. Düşman gemisini görünce savaşır.','Built in the shipyard in 20 s, then waits at the dock. Tap it and draw a path: tap an enemy to shell it once in range, or open sea to wait there. Fights enemy ships it meets.'):k==='ucak'?TL('Önce düşman üssünün üstündeki 1-6 hatlardan birini seç. Uçak yapılır, kendi kalkar, o hattı bombalar ve döner.','Pick one of the runs 1-6 over the enemy base. The bomber is built, takes off by itself, bombs that run and flies home.'):POP[k]?(EN?`Trained in ${TRAIN[k]} s, then waits on your muster field. Army → pick how many, then draw a path or tap a target.`:`${TRAIN[k]} saniyede eğitilir, sonra birlik alanında bekler. Birlik → kaç tane gideceğini seç, sonra yol çiz ya da hedefe dokun.`):{deniz:TL('Tersanede 16 saniyede hazırlanır. Denizden dolanır, üssün arkasından taramalı silahlı 10 balık adam çıkarır.','Ready in the shipyard in 16 s. Sails around and lands 10 armed frogmen behind the base.'),kara:TL('Yoldan gider. Rota çizersen o yoldan gider.','Follows the road, or your drawn route.'),su:TL('Sudan kestirme gider. Rota çizersen o yoldan gider.','Takes a shortcut through water, or your drawn route.'),hava:TL('Uçar, kuleleri bombalar. Düşerken düştüğü yere hasar verir.','Flies over and bombs towers. Damages where it crashes.'),fuze:TL('Haritada seçtiğin yere gider. Sadece hava savunması düşürür.','Flies to the spot you pick. Only air defense can stop it.')}[UNITS[k].yol];
    b.onclick=()=>{if(k==='fuze'){if(ME.fcd>0){tip(EN?`Missile reloading: ${Math.ceil(ME.fcd)} s`:`Füze dolduruluyor: ${Math.ceil(ME.fcd)} sn`);return}setAim(aim==='fuze'?null:'fuze');return}
      if(POP[k]){trainBuy(k);return}
      const to=liveTarget();if(to==null)return;if(allied(ME.seat,to)){tip(TL('Müttefikine saldıramazsın',"You can't attack an ally"));return}
      if(k==='denizalti'||k==='gemi'){if(ME.ysState!==2){tip(ME.ysState===1?TL('Tersane yapılıyor, biraz bekle','Shipyard is being built, wait a bit'):TL('Önce tersane yap (Savunma → Tersane)','Build a shipyard first (Defense → Shipyard)'));return}if(k==='gemi'&&fleet(ME.seat)>=MAX_SHIPS){tip(EN?`At most ${MAX_SHIPS} warships at a time`:`Sahada en fazla ${MAX_SHIPS} gemi olabilir`);return}if(ME.yard){tip(TL('Tersane meşgul','Shipyard busy'));return}if(sendUnit(ME,to,k)){tip((EN?`${UNITS[k].kisa||UNITS[k].ad} in the shipyard: ${BUILD_T[k]} s`:`${UNITS[k].kisa||UNITS[k].ad} tersanede yapılıyor: ${BUILD_T[k]} sn`));view.tx=DOCK[ME.seat].land.x;view.tz=DOCK[ME.seat].land.z;view.td=Math.min(view.td,110)}else tip(TL('Altının yetmiyor','Not enough gold'));return}
      if(k==='ucak'){if(ME.rwState!==2){tip(RWY[ME.seat]?(ME.rwState===1?TL('Pist yapılıyor, biraz bekle','Runway is being built, wait a bit'):TL('Önce pist yap (Savunma → Pist)','Build a runway first (Defense → Runway)')):TL('Bu üste pist alanı yok','This base has no runway site'));return}
        if(ME.hg){tip(TL('Uçak yapılıyor, biraz bekle','A bomber is being built, wait a bit'));return}if(ME.money<UNITS.ucak.cost){tip(TL('Altının yetmiyor','Not enough gold'));return}laneAsk(to);return}
      if(!sendUnit(ME,to,k))tip(TL('Altının yetmiyor','Not enough gold'));else tip(`${UNITS[k].ad} → ${P[to].name}`)};$('gAtk').append(b)}
  {const b=document.createElement('button');b.id='bSec';b.title=TL('Sahadaki birliklerini kareyle seç, sonra yol çizerek götür. Kısayol: haritaya çift dokunup sürükle.','Box-select your units in the field, then drag a path to lead them. Shortcut: double-tap the map and drag.');b.innerHTML=TL('Seç<small>birlik</small>','Select<small>units</small>');b.onclick=()=>setAim(aim==='sec'?null:'sec');$('gAtk').append(b)}
  {const b=document.createElement('button');b.id='bBirlik';b.title=TL('Birlik alanında bekleyen askerlerin: kaçını göndereceğini seç, sonra yol çiz ya da hedefe dokun.','Troops waiting on your muster field: pick how many to send, then draw a path or tap a target.');b.innerHTML=TL('Birlik<small>gönder</small>','Army<small>send</small>');b.onclick=()=>openRally($('rallyP').hidden);$('gAtk').append(b)}
  mkChat();mkSettings();mkRally();$('laneX').onclick=()=>laneAsk(null);for(const b of $('laneBar').querySelectorAll('[data-l]'))b.onclick=()=>{const l=+b.dataset.l,to=laneTo;laneAsk(null);if(to==null)return;if(sendUnit(ME,to,'ucak',{lane:l}))tip(EN?`Building a bomber: ${PLANE_T} s, then it takes off to bomb run ${l+1}`:`Uçak yapılıyor: ${PLANE_T} sn, sonra ${l+1}. hattı bombalamaya kalkar`);else tip(TL('Altının yetmiyor','Not enough gold'))}
  $('cmdHome').onclick=orderRally;
  for(const D of P){if(!D.on||D===ME)continue;const b=document.createElement('button');b.dataset.s=D.seat;b.textContent=D.name;b.style.borderBottom='4px solid '+TEAM[D.seat];b.onclick=()=>setTarget(D.seat);$('gTgt').append(b)}
  for(const[k,ad]of[['muzik',TL('Müzik','Music')],['okcu',TL('Ok ve silah','Arrows & guns')],['atli',TL('Atlı','Riders')],['bomba',TL('Bomba','Bombs')],['su',TL('Su','Water')]]){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='s_'+k;c.checked=SES.ayar[k];c.onchange=()=>SES.set(k,c.checked);l.append(c,' '+ad);$('sesP').append(l)}
  $('bSes').onclick=()=>{$('sesP').hidden=!$('sesP').hidden};
  const wake=()=>SES.init();addEventListener('pointerdown',wake);addEventListener('keydown',wake);
  document.body.dataset.tab='d';$('tabD').onclick=()=>{document.body.dataset.tab='d';setAim(null)};$('tabA').onclick=()=>{document.body.dataset.tab='a';setBuild(null)};
  $('bHome').onclick=()=>{view.tx=home.x*.72;view.tz=home.z*.72;view.td=150};
  $('bAll').onclick=()=>{view.tx=0;view.tz=0;view.td=DMAX};
  $('eye').onclick=toggleHud;
  $('bUp').onclick=()=>{if(picked)upgrade(ME,picked);const t=picked;pick(t)};
  $('bSell').onclick=()=>{if(picked)sellTower(picked)};
  $('aeAgain').onclick=()=>bye();$('aeWatch').onclick=()=>{$('arenaEnd').hidden=true};
  $('aimX').onclick=()=>setAim(null);
  $('cmdHold').onclick=()=>order(null);$('cmdX').onclick=()=>{SEL=[];syncCmd()};
  {const a=document.createElement('button');a.id='bAlly';a.onclick=()=>{const t=target;if(t==null)return;
     if(allied(ME.seat,t)){setAlly(ME.seat,t,false);tip(TL('İttifak bozuldu','Alliance broken'))}
     else if(P[t].bot){if(ME.towers.length>=2||Math.random()<.7){setAlly(ME.seat,t,true)}else tip(P[t].name+' teklifini reddetti')}
     else{say('ittifak',{from:ME.seat,to:t});tip(TL('Teklif gönderildi','Offer sent'))}};$('gTgt').append(a);
   const o=document.createElement('button');o.id='bJoin';o.innerHTML=TL('Ortak saldırı<small>hedefe</small>','Joint attack<small>on target</small>');o.onclick=()=>{const t=target;if(t==null||allied(ME.seat,t)){tip(TL('Önce düşman bir hedef seç','Pick an enemy target first'));return}
     for(const D of P)if(D!==ME&&D.on&&!D.dead&&allied(D.seat,ME.seat)){if(D.bot)D.join={to:t,until:D.t+90};else say('ortak',{from:ME.seat,a:D.seat,to:t})}
     tip((EN?`Your allies march on ${P[t].name}`:`Müttefiklerin ${P[t].name} üstüne yürüyor`))};$('gTgt').append(o)}
  $('askY').onclick=()=>{$('ask').hidden=true;setAlly(ME.seat,askFrom,true)};$('askN').onclick=()=>{$('ask').hidden=true};
  const box=$('rivals');
  for(const D of P){if(!D.on)continue;const b=document.createElement('button');b.style.borderLeftColor=TEAM[D.seat];b.innerHTML='<span></span><i></i>';D.row=b;
    b.onclick=()=>{if(D!==ME&&!D.dead)setTarget(D.seat)};box.append(b)}
  liveTarget();
  if(A.duel||P.filter(D=>D.on&&D!==ME).length<2){$('gTgt').hidden=true;$('bAlly').hidden=true;$('bJoin').hidden=true}   // one rival: nothing to choose or ally with
  $('hud').hidden=false;$('eye').hidden=false;
}
function askAlly(from){askFrom=from;$('askT').textContent=(EN?`${P[from].name} offers an alliance`:`${P[from].name} ittifak teklif ediyor`);$('ask').hidden=false}
function setAlly(a,b,on,remote){
  if(!P[a]||!P[b]||allied(a,b)===on&&a!==b)return;ALLY[a][b]=ALLY[b][a]=on;
  if(!remote)say('ittifakset',{a,b,on});
  if(a===ME.seat||b===ME.seat){const o=P[a===ME.seat?b:a];tip(on?`${o.name} ile ittifak kuruldu`:`${o.name} ile ittifak bitti`)}
  else if(on)tip(`${P[a].name} ve ${P[b].name} ittifak kurdu!`);
  if(on){if(target===a&&b===ME.seat||target===b&&a===ME.seat)target=null;checkEnd();
    // the new friends call off the armies already marching on each other: they turn round and go home
    for(const D of P){if(!D.on||!local(D)||(D.seat!==a&&D.seat!==b))continue;const o=D.seat===a?b:a;
      for(const u of D.units){if(u.from!==o||u.ret||u.done||u.fall!=null||u.type==='fuze'||u.type==='ucak'||!u.path)continue;
        const back=[{x:u.x,z:u.z}];for(let i=u.path.pts.length-1;i>=0;i--)if(u.path.c[i]<u.s-.5)back.push(u.path.pts[i]);
        if(back.length<2)back.push(castlePos(o));u.path=polyPath(back);u.s=0;u.end=u.path.len;u.ret=true;u.lock=null;u.foe=null;u.tgt=null;u.ftgt=null;u.siege=false;u.atk=false;u.off=false}}}
}
function drawHud(){
  if(SEL.length){const t=now(),have=new Set(myUnits().map(c=>c.id)),n=SEL.length;SEL=SEL.filter(id=>{if(have.has(id)){selSeen.set(id,t);return true}return t-(selSeen.get(id)||0)<3000});if(SEL.length!==n||!$('cmdBar').hidden!==!!SEL.length)syncCmd()}
  if(infoT<1e8){infoT-=.15;if(infoT<=0&&!picked&&!build&&!aim){ring.visible=ring2.visible=false;infoU=null;infoT=1e9}}
  if(infoU!=null){const c=myUnits().find(q=>q.id===infoU)||null;let f=c;if(!f)for(const D of P){if(local(D)){const u=D.units.find(q=>q.id===infoU);if(u){f=u;break}}else{const o=D.remote.get(infoU);if(o){f=o;break}}}
    if(f)ring.position.set(f.x,Math.max(heightAt(f.x,f.z),0)+.4,f.z);else{ring.visible=false;infoU=null}}
  {const mv=Math.floor(ME.money);if(mv!==moneyShown){moneyShown=mv;$('money').innerHTML=mv+'<i class="au"></i>'}}
  for(const b of $('gDef').querySelectorAll('button[data-k]'))b.disabled=ME.dead||(b.dataset.k==='kopru'?ME.money<BRIDGE_COST:b.dataset.k!=='sil'&&ME.money<TOWERS[b.dataset.k].cost);
  {const b=$('bTersane'),h=ME.ysState===2?TL('Tersane<small>hazır</small>','Shipyard<small>ready</small>'):ME.ysState===1?(EN?`Shipyard<small>${Math.ceil(ME.ysT)} s</small>`:`Tersane<small>${Math.ceil(ME.ysT)} sn</small>`):(EN?`Shipyard<small>${YARD_COST}<i class="au"></i></small>`:`Tersane<small>${YARD_COST}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead||(!ME.ysState&&ME.money<YARD_COST)}
  {const b=$('bPist'),h=!RWY[ME.seat]?TL('Pist<small>alan yok</small>','Runway<small>no site</small>'):ME.rwState===2?TL('Pist<small>hazır</small>','Runway<small>ready</small>'):ME.rwState===1?(EN?`Runway<small>${Math.ceil(ME.rwT)} s</small>`:`Pist<small>${Math.ceil(ME.rwT)} sn</small>`):(EN?`Runway<small>${RUNWAY_COST}<i class="au"></i></small>`:`Pist<small>${RUNWAY_COST}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead||!RWY[ME.seat]||(!ME.rwState&&ME.money<RUNWAY_COST)}
  for(const b of $('gAtk').querySelectorAll('button'))b.disabled=ME.dead||(!!b.dataset.k&&ME.money<UNITS[b.dataset.k].cost)||((b.dataset.k==='denizalti'||b.dataset.k==='gemi')&&!!ME.yard)||(b.dataset.k==='ucak'&&!!ME.hg);
  for(const k of['denizalti','gemi','ucak']){const b=$('gAtk').querySelector(`[data-k=${k}]`);if(!b)continue;const U=UNITS[k],n=U.kisa||U.ad;
    const h=k!=='ucak'&&ME.ysState!==2?(EN?`${n}<small>shipyard first</small>`:`${n}<small>önce tersane</small>`):k==='gemi'&&!ME.yard&&fleet(ME.seat)>=MAX_SHIPS?(EN?`${n}<small>${MAX_SHIPS} at sea</small>`:`${n}<small>${MAX_SHIPS} gemi sahada</small>`):k==='ucak'?(ME.rwState===2?ME.hg?(EN?`${n}<small>${Math.ceil(ME.hg.t)} s</small>`:`${n}<small>${Math.ceil(ME.hg.t)} sn</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`):(EN?`${n}<small>runway first</small>`:`${n}<small>önce pist</small>`)):ME.yard&&ME.yard.type===k?(EN?`${n}<small>${Math.ceil(ME.yard.t)} s</small>`:`${n}<small>${Math.ceil(ME.yard.t)} sn</small>`):ME.yard?(EN?`${n}<small>yard busy</small>`:`${n}<small>tersane dolu</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h}
  {const pop=popOf(ME.seat);for(const k in POP){const b=$('gAtk').querySelector(`[data-k=${k}]`);if(!b)continue;const U=UNITS[k],n=U.kisa||U.ad.split(' ').pop(),q=TQ.filter(x=>x===k).length;
     const h=q?(TQ[0]===k?(EN?`${n}<small>${q} · ${Math.ceil(tqT)} s</small>`:`${n}<small>${q} · ${Math.ceil(tqT)} sn</small>`):(EN?`${n}<small>${q} queued</small>`:`${n}<small>${q} sırada</small>`)):pop+POP[k]>POP_CAP?(EN?`${n}<small>army full</small>`:`${n}<small>ordu dolu</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`);
     if(b.innerHTML!==h)b.innerHTML=h;if(pop+POP[k]>POP_CAP)b.disabled=true}
   {const b=$('gAtk').querySelector('[data-k=fuze]');if(b){const h=ME.fcd>0?(EN?`Missile<small>${Math.ceil(ME.fcd)} s</small>`:`Füze<small>${Math.ceil(ME.fcd)} sn</small>`):(EN?`Missile<small>${UNITS.fuze.cost}<i class="au"></i></small>`:`Füze<small>${UNITS.fuze.cost}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;if(ME.fcd>0)b.disabled=true}}
   {const b=$('bBirlik'),R=atRally();let n=0;for(const k in R)n+=R[k].length;const h=EN?`Army<small>${n} ready · ${pop}/${POP_CAP}</small>`:`Birlik<small>${n} hazır · ${pop}/${POP_CAP}</small>`;if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead}
   drawRally();if(TUT)$('tutP').style.bottom=($('bar').offsetHeight+18)+'px'}
  {const a=$('bAlly'),al=target!=null&&allied(ME.seat,target)&&target!==ME.seat;a.innerHTML=al?TL('İttifakı boz<small>seçili</small>','Break alliance<small>selected</small>'):TL('İttifak<small>teklif et</small>','Alliance<small>offer</small>');a.disabled=ME.dead||target==null;$('bJoin').disabled=ME.dead||!ALLY[ME.seat].some(Boolean)}
  for(const D of P){if(!D.row)continue;D.row.className=(D.dead?'dead ':'')+(target===D.seat?'on':'');const tb=$('gTgt').querySelector(`[data-s="${D.seat}"]`);if(tb)tb.disabled=D.dead;D.row.firstChild.textContent=(D!==ME&&allied(D.seat,ME.seat)?'🤝 ':'')+D.name+(D===ME?TL(' (sen)',' (you)'):'');D.row.lastChild.style.width=D.hp/CASTLE_HP*100+'%'}
  if(picked){$('bUp').textContent=picked.lvl>=3?TL('En üst seviye','Max level'):(EN?`Upgrade ${upCost(picked)}`:`Yükselt ${upCost(picked)}`);$('bUp').disabled=picked.lvl>=3||ME.money<upCost(picked);$('bSell').textContent=(EN?`Remove +${Math.floor(picked.paid/2)}`:`Sil +${Math.floor(picked.paid/2)}`);
    vp.set(picked.x,heightAt(picked.x,picked.z),picked.z).project(camera);$('sel').style.left=(vp.x+1)/2*innerWidth+'px';$('sel').style.top=(1-vp.y)/2*innerHeight+'px'}
}
function drawOverlay(){
  oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,ov.width,ov.height);oc.setTransform(DPR,0,0,DPR,0,0);   // resizing the canvas every frame stalls the GPU
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
    for(const D of P){for(const u of D.units)if(u.fall==null&&(u.type!=='denizalti'||subSeen(u.x,u.z,u.from)))bar(u.type,u.x,u.z,u.hp/UNITS[u.type].hp);for(const o of D.remote.values())if(!(o.fl&2)&&(o.type!=='denizalti'||subSeen(o.x,o.z,num(o.from,D.seat))))bar(o.type,o.x,o.z,o.pct)}
    for(const t of ME.towers)if(t.bt>0){vp.set(t.x,heightAt(t.x,t.z)+(t.up?(t.top||5)+3:4),t.z).project(camera);if(vp.z>1)continue;const sx=(vp.x+1)/2*W,sy=(1-vp.y)/2*H;if(off(sx,sy))continue;
      const k=clamp(1-t.bt/t.BT,0,1);oc.fillStyle='rgba(0,0,0,.75)';oc.fillRect(sx-17,sy-1,34,7);oc.fillStyle='#f4c430';oc.fillRect(sx-16,sy,32*k,5)}}
  const scr=(x,y,z)=>{vp.set(x,y,z).project(camera);return vp.z>1?null:[(vp.x+1)/2*W,(1-vp.y)/2*H]};
  const trail=(pts,col)=>{oc.setLineDash([9,7]);oc.lineCap='round';let on=false;oc.beginPath();for(const p of pts){const q=scr(p.x,1.5,p.z);if(!q)continue;on?oc.lineTo(q[0],q[1]):oc.moveTo(q[0],q[1]);on=true}
    oc.lineWidth=6;oc.strokeStyle='rgba(0,0,0,.45)';oc.stroke();oc.lineWidth=3;oc.strokeStyle=col;oc.stroke();oc.setLineDash([])};
  const cross=(x,z,col,y=1.5)=>{const q=scr(x,y,z);if(!q)return;const r=11+Math.sin(now()/90)*3;oc.lineWidth=3;oc.strokeStyle=col;oc.beginPath();oc.arc(q[0],q[1],r,0,6.3);oc.moveTo(q[0]-r-6,q[1]);oc.lineTo(q[0]+r+6,q[1]);oc.moveTo(q[0],q[1]-r-6);oc.lineTo(q[0],q[1]+r+6);oc.stroke()};
  if(SEL.length){const want=new Set(SEL);oc.lineWidth=2;oc.strokeStyle='#9df0b4';for(const c of myUnits()){if(!want.has(c.id))continue;const q=scr(c.x,unitY(UNITS[c.type],c.x,c.z)+.3,c.z);if(!q)continue;const r=c.type==='gemi'?20:c.type==='denizalti'?13:c.type==='koc'||c.type==='balon'?11:8;oc.beginPath();oc.ellipse(q[0],q[1],r,r*.55,0,0,6.3);oc.stroke()}}
  if(cmdDraft&&cmdDraft.length>1)trail(cmdDraft,'#9df0b4');
  if(cmdShow){cmdShow.t-=1/60;if(cmdShow.t<=0)cmdShow=null;
    else if(cmdShow.lock!=null){const tr=unitById(cmdShow.lock);if(!tr||tr.hp<=0||tr.done)cmdShow=null;else{const q=scr(tr.x,unitY(UNITS[tr.type],tr.x,tr.z)+1,tr.z);if(q){oc.globalAlpha=Math.min(1,cmdShow.t);oc.lineWidth=3;oc.strokeStyle='#ff5a3a';oc.beginPath();oc.arc(q[0],q[1],naval(tr.type)?24:15,0,6.283);oc.stroke();oc.globalAlpha=1}}}
    else{oc.globalAlpha=Math.min(1,cmdShow.t);trail(cmdShow.pts.length>1?cmdShow.pts:[cmdShow.pts[0],cmdShow.pts[0]],cmdShow.col);const e=cmdShow.pts[cmdShow.pts.length-1];cross(e.x,e.z,cmdShow.col);oc.globalAlpha=1}}
  if(boxS){oc.lineWidth=2;oc.setLineDash([6,4]);oc.strokeStyle='#9df0b4';oc.fillStyle='rgba(157,240,180,.12)';const x=Math.min(boxS.x0,boxS.x1),y=Math.min(boxS.y0,boxS.y1),w=Math.abs(boxS.x1-boxS.x0),h=Math.abs(boxS.y1-boxS.y0);oc.fillRect(x,y,w,h);oc.strokeRect(x,y,w,h);oc.setLineDash([])}
  if(draft&&draft.length)trail(draft,'#ffe9a8');
  else if(route&&!ME.dead){const f=target!=null&&!P[target].dead?castlePos(target):null;trail([home,...route,...(f?[f]:[])],'#ffd98a')}
  for(const m of marks)cross(m.x,m.z,'#ffd98a');
  if(tutSpot){const q=scr(tutSpot.x,heightAt(tutSpot.x,tutSpot.z)+.5,tutSpot.z);if(q){const k=(Math.sin(now()/180)+1)/2,r=(W<620?20:26)+k*8,col=tutSpot.red?'255,90,60':'110,255,140';
    oc.lineWidth=4;oc.strokeStyle=`rgba(${col},${.55+k*.45})`;oc.beginPath();oc.arc(q[0],q[1],r,0,6.283);oc.stroke();oc.lineWidth=2;oc.beginPath();oc.arc(q[0],q[1],r*.45,0,6.283);oc.stroke();
    oc.fillStyle=`rgb(${col})`;oc.beginPath();oc.moveTo(q[0],q[1]-r-4);oc.lineTo(q[0]-9,q[1]-r-20);oc.lineTo(q[0]+9,q[1]-r-20);oc.fill()}}
  if(laneTo!=null&&!P[laneTo].dead){oc.font=`700 ${W<620?15:17}px Georgia`;for(let l=0;l<LANES;l++){const[a,b]=laneLine(laneTo,l);trail([a,b],'#ffd98a');const q=scr(a.x+(b.x-a.x)*.22,2,a.z);if(q){const t=String(l+1);oc.lineWidth=4;oc.strokeStyle='rgba(0,0,0,.8)';oc.strokeText(t,q[0],q[1]-8);oc.fillStyle='#ffd98a';oc.fillText(t,q[0],q[1]-8)}}}
  for(const u of ME.units)if(u.type==='fuze'&&!u.ret){const tr=u.lockT!=null?unitById(u.lockT):null;if(tr){const y=flies(UNITS[tr.type])?airY(tr):unitY(UNITS[tr.type],tr.x,tr.z)+1;cross(tr.x,tr.z,'#ff4a3a',y);const q=scr(tr.x,y,tr.z);if(q){oc.lineWidth=3;oc.strokeStyle='#ff5a3a';oc.beginPath();oc.arc(q[0],q[1],naval(tr.type)?24:17,0,6.283);oc.stroke()}}else cross(u.tx,u.tz,'#ff4a3a')}
  oc.font='700 17px Georgia';oc.fillStyle='#ffd98a';
  for(const f of floats){vp.set(f.x,6+f.t*8,f.z).project(camera);if(vp.z>1)continue;oc.globalAlpha=1-f.t;oc.fillStyle=f.heal?'#7dff9a':'#ffd98a';const fx=(vp.x+1)/2*W,fy=(1-vp.y)/2*H;oc.fillText(f.txt,fx,fy);
    if(!f.heal&&f.txt[0]==='+'){const w=oc.measureText(f.txt).width,cx=fx+w/2+8,cy=fy-5;oc.fillStyle='#f4c430';oc.beginPath();oc.arc(cx,cy,6,0,6.283);oc.fill();oc.strokeStyle='#a8740a';oc.lineWidth=1.5;oc.stroke();oc.fillStyle='#fff3b0';oc.beginPath();oc.arc(cx-2,cy-2,1.8,0,6.283);oc.fill()}}oc.globalAlpha=1;
}

// ---------- main ----------
const now=()=>performance.now();
let ambAcc=0,lastSim=now(),snapAcc=0,hudAcc=0,lastF=now(),fps=60,slow=0,fast=0,ups=0;
// ---------- the lesson ----------
// a short guided game: each step is a small job; the button to press glows, the spot to tap is ringed, and the step turns green when done
const TS=[];let tutI=0,tutDone=0,tutFlags={},tutSpot=null,tutHint='',tutKey='',tutCamT=0,tutMini=false;
const tutTab=t=>{if(document.body.dataset.tab!==t)document.body.dataset.tab=t};
function tutFree(k,near,toward){const c=near||castlePos(0),aim=toward||castlePos(1),base=Math.atan2(aim.z-c.z,aim.x-c.x);
  for(let r=12;r<46;r+=3)for(let a=0;a<6.28;a+=.35){const an=base+(a%2?a:-a)/2,x=snap(c.x+Math.cos(an)*r),z=snap(c.z+Math.sin(an)*r);if(canBuild(ME,x,z,k)&&!ME.towers.some(t=>Math.hypot(t.x-x,t.z-z)<6))return{x,z}}return null}
function tutSteps(){
  const c1=castlePos(1),home0=castlePos(0),foeHere=()=>ME.units.filter(u=>u.from===1&&!u.done&&u.hp>0&&POP[u.type]);
  const look=(x,z,d)=>{view.tx=x;view.tz=z+d*.22;view.td=d};
  const tower=(k,t,x)=>({t,x,tab:'d',go:()=>look(home0.x+25,home0.z,130),
    hint:()=>{if(build!==k)return{h:TL('Parlayan düğmeye bas.','Press the glowing button.'),g:`#gDef [data-k=${k}]`};const sp=tutFree(k);return{h:TL('Şimdi yeşil halkaya dokun.','Now tap the green ring.'),spot:sp}},
    done:()=>ME.towers.some(t=>t.type===k)});
  TS.push(
   {t:TL('Hoş geldin, komutan!','Welcome, commander!'),x:TL('Amacın: kendi kaleni korumak ve rakibin kalesini yıkmak. Haritayı bir parmakla kaydırırsın, iki parmakla yakınlaştırırsın. Bu derste her şey bedava ve beklemesiz.','Your goal: keep your castle standing and knock the enemy one down. Drag with one finger to move, pinch to zoom. In this lesson everything is free and instant.'),info:true},
   tower('ok',TL('Okçu kulesi kur','Build an archer tower'),TL('Okçu kulesi yakına ok atar. Yürüyen askerleri ve balonları vurur.','An archer tower shoots arrows close by. It hits marching soldiers and balloons.')),
   tower('top',TL('Top kulesi kur','Build a cannon tower'),TL('Top kulesi daha uzağa ağır gülle atar. Yan yana duran askerleri birden yaralar, denizdeki gemileri de vurur. Uçanları vuramaz.','A cannon tower throws heavy shot further. It hurts soldiers standing together and hits ships at sea. It cannot hit fliers.')),
   tower('hava',TL('Hava savunması kur','Build air defense'),TL('Hava savunması gökyüzünü korur: balonları, füzeleri ve uçakları düşürür.','Air defense guards the sky: it brings down balloons, missiles and planes.')),
   {t:TL('Kuleyi yükselt','Upgrade a tower'),x:TL('Yükseltilen kule daha uzağa ve daha sert vurur, daha zor yıkılır.','An upgraded tower shoots further and harder and is harder to knock down.'),tab:'d',
    hint:()=>{const t=ME.towers.find(o=>o.type!=='duvar');if(!t)return{h:''};if(picked===t)return{h:TL('Kulenin üstünde çıkan Yükselt düğmesine bas.','Press the Upgrade button above the tower.'),g:'#bUp'};return{h:TL('Yeşil halkadaki kulene dokun.','Tap your tower in the green ring.'),spot:{x:t.x,z:t.z}}},
    done:()=>ME.towers.some(t=>t.lvl>=2)},
   {t:TL('Asker eğit','Train soldiers'),x:TL('Saldırı bölümünde asker eğitirsin. Askerler kalenin önündeki bayraklı birlik alanında toplanır ve orada iyileşir.','In the Attack section you train soldiers. They gather on the flagged muster field in front of your castle and heal there.'),tab:'a',go:()=>look(RALLY[0].x,RALLY[0].z,110),
    hint:()=>{const R=atRally();let n=0;for(const k in R)n+=R[k].length;return{h:EN?`Press the glowing Infantry button 3 times (${Math.min(n,3)}/3).`:`Parlayan Piyade düğmesine 3 kez bas (${Math.min(n,3)}/3).`,g:'#gAtk [data-k=piyade]',spot:RALLY[0]}},
    done:()=>{const R=atRally();let n=0;for(const k in R)n+=R[k].length;return n>=3}},
   {t:TL('Hangi asker ne işe yarar?','What is each unit for?'),x:TL('Piyade: ucuz ve sağlam, askerlere karşı iyi. Atlı: çok hızlı, kıyıdan biraz denize açılabilir. Koçbaşı: kuleleri çabucak yıkar ama askerlere karşı zayıf. Balon: uçar; kuleleri, askerleri ve gemileri bombalar. Okçu ve hava savunması balonu düşürür.','Infantry: cheap and sturdy, good against soldiers. Riders: very fast, can swim a little way out to sea. Rams: knock towers down fast but are weak against soldiers. Balloons fly and bomb towers, soldiers and ships; archers and air defense shoot them down.'),info:true},
   {t:TL('Saldır','Attack'),x:TL('Birlik alanındaki askerlerini düşman kalesine gönder.','Send the soldiers on your muster field at the enemy castle.'),tab:'a',
    hint:()=>{if(SEL.length)return{h:TL('Şimdi yeşil halkadaki düşman kalesine dokun.','Now tap the enemy castle in the green ring.'),spot:c1,look:[c1.x-30,c1.z,170]};
      if(!$('rallyP').hidden)return{h:TL('Seç ve gönder’e bas.','Press Pick and send.'),g:'#rallyP .go'};return{h:TL('Parlayan Birlik düğmesine bas.','Press the glowing Army button.'),g:'#bBirlik'}},
    done:()=>P[1].units.some(u=>u.from===0&&POP[u.type])},
   {t:TL('Düşmana kilitlen','Lock onto an enemy'),x:TL('Düşman askerleri kalene geliyor! Askerlerini seçip bir düşmana dokunursan hepsi ona saldırır. Kalenin yakınındaki askerlerin de kendiliğinden savaşır.','Enemy soldiers are coming for your castle! Pick your soldiers and tap an enemy: they all go for it. Soldiers near your castle also fight on their own.'),tab:'a',
    go:()=>{for(let i=0;i<4;i++)spawn(ME,'piyade',1);for(const u of ME.units)if(u.from===1)u.hp=45;for(let i=0;i<4;i++)muster(ME,'piyade');look(RALLY[0].x+15,RALLY[0].z,140)},
    hint:()=>{const f=foeHere();if(SEL.length)return{h:TL('Şimdi kırmızı düşman askerlerinden birine dokun.','Now tap one of the red enemy soldiers.'),spot:f[0]?{x:f[0].x,z:f[0].z,red:1}:null};
      return{h:TL('Parlayan Seç düğmesine bas, sonra parmağını sürükleyip askerlerinin etrafına kare çiz.','Press the glowing Select button, then drag a box round your soldiers.'),g:'#bSec',spot:RALLY[0]}},
    done:()=>!foeHere().length},
   {t:TL('Füze at','Fire a missile'),x:TL('Füze haritanın her yerine gider. Bir düşman birliğine dokunursan kilitlenir ve o kaçsa da peşinden gider. Sadece hava savunması düşürebilir.','A missile reaches anywhere on the map. Tap an enemy unit and it locks on and follows it even when it runs. Only air defense can stop it.'),tab:'a',
    go:()=>look(c1.x-10,c1.z,140),
    hint:()=>{if(aim!=='fuze')return{h:TL('Parlayan Füze düğmesine bas.','Press the glowing Missile button.'),g:'#gAtk [data-k=fuze]'};const t=P[1].towers[0];return{h:TL('Şimdi yeşil halkadaki düşman kulesine dokun.','Now tap the enemy tower in the green ring.'),spot:t?{x:t.x,z:t.z}:c1}},
    done:()=>!!tutFlags.fuze},
   {t:TL('Tersane ve gemi','Shipyard and warship'),x:TL('Gemiler denizden saldırır: kıyıdaki kuleleri ve düşman gemilerini döver.','Ships attack from the sea: they shell coastal towers and enemy ships.'),
    go:()=>look(DOCK[0].land.x,DOCK[0].land.z,120),
    hint:()=>{if(ME.ysState!==2){tutTab('d');return{h:TL('Savunma bölümünde parlayan Tersane düğmesine bas.','In Defense, press the glowing Shipyard button.'),g:'#bTersane'}}tutTab('a');return{h:TL('Saldırı bölümünde parlayan Gemi düğmesine bas.','In Attack, press the glowing Ship button.'),g:'#gAtk [data-k=gemi]'}},
    done:()=>ME.units.some(u=>u.type==='gemi'&&u.from===0)},
   {t:TL('Düşman gemisini batır','Sink the enemy ship'),x:TL('Bir düşman gemisi geldi! Gemine dokunup seç, sonra düşman gemisine dokun: gemin ona kilitlenip ateş eder.','An enemy ship is here! Tap your ship to pick it, then tap the enemy ship: yours locks on and opens fire.'),tab:'a',
    go:()=>{const L0=LAUNCH[0].park,dk=DOCK[0],x=L0.x+Math.sin(dk.ang)*40,z=L0.z+Math.cos(dk.ang)*40,id=uid++,path=polyPath([{x:x+20,z},{x,z}]);ME.units.push({id,type:'gemi',from:1,path,s:0,hp:140,x:x+20,z,bomb:0,cd:0,end:path.len,lane:0,lx:0,lz:0,vx:0,vz:0,hold:true,cmd:true});tutFlags.foeShip=id;look(L0.x,L0.z,130)},
    hint:()=>{const mine=ME.units.find(u=>u.type==='gemi'&&u.from===0),foe=ME.units.find(u=>u.id===tutFlags.foeShip);if(!foe)return{h:''};
      if(mine&&SEL.includes(mine.id))return{h:TL('Şimdi kırmızı halkadaki düşman gemisine dokun.','Now tap the enemy ship in the red ring.'),spot:{x:foe.x,z:foe.z,red:1}};return{h:TL('Önce yeşil halkadaki kendi gemine dokun.','First tap your own ship in the green ring.'),spot:mine?{x:mine.x,z:mine.z}:null}},
    done:()=>!ME.units.some(u=>u.id===tutFlags.foeShip&&!u.done&&u.hp>0)},
   {t:TL('Uçakla bombala','Bomb from the air'),x:TL('Uçak düşman üssünün üstünden seçtiğin hatta geçer ve bombalar, sonra geri döner. Üssün üstünde 1’den 6’ya kadar hat vardır.','A bomber flies over the enemy base along the run you pick, bombs it and comes home. There are runs 1 to 6 across the base.'),
    go:()=>RWY[0]&&look(RWY[0].c.x,RWY[0].c.z,130),
    hint:()=>{if(ME.rwState!==2){tutTab('d');return{h:TL('Savunma bölümünde parlayan Pist düğmesine bas.','In Defense, press the glowing Runway button.'),g:'#bPist'}}tutTab('a');
      if(laneTo==null)return{h:TL('Saldırı bölümünde parlayan Uçak düğmesine bas.','In Attack, press the glowing Plane button.'),g:'#gAtk [data-k=ucak]'};return{h:TL('Bir hat numarasına bas: 1, 2, 3, 4, 5 ya da 6.','Press a run number: 1 to 6.'),g:'#laneBar [data-l]'}},
    done:()=>!!ME.hg||P.some(D=>D.units.some(u=>u.type==='ucak'&&u.from===0))},
   {t:TL('Köprüyü onar','Rebuild the bridge'),x:TL('Füzeler ve bombalar taş köprüleri yıkar; biri az önce yıkıldı. Köprü olmadan yürüyen askerler karşıya geçemez.','Missiles and bombs bring stone bridges down; one just fell. Without it, marching soldiers cannot cross.'),tab:'d',
    go:()=>{breakDuelBridge(0);look((DBR[0].a.x+DBR[0].b.x)/2,DBR[0].a.z,120)},
    hint:()=>{if(build!=='kopru')return{h:TL('Parlayan Köprü düğmesine bas.','Press the glowing Bridge button.'),g:'#gDef [data-k=kopru]'};return{h:TL('Şimdi yeşil halkadaki yıkık köprüye dokun.','Now tap the fallen bridge in the green ring.'),spot:{x:(DBR[0].a.x+DBR[0].b.x)/2,z:(DBR[0].a.z+DBR[0].b.z)/2}}},
    done:()=>!DBR[0].down},
   {t:TL('Hazırsın!','You are ready!'),x:TL('Sağ üstteki Ayarlar’dan yeni maç başlatabilir, Sohbet’ten arkadaşlarına yazabilirsin. Gerçek maçta altın azdır ve her şey biraz zaman alır: önce birkaç kule kur, sonra ordunu topla. Bol şans!','Use Settings at the top right for a new match and Chat to talk to your friends. In a real match gold is short and everything takes a little time: build a few towers first, then gather your army. Good luck!'),info:true,last:true});
}
function tutGlow(sel){for(const e of document.querySelectorAll('.tglow'))if(!sel||!e.matches(sel))e.classList.remove('tglow');if(sel)for(const e of document.querySelectorAll(sel))e.classList.add('tglow')}
function tutShow(){const S=TS[tutI],p=$('tutP');if(!S)return;p.hidden=false;
  $('tutN').textContent=`${tutI+1} / ${TS.length}`;$('tutT').textContent=(S.ok?'✓ ':'')+S.t;$('tutX').textContent=S.x;$('tutX').hidden=tutMini&&!S.info;$('tutM').textContent=tutMini?'▴':'▾';
  $('tutH2').textContent=S.ok?TL('Harika! Görev tamam.','Great! Job done.'):tutHint;$('tutH2').hidden=!S.ok&&!tutHint;
  $('tutB').disabled=tutI===0;const f=$('tutF');f.hidden=!(S.info||S.ok);f.textContent=S.last?TL('Bitir','Finish'):TL('İleri','Next');p.classList.toggle('ok',!!S.ok)}
function tutGo(i){tutI=clamp(i,0,TS.length-1);const S=TS[tutI];S.ok=false;tutDone=0;tutHint='';setBuild(null);setAim(null);if(S.tab)tutTab(S.tab);if(S.go&&!S.went){S.went=true;try{S.go()}catch(e){oops(e)}}tutShow()}
function tutTick(dt){
  ME.money=Math.max(ME.money,5000);ME.hp=CASTLE_HP;const E=P[1];E.money=0;E.hp=Math.max(E.hp,150);
  const S=TS[tutI];if(!S)return;
  if(!S.ok&&!S.info){let d=false;try{d=S.done()}catch(e){}if(d){S.ok=true;tutSpot=null;tutGlow(null);SES.para();setTimeout(()=>SES.para(),160);tutShow();tutDone=1.8;return}}
  if(S.ok||S.info||!S.hint){tutSpot=null;tutGlow(null);if(S.info&&tutHint!==''){tutHint='';tutShow()}return}
  let h={};try{h=S.hint()||{}}catch(e){}tutSpot=h.spot||null;
  // the spot to tap must be on screen: bring the camera to it when it is not
  if(tutSpot){const key=Math.round(tutSpot.x/25)+','+Math.round(tutSpot.z/25)+':'+tutI;if(key!==tutKey&&now()-tutCamT>2500){tutKey=key;tutCamT=now();vp.set(tutSpot.x,heightAt(tutSpot.x,tutSpot.z),tutSpot.z).project(camera);
    if(Math.abs(vp.x)>.75||vp.y>.8||vp.y<-.1||vp.z>1){const d=h.look?h.look[2]:Math.min(Math.max(view.td,110),150);view.tx=h.look?h.look[0]:tutSpot.x;view.tz=(h.look?h.look[1]:tutSpot.z)+d*.22;view.td=d}}}tutGlow(h.g||null);if((h.h||'')!==tutHint){tutHint=h.h||'';tutShow()}}
function mkTut(){
  tutSteps();$('tutB').onclick=()=>tutGo(tutI-1);$('tutM').onclick=()=>{tutMini=!tutMini;tutShow()};
  if(SMALL)tutMini=false;
  $('tutF').onclick=()=>{const S=TS[tutI];if(!S.info&&!S.ok)return;if(S.last){try{localStorage.setItem('cephe_egitim','1')}catch(e){}bye();return}tutGo(tutI+1)};
  // the dummy enemy holds a few towers to aim at
  const c=castlePos(1);P[1].money=500;for(const t of['ok','ok','top']){let done=false;for(let r=14;r<50&&!done;r+=3)for(let a=Math.PI*.6;a<Math.PI*1.4&&!done;a+=.25){const tw=addTower(P[1],t,Math.round(c.x+Math.cos(a)*r),Math.round(c.z+Math.sin(a)*r)*(t==='top'?1:(P[1].towers.length%2?1:-1)));if(tw){tw.bt=0;tw.mesh.sy=1;tw.mesh.tpl.dirty=true;done=true}}}
  P[1].units=P[1].units.filter(u=>u.type!=='isci');setInterval(()=>{if(tutDone>0){tutDone-=.25;if(tutDone<=0&&TS[tutI]&&TS[tutI].ok&&!TS[tutI].last)tutGo(tutI+1)}},250);
  tutGo(0)}
// ---------- faults ----------
// a bug must never stop the game: the frame and the simulation carry on, and the fault is logged so it can be fixed
let repN=0,oopsT=0;
function report(kind,msg,extra){if(repN>=15||!A.sb)return;repN++;
  try{const info=Object.assign({t:ME.t|0,duel:DUEL,fps:Math.round(fps),dpr:DPR,un:P.map(D=>D.units.length),sh:SHELLS.length,w:innerWidth,h:innerHeight,bots:P.filter(D=>D.bot).length},extra||{});
    A.sb.from('hata_kaydi').insert({ver:VER,kind:String(kind).slice(0,20),msg:String(msg).slice(0,1990),ua:navigator.userAgent.slice(0,290),info}).then(()=>{},()=>{})}catch(e){}}
function oops(e){console.error(e);const m=String(e&&e.message||e),st=String(e&&e.stack||'').split('\n').slice(0,6).join('\n');
  if(!oops.seen)oops.seen=new Set();if(!oops.seen.has(m)){oops.seen.add(m);report('hata',m+'\n'+st)}
  if(now()-oopsT>20000){oopsT=now();tip(TL('Küçük bir hata oldu, oyun devam ediyor (kaydedildi)','A small error happened, the game goes on (logged)'))}}
addEventListener('error',e=>{if(e&&e.error)oops(e.error)});addEventListener('unhandledrejection',e=>{const r=e&&e.reason;if(r&&r.stack&&/oyun\.js/.test(r.stack))oops(r)});
// a session that ended without closing cleanly (a hang) is reported the next time the game opens
try{const h=JSON.parse(localStorage.getItem('cephe_hb')||'null');if(h&&!h.clean&&Date.now()-h.at<3600e3&&Date.now()-h.at>8000)setTimeout(()=>report('donma','onceki oturum temiz kapanmadi',h),4000)}catch(e){}
const beat=clean=>{try{localStorage.setItem('cephe_hb',JSON.stringify({at:Date.now(),clean:clean?1:0,ver:VER,t:ME.t|0,fps:Math.round(fps),dpr:DPR,duel:DUEL,un:P.map(D=>D.units.length),sh:SHELLS.length,ended}))}catch(e){}};
setInterval(()=>{if(!document.hidden)beat(ended)},3000);
let hidAt=0;addEventListener('pagehide',()=>{SES.pause();beat(true)});addEventListener('beforeunload',()=>SES.pause());document.addEventListener('visibilitychange',()=>{hidAt=now();if(document.hidden)SES.pause();else SES.wake();beat(document.hidden||ended)});addEventListener('pageshow',()=>{if(!document.hidden)SES.wake()});addEventListener('blur',()=>{hidAt=now()});
cv.addEventListener('webglcontextlost',()=>{report('gpu','webgl context lost');tip(TL('Görüntü kısa süre kayboldu, yeniden kuruluyor…','The picture was lost for a moment, rebuilding…'))});
cv.addEventListener('webglcontextrestored',()=>{report('gpu','webgl context restored');for(const T of TPL.values())T.dirty=T.mem=true;tip(TL('Görüntü geri geldi','The picture is back'))});
setInterval(()=>{           // runs even when the tab is in the background
  const t=now(),dt=Math.min(1,(t-lastSim)/1000);lastSim=t;
  try{for(let r=dt;r>0;r-=.05)sim(Math.min(r,.05))}catch(e){oops(e)}
  snapAcc+=dt;if(snapAcc>=.5){snapAcc=0;try{snapshot();for(const D of P)if(D.on&&D!==ME&&!D.bot&&!D.dead&&t-D.seen>25000)eliminate(D);checkEnd()}catch(e){oops(e)}}
},33);
let longF=0;
// never more than about 60 pictures a second, even on 90 and 120 Hz phones: the eye can't tell, the battery can
let lastDraw=0;const sunAt=new THREE.Vector3();
function frame(t){requestAnimationFrame(frame);if(t-lastDraw<frameCap)return;lastDraw=t;try{frameBody(t)}catch(e){oops(e)}}
function frameBody(t){
  const raw=t-lastF;if(raw>2500&&!document.hidden&&lastF>0&&now()-hidAt>raw+500&&longF++<3)report('takilma','uzun kare '+Math.round(raw)+' ms');
  const dt=Math.min(.1,(t-lastF)/1000);lastF=t;fps=lerp(fps,1/Math.max(dt,.001),.05);
  slow=fps<24?slow+dt:0;fast=fps>55?fast+dt:0;
  if(slow>5&&DPR>1.1){DPR=Math.max(1,DPR-.2);renderer.setPixelRatio(DPR);size();slow=0;fast=0}
  else if(fast>15&&DPR<DPR0&&ups<2){ups++;DPR=Math.min(DPR0,DPR+.2);renderer.setPixelRatio(DPR);size();fast=0}
  const p=view.d*dt*1.1;
  if(keys.has('a')||keys.has('arrowleft'))view.tx-=p;if(keys.has('d')||keys.has('arrowright'))view.tx+=p;
  if(keys.has('w')||keys.has('arrowup'))view.tz-=p;if(keys.has('s')||keys.has('arrowdown'))view.tz+=p;
  view.tx=clamp(view.tx,-VIEW,VIEW);view.tz=clamp(view.tz,-VIEW,VIEW);
  for(let i=floats.length-1;i>=0;i--){floats[i].t+=dt/1.1;if(floats[i].t>=1)floats.splice(i,1)}
  for(let i=marks.length-1;i>=0;i--){marks[i].t-=dt;if(marks[i].t<=0)marks.splice(i,1)}
  ambAcc+=dt;if(ambAcc>.3){ambAcc=0;ambience()}
  waterU.t.value=t/1000;if(waterM)waterM.position.y=Math.sin(t/1400)*.06;applyCam(dt);drawUnits(dt);drawFx(dt);drawRipples(dt);
  // shadows are redrawn every second picture unless the view moved; at 60 a second nobody sees the difference
  {const moved=!sunAt.equals(sun.target.position);sunAt.copy(sun.target.position);sun.shadow.needsUpdate=moved||fno%2===0}
  renderer.render(scene,camera);drawOverlay();
  hudAcc+=dt;if(hudAcc>.15){hudAcc=0;drawHud()}
  tipT-=dt;if(tipT<=0&&!$('tip').hidden)$('tip').hidden=true;
  if((fno=(fno||0)+1)%15===0)forestLOD();
}
let fno=0,lockTipT=0;
buildGround();buildOuter();buildWater();buildBridges();buildForest();buildDetail();buildUnits();buildSites();P.forEach(D=>{if(D.on)buildCastle(D.seat)});
size();mkHud();connect();applyCam(1);if(TUT)mkTut();
sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;if(!GFX[gfxMode].sh)sun.castShadow=false;
// draw every kind of object once, out of sight, so no shader is ever built in the middle of a fight
// shaders are compiled in the background before the first picture: one huge first frame can make a phone's GPU give up
await (async function warmUp(){
  for(const k in TOWERS)for(let l=1;l<=3;l++)towerTpl(k,l);for(const k in PROPM)fallPool(k);
  const back=[];mx.makeTranslation(0,-400,0);
  scene.traverse(o=>{if(o.isInstancedMesh&&o.count===0){back.push([o,o.visible]);o.count=1;o.visible=true;o.setMatrixAt(0,mx);o.instanceMatrix.needsUpdate=true}});
  for(const S of[SMOKE,FIRE]){S.P3.setXYZ(0,0,-400,0);S.C4.setXYZW(0,1,1,1,0);S.S2.setXY(0,1,0);for(const a of[S.P3,S.C4,S.S2])a.needsUpdate=true;S.geo.instanceCount=1}
  try{if(renderer.compileAsync)await Promise.race([renderer.compileAsync(scene,camera),new Promise(r=>setTimeout(r,12000))])}catch(e){}
  try{renderer.render(scene,camera)}catch(e){}
  for(const[o,v]of back){o.count=0;o.visible=v}for(const S of[SMOKE,FIRE])S.geo.instanceCount=0;mx.identity();
  for(const T of TPL.values())T.dirty=T.mem=true;
})();
requestAnimationFrame(frame);
window.__O={get tutSpot(){return tutSpot},get tutHint(){return tutHint},unitById,laneZ,setGfx,canBuild,get tutI(){return tutI},TS,tutGo,lockOrder,spawn,muster,BLD,TOWERS,KEEP,popOf,trainBuy,TQ,RALLY,atRally,orderRally,LAUNCH,DBR,breakDuelBridge,fixDuelBridge,landRoute,laneAsk,onChat,chatSend,FTILES,forestLOD,openRally,drawRally,report,applyCmd,order,myUnits,seaRoute,fleet,buildYard,landNear,tap,endBox,unitAtScreen,get SEL(){return SEL},set SEL(v){SEL=v},DOCK2:0,RWY,DOCK,PROPS,SHELLS,buildRunway,bridges,addBridge,breakBridge,breakFountain,get fountainDown(){return fountainDown},setAlly,allied,nav,navRoute,shoreOf,explode,fireAt,setTarget,set route(v){route=v},ALLY,P,sim,sendUnit,addTower,ME,finish,kill:eliminate,crater,sunk,heightAt,unitY,UNITS,camera,get ended(){return ended},get fps(){return fps},view};
