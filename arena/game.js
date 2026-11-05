let KEEP=null;

import * as THREE from 'three';
// =============== LANGUAGE (English / Türkçe) ===============
let LANG='en';try{LANG=localStorage.getItem('bastion_lang')||'en'}catch(e){}
const TRD={

'YOUR REALM AWAITS':'KRALLIĞIN SENİ BEKLİYOR','The Red Host marches in':'Kızıl Ordu’nun gelişine:','40 seconds':'40 saniye',
'Here is how to get started:':'Başlamak için:','Grow your economy':'Ekonomini büyüt','then':'sonra',
'. Grain pays for everything.':'— her şey tahılla ödenir.','Raise a defense':'Savunma kur','and pick a tower. Drag it toward the bottom-left, where the enemy comes from.':'ve bir kule seç. Düşmanın geldiği sol alta doğru sürükle.',
'Upgrade and repair':'Yükselt ve tamir et','Press and hold a building to upgrade it. Double-tap to repair.':'Yükseltmek için binaya basılı tut. Tamir için çift dokun.',
'Advance the ages':'Çağları ilerlet','The gold button, bottom left, unlocks cannons, knights and stronger tiers.':'Sol alttaki altın buton topları, şövalyeleri ve güçlü seviyeleri açar.',
'⚔ To Battle!':'⚔ Savaşa!','⟲ New Game':'⟲ Yeni Oyun','Tap again — this battle goes to the Hall of Fame':'Tekrar dokun — bu savaş Şöhret Salonuna kaydedilir','Tap again to start over':'Baştan başlamak için tekrar dokun','Previous battle saved to the Hall of Fame':'Önceki savaş Şöhret Salonuna kaydedildi','📖 All controls':'📖 Tüm kontroller','📖 Instructions':'📖 Talimatlar','INSTRUCTIONS':'TALİMATLAR',
'Hold the high ground. Build an economy, raise towers, survive the boss waves.':'Tepeleri tut. Ekonomi kur, kuleler dik, patron dalgalarından sağ çık.',
'GESTURES':'HAREKETLER','BUTTONS':'BUTONLAR','ON THE MAP':'HARİTADA',
'Select a building or a knight squad.':'Bir bina veya şövalye birliği seç.','Double-tap':'Çift dokun','Repair a building.':'Binayı tamir et.',
'Press and hold':'Basılı tut','Upgrade a building (keep holding to chain tiers).':'Binayı yükselt (seviye zinciri için basılı tutmaya devam et).',
'Drag a new building':'Yeni binayı sürükle','Move it before you confirm.':'Onaylamadan önce taşı.','Drag the map':'Haritayı sürükle','Move the camera.':'Kamerayı kaydır.',
'Swipe across buildings':'Binaların üzerinden kaydır','Select several at once.':'Birkaçını birden seç.','Long-press empty ground and drag':'Boş yere basılı tut ve sürükle',
'Box-select everything inside.':'İçindeki her şeyi seç.','Drag with Wall':'Duvar ile sürükle','Draw a whole wall line.':'Bütün bir duvar hattı çiz.',
'Pinch':'Sıkıştır','Zoom in and out.':'Yakınlaştır ve uzaklaştır.','Twist two fingers':'İki parmağı çevir','Rotate the view.':'Görünümü döndür.',
'Wheat field, sheep farm, gold mine.':'Buğday tarlası, koyun çiftliği, altın madeni.','Archer, cannon, knights, wall.':'Okçu, top, şövalyeler, duvar.',
'Confirm the building.':'Binayı onayla.','Drop the building you are placing.':'Yerleştirdiğin binayı bırak.','Age':'Çağ','Research the next age (bottom left).':'Sonraki çağı araştır (sol alt).',
'Appears when a building is selected. Tap twice.':'Bina seçiliyken görünür. İki kez dokun.','Speed':'Hız','1× · 2× · 3× · 0× (time stopped).':'1× · 2× · 3× · 0× (zaman durur).',
'Pause':'Duraklat','Menu, stats, achievements, language.':'Menü, istatistikler, başarımlar, dil.','Music':'Müzik','Sound on or off.':'Sesi aç veya kapat.',
'Rotate':'Döndür','Turn the view a quarter turn.':'Görünümü çeyrek tur çevir.','Home':'Üs','Fly the camera back to your base.':'Kamerayı üssüne geri götür.',
'Wave bar':'Dalga çubuğu','Tap it to call the next wave early.':'Sonraki dalgayı erken çağırmak için dokun.',
'⚔ ♥ badges':'⚔ ♥ rozetleri','Attack and health at a glance.':'Bir bakışta saldırı ve can.','Flames':'Alevler','Veterancy: more kills, stronger. Purple is legendary.':'Kıdem: daha çok öldürme, daha güçlü. Mor efsanevidir.',
'Gold rocks':'Altın kayaları','Gold mines can only go on these.':'Altın madenleri sadece bunların üstüne kurulur.','Trees':'Ağaçlar','Nothing passes through. Use them as choke points.':'Hiçbir şey geçemez. Onları darboğaz olarak kullan.',
'Tap':'Dokun',
// --- whole sentences / UI ---
'Bastion 3D — Tower Defense':'Bastion 3D — Kule Savunması','RAISING THE REALM…':'KRALLIK KURULUYOR…',
'Blue holds the high ground. Red comes from the southwest — and later, the west.':'Mavi tepeleri tutuyor. Kırmızı güneybatıdan gelir — sonra batıdan da.',
'Grow grain, wool and gold. Raise towers. Survive the boss waves.':'Tahıl, yün ve altın üret. Kuleler dik. Patron dalgalarından sağ çık.',
'Drag to pan · pinch to zoom · ⟲ ⟳ rotate · tap buildings to upgrade':'Kaydırmak için sürükle · yakınlaştırmak için sıkıştır · ⟲ ⟳ döndür · yükseltmek için binaya dokun',
'(iPhone: turn the silent switch off for music)':'(iPhone: müzik için sessiz düğmesini kapat)',
'Your name':'Adın','Begin':'Başla','New Game':'Yeni Oyun','▶ Continue':'▶ Devam Et','Tap again to overwrite save':'Kaydın üzerine yazmak için tekrar dokun',
'PAUSED':'DURAKLATILDI','▶ Resume':'▶ Devam','📊 Battle Stats':'📊 Savaş İstatistikleri','🏅 Achievements':'🏅 Başarımlar','ACHIEVEMENTS':'BAŞARIMLAR','◀ Back':'◀ Geri',
'▶ Back to battle':'▶ Savaşa dön','⟲ Rebuild':'⟲ Yeniden Kur','Progress auto-saves':'İlerleme otomatik kaydedilir',
'Tower leaderboard':'Kule sıralaması','Damage dealt over time':'Zamana göre verilen hasar','per second':'saniye başına','per minute':'dakika başına',
'Economy — income over time':'Ekonomi — zamana göre gelir','Enemies on the field':'Sahadaki düşmanlar','⚔ = boss waves':'⚔ = patron dalgaları',
'Damage taken by your buildings':'Binalarının aldığı hasar','Enemies defeated by type':'Türe göre yenilen düşmanlar','Kills by defense type':'Savunma türüne göre öldürmeler',
'🏆 Hall of Fame':'🏆 Şöhret Salonu','Chronicle':'Vakayiname','Nothing yet':'Henüz bir şey yok','Not enough battle yet':'Henüz yeterince savaş yok',
'No kills yet — build some defenses!':'Henüz öldürme yok — savunma kur!','No plays yet — be the first.':'Henüz oyun yok — ilk sen ol.',
'Global leaderboard not connected yet.':'Küresel sıralama henüz bağlı değil.','This device':'Bu cihaz','All devices':'Tüm cihazlar','Latest plays':'Son oyunlar',
'Score':'Puan','Time survived':'Hayatta kalma süresi','Waves reached':'Ulaşılan dalga','Enemies defeated':'Yenilen düşman','Damage dealt':'Verilen hasar','Resources earned':'Kazanılan kaynak',
'FALLEN':'DÜŞTÜ','BATTLE STATS':'SAVAŞ İSTATİSTİKLERİ','ACHIEVEMENT UNLOCKED':'BAŞARIM AÇILDI',
'Drag to box-select':'Alan seçmek için sürükle','Release to build':'Kurmak için bırak','🔨 Double-tap':'🔨 Çift dokun','★ MAX TIER':'★ EN ÜST SEVİYE','★ Max tier':'★ En üst seviye',
'Tap to confirm':'Onaylamak için dokun','Already at full health':'Zaten tam can','Can\'t sell your last building':'Son binanı satamazsın',
'Hold: upgrade · Double-tap: repair · Swipe: select many':'Basılı tut: yükselt · Çift dokun: tamir · Kaydır: çoklu seç',
'Drag on the map to draw a wall line · tap for one piece':'Duvar çizmek için haritada sürükle · tek parça için dokun',
'No free gold deposits — look for ✦ gold rocks on the map':'Boş altın yatağı yok — haritada ✦ altın kayalarını ara',
'No open ground nearby':'Yakında boş arazi yok','Blocked here — drag it onto open grass':'Burası kapalı — açık çimene sürükle',
'Blocked — draw on open grass':'Kapalı — açık çimene çiz','⚠ Fully sealed — enemies will smash through':'⚠ Tamamen kapalı — düşman kırıp geçecek',
'First Cannon Tower — rams beware!':'İlk Top Kulesi — koçbaşları dikkat!','Keep holding to chain the next tier':'Sonraki seviye için basılı tutmaya devam et',
'Calling the next wave early!':'Sonraki dalga erken çağrılıyor!','⏸ Time stopped — build, upgrade & sell freely':'⏸ Zaman durdu — rahatça kur, yükselt ve sat',
'⚠ Enemies approaching from the WEST':'⚠ Düşman BATIDAN yaklaşıyor','⚠ Attack on BOTH fronts':'⚠ İKİ cepheden saldırı','⚠ A boss wave follows this one. Prepare.':'⚠ Bunun ardından patron dalgası geliyor. Hazırlan.',
'⚔ The enemy charges!':'⚔ Düşman hücum ediyor!','Your realm stands in its final age':'Krallığın son çağında',
'⏸ Next wave waits — clear the field':'⏸ Sonraki dalga bekliyor — sahayı temizle','⏸ TIME STOPPED':'⏸ ZAMAN DURDU','build freely':'rahatça kur',
'LEGENDARY':'EFSANEVİ','STEADY GOLD':'İSTİKRARLI ALTIN','Your first gold mine. Gold now flows.':'İlk altın madenin. Artık altın akıyor.',
'KNIGHTS OF BLUE':'MAVİNİN ŞÖVALYELERİ','Mounted knights now guard a wide zone.':'Atlı şövalyeler artık geniş bir bölgeyi koruyor.',
'WELCOME BACK':'TEKRAR HOŞ GELDİN','Build your economy. The first enemies come in 40 seconds.':'Ekonomini kur. İlk düşmanlar 40 saniyede geliyor.',
'AGE II · THE AGE OF STONE':'II. ÇAĞ · TAŞ ÇAĞI','AGE III · THE JEWELED AGE':'III. ÇAĞ · MÜCEVHER ÇAĞI',
'Cannons, Knights and Stone-tier upgrades unlocked.':'Toplar, Şövalyeler ve Taş seviyesi yükseltmeleri açıldı.','Jeweled-tier upgrades unlocked. Gleam.':'Mücevher seviyesi yükseltmeleri açıldı. Parılda.',
'The Red Host gathers on both fronts.':'Kızıl Ordu iki cephede toplanıyor.','WAVE 1':'DALGA 1','BOSS WAVE':'PATRON DALGASI',
'Spearmen approach from the southwest.':'Mızrakçılar güneybatıdan yaklaşıyor.',
'Battering Rams! Arrows barely scratch them — build Cannons (Age II).':'Koçbaşları! Oklar onları zor çizer — Top kur (II. Çağ).',
'ERA II · BOWMEN':'DEVİR II · YAYCILAR','Enemy archers shoot your towers and knights from range.':'Düşman okçuları kulelerini ve şövalyelerini uzaktan vurur.',
'Cavalry charge! Fast riders — knights hold the line.':'Süvari hücumu! Hızlı atlılar — şövalyeler hattı tutar.',
'ERA III · A SECOND FRONT':'DEVİR III · İKİNCİ CEPHE','Shieldbearers shrug off arrows — and the enemy now marches from the WEST too.':'Kalkancılar oklara aldırmaz — ve düşman artık BATIDAN da geliyor.',
'The Warlord marches with his host.':'Savaş Lordu ordusuyla yürüyor.','ERA IV · SAPPERS':'DEVİR IV · LAĞIMCILAR',
'Powder-keg sappers sprint at your walls. Mazes alone will not hold.':'Barut fıçılı lağımcılar duvarlarına koşar. Sadece labirent yetmez.',
'A siege train: rams and sappers on both fronts.':'Kuşatma kafilesi: iki cephede koçbaşları ve lağımcılar.','ERA V · VETERANS':'DEVİR V · KIDEMLİLER',
'Hardened veterans on every front. Every tower counts.':'Her cephede pişmiş kıdemliler. Her kule önemli.',
'Relaxed. Enemies take the shortest road and arrive slowly.':'Rahat. Düşman en kısa yolu seçer ve yavaş gelir.','The standard campaign.':'Standart sefer.',
'Clever foes: dodge kill zones, mass before charging, raid farms, kite knights.':'Zeki düşman: ölüm bölgelerinden kaçar, hücumdan önce toplanır, çiftliklere baskın yapar, şövalyeleri oyalar.',
'Ruthless: reads your defenses and counters them, pincers both fronts, lures your knights.':'Acımasız: savunmanı okur ve karşılık verir, iki cepheden kıskaca alır, şövalyelerini tuzağa çeker.',
'Medals earned':'Kazanılan madalyalar','Knights fallen in battle':'Savaşta düşen şövalyeler','Biggest horde':'En büyük sürü','Toughest building:':'En dayanıklı bina:','Oldest standing defense:':'Ayakta kalan en eski savunma:',
'Buildings raised':'Kurulan bina','Earned':'Kazanılan','Spent':'Harcanan','just now':'az önce',
// achievements
'Medici Ledger':'Medici Defteri','Raise a Gold Mine to the Jeweled tier.':'Bir Altın Madenini Mücevher seviyesine çıkar.',
'Ottoman Banker':'Osmanlı Bankeri','Mine every gold deposit on the map — all at the Jeweled tier.':'Haritadaki her altın yatağını işlet — hepsi Mücevher seviyesinde.',
"Fugger's Fortune":"Fugger'in Serveti",'Hold 5,000 gold at once.':'Aynı anda 5.000 altın biriktir.',
'Treasury of Mansa Musa':"Mansa Musa'nın Hazinesi",'Earn 25,000 resources in a single battle.':'Tek savaşta 25.000 kaynak kazan.',
'Breadbasket of Byzantium':"Bizans'ın Tahıl Ambarı",'Keep 6 Wheat Fields at Stone tier or better.':'6 Buğday Tarlasını Taş seviyesinde veya üstünde tut.',
'Weavers of Flanders':'Flandre Dokumacıları','Run 5 Sheep Farms at once.':'Aynı anda 5 Koyun Çiftliği işlet.',
"Hadrian's Wall":'Hadrianus Duvarı','Have 40 wall sections standing.':'40 duvar parçası ayakta olsun.',
'Theodosian Walls':'Theodosius Surları','Have 20 Jeweled wall sections standing.':'20 Mücevher duvar parçası ayakta olsun.',
'Agincourt':'Azincourt','Archer towers defeat 400 enemies in one battle.':'Okçu kuleleri tek savaşta 400 düşman yensin.',
"Orban's Great Bombard":"Orban'ın Şahi Topu",'A Cannon Tower reaches Veteran V.':'Bir Top Kulesi Kıdemli V olsun.',
'Knights Templar':'Tapınak Şövalyeleri','A knight squad reaches Veteran V.':'Bir şövalye birliği Kıdemli V olsun.',
"Saladin's Respect":"Selahaddin'in Saygısı",'Command 3 legendary (purple-flame) defenders at once.':'Aynı anda 3 efsanevi (mor alevli) savunucuya komuta et.',
'Crown of Charlemagne':"Şarlman'ın Tacı",'Advance to Age III.':'III. Çağa geç.','Hastings':'Hastings','Slay a Warlord.':'Bir Savaş Lordu öldür.',
'Thermopylae':'Termopylai','Reach wave 10 with no more than 3 defense towers.':'En fazla 3 savunma kulesiyle 10. dalgaya ulaş.',
'Siege of Belgrade':'Belgrad Kuşatması','Survive a boss wave without losing a single building.':'Tek bina kaybetmeden bir patron dalgası atlat.',
'Gates of Vienna':'Viyana Kapıları','Reach wave 20 on Lord or Emperor.':'Bey veya İmparator zorluğunda 20. dalgaya ulaş.',
'Constantinople Holds':'Konstantinopolis Dayanıyor','Reach wave 25 on Emperor.':'İmparator zorluğunda 25. dalgaya ulaş.',
'Kingmaker':'Kral Yapıcı','Defeat 1,000 enemies in one battle.':'Tek savaşta 1.000 düşman yen.',
// --- phrases / words (used inside composite strings) ---
'Archer Tower':'Okçu Kulesi','Cannon Tower':'Top Kulesi','Soldier Tower':'Asker Kulesi','Wheat Field':'Buğday Tarlası','Sheep Farm':'Koyun Çiftliği','Gold Mine':'Altın Madeni',
'Archer towers':'Okçu kuleleri','Cannon towers':'Top kuleleri','Wall':'Duvar','Archer':'Okçu','Cannon':'Top','Wheat':'Buğday','Sheep':'Koyun',
'Archers':'Okçular','Cannons':'Toplar','Knights':'Şövalyeler','Grain':'Tahıl','Wool':'Yün','Gold':'Altın','Enemies':'Düşmanlar','Damage taken':'Alınan hasar',
'Spearman':'Mızrakçı','Spearmen':'Mızrakçılar','Battering Ram':'Koçbaşı','Battering rams':'Koçbaşları','Cavalry':'Süvari','Warlord':'Savaş Lordu','Warlords':'Savaş Lordları',
'Bowman':'Yaycı','Bowmen':'Yaycılar','Shieldbearer':'Kalkancı','Shieldbearers':'Kalkancılar','Sapper':'Lağımcı','Sappers':'Lağımcılar',
'Squire':'Çırak','Knight':'Şövalye','Lord':'Bey','Emperor':'İmparator',
'Defense':'Savunma','Economy':'Ekonomi','Close':'Kapat','Cancel':'İptal','BUILD':'KUR','Done':'Tamam','Sell':'Sat','sell':'sat',
'WOOD':'AHŞAP','STONE':'TAŞ','JEWELED':'MÜCEVHERLİ','Wood':'Ahşap','Stone':'Taş','Jeweled':'Mücevherli','STONE!':'TAŞ!','✦ JEWELED ✦':'✦ MÜCEVHERLİ ✦',
'Age I':'I. Çağ','Age II':'II. Çağ','Age III':'III. Çağ','Final Age':'Son Çağ','Final age':'Son çağ',
'VETERAN':'KIDEMLİ','Veteran':'Kıdemli','Recruit':'Acemi','LEGEND':'EFSANE','⬆ Hold':'⬆ Basılı tut',
'Score ·':'Puan ·','Era':'Devir','Wave':'Dalga','BOSS':'PATRON','Next':'Sonraki','selected':'seçili','kills':'öldürme','damage':'hasar','dmg':'hasar',
'enemies defeated':'düşman yenildi','score':'puan','wave':'dalga','enemies':'düşman','lost':'kayıp','sold':'satıldı','fallen':'düştü','Player':'Oyuncu','MVP':'MVP',
};
// templates (word order matters) — f receives match groups
const TRR=[
 [/^Need (.+) more$/,(m,a)=>a+' daha lazım'],
 [/^(.+) destroyed!$/,(m,a)=>trc(a)+' yıkıldı!'],
 [/^Researching (.+) — (\d+)s left$/,(m,a,b)=>trc(a)+' araştırılıyor — '+b+'sn kaldı'],
 [/^Researching (.+)… keep the realm alive!$/,(m,a)=>trc(a)+' araştırılıyor… krallığı ayakta tut!'],
 [/^(\d+) selected · hold one to upgrade all$/,(m,a)=>a+' seçili · hepsini yükseltmek için birine basılı tut'],
 [/^Sold (\d+) for (.*)$/,(m,a,b)=>a+' satıldı: '+b],
 [/^(.+) tier needs (.+) — advance from the Economy menu$/,(m,a,b)=>trc(a)+' seviyesi için '+trc(b)+' gerekli — Ekonomi menüsünden ilerle'],
 [/^(.+) unlocks in (.+?) — advance from the Economy menu$/,(m,a,b)=>trc(a)+', '+trc(b)+' ile açılır — Ekonomi menüsünden ilerle'],
 [/^(.+) unlocks in (.+)$/,(m,a,b)=>trc(a)+', '+trc(b)+' ile açılır'],
 [/^🔒 (.+) needs (.+)$/,(m,a,b)=>'🔒 '+trc(a)+' için '+trc(b)+' gerekli'],
 [/^Your realm held for (.+) and fell on wave (\d+)\.$/,(m,a,b)=>'Krallığın '+a+' dayandı ve '+b+'. dalgada düştü.'],
 [/^Wave (\d+) · (.+) into the battle$/,(m,a,b)=>'Dalga '+a+' · savaşta '+b],
 [/^(.+) Difficulty: (.+) — score ×([\d.]+) from now on$/,(m,a,b,c)=>a+' Zorluk: '+trc(b)+' — bundan sonra puan ×'+c],
 [/^(\d+) of (\d+) earned · saved on this device$/,(m,a,b)=>a+' / '+b+' kazanıldı · bu cihazda kayıtlı'],
 [/^BOSS WAVE (\d+)$/,(m,a)=>'PATRON DALGASI '+a],
 [/^Wave (\d+) · (.+)\. Your realm awaits\.$/,(m,a,b)=>'Dalga '+a+' · '+trc(b)+'. Krallığın seni bekliyor.'],
 [/^(.+) #(\d+) burns with the purple flame\.$/,(m,a,b)=>trc(a)+' #'+b+' mor alevle yanıyor.'],
 [/^(\d+)m ago$/,(m,a)=>a+'dk önce'],[/^(\d+)h ago$/,(m,a)=>a+'sa önce'],
 [/^🧱 (\d+) walls?$/,(m,a)=>'🧱 '+a+' duvar'],[/^(\d+) blocked\/unaffordable$/,(m,a)=>a+' kapalı/yetersiz'],
 [/^(\d+) kills · (.+) damage · (\d+)% of all damage$/,(m,a,b,c)=>a+' öldürme · '+b+' hasar · tüm hasarın %'+c+"'i"],
 [/^Stood for (.+)$/,(m,a)=>a+' ayakta kaldı'],[/^absorbed (.+) damage$/,(m,a)=>a+' hasar emdi'],[/^since (.+)$/,(m,a)=>a+' süresinden beri'],
 [/^enemies at (.+)$/,(m,a)=>'düşman, '+a+' anında'],
 [/^(\d+) · (\d+)% dmg$/,(m,a,b)=>a+' · %'+b+' hasar'],
 [/^Enemies arrive in$/,()=>'Düşmanların gelmesine:'],
 [/(⚠ BOSS|Next) in (\d+)s ⏩$/,(m,a,b)=>(a==='Next'?'Sonraki':'⚠ PATRON')+': '+b+'sn ⏩'],
 [/^(\d+)s$/,(m,a)=>a+'sn'],[/^\+([\d.]+)\/s$/,(m,a)=>'+'+a+'/sn'],
 [/^sell (\d+)$/,(m,a)=>a+' sat'],[/^Sell (\d+)$/,(m,a)=>a+' Sat'],
 [/kills · next at (\d+)/,(m,a)=>'öldürme · sonraki '+a],
 [/^(.+) selected$/,(m,a)=>a+' seçili'],
 [/(\d+) enemies defeated/,(m,a)=>a+' düşman yenildi'],
];
const _keys=Object.keys(TRD).sort((a,b)=>b.length-a.length);
const _esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const _phr=new RegExp('(^|[^A-Za-z])('+_keys.map(_esc).join('|')+')(?![A-Za-z])','g');
const _trc=new Map();
function trc(core){if(TRD[core]!==undefined)return TRD[core];let o=core;for(const [re,f] of TRR){if(re.test(o)){o=o.replace(re,f);break}}
  if(TRD[o]!==undefined)return TRD[o];return o.replace(_phr,(m,p,w)=>p+TRD[w])}
function tr(s){if(LANG!=='tr'||typeof s!=='string'||!/[A-Za-z]/.test(s))return s;let c=_trc.get(s);if(c!==undefined)return c;
  const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/);c=m[1]+trc(m[2])+m[3];if(_trc.size>4000)_trc.clear();_trc.set(s,c);return c}
// canvas text
{const P=CanvasRenderingContext2D.prototype;for(const fn of['fillText','strokeText','measureText']){const o=P[fn];P[fn]=function(t,...a){return o.call(this,tr(t),...a)}}}
// DOM text: translate every text node; remember the English original so we can switch back
function trNode(n){const cur=n.nodeValue;if(n.__tr===cur&&n.__lang===LANG)return;if(n.__tr!==cur)n.__en=cur;const t=LANG==='tr'?tr(n.__en):n.__en;n.__tr=t;n.__lang=LANG;if(t!==cur)n.nodeValue=t}
function trTree(root){if(root.nodeType===3){trNode(root);return}if(root.nodeType!==1||root.tagName==='SCRIPT'||root.tagName==='STYLE')return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const p=n.parentNode;if(p&&(p.tagName==='SCRIPT'||p.tagName==='STYLE'))continue;trNode(n)}}
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else for(const n of m.addedNodes)trTree(n)}}).observe(document.body,{subtree:true,childList:true,characterData:true});
function setLang(l){LANG=l;try{localStorage.setItem('bastion_lang',l)}catch(e){}_trc.clear();document.documentElement.lang=l;document.title=tr('Bastion 3D — Tower Defense');trTree(document.body);
  for(const id of['langPause','langStart']){const el=document.getElementById(id);if(el)for(const b of el.querySelectorAll('button'))b.classList.toggle('on',b.dataset.l===l)}}
setLang(LANG);

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, dst=(a,b,c,d)=>Math.hypot(a-c,b-d);
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
let seed=1;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function srand(s){seed=(s>>>0)||1}
function makeNoise(size){const g=new Float32Array(size*size);for(let i=0;i<g.length;i++)g[i]=rnd();
  const a=(X,Y)=>g[(((X%size)+size)%size)+((((Y%size)+size)%size))*size];
  return (x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(a(xi,yi),a(xi+1,yi),u),lerp(a(xi,yi+1),a(xi+1,yi+1),u),v)}}
const fbm=(n,x,y)=>n(x,y)*0.55+n(x*2.03+17,y*2.03+9)*0.3+n(x*4.1+3,y*4.1+31)*0.15;

// =============== WORLD DATA ===============
const A=window.ARENA,QW=80,TILE=32,GW=160,GH=160,OX=(A.seat%2)*QW,OY=(A.seat>>1)*QW;
const BASE0={tx:44,ty:34},SPAWN0={tx:6,ty:73},SPAWN20={tx:4,ty:27};const BASE={tx:44+OX,ty:34+OY},SPAWN={tx:6+OX,ty:73+OY},SPAWN2={tx:4+OX,ty:27+OY};
const SPX=SPAWN.tx*TILE+16,SPY=SPAWN.ty*TILE+16,SP2X=SPAWN2.tx*TILE+16,SP2Y=SPAWN2.ty*TILE+16;
const nearSpawn=(x,y,r)=>Math.hypot(x-SPAWN.tx,y-SPAWN.ty)<r||Math.hypot(x-SPAWN2.tx,y-SPAWN2.ty)<r;
const nearSpawn0=(x,y,r)=>Math.hypot(x-SPAWN0.tx,y-SPAWN0.ty)<r||Math.hypot(x-SPAWN20.tx,y-SPAWN20.ty)<r;const terrain0=new Uint8Array(QW*QW);const terrain=new Uint8Array(GW*GH); // 0 grass 1 light forest 2 dense forest 3 water
let reach=null;
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
function reachable(sx,sy){const seen=new Uint8Array(GW*GH),q=[sx+sy*GW];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%GW,y=(i/GW)|0;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(!seen[j]&&terrain[j]===0){seen[j]=1;q.push(j)}}}return seen}
function reachable0(sx,sy){const seen=new Uint8Array(QW*QW),q=[sx+sy*QW];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%QW,y=(i/QW)|0;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=QW||ny>=QW)continue;const j=nx+ny*QW;if(!seen[j]&&terrain0[j]===0){seen[j]=1;q.push(j)}}}return seen}
function genTerrain(){srand(9137);const n=makeNoise(64),nw=makeNoise(64);
  for(let y=0;y<QW;y++)for(let x=0;x<QW;x++){let f=fbm(n,x/9,y/9);const edge=Math.min(x,y,QW-1-x,QW-1-y);if(edge<4)f+=0.3*(4-edge)/4;
    const dB=Math.hypot(x-BASE0.tx,y-BASE0.ty),dS=Math.hypot(x-SPAWN0.tx,y-SPAWN0.ty);if(dB<12)f-=0.45*(1-dB/12)+0.08;if(dS<7)f-=0.7;if(Math.hypot(x-SPAWN20.tx,y-SPAWN20.ty)<6)f-=0.7;
    let t=f>0.6?2:f>0.53?1:0;const w=fbm(nw,x/11+40,y/11+40);if(w<0.31&&dB>15&&!nearSpawn0(x,y,11)&&edge>3)t=3;terrain0[x+y*QW]=t}
  srand(4243);for(let y=2;y<QW-2;y++)for(let x=2;x<QW-2;x++){const i=x+y*QW;if(terrain0[i]===0&&rnd()<0.014&&Math.hypot(x-BASE0.tx,y-BASE0.ty)>9&&!nearSpawn0(x,y,7))terrain0[i]=1}
  for(const SP of[SPAWN0,SPAWN20]){let seen=reachable0(SP.tx,SP.ty);
    if(!seen[BASE0.tx+BASE0.ty*QW]){let x=SP.tx,y=SP.ty;
      while(Math.hypot(x-BASE0.tx,y-BASE0.ty)>2){const a=Math.atan2(BASE0.ty-y,BASE0.tx-x)+Math.sin(x*0.3)*0.5;x+=Math.cos(a)*0.7;y+=Math.sin(a)*0.7;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=Math.round(x)+dx,Y=Math.round(y)+dy;if(X>0&&Y>0&&X<QW&&Y<QW){const i=X+Y*QW;terrain0[i]=0}}}}}
  for(let q=0;q<4;q++){const ax=(q%2)*QW,ay=(q>>1)*QW;for(let y=0;y<QW;y++)for(let x=0;x<QW;x++){let t=terrain0[x+y*QW];if(x<2||y<2||x>=QW-2||y>=QW-2)t=2;terrain[ax+x+(ay+y)*GW]=t}}
  reach=reachable(BASE.tx,BASE.ty);genDeposits()}
const DEPOS=[];
function genDeposits(){srand(31337);DEPOS.length=0;const ok=(x,y)=>{for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=x+dx+(y+dy)*GW;if(x+dx<2||y+dy<2||x+dx>=GW-2||y+dy>=GH-2||terrain[i]!==0||!reach[i])return false}return!nearSpawn(x,y,13)};
  for(const[lo,hi,n]of[[6,10,2],[12,22,3],[24,42,3]]){let tries=0,got=0;while(got<n&&tries<4000){tries++;const a=rnd()*Math.PI*2,r=lo+rnd()*(hi-lo),x=Math.round(BASE.tx+Math.cos(a)*r),y=Math.round(BASE.ty+Math.sin(a)*r);
    if(!ok(x,y)||DEPOS.some(d=>Math.hypot(d.tx-x,d.ty-y)<7))continue;DEPOS.push({tx:x,ty:y});got++}}}
const depAt=(tx,ty)=>DEPOS.find(d=>d.tx===tx&&d.ty===ty);
const onDeposit=(tx,ty,s)=>DEPOS.some(d=>tx<d.tx+2&&tx+s>d.tx&&ty<d.ty+2&&ty+s>d.ty);
function buildDeposits(){for(const d of DEPOS){const parts=[];for(let i=0;i<7;i++){const a=i*0.9,r=0.25+(i%3)*0.18;parts.push(P(dod(0.18+(i%3)*0.07),['#8a867c','#77736b','#9a958a'][i%3],1+Math.cos(a)*r,0.08,1+Math.sin(a)*r,i,i*0.7,0,1,0.7,1))}
    for(let i=0;i<10;i++)parts.push(P(oct(0.05+(i%3)*0.025),GOLD,1+Math.cos(i*2.1)*0.45,0.12+(i%2)*0.1,1+Math.sin(i*2.1)*0.45));
    const m=new THREE.Mesh(merge(parts),VM);m.position.set(d.tx,heightAt(d.tx+1,d.ty+1),d.ty);m.castShadow=true;scene.add(m);d.mesh=m;
    const sp=new THREE.Mesh(oct(0.09),new THREE.MeshBasicMaterial({color:'#fff2a0'}));sp.position.set(d.tx+1,heightAt(d.tx+1,d.ty+1)+0.45,d.ty+1);scene.add(sp);d.spark=sp}}
const HR=2,HN=GW*HR+1,hgt=new Float32Array(HN*HN);
function genHeights(){srand(51);const nh=makeNoise(64);
  for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const X=(i/HR)%QW,Z=(j/HR)%QW;let h=(fbm(nh,X/12,Z/12)-0.5)*2.6;
    const dB=Math.hypot(X-BASE0.tx-1,Z-BASE0.ty-1),dS=Math.hypot(X-SPAWN0.tx-0.5,Z-SPAWN0.ty-0.5);h*=smooth(7,17,dB)*smooth(5,11,dS)*smooth(5,11,Math.hypot(X-SPAWN20.tx-0.5,Z-SPAWN20.ty-0.5));
    const e=Math.min(X,Z,QW-X,QW-Z);if(e<7)h+=(7-e)*0.42;
    let wc=0,dc=0,tc=0;for(const ox of[-0.25,0.25])for(const oz of[-0.25,0.25]){const tx=Math.floor(X+ox),tz=Math.floor(Z+oz);if(tx<0||tz<0||tx>=QW||tz>=QW)continue;tc++;const t=terrain0[tx+tz*QW];if(t===3)wc++;if(t===2)dc++}
    if(tc&&wc===tc)h=-0.95;else if(wc>0)h=-0.5;else{h=Math.max(h,-0.15)+dc*0.05}
    hgt[i+j*HN]=h}}
function heightAt(X,Z){const gx=clamp(X*HR,0,HN-1.001),gz=clamp(Z*HR,0,HN-1.001),i=gx|0,j=gz|0,fx=gx-i,fz=gz-j;
  return lerp(lerp(hgt[i+j*HN],hgt[i+1+j*HN],fx),lerp(hgt[i+(j+1)*HN],hgt[i+1+(j+1)*HN],fx),fz)}
const tAt=(X,Z)=>{const x=Math.floor(X),z=Math.floor(Z);return(x<0||z<0||x>=GW||z>=GH)?2:terrain[x+z*GW]};

// =============== RENDERER / SCENE ===============
const cv=$('game'),ov=$('ov'),octx=ov.getContext('2d');
let W=innerWidth,H=innerHeight,DPR=Math.min(2,devicePixelRatio||1);
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(DPR);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();const SKY=new THREE.Color('#a9cde0');scene.background=SKY;scene.fog=new THREE.Fog(SKY,40,90);
const camera=new THREE.PerspectiveCamera(W<H?40:32,W/H,0.5,600);
scene.add(new THREE.HemisphereLight('#dcefff','#6b5634',1.25));
const sun=new THREE.DirectionalLight('#fff0d2',2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.04;
sun.shadow.camera.near=1;sun.shadow.camera.far=90;scene.add(sun,sun.target);
const SUNOFF=new THREE.Vector3(-16,30,-10);
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(2,devicePixelRatio||1);renderer.setPixelRatio(DPR);renderer.setSize(W,H,false);camera.aspect=W/H;camera.fov=W<H?40:32;camera.updateProjectionMatrix();ov.width=Math.round(W*DPR);ov.height=Math.round(H*DPR)}
addEventListener('resize',resize);

