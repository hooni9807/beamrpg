/* Cloud save: Google sign-in + one Firestore doc saves/{uid} in BeamRPG's own project (rules: firestore.rules).
   Firebase is loaded only on devices where someone signed in, so everyone else stays local-only. */
(() => {
  const CONFIG={apiKey:'AIzaSyBTIUSAXRfNM3WEjSam6q3CUcSY09viwMQ',authDomain:'beamrpg-e22ac.firebaseapp.com',projectId:'beamrpg-e22ac',storageBucket:'beamrpg-e22ac.firebasestorage.app',messagingSenderId:'1025506288091',appId:'1:1025506288091:web:081430f5ce9d721840c7fe'};
  const SDK='https://www.gstatic.com/firebasejs/10.12.2/', FLAG='beamrpg.cloud', LABELS={off:'☁ Google 로그인',syncing:'☁ 동기화 중…',saved:'☁ 저장됨',error:'☁ 저장 실패'};
  let lib=null,user=null,status='off',timer=null,hooks=null;
  const flag=on=>{try{on?localStorage.setItem(FLAG,'1'):localStorage.removeItem(FLAG);}catch{}};
  function set(next){status=next;const b=document.getElementById('town-cloud');if(b)b.textContent=LABELS[status];}
  async function load(){
    if(lib)return lib;
    const [app,auth,fs]=await Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore-lite.js'].map(f=>import(SDK+f)));
    const a=app.initializeApp(CONFIG,'beamrpg');lib={auth,fs,au:auth.getAuth(a),db:fs.getFirestore(a)};
    auth.onAuthStateChanged(lib.au,u=>{user=u;flag(!!u);if(u){set('syncing');sync().catch(()=>set('error'));}else set('off');});
    return lib;
  }
  const ref=()=>lib.fs.doc(lib.db,'saves',user.uid);
  // First sign-in on a device with real progress asks which journey to keep; after that the newer cloud revision wins.
  async function sync(){
    const snap=await lib.fs.getDoc(ref()),s=hooks.get(),resetting=(()=>{try{return sessionStorage.getItem('beamrpg.reset')==='1';}catch{return false;}})();
    if(snap.exists()&&!resetting){
      const c=snap.data(),linked=s.cloud?.uid===user.uid,fresh=s.level===1&&!s.xp&&!Object.keys(s.wins||{}).length;
      const take=linked?c.rev>(s.cloud.rev||0):c.rev&&(fresh||confirm(`이 기기 진행(Lv.${s.level})과 Google 계정에 저장된 진행(Lv.${c.level})이 달라요.\n\n확인: 계정 진행 불러오기\n취소: 이 기기 진행으로 계정 덮어쓰기`));
      if(take){const data=JSON.parse(c.data);data.cloud={uid:user.uid,rev:c.rev};localStorage.setItem(hooks.key,JSON.stringify(data));location.reload();return;}
    }
    await push();
    if(resetting)try{sessionStorage.removeItem('beamrpg.reset');}catch{}
  }
  async function push(){
    clearTimeout(timer);timer=null;if(!user)return;
    const s=hooks.get(),rev=Date.now();s.cloud={uid:user.uid,rev};
    try{localStorage.setItem(hooks.key,JSON.stringify(s));}catch{}
    try{await lib.fs.setDoc(ref(),{data:JSON.stringify(s),rev,level:s.level,at:lib.fs.serverTimestamp()});set('saved');}catch{set('error');}
  }
  async function login(){
    set('syncing');
    try{const {auth,au}=await load();await auth.signInWithPopup(au,new auth.GoogleAuthProvider());}
    catch(e){set('off');alert(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e?.code)?'이 브라우저에서는 Google 로그인 창을 열 수 없어요. 카카오톡 같은 앱 안 브라우저라면 크롬이나 사파리에서 열어 주세요.':e?.code==='auth/popup-closed-by-user'?'로그인을 취소했어요.':'Google 로그인에 실패했어요. ('+(e?.code||e)+')');}
  }
  window.BeamCloud={
    attach(h){hooks=h;try{if(localStorage.getItem(FLAG))load().catch(()=>set('error'));}catch{}},
    label:()=>user?`${LABELS[status]} · ${user.displayName||'Google'}`:LABELS[status],
    // every local save schedules one upload; leaving the page flushes it
    queue(){if(user&&!timer)timer=setTimeout(push,8000);},
    toggle(){if(!user)return login();if(confirm('Google 계정에서 로그아웃할까요? 진행은 이 기기에도 남아 있어요.'))push().then(()=>lib.auth.signOut(lib.au));}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer)push();});
})();
