/* Ordinary encounters are turn based; the rally engine still handles gym matches. */
(function(root){
  'use strict';
  const TYPES={power:{name:'파워',color:'#e78c72'},spin:{name:'회전',color:'#b89ee5'},speed:{name:'스피드',color:'#7bcacb'}};
  const MOVES={
    drive:{name:'포핸드 드라이브',type:'power',category:'physical',power:50,accuracy:100,pp:25,description:'안정적인 기본 공격.'},
    quick:{name:'쾌속 쇼트',type:'speed',category:'physical',power:35,accuracy:100,pp:20,priority:1,description:'상대보다 먼저 공격한다.'},
    cut:{name:'회전 커트',type:'spin',category:'special',power:40,accuracy:100,pp:20,slow:.3,description:'30% 확률로 상대 스피드 1단계 감소.'},
    guard:{name:'철벽 준비',type:'power',category:'status',power:0,accuracy:100,pp:15,description:'자신의 방어와 특수방어를 1단계 높인다.'},
    crescent:{name:'초승달 드라이브',type:'spin',category:'special',power:75,accuracy:95,pp:10,description:'크게 휘어지는 강력한 회전 공격.'},
    lightning:{name:'번개 속공',type:'speed',category:'physical',power:60,accuracy:100,pp:10,priority:1,description:'선공으로 꽂아 넣는 라켓 필살기.'},
    thunder:{name:'천둥 스매시',type:'power',category:'physical',power:95,accuracy:85,pp:10,description:'명중률은 낮지만 위력이 높은 한 방.'},
    phantom:{name:'유령 커트',type:'spin',category:'special',power:60,accuracy:100,pp:10,slow:1,description:'상대 스피드를 1단계 낮추는 필살기.'},
    chiquita:{name:'치키타 스파이럴',type:'spin',category:'special',power:85,accuracy:95,pp:10,slow:.4,description:'40% 확률로 상대 스피드 1단계 감소.'},
    zenith:{name:'제니스 오버드라이브',type:'power',category:'special',power:120,accuracy:90,pp:5,description:'희범의 모든 힘을 담은 최종 필살기.'},
    struggle:{name:'최후의 발악',type:'power',category:'physical',power:50,accuracy:100,pp:0,description:'PP가 모두 없을 때 사용. 최대 HP의 1/4 반동.'}
  };
  for(const [id,m] of Object.entries(MOVES))m.id=id;
  const finite=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;
  const stage=n=>n>=0?(2+n)/2:2/(2-n);
  const special={basic:'crescent',shake:'crescent',cpen:'lightning',jpen:'thunder',defense:'phantom'};
  const typeFor={basic:'power',shake:'spin',cpen:'speed',jpen:'power',defense:'spin'};
  function profile({level=1,stats={},racket='basic',buff=null}={}){
    const lv=finite(level,1,999,1),point=k=>finite(stats[k],0,999,0),champ=lv>=10?1.1:1,
      boost=id=>buff===id?1.15:1,swift=buff==='park'?1.25:1,guard=buff==='clinic'?1.25:1;
    return {name:'희범',kind:'hero',level:lv,type:typeFor[racket]||'power',maxHp:56+lv*8,
      attack:Math.round((20+lv*5)*(1+point('power')*.05)*champ*boost('home')),
      defense:Math.round((16+lv*4)*(1+point('control')*.05)*(lv>=4?1.15:1)*guard),
      spAttack:Math.round((20+lv*5)*(1+point('spin')*.05)*champ*boost('home')),
      spDefense:Math.round((18+lv*4)*(1+point('focus')*.05)*(lv>=4?1.15:1)*guard),
      speed:Math.round((18+lv*3)*(1+point('footwork')*.05)*swift),crit:Math.min(.5,1/24+point('crit')*.05+(buff==='park'?.1:0)),
      moves:['drive',lv>=13?'zenith':'quick',lv>=7?'chiquita':'cut',lv>=2?(special[racket]||'crescent'):'guard']};
  }
  function normalizeVitals(v={},p){
    if(!v||typeof v!=='object')v={};
    return {hp:finite(v.hp,0,p.maxHp,p.maxHp),pp:Object.fromEntries(Object.entries(MOVES).filter(([id])=>id!=='struggle').map(([id,m])=>[id,finite(v.pp?.[id],0,m.pp,m.pp)])),potions:finite(v.potions,0,99,3)};
  }
  function heal(v,p){const n=normalizeVitals(v,p);n.hp=p.maxHp;for(const id of Object.keys(n.pp))n.pp[id]=MOVES[id].pp;return n;}
  const prefixes=['새싹','단풍','사막','달빛','파도','운하','왕관','별빛'];
  function enemyProfile(zoneIndex,zoneLevel,index){
    const lv=finite(zoneLevel,1,999,1)+(index===2?1:0),types=['power','spin','speed'],kinds=['ball','slime','hedgehog'];
    return {name:prefixes[zoneIndex]+' '+['통통볼','스핀젤리','커트고슴'][index],kind:kinds[index],level:lv,type:types[index],maxHp:30+lv*7,
      attack:16+lv*4,defense:14+lv*4,spAttack:16+lv*4,spDefense:14+lv*4,speed:14+lv*3+(index===2?6:0),crit:1/24,
      moves:index===0?['drive','quick','guard',lv>=3?'thunder':'cut']:index===1?['cut','guard','drive',lv>=3?'crescent':'quick']:['quick','cut','drive',lv>=3?'phantom':'guard']};
  }
  function actor(p,v){return {...p,hp:v?.hp??p.maxHp,pp:v?.pp?{...v.pp}:Object.fromEntries(p.moves.map(id=>[id,MOVES[id].pp])),stages:{defense:0,spDefense:0,speed:0}};}
  function create(config){
    const p=profile(config),v=normalizeVitals(config.vitals,p),zoneIndex=finite(config.zoneIndex,0,7,0),zoneLevel=finite(config.zoneLevel,1,999,1),enemyIndex=finite(config.enemyIndex,0,2,Math.floor(Math.random()*3));
    const enemy=actor(enemyProfile(zoneIndex,zoneLevel,enemyIndex));
    return {version:1,zoneIndex,zoneLevel,enemyIndex,hero:actor(p,v),enemy,turn:1,outcome:null,log:[`${enemy.name}이 나타났다! 희범은 무엇을 할까?`],potions:v.potions,escapeAttempts:0};
  }
  function extractVitals(b){return {hp:b.hero.hp,pp:{...b.hero.pp},potions:b.potions};}
  function effectiveness(moveType,targetType){return moveType===targetType?1:{power:'spin',spin:'speed',speed:'power'}[moveType]===targetType?2:.5;}
  function available(a){const ids=a.moves.filter(id=>a.pp[id]>0);return ids.length?ids:['struggle'];}
  function faint(b){
    if(b.hero.hp<=0){b.outcome='lose';b.log.push('희범은 더 이상 싸울 수 없다… 치유 센터로 돌아가자.');}
    else if(b.enemy.hp<=0){b.outcome='win';b.log.push(`${b.enemy.name}을 쓰러뜨렸다! 희범의 승리!`);}
    return !!b.outcome;
  }
  function attack(b,a,d,id,rng){
    const m=MOVES[id];if(id!=='struggle')a.pp[id]--;b.log.push(`${a.name}의 ${m.name}!`);
    if(rng()*100>=m.accuracy){b.log.push('공격이 빗나갔다!');return;}
    if(m.category==='status'){
      for(const key of ['defense','spDefense'])a.stages[key]=Math.min(6,a.stages[key]+1);
      b.log.push(`${a.name}의 방어와 특수방어가 올라갔다!`);return;
    }
    const crit=rng()<a.crit,mult=id==='struggle'?1:effectiveness(m.type,d.type),physical=m.category==='physical';
    const atk=physical?a.attack:a.spAttack,defKey=physical?'defense':'spDefense';
    const def=d[defKey]*stage(crit?Math.min(0,d.stages[defKey]):d.stages[defKey]);
    const damage=Math.max(1,Math.floor(((2*a.level/5+2)*m.power*atk/def/50+2)*(id!=='struggle'&&m.type===a.type?1.5:1)*mult*(crit?1.5:1)*(.85+rng()*.15)));
    d.hp=Math.max(0,d.hp-damage);b.log.push(`${d.name}에게 ${damage} 데미지!${crit?' 급소에 맞았다!':''}${mult===2?' 효과가 굉장했다!':mult===.5?' 효과가 별로였다…':''}`);
    if(d.hp>0&&m.slow&&rng()<m.slow){d.stages.speed=Math.max(-6,d.stages.speed-1);b.log.push(`${d.name}의 스피드가 떨어졌다!`);}
    if(id==='struggle'){a.hp=Math.max(0,a.hp-Math.max(1,Math.floor(a.maxHp/4)));b.log.push(`${a.name}도 반동 데미지를 입었다!`);}
  }
  function step(b,action,rng=Math.random){
    if(b.outcome||!action)return b;
    const moves=available(b.hero);
    if(action.type==='move'&&!moves.includes(action.move))return b;
    if(action.type==='potion'&&(b.potions<=0||b.hero.hp>=b.hero.maxHp))return b;
    if(!['move','potion','run'].includes(action.type))return b;
    b.log=[];if(faint(b))return b;
    const options=available(b.enemy),enemyMove=options[Math.floor(rng()*options.length)];
    if(action.type==='potion'){
      b.potions--;const restored=Math.min(40,b.hero.maxHp-b.hero.hp);b.hero.hp+=restored;b.log.push(`회복약을 사용했다! 희범의 HP ${restored} 회복.`);
    }else if(action.type==='run'){
      b.escapeAttempts++;const chance=Math.min(1,.45+.25*(b.hero.speed*stage(b.hero.stages.speed)/(b.enemy.speed*stage(b.enemy.stages.speed)))+.15*(b.escapeAttempts-1));
      if(rng()<chance){b.outcome='escaped';b.log.push('무사히 도망쳤다! 남은 HP와 PP는 그대로 유지된다.');return b;}
      b.log.push('도망치지 못했다!');
    }else{
      const priority=(MOVES[action.move].priority||0)-(MOVES[enemyMove].priority||0),speed=b.hero.speed*stage(b.hero.stages.speed)-b.enemy.speed*stage(b.enemy.stages.speed);
      const first=priority?priority>0:speed?speed>0:rng()<.5;
      for(const [a,d,id] of first?[[b.hero,b.enemy,action.move],[b.enemy,b.hero,enemyMove]]:[[b.enemy,b.hero,enemyMove],[b.hero,b.enemy,action.move]]){
        attack(b,a,d,id,rng);if(faint(b))return b;
      }
      b.turn++;return b;
    }
    attack(b,b.enemy,b.hero,enemyMove,rng);if(!faint(b))b.turn++;return b;
  }
  function restore(raw,config){
    if(!raw||raw.version!==1||raw.zoneIndex!==config.zoneIndex||raw.zoneLevel!==config.zoneLevel||![0,1,2].includes(raw.enemyIndex))return null;
    if(![null,'win','lose','escaped'].includes(raw.outcome)||!Number.isInteger(raw.turn)||raw.turn<1||raw.turn>100000)return null;
    const b=create({...config,enemyIndex:raw.enemyIndex});
    for(const key of ['hero','enemy']){
      const src=raw[key],dst=b[key];if(!src||!Number.isInteger(src.hp)||src.hp<0||src.hp>dst.maxHp)return null;
      if(src.level!==dst.level||src.type!==dst.type||!Array.isArray(src.moves)||src.moves.join()!==dst.moves.join())return null;
      dst.hp=src.hp;
      for(const id of Object.keys(dst.pp))dst.pp[id]=finite(src.pp?.[id],0,MOVES[id].pp,0);
      for(const id of Object.keys(dst.stages))dst.stages[id]=finite(src.stages?.[id],-6,6,0);
    }
    if((raw.outcome===null||raw.outcome==='escaped')&&(!b.hero.hp||!b.enemy.hp))return null;
    if(raw.outcome==='win'&&(b.enemy.hp!==0||b.hero.hp===0))return null;
    if(raw.outcome==='lose'&&b.hero.hp!==0)return null;
    b.turn=raw.turn;b.outcome=raw.outcome;b.potions=finite(raw.potions,0,99,0);b.escapeAttempts=finite(raw.escapeAttempts,0,100000,0);
    b.log=Array.isArray(raw.log)?raw.log.filter(t=>typeof t==='string').slice(-12).map(t=>t.slice(0,200)):[];
    return b;
  }
  const api={TYPES,MOVES,profile,normalizeVitals,heal,create,step,extractVitals,restore,effectiveness};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BeamCombat=api;
})(typeof window==='undefined'?globalThis:window);
