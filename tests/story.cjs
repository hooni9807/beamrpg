const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.setContent('<style>body{margin:0}.rpg-modal{position:fixed;inset:0;display:grid}.rpg-modal[hidden]{display:none}</style><section id="screen"></section><section id="rpg-modal" class="rpg-modal" hidden></section>');
    await page.addStyleTag({path:path.resolve(__dirname,'../story.css')});
    await page.evaluate(()=>{
      window.BeamMap={createScene:()=>({width:1800,height:1200,portals:[]}),draw:()=>{}};
      window.storyChoices=[];window.introFinishes=0;
      window.storyOptions={modal:document.querySelector('#rpg-modal'),screen:document.querySelector('#screen'),zones:[{id:'seven'},{id:'six'},{id:'camp'}]};
    });
    await page.addScriptTag({path:path.resolve(__dirname,'../story.js')});
    await page.evaluate(()=>BeamStory.play({...storyOptions,onFinish:()=>introFinishes++}));
    assert.match(await page.locator('#story-chapter').innerText(),/2023년 3월/);
    assert.match(await page.locator('#story-dialogue').innerText(),/펜홀더 고수/);
    await page.locator('#story-skip').click();
    assert.equal(await page.evaluate(()=>introFinishes),1);
    assert.equal(await page.evaluate(()=>storyOptions.screen.inert),false);
    await page.evaluate(()=>BeamStory.playSix({...storyOptions,onChoice:choice=>storyChoices.push(choice)}));
    assert.match(await page.locator('#story-chapter').innerText(),/2024년 10월 16일/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#story-next').isVisible(),false);
    assert.equal(await page.locator('#story-shake').isVisible(),true);
    assert.equal(await page.evaluate(()=>storyOptions.screen.inert),true,'skipping still requires a racket choice');
    assert.equal(await page.evaluate(()=>document.querySelector('.story-scene').scrollWidth<=innerWidth),true);
    await page.screenshot({path:'/tmp/beamrpg-six-story-mobile.png'});
    await page.setViewportSize({width:320,height:568});
    assert.equal(await page.evaluate(()=>document.querySelector('.story-scene').scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>document.querySelector('#story-shake').getBoundingClientRect().bottom<=innerHeight),true);
    await page.locator('#story-shake').click();
    assert.deepEqual(await page.evaluate(()=>storyChoices),['shake']);
    assert.equal(await page.evaluate(()=>storyOptions.screen.inert),false);
    await page.evaluate(()=>BeamStory.playSix({...storyOptions,onChoice:choice=>storyChoices.push(choice)}));
    await page.locator('#story-next').click();
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>storyChoices),['shake','jpen']);
    assert.deepEqual(errors,[]);
    console.log('PASS: dated prologue, mandatory 6부 racket choice, keyboard and mobile layout.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
