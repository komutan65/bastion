import * as THREE from 'three';
import {SES} from './ses.js?v=20261111c';
/* Dört Cephe. Each client simulates its own square (and any computer rivals);
   units sent to a player are simulated by that player. Others see 2 snapshots a second. */
const A=window.ARENA,EN=window.LANG==='en',TL=(t,e)=>EN?e:t;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const num=(v,d=0)=>typeof v==='number'&&isFinite(v)?v:d;

// ---------- rules ----------
let BUILD_T={denizalti:16,gemi:20},TBUILD={ok:7,top:10,hava:9,roket:14,duvar:2.5},WMAX=12,RUNWAY_COST=200,MS_COST=100,MS_T=10,MS_HP=120,RUNWAY_T=12,YARD_COST=100,YARD_T=15,MAX_SHIPS=4,PLANE_T=12,SHIP_SEE=80,SHIP_STAND=95,SUB_TIME=16,WALL=3,START_MONEY=200,CASTLE_HP=500,TRICKLE=0.5,MAX_TOWERS=40;
// a base trains one soldier at a time and fields a limited army, so nobody can flood the map
let TRAIN={piyade:2,atli:3,koc:7,balon:6},POP={piyade:1,atli:1,koc:3,balon:2},POP_CAP=40,FUZE_CD=6,DBR_FIX=100,VER='29.1';
// the lesson: an empty 1v1 map where nothing costs anything and nothing has to be waited for
const TUT=!!(A&&A.tutorial);
if(TUT){BUILD_T={denizalti:.5,gemi:.5};for(const k in TBUILD)TBUILD[k]=.2;RUNWAY_T=YARD_T=PLANE_T=.5;FUZE_CD=.5;TRAIN={piyade:.2,atli:.2,koc:.2,balon:.2}}
const UNITS={
  piyade:{ad:TL('Mızraklı Piyade','Spearman'),kisa:TL('Mızraklı','Spearman'),cost:3,odul:2,hp:90,sp:7,dmg:2,yol:'kara'},
  atli:{ad:TL('Deniz Süvarisi','Sea Cavalry'),kisa:TL('Süvari','Cavalry'),cost:6,odul:3,hp:80,sp:13,dmg:3,yol:'su'},
  koc:{ad:TL('Koçbaşı','Battering Ram'),kisa:TL('Koçbaşı','Ram'),cost:12,odul:8,hp:320,sp:4.5,dmg:12,yol:'kara'},
  balon:{ad:TL('Bomba Balonu','Bomb Balloon'),kisa:TL('Balon','Balloon'),cost:15,odul:10,hp:160,sp:6,dmg:8,yol:'hava'},
  fuze:{ad:TL('Füze','Missile'),cost:50,odul:15,hp:70,sp:32,dmg:60,yol:'fuze'},
  denizalti:{ad:TL('Denizaltı','Submarine'),kisa:TL('Denizaltı','Sub'),cost:100,odul:12,hp:220,sp:11,dmg:0,yol:'deniz'},
  dalgic:{ad:TL('Balık Adam','Frogman'),cost:0,odul:2,hp:75,sp:8.5,dmg:4,yol:'su',gizli:true},
  isci:{ad:TL('İşçi','Worker'),cost:0,odul:0,hp:45,sp:10,dmg:0,yol:'kara',gizli:true},
  gemi:{ad:TL('Savaş Gemisi','Warship'),kisa:TL('Savaş Gemisi','Warship'),cost:200,odul:25,hp:750,sp:7,dmg:0,yol:'deniz'},
  ucak:{ad:TL('Bombardıman Uçağı','Bomber'),kisa:TL('Bombardıman','Bomber'),cost:250,odul:35,hp:950,sp:24,dmg:15,yol:'ucak'}
};
const TOWERS={
  ok:{ad:TL('Okçu Kulesi','Archer Tower'),kisa:TL('Okçu','Archers'),cost:20,menzil:24,dmg:15,hiz:1.6,hp:160,hava:true,yer:true},
  top:{ad:TL('Top Kulesi','Cannon Tower'),kisa:TL('Top','Cannon'),cost:45,menzil:38,dmg:38,hiz:.6,alan:4,hp:240,hava:false,yer:true,gemi:true},
  hava:{ad:TL('Uçaksavar','Flak Gun'),kisa:TL('Uçaksavar','Flak'),cost:35,menzil:36,dmg:24,hiz:1.2,hp:150,hava:true,fuze:true,ucak:true,yer:false},
  roket:{ad:TL('Roketatar','Rocket Battery'),kisa:TL('Roketatar','Rockets'),cost:60,menzil:72,dmg:240,hiz:.3,hp:150,hava:true,fuze:true,ucak:true,yer:false,gudumlu:true},
  duvar:{ad:TL('Duvar','Wall'),kisa:TL('Duvar','Wall'),cost:8,menzil:0,dmg:0,hiz:1,hava:false,yer:false,hp:250,duvar:true}
};
// the castle's own archers: enough to see off a handful of raiders, not an army
const KEEP={menzil:26,dmg:14,hiz:1.3},ARCH_COST=25,ARCH_HP=40,SEG_HP=120,AORD=[0,2,1,3];
// how hard each kind hits buildings: swords and hooves barely dent stone, the ram is made for it
// how hard each kind hits other soldiers (times its damage)
const UV={piyade:5,atli:5,koc:1.5,dalgic:1.6,isci:0};
const BLD={piyade:3.5,atli:2,koc:5,dalgic:4,balon:40};
const UKEYS=Object.keys(UNITS),TKEYS=Object.keys(TOWERS),BUY=UKEYS.filter(k=>!UNITS[k].gizli),BRIDGE_COST=60;
const TEAM=['#e8a33a','#4fb6e8','#e866a8','#7fd65a'];
const BIOME=[
  {ad:TL('Çayır','Meadow'),a:'#58a83c',b:'#97c95a',amp:2,f:.032},
  {ad:TL('Çöl','Desert'),a:'#e8c47a',b:'#c9954e',amp:3.6,f:.02},
  {ad:TL('Kar','Snow'),a:'#f2f7fb',b:'#9fbdd6',amp:5,f:.046},
  {ad:TL('Volkan','Volcano'),a:'#463735',b:'#83503a',amp:4.2,f:.062}
];
// ---------- map ----------
const L=160,RIVER=13,ISLE=8,CASTLE=100,WL=1.5;   // WL: how far inland of the river line the water ends
const SX=[-1,1,-1,1],SZ=[-1,-1,1,1];
// 1v1: two base islands left and right, an empty island between them, and stone bridges over the two channels
const DUEL=!!(A&&A.duel),DCX=106,DMID=34,DIN=62;
const DBR=[{a:{x:-70,z:-30},b:{x:-26,z:-30},main:0},{a:{x:-70,z:56},b:{x:-26,z:56}},{a:{x:26,z:30},b:{x:70,z:30},main:1},{a:{x:26,z:-56},b:{x:70,z:-56}}];
const seatAt=(x,z)=>DUEL?(x>0?1:0):(x>0?1:0)+(z>0?2:0);
const biomeAt=(x,z)=>DUEL?(Math.abs(x)<DIN-6?0:x>0?1:2):seatAt(x,z);     // 1v1: a snowy base against a desert base, green island between
const castlePos=s=>DUEL?{x:SX[s]*DCX,z:0}:{x:SX[s]*CASTLE,z:SZ[s]*CASTLE};
const ROADS=[   // every square has its own road, in |x|,|z| coordinates
  [[100,100],[100,58],[58,58],[58,28],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[58,100],[58,62],[28,62],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[75,52],[40,75],[26,26],[13,13],[8,8],[0,0]],
  [[100,100],[68,92],[88,54],[42,42],[26,26],[13,13],[8,8],[0,0]]
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
const coastD=(x,z)=>Math.min(160,Math.max(132,146+wob(Math.abs(x),Math.abs(z),.017)*30))-BOX(x,z);     // mirrored into every quarter: each base gets the same coast to defend     // >0 on the map's land
const outerD=(x,z)=>BOX(x,z)-(236+wob(x+90,z+70,.011)*30);          // >0 on the far shore
function duelIsles(x,z){
  const w=wob(Math.abs(x),x<0?z:-z,.02)*9,ax=Math.abs(x),side=x<0?-1:1;      // the two halves turn into each other: same coast for both bases
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
    for(const s of DUEL?[0,1]:[0,1,2,3]){const c=castlePos(s),a=CANG[s],ca=Math.cos(a),sa=Math.sin(a),E=CH+.6;for(let j=0;j<NN;j++)for(let i=0;i<NN;i++){const dx=i*NC-L-c.x,dz=j*NC-L-c.z;if(Math.abs(dx)>14||Math.abs(dz)>14)continue;if(Math.abs(dx*ca+dz*sa)<E&&Math.abs(-dx*sa+dz*ca)<E)navLand[i+j*NN]=0}}     // castles are solid: walking routes go round them
  const m=navLand.slice();
  for(const b of bridges)for(let k=0;k<=40;k++){const x=lerp(b.a.x,b.b.x,k/40),z=lerp(b.a.z,b.b.z,k/40);m[Math.round((x+L)/NC)+Math.round((z+L)/NC)*NN]=1}
  return m;
}
const nearDeck=(x,z)=>(DUEL?DBR.some(b=>!b.down&&segD(x,z,b)<5.4):(!fountainDown&&Math.hypot(x,z)<27&&(Math.hypot(x,z)<14.5||roadDist(x,z)<6)))||bridges.some(b=>segD(x,z,b)<5.2);
const BRW=4.6;
const onDeckFixed=(x,z)=>{if(DUEL)return DBR.some(b=>!b.down&&segD(x,z,b)<BRW);if(fountainDown)return false;const r=Math.hypot(x,z);return r<13||(r<25&&roadDist(x,z)<4.5)};
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
let seaMS=null;
function seaMaskSub(){if(!seaMS){seaMS=new Uint8Array(SN*SN);for(let j=0;j<SN;j++)for(let i=0;i<SN;i++){const x=i*SC-VIEW,z=j*SC-VIEW;seaMS[i+j*SN]=shoreOf(x,z)<-2.2&&(DUEL?!DBR.some(b=>segD(x,z,b)<7):BOX(x,z)>112||shoreOf(x,z)<-2.2&&BOX(x,z)>100)?1:0}}return seaMS}     // a submarine is small: it can slip into shallower water, right up to the shore the player picked
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
function seaRoute(pts,sub){const m=seaMask(),out=[pts[0]];for(let i=1;i<pts.length;i++){const l=seaNav(out[out.length-1],pts[i],m);if(l)out.push(...l.slice(1))}
  if(sub&&pts.length>1){const b=pts[pts.length-1],l=seaNav(out[out.length-1],b,seaMaskSub());if(l&&l.length>1)out.push(...l.slice(1))}     // a submarine crosses in deep water, then creeps into the shallows right where the line ends
  return out}
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
function buildYard(D){if(D.ysState||D.money<YARD_COST)return false;D.ysWreck=0;D.money-=YARD_COST;D.ysState=1;D.ysT=YARD_T;markBuilt(D);return true}
// warships on the water (or being built) that belong to a base, wherever they are simulated
function fleet(seat){let n=0;const O=P[seat];if(O&&O.yard&&O.yard.type==='gemi')n++;if(O&&O.yardV&&O.yardV.type==='gemi')n++;
  for(const D of P){if(!D.on)continue;for(const u of D.units)if(u.type==='gemi'&&u.from===seat&&u.fall==null&&!u.done)n++;if(!local(D))for(const o of D.remote.values())if(o.type==='gemi'&&o.from===seat&&!(o.fl&2))n++}return n}
const achOf=D=>D.ach||(D.ach=[0,0,0,0]),csOf=D=>D.cs||(D.cs=new Array(9).fill(0)),nArch=D=>achOf(D).filter(h=>h>0).length;
const archSpot=D=>{const A=achOf(D),C=csOf(D);for(const k of AORD)if(A[k]<=0&&C[k]<.45)return k;return -1};      // a corner that is standing and has nobody on it
const castleNeedsFix=D=>!D.dead&&(D.hp<CASTLE_HP-1||csOf(D).some(v=>v>.01)),castleState=D=>1-Math.max(...csOf(D).slice(0,8),1-D.hp/CASTLE_HP),
  fixCost=D=>Math.max(10,Math.ceil(csOf(D).slice(0,8).reduce((a,v)=>a+v,0)*25+(CASTLE_HP-D.hp)*.25));
function repairCastle(D){if(D.cfix||D.dead||!castleNeedsFix(D)||D.money<fixCost(D))return false;D.money-=fixCost(D);D.cfix=true;markBuilt(D);hire(D);return true}
function buyArcher(D){const k=archSpot(D);if(k<0||D.money<ARCH_COST)return false;D.money-=ARCH_COST;achOf(D)[k]=ARCH_HP;ARCHD=true;markBuilt(D);return true}
// an archer on a corner tower is exposed: blasts near him hurt him by how close they are
function hurtArchers(D,x,z,r,dmg){const A=CARCH[D.seat];if(!A)return;const H=achOf(D);for(let k=0;k<4;k++){if(H[k]<=0)continue;const q=A[k],d=Math.hypot(q.x-x,q.z-z);if(d>=r)continue;H[k]-=dmg*(1-d/r);if(H[k]<=0)archerDies(D,k)}}
function archerDies(D,k){const q=CARCH[D.seat][k];achOf(D)[k]=0;ARCHD=true;markBuilt(D);burst(q.x,q.y+1,q.z,10,['#7a5a3a','#3b2d24','#c9a26a'],7,1,.3);puff(q.x,q.y+1,q.z,1.6,1.8,.7,.6,.6);if(D===ME)tip(TL('Kale okçularından biri düştü','One of the castle archers fell'))}
// the castle takes a hit where it was struck: that part crumbles a little. The keep goes down with the castle's health
function castleHit(D,x,z,d){const C=csOf(D),S=SEGC[D.seat];if(!S)return;let bi=8;
  if(x!=null){let bd=1e9;for(let i=0;i<8;i++){const e=Math.hypot(S[i].x-x,S[i].z-z);if(e<bd){bd=e;bi=i}}if(bd>16)bi=8}
  D.csT=now();if(bi<8){C[bi]=Math.min(1,C[bi]+d/SEG_HP);if(bi<4&&C[bi]>=.45&&achOf(D)[bi]>0)archerDies(D,bi)}
  C[8]=Math.max(C[8],clamp((1-D.hp/CASTLE_HP-.35)*1.4,0,1));D.csd=true;if(C[8]>.5&&D.msState)wreckLauncher(D)}
function hurtLauncher(D,x,z,dmg){if(D.msState!==2)return;const c=castlePos(D.seat);if(Math.hypot(x-c.x,z-c.z)>6)return;D.msHp=(D.msHp==null?MS_HP:D.msHp)-dmg;if(D.msHp<=0)wreckLauncher(D);else markBuilt(D)}
function wreckLauncher(D){const c=castlePos(D.seat),y=heightAt(c.x,c.z)+KH+2;D.msState=0;D.msHp=MS_HP;markBuilt(D);boom(c.x,y,c.z,6,'#ff7a2a');boom(c.x,y+2,c.z,3.5,'#ffe08a');burst(c.x,y,c.z,20,['#d8dde2','#59626c','#ff9a30'],12,1.4,.35);fxAt(D,c.x,c.z,'fuze');if(D===ME)tip(TL('Füze sistemin vuruldu! Yeniden kurmalısın.','Your missile system was destroyed! Build it again.'))}
function buildMissileSys(D){if(D.msState||D.money<MS_COST)return false;D.money-=MS_COST;D.msState=1;D.msHp=MS_HP;D.msT=MS_T;markBuilt(D);hire(D);return true}
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
// a bomb run: a straight line the player lays anywhere over the enemy base, any way round. The bombs fall exactly on its marks
const RUN_L=64,RUN_N=16;
const runPts=ln=>{const[cx,cz,a]=ln,dx=Math.cos(a),dz=Math.sin(a);return[...Array(RUN_N)].map((_,i)=>{const k=-RUN_L/2+RUN_L*i/(RUN_N-1);return{x:cx+dx*k,z:cz+dz*k}})};
const runOk=o=>o&&Array.isArray(o.ln)&&o.ln.length===3&&o.ln.every(v=>Number.isFinite(+v))?[clamp(+o.ln[0],-L,L),clamp(+o.ln[1],-L,L),+o.ln[2]]:null;
function runFor(from,to,x,z){const a=castlePos(from),b=castlePos(to),c=x==null?b:{x,z};return[Math.round(c.x),Math.round(c.z),+Math.atan2(b.z-a.z,b.x-a.x).toFixed(3)]}
function laneZ(to,l){if(!laneZs[to]){const c=castlePos(to);let lo=1e9,hi=-1e9;for(let z=c.z-150;z<=c.z+150;z+=3)for(const dx of[-30,0,30]){const x=c.x+dx;if(seatAt(x,z)===to&&shoreOf(x,z)>3&&outerD(x,z)<-8&&Math.abs(z-c.z)<130){lo=Math.min(lo,z);hi=Math.max(hi,z)}}
  if(lo>hi){lo=c.z-50;hi=c.z+50}lo+=9;hi-=9;laneZs[to]=Array.from({length:LANES},(_,i)=>Math.round(lo+(hi-lo)*i/(LANES-1)))}return laneZs[to][clamp(l|0,0,LANES-1)]}
const LAUNCH=[0,1,2,3].map(s=>{const d=DOCK[s],a=d.ang,w=(x,z)=>({x:d.land.x+x*Math.cos(a)+z*Math.sin(a),z:d.land.z-x*Math.sin(a)+z*Math.cos(a)});
  let k=26,pk=w(-7,5+k);while(k<90&&shoreOf(pk.x,pk.z)>-7){k+=4;pk=w(-7,5+k)}return{st:w(-7,5),mid:w(-7,21),park:pk}});
function runwayOf(s){
  const c=castlePos(s),dk=DOCK[s].land;let best=null,bv=-1e9;
  for(let ax=36;ax<=146;ax+=5)for(let az=DUEL?-90:36;az<=(DUEL?90:146);az+=5)for(const o of[0,1]){
    const cx=SX[s]*ax,cz=DUEL?az:SZ[s]*az,ux=o,uz=1-o;let ok=true,lo=1e9,hi=-1e9;
    for(let k=-28;k<=28&&ok;k+=4)for(const w of[-5,0,5]){const x=cx+ux*k-uz*w,z=cz+uz*k+ux*w;
      if(seatAt(x,z)!==s||shoreOf(x,z)<WL+4||roadDist(x,z)<7.5||Math.hypot(x-c.x,z-c.z)<(DUEL?30:17)||Math.hypot(x-dk.x,z-dk.z)<15||Math.max(Math.abs(x),Math.abs(z))>L-4){ok=false;break}
      const h=baseHeight(x,z);lo=Math.min(lo,h);hi=Math.max(hi,h)}
    if(!ok)continue;const v=-(DUEL?Math.abs(Math.hypot(cx-c.x,cz-c.z)-58):Math.hypot(cx-c.x,cz-c.z))*.6-(hi-lo)*9;if(v>bv){bv=v;best={c:{x:cx,z:cz},ux,uz}}}
  if(!best)return null;const{c:m,ux,uz}=best,len=54;
  let a={x:m.x-ux*len/2,z:m.z-uz*len/2},b={x:m.x+ux*len/2,z:m.z+uz*len/2};
  if(Math.hypot(b.x-c.x,b.z-c.z)<Math.hypot(a.x-c.x,a.z-c.z))[a,b]=[b,a];
  return{a,b,c:m,ux,uz,len};
}
const RWY=[0,1,2,3].map(runwayOf);
// 1v1 is fair: the second base gets exactly the first base's layout, turned round to its own side of the map
const duelRot=p=>{const c0=castlePos(0),c1=castlePos(1),t=Math.atan2(c1.z,c1.x)-Math.atan2(c0.z,c0.x),C=Math.cos(t),S=Math.sin(t);return{x:p.x*C-p.z*S,z:p.x*S+p.z*C}};
if(DUEL&&RWY[0]){const r=RWY[0],c0=castlePos(0),c1=castlePos(1),t=Math.atan2(c1.z,c1.x)-Math.atan2(c0.z,c0.x),C=Math.cos(t),S=Math.sin(t);RWY[1]={...r,a:duelRot(r.a),b:duelRot(r.b),c:duelRot(r.c),ux:r.ux*C-r.uz*S,uz:r.ux*S+r.uz*C}}
// the muster field: trained soldiers wait here, on an open flank of the castle well clear of the road, and heal while they wait.
// Every base tries the same spots in the same order, so each gets its field at the same distance
const RALLY=[0,1,2,3].map(s=>{const c=castlePos(s);if(!ROAD[s])return c;const a0=castleAng(s),rw=RWY[s],dk=DOCK[s];
  const ok=(x,z)=>{for(let a=0;a<6.28;a+=.52)for(const rr of[0,6,11]){const X=x+Math.cos(a)*rr,Z=z+Math.sin(a)*rr;if(seatAt(X,Z)!==s||shoreOf(X,Z)<WL+3||Math.max(Math.abs(X),Math.abs(Z))>L-3||roadDist(X,Z)<5)return false}
    if(rw){const dx=x-rw.c.x,dz=z-rw.c.z;if(Math.abs(dx*rw.ux+dz*rw.uz)<42&&Math.abs(-dx*rw.uz+dz*rw.ux)<20)return false}return Math.hypot(x-dk.land.x,z-dk.land.z)>24};
  const sg=DUEL?(s?-1:1):SX[s]*SZ[s];
  for(const d of[27,31,35,24])for(const da of[1.25,-1.25,1.7,-1.7,.85,-.85,2.2,-2.2,Math.PI]){const a=a0+da*sg,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;if(ok(x,z))return{x:Math.round(x),z:Math.round(z)}}
  return{x:Math.round(c.x+Math.cos(a0+1.25)*27),z:Math.round(c.z+Math.sin(a0+1.25)*27)}});
if(DUEL){const r=duelRot(RALLY[0]);RALLY[1]={x:Math.round(r.x),z:Math.round(r.z)}}
function reserved(s,x,z){
  {const q=RALLY[s];if(q&&Math.hypot(x-q.x,z-q.z)<12.5)return true}
  const r=RWY[s];if(r){const dx=x-r.c.x,dz=z-r.c.z,a=dx*r.ux+dz*r.uz,b=-dx*r.uz+dz*r.ux;if(Math.abs(a)<31&&Math.abs(b)<8)return true}
  const d=DOCK[s];return Math.hypot(x-d.land.x,z-d.land.z)<12;
}
function polyPath(pts){if(pts.some(q=>!q||!Number.isFinite(q.x)||!Number.isFinite(q.z))){pts=pts.filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z));if(!pts.length)pts=[{x:0,z:0}]}     // never let a bad point break a route
  const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z));return{pts,c,len:c[c.length-1]}}
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
// every computer player has its own way of playing: rushers, builders, sailors, flyers and all-rounders
const STYLES={dengeli:{},saldirgan:{atkT:25,minG:2,twr:.55,wave:1.2,W:{piyade:5,atli:5,koc:3}},kale:{atkT:120,minG:5,twr:1.5,wave:2.2,walls:6,W:{koc:2,balon:2}},deniz:{yardT:35,W:{gemi:7,denizalti:6,piyade:1.5}},hava:{rwT:70,msT:50,W:{ucak:7,balon:7,fuze:4}}};
{const ks=Object.keys(STYLES);let k0=(Math.random()*ks.length)|0;for(const D of P)if(D.bot){D.style=ks[k0++%ks.length];D.st=STYLES[D.style]}}
const ME=P[A.seat],local=p=>p===ME||p.bot;
const ALLY=[[],[],[],[]],allied=(a,b)=>a===b||!!ALLY[a][b];
let askFrom=0,aim=null,route=null,draft=null,paintAt=null,uid=1+(A.seat|0)*1000000,tid=1,ended=false,target=null,build=null,picked=null,tipT=0;

function canBuild(D,x,z,type){
  const wall=type==='duvar';
  if(seatAt(x,z)!==D.seat||(DUEL&&Math.abs(x)<DIN-4)||shoreOf(x,z)<WL+2.5||Math.max(Math.abs(x),Math.abs(z))>L-3||(!wall&&roadDist(x,z)<3.6))return false;
  const c=castlePos(D.seat);if(Math.hypot(x-c.x,z-c.z)<CH*1.42+2.2||D.towers.length>=MAX_TOWERS)return false;
  if(reserved(D.seat,x,z))return false;
  const fr=k=>k==='duvar'?1.1:k==='ok'?3:2.8;     // each building keeps its own footprint clear: roofs and walls never sink into one another
  return!D.towers.some(t=>Math.hypot(t.x-x,t.z-z)<(wall&&t.type==='duvar'?WALL-.1:fr(type)+fr(t.type)+.3))&&!(DUEL&&DBR.some(b=>!b.down&&segD(x,z,b)<BRW+fr(type)));
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
  for(const id of JOBS){const t=jobOf(D,id);if(!t)continue;let have=ws.filter(u=>u.site===id).length;
    while(have<t.n){const idle=ws.find(u=>u.site==null);
      if(idle){idle.slot=have;sendWorker(idle,t);have++;continue}
      if(n>=WMAX)return;const gq=gateNear(D.seat,t.x,t.z),u={id:uid++,type:'isci',from:D.seat,s:0,hp:UNITS.isci.hp,x:gq.x+(Math.random()-.5)*1.6,z:gq.z+(Math.random()-.5)*1.6,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0,slot:have};
      D.units.push(u);ws.push(u);n++;sendWorker(u,t);have++}}
}
function sendWorker(u,t){
  const a=(u.id%5)*1.256+(u.slot||0)*Math.PI,r=t.type==='duvar'?2.4:3.1,spot=t.job?t.spot(u.slot||0):{x:t.x+Math.cos(a)*r,z:t.z+Math.sin(a)*r};
  u.site=t.job||t.id;u.jx=spot.fx;u.jz=spot.fz;u.path=polyPath(nav({x:u.x,z:u.z},spot)||[{x:u.x,z:u.z},spot]);u.s=0;u.end=u.path.len;u.home=false;u.atk=false;
}
function workerTick(D,u,dt,home){
  if(u.foe&&Math.hypot(u.foe.x-u.x,u.foe.z-u.z)<3.2)u.fk=true;
  const t=u.site==null?null:typeof u.site==='string'?jobOf(D,u.site):D.towers.find(o=>o.id===u.site);
  if(u.site!=null&&(!t||!(t.bt>0))){u.site=null;hire(D);if(u.site==null){u.home=true;const gq=gateNear(D.seat,u.x,u.z);u.path=polyPath(nav({x:u.x,z:u.z},gq)||[{x:u.x,z:u.z},gq]);u.s=0;u.end=u.path.len}}     // back in through the nearest gate
  if(u.s<u.end){const step=UNITS.isci.sp*dt*drag(u,dt);u.s=Math.min(u.end,u.s+step);const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.atk=false;u.moving=true;u.face=null;return}
  if(u.home||u.site==null){u.done=true;return}
  const fx=t.job&&u.jx!=null?u.jx:t.x,fz=t.job&&u.jz!=null?u.jz:t.z;u.moving=false;u.atk=true;u.cdM=.8;u.face=Math.atan2(fx-u.x,fz-u.z);if(u.cd<=0){u.cd=.8;if(Math.random()<.35)sparks(u.x+(fx-u.x)*.3,u.z+(fz-u.z)*.3)}
}
function siteTick(D,dt){
  D.hireT=(D.hireT||0)-dt;let need=false;
  for(const t of D.towers){if(!(t.bt>0))continue;need=true;
    let k=0;for(const u of D.units)if(u.type==='isci'&&u.site===t.id&&u.atk&&u.hp>0)k++;
    t.bt-=dt*(TUT?99:k/want(t));
    if(!t.up&&t.mesh){const sy=.12+.88*clamp(1-t.bt/t.BT,0,1);if(Math.abs((t.mesh.sy||1)-sy)>.02||t.bt<=0){t.mesh.sy=t.bt<=0?1:sy;t.mesh.tpl.dirty=true}}
    if(t.bt<=0){t.bt=0;if(t.up){t.up=false;t.lvl++;t.hp=maxHp(t);dropModel(t.mesh);makeTowerModel(t);if(picked===t)pick(t)}
      markBuilt(D);boom(t.x,1,t.z,1,'#c9c9c9');if(D===ME){tip((EN?`${TOWERS[t.type].ad} ready`:`${TOWERS[t.type].ad} hazır`));SES.para()}}}
  if(!need)for(const id of JOBS)if(jobOf(D,id)){need=true;break}
  if(need){D.dirty=true;if(D.hireT<=0){D.hireT=.6;hire(D)}}
}
function sendUnit(D,to,type,o){
  const U=UNITS[type],built=!!(o&&o.built);if(!U||D.dead||(!built&&D.money<U.cost))return false;
  const R=P[to];if(!R||R.dead||(R===D&&type!=='fuze')||(R!==D&&allied(D.seat,to)))return false;
  if(UNITS[type].yol==='kara'&&!(o&&o.via)&&!landRoute(D.seat,to,0))return false;
  if(!built&&R.units.length+R.remote.size>150)return false;
  if(type==='ucak'&&!built&&D.rwState!==2)return false;
  if(type==='ucak'&&!built){if(D.hg)return false;D.money-=U.cost;D.hg={t:PLANE_T,T:PLANE_T,to,ln:runOk(o)||runFor(D.seat,to)};return true}   // a bomber is built, then takes off by itself for the run its owner chose
  if(type==='fuze'&&!built){if(D.fcd>0||D.msState!==2)return false;D.fcd=FUZE_CD;launchFx(D.seat,o&&toPt(o.at))}
  if((type==='denizalti'||type==='gemi')&&!built){if(D.yard||D.ysState!==2||(type==='gemi'&&fleet(D.seat)>=MAX_SHIPS))return false;D.money-=U.cost;D.yard={type,to,t:BUILD_T[type],T:BUILD_T[type]};hire(D);return true}
  if(!built)D.money-=U.cost;
  if(local(R))spawn(R,type,D.seat,o);else say('send',{to,from:D.seat,type,o});
  return true;
}
const toPt=a=>Array.isArray(a)?{x:clamp(num(a[0]),-VIEW,VIEW),z:clamp(num(a[1]),-VIEW,VIEW)}:null;
function spawn(R,type,from,o){
  if(o&&o.cmd){const st=toPt(o.start),U=UNITS[type],via=Array.isArray(o.via)?o.via.slice(0,60).map(toPt).filter(Boolean):[];if(!st||!U||!CMDABLE.has(type)||type==='ucak'||!via.length)return;
    const id=typeof o.keep==='number'&&!R.units.some(q=>q.id===o.keep)?o.keep:uid++,u={id,type,from,path:polyPath([st,{x:st.x+.01,z:st.z}]),s:0,hp:clamp(num(o.hp,U.hp),1,U.hp),x:st.x,z:st.z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0};
    R.units.push(u);setRoute(u,R,via);if(o.rally)u.goRally=true;if((o.march||o.rally)&&typeof o.lock!=='number')u.march=true;if(typeof o.lock==='number'){u.lock=o.lock;u.hold=true;u.siege=false;u.ftgt=null;const t=unitById(o.lock);u.lockK=t?t.type:null}return}
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
  const toGate=!at&&(U.yol==='kara'||type==='atli')&&pts.length>1;if(toGate)pts[pts.length-1]=gateApproach(R.seat,pts[pts.length-2]);
  const path=polyPath(pts);
  const u={id,type,from,path,s:0,hp:UNITS[type].hp,x:0,z:0,bomb:0,cd:0,end:path.len-(toGate?1+id%3:type==='balon'?2:type==='denizalti'?22:7+id%5),lane:((id*7)%5-2)*.85,lx:0,lz:0,vx:0,vz:0};u.x=path.pts[0].x;u.z=path.pts[0].z;R.units.push(u);
  if(type==='gemi'&&o&&o.hp)u.hp=clamp(num(o.hp,U.hp),1,U.hp);
  if(type==='ucak'){const ln=runOk(o)||runFor(from,R.seat),dx=Math.cos(ln[2]),dz=Math.sin(ln[2]),h=RUN_L/2;u.ln=ln;u.bp=runPts(ln);u.via=[{x:ln[0]-dx*(h+95),z:ln[1]-dz*(h+95)},{x:ln[0]-dx*h,z:ln[1]-dz*h},{x:ln[0]+dx*(h+80),z:ln[1]+dz*(h+80)}];u.lane=0}
  if(type==='ucak'&&o&&o.hp)u.hp=clamp(num(o.hp,U.hp),1,U.hp);
  if(type==='gemi'){let e=path.len-20;for(let q=0;q<path.len;q+=2){const p=pointOn(path,q);if(Math.hypot(p.x-b.x,p.z-b.z)<80){e=q;break}}u.end=e}
  if(type==='ucak'){u.ph=RWY[from]?'roll':'fly';u.spd=0;u.nb=0;u.dropT=0;u.hd=Math.atan2(pts[1].x-pts[0].x,pts[1].z-pts[0].z);u.alt=RWY[from]?heightAt(u.x,u.z)+1.3:28}
  if(type==='fuze'){const e=path.pts[path.pts.length-1];u.tx=e.x;u.tz=e.z;u.y0=Math.max(heightAt(a.x,a.z),0)+KH+1.8;if(o&&typeof o.lock==='number')u.lockT=o.lock}
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
// where a submarine's line first runs from the sea onto someone else's land: the divers go ashore exactly there
function coastCross(from,pts){let wet=null;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],l=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(l/1.5));
    for(let k=0;k<=n;k++){const x=a.x+(b.x-a.x)*k/n,z=a.z+(b.z-a.z)*k/n,land=shoreOf(x,z)>WL+.6;
      if(!land){wet={x,z,i};continue}if(wet&&!allied(seatAt(x,z),from))return{W:wet,L:{x,z}}}}return null}
function setRoute(u,D,pts){
  let cc=null;if(u.type==='denizalti'){cc=coastCross(u.from,[{x:u.x,z:u.z},...pts]);if(cc)pts=[...pts.slice(0,Math.max(0,cc.W.i)),{x:cc.W.x,z:cc.W.z}]}     // sail to the spot where the line meets the shore, not past it
  const U=UNITS[u.type],cur={x:u.x,z:u.z},e=pts[pts.length-1];let p;
  if(naval(u.type))p=roundPath(seaRoute([cur,...pts],u.type==='denizalti'),u.type==='denizalti'?10:18);
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
  if(u.type==='gemi'&&foe&&!u.aim&&D.ysState&&DOCK[D.seat]&&Math.hypot(DOCK[D.seat].land.x-e.x,DOCK[D.seat].land.z-e.z)<30){u.aim={x:e.x,z:e.z};u.hold=false}     // sent at the enemy shipyard: shell it
  if(u.siege&&!naval(u.type)&&!tw){u.end=Math.max(0,u.path.len-(5.5+u.id%5));u.lane=((u.id*7)%5-2)*.85}
  if(u.type==='gemi'&&u.aim){u.end=u.path.len;for(let q=0;q<=u.path.len;q+=2){const r=pointOn(u.path,q);if(Math.hypot(r.x-u.aim.x,r.z-u.aim.z)<=SHIP_STAND){u.end=q;break}}}   // stop as soon as the guns reach
  if(u.type==='denizalti'){const q=u.path.pts[u.path.pts.length-1],l=cc?cc.L:landNear(q.x,q.z,shoreOf(e.x,e.z)>-9?46:SUB_LAND);     // land the divers only when the line ends at a shore, never out in open sea
    u.land=l&&seatAt(l.x,l.z)===D.seat?l:null;u.hold=!(foe&&u.land)}
}
// a finished bomber waits at the head of its runway, a finished warship at its dock, until they are sent
function parkPlane(D){const r=RWY[D.seat];if(!r)return;const k=D.units.filter(u=>u.type==='ucak'&&u.ph==='park').length,dx=(r.b.x-r.a.x)/r.len,dz=(r.b.z-r.a.z)/r.len,x=r.a.x+dx*(4+k*9),z=r.a.z+dz*(4+k*9);
  D.units.push({id:uid++,type:'ucak',from:D.seat,path:polyPath([{x,z},{x:x+.01,z}]),s:0,hp:UNITS.ucak.hp,x,z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0,ph:'park',hd:Math.atan2(dx,dz),alt:heightAt(x,z)+1.3,spd:0,nb:0,dropT:0})}
