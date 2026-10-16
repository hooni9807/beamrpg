// Local browser smoke check; no remote services or real account data.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='https://beamrpg.test';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:960}});
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();
      if(u.pathname==='/seed')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Seed</title>'});
      const file=path.join(root,u.pathname==='/'?'index.html':u.pathname),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
      try{let body=await fs.readFile(file);if(u.pathname==='/towns.js')body=Buffer.from(body.toString().replace('  buildScene();screen.hidden=false;', '  window.__townTest={zones,normalBattle,get combat(){return s.combat},get scene(){return scene},get player(){return player}};buildScene();screen.hidden=false;'));await route.fulfill({body,contentType:types[path.extname(file)]||'text/plain'});}catch{return route.fulfill({status:404,body:''});}
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.clock.install();await page.evaluate(()=>Math.random=()=>.9);
    const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('beamrpg.v3'))),tick=ms=>page.clock.runFor(ms);
    const reload=async s=>{await page.goto(origin+'/seed');await page.evaluate(s=>localStorage.setItem('beamrpg.v3',JSON.stringify(s)),s);await page.goto(origin);await page.evaluate(()=>Math.random=()=>.9);await tick(50);};
    const visit=async(action,value)=>{
      const index=await page.evaluate(({action,value})=>{const t=window.__townTest,i=t.scene.portals.findIndex(p=>p.action===action&&(value==null||p.value===value)),p=t.scene.portals[i];const q=[[0,72],[0,-72],[72,0],[-72,0]].map(([x,y])=>({x:p.x+x,y:p.y+y})).find(q=>!t.scene.obstacles.some(o=>q.x>o.x-10&&q.x<o.x+o.w+10&&q.y>o.y-10&&q.y<o.y+o.h+10));Object.assign(t.player,q);return i;},{action,value});
      await page.locator(`[data-destination="${index}"]`).click();await tick(500);
    };
    // Intro appears once, blocks walking, advances by keyboard, and preserves the save.
    assert.equal(await page.locator('.story-scene').getAttribute('data-scene'),'0');
    const opening=await state(),initialPlayer=await page.evaluate(()=>({...window.__townTest.player}));
    await page.keyboard.down('w');await tick(200);await page.keyboard.up('w');
    assert.deepEqual(await page.evaluate(()=>({...window.__townTest.player})),initialPlayer);
    await page.screenshot({path:'/tmp/beamrpg-intro-desktop.png'});
    await page.locator('#story-next').click();assert.equal(await page.locator('.story-scene').getAttribute('data-scene'),'1');
    await page.keyboard.press('Enter');assert.equal(await page.locator('.story-scene').getAttribute('data-scene'),'2');
    await page.keyboard.press('Space');assert.equal(await page.locator('.story-scene').getAttribute('data-scene'),'3');
    await page.locator('#story-next').click();assert.equal((await state()).introSeen,true);
    assert.deepEqual({...await state(),introSeen:false},opening,'completion must not change gameplay state');
    assert.equal((await state()).place,'interior');assert.equal((await state()).facility,'home','new game begins in Heebeom home');
    await page.reload();await tick(50);assert.equal(await page.locator('.story-scene').count(),0,'no repeated intro');
    await page.evaluate(()=>{const t=window.__townTest;t.player.x=512;t.player.y=520;window.dispatchEvent(new PageTransitionEvent('pagehide'));});
    assert.deepEqual((await state()).positions['interior:seven:home'],{x:512,y:520});
    await page.reload();await tick(50);
    assert.equal((await state()).place,'interior');assert.deepEqual(await page.evaluate(()=>({...window.__townTest.player})),{x:512,y:520},'reload resumes the last saved position');
    await page.locator('#town-guide').click();await page.locator('#story-replay').click();
    const beforeReplay=await state();await page.setViewportSize({width:390,height:844});await tick(100);
    await page.screenshot({path:'/tmp/beamrpg-intro-mobile.png'});
    assert.equal(await page.evaluate(()=>document.querySelector('.story-scene').scrollWidth<=innerWidth),true);
    await page.keyboard.press('Escape');assert.deepEqual(await state(),beforeReplay,'replay/skip preserve progress');
    assert.equal(await page.evaluate(()=>document.querySelector('#rpg-screen').inert),false);
    await page.setViewportSize({width:1440,height:960});
    await reload({...await state(),introSeen:false,pendingUpgrades:1});await page.locator('#story-skip').click();
    assert.equal(await page.locator('[data-up]').count(),3,'pending level reward follows intro');
    await page.locator('[data-up]').first().click();assert.equal((await state()).pendingUpgrades,0);
    assert.equal(await page.evaluate(()=>charType),'heebeom');assert.equal((await state()).racket,'basic');
    await reload({...await state(),place:'world',introSeen:true});assert.equal(await page.locator('[data-zone]').count(),8);
    await page.screenshot({path:'/tmp/beamrpg-world-new.png'});
    const disconnected=await page.evaluate(()=>{
      const zones=window.__townTest.zones,scenes=[BeamMap.createScene({kind:'world',zones,isOpen:()=>true})];
      for(const zone of zones)for(const kind of ['town','park'])scenes.push(BeamMap.createScene({kind,zone}));
      for(const facility of ['home','shop','cafe','training','clinic','hall','gym'])scenes.push(BeamMap.createScene({kind:'interior',zone:zones[0],facility}));
      const failures=[];
      for(const s of scenes){
        const cols=Math.ceil(s.width/32),rows=Math.ceil(s.height/32),valid=p=>p.x>=20&&p.y>=20&&p.x<=s.width-20&&p.y<=s.height-20&&!s.obstacles.some(o=>p.x>o.x-10&&p.x<o.x+o.w+10&&p.y>o.y-10&&p.y<o.y+o.h+10);
        const point=i=>({x:i%cols*32+16,y:Math.floor(i/cols)*32+16}),seen=new Set(),q=[];
        let start=-1,best=Infinity;for(let i=0;i<cols*rows;i++){const p=point(i),d=Math.hypot(p.x-s.spawn.x,p.y-s.spawn.y);if(valid(p)&&d<best){start=i;best=d;}}
        if(!valid(s.spawn))failures.push(s.title+': spawn blocked');q.push(start);seen.add(start);
        for(let j=0;j<q.length;j++){const i=q[j],x=i%cols,y=Math.floor(i/cols);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=yy*cols+xx;if(xx<0||xx>=cols||yy<0||yy>=rows||seen.has(k)||!valid(point(k)))continue;seen.add(k);q.push(k);}}
        for(const p of s.portals)if(!valid(p)||!q.some(i=>{const n=point(i);return Math.hypot(n.x-p.x,n.y-p.y)<p.radius;}))failures.push(s.title+': '+p.label);
      }return failures;
    });
    assert.deepEqual(disconnected,[],'every door and service is reachable');
    await visit('zone','seven');assert.equal((await state()).place,'town');await page.screenshot({path:'/tmp/beamrpg-town-new.png'});
    await tick(1200);assert.equal(await page.evaluate(()=>playing),false,'idle never triggers encounters');
    await visit('facility','home');assert.equal((await state()).place,'interior');await page.screenshot({path:'/tmp/beamrpg-home-new.png'});
    await visit('service','home');await page.locator('#facility-action').click();assert.deepEqual((await state()).restBuff,{id:'home',uses:3});await page.locator('#town-close').click();
    await visit('return');assert.equal((await state()).place,'town');
    await visit('facility','park');assert.equal((await state()).place,'park');await page.screenshot({path:'/tmp/beamrpg-park-new.png'});await visit('service','park');await page.locator('#facility-action').click();assert.deepEqual((await state()).restBuff,{id:'park',uses:3});await page.locator('#town-close').click();await visit('return');
    // Ordinary encounters spend persistent HP/PP and resume at the last completed turn.
    await page.evaluate(()=>{window.__townTest.normalBattle();Math.random=()=>.4;});
    assert.equal(await page.locator('.beam-combat').count(),1);assert.equal(await page.evaluate(()=>playing),false);
    assert.equal(await page.locator('[data-move]').count(),4);
    await page.locator('[data-move="quick"]').click();await tick(650);
    const fighting=await state();assert(fighting.vitals.hp<64);assert.equal(fighting.vitals.pp.quick,19);
    assert.equal(fighting.restBuff.uses,2,'a rest buff lasts three battles and is used when combat starts');assert.equal(fighting.combatBuff,'park');assert.equal(fighting.combat.hero.speed,Math.round(21*1.25));
    await page.screenshot({path:'/tmp/beamrpg-turn-desktop.png'});
    await page.reload();await tick(80);assert.deepEqual((await state()).combat,fighting.combat,'battle survives reload');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.beam-combat').count(),1,'Escape never bypasses an enemy turn');
    await page.setViewportSize({width:390,height:844});await tick(80);await page.screenshot({path:'/tmp/beamrpg-turn-mobile.png'});
    assert.equal(await page.evaluate(()=>document.querySelector('.beam-combat').scrollWidth<=innerWidth),true);
    await page.locator('[data-menu="bag"]').click();await page.getByRole('button',{name:'회복약 사용',exact:true}).click();await tick(650);
    assert.equal((await state()).vitals.potions,2);
    await page.locator('[data-menu="fight"]').click();
    await page.evaluate(()=>{const b=window.__townTest.combat;b.enemy.hp=1;b.enemy.stages.speed=-6;Math.random=()=>.9;});
    await page.locator('[data-move="drive"]').click();await tick(650);assert.equal((await state()).combat.outcome,'win');
    const won=await state();await page.reload();await tick(80);
    await page.getByRole('button',{name:'마을로 돌아가기',exact:true}).click();
    assert.equal((await state()).xp,won.xp+70);assert.equal((await state()).combat,null);assert.equal((await state()).vitals.pp.quick,19);
    const rewarded=await state();await page.reload();await tick(80);assert.equal((await state()).xp,rewarded.xp,'reward is credited once');
    await page.setViewportSize({width:1440,height:960});
    await visit('facility','clinic');await visit('service','clinic');await page.locator('#facility-action').click();
    assert.equal((await state()).vitals.hp,64);assert.equal((await state()).vitals.pp.quick,20);await page.locator('#town-close').click();await visit('return');
    // Fainting returns to the local healing center, without erasing progression.
    await page.evaluate(()=>{window.__townTest.normalBattle();const b=window.__townTest.combat;b.hero.hp=1;b.hero.stages.speed=-6;Math.random=()=>.4;});
    await page.locator('[data-move="drive"]').click();await tick(650);assert.equal((await state()).combat.outcome,'lose');
    await page.getByRole('button',{name:'치유 센터로 이동',exact:true}).click();
    assert.equal((await state()).facility,'clinic');assert.equal((await state()).place,'interior');assert.equal((await state()).vitals.hp,64);
    assert.equal((await state()).xp,rewarded.xp);await page.locator('#town-close').click();
    await reload({...await state(),mapVersion:undefined,positions:undefined,level:13,xp:33,coins:500,wins:{seven:true,six:true,five:true,four:true,three:true},place:'town',zone:'two'});
    assert.equal((await state()).level,13);assert.equal((await state()).xp,33);assert.equal((await state()).legacyCamp,true);
    await visit('facility','shop');await visit('service','shop');await page.locator('[data-racket="cpen"]').click();assert.equal((await state()).coins,350);assert.equal(await page.evaluate(()=>racketType),'cpen');await page.locator('#town-close').click();
    await visit('return');await visit('facility','gym');await visit('service','gym');await page.locator('#facility-action').click();await tick(50);assert.equal(await page.evaluate(()=>playing),true);assert.equal(await page.evaluate(()=>window.beamRpgV2.rival.name),'만취범');
    await page.evaluate(()=>{you=11;cpu=0;playing=false;});await tick(50);assert.equal((await state()).wins.two,true);assert.match(await page.locator('#rpg-modal').innerText(),/1부 마을이 열렸습니다/);
    await reload({...await state(),place:'town',zone:'one',pendingUpgrades:0});await page.screenshot({path:'/tmp/beamrpg-one-new.png'});
    await page.setViewportSize({width:390,height:844});await tick(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/tmp/beamrpg-mobile-new.png'});
    assert.deepEqual(errors,[]);console.log('PASS: intro, saved position, turn battle/resume/rewards/defeat/healing, mobile and boss rally flow.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