// ---------- geometry helpers ----------
const VM=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d), cyl=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s), cone=(r,h,s)=>new THREE.ConeGeometry(r,h,s),
  sph=(r,w=7,h=5)=>new THREE.SphereGeometry(r,w,h), ico=(r,d=0)=>new THREE.IcosahedronGeometry(r,d), dod=(r)=>new THREE.DodecahedronGeometry(r,0), oct=(r)=>new THREE.OctahedronGeometry(r,0),
  prism=(r,len)=>new THREE.CylinderGeometry(r,r,len,3).rotateZ(Math.PI/2).rotateX(-Math.PI/2);
function P(geo,hex,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){let g=geo.index?geo.toNonIndexed():geo;if(g.attributes.uv)g.deleteAttribute('uv');if(g.attributes.uv1)g.deleteAttribute('uv1');
  if(sx!==1||sy!==1||sz!==1)g.scale(sx,sy,sz);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);g.translate(x,y,z);
  const n=g.attributes.position.count,c=new THREE.Color(hex),a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}
function merge(list){let n=0;for(const g of list)n+=g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),cl=new Float32Array(n*3);let o=0;
  for(const g of list){pos.set(g.attributes.position.array,o);nor.set(g.attributes.normal.array,o);cl.set(g.attributes.color.array,o);o+=g.attributes.position.count*3}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('color',new THREE.BufferAttribute(cl,3));m.computeBoundingSphere();return m}
const WHITE=new THREE.Color(1,1,1),FLASH=new THREE.Color(2.6,2.2,2.2);
const STONE='#aaa496',STONE2='#8f897c',STONED='#6c675d',WOOD='#7d5432',WOODD='#4a311b',ROOFR='#94402a',BLUE='#2f62c0',GOLD='#e8c24a',RED='#b8322a';

// =============== GROUND ===============
let groundGeo,ground,groundTex;const GT=2048,gtc=document.createElement('canvas');
function paintGround(){gtc.width=gtc.height=GT;const g=gtc.getContext('2d');srand(777);const n=makeNoise(48),n2=makeNoise(48);
  const L=GW*4,lo=document.createElement('canvas');lo.width=lo.height=L;const lg=lo.getContext('2d'),id=lg.createImageData(L,L);
  for(let y=0;y<L;y++)for(let x=0;x<L;x++){const X=(x+0.5)/4,Z=(y+0.5)/4,t=tAt(X,Z);const v=fbm(n,X/7,Z/7),w=n2(X*0.8,Z*0.8);
    let r=94+v*36+w*10,gr=134+v*34+w*8,b=50+v*14;const h=heightAt(X,Z);r+=h*7;gr+=h*9;
    if(t===1){r-=14;gr-=8;b-=8}if(t===2){r-=40;gr-=38;b-=18}
    const dry=n2(X/4.5+50,Z/4.5+50);if(dry>0.68&&t===0){const k=Math.min(1,(dry-0.68)*3);r+=k*52;gr+=k*20;b+=k*6}
    let near=0;for(const[ox,oz]of[[0.9,0],[-0.9,0],[0,0.9],[0,-0.9],[0.6,0.6],[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6]])if(tAt(X+ox,Z+oz)===3)near=1;
    if(t===3||near){const k=t===3?1:0.75;r=lerp(r,206,k);gr=lerp(gr,188,k);b=lerp(b,132,k);if(t===3&&h<-0.7){r=lerp(r,120,0.5);gr=lerp(gr,130,0.5);b=lerp(b,96,0.5)}}
    const dS=Math.min(Math.hypot(X-SPAWN.tx-0.5,Z-SPAWN.ty-0.5),Math.hypot(X-SPAWN2.tx-0.5,Z-SPAWN2.ty-0.5));if(dS<6){const k=(1-dS/6)*0.75;r=lerp(r,130,k);gr=lerp(gr,100,k);b=lerp(b,62,k)}
    const o=(x+y*L)*4;id.data[o]=r;id.data[o+1]=gr;id.data[o+2]=b;id.data[o+3]=255}
  lg.putImageData(id,0,0);g.imageSmoothingEnabled=true;g.drawImage(lo,0,0,GT,GT);
  const S=GT/GW;const cols=['rgba(40,72,20,0.32)','rgba(150,178,80,0.3)','rgba(55,92,28,0.38)','rgba(185,198,105,0.2)'];
  for(const c of cols){g.fillStyle=c;for(let i=0;i<26000;i++){const x=rnd()*GT,y=rnd()*GT;if(tAt(x/S,y/S)===3)continue;g.fillRect(x,y,1+rnd()*1.5,2+rnd()*3)}}
  for(let i=0;i<2600;i++){const x=rnd()*GT,y=rnd()*GT;if(tAt(x/S,y/S)!==0)continue;g.fillStyle=['#f3e6a0','#e8a0b8','#ffffff','#c9b2f0','#f0c060'][(rnd()*5)|0];g.fillRect(x,y,2,2)}
  // worn path from the enemy camp — enemies walk it
  g.strokeStyle='rgba(125,100,60,0.18)';g.lineWidth=S*1.6;g.lineCap='round';g.beginPath();g.moveTo(SPX/TILE*S,SPY/TILE*S);g.quadraticCurveTo((30+OX)*S,(52+OY)*S,BASE.tx*S,(BASE.ty+2)*S);g.stroke()}
function buildGround(){groundGeo=new THREE.PlaneGeometry(GW,GH,GW*HR,GH*HR);groundGeo.rotateX(-Math.PI/2);groundGeo.translate(GW/2,0,GH/2);
  const p=groundGeo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,hgt[i]);groundGeo.computeVertexNormals();
  groundTex=new THREE.CanvasTexture(gtc);groundTex.colorSpace=THREE.SRGBColorSpace;groundTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  ground=new THREE.Mesh(groundGeo,new THREE.MeshLambertMaterial({map:groundTex}));ground.receiveShadow=true;scene.add(ground);
  const sh=new THREE.Shape([new THREE.Vector2(-300,-300),new THREE.Vector2(460,-300),new THREE.Vector2(460,460),new THREE.Vector2(-300,460)]);
  sh.holes.push(new THREE.Path([new THREE.Vector2(0.5,0.5),new THREE.Vector2(0.5,GH-0.5),new THREE.Vector2(GW-0.5,GH-0.5),new THREE.Vector2(GW-0.5,0.5)]));
  const og=new THREE.ShapeGeometry(sh);og.rotateX(Math.PI/2);const outer=new THREE.Mesh(og,new THREE.MeshLambertMaterial({color:'#4a6a30',side:THREE.DoubleSide}));outer.position.y=2.2;outer.receiveShadow=true;scene.add(outer);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(GW,GH).rotateX(-Math.PI/2),new THREE.MeshPhongMaterial({color:'#3e86b2',transparent:true,opacity:0.82,shininess:60,specular:new THREE.Color('#4a6478')}));
  water.position.set(GW/2,-0.32,GH/2);water.receiveShadow=true;scene.add(water)}
function flattenAt(tx,ty,s){const cx=tx+s/2,cz=ty+s/2;const target=Math.max(-0.1,heightAt(cx,cz)),m=0.8;const p=groundGeo.attributes.position;
  for(let j=Math.floor((ty-m)*HR);j<=Math.ceil((ty+s+m)*HR);j++)for(let i=Math.floor((tx-m)*HR);i<=Math.ceil((tx+s+m)*HR);i++){if(i<0||j<0||i>=HN||j>=HN)continue;
    const X=i/HR,Z=j/HR,dx=Math.max(tx-X,0,X-tx-s),dz=Math.max(ty-Z,0,Z-ty-s),d=Math.hypot(dx,dz);const w=d<=0?1:1-smooth(0,m,d);if(w<=0)continue;
    const k=i+j*HN;hgt[k]=lerp(hgt[k],target,w);p.setY(k,hgt[k])}
  p.needsUpdate=true;groundGeo.computeVertexNormals();return target}

// =============== FORESTS & DECOR ===============
const decidGeo=merge([P(cyl(0.07,0.1,0.5,5),'#5a3d22',0,0.25,0),P(ico(0.44,0),'#3f7a2e',0,0.78,0),P(ico(0.32,0),'#4d8c36',0.2,0.98,0.08),P(ico(0.3,0),'#5a9a3e',-0.16,0.95,-0.14),P(ico(0.2,0),'#68a846',0.02,1.2,0.05)]);
const pineGeo=merge([P(cyl(0.05,0.08,0.4,5),'#4e3420',0,0.2,0),P(cone(0.44,0.62,7),'#2f5a2a',0,0.62,0),P(cone(0.34,0.52,7),'#38682f',0,0.93,0),P(cone(0.22,0.42,7),'#427536',0,1.2,0)]);
function buildForest(){srand(4242);const chunks=new Map();const m=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),s=new THREE.Vector3(),c=new THREE.Color(),UP=new THREE.Vector3(0,1,0);
  const add=(X,Z,sc,dark,pine)=>{const key=((X/10)|0)+'_'+((Z/10)|0)+(pine?'p':'d');if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push([X,Z,sc,dark])};
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const t=terrain[x+y*GW];
    if(t===2){for(let k=0;k<2;k++)add(x+0.2+rnd()*0.6,y+0.2+rnd()*0.6,0.95+rnd()*0.45,1,rnd()<0.38)}
    else if(t===1){const k=rnd()<0.65?1:2;for(let i=0;i<k;i++)add(x+0.15+rnd()*0.7,y+0.15+rnd()*0.7,0.7+rnd()*0.35,0,rnd()<0.28)}
}
  // trees ringing the outside of the map
  for(let i=0;i<1400;i++){const a=rnd()*Math.PI*2,r=114+rnd()*34;const X=GW/2+Math.cos(a)*r,Z=GH/2+Math.sin(a)*r;if(X>1&&X<GW-1&&Z>1&&Z<GH-1)continue;add(X,Z,1+rnd()*0.5,1,rnd()<0.5)}
  for(const[key,list]of chunks){const pine=key.endsWith('p');const im=new THREE.InstancedMesh(pine?pineGeo:decidGeo,VM,list.length);
    list.forEach(([X,Z,sc,dark],i)=>{const Y=(X<0||Z<0||X>GW||Z>GH)?2.0:heightAt(X,Z);q.setFromAxisAngle(UP,rnd()*6.28);v.set(X,Y-0.05,Z);s.set(sc,sc*(0.9+rnd()*0.25),sc);m.compose(v,q,s);im.setMatrixAt(i,m);
      const k=dark?0.72+rnd()*0.15:0.92+rnd()*0.2;c.setRGB(k,k*(0.97+rnd()*0.08),k);im.setColorAt(i,c)});
    im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();im.computeBoundingBox&&im.computeBoundingBox();scene.add(im)}
  // rocks
  const rockGeo=merge([P(dod(0.5),'#9a968b')]);const rocks=[];for(let i=0;i<800;i++){const X=1+rnd()*158,Z=1+rnd()*158;if(tAt(X,Z)!==0||Math.hypot(X-BASE.tx,Z-BASE.ty)<9)continue;rocks.push([X,Z,0.08+rnd()*0.18])}
  const rim=new THREE.InstancedMesh(rockGeo,VM,rocks.length);rocks.forEach(([X,Z,sc],i)=>{q.setFromEuler(new THREE.Euler(rnd(),rnd()*6,rnd()));v.set(X,heightAt(X,Z),Z);s.set(sc,sc*0.6,sc);m.compose(v,q,s);rim.setMatrixAt(i,m);const k=0.85+rnd()*0.3;c.setRGB(k,k,k*0.95);rim.setColorAt(i,c)});
  rim.castShadow=true;rim.receiveShadow=true;scene.add(rim)}
let campFire=[];
function buildCamp(){buildCampAt(SPX/TILE,SPY/TILE);buildCampAt(SP2X/TILE,SP2Y/TILE)}
function buildCampAt(X0,Z0){const parts=[];
  for(const[dx,dz]of[[-1.9,-0.9],[0.9,-1.6],[1.9,0.9],[-0.9,1.6],[-2.5,1.2]]){const x=X0+dx,z=Z0+dz,y=heightAt(x,z);
    parts.push(P(cone(0.55,0.85,4),'#a82a20',x,y+0.42,z,0,Math.PI/4),P(box(0.18,0.32,0.05),'#3a1510',x,y+0.16,z+0.38),P(cyl(0.02,0.02,0.3,4),WOODD,x,y+0.95,z))}
  const y0=heightAt(X0,Z0);parts.push(P(cyl(0.035,0.035,1.6,5),WOODD,X0+0.2,y0+0.8,Z0-0.3),P(box(0.6,0.36,0.02),'#c0302a',X0+0.5,y0+1.4,Z0-0.3));
  for(let i=0;i<14;i++){const a=i/14*Math.PI*1.4+2.2,x=X0+Math.cos(a)*3.3,z=Z0+Math.sin(a)*3.0;parts.push(P(cyl(0.06,0.07,0.7,5),'#6b4a2a',x,heightAt(x,z)+0.3,z),P(cone(0.07,0.15,5),'#6b4a2a',x,heightAt(x,z)+0.72,z))}
  parts.push(P(cyl(0.3,0.34,0.08,8),'#5a5650',X0+0.1,y0+0.04,Z0+0.2));
  const mesh=new THREE.Mesh(merge(parts),VM);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const fm=new THREE.MeshBasicMaterial({color:'#ffa030'});for(let i=0;i<3;i++){const f=new THREE.Mesh(cone(0.12-i*0.03,0.35,5),fm);f.position.set(X0+0.1+(i-1)*0.08,y0+0.2,Z0+0.2+(i%2)*0.06);scene.add(f);campFire.push(f)}}

// =============== DEFINITIONS (gameplay) ===============
const BT={
  archer:{name:'Archer Tower',ic:'🏹',kind:'def',size:2,cost:{grain:80,wool:40,gold:0},hp:360,range:195,dmg:9,rate:0.8,desc:'Fast arrows. Weak vs rams.'},
  cannon:{name:'Cannon Tower',ic:'💣',kind:'def',size:2,cost:{grain:160,wool:110,gold:60},hp:500,range:235,dmg:36,rate:2.2,splash:60,desc:'Slow, heavy splash. Smashes rams.'},
  barracks:{name:'Soldier Tower',ic:'🛡️',kind:'def',size:2,cost:{grain:280,wool:220,gold:160},hp:620,squad:5,respawn:9,guard:560,desc:'Knights guard a big zone & replenish.'},
  wall:{name:'Wall',ic:'🧱',kind:'def',size:1,cost:{grain:30,wool:10,gold:0},hp:900,desc:'Huge health, no attack. Channel the enemy.'},
  wheat:{name:'Wheat Field',ic:'🌾',kind:'eco',size:3,cost:{grain:50,wool:0,gold:0},hp:160,prod:{grain:1.2},desc:'+1.2 grain / sec'},
  sheep:{name:'Sheep Farm',ic:'🐑',kind:'eco',size:3,cost:{grain:120,wool:0,gold:0},hp:190,prod:{wool:0.8},desc:'+0.8 wool / sec'},
  mine:{name:'Gold Mine',ic:'🪙',kind:'eco',size:2,cost:{grain:180,wool:90,gold:0},hp:320,prod:{gold:0.5},desc:'+0.5 gold / sec · only on gold deposits'},
};
const ET={
  spear:{name:'Spearman',hp:32,speed:24,dmg:6,rate:1.0,range:14,r:7,bounty:3},
  ram:{name:'Battering Ram',hp:400,speed:13,dmg:40,rate:2.0,range:16,r:13,bldOnly:true,arrowRes:0.3,bounty:20},
  cav:{name:'Cavalry',hp:95,speed:54,dmg:9,rate:0.8,range:16,r:10,bounty:8},
  boss:{name:'Warlord',hp:1700,speed:16,dmg:32,rate:1.2,range:18,r:15,bounty:90},
  bowman:{name:'Bowman',hp:26,speed:24,dmg:5,rate:1.5,range:150,r:7,bounty:4,ranged:true},
  shield:{name:'Shieldbearer',hp:80,speed:19,dmg:7,rate:1.1,range:14,r:9,arrowRes:0.35,bounty:6},
  sapper:{name:'Sapper',hp:38,speed:34,dmg:300,rate:1,range:14,r:7,bounty:6,sapper:true},
};
const KN={hp:140,dmg:14,rate:0.8,speed:66,r:12};
const MAXLVL=3,MUL=[1,2.2,4.5],HPM=[1,2.5,6],RNG=[1,1.15,1.32],CDM=[1,1.15,1.35],SQ=[5,7,9],ZONE=[560,690,820],TIERN=['','WOOD','STONE','JEWELED'];
const VETK={archer:[10,25,60,120,250],cannon:[6,15,35,70,140],barracks:[8,20,45,90,180]},VETM=[1,1.15,1.3,1.5,1.75,2],VETC=['','#ff9a2a','#ff6a14','#ffe68a','#4aa8ff','#b040ff'],VETN=['','I','II','III','IV','V'];
const vetOf=b=>b.vet||0,vetCD=b=>vetOf(b)>=3?1.15:1;
function checkVet(b){const th=VETK[b.type];if(!th||!b.st)return;let r=0;for(const t of th)if(b.st.kills>=t)r++;if(r>(b.vet||0)){b.vet=r;const c=VETC[r];texts.push({X:b.X,Y:b.Y+b.barH+0.5,Z:b.Z,s:`🔥 VETERAN ${VETN[r]}`,life:2,c,big:1});
  fx(b.X,b.Y+b.top,b.Z,18+r*6,c,2.4,0.14+r*0.03,0.9,-1.5,1,1.4);AU.levelUp(Math.min(3,r));if(r===5)showBanner('LEGENDARY',`${BT[b.type].name} #${b.st.n} burns with the purple flame.`)}}
const mulOf=b=>MUL[b.lvl-1],hpMulOf=b=>HPM[b.lvl-1],rangeOf=b=>(BT[b.type].range||0)*RNG[b.lvl-1]*((b.vet||0)>=2?1.05:1),squadSize=b=>SQ[b.lvl-1],zoneR=b=>ZONE[b.lvl-1],respawnTime=b=>BT.barracks.respawn/[1,1.4,1.9][b.lvl-1];
function upCost(b){const c=BT[b.type].cost;if(b.lvl===1)return{grain:Math.round((c.grain+60)*3),wool:Math.round((c.wool+40)*3),gold:Math.round((c.gold+40)*2)};return{grain:Math.round((c.grain+60)*9),wool:Math.round((c.wool+40)*9),gold:Math.round((c.gold+60)*8)}}
function repCost(b){const m=b.maxhp-b.hp,k=b.type==='wall'?0.12:0.4;return{grain:Math.ceil(m*k),wool:Math.ceil(m*k*0.25),gold:0}}
const costSum=c=>c.grain+c.wool*1.5+c.gold*3;
const AGEC=[null,null,{grain:450,wool:300,gold:150},{grain:1500,wool:1100,gold:800}],AGEN=['','Age I','Age II','Age III'],AGEREQ={cannon:2,barracks:2};
const SCALE={archer:0.15,cannon:0.15,barracks:0.25,wheat:0.1,sheep:0.1,mine:0.1,wall:0};
function costOf(type){const c=BT[type].cost,n=buildings?buildings.filter(b=>b.type===type).length:0,f=1+(SCALE[type]||0)*n;const r5=v=>Math.round(v*f/5)*5;return{grain:r5(c.grain),wool:r5(c.wool),gold:r5(c.gold)}}
const locked=type=>(AGEREQ[type]||1)>age;
let res;
const afford=c=>res.grain>=c.grain&&res.wool>=c.wool&&res.gold>=c.gold;
function pay(c){res.grain-=c.grain;res.wool-=c.wool;res.gold-=c.gold;if(ST)for(const k in ST.spent)ST.spent[k]+=c[k]||0}
// ---------- battle statistics ----------
let ST=null,waveHeld=false,age=1,fires=[];
const DIFF=[{n:'Squire',ic:'🌱',spd:0.9,hp:0.85,gap:1.25,ai:0,sm:0.6,d:'Relaxed. Enemies take the shortest road and arrive slowly.'},{n:'Knight',ic:'⚔️',spd:1,hp:1,gap:1,ai:1,sm:1,d:'The standard campaign.'},
  {n:'Lord',ic:'🦅',spd:1.06,hp:1,gap:0.88,ai:2,sm:1.5,d:'Clever foes: dodge kill zones, mass before charging, raid farms, kite knights.'},{n:'Emperor',ic:'👑',spd:1.12,hp:1.1,gap:0.78,ai:3,sm:2.2,d:'Ruthless: reads your defenses and counters them, pincers both fronts, lures your knights.'}];
let diff=1;try{const v=localStorage.getItem('bastion_diff');if(v!=null)diff=clamp(+v,0,3)}catch(e){}
let score=0,grpState={},lureNext=0;const AI=()=>DIFF[diff].ai;
function newStats(){ST={samples:[],acc:{a:0,c:0,k:0,taken:0,g:0,w:0,o:0},sampT:0,earned:{grain:0,wool:0,gold:0},spent:{grain:0,wool:0,gold:0},dmgBy:{archer:0,cannon:0,barracks:0},killsBy:{archer:0,cannon:0,barracks:0},
  killsE:{spear:0,bowman:0,shield:0,sapper:0,ram:0,cav:0,boss:0},built:0,lost:0,sold:0,upgrades:0,peakE:0,peakT:0,bosses:[],taken:0,all:[],cnt:{},kLost:0,bestWave:0}}
function stSample(force){const a=ST.acc,dt=ST.sampT||5;ST.samples.push({t:time,a:a.a/dt,c:a.c/dt,k:a.k/dt,taken:a.taken/dt,g:a.g/dt*60,w:a.w/dt*60,o:a.o/dt*60,e:enemies.length,b:buildings.length,wave});
  for(const k in a)a[k]=0;ST.sampT=0}
const SRCK={archer:'a',cannon:'c',barracks:'k'};
function addScore(v){score+=v*DIFF[diff].sm;if(ST)ST.score=score}
function hitEnemy(e,d,src){const real=Math.min(d,Math.max(0,e.hp));e.hp-=d;if(src&&src.st){src.st.dmg+=real;ST.dmgBy[src.type]+=real;ST.acc[SRCK[src.type]]+=real;if(e.hp<=0&&!e.killedBy)e.killedBy=src}}

function costHTML(c){const p=[];for(const[k,ic]of[['grain','🌾'],['wool','🐑'],['gold','🪙']])if(c[k])p.push(`<span class="${res[k]<c[k]?'bad':''}">${ic}${c[k]}</span>`);return `<span class="cost">${p.join(' ')||'free'}</span>`}

// =============== BUILDING MODELS — tiers: 1 WOOD · 2 STONE · 3 JEWELED METAL ===============
const GLOWM=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false});
const MM=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:140,specular:new THREE.Color('#ffffff')});
const LOG='#8a5a30',LOGD='#5e3c1e',THATCH='#c9a24a',THATCHD='#a07c32',SILVER='#dfe4ec',SILVERD='#a3adbd',GOLDM='#f3c440',ENAMEL='#2a50b8',RUBY='#ff2850',SAPH='#3aa8ff',EMER='#30ff95',MARBLE='#efe8d6';
function flagM(group,anims,x,y,z,col,ph=0){const m=new THREE.Mesh(merge([P(box(0.42,0.26,0.015),col,0.21,0,0),P(box(0.12,0.08,0.02),GOLD,0.12,0.02,0)]),VM);m.position.set(x,y,z);m.castShadow=true;group.add(m);
  anims.push(t=>{m.rotation.y=Math.sin(t*2.4+ph)*0.4+0.3;m.scale.x=0.92+0.08*Math.sin(t*5+ph)})}
function crenSquare(arr,half,y,col,sz=0.2){for(let i=-2;i<=2;i++){const o=i*half*0.4;arr.push(P(box(sz,0.22,sz),col,o,y,half),P(box(sz,0.22,sz),col,o,y,-half));if(Math.abs(i)<2)arr.push(P(box(sz,0.22,sz),col,half,y,o),P(box(sz,0.22,sz),col,-half,y,o))}}
function beacon(group,anims,x,y,z,col){const c=new THREE.Mesh(oct(0.18),new THREE.MeshBasicMaterial({color:col}));const h=new THREE.Mesh(sph(0.5,12,8),GLOWM(col,0.3));c.position.set(x,y,z);h.position.set(x,y,z);group.add(c,h);
  anims.push(t=>{c.rotation.y=t*1.7;c.position.y=y+Math.sin(t*2)*0.07;h.position.y=c.position.y;h.scale.setScalar(0.8+0.25*Math.sin(t*3.1))})}
function aura(group,anims,S){const m=new THREE.Mesh(new THREE.RingGeometry(S*0.6,S*0.72,56).rotateX(-Math.PI/2),GLOWM('#ffe27a',0.35));m.position.y=0.07;group.add(m);
  anims.push(t=>{m.material.opacity=0.22+0.16*Math.sin(t*2.3);m.rotation.y=t*0.3});
  anims.push((t,b)=>{if(b&&Math.random()<0.06)fx(b.X+(Math.random()-.5)*S*0.9,b.Y+0.2+Math.random()*1.5,b.Z+(Math.random()-.5)*S*0.9,1,['#ffe27a','#9fe8ff','#ff8ab0'][(Math.random()*3)|0],0.25,0.06,1.4,-0.6,1,1)})}
const gemAt=(arr,x,y,z,r,c)=>arr.push(P(oct(r),c,x,y,z));
function wheatMesh(group,anims,L,skip){const wg=[];for(let r=0;r<10;r++)for(let i=0;i<14;i++){const x=-1.25+i*0.19+((r%2)*0.08),z=-1.28+r*0.284;if(skip(x,z))continue;wg.push(P(box(0.09,0.34,0.09),'#ffffff',x,0.17,z))}
  const wmat=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,color:'#e0bb4f'});if(L===3){wmat.emissive=new THREE.Color('#5a4000')}
  const wheat=new THREE.Mesh(merge(wg),wmat);wheat.castShadow=true;wheat.receiveShadow=true;group.add(wheat);
  const ph=Math.random()*6,cA=new THREE.Color(L===3?'#f0d060':L===2?'#a8b84a':'#8fb24a'),cB=new THREE.Color(L===3?'#ffe680':'#e3bd50');
  anims.push(t=>{const g=0.5+0.5*Math.sin(t*0.22+ph);wheat.scale.y=(L===3?0.75:0.35)+(L===3?0.35:0.65)*g;wmat.color.copy(cA).lerp(cB,g);wheat.rotation.z=Math.sin(t*1.3+ph)*0.012})}
function windmill(group,anims,parts,metal,gems,mx,mz,L){const tw=L===3?metal:parts;
  if(L===2){parts.push(P(cyl(0.22,0.32,1.4,8),'#d9cdb0',mx,0.7,mz),P(cyl(0.36,0.4,0.3,8),STONE2,mx,0.15,mz),P(cone(0.36,0.5,8),ROOFR,mx,1.65,mz),P(box(0.13,0.22,0.04),'#3a2414',mx,0.15,mz+0.33))}
  else{metal.push(P(cyl(0.22,0.32,1.6,8),SILVER,mx,0.8,mz),P(cyl(0.34,0.34,0.06,8),GOLDM,mx,0.5,mz),P(cyl(0.3,0.3,0.06,8),GOLDM,mx,1.2,mz),P(cone(0.38,0.55,8),ENAMEL,mx,1.88,mz),P(sph(0.07),GOLDM,mx,2.2,mz));gemAt(gems,mx,1.0,mz+0.3,0.07,SAPH)}
  const blades=merge([0,1,2,3].map(i=>P(box(0.1,0.78,0.015),L===3?'#fff4d0':'#efe6d0',0,0.4,0,0,0,i*Math.PI/2)).concat([P(cyl(0.06,0.06,0.09,6),L===3?GOLDM:WOODD,0,0,0,Math.PI/2)]));
  const bl=new THREE.Mesh(blades,L===3?MM:VM);bl.position.set(mx,L===3?1.45:1.32,mz+0.32);bl.castShadow=true;group.add(bl);anims.push(t=>{bl.rotation.z=-t*(L===3?2.4:1.5)})}
function fenceRing(arr,L,h){const post=L===1?WOODD:L===2?STONE2:GOLDM,rail=L===1?WOOD:L===2?STONE:SILVER;
  if(L===2){for(const z of[1.42,-1.42])arr.push(P(box(2.92,0.28,0.14),STONE2,0,0.14,z));for(const x of[1.42,-1.42])arr.push(P(box(0.14,0.28,2.92),STONE2,x,0.14,0));for(let i=0;i<=6;i++){const o=-1.42+i*0.473;for(const[x,z]of[[o,1.42],[o,-1.42],[1.42,o],[-1.42,o]])arr.push(P(box(0.18,0.1,0.18),STONE,x,0.33,z))}return}
  for(let i=0;i<=6;i++){const o=-1.45+i*0.483;for(const[x,z]of[[o,1.45],[o,-1.45],[1.45,o],[-1.45,o]])arr.push(P(box(0.07,h,0.07),post,x,h/2,z))}
  for(const yy of[h*0.45,h*0.85]){for(const z of[1.45,-1.45])arr.push(P(box(2.9,0.04,0.03),rail,0,yy,z));for(const x of[1.45,-1.45])arr.push(P(box(0.03,0.04,2.9),rail,x,yy,0))}}