function parkShip(D,type){const L0=LAUNCH[D.seat],p=L0.park,a=DOCK[D.seat].ang,ca=Math.cos(a),sa=Math.sin(a);
  // berths side by side off the dock, then a second row further out: a new ship never parks inside one already waiting there
  const taken=(x,z)=>D.units.some(u=>naval(u.type)&&!u.done&&Math.hypot((u.path?pointOn(u.path,u.end).x:u.x)-x,(u.path?pointOn(u.path,u.end).z:u.z)-z)<11);let q=p;
  for(const[o,f]of[[-10,0],[10,0],[-24,0],[24,0],[-10,16],[10,16],[-24,16],[24,16],[0,30],[-17,30],[17,30]]){const x=p.x+o*ca+f*sa,z=p.z-o*sa+f*ca;if(shoreOf(x,z)<-5&&!taken(x,z)){q={x,z};break}}
  const path=polyPath([L0.st,L0.mid,q]);
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
    if(rally){if(naval(u.type)||u.type==='ucak')continue;const R=RALLY[by];          // back to the muster field to heal
      if(D.seat===by){setRoute(u,D,[R]);u.goRally=true;u.march=true;u.foe=null;continue}
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
    if(S===D.seat){setRoute(u,D,pts);if(lock==null){u.march=true;u.foe=null;u.atk=false}if(lock!=null){u.lock=lock;u.hold=true;u.siege=false;u.ftgt=null;u.rp2=3;const t=unitById(lock);u.lockK=t?t.type:null}continue}
    u.done=true;const o={start:[Math.round(u.x),Math.round(u.z)],via:pts.map(p=>[Math.round(p.x),Math.round(p.z)]),hp:Math.round(u.hp),cmd:1,keep:u.id,lock,march:lock==null?1:0};
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
  if(type==='fuze'||type==='dalgic'&&x==null)return;
  if(type==='ucak'){const f=castlePos(clamp(fallen|0,0,3)),c=castlePos(O.seat),X=x!=null?num(x,f.x):f.x,Z=x!=null?num(z,f.z):f.z;     // a bomber whose target fell simply flies home and lands
    O.units.push({id:uid++,type:'ucak',from:O.seat,path:polyPath([{x:X,z:Z},{x:X+.01,z:Z}]),s:0,hp:clamp(hp,1,UNITS.ucak.hp),x:X,z:Z,bomb:0,cd:0,end:0,lane:0,lx:0,lz:0,vx:0,vz:0,ph:'home',hd:Math.atan2(c.x-X,c.z-Z),alt:28,spd:UNITS.ucak.sp,nb:12,dropT:0,t2:0});return}
  const p=pathFor(type,O.seat,fallen),at=clamp(s,0,p.len),pts=[pointOn(p,at)];
  for(let i=p.pts.length-1;i>=0;i--)if(p.c[i]<at)pts.push(p.pts[i]);
  const back=polyPath(x!=null?(UNITS[type].yol==='kara'?(nav({x,z:num(z)},castlePos(O.seat))||[{x,z:num(z)},castlePos(O.seat)]):[{x,z:num(z)},castlePos(O.seat)]):pts);pts[0]=back.pts[0];
  O.units.push({id:uid++,type,from:O.seat,path:back,s:0,hp:clamp(hp,1,UNITS[type].hp),x:pts[0].x,z:pts[0].z,bomb:0,cd:0,end:back.len,ret:true});
}
function damageCastle(R,d,x,z){
  R.hp=Math.max(0,R.hp-d);castleHit(R,x,z,d);
  if(R.hp<=0&&!R.dead)eliminate(R);
}
const KILL_BONUS=300;
// whoever brings a castle down is paid for it: split between the sides whose troops stood at its walls, or the last one to shell it
function killBonus(R){if(!local(R))return;const c=castlePos(R.seat),sh={};let n=0;
  for(const u of R.units){if(u.done||u.hp<=0||allied(u.from,R.seat)||!P[u.from]||P[u.from].dead)continue;if(Math.hypot(u.x-c.x,u.z-c.z)<45){sh[u.from]=(sh[u.from]||0)+1;n++}}
  if(!n&&R.lastBy!=null&&P[R.lastBy]&&!allied(R.lastBy,R.seat)){sh[R.lastBy]=1;n=1}
  for(const k in sh){const amt=Math.round(KILL_BONUS*sh[k]/n),O=P[k];if(local(O))payBonus(O,amt,R);else say('bonus',{to:+k,amt,from:R.seat})}}
function payBonus(O,amt,R){O.money+=amt;if(O===ME){tip(EN?`Castle destroyed! +${amt} gold`:`Kale yıkıldı! +${amt} {au}`);SES.para();setTimeout(()=>SES.para(),180)}}
function eliminate(R){
  if(!R.dead)try{killBonus(R)}catch(e){}
  R.dead=true;R.hp=0;R.deadAt=now();{const C=csOf(R);C[8]=1;for(let i=0;i<8;i++)C[i]=C[i]>.2?Math.min(1,C[i]+.45+Math.random()*.2):.12+Math.random()*.12;R.ach=[0,0,0,0];ARCHD=true;R.msState=0;const c=castlePos(R.seat);fxAt(R,c.x,c.z,'yikil')}     // the keep falls; what was fought over is a ruin, the rest stands scarred
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
// you only hear what is on screen: louder the closer the camera, panned left or right with where it is
const sv3=new THREE.Vector3();
function sndAt(x,z){sv3.set(x,Math.max(heightAt(x,z),0)+1,z);const dist=camera.position.distanceTo(sv3);sv3.project(camera);if(sv3.z>1||Math.abs(sv3.x)>1.08||Math.abs(sv3.y)>1.08)return null;return{v:clamp(1.25-dist/240,0,1),p:clamp(sv3.x,-1,1)*.6}}
function fxAt(D,x,z,kind){
  const q=sndAt(x,z);if(!q||q.v<.04)return;const f=SES[kind==='vur'?'kilic':kind];
  if(f)f.call(SES,q.v,q.p);
}
function ambience(){
  let horse=0,water=0;
  for(const D of P){
    if(!D.on)continue;
    const lo=local(D);for(const u of lo?D.units:D.remote.values()){
      if(u.type!=='atli')continue;const mv=lo?u.moving&&!u.atk&&!u.done&&u.hp>0:Math.hypot(u.tx-u.x,u.tz-u.z)>.4;if(!mv)continue;const q=sndAt(u.x,u.z),v=q?q.v:0;
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
  // an explosion hurts everyone under it: the side that set it off only a little (friendly fire), never its own castle or runway
  hurtArchers(D,x,z,r+3,Math.max(unitDmg||0,towerDmg*.4));hurtLauncher(D,x,z,towerDmg*.6);
  for(const t of D.towers.slice()){const d=Math.hypot(t.x-x,t.z-z);if(d>=r)continue;t.hp-=towerDmg*(1-d/r*.6);t.shake=.3;if(t.hp<=0){explode(t.x,t.z,2);crater(t.x,t.z,3.6);removeTower(D,t)}}
  if(unitDmg)for(const o of D.units)if(!o.ret&&!flies(UNITS[o.type])&&Math.hypot(o.x-x,o.z-z)<r)o.hp-=unitDmg;
  if(towerDmg&&D.rwState===2&&RWY[D.seat]){const w=RWY[D.seat],dx=x-w.c.x,dz=z-w.c.z;      // bombs and missiles crack a runway open; badly cracked, no plane can take off until it is mended
    if(Math.abs(dx*w.ux+dz*w.uz)<w.len/2+r*.6&&Math.abs(-dx*w.uz+dz*w.ux)<5+r*.6){const was=rwBad(D);D.rwHp=Math.max(0,(D.rwHp==null?RW_HP:D.rwHp)-towerDmg*.8);markBuilt(D);
      if(D===ME){if(!was&&rwBad(D))tip(TL('Pistin ağır hasarlı! Uçak kalkamaz: Savunma → Pist ile onar.','Your runway is badly damaged! No plane can take off: repair it under Defense → Runway.'));else if(now()-(rwTipT||0)>5000){rwTipT=now();tip(TL('Pistin vuruluyor!','Your runway is being hit!'))}}}}
  if(towerDmg&&D.ysState&&DOCK[D.seat]){const L0=DOCK[D.seat].land;if(Math.hypot(L0.x-x,L0.z-z)<r+7){D.ysHp=(D.ysHp==null?YS_HP:D.ysHp)-towerDmg*.8;markBuilt(D);     // the shipyard can be shelled to pieces too
    if(D.ysHp<=0)wreckYard(D);else if(D===ME&&now()-(ysTipT||0)>5000){ysTipT=now();tip(TL('Tersanen vuruluyor!','Your shipyard is being hit!'))}}}
  const c=castlePos(D.seat);if(castleDmg&&Math.hypot(c.x-x,c.z-z)<12){if(from!=null&&from!==D.seat)D.lastBy=from;damageCastle(D,castleDmg,x,z)}
}
const YS_HP=300;let ysTipT=0;
function wreckYard(D){const L0=DOCK[D.seat].land;D.ysState=0;D.ysWreck=now();D.yard=null;D.ysHp=YS_HP;markBuilt(D);explode(L0.x,L0.z,3);boom(L0.x,3,L0.z,6,'#ff7a2a');burst(L0.x,2,L0.z,22,['#6b4a2a','#3b2d24','#8f8a7c','#ff9a30'],12,1.4,.32);fxAt(D,L0.x,L0.z,'yikil');
  if(D===ME)tip(TL('Tersanen yıkıldı! Savunma → Tersane ile yeniden kur.','Your shipyard was destroyed! Rebuild it under Defense → Shipyard.'));else if(!allied(D.seat,ME.seat)&&D.on)tip(TL(`${D.name} tersanesi yıkıldı!`,`${D.name}'s shipyard is down!`))}
const FF=.2,RW_HP=420;let rwTipT=0;
const rwHpOf=D=>D.rwHp==null?RW_HP:D.rwHp,rwBad=D=>D.rwState===2&&rwHpOf(D)<=RW_HP*.25,rwCost=D=>Math.max(10,Math.round(90*(1-rwHpOf(D)/RW_HP)));
function repairRunway(D){if(D.rwState!==2||D.rwFix||rwHpOf(D)>=RW_HP||D.money<rwCost(D))return false;D.money-=rwCost(D);D.rwFix=true;markBuilt(D);hire(D);return true}
// work away from the towers: building the runway or the shipyard, mending the runway, building a ship. The castle's own workers walk out to do it
function jobOf(D,id){
  if(id==='rw'){const w=RWY[D.seat];if(!w||!(D.rwState===1||D.rwFix))return null;return{job:'rw',x:w.c.x,z:w.c.z,bt:1,n:3,spot:k=>{const a=(k%3-1)*15,sd=k>2?-1:1;return{x:w.c.x+w.ux*a+w.uz*5.5*sd,z:w.c.z+w.uz*a-w.ux*5.5*sd,fx:w.c.x+w.ux*a,fz:w.c.z+w.uz*a}}}}
  if(id==='cs'){if(!D.cfix)return null;const G=gates(D.seat),c=castlePos(D.seat),C=csOf(D),S=SEGC[D.seat]||[];return{job:'cs',x:c.x,z:c.z,bt:1,n:4,spot:k=>{let w=-1,wv=.01;for(let i=0;i<8;i++)if(C[i]>wv&&(i+k)%2===0){wv=C[i];w=i}const q=G[k%4];if(w>=0&&S[w]){const dx=S[w].x-c.x,dz=S[w].z-c.z,l=Math.hypot(dx,dz)||1;return{x:S[w].x+dx/l*3.5,z:S[w].z+dz/l*3.5,fx:S[w].x,fz:S[w].z}}return{x:q.x+(q.x-c.x)*.25,z:q.z+(q.z-c.z)*.25,fx:c.x,fz:c.z}}}}
  if(id==='yd'){if(!D.yard||D.ysState!==2||!LAUNCH[D.seat])return null;const L0=LAUNCH[D.seat],st=L0.st,dx=L0.mid.x-st.x,dz=L0.mid.z-st.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;     // the shipwrights stand round the new hull on the slipway and hammer at it
    return{job:'yd',x:st.x,z:st.z,bt:1,n:3,spot:k=>{const sd=k%2?1:-1,a=(k-1)*2.2;return{x:st.x-uz*sd*3.4+ux*a,z:st.z+ux*sd*3.4+uz*a,fx:st.x+ux*a,fz:st.z+uz*a}}}}
  if(id==='ms'){if(D.msState!==1)return null;const G=gates(D.seat),c=castlePos(D.seat);return{job:'ms',x:c.x,z:c.z,bt:1,n:2,spot:k=>{const q=G[k%4];return{x:c.x+(q.x-c.x)*.62,z:c.z+(q.z-c.z)*.62,fx:c.x,fz:c.z}}}}
  if(id==='pw'){const w=D.pw;if(!w)return null;let ex,ez,fx,fz;     // public works: the castle's workers walk out and rebuild a bridge or the plaza themselves
    if(w.k==='br'||w.k==='nb'){const b=w.k==='br'?DBR[w.i]:w.b,c=castlePos(D.seat),e=Math.hypot(b.a.x-c.x,b.a.z-c.z)<Math.hypot(b.b.x-c.x,b.b.z-c.z)?b.a:b.b,o=e===b.a?b.b:b.a,l=Math.hypot(o.x-e.x,o.z-e.z)||1;ex=e.x-(o.x-e.x)/l*1.2;ez=e.z-(o.z-e.z)/l*1.2;fx=e.x+(o.x-e.x)/l*4;fz=e.z+(o.z-e.z)/l*4}
    else{const c=castlePos(D.seat),l=Math.hypot(c.x,c.z)||1;ex=c.x/l*17;ez=c.z/l*17;fx=0;fz=0}
    return{job:'pw',x:ex,z:ez,bt:1,n:3,spot:k=>{const a=(k-1)*2.4,px=-(fz-ez),pz=fx-ex,pl=Math.hypot(px,pz)||1;return{x:ex+px/pl*a,z:ez+pz/pl*a,fx,fz}}}}
  if(id==='ys'){const d=DOCK[D.seat];if(!(D.ysState===1||(D.yard&&D.ysState===2)))return null;const L0=d.land,sa=Math.sin(d.ang),ca=Math.cos(d.ang);
    return{job:'ys',x:L0.x,z:L0.z,bt:1,n:D.ysState===1?3:2,spot:k=>{const o=[[-4,2],[4,1],[-1,-4]][k%3];return{x:L0.x+o[0]*ca+o[1]*sa,z:L0.z-o[0]*sa+o[1]*ca,fx:L0.x+sa*4,fz:L0.z+ca*4}}}}
  return null}
const JOBS=['rw','ys','ms','cs','pw','yd'];
function jobRate(D,id){if(TUT)return id==='cs'?4:99;let k=0;for(const u of D.units)if(u.type==='isci'&&u.site===id&&u.atk&&u.hp>0)k++;return Math.min(1,k/2.4)}
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
    // an order to go somewhere is obeyed: on the way they leave the fight and only take up arms again once there
    let bump=0;if(u.march){if(u.s<u.end-.5)bump=4.5;else u.march=false}
    // at home soldiers go for raiders they see; out on a march they only fight what they bump into
    let best=bump||(u.type==='isci'?6:u.from===D.seat?(u.rs!=null?28:22):7),f=null;for(const e of all){if(allied(e.from,u.from)||(e.nav&&u.type!=='dalgic')||(u.ign===e.id&&tnow<u.ignT))continue;const d=Math.hypot(e.x-u.x,e.z-u.z);if(d<best){best=d;f=e}}
    u.foe=f}
  const n=D.units.length;
  for(let i=0;i<n;i++){const a=D.units[i];if(!fighter(a.type)||a.ret)continue;const ra=a.type==='koc'?2.3:a.type==='atli'?1.5:.85;
    for(let j=i+1;j<n;j++){const b=D.units[j];if(!fighter(b.type)||b.ret)continue;const m=ra+(b.type==='koc'?2.3:b.type==='atli'?1.5:.85),dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||.01;
      if(d<m){const k=(m-d)/d*5;a.vx-=dx*k;a.vz-=dz*k;b.vx+=dx*k;b.vz+=dz*k}}}
}
// frogmen throw smoke grenades in front of guns that cover their way in; nothing in the smoke can be aimed at
const inSmoke=(D,x,z)=>{const S=D.smk;if(!S||!S.length)return false;for(const q of S)if((x-q.x)**2+(z-q.z)**2<q.r*q.r)return true;return false};
function frogSmoke(D,u,home,dt){
  // each frogman carries two grenades: one goes in front of the first gun covering the way in, the other the moment he is hit
  const hurt=u.php!=null&&u.hp<u.php-.5;u.php=u.hp;if(u.emerge>0||(u.smN||0)>=2)return;
  if(!hurt&&(u.smk=(u.smk||0)-dt)>0)return;if(!hurt)u.smk=.5;if(!hurt&&(D.smkT||(D.smkT={}))[u.from]>D.t)return;
  let th=null,bd=hurt?60:44;for(const t of D.towers){if(t.type==='duvar'||t.type==='hava'||t.type==='roket'||(t.bt>0&&!t.up))continue;const d=Math.hypot(t.x-u.x,t.z-u.z);if(d<bd){bd=d;th=t}}
  if(!th&&Math.hypot(home.x-u.x,home.z-u.z)<(hurt?60:46)){th=home;bd=Math.hypot(home.x-u.x,home.z-u.z)}if(!th)return;
  const k=hurt?Math.min(9,bd*.4):Math.min(16,bd*.55),dx=(th.x-u.x)/bd,dz=(th.z-u.z)/bd,x=u.x+dx*k,z=u.z+dz*k;if(inSmoke(D,x,z))return;
  (D.smkT||(D.smkT={}))[u.from]=D.t+4;u.smN=(u.smN||0)+1;const S=D.smk||(D.smk=[]);
  shell(D,u.x,unitY(UNITS.dalgic,u.x,u.z)+2.2,u.z,x,z,.8,2.5,'frag',(X,Z)=>{S.push({x:X,z:Z,r:12,t:7.5});boom(X,1,Z,2,'#e8e8e8');for(let j=0;j<8;j++)puff(X+(Math.random()-.5)*4,heightAt(X,Z)+1,Z+(Math.random()-.5)*4,4,3,.85,.8,2);fxAt(D,X,Z,'dalga')});
  if(D===ME&&now()-(smTipT||0)>8000){smTipT=now();tip(TL('Balık adamlar sis bombası attı!','Frogmen threw a smoke grenade!'))}
}
let smTipT=0;
function smokeTick(D,dt){const S=D.smk;if(!S||!S.length)return;for(let i=S.length-1;i>=0;i--){const q=S[i];q.t-=dt;if(q.t<=0)S.splice(i,1)}}
// the castle parts follow their damage: collapsing takes a moment, with dust; badly broken parts smoke, and a fallen castle burns
function drawRuin(dt){
  for(let s=0;s<4;s++){const U=CSU[s],D=P[s],S=SEGC[s];if(!U||!D||!S)continue;const C=csOf(D),v=U.uSeg.value;
    const fresh=now()-(D.csT||0)<14000,burning=D.dead&&now()-(D.deadAt||0)<13000;
    for(let i=0;i<9;i++){const tgt=C[i];if(Math.abs(v[i]-tgt)<.002)continue;const up=tgt>v[i];if(up&&tgt-v[i]>.05&&now()-(D.cfxT||0)>1300){D.cfxT=now();fxAt(D,S[i].x,S[i].z,'yikil')}v[i]=up?Math.min(tgt,v[i]+dt*.6):Math.max(tgt,v[i]-dt*.5);
      if(up&&Math.random()<dt*14){const q=S[i];puff(q.x+(Math.random()-.5)*4,q.y*.6,q.z+(Math.random()-.5)*4,2.2,2.4,.82,.6,1.4);if(Math.random()<.3)burst(q.x,q.y*.7,q.z,4,['#8f8a7c','#6e6a60'],6,1,.3)}}
    if(fresh||burning)for(let i=0;i<9;i++){if(C[i]<.55||Math.random()>dt*(burning?2.5:1.2))continue;const q=S[i];puff(q.x+(Math.random()-.5)*3,q.y*(1-C[i]*.8)+1,q.z+(Math.random()-.5)*3,2.6,3.4,.35,1.4,1.2);if(D.dead&&Math.random()<.4)flame(q.x+(Math.random()-.5)*3,q.y*(1-C[i]*.8)+.5,q.z+(Math.random()-.5)*3,1.6,.5)}
    const K=KARCH[s];if(K&&C[8]>.5)K.m.visible=false}}
function drawSmoke(dt){for(const D of P){const S=D.smk;if(!S)continue;for(const q of S){const n=dt*(q.t>2?7:3);for(let j=0;j<n||Math.random()<n-j;j++){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*q.r*.85,x=q.x+Math.cos(a)*r,z=q.z+Math.sin(a)*r;puff(x,heightAt(x,z)+.8+Math.random()*2,z,3.5+Math.random()*2.5,3.2,.88+Math.random()*.08,.35,1.6);if(j>8)break}}}}
// nobody walks through a castle: its walls are solid. Anyone who ends up inside its square is put back just outside the nearest wall
function keepOut(D){const E=CH+1.1;
  for(const R of P){if(!R.on)continue;const c=castlePos(R.seat),a=CANG[R.seat],ca=Math.cos(a),sa=Math.sin(a);
    for(const u of D.units){if(u.done||u.ret&&u.type==='gemi'||u.type==='isci'||u.fall!=null)continue;const Y=UNITS[u.type].yol;if(Y!=='kara'&&u.type!=='dalgic')continue;
      const dx=u.x-c.x,dz=u.z-c.z;if(Math.abs(dx)>E*1.5||Math.abs(dz)>E*1.5)continue;const lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;if(Math.abs(lx)>=E||Math.abs(lz)>=E)continue;
      let X=lx,Z=lz;if(E-Math.abs(lx)<E-Math.abs(lz))X=Math.sign(lx||1)*E;else Z=Math.sign(lz||1)*E;
      u.x=c.x+X*ca-Z*sa;u.z=c.z+X*sa+Z*ca;u.wallT=(u.wallT||0)+1}}}
function simDefender(D,dt){
  smokeTick(D,dt);if(D.dead)return;
  for(const t of D.towers)if(t.hp<=0){for(const q of D.towers.slice())if(q.hp<=0){explode(q.x,q.z,2);crater(q.x,q.z,3);removeTower(D,q)}break}
  D.money+=(1+Math.min(2,D.t/150))*dt;D.t+=dt;          // income grows as the match goes on
  const home=castlePos(D.seat);
  D.foeAcc=(D.foeAcc||0)+dt;if(D.foeAcc>=.2){D.foeAcc=0;scanFoes(D)}
  siteTick(D,dt);
  for(const u of D.units){
    const U=UNITS[u.type],air=U.yol==='hava';u.cd-=dt;u.bomb-=dt;u.atk=false;
    if(u.sink!=null){u.sink+=dt;u.moving=false;if(u.sink>.32&&!u.spl){u.spl=1;splash(u.x,u.z,1.8);ripple(u.x,u.z,3.5);fxAt(D,u.x,u.z,'dalga')}if(u.sink>2){u.hp=0;u.fk=true}continue}
    if(u.type==='isci'){workerTick(D,u,dt,home);continue}
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
      u.y=20-13*u.fall*u.fall;const sy=surfaceY(u.x,u.z),roof=sy>Math.max(heightAt(u.x,u.z),0)+1.2;
      if(u.y<=sy+1){u.done=true;boom(u.x,sy+3,u.z,7,'#ff7a2a');boom(u.x,sy+5,u.z,4,'#ffd27a');if(roof){burst(u.x,sy+1,u.z,14,['#8f8a7c','#6e6a60','#3b2d24'],9,1.2,.3);hurtLauncher(D,u.x,u.z,90)}else{explode(u.x,u.z,3);crater(u.x,u.z,4)}fxAt(D,u.x,u.z,'bomba');blast(D,u.x,u.z,8,90,U.dmg*2,u.from,45);if(D.dead)return}
      continue}
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
          for(let k=0;k<2;k++){if(!turOk(u,k))continue;const mz=shipMuzzle(u,k),ox=mz.x-u.x,oz=mz.z-u.z;shell(D,mz.x,2.1,mz.z,e.x+(Math.random()-.5)*5,e.z+(Math.random()-.5)*5,.8+d/60+k*.25,2.5+d*.07,'top',(x,z)=>{
            if(ref&&!ref.done&&Math.hypot(ref.x-x,ref.z-z)<7){ref.hp-=naval(ref.type)?34:45;ref.fk=ref.fk||from!==D.seat;explode(x,z,1.2);fxAt(D,x,z,'gemiVur')}else{splash(x,z,2.2);fxAt(D,x,z,'dalga')}});flame(u.x+ox,2.1,u.z+oz,3.2,.2);puff(u.x+ox,2.4,u.z+oz,2.2,2.2,.72,1,.5)}
          fxAt(D,u.x,u.z,'gemiTop');if(!ref)u.dmgT=1.2+Math.random()*.6}}
      if(u.dmgT>0){u.dmgT-=dt;if(u.dmgT<=0){u.hp-=60;explode(u.x+(Math.random()-.5)*4,u.z+(Math.random()-.5)*4,1.2)}}
      if(u.foeS||u.moving||u.hold||allied(u.from,D.seat)){}
      else{u.atk=!u.noT;u.cdM=3.4;
        if(u.cd<=0){u.cd=3.4;let tg=null,bd=u.aim?32:105;const ref=u.aim||u;for(const t of D.towers){const d=Math.hypot(t.x-ref.x,t.z-ref.z);if(d<bd&&Math.hypot(t.x-u.x,t.z-u.z)<125){bd=d;tg=t}}
          if(D.ysState&&DOCK[D.seat]){const L0=DOCK[D.seat].land,d=Math.hypot(L0.x-ref.x,L0.z-ref.z);if(d<(u.aim?32:bd)&&Math.hypot(L0.x-u.x,L0.z-u.z)<125){bd=d;tg={x:L0.x,z:L0.z}}}
          if(!tg&&Math.hypot(home.x-u.x,home.z-u.z)>(u.siege?125:110)){u.atk=false;u.noT=true;u.cd=.6;continue}u.noT=false;
          const tx=tg?tg.x:home.x,tz=tg?tg.z:home.z,d=Math.hypot(tx-u.x,tz-u.z),from=u.from;u.face=Math.atan2(tx-u.x,tz-u.z);
          for(let k=0;k<2;k++){if(!turOk(u,k))continue;const mz=shipMuzzle(u,k),ox=mz.x-u.x,oz=mz.z-u.z;
            shell(D,mz.x,2.1,mz.z,tx+(Math.random()-.5)*7,tz+(Math.random()-.5)*7,1+d/60+k*.3,3+d*.08,'top',(x,z)=>{explode(x,z,1.5);crater(x,z,3.2);fxAt(D,x,z,'gemiVur');blast(D,x,z,5.5,55,20,from,30)});
            flame(u.x+ox,2.1,u.z+oz,3.2,.2);puff(u.x+ox,2.4,u.z+oz,2.2,2.2,.72,1,.5)}
          fxAt(D,u.x,u.z,'gemiTop')}}
      continue}
    if(U.yol==='ucak'){const px=u.x,pz=u.z,ph=u.ph;planeTick(D,u,dt,home);if(!isFinite(u.x)||!isFinite(u.z)||!isFinite(u.hd)){if(!planeTick.bad){planeTick.bad=1;report('hata','plane NaN '+ph+'>'+u.ph+' '+Object.keys(u).join(',')+' '+JSON.stringify({px,pz,id:u.id,from:u.from,ds:D.seat,via:u.via&&u.via.slice(0,3),wi:u.wi,hd:u.hd,ln:u.ln,rw:!!RWY[u.from]}))}u.x=isFinite(px)?px:home.x;u.z=isFinite(pz)?pz:home.z;u.hd=isFinite(u.hd)?u.hd:0;u.ph='home'}if(D.dead)return;continue}
    if(U.yol==='deniz'){          // sail round the coast, then land the divers
      if(u.dove!=null){u.dove+=dt;u.moving=false;if(u.dove>2.4)u.done=true;continue}
      if(u.s<u.end){u.s=Math.min(u.end,u.s+U.sp*(TUT?3.5:1)*dt);u.moving=true}else u.moving=false;
      {const p=pointOn(u.path,u.s);u.x=p.x+(u.ox||0);u.z=p.z+(u.oz||0)}
      if(u.moving&&!u.hold&&!u.cmd&&!allied(u.from,D.seat)&&u.s>u.path.len*.5&&(u.lk=(u.lk||0)-dt)<=0){u.lk=.5;const l=landNear(u.x,u.z,30);if(l&&seatAt(l.x,l.z)===D.seat){u.land=l;u.end=u.s;u.moving=false}}     // stop well out at sea, like a warship
      if(!u.moving&&!u.hold&&allied(u.from,D.seat))u.hold=true;     // home waters: just wait there for orders
      if(!u.moving&&!u.hold&&!allied(u.from,D.seat)){       // lie offshore, dive, and let the divers swim up onto the island
        const l=u.land||landNear(u.x,u.z,58);if(!l||seatAt(l.x,l.z)!==D.seat){u.hold=true;continue}
        u.dove=0;ripple(u.x,u.z,6);ripple(u.x,u.z,3.5);fxAt(D,u.x,u.z,'dalga');
        for(let i=0;i<10;i++){const a=i*.628+.3,x=u.x+Math.cos(a)*(1.2+(i%2)*1.6),z=u.z+Math.sin(a)*(1.2+(i%2)*1.6),id=uid++,lx=l.x+Math.cos(a)*3.5,lz=l.z+Math.sin(a)*3.5,path=polyPath([{x,z},{x:lx,z:lz},gateApproach(D.seat,{x:lx,z:lz})]);
          D.units.push({id,type:'dalgic',from:u.from,path,s:0,hp:UNITS.dalgic.hp,x,z,bomb:0,cd:0,end:path.len-(1+id%3),lane:0,lx:0,lz:0,vx:0,vz:0,emerge:1.6+i*.15})}
        if(D===ME)tip(TL('Düşman balık adamlar denizden çıkıyor!','Enemy frogmen are coming up out of the sea!'))}
      continue}
    if(u.ret){u.s+=U.sp*1.3*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;if(u.s>=u.end){u.done=true;const m=Math.round(U.cost/2);if(u.from!==D.seat){refund(u.from,m);continue}D.money+=m;if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+m});SES.para()}}continue}
    if(U.yol==='fuze'){            // a missile flies to the spot its owner picked, or chases the ship or soldier it was fired at
      if(u.lockT!=null){const tr=unitById(u.lockT);
        if(tr&&tr.hp>0&&!tr.done&&tr.fall==null){const a=u.path.pts[0],f=u.s/Math.max(1,u.path.len);u.path=polyPath([a,{x:tr.x,z:tr.z}]);u.s=f*u.path.len;u.tx=tr.x;u.tz=tr.z;u.ey=flies(UNITS[tr.type])?airY(tr):6;u.lockR=tr.remote?null:tr}else u.lockT=null}
      u.s+=U.sp*dt;const p=pointOn(u.path,u.s);u.x=p.x;u.z=p.z;u.t=clamp(u.s/u.path.len,0,1);
      if(u.s>=u.path.len-2){u.done=true;const lr=u.lockR;if(lr&&!lr.done&&lr.hp>0&&Math.hypot(lr.x-u.tx,lr.z-u.tz)<9){lr.hp-=220;lr.fk=true;if(lr.type==='ucak'||lr.type==='balon')boom(lr.x,lr.alt||20,lr.z,6,'#ff7a2a')}if((u.ey||6)>10){boom(u.tx,u.ey,u.tz,8,'#ff7a2a');boom(u.tx,u.ey+2,u.tz,4,'#ffe08a');burst(u.tx,u.ey,u.tz,26,['#ffb347','#ff7a2a','#3a3a3a','#ffe08a','#555'],16,1.6,.35,22);fxAt(D,u.tx,u.tz,'fuze');      // an air burst rains fragments on whatever is below
        {const tx=u.tx,tz=u.tz,from=u.from;for(let k=0;k<5;k++){const a=k*1.26,r=k?3.5+Math.random()*2:0;shell(D,tx,u.ey,tz,tx+Math.cos(a)*r,tz+Math.sin(a)*r,.9+Math.random()*.3,0,'frag',(x,z)=>{explode(x,z,.9);boom(x,1,z,2,'#ffb347');k||blast(D,tx,tz,8,70,10,from,55)})}}}else{boom(u.tx,6,u.tz,9,'#ff7a2a');boom(u.tx,9,u.tz,5,'#ffe08a');explode(u.tx,u.tz,5);crater(u.tx,u.tz,7);fxAt(D,u.tx,u.tz,'fuze');blast(D,u.tx,u.tz,9,150,U.dmg,u.from,80)}if(D.dead)return}
      continue}
    if(u.emerge>0)u.emerge-=dt;
    if(u.type==='dalgic'&&!allied(u.from,D.seat))frogSmoke(D,u,home,dt);
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
        if(air){u.bomb=2;const tt=t,bx2=t.x+(Math.random()-.5)*1.5,bz2=t.z+(Math.random()-.5)*1.5;balloonBomb(D,u,bx2,bz2,heightAt(t.x,t.z)+(t.top||4)*.9,()=>{if(!D.towers.includes(tt))return;tt.hp-=BLD.balon;tt.shake=.3;hurtArchers(D,bx2,bz2,9,U.dmg*3);if(tt.hp<=0){explode(tt.x,tt.z,2);crater(tt.x,tt.z,3.6);removeTower(D,tt)}});if(t.hp-BLD.balon<=0)u.tgt=null}
        else{u.cd=1.2;t.hp-=U.dmg*(BLD[u.type]||4);t.shake=.25;boom(t.x,2.5,t.z,1,'#ffb060');sparks(t.x,t.z);fxAt(D,t.x,t.z,'vur');
        if(t.hp<=0){explode(t.x,t.z,2);crater(t.x,t.z,3.6);removeTower(D,t);u.tgt=null}}}}
    }else if(u.off){              // back onto the road, at the nearest point still ahead
      if(!u.reS){u.reS=true;let bs=u.s,bd=1e9;for(let s2=u.s;s2<=u.end;s2+=2){const q=pointOn(u.path,s2),d=Math.hypot(q.x-u.x,q.z-u.z);if(d<bd){bd=d;bs=s2}}u.s=bs}
      const p=pointOn(u.path,u.s),d=Math.hypot(p.x-u.x,p.z-u.z);
      if(d<1)u.off=false;else{u.x+=(p.x-u.x)/d*step;u.z+=(p.z-u.z)/d*step;u.face=Math.atan2(p.x-u.x,p.z-u.z)}
    }else if(u.s<u.end){u.s=Math.min(u.end,u.s+step);const p=pointOn(u.path,u.s),q=pointOn(u.path,u.s+1.2),l=Math.hypot(q.x-p.x,q.z-p.z)||1;
      u.lx=clamp(u.lx+u.vx*dt,-2.2,2.2);u.lz=clamp(u.lz+u.vz*dt,-2.2,2.2);
      const c=air?0:u.lane;let nx=p.x+(q.z-p.z)/l*c+u.lx,nz=p.z-(q.x-p.x)/l*c+u.lz;
      if(!air&&U.yol!=='deniz'&&nearDeck(nx,nz)&&!canStand(u,nx,nz)){u.lx*=.5;u.lz*=.5;nx=p.x;nz=p.z}     // a side-step that would leave the bridge or the bank keeps to the middle of the way
      u.x=nx;u.z=nz;u.face=null;u.road=true}
    else if(!own&&u.cmd&&u.siege&&dh>(air?7:CH+5.5)){            // sent at the castle but not there yet: close in, never strike from afar
      if(air){u.x+=(home.x-u.x)/dh*step;u.z+=(home.z-u.z)/dh*step}
      else if(!u.rp){u.rp=1;const gq=gateApproach(D.seat,u),n=U.yol==='kara'?nav({x:u.x,z:u.z},gq):[{x:u.x,z:u.z},gq];if(n){u.path=polyPath(n);u.s=0;u.end=Math.max(0,u.path.len-1)}else u.siege=false}
      else u.siege=false}
    else if(own||(u.cmd&&!u.siege&&dh>20)){u.atk=false}         // a held position: stand and wait for orders
    else if(air){if(u.bomb<=0){u.bomb=2;const x=home.x+(Math.random()-.5)*12,z=home.z+(Math.random()-.5)*12;balloonBomb(D,u,x,z,surfaceY(x,z),(X,Z)=>{if(D.dead)return;damageCastle(D,U.dmg,X,Z);hurtArchers(D,X,Z,10,U.dmg*3.5);hurtLauncher(D,X,Z,U.dmg*2.5)})}}
    else{const g=u.type==='dalgic';u.atk=true;u.cdM=g?.45:1.5;u.face=Math.atan2(home.x-u.x,home.z-u.z);if(u.cd<=0){u.cd=u.cdM;if(g)gunFx(D,u,home.x+(Math.random()-.5)*5,heightAt(home.x,home.z)+5+Math.random()*6,home.z+(Math.random()-.5)*5);else boom(u.x+Math.sin(u.face)*2.5,3,u.z+Math.cos(u.face)*2.5,.8,'#ffb060');damageCastle(D,g?.8:U.dmg,u.x,u.z);if(D.dead)return}}
    u.moving=!u.atk&&!(u.s>=u.end&&!u.tgt&&!u.off);
    if(!air&&!u.road&&(u.vx||u.vz)){const nx=u.x+u.vx*dt,nz=u.z+u.vz*dt;if(canStand(u,nx,nz)){u.x=nx;u.z=nz}}u.road=false;   // jostling never shoves anyone off a bridge
  }
  navalSep(D,dt);
  for(const t of D.towers){
    const T=TOWERS[t.type];if(T.duvar||(t.bt>0&&!t.up))continue;t.cd-=dt;const HD=HEAD[t.type];
    // the head keeps tracking its target between shots, and only fires once it is pointing at it
    if(t.tg&&(t.tg.hp<=0||t.tg.done||t.tg.ret||t.tg.fall!=null))t.tg=null;
    if(t.tg&&HD)t.yaw=turnTo(t.yaw||0,Math.atan2(-(t.tg.z-t.z),t.tg.x-t.x),HD.rate*dt);
    if(t.tg&&dt>0){if(t.tpx!=null){const k=Math.min(1,dt*4);t.tvx=lerp(t.tvx||0,clamp((t.tg.x-t.tpx)/dt,-30,30),k);t.tvz=lerp(t.tvz||0,clamp((t.tg.z-t.tpz)/dt,-30,30),k)}t.tpx=t.tg.x;t.tpz=t.tg.z}else{t.tpx=null;t.tvx=t.tvz=0}     // how fast the target is really moving
    if(t.cd>0)continue;
    const r=T.menzil+(t.lvl-1)*3;let best=null,bd=1e9;
    for(const u of D.units){
      if(u.hp<=0||u.ret||u.from===D.seat||u.fall!=null||u.emerge>0||u.dove!=null||allied(u.from,D.seat)||(D.smk&&D.smk.length&&inSmoke(D,u.x,u.z)))continue;const Y=UNITS[u.type].yol;let rr=r;if(u.type==='denizalti')continue;     // a submarine runs submerged: no gun can see it
      if(u.type==='gemi'){if(!T.gemi)continue;rr=shipR(t)}
      else if(Y==='ucak'?(!T.ucak||u.ph==='roll'):Y==='fuze'?!T.fuze:Y==='hava'?!T.hava:!T.yer)continue;
      let d=Math.hypot(u.x-t.x,u.z-t.z)-(u===t.tg?6:0);if(d<rr&&d<bd&&t.type==='top'&&!naval(u.type)){if(Math.hypot(u.x-home.x,u.z-home.z)<CH*1.4)d+=10;for(const o of D.units)if(o.from===D.seat&&o.type!=='isci'&&Math.abs(o.x-u.x)<3.5&&Math.abs(o.z-u.z)<3.5){d+=14;break}}if(d<rr&&d<bd){bd=d;best=u}}
    if(!best){t.tg=null;t.cd=.15;continue}
    if(best!==t.tg){t.tg=best;t.tpx=null;t.tvx=t.tvz=0;if(HD){t.yaw=turnTo(t.yaw||0,Math.atan2(-(best.z-t.z),best.x-t.x),HD.rate*dt)}}
    if(HD){const want=Math.atan2(-(best.z-t.z),best.x-t.x);let df=want-(t.yaw||0);while(df>Math.PI)df-=2*Math.PI;while(df<-Math.PI)df+=2*Math.PI;if(Math.abs(df)>.22)continue}
    t.cd=1/T.hiz;const dmg=T.dmg*(1+.6*(t.lvl-1)),gy=heightAt(t.x,t.z),cs=Math.cos(t.yaw||0),sn=-Math.sin(t.yaw||0),mz=HD?HD.mz:0,mx0=t.x+cs*mz,mz0=t.z+sn*mz,my0=gy+(t.top||5);
    if(T.gudumlu){homing(D,mx0,my0+.6,mz0,best,dmg);t.kick=.6;fxAt(D,t.x,t.z,'roket');continue}
    if(t.type==='top'){         // a real cannonball: leaves the muzzle in a puff, arcs over and bursts where the target will be
      const d=Math.hypot(best.x-mx0,best.z-mz0),dur=.35+d/55,ax=best.x+(t.tvx||0)*dur*.9,az=best.z+(t.tvz||0)*dur*.9;     // aim where it will be, from how it is actually moving
      const from=D.seat,nav=naval(best.type),R=T.alan,tgt=best;
      shell(D,mx0,my0,mz0,ax,az,dur,.4+d*.07,'top',(x,z)=>{
        if(nav){if(!tgt.done&&tgt.fall==null&&Math.hypot(tgt.x-x,tgt.z-z)<8)tgt.hp-=dmg;splash(x,z,2);explode(x,z,1.4)}
        else{explode(x,z,1.05);if(Math.random()<.35)crater(x,z,1.8);boom(x,1.2,z,R*.35,'#ffd27a');burst(x,heightAt(x,z)+.4,z,5,['#6b5232','#8a6a42','#4d3a24'],6,.8,.3);hurtArchers(D,x,z,R,dmg*.5);{const hc=castlePos(D.seat);if(Math.hypot(hc.x-x,hc.z-z)<CH*1.3)damageCastle(D,dmg*.25,x,z)}
          for(const u of D.units){if(u.ret||u.done||u.hp<=0||flies(UNITS[u.type]))continue;const e=Math.hypot(u.x-x,u.z-z);if(e<R)u.hp-=dmg*(e<1.8?1:.7*(1-e/R*.6))*(u.from===from||allied(u.from,from)?.7:1)}
          for(const t of D.towers.slice()){if(t.type==='duvar')continue;const e=Math.hypot(t.x-x,t.z-z);if(e<R*.7){t.hp-=dmg*.6*(1-e/R);t.shake=.2;if(t.hp<=0){explode(t.x,t.z,2);removeTower(D,t)}}}}
        fxAt(D,x,z,'gulle')});
      flame(mx0,my0,mz0,2.6,.18);puff(mx0+cs,my0+.3,mz0+sn,1.6,2.2,.7,.8,.5);t.kick=1;fxAt(D,t.x,t.z,'top');continue}
    best.hp-=best.type==='fuze'?dmg*1.8:dmg;tracer(mx0,my0+.1,mz0,best.x,altOf(best),best.z,t.type==='ok'?.14:.09);if(t.type==='hava'){flame(mx0,my0+1.2,mz0,1.2,.08);t.kick=.4}fxAt(D,t.x,t.z,t.type==='hava'?'flak':'okcu');
  }
  {const A=CARCH[D.seat],H=achOf(D);if(A)for(let k=0;k<4;k++){if(H[k]<=0)continue;const q=A[k],key='kc'+k;D[key]=(D[key]||0)-dt;if(D[key]>0)continue;let best=null,bd=KEEP.menzil;
    for(const u of D.units){if(u.hp<=0||u.ret||u.fall!=null||u.emerge>0||u.dove!=null||allied(u.from,D.seat)||(D.smk&&D.smk.length&&inSmoke(D,u.x,u.z)))continue;const Y=UNITS[u.type].yol;if(Y==='deniz'||Y==='ucak'||Y==='fuze')continue;const d=Math.hypot(u.x-q.x,u.z-q.z);if(d<bd){bd=d;best=u}}
    if(best){D[key]=1/KEEP.hiz;best.hp-=KEEP.dmg;q.want=Math.atan2(-(best.z-q.z),best.x-q.x);tracer(q.x,q.y+2.1,q.z,best.x,unitY(UNITS[best.type],best.x,best.z)+1.2,best.z);fxAt(D,q.x,q.z,'okcu')}else D[key]=.3}}
  keepOut(D);
  const left=[];
  for(const u of D.units){
    if(u.done)continue;
    if(u.fall!=null){left.push(u);continue}
    if(u.type==='isci'&&u.hp<=0){sparks(u.x,u.z);boom(u.x,1,u.z,.8,'#d0d0d0');const t=D.towers.find(o=>o.id===u.site);if(t&&t.bt>0){t.bt+=3;t.BT=Math.max(t.BT,t.bt)}if(D===ME)tip(TL('Bir işçin öldü, yapım uzadı','A worker died, building takes longer'));continue}
    if(u.hp<=0&&u.fk&&!u.byHome&&u.type!=='balon'&&u.type!=='gemi'&&u.type!=='ucak'){sparks(u.x,u.z);continue}     // fell in a fight between attackers: no bounty
    if(u.hp<=0&&u.type==='fuze'){const y=fuzeY(u);boom(u.x,y,u.z,7,'#ff7a2a');boom(u.x,y+1.5,u.z,3.5,'#ffe08a');burst(u.x,y,u.z,24,['#ffb347','#ff7a2a','#3a3a3a','#ffe08a','#666'],15,1.5,.32,22);fxAt(D,u.x,u.z,'roketVur');if(!allied(u.from,D.seat)){D.money+=UNITS.fuze.odul;if(D===ME){floats.push({x:u.x,z:u.z,t:0,txt:'+'+UNITS.fuze.odul});SES.para()}}continue}
    if(u.hp<=0){const bty=!allied(u.from,D.seat)&&!(u.fk&&!u.byHome);if(bty)D.money+=UNITS[u.type].odul;boom(u.x,u.type==='balon'?20:2,u.z,1.5,'#d0d0d0');if(D===ME&&bty){floats.push({x:u.x,z:u.z,t:0,txt:'+'+UNITS[u.type].odul});SES.para()}
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
  const from=u.from,bomb=(x,z)=>{const d0=Math.hypot(x-u.x,z-u.z);shell(D,u.x,u.alt-1.2,u.z,x,z,1.1+d0*.01,0,'bomb',(x,z)=>{explode(x,z,2.4);crater(x,z,3.4);fxAt(D,x,z,'bomba');blast(D,x,z,8,175,55,from,85);if(D.seat!==from)for(const t of D.towers.slice())if(t.type==='duvar'&&Math.hypot(t.x-x,t.z-z)<7){explode(t.x,t.z,1.6);removeTower(D,t)}})};     // heavy bombs: walls under them go down outright
  const drop=()=>{u.dropT-=dt;if(u.dropT>0||u.nb>=12)return;u.dropT=.3;u.nb++;bomb(u.x+Math.sin(u.hd)*12,u.z+Math.cos(u.hd)*12)};
  const over=()=>seatAt(u.x,u.z)===D.seat&&(Math.hypot(u.x-home.x,u.z-home.z)<46||D.towers.some(t=>t.type!=='duvar'&&Math.hypot(t.x-u.x,t.z-u.z)<9));
  if(u.ph==='roll'){const dx=rw.b.x-rw.a.x,dz=rw.b.z-rw.a.z,l=Math.hypot(dx,dz);u.spd=Math.min(U.sp,u.spd+dt*8);u.x+=dx/l*u.spd*dt;u.z+=dz/l*u.spd*dt;
    const gone=Math.hypot(u.x-rw.a.x,u.z-rw.a.z);u.alt=heightAt(u.x,u.z)+1.3+Math.max(0,gone-l*.65)*.5;crush(u);if(gone>=l){u.ph='fly';fxAt(D,u.x,u.z,'roket')}return}
  if(u.ph!=='land')u.alt=Math.min(28,u.alt+dt*5);
  if(u.ph==='fly'&&u.via&&(u.wi||0)<u.via.length){const wi=u.wi||0,w=u.via[wi];steer(w.x,w.z,1.1);fwd(U.sp);
    // a waypoint inside the turning circle would have the bomber circling it for ever: once it is behind, take the next one
    const dx=w.x-u.x,dz=w.z-u.z,d=Math.hypot(dx,dz)||1,ahead=(dx*Math.sin(u.hd)+dz*Math.cos(u.hd))/d;if(d<14||(d<70&&ahead<-.2))u.wi=wi+1;
    if(u.bp&&wi>=1&&u.nb<u.bp.length){const dx=Math.cos(u.ln[2]),dz=Math.sin(u.ln[2]),a=u.via[1],t=(u.x-a.x)*dx+(u.z-a.z)*dz,lead=u.alt*.2;      // released a little early so it lands on its mark
      while(u.nb<u.bp.length&&t+lead>=u.nb*RUN_L/(RUN_N-1)){const q=u.bp[u.nb++];bomb(q.x,q.z)}}
    else if(!u.bp&&wi===1){const a=u.via[0],b=u.via[1],l2=(b.x-a.x)**2+(b.z-a.z)**2,t=((u.x-a.x)*(b.x-a.x)+(u.z-a.z)*(b.z-a.z))/l2;if(t>.26&&seatAt(u.x,u.z)===D.seat)drop()}
    if(u.wi>=u.via.length||u.t2>110)u.ph='home';return}
  if(u.ph==='fly'){steer(home.x,home.z,.9);fwd(U.sp);if(Math.hypot(u.x-home.x,u.z-home.z)<46&&seatAt(u.x,u.z)===D.seat){u.ph='bomb';u.dropT=0}return}
  if(u.ph==='bomb'){fwd(U.sp);drop();
    if(u.nb>=12||Math.hypot(u.x-home.x,u.z-home.z)>54)u.ph='home';return}
  const c=rw?rw.c:castlePos(u.from);
  if(u.ph==='home'){steer(c.x,c.z,.8);fwd(U.sp);if(Math.hypot(u.x-c.x,u.z-c.z)<70)u.ph='land';if(u.t2>140)u.done=true;return}
  const gy=Math.max(heightAt(u.x,u.z),0)+1.3;steer(c.x,c.z,1.3);fwd(U.sp*.7);u.alt=Math.max(gy,u.alt-dt*6);
  if(u.alt<=gy+.05&&Math.hypot(u.x-c.x,u.z-c.z)<34){u.done=true;refund(u.from,Math.round(U.cost/2))}else if(u.t2>160)u.done=true;
}
// shells, bombs and guided rockets
const SHELLS=[];
// where a warship's shell leaves: the muzzle of its fore (k=0) or aft (k=1) turret, swung round to the target
const turOk=(u,k)=>{const hd=u.dir;if(hd==null||u.face==null)return true;let r=u.face-hd;while(r>Math.PI)r-=2*Math.PI;while(r<-Math.PI)r+=2*Math.PI;return k?Math.abs(r)>.7:Math.abs(r)<2.45};
function shipMuzzle(u,k){let hd=u.dir;if(hd==null){const q=pointOn(u.path,Math.min(u.path.len,u.s+1)),p=pointOn(u.path,Math.max(0,u.s-1));hd=Math.atan2(q.x-p.x,q.z-p.z)}
  const tz=k?-6.6:4.6,bx2=u.x+Math.sin(hd)*tz,bz=u.z+Math.cos(hd)*tz,f=u.face??hd;return{x:bx2+Math.sin(f)*4.1,z:bz+Math.cos(f)*4.1}}
function shell(D,x0,y0,z0,x1,z1,dur,arc,kind,onHit,y1){SHELLS.push({D,x0,y0,z0,x1,z1,y1,t:0,dur,arc,kind,onHit})}
// the top of whatever is at a spot: a castle's keep roof or wall walk, or the ground
function surfaceY(x,z){
  for(let s=0;s<4;s++){const D=P[s];if(!D||!D.on||!SEGC[s])continue;const c=castlePos(s),dx=x-c.x,dz=z-c.z;if(dx*dx+dz*dz>(CH+2)*(CH+2)*2)continue;
    const a=CANG[s],lx=dx*Math.cos(a)+dz*Math.sin(a),lz=-dx*Math.sin(a)+dz*Math.cos(a),h0=heightAt(c.x,c.z),C=csOf(D),m=Math.max(Math.abs(lx),Math.abs(lz));
    if(Math.abs(lx)<3.9&&Math.abs(lz)<3.9)return h0+(KH+.45)*(1-C[8]*.82);
    if(m>CH-.9&&m<CH+.9)return h0+4.6*(1-.75*Math.max(...C.slice(0,8)));
    if(m<CH)return h0+.3}
  return Math.max(heightAt(x,z),0)}
// a balloon's bomber lets a bomb go: you see it fall, and it bursts on whatever it hits, roof or ground
function balloonBomb(D,u,x,z,y1,hit){const y0=20-4.2;shell(D,u.x,y0,u.z,x,z,Math.sqrt(Math.max(1,y0-y1)/9.8*2)*.9,0,'bomb',(X,Z)=>{const roof=y1>Math.max(heightAt(X,Z),0)+1.2;boom(X,y1+1.2,Z,3.4,'#ff8a30');boom(X,y1+2.2,Z,2,'#ffd27a');burst(X,y1+.6,Z,8,['#8f8a7c','#6e6a60','#3b2d24'],7,1,.3);if(!roof){explode(X,Z,1.4);crater(X,Z,3.4)}else puff(X,y1+1,Z,2.2,2.6,.6,.8,1);fxAt(D,X,Z,'bomba');hit(X,Z)},y1);u.drop=.5}
function homing(D,x,y,z,tgt,dmg){SHELLS.push({D,kind:'roket',x,y,z,tgt,dmg,vx:0,vy:26,vz:0,t:0})}
// a missile's arc: lower on short hops, so it never shoots up past a close-in camera
const fuzeH=u=>Math.min(62,12+u.path.len*.22),fuzeY=u=>{const y0=u.y0||6,t=u.t||0;return y0+((u.ey||6)-y0)*t+Math.sin(t*Math.PI)*fuzeH(u)};
const airY=o=>o.type==='balon'?(o.fall!=null&&o.y!=null?o.y:20):o.type==='ucak'?(o.alt||28):unitY(UNITS[o.type],o.x,o.z)+1;
const altOf=u=>u.type==='ucak'?u.alt:u.type==='balon'?(u.fall!=null?u.y:20):u.type==='fuze'?fuzeY(u):unitY(UNITS[u.type],u.x,u.z)+1.5;
function simShells(dt){
  for(let i=SHELLS.length-1;i>=0;i--){const s=SHELLS[i];s.t+=dt;
    if(s.kind==='roket'){const u=s.tgt,alive=u&&u.hp>0&&s.D.units.includes(u);
      if(alive){const lead=u.type==='fuze'?.25:0,ux=u.x+(u.path&&u.type==='fuze'?(pointOn(u.path,Math.min(u.path.len,u.s+UNITS.fuze.sp*lead)).x-u.x):0),uz=u.z+(u.path&&u.type==='fuze'?(pointOn(u.path,Math.min(u.path.len,u.s+UNITS.fuze.sp*lead)).z-u.z):0),dx=ux-s.x,dy=altOf(u)-s.y,dz=uz-s.z,d=Math.hypot(dx,dy,dz)||1,k=Math.min(1,dt*5);s.vx=lerp(s.vx,dx/d*75,k);s.vy=lerp(s.vy,dy/d*75,k);s.vz=lerp(s.vz,dz/d*75,k);
        if(d<(u.type==='fuze'?6:3.2)){u.hp-=s.dmg;if(u.type==='fuze')u.fk=u.fk;boom(s.x,s.y,s.z,u.type==='fuze'?6:4,'#ff7a2a');flame(s.x,s.y,s.z,6,.35);burst(s.x,s.y,s.z,18,['#ffb347','#ff7a2a','#3a3a3a','#ffe08a'],14,1.3,.3,22);for(let j=0;j<3;j++)puff(s.x,s.y,s.z,2,2.4,.3,.5,.8);fxAt(s.D,s.x,s.z,'roketVur');SHELLS.splice(i,1);continue}}
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;if(s.t>4||(!alive&&s.t>1.5)){flame(s.x,s.y,s.z,4,.3);SHELLS.splice(i,1)}continue}
    if(s.t>=s.dur){SHELLS.splice(i,1);s.onHit(s.x1,s.z1)}}
}
function botThink(D){
  if(D.dead||TUT)return;
  {const n=nArch(D);if(n<4&&D.money>=ARCH_COST+n*15&&D.t>6+n*40&&Math.random()<.35&&buyArcher(D))return}
  if((D.hp<CASTLE_HP*.6||csOf(D).some(v=>v>.5))&&!D.cfix&&D.money>=fixCost(D)+30&&Math.random()<.2&&repairCastle(D))return;
  const st=D.st||{};
  if(!D.msState&&D.t>(st.msT||110)&&D.money>=MS_COST+20&&Math.random()<.25&&buildMissileSys(D))return;
  if(D.rwState===2&&rwHpOf(D)<RW_HP*.6&&repairRunway(D))return;
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
    if(!(D.fcd>0)&&D.msState===2&&D.money>=UNITS.fuze.cost&&!D.units.some(m=>m.type==='fuze'&&m.lockT===sh.id)&&sendUnit(D,D.seat,'fuze',{at:[Math.round(sh.x),Math.round(sh.z)],lock:sh.id}))return;
    if(D.ysState===2&&!D.yard&&D.money>=UNITS.gemi.cost&&fleet(D.seat)<MAX_SHIPS&&!P[sh.from].dead&&sendUnit(D,sh.from,'gemi'))return;
    if(!D.ysState&&D.money>=YARD_COST&&D.t>60&&buildYard(D))return}
  if(D.airSeen>aa*2&&D.money>=35&&place('hava'))return;
  if(st.yardT&&!D.ysState&&D.t>st.yardT&&buildYard(D))return;if(st.rwT&&!D.rwState&&D.t>st.rwT){if(D.money>=RUNWAY_COST&&buildRunway(D))return;if(Math.random()<.7)return}     // a flyer saves up for the airfield
  if(gr>=4&&!D.ysState&&D.t>100){if(buildYard(D))return;if(Math.random()<.75)return}       // save up for the shipyard, then the runway
  if(gr>=5&&D.ysState&&!D.rwState&&D.t>200){if(buildRunway(D))return;if(Math.random()<.6)return}
  const walls=D.towers.filter(t=>t.type==='duvar').length;
  if(walls<(st.walls||3)&&D.money>=30&&Math.random()<.15){const p=road[30+Math.random()*40|0];if(addTower(D,'duvar',Math.round(p.x),Math.round(p.z)))return}
  if(gr<(3+D.t/60)*(st.twr||1)&&D.money>=20&&place(gr>2&&Math.random()<.4&&D.money>=45?'top':'ok'))return;
  if(!D.rwState&&D.t>150&&D.money>RUNWAY_COST+60&&Math.random()<.06&&buildRunway(D))return;
  if(D.towers.filter(t=>t.type==='roket').length<1&&D.t>240&&D.money>90&&place('roket'))return;
  if(DUEL&&D.money>=DBR_FIX+80&&Math.random()<.02){const i=DBR.findIndex(b=>b.down&&b.main!=null&&now()-b.downAt>60000);if(i>=0&&!P.some(o=>o.pw&&o.pw.i===i)){D.money-=DBR_FIX;D.pw={k:'br',i,t:9};hire(D);return}}
  if(D.money<12||D.t<(st.atkT||45)||gr<(st.minG==null?3:st.minG))return;      // build first, attack after the opening
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
  if(D.t>90&&D.money<Math.min(240,30+D.t/4)*(st.wave||1)&&Math.random()<.8){D.atk=2;return}     // one big wave breaks through a tower line, a trickle never does
  const T=P[to],tAir=T.towers.filter(t=>t.type==='hava'||t.type==='roket'||t.type==='ok').length,tGnd=T.towers.filter(t=>t.type==='ok'||t.type==='top').length,tWall=T.towers.filter(t=>t.type==='duvar').length;
  const W={piyade:3,atli:3,koc:tGnd>3||tWall>2?4:1,balon:tAir<3?5:tAir<6?2:.6,fuze:T.towers.length>4?2:.5,denizalti:2,gemi:2.5,ucak:3};if(st.W)for(const k in st.W)W[k]=(W[k]||1)*st.W[k];
  const side=Math.random()<.5?-1:1,c0=castlePos(D.seat),c1=castlePos(to),mx=(c0.x+c1.x)/2,mz=(c0.z+c1.z)/2,dl=Math.hypot(c1.x-c0.x,c1.z-c0.z)||1,off=side*(25+Math.random()*55),bv=[[Math.round(mx-(c1.z-c0.z)/dl*off),Math.round(mz+(c1.x-c0.x)/dl*off)]];
  const big=T.towers.filter(t=>t.type==='top'||t.type==='roket'||t.type==='hava').sort((a,b)=>TOWERS[b.type].cost-TOWERS[a.type].cost);
  let n=1+Math.min(4,D.t/100)*Math.random()|0;if(D.money>100)n+=2+Math.min(14,(D.money-100)/25|0);
  while(n-->0){const opts=BUY.filter(k=>UNITS[k].cost<=D.money-5&&(k!=='fuze'||(D.t>150&&D.msState===2))&&((k!=='denizalti'&&k!=='gemi')||(D.t>120&&!D.yard&&D.ysState===2&&(k!=='gemi'||fleet(D.seat)<MAX_SHIPS)))&&(k!=='ucak'||(D.rwState===2&&!D.hg))&&(k!=='fuze'||!(D.fcd>0))&&(!POP[k]||popOf(D.seat)+POP[k]<=POP_CAP));if(!opts.length)break;let sum=0;for(const k of opts)sum+=W[k]||1;let r=Math.random()*sum,k=opts[0];for(const q of opts){r-=W[q]||1;if(r<=0){k=q;break}}const ts=T.towers;
    sendUnit(D,to,k,k==='fuze'&&ts.length?(t=>({at:[t.x,t.z]}))(big.length&&Math.random()<.7?big[0]:ts[Math.random()*ts.length|0]):k==='ucak'?(()=>{const T=P[to].towers.filter(t=>t.type!=='duvar'),t=T.length&&Math.random()<.7?T[Math.random()*T.length|0]:castlePos(to),r=runFor(D.seat,to,t.x,t.z);r[2]+=(Math.random()-.5)*2.4;return{ln:r}})():k==='balon'?{via:bv}:undefined)}
}
let botAcc=0;
function sim(dt){
  if(TUT)tutTick(dt);
  simShells(dt);
  for(const D of P){if(D.dead&&D.smk)smokeTick(D,dt);if(!local(D)||D.dead)continue;     // smoke still clears over a fallen base
    if(D.fcd>0)D.fcd-=dt;
    if(D.hg&&D.hg.t<=0&&rwBad(D)){if(D===ME&&now()-(rwTipT||0)>6000){rwTipT=now();tip(TL('Uçak hazır ama pist bozuk: onar, sonra kalkar.','The bomber is ready but the runway is broken: repair it and it takes off.'))}}
    else if(D.hg){D.hg.t-=dt;if(D.hg.t<=0){const q=D.hg;D.hg=null;let to=q.to;if(!P[to]||P[to].dead||allied(D.seat,to)){const f=P.filter(p=>p.on&&!p.dead&&!allied(p.seat,D.seat));to=f.length?f[Math.random()*f.length|0].seat:null}
      if(to==null||!sendUnit(D,to,'ucak',{built:true,ln:to===q.to?q.ln:runFor(D.seat,to)}))D.money+=UNITS.ucak.cost;else if(D===ME)tip(EN?`Bomber took off for ${P[to].name}`:`Uçak kalktı: ${P[to].name} üssünü bombalayacak`)}}
    if(D===ME)trainTick(dt);
    if(D.cfix){const k=jobRate(D,'cs'),C=csOf(D);let left=false;for(let i=0;i<9;i++){if(C[i]>0){C[i]=Math.max(0,C[i]-dt*.08*k);left=left||C[i]>0}}D.hp=Math.min(CASTLE_HP,D.hp+dt*14*k);if(D.msState===2&&D.msHp<MS_HP)D.msHp=Math.min(MS_HP,D.msHp+dt*10*k);if(!left&&D.hp>=CASTLE_HP){D.cfix=false;markBuilt(D);if(D===ME)tip(TL('Kale onarıldı','Castle repaired'))}}
    if(D.msState===1){D.msT-=dt*jobRate(D,'ms');if(D.msT<=0){D.msState=2;markBuilt(D);if(D===ME)tip(TL('Füze sistemi hazır! Artık füze atabilirsin.','Missile system ready! You can fire missiles now.'))}}
    if(D.pw&&D.pw.k==='nb'){const w=D.pw,b=w.b;w.t-=dt*jobRate(D,'pw');if(!b.g){buildWoodBridge(b,D.seat);b.g.rotation.x=-1.42}w.T=w.T||9;b.g.scale.z=clamp(1-w.t/w.T,.04,1);
      if(w.t<=0){D.pw=null;markBuilt(D);b.g.scale.z=1;const g=b.g,seat=D.seat;FALL.push({kind:'lower',o:g,t:0,cb:()=>{scene.remove(g);addBridge(b.id,b.a,b.b,seat);tip(TL('Köprü kuruldu, askerler kısa yoldan geçer','Bridge built, troops take the shortcut'))}})}}
    else if(D.pw){const w=D.pw;w.t-=dt*jobRate(D,'pw');const b=w.k==='br'&&DBR[w.i];if(w.k==='br'&&(!b.down||b.lowering))D.pw=null;else if(w.k==='pl')D.pw=null;
      else{if(!b.g){buildWoodBridge(b,D.seat);b.g.rotation.x=-1.42}w.T=w.T||9;b.g.scale.z=clamp(1-w.t/w.T,.04,1);     // the timber bridge grows upright on our bank while they hammer
        if(w.t<=0){D.pw=null;markBuilt(D);fixDuelBridge(w.i,false,D.seat)}}}
    if(D.ysState===1){D.ysT-=dt*jobRate(D,'ys');if(D.ysT<=0){D.ysState=2;markBuilt(D);if(D===ME)tip(TL('Tersane hazır! Artık gemi ve denizaltı yapabilirsin.','Shipyard ready! You can build ships and submarines now.'))}}
    if(D.rwFix){D.rwHp=Math.min(RW_HP,rwHpOf(D)+RW_HP/16*dt*jobRate(D,'rw'));if(D.rwHp>=RW_HP){D.rwFix=false;markBuilt(D);if(D===ME)tip(TL('Pist onarıldı','Runway repaired'))}}
    if(D.rwState===1){D.rwT-=dt*jobRate(D,'rw');if(D.rwT<=0){D.rwState=2;markBuilt(D);if(D===ME)tip(TL('Pist hazır! Artık uçak gönderebilirsin.','Runway ready! You can send planes now.'))}}
    if(!D.yard)continue;const q=D.yard;q.t-=dt;if(q.t>0)continue;D.yard=null;
    let to=q.to;if(!P[to]||P[to].dead||allied(D.seat,to)){const f=P.filter(p=>p.on&&!p.dead&&!allied(p.seat,D.seat));to=f.length?f[Math.random()*f.length|0].seat:null}
    if(D===ME&&q.type==='gemi'){parkShip(D,'gemi');tip(TL('Gemi hazır, limanda bekliyor! Gemiye dokun, sonra gideceği yolu çiz.','Warship ready at the dock! Tap it, then draw where it should go.'));continue}
    if(D===ME&&q.type==='denizalti'){parkShip(D,'denizalti');tip(TL('Denizaltı hazır, limanda bekliyor! Ona dokun, sonra düşman kıyısına çizgi çiz: kıyıya yanaşıp balık adamları indirir.','Submarine ready at the dock! Tap it, then draw a line to an enemy shore: it lands its frogmen there.'));continue}
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
  const s={s:A.seat,h:Math.round(ME.hp),rw:ME.rwState||0,ms:ME.msState||0,ca:achOf(ME).map(h=>Math.round(h)),cs:csOf(ME).map(v=>Math.round(v*100)),rh:Math.round(rwHpOf(ME)),ys:ME.ysState||0,yd:ME.yard?[UKEYS.indexOf(ME.yard.type),Math.round((1-ME.yard.t/ME.yard.T)*100)]:0,u:ME.units.filter(u=>u.type!=='isci'||u.hp>0).slice(0,90).map(u=>[u.id,UKEYS.indexOf(u.type),u.x|0,u.z|0,Math.ceil(u.hp/UNITS[u.type].hp*10),u.from,(u.atk?1:0)|(u.fall!=null?2:0)|(u.moving===false?4:0)])};
  if(ME.dirty||Date.now()%5000<500){ME.dirty=false;s.t=ME.towers.map(t=>[t.id,TKEYS.indexOf(t.type),t.x,t.z,t.lvl,t.bt>0&&!t.up?Math.round((1-t.bt/t.BT)*100):100])}
  say('snap',s);
}
function onSnap(m){
  if(!m)return;const R=P[num(m.s,-1)];if(!R||R===ME||R.bot||!R.on)return;
  R.seen=performance.now();R.hp=clamp(num(m.h,R.hp),0,CASTLE_HP);R.rwState=clamp(num(m.rw),0,2);R.msState=clamp(num(m.ms),0,2);if(Array.isArray(m.ca)){const a=achOf(R);for(let k=0;k<4;k++){const v=clamp(num(m.ca[k]),0,ARCH_HP);if((v>0)!==(a[k]>0))ARCHD=true;a[k]=v}}if(Array.isArray(m.cs)){const c=csOf(R);for(let k=0;k<9;k++){const v=clamp(num(m.cs[k])/100,0,1);if(v>c[k]+.005)R.csT=now();c[k]=v}}R.rwHp=clamp(num(m.rh,RW_HP),0,RW_HP);{const was=R.ysState;R.ysState=clamp(num(m.ys),0,2);if(was===2&&R.ysState===0){R.ysWreck=now();const L0=DOCK[R.seat].land;explode(L0.x,L0.z,3);burst(L0.x,2,L0.z,18,['#6b4a2a','#3b2d24','#8f8a7c','#ff9a30'],12,1.4,.32)}if(R.ysState)R.ysWreck=0}
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
     .on('broadcast',{event:'krater'},({payload})=>{if(Array.isArray(payload)){const x=clamp(num(payload[0]),-L,L),z=clamp(num(payload[1]),-L,L),r=clamp(num(payload[2],3),1,8);crater(x,z,r,true);fxAt(ME,x,z,r>=6?'fuze':r>=3.3?'bomba':'gulle')}})
     .on('broadcast',{event:'home'},({payload})=>{const m=payload||{};if(m.to===A.seat&&P[m.from])comeHome(ME,m.type,num(m.from),num(m.s),num(m.hp,1),m.x==null?null:num(m.x),num(m.z))})
     .on('broadcast',{event:'kopru'},({payload})=>{const m=payload||{};if(typeof m.id==='string'&&Array.isArray(m.a)&&Array.isArray(m.b))addBridge(m.id,toPt(m.a),toPt(m.b),clamp(num(m.o),0,3),true)})
     .on('broadcast',{event:'kopruyik'},({payload})=>{const b=bridges.find(o=>o.id===(payload&&payload.id));if(b)breakBridge(b,true)})
     .on('broadcast',{event:'chat'},({payload})=>onChat(payload))
     .on('broadcast',{event:'yenimac'},({payload})=>onNewMatch(payload))
     .on('broadcast',{event:'cesme'},()=>breakFountain(true))
     .on('broadcast',{event:'dkopru'},({payload})=>breakDuelBridge(clamp(num(payload&&payload.i,-1),-1,3),true))
     .on('broadcast',{event:'dkopruonar'},({payload})=>fixDuelBridge(clamp(num(payload&&payload.i,-1),-1,3),true,clamp(num(payload&&payload.s,0),0,3)))
     .on('broadcast',{event:'onar'},()=>repairPlaza(true))
     .on('broadcast',{event:'iade'},({payload})=>{const m=payload||{};if(m.to===A.seat&&!ME.dead){ME.money+=clamp(num(m.m),0,100);SES.para()}})
     .on('broadcast',{event:'ez'},({payload})=>{const m=payload||{};if(m.to!==A.seat)return;const x=num(m.x),z=num(m.z);for(const o of ME.units)if(fighter(o.type)&&!o.ret&&Math.hypot(o.x-x,o.z-z)<4.6){o.hp=0;o.fk=true;sparks(o.x,o.z)}})
     .on('broadcast',{event:'ittifak'},({payload})=>{const m=payload||{};if(m.to===A.seat&&P[m.from])askAlly(m.from)})
     .on('broadcast',{event:'ittifakset'},({payload})=>{const m=payload||{};if(P[m.a]&&P[m.b])setAlly(m.a,m.b,!!m.on,true)})
     .on('broadcast',{event:'ortak'},({payload})=>{const m=payload||{};if(m.a===A.seat&&P[m.to]&&P[m.from]){setTarget(m.to);tip((EN?`${P[m.from].name} asks for a joint attack on ${P[m.to].name}`:`${P[m.from].name} ortak saldırı istiyor: ${P[m.to].name}`))}})
     .on('broadcast',{event:'bonus'},({payload})=>{const m=payload||{};if(num(m.to,-1)===ME.seat&&!ME.dead)payBonus(ME,clamp(num(m.amt),0,KILL_BONUS),P[num(m.from,0)])})
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
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.02;     // bright and colourful, like a board-game diorama, instead of a filmic grey-down
const scene=new THREE.Scene();const SKY=new THREE.Color('#8ccbf0');scene.background=SKY;scene.fog=new THREE.Fog(SKY,430,1250);
const camera=new THREE.PerspectiveCamera(62,1,1,2500);
scene.add(new THREE.HemisphereLight('#e4f4ff','#7d6a4c',1.15));
const sun=new THREE.DirectionalLight('#fff1d2',2.85);sun.position.set(-175,185,125);sun.castShadow=true;
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
// a weathered boulder: a sphere pushed in and out by layered noise, flat underneath, with a few sharp breaks
function rockGeo(det,seed=0){
  const g=new THREE.IcosahedronGeometry(1,det),p=g.attributes.position,hs=(x,y,z,f)=>{const h=Math.sin(x*f*12.99+y*f*78.23+z*f*37.72+seed*17.3)*43758.5;return h-Math.floor(h)},el=[[1,.68,.92],[1.25,.5,.8],[.85,.95,.85]][seed%3];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let r=1+.22*(hs(x,y,z,.7)-.5)+.1*(hs(x,y,z,2.3)-.5)+.05*(hs(x,y,z,6.1)-.5);
    const fy=y*r*el[1];p.setXYZ(i,x*r*el[0]*(1.1+.15*Math.sin(z*3+seed)),fy<-.25?-.25-(fy+.25)*.15:fy+(Math.abs(x+z)<.3?-.06:0),z*r*el[2])}
  g.deleteAttribute('normal');const q=g.toNonIndexed();q.computeVertexNormals();return q}
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
  const droop=(g,d)=>{const p=g.attributes.position;let lo=1e9;for(let i=0;i<p.count;i++)lo=Math.min(lo,p.getY(i));for(let i=0;i<p.count;i++)if(p.getY(i)<lo+.01){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x);p.setY(i,lo-d*(.6+.4*Math.sin(a*5)));p.setX(i,x*1.08);p.setZ(i,z*1.08)}return g};
  const pineT=(seg,rows,j)=>[0,1,2,3,4,5,6,7].map(i=>jig(droop(new THREE.ConeGeometry(3.5-i*.4,2.5-i*.1,seg,rows).rotateY(i*.7),.45-i*.03).translate(0,3.1+i*1.48,0),j,i)).concat([jig(new THREE.ConeGeometry(.45,1.7,seg>6?7:5).translate(0,15.2,0),.1,9)]);
  const pineT2=(seg,rows,j)=>[0,1,2,3,4,5].map(i=>jig(droop(new THREE.ConeGeometry(3.9-i*.52,2.9-i*.15,seg,rows).rotateY(i*1.1+.3),.55-i*.05).translate(0,2.9+i*1.75,0),j*1.15,i+30))
    .concat([jig(new THREE.ConeGeometry(1.15,2.6,seg>6?9:6,2).translate(0,13.55,0),.22,40),jig(new THREE.ConeGeometry(.3,.9,seg>6?6:4).translate(0,15.1,0),.06,41)]);
  const pine=merge(pineT(11,2,.5)),pine2=merge(pineT2(11,2,.5)),pine2L=merge(pineT2(6,1,.3)),
        CROWN=[...Array(13)].map((_,i)=>{const a=i*2.399,t=i/12,rr=i?1.2+((i*7)%5)*.38:0,y=i?7.1+t*3.6+((i*3)%4)*.35:9.2;return[Math.cos(a)*rr*(1.15-t*.4),y,Math.sin(a)*rr*(1.15-t*.4),i?1.25+((i*5)%4)*.22:2.3]}),
        broad=merge(CROWN.map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,1).scale(1,.82,1).translate(x,y,z),.55,i+9))),
        BIR=[[0,10.4,0,1.6],[.9,11.6,.4,1.25],[-.8,12,-.3,1.2],[.2,13.3,.6,1.05],[-.4,9.4,.8,1.1],[.7,9.6,-.8,1.05],[-.2,14.3,-.2,.8]],birch=merge(BIR.map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,1).scale(1,1.3,1).translate(x,y,z),.4,i+20))),
        dead=merge([new THREE.CylinderGeometry(.18,.42,7,7).translate(0,3.5,0),new THREE.CylinderGeometry(.06,.14,2.8,5).rotateZ(.9).translate(1,5.2,0),new THREE.CylinderGeometry(.05,.12,2.2,5).rotateZ(-1).translate(-.85,4.4,.2),new THREE.CylinderGeometry(.05,.1,1.8,5).rotateX(.9).translate(0,6,.7)]);
  const mat=(c,needle)=>{const m=new THREE.MeshStandardMaterial({color:c,map:LT[needle?1:0],roughness:.9,vertexColors:true});
    m.onBeforeCompile=sh=>{sh.uniforms.uT=WIND;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*.05+instanceMatrix[3].z*.07;\n#else\nfloat ph=0.;\n#endif\nfloat sw=(sin(uT*1.4+ph)+.5*sin(uT*2.9+ph*1.7))*.012*position.y*position.y/12.;transformed.x+=sw;transformed.z+=sw*.6;'+(needle?'float th=fract(sin(ph*91.7+3.1)*4375.5),tk=max(position.y-10.5,0.)/5.5;tk*=tk;transformed.x+=tk*(th-.5)*1.7;transformed.z+=tk*(fract(th*7.31)-.5)*1.7;transformed.y+=tk*(fract(th*3.7)-.45)*1.6;transformed.xz*=1.+tk*(fract(th*5.3)-.5)*.5;':''))};m.customProgramCacheKey=()=>needle?'tn':'tb';return m};
  // far-off copies with a fraction of the triangles: a tree a few pixels tall looks the same either way
  const pineL=merge(pineT(6,1,.3)),
        broadL=merge(CROWN.filter((_,i)=>i%2===0).map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r*1.15,0).scale(1,.82,1).translate(x,y,z),.35,i+9))),
        birchL=merge(BIR.filter((_,i)=>i<4).map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r*1.2,0).scale(1,1.3,1).translate(x,y,z),.3,i+20)));
  // a bush: a few leafy lumps of different sizes, wider than tall, not one round ball
  const bush=merge([[0,.55,0,1.15],[.95,.42,.35,.85],[-.85,.4,-.25,.8],[.2,.38,-.95,.75],[-.3,.85,.55,.7]].map(([x,y,z,r],i)=>jig(new THREE.IcosahedronGeometry(r,0).scale(1,.78,1).translate(x,y,z),.28,i+40)));
  TGC={pine,pine2,pine2L,broad,birch,dead,mat,pineL,broadL,birchL,bush,trunk:new THREE.CylinderGeometry(.3,.55,5,7).translate(0,2.5,0),trunk2:merge([new THREE.CylinderGeometry(.36,.62,7.4,8).translate(0,3.7,0),new THREE.CylinderGeometry(.62,.95,.7,8).translate(0,.3,0),
    ...[0,2.1,4.2].map((a,i)=>new THREE.CylinderGeometry(.1,.24,3.4,6).translate(0,1.7,0).rotateZ(.75).rotateY(a+.4).translate(0,5.2+i*.6,0)),
    ...[1,3.1,5.2].map(a=>new THREE.CylinderGeometry(.08,.16,2.2,5).translate(0,1.1,0).rotateZ(.95).rotateY(a).translate(0,6.6,0))]),trunk2L:new THREE.CylinderGeometry(.42,.75,7,6).translate(0,3.5,0),rock:rockGeo(2)};return TGC;
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
  const TG=treeGeos(),{pine,pine2,broad,birch}=TG;
  const N=small?4800:11500,KIND=[
    {n:.31,parts:[[TG.trunk,'#4b3320',0],[pine,'#3f7a37',1,1,TG.pineL]]},
    {n:.24,parts:[[TG.trunk,'#4b3320',0],[pine2,'#3b7034',1,1,TG.pine2L]]},
    {n:.33,parts:[[TG.trunk2,'#55392a',0,0,TG.trunk2L],[broad,'#4a7f34',1,0,TG.broadL]]},
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
    const r=R();let K=KIND[KIND.length-1],acc=0;for(const q of KIND){acc+=q.n;if(r<acc){K=q;break}}if(K.k>=K.cap)continue;
    const sc=.75+R()*.75*(.6+g),fm=R();let ax=1,ay=1,tr=1,tg=1,tb=1;      // slim spruces and squat firs among the pines, broad oaks and tall poplars among the broadleaves
    if(K===KIND[0]||K===KIND[1]){if(fm<.3){ax=.66;ay=1.32;tr=.8;tg=.9;tb=.98}else if(fm<.55){ax=1.25;ay=.78;tr=1.1;tg=1.06;tb=.82}}
    else if(K===KIND[2]){if(fm<.3){ax=1.3;ay=.86;tr=.92;tg=1;tb=.82}else if(fm<.45){ax=.62;ay=1.38;tr=1.08;tg=1.08;tb=.88}}
    vp.set(x,outerY(x,z)-.15,z);TEUL.set((R()-.5)*.08,R()*6.28,(R()-.5)*.08);qt.setFromEuler(TEUL);vs.set(sc*ax*(.9+R()*.2),sc*ay*(.85+R()*.35),sc*ax*(.9+R()*.2));mx.compose(vp,qt,vs);
    const sh=.78+R()*.34;col.setRGB(sh*(.92+R()*.12)*tr,sh*tg,sh*(.85+R()*.15)*tb);
    {const T=K.tiles[tileOf(x,z)];T.m.push(mx.clone());T.c.push(col.clone())}K.k++;done++;
    const gx=Math.round((x+REACH)/(2*REACH)*DN),gz=Math.round((z+REACH)/(2*REACH)*DN);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=gx+i,Z=gz+j;if(X>=0&&Z>=0&&X<DN&&Z<DN)dens[X+Z*DN]=Math.min(1,dens[X+Z*DN]+(i||j?.12:.3))}}
  vs.set(1,1,1);
  for(const K of KIND)K.tiles.forEach((T,ti)=>{if(!T.m.length)return;const ft={x:-REACH+(ti%TS+.5)*2*REACH/TS,z:-REACH+((ti/TS|0)+.5)*2*REACH/TS,hi:[],lo:[]};FTILES.push(ft);
    K.parts.forEach(([g,,leafy,,gl],i)=>{const mk=geo=>{const m=new THREE.InstancedMesh(geo,K.mats[i],T.m.length);T.m.forEach((q,j)=>{m.setMatrixAt(j,q);if(leafy)m.setColorAt(j,T.c[j])});m.computeBoundingSphere();scene.add(m);return m};
      const h=mk(g);if(gl){const l=mk(gl);l.visible=false;ft.hi.push(h);ft.lo.push(l)}})});
  // boulders strewn over the hills beyond the sea, more of them on the steep ground
  for(let rv=0;rv<3;rv++){const n=small?75:175,rk=new THREE.InstancedMesh(rockGeo(1,rv),new THREE.MeshStandardMaterial({color:'#fff',roughness:.93,flatShading:true}),n),cc=new THREE.Color();rk.receiveShadow=true;let k=0,t2=0;
    while(k<n&&t2++<n*30){const x=(R()-.5)*REACH*2.6,z=(R()-.5)*REACH*2.6;if(outerD(x,z)<6)continue;const sl=outerSlope(x,z),hh=landH(x,z);if(R()>.25+sl*1.6||hh>170)continue;
      const sc=(.7+R()*2.2)*(1+sl);vp.set(x,outerY(x,z)-.2*sc,z);qt.setFromAxisAngle(UP,R()*6.28);vs.set(sc*(.8+R()*.5),sc*(.6+R()*.5),sc*(.8+R()*.5));mx.compose(vp,qt,vs);rk.setMatrixAt(k,mx);
      const v=.42+R()*.22;cc.setRGB(v*1.02,v,v*(.9+R()*.12));rk.setColorAt(k,cc);k++}
    vs.set(1,1,1);rk.count=k;rk.computeBoundingSphere();scene.add(rk)}
  forestLOD();
  {const big=new Float32Array(256*256);for(let j=0;j<256;j++)for(let i=0;i<256;i++){const x=i/256*2000-1000,z=j/256*2000-1000,I=Math.round((x+REACH)/(2*REACH)*DN),J=Math.round((z+REACH)/(2*REACH)*DN);big[i+j*256]=I>=0&&J>=0&&I<DN&&J<DN?dens[I+J*DN]:.6}FDENS.image.data.set(big)}FDENS.needsUpdate=true;
}
const TEUL=new THREE.Euler();
function buildDetail(){
  const TG=treeGeos(),rock=TG.rock;
  const cap=small?60:110,mk=(geo,mat)=>{const m=new THREE.InstancedMesh(geo,mat,cap);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.count=cap;mx.makeScale(0,0,0);for(let i=0;i<cap;i++)m.setMatrixAt(i,mx);scene.add(m);return m};
  PROPM={
    pine:[mk(TG.trunk,new THREE.MeshStandardMaterial({color:'#4b3320',roughness:.95})),mk(TG.pine,TG.mat('#3f7a37',1))],
    pine2:[mk(TG.trunk,new THREE.MeshStandardMaterial({color:'#4b3320',roughness:.95})),mk(TG.pine2,TG.mat('#3b7034',1))],
    broad:[mk(TG.trunk2,new THREE.MeshStandardMaterial({color:'#55392a',roughness:.95})),mk(TG.broad,TG.mat('#4a7f34',0))],
    dead:[mk(TG.dead,new THREE.MeshStandardMaterial({color:'#3b2d24',roughness:1}))],
    rock:[mk(rock,new THREE.MeshStandardMaterial({color:'#fff',roughness:.92,flatShading:true}))],rock2:[mk(rockGeo(2,1),new THREE.MeshStandardMaterial({color:'#fff',roughness:.92,flatShading:true}))],rock3:[mk(rockGeo(2,2),new THREE.MeshStandardMaterial({color:'#fff',roughness:.92,flatShading:true}))]};
  const n={pine:0,pine2:0,broad:0,dead:0,rock:0,rock2:0,rock3:0},col=new THREE.Color(),RC=['#8b8a80','#c2a571','#aeb8bf','#3b322e'];
  let sd=4242;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;let tries=0;
  while(tries++<6000&&PROPS.length<cap*3){
    const x=(R()-.5)*L*2,z=(R()-.5)*L*2,s=seatAt(x,z),c=castlePos(s);
    if(shoreOf(x,z)<WL+5||roadDist(x,z)<7.5||Math.hypot(x-c.x,z-c.z)<20||reserved(s,x,z)||Math.hypot(x,z)<30)continue;
    if(PROPS.some(p=>Math.hypot(p.x-x,p.z-z)<9))continue;
    const r=R(),bm=biomeAt(x,z),k0=bm===0?(r<.08?'broad':r<.16?'pine':r<.5?'rock':null):bm===1?(r<.18?'dead':'rock'):bm===2?(r<.1?'pine':r<.26?'rock':null):(r<.45?'dead':'rock');if(!k0)continue;const k=k0==='rock'?['rock','rock2','rock3'][R()*3|0]:k0==='pine'&&R()<.45?'pine2':k0,isR=k0==='rock';
    if(n[k]>=cap)continue;const i=n[k]++,y=baseHeight(x,z),sc=isR?.9+R()*1.6:.55+R()*.35,rot=R()*6.28,fm=R(),ax=isR?1:k.startsWith('pine')?(fm<.3?.68:fm<.55?1.22:1):k==='broad'?(fm<.3?1.28:fm<.45?.65:1):1,ay=isR?.8+R()*.5:k.startsWith('pine')?(fm<.3?1.3:fm<.55?.8:1):k==='broad'?(fm<.3?.86:fm<.45?1.35:1):1;
    TEUL.set(isR?0:(R()-.5)*.08,rot,isR?0:(R()-.5)*.08);qt.setFromEuler(TEUL);vp.set(x,y-(isR?.25*sc:.1),z);vs.set(sc*ax,sc*ay,sc*ax);mx.compose(vp,qt,vs);
    if(isR)col.set(RC[bm]).multiplyScalar(.8+R()*.35);else if(bm===2)col.setRGB(1.3,1.42,1.5);else col.setRGB(.8+R()*.3,.85+R()*.25,.8+R()*.2);
    for(const m of PROPM[k]){m.setMatrixAt(i,mx);if(isR||m.material.vertexColors)m.setColorAt(i,col)}
    PROPS.push({k,i,x,z,y,s:sc,rot,col:col.clone(),alive:true})}
  vs.set(1,1,1);for(const k in PROPM)for(const m of PROPM[k]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
}
// builders swing hammers while a ship, submarine or runway is under way
const WKM={tr:new THREE.MeshStandardMaterial({color:'#2d3a52'}),sh:new THREE.MeshStandardMaterial({color:'#ee7d22',roughness:.7}),bt:new THREE.MeshStandardMaterial({color:'#2a2622'}),hat:new THREE.MeshStandardMaterial({color:'#f4c430',roughness:.5})};
function worker(){
  const G=new THREE.Group(),g=new THREE.Group(),arm0=new THREE.Group(),arm=new THREE.Group(),TRM=WKM.tr,SHM2=WKM.sh,BOOTM=WKM.bt;
  for(const x of[-.18,.18]){add(g,new THREE.CapsuleGeometry(.15,.6,3,8),TRM,x,.5,0);add(g,new THREE.BoxGeometry(.24,.16,.38),BOOTM,x,.08,.06)}
  add(g,new THREE.CylinderGeometry(.4,.34,1.05,10),SHM2,0,1.42,0);add(g,new THREE.CylinderGeometry(.37,.37,.1,10),DARK,0,1.0,0);add(g,new THREE.BoxGeometry(.26,.24,.14),WOOD,-.3,.98,.24);
  add(g,new THREE.CylinderGeometry(.09,.1,.14,8),SKINM,0,2.0,0);add(g,new THREE.SphereGeometry(.26,10,8),SKINM,0,2.2,0);
  for(const x of[-.09,.09])add(g,new THREE.SphereGeometry(.035,5,4),DARK,x,2.24,.23);
  add(g,new THREE.SphereGeometry(.3,10,6,0,6.3,0,1.6),WKM.hat,0,2.3,0);add(g,new THREE.CylinderGeometry(.4,.4,.04,14),WKM.hat,0,2.3,0);
  // the free arm steadies the work, the other swings the hammer
  const la=add(g,new THREE.CapsuleGeometry(.1,.5,3,8),SHM2,-.48,1.5,.15);la.rotation.x=-.7;add(g,new THREE.SphereGeometry(.11,6,5),SKINM,-.48,1.25,.42);
  add(arm0,new THREE.CapsuleGeometry(.1,.55,4,8).translate(0,-.35,0),SHM2,0,0,0);add(arm0,new THREE.SphereGeometry(.11,6,5),SKINM,0,-.7,0);
  add(arm0,new THREE.CylinderGeometry(.04,.04,.75,6).rotateX(Math.PI/2).translate(0,-.72,.3),WOOD,0,0,0);add(arm0,new THREE.BoxGeometry(.18,.18,.38),IRONM,0,-.72,.68);
  G.add(mergeModel(g));arm.add(mergeModel(arm0));arm.position.set(.48,1.82,0);G.add(arm);
  return{g:G,arm,ph:Math.random()*6};
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
// broken tarmac: a dark hole of torn asphalt with jagged cracks running out of it
const CRM=[];
function crackMat(k){if(CRM[k])return CRM[k];const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');let sd=31+k*97;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
  g.translate(128,128);g.fillStyle='rgba(18,16,14,.95)';g.beginPath();for(let i=0;i<14;i++){const a=i/14*6.283,r=26+R()*26;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
  g.fillStyle='rgba(90,84,76,.9)';for(let i=0;i<9;i++){const a=R()*6.283,r=30+R()*22;g.beginPath();g.ellipse(Math.cos(a)*r,Math.sin(a)*r,4+R()*6,3+R()*4,R()*3,0,6.3);g.fill()}
  g.strokeStyle='rgba(14,12,10,.92)';g.lineCap='round';
  const br=(x,y,a,len,w,d)=>{if(d>3||len<6)return;g.lineWidth=w;g.beginPath();g.moveTo(x,y);let X=x,Y=y;for(let t=0;t<len;t+=7){a+=(R()-.5)*.9;X+=Math.cos(a)*7;Y+=Math.sin(a)*7;g.lineTo(X,Y)}g.stroke();br(X,Y,a+(R()-.5)*1.6,len*.55,w*.6,d+1);if(R()<.6)br(x+(X-x)*.5,y+(Y-y)*.5,a+(R()<.5?1:-1)*(.6+R()*.6),len*.5,w*.55,d+1)};
  for(let i=0;i<7;i++){const a=R()*6.283;br(Math.cos(a)*40,Math.sin(a)*40,a,50+R()*40,3.5,0)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return CRM[k]=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})}
function buildSites(){
  const asph=new THREE.MeshStandardMaterial({map:asphaltTex(),roughness:.9}),dirt=new THREE.MeshStandardMaterial({color:'#7a6347',roughness:1});
  for(let s=0;s<4;s++){if(!P[s].on)continue;const S={};SITES[s]=S;
    // the dock: a pier out to sea, a slipway, a crane and a shed
    const d=DOCK[s],g=new THREE.Group(),y0=Math.max(baseHeight(d.land.x,d.land.z),.6);
    add(g,new THREE.BoxGeometry(7,.5,20),PLANK,0,1.1,6);for(let k=0;k<5;k++)for(const x of[-3,3])add(g,new THREE.CylinderGeometry(.3,.3,6,8),WOOD,x,-1.6,-2+k*4.5);
    add(g,new THREE.BoxGeometry(5,.3,16).rotateX(.12),DARK,-7,-.2,5);for(const x of[-9.7,-4.3])add(g,new THREE.BoxGeometry(.5,1.1,16).rotateX(.12),STONE,x,.25,5);      // slipway between two stone walls
    add(g,new THREE.BoxGeometry(9,.6,9),DARK,7.5,.3,-3);       // the yard's quay
    // the shed: plank walls, windows, a big door and a pitched roof in the team colour
    add(g,new THREE.BoxGeometry(7,4,6),PLANK,8,2.6,-3.5);for(const sd of[-1,1]){const rf=add(g,new THREE.BoxGeometry(7.6,.22,3.6),teamM[s],8,5.35,-3.5+sd*1.55);rf.rotation.x=sd*.55}
    add(g,new THREE.BoxGeometry(7,1.1,.2).translate(0,0,0),PLANK,8,5.1,-.55);add(g,new THREE.BoxGeometry(2.6,2.8,.12),GATEM,8,2,-.42);for(const x of[5.6,10.4])add(g,new THREE.BoxGeometry(1,.8,.1),DARK,x,3.2,-.44);
    // a gantry crane straddling the slipway, its hook hanging over the hull
    for(const x of[-10.4,-3.6])for(const z of[-1,11]){add(g,new THREE.BoxGeometry(.5,10,.5),STEEL,x,5,z)}
    for(const z of[-1,11])add(g,new THREE.BoxGeometry(7.4,.6,.6),teamM[s],-7,10.2,z);add(g,new THREE.BoxGeometry(1.4,.9,12.6),STEEL,-7,10.8,5);add(g,new THREE.BoxGeometry(1.2,1,1.4),DARK,-7,10,6);add(g,new THREE.CylinderGeometry(.04,.04,4.5,4),STEEL,-7,7.6,6);add(g,new THREE.BoxGeometry(.5,.3,.5),DARK,-7,5.3,6);
    // crates, a container and lamps on the quay, bollards along the pier
    for(const[x,z,h]of[[4.3,1.5,.9],[5.3,1.5,.9],[4.8,1.5,1.8],[11,1.2,.9]])add(g,new THREE.BoxGeometry(.9,.9,.9),WOOD,x,.6+h-.45,z);add(g,new THREE.BoxGeometry(2.4,2.2,5),teamM[s],11.2,1.7,-9.5);
    for(const[x,z]of[[3.6,-8],[3.6,14]]){add(g,new THREE.CylinderGeometry(.09,.12,4.6,6),STEEL,x,2.6,z);add(g,new THREE.SphereGeometry(.28,8,6),GOLD,x,5,z)}
    for(let k=0;k<4;k++)add(g,new THREE.CylinderGeometry(.22,.26,.5,8),DARK,3.2,1.6,2+k*4.5);
    const dk=mergeModel(g);dk.position.set(d.land.x,y0-1,d.land.z);dk.rotation.y=d.ang;scene.add(dk);S.dk=dk;
    S.yRes=new THREE.Mesh(new THREE.CircleGeometry(10,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:.25,depthWrite:false}));S.yRes.position.set(d.land.x,y0+.25,d.land.z);scene.add(S.yRes);
    const hull=new THREE.Group();hull.position.set(-7,.4,5);dk.add(hull);
    {const H=hullGeos(.62),hm=new THREE.MeshStandardMaterial({color:'#4a535c',roughness:.6}),hb=new THREE.MeshStandardMaterial({color:'#7a2a22',roughness:.7}),hd=new THREE.MeshStandardMaterial({color:'#646a70',roughness:.8});
      for(const[g2,m]of[[H.top,hm],[H.boot,hb],[H.deck,hd]]){const o=new THREE.Mesh(g2,m);o.position.set(0,1.1,-.5);o.castShadow=true;hull.add(o)}}
    for(const z of[-5,0,5])for(const x of[-2.4,2.4])add(hull,new THREE.CylinderGeometry(.08,.08,4.4,5),WOOD,x,2.2,z);
    hull.visible=false;S.hull=hull;S.hz=5;
    S.dw=[];
    {        // the muster field of every player: a trodden patch with the team's banners at its edge
      const R=RALLY[s],cg=new THREE.CircleGeometry(12.5,48,0,6.2832).rotateX(-Math.PI/2),cp=cg.attributes.position;for(let i=0;i<cp.count;i++)cp.setY(i,baseHeight(R.x+cp.getX(i),R.z+cp.getZ(i))+.14);
      const cm=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:s===A.seat?.28:.2,depthWrite:false}));cm.position.set(R.x,0,R.z);scene.add(cm);
      for(let i=0;i<5;i++){const a=i/5*6.283+.4,x=R.x+Math.cos(a)*13,z=R.z+Math.sin(a)*13,fg=new THREE.Group();fg.position.set(x,baseHeight(x,z),z);add(fg,new THREE.CylinderGeometry(.08,.1,4.2,6),WOOD,0,2.1,0);add(fg,new THREE.BoxGeometry(.05,.8,1.3),teamM[s],0,3.7,.66);scene.add(fg)}}
    // the runway strip: marked out, then dirt while it is built, then tarmac
    const r=RWY[s];if(!r)continue;
    S.rRes=drape(r.c,r.ux,r.uz,r.len,9,new THREE.MeshBasicMaterial({color:TEAM[s],transparent:true,opacity:.22,depthWrite:false}),.18);
    S.rDirt=drape(r.c,r.ux,r.uz,r.len,9,dirt,.12);S.rAsph=drape(r.c,r.ux,r.uz,r.len,9,asph,.16);S.rDirt.visible=S.rAsph.visible=false;
    // cracks that open up in the tarmac as it is bombed, and close again as it is mended
    {let sd=77+s*13;const R2=()=>(sd=(sd*16807)%2147483647)/2147483647;S.cr=[...Array(12)].map((_,i)=>{const a=(((i*7)%12)/11-.5)*r.len*.86,b=(R2()-.5)*2.4,an=R2()*6.28,c={x:r.c.x+r.ux*a+r.uz*b,z:r.c.z+r.uz*a-r.ux*b},m=drape(c,Math.cos(an),Math.sin(an),5+R2()*1.6,5+R2()*1.6,crackMat(i%3),.2+i*.002);m.visible=false;m.renderOrder=2;return m})}
    S.rw=[];
  }
}
function updateSites(dt){
  const swing=(ws,on)=>{for(const w of ws){w.g.visible=on;if(on){w.arm.rotation.x=-1.3+Math.sin(now()*.011+w.ph)*1.05;if(Math.sin(now()*.011+w.ph)>.97&&Math.random()<.3){const p=new THREE.Vector3();w.arm.getWorldPosition(p);sparks(p.x,p.z)}}}};
  for(let s=0;s<4;s++){const S=SITES[s],D=P[s];if(!S)continue;
    const st=D.dead?0:(D.rwState||0);if(S.rRes){S.rRes.visible=st===0&&!D.dead;S.rDirt.visible=st===1;S.rAsph.visible=st===2;const nc=st===2?Math.round((1-rwHpOf(D)/RW_HP)*12):0;S.cr.forEach((m,i)=>m.visible=i<nc)}
    const y=local(D)?(D.yard?{type:D.yard.type,f:1-D.yard.t/D.yard.T}:null):D.yardV;
    if(D.launchT>0){D.launchT-=dt;const k=1-D.launchT/1.6;S.hull.visible=true;S.hull.scale.y=1;S.hull.position.z=S.hz+k*16;S.hull.position.y=.4-k*1.6;if(Math.random()<dt*8)splash(S.hull.getWorldPosition(tv).x,tv.z,2);if(D.launchT<=0)S.hull.visible=false}
    else if(y){S.hull.visible=true;S.hull.position.set(-7,.4,S.hz);S.hull.scale.set(y.type==='gemi'?1:.75,.15+.85*y.f,y.type==='gemi'?1:.8)}
    else S.hull.visible=false;
    const ys=D.dead?0:(D.ysState||0),wr=ys===0&&D.ysWreck;S.yRes.visible=ys===0&&!D.dead&&!wr;S.dk.visible=ys>0||!!wr;
    // a shelled shipyard stays as a broken, half-sunk wreck that smoulders for a while, until it is built again
    if(S.dk0==null){S.dk0=S.dk.position.y;S.dkr=S.dk.rotation.z}const tgY=wr?S.dk0-1.5:S.dk0;S.dk.position.y+=(tgY-S.dk.position.y)*Math.min(1,dt*1.5);S.dk.rotation.z=S.dkr+(wr?.07:0);S.dk.rotation.x=wr?-.04:0;
    if(wr){const age=(now()-D.ysWreck)/1000,L0=DOCK[s].land;if(age<25&&Math.random()<dt*(age<8?6:2))puff(L0.x+(Math.random()-.5)*8,1.5,L0.z+(Math.random()-.5)*8,2.6,3.2,.22,1.6,1.1);if(age<8&&Math.random()<dt*5)flame(L0.x+(Math.random()-.5)*6,1,L0.z+(Math.random()-.5)*6,1.8,.35)}
    {const k=ys===1?clamp(1-(local(D)?D.ysT/YARD_T:.5),0,1):1,sy=ys===1?.15+.85*k:1;if(S.dk.scale.y!==sy){S.dk.scale.y=sy;for(const w of S.dw)w.g.scale.y=1/sy}}
    swing(S.dw,(!!y||ys===1)&&!D.dead)}
}
// trees and rocks scattered over the bases; a blast or a new building knocks them down
const PROPS=[];let PROPM=null;
function clearProps(x,z,r){for(const p of PROPS)if(p.alive&&Math.hypot(p.x-x,p.z-z)<r)breakProp(p,x,z)}
function breakProp(p,fx,fz){
  p.alive=false;const k=PROPM[p.k];mx.makeScale(0,0,0);for(const m of k)m.setMatrixAt(p.i,mx),m.instanceMatrix.needsUpdate=true;
  if(p.k.startsWith('rock')){burst(p.x,p.y+.6,p.z,9,['#8b8a80','#6e6c66','#a7a49a'],6,1.2,.35);puff(p.x,p.y+.5,p.z,1.6,1.8,.55,.6,.5);return}
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
  // the fountain: an octagonal two-tier basin in pale sandstone with a terracotta band, a fluted column and water spilling from the upper bowl
  const fountain=new THREE.Group();G.add(fountain);const sand=new THREE.MeshStandardMaterial({color:'#cdb98f',roughness:.8}),terra=new THREE.MeshStandardMaterial({color:'#a8603f',roughness:.85}),wat=new THREE.MeshStandardMaterial({color:'#4aa3bb',roughness:.15,metalness:.1,transparent:true,opacity:.85}),fall=new THREE.MeshStandardMaterial({color:'#bfe6f0',roughness:.1,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false});
  const fm=(g,m,y,par)=>{const o=new THREE.Mesh(g,m);o.position.y=y;o.castShadow=true;o.receiveShadow=true;(par||fountain).add(o);return o};
  fm(new THREE.CylinderGeometry(3.7,4,.4,8),side,Y+.2);fm(new THREE.CylinderGeometry(3.05,3.25,.85,8),sand,Y+.82);fm(new THREE.CylinderGeometry(3.28,3.28,.16,8),terra,Y+.78);
  fm(new THREE.TorusGeometry(3.08,.17,6,8).rotateX(Math.PI/2).rotateY(Math.PI/8),sand,Y+1.25);fm(new THREE.CylinderGeometry(2.85,2.85,.08,24),wat,Y+1.12);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8,o=fm(new THREE.BoxGeometry(.5,.32,.12),k%2?terra:side,Y+.82);o.position.x=Math.sin(a)*3.17;o.position.z=Math.cos(a)*3.17;o.rotation.y=a}     // carved panels round the basin
  const col=new THREE.Group();col.position.y=Y+.3;fountain.add(col);
  fm(new THREE.CylinderGeometry(.62,.8,.5,8),sand,.95,col);fm(new THREE.CylinderGeometry(.36,.46,1.9,10),side,2.1,col);fm(new THREE.CylinderGeometry(1.35,.5,.42,12),sand,3.2,col);fm(new THREE.CylinderGeometry(1.2,1.2,.06,16),wat,3.4,col);
  fm(new THREE.CylinderGeometry(1.25,1.45,.95,16,1,true),fall,2.7,col);fm(new THREE.CylinderGeometry(.22,.3,.85,8),side,3.8,col);fm(new THREE.CylinderGeometry(.72,.26,.28,10),terra,4.3,col);fm(new THREE.CylinderGeometry(.55,.66,.5,12,1,true),fall,4.05,col);
  fm(new THREE.SphereGeometry(.24,10,8),sand,4.65,col);fm(new THREE.ConeGeometry(.12,.4,8),terra,4.95,col);
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
    const m=new THREE.Mesh(new THREE.BoxGeometry(BRW*2+.6,.6,l),[side,side,deck,side,side,side]);m.position.y=Y-.3;m.castShadow=m.receiveShadow=true;g.add(m);
    for(const sx of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.42,.62,l),side);r.position.set(sx*(BRW+.1),Y+.3,0);r.castShadow=true;g.add(r);
      for(let k=0;k<4;k++){const q=new THREE.Mesh(new THREE.CylinderGeometry(.6,.85,4,10),side);q.position.set(sx*(BRW-.9),Y-2.4,-l/2+6+k*(l-12)/3);q.castShadow=true;g.add(q)}
      for(let k=0;k<2;k++){const q=new THREE.Mesh(new THREE.BoxGeometry(.8,1.6,.8),side);q.position.set(sx*(BRW+.1),Y+.6,(k?1:-1)*(l/2-.6));q.castShadow=true;g.add(q)}}
    scene.add(g);b.g=g}
}
// a fallen stone bridge is never rebuilt in stone: the castle's workers knock together a timber bridge at the water's edge,
// standing it up on their own bank as it grows, then let it drop across to the far bank
function buildWoodBridge(b,seat){const c=castlePos(seat),A=Math.hypot(b.a.x-c.x,b.a.z-c.z)<=Math.hypot(b.b.x-c.x,b.b.z-c.z),e=A?b.a:b.b,o=A?b.b:b.a,l=Math.hypot(o.x-e.x,o.z-e.z),W=BRW*2-.6;
  const g=new THREE.Group();g.rotation.order='YXZ';g.position.set(e.x,1.06,e.z);g.rotation.y=Math.atan2(o.x-e.x,o.z-e.z);const n=10,cl=l/n;
  for(let i=0;i<n;i++){const sec=new THREE.Group();sec.position.z=cl*(i+.5);g.add(sec);add(sec,new THREE.BoxGeometry(W,.4,cl-.12),WOOD,0,-.2,0);for(const sx of[-1,1])add(sec,new THREE.BoxGeometry(.3,.85,cl-.1),WOOD,sx*W/2,.38,0);
    add(sec,new THREE.BoxGeometry(W+.5,.22,.32),WOOD,0,-.45,cl/2-.2);if(i%2)for(const sx of[-1,1])add(sec,new THREE.CylinderGeometry(.42,.5,4,8),WOOD,sx*(W/2-.6),-2.2,0)}
  for(const sx of[-1,1]){add(g,new THREE.BoxGeometry(.4,2.8,.4),teamM[seat],sx*(W/2+.1),1.3,.3);add(g,new THREE.BoxGeometry(.4,2.8,.4),WOOD,sx*(W/2+.1),1.3,l-.3)}
  scene.add(g);b.g=g;b.wood=true;b.from=seat;b.e=e;b.o=o;return g}
