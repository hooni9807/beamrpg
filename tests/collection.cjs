const assert=require('node:assert/strict');
const Combat=require('../combat.js');
const Collection=require('../collection.js');

const enemy=(name='새싹 퐁글이',kind='ball')=>({
  name,species:kind==='slime'?'0:1':'0:0',kind,look:kind,type:'fire',level:2,maxHp:44,hp:9,
  attack:24,defense:22,spAttack:24,spDefense:22,speed:20,crit:1/24,
  moves:['drive','quick','guard'],pp:{drive:11,quick:20,guard:15}
});

const collection=Collection.normalize();
assert.deepEqual(collection,{monsters:[],activeId:null,nextId:1});
const first=Collection.capture(collection,enemy()).monster;
assert.equal(first.id,'m1');
assert.equal(first.vitals.hp,9);
assert.equal(first.vitals.pp.drive,11);
assert.equal(Collection.select(collection,first.id),first);
assert.equal(Collection.active(collection),first);
const other=Collection.capture(collection,enemy('새싹 빙글젤리','slime')).monster;
const growth=Collection.gainXp(collection,first.id,145);
assert.equal(growth.levels,1);
assert.equal(first.level,3);
assert.equal(first.xp,5);
assert.equal(other.level,2);
assert.equal(other.xp,0);
assert.equal(Collection.needXp(2),140);
assert.equal(Collection.profile(first).id,first.id);
const allyBattle=Combat.create({zoneIndex:0,zoneLevel:2,enemyIndex:1,fighterProfile:Collection.profile(first),fighterVitals:first.vitals});
assert.equal(allyBattle.hero.id,first.id);
assert.equal(allyBattle.hero.level,first.level);
assert.equal(allyBattle.hero.hp,first.vitals.hp);
assert.equal(Collection.select(collection,null),null);
assert.equal(Collection.active(collection),null);
assert.equal(Collection.select(collection,'bogus'),null);
const rival=Collection.capture(collection,{...enemy('동네 고수 민수','rival'),species:'0:3',look:undefined,face:'jersey'}).monster;
assert.equal(rival.look,'jersey');
assert.equal(Collection.profile(rival).look,'jersey');

const fused=Collection.normalize();
const one=Collection.capture(fused,enemy()).monster;
Collection.gainXp(fused,one.id,50);
const two=Collection.capture(fused,enemy()).monster;
Collection.gainXp(fused,two.id,90);
Collection.select(fused,two.id);
const merge=Collection.capture(fused,enemy());
assert.equal(merge.merged,1);
assert.equal(merge.monster.star,2);
assert.equal(merge.monster.level,3);
assert.equal(merge.monster.earnedXp,140);
assert.equal(merge.monster.xp,0);
assert.equal(Collection.active(fused).id,merge.monster.id);
assert.equal(Collection.profile(merge.monster).name,'새싹 퐁글이(2성)');
assert(Collection.profile(merge.monster).maxHp>Combat.create({zoneIndex:0,zoneLevel:2,enemyIndex:0,enemyType:'fire'}).enemy.maxHp);
assert(Collection.profile(merge.monster).attack>24);
assert(Collection.profile(merge.monster).crit>1/24);
Collection.heal(merge.monster);
assert.equal(merge.monster.vitals.hp,Collection.profile(merge.monster).maxHp);
assert.equal(merge.monster.vitals.pp.drive,Combat.MOVES.drive.pp);

const ladder=Collection.normalize();
for(let i=0;i<9;i++)Collection.capture(ladder,enemy());
assert.equal(ladder.monsters.length,1);
assert.equal(ladder.monsters[0].star,3);
for(let i=9;i<243;i++)Collection.capture(ladder,enemy());
assert.equal(ladder.monsters.length,3);
assert(ladder.monsters.every(monster=>monster.star===5));

const unsafe=Collection.normalize({nextId:-7,activeId:'m1',monsters:[
  {id:'m1',name:'<b>불량</b>',species:'0:0',kind:'<img>',type:'constructor',level:9999,star:99,xp:-4,
    moves:['invalid','__proto__','drive'],hp:999999,maxHp:999999,attack:999999,crit:99},
  {id:'m1',name:'duplicate'},
  {id:'1',name:'bad id'},
  {id:'m2',species:'<script>x</script>',name:'bad species'}
]});
assert.equal(unsafe.monsters.length,1);
assert.equal(unsafe.activeId,'m1');
assert.equal(unsafe.nextId,2);
assert(!/[<>]/.test(unsafe.monsters[0].name));
assert.equal(unsafe.monsters[0].kind,'ball');
assert.equal(unsafe.monsters[0].type,'normal');
assert.equal(unsafe.monsters[0].level,999);
assert.equal(unsafe.monsters[0].star,5);
assert.deepEqual(unsafe.monsters[0].moves,['drive']);
assert(unsafe.monsters[0].vitals.hp<=Collection.profile(unsafe.monsters[0]).maxHp);
assert.equal(Collection.normalize({monsters:Array.from({length:250},(_,i)=>({...enemy(),id:`m${i+1}`}))}).monsters.length,200);
const saved=[];
for(let star=1;star<=5&&saved.length<198;star++)for(let zone=0;zone<8&&saved.length<198;zone++)for(let index=0;index<6&&saved.length<198;index++){
  if(star===1&&zone===0&&index===0)continue;
  saved.push({...enemy(),id:`m${saved.length+1}`,species:`${zone}:${index}`,star});
}
saved.push({...enemy(),id:'m199',species:'0:0'},{...enemy(),id:'m200',species:'0:0'});
const full=Collection.normalize({monsters:saved});
assert.equal(full.monsters.length,200);
assert.equal(Collection.canCapture(full,'0:1'),false);
assert.equal(Collection.canCapture(full,'0:0'),true);
assert.equal(Collection.canCapture(full,'bad'),false);
assert.equal(Collection.capture(full,{...enemy(),species:'0:1'}).full,true);
assert.equal(full.monsters.length,200);
const room=Collection.capture(full,enemy());
assert.equal(room.merged,1);
assert.equal(room.monster.star,2);
assert.equal(full.monsters.length,199);
assert.equal(Collection.canCapture(full,'0:1'),true);
Collection.select(full,room.monster.id);
assert.equal(Collection.release(full,room.monster.id).id,room.monster.id);
assert.equal(Collection.active(full),null);
assert.equal(full.monsters.length,198);
assert.equal(Collection.release(full,'missing'),null);
console.log('PASS: independent XP and vitals, three-to-one fusion through five stars, save validation.');