function buildModel(type,L,nb){const group=new THREE.Group(),anims=[],parts=[],metal=[],gems=[],glow=[];let top=1,barH=2;const r2=Math.SQRT2;
  // ---------------- ARCHER ----------------
  if(type==='archer'){
    if(L===1){const H=2.2;top=H+0.4;barH=H+1.9;
      for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(cyl(0.075,0.1,H+0.1,6),LOG,sx*0.56,H/2,sz*0.56));
      for(const yy of[0.55,1.4]){parts.push(P(box(1.2,0.07,0.07),LOGD,0,yy,0.56),P(box(1.2,0.07,0.07),LOGD,0,yy,-0.56),P(box(0.07,0.07,1.2),LOGD,0.56,yy,0),P(box(0.07,0.07,1.2),LOGD,-0.56,yy,0))}
      for(const s of[-1,1]){parts.push(P(box(0.06,1.25,0.06),LOGD,0,0.98,0.56,0,0,s*0.72),P(box(0.06,1.25,0.06),LOGD,0.56,0.98,0,s*0.72))}
      parts.push(P(box(1.5,0.14,1.5),LOG,0,H,0));for(let i=0;i<7;i++)parts.push(P(box(1.5,0.02,0.02),LOGD,0,H+0.075,-0.66+i*0.22));
      for(let i=0;i<4;i++){const o=-0.66+i*0.44;for(const[x,z]of[[o,0.7],[o,-0.7],[0.7,o],[-0.7,o]])parts.push(P(box(0.06,0.4,0.06),LOGD,x,H+0.27,z))}
      for(const z of[0.7,-0.7])parts.push(P(box(1.46,0.05,0.05),LOG,0,H+0.45,z));for(const x of[0.7,-0.7])parts.push(P(box(0.05,0.05,1.46),LOG,x,H+0.45,0));
      for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(cyl(0.04,0.04,0.75,5),LOGD,sx*0.62,H+0.42,sz*0.62));
      parts.push(P(cone(1.15,0.85,8),THATCH,0,H+1.2,0),P(cone(1.18,0.14,8),THATCHD,0,H+0.82,0));
      for(const x of[-0.18,0.18])parts.push(P(box(0.05,H,0.05),LOGD,x,H/2,0.72,-0.12));for(let i=0;i<8;i++)parts.push(P(box(0.36,0.04,0.04),LOGD,0,0.2+i*0.26,0.72+(0.2+i*0.26-H/2)*0.12));
      parts.push(P(cyl(0.07,0.08,0.24,6),BLUE,0.3,H+0.2,0.25),P(sph(0.06),'#d9a27a',0.3,H+0.38,0.25),P(cone(0.065,0.08,6),'#7a5a3a',0.3,H+0.45,0.25),P(cyl(0.012,0.012,0.5,4),WOODD,0,H+1.85,0));
      flagM(group,anims,0,H+2.02,0,BLUE)}
    else if(L===2){const h=2.75,y0=0.1+h;top=y0+0.4;
      parts.push(P(box(1.95,0.5,1.95),STONED,0,-0.15,0),P(box(1.86,0.12,1.86),STONE2,0,0.12,0),P(cyl(0.62*r2,0.77*r2,h,4),STONE,0,0.1+h/2,0,0,Math.PI/4),P(cyl(0.8*r2,0.8*r2,0.14,4),STONE2,0,0.38,0,0,Math.PI/4),P(cyl(0.7*r2,0.7*r2,0.1,4),STONE2,0,0.1+h*0.55,0,0,Math.PI/4),P(cyl(0.67*r2,0.67*r2,0.1,4),STONE2,0,0.1+h*0.82,0,0,Math.PI/4));
      for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(box(0.27,h*0.42,0.27),STONE2,sx*0.7,0.1+h*0.21,sz*0.7),P(cone(0.21,0.26,4),STONE2,sx*0.7,0.1+h*0.42+0.13,sz*0.7,0,Math.PI/4));
      for(const yy of[0.48,0.72]){const o=0.77-0.15*yy+0.005;parts.push(P(box(0.08,0.26,0.05),'#2a2420',0.2,0.1+h*yy,o),P(box(0.05,0.26,0.08),'#2a2420',o,0.1+h*yy,-0.2))}
      const o=0.77-0.15*0.42+0.015;parts.push(P(box(0.34,0.48,0.08),'#3a2616',0,0.34,0.77),P(box(0.3,0.62,0.02),BLUE,0,0.1+h*0.4,o),P(box(0.02,0.62,0.3),BLUE,o,0.1+h*0.4,0),P(box(0.1,0.1,0.025),GOLD,0,0.1+h*0.45,o+0.01),P(box(0.025,0.1,0.1),GOLD,o+0.01,0.1+h*0.45,0));
      parts.push(P(box(1.6,0.16,1.6),STONE2,0,y0+0.08,0));crenSquare(parts,0.7,y0+0.27,STONE);for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(box(0.08,0.6,0.08),WOOD,sx*0.55,y0+0.46,sz*0.55));
      parts.push(P(cone(1.3,0.62,4),ROOFR,0,y0+1.06,0,0,Math.PI/4),P(cone(1.34,0.1,4),'#6e2c1c',0,y0+0.78,0,0,Math.PI/4),P(cyl(0.32*r2,0.36*r2,0.42,4),STONE,0,y0+1.36,0,0,Math.PI/4),P(cone(0.78,0.8,4),ROOFR,0,y0+1.97,0,0,Math.PI/4),P(sph(0.06),GOLD,0,y0+2.39,0));
      for(let i=0;i<2;i++){const a=i*2.6+0.8,x=Math.cos(a)*0.33,z=Math.sin(a)*0.33;parts.push(P(cyl(0.07,0.08,0.24,6),BLUE,x,y0+0.3,z),P(sph(0.06),'#d9a27a',x,y0+0.48,z),P(cone(0.065,0.08,6),'#9aa3ad',x,y0+0.55,z))}
      parts.push(P(cyl(0.015,0.015,0.6,4),WOODD,0,y0+2.65,0));flagM(group,anims,0,y0+2.82,0,BLUE);barH=y0+3.0}
    else{const h=3.2,y0=0.1+h;top=y0+0.45;
      parts.push(P(box(2.0,0.5,2.0),STONED,0,-0.15,0),P(box(1.9,0.14,1.9),MARBLE,0,0.13,0),P(cyl(0.72*r2,0.8*r2,h*0.32,4),MARBLE,0,0.1+h*0.16,0,0,Math.PI/4));
      metal.push(P(cyl(0.6*r2,0.7*r2,h*0.7,4),SILVER,0,0.1+h*0.32+h*0.35,0,0,Math.PI/4));
      for(const yy of[0.32,0.58,0.84])metal.push(P(cyl(0.72*r2,0.72*r2,0.07,4),GOLDM,0,0.1+h*yy,0,0,Math.PI/4));
      for(const sx of[-1,1])for(const sz of[-1,1]){metal.push(P(box(0.3,h*0.5,0.3),SILVERD,sx*0.72,0.1+h*0.25,sz*0.72),P(cone(0.24,0.34,4),GOLDM,sx*0.72,0.1+h*0.5+0.17,sz*0.72,0,Math.PI/4));gemAt(gems,sx*0.72+sx*0.16,0.1+h*0.3,sz*0.72+sz*0.16,0.06,RUBY)}
      for(const[x,z]of[[0,0.7],[0.7,0]]){gemAt(gems,x,0.1+h*0.7,z,0.1,SAPH);glow.push(P(box(x?0.03:0.07,0.24,x?0.07:0.03),'#ffe7a0',x*1.02,0.1+h*0.48,z*1.02))}
      metal.push(P(box(0.34,0.5,0.08),ENAMEL,0,0.34,0.81),P(box(0.42,0.07,0.1),GOLDM,0,0.62,0.81));
      metal.push(P(box(1.7,0.16,1.7),SILVER,0,y0+0.08,0));crenSquare(metal,0.75,y0+0.28,GOLDM,0.18);
      for(const sx of[-1,1])for(const sz of[-1,1]){metal.push(P(cyl(0.2,0.23,0.9,8),SILVER,sx*0.78,y0+0.45,sz*0.78),P(cyl(0.24,0.24,0.06,8),GOLDM,sx*0.78,y0+0.9,sz*0.78),P(cone(0.28,0.6,8),ENAMEL,sx*0.78,y0+1.22,sz*0.78),P(sph(0.045),GOLDM,sx*0.78,y0+1.54,sz*0.78))}
      metal.push(P(cone(1.3,0.64,4),ENAMEL,0,y0+1.06,0,0,Math.PI/4),P(cone(1.34,0.1,4),GOLDM,0,y0+0.78,0,0,Math.PI/4),P(cyl(0.32*r2,0.36*r2,0.44,4),SILVER,0,y0+1.38,0,0,Math.PI/4),P(cyl(0.37*r2,0.37*r2,0.06,4),GOLDM,0,y0+1.6,0,0,Math.PI/4),P(cone(0.78,0.82,4),ENAMEL,0,y0+2.0,0,0,Math.PI/4),P(cone(0.13,1.0,6),GOLDM,0,y0+2.85,0));
      for(let i=0;i<3;i++){const a=i*2.1+0.8,x=Math.cos(a)*0.34,z=Math.sin(a)*0.34;metal.push(P(cyl(0.07,0.08,0.24,6),GOLDM,x,y0+0.3,z),P(cone(0.07,0.1,6),SILVER,x,y0+0.55,z));parts.push(P(sph(0.06),'#d9a27a',x,y0+0.48,z))}
      parts.push(P(cyl(0.015,0.015,0.6,4),WOODD,0,y0+3.55,0));flagM(group,anims,0,y0+3.72,0,GOLD);beacon(group,anims,0,y0+4.2,0,'#9fe8ff');barH=y0+4.6}}
  // ---------------- CANNON ----------------
  else if(type==='cannon'){let h,tur=new THREE.Group(),n,bc,rc,bmat=VM;
    if(L===1){h=0.55;top=h+0.4;barH=h+1.5;n=1;bc='#2b2b30';rc='#1e1e22';
      parts.push(P(cyl(0.88,0.95,0.55,12),'#7a6242',0,0.27,0),P(cyl(0.84,0.84,0.06,12),LOG,0,0.56,0));
      for(let i=0;i<20;i++){const a=i/20*Math.PI*2;if(Math.abs(a-Math.PI/2)<0.25)continue;const x=Math.cos(a)*0.96,z=Math.sin(a)*0.96,hh=0.95+((i*37)%10)/40;parts.push(P(cyl(0.075,0.085,hh,6),LOG,x,hh/2,z),P(cone(0.085,0.18,6),LOGD,x,hh+0.09,z))}
      for(const yy of[0.35,0.75])parts.push(P(new THREE.CylinderGeometry(0.98,0.98,0.04,20,1,true),LOGD,0,yy,0));
      parts.push(P(cyl(0.015,0.015,1.1,4),WOODD,0.7,1.15,-0.6));flagM(group,anims,0.7,1.6,-0.6,BLUE,1)}
    else if(L===2){h=1.45;top=h+0.4;barH=h+1.3;n=2;bc='#2b2b30';rc='#5a5a62';
      parts.push(P(cyl(1.15,1.22,0.5,10),STONED,0,-0.15,0),P(cyl(0.95,1.05,h,10),STONE,0,h/2,0),P(cyl(1.08,1.08,0.12,10),STONE2,0,0.3,0),P(cyl(1.0,1.0,0.1,10),STONE2,0,h*0.62,0),P(cyl(0.88,0.88,0.06,10),'#8a7f6a',0,h+0.03,0));
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.3+Math.PI;parts.push(P(box(0.3,h*0.55,0.26),STONE2,Math.cos(a)*1.02,h*0.27,Math.sin(a)*1.02,0,-a))}
      for(let i=0;i<10;i++){const a=i/10*Math.PI*2;parts.push(P(box(0.24,0.24,0.18),STONE,Math.cos(a)*0.93,h+0.14,Math.sin(a)*0.93,0,-a))}
      parts.push(P(box(0.34,0.46,0.1),'#3a2616',0,0.33,1.0),P(box(0.28,0.5,0.02),BLUE,0.53,h*0.42,0.86,0,0.55),P(box(0.28,0.5,0.02),BLUE,-0.53,h*0.42,0.86,0,-0.55));
      parts.push(P(cyl(0.015,0.015,0.9,4),WOODD,0.75,h+0.5,-0.6));flagM(group,anims,0.75,h+0.9,-0.6,BLUE,1)}
    else{h=1.8;top=h+0.4;barH=h+2.0;n=3;bc=GOLDM;rc=SILVER;bmat=MM;
      parts.push(P(cyl(1.18,1.25,0.5,12),STONED,0,-0.15,0),P(cyl(1.1,1.12,0.3,12),MARBLE,0,0.15,0));metal.push(P(cyl(0.95,1.05,h-0.3,12),SILVER,0,0.3+(h-0.3)/2,0),P(cyl(0.88,0.88,0.06,12),SILVERD,0,h+0.03,0));
      for(const yy of[0.4,0.7,0.95])metal.push(P(cyl(1.04-yy*0.06,1.04-yy*0.06,0.07,12),GOLDM,0,h*yy,0));
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.5;gemAt(gems,Math.cos(a)*1.03,h*0.55,Math.sin(a)*1.03,0.09,i%2?RUBY:SAPH)}
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2;metal.push(P(box(0.22,0.26,0.17),SILVER,Math.cos(a)*0.94,h+0.15,Math.sin(a)*0.94,0,-a),P(box(0.24,0.05,0.19),GOLDM,Math.cos(a)*0.94,h+0.3,Math.sin(a)*0.94,0,-a));
        if(i%3===1){metal.push(P(cyl(0.09,0.06,0.08,6),GOLDM,Math.cos(a)*0.94,h+0.36,Math.sin(a)*0.94));glow.push(P(cone(0.08,0.24,5),'#7fd8ff',Math.cos(a)*0.94,h+0.52,Math.sin(a)*0.94))}}
      for(const sx of[-1,1]){metal.push(P(cyl(0.2,0.24,h+1.0,8),SILVER,sx*1.04,(h+1.0)/2,-0.35),P(cyl(0.25,0.25,0.06,8),GOLDM,sx*1.04,h+1.0,-0.35),P(cone(0.3,0.55,8),ENAMEL,sx*1.04,h+1.3,-0.35),P(sph(0.05),GOLDM,sx*1.04,h+1.6,-0.35));gemAt(gems,sx*1.04,h*0.7,-0.12,0.07,EMER)}
      metal.push(P(box(0.34,0.46,0.1),ENAMEL,0,0.4,1.02),P(box(0.4,0.06,0.11),GOLDM,0,0.66,1.02));
      parts.push(P(cyl(0.015,0.015,0.9,4),WOODD,0.75,h+0.5,-0.6));flagM(group,anims,0.75,h+0.9,-0.6,GOLD,1)}
    tur.position.y=h+0.06;group.add(tur);const offs=n===1?[0]:n===2?[-0.17,0.17]:[-0.27,0,0.27],cw=0.44+0.3*(n-1);
    const carr=new THREE.Mesh(merge([P(box(0.5,0.18,cw),L===3?ENAMEL:WOOD,0,0.12,0),P(cyl(0.14,0.14,0.06,8),L===3?GOLDM:WOODD,0.05,0.14,cw/2+0.03,Math.PI/2),P(cyl(0.14,0.14,0.06,8),L===3?GOLDM:WOODD,0.05,0.14,-cw/2-0.03,Math.PI/2),P(box(0.3,0.08,cw*0.7),WOODD,-0.25,0.05,0)]),L===3?MM:VM);
    const bp=[];const bs=L===3?1.15:1;for(const oz of offs){bp.push(P(cyl(0.08*bs,0.11*bs,0.9*bs,10),bc,0.32,0.3,oz,0,0,-Math.PI/2),P(cyl(0.11*bs,0.11*bs,0.07,10),rc,0.32+0.45*bs,0.3,oz,0,0,-Math.PI/2),P(sph(0.11*bs),bc,-0.12,0.3,oz));if(L===3)bp.push(P(cyl(0.1*bs,0.1*bs,0.05,10),SILVER,0.3,0.3,oz,0,0,-Math.PI/2))}
    const barrel=new THREE.Mesh(merge(bp),bmat);carr.castShadow=barrel.castShadow=true;tur.add(carr,barrel);group.userData.tur=tur;group.userData.barrel=barrel}
  // ---------------- BARRACKS ----------------
  else if(type==='barracks'){
    if(L===1){top=1.2;barH=2.3;
      parts.push(P(box(1.9,0.3,1.5),'#6e5a3e',0,-0.05,0),P(box(1.8,0.72,1.3),LOG,0,0.46,0));for(let i=0;i<5;i++)parts.push(P(box(1.82,0.025,1.32),LOGD,0,0.16+i*0.14,0));
      for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(cyl(0.08,0.08,0.9,6),LOGD,sx*0.9,0.45,sz*0.66));
      parts.push(P(prism(0.78,2.05),THATCH,0,1.21,0,0,0,0,1,1,1.22),P(box(2.08,0.08,0.1),THATCHD,0,1.98,0),P(box(0.36,0.52,0.04),'#3a2414',0,0.36,0.66),P(box(0.2,0.18,0.03),'#2b2a35',-0.6,0.56,0.66),P(box(0.2,0.18,0.03),'#2b2a35',0.6,0.56,0.66));
      for(let i=0;i<9;i++){const x=-0.95+i*0.24;if(Math.abs(x)<0.3)continue;parts.push(P(cyl(0.05,0.055,0.5,5),LOG,x,0.25,1.0),P(cone(0.055,0.12,5),LOGD,x,0.56,1.0))}
      parts.push(P(cyl(0.04,0.04,0.5,5),WOOD,0.95,0.25,-0.95),P(box(0.3,0.06,0.06),WOOD,0.95,0.42,-0.95),P(sph(0.1),'#d9c08a',0.95,0.58,-0.95));
      for(const x of[-0.98,0.98]){parts.push(P(cyl(0.02,0.02,1.5,4),WOODD,x,0.75,0.75));flagM(group,anims,x,1.35,0.75,BLUE,x)}}
    else if(L===2){top=1.5;barH=3.0;
      parts.push(P(box(1.95,0.5,1.6),STONED,0,-0.15,0),P(box(1.8,0.85,1.4),'#e4d6ae',0,0.52,0),P(box(1.83,0.34,1.43),STONE2,0,0.27,0));
      for(const sx of[-1,1])for(const sz of[-1,1])parts.push(P(box(0.09,0.87,0.09),WOODD,sx*0.88,0.52,sz*0.68));
      for(const x of[-0.45,0.45])parts.push(P(box(0.07,0.85,0.03),WOODD,x,0.52,0.71));
      parts.push(P(box(1.82,0.07,0.03),WOODD,0,0.93,0.71),P(box(1.82,0.07,0.03),WOODD,0,0.45,0.72),P(box(0.36,0.56,0.04),'#3a2414',0,0.4,0.72));
      for(const x of[-0.68,0.68])parts.push(P(box(0.22,0.2,0.03),'#2b2a35',x,0.66,0.72),P(box(0.07,0.22,0.03),BLUE,x-0.15,0.66,0.73),P(box(0.07,0.22,0.03),BLUE,x+0.15,0.66,0.73));
      parts.push(P(prism(0.8,2.05),'#3d5f9c',0,1.35,0,0,0,0,1,1,1.25),P(box(2.08,0.06,0.09),'#2a446f',0,2.14,0),P(box(0.2,0.55,0.2),STONE2,0.55,1.9,-0.25));
      const th=2.0;parts.push(P(cyl(0.3*r2,0.34*r2,th,4),STONE,-1.02,th/2,-0.55,0,Math.PI/4),P(box(0.72,0.12,0.72),STONE2,-1.02,th,-0.55),P(cone(0.52,0.62,4),'#3d5f9c',-1.02,th+0.36,-0.55,0,Math.PI/4));
      for(const[dx,dz]of[[-0.3,-0.3],[0.3,-0.3],[-0.3,0.3],[0.3,0.3]])parts.push(P(box(0.14,0.14,0.14),STONE,-1.02+dx,th+0.12,-0.55+dz));
      for(const x of[-0.62,0.62])parts.push(P(cyl(0.13,0.13,0.03,10),BLUE,x,0.82,0.72,Math.PI/2),P(cyl(0.05,0.05,0.035,8),GOLD,x,0.82,0.735,Math.PI/2));
      parts.push(P(box(0.6,0.04,0.04),WOOD,-0.35,0.38,0.98));for(let i=0;i<4;i++)parts.push(P(cyl(0.012,0.012,0.7,4),WOOD,-0.6+i*0.16,0.4,0.95),P(cone(0.025,0.07,4),'#ccc',-0.6+i*0.16,0.78,0.95));
      for(const x of[-0.95,0.95]){parts.push(P(cyl(0.02,0.02,1.7,4),WOODD,x,0.85,0.85));flagM(group,anims,x,1.55,0.85,BLUE,x)}}
    else{top=1.8;barH=4.2;
      parts.push(P(box(2.0,0.5,1.65),STONED,0,-0.15,0),P(box(1.84,0.4,1.44),MARBLE,0,0.3,0),P(box(1.8,0.6,1.4),MARBLE,0,0.75,0));
      metal.push(P(box(1.86,0.06,1.46),GOLDM,0,0.5,0),P(box(1.86,0.06,1.46),GOLDM,0,1.06,0));for(const sx of[-1,1])for(const sz of[-1,1])metal.push(P(box(0.1,1.0,0.1),GOLDM,sx*0.9,0.55,sz*0.7));
      metal.push(P(prism(0.82,2.08),ENAMEL,0,1.48,0,0,0,0,1,1,1.25),P(box(2.12,0.07,0.1),GOLDM,0,2.3,0));
      for(const x of[-0.62,0.62]){glow.push(P(box(0.2,0.24,0.02),'#ffe7a0',x,0.78,0.705));metal.push(P(box(0.26,0.04,0.03),GOLDM,x,0.92,0.71));gemAt(gems,x,0.36,0.74,0.07,SAPH)}
      metal.push(P(box(0.86,0.8,0.5),MARBLE,0,0.5,0.94),P(box(0.9,0.06,0.04),GOLDM,0,0.88,1.19),P(prism(0.5,0.66),ENAMEL,0,1.14,0.96,0,Math.PI/2),P(box(0.34,0.55,0.04),ENAMEL,0,0.32,1.2),P(box(0.4,0.06,0.05),GOLDM,0,0.62,1.21));gemAt(gems,0,1.28,1.22,0.11,RUBY);
      const th=2.9;parts.push(P(cyl(0.34*r2,0.38*r2,th*0.4,4),MARBLE,-1.02,th*0.2,-0.55,0,Math.PI/4));metal.push(P(cyl(0.3*r2,0.34*r2,th*0.6,4),SILVER,-1.02,th*0.4+th*0.3,-0.55,0,Math.PI/4),P(box(0.76,0.12,0.76),GOLDM,-1.02,th,-0.55),P(cone(0.54,0.7,4),ENAMEL,-1.02,th+0.41,-0.55,0,Math.PI/4),P(cone(0.1,0.8,6),GOLDM,-1.02,th+1.1,-0.55));
      for(const[dx,dz]of[[-0.32,-0.32],[0.32,-0.32],[-0.32,0.32],[0.32,0.32]])metal.push(P(box(0.14,0.16,0.14),SILVER,-1.02+dx,th+0.14,-0.55+dz));gemAt(gems,-1.02,th*0.7,-0.18,0.09,EMER);glow.push(P(box(0.07,0.22,0.02),'#ffe7a0',-1.02,th*0.5,-0.17));
      for(const x of[-1.0,1.0]){parts.push(P(cyl(0.022,0.022,1.9,4),WOODD,x,0.95,0.9));flagM(group,anims,x,1.75,0.9,GOLD,x)}
      beacon(group,anims,-1.02,th+1.8,-0.55,'#9fe8ff')}}
  // ---------------- WALL ----------------
  else if(type==='wall'){const h=[0,0.95,1.2,1.38][L];top=h;barH=h+0.55;const arms=[[0,-1,'n'],[1,0,'e'],[0,1,'s'],[-1,0,'w']].filter(a=>nb&&nb[a[2]]);
    if(L===1){const stake=(x,z,hh)=>parts.push(P(cyl(0.075,0.085,hh,6),LOG,x,hh/2,z),P(cone(0.085,0.18,6),LOGD,x,hh+0.09,z));
      stake(0,0,h+0.1);if(arms.length){for(const[dx,dz]of arms){for(let k=1;k<=3;k++)stake(dx*k*0.17+(dz?((k%2)*0.03):0),dz*k*0.17+(dx?((k%2)*0.03):0),h-0.05*(k%2));parts.push(P(box(dx?0.5:0.05,0.05,dz?0.5:0.05),LOGD,dx*0.25,h*0.6,dz*0.25),P(box(dx?0.5:0.05,0.05,dz?0.5:0.05),LOGD,dx*0.25,h*0.25,dz*0.25))}}
      else for(let i=0;i<6;i++){const a=i/6*Math.PI*2;stake(Math.cos(a)*0.22,Math.sin(a)*0.22,h-0.1)}}
    else if(L===2){parts.push(P(box(0.56,0.3,0.56),STONED,0,0,0),P(box(0.48,h+0.22,0.48),STONE,0,(h+0.22)/2,0),P(box(0.54,0.06,0.54),STONE2,0,h+0.22,0));
      for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])parts.push(P(box(0.13,0.16,0.13),STONE,dx*0.19,h+0.33,dz*0.19));
      for(const[dx,dz]of arms){parts.push(P(box(dx?0.5:0.36,h,dz?0.5:0.36),STONE2,dx*0.28,h/2,dz*0.28),P(box(dx?0.5:0.4,0.06,dz?0.5:0.4),STONE,dx*0.28,h,dz*0.28));for(const k of[0.2,0.42])parts.push(P(box(dx?0.12:0.36,0.15,dz?0.12:0.36),STONE,dx*k,h+0.1,dz*k))}}
    else{parts.push(P(box(0.6,0.3,0.6),STONED,0,0,0));metal.push(P(box(0.5,h+0.25,0.5),SILVER,0,(h+0.25)/2,0),P(box(0.56,0.07,0.56),GOLDM,0,h+0.25,0),P(box(0.54,0.06,0.54),GOLDM,0,0.3,0),P(cone(0.2,0.32,4),ENAMEL,0,h+0.45,0,0,Math.PI/4),P(sph(0.04),GOLDM,0,h+0.63,0));
      for(const[dx,dz]of[[0,1],[1,0],[0,-1],[-1,0]])gemAt(gems,dx*0.26,h*0.6,dz*0.26,0.07,(dx+dz)>0?SAPH:RUBY);
      for(const[dx,dz]of arms){metal.push(P(box(dx?0.5:0.38,h,dz?0.5:0.38),SILVERD,dx*0.28,h/2,dz*0.28),P(box(dx?0.5:0.42,0.07,dz?0.5:0.42),GOLDM,dx*0.28,h,dz*0.28),P(box(dx?0.5:0.4,0.1,dz?0.5:0.4),ENAMEL,dx*0.28,h*0.45,dz*0.28));glow.push(P(box(dx?0.46:0.02,0.03,dz?0.46:0.02),'#9fe8ff',dx*0.28+dz*0.2,h*0.45,dz*0.28+dx*0.2),P(box(dx?0.46:0.02,0.03,dz?0.46:0.02),'#9fe8ff',dx*0.28-dz*0.2,h*0.45,dz*0.28-dx*0.2))}}}
  // ---------------- WHEAT ----------------
  else if(type==='wheat'){top=0.4;barH=L===1?0.9:2.1;
    parts.push(P(box(2.9,0.12,2.9),'#7a5530',0,-0.02,0));for(let i=0;i<10;i++)parts.push(P(box(2.7,0.03,0.07),'#5c3e20',0,0.05,-1.28+i*0.284));
    if(L===3){fenceRing(metal,3,0.3);for(const[x,z]of[[1.45,1.45],[-1.45,1.45],[1.45,-1.45]])gemAt(gems,x,0.36,z,0.06,EMER)}else fenceRing(parts,L,0.28);
    parts.push(P(cyl(0.18,0.27,0.32,8),L===3?GOLDM:'#d9b44a',1.12,0.16,1.12),P(cone(0.18,0.12,8),'#c9a43a',1.12,0.38,1.12));
    if(L===1)parts.push(P(cyl(0.02,0.02,0.6,4),WOOD,0.2,0.3,0.1),P(box(0.4,0.03,0.03),WOOD,0.2,0.48,0.1),P(sph(0.07),'#d9b44a',0.2,0.66,0.1),P(cone(0.1,0.1,6),'#6b4a2a',0.2,0.74,0.1),P(box(0.14,0.18,0.08),'#7a3a2a',0.2,0.45,0.1));
    if(L>=2){windmill(group,anims,parts,metal,gems,-1.1,-1.1,L);parts.push(P(box(0.5,0.2,0.3),WOOD,-0.3,0.13,1.18),P(box(0.44,0.1,0.24),'#e0bb4f',-0.3,0.27,1.18),P(cyl(0.16,0.24,0.28,8),'#d9b44a',0.75,0.14,1.18))}
    wheatMesh(group,anims,L,(x,z)=>(L===1&&Math.abs(x-0.2)<0.2&&Math.abs(z-0.1)<0.2)||(x>0.9&&z>0.9)||(L>=2&&x<-0.75&&z<-0.75)||(L>=2&&z>1.0&&x<0.95))}
  // ---------------- SHEEP ----------------
  else if(type==='sheep'){top=0.5;barH=L===1?1.1:1.5;
    parts.push(P(box(2.9,0.1,2.9),L===3?'#8cc256':'#7fae4c',0,-0.02,0));if(L===3)fenceRing(metal,3,0.36);else fenceRing(parts,L,0.36);
    if(L===1)parts.push(P(box(0.75,0.5,0.58),WOOD,-0.92,0.27,-0.95),P(prism(0.44,0.85),THATCH,-0.92,0.74,-0.95,0,0,0,1,1,0.85),P(box(0.2,0.3,0.03),'#2a1a0c',-0.92,0.17,-0.65));
    else if(L===2)parts.push(P(box(1.0,0.66,0.72),'#a03a2a',-0.82,0.35,-0.86),P(prism(0.52,1.08),'#5a5550',-0.82,0.92,-0.86,0,0,0,1,1,0.95),P(box(0.32,0.42,0.03),'#f0e8d8',-0.82,0.22,-0.49),P(box(0.03,0.42,0.3),'#f0e8d8',-0.31,0.22,-0.86));
    else{parts.push(P(box(1.0,0.66,0.72),MARBLE,-0.82,0.35,-0.86));metal.push(P(prism(0.52,1.08),ENAMEL,-0.82,0.92,-0.86,0,0,0,1,1,0.95),P(box(1.12,0.05,0.08),GOLDM,-0.82,1.18,-0.86),P(box(0.32,0.42,0.03),GOLDM,-0.82,0.22,-0.49));gemAt(gems,-0.82,0.82,-0.48,0.08,SAPH)}
    parts.push(P(box(0.5,0.1,0.15),WOODD,0.8,0.07,-1.15));if(L>=2)for(let i=0;i<3;i++)parts.push(P(cyl(0.12,0.12,0.24,8),'#f3f0e6',1.05,0.12,-0.75+i*0.26,0,0,Math.PI/2));
    const sgf=wc=>merge([P(ico(0.16,1),wc,0,0.22,0,0,0,0,1.35,1,1.05),P(box(0.12,0.11,0.1),'#2a2522',0.21,0.27,0),P(box(0.03,0.05,0.12),'#2a2522',0.18,0.32,0),...[[0.09,0.07],[0.09,-0.07],[-0.09,0.07],[-0.09,-0.07]].map(([x,z])=>P(box(0.04,0.13,0.04),'#2a2522',x,0.065,z))]);
    const sg=sgf('#f3f0e6'),sgG=sgf(GOLDM);const n=[0,4,6,9][L];
    for(let i=0;i<n;i++){const gold=L===3&&i<2;const s=new THREE.Mesh(gold?sgG:sg,gold?MM:VM);s.castShadow=true;group.add(s);const ph=i*2.1+Math.random(),sp=0.7+Math.random()*0.5;let px=0,pz=0;
      anims.push((t)=>{const x=Math.sin(t*0.13*sp+ph)*0.95+0.15,z=Math.cos(t*0.11*sp+ph*1.7)*0.9+0.1;const dx=x-px,dz=z-pz;if(dx*dx+dz*dz>1e-7)s.rotation.y=Math.atan2(-dz,dx);px=x;pz=z;s.position.set(x,Math.abs(Math.sin(t*7+ph))*0.025,z)})}}
  // ---------------- MINE ----------------
  else if(type==='mine'){top=0.8;barH=L===3?2.4:1.7;
    for(const[x,y,z,r,c]of[[-0.42,0.25,-0.3,0.55,'#7d7970'],[0.38,0.3,-0.35,0.5,'#8a867c'],[0,0.5,-0.15,0.6,'#948f84'],[-0.6,0.18,0.3,0.36,'#85817a'],[0.6,0.15,0.25,0.32,'#77736b'],[0.15,0.85,-0.3,0.35,'#a09b8f']])parts.push(P(dod(r),c,x,y,z,0.3,x*3,0.2,1,0.8,1));
    parts.push(P(box(0.44,0.52,0.14),'#14110e',0,0.27,0.42));for(const x of[-0.12,0.12])parts.push(P(box(0.04,0.03,0.55),'#58534c',x,0.02,0.75));
    if(L===1)parts.push(P(box(0.08,0.62,0.08),WOOD,-0.26,0.3,0.5),P(box(0.08,0.62,0.08),WOOD,0.26,0.3,0.5),P(box(0.66,0.09,0.1),WOOD,0,0.63,0.5));
    else if(L===2){parts.push(P(box(0.14,0.66,0.16),STONE,-0.3,0.33,0.5),P(box(0.14,0.66,0.16),STONE,0.3,0.33,0.5),P(box(0.74,0.14,0.18),STONE2,0,0.7,0.5),P(box(0.06,1.1,0.06),WOOD,-0.72,0.55,0.55),P(box(0.6,0.06,0.06),WOOD,-0.47,1.08,0.55),P(cyl(0.01,0.01,0.4,3),'#333',-0.2,0.88,0.55));glow.push(P(sph(0.05),'#ffd36a',0.3,0.78,0.6))}
    else{metal.push(P(box(0.14,0.7,0.16),SILVER,-0.3,0.35,0.5),P(box(0.14,0.7,0.16),SILVER,0.3,0.35,0.5),P(box(0.76,0.14,0.18),GOLDM,0,0.74,0.5),P(box(0.07,1.4,0.07),GOLDM,-0.75,0.7,0.55),P(box(0.7,0.07,0.07),GOLDM,-0.45,1.38,0.55));gemAt(gems,0,0.74,0.6,0.08,RUBY);
      for(const[x,y,z]of[[-0.3,0.45,-0.05],[0.25,0.55,-0.1],[0.05,0.8,-0.2],[-0.55,0.3,0.3],[0.5,0.3,0.1]]){glow.push(P(box(0.24,0.035,0.05),'#ffd34a',x,y,z,0,x*4,0.4));gemAt(gems,x+0.08,y+0.05,z+0.05,0.06,[EMER,SAPH,RUBY][Math.abs(Math.round(x*10))%3])}
      beacon(group,anims,0.15,1.6,-0.3,'#ffd34a')}
    for(let i=0;i<9;i++)parts.push(P(oct(0.06+(i%3)*0.02),GOLD,-0.5+((i*37)%100)/100,0.3+((i*53)%60)/100,-0.1+((i*71)%50)/100-0.25));
    parts.push(P(dod(0.17+(L-1)*0.06),'#d9a92e',0.6,0.08,0.65),P(dod(0.1),'#e8c24a',0.45,0.06,0.78));
    const cart=new THREE.Mesh(merge([P(box(0.3,0.16,0.24),L===3?GOLDM:WOOD,0,0.13,0),P(box(0.26,0.07,0.2),GOLD,0,0.23,0),...[[0.1,0.12],[0.1,-0.12],[-0.1,0.12],[-0.1,-0.12]].map(([x,z])=>P(cyl(0.05,0.05,0.03,8),'#333',x,0.05,z,Math.PI/2))]),L===3?MM:VM);
    cart.rotation.y=Math.PI/2;cart.castShadow=true;group.add(cart);const ph=Math.random()*6;anims.push(t=>{cart.position.set(0,0,0.72+Math.sin(t*0.55+ph)*0.2)});
    const smt=new THREE.MeshBasicMaterial({color:'#fff0a0'});for(let i=0;i<3;i++){const sp=new THREE.Mesh(oct(0.05),smt);sp.position.set(-0.4+i*0.4,0.5+i*0.12,-0.1);group.add(sp);anims.push(t=>{const k=Math.max(0,Math.sin(t*2.2+i*2.1));sp.scale.setScalar(0.2+k*1.1);sp.rotation.y=t*2})}
    flagM(group,anims,-0.65,1.2,-0.4,L===3?GOLD:BLUE,3);parts.push(P(cyl(0.015,0.015,0.6,4),WOODD,-0.65,0.95,-0.4))}
  if(L===3)aura(group,anims,BT[type].size);
  if(parts.length){const m=new THREE.Mesh(merge(parts),VM);m.castShadow=true;m.receiveShadow=true;group.add(m)}
  if(metal.length){const m=new THREE.Mesh(merge(metal),MM);m.castShadow=true;m.receiveShadow=true;group.add(m)}
  if(gems.length){const gmat=new THREE.MeshBasicMaterial({vertexColors:true});const m=new THREE.Mesh(merge(gems),gmat);group.add(m);const ph=Math.random()*6;anims.push(t=>{gmat.color.setScalar(0.75+0.45*Math.max(0,Math.sin(t*3+ph)))})}
  if(glow.length)group.add(new THREE.Mesh(merge(glow),new THREE.MeshBasicMaterial({vertexColors:true})));
  return{group,anims,top,barH}}

// =============== UNIT RIGS (instanced, animated) ===============
const rigs={};
function makeRig(name,parts,max,scale){const meshes=parts.map(p=>{const m=new THREE.InstancedMesh(p.geo,p.mat||VM,max);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.castShadow=true;m.frustumCulled=false;
    for(let i=0;i<max;i++)m.setColorAt(i,WHITE);m.count=0;scene.add(m);return m});
  rigs[name]={parts,meshes,max,scale,n:0}}
function human(team,weapon){const body=team==='blue'?BLUE:weapon==='shield'?'#8e2219':weapon==='sapper'?'#a8452a':RED,trim=team==='blue'?'#1d3d80':'#7a1d16';const boss=weapon==='axe';
  const legs=z=>({geo:merge([P(box(0.07,0.2,0.08),boss?'#2a1a10':'#4a3220',0,-0.1,0),P(box(0.08,0.04,0.1),'#2a1a10',0.01,-0.2,0)]),pivot:[0,0.21,z]});
  const bodyParts=[P(box(0.13,0.21,0.2),body,0,0.1,0),P(box(0.135,0.04,0.205),'#3a2414',0,0.02,0),P(box(0.14,0.06,0.21),trim,0,0.19,0),P(sph(0.068),'#d9a27a',0.01,0.28,0)];
  if(boss)bodyParts.push(P(cyl(0.075,0.08,0.05,8),GOLD,0.01,0.34,0),...[0,1,2,3,4].map(i=>P(cone(0.02,0.06,4),GOLD,0.01+Math.cos(i*1.256)*0.065,0.38,Math.sin(i*1.256)*0.065)),P(box(0.03,0.22,0.24),'#4a0e0a',-0.08,0.08,0));
  else bodyParts.push(P(cone(0.08,0.09,7),'#6a4a2a',0.01,0.35,0),P(cyl(0.085,0.085,0.015,8),'#5a3a1a',0.01,0.31,0));
  if(weapon==='shield')bodyParts.push(P(box(0.035,0.36,0.26),'#7a1d16',0.13,0.12,0.04),P(box(0.04,0.3,0.03),'#c9a24a',0.135,0.12,0.04),P(box(0.04,0.03,0.2),'#c9a24a',0.135,0.14,0.04),P(cyl(0.075,0.08,0.06,8),'#8a8f96',0.01,0.33,0));
  else if(weapon==='sapper')bodyParts.push(P(cyl(0.09,0.09,0.2,8),'#5a3a1e',-0.13,0.13,0,Math.PI/2),P(box(0.02,0.19,0.03),'#2a1a0c',-0.13,0.13,0.1),P(box(0.02,0.19,0.03),'#2a1a0c',-0.13,0.13,-0.1),P(cyl(0.01,0.01,0.08,4),'#ddd',-0.13,0.26,0));
  else if(weapon==='bow')bodyParts.push(P(cyl(0.04,0.035,0.24,6),'#5a3a1e',-0.09,0.16,0.04,0.3),...[0,1,2].map(i=>P(box(0.01,0.06,0.01),'#e8e0d0',-0.09+i*0.01,0.3,0.04+i*0.015)));
  else bodyParts.push(P(cyl(0.085,0.085,0.025,9),team==='blue'?BLUE:'#8a2a20',0,0.12,0.115,Math.PI/2),P(sph(0.025,5,4),'#c8c0b0',0,0.12,0.13));
  let arm;if(boss)arm=merge([P(box(0.05,0.16,0.05),body,0.02,-0.07,0),P(cyl(0.015,0.015,0.55,5),'#4a3420',0.1,-0.06,0,0,0,-0.35),P(box(0.04,0.16,0.12),'#9aa0a8',0.2,0.17,0,0,0,-0.35)]);
  else if(weapon==='bow')arm=merge([P(box(0.05,0.15,0.05),body,0.02,-0.07,0),P(box(0.02,0.34,0.02),'#6a4520',0.1,-0.13,0,0,0,0.12),P(box(0.02,0.12,0.02),'#6a4520',0.08,0.06,0,0,0,-0.5),P(box(0.02,0.12,0.02),'#6a4520',0.08,-0.32,0,0,0,0.6),P(box(0.005,0.5,0.005),'#eee',0.04,-0.13,0)]);
  else if(weapon==='sapper')arm=merge([P(box(0.05,0.15,0.05),body,0.02,-0.07,0),P(cyl(0.012,0.012,0.3,5),'#5a3a1e',0.1,-0.13,0,0,0,-0.6),P(box(0.05,0.07,0.05),'#ff8a20',0.2,-0.02,0)]);
  else arm=merge([P(box(0.05,0.15,0.05),body,0.02,-0.07,0),P(cyl(0.012,0.012,0.85,5),'#7a5a32',0.15,-0.13,0,0,0,Math.PI/2),P(cone(0.026,0.09,5),'#d0d0d0',0.61,-0.13,0,0,0,-Math.PI/2)]);
  return[legs(0.05),legs(-0.05),{geo:merge(bodyParts),pivot:[0,0.21,0]},{geo:arm,pivot:[0,0.38,-0.12]}]}