// the 1v1 stone bridges go down like the plaza: any blast on them, and they can be rebuilt for gold
function breakDuelBridge(i,remote){
  const b=DBR[i];if(!b||b.down)return;const wd=!!b.wood;b.down=true;b.downAt=now();navLand=null;const g=b.g;b.g=null;b.wood=false;
  if(g){g.updateMatrixWorld(true);for(const m of[...g.children]){const v=new THREE.Vector3(),q=new THREE.Quaternion();m.getWorldPosition(v);m.getWorldQuaternion(q);const w=new THREE.Group();w.position.copy(v);w.quaternion.copy(q);m.position.set(0,0,0);m.quaternion.identity();w.add(m);scene.add(w);wreck.push({g:w,t:-Math.random()*.1,r:.4+Math.random()*1.2})}scene.remove(g)}
  const mx0=(b.a.x+b.b.x)/2,mz0=(b.a.z+b.b.z)/2;explode(mx0,mz0,3);quake=Math.max(quake,1.6*clamp(1-Math.hypot(mx0-view.x,mz0-view.z)/(view.d*1.4),0,1));
  for(let k=0;k<=8;k++){const x=lerp(b.a.x,b.b.x,k/8),z=lerp(b.a.z,b.b.z,k/8);burst(x,1.5,z,7,wd?['#6d4b2c','#4b3320','#a08560']:['#8f8a7c','#6e6a60','#b0ab9c'],9,1.4,.35);puff(x,2,z,3.4,3.6,.72,1.6,1.4);if(k%2)splash(x,z,2.4)
    setTimeout(()=>{splash(x+(Math.random()-.5)*4,z+(Math.random()-.5)*4,3.4);ripple(x,z,8);if(k%3===0)burst(x,.6,z,6,['#d8eef5','#ffffff','#9fc6d6'],8,1.2,.3)},420+k*90+Math.random()*250)}     // the spans crash down one after another and throw up the sea
  fxAt(ME,mx0,mz0,'bomba');tip(TL('Köprü yıkıldı! Köprü düğmesiyle işçilerin tahta köprü kurabilir.','A bridge fell! Use the Bridge button and your workers build a timber one.'));
  for(const D of P)if(local(D))for(const u of D.units){
    if(!fighter(u.type)||u.ret||UNITS[u.type].yol!=='kara')continue;
    if(segD(u.x,u.z,b)<BRW+.6){u.sink=Math.random()*-.25;continue}     // they drop off the broken deck into the sea and go under
    if(!u.path.pts.some((p,k)=>u.path.c[k]>u.s&&segD(p.x,p.z,b)<5))continue;
    const e=u.path.pts[u.path.pts.length-1],n=nav({x:u.x,z:u.z},e)||nav({x:u.x,z:u.z},castlePos(seatAt(u.x,u.z)));
    if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(u.cmd?0:7+u.id%5);u.off=false;u.reS=false}else{u.path=polyPath([{x:u.x,z:u.z},{x:u.x+.01,z:u.z}]);u.s=0;u.end=0;u.cmd=true;u.hold=true}}
  if(!remote)say('dkopru',{i});
}
function fixDuelBridge(i,remote,seat){
  const b=DBR[i];if(!b||!b.down||b.lowering)return;if(!b.g||!b.wood){if(b.g)scene.remove(b.g);buildWoodBridge(b,seat??ME.seat);b.g.rotation.x=-1.42}b.g.scale.z=1;b.lowering=true;
  FALL.push({kind:'lower',o:b.g,t:0,b});tip(TL('Tahta köprü karşı kıyıya indiriliyor…','The timber bridge is being lowered across…'));if(!remote)say('dkopruonar',{i,s:seat??ME.seat});
}
const duelBridgeAt=p=>{let bi=-1,bd=10;DBR.forEach((b,i)=>{const d=segD(p.x,p.z,b);if(d<bd){bd=d;bi=i}});return bi};
function brickTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#7a7266';g.fillRect(0,0,256,256);     // warm, light sandstone blocks
  for(let y=0;y<8;y++)for(let x=-1;x<6;x++){const v=175+Math.random()*45|0;g.fillStyle=`rgb(${v},${v-10},${v-28})`;g.fillRect(x*51+(y%2)*25+2,y*32+2,47,28)}
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
function bakeIms(g){
  g.updateMatrixWorld(true);const by=new Map(),ims=[];
  g.traverse(o=>{if(!o.isMesh)return;let a=by.get(o.material);if(!a)by.set(o.material,a=[]);const q=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());q.applyMatrix4(o.matrixWorld);a.push(q)});
  for(const[mat,list]of by){let n=0;for(const q of list)n+=q.attributes.position.count;const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2);let o=0;
    for(const q of list){P3.set(q.attributes.position.array,o*3);N3.set(q.attributes.normal.array,o*3);if(q.attributes.uv)U2.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count;q.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));mg.computeBoundingBox();mg.computeBoundingSphere();
    const m=new THREE.InstancedMesh(mg,mat,TCAP);m.castShadow=m.receiveShadow=true;m.count=0;m.visible=false;if(mat===TEAM_W)m.setColorAt(0,tc[0]);scene.add(m);ims.push(m)}
  g.traverse(o=>{if(o.geometry)o.geometry.dispose()});return ims}
