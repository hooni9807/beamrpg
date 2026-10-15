// Run with Node and Playwright installed; the browser serves only repository files.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://beamrpg.test';
const ids = ['seven','six','five','four','three','camp'];
const names = ['7부 마을','6부 마을','5부 마을','4부 마을','3부 마을','선수촌'];
const xp = [70,90,110,140,170,220];
const stats = {power:0,spin:0,control:0,footwork:0,crit:0,focus:0};

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1100,height:900}});
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if(u.origin!==origin)return route.abort();
      if(u.pathname==='/__test_seed')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Test storage</title>'});
      const file = path.join(root,u.pathname==='/'?'index.html':u.pathname);
      const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
      try {await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'text/plain'});} catch {await route.fulfill({status:404,body:''});}
    });
    const page = await context.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(origin);
    await page.clock.install();
    await page.evaluate(()=>Math.random=()=>.9);
    const state = ()=>page.evaluate(()=>JSON.parse(localStorage.getItem('beamrpg.v3')));
    const tick = ms=>page.clock.runFor(ms);
    const click = async selector=>{await page.locator(selector).click();await tick(50);};
    const reload = async s=>{await page.goto(origin+'/__test_seed');await page.evaluate(s=>localStorage.setItem('beamrpg.v3',JSON.stringify(s)),s);await page.goto(origin);await page.evaluate(()=>Math.random=()=>.9);await tick(100);};
    const settle = async (predicate, limit=12000)=>{for(let n=0;n<limit;n+=200){if(await page.evaluate(predicate))return;await tick(200);}throw Error('Timed out: '+predicate+' '+JSON.stringify(await page.evaluate(()=>({state:JSON.parse(localStorage.getItem('beamrpg.v3')),player:document.querySelector('#town-player').style.cssText,modal:document.querySelector('#rpg-modal').hidden,playing,paused}))));};
    const resolveUpgrades = async()=>{
      if(await page.locator('#town-upgrade').count())await click('#town-upgrade');
      while(await page.locator('#rpg-modal').isVisible() && await page.locator('[data-up]').count()){await page.locator('[data-up]').first().click();await tick(50);}
      if(await page.locator('#town-close').isVisible())await click('#town-close');
    };
    const conclude = async won=>{await page.evaluate(won=>{you=won?10:0;cpu=won?0:10;ball={owner:'ai',type:'drive'};point(won,'test match point');},won);await tick(100);};
    assert.equal(await page.evaluate(()=>charType),'heebeom');
    assert.equal(await page.locator('[data-zone]').count(),6);
    assert.equal(await page.locator('.rpg-npc').count(),0);
    assert.equal(await page.locator('#char-pick').isVisible(),false);
    await page.screenshot({path:'/tmp/beamrpg-world.png'});

    // A locked town requires reaching its entrance; clicking never teleports.
    await click('[data-zone="six"]');
    assert.equal((await state()).place,'world');
    assert.equal(await page.locator('.walker.walking').count(),1);
    await settle(()=>!document.querySelector('#rpg-modal').hidden);
    assert.match(await page.locator('#rpg-modal').innerText(),/아직 닫힌 마을/);
    await click('#town-close');
    await reload({...(await state()),worldPos:{x:18,y:40}});

    // Every real entrance, boss, reward, unlock and return uses the shared flow.
    for(let i=0;i<6;i++) {
      await click(`[data-zone="${ids[i]}"]`);
      await settle(()=>JSON.parse(localStorage.getItem('beamrpg.v3')).place==='town');
      assert.equal((await state()).zone,ids[i]);
      assert.equal(await page.locator('#rpg-screen h1').innerText(),names[i]);
      assert.equal(await page.locator('[data-rival],.rpg-npc').count(),0);
      const beforeIdle=await state();await tick(3000);
      assert.equal(await page.evaluate(()=>playing),false,'no encounter while idle');
      assert.deepEqual((await state()).townPos,beforeIdle.townPos);
      if(i===1)await page.screenshot({path:'/tmp/beamrpg-six.png'});
      await click('[data-boss]');
      await settle(()=>playing);
      assert.equal(await page.evaluate(()=>charType),'heebeom');
      assert.equal(await page.evaluate(()=>aiChar),['ajae','sleepy','leesin','percival','jersey','boss'][i]);
      assert.equal(await page.evaluate(()=>aiDif()),['b6','b5','b4','b3','b2','boss'][i]);
      assert.equal(await page.evaluate(()=>rpgOn().level),(await state()).level);
      assert.equal(await page.evaluate(()=>!!rpgOn().stats),true);
      await conclude(true);
      assert.equal((await state()).wins[ids[i]],true);
      assert.match(await page.locator('#rpg-modal').innerText(),new RegExp('경험치 \\+'+xp[i]*2));
      await resolveUpgrades();
      await reload(await state()); // the unlock and chosen growth survive a reload
      await click('[data-return]');
      await settle(()=>JSON.parse(localStorage.getItem('beamrpg.v3')).place==='world');
      assert.equal((await state()).place,'world');
      if(i<5){const p=await page.locator(`[data-zone="${ids[i+1]}"]`).evaluate(n=>({x:parseFloat(n.style.left),y:parseFloat(n.style.top)+15}));await reload({...(await state()),worldPos:p});}
      console.log('PASS',names[i],': boss, reward, unlock, save and return');
    }
    assert.equal(await page.locator('.world-town.locked').count(),0);

    // Random opponents appear after walking, not as moving circles or on idle timers.
    await reload({...(await state()),place:'town',zone:'four',townPos:{x:50,y:82}});
    await page.evaluate(()=>Math.random=()=>0);
    await page.locator('#town-map').click({position:{x:100,y:340}});await tick(100);
    await settle(()=>playing);
    assert.equal(await page.evaluate(()=>rpgOn().boss),false);
    assert.equal(await page.evaluate(()=>rpgOn().zone.id),'four');
    assert.equal(await page.evaluate(()=>aiChar),'percival');
    assert.equal(await page.locator('#cpu-name').innerText(),'왼손 라이벌');
    assert.equal(await page.locator('#character').isVisible(),false);
    await click('#pause');
    assert.equal(await page.locator('#char-pick').isVisible(),false);
    await click('#start');
    const beforeFlee=await state();
    await click('#home');
    assert.equal((await state()).xp,beforeFlee.xp);
    assert.deepEqual((await state()).wins,beforeFlee.wins);
    await click('#town-close');

    // A loss never unlocks a town, and first-time legacy saves keep their progress.
    await reload({level:10,xp:25,stats,wins:{},place:'town',zone:'seven',townPos:{x:50,y:82}});
    await click('[data-boss]');await settle(()=>playing);await conclude(false);
    assert.deepEqual((await state()).wins,{});assert.equal((await state()).xp,25);
    await page.goto(origin+'/__test_seed');
    await page.evaluate(()=>{localStorage.removeItem('beamrpg.v3');localStorage.setItem('beamrpg.v2',JSON.stringify({level:30,xp:42,wins:{seven:true,six:true},stats:{power:4}}));});
    await page.goto(origin);await tick(100);
    assert.equal((await state()).level,30);assert.equal((await state()).stats.power,4);assert.equal((await state()).wins.six,true);

    // Touch-size viewport, tap-to-walk and the held directional controls.
    await page.setViewportSize({width:390,height:844});
    await reload({...(await state()),place:'world',worldPos:{x:18,y:41}});
    await click('[data-zone="seven"]');await settle(()=>JSON.parse(localStorage.getItem('beamrpg.v3')).place==='town');
    await page.screenshot({path:'/tmp/beamrpg-mobile.png'});
    const start=await page.locator('#town-player').evaluate(n=>parseFloat(n.style.left));
    await page.locator('[data-dir="ArrowRight"]').hover();await page.mouse.down();await tick(200);await page.mouse.up();
    assert.ok(await page.locator('#town-player').evaluate(n=>parseFloat(n.style.left))>start);
    assert.deepEqual(errors,[]);
    console.log('PASS random walking encounters, idle safety, flee/loss, migration and mobile controls; no browser errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
