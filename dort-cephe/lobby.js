"use strict";
/* Matchmaking: open the link, press OYNA. No account needed. */
(function(){
const SB_URL='https://nddrlxchgftfkatvjars.supabase.co',SB_KEY='sb_publishable_UPrbICwh6Zm6bAGalUPPUw_oo9asXec';
const FILL_MS=20000;let MAXP=4;
const $=id=>document.getElementById(id);
const sb=(window.ARENA_TEST&&window.ARENA_TEST.client)||window.supabase.createClient(SB_URL,SB_KEY,{realtime:{params:{eventsPerSecond:20}}});
// a new match picked from the in-game settings comes back here and starts straight away, same players, same ids
let AUTO=null;try{AUTO=JSON.parse(sessionStorage.getItem('cephe_auto')||'null');sessionStorage.removeItem('cephe_auto')}catch(e){}
const id=AUTO&&typeof AUTO.id==='string'?AUTO.id:Math.random().toString(36).slice(2,12);
const Q=new URLSearchParams(location.search),invite=Q.get('oda');
let duel=Q.get('m')==='2';
let ch=null,joinedAt=0,timer=null,started=false,code=null,host=false,lookT=0;
try{$('lName').value=localStorage.getItem('cephe_name')||''}catch(e){}
if(!$('lName').value)$('lName').value='Oyuncu'+(100+Math.random()*900|0);
const nick=()=>($('lName').value.trim()||'Oyuncu').slice(0,12);
const err=m=>{$('lErr').textContent=m;$('lErr').hidden=!m};
// language: Turkish or English, remembered on this device
let LANG='tr';try{LANG=localStorage.getItem('cephe_dil')||(/^tr/i.test(navigator.language||'tr')?'tr':'en')}catch(e){}
const L=(t,e)=>LANG==='en'?e:t;
function applyLang(){
  window.LANG=LANG;document.documentElement.lang=LANG;
  for(const el of document.querySelectorAll('[data-en]')){if(el.dataset.tr==null)el.dataset.tr=el.textContent;el.textContent=LANG==='en'?el.dataset.en:el.dataset.tr}
  for(const b of document.querySelectorAll('#lLang button'))b.classList.toggle('on',b.dataset.l===LANG);
  $('eye').title=$('eye').ariaLabel=L('Ekranı gizle','Hide the HUD');
  if(typeof setMode==='function'&&$('m4'))setMode(duel);
  if(window.__onl)window.__onl();
}

// how many people have the game open right now, shown at the top of the menu
let onl=null,onlAt='lobi';
function online(){try{if(onl||!sb.channel)return;onl=sb.channel('cephe-online',{config:{presence:{key:id}}});
  const show=()=>{try{const st=onl.presenceState();let n=0,g=0;for(const k in st){n++;if(st[k].some(x=>x&&x.at==='oyun'))g++}
    const el=$('lOnline');if(!el)return;el.hidden=n<1;el.textContent=L(`● ${n} kişi çevrimiçi`+(g?` · ${g} kişi oyunda`:''),`● ${n} online`+(g?` · ${g} in a match`:''))}catch(e){}};
  onl.on('presence',{event:'sync'},show).subscribe(s=>{if(s==='SUBSCRIBED')onlineAt(onlAt)});window.__onl=show}catch(e){}}
function onlineAt(at){onlAt=at;try{const r=onl&&onl.track({at});if(r&&r.catch)r.catch(()=>{})}catch(e){}}
online();
function players(){
  if(!ch)return[];
  const out=[];const st=ch.presenceState();
  for(const k in st){const p=st[k][0];if(p&&typeof p.t==='number')out.push({id:k,name:String(p.name||'Oyuncu').slice(0,12),t:p.t,host:!!p.host,duel:!!p.duel})}
  return out.sort((a,b)=>(b.host-a.host)||a.t-b.t||(a.id<b.id?-1:1));
}
function draw(){
  const list=players(),box=$('lList');box.textContent='';
  // in a code room the host's mode rules: a friend who typed the code learns it from the host
  const h=code&&list.find(p=>p.host);if(h&&!host&&duel!==h.duel)setMode(h.duel)
  if(code&&!host&&!h&&Date.now()-lookT>8000){cancel();err(L('Bu kodla açık bir oda bulunamadı. Kodu kontrol et.','No open room with that code. Check the code.'));return}
  list.slice(0,MAXP).forEach(p=>{const d=document.createElement('div');d.textContent=p.name+(p.host?L(' (oda kurucu)',' (host)'):'')+(p.id===id?L(' (sen)',' (you)'):'');box.append(d)});
  const n=Math.min(list.length,MAXP),mine=list.findIndex(p=>p.id===id);
  $('lStatus').textContent=code?(mine>=MAXP?L('Oda dolu, kurucu başka oda açabilir.','The room is full.'):`${duel?L('1v1 odası','1v1 room'):L('4 kişilik oda','4-player room')} · ${L('Oyuncular','Players')}: ${n}/${MAXP} · ${host?L('Herkes gelince Maçı başlat’a bas.','Press Start when everyone is in.'):L('Oda kurucusunun başlatmasını bekle.','Wait for the host to start.')}`):`${L('Rakip aranıyor…','Looking for opponents…')} ${n}/${MAXP}`;
  $('lStart').hidden=!(code&&host&&list.length>=2);
}
function tryAuto(){
  if(code||started||!ch)return;
  const list=players();if(!list.length||list[0].id!==id)return;
  if(list.length>=MAXP||(list.length>=2&&Date.now()-joinedAt>=FILL_MS))go(list.slice(0,MAXP));
}
// in a duel the two players take opposite corners, so neither has a shorter road
const seats=list=>{const l=list.map(p=>({id:p.id,name:p.name,bot:p.bot}));return duel?[l[0],l[1]]:l};
function go(list){
  const m={room:Math.random().toString(36).slice(2,12),players:seats(list),duel};
  ch.send({type:'broadcast',event:'go',payload:m});enter(m);
}
async function enter(m){
  if(started)return;
  const seat=Array.isArray(m.players)?m.players.findIndex(p=>p&&p.id===id):-1;
  if(seat<0)return;
  started=true;clearInterval(timer);
  try{if(ch){await ch.untrack();sb.removeChannel(ch)}}catch(e){}
  onlineAt(m.tutorial?'egitim':'oyun');
  window.ARENA={seat,id,room:String(m.room),players:m.players,sb,duel:!!m.duel,tutorial:!!m.tutorial};
  $('lStatus').textContent=L('Harita hazırlanıyor…','Preparing the map…');
  try{await import('./oyun.js?v=20261109d');$('lobby').hidden=true}
  catch(e){console.error(e);err(L('Oyun yüklenemedi. Sayfayı yenile.','The game failed to load. Refresh the page.'))}
}
function join(name){
  err('');
  try{localStorage.setItem('cephe_name',nick())}catch(e){}
  $('lHome').hidden=true;$('lMode').hidden=true;$('lQueue').hidden=false;
  joinedAt=Date.now();
  ch=sb.channel('cephe-'+name,{config:{broadcast:{self:false},presence:{key:id}}});
  ch.on('presence',{event:'sync'},draw).on('broadcast',{event:'go'},({payload})=>enter(payload||{}));
  ch.subscribe(s=>{
    if(s==='SUBSCRIBED')ch.track({name:nick(),t:joinedAt,host,duel});
    else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')err(L('Sunucuya bağlanılamadı. İnternetini kontrol edip yeniden dene.',"Couldn't reach the server. Check your connection and try again."));
  });
  timer=setInterval(()=>{draw();tryAuto()},1000);
}
function cancel(){
  clearInterval(timer);if(ch){sb.removeChannel(ch);ch=null}
  code=null;host=false;history.replaceState(null,'',location.pathname);
  $('lQueue').hidden=true;$('lFriends').hidden=true;$('lHome').hidden=false;$('lMode').hidden=false;$('lShare').hidden=true;
}
// friends: one player opens a room and reads out its short code, the others type it in
const ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',newCode=()=>{let c='';const r=new Uint32Array(5);crypto.getRandomValues(r);for(const v of r)c+=ABC[v%ABC.length];return c};
const clean=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
function openRoom(c,asHost){
  code=clean(c);host=!!asHost;lookT=Date.now();err('');$('lFriends').hidden=true;
  $('lShare').hidden=!host;$('lCodeV').textContent=code;
  join('kod-'+code.toLowerCase());
}
$('lPlay').onclick=()=>join(duel?'teke-genel':'genel');
$('lBots').onclick=()=>{
  try{localStorage.setItem('cephe_name',nick())}catch(e){}
  $('lHome').hidden=true;$('lMode').hidden=true;$('lQueue').hidden=false;$('lCancel').hidden=true;
  enter(duel?{room:'bot'+Math.random().toString(36).slice(2,10),duel:true,players:[{id,name:nick()},{id:'b1',name:L('Yapay Zeka','Computer'),bot:1}]}
    :{room:'bot'+Math.random().toString(36).slice(2,10),players:[{id,name:nick()},{id:'b1',name:L('Yapay Zeka','Computer')+' 1',bot:1},{id:'b2',name:L('Yapay Zeka','Computer')+' 2',bot:2},{id:'b3',name:L('Yapay Zeka','Computer')+' 3',bot:3}]});
};
$('lInvite').onclick=()=>{err('');$('lHome').hidden=true;$('lMode').hidden=true;$('lFriends').hidden=false;$('lCode').value=''};
$('lCreate').onclick=()=>{try{localStorage.setItem('cephe_name',nick())}catch(e){}openRoom(newCode(),true)};
const joinCode=()=>{const c=clean($('lCode').value);if(c.length<4){err(L('Arkadaşının verdiği oda kodunu yaz','Type the room code your friend gave you'));return}try{localStorage.setItem('cephe_name',nick())}catch(e){}openRoom(c,false)};
$('lJoin').onclick=joinCode;$('lCode').addEventListener('keydown',e=>{if(e.key==='Enter')joinCode()});
$('lBack').onclick=()=>{err('');$('lFriends').hidden=true;$('lHome').hidden=false;$('lMode').hidden=false};
$('lTut').onclick=()=>{
  try{localStorage.setItem('cephe_name',nick())}catch(e){}
  $('lHome').hidden=true;$('lMode').hidden=true;$('lQueue').hidden=false;$('lCancel').hidden=true;
  enter({room:'egitim'+Math.random().toString(36).slice(2,10),duel:true,tutorial:true,players:[{id,name:nick()},{id:'b1',name:L('Eğitim rakibi','Practice rival'),bot:1}]});
};
try{if(!localStorage.getItem('cephe_egitim'))$('lTut').classList.add('go')}catch(e){}
$('lCancel').onclick=cancel;
$('lStart').onclick=()=>{const l=players();if(l.length>=2)go(l.slice(0,MAXP))};
$('lCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText(code);$('lCopy').textContent=L('Kopyalandı','Copied')}catch(e){}
};
// mode switch: four corners, or one against one
function setMode(d){
  duel=d;MAXP=d?2:4;$('m4').classList.toggle('on',!d);$('m2').classList.toggle('on',d);
  $('lBots').textContent=d?L('Yapay zekaya karşı 1v1','1v1 against the computer'):L('Yapay zekaya karşı oyna','Play against the computer');$('lInvite').textContent=d?L('Arkadaşınla 1v1','1v1 with a friend'):L('Arkadaşlarınla oyna','Play with friends');$('lPlay').textContent=d?L('1v1 OYNA','PLAY 1v1'):L('OYNA','PLAY');
}
$('m4').onclick=()=>setMode(false);$('m2').onclick=()=>setMode(true);
for(const b of document.querySelectorAll('#lLang button'))b.onclick=()=>{LANG=b.dataset.l;try{localStorage.setItem('cephe_dil',LANG)}catch(e){}applyLang()};
applyLang();
if(AUTO&&AUTO.m){$('lHome').hidden=true;$('lMode').hidden=true;$('lQueue').hidden=false;$('lCancel').hidden=true;enter(AUTO.m)}
else if(invite&&/^[a-zA-Z0-9]{4,12}$/.test(invite)){$('lHome').hidden=true;$('lMode').hidden=true;$('lFriends').hidden=false;$('lCode').value=invite.toUpperCase()}
})();