// every tower but the wall has a head (archer, gun, launcher) that swings round to face what it shoots at
const HEAD={ok:{rate:7,mz:1.2},top:{rate:2.6,mz:2.6},hava:{rate:5,mz:2.2},roket:{rate:2.4,mz:1.4}};
function towerTpl(type,lvl){
  const key=type+lvl;let T=TPL.get(key);if(T)return T;
  const t={type,lvl,owner:-1};const g=new THREE.Group(),hg=new THREE.Group();buildTower(g,t,TEAM_W,HEAD[type]?hg:null);
  T={top:t.top,ims:bakeIms(g),hims:HEAD[type]?bakeIms(hg):[],list:[],dirty:true};TPL.set(key,T);return T;
}
function drawTowers(){
  for(const T of TPL.values()){
    let shaking=false;for(const h of T.list)if(h.shake>0){shaking=true;break}
    if(!T.dirty&&!shaking&&!T.hdirty)continue;
    let k=0;for(const h of T.list){if(!h.visible||k>=TCAP)continue;
      if(h.shake>0){const a=h.shake*1.3;vp.set(h.x+Math.sin(now()*.07)*a,h.y,h.z+Math.cos(now()*.09)*a);qt.setFromAxisAngle(ZF,Math.sin(now()*.05)*a*.12)}else{vp.set(h.x,h.y,h.z);qt.identity()}
      vs.set(1,h.sy||1,1);
      if(T.dirty||shaking){mx.compose(vp,qt,vs);for(const m of T.ims){m.setMatrixAt(k,mx);if(m.instanceColor)m.setColorAt(k,tc[h.owner])}}
      if(T.hims.length){qr.setFromAxisAngle(UP,h.yaw||0);qt.multiply(qr);if(h.kick>0){const r=h.kick*.5;vp.x-=Math.cos(h.yaw||0)*r;vp.z+=Math.sin(h.yaw||0)*r}mx.compose(vp,qt,vs);for(const m of T.hims){m.setMatrixAt(k,mx);if(m.instanceColor)m.setColorAt(k,tc[h.owner])}}
      k++}
    vs.set(1,1,1);
    for(const m of T.ims){m.count=k;m.visible=k>0;if(T.dirty||shaking){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;if(T.mem&&k)m.computeBoundingSphere()}}
    for(const m of T.hims){m.count=k;m.visible=k>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;if(T.mem&&k)m.computeBoundingSphere()}
    T.dirty=false;T.mem=false;T.hdirty=false}
}
const dropModel=h=>{if(!h)return;if(h.tpl){const T=h.tpl,i=T.list.indexOf(h);if(i>=0)T.list.splice(i,1);T.dirty=T.mem=true;return}scene.remove(h);h.traverse(o=>{if(o.geometry)o.geometry.dispose()})};
const add=(g,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
// the castle: a walled square with a gate on every side, corner towers, and the tall keep in the middle with its archers
const CH=7.2,KH=12.5,GATEM=new THREE.MeshStandardMaterial({color:'#2a1d12',roughness:.9}),BOWM=new THREE.MeshStandardMaterial({color:'#6b4426',roughness:.8});     // half the width of the castle wall
function castleAng(s){const c=castlePos(s),r=ROAD[s];if(r)for(const p of r)if(Math.hypot(p.x-c.x,p.z-c.z)>14)return Math.atan2(p.z-c.z,p.x-c.x);return 0}
const CANG=[0,1,2,3].map(castleAng);
function gates(s){const c=castlePos(s),a=CANG[s];return[0,1,2,3].map(i=>{const b=a+i*Math.PI/2;return{x:c.x+Math.cos(b)*(CH+2),z:c.z+Math.sin(b)*(CH+2)}})}
const gateApproach=(s,p)=>{const g=gateNear(s,p.x,p.z),c=castlePos(s),k=(CH+3.6)/(CH+2),o=((Math.random()-.5)*2.4);const dx=g.x-c.x,dz=g.z-c.z,l=Math.hypot(dx,dz)||1;return{x:c.x+dx*k-dz/l*o,z:c.z+dz*k+dx/l*o}};
const gateNear=(s,x,z)=>{let b=null,bd=1e9;for(const q of gates(s)){const d=Math.hypot(q.x-x,q.z-z);if(d<bd){bd=d;b=q}}return b};
function buildCastle(s){
  const g=new THREE.Group(),c=castlePos(s),t=teamM[s],h0=heightAt(c.x,c.z),a=CANG[s];g.rotation.y=-a;
  const gy=(lx,lz)=>{const X=c.x+lx*Math.cos(a)-lz*Math.sin(a),Z=c.z+lx*Math.sin(a)+lz*Math.cos(a);return Math.max(heightAt(X,Z),h0-1.2)-h0};
  const H=CH,WH=4.2,TH=1.3,gap=1.9;
  // the castle is cut into parts that are damaged one by one: 0-3 corner towers, 4-7 walls with their gates, 8 the keep, 9 the floor; 10-18 the rubble each part leaves
  const SG=[...Array(19)].map((_,i)=>{const q=new THREE.Group();q.userData.seg=i;g.add(q);return q});
  add(SG[9],new THREE.BoxGeometry(H*2,.5,H*2),DARK,0,.05,0);
  // curtain walls, each split by a gate in its middle
  for(let k=0;k<4;k++){const sg=new THREE.Group();sg.rotation.y=k*Math.PI/2;SG[4+k].add(sg);
    for(const sd of[-1,1]){const l=H-gap-1.2,mx=sd*(gap+1.2+l/2);const y=gy(H,mx);
      add(sg,new THREE.BoxGeometry(TH,WH,l),STONE,H,y+WH/2,mx);add(sg,new THREE.CylinderGeometry(.72,1.05,1,4,1).rotateY(Math.PI/4).scale(1,1,l/1.2),STONE,H,y+.45,mx);add(sg,new THREE.BoxGeometry(TH+.5,.3,l),DARK,H,y+WH+.15,mx);
      for(let m=-l/2+.45;m<l/2;m+=1.1)add(sg,new THREE.BoxGeometry(TH+.3,.7,.55),STONE,H+.15,y+WH+.65,mx+m);
      add(sg,new THREE.CylinderGeometry(.95,1.1,WH+2.6,16),STONE,H,y+(WH+2.6)/2,sd*(gap+.6));add(sg,new THREE.CylinderGeometry(1.12,1.4,1.1,16),STONE,H,y+.5,sd*(gap+.6));add(sg,new THREE.CylinderGeometry(1.08,1.08,.22,16),DARK,H,y+WH+2.5,sd*(gap+.6));     // gatehouse towers
      for(let i=0;i<6;i++){const b=i/6*6.283;add(sg,new THREE.BoxGeometry(.4,.5,.4),STONE,H+Math.cos(b)*.9,y+WH+2.85,sd*(gap+.6)+Math.sin(b)*.9)}}
    const y=gy(H,0);
    add(sg,new THREE.BoxGeometry(TH+.6,1.4,gap*2+.2),STONE,H,y+WH+.4,0);     // the arch over the gate
    add(sg,new THREE.BoxGeometry(.06,1.1,.8),t,H+.95,y+WH-.2,0)}
  // corner towers
  const CT=[];
  [[H,H],[-H,H],[H,-H],[-H,-H]].forEach(([x,z],ci)=>{const g=SG[ci];const y=gy(x,z);add(g,new THREE.CylinderGeometry(1.55,1.8,WH+3.6,18),STONE,x,y+(WH+3.6)/2,z);add(g,new THREE.CylinderGeometry(1.85,2.3,1.4,18),STONE,x,y+.6,z);
    add(g,new THREE.CylinderGeometry(1.85,1.55,.5,18),STONE,x,y+WH+3.55,z);add(g,new THREE.CylinderGeometry(1.62,1.62,.12,18),DARK,x,y+WH+3.62,z);
    for(let i=0;i<10;i++){const b=i/10*6.283;add(g,new THREE.BoxGeometry(.5,.62,.42),STONE,x+Math.cos(b)*1.66,y+WH+4.1,z+Math.sin(b)*1.66).rotation.y=-b}
    for(const b of[.4,2.0,3.6,5.2])add(g,new THREE.BoxGeometry(.12,.9,.3),DARK,x+Math.cos(b)*1.66,y+WH+1.2,z+Math.sin(b)*1.66).rotation.y=-b;      // arrow slits
    CT.push([x,y+WH+3.68,z])});
  // the keep: a square stone donjon with corner turrets, banners and a fighting top where the castle's one archer stands
  const K=3.6;
  add(SG[8],new THREE.BoxGeometry(K*2+.6,1.2,K*2+.6),STONE,0,.6,0);add(SG[8],new THREE.BoxGeometry(K*2,KH,K*2),STONE,0,KH/2,0);
  for(const y of[4.2,8.4])add(SG[8],new THREE.BoxGeometry(K*2+.25,.28,K*2+.25),DARK,0,y,0);       // string courses
  add(SG[8],new THREE.BoxGeometry(K*2+.9,.4,K*2+.9),DARK,0,KH+.1,0);
  for(let k=0;k<4;k++){const sg=new THREE.Group();sg.rotation.y=k*Math.PI/2;SG[8].add(sg);
    for(let m=-K+.2;m<=K-.2;m+=1.15)add(sg,new THREE.BoxGeometry(.5,.9,.62),STONE,K+.18,KH+.75,m);
    for(const y of[6.2,10.2])for(const m of[-1.6,1.6])add(sg,new THREE.BoxGeometry(.13,1.05,.38),DARK,K+.02,y,m);      // arrow slits
    add(sg,new THREE.BoxGeometry(.06,4.2,1.5),t,K+.05,KH-2.8,0);add(sg,new THREE.BoxGeometry(.08,.3,1.7),WOOD,K+.08,KH-.6,0);    // banner
  }
  for(const[x,z]of[[K,K],[-K,K],[K,-K],[-K,-K]])add(SG[8],new THREE.CylinderGeometry(.85,.55,2.8,10),STONE,x,KH-.6,z);
  add(SG[8],new THREE.BoxGeometry(1.6,2.6,.3),GATEM,K+.1,1.3,0).rotation.y=Math.PI/2;add(SG[8],new THREE.BoxGeometry(2.2,.4,.6),STONE,K+.2,2.75,0).rotation.y=Math.PI/2;
  // a tall watch turret on one corner of the roof, flying the team flag
  // the stair-head on the roof: a squat stone hut with a low door the workers come out of to tend the launcher
  add(SG[8],new THREE.BoxGeometry(2.2,1.9,2.2),STONE,-K+1.3,KH+1.15,-K+1.3);add(SG[8],new THREE.BoxGeometry(2.45,.22,2.45),DARK,-K+1.3,KH+2.2,-K+1.3);
  add(SG[8],new THREE.BoxGeometry(.75,1.25,.08),GATEM,-K+1.3,KH+.82,-K+2.42);add(SG[8],new THREE.BoxGeometry(1,.16,.14),STONE,-K+1.3,KH+1.52,-K+2.44);
  add(SG[8],new THREE.CylinderGeometry(.06,.06,2.2,6),WOOD,-K+.4,KH+3.3,-K+.4);add(SG[8],new THREE.BoxGeometry(1.3,.8,.05),t,-K+1.07,KH+4.0,-K+.4);
  {let sd=91+s*7;const R=()=>(sd=(sd*16807)%2147483647)/2147483647,pile=(q,x,z,rad,n)=>{for(let k=0;k<n;k++){const a=R()*6.283,r=Math.sqrt(R())*rad,sz=.35+R()*.8,b=add(q,new THREE.BoxGeometry(sz*(1+R()),sz*(.6+R()*.5),sz*(1+R())),R()<.8?STONE:DARK,x+Math.cos(a)*r,sz*.3,z+Math.sin(a)*r);b.rotation.set(R()*.6,R()*3,R()*.6)}};
    [[H,H],[-H,H],[H,-H],[-H,-H]].forEach(([x,z],ci)=>pile(SG[10+ci],x*1.05,z*1.05,2.8,14));
    for(let k=0;k<4;k++){const q=new THREE.Group();q.rotation.y=k*Math.PI/2;SG[14+k].add(q);pile(q,H+.6,-3.5,2,8);pile(q,H+.6,3.5,2,8);pile(q,H+1,0,1.6,5)}
    pile(SG[18],0,0,5.2,26)}
  const mg=mergeCastle(g,s);mg.position.set(c.x,h0,c.z);scene.add(mg);
  {g.updateMatrixWorld(true);const bb=new THREE.Box3();SEGC[s]=[...Array(9)].map((_,i)=>{bb.setFromObject(SG[i]);const ce=bb.getCenter(new THREE.Vector3());CSU[s].uTop.value[i]=bb.max.y;return{x:c.x+ce.x,z:c.z+ce.z,y:h0+bb.max.y}})}
  // the missile launcher on the keep roof: a turntable, a launcher box and two missiles ready on the rails. Built from the Defence menu
  const ag=new THREE.Group();add(ag,new THREE.CylinderGeometry(1.5,1.7,.5,16),STEEL,0,.25,0);add(ag,new THREE.BoxGeometry(1.4,.9,1.4),DARK,0,.95,0);
  const rk=new THREE.Group();rk.position.set(0,2.5,0);rk.rotation.z=1.2;ag.add(rk);const rk0=new THREE.Group();rk0.position.x=1.05;rk.add(rk0);add(rk0,new THREE.BoxGeometry(5.6,.3,1.3),t,.2,0,0);for(const z of[-.5,.5])add(rk0,new THREE.BoxGeometry(5.4,.18,.14),STEEL,.2,.22,z);
  {const MW=new THREE.MeshStandardMaterial({color:'#d8dde2',roughness:.4});add(rk0,new THREE.CylinderGeometry(.5,.5,4.4,16).rotateZ(-Math.PI/2),MW,0,.8,0);add(rk0,new THREE.ConeGeometry(.5,1.5,16).rotateZ(-Math.PI/2),t,2.95,.8,0);add(rk0,new THREE.CylinderGeometry(.54,.54,.5,16).rotateZ(-Math.PI/2),t,1.1,.8,0);
    add(rk0,new THREE.BoxGeometry(.8,2.2,.1),STEEL,-1.85,.8,0);add(rk0,new THREE.BoxGeometry(.8,.1,2.2),STEEL,-1.85,.8,0)}
  add(ag,new THREE.CylinderGeometry(.3,.4,2.3,10),DARK,0,1.4,0);add(ag,new THREE.BoxGeometry(.5,.6,1.5),DARK,0,2.5,0);
  const am=mergeModel(ag);am.position.set(c.x+1,h0+KH+.3,c.z+1);am.rotation.y=-a;am.visible=false;scene.add(am);KARCH[s]={m:am,yaw:-a,want:-a,draw:0};
  CARCH[s]=CT.map(([lx,ly,lz])=>{const X=c.x+lx*Math.cos(a)-lz*Math.sin(a),Z=c.z+lx*Math.sin(a)+lz*Math.cos(a),yw=Math.atan2(-(Z-c.z),X-c.x);return{x:X,z:Z,y:h0+ly,yaw:yw,want:yw,s}});ARCHD=true;
}
const KARCH=[],CARCH=[],SEGC=[],CSU=[];
// the portcullises: down when no one is about, they rise for your own people going in or out and drop again behind them; never for the enemy
let PORT=null,portAcc=0;const PORTO=[0,1,2,3].map(()=>[0,0,0,0]),PORTW=[0,1,2,3].map(()=>[0,0,0,0]);
function drawGates(dt){
  if(!PORT){PORT=new THREE.InstancedMesh(new THREE.BoxGeometry(.28,3.9,3.5),GATEM,16);PORT.castShadow=true;PORT.frustumCulled=false;scene.add(PORT)}
  portAcc+=dt;if(portAcc>.15){portAcc=0;
    for(let s=0;s<4;s++){const D=P[s];if(!D||!D.on||D.dead)continue;const G=gates(s),lo=local(D),src=lo?D.units:D.remote.values();PORTW[s].fill(0);
      for(const u of src){const f=lo?u.from:num(u.from,s);if(f!==s&&!allied(f,s))continue;if(u.type&&(naval(u.type)||flies(UNITS[u.type]||{})))continue;if(lo&&(u.done||u.hp<=0))continue;
        for(let k=0;k<4;k++)if(Math.abs(u.x-G[k].x)<6&&Math.abs(u.z-G[k].z)<6)PORTW[s][k]=1}}}
  let n=0;
  for(let s=0;s<4;s++){const D=P[s];if(!D||!D.on||D.dead||!SEGC[s])continue;const c=castlePos(s),G=gates(s),h0=heightAt(c.x,c.z),C=csOf(D);
    for(let k=0;k<4;k++){const o=PORTO[s][k]=clamp(PORTO[s][k]+(PORTW[s][k]?dt*2.2:-dt*1.6),0,1),b=Math.atan2(G[k].z-c.z,G[k].x-c.x),r=CH+.55;
      vp.set(c.x+Math.cos(b)*r,h0+1.95+o*3.1-Math.max(0,.2-o)*0,c.z+Math.sin(b)*r);qt.setFromAxisAngle(UP,-b);vs.set(1,1,1);mx.compose(vp,qt,vs);PORT.setMatrixAt(n++,mx)}}
  PORT.count=n;PORT.instanceMatrix.needsUpdate=true}
// the castle's materials learn to crumble: every vertex knows its part, and a part that is hurt is sheared off to a jagged stump,
// blackened, while its rubble rises round its foot. All of it in the vertex shader, so a ruin costs nothing extra to draw
const CRUMBLE=`int si=int(aSeg+.5);float cd=0.;
  if(si>=10){cd=uSeg[si-10];transformed.y=cd<.22?-8.:transformed.y*min(1.,(cd-.22)*2.2);cd=0.;}
  else if(si<9){cd=uSeg[si];if(cd>0.){float top=uTop[si];float cut=top-(top-.5)*cd*.86+(sin(position.x*2.1+position.z*1.3)*.9+sin(position.x*4.7-position.z*3.9)*.6+sin(position.x*9.3+position.z*7.1)*.35)*cd*1.4;if(transformed.y>cut)transformed.y=cut;}}`;
function crumbleMat(m,U,depth){const q=depth?new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}):m.clone();
  q.onBeforeCompile=sh=>{sh.uniforms.uSeg=U.uSeg;sh.uniforms.uTop=U.uTop;
    sh.vertexShader='attribute float aSeg;\nuniform float uSeg[10];\nuniform float uTop[10];\nvarying float vCD;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{'+CRUMBLE+'vCD=cd;}');
    if(!depth)sh.fragmentShader='varying float vCD;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.-.55*vCD;')};
  q.customProgramCacheKey=()=>'crumble'+(depth?'d':'');return q}
