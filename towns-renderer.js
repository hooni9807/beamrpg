/* Original canvas artwork for BeamRPG's walkable villages. Coordinates are world pixels. */
(() => {
  const TAU = Math.PI * 2;
  const themes = {
    seven: {grass:'#7caa70', dark:'#486e50', leaf:'#50875b', light:'#81b06b', roof:'#bd6854', trim:'#e8bc81', water:'#61aeb2', flower:'#f1d274'},
    six:   {grass:'#9bab68', dark:'#627448', leaf:'#95974c', light:'#c0b669', roof:'#a66c46', trim:'#eed2a3', water:'#76a9a6', flower:'#edb55f'},
    five:  {grass:'#a6a373', dark:'#687d55', leaf:'#a27050', light:'#ce9b63', roof:'#a95446', trim:'#eac39b', water:'#65a3ac', flower:'#ef9473'},
    four:  {grass:'#899b8b', dark:'#536c69', leaf:'#737c92', light:'#a2a5b0', roof:'#786689', trim:'#d4c5d5', water:'#73a9b6', flower:'#ceb5e2'},
    three: {grass:'#80a69b', dark:'#486f6c', leaf:'#4a8480', light:'#81b5a0', roof:'#4e7e94', trim:'#d4ded0', water:'#60a5bd', flower:'#f1d98c'},
    two:   {grass:'#86a29a', dark:'#4c6e6e', leaf:'#487c7b', light:'#80aaa3', roof:'#527c84', trim:'#d2d7bf', water:'#6aadc6', flower:'#ddbaea'},
    one:   {grass:'#a6ab86', dark:'#657457', leaf:'#6b8860', light:'#a5b67d', roof:'#6b7892', trim:'#f0d49a', water:'#6babb8', flower:'#f7da8a'},
    camp:  {grass:'#8ca38f', dark:'#526d62', leaf:'#486e68', light:'#8da88c', roof:'#725879', trim:'#e5c6a1', water:'#719cae', flower:'#e8aec2'}
  };
  const facilityNames = {home:'희범의 집', shop:'라켓 공방', forge:'탁구채 강화소', cafe:'랠리 카페', training:'트레이닝 센터', clinic:'치유 센터', hall:'리그 기념관', gym:'리그 체육관', park:'마을 공원'};
  const serviceNames = {home:'침대에서 푹 쉬기', shop:'라켓 살펴보기', forge:'장비 강화하기', cafe:'샌드위치 주문하기', training:'훈련 시작하기', clinic:'HP·PP 회복하기', hall:'리그 기록 보기', gym:'보스에게 도전', park:'공원에서 쉬어가기'};
  const rect = (c,x,y,w,h,color) => {c.fillStyle=color;c.fillRect(x,y,w,h);};
  const ellipse = (c,x,y,rx,ry,color) => {c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
  function poly(c,points,color) {c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function line(c,x1,y1,x2,y2,color,width=2) {c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function round(c,x,y,w,h,r,color) {c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function text(c,value,x,y,size=18,color='#fff7df',align='center') {c.font=`700 ${size}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(value,x,y);}
  function label(c,value,x,y,color='#fff0d0',size=18) {
    c.font=`700 ${size}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
    const w=c.measureText(value).width+28;
    round(c,x-w/2,y-18,w,36,9,'#243b39e8');rect(c,x-w/2+9,y-18,w-18,2,'#f1d6a08a');text(c,value,x,y,size,color);
  }
  function seeded(seed) {let n=seed;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
  function object(scene,type,x,y,w,h,extra={}) {const o={type,x,y,w,h,...extra};scene.objects.push(o);return o;}
  function obstacle(scene,x,y,w,h) {scene.obstacles.push({x,y,w,h});}
  function portal(scene,id,labelText,action,value,x,y,extra={}) {scene.portals.push({id,label:labelText,action,value,x,y,radius:30,...extra});}
  function road(scene,x,y,w,h,kind='stone') {scene.roads.push({x,y,w,h,kind});}
  function tree(scene,x,y,size=1,variant=0) {
    const w=96*size,h=144*size;
    object(scene,'tree',x-w/2,y-h,w,h,{variant});
    obstacle(scene,x-14*size,y-18*size,28*size,25*size);
  }
  function flowerbed(scene,x,y,w,h,color) {scene.beds.push({x,y,w,h,color});}
  function bush(scene,x,y,w,h) {scene.bushes.push({x,y,w,h,encounterChance:.95});}
  function bench(scene,x,y,rotation=0) {object(scene,'bench',x,y,96,48,{rotation});obstacle(scene,x+8,y+12,80,28);}
  function lamp(scene,x,y) {object(scene,'lamp',x-16,y-108,32,108);}
  function building(scene,facility,x,y,w,h,labelText,extra={}) {
    object(scene,'building',x,y,w,h,{facility,label:labelText,...extra});
    obstacle(scene,x,y,w,h);
    const px=x+w/2,py=y+h+64;
    portal(scene,facility,labelText,'facility',facility,px,py);
    road(scene,px-48,y+h,96,112,'brick');
  }
  function borderTrees(scene,seed) {
    const random=seeded(seed);
    for(let x=80;x<scene.width;x+=112) {
      if(Math.abs(x-scene.width/2)>150) tree(scene,x,112+random()*28,.85+random()*.25,Math.floor(random()*3));
      if(Math.abs(x-scene.width/2)>175) tree(scene,x,scene.height-40-random()*18,.9+random()*.25,Math.floor(random()*3));
    }
    for(let y=256;y<scene.height-160;y+=128) {tree(scene,64+random()*30,y,.9+random()*.2,Math.floor(random()*3));tree(scene,scene.width-64-random()*30,y,.9+random()*.2,Math.floor(random()*3));}
  }
  function makeWorld(scene,zones,isOpen) {
    scene.width=2560;scene.height=1920;scene.spawn={x:320,y:816};scene.title='희범의 리그 월드';scene.subtitle='여덟 마을을 잇는 작은 여행';
    road(scene,1184,112,192,1680);road(scene,256,656,2048,128);road(scene,256,1360,2048,128);
    scene.water.push({x:64,y:848,w:2432,h:160,river:true});
    obstacle(scene,0,864,1184,128);obstacle(scene,1376,864,1184,128);
    scene.bridges.push({x:1184,y:824,w:192,h:208,vertical:true});
    scene.plazas.push({x:1056,y:1568,w:448,h:224});
    zones.forEach((z,i)=>{
      const cx=320+(i%4)*640, bottom=i<4?592:1296, w=288,h=224;
      const unlocked=isOpen(z),palette=themes[z.id]||themes.seven;
      road(scene,cx-48,bottom,96,112,'brick');
      object(scene,'building',cx-w/2,bottom-h,w,h,{facility:i===7?'gym':'hall',label:z.name,roof:palette.roof,trim:palette.trim,locked:!unlocked,world:true,number:z.id==='camp'?'★':z.name.replace(/[^0-9]/g,'')});
      obstacle(scene,cx-w/2,bottom-h,w,h);
      portal(scene,z.id,z.name,'zone',z.id,cx,bottom+64,{locked:!unlocked});
      object(scene,'sign',cx+192,bottom+4,112,72,{label:unlocked?`Lv.${z.level} 추천`:'리그 잠김',small:true});
      flowerbed(scene,cx-w/2-48,bottom-96,32,128,palette.flower);flowerbed(scene,cx+w/2+16,bottom-96,32,128,palette.flower);
      tree(scene,cx-210,bottom-84,.95,i%3);tree(scene,cx+200,bottom-220,1.08,i%3);
      lamp(scene,cx-104,bottom+96);lamp(scene,cx+104,bottom+96);
    });
    object(scene,'sign',1168,1584,224,96,{label:'BEAMRPG',sub:'대환장 파티 · 리그 안내'});
    for(const x of [608,1888]) {bench(scene,x,1600);flowerbed(scene,x-48,1704,192,48,'#e5b97d');tree(scene,x-48,1696,1.3,1);tree(scene,x+160,1760,1.1);}
    borderTrees(scene,84);
    scene.decor.push({type:'route',x:1280,y:804,label:'리그 브리지'},{type:'route',x:1280,y:1518,label:'첫걸음 광장'});
  }
  function makeTown(scene,z) {
    scene.width=2240;scene.height=1600;scene.spawn={x:1120,y:1376};scene.title=z.name;scene.subtitle='골목마다 새로운 이야기가 시작됩니다';
    road(scene,1024,96,192,1408);road(scene,240,512,1760,128);road(scene,240,1088,1760,128);
    scene.plazas.push({x:896,y:448,w:448,h:352},{x:960,y:1280,w:320,h:256});
    building(scene,'home',192,224,256,224,z.home||'희범의 집');
    building(scene,'shop',672,224,256,224,'라켓 공방');
    building(scene,'cafe',1312,224,256,224,'랠리 카페');
    building(scene,'forge',1600,224,160,224,'탁구채 강화소');
    building(scene,'clinic',1792,224,256,224,'치유 센터');
    building(scene,'training',160,832,320,224,'트레이닝 센터');
    building(scene,'hall',656,832,288,224,'리그 기념관');
    building(scene,'gym',1264,800,352,256,z.gym||'리그 체육관');
    object(scene,'garden',1760,816,320,240,{label:z.park||'마을 공원'});obstacle(scene,1792,832,256,224);
    road(scene,1872,1056,96,96,'brick');portal(scene,'park',z.park||'마을 공원','facility','park',1920,1120);
    object(scene,'fountain',1056,576,128,128);obstacle(scene,1056,576,128,128);
    scene.water.push({x:1078,y:603,w:84,h:68,fountain:true});
    object(scene,'questNpc',1094,882,52,78,{label:'의뢰인 나래'});
    portal(scene,'quest','의뢰인 나래 · 마을 의뢰','quest',z.id,1120,1008);
    for(const [x,y,w,h] of [[464,640,208,80],[1568,640,208,80],[688,1224,208,80],[1344,1224,208,80]])bush(scene,x,y,w,h);
    flowerbed(scene,912,464,128,48,scene.palette.flower);flowerbed(scene,1200,464,128,48,scene.palette.flower);
    bench(scene,912,704);bench(scene,1232,704);
    portal(scene,'return','마을 귀환','return',null,1120,1472);
    object(scene,'arch',1024,1416,192,112,{label:'마을 귀환'});
    for(const x of [320,800,1440,1920]) {
      lamp(scene,x-96,576);lamp(scene,x+96,576);lamp(scene,x-96,1184);lamp(scene,x+96,1184);
      flowerbed(scene,x-144,656,128,48,scene.palette.flower);flowerbed(scene,x+16,656,128,48,'#f2e0ae');
      bench(scene,x-48,1312);
    }
    for(const [x,y,s] of [[528,384,1.2],[592,752,1],[1104,304,.95],[1752,1360,1.15],[2080,752,1],[192,752,1.1],[528,1008,1],[608,1376,1.1],[1632,1376,1.15],[2080,1360,1],[144,1408,1.25]]) tree(scene,x,y,s,z.level%3);
    scene.decor.push({type:'picnic',x:320,y:1440},{type:'picnic',x:1872,y:1440});
    object(scene,'sign',1320,1312,160,88,{label:z.name,sub:'휴식 · 훈련 · 다음 승부'});
    if(z.id==='two') {
      scene.water.push({x:112,y:728,w:2016,h:80,river:true});
      obstacle(scene,112,736,912,64);obstacle(scene,1216,736,912,64);
      scene.bridges.push({x:1024,y:704,w:192,h:128,vertical:true});
      object(scene,'sign',832,736,160,72,{label:'물빛 운하',sub:'CANAL WALK'});
    }
    if(z.id==='one') {
      scene.plazas.push({x:704,y:1248,w:832,h:224});
      for(const x of [784,1376]) {object(scene,'statue',x,1256,80,96);obstacle(scene,x,1320,80,32);}
      for(const x of [960,1216])object(scene,'banner',x,1280,64,128,{label:'ROYAL'});
      flowerbed(scene,736,1456,224,32,'#f0d48b');flowerbed(scene,1280,1456,224,32,'#f0d48b');
    }
    borderTrees(scene,67+z.level);
  }
  function furniture(scene,type,x,y,w,h,extra={}) {object(scene,type,x,y,w,h,extra);obstacle(scene,x,y,w,h);}
  function makeInterior(scene,z,facility) {
    scene.width=1024;scene.height=768;scene.spawn={x:512,y:608};scene.title=facility==='home'?(z.home||facilityNames.home):facility==='gym'?(z.gym||facilityNames.gym):facilityNames[facility];scene.subtitle=z.name+' · '+scene.title;scene.facility=facility;
    obstacle(scene,0,0,1024,192);obstacle(scene,0,192,80,576);obstacle(scene,944,192,80,576);obstacle(scene,80,704,864,64);
    portal(scene,'return','마을로 나가기','return',null,512,672);
    let service={x:512,y:368};
    if(facility==='home') {
      furniture(scene,'bed',128,224,160,192);furniture(scene,'shelf',128,128,224,64,{books:true});
      furniture(scene,'kitchen',672,192,224,96);furniture(scene,'table',704,416,128,96,{meal:true});
      furniture(scene,'sofa',160,512,192,80);furniture(scene,'cabinet',448,192,160,80,{trophy:true});
      object(scene,'rug',384,416,224,144,{color:'#b37764',flat:true});service={x:352,y:352};
      object(scene,'plant',848,576,48,72);object(scene,'wallArt',416,80,192,96,{label:'HEEBEOM',sub:'오늘도 한 걸음'});
    } else if(facility==='shop'||facility==='forge') {
      furniture(scene,'counter',288,224,448,96,{shop:true});
      furniture(scene,'racketRack',128,400,128,160);furniture(scene,'racketRack',768,400,128,160);
      furniture(scene,'shelf',128,128,192,64,{balls:true});furniture(scene,'shelf',704,128,192,64,{balls:true});
      object(scene,'rug',352,432,320,128,{color:'#718d83',flat:true});object(scene,'wallArt',416,80,192,96,{label:facility==='forge'?'UPGRADE LAB':'RACKET LAB',sub:facility==='forge'?'한 번 더 단단하게':'나에게 맞는 한 자루'});
    } else if(facility==='cafe') {
      furniture(scene,'counter',640,224,256,96,{coffee:true});
      furniture(scene,'table',160,288,144,96,{coffee:true});furniture(scene,'table',160,480,144,96,{coffee:true});furniture(scene,'table',416,416,144,96,{coffee:true});
      furniture(scene,'sofa',128,208,208,64);object(scene,'plant',848,544,64,96);service={x:768,y:368};
      object(scene,'wallArt',384,80,256,96,{label:'SLOW MORNING',sub:'잠깐 쉬어도 괜찮아'});
    } else if(facility==='training') {
      furniture(scene,'court',144,256,288,176);furniture(scene,'court',592,256,288,176);
      furniture(scene,'bench',128,512,160,48);furniture(scene,'bench',736,512,160,48);
      furniture(scene,'racketRack',128,192,96,48);furniture(scene,'racketRack',800,192,96,48);
      object(scene,'wallArt',384,80,256,96,{label:'PRACTICE MAKES',sub:'한 번 더, 조금 더 정확하게'});service={x:512,y:464};
    } else if(facility==='clinic') {
      furniture(scene,'bed',128,256,192,96,{clinic:true});furniture(scene,'bed',128,448,192,96,{clinic:true});
      furniture(scene,'bed',704,256,192,96,{clinic:true});furniture(scene,'bed',704,448,192,96,{clinic:true});
      furniture(scene,'counter',416,224,192,80,{clinic:true});object(scene,'wallArt',416,80,192,96,{label:'RECOVERY',sub:'몸도 마음도 충전'});
    } else if(facility==='hall') {
      furniture(scene,'cabinet',128,224,192,112,{trophy:true});furniture(scene,'cabinet',704,224,192,112,{trophy:true});
      furniture(scene,'cabinet',128,448,192,112,{trophy:true});furniture(scene,'cabinet',704,448,192,112,{trophy:true});
      furniture(scene,'counter',416,224,192,80,{hall:true});object(scene,'rug',384,384,256,224,{color:'#a96e5a',flat:true});
      object(scene,'wallArt',384,80,256,96,{label:'HALL OF RALLIES',sub:'작은 승리들이 모이는 곳'});
    } else {
      furniture(scene,'court',256,240,512,256,{champion:true});
      furniture(scene,'bench',128,512,144,48);furniture(scene,'bench',752,512,144,48);
      object(scene,'banner',128,208,64,208,{label:'BEAM'});object(scene,'banner',832,208,64,208,{label:'RPG'});
      object(scene,'wallArt',352,72,320,104,{label:z.boss,sub:'CHAMPION COURT'});service={x:512,y:560};
    }
    portal(scene,'service',serviceNames[facility]||'이용하기','service',facility,service.x,service.y);
  }
  function makePark(scene,z) {
    scene.width=1792;scene.height=1280;scene.spawn={x:896,y:1088};scene.title=z.park||'마을 공원';scene.subtitle='초록빛 산책로와 느긋한 오후';
    road(scene,800,96,192,1088,'brick');road(scene,288,384,1152,96,'brick');road(scene,256,896,1280,128,'brick');road(scene,1328,416,96,544,'brick');
    scene.plazas.push({x:736,y:640,w:320,h:256});
    scene.water.push({x:128,y:224,w:512,h:384,pond:true});
    obstacle(scene,128,224,512,160);obstacle(scene,128,480,512,128);
    scene.bridges.push({x:112,y:384,w:544,h:96});
    furniture(scene,'court',1152,672,416,192,{outdoor:true});
    object(scene,'gazebo',224,704,256,160);obstacle(scene,256,736,192,128);
    object(scene,'garden',1120,224,448,256,{label:'계절의 꽃밭',noLabel:true});obstacle(scene,1152,224,384,128);
    for(const x of [224,480,1184,1440]) {bench(scene,x,1024);lamp(scene,x+128,992);}
    flowerbed(scene,736,656,48,192,scene.palette.flower);flowerbed(scene,1008,656,48,192,'#f6d99b');
    object(scene,'sign',1120,496,192,96,{label:'피크닉 가든',sub:'천천히 걷는 오후'});
    scene.decor.push({type:'picnic',x:1344,y:544},{type:'picnic',x:416,y:1088});
    portal(scene,'service','공원 벤치 · 쉬어가기','service','park',896,784);
    object(scene,'arch',800,1128,192,112,{label:'마을로 돌아가기'});portal(scene,'return','마을로 돌아가기','return',null,896,1184);
    for(const [x,y,s] of [[736,336,1.2],[704,592,1],[256,688,1.2],[608,768,1.3],[1088,624,1],[1600,608,1.2],[1632,1024,1.2]])tree(scene,x,y,s,z.level%3);
    borderTrees(scene,156+z.level);
  }
  function createScene({kind,zone,zones=[],isOpen=()=>true,facility='home'}) {
    const z=zone||zones[0]||{id:'seven',name:'7부 마을',level:1,boss:'아재범'};
    const scene={kind,zone:z,palette:themes[z.id]||themes.seven,portals:[],obstacles:[],objects:[],roads:[],plazas:[],water:[],bridges:[],beds:[],bushes:[],decor:[]};
    if(kind==='world')makeWorld(scene,zones,isOpen);else if(kind==='park')makePark(scene,z);else if(kind==='interior')makeInterior(scene,z,facility);else makeTown(scene,z);
    return scene;
  }

  function drawGrass(c,scene) {
    const p=scene.palette,r=seeded(scene.width+scene.zone.level*23);
    rect(c,0,0,scene.width,scene.height,p.grass);
    for(let y=0;y<scene.height;y+=32)for(let x=0;x<scene.width;x+=32) {
      const shade=r();rect(c,x,y,32,32,shade>.5?'#ffffff03':'#10291a04');
      if(shade>.56) {const gx=x+5+r()*24,gy=y+5+r()*24;line(c,gx,gy,gx-3,gy-4,p.dark+'55',1.5);line(c,gx,gy,gx+3,gy-5,p.dark+'55',1.5);}
      if(shade>.95) {rect(c,x+8,y+14,3,3,'#f6edbe88');rect(c,x+10,y+17,2,2,p.light);}
    }
    rect(c,0,0,scene.width,24,p.dark);rect(c,0,0,24,scene.height,p.dark);rect(c,scene.width-24,0,24,scene.height,p.dark);rect(c,0,scene.height-24,scene.width,24,p.dark);
  }
  function drawPaving(c,r) {
    round(c,r.x-10,r.y-10,r.w+20,r.h+20,18,'#52665038');
    round(c,r.x-5,r.y-5,r.w+10,r.h+10,13,'#b5ae8f');
    round(c,r.x,r.y,r.w,r.h,10,r.kind==='brick'?'#cdbda0':'#ded0b1');
    c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,10);c.clip();
    const tile=r.kind==='brick'?24:40;
    for(let y=r.y;y<r.y+r.h;y+=tile)for(let x=r.x-(Math.floor((y-r.y)/tile)%2)*tile/2;x<r.x+r.w;x+=tile*1.5) {
      line(c,x,y,x+tile*1.5,y,'#867e6630',1);line(c,x,y,x,y+tile,'#867e6630',1);
      line(c,x+2,y+2,x+tile*1.5-2,y+2,'#fff7dc33',1);
    }
    c.restore();
  }
  function drawWater(c,w,p) {
    c.save();
    if(w.pond) {ellipse(c,w.x+w.w/2,w.y+w.h/2,w.w/2+18,w.h/2+18,'#aeb38c');ellipse(c,w.x+w.w/2,w.y+w.h/2,w.w/2+8,w.h/2+8,'#dae0b8');c.beginPath();c.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2,w.h/2,0,0,TAU);}
    else {round(c,w.x-8,w.y-8,w.w+16,w.h+16,w.fountain?35:28,'#aeb6a3');c.beginPath();c.roundRect(w.x,w.y,w.w,w.h,w.fountain?30:24);}
    c.clip();const g=c.createLinearGradient(w.x,w.y,w.x,w.y+w.h);g.addColorStop(0,'#4b8994');g.addColorStop(.45,p.water);g.addColorStop(1,'#86bdbe');c.fillStyle=g;c.fillRect(w.x,w.y,w.w,w.h);
    for(let y=w.y+14;y<w.y+w.h;y+=26)for(let x=w.x+12+((y-w.y)%52);x<w.x+w.w;x+=70)line(c,x,y,x+24,y,'#d4f3dc35',2);
    if(w.pond)for(const [dx,dy] of [[.2,.3],[.76,.68],[.68,.24],[.3,.8]]) {ellipse(c,w.x+w.w*dx,w.y+w.h*dy,13,6,'#76a678');ellipse(c,w.x+w.w*dx+3,w.y+w.h*dy-2,4,3,'#f5c9cc');}
    c.restore();
  }
  function drawBridge(c,b) {
    round(c,b.x+8,b.y+12,b.w,b.h,6,'#183d3540');rect(c,b.x,b.y,b.w,b.h,'#9d7757');
    if(b.vertical) {
      for(let y=b.y;y<b.y+b.h;y+=18) {rect(c,b.x+10,y+2,b.w-20,15,'#bd9b72');line(c,b.x+16,y+5,b.x+b.w-20,y+5,'#ddbc8d',1);}
      for(const x of [b.x,b.x+b.w-10]){rect(c,x,b.y-4,10,b.h+8,'#675a48');rect(c,x-4,b.y-10,18,24,'#d6c4a0');rect(c,x-4,b.y+b.h-16,18,24,'#d6c4a0');}
    } else {
      for(let x=b.x;x<b.x+b.w;x+=18) {rect(c,x+2,b.y+8,15,b.h-16,'#bd9b72');line(c,x+5,b.y+12,x+5,b.y+b.h-12,'#ddbc8d',1);}
      rect(c,b.x,b.y-6,b.w,10,'#79634c');rect(c,b.x,b.y+b.h-3,b.w,10,'#79634c');
      for(let x=b.x;x<b.x+b.w;x+=64){rect(c,x,b.y-18,12,26,'#d3b88f');rect(c,x,b.y+b.h-14,12,26,'#d3b88f');}
    }
  }
  function drawFlowerbed(c,b,p) {
    round(c,b.x-3,b.y-3,b.w+6,b.h+6,8,'#a49370');round(c,b.x,b.y,b.w,b.h,6,'#56764f');
    const r=seeded(b.x+b.y);
    for(let y=b.y+10;y<b.y+b.h-5;y+=17)for(let x=b.x+10;x<b.x+b.w-5;x+=17) {
      const px=x+r()*5,py=y+r()*4;
      ellipse(c,px,py+3,7,5,p.leaf);for(let i=0;i<4;i++)ellipse(c,px+Math.cos(i*TAU/4)*3,py+Math.sin(i*TAU/4)*3,3,3,b.color||p.flower);ellipse(c,px,py,2,2,'#f8e6a3');
    }
  }
  function drawBush(c,b,p) {
    round(c,b.x-5,b.y-5,b.w+10,b.h+10,14,'#315640');round(c,b.x,b.y,b.w,b.h,11,'#467651');
    const r=seeded(b.x+b.y);
    for(let y=b.y+13;y<b.y+b.h-4;y+=19)for(let x=b.x+12;x<b.x+b.w-4;x+=21) {
      const xx=x+r()*8,yy=y+r()*6;
      ellipse(c,xx,yy+3,13,7,p.dark);ellipse(c,xx-3,yy-3,10,7,p.leaf);
      line(c,xx,yy,xx-4,yy-9,p.light,2);line(c,xx,yy,xx+5,yy-8,p.light,2);
    }
    label(c,'야생 부쉬',b.x+b.w/2,b.y-20,'#eef9d6',13);
  }
  function drawInteriorFloor(c,scene) {
    const f=scene.facility,clinic=f==='clinic',sports=f==='gym'||f==='training';
    rect(c,0,0,1024,768,'#253939');round(c,48,48,928,688,20,'#182b2b');rect(c,64,64,896,640,'#b8a17e');
    rect(c,80,192,864,512,clinic?'#e4e4cd':sports?'#b7c1a5':'#bda486');
    for(let y=192;y<704;y+=sports?48:32)for(let x=80;x<944;x+=sports?48:128) {
      rect(c,x+1,y+1,sports?46:126,sports?46:30,(x+y)%96===0?'#fff4cf13':'#5449320c');
      line(c,x,y,x+(sports?48:128),y,'#5d554a32',1);line(c,x,y,x,y+(sports?48:32),'#5d554a28',1);
    }
    rect(c,64,64,896,128,'#d8d1b8');rect(c,64,144,896,48,'#8d9983');rect(c,64,184,896,12,'#58665b');
    for(let x=80;x<944;x+=32)rect(c,x,148,2,34,'#bac3a080');
    rect(c,64,64,16,640,'#d0b994');rect(c,944,64,16,640,'#b4a080');rect(c,80,692,864,12,'#715f4b');
    for(const x of [176,800]) {round(c,x,80,48,56,12,'#6d7b69');rect(c,x+5,85,38,46,'#b0cfbe');rect(c,x+23,85,3,46,'#f0e3bf');rect(c,x+5,106,38,3,'#f0e3bf');}
    for(const x of [112,904]) {ellipse(c,x,120,28,26,'#fff2ba17');round(c,x-10,104,20,32,6,'#e4ce91');rect(c,x-13,99,26,7,'#5e6d5b');}
    rect(c,464,686,96,18,'#514a3b');rect(c,464,690,96,5,'#e5c69a');
    scene.objects.filter(o=>o.flat).forEach(o=>drawEntity(c,o,scene.palette));
  }
  function createBackground(scene) {
    const canvas=document.createElement('canvas');canvas.width=scene.width;canvas.height=scene.height;const c=canvas.getContext('2d');
    if(scene.kind==='interior')drawInteriorFloor(c,scene);
    else {
      drawGrass(c,scene);scene.roads.forEach(r=>drawPaving(c,r));scene.plazas.forEach(r=>drawPaving(c,r));scene.bushes.forEach(b=>drawBush(c,b,scene.palette));
      scene.water.filter(w=>!w.fountain).forEach(w=>drawWater(c,w,scene.palette));scene.bridges.forEach(b=>drawBridge(c,b));scene.beds.forEach(b=>drawFlowerbed(c,b,scene.palette));
      scene.decor.forEach(d=>{
        if(d.type==='route') {text(c,d.label,d.x,d.y,18,'#5b6551');return;}
        round(c,d.x-56,d.y-24,112,64,4,'#dfc89e');for(let x=-48;x<48;x+=16)for(let y=-16;y<32;y+=16)if((x+y)%32===0)rect(c,d.x+x,d.y+y,16,16,'#b66b5b');
        ellipse(c,d.x+20,d.y+5,15,11,'#e9dbb6');ellipse(c,d.x+20,d.y+5,9,6,'#a5b07a');rect(c,d.x-22,d.y-8,20,18,'#9e7652');rect(c,d.x-25,d.y-12,26,5,'#c7a275');
      });
    }
    return canvas;
  }
  function drawTree(c,o,p) {
    const {x,y,w,h}=o,cx=x+w/2,bottom=y+h;
    ellipse(c,cx+10,bottom-3,w*.52,14,'#1d463832');
    rect(c,cx-10,bottom-h*.45,20,h*.43,'#745a40');rect(c,cx-5,bottom-h*.42,6,h*.39,'#a27e50');
    line(c,cx,bottom-h*.25,cx-20,bottom-h*.43,'#745a40',8);line(c,cx,bottom-h*.24,cx+20,bottom-h*.48,'#745a40',8);
    if(o.variant===2) {
      poly(c,[[cx,y],[x+5,bottom-40],[x+w-5,bottom-40]],p.dark);poly(c,[[cx,y+4],[x+13,bottom-60],[x+w-17,bottom-60]],p.leaf);poly(c,[[cx,y+4],[cx-10,y+h*.48],[cx+w*.25,y+h*.48]],p.light);
      line(c,x+w*.28,bottom-68,x+w*.72,bottom-68,p.light,3);
    } else {
      ellipse(c,cx,y+h*.43,w*.49,h*.33,p.dark);ellipse(c,cx-9,y+h*.33,w*.43,h*.31,p.leaf);
      ellipse(c,cx-15,y+h*.22,w*.31,h*.2,p.light);ellipse(c,cx+w*.23,y+h*.32,w*.21,h*.2,p.leaf);ellipse(c,cx-w*.29,y+h*.45,w*.18,h*.17,p.light);
      for(let i=0;i<7;i++){const a=i*2.1;ellipse(c,cx+Math.cos(a)*w*.28,y+h*.33+Math.sin(a)*h*.19,5,3,i%2?p.light:p.dark);}
      if(o.variant===1)for(const [dx,dy]of[[-.22,.3],[.16,.4],[-.12,.5]])ellipse(c,cx+dx*w,y+dy*h,4,5,p.flower);
    }
  }
  function windowPane(c,x,y,w,h,locked) {
    round(c,x-5,y-5,w+10,h+10,4,'#776c56');rect(c,x,y,w,h,locked?'#6f8483':'#a7c3b4');
    poly(c,[[x,y],[x+w*.65,y],[x,y+h*.75]],locked?'#90a19a':'#d6dfbe');rect(c,x+w/2-2,y,4,h,'#efe2bd');rect(c,x,y+h/2-2,w,4,'#efe2bd');rect(c,x-8,y+h+2,w+16,7,'#e6d3a9');
  }
  function drawBuilding(c,o,p) {
    const{x,y,w,h}=o,roof=o.roof||p.roof,trim=o.trim||p.trim,gym=o.facility==='gym'||o.facility==='training',locked=o.locked;
    round(c,x+14,y+h-12,w+25,36,13,'#294b3b38');rect(c,x-6,y+h-16,w+12,22,'#9b9c81');rect(c,x,y+h-20,w,11,'#e5dbc0');
    const wall=c.createLinearGradient(x,y,x,y+h);wall.addColorStop(0,locked?'#a5afa0':'#e4d8b8');wall.addColorStop(1,locked?'#899b90':'#c8bb9a');c.fillStyle=wall;c.fillRect(x,y+40,w,h-60);
    rect(c,x,y+44,12,h-64,'#b0a380');rect(c,x+w-12,y+44,12,h-64,'#a89b7d');
    for(let yy=y+70;yy<y+h-28;yy+=24)line(c,x+12,yy,x+w-12,yy,'#8f84621c',1);
    const roofY=y+48,ridge=y-58;
    poly(c,[[x-22,roofY+11],[x+w+22,roofY+11],[x+w+8,y-12],[x+w/2,ridge-14],[x-8,y-12]],'#594f45');
    poly(c,[[x-20,roofY+4],[x+w+20,roofY+4],[x+w+6,y-16],[x+w/2,ridge-20],[x-6,y-16]],locked?'#788a83':roof);
    poly(c,[[x+w/2,ridge-20],[x+w+6,y-16],[x+w+20,roofY+4],[x+w/2,roofY+4]],'#192b3020');
    for(let yy=ridge+4;yy<roofY;yy+=16) {
      const t=(yy-(ridge-20))/(roofY-(ridge-20)),lx=x+w/2-(w/2+20)*Math.min(1,t*1.45),rx=x+w/2+(w/2+20)*Math.min(1,t*1.45);
      line(c,lx,yy,rx,yy,'#fae0b52a',3);for(let xx=lx+24;xx<rx;xx+=32)line(c,xx,yy,xx+2,yy+10,'#412f3b25',2);
    }
    rect(c,x-18,roofY,w+36,9,trim);rect(c,x-13,roofY+9,w+26,7,'#6b61503b');
    if(!gym) {rect(c,x+w-58,ridge-1,25,43,'#978474');rect(c,x+w-62,ridge-6,33,9,'#d7c3a2');rect(c,x+w-54,ridge+3,4,28,'#b2a18c');}
    const dw=gym?64:48,doorX=x+w/2-dw/2,doorY=y+h-80;
    round(c,doorX-5,doorY-5,dw+10,70,6,'#70634d');rect(c,doorX,doorY,dw,64,locked?'#687a71':'#6f867c');rect(c,doorX+6,doorY+6,dw-12,30,locked?'#8fa195':'#c5d8ba');
    rect(c,doorX+dw/2-1,doorY,3,64,trim);ellipse(c,doorX+dw-10,doorY+45,3,3,'#f3d58e');rect(c,doorX-14,y+h-18,dw+28,10,'#dfd1af');
    for(const wx of [x+31,x+w-77])windowPane(c,wx,y+h-92,46,43,locked);
    round(c,x+w/2-Math.min(w-28,220)/2,y+70,Math.min(w-28,220),31,5,locked?'#536f64':'#4b665b');
    text(c,o.label,x+w/2,y+86,o.label.length>12?14:17,locked?'#d1dbce':'#fff0d1');
    if(o.facility==='cafe'||o.facility==='shop') {
      const aw=w*.5,ax=x+(w-aw)/2,ay=y+110;
      for(let i=0;i<8;i++) {rect(c,ax+i*aw/8,ay,aw/8,19,i%2?'#eee0b9':roof);round(c,ax+i*aw/8,ay+13,aw/8,13,4,i%2?'#eee0b9':roof);}
    }
    if(o.facility==='clinic') {rect(c,x+w/2-5,y-4,10,27,'#fff4d5');rect(c,x+w/2-14,y+4,28,10,'#fff4d5');}
    if(gym) {ellipse(c,x+w/2,y-3,22,19,'#f1d6a0');ellipse(c,x+w/2-4,y-7,10,12,roof);rect(c,x+w/2+2,y+1,5,15,'#776951');}
    if(o.world) {
      round(c,x+w/2-24,y-9,48,38,9,'#eee0b3');text(c,o.number,x+w/2,y+12,25,locked?'#7e8977':'#585a46');
      if(locked){round(c,x+w/2-10,y+h+10,20,16,3,'#566b62');c.strokeStyle='#566b62';c.lineWidth=3;c.beginPath();c.arc(x+w/2,y+h+10,7,Math.PI,0);c.stroke();}
    }
    for(const xx of [x+6,x+w-22]) {rect(c,xx,y+h-43,17,20,'#a5795e');ellipse(c,xx+9,y+h-45,15,11,p.leaf);ellipse(c,xx+6,y+h-51,9,7,p.light);}
  }
  function drawBench(c,o) {
    const{x,y,w,h}=o;ellipse(c,x+w/2+4,y+h-2,w*.49,9,'#283c3030');
    rect(c,x+12,y+17,7,h-11,'#535e4f');rect(c,x+w-19,y+17,7,h-11,'#535e4f');
    for(let i=0;i<3;i++){rect(c,x,y+i*7,w,5,'#ad855c');rect(c,x+2,y+i*7,w-4,2,'#d9b77f');}
    rect(c,x-2,y+23,w+4,12,'#ba9364');rect(c,x-2,y+23,w+4,3,'#e2bd82');
  }
  function drawCourt(c,o) {
    const{x,y,w,h}=o;
    round(c,x+10,y+14,w,h,8,'#233d3430');rect(c,x+22,y+h-6,8,14,'#5d695e');rect(c,x+w-30,y+h-6,8,14,'#5d695e');
    round(c,x,y,w,h,6,'#335c5e');rect(c,x+5,y+5,w-10,h-10,o.champion?'#557b8b':'#5b9389');
    c.strokeStyle='#e9eacb';c.lineWidth=3;c.strokeRect(x+8,y+8,w-16,h-16);line(c,x+w/2,y+8,x+w/2,y+h-8,'#e9eacb',2);
    rect(c,x-5,y+h/2-8,w+10,12,'#d8d8ba');rect(c,x,y+h/2-6,w,7,'#738a7e');
    for(let xx=x;xx<x+w;xx+=8)line(c,xx,y+h/2-6,xx,y+h/2+1,'#e8ead2',1);
    rect(c,x-7,y+h/2-12,5,22,'#5e6c61');rect(c,x+w+2,y+h/2-12,5,22,'#5e6c61');
    if(o.champion){text(c,'BEAMRPG',x+w/2,y+h*.28,20,'#cbe1cfaa');ellipse(c,x+w*.25,y+h*.75,7,4,'#f9eecf');}
  }
  function drawFurniture(c,o,p) {
    const{x,y,w,h}=o;
    if(o.type==='rug') {round(c,x,y,w,h,7,o.color);c.strokeStyle='#e8d4ad';c.lineWidth=3;c.strokeRect(x+8,y+8,w-16,h-16);for(let i=0;i<w;i+=12){rect(c,x+i,y-4,2,5,'#d8c097');rect(c,x+i,y+h,2,5,'#d8c097');}return;}
    if(o.type==='wallArt') {rect(c,x-5,y-5,w+10,h+10,'#a0865d');rect(c,x,y,w,h,'#4b685f');rect(c,x+6,y+6,w-12,h-12,'#536f62');text(c,o.label,x+w/2,y+h*.42,o.label.length>16?15:20,'#f4dfb4');text(c,o.sub,x+w/2,y+h*.73,12,'#d4d9b9');return;}
    round(c,x+6,y+h-12,w,h*.25,7,'#2e3e2d24');
    if(o.type==='bed') {
      rect(c,x-5,y-7,w+10,h+12,'#a78963');round(c,x,y,w,h,9,'#e7e0c8');round(c,x+8,y+8,w-16,h*.3,7,'#f6efdb');
      round(c,x+6,y+h*.37,w-12,h*.59,5,o.clinic?'#96bab0':'#8f9e9b');rect(c,x+6,y+h*.37,w-12,9,o.clinic?'#c3d9c7':'#c8c6a9');
      for(let xx=x+16;xx<x+w-8;xx+=24)line(c,xx,y+h*.48,xx,y+h-10,'#f6f1d520',2);return;
    }
    if(o.type==='sofa') {round(c,x,y,w,h,10,'#657f72');round(c,x+10,y+5,w-20,h*.45,9,'#9aab8b');for(let i=0;i<3;i++)round(c,x+12+i*(w-24)/3,y+h*.48,(w-30)/3,h*.43,5,'#a6b395');round(c,x-4,y+8,16,h-8,5,'#7b927e');round(c,x+w-12,y+8,16,h-8,5,'#7b927e');return;}
    if(o.type==='racketRack') {
      rect(c,x,y,w,h,'#9c8666');rect(c,x+5,y+5,w-10,h-10,'#cdb793');
      for(let i=0;i<3;i++){const rx=x+(i+.5)*w/3,ry=y+h*.45;ellipse(c,rx,ry,w*.105,h*.21,['#b76e5d','#6c8b91','#9b7d99'][i]);rect(c,rx-3,ry+h*.17,6,h*.22,'#765d43');}return;
    }
    if(o.type==='table') {
      for(const [dx,dy]of[[-14,h*.4],[w+2,h*.4]]){rect(c,x+dx,y+dy,12,30,'#9e835e');rect(c,x+dx-2,y+dy,16,6,'#d2b68b');}
      round(c,x,y,w,h,12,'#9b7852');round(c,x+3,y+2,w-6,h-9,10,'#d0b186');line(c,x+12,y+h*.5,x+w-12,y+h*.5,'#a489653b',2);
      if(o.coffee){ellipse(c,x+w*.35,y+h*.4,12,8,'#e6e0c7');ellipse(c,x+w*.35,y+h*.4,7,5,'#79614b');ellipse(c,x+w*.7,y+h*.7,11,7,'#eee0ba');}
      if(o.meal){ellipse(c,x+w*.5,y+h*.5,23,16,'#eee6cd');ellipse(c,x+w*.5,y+h*.5,16,10,'#a7af79');rect(c,x+15,y+15,15,21,'#bfcdb6');}return;
    }
    if(o.type==='shelf') {
      rect(c,x,y,w,h,'#8d7756');rect(c,x+5,y+4,w-10,h-8,'#b49d76');
      for(let i=0;i<Math.floor(w/18)-1;i++){const bx=x+12+i*18;rect(c,bx,y+12,12,h-24,['#8ba19b','#ae795c','#e0c38f','#8e86a0'][i%4]);rect(c,bx+2,y+17,8,2,'#f0dfb1');}return;
    }
    if(o.type==='kitchen') {
      rect(c,x,y,w,h,'#91a99a');rect(c,x,y,w,10,'#e5ddbf');for(let i=0;i<4;i++){rect(c,x+i*w/4+4,y+18,w/4-8,h-24,'#b3c1a8');rect(c,x+i*w/4+12,y+25,14,3,'#667b6b');}
      round(c,x+14,y-5,65,25,4,'#778f88');rect(c,x+19,y-1,55,16,'#b6cdc0');for(const bx of [x+w-66,x+w-34])ellipse(c,bx,y+6,11,7,'#5d6d63');return;
    }
    rect(c,x,y,w,h,'#9d8765');rect(c,x,y,w,12,'#e1cfaa');rect(c,x+5,y+18,w-10,h-24,o.type==='cabinet'?'#809a8a':'#bca47a');
    if(o.trophy){for(let i=0;i<3;i++){const tx=x+(i+.5)*w/3,ty=y+h*.6;rect(c,tx-12,ty+12,24,6,'#d7bb7a');rect(c,tx-4,ty-6,8,20,'#dec278');poly(c,[[tx-15,ty-20],[tx+15,ty-20],[tx+10,ty],[tx-10,ty]],'#edcf84');c.strokeStyle='#edcf84';c.lineWidth=4;c.beginPath();c.arc(tx-11,ty-12,10,Math.PI/2,Math.PI*1.5);c.stroke();}rect(c,x+6,y+19,w-12,3,'#d9ebd967');}
    if(o.shop){for(let i=0;i<3;i++){ellipse(c,x+80+i*90,y+2,16,11,['#b56658','#668783','#8f718e'][i]);rect(c,x+90+i*90,y+9,15,5,'#705b40');}}
    if(o.coffee){rect(c,x+35,y-25,68,30,'#6d7e70');rect(c,x+44,y-19,50,13,'#b0bd9d');ellipse(c,x+w-40,y+2,12,8,'#e8dec2');}
    if(o.clinic){rect(c,x+w/2-5,y+30,10,33,'#e5e9d2');rect(c,x+w/2-17,y+41,34,10,'#e5e9d2');}
    if(o.hall){rect(c,x+w*.3,y-4,w*.4,12,'#e9dbb7');rect(c,x+w*.31,y-3,w*.18,9,'#9c7b55');}
  }
  function drawEntity(c,o,p) {
    const{x,y,w,h}=o;
    if(o.type==='tree')return drawTree(c,o,p);
    if(o.type==='building')return drawBuilding(c,o,p);
    if(o.type==='bench')return drawBench(c,o);
    if(o.type==='court')return drawCourt(c,o);
    if(o.type==='lamp') {
      ellipse(c,x+w/2+5,y+h,w*.5,6,'#263e3028');rect(c,x+w/2-3,y+28,6,h-28,'#58685a');rect(c,x+w/2-8,y+h-6,16,6,'#7f8971');
      ellipse(c,x+w/2,y+20,26,24,'#ffe9ac13');round(c,x+3,y+8,w-6,28,5,'#e6d2a1');rect(c,x+1,y+5,w-2,5,'#53665a');rect(c,x+5,y+35,w-10,5,'#53665a');rect(c,x+w/2-1,y+9,2,25,'#a19670');return;
    }
    if(o.type==='plant') {round(c,x+w*.2,y+h*.65,w*.6,h*.3,6,'#b18d69');ellipse(c,x+w*.5,y+h*.6,w*.45,h*.32,p.leaf);ellipse(c,x+w*.38,y+h*.4,w*.25,h*.24,p.light);return;}
    if(o.type==='questNpc') {
      ellipse(c,x+w/2,y+h-1,24,7,'#243d3650');
      round(c,x+11,y+51,12,24,4,'#405b68');round(c,x+29,y+51,12,24,4,'#405b68');
      round(c,x+7,y+28,38,36,9,'#b7775f');rect(c,x+14,y+33,24,4,'#ecd6a5');
      ellipse(c,x+26,y+19,19,20,'#e8bb95');ellipse(c,x+26,y+5,21,12,'#2f3936');
      ellipse(c,x+19,y+21,2,2,'#364942');ellipse(c,x+33,y+21,2,2,'#364942');line(c,x+22,y+29,x+30,y+29,'#9e7057',2);
      round(c,x+35,y+35,16,22,3,'#d9c398');rect(c,x+38,y+40,10,2,'#738575');rect(c,x+38,y+45,8,2,'#738575');
      label(c,o.label,x+w/2,y-15,'#fff0cb',13);return;
    }
    if(o.type==='fountain') {
      ellipse(c,x+w/2+8,y+h/2+13,w*.6,h*.45,'#314d3f35');ellipse(c,x+w/2,y+h/2,w*.56,h*.48,'#a3af9b');ellipse(c,x+w/2,y+h/2-4,w*.49,h*.42,'#ddd7b9');ellipse(c,x+w/2,y+h/2-4,w*.4,h*.32,p.water);rect(c,x+w/2-12,y+h*.14,24,h*.47,'#b5c0a6');ellipse(c,x+w/2,y+h*.17,32,13,'#ddd8b6');ellipse(c,x+w/2,y+h*.14,25,9,'#86b8b2');return;
    }
    if(o.type==='sign') {
      rect(c,x+w*.2,y+h*.4,9,h*.58,'#8d7756');rect(c,x+w*.76,y+h*.4,9,h*.58,'#8d7756');round(c,x,y,w,h*.63,5,'#77644a');round(c,x+4,y+4,w-8,h*.63-8,3,'#cdb78c');text(c,o.label,x+w/2,y+h*.26,o.small?14:19,'#3f574b');if(o.sub)text(c,o.sub,x+w/2,y+h*.47,11,'#607059');return;
    }
    if(o.type==='banner') {rect(c,x+w/2-3,y-7,6,h+5,'#a48f67');poly(c,[[x,y],[x+w,y],[x+w,y+h-12],[x+w/2,y+h],[x,y+h-12]],p.roof);text(c,o.label,x+w/2,y+h*.35,17,'#f1dbab');line(c,x+7,y+12,x+w-7,y+12,'#dfbd87',2);return;}
    if(o.type==='statue') {
      ellipse(c,x+w/2+8,y+h+2,w*.6,13,'#3d493135');rect(c,x-5,y+h-22,w+10,25,'#bdb391');rect(c,x+5,y+h-34,w-10,16,'#e7d6a9');rect(c,x+w/2-8,y+44,16,22,'#c4a466');
      poly(c,[[x+10,y+8],[x+w-10,y+8],[x+w-20,y+44],[x+w/2,y+54],[x+20,y+44]],'#dfbc72');poly(c,[[x+15,y+12],[x+w/2,y+12],[x+w/2,y+45],[x+24,y+37]],'#f0d594');
      c.strokeStyle='#d0ad69';c.lineWidth=6;c.beginPath();c.arc(x+14,y+23,16,Math.PI/2,Math.PI*1.5);c.stroke();c.beginPath();c.arc(x+w-14,y+23,16,-Math.PI/2,Math.PI/2);c.stroke();return;
    }
    if(o.type==='arch') {
      for(const xx of [x+12,x+w-28]){rect(c,xx,y+12,16,h-8,'#bcae85');rect(c,xx-5,y+h-6,26,12,'#d6c9a4');rect(c,xx-3,y+7,22,12,'#6e8b70');}
      round(c,x,y+4,w,30,8,'#536f5e');text(c,o.label,x+w/2,y+20,16,'#f6e5bf');for(let xx=x+3;xx<x+w;xx+=19)ellipse(c,xx,y+3,12,8,p.leaf);return;
    }
    if(o.type==='garden') {
      round(c,x,y,w,h,18,'#829775');drawFlowerbed(c,{x:x+22,y:y+30,w:w-44,h:55,color:p.flower},p);drawFlowerbed(c,{x:x+22,y:y+109,w:w-44,h:55,color:'#edd9b2'},p);
      for(let xx=x+3;xx<x+w;xx+=24){rect(c,xx,y+h-35,7,39,'#dfd1aa');poly(c,[[xx-1,y+h-35],[xx+3,y+h-42],[xx+8,y+h-35]],'#dfd1aa');}rect(c,x,y+h-23,w,6,'#dfd1aa');
      if(!o.noLabel)label(c,o.label,x+w/2,y+h-60);return;
    }
    if(o.type==='gazebo') {
      ellipse(c,x+w/2+9,y+h,w*.55,15,'#31583e30');rect(c,x+20,y+h-30,w-40,35,'#c9b88d');for(const xx of [x+30,x+w-42])rect(c,xx,y+35,12,h-45,'#e0c99e');poly(c,[[x-8,y+47],[x+w/2,y-40],[x+w+8,y+47]],p.roof);rect(c,x-8,y+43,w+16,10,'#e0c99e');drawBench(c,{x:x+55,y:y+h-78,w:w-110,h:45});return;
    }
    drawFurniture(c,o,p);
  }
  function cacheObject(o,p) {
    const pad=o.type==='building'?96:o.type==='gazebo'?64:32,canvas=document.createElement('canvas');canvas.width=Math.ceil(o.w+pad*2);canvas.height=Math.ceil(o.h+pad*2);const c=canvas.getContext('2d');
    c.translate(pad-o.x,pad-o.y);drawEntity(c,o,p);o.sprite=canvas;o.spriteX=o.x-pad;o.spriteY=o.y-pad;
  }
  function drawPlayer(c,player,time,walking,facing,direction,gear={}) {
    const x=Math.round(player.x),y=Math.round(player.y),phase=walking?time*12:0,swing=Math.sin(phase),bob=walking?Math.abs(Math.sin(phase))*2:Math.sin(time*2)*.5,back=direction==='up',side=direction==='left'||direction==='right';
    c.save();c.translate(x,y);ellipse(c,2,0,20,7,'#233f3650');c.translate(0,-bob);
    const leg=(lx,dy)=>{round(c,lx,-21+dy,10,17,4,'#313d48');if(gear.tape)rect(c,lx,-16+dy,10,4,'#eae4ce');round(c,lx-1,-8+dy,13,7,3,gear.shoes?'#e4a461':'#ddd7bd');rect(c,lx,-7+dy,11,2,gear.shoes?'#ffe5af':'#f3e6c4');};
    if(side){leg(-9,swing*5);leg(1,-swing*5);}else{leg(-12,swing*5);leg(3,-swing*5);}
    if(gear.spray){ellipse(c,-9,-2,6,2,'#c6f4dc');ellipse(c,9,-2,6,2,'#c6f4dc');}
    const arm=(ax,dy)=>{round(c,ax,-39+dy,8,19,4,'#d6ab86');round(c,ax-1,-42+dy,10,11,3,gear.uniform?'#944b49':'#26343c');if(gear.wristband)round(c,ax,-25+dy,8,5,2,'#6bbdc0');if(gear.fingerGuard&&ax>0)rect(c,ax+1,-21+dy,6,3,'#f4e5c9');};
    arm(-23,swing*-4);arm(15,swing*4);
    round(c,-18,-46,36,29,9,gear.uniform?'#b35f59':'#243440');rect(c,-13,-44,26,3,gear.uniform?'#efc99a':'#5c7887');rect(c,-16,-28,32,3,gear.uniform?'#efc99a':'#668c97');
    if(back){text(c,'HB',0,-32,11,'#dfd7b4');}else {rect(c,-12,-39,6,4,'#d0bb8d');line(c,7,-41,13,-33,'#7fa5b2',2);}
    const hx=side?facing*2:0;
    ellipse(c,hx,-60,20,21,'#d6a984');ellipse(c,hx-1,-63,19,20,'#ecc49c');
    if(!back){ellipse(c,hx-19,-59,4,6,'#d9ae89');ellipse(c,hx+19,-59,4,6,'#d9ae89');}
    ellipse(c,hx,-74,22,14,'#27302e');
    for(const [dx,dy,rx,ry]of[[-19,-72,8,10],[-11,-80,10,8],[0,-82,11,8],[13,-79,10,9],[20,-70,6,11]])ellipse(c,hx+dx,dy,rx,ry,'#27302e');
    poly(c,[[hx-20,-76],[hx-24,-85],[hx-11,-81],[hx-7,-91],[hx+1,-82],[hx+11,-88],[hx+15,-79],[hx+23,-80],[hx+19,-70],[hx+10,-74],[hx+3,-68],[hx-4,-75],[hx-13,-69]],'#25302e');
    if(gear.hairband)line(c,hx-18,-73,hx+18,-73,'#e8ac69',4);
    line(c,hx-12,-80,hx-4,-83,'#53605a',3);line(c,hx+4,-81,hx+10,-79,'#53605a',2);
    if(back) {ellipse(c,hx,-62,19,14,'#27302e');rect(c,hx-8,-48,16,3,'#b79273');}
    else {
      const shift=side?facing*4:0;
      c.strokeStyle='#394746';c.lineWidth=2.5;c.beginPath();c.roundRect(hx-16+shift,-66,14,11,4);c.roundRect(hx+2+shift,-66,14,11,4);c.stroke();line(c,hx-2+shift,-62,hx+2+shift,-62,'#394746',2);
      ellipse(c,hx-8+shift,-60,2,2.5,'#354239');ellipse(c,hx+9+shift,-60,2,2.5,'#354239');line(c,hx-3+shift,-51,hx+4+shift,-51,'#9e7057',1.5);
      rect(c,hx-13+shift,-57,5,2,'#d89480aa');rect(c,hx+10+shift,-57,5,2,'#d89480aa');
    }
    const racketX=side?facing*26:27,racketY=-26+swing*4;
    c.save();c.translate(racketX,racketY);c.rotate((side?facing:.5)*-.3);rect(c,-3,2,6,18,'#b6a077');ellipse(c,0,-7,11,14,gear.racket?'#f2d37b':'#ded5b2');ellipse(c,0,-8,8.5,11.5,back?'#466778':'#a96558');line(c,-3,-14,3,-12,'#edb39a55',2);c.restore();
    c.restore();
  }
  function draw(ctx,scene,{player,time=0,walking=false,facing=1,direction='down',path=[],target=null,gear={}}) {
    if(!scene.background) {
      scene.background=createBackground(scene);scene.objects.filter(o=>!o.flat).forEach(o=>cacheObject(o,scene.palette));
      scene.sorted=scene.objects.filter(o=>!o.flat).sort((a,b)=>(a.y+a.h)-(b.y+b.h));
    }
    ctx.drawImage(scene.background,0,0);
    scene.water.filter(w=>!w.fountain).forEach(w=>{
      ctx.save();ctx.beginPath();if(w.pond)ctx.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2-8,w.h/2-8,0,0,TAU);else ctx.rect(w.x+10,w.y+10,w.w-20,w.h-20);ctx.clip();
      for(let i=0;i<8;i++){const xx=w.x+((i*139+time*8)%w.w),yy=w.y+24+(i*37%(w.h-40));line(ctx,xx,yy,xx+18,yy,'#e1f4d94a',2);}
      ctx.restore();
    });
    scene.bridges.forEach(b=>drawBridge(ctx,b));
    if(path.length>1){ctx.save();ctx.strokeStyle='#fff3cb60';ctx.lineWidth=3;ctx.setLineDash([3,12]);ctx.beginPath();ctx.moveTo(player.x,player.y);for(const p of path)ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}
    for(const p of scene.portals) {
      const color=p.locked?'#5d706b':'#f6e7b7';ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=p.locked?.5:.65+Math.sin(time*2+p.x)*.1;
      poly(ctx,[[-20,0],[0,-10],[20,0],[0,10]],color+'80');poly(ctx,[[-11,0],[0,-5],[11,0],[0,5]],color);ctx.restore();
    }
    if(target) {ctx.save();ctx.strokeStyle='#fff3ce';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(target.x,target.y,12+Math.sin(time*5)*2,6,0,0,TAU);ctx.stroke();ctx.restore();}
    let drawn=false;
    for(const o of scene.sorted) {
      if(!drawn&&o.y+o.h>player.y) {drawPlayer(ctx,player,time,walking,facing,direction,gear);drawn=true;}
      ctx.drawImage(o.sprite,o.spriteX,o.spriteY);
    }
    if(!drawn)drawPlayer(ctx,player,time,walking,facing,direction,gear);
    for(const w of scene.water.filter(w=>w.fountain)) {
      const x=w.x+w.w/2,y=w.y+w.h*.26;
      for(let i=0;i<5;i++){const a=(i-2)*.36,phase=(time*1.5+i*.2)%1,dx=Math.sin(a)*phase*38,dy=-Math.sin(phase*Math.PI)*33+phase*19;ellipse(ctx,x+dx,y+dy,1.8,2.8,'#e7f6e5b0');}
    }
    const near=scene.portals.find(p=>Math.hypot(p.x-player.x,p.y-player.y)<112);
    if(near)label(ctx,near.locked?'아직 잠긴 '+near.label:near.label,near.x,near.y-39,near.locked?'#cbd5c4':'#fff0cb',16);
    label(ctx,'희범',player.x,player.y+24,'#f5e6bc',13);
  }
  window.BeamMap={createScene,draw};
})();
