/* Ordinary encounters are turn based; the rally engine still handles gym matches. */
(function(root){
  'use strict';
  const TYPES={
    normal:{name:'노말',color:'#a8a77a'},fire:{name:'불꽃',color:'#ee8130'},water:{name:'물',color:'#6390f0'},electric:{name:'전기',color:'#f7d02c'},grass:{name:'풀',color:'#7ac74c'},ice:{name:'얼음',color:'#96d9d6'},
    fighting:{name:'격투',color:'#c22e28'},poison:{name:'독',color:'#a33ea1'},ground:{name:'땅',color:'#e2bf65'},flying:{name:'비행',color:'#a98ff3'},psychic:{name:'에스퍼',color:'#f95587'},bug:{name:'벌레',color:'#a6b91a'},
    rock:{name:'바위',color:'#b6a136'},ghost:{name:'고스트',color:'#735797'},dragon:{name:'드래곤',color:'#6f35fc'},dark:{name:'악',color:'#705746'},steel:{name:'강철',color:'#b7b7ce'}
  };
  const WEAK={normal:['rock','steel'],fire:['fire','water','rock','dragon'],water:['water','grass','dragon'],electric:['electric','grass','dragon'],grass:['fire','grass','poison','flying','bug','dragon','steel'],ice:['fire','water','ice','steel'],fighting:['poison','flying','psychic','bug'],poison:['poison','ground','rock','ghost'],ground:['grass','bug'],flying:['electric','rock','steel'],psychic:['psychic','steel'],bug:['fire','fighting','poison','flying','ghost','steel'],rock:['fighting','ground','steel'],ghost:['dark'],dragon:['steel'],dark:['fighting','dark','steel'],steel:['fire','water','electric','steel']};
  const STRONG={fire:['grass','ice','bug','steel'],water:['fire','ground','rock'],electric:['water','flying'],grass:['water','ground','rock'],ice:['grass','ground','flying','dragon'],fighting:['normal','ice','rock','dark','steel'],poison:['grass'],ground:['fire','electric','poison','rock','steel'],flying:['grass','fighting','bug'],psychic:['fighting','poison'],bug:['grass','psychic','dark'],rock:['fire','ice','flying','bug'],ghost:['psychic','ghost'],dragon:['dragon'],dark:['psychic','ghost'],steel:['ice','rock']};
  const IMMUNE={normal:['ghost'],electric:['ground'],fighting:['ghost'],poison:['steel'],ground:['flying'],psychic:['dark'],ghost:['normal']};
  const MOVES={
    drive:{name:'포핸드 드라이브',type:'normal',category:'physical',power:50,accuracy:100,pp:25,description:'안정적인 기본 공격.'},
    quick:{name:'쾌속 쇼트',type:'flying',category:'physical',power:35,accuracy:100,pp:20,description:'빠르고 안정적으로 넣는 쇼트.'},
    cut:{name:'회전 커트',type:'dark',category:'special',power:40,accuracy:100,pp:20,slow:.3,description:'30% 확률로 상대 스피드 1단계 감소.'},
    guard:{name:'철벽 준비',type:'steel',category:'status',power:0,accuracy:100,pp:15,description:'자신의 방어와 특수방어를 1단계 높인다.'},
    crescent:{name:'초승달 드라이브',type:'psychic',category:'special',power:75,accuracy:95,pp:10,description:'크게 휘어지는 강력한 회전 공격.'},
    lightning:{name:'번개 속공',type:'electric',category:'physical',power:60,accuracy:100,pp:10,description:'번개처럼 꽂아 넣는 라켓 필살기.'},
    thunder:{name:'천둥 스매시',type:'electric',category:'physical',power:95,accuracy:85,pp:10,description:'명중률은 낮지만 위력이 높은 한 방.'},
    phantom:{name:'유령 커트',type:'ghost',category:'special',power:60,accuracy:100,pp:10,slow:1,description:'상대 스피드를 1단계 낮추는 필살기.'},
    counter:{name:'스틸 카운터',type:'fighting',category:'physical',power:72,accuracy:100,pp:12,description:'강하게 파고드는 카운터.'},
    chiquita:{name:'치키타 스파이럴',type:'grass',category:'special',power:85,accuracy:95,pp:10,slow:.4,description:'40% 확률로 상대 스피드 1단계 감소.'},
    meteor:{name:'메테오 스매시',type:'rock',category:'physical',power:108,accuracy:88,pp:8,description:'별똥별처럼 꽂히는 강한 스매시.'},
    zenith:{name:'제니스 오버드라이브',type:'dragon',category:'special',power:120,accuracy:90,pp:5,description:'희범의 모든 힘을 담은 최종 필살기.'},
    stepAround:{name:'돌아서 포핸드',type:'fighting',category:'physical',power:78,accuracy:95,pp:12,description:'백쪽에서 빠르게 돌아서 포핸드로 공격한다.'},
    spinServe:{name:'손목 스핀 서브',type:'psychic',category:'special',power:65,accuracy:100,pp:10,slow:.7,description:'손목 회전으로 70% 확률로 상대 스피드를 낮춘다.'},
    flashShort:{name:'속사포 쇼트',type:'electric',category:'physical',power:92,accuracy:100,pp:8,description:'네트 앞에서 빠른 쇼트를 연속으로 찌른다.'},
    penholdFinal:{name:'펜홀더 태풍',type:'dragon',category:'physical',power:115,accuracy:95,pp:5,description:'포핸드 발놀림과 손목 회전을 합친 최종 기술.'},
    struggle:{name:'최후의 발악',type:'normal',category:'physical',power:50,accuracy:100,pp:0,description:'PP가 모두 없을 때 사용. 최대 HP의 1/4 반동.'}
  };
  for(const [id,m] of Object.entries(MOVES))m.id=id;
  const finite=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;
  const stage=n=>n>=0?(2+n)/2:2/(2-n);
  const special={basic:'crescent',shake:'crescent',cpen:'lightning',jpen:'thunder',defense:'phantom'};
  const laterMoves=racket=>racket==='cpen'||racket==='jpen'?['stepAround','spinServe','flashShort','penholdFinal']:['counter','chiquita','meteor','zenith'];
  function learnedMoves(lv,racket,legacy=false){const later=legacy?['counter','chiquita','meteor','zenith']:laterMoves(racket);return ['drive','quick','cut','guard',...(lv>=2?[special[racket]||'crescent']:[]),...(lv>=4?[later[0]]:[]),...(lv>=7?[later[1]]:[]),...(lv>=10?[later[2]]:[]),...(lv>=13?[later[3]]:[])];}
  function profile({level=1,stats={},racket='basic',buff=null,elementType='normal',equipment={}}={}){
    const lv=finite(level,1,999,1),point=k=>finite(stats[k],0,999,0),bonus=k=>finite(equipment[k],0,999,0),
      boost=id=>buff===id?1.15:1,swift=buff==='park'?1.25:1,guard=buff==='clinic'?1.25:1;
    return {name:'희범',kind:'hero',level:lv,type:Object.hasOwn(TYPES,elementType)?elementType:'normal',maxHp:56+lv*8+bonus('hp'),
      attack:Math.round((20+lv*5)*(1+point('power')*.05)*boost('home'))+bonus('attack'),
      defense:Math.round((16+lv*4)*(1+point('control')*.05)*guard)+bonus('defense'),
      spAttack:Math.round((20+lv*5)*(1+point('spin')*.05)*boost('home'))+bonus('spAttack'),
      spDefense:Math.round((18+lv*4)*(1+point('focus')*.05)*guard)+bonus('spDefense'),
      speed:Math.round((18+lv*3)*(1+point('footwork')*.05)*swift)+bonus('speed'),crit:Math.min(.5,1/24+point('crit')*.05+(buff==='park'?.1:0)+(Number.isFinite(equipment.crit)?Math.max(0,equipment.crit):0)),
      moves:learnedMoves(lv,racket)};
  }
  function normalizeVitals(v={},p){
    if(!v||typeof v!=='object')v={};
    return {hp:finite(v.hp,0,p.maxHp,p.maxHp),pp:Object.fromEntries(Object.entries(MOVES).filter(([id])=>id!=='struggle').map(([id,m])=>[id,finite(v.pp?.[id],0,m.pp,m.pp)])),potions:finite(v.potions,0,99,3)};
  }
  function heal(v,p){const n=normalizeVitals(v,p);n.hp=p.maxHp;for(const id of Object.keys(n.pp))n.pp[id]=MOVES[id].pp;return n;}
  const prefixes=['새싹','단풍','사막','달빛','파도','운하','왕관','별빛'];
  function enemyProfile(zoneIndex,zoneLevel,index,elementType,rivals=[]){
    const lv=finite(zoneLevel,1,999,1)+(index===2||index>=3?1:0),types=Object.keys(TYPES),type=Object.hasOwn(TYPES,elementType)?elementType:types[Math.floor(Math.random()*types.length)],rival=rivals[index-3];
    return {name:index<3?prefixes[zoneIndex]+' '+['퐁글이','빙글젤리','가시커트'][index]:String(rival?.[0]||'도전자').slice(0,60),
      kind:index<3?['ball','slime','hedgehog'][index]:'rival',look:index>=3?String(rival?.[1]||'plain').slice(0,32):undefined,face:index>=3?String(rival?.[1]||'plain').slice(0,32):undefined,species:`${zoneIndex}:${index}`,level:lv,type,maxHp:30+lv*7,
      attack:16+lv*4,defense:14+lv*4,spAttack:16+lv*4,spDefense:14+lv*4,speed:14+lv*3+(index===2?6:0),crit:1/24,
      moves:index===0?['drive','quick','guard',lv>=3?'thunder':'cut']:index===1?['cut','guard','drive',lv>=3?'crescent':'quick']:index===2?['quick','cut','drive',lv>=3?'phantom':'guard']:['drive','quick','cut',lv>=3?'crescent':'guard']};
  }
  function actor(p,v){return {...p,hp:v?.hp??p.maxHp,pp:v?.pp?{...v.pp}:Object.fromEntries(p.moves.map(id=>[id,MOVES[id].pp])),stages:{defense:0,spDefense:0,speed:0}};}
  function fighterProfile(config){
    const f=config.fighterProfile;if(!f||typeof f!=='object')return profile(config);
    if(!['ball','slime','hedgehog','rival'].includes(f.kind)||typeof f.species!=='string'||!/^\d+:[0-5]$/.test(f.species)||!Object.hasOwn(TYPES,f.type)||!Array.isArray(f.moves)||!f.moves.length||f.moves.some(id=>!Object.hasOwn(MOVES,id)||id==='struggle'))return profile(config);
    return {id:f.id,name:String(f.name||'동료').slice(0,60),kind:f.kind,species:f.species,look:typeof f.look==='string'?f.look.slice(0,32):undefined,face:typeof (f.face||f.look)==='string'?(f.face||f.look).slice(0,32):undefined,star:finite(f.star,1,5,1),level:finite(f.level,1,999,1),type:f.type,
      maxHp:finite(f.maxHp,1,100000,1),attack:finite(f.attack,1,100000,1),defense:finite(f.defense,1,100000,1),spAttack:finite(f.spAttack,1,100000,1),spDefense:finite(f.spDefense,1,100000,1),speed:finite(f.speed,1,100000,1),
      crit:Number.isFinite(f.crit)?Math.max(0,Math.min(.75,f.crit)):1/24,moves:[...f.moves]};
  }
  function create(config){
    const p=fighterProfile(config),v=normalizeVitals(config.fighterProfile?config.fighterVitals:config.vitals,p),zoneIndex=finite(config.zoneIndex,0,7,0),zoneLevel=finite(config.zoneLevel,1,999,1),rivals=Array.isArray(config.rivals)?config.rivals.slice(0,3):[],roll=Math.random(),humanShare=rivals.length>0?0.18:0;
    const wildIndex=roll<humanShare?3+Math.floor(roll/humanShare*rivals.length):Math.floor((roll-humanShare)/(1-humanShare)*3);
    const enemyIndex=finite(config.enemyIndex,0,2+rivals.length,wildIndex);
    const enemy=actor(enemyProfile(zoneIndex,zoneLevel,enemyIndex,config.enemyType,rivals));
    return {version:3,zoneIndex,zoneLevel,enemyIndex,hero:actor(p,v),enemy,turn:1,side:'hero',outcome:null,log:[`${enemy.name}이 나타났다! ${p.name}은 무엇을 할까?`],potions:finite(config.vitals?.potions,0,99,v.potions),captureDiscs:finite(config.captureDiscs,0,999,0),escapeAttempts:0};
  }
  function extractVitals(b){return {hp:b.hero.hp,pp:{...b.hero.pp},potions:b.potions};}
  function captureChance(b){
    if(!b||b.outcome||b.captureBlocked||!b.captureDiscs||b.enemy?.hp<=0||!b.enemy?.maxHp||!b.hero?.hp)return 0;
    return Math.max(.05,Math.min(.9,.18+.55*(1-b.enemy.hp/b.enemy.maxHp)+.06*(b.hero.level-b.enemy.level)));
  }
  function effectiveness(moveType,targetType){if(!Object.hasOwn(TYPES,moveType)||!Object.hasOwn(TYPES,targetType))return 1;if(IMMUNE[moveType]?.includes(targetType))return 0;if(STRONG[moveType]?.includes(targetType))return 2;if(WEAK[moveType]?.includes(targetType))return .5;return 1;}
  function available(a){const ids=a.moves.filter(id=>a.pp[id]>0);return ids.length?ids:['struggle'];}
  function faint(b){
    if(b.hero.hp<=0){b.outcome='lose';b.log.push(`${b.hero.name}은 더 이상 싸울 수 없다… 치유 센터로 돌아가자.`);}
    else if(b.enemy.hp<=0){b.outcome='win';b.log.push(`${b.enemy.name}을 쓰러뜨렸다! ${b.hero.name}의 승리!`);}
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
    const damage=mult===0?0:Math.max(1,Math.floor(((2*a.level/5+2)*m.power*atk/def/50+2)*(id!=='struggle'&&m.type===a.type?1.5:1)*mult*(crit?1.5:1)*(.85+rng()*.15)));
    d.hp=Math.max(0,d.hp-damage);b.log.push(`${d.name}에게 ${damage} 데미지!${crit?' 급소에 맞았다!':''}${mult===2?' 효과가 굉장했다!':mult===.5?' 효과가 별로였다…':mult===0?' 효과가 없다…':''}`);
    if(d.hp>0&&m.slow&&rng()<m.slow){d.stages.speed=Math.max(-6,d.stages.speed-1);b.log.push(`${d.name}의 스피드가 떨어졌다!`);}
    if(id==='struggle'){a.hp=Math.max(0,a.hp-Math.max(1,Math.floor(a.maxHp/4)));b.log.push(`${a.name}도 반동 데미지를 입었다!`);}
  }
  function step(b,action,rng=Math.random){
    if(b.outcome||!action)return b;
    if(!['hero','enemy'].includes(b.side))return b;
    if(faint(b))return b;
    if(b.side==='enemy'){
      if(action.type!=='enemy')return b;
      b.log=[];
      const options=available(b.enemy),enemyMove=options[Math.floor(rng()*options.length)];
      attack(b,b.enemy,b.hero,enemyMove,rng);if(!faint(b)){b.side='hero';b.turn++;}return b;
    }
    const moves=available(b.hero);
    if(action.type==='move'&&!moves.includes(action.move))return b;
    if(action.type==='potion'&&(b.potions<=0||b.hero.hp>=b.hero.maxHp))return b;
    if(action.type==='capture'&&(b.captureBlocked||!b.captureDiscs))return b;
    if(!['move','potion','run','capture'].includes(action.type))return b;
    b.log=[];
    if(action.type==='potion'){
      b.potions--;const restored=Math.min(40,b.hero.maxHp-b.hero.hp);b.hero.hp+=restored;b.log.push(`회복약을 사용했다! ${b.hero.name}의 HP ${restored} 회복.`);
    }else if(action.type==='capture'){
      const chance=captureChance(b);b.captureDiscs--;
      if(rng()<chance){b.outcome='captured';b.log.push(`${b.enemy.name}을 포획했다!`);return b;}
      b.log.push(`${b.enemy.name}이 포획 도구에서 빠져나왔다!`);
    }else if(action.type==='run'){
      b.escapeAttempts++;const chance=Math.min(1,.45+.25*(b.hero.speed*stage(b.hero.stages.speed)/(b.enemy.speed*stage(b.enemy.stages.speed)))+.15*(b.escapeAttempts-1));
      if(rng()<chance){b.outcome='escaped';b.log.push('무사히 도망쳤다! 남은 HP와 PP는 그대로 유지된다.');return b;}
      b.log.push('도망치지 못했다!');
    }else{
      attack(b,b.hero,b.enemy,action.move,rng);if(faint(b))return b;
    }
    b.side='enemy';return b;
  }
  function restore(raw,config){
    const rivals=Array.isArray(config.rivals)?config.rivals.slice(0,3):[];
    if(!raw||![1,2,3].includes(raw.version)||raw.zoneIndex!==config.zoneIndex||raw.zoneLevel!==config.zoneLevel||!Number.isInteger(raw.enemyIndex)||raw.enemyIndex<0||raw.enemyIndex>(raw.version<3?2:2+rivals.length))return null;
    if(![null,'win','lose','escaped','captured'].includes(raw.outcome)||!Number.isInteger(raw.turn)||raw.turn<1||raw.turn>100000)return null;
    if(!Object.hasOwn(TYPES,raw.enemy?.type))return null;const b=create({...config,...(raw.version<3?{fighterProfile:null}:{}),enemyIndex:raw.enemyIndex,enemyType:raw.enemy.type});
    for(const key of ['hero','enemy']){
      const src=raw[key],dst=b[key];if(!src||!Number.isInteger(src.hp)||src.hp<0||src.hp>dst.maxHp)return null;
      if(src.level!==dst.level||src.type!==dst.type||!Array.isArray(src.moves))return null;
      if(src.moves.join()!==dst.moves.join()){
        if(key!=='hero'||config.fighterProfile||src.moves.join()!==learnedMoves(dst.level,config.racket,true).join())return null;
        dst.moves=[...src.moves]; // Resume a pre-penholder-save fight with its original PP and moves.
      }
      if(raw.version===3&&(src.name!==dst.name||src.kind!==dst.kind||src.species!==dst.species||(key==='hero'&&(src.id!==dst.id||src.star!==dst.star))))return null;
      dst.hp=src.hp;
      for(const id of Object.keys(dst.pp))dst.pp[id]=finite(src.pp?.[id],0,MOVES[id].pp,0);
      for(const id of Object.keys(dst.stages))dst.stages[id]=finite(src.stages?.[id],-6,6,0);
    }
    if((raw.outcome===null||raw.outcome==='escaped'||raw.outcome==='captured')&&(!b.hero.hp||!b.enemy.hp))return null;
    if(raw.outcome==='win'&&(b.enemy.hp!==0||b.hero.hp===0))return null;
    if(raw.outcome==='lose'&&b.hero.hp!==0)return null;
    if(raw.version>=2&&!['hero','enemy'].includes(raw.side))return null;
    if(raw.version<3&&raw.outcome==='captured')return null;
    b.turn=raw.turn;b.side=raw.version>=2?raw.side:'hero';b.outcome=raw.outcome;b.potions=finite(raw.potions,0,99,0);b.captureDiscs=raw.version===3?finite(raw.captureDiscs,0,999,0):finite(config.captureDiscs,0,999,0);b.escapeAttempts=finite(raw.escapeAttempts,0,100000,0);
    b.log=Array.isArray(raw.log)?raw.log.filter(t=>typeof t==='string').slice(-12).map(t=>t.slice(0,200)):[];
    return b;
  }
  const api={TYPES,MOVES,profile,normalizeVitals,heal,create,step,extractVitals,restore,effectiveness,captureChance};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BeamCombat=api;
})(typeof window==='undefined'?globalThis:window);