function mergeCastle(g,s){
  const U=CSU[s]={uSeg:{value:new Array(10).fill(0)},uTop:{value:new Array(10).fill(20)}};
  g.updateMatrixWorld(true);const by=new Map();
  g.traverse(o=>{if(!o.isMesh)return;let p=o,sg=9;while(p){if(p.userData&&p.userData.seg!=null){sg=p.userData.seg;break}p=p.parent}
    let a=by.get(o.material);if(!a)by.set(o.material,a=[]);const q=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());q.applyMatrix4(o.matrixWorld);q.userData.seg=sg;a.push(q)});
  const out=new THREE.Group(),dm=crumbleMat(null,U,true);
  for(const[mat,list]of by){let n=0;for(const q of list)n+=q.attributes.position.count;const P3=new Float32Array(n*3),N3=new Float32Array(n*3),U2=new Float32Array(n*2),S1=new Float32Array(n);let o=0;
    for(const q of list){const c=q.attributes.position.count;P3.set(q.attributes.position.array,o*3);N3.set(q.attributes.normal.array,o*3);if(q.attributes.uv)U2.set(q.attributes.uv.array,o*2);S1.fill(q.userData.seg,o,o+c);o+=c;q.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P3,3));mg.setAttribute('normal',new THREE.BufferAttribute(N3,3));mg.setAttribute('uv',new THREE.BufferAttribute(U2,2));mg.setAttribute('aSeg',new THREE.BufferAttribute(S1,1));mg.computeBoundingSphere();
    const m=new THREE.Mesh(mg,crumbleMat(mat,U));m.customDepthMaterial=dm;m.castShadow=m.receiveShadow=true;out.add(m)}
  return out}let ARCHD=true,ARCHI=null;
// the castles' corner archers share one instanced model, so sixteen of them cost a handful of draw calls
function drawArchers(dt){
  if(!ARCHI){const g=new THREE.Group();archerFig(g,TEAM_W,0,0,0,1.25);ARCHI=bakeIms(g)}
  for(let i=0;i<CARCH.length;i++){const A=CARCH[i];if(!A)continue;for(const q of A)if(q.yaw!==q.want){q.yaw=angLerp(q.yaw,q.want,Math.min(1,dt*8));if(Math.abs(q.yaw-q.want)<.002)q.yaw=q.want;ARCHD=true}}
  let sig=0;for(let i=0;i<P.length;i++)if(P[i].on&&!P[i].dead)sig+=(1+nArch(P[i]))*Math.pow(6,i);if(sig!==drawArchers.sig){drawArchers.sig=sig;ARCHD=true}
  if(!ARCHD)return;ARCHD=false;let k=0;
  for(let i=0;i<CARCH.length;i++){const A=CARCH[i],D=P[i];if(!A||!D||!D.on||D.dead)continue;for(let j=0;j<4;j++){if(achOf(D)[j]<=0)continue;const q=A[j];vp.set(q.x,q.y,q.z);qt.setFromAxisAngle(UP,q.yaw);vs.set(1,1,1);mx.compose(vp,qt,vs);for(const m of ARCHI){m.setMatrixAt(k,mx);if(m.instanceColor)m.setColorAt(k,tc[i])}k++}}
  for(const m of ARCHI){m.count=k;m.visible=k>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere()}}
// a missile leaving the keep: the launcher swings round, fire and smoke burst out of its rails
function launchFx(s,at){const k=KARCH[s],c=castlePos(s),y=Math.max(heightAt(c.x,c.z),0)+KH+2.4;if(k&&at)k.want=Math.atan2(-(at.z-c.z),at.x-c.x);
  flame(c.x,y,c.z,4,.4);for(let j=0;j<6;j++)puff(c.x+(Math.random()-.5)*3,y,c.z+(Math.random()-.5)*3,2.4,2.6,.75,1.2,1.2);fxAt(P[s],c.x,c.z,'fuzeCik')}
function makeTowerModel(t){
  const T=towerTpl(t.type,t.lvl);if(T.top!=null)t.top=T.top;
  if(t.yaw==null)t.yaw=CANG[t.owner]!=null?-CANG[t.owner]:0;const h={tpl:T,x:t.x,y:heightAt(t.x,t.z),z:t.z,owner:t.owner,shake:0,yaw:t.yaw,kick:0,_v:true,get visible(){return this._v},set visible(v){if(v!==this._v){this._v=v;T.dirty=T.mem=true}}};
  T.list.push(h);T.dirty=T.mem=true;t.mesh=h;
}
// an archer in a brimmed hat with a feather, bow raised and string drawn, looking down +x
function archerFig(p,col,x,y,z,s=1){
  const a=new THREE.Group();a.position.set(x,y,z);a.scale.setScalar(s);p.add(a);
  const cap=(r,l,m,px,py,pz,rx=0,rz=0)=>{const o=add(a,new THREE.CapsuleGeometry(r,l,3,7),m,px,py,pz);o.rotation.set(rx,0,rz);return o};
  // legs in a firm stance: thigh, shin and a rounded boot each
  for(const sz of[-.15,.15]){cap(.105,.3,DARK,.02,.66,sz,sz*.6);cap(.09,.28,DARK,-.02,.3,sz*1.15,sz*.5);cap(.085,.18,WOOD,.07,.08,sz*1.2,0,Math.PI/2)}
  add(a,new THREE.CylinderGeometry(.27,.37,.38,10),col,0,.86,0);add(a,new THREE.CylinderGeometry(.23,.28,.55,10),col,0,1.25,0);      // tunic skirt and body
  add(a,new THREE.CylinderGeometry(.285,.285,.08,10),WOOD,0,1.03,0);add(a,new THREE.BoxGeometry(.06,.09,.1),GOLD,.27,1.03,0);
  add(a,new THREE.SphereGeometry(.3,10,6,0,6.3,0,1.3).scale(1,.55,1.1),DARK,-.01,1.42,0);       // shoulder cape
  add(a,new THREE.CylinderGeometry(.08,.09,.12,10),SKINM,0,1.57,0);add(a,new THREE.SphereGeometry(.17,10,8).scale(.95,1.08,.95),SKINM,0,1.74,0);
  add(a,new THREE.ConeGeometry(.035,.08,6).rotateZ(-Math.PI/2),SKINM,.18,1.72,0);for(const sz of[-.06,.06])add(a,new THREE.SphereGeometry(.022,6,4),DARK,.15,1.77,sz);
  add(a,new THREE.CylinderGeometry(.36,.36,.03,14),WOOD,0,1.86,0);add(a,new THREE.CylinderGeometry(.13,.17,.24,10),WOOD,0,1.98,0);add(a,new THREE.CylinderGeometry(.172,.172,.05,10),col,0,1.89,0);
  const fe=add(a,new THREE.CapsuleGeometry(.025,.3,3,6),col,-.13,2.06,.15);fe.rotation.z=.75;
  // bow arm straight out, drawing arm bent back to the cheek
  cap(.07,.24,col,.22,1.42,-.13,0,-Math.PI/2);cap(.06,.24,SKINM,.5,1.42,-.13,0,-Math.PI/2);add(a,new THREE.SphereGeometry(.065,8,6),SKINM,.66,1.42,-.13);
  cap(.07,.2,col,.06,1.4,.2,0,-Math.PI/2);cap(.06,.2,SKINM,.07,1.48,.06,Math.PI/2.4,0);add(a,new THREE.SphereGeometry(.06,8,6),SKINM,.08,1.5,-.06);
  const bw=add(a,new THREE.TorusGeometry(.62,.032,4,12,2.3),WOOD,.06,1.42,-.13);bw.rotation.z=-1.15;
  for(const sy of[1,-1]){const x0=.305,y0=1.42+sy*.55,x1=.1,y1=1.47,l=Math.hypot(x1-x0,y1-y0),o=add(a,new THREE.CylinderGeometry(.009,.009,l,3),SKINM,(x0+x1)/2,(y0+y1)/2,-.12);o.rotation.z=Math.atan2(-(x1-x0),y1-y0)}      // the drawn string
  const ar=add(a,new THREE.CylinderGeometry(.014,.014,.8,4),WOOD,.42,1.44,-.11);ar.rotation.z=-Math.PI/2;add(a,new THREE.ConeGeometry(.035,.1,4).rotateZ(-Math.PI/2),IRONM,.85,1.44,-.11);
  const q=add(a,new THREE.CylinderGeometry(.09,.075,.55,10),WOOD,-.24,1.28,.06);q.rotation.x=.35;
  for(const dz of[-.04,.04])add(a,new THREE.ConeGeometry(.045,.12,4),col,-.24,1.6,.17+dz);
  return a}
function buildTower(g,t,col,hg){
  const H=hg||g;
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
    // the archer on the platform turns to face what he shoots
    archerFig(H,col,.25,top+.32,0,1.05);
    if(t.lvl>=2)add(g,new THREE.CylinderGeometry(2.25,2.25,.2,10),IRONM,0,b0*.55,0);
    if(t.lvl>=3)add(g,new THREE.SphereGeometry(.3,10,8),GOLD,0,top+4.9,0);
  }
  else if(t.type==='top'){const h=2.6+t.lvl;add(g,new THREE.CylinderGeometry(1.95,2.35,h,10),STONE,0,h/2,0);add(g,new THREE.CylinderGeometry(2.12,2.12,.24,10),DARK,0,h+.1,0);
    for(let i=0;i<8;i++){const b=i/8*6.283+.39;add(g,new THREE.BoxGeometry(.62,.62,.5),STONE,Math.cos(b)*1.9,h+.52,Math.sin(b)*1.9).rotation.y=-b}
    for(const sz of[-.44,.44]){add(H,new THREE.BoxGeometry(1.7,.72,.15),WOOD,-.15,h+.58,sz);add(H,new THREE.CylinderGeometry(.36,.36,.12,10).rotateX(Math.PI/2),DARK,.35,h+.48,sz*1.32);add(H,new THREE.CylinderGeometry(.3,.3,.12,10).rotateX(Math.PI/2),DARK,-.75,h+.42,sz*1.32)}
    add(H,new THREE.BoxGeometry(1.8,.14,.95),WOOD,-.15,h+.27,0);
    const br=new THREE.Group();br.position.set(.05,h+1.05,0);br.rotation.z=.16;H.add(br);
    add(br,new THREE.CylinderGeometry(.24,.36,2.9,12).rotateZ(-Math.PI/2),IRONM,.95,0,0);add(br,new THREE.TorusGeometry(.26,.08,6,12).rotateY(Math.PI/2),IRONM,2.38,0,0);
    add(br,new THREE.SphereGeometry(.38,10,8),IRONM,-.5,0,0);add(br,new THREE.CylinderGeometry(.39,.39,.22,12).rotateZ(-Math.PI/2),col,.1,0,0);add(br,new THREE.CylinderGeometry(.33,.33,.16,12).rotateZ(-Math.PI/2),col,1.5,0,0);
    add(H,new THREE.CylinderGeometry(.24,.24,.02,8),DARK,-1.3,h+.24,.7);for(const[x,z]of[[-1.3,.6],[-1.45,.78],[-1.15,.8],[-1.3,.72]])add(g,new THREE.SphereGeometry(.17,8,6),DARK,x,h+.38+(x===-1.3&&z===.72?.2:0),z);
    t.top=h+1.1}
  else if(t.type==='roket'){
    add(g,new THREE.CylinderGeometry(2.1,2.4,1,10),DARK,0,.5,0);
    const hh=new THREE.Group();hh.rotation.y=Math.PI/2;H.add(hh);const rack=new THREE.Group();rack.position.y=2.6;rack.rotation.x=-.55;hh.add(rack);add(hh,new THREE.BoxGeometry(1.4,1.4,1.4),STEEL,0,1.6,0);add(rack,new THREE.BoxGeometry(2.6,1.3,3.2),col,0,0,0);
    for(const x of[-.65,0,.65])for(const y of[-.3,.3]){add(rack,new THREE.CylinderGeometry(.22,.22,3.4,8).rotateX(Math.PI/2),STEEL,x,y,.15);add(rack,new THREE.ConeGeometry(.2,.5,8).rotateX(Math.PI/2),IRONM,x,y,1.95)}
    add(g,new THREE.BoxGeometry(.2,1.6,.2),STEEL,1.6,1.8,-1);add(g,new THREE.TorusGeometry(.5,.06,6,16).rotateY(.6),STEEL,1.6,2.8,-1);t.top=3.4}
  else if(t.type==='duvar'){const h=2.6+t.lvl*.5;add(g,new THREE.BoxGeometry(WALL,h,WALL),STONE,0,h/2,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])add(g,new THREE.BoxGeometry(.7,.7,.7),STONE,x,h+.35,z)}
  else{add(g,new THREE.BoxGeometry(3,1.2,3),DARK,0,.6,0);add(g,new THREE.CylinderGeometry(1.3,1.45,.3,12),STEEL,0,1.32,0);add(H,new THREE.CylinderGeometry(.9,1.1,1.6+t.lvl*.5,8),col,0,1.8,0);add(H,new THREE.BoxGeometry(1,.8,1.5),STEEL,.2,2.75+t.lvl*.25,0);for(const dz of[-.55,.55]){const b=add(H,new THREE.CylinderGeometry(.14,.14,4,6),STEEL,.9,3.4+t.lvl*.3,dz);b.rotation.z=-.65;add(H,new THREE.CylinderGeometry(.2,.2,.5,6),DARK,.9+Math.sin(.65)*1.9,3.4+t.lvl*.3+Math.cos(.65)*1.9,dz).rotation.z=-.65}t.top=3.6+t.lvl*.3}
}
// units are instanced: thousands of triangles, very few draw calls
const CAP=320,SKIN='#e8c9a0',IRON='#59626c',LEATH='#5a3a22',HORSE='#6b4426';
const bx=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z),cy=(a,b,h,x,y,z,n=8)=>new THREE.CylinderGeometry(a,b,h,n).translate(x,y,z),sp=(r,x,y,z)=>new THREE.SphereGeometry(r,10,8).translate(x,y,z);
const cp=(r,l,x,y,z)=>new THREE.CapsuleGeometry(r,l,4,10).translate(x,y,z);
const LEG=(p,a,ph,k)=>({p,a,ph,k}),BOOT='#2a2622',TROU='#3b3a34';
// people are built from smooth limbs: thigh, shin, boot; upper arm, forearm, hand; a proper head with a face
const cq=(r,l,x,y,z)=>new THREE.CapsuleGeometry(r,l,3,8).translate(x,y,z),sq=(r,x,y,z,w=10,h=8)=>new THREE.SphereGeometry(r,w,h).translate(x,y,z),cyl=(a,b,h,x,y,z,n=12)=>new THREE.CylinderGeometry(a,b,h,n).translate(x,y,z);
function figure(o){const P=[],{pants,shirt,sleeve,boot,glove,hx=.22}=o,face=o.face!==false;
  for(const sd of[-1,1]){const sw=LEG([sd*hx,1.22,0],.7,sd<0?0:3.14);
    P.push([cq(.17,.36,sd*hx,.98,0),pants,sw],[cq(.145,.36,sd*hx,.52,.02),o.shin||pants,sw],[new THREE.CapsuleGeometry(.13,.22,3,8).rotateX(Math.PI/2).translate(sd*hx,.13,.09),boot,sw])}
  P.push([cyl(.4,.47,.42,0,1.34,0,14),o.hips||pants],[cyl(.43,.37,.92,0,1.98,0,14),shirt],[sq(.42,0,2.36,0,14,8).scale(1,.42,1).translate(0,1.36,0),shirt],[cyl(.43,.43,.11,0,1.56,0,14),o.belt||LEATH],[cyl(.12,.14,.2,0,2.6,0,8),SKIN]);
  for(const sd of[-1,1]){const sw=sd<0?LEG([-.62,2.5,0],.55,3.14):LEG([.62,2.5,0],.55,0,'arm');if(o.armsFixed)continue;
    P.push([cq(.135,.36,sd*.62,2.18,0),sleeve||shirt,sw],[cq(.12,.3,sd*.64,1.76,.04),o.fore||sleeve||shirt,sw],[sq(.12,sd*.66,1.5,.06,8,6),glove||SKIN,sw])}
  if(face){P.push([sq(.29,0,2.95,.02,16,12).scale(1,1.08,1).translate(0,-.24,0),SKIN],[sq(.045,-.1,2.99,.25,6,4),'#1c1712'],[sq(.045,.1,2.99,.25,6,4),'#1c1712'],[new THREE.ConeGeometry(.05,.13,6).rotateX(Math.PI/2).translate(0,2.9,.31),SKIN],
    [bx(.15,.025,.03,0,2.79,.26),'#9a5a48'],[bx(.11,.03,.04,-.1,3.035,.26),'#3a2a1c'],[bx(.11,.03,.04,.1,3.035,.26),'#3a2a1c'],[sq(.07,-.29,2.93,0,6,4),SKIN],[sq(.07,.29,2.93,0,6,4),SKIN])}
  return P}
// a warship hull lofted through cross-sections: fine raked bow, full midships, a slightly narrower stern, a sheer that rises to the bow,
// red below the waterline. Returns {top, boot, deck} geometries
function hullGeos(sc=1){
  const W=z=>z>2?2.2*Math.sqrt(Math.max(0,(11-z)/9)):z<-7?2.2-(-7-z)*.16:2.2,DY=z=>1+Math.max(0,z-3)*.07,N=30,z0=-9.6,z1=11;
  const sec=z=>{const w=W(z),d=DY(z);return[[-w,d],[-w*.98,.3],[-w*.62,-1.1],[0,-1.6],[w*.62,-1.1],[w*.98,.3],[w,d]]};
  const top=[],boot=[],deck=[];
  for(let i=0;i<N;i++){const za=z0+(z1-z0)*i/N,zb=z0+(z1-z0)*(i+1)/N,A=sec(za),B=sec(zb);
    for(let k=0;k<6;k++){const q=k===0||k===5?top:boot,a0=A[k],a1=A[k+1],b0=B[k],b1=B[k+1];
      q.push(a0[0],a0[1],za,b0[0],b0[1],zb,a1[0],a1[1],za, a1[0],a1[1],za,b0[0],b0[1],zb,b1[0],b1[1],zb)}
    const wa=W(za),wb=W(zb),da=DY(za),db=DY(zb);deck.push(-wa,da,za,wa,da,za,-wb,db,zb, wa,da,za,wb,db,zb,-wb,db,zb)}
  {const A=sec(z0);for(let k=0;k<6;k++){const q=k===0||k===5?top:boot;q.push(0,(A[0][1]+A[3][1])/2,z0,A[k+1][0],A[k+1][1],z0,A[k][0],A[k][1],z0)}}     // the transom
  const mk=a=>{for(let i=0;i<a.length;i+=9)for(let j=0;j<3;j++){const t=a[i+3+j];a[i+3+j]=a[i+6+j];a[i+6+j]=t}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a.map(v=>v*sc),3));g.computeVertexNormals();return g};
  return{top:mk(top),boot:mk(boot),deck:mk(deck),W,DY}}