function horse(team,weapon,tier=2){const blue=team==='blue';const cloth=blue?BLUE:RED,trim=blue?GOLD:'#2a1a10';
  const coat=blue&&tier===3?'#ece6da':blue&&tier===1?'#7a5534':'#6b4a2e',coatD=blue&&tier===3?'#d6cfc2':'#5a3d24';
  const hb=[P(box(0.52,0.2,0.2),coat,0,0,0),P(box(0.12,0.26,0.12),coat,0.27,0.13,0,0,0,-0.6),P(box(0.23,0.09,0.09),coatD,0.4,0.22,0,0,0,-0.35),P(box(0.15,0.05,0.04),blue&&tier===3?'#f3c440':'#2a1a10',0.22,0.2,0,0,0,-0.6),P(box(0.05,0.2,0.05),blue&&tier===3?'#f3e6c0':'#2a1a10',-0.28,-0.03,0,0,0,0.5)];
  if(!blue||tier>=2)hb.push(P(box(0.54,0.15,0.235),cloth,0,-0.03,0),P(box(0.545,0.025,0.24),trim,0,-0.1,0));else hb.push(P(box(0.22,0.06,0.24),cloth,0,0.1,0));
  if(blue&&tier>=2)hb.push(P(box(0.16,0.022,0.05),tier===3?'#f3c440':'#c9d1d9',0.42,0.27,0,0,0,-0.35));if(blue&&tier===3)hb.push(P(box(0.56,0.03,0.25),'#f3c440',0,0.05,0),P(oct(0.035),'#ff2850',0.33,0.32,0));
  const leg=(x,z)=>({geo:merge([P(box(0.06,0.26,0.06),coatD,0,-0.13,0),P(box(0.07,0.04,0.07),blue&&tier===3?'#f3c440':'#222',0,-0.25,0)]),pivot:[x,0.31,z]});
  const armor=blue?(tier===1?'#7a5a3a':tier===2?'#aeb6bf':'#f3c440'):'#4a3220',legC=blue?(tier===1?'#5a4030':tier===2?'#9aa3ad':'#dfe4ec'):'#4a3220';
  const rider=[P(box(0.1,0.17,0.045),legC,0.03,-0.06,0.115),P(box(0.1,0.17,0.045),legC,0.03,-0.06,-0.115),P(box(0.12,0.05,0.2),legC,0,0.02,0),P(box(0.13,0.22,0.17),blue?armor:cloth,0,0.15,0),P(box(0.135,0.15,0.175),cloth,0,0.11,0)];
  if(blue){if(tier===1)rider.push(P(sph(0.06),'#d9a27a',0,0.31,0),P(cyl(0.065,0.07,0.06,8),'#8a8f96',0,0.36,0),P(cyl(0.1,0.1,0.03,10),'#8a5a30',0,0.17,0.11,Math.PI/2),P(cyl(0.05,0.05,0.035,8),BLUE,0,0.17,0.12,Math.PI/2));
    else{const hc=tier===3?'#f3c440':'#cfd6de';rider.push(P(cyl(0.06,0.066,0.12,8),hc,0,0.33,0),P(box(0.02,0.015,0.1),'#222',0.06,0.34,0),P(box(0.03,0.09,0.02),tier===3?'#ff3a50':GOLD,0,0.43,0),P(box(0.02,0.18,0.13),tier===3?'#2a50b8':BLUE,0,0.17,0.11),P(box(0.025,0.12,0.025),GOLD,0.002,0.17,0.12),P(box(0.025,0.025,0.08),GOLD,0.002,0.19,0.12));
      if(tier===3)rider.push(P(oct(0.03),'#3aa8ff',0.004,0.17,0.13),P(box(0.14,0.05,0.18),'#dfe4ec',0,0.27,0),P(box(0.03,0.2,0.24),'#2a50b8',-0.08,0.12,0))}}
  else rider.push(P(sph(0.06),'#d9a27a',0,0.31,0),P(cone(0.07,0.08,7),'#6a4a2a',0,0.37,0));
  const blade=tier===3?'#c8f6ff':'#eef2f6';
  const arm=weapon==='sword'?merge([P(box(0.05,0.14,0.05),armor,0,-0.06,0),P(box(tier===3?0.38:0.32,0.03,0.015),blade,0.18,-0.12,0),P(box(0.03,0.08,0.03),GOLD,0.02,-0.12,0)]):merge([P(box(0.05,0.14,0.05),cloth,0,-0.06,0),P(cyl(0.014,0.014,1.0,5),'#7a5a32',0.25,-0.12,0,0,0,Math.PI/2),P(cone(0.03,0.1,5),'#ccc',0.79,-0.12,0,0,0,-Math.PI/2)]);
  const partsOut=[{geo:merge(hb),pivot:[0,0.36,0]},leg(0.19,0.07),leg(0.19,-0.07),leg(-0.19,0.07),leg(-0.19,-0.07),{geo:merge(rider),pivot:[0,0.5,0],mat:blue&&tier===3?MM:undefined},{geo:arm,pivot:[0,0.66,-0.1],mat:blue&&tier===3?new THREE.MeshBasicMaterial({vertexColors:true}):undefined}];
  return partsOut}
function ram(){const body=merge([P(box(0.92,0.08,0.44),'#6b4a28',0,0.17,0),P(prism(0.33,0.98),'#8a2a20',0,0.38,0,0,0,0,1,1,0.95),P(box(1.0,0.04,0.05),'#4a2a14',0,0.54,0),...[-0.4,0,0.4].map(x=>P(box(0.05,0.36,0.47),'#5a3a1e',x,0.32,0))]);
  const wheel=(x,z)=>({geo:merge([P(cyl(0.11,0.11,0.05,8),'#4a3018',0,0,0,Math.PI/2),P(box(0.2,0.03,0.055),'#2a1a0c',0,0,0)]),pivot:[x,0.11,z]});
  const log=merge([P(cyl(0.06,0.065,0.92,7),'#5a3a1e',0.08,0,0,0,0,Math.PI/2),P(box(0.15,0.16,0.16),'#55504a',0.58,0,0),P(box(0.04,0.18,0.18),'#3a3632',0.66,0,0)]);
  return[{geo:body,pivot:[0,0,0]},wheel(0.3,0.25),wheel(-0.3,0.25),wheel(0.3,-0.25),wheel(-0.3,-0.25),{geo:log,pivot:[0,0.3,0]}]}
function buildRigs(){makeRig('spear',human('red','spear'),420,1.12);makeRig('bowman',human('red','bow'),220,1.12);makeRig('shield',human('red','shield'),220,1.2);makeRig('sapper',human('red','sapper'),120,1.08);makeRig('boss',human('red','axe'),12,1.85);makeRig('cav',horse('red','lance'),160,1.02);makeRig('knight1',horse('blue','sword',1),200,1.04);makeRig('knight2',horse('blue','sword',2),200,1.1);makeRig('knight3',horse('blue','sword',3),200,1.18);makeRig('ram',ram(),70,0.95)}
const POSE=Array.from({length:8},()=>[0,0,0,0,0,0]);
function poseOf(kind,u,t){const m=u.mvb||0,k=u.swing>0?clamp(u.swing/0.25,0,1):0,a=Math.sin(k*Math.PI),o=POSE;for(const p of o)p.fill(0);
  if(kind==='spear'||kind==='boss'||kind==='bowman'||kind==='shield'||kind==='sapper'){const s=u.walk,sw=Math.sin(s)*0.7*m,bob=Math.abs(Math.cos(s))*0.03*m;
    o[0][5]=sw;o[1][5]=-sw;o[2][1]=bob;o[2][5]=-0.08*m+Math.sin(t*1.5+u.x)*0.02*(1-m);o[3][1]=bob;
    if(kind==='spear'){o[3][0]=a*0.14;o[3][5]=-sw*0.25+a*0.08}else{o[3][5]=0.5-1.6*a-sw*0.2}}
  else if(kind==='cav'||kind.startsWith('knight')){const s=u.walk*1.15,bob=Math.sin(s*2)*0.035*m,pitch=Math.sin(s)*0.06*m+Math.sin(t*1.2+u.x)*0.015*(1-m);
    o[0][1]=bob;o[0][5]=pitch;const L=0.85*m;o[1][5]=Math.sin(s)*L;o[2][5]=Math.sin(s+0.6)*L;o[3][5]=Math.sin(s+Math.PI)*L;o[4][5]=Math.sin(s+Math.PI+0.6)*L;
    for(let i=1;i<5;i++)o[i][1]=bob;o[5][1]=bob;o[5][5]=pitch*0.5;o[6][1]=bob;
    if(kind!=='cav')o[6][5]=0.75-1.9*a;else{o[6][0]=a*0.18;o[6][5]=0.03}}
  else if(kind==='ram'){const r=-u.walk*1.6;for(let i=1;i<5;i++)o[i][5]=r;o[5][0]=-0.06+a*0.22;o[5][1]=Math.abs(Math.sin(u.walk))*0.01}
  return o}
const _U=new THREE.Matrix4(),_L=new THREE.Matrix4(),_M=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),ONE=new THREE.Vector3(1,1,1),_c=new THREE.Color();
function drawUnitInst(kind,u,t,dead){const R=rigs[kind];if(R.n>=R.max)return;const idx=R.n++;const X=u.x/TILE,Z=u.y/TILE;let Y=heightAt(X,Z);
  let roll=0;if(dead){const f=smooth(0,0.45,u.die);roll=kind==='ram'?0:f*1.45;Y-=Math.max(0,u.die-2.5)*0.12+(kind==='ram'?0:f*0.04)}
  _e.set(roll,-u.rAng,0,'YXZ');_q.setFromEuler(_e);_v.set(X,Y,Z);const sc=R.scale;_s.set(sc,sc,sc);_U.compose(_v,_q,_s);
  const pose=poseOf(kind,u,t);let col=WHITE;if(u.flash>0&&!dead)col=FLASH;else if(dead){const k=Math.max(0.35,1-u.die*0.25);col=_c.setRGB(k,k,k)}
  R.parts.forEach((p,j)=>{const d=pose[j];_e.set(d[3],d[4],d[5],'XYZ');_q.setFromEuler(_e);_v.set(p.pivot[0]+d[0],p.pivot[1]+d[1],p.pivot[2]+d[2]);_L.compose(_v,_q,ONE);_M.multiplyMatrices(_U,_L);R.meshes[j].setMatrixAt(idx,_M);R.meshes[j].setColorAt(idx,col)})}

// =============== FX MESHES ===============
const GLOWM_A=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false});
const arrowMesh=new THREE.InstancedMesh(merge([P(box(0.34,0.022,0.022),'#5a3f22',0,0,0),P(cone(0.025,0.06,4),'#ccc',0.19,0,0,0,0,-Math.PI/2),P(box(0.07,0.05,0.005),'#eee',-0.15,0,0)]),VM,400);
const kvAura=new THREE.InstancedMesh(new THREE.RingGeometry(0.3,0.46,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.95,depthWrite:false}),240);
const kvDisc=new THREE.InstancedMesh(new THREE.CircleGeometry(0.42,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.32,depthWrite:false}),240);
const kvFlame=new THREE.InstancedMesh(new THREE.ConeGeometry(0.06,0.3,7).translate(0,0.15,0),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.95,depthWrite:false}),240);
for(const m of[kvAura,kvDisc,kvFlame]){m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);for(let i=0;i<240;i++)m.setColorAt(i,WHITE);m.renderOrder=3;scene.add(m)}
const arrowGlow=new THREE.InstancedMesh(new THREE.BoxGeometry(0.42,0.06,0.06),GLOWM_A('#7fe8ff'),200);arrowGlow.frustumCulled=false;arrowGlow.count=0;scene.add(arrowGlow);
const ballMesh=new THREE.InstancedMesh(merge([P(sph(0.1,8,6),'#1c1c1e')]),VM,80);
const smokeMesh=new THREE.InstancedMesh(merge([P(ico(0.5,1),'#ffffff')]),new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,transparent:true,opacity:0.62,depthWrite:false}),900);
const debMesh=new THREE.InstancedMesh(merge([P(dod(0.5),'#ffffff')]),VM,400);
const fireMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5,1),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.9,depthWrite:false}),300);
for(const m of[arrowMesh,ballMesh,smokeMesh,fireMesh,debMesh]){m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.count=0;scene.add(m)}
arrowMesh.castShadow=ballMesh.castShadow=true;
for(let i=0;i<900;i++)smokeMesh.setColorAt(i,WHITE);for(let i=0;i<400;i++)debMesh.setColorAt(i,WHITE);debMesh.castShadow=true;for(let i=0;i<300;i++)fireMesh.setColorAt(i,WHITE);
const ringMat=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.6,depthTest:false,depthWrite:false});
const rangeRing=new THREE.Mesh(new THREE.RingGeometry(0.96,1,96).rotateX(-Math.PI/2),ringMat('#fff2b0'));rangeRing.renderOrder=10;rangeRing.visible=false;scene.add(rangeRing);
const guardRing=new THREE.Mesh(new THREE.RingGeometry(0.97,1,96).rotateX(-Math.PI/2),ringMat('#9cc0ff'));guardRing.renderOrder=10;guardRing.visible=false;scene.add(guardRing);
const selRing=new THREE.Mesh(new THREE.RingGeometry(0.9,1,48).rotateX(-Math.PI/2),ringMat('#ffe08a'));selRing.renderOrder=11;selRing.visible=false;scene.add(selRing);
const wallPrev=new THREE.InstancedMesh(new THREE.BoxGeometry(0.86,0.9,0.86).translate(0,0.45,0),new THREE.MeshLambertMaterial({color:'#ffffff',transparent:true,opacity:0.55,depthWrite:false}),64);wallPrev.frustumCulled=false;wallPrev.count=0;for(let i=0;i<64;i++)wallPrev.setColorAt(i,WHITE);scene.add(wallPrev);
const footMat=new THREE.MeshBasicMaterial({color:'#5ae65a',transparent:true,opacity:0.35,depthTest:false,depthWrite:false});
const footprint=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),footMat);footprint.renderOrder=9;footprint.visible=false;scene.add(footprint);

// =============== GAME STATE ===============
let buildings,enemies,knights,projs,parts,texts,corpses,rubble,nextId,occ,flow,wave,waveT,spawnQ,gameOver=false,started=false,sel=null,selSet=new Set(),wallMode=false,place=null,speed=1,paused=false,time=0,ach,kills,shake=0,ghost=null;
const cam={tx:BASE.tx+2,tz:BASE.ty+1,D:22,yaw:0,yawT:0,pitch:0.96};
function clearBuildings(){if(buildings)for(const b of buildings){scene.remove(b.group);if(b.disc)scene.remove(b.disc)}if(typeof oldG!=='undefined')for(const o of oldG)scene.remove(o.g);if(rubble)for(const r of rubble)scene.remove(r.mesh)}
function newGame(forLoad){clearBuildings();age=1;ageRes=null;score=0;grpState={};lureNext=0;speed=1;if($('bSpeed'))$('bSpeed').textContent='1×';
  newStats();res={grain:160,wool:80,gold:0};buildings=[];enemies=[];knights=[];projs=[];parts=[];texts=[];corpses=[];rubble=[];nextId=1;
  occ=new Int32Array(GW*GH);flow=new Int32Array(GW*GH);wave=0;waveT=40;spawnQ=[];gameOver=false;sel=null;selSet.clear();setPlace(null);time=0;ach={};kills=0;
  if(!forLoad){const K=addBuilding('archer',BASE.tx-1,BASE.ty-1,true);K.keep=true;K.hp=K.maxhp=K.hp*3;KEEP=K;addBuilding('wheat',BASE.tx+3,BASE.ty-5,true)}
  cam.tx=BASE.tx+2;cam.tz=BASE.ty+0.5;cam.D=W<H?34:30;computeFlow();closeMenu();$('over').classList.add('hidden')}
function addBuilding(type,tx,ty,instant){const T=BT[type],s=T.size;
  const b={id:nextId++,type,tx,ty,s,px:tx*TILE,py:ty*TILE,x:(tx+s/2)*TILE,y:(ty+s/2)*TILE,lvl:1,hp:T.hp,maxhp:T.hp,cd:0,aim:-2.3,raim:-2.3,respawnT:1,focus:null,hit:0,build:instant?1:0,pulse:0,recoil:0,spent:{...BT[type].cost}};
  ST.cnt[type]=(ST.cnt[type]||0)+1;b.st={n:ST.cnt[type],kills:0,dmg:0,taken:0,born:time,died:null,sold:false,b};if(type!=='wall'&&BT[type].kind==='def')ST.all.push(b.st);ST.built++;
  for(let y=ty;y<ty+s;y++)for(let x=tx;x<tx+s;x++)occ[x+y*GW]=b.id;
  b.X=tx+s/2;b.Z=ty+s/2;b.Y=flattenAt(tx,ty,s);
  if(type==='barracks')b.formAng=Math.atan2(SPY-b.y,SPX-b.x);
  buildings.push(b);makeVisual(b);if(type==='wall')refreshWalls(tx,ty);navCache.clear();return b}
const discTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,225,110,0.55)');gr.addColorStop(0.6,'rgba(255,200,60,0.3)');gr.addColorStop(0.82,'rgba(255,200,60,0.25)');gr.addColorStop(0.9,'rgba(255,225,100,0.85)');gr.addColorStop(0.97,'rgba(255,210,80,0.3)');gr.addColorStop(1,'rgba(255,200,60,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
const discMat=new THREE.MeshBasicMaterial({map:discTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true});
let oldG=[],waves=[];
const bAt=(x,y)=>{if(x<0||y<0||x>=GW||y>=GH)return null;const id=occ[x+y*GW];return id?buildings.find(b=>b.id===id):null};
function wallNb(b){const w=(x,y)=>{const o=bAt(x,y);return!!(o&&o.type==='wall')};return{n:w(b.tx,b.ty-1),e:w(b.tx+1,b.ty),s:w(b.tx,b.ty+1),w:w(b.tx-1,b.ty)}}
function refreshWalls(tx,ty){for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const o=bAt(tx+dx,ty+dy);if(o&&o.type==='wall')makeVisual(o)}}
function makeVisual(b,keepOld){if(b.group){if(keepOld){oldG.push({g:b.group,t:0})}else scene.remove(b.group)}
  const m=buildModel(b.type,b.lvl,b.type==='wall'?wallNb(b):null);b.group=m.group;b.anims=m.anims;b.top=m.top;b.barH=m.barH;b.group.position.set(b.X,b.Y,b.Z);b.group.userData.b=b;b.group.traverse(o=>{o.userData.b=b});scene.add(b.group);
  if(!b.disc){b.disc=new THREE.Mesh(new THREE.CircleGeometry(b.s*0.82+0.2,40).rotateX(-Math.PI/2),discMat);b.disc.renderOrder=2;b.disc.visible=false;b.disc.position.set(b.X,b.Y+0.14,b.Z);scene.add(b.disc)}}
function canPlace(type,tx,ty){const s=BT[type].size;
  for(let y=ty;y<ty+s;y++)for(let x=tx;x<tx+s;x++){if(x<1||y<1||x>=GW-1||y>=GH-1)return false;const i=x+y*GW;if(terrain[i]!==0||occ[i]||!reach[i])return false}
  if(nearSpawn(tx,ty,11))return false;if(type==='mine'){if(!depAt(tx,ty))return false}else if(onDeposit(tx,ty,s))return false;
  for(const e of enemies)if(e.x>tx*TILE-8&&e.x<(tx+s)*TILE+8&&e.y>ty*TILE-8&&e.y<(ty+s)*TILE+8)return false;
  return true}
function bfsFlow(goal){flow.fill(1e9);const q=new Int32Array(GW*GH);let h=0,t=0;for(let i=0;i<GW*GH;i++)if(occ[i]&&goal(occ[i])){flow[i]=0;q[t++]=i}
  while(h<t){const i=q[h++],x=i%GW,y=(i/GW)|0,d=flow[i]+1;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(terrain[j]>=1||occ[j])continue;if(flow[j]>d){flow[j]=d;q[t++]=j}}}}
let danger=null,ecoFlow=null;
function costFlow(goal,cost,out){const f=out||flow;f.fill(1e9);const B=[];const push=(i,d)=>{(B[d]||(B[d]=[])).push(i)};for(let i=0;i<GW*GH;i++)if(occ[i]&&goal(occ[i])){f[i]=0;push(i,0)}
  for(let d=0;d<B.length;d++){const L=B[d];if(!L)continue;for(let k=0;k<L.length;k++){const i=L[k];if(f[i]!==d)continue;const x=i%GW,y=(i/GW)|0;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(terrain[j]>=1||occ[j])continue;const nd=d+1+(cost?cost[j]:0);if(f[j]>nd){f[j]=nd;push(j,nd)}}}}return f}
function computeDanger(){danger=danger||new Uint8Array(GW*GH);danger.fill(0);for(const b of buildings){if(b.type!=='archer'&&b.type!=='cannon')continue;const R=rangeOf(b)/TILE,w=b.type==='cannon'?3:2;
  for(let y=Math.floor(b.Z-R);y<=b.Z+R;y++)for(let x=Math.floor(b.X-R);x<=b.X+R;x++){if(x<0||y<0||x>=GW||y>=GH)continue;if(Math.hypot(x+0.5-b.X,y+0.5-b.Z)<=R){const i=x+y*GW;danger[i]=Math.min(30,danger[i]+w*b.lvl)}}}}
function computeFlow(){const walls=new Set(buildings.filter(b=>b.type==='wall').map(b=>b.id));
  if(AI()>=2){computeDanger();costFlow(id=>!walls.has(id),danger);const eco=new Set(buildings.filter(b=>BT[b.type].kind==='eco').map(b=>b.id));ecoFlow=eco.size?costFlow(id=>eco.has(id),danger,ecoFlow||new Int32Array(GW*GH)):null}else{bfsFlow(id=>!walls.has(id));ecoFlow=null}let ok=false;for(const SP of[SPAWN,SPAWN2])for(let dy=-2;dy<=2&&!ok;dy++)for(let dx=-2;dx<=2;dx++){const i=SP.tx+dx+(SP.ty+dy)*GW;if(flow[i]<1e9){ok=true;break}}
  wallMode=!ok&&walls.size>0;if(wallMode){if(AI()>=2)costFlow(()=>true,danger);else bfsFlow(()=>true)}computeWallFlow(walls)}
let wflow=null;function computeWallFlow(walls){if(!walls.size){wflow=null;return}const f=wflow||new Int32Array(GW*GH);f.fill(1e9);const q=new Int32Array(GW*GH);let h=0,t=0;for(let i=0;i<GW*GH;i++)if(occ[i]&&walls.has(occ[i])){f[i]=0;q[t++]=i}
  while(h<t){const i=q[h++],x=i%GW,y=(i/GW)|0,d=f[i]+1;for(const[dx,dy]of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(terrain[j]>=1||occ[j])continue;if(f[j]>d){f[j]=d;q[t++]=j}}}wflow=f}
const tileAt=(x,y)=>{const tx=(x/TILE)|0,ty=(y/TILE)|0;return(x<0||y<0||tx>=GW||ty>=GH)?-1:tx+ty*GW};
function walkable(x,y){const i=tileAt(x,y);return i>=0&&terrain[i]===0&&!occ[i]}
function edgeDist(b,x,y){const x0=b.px,y0=b.py,x1=x0+b.s*TILE,y1=y0+b.s*TILE;return Math.hypot(Math.max(x0-x,0,x-x1),Math.max(y0-y,0,y-y1))}

// ---------- FX helpers (3D units) ----------
function fx(X,Y,Z,n,col,spd,size,life,grav,kind,up=0.6){const c=new THREE.Color(col);for(let i=0;i<n;i++){if(parts.length>1100)return;parts.push({x:X,y:Y,z:Z,vx:(Math.random()-.5)*spd,vy:(Math.random()*up+0.1)*spd,vz:(Math.random()-.5)*spd,life:life*(0.7+Math.random()*0.5),max:life,s:size*(0.6+Math.random()*0.6),c,g:grav,k:kind})}}
const W3=(x,y)=>[x/TILE,heightAt(x/TILE,y/TILE),y/TILE];

// =============== WAVES ===============
const eraOf=n=>Math.floor((Math.max(1,n)-1)/5)+1,ERAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
function pickW(w){let t=0;for(const k in w)t+=w[k];let r=Math.random()*t;for(const k in w){r-=w[k];if(r<=0)return k}return 'spear'}
function startWave(n){if(ST.bossMark&&ST.bossMark.n===n-1&&ST.lost===ST.bossMark.lost)ST.cleanBoss=true;const boss=n%5===0,era=eraOf(n),list=[];if(boss)ST.bossMark={n,lost:ST.lost};if(boss)ST.bosses.push({t:time,n});ST.bestWave=n;const walls=buildings.filter(b=>b.type==='wall').length;
  const cnt=Math.min(24,4+Math.round(n*0.8));const w={spear:1};if(era>=2)w.bowman=0.4;if(era>=3){w.shield=0.4;w.cav=0.15}if(era>=4)w.sapper=walls>4?0.35:0.12;if(era>=5){w.spear=0.6}
  const cntT=t=>buildings.filter(b=>b.type===t).length,nA=cntT('archer'),nC=cntT('cannon'),nK=cntT('barracks');grpState[n]={charge:AI()<2,wait0:null,spread:false};
  if(AI()>=3){if(era>=3)w.shield=(w.shield||0)+nA*0.07;if(era>=2)w.bowman=(w.bowman||0)+nK*0.18;if(era>=4)w.sapper=(w.sapper||0)+walls*0.025;if(era>=3)w.cav=(w.cav||0)+nC*0.05;if(nC>=3)grpState[n].spread=true;lureNext=nK&&era>=3?2:0}
  for(let i=0;i<cnt;i++)list.push(pickW(w));
  if(n>=5){const r=Math.floor((n-3)/4)+(boss?2:0);for(let i=0;i<Math.min(r,6);i++)list.push('ram')}
  if(n===10)for(let i=0;i<7;i++)list.push('cav');else if(boss&&n>10)for(let i=0;i<4;i++)list.push('cav');
  if(n===20)for(let i=0;i<6;i++)list.push('sapper');
  if(boss&&n>=15)for(let i=0;i<Math.max(1,Math.floor(n/12));i++)list.push('boss');
  for(let i=list.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[list[i],list[j]]=[list[j],list[i]]}
  if(boss){const bi=list.indexOf('boss');if(bi>=0){list.splice(bi,1);list.push('boss')}}
  let side=0;if(era>=3){if(boss||(era>=4&&Math.random()<0.35))side=2;else if(n%2===1)side=1;
    if(AI()>=3){let c0=0,c1=0;const a0=Math.atan2(SPY/TILE-BASE.ty,SPX/TILE-BASE.tx),a1=Math.atan2(SP2Y/TILE-BASE.ty,SP2X/TILE-BASE.tx);for(const b of buildings){if(b.type!=='archer'&&b.type!=='cannon'&&b.type!=='barracks')continue;const a=Math.atan2(b.Z-BASE.ty,b.X-BASE.tx);const d0=Math.abs(Math.atan2(Math.sin(a-a0),Math.cos(a-a0))),d1=Math.abs(Math.atan2(Math.sin(a-a1),Math.cos(a-a1)));if(d0<d1)c0+=b.lvl;else c1+=b.lvl}
      side=boss||Math.random()<0.4?2:(c1<c0?1:0)}}
  let delay0=0,delay1=0;if(side===2&&AI()>=3){const f0=flow[SPAWN.tx+SPAWN.ty*GW],f1=flow[SPAWN2.tx+SPAWN2.ty*GW];if(f0<1e9&&f1<1e9){const dd=(Math.abs(f0-f1)*TILE)/(24*DIFF[diff].spd);if(f0<f1)delay0=Math.min(25,dd);else delay1=Math.min(25,dd)}}
  const iv=(boss?0.6:Math.max(0.8,2.4-n*0.06))*(AI()>=2?0.75:1);list.forEach((t,i)=>{const sd=side===2?(i%2):side;spawnQ.push({type:t,t:i*iv+Math.random()*0.3+(sd===0?delay0:delay1),n,side:sd})});
  waveT=((n+1)%5===0?65:Math.max(34,50-n*0.5))*DIFF[diff].gap;if(n>1)addScore((n-1)*40);
  const intro={1:['WAVE 1','Spearmen approach from the southwest.'],5:['BOSS WAVE','Battering Rams! Arrows barely scratch them — build Cannons (Age II).'],6:['ERA II · BOWMEN','Enemy archers shoot your towers and knights from range.'],10:['BOSS WAVE','Cavalry charge! Fast riders — knights hold the line.'],11:['ERA III · A SECOND FRONT','Shieldbearers shrug off arrows — and the enemy now marches from the WEST too.'],15:['BOSS WAVE','The Warlord marches with his host.'],16:['ERA IV · SAPPERS','Powder-keg sappers sprint at your walls. Mazes alone will not hold.'],20:['BOSS WAVE','A siege train: rams and sappers on both fronts.'],21:['ERA V · VETERANS','Hardened veterans on every front. Every tower counts.']};
  if(intro[n])showBanner(...intro[n]);else if(boss)showBanner('BOSS WAVE '+n,'The Red Host gathers on both fronts.');
  if(side===1)setTimeout(()=>toast('⚠ Enemies approaching from the WEST'),600);else if(side===2&&!boss)setTimeout(()=>toast('⚠ Attack on BOTH fronts'),600);
  if((n+1)%5===0)setTimeout(()=>toast('⚠ A boss wave follows this one. Prepare.'),2500)}
const fieldCap=()=>Math.min(30,10+wave*0.6);
function spawnEnemy(type,n,side){const T=ET[type];const cx=side===1?SP2X:SPX,cy=side===1?SP2Y:SPY;let x,y,tries=0;do{x=cx+(Math.random()-.5)*150;y=cy+(Math.random()-.5)*130;tries++}while(!walkable(x,y)&&tries<30);
  const era=eraOf(n),hm=(1+0.05*(n-1))*(era>=5?1+0.22*(era-4):1)*DIFF[diff].hp,dm=(1+0.03*(n-1))*(era>=5?1+0.1*(era-4):1);enemies.push({type,side:side||0,sm:DIFF[diff].spd,g:n,spread:!!(grpState[n]&&grpState[n].spread),lure:!!(lureNext>0&&type==='cav'&&(lureNext--,true)),x,y,hp:T.hp*hm,maxhp:T.hp*hm,dm,cd:Math.random(),ang:-0.8,rAng:-0.8,r:T.r,swing:0,flash:0,walk:Math.random()*6,mvT:0,mvb:0})}

// =============== SIMULATION ===============
function moveUnit(u,tx,ty,spd,dt,others,keep){if(u.sm)spd*=u.sm;let dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<0.5)return;dx/=d;dy/=d;
  let sx=0,sy=0;for(const o of others){if(o===u)continue;const ox=u.x-o.x,oy=u.y-o.y,rr=((u.r+o.r)*1.2+5)*(u.spread?1.7:1);if(Math.abs(ox)>rr||Math.abs(oy)>rr)continue;const dd=ox*ox+oy*oy;if(dd<rr*rr&&dd>0.01){const l=Math.sqrt(dd);sx+=ox/l*(rr-l)/rr;sy+=oy/l*(rr-l)/rr}}
  let vx=dx+sx*2.2,vy=dy+sy*2.2;const vl=Math.hypot(vx,vy)||1;const ti=tileAt(u.x,u.y);if(ti>=0&&terrain[ti]===1)spd*=0.72;
  const step=Math.min(spd*dt,Math.max(0,d-(keep||0))+spd*dt*0.3);const nx=u.x+vx/vl*step,ny=u.y+vy/vl*step;
  if(walkable(nx,u.y))u.x=nx;if(walkable(u.x,ny))u.y=ny;u.ang=Math.atan2(dy,dx);u.walk+=dt*spd*0.25;u.mvT=0.18}
function nearestBuilding(x,y){let b=null,bd=1e9;for(const o of buildings){if(o.type==='wall'&&!wallMode)continue;const d=edgeDist(o,x,y);if(d<bd){bd=d;b=o}}return[b,bd]}
function hurtBuilding(b,d){const real=Math.min(d,Math.max(0,b.hp));if(b.st)b.st.taken+=real;ST.taken+=real;ST.acc.taken+=real;b.hp-=d;b.hit=0.15;const[X,Y,Z]=[b.X,b.Y,b.Z];if(Math.random()<0.35)fx(X+(Math.random()-.5)*b.s*0.8,Y+0.3,Z+(Math.random()-.5)*b.s*0.8,2,'#8a8070',1.2,0.12,0.6,4,2);if(b.hp<=0)destroyBuilding(b)}
function destroyBuilding(b,sold){const i=buildings.indexOf(b);if(i<0)return;if(b.st){b.st.died=time;b.st.sold=!!sold}if(sold)ST.sold++;else ST.lost++;buildings.splice(i,1);scene.remove(b.group);
  for(let y=b.ty;y<b.ty+b.s;y++)for(let x=b.tx;x<b.tx+b.s;x++)occ[x+y*GW]=0;
  for(const k of knights)if(k.b===b)k.hp=0;if(b.disc)scene.remove(b.disc);if(b.flame){scene.remove(b.flame);b.flame=null}selSet.delete(b);navCache.clear();if(b.type==='wall')refreshWalls(b.tx,b.ty);
  if(sold){fx(b.X,b.Y+0.3,b.Z,10+b.s*6,'#cdbb94',2,0.35,1.1,0,0,0.4);fx(b.X,b.Y+0.5,b.Z,8,'#ffd34a',1.6,0.07,0.9,-0.5,1,1);if(sel===b)sel=null;if(hold&&hold.b===b)hold=null;return}
  fx(b.X,b.Y+0.6,b.Z,26,'#7a6a58',3,0.16,1.6,7,2,1.2);fx(b.X,b.Y+0.6,b.Z,22,'#8a8580',1.4,0.55,2.8,-0.3,0,0.8);fx(b.X,b.Y+0.5,b.Z,10,'#ff9a30',1.5,0.3,0.6,0,1);
  const rp=[];for(let k=0;k<6+b.s*4;k++)rp.push(P(dod(0.14+Math.random()*0.16),['#8f897c','#6c675d','#7d5432'][k%3],(Math.random()-.5)*b.s*0.9,0.05,(Math.random()-.5)*b.s*0.9,Math.random(),Math.random(),0,1,0.6,1));
  const rm=new THREE.Mesh(merge(rp),VM);rm.position.set(b.X,b.Y,b.Z);rm.castShadow=true;scene.add(rm);rubble.push({mesh:rm,life:25});
  if(sel===b)sel=null;if(hold&&hold.b===b)hold=null;shake=0.35;AU.crumble();computeFlow();
  if(b.keep||!buildings.length){gameOver=true;arenaLost()}
  else toast(`${BT[b.type].name} destroyed!`)}
function followField(e,f,T,dt){const i=tileAt(e.x,e.y);if(i<0)return false;const fd=f[i];if(fd>=1e9)return false;const x=i%GW,y=(i/GW)|0;let best=fd,bx=-1,by=-1;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;if(dx&&dy&&(f[x+dx+y*GW]>=1e9||f[x+(y+dy)*GW]>=1e9))continue;const j=nx+ny*GW;if(f[j]<best){best=f[j];bx=nx;by=ny}}
  if(bx>=0){moveUnit(e,bx*TILE+16,by*TILE+16,T.speed,dt,enemies);return true}return false}
