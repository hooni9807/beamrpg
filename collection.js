/* Captured rivals keep their own growth, health, and moves. */
(function(root){
  'use strict';
  const C=typeof module==='object'&&module.exports?require('./combat.js'):root.BeamCombat;
  const MAX_OWNED=200, MAX_LEVEL=999;
  const integer=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):fallback;
  const text=(value,fallback)=>typeof value==='string'?(value.replace(/[<>&"'`]/g,'').trim().slice(0,60)||fallback):fallback;
  const token=(value,fallback)=>typeof value==='string'&&/^[a-z][a-z0-9_-]{0,24}$/.test(value)?value:fallback;
  const needXp=level=>100+(integer(level,1,MAX_LEVEL,1)-1)*40;
  function baseStats(raw,level){
    const src=raw.baseStats&&typeof raw.baseStats==='object'?raw.baseStats:raw;
    const defaults={maxHp:30+level*7,attack:16+level*4,defense:14+level*4,spAttack:16+level*4,spDefense:14+level*4,speed:14+level*3};
    const stats=Object.fromEntries(Object.keys(defaults).map(key=>[key,integer(src?.[key],1,100000,defaults[key])]));
    stats.crit=Number.isFinite(src?.crit)?Math.max(0,Math.min(.5,src.crit)):1/24;
    return stats;
  }
  function profile(monster){
    const m=monster,delta=Math.max(0,m.level-m.baseLevel),boost=1+(m.star-1)*.18;
    const growth={maxHp:7,attack:4,defense:4,spAttack:4,spDefense:4,speed:3};
    const stats=Object.fromEntries(Object.entries(growth).map(([key,perLevel])=>[key,Math.max(1,Math.round((m.baseStats[key]+delta*perLevel)*boost))]));
    return {id:m.id,species:m.species,star:m.star,name:m.star>1?`${m.name}(${m.star}성)`:m.name,kind:m.kind,look:m.look,level:m.level,type:m.type,...stats,
      crit:Math.min(.5,m.baseStats.crit+(m.star-1)*.025),moves:[...m.moves]};
  }
  function normalizeMonster(raw){
    if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!/^m[1-9]\d{0,8}$/.test(raw.id))return null;
    const level=integer(raw.level,1,MAX_LEVEL,1),baseLevel=integer(raw.baseLevel,1,level,level),name=text(raw.name,'이름 없는 몬스터').replace(/\([2-5]성\)$/,''),
      species=typeof raw.species==='string'&&/^[0-7]:[0-5]$/.test(raw.species)?raw.species:null,
      kind=['ball','slime','hedgehog','rival'].includes(raw.kind)?raw.kind:'ball',look=token(raw.look,kind),type=Object.hasOwn(C.TYPES,raw.type)?raw.type:'normal',
      moves=[...new Set(Array.isArray(raw.moves)?raw.moves.filter(id=>typeof id==='string'&&id!=='struggle'&&Object.hasOwn(C.MOVES,id)).slice(0,8):[])];
    if(!species)return null;
    if(!moves.length)moves.push('drive');
    const monster={id:raw.id,species,name,kind,look,type,level,baseLevel,xp:integer(raw.xp,0,needXp(level)-1,0),
      earnedXp:integer(raw.earnedXp,0,1000000000,0),star:integer(raw.star,1,5,1),baseStats:baseStats(raw,baseLevel),moves};
    monster.earnedXp=Math.max(monster.earnedXp,monster.xp);
    const p=profile(monster),v=raw.vitals&&typeof raw.vitals==='object'?raw.vitals:raw;
    monster.vitals={hp:integer(v.hp,0,p.maxHp,p.maxHp),pp:Object.fromEntries(moves.map(id=>[id,integer(v.pp?.[id],0,C.MOVES[id].pp,C.MOVES[id].pp)]))};
    return monster;
  }
  function normalize(raw){
    const monsters=[],ids=new Set();
    for(const value of Array.isArray(raw?.monsters)?raw.monsters.slice(0,MAX_OWNED):[]){
      const monster=normalizeMonster(value);
      if(monster&&!ids.has(monster.id)){monsters.push(monster);ids.add(monster.id);}
    }
    const greatest=monsters.reduce((max,monster)=>Math.max(max,Number(monster.id.slice(1))),0);
    const nextId=Math.max(greatest+1,integer(raw?.nextId,1,1000000000,1));
    const activeId=ids.has(raw?.activeId)?raw.activeId:null;
    return {monsters,activeId,nextId};
  }
  function active(collection){return collection.monsters.find(monster=>monster.id===collection.activeId)||null;}
  function select(collection,id){
    if(id===null){collection.activeId=null;return null;}
    const monster=collection.monsters.find(entry=>entry.id===id);
    if(monster)collection.activeId=monster.id;
    return monster||null;
  }
  function release(collection,id){
    const index=collection.monsters.findIndex(monster=>monster.id===id);
    if(index<0)return null;
    const [monster]=collection.monsters.splice(index,1);
    if(collection.activeId===id)collection.activeId=null;
    return monster;
  }
  function gainXp(collection,id,amount){
    const monster=collection.monsters.find(entry=>entry.id===id);
    if(!monster)return {monster:null,levels:0};
    const earned=integer(amount,0,10000000,0),oldMax=profile(monster).maxHp;
    monster.earnedXp=Math.min(1000000000,monster.earnedXp+earned);
    monster.xp+=earned;
    let levels=0;
    while(monster.level<MAX_LEVEL&&monster.xp>=needXp(monster.level)){monster.xp-=needXp(monster.level);monster.level++;levels++;}
    if(monster.level===MAX_LEVEL)monster.xp=0;
    monster.vitals.hp=Math.min(profile(monster).maxHp,monster.vitals.hp+profile(monster).maxHp-oldMax);
    return {monster,levels};
  }
  function fuse(collection,latest){
    let monster=latest,merged=0;
    while(monster.star<5){
      const group=collection.monsters.filter(entry=>entry.species===monster.species&&entry.star===monster.star).slice(0,3);
      if(group.length<3)break;
      const base=group.reduce((best,entry)=>entry.baseLevel>best.baseLevel?entry:best),missingHp=profile(base).maxHp-base.vitals.hp;
      const result={...base,id:`m${collection.nextId++}`,star:base.star+1,level:base.baseLevel,xp:0,
        earnedXp:0,baseStats:{...base.baseStats},moves:[...base.moves],vitals:{hp:base.vitals.hp,pp:{...base.vitals.pp}}};
      const earned=group.reduce((sum,entry)=>sum+entry.earnedXp,0);
      const consumed=new Set(group.map(entry=>entry.id));
      collection.monsters=collection.monsters.filter(entry=>!consumed.has(entry.id));
      collection.monsters.push(result);
      if(consumed.has(collection.activeId))collection.activeId=result.id;
      gainXp(collection,result.id,earned);
      result.vitals.hp=Math.max(0,profile(result).maxHp-missingHp);
      monster=result;merged++;
    }
    return {monster,merged};
  }
  function canCapture(collection,species){
    return typeof species==='string'&&/^[0-7]:[0-5]$/.test(species)&&
      (collection.monsters.length<MAX_OWNED||collection.monsters.filter(monster=>monster.species===species&&monster.star===1).length>=2);
  }
  function capture(collection,enemy){
    if(!enemy||typeof enemy!=='object'||typeof enemy.species!=='string'||!/^[0-7]:[0-5]$/.test(enemy.species))return {monster:null,merged:0};
    if(!canCapture(collection,enemy.species))return {monster:null,merged:0,full:true};
    const id=`m${collection.nextId++}`;
    const monster=normalizeMonster({...enemy,id,star:1,baseLevel:enemy.level,baseStats:enemy,
      name:enemy.name,species:enemy.species,look:enemy.face||enemy.look,earnedXp:0,xp:0,vitals:{hp:enemy.hp,pp:enemy.pp}});
    if(!monster)return {monster:null,merged:0};
    collection.monsters.push(monster);
    return fuse(collection,monster);
  }
  function heal(monster){
    if(!monster)return null;
    monster.vitals.hp=profile(monster).maxHp;
    for(const id of monster.moves)monster.vitals.pp[id]=C.MOVES[id].pp;
    return monster.vitals;
  }
  const api={normalize,canCapture,capture,select,release,active,gainXp,profile,needXp,heal};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BeamCollection=api;
})(typeof window==='undefined'?globalThis:window);