const PARTS={
  piyade:[...figure({pants:TROU,shirt:null,sleeve:'#7a7f86',shin:LEATH,boot:BOOT,fore:LEATH}),
    [new THREE.SphereGeometry(.335,16,8,0,6.3,0,1.62).translate(0,3.07,0),IRON],[cyl(.37,.37,.05,0,3.07,0,18),IRON],[bx(.07,.3,.06,0,2.94,.32),IRON],[new THREE.ConeGeometry(.06,.22,8).translate(0,3.47,0),IRON],
    [new THREE.SphereGeometry(.25,10,6,0,6.3,0,1.6).translate(-.6,2.47,0),IRON],[new THREE.SphereGeometry(.25,10,6,0,6.3,0,1.6).translate(.6,2.47,0),IRON],
    [new THREE.CylinderGeometry(.44,.4,.6,14,1,true).translate(0,2.1,0),'#8a9097'],[bx(.18,.15,.06,0,1.56,.44),'#d9b34a'],
    [new THREE.BoxGeometry(.84,1.25,.05).rotateX(.08).translate(0,1.98,-.47),null],[bx(.9,.1,.1,0,2.58,-.42),LEATH],
    [new THREE.CylinderGeometry(.04,.05,.95,6).rotateZ(.35).translate(-.46,1.25,.22),LEATH],
    [new THREE.CylinderGeometry(.62,.62,.09,20).rotateX(1.57).translate(-.84,2.05,.28),null,LEG([-.68,2.55,0],.3,3.14)],[new THREE.TorusGeometry(.6,.05,5,20).translate(-.84,2.05,.33),'#8a6a3a',LEG([-.68,2.55,0],.3,3.14)],[sq(.15,-.84,2.05,.36),'#c9ced4',LEG([-.68,2.55,0],.3,3.14)],
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
  // a proper hot-air balloon: a teardrop envelope sewn from gores in the team colour and cream, load lines down to a wicker basket,
  // a burner with its flame, and the bomber: dark leather coat and flying cap, goggles, one hand on the rim, a bomb in the other
  balon:(()=>{const prof=[[.35,-.7],[1.1,-.35],[2.2,.6],[3.15,2.1],[3.6,3.8],[3.55,5.3],[3,6.6],[2,7.6],[.9,8.15],[0,8.3]].map(([r,y])=>new THREE.Vector2(r,y)),G=[],seg=(a,b,r,c)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length(),g=new THREE.CylinderGeometry(r,r,L,4);g.translate(0,L/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(a[0],a[1],a[2]);return[g,c]};
    for(let k=0;k<12;k++)G.push([new THREE.LatheGeometry(prof,3,k*Math.PI/6,Math.PI/6),k%2?'#efe3c2':null]);
    const WK='#8a6239',WD='#5a3f22',COAT='#262321',CAP='#3a2a1c';
    return[...G,[new THREE.TorusGeometry(.42,.07,6,16).rotateX(1.57).translate(0,-.68,0),'#3b2614'],
      ...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([x,z])=>[seg([x*.36,-.68,z*.36],[x*.74,-2.82,z*.74],.025,'#2a1d10'),seg([x*.36,-.68,z*.36],[x*1.72,1.1,z*1.72],.02,'#2a1d10')]),
      [cy(.17,.2,.3,0,-1.2,0,8),'#59626c'],[new THREE.ConeGeometry(.11,.42,8).translate(0,-.85,0),'#ff9a3a'],[new THREE.ConeGeometry(.05,.26,6).translate(0,-.8,0),'#fff2b0'],[bx(1.3,.05,.05,0,-1.36,0),'#59626c'],[bx(.05,.05,1.3,0,-1.36,0),'#59626c'],
      [bx(1.5,.9,1.5,0,-3.3,0),WK],[bx(1.62,.12,1.62,0,-2.84,0),WD],[bx(1.56,.1,1.56,0,-3.74,0),WD],...[-.5,0,.5].flatMap(o=>[[bx(.05,.86,1.53,o*1.4,-3.3,0).translate(0,0,0),WD],[bx(1.53,.86,.05,0,-3.3,o*1.4),WD]]).filter((_,i)=>i%2===0),
      [new THREE.CapsuleGeometry(.22,.38,3,8).translate(0,-2.45,.1),COAT],[bx(.5,.07,.3,0,-2.62,.12),'#4a3626'],[new THREE.CylinderGeometry(.13,.16,.14,8).translate(0,-2.05,.1),'#4a3f38'],
      [new THREE.SphereGeometry(.17,12,10).scale(1,1.1,1).translate(0,-1.84,.12),SKIN],[new THREE.SphereGeometry(.185,12,8,0,6.3,0,1.75).translate(0,-1.8,.1),CAP],[bx(.1,.16,.05,-.17,-1.9,.1),CAP],[bx(.1,.16,.05,.17,-1.9,.1),CAP],
      [new THREE.CylinderGeometry(.055,.055,.06,8).rotateX(Math.PI/2).translate(-.07,-1.8,.28),'#b08a3a'],[new THREE.CylinderGeometry(.055,.055,.06,8).rotateX(Math.PI/2).translate(.07,-1.8,.28),'#b08a3a'],[bx(.34,.04,.04,0,-1.8,.27),'#1c1c1e'],
      seg([-.2,-2.22,.1],[-.45,-2.62,.55],.07,COAT),seg([-.45,-2.62,.55],[-.5,-2.82,.78],.06,COAT),[new THREE.SphereGeometry(.07,6,5).translate(-.5,-2.84,.8),'#3a2a1c'],
      seg([.2,-2.22,.1],[.42,-2.55,.5],.07,COAT),seg([.42,-2.55,.5],[.3,-2.5,.78],.06,COAT),[new THREE.CapsuleGeometry(.12,.22,3,8).rotateX(1.57).translate(.28,-2.55,.9),'#1c1c1e'],[new THREE.ConeGeometry(.12,.18,6).rotateX(-1.57).translate(.28,-2.55,.62),'#59626c'],
      [new THREE.CapsuleGeometry(.26,.5,3,8).translate(0,-4.35,0),'#1c1c1e'],[bx(.5,.05,.5,0,-4.85,0),'#3a3f45'],[cy(.03,.03,.5,0,-3.95,0,4),'#2a1d10'],
      ...[[-.85,.45],[.85,.45],[-.85,-.45],[.85,-.45],[0,-.85]].map(([x,z])=>[new THREE.SphereGeometry(.19,8,6).scale(1,1.35,1).translate(x,-3.35,z),'#b8956a'])]})(),
  dalgic:[...figure({pants:'#16191d',shirt:'#16191d',boot:'#16191d',hips:'#16191d',belt:'#3a3f45',armsFixed:true,face:false}),
    ...[-1,1].map(sd=>[new THREE.BoxGeometry(.42,.05,1).translate(sd*.22,.04,.36),'#e8c23a',LEG([sd*.22,1.22,0],.7,sd<0?0:3.14)]),
    [cyl(.22,.22,1.05,0,2.05,-.52,12),'#c9b23a'],[cyl(.24,.24,.06,0,2.57,-.52,12),'#59626c'],[cyl(.07,.07,.4,0,2.75,-.52,6),'#59626c'],[cyl(.47,.47,.18,0,2.25,0,14),null],
    [new THREE.CapsuleGeometry(.14,.55,3,8).translate(0,-.42,0).rotateX(-1.3).rotateY(.55).translate(-.6,2.45,0),'#16191d'],[new THREE.CapsuleGeometry(.14,.55,3,8).translate(0,-.42,0).rotateX(-1.3).rotateY(-.55).translate(.6,2.45,0),'#16191d'],
    [sq(.13,-.2,2.22,.68,8,6),'#16191d'],[sq(.13,.2,2.22,.68,8,6),'#16191d'],
    [sq(.3,0,2.9,.02,16,12),'#16191d'],[new THREE.CylinderGeometry(.24,.24,.16,14).scale(1.15,1,1).rotateX(Math.PI/2).translate(0,2.95,.27),'#22272c'],[new THREE.CylinderGeometry(.21,.21,.04,14).scale(1.15,1,1).rotateX(Math.PI/2).translate(0,2.95,.35),'#8fe0ff'],[cyl(.05,.05,.8,.24,3.25,.05,6),'#e8c23a'],
    [bx(.2,.28,1.15,0,2.18,.86),'#1d2024',LEG([0,0,0],0,0,'gun')],[new THREE.CylinderGeometry(.055,.055,.75,8).rotateX(1.57).translate(0,2.23,1.8),'#0e0f11',LEG([0,0,0],0,0,'gun')],
    [bx(.12,.42,.2,0,1.88,.88),'#0e0f11',LEG([0,0,0],0,0,'gun')],[bx(.15,.24,.42,0,2.14,.14),'#3b2a1c',LEG([0,0,0],0,0,'gun')],[bx(.06,.12,.3,0,2.38,.95),'#0e0f11',LEG([0,0,0],0,0,'gun')]],
  isci:[...figure({pants:'#2d3a52',shirt:'#ee7d22',boot:BOOT,glove:'#8a5a2a',belt:LEATH}),
    [bx(.86,.95,.06,0,2.02,.42),'#3b5f86'],[bx(.1,.7,.05,-.27,2.52,.41),'#3b5f86'],[bx(.1,.7,.05,.27,2.52,.41),'#3b5f86'],[bx(.1,.7,.05,-.27,2.52,-.41),'#3b5f86'],[bx(.1,.7,.05,.27,2.52,-.41),'#3b5f86'],
    [new THREE.SphereGeometry(.24,10,6,0,6.3,1.6,1.3).scale(1.15,1,1).translate(0,2.86,.08),'#7a4a2a'],
    [new THREE.SphereGeometry(.33,16,8,0,6.3,0,1.6).translate(0,3.08,0),'#f4c430'],[cyl(.44,.44,.05,0,3.08,.04,18),'#f4c430'],
    [bx(.3,.3,.18,-.45,1.5,.36),LEATH],[bx(.22,.26,.16,.42,1.5,.38),LEATH],[cyl(.05,.05,.5,.5,1.55,.4,5),'#59626c'],
    [new THREE.CylinderGeometry(.05,.05,1.05,6).rotateX(1.57).translate(.66,1.5,.5),'#6d4b2c',LEG([.62,2.5,0],.55,0,'arm')],[bx(.24,.24,.5,.66,1.5,1.05),'#59626c',LEG([.62,2.5,0],.55,0,'arm')],
    [bx(.7,.16,.5,0,.95,-.45),'#8a6a3a'],[cy(.04,.04,1.2,0,1.6,-.62,5),'#6d4b2c']],
  denizalti:[[new THREE.CapsuleGeometry(1.5,10,6,16).rotateX(1.57).scale(1,.8,1),'#2f3a44'],[bx(1.4,1.7,3,0,1.7,.6),'#2f3a44'],[bx(1.5,.3,3.1,0,2.2,.6),null],[cy(.09,.09,1.6,.2,3,1.1,6),'#59626c'],[bx(4.2,.14,1,0,0,-5.4),'#59626c'],[bx(.14,2.8,1,0,0,-5.4),'#59626c']],
  // a destroyer: sharp raked bow, red boot-topping, a bridge with windows, raked funnel, mast, boats, rails, and two gun turrets that turn on their own
  gemi:(()=>{const G='#4a535c',Gd='#3a4249',Gl='#8e979f',W='#c9ced2',T1={p:[0,1.25,4.6],k:'tur'},T2={p:[0,1.25,-6.6],k:'tur2'};
    const tur=(z,sw,f)=>[[cy(1.05,1.15,.5,0,1.25,z,14),Gd,sw],[new THREE.CylinderGeometry(.95,1.1,.9,8,1).scale(1,1,1.25).translate(0,1.85,z+f*.15),null,sw],[bx(1.5,.25,1.4,0,2.35,z+f*.1),Gl,sw],
      ...[-.32,.32].flatMap(x=>[[new THREE.CylinderGeometry(.11,.15,3.1,8).rotateX(f*Math.PI/2).translate(x,1.85,z+f*2.6),'#262b30',sw],[new THREE.CylinderGeometry(.17,.17,.35,8).rotateX(Math.PI/2).translate(x,1.85,z+f*4.05),'#1a1d20',sw]])];
    const H=hullGeos(),rail=sd=>{const pts=[];for(let i=0;i<=26;i++){const z=-9.4+19.6*i/26;pts.push([sd*(H.W(z)-.05),H.DY(z)+.32,z])}const a=[];for(let i=0;i<26;i++){const[p,q]=[pts[i],pts[i+1]];a.push(p[0],p[1]-.04,p[2],q[0],q[1]-.04,q[2],p[0],p[1]+.04,p[2], p[0],p[1]+.04,p[2],q[0],q[1]-.04,q[2],q[0],q[1]+.04,q[2], p[0],p[1]-.04,p[2],p[0],p[1]+.04,p[2],q[0],q[1]-.04,q[2], p[0],p[1]+.04,p[2],q[0],q[1]+.04,q[2],q[0],q[1]-.04,q[2])}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();return g};
    return[
      [H.top,G],[H.boot,'#7a2a22'],[H.deck,'#646a70'],[rail(-1),Gl],[rail(1),Gl],
      [bx(3,1.9,4.6,0,1.95,-1.6),Gl],[bx(2.6,1.2,2.8,0,3.5,-.9),W],[bx(2.62,.32,2.82,0,3.55,-.9),'#1c2328'],[bx(3.1,.14,1.2,0,4.18,-.2),Gl],[bx(2.9,.12,3.1,0,4.15,-.9),Gd],
      [cy(.07,.09,5,0,6.4,-1.6,6),'#59626c'],[bx(2.4,.09,.09,0,7.6,-1.6),'#59626c'],[bx(1.1,.09,.09,0,8.4,-1.6),'#59626c'],[bx(.04,.7,1.2,0,8.6,-2.2),null],
      [new THREE.CylinderGeometry(.7,.85,2.6,12).rotateX(-.12).translate(0,3.6,-4.4),Gl],[new THREE.CylinderGeometry(.72,.72,.38,12).rotateX(-.12).translate(0,4.85,-4.55),'#16191c'],[bx(1.6,.08,.25,0,4.1,-4.3),null],
      ...[-1,1].map(sd=>[new THREE.CapsuleGeometry(.35,1.6,3,8).rotateX(Math.PI/2).translate(sd*1.85,1.55,-3.9),'#e8e4da']),
      [bx(.6,.4,.5,1.4,1.2,-8.8),Gd],[bx(.6,.4,.5,-1.4,1.2,-8.8),Gd],[cy(.05,.05,1.6,1.25,1.9,-9.1,5),'#59626c'],[bx(.04,.6,.9,1.25,2.4,-9.55),null],
      ...tur(4.6,T1,1),...tur(-6.6,T2,-1),
      ...[-1,1].flatMap(sd=>[[new THREE.BoxGeometry(.04,.36,.22).rotateY(sd*-.25).translate(sd*1.72,.5,6.3),W],[new THREE.BoxGeometry(.04,.36,.22).rotateY(sd*-.25).translate(sd*1.64,.5,6.65),W],[new THREE.BoxGeometry(.04,.36,.12).rotateY(sd*-.3).translate(sd*1.55,.5,6.95),W],[new THREE.BoxGeometry(.08,.5,.4).rotateY(sd*-.45).translate(sd*1.05,.55,9),'#1c1f22']]),      // hull number and anchors
      [bx(.3,.25,.3,-.5,1.55,8.4),'#1c1f22'],[bx(.3,.25,.3,.5,1.55,8.4),'#1c1f22'],[cy(.12,.12,.5,0,1.5,9.4,8),'#1c1f22'],      // bollards and jack staff
      ...[-1,1].map(sd=>[new THREE.BoxGeometry(.9,.75,1.7).rotateX(-.35).translate(sd*1.25,1.55,1.2),Gd]),...[-1,1].flatMap(sd=>[-.22,.22].map(o=>[bx(.24,.24,.06,sd*1.25+o,1.85,2.05),'#1c1f22'])),      // missile boxes
      [cy(.55,.6,.6,0,4.6,-.9,10),Gl],[new THREE.SphereGeometry(.55,10,6,0,6.3,0,1.6).translate(0,4.9,-.9),W],     // gun director
      [cy(.32,.36,.4,.85,4.4,-2.05),Gl],[new THREE.SphereGeometry(.32,10,8).scale(1,1.3,1).translate(.85,4.85,-2.05),W],[new THREE.CylinderGeometry(.05,.05,.6,6).rotateX(Math.PI/2).translate(.85,4.6,-1.65),'#1c1f22'],     // close-in gun on the bridge roof
      [new THREE.SphereGeometry(.5,12,8).translate(0,9.4,-1.6),W]]})(),
  ucak:[[new THREE.CapsuleGeometry(.95,8.6,6,12).rotateX(Math.PI/2),'#6f7d5c'],[new THREE.ConeGeometry(.95,1.6,12).rotateX(Math.PI/2).translate(0,0,5.9),'#5d6a4c'],[sp(.72,0,.62,3.2),'#8fd0ff'],
    [bx(16,.26,2.7,0,-.1,.6),'#6f7d5c'],[bx(1.1,.28,2.72,-7.6,-.1,.6),null],[bx(1.1,.28,2.72,7.6,-.1,.6),null],[new THREE.CylinderGeometry(1,1,.8,14).rotateX(Math.PI/2).translate(0,0,-1.6),null],
    [bx(.22,2.4,1.9,0,1.35,-4.7),'#6f7d5c'],[bx(5.8,.2,1.5,0,.35,-4.8),'#6f7d5c'],
    [new THREE.CylinderGeometry(.55,.62,2.6,12).rotateX(Math.PI/2).translate(-3.4,-.25,1.3),'#3c4238'],[new THREE.CylinderGeometry(.55,.62,2.6,12).rotateX(Math.PI/2).translate(3.4,-.25,1.3),'#3c4238'],
    [bx(3.2,.14,.28,-3.4,-.25,2.7),'#1c1c1c',{p:[-3.4,-.25,2.7],k:'prop'}],[bx(3.2,.14,.28,3.4,-.25,2.7),'#1c1c1c',{p:[3.4,-.25,2.7],k:'prop'}],
    [bx(.55,.55,1.5,-.7,-1.05,.2),'#2a2a2a'],[bx(.55,.55,1.5,.7,-1.05,.2),'#2a2a2a']],
  fuze:[[new THREE.CylinderGeometry(.5,.5,4.4,14).rotateX(1.57),'#d8dde2'],[new THREE.ConeGeometry(.5,1.5,14).rotateX(1.57).translate(0,0,2.95),null],[new THREE.CylinderGeometry(.54,.54,.5,14).rotateX(1.57).translate(0,0,1.1),null],[bx(2.2,.1,.8,0,0,-1.85),'#59626c'],[bx(.1,2.2,.8,0,0,-1.85),'#59626c'],[new THREE.ConeGeometry(.38,1.5,10).rotateX(-1.57).translate(0,0,-2.9),'#ff9a30']]
};
// faces, capes, belts and harness: small details so the figures read as people, not pegs
{const sl=(r,x,y,z)=>new THREE.SphereGeometry(r,6,4).translate(x,y,z),EYE='#1c1712',GOLDC='#d9b34a';
  const face=(y,z,sk)=>[[sl(.05,-.12,y,z),EYE],[sl(.05,.12,y,z),EYE],[bx(.07,.13,.1,0,y-.1,z+.03),sk||SKIN],[bx(.2,.035,.04,0,y-.22,z-.02),'#9a5a48']];
  PARTS.atli.push(...face(4.68,.2).map(([g,c])=>[g.translate(0,0,-.06),c]),
    [new THREE.BoxGeometry(.9,1.35,.06).rotateX(.18).translate(0,3.78,-.55),null],[bx(.16,.14,.06,0,3.36,.32),GOLDC],
    [new THREE.BoxGeometry(.14,.5,1.3).rotateX(.72).translate(0,3.35,1.85),'#241609'],[new THREE.ConeGeometry(.16,1.3,6).rotateX(-2.75).translate(0,1.95,-2.1),'#241609'],
    [new THREE.CylinderGeometry(.02,.02,1.6,3).rotateX(1.2).translate(-.3,3.45,1.5),LEATH],[new THREE.CylinderGeometry(.02,.02,1.6,3).rotateX(1.2).translate(.3,3.45,1.5),LEATH],
    [bx(1.6,.12,1.1,0,2.88,-.1),'#c9a24a'])}
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
// ---- real 3D characters (KayKit, CC0) and an animated horse (three.js, MIT): their animations are baked into frames
// offline (model/*.bin), so each frame is one instanced mesh and hundreds of soldiers still cost only a few draw calls.
// Until they load (or if they cannot) the old figures are used; far away the old light figures take over again (LOD).
const CHR={},CHR_CAP=200,CHR_FAR=175;let curId=0,chrOn=true;
const CHR_DEF={piyade:{tex:'knight'},dalgic:{tex:'rogue'},isci:{tex:'barbarian'},binici:{tex:'knight'},at:{tex:null}};
function chrMat(tex){const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.72,metalness:.05,vertexColors:!tex});
  if(tex){const t=new THREE.TextureLoader().load('model/'+tex+'_texture.png?v='+VER);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;m.map=t}
  if(tex)m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aTeam;varying float vTeam;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTeam=aTeam;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTeam;').replace('#include <color_fragment>','#if defined(USE_COLOR)\n diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vColor.rgb*1.5,vTeam);\n#endif')};     // only the cloak takes the team colour
  return m}
// one static model (KayKit nature, CC0) from the same baked format: first frame only
async function loadGeo(key){const r=await fetch('model/'+key+'.bin?v='+VER);if(!r.ok)throw new Error(key);const buf=await r.arrayBuffer(),dv=new DataView(buf),jl=dv.getUint32(0,true),pad=a=>a+((4-a%4)%4);
  const h=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,jl)));let o=4+pad(jl);const nv=h.nv;const IA=h.big?new Uint32Array(buf,o,h.ni):new Uint16Array(buf,o,h.ni);o+=pad(IA.byteLength);const UV=new Float32Array(buf,o,nv*2);o+=UV.byteLength;o+=pad(nv);if(h.hasCol)o+=pad(nv*3);
  const a=new Int16Array(buf,o,nv*3),P3=new Float32Array(nv*3);for(let i=0;i<P3.length;i++)P3[i]=a[i]*h.q;const g=new THREE.BufferGeometry();g.setIndex(new THREE.BufferAttribute(new (h.big?Uint32Array:Uint16Array)(IA),1));g.setAttribute('position',new THREE.BufferAttribute(P3,3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(UV),2));g.computeVertexNormals();g.computeBoundingSphere();return g}
// swap the hand-built trees and rocks for the modelled ones once they have loaded (the old ones stay if anything fails)
async function nicerProps(){try{const[pi,br]=await Promise.all(['t_pine','t_broad'].map(loadGeo));
  const t=new THREE.TextureLoader().load('model/hexagons_medieval.png?v='+VER);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;const M=new THREE.MeshStandardMaterial({map:t,roughness:.85});
  const set=(k,g)=>{const ms=PROPM[k];if(!ms)return;ms[ms.length-1].geometry=g;ms[ms.length-1].material=M;for(let i=0;i<ms.length-1;i++)ms[i].visible=false;if(FALLM[k])FALLM[k].forEach((f,i)=>{f.geometry=ms[i].geometry;f.material=ms[i].material;f.visible=i===ms.length-1&&f.count>0})};
  set('pine',pi);set('pine2',pi);set('broad',br)}catch(e){console.warn('props',e)}}
async function loadChr(key){try{
  const r=await fetch('model/'+key+'.bin?v='+VER);if(!r.ok)return;const buf=await r.arrayBuffer(),dv=new DataView(buf),jl=dv.getUint32(0,true),pad=a=>a+((4-a%4)%4);
  const h=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,jl)));let o=4+pad(jl);const nv=h.nv;
  const IA=h.big?new Uint32Array(buf,o,h.ni):new Uint16Array(buf,o,h.ni);o+=pad(IA.byteLength);const UV=new Float32Array(buf,o,nv*2);o+=UV.byteLength;const TM=new Uint8Array(buf,o,nv);o+=pad(nv);
  let CL=null;if(h.hasCol){CL=new Uint8Array(buf,o,nv*3);o+=pad(nv*3)}
  const iA=new THREE.BufferAttribute(new (h.big?Uint32Array:Uint16Array)(IA),1),uvA=new THREE.BufferAttribute(new Float32Array(UV),2),tA=new THREE.BufferAttribute(Float32Array.from(TM),1),cA=CL?new THREE.BufferAttribute(Float32Array.from(CL,v=>v/255),3):null;
  const mat=chrMat(CHR_DEF[key].tex),clips={};
  for(const k of h.order){const c=h.clips[k],ms=[];for(let f=0;f<c.n;f++){const a=new Int16Array(buf,o,nv*3);o+=pad(nv*6);const P3=new Float32Array(nv*3);for(let i=0;i<P3.length;i++)P3[i]=a[i]*h.q;
      const g=new THREE.BufferGeometry();g.setIndex(iA);g.setAttribute('position',new THREE.BufferAttribute(P3,3));g.setAttribute('uv',uvA);g.setAttribute('aTeam',tA);if(cA)g.setAttribute('color',cA);g.computeVertexNormals();g.computeBoundingSphere();
      const m=new THREE.InstancedMesh(g,mat,CHR_CAP);m.castShadow=true;m.receiveShadow=false;m.frustumCulled=false;m.count=0;m.visible=false;m.setColorAt(0,new THREE.Color('#fff'));m.userData.n=0;scene.add(m);ms.push(m)}
    clips[k]=ms}
  CHR[key]={clips,ok:true}}catch(e){console.warn('model',key,e)}}
function loadChars(){for(const k of Object.keys(CHR_DEF))loadChr(k)}
const HRS={s:1.5,rot:0,ry:1.85,rz:.55,rs:.8};window.HRS=HRS;
const chrReady=t=>t==='atli'?!!(CHR.at&&CHR.binici):!!CHR[t];
// put one character into the frame mesh for its pose: walking, idle or striking, each soldier a little out of step with the next
function chrPush(key,clip,ph,m4,from){const C=CHR[key];const cl=C.clips[clip]||C.clips.idle||C.clips.walk;const f=Math.min(cl.length-1,Math.floor(((ph%1)+1)%1*cl.length)),m=cl[f];const i=m.userData.n;if(i>=CHR_CAP)return;m.userData.n++;m.setMatrixAt(i,m4);m.setColorAt(i,from<0?WHITE_C:tc[from])}
const WHITE_C=new THREE.Color('#ffffff');
function chrFlush(){for(const k in CHR)for(const cl of Object.values(CHR[k].clips))for(const m of cl){const n=m.userData.n,was=m.count;m.count=n;m.visible=n>0;if(n||was){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}m.userData.n=0}}
const turnTo=(a,b,m)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+Math.max(-m,Math.min(m,d))};
let curTA=0,curTA2=0,curRoll=0;
const angLerp=(a,b,t)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t};
const mt=new THREE.Matrix4(),mr=new THREE.Matrix4(),mb=new THREE.Matrix4(),mo=new THREE.Matrix4(),qr=new THREE.Quaternion(),XA=new THREE.Vector3(1,0,0),ZA=new THREE.Vector3(0,0,1),mx=new THREE.Matrix4(),qt=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),vp=new THREE.Vector3(),vs=new THREE.Vector3(1,1,1),tc=TEAM.map(c=>new THREE.Color(c));
function drawUnits(rdt){
  const n={};for(const k of UKEYS)n[k]=0;
  const turn=(p,a)=>{mt.makeTranslation(p[0],p[1],p[2]);mr.makeRotationX(a);mb.makeTranslation(-p[0],-p[1],-p[2]);return mo.copy(mx).multiply(mt).multiply(mr).multiply(mb)};
  // atk: 0..1 through one blow. f: pulled back (-.5) to fully struck (1)
  const put=(type,x,z,from,dir,moving=true,pitchY=null,pitch=0,atk=null)=>{
    if(chrOn&&chrReady(type)&&(type==='atli'||camera.position.distanceToSquared(vp.set(x,0,z))<CHR_FAR*CHR_FAR)){     // the real model, close enough to be seen
      const T=now()/1000,sd=(curId*.6180339)%1,y=(pitchY??unitY(UNITS[type],x,z));vp.set(x,y,z);qt.setFromAxisAngle(UP,dir);if(pitch){qr.setFromAxisAngle(XA,pitch);qt.multiply(qr)}mx.compose(vp,qt,vs);
      if(type==='atli'){const H=HRS;mt.compose(vp.set(0,0,0),qr.setFromAxisAngle(UP,H.rot),vs.set(H.s,H.s,H.s));mo.copy(mx).multiply(mt);vs.set(1,1,1);chrPush('at','walk',moving?T*1.35+sd:.15,mo,-1);mt.compose(vp.set(0,H.ry,H.rz),qr.identity(),vs.set(H.rs,H.rs,H.rs));mo.copy(mx).multiply(mt);vs.set(1,1,1);chrPush('binici',atk!=null?'atk':'idle',atk!=null?atk:0,mo,from);return}
      chrPush(type,atk!=null?'atk':moving?'walk':'idle',atk!=null?atk:moving?T*(type==='dalgic'?1.6:1.05)+sd:T*.35+sd,mx,from);return}
    const i=n[type];if(i>=CAP)return;n[type]++;
    let f=0,lunge=0;
    if(atk!=null){moving=false;f=atk<.2?1-atk/.2:atk<.8?-(atk-.2)/.6*.5:lerp(-.5,1,(atk-.8)/.2);
      lunge=type==='piyade'?.38*f:type==='atli'?.7*f:type==='koc'?.12*f:0;
      if(type==='piyade')pitch=.06+.2*Math.max(f,0);else if(type==='atli')pitch=f<0?f*.55:f*.12}
    const walk=(type==='atli'?.0125:.0075)*now()+i*1.7,inW=type==='atli'&&heightAt(x,z)<.2;
    const hop=type==='balon'?Math.sin(now()/600+i)*.8:type==='koc'||type==='fuze'||type==='denizalti'||type==='gemi'||type==='ucak'?0:moving?Math.abs(Math.sin(walk))*(inW?.08:.2):0;
    vp.set(x+Math.sin(dir)*lunge,(pitchY??unitY(UNITS[type],x,z))+hop,z+Math.cos(dir)*lunge);qt.setFromAxisAngle(UP,dir);
    if(pitch){qr.setFromAxisAngle(XA,pitch);qt.multiply(qr)}
    if(curRoll){qr.setFromAxisAngle(ZA,curRoll);qt.multiply(qr);curRoll=0}
    mx.compose(vp,qt,vs);
    const arm=-1.15-.35*f;
    for(const m of IM[type]){
      const sw=m.userData.swing;
      if(sw&&(sw.k==='tur'||sw.k==='tur2')){mt.makeTranslation(sw.p[0],sw.p[1],sw.p[2]);mr.makeRotationY(sw.k==='tur2'?curTA2:curTA);mb.makeTranslation(-sw.p[0],-sw.p[1],-sw.p[2]);m.setMatrixAt(i,mo.copy(mx).multiply(mt).multiply(mr).multiply(mb))}
      else if(sw&&sw.k==='prop'){mt.makeTranslation(sw.p[0],sw.p[1],sw.p[2]);mr.makeRotationZ(now()*.045);mb.makeTranslation(-sw.p[0],-sw.p[1],-sw.p[2]);m.setMatrixAt(i,mo.copy(mx).multiply(mt).multiply(mr).multiply(mb))}
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
    if(D.yard&&local(D)&&LAUNCH[D.seat]){const L0=LAUNCH[D.seat],st=L0.st;curTA=curTA2=0;put(D.yard.type,st.x,st.z,D.seat,Math.atan2(L0.mid.x-st.x,L0.mid.z-st.z),false,D.yard.type==='gemi'?-.2:.1)}     // the new hull on the slipway while it is built
    for(const u of D.units){
      if(u.type==='fuze'){const a=u.path.pts[0],e=u.path.pts[u.path.pts.length-1];u.dir=Math.atan2(e.x-a.x,e.z-a.z);const t=u.t||0,H=fuzeH(u),y=fuzeY(u),pt=-Math.atan2(Math.cos(t*Math.PI)*H*Math.PI,Math.max(u.path.len,1));put('fuze',u.x,u.z,u.from,u.dir,false,y,pt);
        {const b=Math.sin(u.dir),c=Math.cos(u.dir),far=camera.position.distanceToSquared(vp.set(u.x,y,u.z))>400;if(far&&Math.random()<.7)puff(u.x-b*3,y,u.z-c*3,1.3,2.2,.88,.3,.25);flame(u.x-b*3.2,y,u.z-c*3.2,1.6,.12)}continue}
      // face the way they actually move, turning smoothly, so nobody runs sideways
      let want=u.dir;
      if(u.type==='ucak')want=u.hd;
      else if(u.atk&&u.face!=null&&u.type!=='gemi')want=u.face;
      else if(u.type==='gemi'&&!u.moving&&u.face!=null&&(u.atk||u.foeS)&&u.dir!=null){const a=u.face+Math.PI/2,b=u.face-Math.PI/2,da=Math.abs(angLerp(u.dir,a,1)-u.dir),dd=(x)=>{let d=x-u.dir;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d)};want=dd(a)<dd(b)?a:b}
      else if(naval(u.type)&&u.moving&&u.path&&u.s<u.end){const q=pointOn(u.path,Math.min(u.end,u.s+4));if(Math.hypot(q.x-u.x,q.z-u.z)>.5)want=Math.atan2(q.x-u.x,q.z-u.z)}     // a hull points down its course, it does not twitch with every nudge
      else if(u.px!=null){const dx=u.x-u.px,dz=u.z-u.pz;if(dx*dx+dz*dz>(naval(u.type)?4e-3:1e-4))want=Math.atan2(dx,dz)}
      else{const q=pointOn(u.path,u.s+.5);want=Math.atan2(q.x-u.x,q.z-u.z)}
      const turn0=u.dir==null?0:(()=>{let d=want-u.dir;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d})();u.px=u.x;u.pz=u.z;u.dir=u.dir==null?want:u.type==='gemi'&&!u.moving?turnTo(u.dir,want,rdt*.45):angLerp(u.dir,want,Math.min(1,rdt*(u.type==='gemi'?2:u.type==='denizalti'?2.5:u.type==='ucak'?20:10)));
      if(u.type==='ucak'){put('ucak',u.x,u.z,u.from,u.dir,true,u.fall!=null?u.y:u.alt,u.fall!=null?.5:u.ph==='roll'?0:u.ph==='land'?.07:-.06);
        if(u.hp<UNITS.ucak.hp*.4&&Math.random()<rdt*8)puff(u.x,u.alt,u.z,1.4,2,.2,.4,.2);continue}
      if(u.type==='gemi'){{const on=u.face!=null&&(u.foeS||u.atk||u.c2>0);let d=(on?u.face:u.dir)-u.dir;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;let d2=d+Math.PI;while(d2>Math.PI)d2-=2*Math.PI;const m=rdt*1.6,t1=clamp(d,-2.45,2.45),t2=on?clamp(d2,-2.44,2.44):0;u.ta=(u.ta||0)+clamp(t1-(u.ta||0),-m,m);u.ta2=(u.ta2||0)+clamp(t2-(u.ta2||0),-m,m)}      // a turret never swings round into the ship's own superstructure
        curTA=u.ta;curTA2=u.ta2;{const T=now();u.heel=lerp(u.heel||0,u.moving?clamp(-turn0*.9,-.13,.13):0,Math.min(1,rdt*2));curRoll=u.fall!=null?0:u.heel+Math.sin(T/1100+u.id*2.1)*.035}     // a ship heels into its turns and rolls and pitches on the swell
        put('gemi',u.x,u.z,u.from,u.dir,false,u.fall!=null?-.45-Math.max(0,u.fall-.6)**1.6*.9:-.45+Math.sin(now()/700+u.id)*.12,u.fall!=null?Math.min(.55,u.fall*.16):Math.sin(now()/820+u.id)*.022+(u.moving?-.018:0));
        if(u.moving&&Math.random()<rdt*3)ripple(u.x-Math.sin(u.dir)*7,u.z-Math.cos(u.dir)*7,7);continue}
      if(u.fall!=null){put('balon',u.x,u.z,u.from,u.dir||0,false,u.y,u.fall*1.1);continue}
      let hid=false;if(u.type==='denizalti'){hid=!subSeen(u.x,u.z,u.from);u.dy=lerp(u.dy==null?-.45:u.dy,u.under||hid?-2.9:u.moving!==false?-1.25:-.7,Math.min(1,rdt*1.5))}
      curId=u.id;put(u.type,u.x,u.z,u.from,u.dir||0,u.moving!==false,u.sink!=null?1.1-Math.max(0,u.sink)**1.5*2.2:u.dove!=null?-.45-u.dove*1.5:u.type==='denizalti'&&u.dy<-.5?u.dy:u.emerge>0?unitY(UNITS[u.type],u.x,u.z)-u.emerge*1.3:null,0,u.atk?clamp(1-u.cd/(u.cdM||1.2),0,1):null);
      if((u.type==='atli'||u.type==='dalgic'||u.type==='denizalti'&&!hid)&&heightAt(u.x,u.z)<.2&&Math.random()<rdt*7){ripple(u.x,u.z,4.5);if(Math.random()<.5)boom(u.x,.3-heightAt(u.x,u.z),u.z,.45,'#eaf7ff')}}
    for(const o of D.remote.values()){curTA=curTA2=0;if(o.sd==null)o.sd=Math.random()*1e3;curId=o.sd;const ox=o.x,oz=o.z;o.x=lerp(o.x,o.tx,Math.min(1,rdt*3));o.z=lerp(o.z,o.tz,Math.min(1,rdt*3));{const mv=Math.hypot(o.x-ox,o.z-oz);if(mv>(naval(o.type)?.03:.01)){const w=Math.atan2(o.x-ox,o.z-oz);o.dir=o.dir==null?w:angLerp(o.dir,w,Math.min(1,rdt*(naval(o.type)?2.5:12)))}}const of=num(o.from,D.seat),oh=o.type==='denizalti'&&!subSeen(o.x,o.z,of);if(o.fl&2){o.ft+=rdt;if(naval(o.type)){curTA=0;put(o.type,o.x,o.z,of,o.dir||0,false,-.45-Math.max(0,o.ft-.6)**1.6*.9,Math.min(.55,o.ft*.16));if(o.ft<3&&Math.random()<rdt*2)boom(o.x+(Math.random()-.5)*8,2.5,o.z+(Math.random()-.5)*8,3,'#ff7a2a')}else put(o.type,o.x,o.z,of,o.dir||0,false,Math.max(1,20-13*o.ft*o.ft),o.ft*1.1)}else put(o.type,o.x,o.z,of,o.dir||0,!(o.fl&4),o.type==='denizalti'?(oh?-2.9:-1.25):null,0,o.fl&1?(now()/1200+o.sd)%1:null);if((o.type==='atli'||o.type==='dalgic'||o.type==='denizalti'&&!oh)&&heightAt(o.x,o.z)<.2&&Math.random()<rdt*7)ripple(o.x,o.z,4.5)}
  }
  for(const k of UKEYS)for(const m of IM[k]){const was=m.count;m.count=n[k];m.visible=n[k]>0;if(n[k]||was){m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true}}
  chrFlush();
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
  if(wet){splash(x,z,big*1.6);const q=sndAt(x,z);if(q)SES.dalga(.6*q.v,q.p)}else{
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
    const k=Math.min(1,s.t/s.dur),gy=s.y1!=null?s.y1:Math.max(heightAt(s.x1,s.z1),0),x=lerp(s.x0,s.x1,k),z=lerp(s.z0,s.z1,k),y=s.kind==='bomb'?lerp(s.y0,gy,k*k):lerp(s.y0,gy,k)+s.arc*4*k*(1-k);
    const sz=s.kind==='bomb'?.8:s.kind==='frag'?.28:.62;qt.identity();vp.set(x,y,z);vs.set(sz,sz,s.kind==='bomb'?1.8:sz);mx.compose(vp,qt,vs);if(a<220)SHM.setMatrixAt(a++,mx);
    if(s.kind==='top'){if(Math.random()<dt*28)puff(x,y,z,.45,.9,.8,0,.08);if(k<.25&&Math.random()<dt*20)flame(x,y,z,.7,.06)}
    else if(s.kind==='frag'&&Math.random()<dt*10)puff(x,y,z,.4,.8,.4,0,.1)}
  vs.set(1,1,1);SHM.count=a;RKM.count=b;SHM.instanceMatrix.needsUpdate=true;RKM.instanceMatrix.needsUpdate=true;
}
function drawFx(dt){
  drawShells(dt);updateSites(dt);
  drawParts(dt);
  for(const s of SHOCK){if(s.t>=1)continue;s.t+=dt/.55;s.m.scale.setScalar(.5+s.t*s.r);s.m.material.opacity=.7*(1-s.t);if(s.t>=1)s.m.visible=false}
  for(let i=wreck.length-1;i>=0;i--){const w=wreck[i];w.t+=dt;w.g.position.y-=dt*(1+w.t*7);w.g.rotation.x+=dt*w.r;w.g.rotation.z-=dt*w.r*.6;if(w.t>1.5){scene.remove(w.g);w.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});wreck.splice(i,1)}}
  for(let i=0;i<SHOTS;i++)if(shotLife[i]>0){shotLife[i]-=dt;if(shotLife[i]<=0)shotPos.fill(0,i*6,i*6+6)}
  shotGeo.attributes.position.needsUpdate=true;
  for(const D of P)for(const t of D.towers){const h=t.mesh;if(!h)continue;if(t.shake>0){t.shake-=dt;h.shake=Math.max(t.shake,0);if(t.shake<=0)h.tpl.dirty=true}
    if(t.yaw!=null&&h.yaw!==t.yaw){h.yaw=angLerp(h.yaw,t.yaw,Math.min(1,dt*14));if(Math.abs(h.yaw-t.yaw)<.002)h.yaw=t.yaw;h.tpl.hdirty=true}
    if(t.kick>0){t.kick=Math.max(0,t.kick-dt*2.5);h.kick=t.kick;h.tpl.hdirty=true}}
  aimRemote(dt);drawSmoke(dt);drawRuin(dt);drawGates(dt);
  drawArchers(dt);
  for(let i=0;i<KARCH.length;i++){const k=KARCH[i];if(!k)continue;const D=P[i];k.m.visible=!!(D&&D.on&&!D.dead&&D.msState&&csOf(D)[8]<=.5);if(k.m.visible){const sy=D.msState===1?.15+.85*clamp(1-(local(D)?D.msT/MS_T:.5),0,1):1;if(k.m.scale.y!==sy)k.m.scale.y=sy}if(!k.m.visible)continue;if(k.yaw!==k.want){k.yaw=angLerp(k.yaw,k.want,Math.min(1,dt*9));k.m.rotation.y=k.yaw}}
  drawTowers();
  drawSprites(dt);animPlaza(dt);animProps(dt);WIND.value=now()/1000;
}
const wreck=[];
// towers of a base simulated on another screen: turn them toward the nearest attacker we can see, so they look alive too
let aimAcc=0;
function aimRemote(dt){
  aimAcc+=dt;const scan=aimAcc>.3;if(scan)aimAcc=0;
  for(const D of P){if(!D.on||D.dead||local(D))continue;
    if(scan){const home=castlePos(D.seat);let kb=null,kd=KEEP.menzil+4;
      for(const t of D.towers){if(!HEAD[t.type])continue;const r=TOWERS[t.type].menzil+(t.lvl-1)*3+4;let b=null,bd=r;
        for(const o of D.remote.values()){if(o.fl&2)continue;const of=num(o.from,D.seat);if(of===D.seat||allied(of,D.seat))continue;const d=Math.hypot(o.x-t.x,o.z-t.z);if(d<bd){bd=d;b=o}}
        t.rt=b?{x:b.x,z:b.z}:null}
      for(const o of D.remote.values()){if(o.fl&2)continue;const of=num(o.from,D.seat);if(of===D.seat||allied(of,D.seat))continue;const d=Math.hypot(o.x-home.x,o.z-home.z);if(d<kd){kd=d;kb=o}}
      if(kb&&CARCH[D.seat])for(const q of CARCH[D.seat])q.want=Math.atan2(-(kb.z-q.z),kb.x-q.x),ARCHD=true;
}
    for(const t of D.towers)if(t.rt&&HEAD[t.type])t.yaw=turnTo(t.yaw||0,Math.atan2(-(t.rt.z-t.z),t.rt.x-t.x),HEAD[t.type].rate*dt)}
}
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
  scene.remove(b.g);explode((b.a.x+b.b.x)/2,(b.a.z+b.b.z)/2,3);fxAt(ME,(b.a.x+b.b.x)/2,(b.a.z+b.b.z)/2,'bomba');tip(TL('Köprü yıkıldı!','Bridge destroyed!'));
  for(const D of P)if(local(D))for(const u of D.units){
    if(!fighter(u.type)||u.ret)continue;
    if(segD(u.x,u.z,b)<4&&UNITS[u.type].yol==='kara'){u.sink=Math.random()*-.25;continue}
    if(UNITS[u.type].yol==='kara'&&u.path.pts.some(p=>segD(p.x,p.z,b)<4||false)){const h=castlePos(D.seat),n=nav({x:u.x,z:u.z},h);if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(7+u.id%5)}}}
  if(!remote)say('kopruyik',{id:b.id});
}
const FALL=[];
function animPlaza(dt){
  for(let i=FALL.length-1;i>=0;i--){const f=FALL[i];f.t+=dt;
    if(f.kind==='lower'){const k=Math.min(1,f.t/1.5);f.o.rotation.x=-1.42*(1-k*k);     // it tips over and drops across, faster and faster, then slams down
      if(k>=1&&f.cb){FALL.splice(i,1);const g=f.o;g.updateMatrixWorld(true);const v=new THREE.Vector3(0,0,g.children.length?g.children[g.children.length-3]?.position.z||0:0);g.localToWorld(v);burst(v.x,1.4,v.z,14,['#6d4b2c','#4b3320','#a08560'],10,1.3,.35);splash(v.x,v.z,2.4);quake=Math.max(quake,.4);SES.para();f.cb();continue}
      if(k>=1){FALL.splice(i,1);const b=f.b;b.lowering=false;b.down=false;navLand=null;const o=b.o||b.b;burst(o.x,1.4,o.z,14,['#6d4b2c','#4b3320','#a08560'],10,1.3,.35);puff(o.x,1.5,o.z,3,3.4,.7,1.4,1.2);splash(o.x,o.z,2.6);ripple(o.x,o.z,6);quake=Math.max(quake,.5);fxAt(ME,o.x,o.z,'dalga');SES.para();tip(TL('Tahta köprü kuruldu, yol açık!','The timber bridge is down, the way is open!'))}continue}
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
    if(Math.hypot(u.x,u.z)<26&&(Math.hypot(u.x,u.z)<13.5||roadDist(u.x,u.z)<5)){u.sink=Math.random()*-.25;continue}
    if(!u.path.pts.some((p,i)=>u.path.c[i]>u.s&&Math.hypot(p.x,p.z)<14))continue;
    const h=castlePos(D.seat),n=seatAt(u.x,u.z)===D.seat?nav({x:u.x,z:u.z},h):null;
    if(n){u.path=polyPath(n);u.s=0;u.end=u.path.len-(7+u.id%5);u.off=false;continue}
    u.done=true;const O=P[u.from];if(O&&!O.dead){if(local(O))comeHome(O,u.type,D.seat,0,u.hp,u.x,u.z);else say('home',{to:u.from,type:u.type,from:D.seat,s:0,hp:Math.round(u.hp),x:Math.round(u.x),z:Math.round(u.z)})}}
  fxAt(ME,0,0,'bomba');tip(TL('Orta meydan çöktü! Kara askerleri köprü kurulana ya da meydan onarılana kadar geçemez.',"The central plaza collapsed! Land troops can't cross until a bridge is built or the plaza is repaired."));if(!remote)say('cesme',{});
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
let GM=null;const craterDepth=r=>1.5*Math.min(1.3,r/4),CRMAX=2.2;
function sinkGround(x,z,r){
  if(!GM)return;if(!GM.y0){const q=GM.geo.attributes.position;GM.y0=new Float32Array(q.count);for(let i=0;i<q.count;i++)GM.y0[i]=q.getY(i)}const{geo,N,W}=GM,dk=geo.attributes.aDark,p=geo.attributes.position,n=geo.attributes.normal,st=W/N,ix=Math.round((x+W/2)/st),iz=Math.round((z+W/2)/st),R=Math.ceil(r*1.3/st)+1;
  const at=(i,j)=>clamp(i,0,N)+clamp(j,0,N)*(N+1);
  for(let j=iz-R;j<=iz+R;j++)for(let i=ix-R;i<=ix+R;i++){if(i<0||j<0||i>N||j>N)continue;const k=at(i,j),d=Math.hypot(p.getX(k)-x,p.getZ(k)-z)/r;if(d>1.3)continue;
    {const y0=GM.y0[k],y=p.getY(k);p.setY(k,d<1?Math.max(y0-CRMAX,Math.min(y,y-craterDepth(r)*(1-d*d)*(1-.7*clamp((y0-y)/CRMAX,0,1)))):Math.min(Math.max(y,y0+.3),y+.28*(1.3-d)/.3))}     // holes deepen ever more slowly and stop at CRMAX; rims never pile up
    dk.setX(k,Math.max(dk.getX(k),clamp((1.25-d)/.55,0,1)*(.72+Math.random()*.28)))}
  for(let j=iz-R-1;j<=iz+R+1;j++)for(let i=ix-R-1;i<=ix+R+1;i++){if(i<1||j<1||i>=N||j>=N)continue;const k=at(i,j),dx=p.getY(at(i-1,j))-p.getY(at(i+1,j)),dz=p.getY(at(i,j-1))-p.getY(at(i,j+1)),l=Math.hypot(dx,2*st,dz);n.setXYZ(k,dx/l,2*st/l,dz/l)}
  const r0=clamp(iz-R-1,0,N),r1=clamp(iz+R+1,0,N),st0=r0*(N+1),cnt=(r1-r0+1)*(N+1);
  for(const[a,k]of[[p,3],[n,3],[dk,1]]){if(a.addUpdateRange)a.addUpdateRange(st0*k,cnt*k);a.needsUpdate=true}
}
function crater(x,z,r,remote){
  if(shoreOf(x,z)<WL-1.2||onDeck(x,z))return;
  for(let k=0;k<4;k++){const w=RWY[k],D=P[k];if(!w||!D||!D.rwState)continue;const dx=x-w.c.x,dz=z-w.c.z;if(Math.abs(dx*w.ux+dz*w.uz)<w.len/2+r&&Math.abs(-dx*w.uz+dz*w.ux)<6+r)return}     // a runway cracks (its own decals) instead of the ground under it caving in     // on a beach the hole goes below the waterline and the sea runs into it
  sinkGround(x,z,r);anyCrater=true;clearProps(x,z,r+1.6);
  const R=Math.ceil(r),cx=Math.round(x),cz=Math.round(z),D=craterDepth(r);
  for(let j=cz-R;j<=cz+R;j++)for(let i=cx-R;i<=cx+R;i++){const X=i+L,Z=j+L;if(X<0||Z<0||X>=GN||Z>=GN)continue;const d=Math.hypot(i-x,j-z)/r;if(d<1)CRD[X+Z*GN]=Math.min(CRMAX,CRD[X+Z*GN]+D*(1-d*d)*(1-.7*Math.min(1,CRD[X+Z*GN]/CRMAX)))}
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
   if(ptr.size===2){boxS=null;cmdDraft=null;runDrag=null}
   if(ptr.size===1&&laneTo!=null&&RUN){const h=RUN_L/2,dx=Math.cos(RUN.a),dz=Math.sin(RUN.a),c=scrOf(RUN.x,heightAt(RUN.x,RUN.z)+.3,RUN.z),en=scrOf(RUN.x+dx*(h+10),heightAt(RUN.x+dx*(h+10),RUN.z+dz*(h+10))+.3,RUN.z+dz*(h+10)),mx=e.clientX,my=e.clientY;
     runDrag=en&&Math.hypot(en[0]-mx,en[1]-my)<34?'rot':c&&Math.hypot(c[0]-mx,c[1]-my)<38?'move':null;if(runDrag)press=null}}
  if(ptr.size===1&&(build==='duvar'||build==='sil')){press=null;paintTo(e.clientX,e.clientY)}else if(ptr.size===1&&aim==='rota'){press=null;draft=[];drawRoute(e.clientX,e.clientY)}else if(ptr.size===2){paintAt=null;draft=null}});