function sapperBlast(e){const T=ET.sapper,X=e.x,Y=e.y;for(const b of [...buildings]){const d=edgeDist(b,X,Y);if(d<TILE*1.7)hurtBuilding(b,(b.type==='wall'?T.dmg:T.dmg*0.35)*e.dm)}
  for(const k of knights)if(dst(k.x,k.y,X,Y)<TILE*1.5){k.hp-=60;k.flash=0.1}e.hp=0;e.blew=1;const[x3,y3,z3]=W3(X,Y);fx(x3,y3+0.3,z3,18,'#ffae3a',3.4,0.3,0.45,0,1,0.9);fx(x3,y3+0.3,z3,14,'#6a625a',2,0.6,2,-0.25,0,0.7);fx(x3,y3+0.2,z3,10,'#5e4a32',4,0.08,1,8,2,1.2);AU.boom(1);shake=Math.max(shake,0.25)}
function updEnemy(e,dt){if(e.frozen)return;const T=ET[e.type];if(e.cd>0)e.cd-=dt;if(e.swing>0)e.swing-=dt;if(e.flash>0)e.flash-=dt;if(e.mvT>0)e.mvT-=dt;
  if(T.ranged){let tg=null,td=T.range;for(const k of knights){const d=dst(k.x,k.y,e.x,e.y);if(d<td){td=d;tg=k}}if(!tg)for(const b of buildings){const d=edgeDist(b,e.x,e.y);if(d<td){td=d;tg=b}}
    if(tg){e.ang=Math.atan2(tg.y-e.y,tg.x-e.x);if(e.cd<=0){e.cd=T.rate;e.swing=0.25;const d0=Math.max(1,dst(e.x,e.y,tg.x,tg.y));projs.push({k:'earrow',x:e.x,y:e.y,tg,lx:tg.x,ly:tg.y,d0,h0:heightAt(e.x/TILE,e.y/TILE)+0.6,dmg:T.dmg*e.dm,lv:1})}return}}
  if(T.sapper){if(wflow&&buildings.some(b=>b.type==='wall')){let wb=null,wd=1e9;for(const b of buildings)if(b.type==='wall'){const d=edgeDist(b,e.x,e.y);if(d<wd){wd=d;wb=b}}
      if(wb&&wd<=T.range){sapperBlast(e);return}if(followField(e,wflow,T,dt))return}
    const[b,bd]=nearestBuilding(e.x,e.y);if(b&&bd<=T.range){sapperBlast(e);return}}
  if(!T.bldOnly){let k=null,kd=34;for(const o of knights){const d=dst(o.x,o.y,e.x,e.y)-o.r;if(d<kd){kd=d;k=o}}
    if(k){if(kd<=T.range){e.ang=Math.atan2(k.y-e.y,k.x-e.x);if(e.cd<=0){k.hp-=T.dmg*e.dm;k.flash=0.1;e.cd=T.rate;e.swing=0.25}}else moveUnit(e,k.x,k.y,T.speed,dt,enemies);return}}
  const ai=AI();
  if(ai>=2&&(T.ranged||e.lure)){let k=null,kd=e.lure?150:85;for(const o of knights){const d=dst(o.x,o.y,e.x,e.y);if(d<kd){kd=d;k=o}}if(k){const ax=e.x+(e.x-k.x)/kd*48,ay=e.y+(e.y-k.y)/kd*48;if(walkable(ax,ay)){moveUnit(e,ax,ay,T.speed*1.05,dt,enemies);return}}}
  if(ai>=2&&e.type==='cav'&&ecoFlow){const eb=buildings.filter(b=>BT[b.type].kind==='eco');let tb=null,td=1e9;for(const b of eb){const d=edgeDist(b,e.x,e.y);if(d<td){td=d;tb=b}}
    if(tb&&td<=T.range){e.ang=Math.atan2(tb.y-e.y,tb.x-e.x);if(e.cd<=0){hurtBuilding(tb,T.dmg*e.dm);e.cd=T.rate;e.swing=0.25}return}if(tb&&followField(e,ecoFlow,T,dt))return}
  const gs=grpState[e.g];if(ai>=2&&gs&&!gs.charge&&e.type!=='boss'&&e.type!=='sapper'){let maxR=0;for(const b of buildings)if(b.type==='archer'||b.type==='cannon')maxR=Math.max(maxR,rangeOf(b));const holdR=maxR+TILE*1.6;const[nb,nbd]=nearestBuilding(e.x,e.y);
    if(nb&&nbd<holdR&&nbd>holdR-TILE*3){e.wait=true;if(gs.wait0==null)gs.wait0=time;return}}
  e.wait=false;
  const i=tileAt(e.x,e.y),fd=i>=0?flow[i]:1e9;const nbr=nearestBuilding(e.x,e.y);
  if(fd<=2||nbr[1]<TILE*2){const[b,bd]=nbr;if(b){if(e.slotA==null)e.slotA=Math.random()*Math.PI*2;if(bd>T.range&&bd<TILE*1.6){const hs=b.s*TILE/2+T.r+4,ax=b.x+Math.cos(e.slotA)*hs,ay=b.y+Math.sin(e.slotA)*hs;if(walkable(ax,ay)&&dst(ax,ay,e.x,e.y)>4){moveUnit(e,ax,ay,T.speed,dt,enemies);return}}if(bd<=T.range){e.ang=Math.atan2(b.y-e.y,b.x-e.x);if(e.cd<=0){hurtBuilding(b,T.dmg*e.dm);e.cd=T.rate;e.swing=0.25}return}moveUnit(e,b.x,b.y,T.speed,dt,enemies);return}}
  if(fd>=1e9){if(buildings.length)moveUnit(e,buildings[0].x,buildings[0].y,T.speed,dt,enemies);return}
  const x=i%GW,y=(i/GW)|0;let best=fd,bx=-1,by=-1;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
    if(dx&&dy&&(flow[x+dx+y*GW]>=1e9||flow[x+(y+dy)*GW]>=1e9))continue;const j=nx+ny*GW;if(flow[j]<best){best=flow[j];bx=nx;by=ny}}
  if(bx>=0)moveUnit(e,bx*TILE+16,by*TILE+16,T.speed,dt,enemies)}
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
// ---- knight navigation: per-target flow fields (cached), line-of-sight smoothing, steering ----
const navCache=new Map();
function getNav(tx,ty){tx=clamp(tx,0,GW-1);ty=clamp(ty,0,GH-1);const key=tx+ty*GW;let c=navCache.get(key);if(c&&time-c.t<0.7)return c.f;
  const f=c?c.f:new Int32Array(GW*GH);f.fill(1e9);const q=new Int32Array(GW*GH);let h=0,t=0;f[key]=0;q[t++]=key;const blk=j=>terrain[j]>=1||occ[j];
  while(h<t){const i=q[h++],x=i%GW,y=(i/GW)|0,d=f[i];for(const[dx,dy]of D8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(blk(j))continue;if(dx&&dy&&(blk(x+dx+y*GW)||blk(x+(y+dy)*GW)))continue;const nd=d+(dx&&dy?14:10);if(f[j]>nd){f[j]=nd;q[t++]=j}}}
  navCache.delete(key);navCache.set(key,{f,t:time});if(navCache.size>24)navCache.delete(navCache.keys().next().value);return f}
function los(x0,y0,x1,y1,r){const d=Math.hypot(x1-x0,y1-y0);if(d<1)return true;const n=Math.ceil(d/8),px=-(y1-y0)/d*r,py=(x1-x0)/d*r;
  for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(!walkable(x,y)||!walkable(x+px,y+py)||!walkable(x-px,y-py))return false}return true}
function steerPoint(k,X,Y){if(los(k.x,k.y,X,Y,k.r*0.7))return[X,Y];
  const f=getNav((X/TILE)|0,(Y/TILE)|0);let i=tileAt(k.x,k.y);if(i<0)return[X,Y];let best=null;
  for(let step=0;step<10;step++){const x=i%GW,y=(i/GW)|0;let bi=-1,bv=f[i];for(const[dx,dy]of D8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const j=nx+ny*GW;if(f[j]<bv){bv=f[j];bi=j}}
    if(bi<0)break;i=bi;const cx=(i%GW)*TILE+16,cy=((i/GW)|0)*TILE+16;if(step===0||los(k.x,k.y,cx,cy,k.r*0.7))best=[cx,cy];else break}
  return best||[X,Y]}
function knightMove(k,X,Y,spd,dt,stopAt=0){const d=dst(k.x,k.y,X,Y);if(d<=Math.max(1.5,stopAt)){k.vx=(k.vx||0)*0.8;k.vy=(k.vy||0)*0.8;return}
  let [tx,ty]=steerPoint(k,X,Y);let dx=tx-k.x,dy=ty-k.y;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
  let sx=0,sy=0;for(const o of knights){if(o===k)continue;const ox=k.x-o.x,oy=k.y-o.y,rr=k.r+o.r+3;if(Math.abs(ox)>rr||Math.abs(oy)>rr)continue;const dd=Math.hypot(ox,oy);if(dd>0.01&&dd<rr){sx+=ox/dd*(rr-dd)/rr;sy+=oy/dd*(rr-dd)/rr}}
  if(k.nudge>0){k.nudge-=dt;dx+=Math.cos(k.nudgeA)*0.9;dy+=Math.sin(k.nudgeA)*0.9}
  let wx=dx+sx*1.2,wy=dy+sy*1.2;const wl=Math.hypot(wx,wy)||1;wx/=wl;wy/=wl;
  const sp=Math.min(spd,(d-stopAt)/dt+5);k.vx=(k.vx||0)+(wx*sp-(k.vx||0))*Math.min(1,dt*7);k.vy=(k.vy||0)+(wy*sp-(k.vy||0))*Math.min(1,dt*7);
  const vl=Math.hypot(k.vx,k.vy);if(vl<0.5)return;const base=Math.atan2(k.vy,k.vx),step=vl*dt;
  for(const da of[0,0.4,-0.4,0.8,-0.8,1.25,-1.25,1.7,-1.7]){const a=base+da,nx=k.x+Math.cos(a)*step,ny=k.y+Math.sin(a)*step;
    if(walkable(nx,ny)&&walkable(nx+Math.cos(a)*k.r*0.6,ny+Math.sin(a)*k.r*0.6)){k.x=nx;k.y=ny;if(da){k.vx=Math.cos(a)*vl;k.vy=Math.sin(a)*vl}k.ang=a;k.walk+=dt*vl*0.25;k.mvT=0.18;return}}
  k.vx*=0.3;k.vy*=0.3}
function knightGo(k,X,Y,spd,dt){knightMove(k,X,Y,spd,dt)}
function slotPos(b,slot){const n=squadSize(b),a=b.formAng+slot/n*Math.PI*2,r=b.s*TILE*0.5+46;let x=b.x+Math.cos(a)*r,y=b.y+Math.sin(a)*r;
  for(let e=0;e<4&&!walkable(x,y);e++){x+=Math.cos(a)*18;y+=Math.sin(a)*18}if(!walkable(x,y)){x=b.x+Math.cos(b.formAng)*r;y=b.y+Math.sin(b.formAng)*r}return[x,y]}
function spawnKnight(b){const used=new Set(knights.filter(k=>k.b===b).map(k=>k.slot));let slot=0;while(used.has(slot))slot++;const[x,y]=slotPos(b,slot);
  knights.push({b,slot,tier:b.lvl,x,y,hp:KN.hp*hpMulOf(b),maxhp:KN.hp*hpMulOf(b),dmg:KN.dmg*mulOf(b),cd:0,r:KN.r,ang:b.formAng,rAng:b.formAng,walk:0,swing:0,flash:0,mvT:0,mvb:0});
  const[X,Y,Z]=W3(x,y);fx(X,Y+0.2,Z,8,b.lvl===3?'#ffe27a':'#c9c0a8',1,0.2,0.8,0,b.lvl===3?1:0)}
function updBarracks(b,dt){b.navAge=(b.navAge||0)+dt;const mine=knights.filter(k=>k.b===b);
  if(mine.length<squadSize(b)){b.respawnT-=dt;if(b.respawnT<=0){spawnKnight(b);b.respawnT=respawnTime(b)}}
  const R=zoneR(b),sq=b.sq||(b.sq={state:'home',hold:0,x:b.x,y:b.y,inZ:[]});sq.inZ=enemies.filter(e=>dst(e.x,e.y,b.x,b.y)<R);
  if(sq.inZ.length){sq.state='engage';let cx=b.x,cy=b.y;if(mine.length){cx=0;cy=0;for(const k of mine){cx+=k.x;cy+=k.y}cx/=mine.length;cy/=mine.length;sq.x=cx;sq.y=cy}
    let f=null,fd=1e9;for(const e of sq.inZ){const d=dst(e.x,e.y,cx,cy);if(d<fd){fd=d;f=e}}sq.focus=f}
  else if(sq.state==='engage'){sq.state='hold';sq.hold=5}
  else if(sq.state==='hold'){sq.hold-=dt;if(sq.hold<=0)sq.state='return'}
  else if(sq.state==='return'){if(mine.every(k=>{const p=slotPos(b,k.slot);return dst(p[0],p[1],k.x,k.y)<10}))sq.state='home'}}
function pickTarget(k,sq){let t=null,bs=1e9;for(const e of sq.inZ){if(e.hp<=0)continue;const d=dst(e.x,e.y,k.x,k.y);let sc=d+(e.tgtBy||0)*34;
    if(e.type==='ram')sc-=70;if(e.type==='boss')sc-=90;const fi=tileAt(e.x,e.y);if(fi>=0&&flow[fi]<=2)sc-=55;if(!los(k.x,k.y,e.x,e.y,k.r*0.7))sc+=40;if(e===k.tgt)sc-=45;if(e===k.badTgt)sc+=400;if(sc<bs){bs=sc;t=e}}return t}
function updKnight(k,dt){const b=k.b,sq=b.sq;if(k.cd>0)k.cd-=dt;if(k.swing>0)k.swing-=dt;if(k.flash>0)k.flash-=dt;if(k.mvT>0)k.mvT-=dt;if(!sq)return;
  // stuck watchdog
  k.prT=(k.prT||0)+dt;if(k.prT>0.7){const mv=dst(k.x,k.y,k.px??k.x,k.py??k.y);if(k.wantMove&&mv<4){k.nudge=0.45;k.nudgeA=Math.random()*6.28;k.badTgt=k.tgt;k.tgt=null}k.prT=0;k.px=k.x;k.py=k.y}k.wantMove=false;
  if(sq.state==='engage'){k.tgtT=(k.tgtT||0)-dt;if(!k.tgt||k.tgt.hp<=0||k.tgtT<=0||!sq.inZ.includes(k.tgt)){k.tgt=pickTarget(k,sq);k.tgtT=0.7}const t=k.tgt;
    if(t){t.tgtBy=(t.tgtBy||0)+1;const d=dst(t.x,t.y,k.x,k.y),reach=k.r+t.r+6;
      if(d<=reach){k.ang=Math.atan2(t.y-k.y,t.x-k.x);k.vx*=0.5;k.vy*=0.5;if(k.cd<=0){{const vm=VETM[vetOf(b)];hitEnemy(t,k.dmg*vm,b);if(vetOf(b)>=5)for(const o of enemies)if(o!==t&&o.hp>0&&dst(o.x,o.y,k.x,k.y)<reach+12)hitEnemy(o,k.dmg*vm*0.6,b)}t.flash=0.1;k.cd=KN.rate;k.swing=0.25;if(k.tier===3){const[X,Y,Z]=W3(t.x,t.y);fx(X,Y+0.4,Z,3,'#9fe8ff',1.2,0.06,0.4,0,1)}}}
      else{let ax=t.x,ay=t.y;if(d<TILE*2.6){const a=(k.slot*2.4)+Math.atan2(k.y-t.y,k.x-t.x)*0.5;const ox=t.x+Math.cos(a)*(reach-3),oy=t.y+Math.sin(a)*(reach-3);if(walkable(ox,oy)){ax=ox;ay=oy}}
        const charge=d<TILE*3.5?1.3:1;k.wantMove=true;knightMove(k,ax,ay,KN.speed*charge,dt)}return}}
  if(sq.state==='hold'){const a=k.slot/squadSize(b)*Math.PI*2,px=sq.x+Math.cos(a)*36,py=sq.y+Math.sin(a)*36;if(dst(px,py,k.x,k.y)>5){k.wantMove=true;knightMove(k,px,py,KN.speed*0.55,dt)}else k.ang=a;k.hp=Math.min(k.maxhp,k.hp+dt*3);return}
  const p=slotPos(b,k.slot);if(dst(p[0],p[1],k.x,k.y)>4){k.wantMove=true;knightMove(k,p[0],p[1],KN.speed*(sq.state==='return'?0.42:0.7),dt)}else{k.ang=Math.atan2(p[1]-b.y,p[0]-b.x);k.vx=0;k.vy=0}k.hp=Math.min(k.maxhp,k.hp+dt*5)}
function updTower(b,dt){b.cd-=dt;if(b.cd>0)return;const T=BT[b.type],R=rangeOf(b);let t=null,bd=1e9;
  for(const e of enemies){const d=dst(e.x,e.y,b.x,b.y);if(d<R&&d<bd){bd=d;t=e}}if(!t)return;
  b.cd=T.rate/CDM[b.lvl-1]/vetCD(b);b.aim=Math.atan2(t.y-b.y,t.x-b.x);const dmg=T.dmg*mulOf(b)*VETM[vetOf(b)];
  if(b.type==='archer'){const nA=b.lvl;for(let i=0;i<nA;i++){let tt=t;if(i>0){const os=enemies.filter(e=>e!==t&&dst(e.x,e.y,b.x,b.y)<R);if(os.length)tt=os[(Math.random()*os.length)|0]}
    projs.push({k:'arrow',x:b.x,y:b.y,t:tt,lx:tt.x,ly:tt.y,d0:Math.max(1,dst(b.x,b.y,tt.x,tt.y)),h0:b.Y+b.top,dmg,lv:b.lvl,src:b})}AU.arrow()}
  else{projs.push({k:'ball',sx:b.x,sy:b.y,tx:t.x,ty:t.y,time:0,dur:0.45+bd/700,dmg,splash:T.splash*[1,1.25,1.5][b.lvl-1],h0:b.Y+b.top,lv:b.lvl,src:b});AU.boom(0.4);b.recoil=1;
    const a=b.aim;fx(b.X+Math.cos(a)*0.9,b.Y+b.top,b.Z+Math.sin(a)*0.9,7,'#d8d4cc',1.2,0.3,1.1,0.2,0,0.5);fx(b.X+Math.cos(a)*0.9,b.Y+b.top,b.Z+Math.sin(a)*0.9,4,'#ffb040',1,0.15,0.18,0,1)}}
function updProj(p,dt){
  if(p.k==='earrow'){const tg=p.tg,alive=tg&&(tg.hp>0)&&(tg.b?knights.includes(tg):buildings.includes(tg));if(alive){p.lx=tg.x;p.ly=tg.y}const dx=p.lx-p.x,dy=p.ly-p.y,d=Math.hypot(dx,dy),s=420*dt;
    if(d<=s){if(alive){if(tg.b){tg.hp-=p.dmg;tg.flash=0.1}else hurtBuilding(tg,p.dmg)}p.dead=1}else{p.x+=dx/d*s;p.y+=dy/d*s}return}
  if(p.k==='arrow'){if(p.t&&p.t.hp>0){p.lx=p.t.x;p.ly=p.t.y}const dx=p.lx-p.x,dy=p.ly-p.y,d=Math.hypot(dx,dy),s=560*dt;
    if(d<=s){if(p.t&&p.t.hp>0){hitEnemy(p.t,p.dmg*(ET[p.t.type].arrowRes||1),p.src);p.t.flash=0.08;if(p.src&&vetOf(p.src)>=5){let n=0;for(const o of enemies){if(n>=2)break;if(o!==p.t&&o.hp>0&&dst(o.x,o.y,p.t.x,p.t.y)<48){hitEnemy(o,p.dmg*0.6*(ET[o.type].arrowRes||1),p.src);n++}}}}p.dead=1}else{p.x+=dx/d*s;p.y+=dy/d*s}}
  else{p.time+=dt;if(p.time>=p.dur){p.dead=1;if(p.src&&vetOf(p.src)>=5)fires.push({x:p.tx,y:p.ty,r:p.splash*0.75,t:3.2,dps:p.dmg*0.3,src:p.src});for(const e of enemies){const d=dst(e.x,e.y,p.tx,p.ty);if(d<p.splash){hitEnemy(e,p.dmg*(d<p.splash*0.4?1:0.6),p.src);e.flash=0.1}}
    const[X,Y,Z]=W3(p.tx,p.ty);fx(X,Y+0.1,Z,p.lv===3?16:9,p.lv===3?'#7fd8ff':'#ffae3a',p.lv===3?3.2:2.4,0.22,0.35,0,1,0.8);fx(X,Y+0.1,Z,10,'#857a6c',1.6,0.4,1.4,-0.2,0,0.7);fx(X,Y+0.1,Z,8,'#5e4a32',3,0.07,0.9,8,2,1.1);
    AU.boom(0.8);shake=Math.max(shake,0.12)}}}
function update(dt){time+=dt;checkAch(dt);if(AI()>=2)for(const g in grpState){const gs=grpState[g];if(gs.charge)continue;let al=0,wt=0;for(const e of enemies)if(e.g==g){al++;if(e.wait)wt++}const pend=spawnQ.some(s=>s.n==g);if(!pend&&al&&(wt/al>=0.7||(gs.wait0!=null&&time-gs.wait0>12))){gs.charge=true;if(wt>3)toast('⚔ The enemy charges!')}if(!al&&!pend)delete grpState[g]}if(ageRes){ageRes.t+=dt;if(ageRes.t>=ageRes.dur)completeAge()}waveHeld=wave>0&&enemies.length+spawnQ.length>fieldCap();ST.sampT+=dt;if(ST.sampT>=5)stSample();if(enemies.length>ST.peakE){ST.peakE=enemies.length;ST.peakT=time}if(!waveHeld)waveT-=dt;if(waveT<=0)startWave(++wave);
  for(let i=spawnQ.length-1;i>=0;i--){const s=spawnQ[i];s.t-=dt;if(s.t<=0){spawnEnemy(s.type,s.n,s.side||0);spawnQ.splice(i,1)}}
  for(const b of buildings){const T=BT[b.type];if(b.hit>0)b.hit-=dt;if(T.prod){const m=mulOf(b);for(const k in T.prod){const v=T.prod[k]*m*dt;res[k]+=v;ST.earned[k]+=v;ST.acc[k==='grain'?'g':k==='wool'?'w':'o']+=v}}
    if(b.type==='archer'||b.type==='cannon')updTower(b,dt);if(b.type==='wall'&&b.hp<b.maxhp&&b.lvl===3)b.hp=Math.min(b.maxhp,b.hp+dt*6);if(b.type==='barracks')updBarracks(b,dt)}
  for(const e of enemies){e.tgtBy=0;updEnemy(e,dt)}for(const k of knights)updKnight(k,dt);
  for(const p of projs)updProj(p,dt);projs=projs.filter(p=>!p.dead);
  for(const f of fires){f.t-=dt;for(const e of enemies)if(e.hp>0&&dst(e.x,e.y,f.x,f.y)<f.r)hitEnemy(e,f.dps*dt,f.src)}fires=fires.filter(f=>f.t>0);
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.hp<=0){enemies.splice(i,1);kills++;const bo=ET[e.type].bounty;res.grain+=bo;ST.earned.grain+=bo;ST.acc.g+=bo;ST.killsE[e.type]++;addScore(({spear:10,bowman:12,shield:15,sapper:15,cav:20,ram:40,boss:250}[e.type]||10)*(1+0.2*(eraOf(wave)-1)));{const kb=e.killedBy;if(kb&&kb.st){kb.st.kills++;ST.killsBy[kb.type]++;checkVet(kb)}}const[X,Y,Z]=W3(e.x,e.y);texts.push({X,Y:Y+0.9,Z,s:'+'+bo+' 🌾',life:1.3});
    corpses.push({kind:e.type,x:e.x,y:e.y,rAng:e.rAng,walk:e.walk,die:0,mvb:0,swing:0,flash:0});fx(X,Y+0.15,Z,5,'#bfae88',0.9,0.2,0.7,0,0)}}
  for(let i=knights.length-1;i>=0;i--){const k=knights[i];if(k.hp<=0){ST.kLost++;knights.splice(i,1);corpses.push({kind:'knight'+k.tier,x:k.x,y:k.y,rAng:k.rAng,walk:k.walk,die:0,mvb:0,swing:0,flash:0})}}
  for(const c of corpses)c.die+=dt;corpses=corpses.filter(c=>c.die<5.5);
  for(const r of rubble){r.life-=dt;if(r.life<4)r.mesh.position.y-=dt*0.08}rubble=rubble.filter(r=>{if(r.life<=0){scene.remove(r.mesh);return false}return true});
  // music intensity — slow swells
  let near=0,bossOn=false;for(const e of enemies){if(e.type==='boss')bossOn=true;if(near<30)for(const b of buildings){if(dst(e.x,e.y,b.x,b.y)<420){near++;break}}}
  const target=Math.min(1,enemies.length*0.02+near*0.06+(bossOn||(wave%5===0&&enemies.length>4)?0.4:0));
  AU.int+=(target-AU.int)*Math.min(1,dt*(target>AU.int?0.12:0.05));AU.boss=bossOn||(wave%5===0&&enemies.length>4)}

// =============== CAMERA / INPUT ===============
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),PL=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function applyCam(dt){cam.yaw+=(cam.yawT-cam.yaw)*Math.min(1,(dt||0)*6);const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
  const sx=shake>0?(Math.random()-.5)*shake:0,sz=shake>0?(Math.random()-.5)*shake:0;
  camera.position.set(cam.tx+cam.D*cp*Math.sin(cam.yaw)+sx,cam.D*sp,cam.tz+cam.D*cp*Math.cos(cam.yaw)+sz);camera.lookAt(cam.tx+sx,0,cam.tz+sz);camera.updateMatrixWorld();
  sun.position.set(cam.tx+SUNOFF.x,SUNOFF.y,cam.tz+SUNOFF.z);sun.target.position.set(cam.tx,0,cam.tz);sun.target.updateMatrixWorld();
  const s=Math.round(cam.D*0.85+6);const sc=sun.shadow.camera;if(sc.right!==s){sc.left=-s;sc.right=s;sc.top=s;sc.bottom=-s;sc.updateProjectionMatrix()}
  scene.fog.near=cam.D*1.6;scene.fog.far=cam.D*3.6+30}
function toPlane(sx,sy){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(PL,new THREE.Vector3())}
function clampCam(){cam.tx=clamp(cam.tx,3,GW-3);cam.tz=clamp(cam.tz,3,GH-3);cam.D=clamp(cam.D,10,80)}
const ptrs=new Map();let moved=false,pinch=null,anchor=null,gdrag=null,hold=null,lp=null,paint=null,lastTap={b:null,t:0},lastPt=null,camGoal=null,frameDt=0.016;
const HOLD_D=0.14,HOLD_F=0.45;
function pickGround(sx,sy){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObject(ground,false)[0];return h?h.point:toPlane(sx,sy)}
function pickBuilding(sx,sy,slop=0.7){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);const hits=ray.intersectObjects(buildings.map(b=>b.group),true);
  for(const h of hits)if(h.object.userData.b)return h.object.userData.b;
  const pt=pickGround(sx,sy);if(!pt)return null;let best=null,bd=slop;for(const b of buildings){const d=Math.hypot(Math.max(b.tx-pt.x,0,pt.x-b.tx-b.s),Math.max(b.ty-pt.z,0,pt.z-b.ty-b.s));if(d<bd){bd=d;best=b}}return best}
function addSel(b){if(!b||selSet.has(b))return false;selSet.add(b);sel=b;b.selPop=1;AU.tick();sellArm=0;renderThumb();return true}
function clearSel(){selSet.clear();sel=null;sellArm=0;renderThumb()}
function buildWallHere(){}
let wdraw=null;
function lineTiles(x0,y0,x1,y1){const out=[[x0,y0]];let x=x0,y=y0;const DX=x1-x0,DY=y1-y0,dev=(px,py)=>Math.abs((px-x0)*DY-(py-y0)*DX);
  while((x!==x1||y!==y1)&&out.length<60){const cx=x!==x1?[x+Math.sign(DX),y]:null,cy=y!==y1?[x,y+Math.sign(DY)]:null;const nx=cx&&cy?(dev(...cx)<=dev(...cy)?cx:cy):(cx||cy);x=nx[0];y=nx[1];out.push(nx)}return out}
function tileUnder(sx,sy){const pt=pickGround(sx,sy);return pt?[Math.floor(pt.x),Math.floor(pt.z)]:null}
function wallPlan(){if(!wdraw)return[];let cnt=0;const c=BT.wall.cost,bud={...res};return lineTiles(wdraw.a[0],wdraw.a[1],wdraw.b[0],wdraw.b[1]).map(([x,y])=>{const ok=canPlace('wall',x,y);let can=false;if(ok&&bud.grain>=c.grain&&bud.wool>=c.wool){bud.grain-=c.grain;bud.wool-=c.wool;can=true;cnt++}return{x,y,ok,can}})}
function commitWall(){const plan=wallPlan();let n=0;for(const p of plan){if(!p.can||!canPlace('wall',p.x,p.y)||!afford(BT.wall.cost))continue;pay(BT.wall.cost);const b=addBuilding('wall',p.x,p.y);fx(b.X,b.Y+0.1,b.Z,4,'#cdbb94',1.2,0.25,0.7,0,0,0.3);n++}
  if(n){computeFlow();AU.place();if(wallMode)toast('⚠ Fully sealed — enemies will smash through')}else if(plan.length){toast(plan.some(p=>p.ok)?needStr(BT.wall.cost):'Blocked — draw on open grass');AU.deny()}wdraw=null}

function moveGhostTo(sx,sy){if(!place)return;const pt=pickGround(sx,sy);if(!pt)return;const s=BT[place.type].size,fx0=pt.x-s/2,fz0=pt.z-s/2;let tx=Math.round(fx0),ty=Math.round(fz0);
  const painting=false;
  if(place.type==='mine'){let bd=9,bt=null;for(const d of DEPOS){const dd=Math.hypot(d.tx-fx0,d.ty-fz0);if(dd<bd&&canPlace('mine',d.tx,d.ty)){bd=dd;bt=[d.tx,d.ty]}}if(bt){tx=bt[0];ty=bt[1]}else{tx=place.tx;ty=place.ty}}
  else if(!painting&&!canPlace(place.type,tx,ty)){let bd=9,bt=null;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=tx+dx,Y=ty+dy,d=Math.hypot(X-fx0,Y-fz0);if(d<bd&&canPlace(place.type,X,Y)){bd=d;bt=[X,Y]}}if(bt){tx=bt[0];ty=bt[1]}}
  if(tx!==place.tx||ty!==place.ty){
    if(painting){const ox=place.tx,oy=place.ty,steps=Math.max(Math.abs(tx-ox),Math.abs(ty-oy));for(let i=1;i<=steps;i++){place.tx=Math.round(ox+(tx-ox)*i/steps);place.ty=Math.round(oy+(ty-oy)*i/steps);buildWallHere()}}
    place.tx=tx;place.ty=ty;place.pop=0.7;AU.tick()}}
let camVel=null,velS=null,boxSel=null,lsel=null,rdrag=null;
function bAtScreen(sx,sy){const pt=pickGround(sx,sy);if(pt){const tx=Math.floor(pt.x),ty=Math.floor(pt.z);const o=bAt(tx,ty);if(o)return o}return pickBuilding(sx,sy,0.25)}
function paintAlong(x0,y0,x1,y1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/9));for(let i=1;i<=n;i++)addSel(bAtScreen(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n))}
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener("pointerdown",e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,px:e.clientX,py:e.clientY});applyCam(0);camGoal=null;camVel=null;velS=[];
  if(e.button===2&&e.pointerType==='mouse'){rdrag={x:e.clientX,yaw:cam.yaw,anchor:toPlane(W/2,H/2)};anchor=null;moved=true;return}
  if(ptrs.size===1){moved=false;anchor=toPlane(e.clientX,e.clientY);lastPt=[e.clientX,e.clientY];paint=null;lsel=null;
    if(place&&place.type==='wall'){const t=tileUnder(e.clientX,e.clientY);if(t){wdraw={id:e.pointerId,a:t,b:t};anchor=null;AU.tick()}}
    else if(place){const g=scr(place.vx,place.vy+0.4,place.vz);const rad=Math.max(58,BT[place.type].size*34*34/cam.D);
      if(g&&Math.hypot(g[0]-e.clientX,g[1]-e.clientY)<rad){gdrag={id:e.pointerId,ox:g[0]-e.clientX,oy:g[1]-e.clientY};anchor=null;place.lift=1}else lp={id:e.pointerId,t0:performance.now()}}
    else if(started&&!gameOver){const b=bAtScreen(e.clientX,e.clientY)||pickBuilding(e.clientX,e.clientY);if(b){hold={b,id:e.pointerId,t:0,fail:false,ups:0};paint={id:e.pointerId,b0:b,on:false}}else lsel={id:e.pointerId,t0:performance.now()}}}
  if(ptrs.size===2){hold=null;lp=null;paint=null;wdraw=null;lsel=null;boxSel=null;if(gdrag){gdrag=null;if(place)place.lift=0}const[a,b]=[...ptrs.values()];const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,D:cam.D,anchor:toPlane(mx,my),a0:Math.atan2(b.y-a.y,b.x-a.x),yaw0:cam.yaw,rot:false};moved=true}});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const px=p.x,py=p.y;p.x=e.clientX;p.y=e.clientY;lastPt=[p.x,p.y];
  if(rdrag){cam.yaw=cam.yawT=rdrag.yaw+(p.x-rdrag.x)*0.008;applyCam(0);const q=toPlane(W/2,H/2);if(q&&rdrag.anchor){cam.tx+=rdrag.anchor.x-q.x;cam.tz+=rdrag.anchor.z-q.z;clampCam()}return}
  if(wdraw&&wdraw.id===e.pointerId){const t=tileUnder(p.x,p.y);if(t&&(t[0]!==wdraw.b[0]||t[1]!==wdraw.b[1])){wdraw.b=t;AU.tick()}return}
  if(gdrag&&gdrag.id===e.pointerId){applyCam(0);moveGhostTo(p.x+gdrag.ox,p.y+gdrag.oy);return}
  if(boxSel&&boxSel.id===e.pointerId){boxSel.x1=p.x;boxSel.y1=p.y;return}
  if(paint&&paint.id===e.pointerId){if(!paint.on&&Math.hypot(p.x-p.sx,p.y-p.sy)>12){paint.on=true;moved=true;hold=null;addSel(paint.b0);paintAlong(p.sx,p.sy,p.x,p.y)}else if(paint.on)paintAlong(px,py,p.x,p.y);if(paint.on)return}
  if(ptrs.size===1&&anchor){if(!moved&&Math.hypot(p.x-p.sx,p.y-p.sy)>11){moved=true;hold=null;lp=null;lsel=null}
    if(moved){applyCam(0);const q=toPlane(p.x,p.y);if(q){const ox=cam.tx,oz=cam.tz;cam.tx+=anchor.x-q.x;cam.tz+=anchor.z-q.z;clampCam();const now=performance.now();velS.push([now,cam.tx-ox,cam.tz-oz]);while(velS.length&&now-velS[0][0]>90)velS.shift()}}}
  else if(ptrs.size===2&&pinch){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    let da=Math.atan2(b.y-a.y,b.x-a.x)-pinch.a0;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;if(!pinch.rot&&Math.abs(da)>0.14){pinch.rot=true;pinch.a0+=Math.sign(da)*0.14;da-=Math.sign(da)*0.14}
    cam.D=clamp(pinch.D*pinch.d/d,10,80);if(pinch.rot){cam.yaw=cam.yawT=pinch.yaw0+da}applyCam(0);const q=toPlane(mx,my);if(q&&pinch.anchor){cam.tx+=pinch.anchor.x-q.x;cam.tz+=pinch.anchor.z-q.z;clampCam()}}});
