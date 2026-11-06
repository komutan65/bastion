"use strict";
/* Matchmaking: open the link, press OYNA. No account needed. */
(function(){
const SB_URL='https://nddrlxchgftfkatvjars.supabase.co',SB_KEY='sb_publishable_UPrbICwh6Zm6bAGalUPPUw_oo9asXec';
const MAXP=4,FILL_MS=20000;
const $=id=>document.getElementById(id);
const sb=(window.ARENA_TEST&&window.ARENA_TEST.client)||window.supabase.createClient(SB_URL,SB_KEY,{realtime:{params:{eventsPerSecond:20}}});
const id=Math.random().toString(36).slice(2,12);
const invite=new URLSearchParams(location.search).get('oda');
let ch=null,joinedAt=0,timer=null,started=false,code=null;
try{$('lName').value=localStorage.getItem('cephe_name')||''}catch(e){}
if(!$('lName').value)$('lName').value='Oyuncu'+(100+Math.random()*900|0);
const nick=()=>($('lName').value.trim()||'Oyuncu').slice(0,12);
const err=m=>{$('lErr').textContent=m;$('lErr').hidden=!m};

function players(){
  if(!ch)return[];
  const out=[];const st=ch.presenceState();
  for(const k in st){const p=st[k][0];if(p&&typeof p.t==='number')out.push({id:k,name:String(p.name||'Oyuncu').slice(0,12),t:p.t})}
  return out.sort((a,b)=>a.t-b.t||(a.id<b.id?-1:1));
}
function draw(){
  const list=players(),box=$('lList');box.textContent='';
  for(const p of list.slice(0,MAXP)){const d=document.createElement('div');d.textContent=p.name+(p.id===id?' (sen)':'');box.append(d)}
  const n=Math.min(list.length,MAXP);
  $('lStatus').textContent=code?`Oyuncular: ${n}/${MAXP}`:`Rakip aranıyor… ${n}/${MAXP}`;
  $('lStart').hidden=!(code&&list[0]&&list[0].id===id&&list.length>=2);
}
function tryAuto(){
  if(code||started||!ch)return;
  const list=players();if(!list.length||list[0].id!==id)return;
  if(list.length>=MAXP||(list.length>=2&&Date.now()-joinedAt>=FILL_MS))go(list.slice(0,MAXP));
}
function go(list){
  const m={room:Math.random().toString(36).slice(2,12),players:list.map(p=>({id:p.id,name:p.name}))};
  ch.send({type:'broadcast',event:'go',payload:m});enter(m);
}
async function enter(m){
  if(started)return;
  const seat=Array.isArray(m.players)?m.players.findIndex(p=>p.id===id):-1;
  if(seat<0)return;
  started=true;clearInterval(timer);
  try{if(ch){await ch.untrack();sb.removeChannel(ch)}}catch(e){}
  window.ARENA={seat,id,room:String(m.room),players:m.players,sb};
  $('lStatus').textContent='Harita hazırlanıyor…';
  try{await import('./oyun.js?v=20261107b');$('lobby').hidden=true}
  catch(e){console.error(e);err('Oyun yüklenemedi. Sayfayı yenile.')}
}
function join(name){
  err('');
  try{localStorage.setItem('cephe_name',nick())}catch(e){}
  $('lHome').hidden=true;$('lQueue').hidden=false;
  joinedAt=Date.now();
  ch=sb.channel('cephe-'+name,{config:{broadcast:{self:false},presence:{key:id}}});
  ch.on('presence',{event:'sync'},draw).on('broadcast',{event:'go'},({payload})=>enter(payload||{}));
  ch.subscribe(s=>{
    if(s==='SUBSCRIBED')ch.track({name:nick(),t:joinedAt});
    else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')err('Sunucuya bağlanılamadı. İnternetini kontrol edip yeniden dene.');
  });
  timer=setInterval(()=>{draw();tryAuto()},1000);
}
function cancel(){
  clearInterval(timer);if(ch){sb.removeChannel(ch);ch=null}
  code=null;history.replaceState(null,'',location.pathname);
  $('lQueue').hidden=true;$('lHome').hidden=false;$('lShare').hidden=true;
}
function openRoom(c){
  code=c;$('lShare').hidden=false;
  $('lLink').value=location.origin+location.pathname+'?oda='+c;
  join('oda-'+c);
}
$('lPlay').onclick=()=>join('genel');
$('lBots').onclick=()=>{
  try{localStorage.setItem('cephe_name',nick())}catch(e){}
  $('lHome').hidden=true;$('lQueue').hidden=false;$('lCancel').hidden=true;
  enter({room:'bot'+Math.random().toString(36).slice(2,10),players:[{id,name:nick()},{id:'b1',name:'Yapay Zeka 1',bot:1},{id:'b2',name:'Yapay Zeka 2',bot:2},{id:'b3',name:'Yapay Zeka 3',bot:3}]});
};
$('lInvite').onclick=()=>openRoom(Math.random().toString(36).slice(2,8));
$('lCancel').onclick=cancel;
$('lStart').onclick=()=>{const l=players();if(l.length>=2)go(l.slice(0,MAXP))};
$('lCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText($('lLink').value);$('lCopy').textContent='Kopyalandı'}
  catch(e){$('lLink').select()}
};
if(invite&&/^[a-z0-9]{4,12}$/.test(invite)){
  $('lPlay').hidden=true;$('lBots').hidden=true;$('lInvite').textContent='Odaya katıl';
  $('lInvite').onclick=()=>openRoom(invite);
}
})();
