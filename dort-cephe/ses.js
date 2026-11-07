// Music comes from Bastion; every sound can be switched off on its own.
const CH=[[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,67]],PENT=[69,72,74,76,79,81,84];
const KEY='cephe_ses';
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
export const SES={ctx:null,int:.2,last:{},ayar:{muzik:saved.muzik!==false,okcu:saved.okcu!==false,atli:saved.atli!==false,bomba:saved.bomba!==false,su:saved.su!==false},
  init(){if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let c;try{c=this.ctx=new AC()}catch(e){return}
    this.out=c.createGain();this.out.gain.value=.7;const comp=c.createDynamicsCompressor();this.out.connect(comp);comp.connect(c.destination);
    this.mus=c.createGain();this.mus.gain.value=this.ayar.muzik?.6:0;this.mus.connect(this.out);
    this.dl=c.createDelay(2);this.dl.delayTime.value=.43;const fb=c.createGain();fb.gain.value=.42;const dlf=c.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=1700;this.dl.connect(dlf);dlf.connect(fb);fb.connect(this.dl);const wet=c.createGain();wet.gain.value=.55;dlf.connect(wet);wet.connect(this.mus);
    this.padF=c.createBiquadFilter();this.padF.type='lowpass';this.padF.frequency.value=600;this.padF.Q.value=.7;this.padG=c.createGain();this.padG.gain.value=.2;this.padF.connect(this.padG);this.padG.connect(this.mus);this.padG.connect(this.dl);
    this.sfx=c.createGain();this.sfx.gain.value=.6;this.sfx.connect(this.out);
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=nb;
    const t=c.currentTime;this.tC=t+.1;this.ci=0;this.tN=t+2.5;this.tB=t+1;this.bi=0;setInterval(()=>this.sched(),60);setTimeout(()=>{try{this.bake()}catch(e){}},0)},
  set(k,v){this.ayar[k]=v;try{localStorage.setItem(KEY,JSON.stringify(this.ayar))}catch(e){}if(k==='muzik'&&this.mus)this.mus.gain.setTargetAtTime(v?.6:0,this.ctx.currentTime,.1)},
  mf:m=>440*Math.pow(2,(m-69)/12),
  env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)},
  sched(){const c=this.ctx;if(!c||c.state!=='running')return;const now=c.currentTime,ah=now+0.4,I=this.int;
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
  roket(v=1,p=0){if(this.ok('r',.15,'bomba')&&!this.play('vin',.8*v,p,.55))this.hit(this.ctx.currentTime,'bandpass',600,2500,.4*v,.5,1)},
  bomba(v=1,p=0){if(!this.ok('b',.14,'bomba'))return;if(this.play('patla',.9*v,p))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(34,t+.5);o.connect(g);g.connect(this.sfx);this.env(g,t,.005,1.3*v,0,.6);o.start(t);o.stop(t+.7);this.hit(t,'lowpass',2200,160,1.2*v,.55)},
  dalga(v=1,p=0){if(this.ok('d',.4,'su'))this.play('dalga',.45*v,p)},
  atli(){if(!this.ok('a',1.5,'atli'))return;if(!this.play('nal',.75)){const t=this.ctx.currentTime;[0,.1,.19,.27].forEach((d,i)=>this.hit(t+d,'bandpass',i%2?520:380,180,.55,.06,3))}},
  su(){if(!this.ok('s',1.1,'su'))return;if(!this.play('su',.25)){const t=this.ctx.currentTime,r=Math.random();this.hit(t,'lowpass',520+r*260,150,.22,.45,.6)}},
  para(){if(!this.ok('p',.06))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(1320,t);o.frequency.setValueAtTime(1760,t+.06);o.connect(g);g.connect(this.sfx);this.env(g,t,.003,.22,.05,.16);o.start(t);o.stop(t+.3)}
};