function pend(e){if(!ptrs.has(e.pointerId))return;
  if(rdrag){rdrag=null;ptrs.delete(e.pointerId);return}
  if(wdraw&&wdraw.id===e.pointerId){if(e.type==='pointerup')commitWall();wdraw=null}
  else if(gdrag&&gdrag.id===e.pointerId){gdrag=null;if(place)place.lift=0}
  else if(boxSel&&boxSel.id===e.pointerId){finishBox();boxSel=null}
  else if(ptrs.size===1&&!moved&&e.type==='pointerup'){if(!(hold&&(hold.ups>0||hold.fail||hold.t>0.3)))onTap(e.clientX,e.clientY)}
  else if(ptrs.size===1&&moved&&anchor&&!paint&&velS&&velS.length>1){const t0=velS[0][0],t1=velS[velS.length-1][0],dtv=Math.max(16,t1-t0)/1000;let vx=0,vz=0;for(const v of velS){vx+=v[1];vz+=v[2]}vx/=dtv;vz/=dtv;const sp=Math.hypot(vx,vz);if(sp>1.5&&performance.now()-t1<60){const k=Math.min(1,cam.D*1.6/sp);camVel=[vx*k,vz*k]}}
  hold=null;lp=null;paint=null;lsel=null;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(ptrs.size===1){const r=[...ptrs.values()][0];applyCam(0);anchor=toPlane(r.x,r.y);r.sx=-999;velS=[]}else anchor=null}
function finishBox(){const b=boxSel;const x0=Math.min(b.x0,b.x1),x1=Math.max(b.x0,b.x1),y0=Math.min(b.y0,b.y1),y1=Math.max(b.y0,b.y1);if(x1-x0<8&&y1-y0<8)return;let n=0;
  for(const o of buildings){const s2=scr(o.X,o.Y+0.4,o.Z);if(s2&&s2[0]>=x0&&s2[0]<=x1&&s2[1]>=y0&&s2[1]<=y1){if(!selSet.has(o)){selSet.add(o);o.selPop=1;n++;sel=o}}}if(n){AU.tick();renderThumb();toast(`${selSet.size} selected · hold one to upgrade all`)}}
cv.addEventListener('pointerup',pend);cv.addEventListener('pointercancel',pend);
cv.addEventListener('wheel',e=>{e.preventDefault();applyCam(0);const a=toPlane(e.clientX,e.clientY);cam.D=clamp(cam.D*Math.exp(e.deltaY*0.0012),10,80);applyCam(0);const q=toPlane(e.clientX,e.clientY);if(a&&q){cam.tx+=a.x-q.x;cam.tz+=a.z-q.z}clampCam()},{passive:false});
function inputTick(dt){
  if(camVel&&!ptrs.size){cam.tx+=camVel[0]*dt;cam.tz+=camVel[1]*dt;clampCam();const k=Math.exp(-dt*4.5);camVel[0]*=k;camVel[1]*=k;if(Math.hypot(camVel[0],camVel[1])<0.3)camVel=null}
  if(lsel&&!moved){if(performance.now()-lsel.t0>380&&lastPt){boxSel={id:lsel.id,x0:lastPt[0],y0:lastPt[1],x1:lastPt[0],y1:lastPt[1]};lsel=null;anchor=null;moved=true;AU.tick()}}
  if(hold&&!moved){hold.t+=dt;if(hold.t>HOLD_D){if(!selSet.has(hold.b)){clearSel();addSel(hold.b)}if(!hold.fail&&hold.t>=HOLD_D+HOLD_F){if(upgradeSel(hold.b)){hold.ups++;hold.t=HOLD_D-0.2}else hold.fail=true}}}
  if(lp&&!moved){if(performance.now()-lp.t0>280&&lastPt){gdrag={id:lp.id,ox:0,oy:-60};lp=null;anchor=null;if(place)place.lift=1;applyCam(0);moveGhostTo(lastPt[0],lastPt[1]-60);AU.tick()}}
  if(gdrag&&lastPt){const m=48,sp=cam.D*0.85*dt;let ex=0,ey=0;if(lastPt[0]<m)ex=-1;else if(lastPt[0]>W-m)ex=1;if(lastPt[1]<m+50)ey=-1;else if(lastPt[1]>H-m)ey=1;
    if(ex||ey){const cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw);cam.tx+=(ex*cy+ey*sy)*sp;cam.tz+=(-ex*sy+ey*cy)*sp;clampCam();applyCam(0);moveGhostTo(lastPt[0]+gdrag.ox,lastPt[1]+gdrag.oy)}}
  if(camGoal){const k=Math.min(1,dt*5);cam.tx+=(camGoal.x-cam.tx)*k;cam.tz+=(camGoal.z-cam.tz)*k;if(Math.hypot(camGoal.x-cam.tx,camGoal.z-cam.tz)<0.05)camGoal=null}}
function onTap(sx,sy){if(!started||gameOver)return;applyCam(0);
  if(place){moveGhostTo(sx,sy);return}
  const b=pickBuilding(sx,sy),now=performance.now();
  if(b){if(lastTap.b===b&&now-lastTap.t<360){addSel(b);repairSel();lastTap={b:null,t:0}}else{if(!addSel(b)){sel=b}lastTap={b,t:now};if(!ach.hint){ach.hint=1;toast('Hold: upgrade · Double-tap: repair · Swipe: select many')}}}
  else{clearSel();if(menu)closeMenu()}}
const mini=$('mini'),mctx=mini.getContext('2d'),miniBase=document.createElement('canvas');
function buildMiniBase(){miniBase.width=mini.width;miniBase.height=mini.height;const g=miniBase.getContext('2d');g.drawImage(gtc,0,0,mini.width,mini.height);const s=mini.width/GW;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const t=terrain[x+y*GW];if(t===2){g.fillStyle='rgba(30,55,22,0.85)';g.fillRect(x*s,y*s,s+0.5,s+0.5)}else if(t===1){g.fillStyle='rgba(50,85,35,0.5)';g.fillRect(x*s,y*s,s+0.5,s+0.5)}else if(t===3){g.fillStyle='#4a8cb5';g.fillRect(x*s,y*s,s+0.5,s+0.5)}}
  g.fillStyle='rgba(200,40,30,0.7)';g.beginPath();g.arc(SPX/TILE*s,SPY/TILE*s,8,0,7);g.fill();g.fillStyle='rgba(200,40,30,0.45)';g.beginPath();g.arc(SP2X/TILE*s,SP2Y/TILE*s,7,0,7);g.fill()}
function drawMini(){drawMini0();drawMiniArena()}
function drawMini0(){const s=mini.width/GW;mctx.drawImage(miniBase,0,0);for(const d of DEPOS){if(occ[d.tx+d.ty*GW])continue;mctx.fillStyle='#ffd34a';mctx.beginPath();mctx.arc((d.tx+1)*s,(d.ty+1)*s,3.2,0,7);mctx.fill()}
  for(const b of buildings){mctx.fillStyle='#4f8fff';mctx.fillRect(b.tx*s-1,b.ty*s-1,b.s*s+2,b.s*s+2)}
  mctx.fillStyle='#ff3a2a';for(const e of enemies){const z=e.type==='boss'?6:e.type==='ram'?4:3;mctx.fillRect(e.x/TILE*s-z/2,e.y/TILE*s-z/2,z,z)}
  mctx.fillStyle='#d8ecff';for(const k of knights)mctx.fillRect(k.x/TILE*s-1,k.y/TILE*s-1,2.5,2.5);
  applyCam(0);const c=[[0,0],[W,0],[W,H],[0,H]].map(([x,y])=>toPlane(x,y)).filter(Boolean);
  if(c.length===4){mctx.strokeStyle='#ffe9a8';mctx.lineWidth=2;mctx.beginPath();c.forEach((p,i)=>i?mctx.lineTo(p.x*s,p.z*s):mctx.moveTo(p.x*s,p.z*s));mctx.closePath();mctx.stroke()}}
function miniJump(e){const r=mini.getBoundingClientRect();cam.tx=(e.clientX-r.left)/r.width*GW;cam.tz=(e.clientY-r.top)/r.height*GH;clampCam()}
mini.addEventListener('pointerdown',e=>{mini.setPointerCapture(e.pointerId);miniJump(e)});mini.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')miniJump(e)});

// =============== UI ===============
function showBanner(a,b){const el=$('banner');el.querySelector('.a').textContent=a;el.querySelector('.b').textContent=b;el.classList.add('show');clearTimeout(showBanner.t);showBanner.t=setTimeout(()=>el.classList.remove('show'),4200)}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200)}
function updSel(){}
const SHORT={grain:'🌾',wool:'🐑',gold:'🪙'};
function needStr(c){const p=[];for(const k of['grain','wool','gold'])if(c[k]>res[k])p.push(SHORT[k]+Math.ceil(c[k]-res[k]));return 'Need '+p.join(' ')+' more'}
function shortCost(c){return['grain','wool','gold'].filter(k=>c[k]).map(k=>`<span class="${res[k]<c[k]?'bad':''}">${c[k]}${SHORT[k]}</span>`).join(' ')}
function onPress(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.classList.add('press');fn(e)});const up=()=>el.classList.remove('press');
  for(const ev of['pointerup','pointercancel','pointerleave'])el.addEventListener(ev,up);el.addEventListener('click',e=>e.preventDefault());el.addEventListener('contextmenu',e=>e.preventDefault())}
const MENU={def:['archer','cannon','barracks','wall'],eco:['wheat','sheep','mine']},SHORTN={archer:'Archer',cannon:'Cannon',barracks:'Knights',wall:'Wall',wheat:'Wheat',sheep:'Sheep',mine:'Gold Mine'};let menu=null;
const optEls=[...document.querySelectorAll('.tb.opt:not(#bSell)')];let sellArm=0;
function setBtn(el,ic,lb,cls){const k=ic+lb+cls;if(el.dataset.k===k)return;el.dataset.k=k;el.innerHTML=`<span class="ic">${ic}</span><span class="lb">${lb}</span>`;el.classList.toggle('ok',cls==='ok');el.classList.toggle('cancel',cls==='cancel')}
const AGET=[0,0,40,75];let ageRes=null;
function advanceAge(){if(age>=3){toast('Your realm stands in its final age');return}if(ageRes){toast(`Researching ${AGEN[ageRes.to]} — ${Math.ceil(ageRes.dur-ageRes.t)}s left`);return}
  const c=AGEC[age+1];if(!afford(c)){toast(needStr(c));AU.deny();return}pay(c);ageRes={to:age+1,t:0,dur:AGET[age+1]};AU.place();toast(`Researching ${AGEN[age+1]}… keep the realm alive!`);renderAge()}
function completeAge(){const to=ageRes.to;ageRes=null;age=to;ST.ages=(ST.ages||[]);ST.ages.push({t:time,age});AU.levelUp(age+1);shake=0.3;
  for(const b of buildings)fx(b.X,b.Y+0.5,b.Z,8,age===3?'#ffe27a':'#e8e0d0',1.8,0.09,1.3,-0.5,1,1.3);
  showBanner(age===2?'AGE II · THE AGE OF STONE':'AGE III · THE JEWELED AGE',age===2?'Cannons, Knights and Stone-tier upgrades unlocked.':'Jeweled-tier upgrades unlocked. Gleam.');renderThumb();renderAge()}
function renderAge(){const el=$('bAge');if(!el)return;if(!started){el.style.display='none';return}el.style.display='';
  if(age>=3&&!ageRes){el.className='wood max';el.querySelector('.ic').textContent='👑';el.querySelector('.nm').textContent='Age III';el.querySelector('.cs').textContent='Final age';return}
  if(ageRes){const pr=ageRes.t/ageRes.dur;el.className='wood res';el.style.setProperty('--p',pr.toFixed(3));el.querySelector('.ic').textContent='⏳';el.querySelector('.nm').textContent=AGEN[ageRes.to];el.querySelector('.cs').textContent=Math.ceil(ageRes.dur-ageRes.t)+'s';return}
  const c=AGEC[age+1],ok=afford(c);el.className='wood '+(ok?'ready':'no');el.querySelector('.ic').textContent='⚜️';el.querySelector('.nm').textContent=AGEN[age+1];
  el.querySelector('.cs').innerHTML=['grain','wool','gold'].map(k=>res[k]>=c[k]?`${c[k]}${SHORT[k]}`:`<span class="bad">${Math.floor(res[k])}/${c[k]}${SHORT[k]}</span>`).join(' ')}
function renderThumb(){const d=$('bDef'),e=$('bEco');
  if(place&&place.type==='wall'){setBtn(d,'✓','Done','ok');setBtn(e,'✕','Done','cancel');d.classList.remove('no')}
  else if(place){setBtn(d,'✓','BUILD','ok');setBtn(e,'✕','Cancel','cancel');d.classList.toggle('no',!canPlace(place.type,place.tx,place.ty)||!afford(costOf(place.type)))}
  else{d.classList.remove('no');setBtn(d,menu==='def'?'✕':'🏹',menu==='def'?'Close':'Defense','');setBtn(e,menu==='eco'?'✕':'🌾',menu==='eco'?'Close':'Economy','')}
  const list=menu?MENU[menu]:null;
  optEls.forEach((el,i)=>{if(!list||i>=list.length){el.classList.add('hide');return}const k=list[i],T=BT[k]||{cost:{grain:0,wool:0,gold:0}},can=afford(T.cost);el.classList.remove('hide');
    if(k==='age'){const c=AGEC[age+1];const key='age'+age+(c?['grain','wool','gold'].map(r=>res[r]>=c[r]?1:0).join(''):'');if(el.dataset.k!==key){el.dataset.k=key;el.innerHTML=c?`<span class="ic">⚜️</span><span class="nm">${AGEN[age+1]}</span><span class="cs">${shortCost(c)}</span>`:`<span class="ic">👑</span><span class="nm">Final Age</span>`}el.classList.toggle('no',!c||!afford(c));el.classList.remove('selo');return}
    const cc=costOf(k),lk=locked(k),key=k+lk+['grain','wool','gold'].map(r=>res[r]>=cc[r]?1:0).join('')+cc.grain;if(el.dataset.k!==key){el.dataset.k=key;el.innerHTML=lk?`<span class="ic">🔒</span><span class="nm">${SHORTN[k]}</span><span class="cs">${AGEN[AGEREQ[k]]}</span>`:`<span class="ic">${T.ic}</span><span class="nm">${SHORTN[k]}</span><span class="cs">${shortCost(cc)}</span>`}
    el.classList.toggle('no',lk||!afford(cc));el.classList.toggle('selo',!!(place&&place.type===k))});
  const sb=$('bSell'),group=[...selSet].filter(b=>buildings.includes(b));if(!place&&!menu&&group.length){sb.classList.remove('hide');const r=refundOf(group);const key='s'+sellArm+r.grain+'_'+r.wool+'_'+r.gold+group.length;
    if(sb.dataset.k!==key){sb.dataset.k=key;sb.innerHTML=sellArm?`<span class="ic">⚠️</span><span class="nm">Tap to confirm</span><span class="cs">sell ${group.length}</span>`:`<span class="ic">🗑️</span><span class="nm">Sell${group.length>1?' '+group.length:''}</span><span class="cs">${['grain','wool','gold'].filter(k=>r[k]).map(k=>'+'+r[k]+SHORT[k]).join(' ')}</span>`}
    sb.classList.toggle('armed',!!sellArm)}else{sb.classList.add('hide');sellArm=0}}
function refundOf(list){const r={grain:0,wool:0,gold:0};for(const b of list)for(const k in r)r[k]+=Math.floor((b.spent?b.spent[k]:BT[b.type].cost[k])*0.5);return r}
function sellSel(){const list=[...selSet].filter(b=>buildings.includes(b)&&!b.keep);if(!list.length)return;if(list.length>=buildings.length){toast("Can't sell your last building");AU.deny();sellArm=0;renderThumb();return}
  const r=refundOf(list);for(const k in r)res[k]+=r[k];for(const b of list){texts.push({X:b.X,Y:b.Y+b.barH*0.6,Z:b.Z,s:'+'+Math.floor((b.spent||BT[b.type].cost).grain*0.5)+'🌾',life:1.2,c:'#ffe9a8'});destroyBuilding(b,true)}
  computeFlow();clearSel();AU.place();toast(`Sold ${list.length} for ${['grain','wool','gold'].filter(k=>r[k]).map(k=>r[k]+SHORT[k]).join(' ')}`)}
function openMenu(m){menu=m;clearSel();setPlace(null);renderThumb();AU.tick()}
function closeMenu(){menu=null;setPlace(null);renderThumb()}
function setPlace(p){place=p;if(ghost){scene.remove(ghost);ghost=null}footprint.visible=false;rangeRing.visible=guardRing.visible=false;
  if(p&&p.type!=='wall'){const m=buildModel(p.type,1);ghost=m.group;ghost.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshLambertMaterial({color:'#ffffff',transparent:true,opacity:0.62,depthWrite:false});o.castShadow=false}});ghost.userData.anims=m.anims;scene.add(ghost)}
  renderThumb()}
function centerSpot(type){const s=BT[type].size,cx=Math.round(cam.tx-s/2),cy=Math.round(cam.tz-s/2);for(let r=0;r<12;r++){let best=null,bd=1e9;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(canPlace(type,cx+dx,cy+dy)){const d=Math.hypot(dx,dy);if(d<bd){bd=d;best={tx:cx+dx,ty:cy+dy}}}}if(best)return best}return null}
function chooseSpot(type){if(type==='mine'){const core=buildings.filter(b=>b.type!=='wall');let cx=BASE.tx,cz=BASE.ty;if(core.length){cx=0;cz=0;for(const b of core){cx+=b.X;cz+=b.Z}cx/=core.length;cz/=core.length}let best=null,bd=1e9;for(const d of DEPOS){if(!canPlace('mine',d.tx,d.ty))continue;const dd=Math.hypot(d.tx+1-cx,d.ty+1-cz);if(dd<bd){bd=dd;best={tx:d.tx,ty:d.ty}}}return best}
const T=BT[type],s=T.size,def=T.kind==='def';if(!buildings.length)return null;const core=buildings.filter(b=>b.type!=='wall');const cb=core.length?core:buildings;
  let cx=0,cz=0;for(const b of cb){cx+=b.X;cz+=b.Z}cx/=cb.length;cz/=cb.length;
  const sx=SPX/TILE-cx,sz=SPY/TILE-cz,sl=Math.hypot(sx,sz)||1,ux=sx/sl,uz=sz/sl;
  const appr=[];if(def&&type!=='wall'){for(let z=Math.max(0,Math.floor(cz-26));z<Math.min(GH,cz+26);z++)for(let x=Math.max(0,Math.floor(cx-26));x<Math.min(GW,cx+26);x++){const f=flow[x+z*GW];if(f>=1&&f<=9&&((x+0.5-cx)*ux+(z+0.5-cz)*uz)>-3)appr.push(x+0.5,z+0.5)}}
  const rng=type==='barracks'?ZONE[0]*0.35/TILE:(T.range||0)/TILE,r2=rng*rng;let best=null,bs=-1e9;const R=17;
  const walls=buildings.filter(b=>b.type==='wall'),last=walls[walls.length-1];
  for(let ty=Math.floor(cz-R);ty<=cz+R;ty++)for(let tx=Math.floor(cx-R);tx<=cx+R;tx++){if(!canPlace(type,tx,ty))continue;
    const X=tx+s/2,Z=ty+s/2,d=Math.hypot(X-cx,Z-cz),fwd=(X-cx)*ux+(Z-cz)*uz;let sc;
    if(type==='wall'){if(last){const dl=Math.hypot(X-last.X,Z-last.Z);const adj=Math.abs(tx-last.tx)+Math.abs(ty-last.ty)===1;sc=(adj?20:0)-dl*2+(adj?((X-last.X)*-uz+(Z-last.Z)*ux)*(walls.length>1&&((last.X-walls[walls.length-2].X)*-uz+(last.Z-walls[walls.length-2].Z)*ux)<0?-3:3):0)}
      else sc=-Math.abs(fwd-6)*3-Math.abs((X-cx)*-uz+(Z-cz)*ux)*0.8;
      let gap=99;for(const b of core){const g=Math.max(b.tx-(tx+s),tx-(b.tx+b.s),b.ty-(ty+s),ty-(b.ty+b.s),0);if(g<gap)gap=g}if(gap<1)sc-=6}
    else{let gap=99;for(const b of buildings){const g=Math.max(b.tx-(tx+s),tx-(b.tx+b.s),b.ty-(ty+s),ty-(b.ty+b.s),0);if(g<gap)gap=g}
      if(def){let cov=0;for(let i=0;i<appr.length;i+=2){const dx=appr[i]-X,dz=appr[i+1]-Z;if(dx*dx+dz*dz<r2)cov++}
        let ov=0;for(const b of buildings)if(b.type===type){const dd=Math.hypot(b.X-X,b.Z-Z);if(dd<rng*0.8)ov+=rng*0.8-dd}
        sc=cov*0.5+fwd*(type==='barracks'?2.2:1.0)-d*0.5-ov*3-(gap>3?(gap-3)*2:0)-(gap===0?1.5:0)}
      else sc=-d-fwd*1.6-(gap>1?(gap-1)*2.5:0)+(gap===0?0.4:0)}
    if(sc>bs){bs=sc;best={tx,ty}}}
  return best}
function startPlace(type){const T=BT[type];if(type==='age'){advanceAge();return}if(locked(type)){toast(`${T.name} unlocks in ${AGEN[AGEREQ[type]]}`);AU.deny();return}const cc=costOf(type);if(!afford(cc)){toast(needStr(cc));AU.deny();return}
  if(type==='wall'){setPlace({type:'wall',tx:0,ty:0,vx:0,vy:0,vz:0});clearSel();AU.tick();toast('Drag on the map to draw a wall line · tap for one piece');return}
  const sp=T.kind==='def'?centerSpot(type):chooseSpot(type);if(!sp){toast(type==='mine'?'No free gold deposits — look for ✦ gold rocks on the map':'No open ground nearby');AU.deny();return}const s=T.size,X=sp.tx+s/2,Z=sp.ty+s/2;
  setPlace({type,tx:sp.tx,ty:sp.ty,vx:X,vz:Z,vy:Math.max(-0.1,heightAt(X,Z)),pop:1,lift:0});clearSel();AU.tick();
  applyCam(0);const g=scr(X,0,Z);if(!g||g[0]<W*0.12||g[0]>W*0.82||g[1]<H*0.18||g[1]>H*0.66)camGoal={x:X,z:Z}}
function confirmPlace(){if(!place)return;if(place.type==='wall'){setPlace(null);return}const T=BT[place.type];if(!canPlace(place.type,place.tx,place.ty)){toast('Blocked here — drag it onto open grass');AU.deny();return}
  const cc=costOf(place.type);if(!afford(cc)){toast(needStr(cc));AU.deny();return}
  pay(cc);const type=place.type;const b=addBuilding(type,place.tx,place.ty);b.spent={...cc};computeFlow();AU.place();fx(b.X,b.Y+0.1,b.Z,16,'#cdbb94',2.2,0.35,1.1,0,0,0.25);
  if(b.type==='mine'&&!ach.mine){ach.mine=1;showBanner('STEADY GOLD','Your first gold mine. Gold now flows.')}
  if(b.type==='barracks'&&!ach.bar){ach.bar=1;showBanner('KNIGHTS OF BLUE','Mounted knights now guard a wide zone.')}
  if(b.type==='cannon'&&!ach.can){ach.can=1;toast('First Cannon Tower — rams beware!')}
  setPlace(null)}
function doUpgrade(b){ST.upgrades++;const uc=upCost(b);pay(uc);for(const k in uc)b.spent[k]+=uc[k];b.lvl++;const T=BT[b.type];b.maxhp=T.hp*hpMulOf(b);b.hp=b.maxhp;makeVisual(b,true);b.pulse=0;b.build=0;
  const L=b.lvl,gold=L===3;beams.push(makeBeam(b,gold?'#ffe27a':'#e8e0d0'));waves.push(makeWave(b,gold?'#ffd34a':'#d8d0c0'));
  if(gold){fx(b.X,b.Y+0.6,b.Z,40,'#ffd34a',3.4,0.1,1.6,-0.4,1,1.6);fx(b.X,b.Y+0.6,b.Z,14,'#9fe8ff',3,0.08,1.4,-0.4,1,1.6);fx(b.X,b.Y+0.6,b.Z,10,'#ff8ab0',3,0.08,1.4,-0.4,1,1.6)}
  else{fx(b.X,b.Y+0.5,b.Z,26,'#9a958a',3.2,0.12,1.3,7,2,1.4);fx(b.X,b.Y+0.3,b.Z,18,'#d8d0c0',2.2,0.4,1.5,-0.2,0,0.6)}
  texts.push({X:b.X,Y:b.Y+b.barH+0.4,Z:b.Z,s:gold?'✦ JEWELED ✦':'STONE!',life:1.9,c:gold?'#ffe27a':'#e8e8f0',big:1});AU.levelUp(L);shake=Math.max(shake,gold?0.22:0.14);
  if(b.type==='barracks')for(const k of knights)if(k.b===b){k.tier=L;k.maxhp=KN.hp*hpMulOf(b);k.hp=k.maxhp;k.dmg=KN.dmg*mulOf(b)}
  if(b.type==='wall')refreshWalls(b.tx,b.ty)}
function upgradeSel(held){const all=[...selSet].filter(b=>buildings.includes(b)&&b.lvl<MAXLVL),list=all.filter(b=>b.lvl<age).sort((a,b)=>costSum(upCost(a))-costSum(upCost(b)));
  if(!all.length){toast('★ Max tier');return false}if(!list.length){toast(`${TIERN[age+1]} tier needs ${AGEN[age+1]} — advance from the Economy menu`);AU.deny();return false}let n=0;for(const b of list)if(afford(upCost(b))){doUpgrade(b);n++}
  if(!n){toast(needStr(upCost(list[0])));AU.deny();return false}
  if(!ach.up){ach.up=1;setTimeout(()=>toast('Keep holding to chain the next tier'),1000)}return true}
function repairSel(){const list=[...selSet].filter(b=>buildings.includes(b)&&b.hp<b.maxhp-0.5);if(!list.length){toast('Already at full health');return}let n=0;
  for(const b of list){const rc=repCost(b);if(!afford(rc))continue;pay(rc);b.hp=b.maxhp;b.pulse=0.6;n++;fx(b.X,b.Y+0.4,b.Z,10,'#e8dcc0',1.6,0.25,0.9,0,0,0.4);fx(b.X,b.Y+0.6,b.Z,8,'#9dff9d',1.4,0.07,0.9,-0.6,1,1);texts.push({X:b.X,Y:b.Y+b.barH+0.3,Z:b.Z,s:'🔨',life:1.1,c:'#9dff9d'})}
  if(!n){toast(needStr(repCost(list[0])));AU.deny();return}AU.place()}
let beams=[];
function makeBeam(b,col){const m=new THREE.Mesh(new THREE.CylinderGeometry(b.s*0.42,b.s*0.55,9,24,1,true),GLOWM(col,0.75));m.position.set(b.X,b.Y+4.5,b.Z);scene.add(m);return{m,life:1.0}}
function makeWave(b,col){const m=new THREE.Mesh(new THREE.RingGeometry(0.85,1,64).rotateX(-Math.PI/2),GLOWM(col,0.8));m.position.set(b.X,b.Y+0.12,b.Z);scene.add(m);return{m,t:0}}
onPress($('bAge'),advanceAge);
onPress($('bSell'),()=>{if(!sellArm){sellArm=1;renderThumb();AU.tick();clearTimeout(sellSel.t);sellSel.t=setTimeout(()=>{sellArm=0;renderThumb()},2200)}else{sellArm=0;sellSel()}});
onPress($('bDef'),()=>{if(place)confirmPlace();else if(menu==='def')closeMenu();else openMenu('def')});
onPress($('bEco'),()=>{if(place){setPlace(null);AU.tick()}else if(menu==='eco')closeMenu();else openMenu('eco')});
optEls.forEach((el,i)=>onPress(el,()=>{if(!menu)return;const t=MENU[menu][i];if(!t)return;if(t==='age'){advanceAge();return}if(locked(t)){toast(`${BT[t].name} unlocks in ${AGEN[AGEREQ[t]]} — advance from the Economy menu`);AU.deny();return}if(place&&place.type===t)confirmPlace();else startPlace(t)}));
addEventListener('keydown',e=>{if(!started||gameOver||!$('statsOv').classList.contains('hidden'))return;const k=e.key,all=[...MENU.def,...MENU.eco];
  if(k>='1'&&k<='7'){const t=all[+k-1];menu=MENU.def.includes(t)?'def':'eco';if(place&&place.type===t)confirmPlace();else startPlace(t);renderThumb()}
  else if(k==='Enter'||k===' '){e.preventDefault();if(place)confirmPlace()}
  else if(k==='Escape'){if(place)setPlace(null);else closeMenu();clearSel()}
  else if(k==='p'||k==='P')setPaused(!paused);else if(k==='s'||k==='S'){if(!paused)setPaused(true);showStats('pause')}
  else if((k==='Delete'||k==='Backspace')&&selSet.size)sellSel();
  else if((k==='u'||k==='U')&&selSet.size)upgradeSel();else if((k==='r'||k==='R')&&selSet.size)repairSel()});
onPress($('wave'),()=>{if(started&&!gameOver&&waveT>3){waveT=0.01;toast('Calling the next wave early!')}});
onPress($('bSpeed'),()=>{speed=speed===1?2:speed===2?3:speed===3?0:1;$('bSpeed').textContent=speed+'×';$('bSpeed').style.color=speed===0?'#9fe8ff':'';if(speed===0)toast('⏸ Time stopped — build, upgrade & sell freely');hudT=0})
function setPaused(v){if(v)return;paused=v;renderDiffs();$('bPause').textContent=paused?'▶':'❚❚';if(paused){$('pauseTxt').innerHTML=`Wave ${wave} · ${AGEN[age]} · ${kills} enemies defeated · ${fmtT(time)}<br><small style="opacity:.7">Progress auto-saves</small>`;saveGame();$('pauseOv').classList.remove('hidden')}else{$('pauseOv').classList.add('hidden');$('statsOv').classList.add('hidden')}}
onPress($('bPause'),()=>setPaused(!paused));onPress($('bResume'),()=>setPaused(false));onPress($('bStatsP'),()=>showStats('pause'));onPress($('bAchP'),()=>showAch('pause'));for(const id of['langPause','langStart'])for(const b of $(id).querySelectorAll('button'))onPress(b,()=>{setLang(b.dataset.l);AU.tick&&AU.tick();renderThumb();renderAge&&renderAge()});setLang(LANG);onPress($('bAchBack'),()=>{$('achOv').classList.add('hidden');if(achFrom==='pause'&&paused)$('pauseOv').classList.remove('hidden')});$('bAchS').onclick=()=>showAch('start');
onPress($('bMute'),()=>{AU.toggle();$('bMute').textContent=AU.on?'♪':'✕'});
onPress($('bRotL'),()=>{cam.yawT-=Math.PI/2});onPress($('bRotR'),()=>{cam.yawT+=Math.PI/2});
onPress($('bHome'),()=>{const b=buildings[0];if(b)camGoal={x:b.X,z:b.Z}});
document.addEventListener('pointerup',()=>{if(AU.ctx&&AU.ctx.state!=='running')AU.ctx.resume()});
let hudT=0,lastSelHash='';
function hud(dt){hudT-=dt;if(hudT>0)return;hudT=0.2;const r={grain:0,wool:0,gold:0};for(const b of buildings){const P2=BT[b.type].prod;if(P2)for(const k in P2)r[k]+=P2[k]*mulOf(b)}
  $('rg').textContent=Math.floor(res.grain);$('rw').textContent=Math.floor(res.wool);$('ro').textContent=Math.floor(res.gold);
  $('rgr').textContent='+'+r.grain.toFixed(1)+'/s';$('rwr').textContent='+'+r.wool.toFixed(1)+'/s';$('ror').textContent='+'+r.gold.toFixed(2)+'/s';
  const lvl=Math.max(1,Math.floor((Math.max(1,wave)-1)/5)+1),nb=(wave+1)%5===0;
  $('wave').innerHTML=(speed===0?'<b style="color:#9fe8ff">⏸ TIME STOPPED</b> · build freely<br>':'')+(wave===0?`Enemies arrive in <b>${Math.ceil(waveT)}s</b> <small>⏩</small>`:`${DIFF[diff].ic} 🏆${fmtN(score)} · Era ${ERAN[eraOf(wave)]} · Wave <b>${wave}</b><br><small>${waveHeld?'⏸ Next wave waits — clear the field':(nb?'⚠ BOSS':'Next')+' in '+Math.ceil(waveT)+'s ⏩'}</small>`);
  renderThumb();renderAge();
  drawMini()}

