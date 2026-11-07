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
  ok(k,gap,opt){const c=this.ctx;if(!c||c.state!=='running'||!this.B||(opt&&!this.ayar[opt]))return false;const n=c.currentTime;if(n-(this.last[k]||0)<gap)return false;this.last[k]=n;return true},
  // every effect is a recorded-style sample, synthesised once at start-up in a few variants, then played through a small room reverb
  bake(){const c=this.ctx,sr=c.sampleRate,R=Math.random;
    const mk=(dur,fn)=>{const n=Math.ceil(dur*sr),b=c.createBuffer(1,n,sr),d=b.getChannelData(0);fn(d,n,sr);let m=0;for(let i=0;i<n;i++)m=Math.max(m,Math.abs(d[i]));if(m>0)for(let i=0;i<n;i++)d[i]/=m;const f=Math.min(n,sr*.01|0);for(let i=0;i<f;i++)d[n-1-i]*=i/f;return b};
    // state-variable filter run over noise, cutoff may glide
    const svf=(d,n,sr,f0,f1,q,mode,amp,env,t0=0)=>{let lo=0,bp=0;const s=t0*sr|0;for(let i=s;i<n;i++){const t=(i-s)/sr,f=f0*Math.pow(f1/f0,Math.min(1,t/env.glide)),F=2*Math.sin(Math.PI*Math.min(f,sr/6)/sr),x=R()*2-1;lo+=F*bp;const hi=x-lo-bp/q;bp+=F*hi;const y=mode==='lo'?lo:mode==='hi'?hi:bp;d[i]+=y*amp*env.e(t)}};
    const sine=(d,n,sr,f0,f1,glide,tau,amp,t0=0,att=.002)=>{let ph=0;const s=t0*sr|0;for(let i=s;i<n;i++){const t=(i-s)/sr,f=f0*Math.pow(f1/f0,Math.min(1,t/glide));ph+=2*Math.PI*f/sr;d[i]+=Math.sin(ph)*amp*Math.min(1,t/att)*Math.exp(-t/tau)}};
    const ex=(a,tau)=>({glide:1,e:t=>Math.min(1,t/a)*Math.exp(-t/tau)});
    const B={},J=[];
    // bow: the string's low thrum and a soft, airy swish as the arrow leaves - no crack
    J.push(()=>{B.ok=[0,1,2].map(()=>mk(.5,(d,n,sr)=>{const p=135+R()*30;sine(d,n,sr,p,p*.97,.1,.035,.55);sine(d,n,sr,p*2.1,p*2,.1,.018,.22);svf(d,n,sr,900,600,3,'bp',.18,ex(.002,.01));const g=2600+R()*700;svf(d,n,sr,g,g*.35,1.6,'bp',.75,{glide:.32,e:t=>{const k=t/.34;return k>1?0:Math.sin(Math.PI*Math.pow(k,.6))*(1-k*.4)}},.02)}));});
    // cannon: a deep thud, a short roar and a long rolling tail
    J.push(()=>{B.top=[0,1,2].map(()=>mk(2.2,(d,n,sr)=>{sine(d,n,sr,62+R()*10,34,.45,.28,1,0,.004);svf(d,n,sr,2200,180,.8,'lo',1.3,{glide:.5,e:t=>Math.min(1,t/.003)*Math.exp(-t/.16)});svf(d,n,sr,320,90,.7,'lo',.9,{glide:1.5,e:t=>Math.min(1,t/.03)*Math.exp(-t/.7)})}));});
    // explosion: a heavy blast, crackling debris and a long rumble
    J.push(()=>{B.bomba=[0,1,2].map(()=>mk(3,(d,n,sr)=>{sine(d,n,sr,55+R()*10,26,.7,.45,1.1,0,.005);svf(d,n,sr,3500,140,.7,'lo',1.6,{glide:.7,e:t=>Math.min(1,t/.004)*Math.exp(-t/.22)});svf(d,n,sr,260,60,.6,'lo',1.2,{glide:2.5,e:t=>Math.min(1,t/.05)*Math.exp(-t/1.1)});for(let k=0;k<60;k++){const t0=Math.pow(R(),2)*1.4,a=.35*Math.exp(-t0*2)*(.4+R()),s=t0*sr|0,l=sr*(.004+R()*.012)|0;let lo=0;for(let i=0;i<l&&s+i<n;i++){const x=R()*2-1;lo+=.35*(x-lo);d[s+i]+=(x-lo)*a*Math.exp(-i/(l*.3))}}}));});
    // flak gun: a dry double bang
    J.push(()=>{B.flak=[0,1].map(()=>mk(.9,(d,n,sr)=>{for(const t0 of[0,.11]){sine(d,n,sr,140,70,.08,.05,.6,t0,.001);svf(d,n,sr,4000,700,.7,'lo',1,{glide:.1,e:t=>Math.min(1,t/.001)*Math.exp(-t/.035)},t0);svf(d,n,sr,600,200,.7,'lo',.4,{glide:.4,e:t=>Math.exp(-t/.25)},t0)}}));});
    // rifle: a sharp crack that dies in a short echo
    J.push(()=>{B.tufek=[0,1,2].map(()=>mk(.6,(d,n,sr)=>{svf(d,n,sr,5000,1500,.8,'hi',.9,{glide:.05,e:t=>Math.min(1,t/.0005)*Math.exp(-t/.012)});sine(d,n,sr,180,90,.05,.03,.45,0,.001);svf(d,n,sr,900,250,.7,'lo',.35,{glide:.3,e:t=>Math.min(1,t/.01)*Math.exp(-t/.12)})}));});
    // blades meeting: a short metallic ring with inharmonic partials
    J.push(()=>{B.kilic=[0,1,2,3].map(()=>mk(.6,(d,n,sr)=>{const f=1800+R()*900;for(const[m,a,tau]of[[1,.5,.18],[1.58,.35,.13],[2.31,.3,.09],[3.07,.2,.06],[4.2,.12,.04]])sine(d,n,sr,f*m,f*m,1,tau*(.8+R()*.4),a,0,.0005);svf(d,n,sr,6000,3000,1.5,'bp',.5,ex(.0005,.006))}));});
    // hooves on earth: a three-beat gallop of dull knocks with a scuff of dirt
    J.push(()=>{B.nal=[0,1,2].map(()=>mk(.42,(d,n,sr)=>{[0,.085,.165].forEach((t0,i)=>{const f=380+R()*120+(i===2?-60:0);sine(d,n,sr,f,f*.8,.03,.014,.7,t0,.0008);sine(d,n,sr,f*2.4,f*2.2,.03,.007,.35,t0,.0005);svf(d,n,sr,1400,700,1,'bp',.5,{glide:.04,e:t=>Math.min(1,t/.001)*Math.exp(-t/.02)},t0);svf(d,n,sr,700,300,.7,'lo',.3,{glide:.06,e:t=>Math.min(1,t/.003)*Math.exp(-t/.04)},t0+.004)})}));});
    // wading through water: a body of churned water with real bubbles rising in pitch
    J.push(()=>{B.su=[0,1,2,3].map(()=>mk(.9,(d,n,sr)=>{svf(d,n,sr,900,400,.7,'lo',.6,{glide:.5,e:t=>Math.min(1,t/.06)*Math.exp(-t/.22)});svf(d,n,sr,2200,1200,1.2,'bp',.18,{glide:.4,e:t=>Math.min(1,t/.04)*Math.exp(-t/.14)});for(let k=0;k<9;k++){const t0=.02+R()*.45,f=350+R()*900,tau=.015+R()*.04,s=t0*sr|0;let ph=0;for(let i=s;i<n;i++){const t=(i-s)/sr;if(t>tau*6)break;ph+=2*Math.PI*f*(1+12*t)/sr;d[i]+=Math.sin(ph)*Math.exp(-t/tau)*(.12+R()*.04)}}}));});
    // a big splash for things hitting the sea
    J.push(()=>{B.dalga=[0,1].map(()=>mk(1.4,(d,n,sr)=>{svf(d,n,sr,2500,300,.7,'lo',1,{glide:.8,e:t=>Math.min(1,t/.01)*Math.exp(-t/.3)});for(let k=0;k<20;k++){const t0=.05+R()*.8,f=300+R()*700,tau=.02+R()*.05,s=t0*sr|0;let ph=0;for(let i=s;i<n;i++){const t=(i-s)/sr;if(t>tau*6)break;ph+=2*Math.PI*f*(1+10*t)/sr;d[i]+=Math.sin(ph)*Math.exp(-t/tau)*.12}}}));});
    // a guided rocket leaving its rail: ignition then a fading hiss
    J.push(()=>{B.roket=[0,1].map(()=>mk(1.6,(d,n,sr)=>{sine(d,n,sr,90,50,.2,.1,.6,0,.002);svf(d,n,sr,500,3200,1.1,'bp',.9,{glide:.35,e:t=>Math.min(1,t/.03)*Math.exp(-t/.5)});svf(d,n,sr,6000,2500,.7,'hi',.25,{glide:1,e:t=>Math.min(1,t/.05)*Math.exp(-t/.35)})}));});
    // coins
    J.push(()=>{B.para=[mk(.6,(d,n,sr)=>{for(const[t0,f]of[[0,2350],[.07,3120]])for(const[m,a,tau]of[[1,.5,.25],[2.76,.25,.12],[5.4,.12,.05]])sine(d,n,sr,f*m,f*m,1,tau,a,t0,.0008)})];});
    // a short room for everything to ring in
    const ir=c.createBuffer(2,sr*1.3|0,sr);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(R()*2-1)*Math.pow(1-i/d.length,3)*.5}
    this.rev=c.createConvolver();this.rev.buffer=ir;const wet=c.createGain();wet.gain.value=.22;this.rev.connect(wet);wet.connect(this.sfx);
    // one sound per tick, so starting up never stalls a frame
    this.B=B;const step=()=>{const f=J.shift();if(!f)return;try{f()}catch(e){}setTimeout(step,30)};step()},
  play(k,vol=1,pan=0,rate=1){const c=this.ctx,L=this.B[k];if(!L)return;const s=c.createBufferSource(),g=c.createGain();s.buffer=L[(Math.random()*L.length)|0];s.playbackRate.value=rate*(.94+Math.random()*.12);g.gain.value=vol;s.connect(g);
    let o=g;if(c.createStereoPanner&&pan){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);o=p}o.connect(this.sfx);o.connect(this.rev);s.start()},
  okcu(v=1,p=0){if(this.ok('o',.07,'okcu'))this.play('ok',.55*v,p)},
  tufek(v=1,p=0){if(this.ok('g',.06,'okcu'))this.play('tufek',.35*v,p)},
  kilic(v=1,p=0){if(this.ok('k',.11,'okcu'))this.play('kilic',.22*v,p)},
  top(v=1,p=0){if(this.ok('t',.14,'bomba'))this.play('top',.9*v,p)},
  flak(v=1,p=0){if(this.ok('f',.12,'bomba'))this.play('flak',.45*v,p)},
  roket(v=1,p=0){if(this.ok('r',.15,'bomba'))this.play('roket',.6*v,p)},
  bomba(v=1,p=0){if(this.ok('b',.12,'bomba'))this.play('bomba',1*v,p)},
  dalga(v=1,p=0){if(this.ok('d',.3,'su'))this.play('dalga',.5*v,p)},
  atli(){if(this.ok('a',.42,'atli'))this.play('nal',.5)},
  su(){if(this.ok('s',.5,'su'))this.play('su',.4)},
  para(){if(this.ok('p',.06))this.play('para',.3)}
};
