/* Story scenes use temporary maps; the player's saved journey stays untouched. */
(() => {
  let active = false;
  function play({modal, screen, zones, onFinish, onChoice, mode='intro'}) {
    if (active) return;
    active = true;
    const six=mode==='six';
    const wasInert = screen.inert, previousFocus = document.activeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const seven = zones.find(z => z.id === 'seven'), sixZone=zones.find(z=>z.id==='six'), camp = zones.find(z => z.id === 'camp');
    const chapters = six ? [
      {chapter:'01 · 2024년 10월 16일', title:'7부를 넘어, 6부로', speaker:'임희범',
        dialogue:'2023년 3월에 시작한 펜홀더 여정. 수많은 랠리 끝에 7부 마을을 넘어선 희범이 2024년 10월 16일, 6부 마을로 향한다.',
        kind:'world', zone:sixZone, focus:{x:640,y:680}, player:{x:520,y:732}, width:1800,height:1200,tone:'departure',walking:true},
      {chapter:'02 · 그립의 갈림길', title:'새 라켓, 같은 꿈', speaker:'임희범',
        dialogue:'6부의 관장은 롱핌플 러버를 쓰는 쉐이크핸드 선수다. 희범도 쉐이크핸드로 전환해 백핸드 공격을 배울까? 아니면 백에서 쇼트로 버텨 온 전통 펜홀더 스타일을 이어 갈까? 선택한 라켓에 따라 앞으로 사용할 레벨 기술도 달라진다.',
        kind:'town',zone:sixZone,focus:{x:1120,y:650},player:{x:1120,y:820},width:1500,height:1050,tone:'afternoon',rival:'regular'}
    ] : [
      {chapter:'01 · 2023년 3월', title:'펜홀더 고수의 꿈', speaker:'임희범',
        dialogue:'2023년 3월. 임희범은 펜홀더 고수가 되겠다는 꿈을 품고 라켓을 쥔다. 백에서는 쇼트로 버티고, 빠른 포핸드로 한 공씩 길을 연다.',
        kind:'interior', facility:'home', zone:seven, focus:{x:450,y:390}, player:{x:450,y:530}, width:1100, height:680, tone:'morning'},
      {chapter:'02 · 첫 번째 마을', title:'7부 마을에서 출발', speaker:'아재범',
        dialogue:'“희범아, 우선 나부터 넘어 봐!” 마을에서 상대를 만나 기술을 겨루고, 탁구장 보스에게 도전하며 펜홀더 실력을 키우자.',
        kind:'town', zone:seven, focus:{x:1120,y:650}, player:{x:1120,y:820}, width:1500, height:1050, tone:'afternoon',rival:'regular'},
      {chapter:'03 · 리그의 끝에서', title:'아직 닿지 못한 코트', speaker:'탁구 마왕',
        dialogue:'“7부부터 1부까지… 그 길을 건너온 자를 기다리겠다.” 마지막 목적지 선수촌에는 누구도 쉽게 넘지 못한 상대가 있다.',
        kind:'interior', facility:'gym', zone:camp, focus:{x:512,y:350}, player:{x:512,y:610}, width:1100, height:680, tone:'night',rival:'boss',direction:'up'},
      {chapter:'04 · 희범의 첫걸음', title:'작은 승리로, 더 먼 마을로', speaker:'희범',
        dialogue:'“좋아. 한 공씩, 한 마을씩 가 보자!” 희범은 펜홀더 라켓을 챙기고 집 문을 나선다. 이제 그의 탁구 여정이 시작된다.',
        kind:'world', zone:seven, focus:{x:640,y:680}, player:{x:520,y:732}, width:1800, height:1200, tone:'departure',walking:true}
    ];
    let index = 0, scene, frame = 0, elapsed = 0, last = 0, disposed = false;
    screen.inert = true;
    modal.classList.add('story-playing');modal.dataset.mode=mode;
    modal.setAttribute('aria-labelledby','story-title');
    modal.innerHTML = `<div class="story-scene" data-scene="0">
      <canvas id="story-canvas" aria-hidden="true"></canvas><div class="story-shade"></div>
      <header class="story-top"><div class="story-brand"><span>BEAMRPG</span><small>대환장 파티 · ${six?'2024년 10월 16일':'2023년 3월'}</small></div><button id="story-skip" type="button">${six?'선택으로 이동':'건너뛰기'} <span aria-hidden="true">↗</span></button></header>
      <div class="story-letter" aria-hidden="true"><span class="story-letter-mark">B</span><small>${six?'2024년 10월 16일':'2023년 3월'}</small><strong>${six?'그립의 갈림길':'임희범의 첫 기록'}</strong><span>${six?'7부를 넘어 6부로':'펜홀더 고수의 꿈'}</span><i>${six?'다음 랠리는 어떤 라켓과 함께할까?':'한 공씩, 탁구 여정을 시작하다.'}</i></div>
      <div class="story-dialogue"><div class="story-copy" aria-live="polite" aria-atomic="true"><div id="story-chapter"></div><h2 id="story-title"></h2><p class="story-speaker" id="story-speaker"></p><p id="story-dialogue"></p></div>
      <footer class="story-bottom"><div class="story-progress"><span id="story-count"></span><div class="story-dots" aria-hidden="true">${chapters.map(()=>'<i></i>').join('')}</div><small>천천히 읽고 다음으로</small></div><div class="story-controls"><button id="story-back" type="button" aria-label="이전 장면">←</button><button id="story-next" type="button">다음 이야기 <span aria-hidden="true">→</span></button>${six?'<button id="story-keep" type="button" hidden>펜홀더 유지</button><button id="story-shake" type="button" hidden>쉐이크로 전환</button>':''}</div></footer></div>
    </div>`;
    modal.hidden = false;
    const shell = modal.querySelector('.story-scene'), canvas = modal.querySelector('#story-canvas');
    const context = canvas.getContext('2d');
    const next = modal.querySelector('#story-next'), back = modal.querySelector('#story-back'), skip = modal.querySelector('#story-skip');
    const keep=modal.querySelector('#story-keep'), shake=modal.querySelector('#story-shake');
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
      BeamMap.draw(context,scene,{player:ch.player,time:elapsed/1000,walking:!!ch.walking&&!reducedMotion.matches,direction:ch.direction||'right',facing:1});
      if (ch.rival) drawRival(context,ch.rival==='boss');
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
      modal.querySelector('#story-count').textContent=`0${index+1} / 0${chapters.length}`;
      modal.querySelectorAll('.story-dots i').forEach((dot,i)=>dot.classList.toggle('current',i===index));
      back.disabled=index===0;
      const choosing=six&&index===chapters.length-1;
      next.hidden=choosing;skip.hidden=choosing;if(keep)keep.hidden=!choosing;if(shake)shake.hidden=!choosing;
      next.innerHTML=!six&&index===chapters.length-1?'희범의 여정 시작하기 <span aria-hidden="true">→</span>':'다음 이야기 <span aria-hidden="true">→</span>';
      (choosing?keep:next).focus({preventScroll:true});draw();
    }
    function finish(choice) {
      if (disposed || (six&&!['shake','cpen'].includes(choice))) return;
      disposed=true;active=false;cancelAnimationFrame(frame);
      document.removeEventListener('keydown',keydown,true);
      document.removeEventListener('visibilitychange',resume);
      window.removeEventListener('resize',draw);
      reducedMotion.removeEventListener('change',resume);
      modal.classList.remove('story-playing');delete modal.dataset.scene;delete modal.dataset.mode;
      modal.hidden=true;modal.innerHTML='';modal.setAttribute('aria-labelledby','town-dialog-title');
      screen.inert=wasInert;scene=null;
      if(previousFocus?.isConnected&&!previousFocus.closest('[inert]'))previousFocus.focus({preventScroll:true});
      if(six)onChoice?.(choice);else onFinish?.();
    }
    function advance() {if(index===chapters.length-1){if(!six)finish();}else{index++;showChapter();}}
    function skipStory(){if(six){index=chapters.length-1;showChapter();}else finish();}
    function keydown(e) {
      if (disposed) return;
      // Capture keeps story keys out of both the map and the underlying rally engine.
      e.stopImmediatePropagation();
      if (e.key==='Escape') {e.preventDefault();skipStory();}
      else if(e.key==='ArrowRight') {e.preventDefault();if(!e.repeat)advance();}
      else if(e.key==='ArrowLeft') {e.preventDefault();if(!e.repeat&&index){index--;showChapter();}}
      else if(e.key==='Enter'||e.key===' ') {
        e.preventDefault();if(e.repeat)return;
        if(e.target===shake)finish('shake');else if(e.target===keep)finish('cpen');else if(e.target===skip)skipStory();else if(e.target===back&&!back.disabled){index--;showChapter();}else advance();
      } else if(e.key==='Tab') {
        const buttons=[skip,back,next,keep,shake].filter(b=>b&&!b.disabled&&!b.hidden),current=buttons.indexOf(document.activeElement);
        e.preventDefault();buttons[(current+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
      } else if(['ArrowUp','ArrowDown','w','a','s','d','W','A','S','D'].includes(e.key)) e.preventDefault();
    }
    next.onclick=advance;skip.onclick=skipStory;back.onclick=()=>{if(index){index--;showChapter();}};
    if(keep)keep.onclick=()=>finish('cpen');if(shake)shake.onclick=()=>finish('shake');
    document.addEventListener('keydown',keydown,true);
    document.addEventListener('visibilitychange',resume);
    window.addEventListener('resize',draw);
    reducedMotion.addEventListener('change',resume);
    showChapter();resume();
  }
  window.BeamStory={play,playSix:options=>play({...options,mode:'six'})};
})();