// =============== RENDER LOOP ===============
const _p=new THREE.Vector3(),_av=new THREE.Vector3(),XA=new THREE.Vector3(1,0,0);
function scr(X,Y,Z){_p.set(X,Y,Z).project(camera);return _p.z<1?[(_p.x+1)/2*W,(1-_p.y)/2*H]:null}
function smoothAng(a,b,k){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*k}
function renderWorld(rdt){const t=time;
  for(const b of buildings){for(const f of b.anims)f(t,b);
    if(b.build<1)b.build=Math.min(1,b.build+frameDt*1.5);const xb=b.build-1,e=b.build<1?1+2.9*xb*xb*xb+1.9*xb*xb:1;
    let sy=Math.max(0.02,e),sxz=b.build<1?0.85+0.15*Math.min(1,b.build*2):1;
    if(b.disc){const on=selSet.has(b);b.disc.visible=on;if(on){b.selPop=Math.max(0,(b.selPop||0)-frameDt*4);const k=1+(b.selPop||0)*0.35+Math.sin(performance.now()/260)*0.04;b.disc.scale.set(k,1,k)}}if(b.pulse>0){b.pulse=Math.max(0,b.pulse-rdt*1.6);sxz=1+Math.sin(b.pulse*Math.PI*3)*0.05*b.pulse;sy*=1+Math.sin(b.pulse*Math.PI*3)*0.06*b.pulse}
    const vs=(BT[b.type].kind==='def'&&b.type!=='wall')||b.type==='mine'?0.88:1;b.group.scale.set(sxz*vs,sy,sxz*vs);
    if(b.type==='cannon'){b.raim=smoothAng(b.raim,b.aim,Math.min(1,rdt*8));b.group.userData.tur.rotation.y=-b.raim;b.recoil=Math.max(0,b.recoil-rdt*3);b.group.userData.barrel.position.x=-b.recoil*0.12}}
  {let nw=0;if(place&&place.type==='wall'&&wdraw){const GOOD=new THREE.Color('#7dff7d'),BAD=new THREE.Color('#ff5a4a'),POOR=new THREE.Color('#ffc04a');for(const p of wallPlan()){if(nw>=64)break;_M.makeTranslation(p.x+0.5,Math.max(-0.1,heightAt(p.x+0.5,p.y+0.5)),p.y+0.5);wallPrev.setMatrixAt(nw,_M);wallPrev.setColorAt(nw,p.can?GOOD:p.ok?POOR:BAD);nw++}}wallPrev.count=nw;wallPrev.instanceMatrix.needsUpdate=true;if(wallPrev.instanceColor)wallPrev.instanceColor.needsUpdate=true}
  if(ghost){for(const f of ghost.userData.anims)f(t);const s=BT[place.type].size;const TX=place.tx+s/2,TZ=place.ty+s/2,TY=Math.max(-0.1,heightAt(TX,TZ));const gk=Math.min(1,frameDt*22);place.vx+=(TX-place.vx)*gk;place.vz+=(TZ-place.vz)*gk;place.vy+=(TY-place.vy)*gk;place.pop=Math.max(0,(place.pop||0)-frameDt*4);const X=place.vx,Z=place.vz,Y=place.vy;const lift=place.lift?0.32+Math.sin(performance.now()/170)*0.04:0;ghost.position.set(X,Y+lift,Z);const gsc=1+place.pop*0.12;ghost.scale.set(gsc,1+place.pop*0.22,gsc);
    const ok=canPlace(place.type,place.tx,place.ty);const col=ok?'#9dff9d':'#ff8a7a';ghost.traverse(o=>{if(o.isMesh)o.material.color.set(col)});
    footprint.visible=true;footprint.position.set(X,Y+0.08,Z);footprint.scale.set(s,1,s);footMat.color.set(ok?'#5ae65a':'#ff4a3a');
    const T=BT[place.type];rangeRing.visible=!!T.range;if(T.range){rangeRing.position.set(X,Y+0.1,Z);const r=T.range/TILE;rangeRing.scale.set(r,1,r)}
    guardRing.visible=!!T.guard;if(T.guard){guardRing.position.set(X,Y+0.1,Z);const r=ZONE[0]/TILE;guardRing.scale.set(r,1,r)}}
  else if(sel&&buildings.includes(sel)){selRing.visible=false;selRing.position.set(sel.X,sel.Y+0.08,sel.Z);const r=sel.s*0.78;selRing.scale.set(r,1,r);const R=rangeOf(sel);rangeRing.visible=R>0;if(R){rangeRing.position.set(sel.X,sel.Y+0.1,sel.Z);rangeRing.scale.set(R/TILE,1,R/TILE)}
    guardRing.visible=sel.type==='barracks';if(guardRing.visible){const g=zoneR(sel)/TILE;guardRing.position.set(sel.X,sel.Y+0.1,sel.Z);guardRing.scale.set(g,1,g)}}
  else{selRing.visible=rangeRing.visible=guardRing.visible=false}
  if(!sel)selRing.visible=false;
  // units
  for(const k in rigs)rigs[k].n=0;const sm=Math.min(1,rdt*10);
  for(const e of enemies){e.mvb+=((e.mvT>0?1:0)-e.mvb)*Math.min(1,rdt*7);e.rAng=smoothAng(e.rAng,e.ang,sm);drawUnitInst(e.type,e,t,false)}
  for(const k of knights){k.mvb+=((k.mvT>0?1:0)-k.mvb)*Math.min(1,rdt*7);k.rAng=smoothAng(k.rAng,k.ang,sm);drawUnitInst('knight'+k.tier,k,t,false)}
  for(const c of corpses)drawUnitInst(c.kind,c,t,true);
  for(const k in rigs){const R=rigs[k];for(const m of R.meshes){m.count=R.n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
  // projectiles
  let na=0,nb=0,ng=0;for(const p of projs){if(p.k==='arrow'){if(na>=400)continue;const X=p.x/TILE,Z=p.y/TILE,rem=Math.hypot(p.lx-p.x,p.ly-p.y)/p.d0,ty=heightAt(p.lx/TILE,p.ly/TILE)+0.4;
      const Y=lerp(ty,p.h0,rem)+Math.sin((1-rem)*Math.PI)*p.d0/TILE*0.12;const dx=(p.lx-p.x)/TILE,dz=(p.ly-p.y)/TILE,dy=(ty-p.h0)/(p.d0/TILE)*Math.hypot(dx,dz)-Math.cos((1-rem)*Math.PI)*0.4;
      _v.set(dx,dy,dz).normalize();_q.setFromUnitVectors(XA,_v);_s.set(1,1,1);_M.compose(_av.set(X,Y,Z),_q,_s);if(p.lv===3&&ng<200)arrowGlow.setMatrixAt(ng++,_M);arrowMesh.setMatrixAt(na++,_M)}
    else{if(nb>=80)continue;const k=p.time/p.dur,X=lerp(p.sx,p.tx,k)/TILE,Z=lerp(p.sy,p.ty,k)/TILE,ty=heightAt(p.tx/TILE,p.ty/TILE);const Y=lerp(p.h0,ty,k)+Math.sin(k*Math.PI)*(1.2+p.dur*1.5);
      _M.makeTranslation(X,Y,Z);ballMesh.setMatrixAt(nb++,_M)}}
  arrowMesh.count=na;ballMesh.count=nb;arrowGlow.count=ng;arrowGlow.instanceMatrix.needsUpdate=true;arrowMesh.instanceMatrix.needsUpdate=ballMesh.instanceMatrix.needsUpdate=true;
  // particles
  let ns=0,nf=0,nd=0;for(const p of parts){p.life-=rdt;p.x+=p.vx*rdt;p.y+=p.vy*rdt;p.z+=p.vz*rdt;p.vy-=p.g*rdt;if(p.k===0){p.vx*=0.98;p.vz*=0.98}
    if(p.k===2){const gy=heightAt(p.x,p.z);if(p.y<gy){p.y=gy;p.vy*=-0.3;p.vx*=0.6;p.vz*=0.6}}
    const f=Math.max(0,p.life/p.max);let sc=p.k===0?p.s*(1.6-f*0.6)*Math.sqrt(f):p.k===1?p.s*f:p.s*Math.min(1,f*3);
    _q.setFromEuler(_e.set(p.x*7,p.z*5,p.life*2));_v.set(p.x,p.y,p.z);_s.set(sc,sc,sc);_M.compose(_v,_q,_s);
    if(p.k===1){if(nf<300){fireMesh.setMatrixAt(nf,_M);fireMesh.setColorAt(nf,p.c);nf++}}else if(p.k===2){if(nd<400){debMesh.setMatrixAt(nd,_M);debMesh.setColorAt(nd,p.c);nd++}}else if(ns<900){smokeMesh.setMatrixAt(ns,_M);smokeMesh.setColorAt(ns,p.c);ns++}}
  parts=parts.filter(p=>p.life>0);smokeMesh.count=ns;fireMesh.count=nf;debMesh.count=nd;for(const m of[smokeMesh,fireMesh,debMesh]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  for(const f of campFire){f.scale.set(1,0.75+Math.random()*0.5,1)}
  // veteran flames: braziers / muzzles / knight swords / projectile trails / burning ground
  const FR=[0,5,8,12,16,24],FS=[0,0.07,0.09,0.11,0.13,0.17],FSC=[0,0.55,0.8,1.05,1.35,2.1];
  for(const b of buildings){const v=b.vet||0;if(!v||(b.type!=='archer'&&b.type!=='cannon'))continue;let n=FR[v]*frameDt*(speed===0?0.3:1);n=Math.floor(n)+(Math.random()<n%1?1:0);if(!n)continue;
    let X=b.X,Z=b.Z,Y=b.Y+b.barH-0.45;if(b.type==='cannon'){const a=b.raim||0;X+=Math.cos(a)*0.85;Z+=Math.sin(a)*0.85;Y=b.Y+b.top-0.05}
    fx(X,Y+0.15*FSC[v],Z,n,VETC[v],0.12+v*0.02,FS[v],0.5+v*0.06,-1.8-v*0.25,1,2.2);if(v===5&&Math.random()<0.5)fx(X,Y+0.4,Z,1,'#ffb0ff',0.12,0.1,0.6,-2.4,1,2.4)}
  for(const b of buildings){const v=b.vet||0;if(!v||(b.type!=='archer'&&b.type!=='cannon')){if(b.flame){scene.remove(b.flame);b.flame=null}continue}
    if(!b.flame||b.flame.userData.v!==v){if(b.flame)scene.remove(b.flame);const g=new THREE.Group();const o=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.55,10).translate(0,0.27,0),new THREE.MeshBasicMaterial({color:VETC[v],transparent:true,opacity:0.92,depthWrite:false}));const c=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.32,8).translate(0,0.16,0),GLOWM(v===5?'#ffd8ff':'#fff2c0',0.9));const h=new THREE.Mesh(sph(0.3,10,8),GLOWM(VETC[v],0.22));h.position.y=0.18;g.add(o,c,h);g.userData={v,o,c,h};scene.add(g);b.flame=g}
    const g=b.flame;let X=b.X,Z=b.Z,Y=b.Y+b.barH-0.6;if(b.type==='cannon'){const a=b.raim||0;X+=Math.cos(a)*0.85;Z+=Math.sin(a)*0.85;Y=b.Y+b.top-0.15}g.position.set(X,Y,Z);const fl=0.85+0.3*Math.random(),k=FSC[v];g.scale.set(k*(0.9+0.15*Math.random()),k*fl,k*(0.9+0.15*Math.random()));g.userData.h.material.opacity=0.16+0.12*Math.random()}
  {let nk=0;const KC=VETC.map(c=>c?new THREE.Color(c):null),KS=[0,0.8,1,1.2,1.45,1.9];const tnow=performance.now()/1000;
    for(const k of knights){const v=k.b.vet||0;if(!v||nk>=240)continue;const X=k.x/TILE,Z=k.y/TILE,Y=heightAt(X,Z),sc=rigs['knight'+k.tier].scale,pul=1+0.08*Math.sin(tnow*5+k.slot);
      _M.compose(_av.set(X,Y+0.06,Z),_q.identity(),_s.set(KS[v]*pul*sc,1,KS[v]*pul*sc));kvAura.setMatrixAt(nk,_M);kvAura.setColorAt(nk,KC[v]);kvDisc.setMatrixAt(nk,_M);kvDisc.setColorAt(nk,KC[v]);
      const a=k.rAng,sw=k.swing>0?0.25:0,fl=(0.85+0.3*Math.random())*KS[v];_M.compose(_av.set(X+Math.cos(a)*(0.36+sw)*sc,Y+0.78*sc,Z+Math.sin(a)*(0.36+sw)*sc),_q.identity(),_s.set(fl*0.9,fl,fl*0.9));kvFlame.setMatrixAt(nk,_M);kvFlame.setColorAt(nk,KC[v]);nk++}
    for(const m of[kvAura,kvDisc,kvFlame]){m.count=nk;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
  for(const k of knights){const v=k.b.vet||0;if(!v||Math.random()>FR[v]*0.7*frameDt)continue;const sc=rigs['knight'+k.tier].scale,a=k.rAng,sw=k.swing>0?0.25:0;
    fx(k.x/TILE+Math.cos(a)*(0.38+sw)*sc,heightAt(k.x/TILE,k.y/TILE)+0.86*sc,k.y/TILE+Math.sin(a)*(0.38+sw)*sc,1,VETC[v],0.25,FS[v]*0.75,0.35,-1.4,1,1.3)}
  for(const p of projs){if(!p.src||!(p.src.vet>0)||Math.random()>0.55)continue;let X,Y,Z;if(p.k==='arrow'){X=p.x/TILE;Z=p.y/TILE;const rem=Math.hypot(p.lx-p.x,p.ly-p.y)/p.d0;Y=lerp(heightAt(p.lx/TILE,p.ly/TILE)+0.4,p.h0,rem)+Math.sin((1-rem)*Math.PI)*p.d0/TILE*0.12}
    else if(p.k==='ball'){const k=p.time/p.dur;X=lerp(p.sx,p.tx,k)/TILE;Z=lerp(p.sy,p.ty,k)/TILE;Y=lerp(p.h0,heightAt(p.tx/TILE,p.ty/TILE),k)+Math.sin(k*Math.PI)*(1.2+p.dur*1.5)}else continue;
    fx(X,Y,Z,1,VETC[p.src.vet],0.15,FS[p.src.vet]*0.8,0.3,-0.4,1,0.5)}
  for(const f of fires)if(Math.random()<0.7){const a=Math.random()*6.28,r=Math.random()*f.r;const X=(f.x+Math.cos(a)*r)/TILE,Z=(f.y+Math.sin(a)*r)/TILE;fx(X,heightAt(X,Z)+0.05,Z,1,Math.random()<0.5?'#b040ff':'#ff8a2a',0.3,0.16,0.6,-1.2,1,1)}
  for(const d of DEPOS){const free=!occ[d.tx+d.ty*GW];d.mesh.visible=free;d.spark.visible=free;if(free){d.spark.rotation.y=time*2;d.spark.scale.setScalar(0.6+0.5*Math.abs(Math.sin(performance.now()/400+d.tx)))}}
  if(Math.random()<rdt*3){const sw=Math.random()<0.5,X0=(sw?SP2X:SPX)/TILE+0.1,Z0=(sw?SP2Y:SPY)/TILE+0.2;fx(X0,heightAt(X0,Z0)+0.4,Z0,1,'#8a8480',0.3,0.25,2.5,-0.25,0,1)}
  for(const t2 of texts){t2.life-=rdt;t2.Y+=rdt*0.6}texts=texts.filter(t2=>t2.life>0);
  for(const bm of beams){bm.life-=frameDt;bm.m.material.opacity=Math.max(0,0.7*bm.life/0.9);const k=1+(0.9-bm.life)*0.7;bm.m.scale.set(k,1,k)}beams=beams.filter(bm=>{if(bm.life<=0){scene.remove(bm.m);return false}return true});
  for(const o of oldG){o.t+=frameDt;o.g.scale.set(1+o.t*0.6,Math.max(0.01,1-o.t*3.5),1+o.t*0.6);o.g.position.y-=frameDt*1.2}oldG=oldG.filter(o=>{if(o.t>0.3){scene.remove(o.g);return false}return true});
  for(const w of waves){w.t+=frameDt;const r=0.5+w.t*9;w.m.scale.set(r,1,r);w.m.material.opacity=Math.max(0,0.8*(1-w.t/0.7))}waves=waves.filter(w=>{if(w.t>0.7){scene.remove(w.m);return false}return true});
  if(shake>0)shake=Math.max(0,shake-rdt*1.2)}
function selOutline(X,Y,Z,r,lw,pulse){let first=true;octx.beginPath();for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,p=scr(X+Math.cos(a)*r,Y,Z+Math.sin(a)*r);if(!p){first=true;continue}if(first){octx.moveTo(p[0],p[1]);first=false}else octx.lineTo(p[0],p[1])}
  octx.lineWidth=lw+3;octx.strokeStyle=`rgba(255,200,60,${0.25+0.15*pulse})`;octx.stroke();octx.lineWidth=lw;octx.strokeStyle='#ffe08a';octx.stroke()}
function drawSelection(){if(!selSet.size)return;const t=performance.now()/260,pulse=0.5+0.5*Math.sin(t);octx.save();octx.lineJoin='round';
  for(const b of selSet){if(!buildings.includes(b))continue;const pop=b.selPop||0;selOutline(b.X,b.Y+0.12,b.Z,(b.s*0.62+0.25)*(1+pop*0.3+pulse*0.03),2.2,pulse);
    if(b.type==='barracks')for(const k of knights)if(k.b===b){const X=k.x/TILE,Z=k.y/TILE;selOutline(X,heightAt(X,Z)+0.05,Z,0.42+pulse*0.04,1.6,pulse)}}
  octx.restore()}
function drawOverlay(){octx.setTransform(DPR,0,0,DPR,0,0);octx.clearRect(0,0,W,H);drawSelection();
  const bar=(X,Y,Z,w,f,col)=>{const s=scr(X,Y,Z);if(!s||s[0]<-20||s[0]>W+20||s[1]<-20||s[1]>H+20)return;octx.fillStyle='rgba(0,0,0,.6)';octx.fillRect(s[0]-w/2-1,s[1]-1,w+2,5);octx.fillStyle=col;octx.fillRect(s[0]-w/2,s[1],w*clamp(f,0,1),3)};
  const zf=clamp(34/cam.D,0.6,1.6);
  for(const e of enemies)if(e.hp<e.maxhp){const X=e.x/TILE,Z=e.y/TILE;const ht=e.type==='boss'?1.5:e.type==='cav'?1.25:e.type==='ram'?0.95:0.85;bar(X,heightAt(X,Z)+ht,Z,(e.type==='boss'?36:e.type==='ram'?26:16)*zf,e.hp/e.maxhp,'#ff5a40')}
  for(const k of knights)if(k.hp<k.maxhp){const X=k.x/TILE,Z=k.y/TILE;bar(X,heightAt(X,Z)+1.3,Z,16*zf,k.hp/k.maxhp,'#6fa0ff')}
  for(const b of buildings){if(b.hp<b.maxhp)bar(b.X,b.Y+b.barH,b.Z,44*zf,b.hp/b.maxhp,b.hp/b.maxhp>0.4?'#5fd04a':'#e05a3a');
    if(b.type==='barracks'){const n=knights.reduce((a,k)=>a+(k.b===b),0);if(n<squadSize(b))bar(b.X,b.Y+b.barH+0.35,b.Z,34*zf,1-b.respawnT/respawnTime(b),'#8fb8ff')}}
  drawBadges(zf);
  if(boxSel){const x0=Math.min(boxSel.x0,boxSel.x1),y0=Math.min(boxSel.y0,boxSel.y1),w=Math.abs(boxSel.x1-boxSel.x0),h=Math.abs(boxSel.y1-boxSel.y0);octx.fillStyle='rgba(255,211,74,0.12)';octx.fillRect(x0,y0,w,h);octx.setLineDash([6,4]);octx.strokeStyle='#ffd34a';octx.lineWidth=2;octx.strokeRect(x0,y0,w,h);octx.setLineDash([]);if(w<10&&h<10){octx.font='bold 12px Georgia';octx.textAlign='center';octx.fillStyle='#ffe08a';octx.fillText('Drag to box-select',boxSel.x0,boxSel.y0-18)}}
  drawSelUI();drawPlaceUI();
  octx.font='bold 12px Georgia';octx.textAlign='center';for(const t of texts){const s=scr(t.X,t.Y,t.Z);if(!s)continue;octx.globalAlpha=Math.min(1,t.life);octx.fillStyle='#000';octx.fillText(t.s,s[0]+1,s[1]+1);if(t.big){octx.font='bold 22px Georgia';octx.lineWidth=4;octx.strokeStyle='rgba(40,20,0,0.85)';octx.strokeText(t.s,s[0],s[1])}octx.fillStyle=t.c||'#ffe9a8';octx.fillText(t.s,s[0],s[1]);octx.font='bold 12px Georgia'}octx.globalAlpha=1}

function rrect(x,y,w,h,r){octx.beginPath();octx.moveTo(x+r,y);octx.arcTo(x+w,y,x+w,y+h,r);octx.arcTo(x+w,y+h,x,y+h,r);octx.arcTo(x,y+h,x,y,r);octx.arcTo(x,y,x+w,y,r);octx.closePath()}
const costSegs=c=>['grain','wool','gold'].filter(k=>c[k]).map(k=>({s:SHORT[k]+c[k],bad:res[k]<c[k]}));
const segW=(lab,segs)=>octx.measureText(lab).width+(segs.length?6:0)+segs.reduce((a,g)=>a+octx.measureText(g.s).width+6,0);
function segLine(x,y,lab,segs,col){octx.fillStyle=col||'#f2e2b0';octx.fillText(lab,x,y);let cx=x+octx.measureText(lab).width+6;for(const g of segs){octx.fillStyle=g.bad?'#ff8a7a':'#ffe9a8';octx.fillText(g.s,cx,y);cx+=octx.measureText(g.s).width+6}}
function tagBox(x,y,rows,hl){octx.textAlign='left';octx.textBaseline='alphabetic';let w=0;for(const r of rows){octx.font=r.f;w=Math.max(w,segW(r.lab,r.segs||[]))}
  const h=rows.length*16+8;let bx=clamp(x,6,W-w-22),by=clamp(y,112,H-h-110);
  const mr=mini.getBoundingClientRect();if(bx+w+16>mr.left-4&&by<mr.bottom+4){const lx=x-w-16-(hl?60:40);if(lx>=6)bx=lx;else by=mr.bottom+8}rrect(bx,by,w+16,h,7);octx.fillStyle='rgba(38,24,10,0.9)';octx.fill();octx.strokeStyle=hl?'#ffd34a':'#a9823f';octx.lineWidth=hl?2:1.5;octx.stroke();
  rows.forEach((r,i)=>{octx.font=r.f;segLine(bx+8,by+17+i*16,r.lab,r.segs||[],r.c)})}
// Compact stats: ⚔ attack = damage per second ÷ 3, ♥ health ÷ 50 — small numbers that compare at a glance
const HPU=50;
function towerAtk(b){const T=BT[b.type],v=VETM[vetOf(b)];if(b.type==='archer')return T.dmg*mulOf(b)*v*b.lvl/(T.rate/CDM[b.lvl-1]/vetCD(b))/3;if(b.type==='cannon')return T.dmg*mulOf(b)*v/(T.rate/CDM[b.lvl-1]/vetCD(b))/3*1.6;
  if(b.type==='barracks')return KN.dmg*mulOf(b)*v/KN.rate/3*squadSize(b);return 0}
const enemyAtk=e=>e.type==='sapper'?15*e.dm:ET[e.type].dmg*e.dm/ET[e.type].rate/3;
function badge(x,y,atk,hp,frac,sc,vet){octx.font=`bold ${Math.round(10*sc)}px Georgia`;octx.textAlign='left';octx.textBaseline='middle';
  const a=atk?`⚔${Math.max(1,Math.round(atk))}`:'',h=`♥${Math.max(1,Math.ceil(hp))}`;const wa=a?octx.measureText(a).width+4:0,wh=octx.measureText(h).width,w=wa+wh+8,hh=14*sc;
  rrect(x,y-hh/2,w,hh,hh/2);octx.fillStyle='rgba(20,12,4,0.72)';octx.fill();
  if(a){octx.fillStyle='#ffb070';octx.fillText(a,x+4,y+0.5)}octx.fillStyle=frac>0.6?'#9dff8a':frac>0.3?'#ffe070':'#ff7a6a';octx.fillText(h,x+4+wa,y+0.5);
  if(vet){const t='🔥'+VETN[vet],tw=octx.measureText(t).width+8;rrect(x+w+3,y-hh/2,tw,hh,hh/2);octx.fillStyle='rgba(20,12,4,0.78)';octx.fill();octx.strokeStyle=VETC[vet];octx.lineWidth=1.5;octx.stroke();octx.fillStyle=VETC[vet];octx.fillText(t,x+w+7,y+0.5)}}
function drawBadges(zf){if(cam.D>44)return;const sc=clamp(zf,0.85,1.25);
  for(const b of buildings){if(BT[b.type].kind!=='def'||selSet.has(b)&&b===sel||(b.type==='wall'&&b.hp>=b.maxhp-0.5&&!selSet.has(b)))continue;const s=scr(b.X,b.Y+b.barH-0.15,b.Z);if(!s||s[0]<-40||s[0]>W||s[1]<60||s[1]>H)continue;
    badge(s[0]+10*sc,s[1],towerAtk(b),b.hp/HPU,b.hp/b.maxhp,sc,b.vet||0)}
  for(const e of enemies){if(e.type==='spear'||e.type==='bowman')continue;const X=e.x/TILE,Z=e.y/TILE,ht=e.type==='boss'?1.7:e.type==='cav'?1.35:1.1;const s=scr(X,heightAt(X,Z)+ht,Z);if(!s||s[0]<-40||s[0]>W||s[1]<60||s[1]>H)continue;
    badge(s[0]+8*sc,s[1]-4,enemyAtk(e),e.hp/HPU,e.hp/e.maxhp,sc*0.92)}}
function drawSelUI(){const holding=hold&&hold.t>HOLD_D&&buildings.includes(hold.b);const b=holding?hold.b:sel;if(!b||!buildings.includes(b))return;
  const s=scr(b.X,b.Y+b.barH+0.2,b.Z);if(!s)return;const T=BT[b.type];const group=[...selSet].filter(o=>buildings.includes(o));const multi=group.length>1;
  const upl=group.filter(o=>o.lvl<MAXLVL&&o.lvl<age),agelk=group.some(o=>o.lvl<MAXLVL&&o.lvl>=age),tot={grain:0,wool:0,gold:0},rt={grain:0,wool:0,gold:0};for(const o of upl){const c=upCost(o);for(const k in tot)tot[k]+=c[k]}
  const dmgd=group.filter(o=>o.hp<o.maxhp-0.5);for(const o of dmgd){const c=repCost(o);for(const k in rt)rt[k]+=c[k]}
  if(holding){const p=hold.fail?1:clamp((hold.t-HOLD_D)/HOLD_F,0,1),R=22,col=hold.fail?'#ff5a40':'#ffd34a';
    octx.lineWidth=7;octx.strokeStyle='rgba(0,0,0,0.55)';octx.beginPath();octx.arc(s[0],s[1],R,0,7);octx.stroke();octx.fillStyle='rgba(30,18,6,0.78)';octx.beginPath();octx.arc(s[0],s[1],R-3,0,7);octx.fill();
    octx.strokeStyle=col;octx.shadowColor=col;octx.shadowBlur=14;octx.lineWidth=6;octx.beginPath();octx.arc(s[0],s[1],R,-Math.PI/2,-Math.PI/2+p*Math.PI*2);octx.stroke();octx.shadowBlur=0;
    octx.font='bold 16px Georgia';octx.textAlign='center';octx.textBaseline='middle';octx.fillStyle=col;octx.fillText(upl.length?'⬆':'★',s[0],s[1]+1)}
  const rows=[];
  if(multi)rows.push({f:'bold 12px Georgia',lab:`✦ ${group.length} selected`,c:'#ffe08a'});
  else{const atk=towerAtk(b);rows.push({f:'bold 12px Georgia',lab:`${T.ic} ${T.name} · ${TIERN[b.lvl]}`,c:'#ffe08a'});if(T.kind==='def')rows.push({f:'11px Georgia',lab:`${atk?'⚔'+Math.round(atk)+'  ':''}♥${Math.ceil(b.hp/HPU)}/${Math.ceil(b.maxhp/HPU)}`,c:'#f2e2b0'});if(VETK[b.type]&&b.st){const v=vetOf(b),nx=VETK[b.type][v];rows.push({f:'11px Georgia',lab:`${v?'🔥 Veteran '+VETN[v]:'Recruit'} · ${b.st.kills} kills${nx?' · next at '+nx:' · LEGEND'}`,c:v?VETC[v]:'#c3b38a'})}}
  if(upl.length){const nt=multi?'':` → ${TIERN[b.lvl+1]}`;rows.push({f:'11px Georgia',lab:(holding?'⬆':'⬆ Hold')+nt,segs:costSegs(tot)})}else if(agelk)rows.push({f:'11px Georgia',lab:`🔒 ${TIERN[age+1]} needs ${AGEN[age+1]}`,c:'#ffb070'});else rows.push({f:'11px Georgia',lab:'★ MAX TIER',c:'#ffd34a'});
  if(dmgd.length)rows.push({f:'11px Georgia',lab:'🔨 Double-tap',segs:costSegs(rt)});
  tagBox(s[0]+(holding?32:16),s[1]-40,rows,holding)}
function drawPlaceUI(){if(!place)return;if(place.type==='wall'){if(!wdraw)return;const plan=wallPlan(),n=plan.filter(p=>p.can).length,last=plan[plan.length-1];const s=scr(last.x+0.5,heightAt(last.x+0.5,last.y+0.5)+1.3,last.y+0.5);if(!s)return;
    tagBox(s[0]+24,s[1]-34,[{f:'bold 12px Georgia',lab:`🧱 ${n} wall${n===1?'':'s'}`,c:'#ffe08a',segs:costSegs({grain:BT.wall.cost.grain*n,wool:BT.wall.cost.wool*n,gold:0})},{f:'11px Georgia',lab:plan.length>n?`${plan.length-n} blocked/unaffordable`:'Release to build',c:plan.length>n?'#ff8a7a':'#cfe8b0'}],true);return}const T=BT[place.type];const s=scr(place.vx,place.vy+(T.kind==='def'?(place.type==='wall'?1.4:2.5):0.9),place.vz);if(!s)return;const ok=canPlace(place.type,place.tx,place.ty);
  const tip=place.type==='wall'?'Drag to paint walls · ✓ adds one':'Drag to move · ✓ to build';
  tagBox(s[0]+24,s[1]-30,[{f:'bold 12px Georgia',lab:`${T.ic} ${T.name}`,c:'#ffe08a',segs:costSegs(costOf(place.type))},{f:'11px Georgia',lab:ok?tip:'Blocked — drag to open grass',c:ok?'#cfe8b0':'#ff8a7a'}],true)}

// =============== SAVE / LOAD ===============
const SAVEK='bastion_save_v1';
function serialize(){const bi=b=>buildings.indexOf(b);
  const stCopy={...ST,all:undefined,samples:ST.samples.slice(-1500)};delete stCopy.all;
  const recs=ST.all.map(r=>({i:bi(r.b),type:r.b.type,lvl:r.b.lvl,n:r.n,kills:r.kills,dmg:r.dmg,taken:r.taken,born:r.born,died:r.died,sold:r.sold}));
  return{v:1,saved:Date.now(),res,wave,waveT,time,kills,ach,age,ageRes,diff,score,grpState,spawnQ,cam:{tx:cam.tx,tz:cam.tz,D:cam.D,yaw:cam.yawT},
    buildings:buildings.map(b=>({type:b.type,tx:b.tx,ty:b.ty,lvl:b.lvl,hp:b.hp,spent:b.spent,st:b.st?{n:b.st.n,kills:b.st.kills,dmg:b.st.dmg,taken:b.st.taken,born:b.st.born}:null,respawnT:b.respawnT})),
    knights:knights.map(k=>({bi:bi(k.b),slot:k.slot,tier:k.tier,x:k.x,y:k.y,hp:k.hp,maxhp:k.maxhp,dmg:k.dmg})),
    enemies:enemies.map(e=>({type:e.type,side:e.side,x:e.x,y:e.y,hp:e.hp,maxhp:e.maxhp,dm:e.dm})),ST:stCopy,recs}}
function saveGame(){return;if(!started||gameOver||!ST)return;try{localStorage.setItem(SAVEK,JSON.stringify(serialize()))}catch(e){}}
function readSave(){try{const d=JSON.parse(localStorage.getItem(SAVEK)||'null');return d&&d.v===1&&d.buildings&&d.buildings.length?d:null}catch(e){return null}}
function clearSave(){try{localStorage.removeItem(SAVEK)}catch(e){}}
function loadGame(d){newGame(true);res=d.res;wave=d.wave;waveT=d.waveT;time=d.time;kills=d.kills;ach=d.ach||{};age=d.age||1;ageRes=d.ageRes||null;if(d.diff!=null)diff=d.diff;score=d.score||0;grpState=d.grpState||{};spawnQ=d.spawnQ||[];
  const made=[];for(const o of d.buildings){const b=addBuilding(o.type,o.tx,o.ty,true);b.lvl=o.lvl;b.maxhp=BT[o.type].hp*hpMulOf(b);b.hp=Math.min(o.hp,b.maxhp);b.spent=o.spent||b.spent;if(o.respawnT!=null)b.respawnT=o.respawnT;if(o.st&&b.st)Object.assign(b.st,o.st);if(b.lvl>1)makeVisual(b);made.push(b)}
  for(const b of made){if(b.type==='wall')makeVisual(b);if(VETK[b.type]&&b.st){let r=0;for(const t of VETK[b.type])if(b.st.kills>=t)r++;b.vet=r}}
  for(const o of d.knights||[]){const b=made[o.bi];if(!b)continue;knights.push({b,slot:o.slot,tier:o.tier,x:o.x,y:o.y,hp:o.hp,maxhp:o.maxhp,dmg:o.dmg,cd:0,r:KN.r,ang:0,rAng:0,walk:0,swing:0,flash:0,mvT:0,mvb:0})}
  for(const o of d.enemies||[]){const T=ET[o.type];if(!T)continue;enemies.push({...o,cd:Math.random(),ang:-0.8,rAng:-0.8,r:T.r,swing:0,flash:0,walk:Math.random()*6,mvT:0,mvb:0})}
  if(d.ST){const keepAll=[];for(const r of d.recs||[]){if(r.i>=0&&made[r.i]&&made[r.i].st)keepAll.push(made[r.i].st);else keepAll.push({n:r.n,kills:r.kills,dmg:r.dmg,taken:r.taken,born:r.born,died:r.died,sold:r.sold,b:{type:r.type,lvl:r.lvl}})}
    ST=Object.assign(ST,d.ST);ST.all=keepAll;ST.acc={a:0,c:0,k:0,taken:0,g:0,w:0,o:0};ST.sampT=0}
  if(d.cam){cam.tx=d.cam.tx;cam.tz=d.cam.tz;cam.D=d.cam.D;cam.yaw=cam.yawT=d.cam.yaw||0}computeFlow();renderThumb()}
const agoStr=ms=>{const m=Math.round(ms/60000);return m<1?'just now':m<60?m+'m ago':Math.round(m/60)+'h ago'};
function setupStart(){const d=readSave();const box=$('start').querySelector('.box');let el=$('bContinue');
  if(d){if(!el){el=document.createElement('button');el.id='bContinue';el.className='go wood';el.style.display='block';el.style.margin='0 auto 8px';box.insertBefore(el,$('bStart'))}
    el.innerHTML=`▶ Continue<br><small style="font-size:12px;opacity:.85">Wave ${d.wave} · ${AGEN[d.age||1]} · ${DIFF[d.diff??1].n} · ${agoStr(Date.now()-d.saved)}</small>`;$('bStart').textContent='New Game';
    el.onclick=()=>{AU.init();loadGame(d);started=true;$('start').classList.add('hidden');showBanner('WELCOME BACK',`Wave ${wave} · ${AGEN[age]}. Your realm awaits.`);setPaused(true)}}
  else if(el)el.remove()}
setInterval(saveGame,15000);addEventListener('pagehide',saveGame);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});

// =============== DIFFICULTY UI · SCORES · GLOBAL BOARD ===============
function renderDiffs(){for(const[id,dd]of[['diffStart','diffDesc'],['diffPause','diffDescP']]){const el=$(id);if(!el)continue;el.innerHTML=DIFF.map((D,i)=>`<button data-i="${i}" class="${i===diff?'on':''}"><b>${D.ic}</b>${D.n}</button>`).join('');$(dd).textContent=DIFF[diff].d+(id==='diffPause'?'':` · score ×${DIFF[diff].sm}`);
  for(const b of el.children)b.addEventListener('pointerdown',ev=>{ev.preventDefault();setDiff(+b.dataset.i)})}}