cv.addEventListener('pointermove',e=>{
  const o=ptr.get(e.pointerId);
  if(!o){if(build||aim==='fuze')hover(e.clientX,e.clientY);return}
  const dx=e.clientX-o.x,dy=e.clientY-o.y;o.x=e.clientX;o.y=e.clientY;
  if(boxS&&ptr.size===1){boxS.x1=e.clientX;boxS.y1=e.clientY;return}
  if(runDrag&&ptr.size===1&&RUN){bozShow(e);const p=worldAt(e.clientX,e.clientY);if(p){if(runDrag==='move')runMove(p);else{const a=Math.atan2(p.z-RUN.z,p.x-RUN.x);if(Math.hypot(p.x-RUN.x,p.z-RUN.z)>4)RUN.a=a}}return}
  if(cmdDraft&&ptr.size===1&&press){if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;if(press.moved){bozShow(e);const p=worldAt(e.clientX,e.clientY);if(p){const q=clampV(p),l=cmdDraft[cmdDraft.length-1];if(Math.hypot(q.x-l.x,q.z-l.z)>=4)cmdDraft.push(q)}}return}
  if(draft&&ptr.size===1){bozShow(e);drawRoute(e.clientX,e.clientY);return}
  if(paintAt&&ptr.size===1){paintTo(e.clientX,e.clientY);if(build!=='sil')hover(e.clientX,e.clientY);return}
  if(ptr.size===2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)view.td=clamp(view.td*pinch/d,DMIN,DMAX);pinch=d;
    const s=view.d/innerHeight*1.3*.5;view.tx=clamp(view.tx-dx*s,-VIEW,VIEW);view.tz=clamp(view.tz-dy*s*1.25,-VIEW,VIEW);return}
  if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)press.moved=true;
  if(press&&press.moved){const s=view.d/innerHeight*1.3;view.tx=clamp(view.tx-dx*s,-VIEW,VIEW);view.tz=clamp(view.tz-dy*s*1.25,-VIEW,VIEW)}
  if(build||aim==='fuze')hover(e.clientX,e.clientY);
});
const up=e=>{ptr.delete(e.pointerId);const pr=press;press=null;paintAt=null;const rd=runDrag;runDrag=null;
  // a line dragged onto the Cancel box at the top is thrown away
  const boz=bozOn(e);bozHide();if(boz){cmdDraft=null;if(draft)endRoute(false);if(rd&&laneTo!=null)laneAsk(null);tip(TL('Çizgi bozuldu','Line cancelled'));return}
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
function eraseAt(x,z){let best=null,bd=2.6;for(const t of ME.towers){if(t.type!=='duvar')continue;const d=Math.hypot(t.x-x,t.z-z);if(d<bd){bd=d;best=t}}if(best)sellTower(best)}
function sellTower(t){const back=Math.floor(t.paid/2);ME.money+=back;floats.push({x:t.x,z:t.z,t:0,txt:'+'+back});SES.para();removeTower(ME,t)}
function hover(sx,sy){
  const p=worldAt(sx,sy);if(p&&aim==='fuze'){ring.visible=true;ring.position.set(p.x,Math.max(heightAt(p.x,p.z),0)+.4,p.z);ring.scale.setScalar(9);ring.material.color.set(fuzeTo(p)!=null?'#ff5a3a':'#888');return}
  if(p&&build==='kopru'&&DUEL){const i=duelBridgeAt(p);if(i>=0&&DBR[i].down){const b=DBR[i];ring.visible=true;ring.position.set((b.a.x+b.b.x)/2,1.2,(b.a.z+b.b.z)/2);ring.scale.setScalar(16);ring.material.color.set(ME.money>=DBR_FIX?'#8dff9a':'#ff7a6a');return}}
  if(p&&build==='kopru'){const b=bridgeSpot(p);ring.visible=true;ring.position.set(p.x,1.2,p.z);ring.scale.setScalar(6);ring.material.color.set(b&&ME.money>=BRIDGE_COST?'#8dff9a':'#ff7a6a');return}
  if(!p||!build||build==='sil')return;const x=snap(p.x),z=snap(p.z);
  ring.visible=true;ring.position.set(x,heightAt(x,z)+.4,z);ring.scale.setScalar(Math.max(2.5,TOWERS[build].menzil));ring.material.color.set(canBuild(ME,x,z,build)&&ME.money>=TOWERS[build].cost?'#8dff9a':'#ff7a6a');
}
// ---------- picking units and giving orders ----------
let SEL=[],selSeen=new Map(),cmdShow=null,infoU=null,infoT=0;
const clampV=p=>({x:Math.round(clamp(p.x,-VIEW,VIEW)),z:Math.round(clamp(p.z,-VIEW,VIEW))});
const SUB_LAND=26;
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
  if(!SEL.length)return;{const sel=myUnits().filter(c=>SEL.includes(c.id)),e=pts&&pts[pts.length-1];if(!(sel.length&&sel.every(c=>naval(c.type))&&e&&shoreOf(e.x,e.z)<-3))pts=snapTarget(pts,scr)}const want=new Set(SEL),g=new Map();     // a ship sent out to sea goes to that water, not to the castle beside it
  for(const c of myUnits())if(want.has(c.id)){if(!g.has(c.D))g.set(c.D,[]);g.get(c.D).push(c.id)}
  if(pts&&pts.length>18){const n=18,q=[];for(let i=0;i<n;i++)q.push(pts[Math.round(i*(pts.length-1)/(n-1))]);pts=q}
  for(const[D,ids]of g){if(local(D))applyCmd(D,ids,pts,ME.seat);else say('cmd',{to:D.seat,by:ME.seat,ids,p:pts?pts.map(p=>[p.x,p.z]):null})}
  if(pts){const e=pts[pts.length-1],R=P[seatAt(e.x,e.z)],subs=myUnits().filter(c=>want.has(c.id)),onlySub=subs.length&&subs.every(c=>c.type==='denizalti');let foe=R&&R.on&&!R.dead&&!allied(R.seat,ME.seat);
    const onlyShip=subs.length&&subs.every(c=>c.type==='gemi');
    if(onlySub){const cc=coastCross(ME.seat,pts);if(cc)foe=true;else if(foe){const l=shoreOf(e.x,e.z)>WL+2?e:landNear(e.x,e.z,shoreOf(e.x,e.z)>-9?46:SUB_LAND);foe=!!(l&&seatAt(l.x,l.z)===R.seat)}}
    if(onlyShip&&foe){const c=castlePos(R.seat);foe=Math.hypot(c.x-e.x,c.z-e.z)<40||(R.ysState&&Math.hypot(DOCK[R.seat].land.x-e.x,DOCK[R.seat].land.z-e.z)<30)||(local(R)?R.towers:[]).some(t=>Math.hypot(t.x-e.x,t.z-e.z)<26)||(!local(R)&&Math.hypot(c.x-e.x,c.z-e.z)<70)}
    const lu=subs.find(c=>UNITS[c.type].yol==='kara');let shown=pts;if(lu){try{const r=tidyRoute([{x:lu.x,z:lu.z},...pts.slice(1)]);if(r&&r.length>=2)shown=r}catch(e){}}     // show the way they will really walk: over the middle of the bridge
    cmdShow={pts:shown,t:3,col:foe?'#ff7a5a':'#9df0b4'};tip(onlyShip&&!foe?TL('Gemi orada bekleyecek, menziline gireni vurur','The ship will wait there and shell whatever comes in range'):onlySub?(foe?TL('Denizaltı kıyıya yanaşıp balık adamları indirecek','The submarine will close the shore and land its frogmen'):TL('Denizaltı orada bekleyecek. Balık adam indirmesi için çizgiyi düşman kıyısında bitir.','The submarine will wait there. End the line at an enemy shore to land frogmen.')):foe?TL('Saldırı emri verildi','Attack order given'):TL('Gidip orada bekleyecekler','They will go and wait there'))}
  else tip(TL('Birlikler olduğu yerde bekliyor','Units are holding position'))}
// who can go for what: soldiers fight on foot (ships only from the shore), balloons bomb anything below them, warships shell anything afloat or on a shore
const canLock=(m,c)=>!flies(UNITS[c.type])&&c.type!=='denizalti'&&(m==='balon'||m==='gemi'||fighter(m));
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
let RUN=null,runDrag=null;
function laneAsk(to){laneTo=to;$('laneBar').hidden=to==null;syncCmd();RUN=null;if(to!=null){setAim(null);setBuild(null);const r=runFor(ME.seat,to);RUN={x:r[0],z:r[1],a:r[2]};view.tx=r[0];view.tz=r[1];view.td=clamp(view.td,110,170)}}
function runMove(p){if(!RUN||!p)return;if(seatAt(p.x,p.z)!==laneTo||shoreOf(p.x,p.z)<-30){if(now()-(rwTipT||0)>1500){rwTipT=now();tip(TL('Hattı düşman üssünün üstüne koy','Put the run over the enemy base'))}return}RUN.x=p.x;RUN.z=p.z}
function runSend(){const to=laneTo;if(to==null||!RUN)return;const ln=[Math.round(RUN.x),Math.round(RUN.z),+RUN.a.toFixed(3)];laneAsk(null);if(sendUnit(ME,to,'ucak',{ln}))tip(EN?`Building a bomber: ${PLANE_T} s, then it bombs your line`:`Uçak yapılıyor: ${PLANE_T} sn, sonra çizdiğin hattı bombalar`);else tip(TL('Altının yetmiyor','Not enough gold'))}
function laneLine(to,l){const a=castlePos(ME.seat),b=castlePos(to),side=Math.sign(b.x-a.x)||-SX[to],z=laneZ(to,l);return[{x:b.x-side*75,z},{x:b.x+side*80,z}]}
const bozShow=e=>{const z=$('bozZ');if(z.hidden)z.hidden=false;z.classList.toggle('on',bozOn(e))},bozHide=()=>{const z=$('bozZ');z.hidden=true;z.classList.remove('on')},
  bozOn=e=>{const z=$('bozZ');if(z.hidden||!e||e.clientX==null)return false;const r=z.getBoundingClientRect();return e.clientX>r.left-12&&e.clientX<r.right+12&&e.clientY>r.top-12&&e.clientY<r.bottom+12};
