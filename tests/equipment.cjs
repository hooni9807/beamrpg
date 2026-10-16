const assert=require('node:assert/strict');
const E=require('../equipment.js');

const state={coins:500,racket:'cpen',owned:['basic','cpen'],equipment:E.normalize({},'cpen',['cpen'])};
assert.equal(state.equipment.equipped.racket,'cpen');
assert.equal(state.equipment.inventory.cpen,1);
assert.equal(E.normalize({equipped:{racket:'invalid'}},'cpen',['cpen']).equipped.racket,'cpen');
const starter={coins:100,equipment:E.normalize()};
assert.equal(E.upgrade(starter,'basic').level,1);
assert.equal(E.stats(starter.equipment).attack,2,'starter racket upgrades increase attack');
assert.equal(E.catalog('seven').some(item=>item.id==='seedUniform'),true);
assert.equal(E.catalog('six').some(item=>item.id==='seedUniform'),false);
assert.equal(E.buy(state,'seedUniform','six'),null,'other towns cannot sell this item');
assert.equal(E.buy(state,'seedUniform','seven').id,'seedUniform');
assert.equal(state.coins,420);
assert.equal(E.buy(state,'seedUniform','seven'),null,'a shop cannot charge twice for one item');
assert.equal(E.equip(state,'seedUniform').slot,'uniform');
assert.equal(E.stats(state.equipment).hp,12);
assert.equal(E.upgrade(state,'seedUniform').level,1);
assert.equal(E.stats(state.equipment).hp,15);
assert.equal(E.stats(state.equipment).defense,3);
assert.equal(E.equip(state,'jpen'),null,'items must be owned to equip');
const beforeRacket=JSON.stringify(state);
for(const zone of ['seven','six','five','four','three','two','one','camp']){
  assert(E.catalog(zone).every(item=>item.slot!=='racket'));
  for(const id of ['basic','shake','cpen','jpen','defense'])assert.equal(E.buy(state,id,zone),null);
}
assert.equal(JSON.stringify(state),beforeRacket,'racket purchase attempts never spend gold');
state.equipment.inventory.jpen=1;state.owned.push('jpen');
assert.equal(E.equip(state,'jpen').id,'jpen');
assert.equal(state.racket,'jpen');
assert(state.owned.includes('jpen'));

const before=JSON.stringify(state.equipment);
assert.equal(E.drop(state,'seven',false,()=>.5),null,'normal encounters rarely drop an item');
assert.equal(JSON.stringify(state.equipment),before);
assert.equal(E.drop(state,'seven',false,()=>0).id,'shake');
assert.equal(E.drop(state,'seven',true,()=>0).id,'seedUniform','boss rewards are local gear');
assert.equal(E.drop(state,'camp',true,()=>.99).id,'finalShoes','bosses always drop a local item');
assert.equal(state.equipment.inventory.finalShoes,1);
assert.equal(E.stats(E.normalize({inventory:{unknown:9,seedUniform:1},equipped:{uniform:'jpen',racket:'unknown'},upgrades:{seedUniform:99}},'basic')).hp,0,'invalid save data cannot grant stats');
const capped={coins:9999,equipment:E.normalize({inventory:{seedUniform:1},equipped:{uniform:'seedUniform'},upgrades:{seedUniform:5}})};
assert.equal(E.upgradeCost(capped.equipment,'seedUniform'),null);
assert.equal(E.upgrade(capped,'seedUniform'),null);

console.log('PASS: fixed zone shops, legacy rackets, equipment stats, upgrades and guaranteed boss drops.');
