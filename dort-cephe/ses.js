// Music is made here in code; every sound can be switched off on its own.
const CH=[[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,67]],PENT=[69,72,74,76,79,81,84];
const KEY='cephe_ses';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
export const SES={ctx:null,int:.2,last:{},ayar:{muzik:saved.muzik!==false,okcu:saved.okcu!==false,atli:saved.atli!==false,bomba:saved.bomba!==false,su:saved.su!==false},
  init(){if(this.ctx&&this.stale&&!document.hidden){this.stale=false;const o=this.ctx;clearInterval(this.iv);try{o.close()}catch(e){}this.ctx=null;this.pz=false}     // back from the background: phones often leave the old sound engine mute for good, so the first touch builds a fresh one
  if(this.ctx&&this.ctx.state==='closed')this.ctx=null;if(this.ctx){const c=this.ctx;if(document.hidden)return;if(this.pz)this.wake();else if(c.state!=='running'){const up=()=>{try{this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setTargetAtTime(.7,c.currentTime+.05,.12)}catch(e){}};c.resume().then(up,()=>{})}return}     // phones put the sound to sleep (or 'interrupted') when the game goes to the background: any touch brings it back
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let c;try{c=this.ctx=new AC()}catch(e){return}
    this.out=c.createGain();this.out.gain.value=.7;const comp=c.createDynamicsCompressor();this.out.connect(comp);comp.connect(c.destination);
    this.mus=c.createGain();this.mus.gain.value=this.ayar.muzik?.6:0;this.mus.connect(this.out);
    this.dl=c.createDelay(2);this.dl.delayTime.value=.43;const fb=c.createGain();fb.gain.value=.42;const dlf=c.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=1700;this.dl.connect(dlf);dlf.connect(fb);fb.connect(this.dl);const wet=c.createGain();wet.gain.value=.55;dlf.connect(wet);wet.connect(this.mus);
    this.padF=c.createBiquadFilter();this.padF.type='lowpass';this.padF.frequency.value=600;this.padF.Q.value=.7;this.padG=c.createGain();this.padG.gain.value=.2;this.padF.connect(this.padG);this.padG.connect(this.mus);this.padG.connect(this.dl);
    this.sfx=c.createGain();this.sfx.gain.value=.6;this.sfx.connect(this.out);
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=nb;
    const t=c.currentTime;this.tC=t+.1;this.ci=this.ci||0;this.tN=t+2.5;this.tB=t+.3;this.bi=this.bi||0;     // a rebuilt sound engine carries the music on from where it was, not from the top
    this.iv=setInterval(()=>this.sched(),60);setTimeout(()=>{try{this.bake()}catch(e){}},0)},
  // leaving the page: fade out first, then sleep, so the speaker never cracks
  pause(){const c=this.ctx;if(c&&document.hidden)this.stale=true;if(!c||this.pz)return;this.pz=true;try{this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setTargetAtTime(0,c.currentTime,.02)}catch(e){}clearTimeout(this.pzT);this.pzT=setTimeout(()=>{if(this.pz&&c.state==='running')c.suspend().catch(()=>{})},140)},
  wake(){const c=this.ctx;if(!c||!this.pz)return;this.pz=false;clearTimeout(this.pzT);const up=()=>{try{this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setValueAtTime(0,c.currentTime);this.out.gain.setTargetAtTime(.7,c.currentTime+.05,.15)}catch(e){}};if(c.state!=='running')c.resume().then(up,()=>{});else up()},
  set(k,v){this.ayar[k]=v;try{localStorage.setItem(KEY,JSON.stringify(this.ayar))}catch(e){}if(k==='muzik'&&this.mus)this.mus.gain.setTargetAtTime(v?.6:0,this.ctx.currentTime,.1)},
  mf:m=>440*Math.pow(2,(m-69)/12),
  env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)},
  sched(){const c=this.ctx;if(!c||c.state!=='running')return;const now=c.currentTime,ah=now+0.4,I=this.int;
    if(this.tC<now-.15)this.tC=Math.ceil((now-this.tC)/8)*8+this.tC;if(this.tN<now-.15)this.tN=now+.3;if(this.tB<now-.15)this.tB=now+.2;     // back from the background: never play the missed notes all at once
    this.padF.frequency.setTargetAtTime(450+I*2400,now,2.5);this.padG.gain.setTargetAtTime(0.16+I*0.12,now,3);
    while(this.tC<ah){this.chord(this.tC,CH[this.ci%4]);this.ci++;this.tC+=8}
    while(this.tN<ah){this.pluck(this.tN,I);this.tN+=I>0.55?(Math.random()<0.6?0.357:0.714):0.9+Math.random()*1.9*(1-I)}
    const step=60/84/2;while(this.tB<ah){this.drum(this.tB,this.bi,I);this.bi++;this.tB+=step}},
  chord(t,notes){const c=this.ctx;for(const m of notes){for(const[type,det]of[['sine',0],['triangle',5]]){const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=this.mf(m);o.detune.value=det;o.connect(g);g.connect(this.padF);this.env(g,t,3,0.09,5,3.5);o.start(t);o.stop(t+12)}}
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=this.mf(notes[0]-12);o.connect(g);g.connect(this.mus);this.env(g,t,1.5,0.1+this.int*0.12,6,2);o.start(t);o.stop(t+10)},
  pluck(t,I){const c=this.ctx,ch=CH[(this.ci+3)%4];const pool=PENT.concat(ch.map(m=>m+12));const m=pool[(Math.random()*pool.length)|0];
    const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=this.mf(m);o.connect(g);g.connect(this.mus);g.connect(this.dl);this.env(g,t,0.01,0.05+I*0.04,0,1.6);o.start(t);o.stop(t+1.8)},
  drum(t,i,I){const c=this.ctx,q=i%2===0;
    if(I>0.28&&q){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(46,t+0.3);o.connect(g);g.connect(this.mus);this.env(g,t,0.005,(I-0.28)*0.7*(i%8===0?1.3:1),0,0.45);o.start(t);o.stop(t+0.6)}
    if(I>0.6&&!q){const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='bandpass';f.frequency.value=1100;f.Q.value=1.5;s.connect(f);f.connect(g);g.connect(this.mus);this.env(g,t,0.003,(I-0.6)*0.5,0,0.12);s.start(t,Math.random()*0.5);s.stop(t+0.2)}
    if(this.boss&&i%8===0){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(75,t);o.frequency.exponentialRampToValueAtTime(34,t+0.9);o.connect(g);g.connect(this.mus);this.env(g,t,0.005,0.55,0,1.3);o.start(t);o.stop(t+1.5)}},
  ok(k,gap,opt){const c=this.ctx;if(!c||c.state!=='running'||(opt&&!this.ayar[opt]))return false;const n=c.currentTime;if(n-(this.last[k]||0)<gap)return false;this.last[k]=n;return true},
  // real recordings (0 A.D. by Wildfire Games, CC BY-SA 3.0, see ses/LISANS-0AD.txt), fetched once after the first click
  bake(){const c=this.ctx,B=this.B={},F={ok:['ok1','ok2','ok3','ok4'],vin:['vin1','vin2','vin3'],kilic:['kilic0','kilic1','kilic2','kilic3'],tufek:['tufek1','tufek2'],patla:['patla1','patla2','patla3','patla4'],nal:['nal0','nal1','nal2','nal3'],dalga:['dalga1','dalga2'],su:['su1','su2']};
    const base=new URL('./ses/',import.meta.url);
    for(const k in F)for(const n of F[k])fetch(new URL(n+'.mp3',base)).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(a=>new Promise((ok,no)=>c.decodeAudioData(a,ok,no))).then(b=>{(B[k]=B[k]||[]).push(b)}).catch(()=>{})},
  play(k,vol=1,pan=0,rate=1,lp=0){const c=this.ctx,L=this.B&&this.B[k];if(!L||!L.length)return false;const s=c.createBufferSource(),g=c.createGain();s.buffer=L[(Math.random()*L.length)|0];s.playbackRate.value=rate*(.93+Math.random()*.14);g.gain.value=vol;
    let o=s;if(lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;s.connect(f);o=f}o.connect(g);o=g;
    if(c.createStereoPanner&&pan){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);o=p}o.connect(this.sfx);s.start();return true},
  hit(t,type,f0,f1,peak,dur,q=1){const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);s.connect(f);f.connect(g);g.connect(this.sfx);this.env(g,t,.004,peak,0,dur);s.start(t,Math.random()*.6);s.stop(t+dur+.05)},
  okcu(v=1,p=0){if(this.ok('o',.09,'okcu')&&!this.play('ok',.75*v,p))this.hit(this.ctx.currentTime,'bandpass',2400,700,.3*v,.2,1.5)},
  tufek(v=1,p=0){if(this.ok('g',.07,'okcu')&&!this.play('tufek',.32*v,p))this.hit(this.ctx.currentTime,'highpass',3000,800,.4*v,.1)},
  kilic(v=1,p=0){if(this.ok('k',.12,'okcu')&&!this.play('kilic',.4*v,p))this.hit(this.ctx.currentTime,'bandpass',3500,2500,.2*v,.12,4)},
  top(v=1,p=0){if(this.ok('t',.16,'bomba')&&!this.play('tufek',.95*v,p,.48,1600))this.hit(this.ctx.currentTime,'lowpass',900,120,1.1*v,.32)},
  flak(v=1,p=0){if(this.ok('f',.12,'bomba')&&!this.play('tufek',.4*v,p,.75,3000))this.hit(this.ctx.currentTime,'lowpass',1500,200,.6*v,.15)},
  // each weapon has its own voice. A tone that sweeps from f0 to f1, and a noise band that does the same
  tone(t,f0,f1,peak,dur,type='sine'){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);o.connect(g);g.connect(this.sfx);this.env(g,t,.004,peak,0,dur);o.start(t);o.stop(t+dur+.05)},
  // rocket leaving the rack: a hard "tak" then the hiss of the motor ("şşş")
  // a rocket leaving its rail: a dull thump and crack as the motor lights, then a tearing roar that drops in pitch as it races away, crackling
  // a rocket leaving its tube: a hard punch, a sharp crack, then a tearing whoosh that crackles away
  roket(v=1,p=0){if(!this.ok('r',.15,'bomba'))return;const c=this.ctx,t=c.currentTime;
    this.tone(t,160,38,1.35*v,.32);this.tone(t,90,30,.9*v,.5,'triangle');this.hit(t,'highpass',6500,2000,1.5*v,.07,.8);this.play('patla',.55*v,p,1.5,3800);this.play('tufek',.7*v,p,1.05,4200);
    this.hit(t+.02,'bandpass',3200,520,1.45*v,1.7,1.4);this.hit(t+.04,'lowpass',1100,140,.9*v,1.4,.9);
    for(let i=0;i<22;i++)this.hit(t+.05+i*.06+Math.random()*.04,'bandpass',800+Math.random()*2600,300,(.62-.026*i)*v,.035,3);
    this.play('vin',.6*v,p,.95)},
  // rocket meeting a missile in the sky: a hard crack, a big airburst and a ringing echo
  roketVur(v=1,p=0){if(!this.ok('rv',.1,'bomba'))return;const t=this.ctx.currentTime;this.hit(t,'highpass',7000,1200,1.4*v,.14,.7);this.tone(t,190,40,1.2*v,.7);this.tone(t,1100,300,.3*v,.35,'triangle');
    this.play('patla',1.1*v,p,1.2);setTimeout(()=>{try{this.play('patla',.55*v,p,.7,1400)}catch(e){}},90)},
  // masonry coming down: a deep rolling rumble, heavy thuds, then stones clattering for a while
  yikil(v=1,p=0){if(!this.ok('yk',.9,'bomba'))return;const t=this.ctx.currentTime;this.hit(t,'lowpass',420,60,1.1*v,2.4,.8);this.tone(t,60,24,.9*v,1.8);
    for(let i=0;i<4;i++)setTimeout(()=>{try{this.play('patla',(.5-.08*i)*v,p,.5+Math.random()*.15,900)}catch(e){}},90+i*260+Math.random()*120);
    for(let i=0;i<16;i++)this.hit(t+.3+i*.12+Math.random()*.1,'bandpass',600+Math.random()*1800,500,(.35-.018*i)*v,.05,4)},
  // a missile: the deepest, longest boom in the game, with a second rumble rolling after it
  fuze(v=1,p=0){if(!this.ok('fz',.25,'bomba'))return;const t=this.ctx.currentTime;this.tone(t,75,20,1.5*v,1.5);this.hit(t,'lowpass',700,50,1.3*v,1.6,.7);this.play('patla',1.15*v,p,.55,1800);setTimeout(()=>{try{this.play('patla',.7*v,p,.42,700);this.tone(this.ctx.currentTime,55,22,.8*v,1.1)}catch(e){}},170)},
  // a missile taking off: a rising roar
  // a missile lifting off its launcher: an ignition blast that thumps the chest, then a long rising roar with crackle
  fuzeCik(v=1,p=0){if(!this.ok('fc',.3,'bomba'))return;const t=this.ctx.currentTime;
    this.tone(t,58,26,1.7*v,.9);this.play('patla',1*v,p,.62,1500);this.hit(t,'lowpass',1300,110,1.7*v,1.9,.8);this.hit(t,'highpass',5000,1500,1*v,.1,.8);
    this.hit(t+.08,'bandpass',240,1700,1.25*v,2.8,1.1);this.tone(t+.06,55,160,.75*v,2.2,'sawtooth');this.hit(t+.2,'lowpass',500,90,.9*v,2.6,.7);
    for(let i=0;i<26;i++)this.hit(t+.15+i*.075+Math.random()*.05,'bandpass',600+Math.random()*2400,250,(.55-.019*i)*v,.04,3);
    this.play('vin',.85*v,p,.45)},
  // a cannonball landing: a short punchy thud
  gulle(v=1,p=0){if(!this.ok('gl',.12,'bomba'))return;const t=this.ctx.currentTime;this.tone(t,150,48,.8*v,.28);if(!this.play('patla',.55*v,p,1.3,2600))this.hit(t,'lowpass',1600,150,.7*v,.3)},
  // a warship's gun: heavier and lower than a tower cannon
  gemiTop(v=1,p=0){if(!this.ok('gt',.2,'bomba'))return;const t=this.ctx.currentTime;this.tone(t,85,30,1.1*v,.6);if(!this.play('tufek',1*v,p,.36,1000))this.hit(t,'lowpass',700,90,1.2*v,.5)},
  // a warship's shell landing: bigger than a cannonball, with a crack on top
  gemiVur(v=1,p=0){if(!this.ok('gv',.14,'bomba'))return;const t=this.ctx.currentTime;this.tone(t,110,34,1.05*v,.5);this.hit(t,'highpass',3500,900,.4*v,.08);this.play('patla',.8*v,p,1.05,3200)},
  bomba(v=1,p=0){if(!this.ok('b',.14,'bomba'))return;{const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(30,t+.45);o.connect(g);g.connect(this.sfx);this.env(g,t,.004,.75*v,0,.5);o.start(t);o.stop(t+.6)}if(this.play('patla',.95*v,p))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(34,t+.5);o.connect(g);g.connect(this.sfx);this.env(g,t,.005,1.3*v,0,.6);o.start(t);o.stop(t+.7);this.hit(t,'lowpass',2200,160,1.2*v,.55)},
  dalga(v=1,p=0){if(this.ok('d',.4,'su'))this.play('dalga',.45*v,p)},
  atli(v=1){if(!this.ok('a',1.5,'atli'))return;if(!this.play('nal',.75*v)){const t=this.ctx.currentTime;[0,.1,.19,.27].forEach((d,i)=>this.hit(t+d,'bandpass',i%2?520:380,180,.55*v,.06,3))}},
  su(v=1){if(!this.ok('s',2.6,'su'))return;if(!this.play('su',.1*v,0,1.15,1100)){const t=this.ctx.currentTime,r=Math.random();this.hit(t,'lowpass',520+r*260,150,.22*v,.45,.6)}},
  para(){if(!this.ok('p',.06))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(1320,t);o.frequency.setValueAtTime(1760,t+.06);o.connect(g);g.connect(this.sfx);this.env(g,t,.003,.22,.05,.16);o.start(t);o.stop(t+.3)}
};