function tap(sx,sy){
  const p=worldAt(sx,sy);if(!p||ME.dead)return;
  if(laneTo!=null){runMove(p);return}
  const wasC=castleSel;if(castleSel){castleSel=false;$('csel').hidden=true}
  if(aim==='fuze'){const c=unitAtScreen(sx,sy);fireAt(c&&!allied(c.from,ME.seat)&&c.type!=='isci'&&c.type!=='fuze'?c:p,!!c&&!allied(c.from,ME.seat)&&c.type!=='isci'&&c.type!=='fuze');return}
  if(aim==='rota')return;
  if(!build){const c=unitAtScreen(sx,sy);
    if(c&&SEL.length&&!allied(c.from,ME.seat)&&c.type!=='isci'){lockOrder(c);return}   // picked units go for the enemy tapped
    if(c&&!(SEL.length&&c.from!==ME.seat)){if(c.from===ME.seat&&CMDABLE.has(c.type)){SEL=[c.id];selSeen.clear();selSeen.set(c.id,now());syncCmd()}pick(null);unitInfo(c);return}
    if(SEL.length){clearTimeout(tapT);const q=clampV(p);tapT=setTimeout(()=>order([q],[sx,sy]),320);return}}
  for(const D of P)if(D.on&&D!==ME&&!D.dead&&!build){const c=castlePos(D.seat);if(Math.hypot(p.x-c.x,p.z-c.z)<16){setTarget(D.seat);return}}
  if(!build){const c=castlePos(ME.seat);if(Math.hypot(p.x-c.x,p.z-c.z)<CH*1.45){pick(null);castleSel=!wasC;$('csel').hidden=!castleSel;return}}
  if(build==='sil'){eraseAt(p.x,p.z);return}
  if(build==='kopru'&&fountainDown&&Math.hypot(p.x,p.z)<16){tip(TL('Yıkılan meydan bir daha yapılmaz. Suyun üstünde başka bir yere tahta köprü kur.','A fallen plaza is never rebuilt. Lay a timber bridge somewhere else over the water.'));return}
  if(build==='kopru'&&DUEL){const i=duelBridgeAt(p);if(i>=0&&DBR[i].down){if(ME.money<DBR_FIX){tip((EN?`Rebuilding costs ${DBR_FIX} gold`:`Onarmak: ${DBR_FIX} {au}`));return}if(ME.pw){tip(TL('İşçilerin zaten bir onarımda','Your workers are already on a repair job'));return}ME.money-=DBR_FIX;ME.pw={k:'br',i,t:9};hire(ME);tip(TL('İşçiler köprüyü onarmaya gidiyor','Your workers are off to rebuild the bridge'));setBuild(null);return}}
  if(build==='kopru'){const b=bridgeSpot(p);
    if(!b)tip(TL('Köprü için nehrin üstüne dokun (ortadan biraz uzakta)','Tap on the river to build a bridge (a bit away from the middle)'));
    else if(seatAt(b.a.x,b.a.z)!==ME.seat&&seatAt(b.b.x,b.b.z)!==ME.seat)tip(TL('Köprü bir ucuyla senin kıyına değmeli','One end of the bridge must touch your shore'));
    else if(ME.money<BRIDGE_COST)tip(TL('Altının yetmiyor','Not enough gold'));
    else if((DUEL?DBR.filter(o=>!o.down||o.lowering):[]).concat(bridges).some(o=>segD((b.a.x+b.b.x)/2,(b.a.z+b.b.z)/2,o)<14||segD(o.a.x,o.a.z,b)<8||segD(o.b.x,o.b.z,b)<8)||P.some(o=>o.pw&&o.pw.k==='nb'&&segD((b.a.x+b.b.x)/2,(b.a.z+b.b.z)/2,o.pw.b)<14))tip(TL('Burada zaten bir köprü var, biraz öteye kur','There is a bridge here already, build it a little further along'));     // bridges never overlap
    else if(ME.pw)tip(TL('İşçilerin zaten bir işte, bitince kurarlar','Your workers are busy, try again when they finish'));
    else{ME.money-=BRIDGE_COST;ME.pw={k:'nb',b:{a:b.a,b:b.b,id:A.seat+'k'+(uid++)},t:9};hire(ME);SES.para();setBuild(null);tip(TL('İşçiler köprüyü kurmaya gidiyor','Your workers are off to build the bridge'))}
    return}
  if(build){
    let x=snap(p.x),z=snap(p.z);
    // a finger is wider than the grid: if the exact spot is taken, use the nearest free one right next to it
    if(TOWERS[build]&&!canBuild(ME,x,z,build)){const st=build==='duvar'?WALL:1,rm=build==='duvar'?2:7;let bd=1e9;for(let dx=-rm;dx<=rm;dx++)for(let dz=-rm;dz<=rm;dz++){if(dx*dx+dz*dz>rm*rm)continue;const X=snap(p.x+dx*st),Z=snap(p.z+dz*st);if(canBuild(ME,X,Z,build)){const d=Math.hypot(X-p.x,Z-p.z);if(d<bd){bd=d;x=X;z=Z}}}}     // a finger is not a pin: the nearest free spot within a few steps
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
  return alignBridges(out);
}
// a route over a bridge runs straight down its middle, from one end to the other, instead of grazing a railing
function alignBridges(out){
  const B=[...(DUEL?DBR.filter(b=>!b.down):[]),...bridges];if(!B.length||out.length<2)return out;
  const near=(p)=>{let best=null;for(let i=0,c=0;i<out.length-1;i++){const a=out[i],b=out[i+1],l=Math.hypot(b.x-a.x,b.z-a.z)||1e-6;let t=((p.x-a.x)*(b.x-a.x)+(p.z-a.z)*(b.z-a.z))/(l*l);t=clamp(t,0,1);const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,d=Math.hypot(p.x-x,p.z-z);if(!best||d<best.d)best={d,s:c+t*l};c+=l}return best};
  for(const br of B){const mid={x:(br.a.x+br.b.x)/2,z:(br.a.z+br.b.z)/2},m=near(mid);if(!m||m.d>7)continue;
    const L0=Math.hypot(br.b.x-br.a.x,br.b.z-br.a.z)||1,ux=(br.b.x-br.a.x)/L0,uz=(br.b.z-br.a.z)/L0,A={x:br.a.x-ux*4,z:br.a.z-uz*4},Bq={x:br.b.x+ux*4,z:br.b.z+uz*4};
    const na=near(A),nb=near(Bq);if(!na||!nb||na.d>14||nb.d>14)continue;const[p1,s1,p2,s2]=na.s<nb.s?[A,na.s,Bq,nb.s]:[Bq,nb.s,A,na.s];
    const res=[];for(let i=0,c=0;i<out.length;i++){if(i>0)c+=Math.hypot(out[i].x-out[i-1].x,out[i].z-out[i-1].z);if(c<s1-.5||c>s2+.5||i===0||i===out.length-1)res.push({p:out[i],c})}
    const k=res.filter(r=>r.c<s1-.5).map(r=>r.p);k.push(p1,p2);for(const r of res)if(r.c>s2+.5)k.push(r.p);if(k[0]!==out[0])k.unshift(out[0]);if(k[k.length-1]!==out[out.length-1])k.push(out[out.length-1]);out=k}
  return out}
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
let castleSel=false,castleTip=false;
function pick(t){picked=t;if(t){castleSel=false;$('csel').hidden=true}if(!t){ring.visible=build?ring.visible:false;ring2.visible=false;infoU=null}$('sel').hidden=!t;if(t)towerInfo(t)}

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
   ['Bomber','Runway first, then Plane. Drag the bomb line anywhere over the enemy base and turn it any way; the bombs land on the red dots.']]:[
   ['Kamera','Bir parmakla kaydır, iki parmakla yakınlaştır. "Üssüm" ve "Tüm harita" görüntüyü taşır.'],
   ['Savunma','Bir kule seç, sonra kendi toprağına dokun. Kuleye dokunup yükseltebilir ya da silebilirsin.'],
   ['Ordu','Saldırı → asker eğit. Askerler kalenin önündeki bayraklı alanda bekler ve orada iyileşir.'],
   ['Gönder','Ordu → Seç ve gönder, sonra düşman kulesine ya da kalesine dokun ya da parmağınla yol çiz.'],
   ['Seçmek','Çift dokunup sürükleyerek birliklerinin etrafına kare çiz. Tek birliğe dokunursan sadece onu seçersin.'],
   ['Kilitlen','Birlik seçiliyken düşman askerine, gemisine ya da denizaltısına dokun: ona saldırırlar. "Birliğe dön" geri çekip iyileştirir.'],
   ['Füze','Füze → bir yere ya da düşman birliğine dokun; birliğe dokunursan peşinden gider.'],
   ['Gemi','Önce Tersane, sonra Gemi. Gemine dokunup yol çiz ya da bir düşmana dokunup onunla savaştır.'],
   ['Bombardıman','Önce Pist, sonra Bombardıman. Bomba hattını düşman üssünde istediğin yere sürükle, istediğin yöne çevir; bombalar kırmızı noktalara düşer.']];
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
function anyFoe(){const c=castlePos(ME.seat),f=P.filter(p=>p.on&&!p.dead&&p!==ME&&!allied(p.seat,ME.seat)).sort((a,b)=>{const A=castlePos(a.seat),B=castlePos(b.seat);return Math.hypot(A.x-c.x,A.z-c.z)-Math.hypot(B.x-c.x,B.z-c.z)});return f.length?f[0].seat:null}
function liveTarget(){if(target!=null&&!P[target].dead)return target;const f=P.find(p=>p.on&&!p.dead&&!allied(p.seat,ME.seat));setTarget(f?f.seat:null);return target}
function toggleHud(){const off=document.body.classList.toggle('nohud');$('eye').textContent=off?'🙈':'👁'}
let moneyShown=null;
// a tip may carry {au}: the gold coin
function tip(m){const el=$('tip');el.textContent='';String(m).split('{au}').forEach((t,i)=>{if(i){const c=document.createElement('i');c.className='au';el.append(c)}el.append(t)});el.hidden=false;tipT=3}
function setBuild(k){if(k&&aim)setAim(null);build=k;for(const b of $('gDef').querySelectorAll('button'))b.classList.toggle('on',b.dataset.k===k);ring.visible=false;if(k){pick(null);tip(k==='kopru'?(DUEL&&DBR.some(b=>b.down)?(EN?`Bridge: tap the river, or tap a fallen stone bridge to rebuild it (${DBR_FIX} gold)`:`Köprü: nehrin üstüne dokun ya da yıkık taş köprüye dokunup onar (${DBR_FIX} {au})`):fountainDown?(EN?`Bridge: tap the river. Tap the middle to repair the plaza (${PLAZA_COST} gold)`:`Köprü: nehrin üstüne dokun. Yıkık meydanı onarmak için ortaya dokun (${PLAZA_COST} {au})`):TL('Köprü: nehrin üstünde bir yere dokun','Bridge: tap a spot on the river')):k==='sil'?TL('Silmek için yapılara dokun veya üstünden sürükle. Altının yarısı geri gelir.','Tap or drag over buildings to remove them. You get half back.'):k==='duvar'?TL('Parmağını veya fareyi sürükleyerek sıra sıra duvar çek','Drag to lay a line of walls'):TOWERS[k].ad+TL(': yerleştirmek için kendi bölgene dokun',': tap your area to place it'))}}
function mkHud(){
  for(const k of TKEYS){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=(EN?`${TOWERS[k].kisa}<small>${TOWERS[k].cost}<i class="au"></i></small>`:`${TOWERS[k].kisa}<small>${TOWERS[k].cost}<i class="au"></i></small>`);b.title=k==='roket'?TL('Güdümlü roket atar: uçağa, balona ve füzeye kilitlenir','Fires guided rockets: locks onto planes, balloons and missiles'):k==='hava'?TL('Balon, füze ve uçakları vurur','Shoots balloons, missiles and planes'):k==='top'?TL('Yerdeki askerleri ve uzaktaki savaş gemilerini vurur','Hits ground troops and distant warships'):TL('Yerdeki ve sudaki askerleri vurur','Hits troops on land and in water');b.onclick=()=>setBuild(build===k?null:k);$('gDef').append(b)}
  {const b=document.createElement('button');b.dataset.k='sil';b.innerHTML=TL('Sil<small>yarısı geri</small>','Erase<small>half back</small>');b.onclick=()=>setBuild(build==='sil'?null:'sil');$('gDef').append(b)}
  {const b=document.createElement('button');b.dataset.k='kopru';b.title=TL('Nehrin üstüne köprü kurar. Füzeyle yıkılabilir.','Builds a bridge over the river. Missiles can destroy it.');b.innerHTML=(EN?`Bridge<small>${BRIDGE_COST}<i class="au"></i></small>`:`Köprü<small>${BRIDGE_COST}<i class="au"></i></small>`);b.onclick=()=>setBuild(build==='kopru'?null:'kopru');$('gDef').append(b)}
  {const b=document.createElement('button');b.id='bTersane';b.title=TL('Limana tersane kurar. Gemi ve denizaltı yapmak için gerekir.','Builds a shipyard at your dock. Needed for ships and submarines.');b.onclick=()=>{if(ME.ysState===2){tip(TL('Tersane hazır','Shipyard ready'));return}if(ME.ysState===1){tip(TL('Tersane yapılıyor','Shipyard under construction'));return}if(buildYard(ME)){tip((EN?`Building shipyard: ${YARD_T} s`:`Tersane yapılıyor: ${YARD_T} sn`));view.tx=DOCK[ME.seat].land.x;view.tz=DOCK[ME.seat].land.z;view.td=Math.min(view.td,110)}else tip(TL('Altının yetmiyor','Not enough gold'))};$('gDef').append(b)}
  {const b=document.createElement('button');b.id='bFuzeS';b.title=TL('Kalenin tepesine füze rampası kurar. Füze atmak için gerekir.','Puts a missile launcher on the keep roof. Needed to fire missiles.');b.onclick=()=>{if(ME.msState===2){tip(TL('Füze sistemi hazır','Missile system ready'));return}if(ME.msState===1){tip(TL('Füze sistemi kuruluyor','Missile system is being built'));return}if(buildMissileSys(ME)){tip(TL('İşçiler füze sistemini kuruyor','Workers are building the missile system'));const c=castlePos(ME.seat);view.tx=c.x;view.tz=c.z;view.td=Math.min(view.td,90)}else tip(TL('Altının yetmiyor','Not enough gold'))};$('gDef').append(b)}
  {const b=document.createElement('button');b.id='bPist';b.title=TL('Üssündeki ayrılmış alana pist yapar. Uçak göndermek için gerekir.','Builds a runway on your reserved strip. Needed to send planes.');b.onclick=()=>{if(!RWY[ME.seat]){tip(TL('Bu üste pist alanı yok','This base has no runway site'));return}if(ME.rwState===2){if(ME.rwFix){tip(TL('Pist onarılıyor','Runway is being repaired'));return}if(rwHpOf(ME)>=RW_HP){tip(TL('Pist sağlam','Runway is fine'));return}if(repairRunway(ME)){tip(TL('İşçiler pisti onarmaya gidiyor','Workers are going to repair the runway'));view.tx=RWY[ME.seat].c.x;view.tz=RWY[ME.seat].c.z}else tip(TL('Altının yetmiyor','Not enough gold'));return}if(ME.rwState===1){tip(TL('Pist yapılıyor','Runway under construction'));return}if(buildRunway(ME)){tip((EN?`Building runway: ${RUNWAY_T} s`:`Pist yapılıyor: ${RUNWAY_T} sn`));view.tx=RWY[ME.seat].c.x;view.tz=RWY[ME.seat].c.z;view.td=Math.min(view.td,120)}else tip(TL('Altının yetmiyor','Not enough gold'))};$('gDef').append(b)}
  for(const k of BUY){const b=document.createElement('button');b.dataset.k=k;b.innerHTML=(EN?`${UNITS[k].kisa||UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost}<i class="au"></i></small>`:`${UNITS[k].kisa||UNITS[k].ad.split(' ').pop()}<small>${UNITS[k].cost}<i class="au"></i></small>`);
    b.title=k==='gemi'?TL('Tersanede 20 saniyede yapılır, sonra limanda bekler. Gemiye dokunup yol çiz: düşmana dokunursan oraya menzili yetince ateş eder, boş denize dokunursan orada bekler. Düşman gemisini görünce savaşır.','Built in the shipyard in 20 s, then waits at the dock. Tap it and draw a path: tap an enemy to shell it once in range, or open sea to wait there. Fights enemy ships it meets.'):k==='ucak'?TL('Önce düşman üssünün üstündeki 1-6 hatlardan birini seç. Uçak yapılır, kendi kalkar, o hattı bombalar ve döner.','Pick one of the runs 1-6 over the enemy base. The bomber is built, takes off by itself, bombs that run and flies home.'):POP[k]?(EN?`Trained in ${TRAIN[k]} s, then waits on your muster field. Army → pick how many, then draw a path or tap a target.`:`${TRAIN[k]} saniyede eğitilir, sonra birlik alanında bekler. Birlik → kaç tane gideceğini seç, sonra yol çiz ya da hedefe dokun.`):{deniz:TL('Tersanede 16 saniyede hazırlanır. Denizden dolanır, üssün arkasından taramalı silahlı 10 balık adam çıkarır.','Ready in the shipyard in 16 s. Sails around and lands 10 armed frogmen behind the base.'),kara:TL('Yoldan gider. Rota çizersen o yoldan gider.','Follows the road, or your drawn route.'),su:TL('Sudan kestirme gider. Rota çizersen o yoldan gider.','Takes a shortcut through water, or your drawn route.'),hava:TL('Uçar, kuleleri bombalar. Düşerken düştüğü yere hasar verir.','Flies over and bombs towers. Damages where it crashes.'),fuze:TL('Haritada seçtiğin yere gider. Sadece uçaksavar düşürür. Önce Füze Sistemi kurulmalı.','Flies to the spot you pick. Only air defense can stop it.')}[UNITS[k].yol];
    b.onclick=()=>{if(k==='fuze'){if(ME.msState!==2){tip(TL('Önce Savunma → Füze Sistemi kur','First build Defense → Missile system'));return}if(ME.fcd>0){tip(EN?`Missile reloading: ${Math.ceil(ME.fcd)} s`:`Füze dolduruluyor: ${Math.ceil(ME.fcd)} sn`);return}setAim(aim==='fuze'?null:'fuze');return}
      if(POP[k]){trainBuy(k);return}
      const to=target!=null&&!P[target].dead&&!allied(ME.seat,target)?target:anyFoe();if(to==null)return;     // no chosen target needed: ships wait at the dock, the bomber asks for its run
      if(k==='denizalti'||k==='gemi'){if(ME.ysState!==2){tip(ME.ysState===1?TL('Tersane yapılıyor, biraz bekle','Shipyard is being built, wait a bit'):TL('Önce tersane yap (Savunma → Tersane)','Build a shipyard first (Defense → Shipyard)'));return}if(k==='gemi'&&fleet(ME.seat)>=MAX_SHIPS){tip(EN?`At most ${MAX_SHIPS} warships at a time`:`Sahada en fazla ${MAX_SHIPS} gemi olabilir`);return}if(ME.yard){tip(TL('Tersane meşgul','Shipyard busy'));return}if(sendUnit(ME,to,k)){tip((EN?`${UNITS[k].kisa||UNITS[k].ad} in the shipyard: ${BUILD_T[k]} s`:`${UNITS[k].kisa||UNITS[k].ad} tersanede yapılıyor: ${BUILD_T[k]} sn`));view.tx=DOCK[ME.seat].land.x;view.tz=DOCK[ME.seat].land.z;view.td=Math.min(view.td,110)}else tip(TL('Altının yetmiyor','Not enough gold'));return}
      if(k==='ucak'){if(ME.rwState!==2){tip(RWY[ME.seat]?(ME.rwState===1?TL('Pist yapılıyor, biraz bekle','Runway is being built, wait a bit'):TL('Önce pist yap (Savunma → Pist)','Build a runway first (Defense → Runway)')):TL('Bu üste pist alanı yok','This base has no runway site'));return}
        if(ME.hg){tip(TL('Uçak yapılıyor, biraz bekle','A bomber is being built, wait a bit'));return}if(ME.money<UNITS.ucak.cost){tip(TL('Altının yetmiyor','Not enough gold'));return}laneAsk(to);return}
      if(!sendUnit(ME,to,k))tip(TL('Altının yetmiyor','Not enough gold'));else tip(`${UNITS[k].ad} → ${P[to].name}`)};$('gAtk').append(b)}
  {const b=document.createElement('button');b.id='bSec';b.title=TL('Sahadaki birliklerini kareyle seç, sonra yol çizerek götür. Kısayol: haritaya çift dokunup sürükle.','Box-select your units in the field, then drag a path to lead them. Shortcut: double-tap the map and drag.');b.innerHTML=TL('Seç<small>birlik</small>','Select<small>units</small>');b.onclick=()=>setAim(aim==='sec'?null:'sec');$('gAtk').append(b)}
  {const b=document.createElement('button');b.id='bBirlik';b.title=TL('Birlik alanında bekleyen askerlerin: kaçını göndereceğini seç, sonra yol çiz ya da hedefe dokun.','Troops waiting on your muster field: pick how many to send, then draw a path or tap a target.');b.innerHTML=TL('Birlik<small>gönder</small>','Army<small>send</small>');b.onclick=()=>openRally($('rallyP').hidden);$('gAtk').append(b)}
  {const sec=(g,t)=>{const d=document.createElement('div');d.className='sec';d.textContent=t;return d},G=$('gDef'),A=$('gAtk'),q=sel=>G.querySelector(sel)||A.querySelector(sel);
    G.append(sec(G,TL('KULELER · kuleye dokun: yükselt ya da sil','TOWERS · tap one to upgrade or remove')));for(const k of TKEYS)if(k!=='duvar')G.append(q(`[data-k=${k}]`));
    G.append(sec(G,TL('YAPILAR','BUILDINGS')));for(const e of[q('[data-k=kopru]'),$('bTersane'),$('bPist'),$('bFuzeS')])if(e)G.append(e);
    G.append(sec(G,TL('DUVAR · sürükleyerek çiz, Sil ile sürükleyerek kaldır','WALLS · drag to draw, drag with Erase to remove')));for(const e of[q('[data-k=duvar]'),q('[data-k=sil]')])if(e)G.append(e);
    A.append(sec(A,TL('ASKER YETİŞTİR · birlik alanında bekler','TRAIN · they wait on your muster field')));for(const k of BUY)if(POP[k])A.append(q(`[data-k=${k}]`));
    A.append(sec(A,TL('ORDUNU GÖNDER','SEND YOUR ARMY')));for(const e of[$('bBirlik'),$('bSec')])if(e)A.append(e);
    A.append(sec(A,TL('ÖZEL SALDIRI','SPECIAL ATTACKS')));for(const k of BUY)if(!POP[k])A.append(q(`[data-k=${k}]`))}
  mkChat();mkSettings();mkRally();$('laneX').onclick=()=>laneAsk(null);$('laneRot').onclick=()=>{if(RUN)RUN.a+=Math.PI/4};$('laneGo').onclick=runSend;
  $('cmdHome').onclick=orderRally;
  for(const D of P){if(!D.on||D===ME)continue;const b=document.createElement('button');b.dataset.s=D.seat;b.textContent=D.name;b.style.borderBottom='4px solid '+TEAM[D.seat];b.onclick=()=>setTarget(D.seat);$('gTgt').append(b)}
  for(const[k,ad]of[['muzik',TL('Müzik','Music')],['okcu',TL('Ok ve silah','Arrows & guns')],['atli',TL('Atlı','Riders')],['bomba',TL('Bomba','Bombs')],['su',TL('Su','Water')]]){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='s_'+k;c.checked=SES.ayar[k];c.onchange=()=>SES.set(k,c.checked);l.append(c,' '+ad);$('sesP').append(l)}
  $('bSes').onclick=()=>{$('sesP').hidden=!$('sesP').hidden};
  const wake=()=>SES.init();addEventListener('pointerdown',wake);addEventListener('touchend',wake);addEventListener('keydown',wake);addEventListener('focus',wake);
  document.body.dataset.tab='d';$('tabD').onclick=()=>{document.body.dataset.tab='d';setAim(null)};$('tabA').onclick=()=>{document.body.dataset.tab='a';setBuild(null)};
  $('bHome').onclick=()=>{view.tx=home.x*.72;view.tz=home.z*.72;view.td=150};
  $('bAll').onclick=()=>{view.tx=0;view.tz=0;view.td=DMAX};
  $('eye').onclick=toggleHud;
  $('bUp').onclick=()=>{if(picked)upgrade(ME,picked);const t=picked;pick(t)};
  $('bSell').onclick=()=>{if(picked)sellTower(picked)};
  $('bFix').onclick=()=>{if(repairCastle(ME)){SES.para();tip(TL('İşçiler kaleyi onarıyor','Workers are repairing the castle'))}else tip(TL('Altının yetmiyor','Not enough gold'))};
  $('bArch').onclick=()=>{if(buyArcher(ME)){SES.para();tip(TL('Okçu kalenin köşe kulesine çıktı','An archer climbed onto a corner tower'))}else tip(TL('Altının yetmiyor','Not enough gold'))};
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
    b.onclick=()=>{if(D===ME){if(target!=null){setTarget(null);tip(TL('Hedef kaldırıldı','Target cleared'))}return}if(!D.dead)setTarget(target===D.seat?null:D.seat)};box.append(b)}     // tap your own name (or the target again) to clear it
  if(DUEL)liveTarget();
  if(A.duel||P.filter(D=>D.on&&D!==ME).length<2){$('gTgt').hidden=true;$('bAlly').hidden=true;$('bJoin').hidden=true}   // one rival: nothing to choose or ally with
  $('hud').hidden=false;$('eye').hidden=!!TUT;
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
  {const b=$('bFuzeS'),h=ME.msState===2?TL('Füze Sistemi<small>hazır</small>','Missile System<small>ready</small>'):ME.msState===1?(EN?`Missile System<small>${Math.ceil(ME.msT)} s</small>`:`Füze Sistemi<small>${Math.ceil(ME.msT)} sn</small>`):(EN?`Missile System<small>${MS_COST}<i class="au"></i></small>`:`Füze Sistemi<small>${MS_COST}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead||(!ME.msState&&ME.money<MS_COST)}
  {const b=$('bPist'),h=!RWY[ME.seat]?TL('Pist<small>alan yok</small>','Runway<small>no site</small>'):ME.rwState===2?(ME.rwFix?(EN?`Runway<small>repair ${Math.round(rwHpOf(ME)/RW_HP*100)}%</small>`:`Pist<small>onarım %${Math.round(rwHpOf(ME)/RW_HP*100)}</small>`):rwHpOf(ME)<RW_HP?(EN?`Repair<small>${rwBad(ME)?'broken · ':''}${rwCost(ME)}<i class="au"></i></small>`:`Pist onar<small>${rwBad(ME)?'bozuk · ':''}${rwCost(ME)}<i class="au"></i></small>`):TL('Pist<small>hazır</small>','Runway<small>ready</small>')):ME.rwState===1?(EN?`Runway<small>${Math.ceil(ME.rwT)} s</small>`:`Pist<small>${Math.ceil(ME.rwT)} sn</small>`):(EN?`Runway<small>${RUNWAY_COST}<i class="au"></i></small>`:`Pist<small>${RUNWAY_COST}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead||!RWY[ME.seat]||(!ME.rwState&&ME.money<RUNWAY_COST)}
  for(const b of $('gAtk').querySelectorAll('button'))b.disabled=ME.dead||(!!b.dataset.k&&ME.money<UNITS[b.dataset.k].cost)||((b.dataset.k==='denizalti'||b.dataset.k==='gemi')&&!!ME.yard)||(b.dataset.k==='ucak'&&!!ME.hg);
  for(const k of['denizalti','gemi','ucak']){const b=$('gAtk').querySelector(`[data-k=${k}]`);if(!b)continue;const U=UNITS[k],n=U.kisa||U.ad;
    const h=k!=='ucak'&&ME.ysState!==2?(EN?`${n}<small>shipyard first</small>`:`${n}<small>önce tersane</small>`):k==='gemi'&&!ME.yard&&fleet(ME.seat)>=MAX_SHIPS?(EN?`${n}<small>${MAX_SHIPS} at sea</small>`:`${n}<small>${MAX_SHIPS} gemi sahada</small>`):k==='ucak'?(rwBad(ME)?(EN?`${n}<small>runway broken</small>`:`${n}<small>pist bozuk</small>`):ME.rwState===2?ME.hg?(EN?`${n}<small>${Math.ceil(ME.hg.t)} s</small>`:`${n}<small>${Math.ceil(ME.hg.t)} sn</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`):(EN?`${n}<small>runway first</small>`:`${n}<small>önce pist</small>`)):ME.yard&&ME.yard.type===k?(EN?`${n}<small>${Math.ceil(ME.yard.t)} s</small>`:`${n}<small>${Math.ceil(ME.yard.t)} sn</small>`):ME.yard?(EN?`${n}<small>yard busy</small>`:`${n}<small>tersane dolu</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h}
  {const pop=popOf(ME.seat);for(const k in POP){const b=$('gAtk').querySelector(`[data-k=${k}]`);if(!b)continue;const U=UNITS[k],n=U.kisa||U.ad.split(' ').pop(),q=TQ.filter(x=>x===k).length;
     const h=q?(TQ[0]===k?(EN?`${n}<small>${q} · ${Math.ceil(tqT)} s</small>`:`${n}<small>${q} · ${Math.ceil(tqT)} sn</small>`):(EN?`${n}<small>${q} queued</small>`:`${n}<small>${q} sırada</small>`)):pop+POP[k]>POP_CAP?(EN?`${n}<small>army full</small>`:`${n}<small>ordu dolu</small>`):(EN?`${n}<small>${U.cost}<i class="au"></i></small>`:`${n}<small>${U.cost}<i class="au"></i></small>`);
     if(b.innerHTML!==h)b.innerHTML=h;if(pop+POP[k]>POP_CAP)b.disabled=true}
   {const b=$('gAtk').querySelector('[data-k=fuze]');if(b){const h=ME.msState!==2?(EN?`Missile<small>launcher first</small>`:`Füze<small>önce füze sist.</small>`):ME.fcd>0?(EN?`Missile<small>${Math.ceil(ME.fcd)} s</small>`:`Füze<small>${Math.ceil(ME.fcd)} sn</small>`):(EN?`Missile<small>${UNITS.fuze.cost}<i class="au"></i></small>`:`Füze<small>${UNITS.fuze.cost}<i class="au"></i></small>`);if(b.innerHTML!==h)b.innerHTML=h;if(ME.fcd>0)b.disabled=true}}
   {const b=$('bBirlik'),R=atRally();let n=0;for(const k in R)n+=R[k].length;const h=EN?`Army<small>${n} ready · ${pop}/${POP_CAP}</small>`:`Ordu<small>${n} hazır · ${pop}/${POP_CAP}</small>`;if(b.innerHTML!==h)b.innerHTML=h;b.disabled=ME.dead}
   drawRally();if(TUT)$('tutP').style.bottom=($('bar').offsetHeight+18)+'px'}
  {const a=$('bAlly'),al=target!=null&&allied(ME.seat,target)&&target!==ME.seat;a.innerHTML=al?TL('İttifakı boz<small>seçili</small>','Break alliance<small>selected</small>'):TL('İttifak<small>teklif et</small>','Alliance<small>offer</small>');a.disabled=ME.dead||target==null;$('bJoin').disabled=ME.dead||!ALLY[ME.seat].some(Boolean)}
  for(const D of P){if(!D.row)continue;D.row.className=(D.dead?'dead ':'')+(target===D.seat?'on':'');const tb=$('gTgt').querySelector(`[data-s="${D.seat}"]`);if(tb)tb.disabled=D.dead;D.row.firstChild.textContent=(D!==ME&&allied(D.seat,ME.seat)?'🤝 ':'')+D.name+(D===ME?TL(' (sen)',' (you)'):'');D.row.lastChild.style.width=D.hp/CASTLE_HP*100+'%'}
  if(!nArch(ME)&&!castleTip&&!TUT&&ME.t>5){castleTip=true;tip(TL('İpucu: kalene dokun, köşe kulelerine okçu koy.','Tip: tap your castle to put archers on its corner towers.'))}
  if(castleSel){const c=castlePos(ME.seat),n=nArch(ME),sp=archSpot(ME);vp.set(c.x,heightAt(c.x,c.z)+KH+4,c.z).project(camera);const e=$('csel');e.style.left=(vp.x+1)/2*innerWidth+'px';e.style.top=(1-vp.y)/2*innerHeight+'px';
    const h=n>=4?TL('Kalede 4 okçu var','4 archers on the castle'):sp<0?TL('Okçu duracak sağlam kule yok<small>önce onar</small>','No sound tower for an archer<small>repair first</small>'):(EN?`Add archer ${n}/4<small>${ARCH_COST}<i class="au"></i></small>`:`Okçu koy ${n}/4<small>${ARCH_COST}<i class="au"></i></small>`);if($('bArch').innerHTML!==h)$('bArch').innerHTML=h;$('bArch').disabled=sp<0||ME.money<ARCH_COST;
    const need=castleNeedsFix(ME),f=ME.cfix?(EN?`Repairing ${Math.round(castleState(ME)*100)}%`:`Onarılıyor %${Math.round(castleState(ME)*100)}`):need?(EN?`Repair<small>${fixCost(ME)}<i class="au"></i></small>`:`Onar<small>${fixCost(ME)}<i class="au"></i></small>`):TL('Kale sağlam','Castle is sound');if($('bFix').innerHTML!==f)$('bFix').innerHTML=f;$('bFix').disabled=ME.cfix||!need||ME.money<fixCost(ME)}
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
  if(laneTo!=null&&!P[laneTo].dead&&RUN){const ln=[RUN.x,RUN.z,RUN.a],pts=runPts(ln),dx=Math.cos(RUN.a),dz=Math.sin(RUN.a),h=RUN_L/2;
    trail([{x:RUN.x-dx*(h+40),z:RUN.z-dz*(h+40)},{x:RUN.x-dx*h,z:RUN.z-dz*h}],'rgba(255,217,138,.45)');trail([pts[0],pts[pts.length-1]],'#ffd98a');
    for(const q of pts){const s2=scr(q.x,heightAt(q.x,q.z)+.3,q.z);if(!s2)continue;oc.beginPath();oc.arc(s2[0],s2[1],4.5,0,6.3);oc.fillStyle='#ff5a3a';oc.fill();oc.lineWidth=1.5;oc.strokeStyle='#2a0f08';oc.stroke()}
    const c=scr(RUN.x,heightAt(RUN.x,RUN.z)+.3,RUN.z),e=scr(RUN.x+dx*(h+10),heightAt(RUN.x+dx*(h+10),RUN.z+dz*(h+10))+.3,RUN.z+dz*(h+10)),st=scr(RUN.x-dx*(h+40),2,RUN.z-dz*(h+40));
    oc.font=`700 ${W<620?15:17}px Georgia`;oc.textAlign='center';oc.textBaseline='middle';
    if(c){oc.beginPath();oc.arc(c[0],c[1],17,0,6.3);oc.fillStyle='rgba(20,20,20,.65)';oc.fill();oc.lineWidth=2.5;oc.strokeStyle='#ffd98a';oc.stroke();oc.fillStyle='#ffd98a';oc.fillText('✥',c[0],c[1]+1)}
    if(e){oc.beginPath();oc.arc(e[0],e[1],15,0,6.3);oc.fillStyle='rgba(20,20,20,.65)';oc.fill();oc.lineWidth=2.5;oc.strokeStyle='#ffd98a';oc.stroke();oc.fillStyle='#ffd98a';oc.fillText('↻',e[0],e[1]+1)}
    if(st){oc.fillStyle='#ffd98a';oc.lineWidth=4;oc.strokeStyle='rgba(0,0,0,.8)';oc.strokeText('✈',st[0],st[1]);oc.fillText('✈',st[0],st[1])}
    oc.textAlign='start';oc.textBaseline='alphabetic'}
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
  for(const gap of[13,9,6])for(let r=24;r<64;r+=3)for(let a=0;a<6.28;a+=.35){const an=base+(a%2?a:-a)/2,x=snap(c.x+Math.cos(an)*r),z=snap(c.z+Math.sin(an)*r);if(canBuild(ME,x,z,k)&&!ME.towers.some(t=>Math.hypot(t.x-x,t.z-z)<gap)&&Math.hypot(RALLY[0].x-x,RALLY[0].z-z)>16)return{x,z}}return null}
function tutSteps(){
  const c1=castlePos(1),home0=castlePos(0),foeHere=()=>ME.units.filter(u=>u.from===1&&!u.done&&u.hp>0&&POP[u.type]);
  const look=(x,z,d)=>{view.tx=x;view.tz=z+d*.22;view.td=d};
  const tower=(k,t,x)=>({t,x,tab:'d',go:()=>look(home0.x+25,home0.z,130),
    hint:()=>{if(build!==k)return{h:TL('Parlayan düğmeye bas.','Press the glowing button.'),g:`#gDef [data-k=${k}]`};const sp=tutFree(k);return{h:TL('Şimdi yeşil halkaya dokun.','Now tap the green ring.'),spot:sp}},
    done:()=>ME.towers.some(t=>t.type===k)});
  TS.push(
   {t:TL('Hoş geldin, komutan!','Welcome, commander!'),x:TL('Amacın: kaleni korumak ve rakibin kalesini yıkmak. Haritayı bir parmakla kaydır, iki parmakla yakınlaştır. Her adımda sadece PARLAYAN düğmeye bas ve YEŞİL halkaya dokun. Bir adım bitince İleri’ye basarsın. Bu derste her şey bedava.','Your goal: keep your castle and knock the enemy one down. Drag with one finger, pinch to zoom. In each step just press the GLOWING button and tap the GREEN ring. When a step is done, press Next. Everything is free in this lesson.'),info:true},
   tower('ok',TL('Okçu kulesi kur','Build an archer tower'),TL('Okçu kulesi yakına ok atar. Yürüyen askerleri ve balonları vurur.','An archer tower shoots arrows close by. It hits marching soldiers and balloons.')),
   tower('top',TL('Top kulesi kur','Build a cannon tower'),TL('Top kulesi daha uzağa ağır gülle atar. Yan yana duran askerleri birden yaralar, denizdeki gemileri de vurur. Uçanları vuramaz.','A cannon tower throws heavy shot further. It hurts soldiers standing together and hits ships at sea. It cannot hit fliers.')),
   tower('hava',TL('Uçaksavar kur','Build anti-air'),TL('Uçaksavar gökyüzünü korur: balonları, füzeleri ve uçakları düşürür. Roketatar ise uzağa güçlü roket atar.','Anti-air guards the sky: it brings down balloons, missiles and planes. The rocket tower fires strong rockets far away.')),
   {t:TL('Kuleyi yükselt','Upgrade a tower'),x:TL('Yükseltilen kule daha uzağa ve daha sert vurur, daha zor yıkılır.','An upgraded tower shoots further and harder and is harder to knock down.'),tab:'d',
    hint:()=>{const t=ME.towers.find(o=>o.type!=='duvar');if(!t)return{h:''};if(picked===t)return{h:TL('Kulenin üstünde çıkan Yükselt düğmesine bas.','Press the Upgrade button above the tower.'),g:'#bUp'};return{h:TL('Yeşil halkadaki kulene dokun.','Tap your tower in the green ring.'),spot:{x:t.x,z:t.z}}},
    done:()=>ME.towers.some(t=>t.lvl>=2)},
   {t:TL('Kaleye okçu koy','Put archers on the castle'),x:TL('Kalene dokununca küçük bir menü açılır: köşe kulelerine okçu koyabilirsin. Okçular yaklaşanları vurur ama yakındaki patlamalarda ölebilirler.','Tap your castle for a small menu: you can put archers on its corner towers. They shoot whoever comes close, but nearby blasts can kill them.'),tab:'d',
    go:()=>look(home0.x,home0.z,95),
    hint:()=>{if(castleSel)return{h:TL('Parlayan Okçu koy düğmesine bas.','Press the glowing Add archer button.'),g:'#bArch'};return{h:TL('Yeşil halkadaki kalene dokun.','Tap your castle in the green ring.'),spot:home0}},
    done:()=>nArch(ME)>0},
   {t:TL('Duvar ve Sil','Walls and Erase'),x:TL('Savunma bölümündeki DUVAR kısmından Duvar’a basıp parmağınla sürüklersen duvar örülür; düşman askerleri onu yıkmadan geçemez. Çok duvar koyduysan Sil’e basıp üstlerinde sürükle, hepsi kalkar.','In Defense, press Wall under WALLS and drag your finger to build a wall; enemy soldiers must break it to pass. Too many walls? Press Erase and drag over them to clear them all.'),info:true},
   {t:TL('Asker eğit','Train soldiers'),x:TL('Saldırı bölümünde asker eğitirsin. Askerler kalenin önündeki bayraklı birlik alanında toplanır ve orada iyileşir.','In the Attack section you train soldiers. They gather on the flagged muster field in front of your castle and heal there.'),tab:'a',go:()=>look(RALLY[0].x,RALLY[0].z,110),
    hint:()=>{const R=atRally();let n=0;for(const k in R)n+=R[k].length;return{h:EN?`Press the glowing Spearman button 3 times (${Math.min(n,3)}/3).`:`Parlayan Mızraklı düğmesine 3 kez bas (${Math.min(n,3)}/3).`,g:'#gAtk [data-k=piyade]',spot:RALLY[0]}},
    done:()=>{const R=atRally();let n=0;for(const k in R)n+=R[k].length;return n>=3}},
   {t:TL('Hangi asker ne işe yarar?','What is each unit for?'),x:TL('Mızraklı: ucuz ve sağlam, askerlere karşı iyi. Süvari: çok hızlı, kıyıdan biraz denize açılabilir. Koçbaşı: kuleleri çabucak yıkar ama askerlere karşı zayıf. Balon: uçar, üstten bomba bırakır. Denizaltı: arkadan 10 balık adam çıkarır, onlar sis atıp sisin içinde saklanır. Savaş Gemisi denizden döver, Bombardıman uçağı havadan bombalar.','Infantry: cheap and sturdy, good against soldiers. Riders: very fast, can swim a little way out to sea. Rams: knock towers down fast but are weak against soldiers. Balloons fly and drop bombs from above. Submarine: lands 10 frogmen behind the base, who throw smoke and hide in it. The warship shells from the sea, the bomber from the air.'),info:true},
   {t:TL('Kaleni savun','Defend your castle'),x:TL('Düşman askerleri kalene yaklaşıyor! Eğittiğin askerleri senin için seçtik (yeşil çerçeveli). Kırmızı bir düşmana dokun: hepsi ona saldırır.','Enemy soldiers are closing on your castle! We picked the soldiers you trained (green frames). Tap a red enemy: they all go for it.'),tab:'a',
    go:()=>{const mine=()=>ME.units.filter(u=>u.from===0&&POP[u.type]&&!u.done&&u.hp>0);for(let i=mine().length;i<4;i++)muster(ME,'piyade');
      for(let i=0;i<3;i++)spawn(ME,'piyade',1);for(const u of ME.units)if(u.from===1&&!u.done){u.hp=45;u.s=Math.max(0,u.end-34-(u.id%3)*3);const q=pointOn(u.path,u.s);u.x=q.x;u.z=q.z}     // they turn up on your own ground, not on the bridge
      tutFlags.lockSel=()=>{SEL=mine().map(u=>u.id);syncCmd()};tutFlags.lockSel();const f=foeHere()[0]||RALLY[0];look((f.x+RALLY[0].x)/2,(f.z+RALLY[0].z)/2,105)},
    hint:()=>{const f=foeHere();if(f.length&&!ME.units.some(u=>u.from===0&&POP[u.type]&&!u.done&&u.hp>0)){for(let i=0;i<4;i++)muster(ME,'piyade');tutFlags.lockSel()}if(SEL.length)return{h:TL('Şimdi kırmızı düşman askerlerinden birine dokun.','Now tap one of the red enemy soldiers.'),spot:f[0]?{x:f[0].x,z:f[0].z,red:1}:null};
      if(!f.length)return{h:TL('Düşmanlar yenildi!','The enemies are beaten!')};if(tutFlags.lockSel&&!tutFlags.reSel){tutFlags.reSel=1;tutFlags.lockSel();return{h:''}}return{h:TL('Parlayan Seç düğmesine bas, sonra parmağını sürükleyip askerlerinin etrafına kare çiz.','Press the glowing Select button, then drag a box round your soldiers.'),g:'#bSec',spot:RALLY[0]}},
    done:()=>!foeHere().length},
   {t:TL('Saldır','Attack'),x:TL('Birlik alanındaki askerlerini düşman kalesine gönder. Askerler kalenin kapılarından saldırır. Çizdiğin yolu beğenmezsen parmağını kaldırmadan ekranın üstünde çıkan kırmızı ✕ alanına götür, çizgi bozulur.','Send the soldiers on your muster field at the enemy castle. They attack through its gates. Don’t like the line you drew? Keep your finger down and drag it to the CANCEL box at the top of the screen.'),tab:'a',
    hint:()=>{if(SEL.length)return{h:TL('Şimdi yeşil halkadaki düşman kalesine dokun.','Now tap the enemy castle in the green ring.'),spot:c1,look:[c1.x-30,c1.z,170]};
      {const R=atRally();let n=0;for(const k in R)n+=R[k].length;if(!n&&!SEL.length)return{h:TL('Birlik alanında askerin kalmadı. Parlayan Mızraklı düğmesine bas.','No soldiers left on the muster field. Press the glowing Spearman button.'),g:'#gAtk [data-k=piyade]',spot:RALLY[0]}}
      if(!$('rallyP').hidden)return{h:TL('Seç ve gönder’e bas.','Press Pick and send.'),g:'#rallyP .go'};return{h:TL('Parlayan Ordu düğmesine bas.','Press the glowing Army button.'),g:'#bBirlik'}},
    done:()=>P[1].units.some(u=>u.from===0&&POP[u.type])},
   {t:TL('Füze sistemi ve füze','Missile system and missile'),x:TL('Önce kalenin tepesine Füze Sistemi kur, sonra füze at. Füze haritanın her yerine gider; bir düşman birliğine dokunursan peşinden gider. Sadece uçaksavar düşürebilir.','First build a Missile System on your castle, then fire. A missile reaches anywhere; tap an enemy unit and it chases it. Only anti-air stops it.'),tab:'a',
    go:()=>look(c1.x-10,c1.z,140),
    hint:()=>{if(ME.msState!==2){tutTab('d');return{h:TL('Savunma bölümünde parlayan Füze Sistemi düğmesine bas.','In Defense, press the glowing Missile System button.'),g:'#bFuzeS'}}tutTab('a');
      if(tutFlags.fuze){const m=P.flatMap(D=>D.units).find(u=>u.type==='fuze'&&u.from===0&&!u.done);if(m){const y=fuzeY(m);view.tx=m.x;view.tz=m.z-y*.71+140*.1;view.td=140;     // aim the camera at the missile itself, high in the air, not at the ground under it
return{h:TL('Füze uçuyor… nereye vurduğunu izle!','The missile is flying… watch where it hits!')}}
        if(!tutFlags.fuzeEnd)tutFlags.fuzeEnd=now();return{h:TL('Bum! Füze tam hedefe indi.','Boom! Right on target.')}}
      if(aim!=='fuze')return{h:TL('Parlayan Füze düğmesine bas.','Press the glowing Missile button.'),g:'#gAtk [data-k=fuze]'};const t=P[1].towers[0];return{h:TL('Şimdi yeşil halkadaki düşman kulesine dokun.','Now tap the enemy tower in the green ring.'),spot:t?{x:t.x,z:t.z}:c1}},
    done:()=>!!tutFlags.fuzeEnd&&now()-tutFlags.fuzeEnd>1800},
   {t:TL('Tersane ve gemi','Shipyard and warship'),x:TL('Gemiler denizden saldırır: kıyıdaki kuleleri ve düşman gemilerini döver.','Ships attack from the sea: they shell coastal towers and enemy ships.'),
    go:()=>look(DOCK[0].land.x,DOCK[0].land.z,120),
    hint:()=>{if(ME.ysState!==2){tutTab('d');return{h:TL('Savunma bölümünde parlayan Tersane düğmesine bas.','In Defense, press the glowing Shipyard button.'),g:'#bTersane'}}tutTab('a');return{h:TL('Saldırı bölümünde parlayan Gemi düğmesine bas.','In Attack, press the glowing Ship button.'),g:'#gAtk [data-k=gemi]'}},
    done:()=>ME.units.some(u=>u.type==='gemi'&&u.from===0)},
   {t:TL('Düşman gemisini batır','Sink the enemy ship'),x:TL('Bir düşman gemisi geldi! Gemine dokunup seç, sonra düşman gemisine dokun: gemin ona kilitlenip ateş eder.','An enemy ship is here! Tap your ship to pick it, then tap the enemy ship: yours locks on and opens fire.'),tab:'a',
    go:()=>{const L0=LAUNCH[0].park,dk=DOCK[0],x=L0.x+Math.sin(dk.ang)*40,z=L0.z+Math.cos(dk.ang)*40,id=uid++,path=polyPath([{x:x+20,z},{x,z}]);ME.units.push({id,type:'gemi',from:1,path,s:0,hp:140,x:x+20,z,bomb:0,cd:0,end:path.len,lane:0,lx:0,lz:0,vx:0,vz:0,hold:true,cmd:true});tutFlags.foeShip=id;look(L0.x,L0.z,130)},
    hint:()=>{const mine=ME.units.find(u=>u.type==='gemi'&&u.from===0),foe=ME.units.find(u=>u.id===tutFlags.foeShip);if(!foe)return{h:''};
      if(!mine){tutTab('a');return{h:TL('Gemin yok! Parlayan Savaş Gemisi düğmesine bas.','No ship! Press the glowing Warship button.'),g:'#gAtk [data-k=gemi]'}}if(mine&&SEL.includes(mine.id))return{h:TL('Şimdi kırmızı halkadaki düşman gemisine dokun.','Now tap the enemy ship in the red ring.'),spot:{x:foe.x,z:foe.z,red:1}};return{h:TL('Önce yeşil halkadaki kendi gemine dokun.','First tap your own ship in the green ring.'),spot:mine?{x:mine.x,z:mine.z}:null}},
    done:()=>!ME.units.some(u=>u.id===tutFlags.foeShip&&!u.done&&u.hp>0)},
   {t:TL('Denizaltı ve balık adamlar','Submarine and frogmen'),x:TL('Denizaltı limanda bekler. Ona dokun, sonra düşman kalesine dokun: gizlice kıyıya yanaşır ve 10 balık adam indirir. Boş denize gönderirsen orada bekler, kimseyi indirmez.','The submarine waits at the dock. Tap it, then tap the enemy castle: it sneaks up to the shore and lands 10 frogmen. Send it to open sea and it just waits there.'),tab:'a',
    go:()=>look(DOCK[0].land.x,DOCK[0].land.z,120),
    hint:()=>{if(P[1].units.some(u=>u.type==='dalgic'&&u.from===0)){if(!tutFlags.frogT)tutFlags.frogT=now();return{h:TL('Balık adamlar karaya çıktı, sis atıp kaleye saldırıyorlar!','The frogmen are ashore, throwing smoke and storming the castle!')}}
      const sub=P.flatMap(D=>D.units).find(u=>u.type==='denizalti'&&u.from===0&&!u.done);
      if(!sub){if(ME.yard)return{h:TL('Denizaltı yapılıyor…','The submarine is being built…')};return{h:TL('Parlayan Denizaltı düğmesine bas.','Press the glowing Submarine button.'),g:'#gAtk [data-k=denizalti]'}}
      if(sub.hold&&ME.units.includes(sub)){if(SEL.includes(sub.id))return{h:TL('Şimdi kırmızı halkadaki düşman kalesine dokun.','Now tap the enemy castle in the red ring.'),spot:{x:c1.x,z:c1.z,red:1},look:[c1.x-30,c1.z,170]};return{h:TL('Yeşil halkadaki denizaltına dokun.','Tap your submarine in the green ring.'),spot:{x:sub.x,z:sub.z}}}
      view.tx=sub.x;view.tz=sub.z+120*.22;view.td=120;return{h:TL('Denizaltı kıyıya gidiyor, izle…','The submarine is heading for the shore, watch…')}},
    done:()=>!!tutFlags.frogT&&now()-tutFlags.frogT>2500},
   {t:TL('Uçakla bombala','Bomb from the air'),x:TL('Uçak düşman üssünün üstünden seçtiğin hatta geçer ve bombalar, sonra geri döner. Üssün üstünde 1’den 6’ya kadar hat vardır.','A bomber flies over the enemy base along the run you pick, bombs it and comes home. There are runs 1 to 6 across the base.'),
    go:()=>RWY[0]&&look(RWY[0].c.x,RWY[0].c.z,130),
    hint:()=>{if(ME.hg||P.some(D=>D.units.some(u=>u.type==='ucak'&&u.from===0&&u.ph!=='park')))return TS[tutI].hint2();if(ME.rwState!==2){tutTab('d');return{h:TL('Savunma bölümünde parlayan Pist düğmesine bas.','In Defense, press the glowing Runway button.'),g:'#bPist'}}tutTab('a');
      if(laneTo==null)return{h:TL('Saldırı bölümünde parlayan Bombardıman düğmesine bas.','In Attack, press the glowing Bomber button.'),g:'#gAtk [data-k=ucak]'};return{h:TL('Kırmızı noktalar bombaların düşeceği yer. İstersen sürükle ya da çevir, sonra Gönder.','The red dots are where the bombs fall. Drag or turn it if you like, then press Send.'),g:'#laneGo'}},
    hint2:()=>{const u=P.flatMap(D=>D.units).find(u=>u.type==='ucak'&&u.from===0&&!u.done&&u.ph!=='park');if(u&&u.nb>0)tutFlags.bombed=1;if(u&&u.ph!=='home'&&u.ph!=='land'&&!tutFlags.bombDone){view.tx=u.x;view.tz=u.z-(u.alt||28)*.71+130*.1;view.td=130}if(tutFlags.bombed&&(!u||u.ph==='home'||u.ph==='land')&&!tutFlags.bombDone)tutFlags.bombDone=now();
      return tutFlags.bombDone?{h:TL('Bombalar düştü! Uçak eve dönüyor.','Bombs away! The plane is heading home.')}:{h:TL('Uçak havalandı, bombalarını izle…','The plane is up, watch the bombs fall…')}},
    done:()=>!!tutFlags.bombDone&&now()-tutFlags.bombDone>1200},
   {t:TL('Kale yıkılır, onarılır','Castles crumble and get repaired'),x:TL('Kalen vurulduğu yerden yıkılır: köşe kuleleri, surlar ve ana kule ayrı ayrı çöker, üstündeki okçu düşer. Kalenin canı biterse oyun biter! Kalene dokunup Onar’a basarsan işçiler yıkılanı yeniden örer.','Your castle crumbles where it is hit: corner towers, walls and the keep fall separately, and an archer on top falls with them. If the castle runs out of health you are out! Tap it and press Repair: workers rebuild what fell.'),tab:'d',
    go:()=>{const S=SEGC[ME.seat]||[];for(const i of[0,4,1,8]){const q=S[i];if(!q)continue;castleHit(ME,i<8?q.x:null,i<8?q.z:null,SEG_HP*.85);boom(q.x,heightAt(q.x,q.z)+5,q.z,5,'#ff7a2a');burst(q.x,heightAt(q.x,q.z)+4,q.z,14,['#8a8478','#5d5850','#ff9a30'],10,1.2,.3)}csOf(ME)[8]=.55;ME.csd=true;if(ME.msState)wreckLauncher(ME);fxAt(ME,home0.x,home0.z,'yikil');look(home0.x,home0.z,95)},
    hint:()=>{if(ME.cfix)return{h:TL('İşçiler kaleni onarıyor, izle…','Workers are repairing your castle, watch…')};if(castleSel)return{h:TL('Parlayan Onar düğmesine bas.','Press the glowing Repair button.'),g:'#bFix'};return{h:TL('Yeşil halkadaki yıkık kalene dokun.','Tap your damaged castle in the green ring.'),spot:home0}},
    done:()=>!castleNeedsFix(ME)&&!ME.cfix},
   {t:TL('Köprüyü onar','Rebuild the bridge'),x:TL('Füzeler ve bombalar taş köprüleri yıkar; biri az önce yıkıldı. Köprü olmadan yürüyen askerler karşıya geçemez.','Missiles and bombs bring stone bridges down; one just fell. Without it, marching soldiers cannot cross.'),tab:'d',
    go:()=>{breakDuelBridge(0);look((DBR[0].a.x+DBR[0].b.x)/2,DBR[0].a.z,120)},
    hint:()=>{if(build!=='kopru')return{h:TL('Parlayan Köprü düğmesine bas.','Press the glowing Bridge button.'),g:'#gDef [data-k=kopru]'};return{h:TL('Şimdi yeşil halkadaki yıkık köprüye dokun.','Now tap the fallen bridge in the green ring.'),spot:{x:(DBR[0].a.x+DBR[0].b.x)/2,z:(DBR[0].a.z+DBR[0].b.z)/2}}},
    done:()=>!DBR[0].down},
   {t:TL('Hazırsın!','You are ready!'),x:TL('Sağ üstteki Ayarlar’dan yeni maç başlatabilir, Sohbet’ten arkadaşlarına yazabilirsin. Gerçek maçta altın azdır ve her şey biraz zaman alır: önce birkaç kule kur, kalene okçu koy, sonra ordunu topla. Kalen hasar alınca onarmayı unutma. Bol şans!','Use Settings at the top right for a new match and Chat to talk to your friends. In a real match gold is short and everything takes a little time: build a few towers first, put archers on your castle, then gather your army. Repair your castle when it is hit. Good luck!'),info:true,last:true});
}
function tutGlow(sel){if(TUT){const b=$('bar'),need=!!sel&&[...document.querySelectorAll(sel)].some(e=>b.contains(e));if(b.classList.contains('thide')===need)b.classList.toggle('thide',!need)}for(const e of document.querySelectorAll('.tglow'))if(!sel||!e.matches(sel))e.classList.remove('tglow');if(sel)for(const e of document.querySelectorAll(sel))e.classList.add('tglow')}
function tutShow(){const S=TS[tutI],p=$('tutP');if(!S)return;p.hidden=false;
  $('tutN').textContent=`${tutI+1} / ${TS.length}`;$('tutT').textContent=(S.ok?'✓ ':'')+S.t;$('tutX').textContent=S.x;$('tutX').hidden=tutMini&&!S.info&&!S.ok;$('tutM').textContent=tutMini?'▴':'▾';$('tutM').hidden=!!(S.info||S.ok);
  $('tutH2').textContent=S.ok?TL('Harika! Görev tamam. Hazır olunca İleri’ye bas.','Great! Job done. Press Next when you are ready.'):tutHint;$('tutH2').hidden=!S.ok&&!tutHint;
  $('tutB').disabled=tutI===0;const f=$('tutF');f.hidden=!(S.info||S.ok);f.textContent=S.last?TL('Bitir','Finish'):TL('İleri','Next');p.classList.toggle('ok',!!S.ok)}
function tutGo(i){tutI=clamp(i,0,TS.length-1);const S=TS[tutI];S.ok=false;tutMini=false;tutKey='';tutCamT=0;tutDone=0;tutHint='';setBuild(null);setAim(null);SEL=[];syncCmd();pick(null);castleSel=false;$('csel').hidden=true;if(S.tab)tutTab(S.tab);if(S.go&&!S.went){S.went=true;try{S.go()}catch(e){oops(e)}}tutShow()}
function tutTick(dt){
  ME.money=Math.max(ME.money,5000);ME.hp=CASTLE_HP;const E=P[1];E.money=0;E.hp=Math.max(E.hp,150);
  const S=TS[tutI];if(!S)return;
  if(!S.ok&&!S.info){let d=false;try{d=S.done()}catch(e){}if(d){S.ok=true;tutSpot=null;tutGlow(null);SES.para();setTimeout(()=>SES.para(),160);tutShow();return}}
  if(S.ok||S.info||!S.hint){tutSpot=null;tutGlow(S.ok||S.info?'#tutF':null);if(S.info&&tutHint!==''){tutHint='';tutShow()}return}
  let h={};try{h=S.hint()||{}}catch(e){}tutSpot=h.spot||null;
  // the spot to tap must be on screen: bring the camera to it when it is not
  if(tutSpot){const key=Math.round(tutSpot.x/25)+','+Math.round(tutSpot.z/25)+':'+tutI;if(key!==tutKey&&now()-tutCamT>2500){tutKey=key;tutCamT=now();vp.set(tutSpot.x,heightAt(tutSpot.x,tutSpot.z),tutSpot.z).project(camera);
    if(Math.abs(vp.x)>.6||vp.y>.7||vp.y<-.3||vp.z>1||view.td>170||view.td<60){const d=h.look?h.look[2]:clamp(view.td,95,130);view.tx=h.look?h.look[0]:tutSpot.x;view.tz=(h.look?h.look[1]:tutSpot.z)+d*.22;view.td=d}}}tutGlow(h.g||null);if((h.h||'')!==tutHint){tutHint=h.h||'';tutShow()}}
function mkTut(){
  tutSteps();$('tutB').onclick=()=>tutGo(tutI-1);$('tutM').onclick=()=>{tutMini=!tutMini;tutShow()};
  document.body.classList.add('tut');
  // once the player starts doing the step, fold the explanation away: only the one-line task stays at the bottom
  const fold=e=>{const t=e.target;if(tutMini||!t||(t.closest&&t.closest('#tutP')))return;const S=TS[tutI];if(!S||S.info||S.ok)return;tutMini=true;tutShow()};addEventListener('pointerdown',fold,true);
  $('tutF').onclick=()=>{const S=TS[tutI];if(!S.info&&!S.ok)return;if(S.last){try{localStorage.setItem('cephe_egitim','1')}catch(e){}bye();return}tutGo(tutI+1)};
  // the dummy enemy holds a few towers to aim at
  const c=castlePos(1);P[1].money=500;for(const t of['ok','ok','top']){let done=false;for(let r=14;r<50&&!done;r+=3)for(let a=Math.PI*.6;a<Math.PI*1.4&&!done;a+=.25){const tw=addTower(P[1],t,Math.round(c.x+Math.cos(a)*r),Math.round(c.z+Math.sin(a)*r)*(t==='top'?1:(P[1].towers.length%2?1:-1)));if(tw){tw.bt=0;tw.mesh.sy=1;tw.mesh.tpl.dirty=true;done=true}}}
  P[1].units=P[1].units.filter(u=>u.type!=='isci');setInterval(()=>{if(tutDone>0){tutDone-=.25;if(tutDone<=0&&TS[tutI]&&TS[tutI].ok&&!TS[tutI].last)tutGo(tutI+1)}},250);
  tutGo(0)}
// ---------- faults ----------
// a bug must never stop the game: the frame and the simulation carry on, and the fault is logged so it can be fixed
let repN=0,oopsT=0;
function report(kind,msg,extra){console.warn('[report]',kind,String(msg).slice(0,400));if(repN>=15||!A.sb)return;repN++;
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
// phones zoom the page on a double tap (above all on a greyed-out button) or a pinch on the panels, and never zoom back: stop that, the map has its own zoom
{let lt=0;document.addEventListener('touchend',e=>{const t=performance.now();const g=e.target;if(t-lt<350&&g&&g.tagName!=='CANVAS'&&!(g.closest&&g.closest('button:not(:disabled),input,select,a')))e.preventDefault();lt=t},{passive:false});for(const ev of['gesturestart','gesturechange','dblclick'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false})}
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
buildGround();buildOuter();buildWater();buildBridges();buildForest();buildDetail();buildUnits();loadChars();nicerProps();buildSites();P.forEach(D=>{if(D.on)buildCastle(D.seat)});if(TUT)for(const D of P)if(D!==ME)D.msState=2;
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
