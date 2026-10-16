/* Equipment and rewards shared by exploration and turn battles. */
(function(root){
  'use strict';
  const SLOTS={racket:'라켓',uniform:'탁구복',shoes:'탁구화',wristband:'손목보호대',hairband:'머리끈',spray:'미끄럼 방지 스프레이',fingerGuard:'손가락 보호대',tape:'테이핑'};
  const ITEMS={
    basic:{name:'일반 라켓',slot:'racket',price:0,stats:{}},
    shake:{name:'쉐이크핸드',slot:'racket',price:120,stats:{attack:2,spAttack:2}},
    cpen:{name:'중국식 펜홀더',slot:'racket',price:150,stats:{attack:4,speed:2}},
    jpen:{name:'일본식 펜홀더',slot:'racket',price:200,stats:{attack:6,crit:.01}},
    defense:{name:'수비수 라켓',slot:'racket',price:180,stats:{defense:5,spDefense:4}},
    seedUniform:{name:'새싹 연습복',slot:'uniform',price:80,zone:'seven',stats:{hp:12,defense:2}},
    rhythmShoes:{name:'리듬 스텝화',slot:'shoes',price:75,zone:'seven',stats:{speed:3}},
    autumnBand:{name:'단풍 손목보호대',slot:'wristband',price:95,zone:'six',stats:{defense:4,hp:6}},
    focusRibbon:{name:'집중 머리끈',slot:'hairband',price:100,zone:'six',stats:{spDefense:3,crit:.02}},
    desertSpray:{name:'사막 그립 스프레이',slot:'spray',price:120,zone:'five',stats:{attack:3,speed:2}},
    fingertipGuard:{name:'손끝 보호대',slot:'fingerGuard',price:115,zone:'five',stats:{hp:8,spDefense:3}},
    moonTape:{name:'달빛 테이핑',slot:'tape',price:135,zone:'four',stats:{defense:3,spDefense:3}},
    spinUniform:{name:'스핀 전투복',slot:'uniform',price:180,zone:'four',stats:{hp:18,spAttack:4}},
    coastShoes:{name:'해안 경량화',slot:'shoes',price:205,zone:'three',stats:{speed:6,spDefense:2}},
    waveBand:{name:'파도 완충 밴드',slot:'wristband',price:190,zone:'three',stats:{defense:5,hp:9}},
    canalRibbon:{name:'운하 속공 머리끈',slot:'hairband',price:230,zone:'two',stats:{crit:.03,speed:3}},
    canalSpray:{name:'운하 논슬립 스프레이',slot:'spray',price:240,zone:'two',stats:{attack:5,spAttack:5}},
    precisionGuard:{name:'정밀 손가락 보호대',slot:'fingerGuard',price:270,zone:'one',stats:{crit:.03,spAttack:6}},
    crownTape:{name:'왕관 압박 테이핑',slot:'tape',price:260,zone:'one',stats:{defense:7,spDefense:5}},
    championUniform:{name:'선수촌 챔피언복',slot:'uniform',price:360,zone:'camp',stats:{hp:30,defense:8}},
    finalShoes:{name:'별빛 결승화',slot:'shoes',price:350,zone:'camp',stats:{speed:10,crit:.03}}
  };
  for(const [id,item] of Object.entries(ITEMS))item.id=id;
  const valid=id=>Object.hasOwn(ITEMS,id),count=n=>Number.isSafeInteger(n)&&n>0?n:0;
  const level=n=>Number.isInteger(n)&&n>=0?Math.min(n,5):0;
  function normalize(saved={},legacyRacket='basic',legacyOwned=[]){
    if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
    const inventory={basic:1},equipped={racket:'basic'},upgrades={};
    for(const id of Array.isArray(legacyOwned)?legacyOwned:[])if(valid(id)&&ITEMS[id].slot==='racket')inventory[id]=Math.max(inventory[id]||0,1);
    if(valid(legacyRacket)&&ITEMS[legacyRacket].slot==='racket')inventory[legacyRacket]=Math.max(inventory[legacyRacket]||0,1);
    for(const [id,n] of Object.entries(saved.inventory||{}))if(valid(id)&&count(n))inventory[id]=count(n);
    for(const [slot,id] of Object.entries(saved.equipped||{}))if(Object.hasOwn(SLOTS,slot)&&valid(id)&&ITEMS[id].slot===slot&&inventory[id])equipped[slot]=id;
    const selected=saved.equipped?.racket;
    if((!valid(selected)||ITEMS[selected].slot!=='racket'||!inventory[selected])&&valid(legacyRacket)&&inventory[legacyRacket])equipped.racket=legacyRacket;
    for(const [id,n] of Object.entries(saved.upgrades||{}))if(valid(id)&&inventory[id]&&level(n))upgrades[id]=level(n);
    return {inventory,equipped,upgrades};
  }
  const catalog=zoneId=>Object.values(ITEMS).filter(item=>item.slot==='racket'||item.zone===zoneId);
  const owned=(state,id)=>valid(id)&&count(state?.equipment?.inventory?.[id])>0;
  function stats(equipment){
    const total={hp:0,attack:0,defense:0,spAttack:0,spDefense:0,speed:0,crit:0};
    for(const [slot,id] of Object.entries(equipment?.equipped||{})){
      if(!Object.hasOwn(SLOTS,slot)||!valid(id)||ITEMS[id].slot!==slot||!count(equipment?.inventory?.[id]))continue;
      const upgrade=level(equipment?.upgrades?.[id]);
      for(const [stat,base] of Object.entries(ITEMS[id].stats))total[stat]+=base+(upgrade?(stat==='crit'?.005:Math.max(1,Math.round(base/4)))*upgrade:0);
      if(id==='basic')total.attack+=upgrade*2;
    }
    total.crit=Math.round(total.crit*1000)/1000;
    return total;
  }
  function buy(state,id,zoneId){
    const item=ITEMS[id];if(!valid(id)||!catalog(zoneId).includes(item)||owned(state,id)||!Number.isFinite(state?.coins)||state.coins<item.price)return null;
    state.coins-=item.price;state.equipment.inventory[id]=1;
    if(item.slot==='racket'&&Array.isArray(state.owned)&&!state.owned.includes(id))state.owned.push(id);
    return item;
  }
  function equip(state,id){
    if(!owned(state,id))return null;
    const item=ITEMS[id];state.equipment.equipped[item.slot]=id;
    if(item.slot==='racket')state.racket=id;
    return item;
  }
  function upgradeCost(equipment,id){
    if(!valid(id)||!count(equipment?.inventory?.[id]))return null;
    const n=level(equipment.upgrades?.[id]);return n>=5?null:40+Math.round(ITEMS[id].price/3)+n*30;
  }
  function upgrade(state,id){
    const cost=upgradeCost(state?.equipment,id);if(cost===null||!Number.isFinite(state?.coins)||state.coins<cost)return null;
    state.coins-=cost;const next=level(state.equipment.upgrades[id])+1;state.equipment.upgrades[id]=next;
    return {item:ITEMS[id],level:next,cost};
  }
  function drop(state,zoneId,boss=false,rng=Math.random){
    if(!boss&&rng()>=.08)return null;
    const pool=catalog(zoneId).filter(item=>item.price>0&&(!boss||item.zone===zoneId));if(!pool.length)return null;
    const item=pool[Math.min(pool.length-1,Math.max(0,Math.floor(rng()*pool.length)))];
    state.equipment.inventory[item.id]=count(state.equipment.inventory[item.id])+1;
    if(item.slot==='racket'&&Array.isArray(state.owned)&&!state.owned.includes(item.id))state.owned.push(item.id);
    return item;
  }
  const api={SLOTS,ITEMS,normalize,catalog,stats,buy,equip,upgradeCost,upgrade,drop};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.BeamEquipment=api;
})(typeof window==='undefined'?globalThis:window);
