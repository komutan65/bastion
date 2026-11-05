
// =============== ARENA: four players online ===============
const SEATCOL=['#f2a33a','#5cc4e8','#e878b4','#8fd65f'];
const BTYPES=Object.keys(BT);
const rows=A.players.map((p,i)=>({seat:i,id:p.id,name:String(p.name).slice(0,12),hp:100,wave:0,dead:false,seen:performance.now(),ghosts:new Map(),dots:[],bot:p.bot||0,list:[],next:0,atk:0}));
const meRow=rows[A.seat];
const finite=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
let net=null,sentKills=0,lastB='',ended=false,dotMesh=null;
const dotM=new THREE.Matrix4();

function arenaBoot(){
  try{setLang('tr')}catch(e){}
  cam.tx=BASE.tx+2;cam.tz=BASE.ty+0.5;
  dotMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(0.42,8,6),new THREE.MeshLambertMaterial({color:'#c0392b'}),160);
  dotMesh.count=0;dotMesh.frustumCulled=false;scene.add(dotMesh);
  for(const id of['bPause','bSpeed'])if($(id))$(id).style.display='none';
  $('arenaHud').hidden=false;
  $('aeAgain').onclick=()=>location.reload();
  $('aeWatch').onclick=()=>{$('arenaEnd').hidden=true};
  net=A.sb.channel('match-'+A.room,{config:{broadcast:{self:false},presence:{key:A.id}}});
  net.on('broadcast',{event:'snap'},({payload})=>onSnap(payload))
     .on('broadcast',{event:'send'},({payload})=>onSend(payload))
     .on('broadcast',{event:'dead'},({payload})=>{const r=rows[finite(payload&&payload.s,-1)];if(r)markDead(r)})
     .subscribe(s=>{if(s==='SUBSCRIBED')net.track({seat:A.seat})});
  setInterval(arenaTick,1000);arenaHudDraw();
}
function say(event,payload){if(net)net.send({type:'broadcast',event,payload})}
function arenaTick(){
  const now=performance.now();
  if(!meRow.dead&&KEEP){
    meRow.hp=Math.max(0,Math.round(KEEP.hp/KEEP.maxhp*100));meRow.wave=wave;
    const b=buildings.map(x=>[BTYPES.indexOf(x.type),x.tx,x.ty,x.lvl]),sig=JSON.stringify(b),snap={s:A.seat,h:meRow.hp,w:wave,
      e:enemies.slice(0,40).map(e=>[Math.round(e.x/TILE*10)/10,Math.round(e.y/TILE*10)/10])};
    if(sig!==lastB||Math.floor(now/5000)%2===0){snap.b=b;lastB=sig}
    say('snap',snap);
    while(kills-sentKills>=6){sentKills+=6;attackRival()}
  }
  for(const r of rows)if(r.bot&&!r.dead&&!gameOver)botTick(r);
  for(const r of rows)if(r!==meRow&&!r.bot&&!r.dead&&now-r.seen>25000)markDead(r);
  drawDots();arenaHudDraw();checkEnd();
}
// A computer rival: a simple stand-in on its own square, not a full simulation.
function botTick(r){
  const ox=(r.seat%2)*QW,oy=(r.seat>>1)*QW,bx=44+ox,by=34+oy;
  r.wave=wave;
  if(!r.list.length){r.list=[[BTYPES.indexOf('archer'),bx-1,by-1,1],[BTYPES.indexOf('wheat'),bx+3,by-5,1]];syncGhosts(r,r.list)}
  r.next--;
  if(r.next<=0&&r.list.length<40&&wave>0){
    r.next=10+Math.random()*12|0;
    const type=['wheat','archer','sheep','archer','cannon','wall'][Math.random()*6|0],s=BT[type].size;
    for(let i=0;i<20;i++){
      const a=Math.random()*6.28,d=5+Math.random()*(6+r.list.length/2),tx=Math.round(bx+Math.cos(a)*d),ty=Math.round(by+Math.sin(a)*d);
      let ok=true;for(let y=ty;y<ty+s;y++)for(let x=tx;x<tx+s;x++)if(terrain[x+y*GW]!==0)ok=false;
      if(ok&&!r.list.some(b=>Math.abs(b[1]-tx)<4&&Math.abs(b[2]-ty)<4)){r.list.push([BTYPES.indexOf(type),tx,ty,1]);syncGhosts(r,r.list);break}
    }
  }
  const pressure=Math.max(0,wave-(3+r.bot*2));            // later bots last longer
  if(pressure>0&&Math.random()<.35)r.hp=Math.max(0,r.hp-Math.random()*pressure*.55);
  r.dots=[];const n=Math.min(14,wave*2);
  for(let i=0;i<n;i++){const k=(performance.now()/40000+i/n)%1;r.dots.push([ox+6+(38*k)+Math.sin(i)*2,oy+73-(39*k)+Math.cos(i)*2])}
  r.atk--;
  if(r.atk<=0&&wave>0&&!meRow.dead){r.atk=25+Math.random()*25|0;onSend({to:A.seat,from:r.seat,list:wave>=8?['spear','spear','shield','cav']:wave>=4?['spear','spear','spear']:['spear','spear']})}
  if(r.hp<=0)markDead(r);
}
function attackRival(){
  const live=rows.filter(r=>r!==meRow&&!r.dead);if(!live.length)return;
  const t=live[Math.random()*live.length|0],n=Math.min(6,2+Math.floor(wave/4));
  if(t.bot){t.hp=Math.max(0,t.hp-n);if(t.hp<=0)markDead(t);return}
  const list=[];for(let i=0;i<n;i++)list.push(wave>=8&&i%3===2?'cav':wave>=5&&i%3===1?'shield':'spear');
  say('send',{to:t.seat,from:A.seat,list});
}
function onSend(m){
  if(!m||m.to!==A.seat||meRow.dead||!Array.isArray(m.list))return;
  const list=m.list.filter(t=>t==='spear'||t==='cav'||t==='shield').slice(0,8);
  list.forEach((t,i)=>setTimeout(()=>{if(!gameOver)spawnEnemy(t,Math.max(1,wave),i%2)},i*400));
  const r=rows[finite(m.from,-1)];if(r)toast(`${r.name} sana ${list.length} asker gönderdi!`);
}
function onSnap(m){
  if(!m)return;const r=rows[finite(m.s,-1)];if(!r||r===meRow)return;
  r.seen=performance.now();r.hp=clamp(finite(m.h,r.hp),0,100);r.wave=finite(m.w,r.wave);
  if(Array.isArray(m.e))r.dots=m.e.slice(0,40).filter(p=>Array.isArray(p)).map(p=>[finite(p[0],0),finite(p[1],0)]);
  if(Array.isArray(m.b))syncGhosts(r,m.b);
}
function syncGhosts(r,list){
  const keep=new Set();
  for(const g of list.slice(0,400)){
    if(!Array.isArray(g))continue;
    const type=BTYPES[g[0]],tx=finite(g[1],-1),ty=finite(g[2],-1),lvl=clamp(finite(g[3],1),1,9);if(!type||tx<0||ty<0||tx>=GW||ty>=GH)continue;
    const key=type+'_'+tx+'_'+ty+'_'+lvl;keep.add(key);
    if(!r.ghosts.has(key)){
      const s=BT[type].size,m=buildModel(type,lvl,type==='wall'?{n:false,e:false,s:false,w:false}:null);
      m.group.position.set(tx+s/2,heightAt(tx+s/2,ty+s/2),ty+s/2);scene.add(m.group);r.ghosts.set(key,m.group);
    }
  }
  for(const[k,gp]of r.ghosts)if(!keep.has(k)){scene.remove(gp);r.ghosts.delete(k)}
}
function drawDots(){
  if(!dotMesh)return;let n=0;
  for(const r of rows){if(r===meRow||r.dead)continue;for(const[x,z]of r.dots){if(n>=160)break;dotM.makeTranslation(x,heightAt(x,z)+0.5,z);dotMesh.setMatrixAt(n++,dotM)}}
  dotMesh.count=n;dotMesh.instanceMatrix.needsUpdate=true;
}
function markDead(r){
  if(r.dead)return;r.dead=true;r.hp=0;r.dots=[];
  if(r!==meRow)toast(`${r.name} elendi!`);
  arenaHudDraw();checkEnd();
}
function arenaLost(){
  if(meRow.dead)return;
  const place=rows.filter(r=>!r.dead).length;
  markDead(meRow);say('dead',{s:A.seat});
  finish('Kulen yıkıldı',`${A.players.length} oyuncu arasında ${place}. oldun.`,true);
}
function checkEnd(){
  if(ended||meRow.dead||A.players.length<2)return;
  if(rows.every(r=>r===meRow||r.dead)){gameOver=true;finish('ZAFER','Son ayakta kalan kule senin.',false)}
}
function finish(title,text,canWatch){
  ended=true;$('aeTitle').textContent=title;$('aeText').textContent=text;$('aeWatch').hidden=!canWatch;$('arenaEnd').hidden=false;
}
function arenaHudDraw(){
  const box=$('arenaHud');box.textContent='';
  for(const r of rows){
    const d=document.createElement('div'),bar=document.createElement('i');
    d.className='r'+(r.dead?' dead':'');d.style.borderLeftColor=SEATCOL[r.seat];
    d.textContent=r.name+(r===meRow?' (sen)':'')+' · D'+r.wave;
    bar.style.width=r.hp+'%';d.append(bar);box.append(d);
  }
}
function drawMiniArena(){
  const s=mini.width/GW;mctx.strokeStyle='rgba(255,255,255,.55)';mctx.lineWidth=1.5;
  mctx.beginPath();mctx.moveTo(QW*s,0);mctx.lineTo(QW*s,mini.height);mctx.moveTo(0,QW*s);mctx.lineTo(mini.width,QW*s);mctx.stroke();
  for(const r of rows){const bx=(44+(r.seat%2)*QW)*s,by=(34+(r.seat>>1)*QW)*s;mctx.fillStyle=r.dead?'#555':SEATCOL[r.seat];mctx.beginPath();mctx.arc(bx,by,6,0,7);mctx.fill()}
}
window.__A={rows,get keep(){return KEEP},get wave(){return wave},arenaLost,get kills(){return kills},set kills(v){kills=v}};
