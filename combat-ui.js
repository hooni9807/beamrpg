/* Original battle artwork; the controller owns combat rules and saving. */
(() => {
  const labels={physical:'물리',special:'특수',status:'변화'},TAU=Math.PI*2;
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;};
  const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const oval=(c,x,y,w,h,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,TAU);c.fill();};
  function hero(c,x,y,scale,pose,gear){
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
    oval(c,0,2,33,8,'#26382b38');c.translate(pose,0);
    // Square glasses, black sportswear, and the racket identify Heebeom at a glance.
    box(c,-20,-28,15,29,'#252b32');box(c,7,-28,14,29,'#252b32');if(gear.tape){box(c,-20,-18,15,5,'#eee0c4');box(c,7,-18,14,5,'#eee0c4');}
    box(c,-24,-3,21,8,gear.shoes?'#e3a46d':'#e9e5d9');box(c,5,-3,23,8,gear.shoes?'#e3a46d':'#e9e5d9');if(gear.spray){box(c,-24,3,21,2,'#b7f0d2');box(c,5,3,23,2,'#b7f0d2');}
    box(c,-28,-65,54,42,gear.uniform?'#aa5c59':'#141b21');box(c,-25,-61,8,29,gear.uniform?'#c1786b':'#34424d');box(c,17,-59,9,26,gear.uniform?'#8d484d':'#29333b');box(c,-14,-48,28,4,gear.uniform?'#efc995':'#87b9cf');
    box(c,-35,-60,10,28,'#d6a685');box(c,26,-60,10,22,'#e7b694');box(c,30,-42,24,10,'#e7b694');box(c,-36,-43,12,7,'#253037');if(gear.wristband){box(c,-35,-40,10,6,'#69b9c2');box(c,27,-43,9,5,'#69b9c2');}if(gear.fingerGuard)box(c,43,-42,9,7,'#f3e6c8');
    box(c,-22,-105,44,42,'#a16d52');box(c,-25,-103,47,34,'#e7b694');box(c,-20,-110,37,10,'#201d1b');box(c,-27,-105,10,19,'#25211f');box(c,16,-104,10,16,'#25211f');
    box(c,-17,-114,11,9,'#25211f');box(c,-4,-113,20,10,'#25211f');if(gear.hairband)box(c,-24,-103,47,5,'#e8ac69');box(c,-23,-95,19,11,'#25323a');box(c,1,-95,19,11,'#25323a');box(c,-18,-92,11,5,'#b6d8cf');box(c,5,-92,11,5,'#b6d8cf');box(c,-5,-92,7,3,'#25323a');box(c,-4,-75,12,3,'#945c49');
    c.save();c.translate(52,-43);c.rotate(.38+pose*.025);box(c,-3,0,7,28,'#bd8d58');oval(c,0,-10,15,20,gear.racket&&gear.racket!=='basic'?'#f2d37b':'#f1d5a2');oval(c,0,-12,12,17,'#b94e46');box(c,-7,-23,4,11,'#de7d66');c.restore();c.restore();
  }
  function rival(c,x,y,scale,pose,look){
    const styles={jersey:['#487ca7','#252d38'],sleepy:['#8e8172','#4e4143'],leesin:['#c86056','#4c343d'],plain:['#547f78','#323943'],percival:['#a187b7','#544262'],drunk:['#bb8e57','#574b43'],ajae:['#68865b','#4a443b'],boss:['#713e5a','#342c3b']},[shirt,hair]=styles[look]||styles.plain;
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);oval(c,0,3,34,8,'#26382b38');c.translate(-pose,0);
    box(c,-19,-27,14,29,'#343a43');box(c,6,-27,14,29,'#343a43');box(c,-22,-4,19,8,'#e1e4d6');box(c,5,-4,20,8,'#e1e4d6');
    box(c,-26,-66,52,42,shirt);box(c,-8,-61,16,5,'#e0d5b5');box(c,-35,-60,9,28,'#e5b48f');box(c,26,-60,9,28,'#e5b48f');
    box(c,-22,-105,44,39,'#e5b48f');box(c,-25,-109,50,17,hair);box(c,-20,-91,7,5,'#332e2d');box(c,13,-91,7,5,'#332e2d');box(c,-5,-77,11,3,'#a6655a');
    c.save();c.translate(-39,-42);c.rotate(-.35-pose*.025);box(c,-3,0,7,28,'#c59a6b');oval(c,0,-10,15,20,'#f1d8af');oval(c,0,-12,12,17,'#9e5762');c.restore();c.restore();
  }
  function monster(c,x,y,scale,kind,color,pose){
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);oval(c,0,3,41,9,'#26382b38');c.translate(-pose,0);
    if(kind==='hedgehog'){
      c.fillStyle='#33454b';c.beginPath();c.moveTo(-43,-15);for(let i=0;i<9;i++){const x=-42+i*10;c.lineTo(x,-24-(i%2?36:46));c.lineTo(x+7,-29);}c.lineTo(46,-15);c.fill();
      oval(c,0,-31,39,35,color);oval(c,5,-23,29,25,'#f3dfad');box(c,-32,-7,16,10,'#514b42');box(c,20,-7,16,10,'#514b42');
      c.strokeStyle='#f5dcae';c.lineWidth=5;c.beginPath();c.arc(0,-42,31,Math.PI*1.1,Math.PI*1.9);c.stroke();box(c,-28,-47,55,6,'#d65d4a');box(c,-7,-18,14,4,'#6c5345');
    }else if(kind==='slime'){
      c.fillStyle=color;c.beginPath();c.moveTo(-44,-4);c.bezierCurveTo(-50,-24,-27,-58,-8,-64);c.bezierCurveTo(13,-92,48,-52,45,-4);c.quadraticCurveTo(22,7,0,2);c.quadraticCurveTo(-25,6,-44,-4);c.fill();
      oval(c,-16,-49,11,17,'#ffffff70');oval(c,24,-12,8,5,'#ffffff55');
      c.strokeStyle='#f8f4d4c0';c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(0,-42,24,-2.5,2.2);c.arc(0,-42,11,2.2,5.5,true);c.stroke();oval(c,43,-69,6,9,color);oval(c,-43,-58,4,6,color);
    }else{
      oval(c,0,-42,42,42,'#33434a');oval(c,0,-44,37,37,color);oval(c,-15,-60,12,15,'#fff9dbc0');box(c,-34,-7,20,9,'#594d43');box(c,14,-7,20,9,'#594d43');
      c.strokeStyle='#fff7d8';c.lineWidth=5;c.beginPath();c.arc(0,-44,28,-.7,1.3);c.stroke();c.strokeStyle='#30464d';c.lineWidth=4;c.beginPath();c.arc(0,-44,31,1.45,3.65);c.stroke();
      c.fillStyle='#e8d4a6';c.beginPath();c.moveTo(-36,-69);c.lineTo(-48,-83);c.lineTo(-20,-74);c.moveTo(36,-69);c.lineTo(48,-83);c.lineTo(20,-74);c.fill();oval(c,28,-9,8,8,'#edbd8b');
    }
    box(c,-17,-42,7,11,'#243c39');box(c,10,-42,7,11,'#243c39');box(c,-16,-41,3,3,'#fff8de');box(c,11,-41,3,3,'#fff8de');box(c,-7,-24,14,3,'#4d5d46');box(c,-25,-29,8,4,'#e3a783');box(c,18,-29,8,4,'#e3a783');c.restore();
  }
  function drawSkill(c,id,ms,from,to,color,landed){
    if(ms<0||ms>900)return;
    c.save();c.lineCap='round';c.lineJoin='round';c.shadowColor=color;c.shadowBlur=16;
    const charge=Math.min(1,ms/180);
    c.globalAlpha=(1-charge)*.65;c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(from.x,from.y,9+charge*23,0,TAU);c.stroke();c.globalAlpha=1;
    if(id==='guard'||id==='potion'){
      const r=18+Math.sin(Math.min(ms/720,1)*Math.PI)*25;c.strokeStyle=id==='guard'?'#b9d7e8':'#b5efb1';c.lineWidth=5;c.beginPath();c.arc(from.x,from.y,r,-2.5,.8);c.stroke();
      c.fillStyle=id==='guard'?'#c6e9f566':'#d9ffcf66';oval(c,from.x,from.y,r*.65,r*.8,c.fillStyle);c.restore();return;
    }
    if(id==='run'){c.strokeStyle='#e9e5cc';c.lineWidth=4;for(let i=0;i<3;i++){c.beginPath();c.moveTo(from.x-i*12,from.y+i*8);c.lineTo(from.x-26-i*18,from.y+i*8);c.stroke();}c.restore();return;}
    if(id==='capture'){
      const p=Math.min(1,Math.max(0,(ms-170)/400)),x=from.x+(to.x-from.x)*p,y=from.y+(to.y-from.y)*p-32*Math.sin(p*Math.PI);
      if(ms>=170&&ms<690){oval(c,x,y,14,14,'#6aaea4');oval(c,x,y,10,10,'#e7be7e');c.strokeStyle='#f9ecd0';c.lineWidth=3;c.beginPath();c.arc(x,y,7,p*TAU,p*TAU+Math.PI*1.35);c.stroke();oval(c,x,y,3,3,'#4c8581');}
      if(ms>=570){const r=18+(ms-570)/250*56;c.globalAlpha=Math.max(0,1-(ms-570)/300);c.strokeStyle=landed?'#f6e09b':'#f9f1dd';c.lineWidth=5;c.beginPath();c.arc(to.x,to.y,r,0,TAU);c.stroke();}
      c.restore();return;
    }
    if(ms<170){c.restore();return;}
    const progress=Math.min(1,(ms-170)/380),x=from.x+(to.x-from.x)*progress,y=from.y+(to.y-from.y)*progress,angle=Math.atan2(to.y-from.y,to.x-from.x);
    if(ms<570){
      c.translate(x,y);c.rotate(angle);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=5;
      switch(id){
        case 'drive':c.beginPath();c.arc(-7,4,24,-1.5,1.4);c.stroke();oval(c,5,0,11,8,'#fff8dc');break;
        case 'quick':for(let i=0;i<3;i++)box(c,-34-i*9,-12+i*10,40,3,'#f5f6d9');oval(c,9,0,7,7,'#fff');break;
        case 'cut':for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,9+i*8,ms*.02+i,ms*.02+i+3);c.stroke();}break;
        case 'crescent':c.beginPath();c.arc(0,0,22,-1.5,1.5);c.arc(9,0,18,1.6,-1.6,true);c.fill();break;
        case 'lightning':c.beginPath();c.moveTo(-28,-13);c.lineTo(-5,-3);c.lineTo(-13,13);c.lineTo(24,-8);c.stroke();break;
        case 'thunder':for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-29,i*11-8);c.lineTo(-4,i*7+5);c.lineTo(-12,i*9+15);c.lineTo(27,i*8);c.stroke();}break;
        case 'phantom':oval(c,0,-4,18,18,'#c0b0f2bb');for(let i=-1;i<=1;i++)oval(c,-10+i*12,12,7,10,'#c0b0f2aa');oval(c,-6,-7,2,3,'#554a78');oval(c,6,-7,2,3,'#554a78');break;
        case 'counter':c.beginPath();c.moveTo(-24,-20);c.lineTo(23,19);c.moveTo(-24,19);c.lineTo(23,-20);c.stroke();break;
        case 'chiquita':for(let i=0;i<3;i++){c.beginPath();c.arc(-i*7,0,10+i*8,ms*.014+i*1.8,ms*.014+i*1.8+3);c.stroke();}oval(c,10,-17,11,5,'#ccefa8');break;
        case 'meteor':c.fillStyle='#f6c16f';c.beginPath();c.moveTo(-43,-15);c.lineTo(-13,-8);c.lineTo(-26,7);c.lineTo(18,11);c.lineTo(29,-1);c.lineTo(15,-15);c.fill();oval(c,11,-3,13,13,'#835e4d');break;
        case 'zenith':c.fillStyle='#ffffffbb';c.beginPath();c.moveTo(-55,-14);c.lineTo(19,-7);c.lineTo(30,0);c.lineTo(19,7);c.lineTo(-55,14);c.fill();for(let i=0;i<4;i++){c.rotate(Math.PI/4);box(c,-2,-24,4,48,color);}break;
        case 'struggle':for(let i=0;i<4;i++){c.rotate(Math.PI/4);box(c,-3,-18,6,36,'#fff1d1');}break;
      }
    }else if(landed&&ms<820){
      const burst=(820-ms)/250;c.translate(to.x,to.y);c.strokeStyle=color;c.lineWidth=5*burst;
      for(let i=0;i<8;i++){const a=i*TAU/8,r=12+(1-burst)*32;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+19*burst),Math.sin(a)*(r+19*burst));c.stroke();}
      oval(c,0,0,20*burst,20*burst,'#fff5d8a0');
    }
    c.restore();
  }
  function open({state:initial,zone,gear={},onAction,onFinish}){
    const combat=window.BeamCombat,previousFocus=document.activeElement,root=el('section','beam-combat'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let state=initial,menu='fight',busy=false,destroyed=false,timer=0,frame=0,visual=null,pendingAction=null,hits={hero:0,enemy:0},lastHp={hero:initial.hero.hp,enemy:initial.enemy.hp};
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
    for(const [id,label] of [['fight','기술'],['bag','아이템'],['info','상태'],['run','도망']]){const b=button(label,'battle-tab',()=>{if(busy||state.outcome)return;if(id==='run'){act({type:'run'});return;}menu=id;renderCommands();});b.dataset.menu=id;tabButtons[id]=b;tabs.append(b);}
    function act(action){if(busy||destroyed||state.outcome||state.side!=='hero')return;pendingAction=action;onAction(action);}
    function typeInfo(type){return combat.TYPES[type]||{name:'무속성',color:'#a6baa0'};}
    function fighterName(fighter){return fighter.star>1&&!/\(\d성\)$/.test(fighter.name)?`${fighter.name} (${fighter.star}성)`:fighter.name;}
    function updateCard(card,fighter){const type=typeInfo(fighter.type),fraction=Math.max(0,Math.min(1,fighter.hp/fighter.maxHp));card.name.textContent=fighterName(fighter);card.level.textContent=`Lv.${fighter.level}`;card.type.textContent=type.name;card.type.style.setProperty('--type-color',type.color);card.fill.style.width=`${fraction*100}%`;card.fill.style.background=fraction>.5?'#86caa6':fraction>.2?'#e1bd6c':'#db7d71';card.numbers.textContent=`HP ${fighter.hp} / ${fighter.maxHp}`;card.track.setAttribute('aria-label',`${fighterName(fighter)} HP`);card.track.setAttribute('aria-valuenow',fighter.hp);card.track.setAttribute('aria-valuemin','0');card.track.setAttribute('aria-valuemax',fighter.maxHp);card.card.classList.toggle('is-fainted',fighter.hp===0);}
    function renderCommands(){
      const focused=document.activeElement?.dataset.move;panel.replaceChildren();root.classList.toggle('showing-bag',menu==='bag'&&!state.outcome);
      Object.entries(tabButtons).forEach(([id,b])=>{b.disabled=busy||state.side!=='hero'||!!state.outcome;b.classList.toggle('selected',id===menu);b.setAttribute('aria-pressed',String(id===menu));});
      if(state.outcome){const label=state.outcome==='win'?`상대가 쓰러졌다! ${fighterName(state.hero)}의 승리`:state.outcome==='lose'?`${fighterName(state.hero)}이 쓰러졌다… 치유 센터로`:state.outcome==='captured'?`${state.enemy.name} 포획 성공!`:'무사히 도망쳤다!',result=el('div','battle-result');result.append(el('p','battle-eyebrow','BATTLE COMPLETE'),el('h3',null,label),el('p',null,state.outcome==='lose'?'치유 센터에서 HP와 기술 PP를 회복할 수 있어요.':state.outcome==='captured'?'포획한 동료는 주머니에서 확인할 수 있어요.':'남은 HP와 기술 PP는 다음 전투에 이어집니다.'));const done=button(state.outcome==='lose'?'치유 센터로 이동':'마을로 돌아가기','battle-finish',()=>{if(!busy&&!destroyed)onFinish();});done.disabled=busy;result.append(done);panel.append(result);return;}
      if(state.side==='enemy'){panel.append(el('p','battle-note','상대의 턴입니다…'));return;}
      if(menu==='fight'){
        const grid=el('div','battle-moves'),usable=state.hero.moves.some(id=>(state.hero.pp[id]||0)>0),moves=usable?state.hero.moves:['struggle'];
        for(const id of moves){const move=combat.MOVES[id];if(!move)continue;const type=typeInfo(move.type),mult=move.category==='status'?null:combat.effectiveness(move.type,state.enemy.type),effect=mult===2?'효과 굉장함 ×2':mult===.5?'반감 ×½':mult===0?'무효 ×0':'일반 ×1',b=button('','battle-move',()=>act({type:'move',move:id})),top=el('span','battle-move-heading'),name=el('strong',null,move.name),pp=el('small',null,id==='struggle'?'PP —':`PP ${state.hero.pp[id]||0}/${move.pp}`);top.append(name,pp);b.dataset.move=id;b.dataset.effect=mult===2?'super':mult===.5?'resist':'other';b.style.setProperty('--type-color',type.color);b.disabled=busy||(id!=='struggle'&&!(state.hero.pp[id]>0));const info=el('span','battle-move-detail',`${type.name} · ${labels[move.category]||'변화'} · 위력 ${move.power||'—'} · 명중 ${move.accuracy||100}%${mult==null?'':` · ${effect}`}`);b.append(top,info,el('span','battle-move-description',move.description||''));grid.append(b);}panel.append(grid);
        if(!usable)panel.append(el('p','battle-note','모든 기술의 PP가 소진됐어요. 최후의 발악은 반동 피해를 받습니다.'));
      }else if(menu==='bag'){
        const bag=el('div','battle-bag'),item=el('div','battle-item'),icon=el('span','battle-potion','✚'),copy=el('div');icon.setAttribute('aria-hidden','true');copy.append(el('h3',null,`회복약 × ${state.potions}`),el('p',null,'HP 40 회복 · 사용하면 상대도 한 번 행동합니다.'));const use=button('회복약 사용','battle-finish',()=>act({type:'potion'}));use.disabled=busy||state.potions<1||state.hero.hp>=state.hero.maxHp;item.append(icon,copy,use);bag.append(item);
        const discs=state.captureDiscs??0,chance=combat.captureChance?.(state),disc=el('div','battle-item'),discIcon=el('span','battle-disc'),discCopy=el('div');discIcon.setAttribute('aria-hidden','true');
        const discInfo=state.captureBlocked?'주머니가 가득 찼습니다 · 동료를 놓아 공간을 만드세요':`야생 상대 포획 · HP가 낮을수록 유리${Number.isFinite(chance)?` · 현재 성공률 ${Math.round(chance*100)}%`:''}`;
        discCopy.append(el('h3',null,`스핀 디스크 × ${discs}`),el('p',null,discInfo));const throwDisc=button('스핀 디스크 사용','battle-finish',()=>act({type:'capture'}));throwDisc.disabled=busy||discs<1||chance===0;disc.append(discIcon,discCopy,throwDisc);bag.append(disc);panel.append(bag,el('p','battle-note','포획에 실패하면 상대가 한 번 행동합니다. 집과 치유 센터에서는 HP와 모든 기술 PP를 회복할 수 있어요.'));
      }else{
        const stats=el('div','battle-stats');for(const [key,label] of [['attack','공격'],['defense','방어'],['spAttack','특수공격'],['spDefense','특수방어'],['speed','스피드']]){const d=el('div');d.append(el('small',null,label),el('b',null,state.hero[key]));stats.append(d);}const heroType=typeInfo(state.hero.type),enemyType=typeInfo(state.enemy.type);panel.append(stats,el('p','battle-type-guide',`${fighterName(state.hero)}: ${heroType.name} · 상대: ${enemyType.name}`),el('p','battle-note','노란 테두리는 2배, 빨간 테두리는 반감 피해입니다. 서로 차례로 행동하며 같은 타입 기술은 위력 1.5배입니다.'));
      }
      if(focused){const b=[...panel.querySelectorAll('[data-move]')].find(b=>b.dataset.move===focused&&!b.disabled);b?.focus({preventScroll:true});}
    }
    function render(){turn.textContent=visual&&busy?`${visual.actor==='hero'?fighterName(state.hero):state.enemy.name} · ${combat.MOVES[visual.move]?.name||({capture:'스핀 디스크',potion:'회복약',run:'도망'}[visual.move])||'행동 중'}`:`TURN ${state.turn} · ${state.side==='enemy'?'상대':fighterName(state.hero)} 차례`;updateCard(heroCard,visual&&busy?{...state.hero,hp:visual.previous.hero}:state.hero);updateCard(enemyCard,visual&&busy?{...state.enemy,hp:visual.previous.enemy}:state.enemy);(state.log||[]).forEach(line=>log.append(el('p',null,line)));while(log.children.length>40)log.firstChild.remove();log.scrollTop=log.scrollHeight;renderCommands();}
    function draw(now){
      if(destroyed)return;const bounds=arena.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),w=bounds.width,h=bounds.height;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);c.imageSmoothingEnabled=false;
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#91b5a8');sky.addColorStop(.49,'#d7d8ae');sky.addColorStop(.5,'#9aac7a');sky.addColorStop(1,'#6f8c66');c.fillStyle=sky;c.fillRect(0,0,w,h);
      oval(c,w*.67,h*.11,w*.13,h*.12,'#f1deb163');
      for(let i=0;i<15;i++){const x=i*w/13-w*.05,y=h*.37+(i%3)*h*.025;c.fillStyle=i%2?'#6e9374':'#7b9d7a';c.beginPath();c.moveTo(x-w*.06,h*.53);c.lineTo(x-w*.02,y);c.lineTo(x+w*.02,y-h*.15);c.lineTo(x+w*.065,h*.53);c.fill();}
      box(c,0,h*.54,w,h*.026,'#c8cd9955');for(let i=0;i<32;i++){const x=(i*83.7%997)/997*w,y=h*(.59+(i*17%37)/100);box(c,x,y,2+i%3,2,'#e3d69d55');}
      const mobile=w<600,s=mobile?1.05:Math.min(1.9,w/510),ex=w*(mobile?.78:.76),ey=h*(mobile?.46:.52),hx=w*(mobile?.20:.24),hy=h*.87;
      oval(c,ex,ey+5,62*s,15*s,'#c9c996');oval(c,ex,ey+3,55*s,11*s,'#a9b884');oval(c,hx,hy+5,73*s,17*s,'#c5bd88');oval(c,hx,hy+2,65*s,13*s,'#b5b783');
      const ms=visual&&!reduced?now-visual.started:Infinity,impact=ms>=570&&ms<820?Math.sin((ms-570)/250*Math.PI):0,idle=reduced?0:Math.sin(now/350)*2,enemyType=typeInfo(state.enemy.type),windup=ms<170?Math.sin(ms/170*Math.PI)*-7:0,lunge=ms>=170&&ms<570?Math.sin((ms-170)/400*Math.PI)*17:0;
      if(visual&&!visual.shown&&ms>=570){visual.shown=true;updateCard(heroCard,state.hero);updateCard(enemyCard,state.enemy);}
      c.save();if(hits.enemy&&impact>.2)c.globalAlpha=.55+Math.abs(Math.sin(ms*.08))*.45;if(state.enemy.kind==='rival')rival(c,ex+(hits.enemy&&impact?Math.sin(ms*.09)*impact*4:0),ey+idle,s,visual?.actor==='enemy'?windup+lunge:0,state.enemy.face||state.enemy.look);else monster(c,ex+(hits.enemy&&impact?Math.sin(ms*.09)*impact*4:0),ey+idle,s,state.enemy.kind||state.enemy.sprite||'ball',enemyType.color,visual?.actor==='enemy'?windup+lunge:0);c.restore();
      const heroScale=mobile?s:Math.min(s*.86,h/250);
      c.save();if(hits.hero&&impact>.2)c.globalAlpha=.55+Math.abs(Math.sin(ms*.08))*.45;const x=hx+(hits.hero&&impact?Math.sin(ms*.09)*impact*4:0),y=hy-idle*.4,pose=visual?.actor==='hero'?windup+lunge:0;if(state.hero.kind==='rival')rival(c,x,y,heroScale,-pose,state.hero.face||state.hero.look);else if(state.hero.kind&&state.hero.kind!=='hero')monster(c,x,y,heroScale*1.35,state.hero.kind,typeInfo(state.hero.type).color,-pose);else hero(c,x,y,heroScale,pose,gear);c.restore();
      if(visual&&!reduced){const from=visual.actor==='hero'?{x:hx+heroScale*45,y:hy-heroScale*(state.hero.kind==='hero'?76:52)}:{x:ex-s*30,y:ey-s*45},to=visual.actor==='hero'?{x:ex,y:ey-s*40}:{x:hx,y:hy-heroScale*70},color=visual.move==='capture'?'#f1d7a1':typeInfo(combat.MOVES[visual.move]?.type).color;drawSkill(c,visual.move,ms,from,to,color,visual.landed);}
      for(const who of ['hero','enemy'])if(hits[who]&&impact){c.fillStyle='#fff7df';c.strokeStyle='#503b31';c.lineWidth=4;c.font=`800 ${mobile?20:27}px sans-serif`;c.textAlign='center';const x=who==='hero'?hx:ex,y=(who==='hero'?hy:ey)-s*100-impact*16;c.strokeText(`−${hits[who]}`,x,y);c.fillText(`−${hits[who]}`,x,y);}
      frame=requestAnimationFrame(draw);
    }
    function keydown(event){
      event.stopPropagation();
      if(event.key==='Escape'){event.preventDefault();if(!busy&&!state.outcome){menu='fight';renderCommands();tabButtons.fight.focus();}}
      if(event.key==='Tab'){const focusable=[...root.querySelectorAll('button:not(:disabled)')];if(!focusable.length){event.preventDefault();root.focus();return;}const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===root)){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){event.preventDefault();first.focus();}}
    }
    root.addEventListener('keydown',keydown);root.addEventListener('keyup',event=>event.stopPropagation());render();frame=requestAnimationFrame(draw);panel.querySelector('button:not(:disabled)')?.focus();
    return {
      update(next){
        if(destroyed)return;const action=pendingAction||{type:'enemy'},actor=action.type==='enemy'?'enemy':'hero',move=action.type==='move'?action.move:action.type==='enemy'?Object.keys(combat.MOVES).find(id=>next.log[0]===`${next.enemy.name}의 ${combat.MOVES[id].name}!`):action.type;
        hits={hero:Math.max(0,lastHp.hero-next.hero.hp),enemy:Math.max(0,lastHp.enemy-next.enemy.hp)};
        visual={actor,move,started:performance.now(),previous:lastHp,landed:next.outcome==='captured'||next.log.some(line=>line.includes('에게 ')&&line.includes(' 데미지'))};pendingAction=null;lastHp={hero:next.hero.hp,enemy:next.enemy.hp};state=next;busy=!reduced;clearTimeout(timer);render();
        timer=setTimeout(()=>{if(destroyed)return;busy=false;updateCard(heroCard,state.hero);updateCard(enemyCard,state.enemy);visual=null;if(state.side==='enemy'&&!state.outcome){pendingAction={type:'enemy'};busy=true;onAction(pendingAction);return;}turn.textContent=`TURN ${state.turn} · ${state.side==='enemy'?'상대':fighterName(state.hero)} 차례`;renderCommands();const focused=document.activeElement;if(focused===document.body||!root.contains(focused)||focused.disabled)(panel.querySelector('button:not(:disabled)')||tabButtons.fight).focus({preventScroll:true});},reduced?0:900);
      },
      destroy(){if(destroyed)return;destroyed=true;clearTimeout(timer);cancelAnimationFrame(frame);root.remove();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
    };
  }
  window.BeamBattleUI={open};
})();
