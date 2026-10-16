/* Exploration, persistent health, and rewards shared by turn battles and boss rallies. */
(() => {
  const screen=$('rpg-screen'), modal=$('rpg-modal'), key='beamrpg.v3';
  const zones=[
    {id:'seven',name:'7부 마을',level:1,diff:'b7',bossDiff:'b6',boss:'아재범',face:'ajae',bossType:'normal',coachType:'fighting',color:'#88b86b',ground:'#709260',road:'#dfc99d',theme:'meadow',home:'희범의 집',park:'새싹 공원',gym:'동네 탁구장',xp:70,rivals:[['동네 고수 민수','jersey'],['수비 장인 준호','sleepy'],['서브 괴물 지훈','leesin']]},
    {id:'six',name:'6부 마을',level:3,diff:'b6',bossDiff:'b5',boss:'꿀잠범',face:'sleepy',bossType:'ice',coachType:'electric',color:'#d8b365',ground:'#a59765',road:'#eddbb4',theme:'autumn',home:'햇살 여관',park:'낮잠 정원',gym:'해질녘 탁구장',xp:90,rivals:[['새벽 연습생','plain'],['끈질긴 수비수','ajae'],['리듬의 달인','jersey']]},
    {id:'five',name:'5부 마을',level:5,diff:'b5',bossDiff:'b4',boss:'리신범',face:'leesin',bossType:'fire',coachType:'ground',color:'#cf8665',ground:'#b18a69',road:'#ecd0a7',theme:'desert',home:'불꽃 숙소',park:'붉은 바위 공원',gym:'드라이브 도장',xp:110,rivals:[['속공 신예','leesin'],['회전 연구가','percival'],['카운터 장인','drunk']]},
    {id:'four',name:'4부 마을',level:7,diff:'b4',bossDiff:'b3',boss:'퍼시벌',face:'percival',bossType:'psychic',coachType:'ghost',color:'#a78ac9',ground:'#7c8199',road:'#d4cadf',theme:'moon',home:'달빛 여관',park:'회전 정원',gym:'퍼시벌 체육관',xp:140,rivals:[['왼손 라이벌','percival'],['커트 마스터','sleepy'],['변칙 승부사','drunk']]},
    {id:'three',name:'3부 마을',level:9,diff:'b3',bossDiff:'b2',boss:'휴고범',face:'jersey',bossType:'water',coachType:'flying',color:'#75adc9',ground:'#70999a',road:'#cfddd7',theme:'harbor',home:'선수 합숙소',park:'해안 공원',gym:'휴고범 경기장',xp:170,rivals:[['백핸드 에이스','jersey'],['랠리 전문가','leesin'],['전국대회 유망주','plain']]},
    {id:'two',name:'2부 마을',level:11,diff:'b2',bossDiff:'b1',boss:'만취범',face:'drunk',bossType:'poison',coachType:'steel',color:'#73b4af',ground:'#7b9c96',road:'#d5e3da',theme:'canal',home:'운하 게스트하우스',park:'물빛 수변공원',gym:'그랜드 리버 코트',xp:195,rivals:[['스핀 설계자','percival'],['전국 랭커','jersey'],['속공 챌린저','leesin']]},
    {id:'one',name:'1부 마을',level:13,diff:'b1',bossDiff:'pro',boss:'백야범',face:'plain',bossType:'dragon',coachType:'dark',color:'#c7bb8c',ground:'#9daba0',road:'#e7e3d3',theme:'royal',home:'챔피언 레지던스',park:'왕관 정원',gym:'크라운 챔피언십',xp:220,rivals:[['챔피언 도전자','jersey'],['황금 백핸드','percival'],['무패의 수비수','ajae']]},
    {id:'camp',name:'선수촌',level:15,diff:'pro',bossDiff:'boss',boss:'탁구 마왕',face:'boss',bossType:'rock',coachType:'bug',color:'#ba7d92',ground:'#838498',road:'#d5c5d2',theme:'citadel',home:'국가대표 숙소',park:'별빛 올림픽 공원',gym:'마왕의 아레나',xp:260,rivals:[['국가대표 후보','jersey'],['월드 투어 선수','percival'],['전설의 수비수','sleepy']]}
  ];
  const statText={power:['파워','공격 +5% · 타구 속도 +5%'],spin:['회전','특수공격 +5% · 타구 회전 +5%'],control:['컨트롤','방어 +5% · PERFECT 폭 +3%'],footwork:['풋워크','스피드 +5% · 회전 공 실수 −10%'],crit:['치명타','급소 확률 +5% · 탁구 치명타 +5%'],focus:['집중력','특수방어 +5% · 필살기 게이지 +10%']};
  const gearStatNames={hp:'HP',attack:'공격',defense:'방어',spAttack:'특수공격',spDefense:'특수방어',speed:'스피드',crit:'급소 확률'};
  const gearStats=(item,upgrade=0)=>Object.entries(BeamEquipment.stats({inventory:{[item.id]:1},equipped:{[item.slot]:item.id},upgrades:{[item.id]:upgrade}})).filter(([,value])=>value>0).map(([key,value])=>`${gearStatNames[key]} +${key==='crit'?Math.round(value*100)+'%p':value}`).join(' · ')||'기본 라켓';
  const restBuffs={
    home:{name:'정비된 루틴',short:'공격형',turn:'공격·특수공격 +15%',rally:'타구 속도·회전 +15%',copy:'침대와 라켓을 정리하며 공격 리듬을 되찾습니다.'},
    park:{name:'산책의 리듬',short:'민첩형',turn:'스피드 +25% · 급소 +10%p',rally:'PERFECT 폭 +20% · 게이지 획득 +20%',copy:'공원의 바람을 맞으며 몸을 가볍게 풉니다.'},
    clinic:{name:'회복 보호막',short:'방어형',turn:'방어·특수방어 +25%',rally:'회전 실수 확률 −20% · PERFECT 폭 +10%',copy:'치유 코치가 자세를 바로잡아 단단하게 만듭니다.'}
  };
  const milestones=[[2,'라켓 시그니처'],[4,'스틸 카운터'],[7,'치키타 스파이럴'],[10,'메테오 스매시'],[13,'제니스 오버드라이브']];
  const facilityNames={shop:'라켓 공방',forge:'탁구채 강화소',cafe:'랠리 카페',training:'트레이닝 센터',clinic:'치유 센터',hall:'리그 기념관'};
  const read=k=>{try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
  const saved=read(key), legacy=Object.keys(saved).length?saved:read('beamrpg.v2');
  const integer=(n,fallback=0)=>Number.isFinite(n)&&n>=0?Math.floor(n):fallback;
  const s={...legacy,level:Math.max(1,integer(legacy.level,1)),xp:integer(legacy.xp),stats:Object.fromEntries(Object.keys(statText).map(k=>[k,integer(legacy.stats?.[k])])),wins:Object.fromEntries(zones.filter(z=>legacy.wins?.[z.id]===true).map(z=>[z.id,true])),pendingUpgrades:integer(legacy.pendingUpgrades),specialTurn:integer(legacy.specialTurn),coins:integer(legacy.coins,120),meal:Math.min(3,integer(legacy.meal)),trained:Object.fromEntries(zones.filter(z=>legacy.trained?.[z.id]===true).map(z=>[z.id,true]))};
  s.racket=Object.hasOwn(RACKETS,legacy.racket)?legacy.racket:'basic';
  const elementTypes=Object.keys(BeamCombat.TYPES);s.elementType=elementTypes.includes(legacy.elementType)?legacy.elementType:elementTypes[Math.floor(Math.random()*elementTypes.length)];
  s.owned=[...new Set(['basic',s.racket,...(Array.isArray(legacy.owned)?legacy.owned.filter(k=>Object.hasOwn(RACKETS,k)):[])])];
  s.equipment=BeamEquipment.normalize(legacy.equipment,s.racket,s.owned);s.racket=s.equipment.equipped.racket;
  s.quests=Object.fromEntries(zones.map(z=>[z.id,{accepted:legacy.quests?.[z.id]?.accepted===true,kills:Math.min(99,integer(legacy.quests?.[z.id]?.kills)),claimed:legacy.quests?.[z.id]?.claimed===true}]));
  // Keep previously accessible athlete village available without inventing boss victories.
  s.legacyCamp=legacy.legacyCamp===true||(!legacy.mapVersion&&s.wins.three===true);
  const open=z=>zones.indexOf(z)===0||!!s.wins[zones[zones.indexOf(z)-1].id]||(z.id==='camp'&&s.legacyCamp);
  s.zone=zones.some(z=>z.id===legacy.zone)?legacy.zone:'seven';
  // A brand-new journey begins in Heebeom's room; a saved valid place always wins.
  s.place=['world','town','interior','park'].includes(legacy.place)&&open(zones.find(z=>z.id===s.zone))?legacy.place:'interior';
  s.facility=['home','shop','forge','cafe','training','clinic','hall','gym','park'].includes(legacy.facility)?legacy.facility:'home';
  s.positions=legacy.mapVersion===2&&legacy.positions&&typeof legacy.positions==='object'?legacy.positions:{};
  s.mapVersion=2;s.introSeen=legacy.introSeen===true;delete s.worldPos;delete s.townPos;delete s.pos;
  const zone=()=>zones.find(z=>z.id===s.zone),need=()=>100+(s.level-1)*40;
  s.restBuff=restBuffs[legacy.restBuff?.id]?{id:legacy.restBuff.id,uses:Math.max(1,Math.min(3,integer(legacy.restBuff.uses,3)))}:legacy.rested?{id:'home',uses:1}:null;
  s.combatBuff=restBuffs[legacy.combatBuff]?legacy.combatBuff:null;delete s.rested;
  const heroProfile=buff=>BeamCombat.profile({...s,buff:buff||null,equipment:BeamEquipment.stats(s.equipment)}),combatConfig=buff=>({...s,buff:buff||null,equipment:BeamEquipment.stats(s.equipment),zoneIndex:zones.indexOf(zone()),zoneLevel:zone().level});
  const buffLabel=()=>s.restBuff?`${restBuffs[s.restBuff.id].name} · ${s.restBuff.uses}회`:'휴식 버프 없음';
  function takeRestBuff(){if(!s.restBuff)return null;const id=s.restBuff.id;if(--s.restBuff.uses<=0)s.restBuff=null;return id;}
  s.vitals=BeamCombat.normalizeVitals(s.vitals,heroProfile());
  s.combat=s.place==='town'?BeamCombat.restore(s.combat,combatConfig(s.combatBuff)):null;
  if(s.combat)s.vitals=BeamCombat.extractVitals(s.combat);
  let battleUI=null;
  const unlocks=()=>milestones.filter(([lv])=>s.level>=lv).map(([,name])=>name);
  window.beamRpgMilestones=()=>({level:s.level,unlocks:unlocks()});
  let scene,sceneId,player,map,ctx,mini,grid,cols,rows,path=[],target=null,last=0,grace=480,travelled=0,rolls=0,bushId=null,facing=1,direction='down',walking=false,latched=null,lastSave=0;
  let camera={x:0,y:0,scale:1,width:0,height:0,dpr:1};
  const keys=new Set(),dirs={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
  const save=()=>{try{if(sceneId&&player&&Number.isFinite(player.x)&&Number.isFinite(player.y))s.positions[sceneId]={x:player.x,y:player.y};localStorage.setItem(key,JSON.stringify(s));window.BeamCloud?.queue();}catch{message('저장 공간을 사용할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.');}};
  function message(text){screen.querySelector('#town-message')?.replaceChildren(text);}
  function stop(){path=[];target=null;keys.clear();walking=false;}
  function close(){modal.hidden=true;map?.focus({preventScroll:true});}
  function show(html,buttons='<button id="town-close">계속 걷기</button>'){
    stop();modal.innerHTML=`<div class="rpg-card"><div class="eyebrow">BEAMRPG · ${zone().name}</div><h2 id="town-dialog-title">${html.title}</h2><div class="facility-copy">${html.body}</div><div class="rpg-actions">${buttons}</div></div>`;
    modal.hidden=false;modal.querySelector('#town-close')?.addEventListener('click',close);modal.querySelector('button')?.focus();
  }
  const blocked=(x,y)=>x<20||y<20||x>scene.width-20||y>scene.height-20||scene.obstacles.some(o=>x>o.x-10&&x<o.x+o.w+10&&y>o.y-10&&y<o.y+o.h+10);
  function makeGrid(){
    cols=Math.ceil(scene.width/32);rows=Math.ceil(scene.height/32);grid=new Uint8Array(cols*rows);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)grid[y*cols+x]=blocked(x*32+16,y*32+16)?1:0;
  }
  const cellPoint=i=>({x:(i%cols)*32+16,y:Math.floor(i/cols)*32+16});
  function nearestCell(p){
    let found=-1,best=Infinity;
    for(let i=0;i<grid.length;i++){if(grid[i])continue;const q=cellPoint(i),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<best){best=d;found=i;}}
    return found;
  }
  function walkTo(point){
    if(!modal.hidden)return;stop();map.focus({preventScroll:true});
    const start=nearestCell(player),end=nearestCell(point);if(start<0||end<0)return;
    const previous=new Int32Array(grid.length).fill(-1),queue=[start];previous[start]=start;
    for(let i=0;i<queue.length&&previous[end]===-1;i++){
      const n=queue[i],x=n%cols,y=Math.floor(n/cols);
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,k=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||grid[k]||previous[k]!==-1)continue;previous[k]=n;queue.push(k);}
    }
    if(previous[end]===-1){message('이쪽은 건너갈 수 없어요. 연결된 길을 선택해 주세요.');return;}
    const route=[];for(let n=end;n!==start;n=previous[n])route.push(cellPoint(n));route.push(cellPoint(start));route.reverse();
    path=route.filter((p,i)=>i===0||i===route.length-1||(route[i-1].x!==route[i+1].x&&route[i-1].y!==route[i+1].y));
    if(!blocked(point.x,point.y))path.push(point);
    target=point;message('희범이 목적지로 걸어갑니다 · 방향키를 누르면 직접 조작합니다.');
  }
  function goPortal(p){if(Math.hypot(player.x-p.x,player.y-p.y)<(p.radius||38)){activate(p);return;}walkTo({x:p.x,y:p.y});}
  function title(){return s.place==='world'?'리그 로드':s.place==='town'?zone().name:s.place==='park'?zone().park:s.facility==='home'?zone().home:s.facility==='gym'?zone().gym:facilityNames[s.facility];}
  function buildScene(position,fresh=false){
    stop();sceneId=s.place==='world'?'world':`${s.place}:${s.zone}:${s.place==='town'?'':s.facility}`;
    scene=BeamMap.createScene({kind:s.place,zone:zone(),zones,isOpen:open,facility:s.facility});makeGrid();
    const old=position||(fresh?null:s.positions[sceneId]);player=old&&Number.isFinite(old.x)&&Number.isFinite(old.y)&&!blocked(old.x,old.y)?{x:old.x,y:old.y}:{...scene.spawn};
    if(blocked(player.x,player.y))player=cellPoint(nearestCell(player));s.positions[sceneId]=player;latched=null;bushId=null;
    render();save();
  }
  function render(){
    const z=zone(),safe=s.place!=='town',hp=heroProfile().maxHp;
    screen.innerHTML=`<div class="rpg-shell"><header class="rpg-head"><div class="brand"><div class="eyebrow">A LITTLE TOWN. A BIG ADVENTURE.</div><h1>BEAMRPG <span>대환장 파티</span></h1></div><div class="rpg-actions"><button id="town-stats">희범의 성장</button><button id="town-gear" class="secondary">장비</button><button id="town-guide" class="secondary">안내</button><button id="town-cloud" class="secondary">${BeamCloud.label()}</button></div></header>
      <div class="town-status"><div class="hero-badge"><canvas id="hero-face" width="72" height="72" aria-hidden="true"></canvas><div><b>Lv. ${s.level} 희범</b><small>${RACKETS[s.racket].name} · ${BeamCombat.TYPES[s.elementType].name} 타입</small></div></div><div class="xp-status"><span class="health-label">HP <b>${s.vitals.hp} / ${hp}</b></span><div class="rpg-bar health-bar"><i style="width:${s.vitals.hp/hp*100}%;background:${s.vitals.hp/hp<.25?'#e78075':s.vitals.hp/hp<.5?'#ebca7d':'#91d8bd'}"></i></div><span>경험치 <b>${s.xp} / ${need()}</b></span><div class="rpg-bar"><i style="width:${Math.min(100,s.xp/need()*100)}%"></i></div></div><div class="town-wallet"><b>${s.coins.toLocaleString()} G</b><small>${s.restBuff?buffLabel():s.meal?`식사 보너스 ${s.meal}승`:`보스 격파 ${Object.keys(s.wins).length} / 8`}</small></div></div>
      <div class="map-layout"><canvas id="town-map" tabindex="0" aria-label="${title()}. 클릭, 방향키 또는 WASD로 희범 이동. 시설 목록으로 목적지를 선택할 수 있습니다."></canvas><div class="map-overlay"><div class="map-location"><div class="eyebrow">${s.place==='world'?'THE LEAGUE ROAD':safe?'A MOMENT TO REST':`REGION ${zones.indexOf(z)+1} / 8 · Lv. ${z.level}`}</div><h2>${title()}</h2><p>${s.place==='world'?'8개의 마을, 하나의 챔피언을 향해':safe?'안전 지역 · 여유롭게 둘러보세요':'광장과 시설 앞은 안전 · 외곽 산책 중 몬스터 조우'}</p></div><div class="minimap-wrap"><canvas id="town-minimap" width="176" height="132" role="img" aria-label="현재 지역 미니맵"></canvas><span>REGION MAP</span></div><div class="map-hint">클릭하여 걷기 <span>·</span> WASD / 방향키 <span>·</span> E 시설 이용</div></div><nav class="destination-panel" aria-label="걸어서 방문할 목적지"><h3>${s.place==='world'?'다음 모험을 골라요':'마을 둘러보기'}</h3><div class="destination-list">${scene.portals.map((p,i)=>{const q=p.action==='zone'?zones.find(z=>z.id===p.value):null;return `<button data-destination="${i}" ${q?`data-zone="${q.id}"`:''}><span>${p.action==='return'?'↩ ':''}${p.label}</span><small>${q?s.wins[q.id]?'★ 보스 격파':open(q)?'입장 가능 · Lv. '+q.level:'이전 마을 보스 격파 필요':p.action==='return'?'출구까지 걸어가기':p.action==='service'?'가까이 가서 이용하기':'입구까지 걸어가기'}</small></button>`;}).join('')}</div><p class="journey-note">${s.place==='world'?'희범의 발걸음으로 이어지는 리그. 마을 보스를 이기면 다음 길이 열립니다.':'작은 골목도 천천히 걸어보세요. 모든 시설은 입구에 닿으면 들어갑니다.'}</p></nav></div>
      <footer class="town-bottom"><p id="town-message" role="status">${safe?'집·공원·건물 안에서는 대결이 발생하지 않습니다.':'먼저 집에서 쉬고, 라켓 공방을 들른 뒤 체육관으로 향해 보세요.'}</p><div class="town-controls" aria-label="희범 이동"><button data-dir="ArrowUp" aria-label="위로 이동">▲</button><button data-dir="ArrowLeft" aria-label="왼쪽으로 이동">◀</button><button data-dir="ArrowDown" aria-label="아래로 이동">▼</button><button data-dir="ArrowRight" aria-label="오른쪽으로 이동">▶</button></div></footer></div>`;
    map=$('town-map');ctx=map.getContext('2d');mini=$('town-minimap');drawFace($('hero-face'),{...LOOKS.heebeom,face:null,tousled:true});
    map.onclick=e=>{if(!modal.hidden)return;const r=map.getBoundingClientRect(),p={x:(e.clientX-r.left)/camera.scale+camera.x,y:(e.clientY-r.top)/camera.scale+camera.y};const door=scene.portals.find(q=>Math.hypot(p.x-q.x,p.y-q.y)<70);door?goPortal(door):walkTo(p);};
    screen.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>goPortal(scene.portals[+b.dataset.destination]));
    screen.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{if(!modal.hidden)return;e.preventDefault();stop();keys.add(b.dataset.dir);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{keys.delete(b.dataset.dir);save();};b.onclick=e=>{if(e.detail===0){const [x,y]=dirs[b.dataset.dir];walkTo({x:player.x+x*96,y:player.y+y*96});}};});
    $('town-stats').onclick=()=>s.pendingUpgrades?upgrade():showStats();$('town-gear').onclick=showEquipment;$('town-guide').onclick=guide;$('town-cloud').onclick=BeamCloud.toggle;map.focus({preventScroll:true});
  }
  function showEquipment(){
    const items=Object.values(BeamEquipment.ITEMS).filter(item=>s.equipment.inventory[item.id]);
    show({title:'희범의 장비',body:`<p>장비는 부위별로 하나씩 착용합니다. 보유 장비 ${items.length}종 · 강화는 각 마을 탁구채 강화소에서 할 수 있어요.</p><div class="shop-grid">${items.map(item=>`<article class="shop-item ${s.equipment.equipped[item.slot]===item.id?'equipped':''}"><b>${item.name} +${s.equipment.upgrades[item.id]||0}</b><small>${BeamEquipment.SLOTS[item.slot]} · ${gearStats(item,s.equipment.upgrades[item.id]||0)} · 보유 ${s.equipment.inventory[item.id]}개</small><button data-equip="${item.id}" ${s.equipment.equipped[item.slot]===item.id?'disabled':''}>${s.equipment.equipped[item.slot]===item.id?'착용 중':'착용하기'}</button></article>`).join('')}</div>`});
    modal.querySelectorAll('[data-equip]').forEach(button=>button.onclick=()=>{const item=BeamEquipment.equip(s,button.dataset.equip);if(!item)return;if(item.slot==='racket')setRacket(s.racket);s.vitals=BeamCombat.normalizeVitals(s.vitals,heroProfile());save();render();showEquipment();});
  }
  function quest(){
    const z=zone(),q=s.quests[z.id],target=2+Math.floor(zones.indexOf(z)/2),reward=50+zones.indexOf(z)*25;
    show({title:'의뢰인 나래',body:`<p><strong>${z.name} 순찰 의뢰</strong> · 일반 몬스터 ${target}마리와 대결해 승리해 주세요.</p><p>${q.claimed?'의뢰 완료! 다음 마을에서도 나래를 찾아 주세요.':q.accepted?`진행 ${Math.min(q.kills,target)} / ${target} · 보상 ${z.xp} XP와 ${reward} G`:`수락하면 이 마을에서 거둔 승리부터 기록됩니다. 보상 ${z.xp} XP와 ${reward} G`}</p>`},q.claimed?undefined:`<button id="quest-action" ${q.accepted&&q.kills<target?'disabled':''}>${q.accepted?'보상 받기':'의뢰 수락'}</button><button id="town-close" class="secondary">돌아가기</button>`);
    modal.querySelector('#quest-action')?.addEventListener('click',()=>{if(!q.accepted)q.accepted=true;else if(q.kills>=target&&!q.claimed){q.claimed=true;s.coins+=reward;gainXp(z.xp);}save();render();if(s.pendingUpgrades)upgrade();else quest();});
  }
  function showStats(){const p=heroProfile(),b=s.restBuff&&restBuffs[s.restBuff.id];show({title:'희범의 성장 기록',body:`<p>HP ${s.vitals.hp} / ${p.maxHp} · 회복약 ${s.vitals.potions}개 · ${BeamCombat.TYPES[p.type].name} 타입</p><p>턴제 기술: ${p.moves.map(id=>`${BeamCombat.MOVES[id].name} (PP ${s.vitals.pp[id]}/${BeamCombat.MOVES[id].pp})`).join(' · ')}</p><p>휴식 버프: ${b?`<strong>${b.name}</strong> · ${b.short} · 앞으로 ${s.restBuff.uses}전투 · 일반 전투 ${b.turn} · 보스·훈련 ${b.rally}`:'없음 · 집·공원·치유 센터에서 선택'}</p><p>배운 기술: ${unlocks().join(' · ')||'Lv.2에 첫 필살기를 배웁니다.'}</p><div class="stat-grid">${Object.entries(statText).map(([k,[n,fx]])=>`<div class="stat-item"><b>${n} +${s.stats[k]}</b><small>${fx}</small></div>`).join('')}</div><p>${milestones.map(([lv,n])=>`Lv.${lv} ${n}`).join(' · ')}</p><p>식사 보너스 ${s.meal}승 남음</p>`});}
  function guide(){show({title:'희범의 새로운 동네',body:'<p>지도나 오른쪽 목적지를 누르면 희범이 건물과 물을 피해 걸어갑니다. 방향키·WASD·화면 버튼으로 직접 움직일 수도 있어요.</p><p>건물의 문에 닿으면 내부로 들어갑니다. 내부 안내 위치에 닿거나 가까이서 E를 누르면 시설을 이용합니다. 출구로 걸으면 원래 마을로 돌아옵니다.</p><p>광장과 시설 주변은 안전합니다. 마을 외곽을 걸으면 몬스터와 턴제 전투를 합니다. 부쉬에 들어가면 95% 확률로 상대를 만납니다. 배운 기술 중 하나를 선택해 상대 HP를 먼저 0으로 만들면 승리합니다. 집과 공원에서는 대결이 일어나지 않습니다.</p><p>희범과 상대는 DP의 17개 타입 중 하나를 가집니다. 기술마다 타입이 있으며 기술 버튼은 2배 피해면 노란 테두리, 반감 피해면 빨간 테두리로 표시됩니다. 무효·일반 효과도 글자로 확인할 수 있습니다. 같은 타입 기술은 1.5배입니다. 전투 후 HP·PP는 유지되며 집이나 치유 센터에서 무료로 회복합니다. 가방의 회복약 사용도 한 턴입니다. 도망에 실패하면 상대가 공격합니다.</p><p>마을 상점에서 전용 장비를 사고 강화소에서 강화하세요. 화면 위 장비 메뉴에서 부위별로 착용할 수 있습니다. 일반 상대를 이기면 낮은 확률로 장비를 얻고, 보스를 이기면 마을 장비를 반드시 얻습니다. 의뢰인 나래에게 마을 퀘스트를 받을 수도 있어요. 높은 레벨 몬스터를 이기면 경험치를 더 받습니다.</p><p>체육관 보스와 코치 훈련은 기존 탁구 스윙 경기입니다. 게이지가 차면 배운 기술 중 하나가 무작위로 발동합니다. 체육관 안에서 보스에게 도전하세요. 승리하면 경험치·골드를 얻고 다음 마을이 열립니다. 진행은 이 브라우저에 자동 저장됩니다.</p>'},'<button id="story-replay">스토리 다시 보기</button><button id="town-close" class="secondary">계속 걷기</button>');$('story-replay').onclick=playIntro;}
  function playIntro(){
    stop();BeamStory.play({modal,screen,zones,onFinish:()=>{s.introSeen=true;save();close();if(s.pendingUpgrades)upgrade();}});
  }
  function activate(p){
    latched=p.id;stop();
    if(p.action==='zone'){
      const z=zones.find(z=>z.id===p.value);if(!open(z)){const prev=zones[zones.indexOf(z)-1];show({title:'아직 닫힌 마을',body:`<p>${prev.name}의 ${prev.boss}를 이기면 ${z.name}에 들어갈 수 있습니다.</p>`});return;}
      s.zone=z.id;s.place='town';grace=480;travelled=rolls=0;buildScene(null,true);
    }else if(p.action==='facility'){
      s.facility=p.value;s.place=p.value==='park'?'park':'interior';buildScene(null,true);
    }else if(p.action==='return'){
      const wasTown=s.place==='town',value=wasTown?s.zone:s.facility;s.place=wasTown?'world':'town';
      const next=BeamMap.createScene({kind:s.place,zone:zone(),zones,isOpen:open,facility:s.facility});const exit=next.portals.find(q=>q.value===value&&q.action===(wasTown?'zone':'facility'));
      buildScene(exit?{x:exit.x,y:exit.y+80}:next.spawn);grace=Math.max(grace,240);
    }else if(p.action==='service')service(p.value);
    else if(p.action==='quest')quest();
  }
  function arrive(){
    const old=scene.portals.find(p=>p.id===latched);if(old&&Math.hypot(player.x-old.x,player.y-old.y)>(old.radius||38)+28)latched=null;
    const portal=scene.portals.find(p=>p.id!==latched&&(!target||Math.hypot(target.x-p.x,target.y-p.y)<70)&&Math.hypot(player.x-p.x,player.y-p.y)<(p.radius||38));if(portal){activate(portal);return true;}return false;
  }
  function service(facility){
    const z=zone(),done='<button id="town-close" class="secondary">둘러보기</button>';
    if(facility==='gym'){
      show({title:z.gym,body:`<p>이번 마을의 보스 <strong>${z.boss}</strong>가 기다립니다. · <strong>${BeamCombat.TYPES[z.bossType].name} 타입</strong></p><p>권장 Lv.${z.level} · 승리 보상 ${z.xp*2} XP · ${120+zones.indexOf(z)*20} G</p><p>${s.wins[z.id]?'이미 이긴 보스에게 다시 도전할 수 있습니다.':'보스를 이기면 다음 마을로 가는 길이 열립니다.'}</p>`},'<button id="facility-action">보스에게 도전</button>'+done);
      $('facility-action').onclick=()=>battle({name:z.boss,face:z.face,boss:true,type:z.bossType});
    }else if(facility==='shop'){
      const catalog=BeamEquipment.catalog(z.id);
      show({title:'마을 장비 상점',body:`<p>${z.name} 판매 장비 · 가진 골드 ${s.coins} G. 구입한 장비는 바로 착용하며, 다른 장비는 위쪽 장비 메뉴에서 바꿀 수 있어요.</p><div class="shop-grid">${catalog.map(item=>{const owned=!!s.equipment.inventory[item.id],equipped=s.equipment.equipped[item.slot]===item.id;return `<article class="shop-item ${equipped?'equipped':''}"><b>${item.name}</b><small>${BeamEquipment.SLOTS[item.slot]} · ${gearStats(item,s.equipment.upgrades[item.id]||0)}</small>${item.slot==='racket'?`<small>Lv.2 기술 · ${SPECIALS[RACKETS[item.id].special].name}</small>`:''}<button data-item="${item.id}" ${item.slot==='racket'?`data-racket="${item.id}"`:''} ${equipped||(!owned&&s.coins<item.price)?'disabled':''}>${equipped?'착용 중':owned?'착용하기':item.price+' G · 구입·착용'}</button></article>`;}).join('')}</div>`},done);
      modal.querySelectorAll('[data-item]').forEach(button=>button.onclick=()=>{const id=button.dataset.item;if(!s.equipment.inventory[id]&&!BeamEquipment.buy(s,id,z.id))return;const item=BeamEquipment.equip(s,id);if(!item)return;if(item.slot==='racket')setRacket(s.racket);s.vitals=BeamCombat.normalizeVitals(s.vitals,heroProfile());save();render();service('shop');});
    }else if(facility==='forge'){
      const items=Object.values(BeamEquipment.ITEMS).filter(item=>s.equipment.inventory[item.id]);
      show({title:'탁구채 강화소',body:`<p>라켓과 착용 장비를 강화해 스탯을 올립니다. 각 장비는 +5까지 강화할 수 있어요. 가진 골드 ${s.coins} G</p><div class="shop-grid">${items.map(item=>{const cost=BeamEquipment.upgradeCost(s.equipment,item.id);return `<article class="shop-item"><b>${item.name} +${s.equipment.upgrades[item.id]||0}</b><small>${BeamEquipment.SLOTS[item.slot]} · ${gearStats(item,s.equipment.upgrades[item.id]||0)}</small><button data-upgrade="${item.id}" ${cost===null||s.coins<cost?'disabled':''}>${cost===null?'최대 강화':cost+' G · 강화'}</button></article>`;}).join('')}</div>`},done);
      modal.querySelectorAll('[data-upgrade]').forEach(button=>button.onclick=()=>{if(!BeamEquipment.upgrade(s,button.dataset.upgrade))return;s.vitals=BeamCombat.normalizeVitals(s.vitals,heroProfile());save();render();service('forge');});
    }else if(facility==='cafe'){
      show({title:'랠리 카페',body:`<p>창가에서 쉬어 가세요. 챔피언 샌드위치를 먹으면 <strong>다음 3번 승리의 경험치가 20% 증가</strong>합니다.</p><p>가격 40 G · 가진 골드 ${s.coins} G · 현재 ${s.meal}승 남음</p>`},`<button id="facility-action" ${s.coins<40||s.meal>0?'disabled':''}>${s.meal?'식사 효과 적용 중':'샌드위치 주문 · 40 G'}</button>`+done);
      $('facility-action').onclick=()=>{if(s.coins<40||s.meal>0)return;s.coins-=40;s.meal=3;save();render();service('cafe');};
    }else if(facility==='training'){
      show({title:'트레이닝 센터',body:`<p>코치와 탁구를 치며 보스전의 스윙 조작을 익혀보세요. · <strong>${BeamCombat.TYPES[z.coachType].name} 타입</strong></p><p>훈련 경기에서는 HP와 PP를 사용하지 않습니다.</p><p>이 마을 첫 훈련 승리 시 ${z.xp} XP를 얻습니다. ${s.trained[z.id]?'첫 훈련 보상 수령 완료 · 이후에는 연습 경기입니다.':'경기에서 져도 경험치를 잃지 않습니다.'}</p>`},'<button id="facility-action">코치와 훈련 경기</button>'+done);
      $('facility-action').onclick=()=>battle({name:'전담 코치',face:'plain',boss:false,training:true,type:z.coachType});
    }else if(facility==='hall'){
      show({title:'리그 기념관',body:`<p>희범이 걸어온 길 · 트로피 ${Object.keys(s.wins).length} / 8</p><div class="stat-grid">${zones.map(z=>`<div class="stat-item"><b>${s.wins[z.id]?'★':'☆'} ${z.name}</b><small>${s.wins[z.id]?z.boss+' 격파':z.boss+'에게 도전하세요'}</small></div>`).join('')}</div>`});
    }else{
      const home=facility==='home',healing=home||facility==='clinic',buff=restBuffs[facility==='park'?'park':facility==='clinic'?'clinic':'home'];
      show({title:home?z.home:facility==='park'?z.park:'치유 센터',body:`<p>${home?'침대와 라켓을 정비해 다음 승부의 공격 리듬을 만듭니다.':facility==='park'?'벤치에서 스트레칭하며 발걸음과 감각을 살립니다.':'치유 코치가 자세를 바로잡고 몸을 단단하게 회복시킵니다.'}</p>${healing?`<p><strong>HP ${s.vitals.hp} / ${heroProfile().maxHp} · HP·PP 완전 회복</strong></p>`:''}<div class="rest-buff-card"><b>${buff.name} · ${buff.short}</b><small>일반 전투: ${buff.turn}</small><small>보스·훈련: ${buff.rally}</small><p>다음 3번 전투에 적용됩니다. 다른 장소에서 쉬면 새 버프로 교체됩니다.</p></div>${facility==='clinic'?`<p>회복약 ${s.vitals.potions}개 · 전투에서 HP 40 회복 · 구입 25 G</p>`:''}`},`<button id="facility-action">${healing?'회복하고 버프 받기':'휴식하고 버프 받기'}</button>${facility==='clinic'?`<button id="buy-potion" ${s.coins<25||s.vitals.potions>=99?'disabled':''}>회복약 구입 · 25 G</button>`:''}`+done);
      $('facility-action').onclick=()=>{if(healing)s.vitals=BeamCombat.heal(s.vitals,heroProfile());s.restBuff={id:facility==='park'?'park':facility==='clinic'?'clinic':'home',uses:3};grace=800;save();render();show({title:healing?'회복·버프 완료!':'버프 획득!',body:`<p>${healing?'희범의 HP와 모든 기술의 PP가 가득 찼습니다. ':''}<strong>${buff.name}</strong>이 다음 3번 전투에 적용됩니다.</p><p>일반 전투: ${buff.turn}<br>보스·훈련: ${buff.rally}</p>`});};
      modal.querySelector('#buy-potion')?.addEventListener('click',()=>{if(s.coins<25||s.vitals.potions>=99)return;s.coins-=25;s.vitals.potions++;save();render();service('clinic');});
    }
  }
  function encounter(distance){
    if(s.place!=='town'||distance<=0)return;
    if(grace>0){grace=Math.max(0,grace-distance);return;}
    const bush=scene.bushes?.find(b=>player.x>=b.x&&player.x<=b.x+b.w&&player.y>=b.y&&player.y<=b.y+b.h)||null;
    if(bush!==bushId){bushId=bush;if(bush&&Math.random()<bush.encounterChance){normalBattle();return;}}
    if(Math.hypot(player.x-scene.width/2,player.y-scene.height/2)<300||scene.portals.some(p=>Math.hypot(player.x-p.x,player.y-p.y)<155))return;
    travelled+=distance;if(travelled<160)return;travelled-=160;rolls++;
    if(Math.random()<.16||rolls>=12)normalBattle();
  }
  function normalBattle(){
    if(rpgOn()||battleUI)return;stop();modal.hidden=true;screen.inert=true;
    if(!s.combat){s.combatBuff=takeRestBuff();s.combat=BeamCombat.create(combatConfig(s.combatBuff));}
    save();battleUI=BeamBattleUI.open({state:s.combat,zone:zone(),gear:s.equipment.equipped,onAction:action=>{
      BeamCombat.step(s.combat,action);s.vitals=BeamCombat.extractVitals(s.combat);save();battleUI.update(s.combat);
    },onFinish:finishNormal});
  }
  function finishNormal(){
    const b=s.combat;if(!b?.outcome)return;
    battleUI?.destroy();battleUI=null;screen.inert=false;s.vitals=BeamCombat.extractVitals(b);s.combat=null;s.combatBuff=null;
    let gain=0,gold=0,drop=null;
    if(b.outcome==='win'){
      const gap=Math.max(0,b.enemy.level-b.hero.level);gain=Math.round(zone().xp*(1+Math.min(gap,4)*.5));if(s.meal){gain=Math.round(gain*1.2);s.meal--;}gold=45+zones.indexOf(zone())*10;gainXp(gain);s.coins+=gold;const q=s.quests[zone().id];if(q.accepted&&!q.claimed)q.kills++;drop=BeamEquipment.drop(s,zone().id,false);
    }
    grace=800;travelled=rolls=0;
    if(b.outcome==='lose'){s.place='interior';s.facility='clinic';s.vitals=BeamCombat.heal(s.vitals,heroProfile());buildScene(null,true);}else{render();save();}
    show({title:b.outcome==='win'?'승리!':b.outcome==='lose'?'치유 센터에서 회복했습니다':'무사히 돌아왔습니다',body:`<p>${b.enemy.name}과의 대결</p><p>${b.outcome==='win'?`경험치 +${gain} · 골드 +${gold} G${b.enemy.level>b.hero.level?' · 상위 레벨 보너스!':''}${drop?` · ${drop.name} 획득!`:''}`:b.outcome==='lose'?'희범의 HP가 0이 되어 치유 센터로 돌아왔습니다. HP·PP를 모두 회복했고, 경험치와 골드는 잃지 않았습니다.':'남은 HP와 PP는 유지됩니다. 집이나 치유 센터에서 회복하세요.'}</p><p>HP ${s.vitals.hp} / ${heroProfile().maxHp}</p>${s.pendingUpgrades?`<p>Lv. ${s.level} · 강화 ${s.pendingUpgrades}개를 고를 수 있습니다.</p>`:''}`},s.pendingUpgrades?'<button id="town-upgrade">강화 고르기</button>':undefined);
    modal.querySelector('#town-upgrade')?.addEventListener('click',upgrade);
  }
  function specialType(baseType){const b=rpgOn();if(!b)return baseType;if(b.activeSpecial)return b.activeSpecial;const learned=[baseType,...(s.level>=4?['counter']:[]),...(s.level>=7?['chiquita']:[]),...(s.level>=10?['meteor']:[]),...(s.level>=13?['zenith']:[])];b.activeSpecial=learned[Math.floor(Math.random()*learned.length)];save();return b.activeSpecial;}
  function battle(rival){
    if(rpgOn()||battleUI)return;stop();const z=zone(),restBuff=takeRestBuff(),rivalType=BeamCombat.TYPES[rival.type]?rival.type:'normal';
    window.beamRpgV2={active:true,zone:z,boss:rival.boss,rival,rivalType,stats:s.stats,level:s.level,restBuff,specialType};
    setCharacter('heebeom');setRacket(s.racket);$('difficulty').value=rival.training?'b7':rival.boss?(z.id==='camp'?'pro':z.bossDiff):z.diff;applySettings();setMode(rival.boss&&z.id==='camp'?'boss':'match');
    modal.hidden=true;screen.hidden=true;document.body.classList.add('rpg-battle');resize();begin();P.EQUIP.len*=(1+s.stats.control*.03)*(restBuff==='park'?1.2:restBuff==='clinic'?1.1:1);save();toast(`${z.name} · ${rival.name}${rival.boss?' 보스':' 등장'} · ${BeamCombat.TYPES[rivalType].name} 타입${restBuff?' · '+restBuffs[restBuff].name+' 적용':''}`,3);
  }
  function backToTown(){
    stop();playing=paused=false;lockPage(false);release();clearSave();$('overlay').classList.add('hidden');$('pause').disabled=true;
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    document.body.classList.remove('rpg-battle');screen.hidden=false;grace=600;travelled=rolls=0;render();save();
  }
  function gainXp(amount){s.xp+=amount;while(s.xp>=need()){s.xp-=need();s.level++;s.pendingUpgrades++;}s.vitals=BeamCombat.normalizeVitals(s.vitals,heroProfile());}
  function finish(){
    const b=rpgOn();if(!b||playing)return;const won=you>=11&&you-cpu>=2,score=`${you} : ${cpu}`;b.active=false;
    let gain=0,gold=0,first=false,drop=null;
    if(won){const training=b.rival.training;gain=training?(s.trained[b.zone.id]?0:b.zone.xp):b.zone.xp*(b.boss?2:1);if(gain&&s.meal){gain=Math.round(gain*1.2);s.meal--;}gold=training?0:b.boss?120+zones.indexOf(b.zone)*20:45+zones.indexOf(b.zone)*10;gainXp(gain);s.coins+=gold;if(training)s.trained[b.zone.id]=true;first=b.boss&&!s.wins[b.zone.id];if(b.boss){s.wins[b.zone.id]=true;drop=BeamEquipment.drop(s,b.zone.id,true);}}
    backToTown();const next=zones[zones.indexOf(b.zone)+1];
    show({title:won?(b.boss?'보스 격파!':'승리!'):'다음 승부를 준비하세요',body:`<p>${b.rival.name} · ${score}</p><p>${won?'경험치 +'+gain+' · 골드 +'+gold+' G'+(drop?' · '+drop.name+' 획득!':''):'경험치와 골드는 잃지 않았습니다.'}</p>${first?`<p>${next?next.name+'이 열렸습니다! 바깥 리그 로드에서 다음 마을에 도전하세요.':'🏆 탁구 마왕을 격파했습니다!'}</p>`:''}${s.pendingUpgrades?`<p>Lv. ${s.level} · 강화 ${s.pendingUpgrades}개를 고를 수 있습니다.</p>`:''}`},s.pendingUpgrades?'<button id="town-upgrade">강화 고르기</button>':undefined);modal.querySelector('#town-upgrade')?.addEventListener('click',upgrade);
  }
  function upgrade(){
    const pool=Object.keys(statText),picks=[];while(picks.length<3)picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    show({title:'레벨 업! 강화 선택',body:`<p>3개 중 하나를 고르세요. 남은 선택 ${s.pendingUpgrades}개</p>`},picks.map(k=>`<button data-up="${k}">${statText[k][0]} · ${statText[k][1]}</button>`).join(''));
    modal.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{s.stats[b.dataset.up]++;s.pendingUpgrades--;save();render();if(s.pendingUpgrades)upgrade();else close();});
  }
  function flee(){if(!rpgOn())return;window.beamRpgV2.active=false;reset();backToTown();show({title:'돌아왔습니다',body:'<p>대결에서 물러났습니다. 경험치와 보스 격파 기록은 그대로입니다.</p>'});}
  $('home').textContent='마을로 도망';$('home').onclick=flee;$('exit-btn').onclick=flee;$('restart').hidden=true;$('start').onclick=()=>{if(paused)pause();};
  $('rpg-open').onclick=()=>{if(rpgOn())flee();else{screen.hidden=false;render();}};
  const character=$('character');if(!character.querySelector('[value="heebeom"]'))character.prepend(new Option('희범','heebeom'));setCharacter('heebeom');setRacket(s.racket);
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','town-dialog-title');
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&!s.pendingUpgrades)close();if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not(:disabled)')],first=buttons[0],end=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end?.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus();}}});
  document.addEventListener('keydown',e=>{if(screen.hidden||screen.inert||!modal.hidden)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k==='e'){const p=scene.portals.find(p=>Math.hypot(player.x-p.x,player.y-p.y)<85);if(p)activate(p);return;}if(!dirs[k])return;e.preventDefault();path=[];target=null;keys.add(k);});
  document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(k);if(dirs[k])save();});
  window.addEventListener('blur',stop);window.addEventListener('beforeunload',save);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();save();}});
  function draw(t){
    const r=map.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(window.devicePixelRatio||1,2),scale=s.place==='interior'&&r.width>=720?Math.min(r.width/scene.width,r.height/scene.height)*.96:r.width<600?.75:.85;
    if(map.width!==Math.round(r.width*dpr)||map.height!==Math.round(r.height*dpr)){map.width=Math.round(r.width*dpr);map.height=Math.round(r.height*dpr);}
    camera={x:r.width/scale>scene.width?(scene.width-r.width/scale)/2:P.clamp(player.x-r.width/scale/2,0,scene.width-r.width/scale),y:r.height/scale>scene.height?(scene.height-r.height/scale)/2:P.clamp(player.y-r.height/scale/2,0,scene.height-r.height/scale),scale,width:r.width/scale,height:r.height/scale,dpr};
    ctx.setTransform(dpr*scale,0,0,dpr*scale,-camera.x*dpr*scale,-camera.y*dpr*scale);ctx.fillStyle='#203b3b';ctx.fillRect(camera.x,camera.y,camera.width,camera.height);BeamMap.draw(ctx,scene,{player,time:t/1000,walking,facing,direction,path,target,gear:s.equipment.equipped});
    const m=mini.getContext('2d'),sx=mini.width/scene.width,sy=mini.height/scene.height;m.clearRect(0,0,mini.width,mini.height);m.drawImage(scene.background,0,0,mini.width,mini.height);m.fillStyle='#2e4548aa';for(const o of scene.obstacles)m.fillRect(o.x*sx,o.y*sy,o.w*sx,o.h*sy);
    for(const p of scene.portals){m.fillStyle=p.action==='return'?'#8fcddd':p.action==='zone'&&!open(zones.find(z=>z.id===p.value))?'#9b9b8b':'#ead29b';m.fillRect(p.x*sx-2,p.y*sy-2,4,4);}m.strokeStyle='#ffffff88';m.strokeRect(camera.x*sx,camera.y*sy,camera.width*sx,camera.height*sy);m.fillStyle='#fff';m.beginPath();m.arc(player.x*sx,player.y*sy,3,0,Math.PI*2);m.fill();
  }
  function tick(t){
    const dt=Math.min((t-last)/1000||0,.05);last=t;finish();const b=rpgOn();if(b&&charge<100)b.activeSpecial=null;
    if(!screen.hidden&&!screen.inert&&!document.hidden){walking=false;if(modal.hidden){
      let dx=0,dy=0;for(const k of keys){dx+=dirs[k][0];dy+=dirs[k][1];}let distance=240*dt;
      if(path.length&&!keys.size){dx=path[0].x-player.x;dy=path[0].y-player.y;distance=Math.min(distance,Math.hypot(dx,dy));}
      const d=Math.hypot(dx,dy),old={...player};if(d>0){const nx=player.x+dx/d*distance,ny=player.y+dy/d*distance;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;if(dx)facing=dx<0?-1:1;direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
      const moved=Math.hypot(player.x-old.x,player.y-old.y);walking=moved>.01;
      if(path.length&&Math.hypot(player.x-path[0].x,player.y-path[0].y)<1){path.shift();if(!path.length){target=null;save();}}
      if(d>0&&!walking&&path.length){stop();message('장애물 앞입니다. 옆 길이나 시설 목록을 선택해 주세요.');}
      if(walking&&!arrive())encounter(moved);if(walking&&t-lastSave>5000){save();lastSave=t;}
    }if(!screen.hidden)draw(t);}
    requestAnimationFrame(tick);
  }
  BeamCloud.attach({key,get:()=>s});
  buildScene();screen.hidden=false;if(s.combat)normalBattle();else if(!s.introSeen)playIntro();else if(s.pendingUpgrades)upgrade();requestAnimationFrame(tick);
})();
