/* The town controller shares only the rally engine's battle state and character art. */
(() => {
  const screen = $('rpg-screen'), modal = $('rpg-modal'), key = 'beamrpg.v3';
  const zones = [
    {id:'seven', name:'7부 마을', level:1, diff:'b7', bossDiff:'b6', boss:'아재범', face:'ajae', x:18, y:26, color:'#78b957', ground:'#53854d', road:'#d6bd82', home:'희범의 집', park:'새싹 공원', gym:'동네 탁구장', xp:70, rivals:[['동네 고수 민수','jersey'],['수비 장인 준호','sleepy'],['서브 괴물 지훈','leesin']]},
    {id:'six', name:'6부 마을', level:3, diff:'b6', bossDiff:'b5', boss:'꿀잠범', face:'sleepy', x:50, y:26, color:'#e7b35a', ground:'#9a8050', road:'#efd4a0', home:'햇살 여관', park:'낮잠 정원', gym:'해질녘 탁구장', xp:90, rivals:[['새벽 연습생','plain'],['끈질긴 수비수','ajae'],['리듬의 달인','jersey']]},
    {id:'five', name:'5부 마을', level:5, diff:'b5', bossDiff:'b4', boss:'리신범', face:'leesin', x:82, y:26, color:'#ec805f', ground:'#9c6652', road:'#e5b48c', home:'불꽃 숙소', park:'연습 광장', gym:'드라이브 도장', xp:110, rivals:[['속공 신예','leesin'],['회전 연구가','percival'],['카운터 장인','drunk']]},
    {id:'four', name:'4부 마을', level:7, diff:'b4', bossDiff:'b3', boss:'퍼시벌', face:'percival', x:18, y:63, color:'#b778d1', ground:'#71547e', road:'#baa2c6', home:'달빛 여관', park:'회전 정원', gym:'퍼시벌 체육관', xp:140, rivals:[['왼손 라이벌','percival'],['커트 마스터','sleepy'],['변칙 승부사','drunk']]},
    {id:'three', name:'3부 마을', level:9, diff:'b3', bossDiff:'b2', boss:'휴고범', face:'jersey', x:50, y:63, color:'#5d9bea', ground:'#476d87', road:'#a0c3d7', home:'선수 합숙소', park:'챔피언 광장', gym:'휴고범 경기장', xp:170, rivals:[['백핸드 에이스','jersey'],['랠리 전문가','leesin'],['전국대회 유망주','plain']]},
    {id:'camp', name:'선수촌', level:12, diff:'pro', bossDiff:'boss', boss:'탁구 마왕', face:'boss', x:82, y:63, color:'#e34d61', ground:'#6d465a', road:'#bda3ae', home:'국가대표 숙소', park:'최종 훈련장', gym:'마왕의 아레나', xp:220, rivals:[['국가대표 후보','jersey'],['월드 투어 선수','percival'],['전설의 수비수','sleepy']]}
  ];
  const statText = {power:['파워','타구 속도 +5%'], spin:['회전','타구 회전 +5%'], control:['컨트롤','PERFECT 타이밍 폭 +3%'], footwork:['풋워크','회전 공 실수 확률 −10%'], crit:['치명타','치명타 확률 +5% · 속도 2배'], focus:['집중력','필살기 게이지 +10%']};
  const base = {level:1, xp:0, stats:{power:0,spin:0,control:0,footwork:0,crit:0,focus:0}, wins:{}, place:'world', zone:'seven', worldPos:{x:50,y:88}, townPos:{x:50,y:82}, pendingUpgrades:0, specialTurn:0};
  const read = k => {try {return JSON.parse(localStorage.getItem(k)) || {};} catch {return {};}};
  const legacy = read('beamrpg.v2'), saved = read(key);
  const s = {...structuredClone(base), ...(Object.keys(saved).length ? saved : legacy)};
  const integer = (n, fallback=0) => Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  s.level = Math.max(1, integer(s.level, 1)); s.xp = integer(s.xp);
  s.stats = Object.fromEntries(Object.keys(base.stats).map(k => [k, integer(s.stats?.[k])]));
  s.wins = Object.fromEntries(zones.filter(z => (saved.wins ?? legacy.wins)?.[z.id] === true).map(z => [z.id, true]));
  s.pendingUpgrades = integer(s.pendingUpgrades); s.specialTurn = integer(s.specialTurn);
  const clampPos = (p, fallback) => ({x:Number.isFinite(p?.x) ? P.clamp(p.x,5,95) : fallback.x, y:Number.isFinite(p?.y) ? P.clamp(p.y,8,92) : fallback.y});
  s.worldPos = clampPos(s.worldPos, base.worldPos); s.townPos = clampPos(saved.townPos || saved.pos, base.townPos);
  s.zone = zones.some(z => z.id === s.zone) ? s.zone : 'seven';
  const open = z => zones.indexOf(z) === 0 || !!s.wins[zones[zones.indexOf(z)-1].id];
  s.place = s.place === 'town' && open(zones.find(z => z.id === s.zone)) ? 'town' : 'world';
  const zone = () => zones.find(z => z.id === s.zone), pos = () => s.place === 'town' ? s.townPos : s.worldPos;
  const need = () => 100 + (s.level-1)*40;
  const save = () => {try {localStorage.setItem(key, JSON.stringify(s));} catch {screen.querySelector('#town-message')?.replaceChildren('저장 공간을 사용할 수 없어 이번 진행은 새로고침하면 사라집니다.');}};
  const unlocks = () => [[2,'라켓 필살기'],[4,'고요한 호흡'],[7,'치키타 스파이럴'],[10,'챔피언 심장'],[13,'제니스 오버드라이브']].filter(([lv]) => s.level>=lv).map(([,name]) => name);
  window.beamRpgMilestones = () => ({level:s.level, unlocks:unlocks()});
  let target = null, last = 0, grace = 300, travelled = 0, rolls = 0, facing = 1, map, avatar;
  const keys = new Set();
  const dirs = {ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
  function stop() {target=null; keys.clear(); avatar?.classList.remove('walking');}
  function close() {modal.hidden=true; map?.focus({preventScroll:true});}
  function show(html, buttons='<button id="town-close">계속 걷기</button>') {
    stop(); modal.innerHTML=`<div class="rpg-card"><h2 id="town-dialog-title">${html.title}</h2>${html.body}<div class="rpg-actions">${buttons}</div></div>`;
    modal.hidden=false; modal.querySelector('#town-close')?.addEventListener('click', close); modal.querySelector('button')?.focus();
  }
  function drawPortrait() {const c=screen.querySelector('.walker-face'); if(c)drawFace(c,{...LOOKS.heebeom,face:null,tousled:true});}
  function paint(walking=false) {
    const p=pos(); avatar.style.left=p.x+'%'; avatar.style.top=p.y+'%'; avatar.style.setProperty('--facing',facing);
    avatar.classList.toggle('walking',walking); avatar.style.zIndex=Math.round(p.y)+2;
  }
  function render() {
    stop(); const z=zone(), town=s.place==='town';
    screen.innerHTML=`<div class="rpg-shell"><div class="rpg-head"><div><div class="eyebrow">BEAMRPG · 대환장 파티</div><h1>${town?z.name:'희범의 마을 지도'}</h1><p>${town?'길을 걷다 보면 새로운 상대를 만납니다. 보스 체육관에서 다음 마을에 도전하세요.':'희범을 움직여 마을 입구에 닿으세요. 보스를 이기면 다음 마을이 열립니다.'}</p></div><div class="rpg-actions"><button id="town-stats">내 성장</button></div></div>
      <div class="rpg-card town-status"><b>Lv. ${s.level} 희범</b><span>경험치 ${s.xp} / ${need()}</span><span>${s.wins.camp?'🏆 리그 정복 완료':`열린 마을 ${zones.filter(open).length} / ${zones.length}`}</span><div class="rpg-bar"><i style="width:${Math.min(100,s.xp/need()*100)}%"></i></div></div>
      <div id="town-map" class="rpg-map walk-map ${town?'inside-town':'world-map'}" tabindex="0" aria-label="${town?z.name:'마을 지도'}: 클릭, 방향키, WASD로 희범 이동" style="--ground:${town?z.ground:'#528663'};--road:${town?z.road:'#d6c49e'};--accent:${town?z.color:'#87b9ff'}">
        ${town?`<div class="town-building home-building" style="left:19%;top:27%"><i>⌂</i><b>${z.home}</b></div><div class="town-building garden-building" style="left:22%;top:64%"><i>♧</i><b>${z.park}</b></div><div class="town-building boss-building" data-boss style="left:78%;top:44%"><i>⚑</i><b>${z.gym}</b><small>${s.wins[z.id]?'★ 격파 완료 · 재도전':'보스 · '+z.boss}</small></div><div class="return-gate" data-return style="left:50%;top:10%">↑ 마을 귀환</div><div class="town-sign">${z.name} · 권장 Lv.${z.level}<small>걷는 중 확률적으로 대결 발생</small></div>`:
        zones.map(t=>`<div class="town-building world-town ${open(t)?'':'locked'}" data-zone="${t.id}" style="left:${t.x}%;top:${t.y}%;--accent:${t.color}"><i>⌂</i><b>${t.name}</b><small>${s.wins[t.id]?'★ 보스 격파':open(t)?'입장 가능 · 권장 Lv.'+t.level:zones[zones.indexOf(t)-1].boss+' 격파 후 입장'}</small></div>`).join('')}
        <div id="town-player" class="walker" aria-label="희범"><div class="walker-shadow"></div><div class="walker-figure"><i class="walker-leg left"></i><i class="walker-leg right"></i><i class="walker-arm left"></i><i class="walker-arm right"></i><div class="walker-body"></div><canvas class="walker-face" width="112" height="112" aria-hidden="true"></canvas><i class="walker-racket"></i></div><b>희범</b></div>
      </div><div class="town-bottom"><p id="town-message" aria-live="polite">${town?'상대는 걸을 때 만납니다 · 마을 귀환 표지에 닿으면 바깥으로 돌아갑니다.':'클릭한 위치까지 걸어갑니다 · 회색 마을은 앞 마을의 보스를 먼저 이겨야 합니다.'}</p><div class="town-controls" aria-label="희범 이동"><button data-dir="ArrowUp" aria-label="위로 이동">▲</button><button data-dir="ArrowLeft" aria-label="왼쪽으로 이동">◀</button><button data-dir="ArrowDown" aria-label="아래로 이동">▼</button><button data-dir="ArrowRight" aria-label="오른쪽으로 이동">▶</button></div></div></div>`;
    map=screen.querySelector('#town-map'); avatar=screen.querySelector('#town-player');
    map.onclick=e=>{if(!modal.hidden)return;const r=map.getBoundingClientRect(), gate=e.target.closest('[data-zone],[data-return],[data-boss]');
      target=gate?{x:parseFloat(gate.style.left),y:parseFloat(gate.style.top)}:clampPos({x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100},pos());
      keys.clear(); map.focus({preventScroll:true});};
    screen.querySelectorAll('[data-dir]').forEach(b=>{
      b.onpointerdown=e=>{if(!modal.hidden)return;e.preventDefault();target=null;keys.add(b.dataset.dir);b.setPointerCapture(e.pointerId);};
      b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{keys.delete(b.dataset.dir);save();};
      b.onclick=e=>{if(e.detail===0){const [x,y]=dirs[b.dataset.dir];target=clampPos({x:pos().x+x*6,y:pos().y+y*6},pos());}};
    });
    screen.querySelector('#town-stats').onclick=()=>show({title:'희범의 성장',body:`<p>배운 기술: ${unlocks().join(' · ')||'Lv.2에 첫 필살기 해금'}</p><p>Lv.2 라켓 필살기 · Lv.4 고요한 호흡 · Lv.7 치키타 스파이럴 · Lv.10 챔피언 심장 · Lv.13 제니스 오버드라이브</p>${Object.entries(statText).map(([k,[name,fx]])=>`<p><b>${name} +${s.stats[k]}</b> · 1당 ${fx}</p>`).join('')}`});
    paint(); drawPortrait(); map.focus({preventScroll:true});
  }
  function enter(z) {
    stop(); if(!open(z)) {s.worldPos={x:z.x,y:z.y+15};paint();save();show({title:'아직 닫힌 마을',body:`<p>${zones[zones.indexOf(z)-1].name}의 ${zones[zones.indexOf(z)-1].boss} 보스를 먼저 이겨 주세요.</p>`});return;}
    s.place='town';s.zone=z.id;s.townPos={x:50,y:82};grace=300;travelled=rolls=0;save();render();
  }
  function returnWorld() {const z=zone();s.place='world';s.worldPos={x:z.x,y:z.y+15};save();render();}
  function arrive() {
    const p=pos(),rect=map.getBoundingClientRect(),near=(x,y,r)=>Math.hypot((p.x-x)*rect.width/100,(p.y-y)*rect.height/100)<r;
    if(s.place==='world'){const z=zones.find(z=>near(z.x,z.y,34));if(z){enter(z);return true;}}
    else if(near(50,10,32)){returnWorld();return true;}
    else if(near(78,44,38)){battle({name:zone().boss,face:zone().face,boss:true});return true;}
    return false;
  }
  function encounter(distance) {
    if(s.place!=='town'||pos().y<22||distance<=0)return;
    if(grace>0){grace=Math.max(0,grace-distance);return;}
    travelled+=distance;
    if(travelled<70)return;
    travelled-=70;rolls++;
    if(Math.random()<.18||rolls>=12){const [name,face]=zone().rivals[Math.floor(Math.random()*zone().rivals.length)];battle({name,face,boss:false});}
  }
  function specialType(baseType) {const b=rpgOn();if(!b)return baseType;if(b.activeSpecial)return b.activeSpecial;const turn=s.specialTurn++;
    b.activeSpecial=s.level>=13&&turn%3===2?'zenith':s.level>=7&&turn%2?'chiquita':baseType;save();return b.activeSpecial;}
  function battle(rival) {
    if(rpgOn())return;stop();save();const z=zone();
    window.beamRpgV2={active:true,zone:z,boss:rival.boss,rival,stats:s.stats,level:s.level,specialType};
    setCharacter('heebeom');$('difficulty').value=rival.boss?(z.id==='camp'?'pro':z.bossDiff):z.diff;applySettings();setMode(rival.boss&&z.id==='camp'?'boss':'match');
    modal.hidden=true;screen.hidden=true;document.body.classList.add('rpg-battle');resize();begin();
    P.EQUIP.len*=(1+s.stats.control*.03)*(s.level>=4?1.15:1);
    toast(`${z.name} · ${rival.name}${rival.boss?' 보스':' 등장'}!`,3);
  }
  function backToTown() {
    stop();playing=paused=false;lockPage(false);release();clearSave();$('overlay').classList.add('hidden');$('pause').disabled=true;
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    document.body.classList.remove('rpg-battle');screen.hidden=false;grace=350;travelled=rolls=0;s.townPos={x:50,y:82};save();render();
  }
  function finish() {
    const b=rpgOn();if(!b||playing)return;
    const won=you>=11&&you-cpu>=2,score=`${you} : ${cpu}`;b.active=false;
    let gain=0,first=false;
    if(won){gain=b.zone.xp*(b.boss?2:1);s.xp+=gain;while(s.xp>=need()){s.xp-=need();s.level++;s.pendingUpgrades++;}first=b.boss&&!s.wins[b.zone.id];if(b.boss)s.wins[b.zone.id]=true;}
    backToTown();const next=zones[zones.indexOf(b.zone)+1];
    show({title:won?(b.boss?'보스 격파!':'승리!'):'다음 승부를 준비하세요',body:`<p>${b.rival.name} · ${score}</p><p>${won?'경험치 +'+gain:'경험치는 잃지 않았습니다.'}</p>${first?`<p>${next?next.name+'이 열렸습니다! 마을 귀환으로 나가 다음 마을에 도전하세요.':'🏆 탁구 마왕을 이기고 모든 마을을 정복했습니다!'}</p>`:''}${s.pendingUpgrades?`<p>Lv. ${s.level} · 강화 ${s.pendingUpgrades}개를 고를 수 있습니다.</p>`:''}`},s.pendingUpgrades?'<button id="town-upgrade">강화 고르기</button>':undefined);
    modal.querySelector('#town-upgrade')?.addEventListener('click',upgrade);
  }
  function upgrade() {
    const pool=Object.keys(statText),picks=[];while(picks.length<3)picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    show({title:'레벨 업! 강화 선택',body:`<p>3개 중 하나를 고르세요. 남은 선택 ${s.pendingUpgrades}개</p>`},picks.map(k=>`<button data-up="${k}">${statText[k][0]} · ${statText[k][1]}</button>`).join(''));
    modal.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{s.stats[b.dataset.up]++;s.pendingUpgrades--;save();render();if(s.pendingUpgrades)upgrade();else close();});
  }
  function flee() {if(!rpgOn())return;window.beamRpgV2.active=false;reset();backToTown();show({title:'마을로 돌아왔습니다',body:'<p>대결에서 물러났습니다. 경험치와 보스 격파 기록은 바뀌지 않습니다.</p>'});}
  $('home').textContent='마을로 도망';$('home').onclick=flee;$('exit-btn').onclick=flee;$('restart').hidden=true;
  $('start').onclick=()=>{if(paused)pause();};$('rpg-open').onclick=()=>{if(rpgOn())flee();else{screen.hidden=false;render();}};
  const character=$('character');if(!character.querySelector('[value="heebeom"]'))character.prepend(new Option('희범','heebeom'));setCharacter('heebeom');
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','town-dialog-title');
  modal.addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button')],first=buttons[0],end=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}});
  document.addEventListener('keydown',e=>{if(screen.hidden||!modal.hidden||!dirs[e.key])return;e.preventDefault();target=null;keys.add(e.key);});
  document.addEventListener('keyup',e=>{keys.delete(e.key);if(dirs[e.key])save();});
  window.addEventListener('blur',stop);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();save();}});
  function tick(t) {
    const dt=Math.min((t-last)/1000||0,.05);last=t;finish();const b=rpgOn();if(b&&charge<100)b.activeSpecial=null;
    if(!screen.hidden&&modal.hidden&&!document.hidden){
      const rect=map.getBoundingClientRect(),p=pos();let dx=0,dy=0;
      for(const k of keys){dx+=dirs[k][0];dy+=dirs[k][1];}
      let distance=150*dt;
      if(target&&!keys.size){dx=(target.x-p.x)*rect.width/100;dy=(target.y-p.y)*rect.height/100;distance=Math.min(distance,Math.hypot(dx,dy));}
      const d=Math.hypot(dx,dy),old={...p};
      if(d>0&&rect.width){p.x=P.clamp(p.x+dx/d*distance/rect.width*100,5,95);p.y=P.clamp(p.y+dy/d*distance/rect.height*100,8,92);if(dx)facing=dx<0?-1:1;}
      const moved=Math.hypot((p.x-old.x)*rect.width/100,(p.y-old.y)*rect.height/100);paint(moved>.01);
      if(target&&Math.abs(p.x-target.x)<.05&&Math.abs(p.y-target.y)<.05){target=null;save();}
      if(moved>.01&&!arrive())encounter(moved);
    }
    requestAnimationFrame(tick);
  }
  render();screen.hidden=false;if(s.pendingUpgrades)upgrade();save();requestAnimationFrame(tick);
})();
