#!/usr/bin/env python3
"""Builds the four-player arena from the root Bastion game. Run: python3 arena/build.py
The root index.html is never changed. Output: arena/index.html and arena/game.js"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root.parent / 'index.html').read_text(encoding='utf8')

def sub(s, a, b, n=1):
    assert s.count(a) >= 1, 'missing: ' + a[:70]
    return s.replace(a, b) if n == 0 else s.replace(a, b, n)

head, rest = src.split('<script type="module">', 1)
js, _ = rest.rsplit('</script>', 1)

# ---- one 80x80 map becomes four, side by side in a 160x160 world ----
js = sub(js, 'const TILE=32,GW=80,GH=80;',
  "const A=window.ARENA,QW=80,TILE=32,GW=160,GH=160,OX=(A.seat%2)*QW,OY=(A.seat>>1)*QW;")
js = sub(js, 'const BASE={tx:44,ty:34},SPAWN={tx:6,ty:73},SPAWN2={tx:4,ty:27};',
  'const BASE0={tx:44,ty:34},SPAWN0={tx:6,ty:73},SPAWN20={tx:4,ty:27};const BASE={tx:44+OX,ty:34+OY},SPAWN={tx:6+OX,ty:73+OY},SPAWN2={tx:4+OX,ty:27+OY};')
js = sub(js, 'const terrain=new Uint8Array(GW*GH);',
  'const nearSpawn0=(x,y,r)=>Math.hypot(x-SPAWN0.tx,y-SPAWN0.ty)<r||Math.hypot(x-SPAWN20.tx,y-SPAWN20.ty)<r;const terrain0=new Uint8Array(QW*QW);const terrain=new Uint8Array(GW*GH);')

def quad(t):   # rewrite a block so it works on the 80x80 master map
    t = re.sub(r'\bGW\b', 'QW', t); t = re.sub(r'\bGH\b', 'QW', t)
    t = re.sub(r'\bBASE\b', 'BASE0', t); t = re.sub(r'\bSPAWN2\b', 'SPAWN20', t); t = re.sub(r'\bSPAWN\b', 'SPAWN0', t)
    t = re.sub(r'\bnearSpawn\b', 'nearSpawn0', t); t = re.sub(r'\bterrain\b', 'terrain0', t)
    return t

i = js.index('function reachable('); j = js.index('function genTerrain(')
reach_src = js[i:j]
reach0 = quad(reach_src).replace('function reachable(', 'function reachable0(')
i2 = js.index('function genTerrain('); j2 = js.index('const DEPOS=[];')
gen = quad(js[i2:j2]).replace('reachable(', 'reachable0(')
gen = sub(gen, 'reach=reachable0(BASE0.tx,BASE0.ty);genDeposits()}',
  'for(let q=0;q<4;q++){const ax=(q%2)*QW,ay=(q>>1)*QW;for(let y=0;y<QW;y++)for(let x=0;x<QW;x++){let t=terrain0[x+y*QW];if(x<2||y<2||x>=QW-2||y>=QW-2)t=2;terrain[ax+x+(ay+y)*GW]=t}}\n  reach=reachable(BASE.tx,BASE.ty);genDeposits()}')
js = js[:i2] + reach0 + gen + js[j2:]

i = js.index('function genHeights('); j = js.index('function heightAt(')
h = quad(js[i:j])
h = sub(h, 'const X=i/HR,Z=j/HR;', 'const X=(i/HR)%QW,Z=(j/HR)%QW;')
js = js[:i] + h + js[j:]

js = sub(js, 'g.quadraticCurveTo(30*S,52*S,', 'g.quadraticCurveTo((30+OX)*S,(52+OY)*S,')
js = sub(js, 'new THREE.Vector2(380,-300),new THREE.Vector2(380,380),new THREE.Vector2(-300,380)', 'new THREE.Vector2(460,-300),new THREE.Vector2(460,460),new THREE.Vector2(-300,460)')
js = sub(js, 'for(let i=0;i<900;i++){const a=rnd()*Math.PI*2,r=58+rnd()*30;', 'for(let i=0;i<1400;i++){const a=rnd()*Math.PI*2,r=114+rnd()*34;')
js = sub(js, 'for(let i=0;i<260;i++){const X=1+rnd()*78,Z=1+rnd()*78;', 'for(let i=0;i<800;i++){const X=1+rnd()*158,Z=1+rnd()*158;')

# ---- one main tower per map; losing it knocks you out ----
js = sub(js, "if(!forLoad){addBuilding('archer',BASE.tx-1,BASE.ty-1,true);",
  "if(!forLoad){const K=addBuilding('archer',BASE.tx-1,BASE.ty-1,true);K.keep=true;K.hp=K.maxhp=K.hp*3;KEEP=K;")
js = sub(js, 'if(!buildings.length){gameOver=true;clearSave();lastRec=recordPlay();setTimeout(()=>{showStats(\'over\');renderHof()},1600)}',
  'if(b.keep||!buildings.length){gameOver=true;arenaLost()}')
js = sub(js, 'function sellSel(){const list=[...selSet].filter(b=>buildings.includes(b));', 'function sellSel(){const list=[...selSet].filter(b=>buildings.includes(b)&&!b.keep);')

# ---- no local saves, no leaderboard writes to the original game, no pausing in a live match ----
js = sub(js, 'function saveGame(){', 'function saveGame(){return;')
js = re.sub(r"const BOARD=\{url:'[^']*',key:'[^']*'\}", "const BOARD={url:'',key:''}", js, 1)
js = sub(js, 'function setPaused(v){', 'function setPaused(v){if(v)return;')
js = sub(js, 'function drawMini(){', 'function drawMini(){drawMini0();drawMiniArena()}\nfunction drawMini0(){')

i = js.rindex("$('loading').classList.add('hidden')")
j = js.index('\n', js.index("$('bStart').onclick", i))
js = js[:i] + "$('loading').classList.add('hidden');$('start').classList.add('hidden');newGame();renderThumb();started=true;setTimeout(arenaBoot,0);" + js[j:]
js = 'let KEEP=null;\n' + js + (root / 'arena-net.js').read_text(encoding='utf8')
(root / 'game.js').write_text(js, encoding='utf8')

# ---- page: the original look, plus the matchmaking screen ----
head = sub(head, '{"imports":{"three":"./three.min.js"}}', '{"imports":{"three":"../three.min.js"}}')
head = head.replace('href="icon', 'href="../icon').replace('href="manifest', 'href="../manifest')
head = sub(head, '<title>Bastion 3D — Tower Defense</title>', '<title>Bastion Arena</title>')
head = sub(head, '</head>', '<link rel="stylesheet" href="lobby.css"></head>')
page = head + (root / 'lobby.html').read_text(encoding='utf8') + '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script><script src="lobby.js"></script>\n</body></html>\n'
(root / 'index.html').write_text(page, encoding='utf8')
print('ok', len(js), len(page))
