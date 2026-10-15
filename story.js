/* The prologue uses temporary maps; the player's saved journey stays untouched. */
(() => {
  let active = false;
  function play({modal, screen, zones, onFinish}) {
    if (active) return;
    active = true;
    const wasInert = screen.inert, previousFocus = document.activeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seven = zones.find(z => z.id === 'seven'), camp = zones.find(z => z.id === 'camp');
    const chapters = [
      {chapter:'01 · 작은 방, 커다란 초대', title:'희범에게 도착한 편지', speaker:'리그 운영 위원회',
        dialogue:'“당신의 첫 랠리를 기다립니다.” 평범한 아침, 희범의 집에 여덟 마을의 탁구 리그로 향하는 초대장이 도착했다.',
        kind:'interior', facility:'home', zone:seven, focus:{x:450,y:390}, player:{x:450,y:530}, width:1100, height:680, tone:'morning'},
      {chapter:'02 · 첫 번째 라이벌', title:'시작은 7부 마을에서', speaker:'아재범',
        dialogue:'“희범아, 우선 나부터 넘어 봐! 지더라도 다시 오면 돼.” 마을에서 만나는 선수들과 대결하고, 조금씩 실력을 키워 나가자.',
        kind:'town', zone:seven, focus:{x:1120,y:650}, player:{x:1120,y:820}, width:1500, height:1050, tone:'afternoon'},
      {chapter:'03 · 리그의 끝에서', title:'아직 닿지 못한 코트', speaker:'탁구 마왕',
        dialogue:'“7부부터 1부까지… 그 길을 건너온 자를 기다리겠다.” 마지막 목적지 선수촌에는 누구도 쉽게 넘지 못한 상대가 있다.',
        kind:'interior', facility:'gym', zone:camp, focus:{x:512,y:350}, player:{x:512,y:610}, width:1100, height:680, tone:'night'},
      {chapter:'04 · 희범의 첫걸음', title:'작은 승리로, 더 먼 마을로', speaker:'희범',
        dialogue:'“좋아. 한 공씩, 한 마을씩 가 보자!” 집에서 쉬고, 라켓을 고르고, 새로운 기술을 익히며 나만의 리그 이야기를 시작하자.',
        kind:'world', zone:seven, focus:{x:640,y:680}, player:{x:520,y:732}, width:1800, height:1200, tone:'departure'}
    ];
    let index = 0, scene, frame = 0, elapsed = 0, last = 0, disposed = false;
    screen.inert = true;
    modal.classList.add('story-playing');
    modal.setAttribute('aria-labelledby','story-title');
    modal.innerHTML = `<div class="story-scene" data-scene="0">
      <canvas id="story-canvas" aria-hidden="true"></canvas><div class="story-shade"></div>
      <header class="story-top"><div class="story-brand"><span>BEAMRPG</span><small>대환장 파티 · PROLOGUE</small></div><button id="story-skip" type="button">건너뛰기 <span aria-hidden="true">↗</span></button></header>
      <div class="story-letter" aria-hidden="true"><span class="story-letter-mark">B</span><small>리그 참가 초대장</small><strong>수신. 임희범</strong><span>여덟 마을, 한 번의 도전</span><i>당신의 첫 랠리를 기다립니다.</i></div>
      <div class="story-dialogue"><div class="story-copy" aria-live="polite" aria-atomic="true"><div id="story-chapter"></div><h2 id="story-title"></h2><p class="story-speaker" id="story-speaker"></p><p id="story-dialogue"></p></div>
      <footer class="story-bottom"><div class="story-progress"><span id="story-count"></span><div class="story-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div><small>천천히 읽고 다음으로</small></div><div class="story-controls"><button id="story-back" type="button" aria-label="이전 장면">←</button><button id="story-next" type="button">다음 이야기 <span aria-hidden="true">→</span></button></div></footer></div>
    </div>`;
    modal.hidden = false;
    const shell = modal.querySelector('.story-scene'), canvas = modal.querySelector('#story-canvas');
    const context = canvas.getContext('2d');
    const next = modal.querySelector('#story-next'), back = modal.querySelector('#story-back'), skip = modal.querySelector('#story-skip');
    const clamp = (n,min,max) => Math.max(min,Math.min(n,max));

    function draw() {
      if (disposed || !scene || document.hidden) return;
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const w = box.width, h = box.height, dpr = Math.min(window.devicePixelRatio || 1, 2), ch = chapters[index];
      if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
        canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
      }
      const progress = reducedMotion.matches ? 0 : Math.min(elapsed/18000,1);
      const zoom = Math.max(w/ch.width, h*.68/ch.height) * (1+progress*.035);
      const pan = reducedMotion.matches ? 0 : (progress-.5)*44;
      const viewW=w/zoom, viewH=h/zoom;
      const cx=viewW>scene.width?(scene.width-viewW)/2:clamp(ch.focus.x+pan-viewW/2,0,scene.width-viewW);
      const cy=viewH>scene.height?(scene.height-viewH)/2:clamp(ch.focus.y-viewH*.36,0,scene.height-viewH);
      context.setTransform(dpr,0,0,dpr,0,0);context.fillStyle='#122b2c';context.fillRect(0,0,w,h);
      context.setTransform(dpr*zoom,0,0,dpr*zoom,-cx*dpr*zoom,-cy*dpr*zoom);
      BeamMap.draw(context,scene,{player:ch.player,time:elapsed/1000,walking:index===3&&!reducedMotion.matches,direction:index===2?'up':'right',facing:1});
      if (index===1 || index===2) drawRival(context,index===2);
    }
    function drawRival(c,finalBoss) {
      const x=finalBoss?512:1215,y=finalBoss?224:795;
      c.save();c.translate(x,y);
      c.fillStyle='#10272750';c.beginPath();c.ellipse(0,0,29,10,0,0,Math.PI*2);c.fill();
      c.fillStyle=finalBoss?'#20202c':'#455a4a';c.fillRect(-18,-28,13,27);c.fillRect(5,-28,13,27);
      c.fillStyle=finalBoss?'#372a45':'#c29455';c.beginPath();c.roundRect(-26,-67,52,45,12);c.fill();
      c.fillStyle=finalBoss?'#dda692':'#e6bd93';c.beginPath();c.ellipse(0,-87,21,23,0,0,Math.PI*2);c.fill();
      c.fillStyle=finalBoss?'#292335':'#a2a496';c.beginPath();c.ellipse(0,-101,23,12,0,0,Math.PI*2);c.fill();
      c.fillStyle=finalBoss?'#292335':'#55615c';c.fillRect(-17,-92,34,8);
      c.fillStyle=finalBoss?'#f1c5bc':'#4a4d44';c.fillRect(-11,-90,5,3);c.fillRect(6,-90,5,3);
      c.fillStyle=finalBoss?'#e6b770':'#f0de9e';c.fillRect(-3,-63,6,28);
      c.fillStyle='#a58c69';c.fillRect(29,-36,5,20);c.fillStyle=finalBoss?'#ab5468':'#be6554';c.beginPath();c.ellipse(31,-43,12,15,-.3,0,Math.PI*2);c.fill();
      c.restore();
    }
    function tick(now) {
      if (disposed) return;
      elapsed += last ? Math.min(now-last,60) : 0;last=now;draw();
      frame=requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);last=0;
      if (disposed || document.hidden) return;
      draw();if(!reducedMotion.matches) frame=requestAnimationFrame(tick);
    }
    function showChapter() {
      const ch=chapters[index];elapsed=0;last=0;
      scene=BeamMap.createScene({kind:ch.kind,facility:ch.facility,zone:ch.zone,zones,isOpen:()=>true});
      scene.portals=[];
      shell.dataset.scene=String(index);shell.dataset.tone=ch.tone;modal.dataset.scene=String(index);
      modal.querySelector('#story-chapter').textContent=ch.chapter;
      modal.querySelector('#story-title').textContent=ch.title;
      modal.querySelector('#story-speaker').textContent=ch.speaker;
      modal.querySelector('#story-dialogue').textContent=ch.dialogue;
      modal.querySelector('#story-count').textContent=`0${index+1} / 04`;
      modal.querySelectorAll('.story-dots i').forEach((dot,i)=>dot.classList.toggle('current',i===index));
      back.disabled=index===0;
      next.innerHTML=index===chapters.length-1?'희범의 여정 시작하기 <span aria-hidden="true">→</span>':'다음 이야기 <span aria-hidden="true">→</span>';
      next.focus({preventScroll:true});draw();
    }
    function finish() {
      if (disposed) return;
      disposed=true;active=false;cancelAnimationFrame(frame);
      document.removeEventListener('keydown',keydown,true);
      document.removeEventListener('visibilitychange',resume);
      window.removeEventListener('resize',draw);
      reducedMotion.removeEventListener('change',resume);
      modal.classList.remove('story-playing');delete modal.dataset.scene;
      modal.hidden=true;modal.innerHTML='';modal.setAttribute('aria-labelledby','town-dialog-title');
      screen.inert=wasInert;scene=null;
      if(previousFocus?.isConnected&&!previousFocus.closest('[inert]'))previousFocus.focus({preventScroll:true});
      onFinish?.();
    }
    function advance() {if(index===chapters.length-1)finish();else{index++;showChapter();}}
    function keydown(e) {
      if (disposed) return;
      // Capture keeps story keys out of both the map and the underlying rally engine.
      e.stopImmediatePropagation();
      if (e.key==='Escape') {e.preventDefault();finish();}
      else if(e.key==='ArrowRight') {e.preventDefault();if(!e.repeat)advance();}
      else if(e.key==='ArrowLeft') {e.preventDefault();if(!e.repeat&&index){index--;showChapter();}}
      else if(e.key==='Enter'||e.key===' ') {
        e.preventDefault();if(e.repeat)return;
        if(e.target===skip)finish();else if(e.target===back&&!back.disabled){index--;showChapter();}else advance();
      } else if(e.key==='Tab') {
        const buttons=[skip,back,next].filter(b=>!b.disabled),current=buttons.indexOf(document.activeElement);
        e.preventDefault();buttons[(current+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
      } else if(['ArrowUp','ArrowDown','w','a','s','d','W','A','S','D'].includes(e.key)) e.preventDefault();
    }
    next.onclick=advance;skip.onclick=finish;back.onclick=()=>{if(index){index--;showChapter();}};
    document.addEventListener('keydown',keydown,true);
    document.addEventListener('visibilitychange',resume);
    window.addEventListener('resize',draw);
    reducedMotion.addEventListener('change',resume);
    showChapter();resume();
  }
  window.BeamStory={play};
})();
