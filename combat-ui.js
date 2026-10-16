/* Original battle artwork; the controller owns combat rules and saving. */
(() => {
  const labels={physical:'물리',special:'특수',status:'변화'},TAU=Math.PI*2;
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;};
  const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const oval=(c,x,y,w,h,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,TAU);c.fill();};
  function hero(c,x,y,scale,pose){
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
    oval(c,0,2,33,8,'#26382b38');c.translate(pose,0);
    // Square glasses, black sportswear, and the racket identify Heebeom at a glance.
    box(c,-20,-28,15,29,'#252b32');box(c,7,-28,14,29,'#252b32');box(c,-24,-3,21,8,'#e9e5d9');box(c,5,-3,23,8,'#e9e5d9');
    box(c,-28,-65,54,42,'#141b21');box(c,-25,-61,8,29,'#34424d');box(c,17,-59,9,26,'#29333b');box(c,-14,-48,28,4,'#87b9cf');
    box(c,-35,-60,10,28,'#d6a685');box(c,26,-60,10,22,'#e7b694');box(c,30,-42,24,10,'#e7b694');box(c,-36,-43,12,7,'#253037');
    box(c,-22,-105,44,42,'#a16d52');box(c,-25,-103,47,34,'#e7b694');box(c,-20,-110,37,10,'#201d1b');box(c,-27,-105,10,19,'#25211f');box(c,16,-104,10,16,'#25211f');
    box(c,-17,-114,11,9,'#25211f');box(c,-4,-113,20,10,'#25211f');box(c,-23,-95,19,11,'#25323a');box(c,1,-95,19,11,'#25323a');box(c,-18,-92,11,5,'#b6d8cf');box(c,5,-92,11,5,'#b6d8cf');box(c,-5,-92,7,3,'#25323a');box(c,-4,-75,12,3,'#945c49');
    c.save();c.translate(52,-43);c.rotate(.38+pose*.025);box(c,-3,0,7,28,'#bd8d58');oval(c,0,-10,15,20,'#f1d5a2');oval(c,0,-12,12,17,'#b94e46');box(c,-7,-23,4,11,'#de7d66');c.restore();c.restore();
  }
  function monster(c,x,y,scale,kind,color,pose){
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);oval(c,0,3,41,9,'#26382b38');c.translate(-pose,0);
    if(kind==='hedgehog'){
      c.fillStyle='#4b5a4a';c.beginPath();c.moveTo(-43,-17);for(let i=0;i<8;i++){const a=Math.PI+(i/7)*Math.PI;c.lineTo(Math.cos(a)*56,-28+Math.sin(a)*51);c.lineTo(Math.cos(a+.15)*36,-28+Math.sin(a+.15)*32);}c.lineTo(43,-17);c.fill();
      oval(c,0,-31,39,35,color);oval(c,4,-25,29,27,'#eed9ad');box(c,-32,-7,16,10,'#6b6249');box(c,20,-7,16,10,'#6b6249');box(c,-7,-19,14,6,'#574b37');
    }else if(kind==='slime'){
      c.fillStyle=color;c.beginPath();c.moveTo(-43,-4);c.bezierCurveTo(-51,-18,-27,-76,0,-76);c.bezierCurveTo(27,-76,51,-18,43,-4);c.quadraticCurveTo(23,6,0,1);c.quadraticCurveTo(-23,6,-43,-4);c.fill();oval(c,-16,-47,10,16,'#ffffff45');
      c.strokeStyle='#e5f4d880';c.lineWidth=4;c.beginPath();c.ellipse(0,-39,47,12,-.25,0,TAU);c.stroke();
    }else{
      oval(c,0,-40,39,40,'#a58153');oval(c,0,-43,37,38,color);oval(c,-13,-57,12,15,'#fff9db91');box(c,-36,-7,21,9,'#b6794d');box(c,15,-7,21,9,'#b6794d');
      c.strokeStyle='#fff7d86b';c.lineWidth=3;c.beginPath();c.arc(0,-43,29,-.7,1.4);c.stroke();
    }
    box(c,-17,-39,7,10,'#243c39');box(c,10,-39,7,10,'#243c39');box(c,-16,-39,3,3,'#fff8de');box(c,11,-39,3,3,'#fff8de');box(c,-7,-23,14,3,'#4d5d46');box(c,-25,-26,8,4,'#e3a783');box(c,18,-26,8,4,'#e3a783');c.restore();
  }
  function open({state:initial,zone,onAction,onFinish}){
    const combat=window.BeamCombat,previousFocus=document.activeElement,root=el('section','beam-combat'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let state=initial,menu='fight',busy=false,destroyed=false,timer=0,frame=0,animation=0,hits={hero:0,enemy:0},lastHp={hero:initial.hero.hp,enemy:initial.enemy.hp};
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','beam-battle-title');root.tabIndex=-1;
    const shell=el('div','battle-shell'),head=el('header','battle-heading'),heading=el('div'),eyebrow=el('p','battle-eyebrow','BEAMRPG · WILD ENCOUNTER'),title=el('h2',null,'길 위에서 만난 작은 승부');title.id='beam-battle-title';
    heading.append(eyebrow,title);const location=el('div','battle-location'),zoneName=el('span',null,zone?.name||'마을'),turn=el('b');location.append(zoneName,turn);head.append(heading,location);
    const arena=el('div','battle-arena'),canvas=el('canvas','battle-canvas');canvas.setAttribute('aria-hidden','true');arena.append(canvas);
    const makeCard=(who)=>{const card=el('div',`battle-vitals battle-vitals-${who}`),line=el('div','battle-name'),name=el('strong'),level=el('span'),type=el('span','battle-type'),track=el('div','battle-hp'),fill=el('i'),numbers=el('div','battle-hp-caption');line.append(name,level);track.setAttribute('role','progressbar');track.append(fill);card.append(line,type,track,numbers);arena.append(card);return{card,name,level,type,track,fill,numbers};};
    const enemyCard=makeCard('enemy'),heroCard=makeCard('hero');
    const bottom=el('div','battle-bottom'),journal=el('section','battle-journal'),logLabel=el('h3',null,'대결 기록'),log=el('div','battle-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-relevant','additions');log.setAttribute('aria-label','대결 기록');journal.append(logLabel,log);
    const commands=el('div','battle-commands'),tabs=el('nav','battle-tabs'),panel=el('div','battle-panel');tabs.setAttribute('aria-label','전투 행동');commands.append(tabs,panel);bottom.append(journal,commands);shell.append(head,arena,bottom);root.append(shell);document.body.append(root);
    const tabButtons={};
    const button=(text,className,action)=>{const b=el('button',className,text);b.type='button';b.addEventListener('click',action);return b;};
    for(const [id,label] of [['fight','기술'],['bag','가방'],['info','상태'],['run','도망']]){const b=button(label,'battle-tab',()=>{if(busy||state.outcome)return;if(id==='run'){act({type:'run'});return;}menu=id;renderCommands();});b.dataset.menu=id;tabButtons[id]=b;tabs.append(b);}
    function act(action){if(busy||destroyed||state.outcome)return;onAction(action);}
    function typeInfo(type){return combat.TYPES[type]||{name:'무속성',color:'#a6baa0'};}
    function updateCard(card,fighter){const type=typeInfo(fighter.type),fraction=Math.max(0,Math.min(1,fighter.hp/fighter.maxHp));card.name.textContent=fighter.name;card.level.textContent=`Lv.${fighter.level}`;card.type.textContent=type.name;card.type.style.setProperty('--type-color',type.color);card.fill.style.width=`${fraction*100}%`;card.fill.style.background=fraction>.5?'#86caa6':fraction>.2?'#e1bd6c':'#db7d71';card.numbers.textContent=`HP ${fighter.hp} / ${fighter.maxHp}`;card.track.setAttribute('aria-label',`${fighter.name} HP`);card.track.setAttribute('aria-valuenow',fighter.hp);card.track.setAttribute('aria-valuemin','0');card.track.setAttribute('aria-valuemax',fighter.maxHp);card.card.classList.toggle('is-fainted',fighter.hp===0);}
    function renderCommands(){
      const focused=document.activeElement?.dataset.move;panel.replaceChildren();
      Object.entries(tabButtons).forEach(([id,b])=>{b.disabled=busy||!!state.outcome;b.classList.toggle('selected',id===menu);b.setAttribute('aria-pressed',String(id===menu));});
      if(state.outcome){const label=state.outcome==='win'?'상대가 쓰러졌다! 희범의 승리':state.outcome==='lose'?'희범이 쓰러졌다… 치유 센터로':'무사히 도망쳤다!',result=el('div','battle-result');result.append(el('p','battle-eyebrow','BATTLE COMPLETE'),el('h3',null,label),el('p',null,state.outcome==='lose'?'치유 센터에서 HP와 기술 PP를 회복할 수 있어요.':'남은 HP와 기술 PP는 다음 전투에 이어집니다.'));const done=button(state.outcome==='lose'?'치유 센터로 이동':'마을로 돌아가기','battle-finish',()=>{if(!busy&&!destroyed)onFinish();});done.disabled=busy;result.append(done);panel.append(result);return;}
      if(menu==='fight'){
        const grid=el('div','battle-moves'),usable=state.hero.moves.some(id=>(state.hero.pp[id]||0)>0),moves=usable?state.hero.moves:['struggle'];
        for(const id of moves){const move=combat.MOVES[id];if(!move)continue;const type=typeInfo(move.type),mult=move.category==='status'?null:combat.effectiveness(move.type,state.enemy.type),effect=mult===2?'효과 굉장함 ×2':mult===.5?'반감 ×½':mult===0?'무효 ×0':'일반 ×1',b=button('','battle-move',()=>act({type:'move',move:id})),top=el('span','battle-move-heading'),name=el('strong',null,move.name),pp=el('small',null,id==='struggle'?'PP —':`PP ${state.hero.pp[id]||0}/${move.pp}`);top.append(name,pp);b.dataset.move=id;b.style.setProperty('--type-color',type.color);b.disabled=busy||(id!=='struggle'&&!(state.hero.pp[id]>0));const info=el('span','battle-move-detail',`${type.name} · ${labels[move.category]||'변화'} · 위력 ${move.power||'—'} · 명중 ${move.accuracy||100}%${mult==null?'':` · ${effect}`}`);b.append(top,info,el('span','battle-move-description',move.description||''));grid.append(b);}panel.append(grid);
        if(!usable)panel.append(el('p','battle-note','모든 기술의 PP가 소진됐어요. 최후의 발악은 반동 피해를 받습니다.'));
      }else if(menu==='bag'){
        const item=el('div','battle-item'),icon=el('span','battle-potion','✚'),copy=el('div');icon.setAttribute('aria-hidden','true');copy.append(el('h3',null,`회복약 × ${state.potions}`),el('p',null,'HP 40 회복 · 사용하면 상대도 한 번 행동합니다.'));const use=button('회복약 사용','battle-finish',()=>act({type:'potion'}));use.disabled=busy||state.potions<1||state.hero.hp>=state.hero.maxHp;item.append(icon,copy,use);panel.append(item,el('p','battle-note','집과 치유 센터에서는 HP와 모든 기술 PP를 회복할 수 있어요.'));
      }else{
        const stats=el('div','battle-stats');for(const [key,label] of [['attack','공격'],['defense','방어'],['spAttack','특수공격'],['spDefense','특수방어'],['speed','스피드']]){const d=el('div');d.append(el('small',null,label),el('b',null,state.hero[key]));stats.append(d);}const heroType=typeInfo(state.hero.type),enemyType=typeInfo(state.enemy.type);panel.append(stats,el('p','battle-type-guide',`희범: ${heroType.name} · 상대: ${enemyType.name}`),el('p','battle-note','DP 타입 상성을 적용합니다. 기술 버튼에 상대에게 주는 2배·½배·무효 효과가 표시됩니다. 같은 타입 기술은 위력 1.5배이며, 우선도가 같으면 스피드가 높은 쪽이 먼저 행동해요.'));
      }
      if(focused){const b=[...panel.querySelectorAll('[data-move]')].find(b=>b.dataset.move===focused&&!b.disabled);b?.focus({preventScroll:true});}
    }
    function render(){turn.textContent=`TURN ${state.turn}`;updateCard(heroCard,state.hero);updateCard(enemyCard,state.enemy);(state.log||[]).forEach(line=>log.append(el('p',null,line)));while(log.children.length>40)log.firstChild.remove();log.scrollTop=log.scrollHeight;renderCommands();}
    function draw(now){
      if(destroyed)return;const bounds=arena.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),w=bounds.width,h=bounds.height;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);c.imageSmoothingEnabled=false;
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#91b5a8');sky.addColorStop(.49,'#d7d8ae');sky.addColorStop(.5,'#9aac7a');sky.addColorStop(1,'#6f8c66');c.fillStyle=sky;c.fillRect(0,0,w,h);
      oval(c,w*.67,h*.11,w*.13,h*.12,'#f1deb163');
      for(let i=0;i<15;i++){const x=i*w/13-w*.05,y=h*.37+(i%3)*h*.025;c.fillStyle=i%2?'#6e9374':'#7b9d7a';c.beginPath();c.moveTo(x-w*.06,h*.53);c.lineTo(x-w*.02,y);c.lineTo(x+w*.02,y-h*.15);c.lineTo(x+w*.065,h*.53);c.fill();}
      box(c,0,h*.54,w,h*.026,'#c8cd9955');for(let i=0;i<32;i++){const x=(i*83.7%997)/997*w,y=h*(.59+(i*17%37)/100);box(c,x,y,2+i%3,2,'#e3d69d55');}
      const mobile=w<600,s=mobile?1.05:Math.min(1.9,w/510),ex=w*(mobile?.78:.76),ey=h*(mobile?.46:.52),hx=w*(mobile?.20:.24),hy=h*.87;
      oval(c,ex,ey+5,62*s,15*s,'#c9c996');oval(c,ex,ey+3,55*s,11*s,'#a9b884');oval(c,hx,hy+5,73*s,17*s,'#c5bd88');oval(c,hx,hy+2,65*s,13*s,'#b5b783');
      const phase=reduced?0:(now-animation)/550,pulse=phase>=0&&phase<1?Math.sin(phase*Math.PI):0,idle=reduced?0:Math.sin(now/350)*2,enemyType=typeInfo(state.enemy.type);
      c.save();if(hits.enemy&&pulse>.2)c.globalAlpha=.55+Math.abs(Math.sin(phase*20))*.45;monster(c,ex,ey+idle,s,state.enemy.kind||state.enemy.sprite||'ball',enemyType.color,hits.hero?pulse*10:0);c.restore();
      const heroScale=mobile?s:Math.min(s*.86,h/250);
      c.save();if(hits.hero&&pulse>.2)c.globalAlpha=.55+Math.abs(Math.sin(phase*20))*.45;hero(c,hx,hy-idle*.4,heroScale,hits.enemy?pulse*11:0);c.restore();
      for(const who of ['hero','enemy'])if(hits[who]&&pulse){c.fillStyle='#fff7df';c.strokeStyle='#503b31';c.lineWidth=4;c.font=`800 ${mobile?20:27}px sans-serif`;c.textAlign='center';const x=who==='hero'?hx:ex,y=(who==='hero'?hy:ey)-s*100-pulse*16;c.strokeText(`−${hits[who]}`,x,y);c.fillText(`−${hits[who]}`,x,y);}
      frame=requestAnimationFrame(draw);
    }
    function keydown(event){
      event.stopPropagation();
      if(event.key==='Escape'){event.preventDefault();if(!busy&&!state.outcome){menu='fight';renderCommands();tabButtons.fight.focus();}}
      if(event.key==='Tab'){const focusable=[...root.querySelectorAll('button:not(:disabled)')];if(!focusable.length){event.preventDefault();root.focus();return;}const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===root)){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){event.preventDefault();first.focus();}}
    }
    root.addEventListener('keydown',keydown);root.addEventListener('keyup',event=>event.stopPropagation());render();frame=requestAnimationFrame(draw);panel.querySelector('button:not(:disabled)')?.focus();
    return {
      update(next){if(destroyed)return;hits={hero:Math.max(0,lastHp.hero-next.hero.hp),enemy:Math.max(0,lastHp.enemy-next.enemy.hp)};lastHp={hero:next.hero.hp,enemy:next.enemy.hp};state=next;animation=performance.now();busy=!reduced;clearTimeout(timer);render();timer=setTimeout(()=>{if(destroyed)return;busy=false;renderCommands();const focused=document.activeElement;if(focused===document.body||!root.contains(focused)||focused.disabled)(panel.querySelector('button:not(:disabled)')||tabButtons.fight).focus({preventScroll:true});},reduced?0:550);},
      destroy(){if(destroyed)return;destroyed=true;clearTimeout(timer);cancelAnimationFrame(frame);root.remove();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
    };
  }
  window.BeamBattleUI={open};
})();