function setDiff(i){if(i===diff)return;diff=i;try{localStorage.setItem('bastion_diff',i)}catch(e){}renderDiffs();if(started){computeFlow();toast(`${DIFF[i].ic} Difficulty: ${DIFF[i].n} — score ×${DIFF[i].sm} from now on`);for(const e of enemies)e.sm=DIFF[i].spd}}
let pname='';try{pname=localStorage.getItem('bastion_name')||''}catch(e){}
const devId=(()=>{try{let d=localStorage.getItem('bastion_dev');if(!d){d=Math.random().toString(36).slice(2,10);localStorage.setItem('bastion_dev',d)}return d}catch(e){return 'anon'}})();
// --- global leaderboard (Supabase). Fill these two values to connect all devices (see SUPABASE.md). ---
const BOARD={url:'',key:''};const bHdr=()=>BOARD.key.startsWith('sb_')?{apikey:BOARD.key}:{apikey:BOARD.key,Authorization:'Bearer '+BOARD.key};const boardOn=()=>!!(BOARD.url&&BOARD.key);let globalTop=null,globalRecent=null,hofTab='local';
function localScores(){try{return JSON.parse(localStorage.getItem('bastion_scores')||'[]')}catch(e){return[]}}
function recordPlay(){const rec={name:(pname||'Player').slice(0,16),score:Math.round(score),wave,diff:DIFF[diff].n,secs:Math.round(time),kills,age,mvp:(()=>{const r=ST.all.slice().sort((a,b)=>b.kills-a.kills)[0];return r?`${BT[r.b.type].name} #${r.n}`:''})(),device:devId,at:new Date().toISOString()};
  try{const L=localScores();L.push(rec);L.sort((a,b)=>b.score-a.score);localStorage.setItem('bastion_scores',JSON.stringify(L.slice(0,50)))}catch(e){}
  if(boardOn())fetch(BOARD.url+'/rest/v1/plays',{method:'POST',headers:{...bHdr(),'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(rec)}).then(()=>loadBoard()).catch(()=>{});return rec}
function loadBoard(cb){if(!boardOn())return;const h=bHdr();
  Promise.all([fetch(BOARD.url+'/rest/v1/plays?select=*&order=score.desc&limit=15',{headers:h}).then(r=>r.json()),fetch(BOARD.url+'/rest/v1/plays?select=*&order=at.desc&limit=15',{headers:h}).then(r=>r.json())]).then(([t,r])=>{globalTop=Array.isArray(t)?t:null;globalRecent=Array.isArray(r)?r:null;renderHof();cb&&cb()}).catch(()=>{})}
function hofTable(rows,hl){if(!rows||!rows.length)return'<div class="note">No plays yet — be the first.</div>';return'<table>'+rows.slice(0,10).map((r,i)=>`<tr${hl&&r===hl?' style="background:rgba(255,211,74,.12)"':''}><td>${i+1}.</td><td>${(r.name||'Player').replace(/[<>&]/g,'')}</td><td>${r.diff||''}</td><td>W${r.wave}</td><td class="r">${fmtN(r.score)}</td></tr>`).join('')+'</table>'}
let lastRec=null;
function renderHof(){const tabs=boardOn()?['local','global','recent']:['local'];const names={local:'This device',global:'All devices',recent:'Latest plays'};
  const body=hofTab==='global'?hofTable(globalTop):hofTab==='recent'?hofTable(globalRecent):hofTable(localScores(),lastRec&&localScores().find(r=>r.at===lastRec.at));
  const html=`<div class="tabs">${tabs.map(t=>`<span data-t="${t}" class="${t===hofTab?'on':''}">${names[t]}</span>`).join('')}</div>${body}${boardOn()?'':'<div class="note">Global leaderboard not connected yet.</div>'}`;
  for(const id of['hofStart','stHof']){const el=$(id);if(!el)continue;el.innerHTML=html;for(const sp of el.querySelectorAll('.tabs span'))sp.addEventListener('pointerdown',()=>{hofTab=sp.dataset.t;renderHof()})}}
$('pName').value=pname;$('pName').addEventListener('input',e=>{pname=e.target.value.trim();try{localStorage.setItem('bastion_name',pname)}catch(_){}});

// =============== ACHIEVEMENTS ===============
const cnt=(t,minL=1)=>buildings.filter(b=>b.type===t&&b.lvl>=minL).length,defCount=()=>buildings.filter(b=>b.type==='archer'||b.type==='cannon'||b.type==='barracks').length,legends=()=>buildings.filter(b=>(b.vet||0)>=5).length;
const ACH=[
 {id:'medici',m:'📜',n:'Medici Ledger',d:'Raise a Gold Mine to the Jeweled tier.',c:()=>cnt('mine',3)>=1},
 {id:'ottoman',m:'🏦',n:'Ottoman Banker',d:'Mine every gold deposit on the map — all at the Jeweled tier.',c:()=>DEPOS.length>0&&cnt('mine',3)>=DEPOS.length},
 {id:'fugger',m:'💰',n:"Fugger's Fortune",d:'Hold 5,000 gold at once.',c:()=>res.gold>=5000},
 {id:'musa',m:'👑',n:'Treasury of Mansa Musa',d:'Earn 25,000 resources in a single battle.',c:()=>ST.earned.grain+ST.earned.wool+ST.earned.gold>=25000},
 {id:'byzantium',m:'🌾',n:'Breadbasket of Byzantium',d:'Keep 6 Wheat Fields at Stone tier or better.',c:()=>cnt('wheat',2)>=6},
 {id:'flanders',m:'🐑',n:'Weavers of Flanders',d:'Run 5 Sheep Farms at once.',c:()=>cnt('sheep')>=5},
 {id:'hadrian',m:'🧱',n:"Hadrian's Wall",d:'Have 40 wall sections standing.',c:()=>cnt('wall')>=40},
 {id:'theodosian',m:'🏰',n:'Theodosian Walls',d:'Have 20 Jeweled wall sections standing.',c:()=>cnt('wall',3)>=20},
 {id:'agincourt',m:'🏹',n:'Agincourt',d:'Archer towers defeat 400 enemies in one battle.',c:()=>ST.killsBy.archer>=400},
 {id:'orban',m:'💣',n:"Orban's Great Bombard",d:'A Cannon Tower reaches Veteran V.',c:()=>buildings.some(b=>b.type==='cannon'&&(b.vet||0)>=5)},
 {id:'templar',m:'⚔️',n:'Knights Templar',d:'A knight squad reaches Veteran V.',c:()=>buildings.some(b=>b.type==='barracks'&&(b.vet||0)>=5)},
 {id:'saladin',m:'🔥',n:"Saladin's Respect",d:'Command 3 legendary (purple-flame) defenders at once.',c:()=>legends()>=3},
 {id:'charlemagne',m:'⚜️',n:'Crown of Charlemagne',d:'Advance to Age III.',c:()=>age>=3},
 {id:'hastings',m:'🪓',n:'Hastings',d:'Slay a Warlord.',c:()=>ST.killsE.boss>=1},
 {id:'thermopylae',m:'🛡️',n:'Thermopylae',d:'Reach wave 10 with no more than 3 defense towers.',c:()=>wave>=10&&defCount()<=3&&defCount()>0},
 {id:'belgrade',m:'🕯️',n:'Siege of Belgrade',d:'Survive a boss wave without losing a single building.',c:()=>!!ST.cleanBoss},
 {id:'vienna',m:'🦅',n:'Gates of Vienna',d:'Reach wave 20 on Lord or Emperor.',c:()=>wave>=20&&diff>=2},
 {id:'constantinople',m:'🌙',n:'Constantinople Holds',d:'Reach wave 25 on Emperor.',c:()=>wave>=25&&diff>=3},
 {id:'kingmaker',m:'🗡️',n:'Kingmaker',d:'Defeat 1,000 enemies in one battle.',c:()=>kills>=1000},
];
let achDone={};try{achDone=JSON.parse(localStorage.getItem('bastion_ach')||'{}')}catch(e){}
const achQ=[];let achBusy=false,achT=0;
function popAch(a){achQ.push(a);if(!achBusy)nextAch()}
function nextAch(){const a=achQ.shift();if(!a){achBusy=false;return}achBusy=true;const el=$('achPop');el.querySelector('.am').textContent=a.m;el.querySelector('.at').innerHTML=`ACHIEVEMENT UNLOCKED<b>${a.n}</b>`;el.querySelector('.ad').textContent=a.d;el.classList.add('show');AU.levelUp(4);
  setTimeout(()=>{el.classList.remove('show');setTimeout(nextAch,500)},3600)}
function checkAch(dt){achT+=dt;if(achT<1)return;achT=0;for(const a of ACH){if(achDone[a.id]||(ST.achs&&ST.achs.includes(a.id)))continue;let ok=false;try{ok=a.c()}catch(e){}
  if(ok){(ST.achs=ST.achs||[]).push(a.id);if(!achDone[a.id]){achDone[a.id]={at:Date.now(),wave,diff:DIFF[diff].n};try{localStorage.setItem('bastion_ach',JSON.stringify(achDone))}catch(e){}popAch(a)}}}}
function showAch(from){const n=Object.keys(achDone).length;$('achSum').textContent=`${n} of ${ACH.length} earned · saved on this device`;const run=(ST&&ST.achs)||[];
  $('achGrid').innerHTML=ACH.map(a=>{const d=achDone[a.id];return`<div class="ach ${d?'':'lock'} ${run.includes(a.id)?'new':''}"><span class="m">${d?a.m:'🔒'}</span><div><b>${a.n}</b><span>${a.d}</span>${d?`<small>✓ ${new Date(d.at).toLocaleDateString()} · wave ${d.wave} · ${d.diff}</small>`:''}</div></div>`}).join('');
  $('achOv').classList.remove('hidden');achFrom=from;if(from==='pause')$('pauseOv').classList.add('hidden')}
let achFrom=null;

// =============== INTRO + INSTRUCTIONS ===============
let introOpen=false,helpFrom=null;
const SV=(b)=>`<svg viewBox="0 0 40 40" fill="none" stroke="#ffe08a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`,FG=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" fill="#ffe08a" stroke="none"/>`;
const GI={
 tap:SV(FG(20,20)+'<circle cx="20" cy="20" r="10" opacity=".7"/><circle cx="20" cy="20" r="15" opacity=".35"/>'),
 dbl:SV(FG(16,20)+'<circle cx="16" cy="20" r="10" opacity=".7"/><text x="28" y="16" fill="#ffe08a" stroke="none" font-size="11" font-family="Georgia" font-weight="bold">×2</text>'),
 hold:SV(FG(20,20)+'<circle cx="20" cy="20" r="12" opacity=".25"/><path d="M20 8 A12 12 0 1 1 8 20" stroke="#ffd34a" stroke-width="3"/>'),
 drag:SV(FG(28,20)+'<path d="M6 20 H20" stroke-dasharray="2 4"/><path d="M33 14 l5 6 -5 6" />'),
 pan:SV(FG(20,20)+'<path d="M20 4 v6 M17 7 l3-3 3 3 M20 36 v-6 M17 33 l3 3 3-3 M4 20 h6 M7 17 l-3 3 3 3 M36 20 h-6 M33 17 l3 3-3 3"/>'),
 swipe:SV('<path d="M5 30 Q20 6 35 26" stroke-dasharray="1 5" stroke-width="3"/>'+FG(35,26)+'<circle cx="10" cy="22" r="3" fill="#ffd34a" stroke="none"/><circle cx="21" cy="17" r="3" fill="#ffd34a" stroke="none"/>'),
 box:SV('<rect x="6" y="8" width="26" height="22" rx="2" stroke-dasharray="4 3"/>'+FG(32,30)+'<circle cx="6" cy="8" r="3" fill="#ffd34a" stroke="none"/>'),
 line:SV('<rect x="4" y="22" width="7" height="6"/><rect x="12" y="22" width="7" height="6"/><rect x="20" y="22" width="7" height="6"/>'+FG(33,25)+'<path d="M4 15 H28" stroke-dasharray="2 3"/>'),
 pinch:SV(FG(12,28)+FG(28,12)+'<path d="M5 35 l4-4 M35 5 l-4 4 M16 24 l4-4"/><path d="M31 5 h4 v4 M5 31 v4 h4"/>'),
 twist:SV(FG(12,20)+FG(28,20)+'<path d="M12 9 A12 12 0 0 1 31 11" /><path d="M31 6 v5 h-5"/><path d="M28 31 A12 12 0 0 1 9 29"/><path d="M9 34 v-5 h5"/>'),
};
const HELP=[['GESTURES',[
 ['tap','Tap','Select a building or a knight squad.'],['dbl','Double-tap','Repair a building.'],['hold','Press and hold','Upgrade a building (keep holding to chain tiers).'],
 ['drag','Drag a new building','Move it before you confirm.'],['pan','Drag the map','Move the camera.'],['swipe','Swipe across buildings','Select several at once.'],
 ['box','Long-press empty ground and drag','Box-select everything inside.'],['line','Drag with Wall','Draw a whole wall line.'],
 ['pinch','Pinch','Zoom in and out.'],['twist','Twist two fingers','Rotate the view.']]],
 ['BUTTONS',[
 ['🌾','Economy','Wheat field, sheep farm, gold mine.'],['🏹','Defense','Archer, cannon, knights, wall.'],['✓','BUILD','Confirm the building.'],['✕','Cancel','Drop the building you are placing.'],
 ['⚜️','Age','Research the next age (bottom left).'],['🗑️','Sell','Appears when a building is selected. Tap twice.'],['1×','Speed','1× · 2× · 3× · 0× (time stopped).'],['❚❚','Pause','Menu, stats, achievements, language.'],
 ['♪','Music','Sound on or off.'],['⟲','Rotate','Turn the view a quarter turn.'],['⌂','Home','Fly the camera back to your base.'],['⏩','Wave bar','Tap it to call the next wave early.']]],
 ['ON THE MAP',[
 ['⚔','⚔ ♥ badges','Attack and health at a glance.'],['🔥','Flames','Veterancy: more kills, stronger. Purple is legendary.'],['✦','Gold rocks','Gold mines can only go on these.'],['🌲','Trees','Nothing passes through. Use them as choke points.']]]];
function renderHelp(){$('helpBody').innerHTML=HELP.map(([h,rows])=>`<div class="hsec">${h}</div><div class="hg">${rows.map(([ic,t,d])=>`<div class="hi"><div class="ico">${GI[ic]||ic}</div><div><b>${t}</b><span>${d}</span></div></div>`).join('')}</div>`).join('')}
function showHelp(from){renderHelp();helpFrom=from;$('helpOv').classList.remove('hidden');$('helpOv').scrollTop=0;if(from==='pause')$('pauseOv').classList.add('hidden')}
function closeHelp(){$('helpOv').classList.add('hidden');if(helpFrom==='pause'&&paused)$('pauseOv').classList.remove('hidden')}
function showIntro(){introOpen=true;$('introOv').classList.remove('hidden');$('introOv').scrollTop=0}
function closeIntro(){introOpen=false;$('introOv').classList.add('hidden');AU.tick&&AU.tick()}
onPress($('bHelpP'),()=>showHelp('pause'));
let newArmT=0;onPress($('bNewP'),()=>{const el=$('bNewP'),n=performance.now();
  if(n-newArmT>3000){newArmT=n;el.textContent=(wave>0||score>0)?'Tap again — this battle goes to the Hall of Fame':'Tap again to start over';setTimeout(()=>{if(performance.now()-newArmT>=2900)el.textContent='⟲ New Game'},3000);return}
  newArmT=0;el.textContent='⟲ New Game';const had=wave>0||score>0;if(had){lastRec=recordPlay()}clearSave();setPaused(false);newGame();renderThumb();renderAge&&renderAge();renderHof();started=true;showIntro();
  if(had)setTimeout(()=>toast('Previous battle saved to the Hall of Fame'),400)});$('bHelpS').onclick=()=>showHelp('start');onPress($('bHelpBack'),closeHelp);
onPress($('bIntroGo'),closeIntro);onPress($('bIntroHelp'),()=>showHelp('intro'));

// =============== BATTLE STATS SCREEN ===============
const SC={archer:'#3987e5',cannon:'#d95926',barracks:'#199e70',grain:'#c98500',wool:'#9085e9',gold:'#d55181',enemy:'#d55181',taken:'#d95926'};
const SURF='#22160a',INK='#efe3c6',INK2='#b9a882',GRID='rgba(233,215,170,0.12)';
const fmtT=t=>{t=Math.max(0,Math.round(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const fmtN=v=>v>=10000?(v/1000).toFixed(0)+'k':v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+'';
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p}
function smoothArr(a,k=1){return a.map((v,i)=>{let s=0,n=0;for(let j=i-k;j<=i+k;j++)if(j>=0&&j<a.length){s+=a[j];n++}return s/n})}
function tsChart(cv,xs,series,opt={}){const box=cv.parentElement;box.style.position='relative';const dpr=Math.min(2,devicePixelRatio||1),w=cv.clientWidth,h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);const L=36,R=10,T=10,B=22,pw=w-L-R,ph=h-T-B,n=xs.length,t1=Math.max(10,xs[n-1]||10);
  const tops=series.map(s=>s.vals.slice());if(opt.stacked)for(let i=1;i<tops.length;i++)for(let j=0;j<n;j++)tops[i][j]+=tops[i-1][j];
  const ymax=niceMax(Math.max(4,...tops.flat())*1.05);const X=t=>L+t/t1*pw,Y=v=>T+ph-v/ymax*ph;
  const base=()=>{g.clearRect(0,0,w,h);g.font='10px Georgia';g.fillStyle=INK2;g.strokeStyle=GRID;g.lineWidth=1;g.textAlign='right';g.textBaseline='middle';
    for(let i=0;i<=4;i++){const v=ymax*i/4,y=Y(v);g.beginPath();g.moveTo(L,y);g.lineTo(w-R,y);g.stroke();g.fillText(fmtN(v),L-5,y)}
    g.textAlign='center';g.textBaseline='top';const step=niceMax(t1/5);for(let t=0;t<=t1+0.1;t+=step)g.fillText(fmtT(t),X(t),T+ph+6);
    for(const m of(opt.marks||[])){const x=X(m.t);g.strokeStyle='rgba(255,211,106,0.45)';g.setLineDash([3,3]);g.beginPath();g.moveTo(x,T);g.lineTo(x,T+ph);g.stroke();g.setLineDash([]);g.fillStyle='#ffd36a';g.textBaseline='top';g.fillText('⚔'+m.n,x,T-1)}
    if(n<2){g.fillStyle=INK2;g.textAlign='center';g.fillText('Not enough battle yet',w/2,h/2);return}
    if(opt.stacked){for(let i=series.length-1;i>=0;i--){g.beginPath();g.moveTo(X(xs[0]),Y(tops[i][0]));for(let j=1;j<n;j++)g.lineTo(X(xs[j]),Y(tops[i][j]));for(let j=n-1;j>=0;j--)g.lineTo(X(xs[j]),Y(i?tops[i-1][j]:0));g.closePath();g.fillStyle=series[i].color;g.fill();
        g.beginPath();for(let j=0;j<n;j++){const x=X(xs[j]),y=Y(tops[i][j]);j?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle=SURF;g.lineWidth=2;g.stroke()}}
    else for(const s of series){if(opt.area){g.beginPath();g.moveTo(X(xs[0]),Y(0));for(let j=0;j<n;j++)g.lineTo(X(xs[j]),Y(s.vals[j]));g.lineTo(X(xs[n-1]),Y(0));g.closePath();g.fillStyle=s.color+'40';g.fill()}
      g.beginPath();for(let j=0;j<n;j++){const x=X(xs[j]),y=Y(s.vals[j]);j?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle=s.color;g.lineWidth=2;g.lineJoin='round';g.stroke()}
    if(!opt.stacked&&series.length>1&&series.length<=4){g.font='bold 10px Georgia';g.textAlign='left';g.textBaseline='middle';const used=[];for(const s of series){let y=Y(s.vals[n-1]);for(const u of used)if(Math.abs(u-y)<11)y=u-11;used.push(y);g.fillStyle=INK;g.fillText('',w-R,y)}}};
  base();let tip=box.querySelector('.wtip');if(!tip){tip=document.createElement('div');tip.className='wtip';tip.style.display='none';box.appendChild(tip)}
  const hover=ev=>{if(n<2)return;const r=cv.getBoundingClientRect(),mx=ev.clientX-r.left;const t=clamp((mx-L)/pw,0,1)*t1;let j=0,bd=1e9;for(let i=0;i<n;i++){const d=Math.abs(xs[i]-t);if(d<bd){bd=d;j=i}}
    base();const x=X(xs[j]);g.strokeStyle='rgba(255,240,200,0.6)';g.lineWidth=1;g.beginPath();g.moveTo(x,T);g.lineTo(x,T+ph);g.stroke();
    series.forEach((s,i)=>{const v=opt.stacked?tops[i][j]:s.vals[j];g.beginPath();g.arc(x,Y(v),4,0,7);g.fillStyle=s.color;g.fill();g.strokeStyle=SURF;g.lineWidth=2;g.stroke()});
    tip.innerHTML=`<b>${fmtT(xs[j])}</b>`+series.map(s=>`<br><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.color};margin-right:4px"></i>${s.name}: <b>${(opt.fmt||fmtN)(s.vals[j])}</b>`).join('');
    tip.style.display='block';const tw=tip.offsetWidth;tip.style.left=clamp(x+box.offsetLeft-cv.offsetLeft+ (x>w/2?-tw-12:12),4,w-tw)+'px';tip.style.top=(cv.offsetTop+8)+'px'};
  cv.onpointermove=hover;cv.onpointerdown=hover;cv.onpointerleave=()=>{tip.style.display='none';base()}}
function legend(el,items){el.innerHTML=items.map(([n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join('')}
function barRows(el,rows,max){el.innerHTML=rows.map(r=>`<div class="brow"><span>${r.ic}</span><span class="bn">${r.name}</span><span class="v">${r.val}</span><div class="bar"><div style="width:${max?Math.max(2,r.n/max*100):0}%;background:${r.color}"></div></div></div>`).join('')||'<div style="font-size:12px;color:#b9a882">Nothing yet</div>'}
let statsFrom=null;
function showStats(mode){statsFrom=mode;setTimeout(renderHof,0);if(mode==='pause')$('pauseOv').classList.add('hidden');stSample();
  const S=ST,sm=S.samples.filter(x=>x.t>0),xs=sm.map(x=>x.t);const tot=S.dmgBy.archer+S.dmgBy.cannon+S.dmgBy.barracks;
  $('stHead').innerHTML=mode==='over'?`<h1>FALLEN</h1><p>Your realm held for ${fmtT(time)} and fell on wave ${wave}.</p>`:`<h1>BATTLE STATS</h1><p>Wave ${wave} · ${fmtT(time)} into the battle</p>`;
  const earned=S.earned.grain+S.earned.wool+S.earned.gold;
  $('stTiles').innerHTML=[[fmtN(score),'Score · '+DIFF[diff].n],[fmtT(time),'Time survived'],[S.bestWave,'Waves reached'],[kills,'Enemies defeated'],[fmtN(tot),'Damage dealt'],[fmtN(earned),'Resources earned']].map(([v,l])=>`<div class="stTile"><b>${v}</b><span>${l}</span></div>`).join('');
  const recs=S.all.slice().sort((a,b)=>b.kills-a.kills||b.dmg-a.dmg);const mvp=recs[0];
  $('stMvp').innerHTML=mvp&&(mvp.kills||mvp.dmg)?`<h4>🏆 MVP</h4><div class="mvp"><span class="ic">${BT[mvp.b.type].ic}</span><div><b>${BT[mvp.b.type].name} #${mvp.n}</b> <span style="color:#b9a882;font-size:12px">· ${TIERN[mvp.b.lvl]}${mvp.died!=null?(mvp.sold?' · sold':' · fallen'):''}</span><p>${mvp.kills} kills · ${fmtN(mvp.dmg)} damage · ${tot?Math.round(mvp.dmg/tot*100):0}% of all damage</p><p>Stood for ${fmtT((mvp.died??time)-mvp.born)}</p></div></div>`:'<h4>🏆 MVP</h4><div style="font-size:12px;color:#b9a882">No kills yet — build some defenses!</div>';
  const top=recs.slice(0,8),mk=Math.max(1,...top.map(r=>r.kills));
  barRows($('stBoard'),top.map(r=>({ic:BT[r.b.type].ic,name:`${r.b.vet?'🔥'+VETN[r.b.vet]+' ':''}${BT[r.b.type].name.replace(' Tower','')} #${r.n} · ${TIERN[r.b.lvl][0]+TIERN[r.b.lvl].slice(1).toLowerCase()}${r.died!=null?(r.sold?' (sold)':' †'):''}`,val:`${r.kills} · ${fmtN(r.dmg)}`,n:r.kills,color:SC[r.b.type]})),mk);
  legend($('lgDmg'),[['Archers',SC.archer],['Cannons',SC.cannon],['Knights',SC.barracks]]);legend($('lgEco'),[['Grain',SC.grain],['Wool',SC.wool],['Gold',SC.gold]]);
  $('statsOv').classList.remove('hidden');$('stFoot').innerHTML=mode==='over'?'<button class="go wood" id="bRebuild">⟲ Rebuild</button>':'<button class="go wood" id="bStatsBack">▶ Back to battle</button>';
  if(mode==='over')onPressSafe($('bRebuild'),()=>{$('statsOv').classList.add('hidden');newGame();started=true;AU.init()});else onPressSafe($('bStatsBack'),closeStats);
  requestAnimationFrame(()=>{
    tsChart($('cDmg'),xs,[{name:'Archers',color:SC.archer,vals:smoothArr(sm.map(x=>x.a))},{name:'Cannons',color:SC.cannon,vals:smoothArr(sm.map(x=>x.c))},{name:'Knights',color:SC.barracks,vals:smoothArr(sm.map(x=>x.k))}],{stacked:true,marks:S.bosses});
    tsChart($('cEco'),xs,[{name:'Grain',color:SC.grain,vals:smoothArr(sm.map(x=>x.g))},{name:'Wool',color:SC.wool,vals:smoothArr(sm.map(x=>x.w))},{name:'Gold',color:SC.gold,vals:smoothArr(sm.map(x=>x.o))}],{});
    tsChart($('cEn'),xs,[{name:'Enemies',color:SC.enemy,vals:sm.map(x=>x.e)}],{area:true,marks:S.bosses,fmt:v=>Math.round(v)+''});
    tsChart($('cTaken'),xs,[{name:'Damage taken',color:SC.taken,vals:smoothArr(sm.map(x=>x.taken))}],{area:true,marks:S.bosses})});
  const EN={spear:['🗡️','Spearmen'],bowman:['🏹','Bowmen'],shield:['🛡️','Shieldbearers'],sapper:['💥','Sappers'],ram:['🪵','Battering rams'],cav:['🐎','Cavalry'],boss:['👑','Warlords']};const ke=Object.entries(S.killsE).filter(([k,v])=>v>0),mke=Math.max(1,...ke.map(x=>x[1]));
  barRows($('stKills'),ke.map(([k,v])=>({ic:EN[k][0],name:EN[k][1],val:v,n:v,color:'#c3b38a'})),mke);
  const kb=[['archer','Archer towers'],['cannon','Cannon towers'],['barracks','Knights']].map(([k,nm])=>({ic:BT[k].ic,name:nm,val:`${S.killsBy[k]} · ${tot?Math.round(S.dmgBy[k]/tot*100):0}% dmg`,n:S.killsBy[k],color:SC[k]})),mkb=Math.max(1,...kb.map(x=>x.n));
  barRows($('stKillsBy'),kb,mkb);
  const longest=S.all.filter(r=>r.died==null).sort((a,b)=>a.born-b.born)[0];const tank=[...buildings,...[]].filter(b=>b.st).sort((a,b)=>b.st.taken-a.st.taken)[0];
  const sumC=c=>Math.round(c.grain)+'🌾 '+Math.round(c.wool)+'🐑 '+Math.round(c.gold)+'🪙';
  const ea=(S.achs||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  $('stFacts').innerHTML=`<h4>Chronicle</h4><div class="facts">${ea.length?`Medals earned <b>${ea.map(a=>a.m+' '+a.n).join(' · ')}</b><br>`:''}
   Earned <b>${sumC(S.earned)}</b><br>Spent <b>${sumC(S.spent)}</b><br>
   Buildings raised <b>${S.built}</b> · lost <b>${S.lost}</b> · sold <b>${S.sold}</b><br>
   Knights fallen in battle <b>${S.kLost}</b><br>
   Biggest horde <b>${S.peakE}</b> enemies at ${fmtT(S.peakT)}<br>
   ${tank&&tank.st.taken>0?`Toughest building: <b>${BT[tank.type].name} #${tank.st.n}</b> absorbed ${fmtN(tank.st.taken)} damage<br>`:''}
   ${longest?`Oldest standing defense: <b>${BT[longest.b.type].name} #${longest.n}</b> since ${fmtT(longest.born)}`:''}</div>`}
function closeStats(){$('statsOv').classList.add('hidden');if(statsFrom==='pause'&&paused)$('pauseOv').classList.remove('hidden')}
function onPressSafe(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();fn()})}

// =============== AUDIO ===============
const CH=[[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,67]],PENT=[69,72,74,76,79,81,84];
const AU={ctx:null,on:true,int:0,boss:false,last:{},
  init(){if(this.ctx){this.ctx.resume&&this.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let c;try{c=this.ctx=new AC()}catch(e){return}
    this.master=c.createGain();this.master.gain.value=0.6;const comp=c.createDynamicsCompressor();this.master.connect(comp);comp.connect(c.destination);
    this.dl=c.createDelay(2);this.dl.delayTime.value=0.43;const fb=c.createGain();fb.gain.value=0.42;const dlf=c.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=1700;this.dl.connect(dlf);dlf.connect(fb);fb.connect(this.dl);const wet=c.createGain();wet.gain.value=0.55;dlf.connect(wet);wet.connect(this.master);
    this.padF=c.createBiquadFilter();this.padF.type='lowpass';this.padF.frequency.value=600;this.padF.Q.value=0.7;this.padG=c.createGain();this.padG.gain.value=0.2;this.padF.connect(this.padG);this.padG.connect(this.master);this.padG.connect(this.dl);
    this.sfx=c.createGain();this.sfx.gain.value=0.3;this.sfx.connect(this.master);
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=nb;
    const t=c.currentTime;this.tC=t+0.1;this.ci=0;this.tN=t+2.5;this.tB=t+1;this.bi=0;setInterval(()=>this.sched(),60)},
  mf:m=>440*Math.pow(2,(m-69)/12),
  toggle(){this.on=!this.on;if(this.master)this.master.gain.setTargetAtTime(this.on?0.6:0,this.ctx.currentTime,0.1)},
  env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel)},
  sched(){const c=this.ctx;if(!c||c.state!=='running')return;const now=c.currentTime,ah=now+0.4,I=this.int;
    this.padF.frequency.setTargetAtTime(450+I*2400,now,2.5);this.padG.gain.setTargetAtTime(0.16+I*0.12,now,3);
    while(this.tC<ah){this.chord(this.tC,CH[this.ci%4]);this.ci++;this.tC+=8}
    while(this.tN<ah){this.pluck(this.tN,I);this.tN+=I>0.55?(Math.random()<0.6?0.357:0.714):0.9+Math.random()*1.9*(1-I)}
    const step=60/84/2;while(this.tB<ah){this.drum(this.tB,this.bi,I);this.bi++;this.tB+=step}},
  chord(t,notes){const c=this.ctx;for(const m of notes){for(const[type,det]of[['sine',0],['triangle',5]]){const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=this.mf(m);o.detune.value=det;o.connect(g);g.connect(this.padF);this.env(g,t,3,0.09,5,3.5);o.start(t);o.stop(t+12)}}
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=this.mf(notes[0]-12);o.connect(g);g.connect(this.master);this.env(g,t,1.5,0.1+this.int*0.12,6,2);o.start(t);o.stop(t+10)},
  pluck(t,I){const c=this.ctx,ch=CH[(this.ci+3)%4];const pool=PENT.concat(ch.map(m=>m+12));const m=pool[(Math.random()*pool.length)|0];
    const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=this.mf(m);o.connect(g);g.connect(this.master);g.connect(this.dl);this.env(g,t,0.01,0.05+I*0.04,0,1.6);o.start(t);o.stop(t+1.8)},
  drum(t,i,I){const c=this.ctx,q=i%2===0;
    if(I>0.28&&q){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(46,t+0.3);o.connect(g);g.connect(this.master);this.env(g,t,0.005,(I-0.28)*0.7*(i%8===0?1.3:1),0,0.45);o.start(t);o.stop(t+0.6)}
    if(I>0.6&&!q){const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='bandpass';f.frequency.value=1100;f.Q.value=1.5;s.connect(f);f.connect(g);g.connect(this.master);this.env(g,t,0.003,(I-0.6)*0.5,0,0.12);s.start(t,Math.random()*0.5);s.stop(t+0.2)}
    if(this.boss&&i%8===0){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(75,t);o.frequency.exponentialRampToValueAtTime(34,t+0.9);o.connect(g);g.connect(this.master);this.env(g,t,0.005,0.55,0,1.3);o.start(t);o.stop(t+1.5)}},
  ok(k,gap){const c=this.ctx;if(!c||!this.on)return false;const n=c.currentTime;if(this.last[k]&&n-this.last[k]<gap)return false;this.last[k]=n;return true},
  noiseHit(t,type,freq,peak,dur){const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type=type;f.frequency.value=freq;s.connect(f);f.connect(g);g.connect(this.sfx);this.env(g,t,0.003,peak,0,dur);s.start(t,Math.random()*0.5);s.stop(t+dur+0.1)},
  arrow(){if(!this.ok('a',0.12))return;this.noiseHit(this.ctx.currentTime,'highpass',3000,0.12,0.07)},
  boom(v){if(!this.ok('b'+v,0.15))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(30,t+0.4);o.connect(g);g.connect(this.sfx);this.env(g,t,0.005,0.5*v,0,0.5);o.start(t);o.stop(t+0.6);this.noiseHit(t,'lowpass',500,0.4*v,0.35)},
  crumble(){if(!this.ok('c',0.3))return;this.noiseHit(this.ctx.currentTime,'lowpass',350,0.8,1.4)},
  tick(){if(!this.ok('t',0.035))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=1300;o.connect(g);g.connect(this.sfx);this.env(g,t,0.002,0.1,0,0.05);o.start(t);o.stop(t+0.08)},
  deny(){if(!this.ok('d',0.2))return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.setValueAtTime(170,t);o.frequency.linearRampToValueAtTime(110,t+0.15);o.connect(g);g.connect(this.sfx);this.env(g,t,0.005,0.07,0.05,0.12);o.start(t);o.stop(t+0.3)},
  levelUp(l){if(!this.ok('l',0.05))return;const c=this.ctx,t=c.currentTime;this.boom(0.5);(l===3?[60,64,67,72,76,79,84,88]:[60,64,67,72,76]).forEach((m,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=this.mf(m);o.connect(g);g.connect(this.sfx);g.connect(this.dl);this.env(g,t+i*0.065,0.005,0.22,0,0.6);o.start(t+i*0.065);o.stop(t+i*0.065+0.7)})},
  place(){if(!this.ok('p',0.1))return;const c=this.ctx,t=c.currentTime;for(const[m,d]of[[64,0],[69,0.09]]){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=this.mf(m);o.connect(g);g.connect(this.sfx);this.env(g,t+d,0.005,0.25,0,0.4);o.start(t+d);o.stop(t+d+0.5)}}};

let confirmT=0;function confirmNew(){const n=performance.now();if(n-confirmT<2500)return true;confirmT=n;$('bStart').textContent='Tap again to overwrite save';return false}
// =============== BOOT ===============
genTerrain();genHeights();paintGround();buildGround();buildForest();buildCamp();buildDeposits();buildRigs();buildMiniBase();resize();newGame();
$('loading').classList.add('hidden');$('start').classList.add('hidden');newGame();renderThumb();started=true;setTimeout(arenaBoot,0);

document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&!gameOver)setPaused(true)});
let last=performance.now(),fpsA=60,qT=0,qLvl=0;
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;fpsA=lerp(fpsA,1/Math.max(dt,0.001),0.05);
  if(started&&!document.hidden){qT+=dt;if(qT>4&&fpsA<38&&qLvl<2){qLvl++;qT=0;renderer.setPixelRatio(qLvl===1?Math.min(1.5,DPR):1);renderer.setSize(W,H,false);if(qLvl===2){sun.shadow.mapSize.set(1024,1024);sun.shadow.map&&sun.shadow.map.dispose();sun.shadow.map=null}}}
  const run=started&&!paused&&!gameOver&&!introOpen;if(run)for(let i=0;i<speed;i++)update(dt);
  frameDt=dt;inputTick(dt);applyCam(dt);renderWorld(run?dt*speed:(started?0:dt));renderer.render(scene,camera);drawOverlay();hud(dt);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.__G={setDiff:i=>setDiff(i),get score(){return score},get ageRes(){return ageRes},dbg:()=>({lt:lsel&&lsel.t,lp:lastPt,box:!!boxSel,moved,hold:!!hold,paint:!!paint,anchor:!!anchor,ptrs:ptrs.size}),ser:()=>serialize(),load:d=>loadGame(d),get age(){return age},set age(v){age=v},depos:DEPOS,startWave:n=>{wave=n;startWave(n)},get spawnQ(){return spawnQ},cost:t=>costOf(t),spawnAt(x,y){spawnEnemy('spear',1);const e=enemies[enemies.length-1];e.x=x*32+16;e.y=y*32+16;e.frozen=true;e.hp=e.maxhp=120;return e},terr:(x,y)=>terrain[x+y*GW],get kk(){return ST.killsBy.barracks},get sellArm(){return sellArm},get wallMode(){return wallMode},selSet:()=>selSet,upg:b=>{selSet.clear();selSet.add(b);return upgradeSel(b)},mk:buildModel,h:heightAt,place2:null,rebuildAll(){for(const b of buildings)makeVisual(b)},scene,ground,THREE,renderer,camera,get s(){return{res,buildings,enemies,knights,wave,corpses}},step(sec){for(let t=0;t<sec;t+=0.05)update(0.05)},render(){applyCam(0.016);renderWorld(0.016);renderer.render(scene,camera);drawOverlay()},cam,give(){res.grain+=9000;res.wool+=9000;res.gold+=9000},
  get pl(){return place},ghostScr(){return place?scr(place.vx,place.vy+0.5,place.vz):null},sel:()=>sel&&sel.id,place:(t,x,y)=>{const b=addBuilding(t,x,y,true);computeFlow();return b},canPlace,get fps(){return fpsA},info:()=>renderer.info.render};

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
