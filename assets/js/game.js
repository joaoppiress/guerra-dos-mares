(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const ASSET_PATHS = {
    water: {
      player1: [1,2,3,4].map(i=>`assets/img/tiles/ally/${i}.png`),
      neutral: [1,2,3,4].map(i=>`assets/img/tiles/neutral/${i}.png`),
      player2: [1,2,3,4].map(i=>`assets/img/tiles/enemy/${i}.png`)
    },
    ships: Object.keys(GDM_CONFIG.ships).reduce((o,id)=>(o[id]=`assets/img/ships/${id}.png`,o),{}),
    explosion: [1,2,3,4,5,6,7,8,9].map(i=>`assets/img/effects/explosion/${i}.png`),
    ui: ['attack','move','trap','analyze','end','rotate','auto','ready','settings','help','difficulty','music','cursor','valid','invalid','target','unknown','mine','hit','miss','buoy','wake','panel','handoff','grid','grid_hc']
      .reduce((o,n)=>(o[n]=`assets/img/ui/${n}.png`,o),{})
  };

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error(`Falha ao carregar ${src}`));
      img.src=src;
    });
  }

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function now(){ return performance.now(); }
  function rand(n){ return Math.floor(Math.random()*n); }
  function hit(r,x,y){ return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h; }

  class AudioEngine {
    constructor(){ this.ctx=null; this.music=true; this.sfx=true; this.musicNodes=[]; }
    ensure(){
      if(this.ctx) return;
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return;
      this.ctx=new AC();
      this.startMusic();
    }
    startMusic(){
      if(!this.ctx || this.musicNodes.length) return;
      const master=this.ctx.createGain(); master.gain.value=this.music?0.025:0;
      master.connect(this.ctx.destination);
      const o1=this.ctx.createOscillator(), o2=this.ctx.createOscillator();
      const g1=this.ctx.createGain(), g2=this.ctx.createGain();
      o1.type='sine'; o1.frequency.value=55; g1.gain.value=.6;
      o2.type='triangle'; o2.frequency.value=82.4; g2.gain.value=.24;
      o1.connect(g1).connect(master); o2.connect(g2).connect(master); o1.start(); o2.start();
      this.musicNodes=[o1,o2,g1,g2,master];
    }
    syncMusic(){ if(this.musicNodes[4]) this.musicNodes[4].gain.value=this.music?0.025:0; }
    beep(freq=440,dur=.08,vol=.08){
      if(!this.sfx) return;
      this.ensure(); if(!this.ctx) return;
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='square'; o.frequency.value=freq; g.gain.value=vol;
      o.connect(g).connect(this.ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+dur); o.stop(this.ctx.currentTime+dur+.02);
    }
  }

  class SpriteOnlyGame {
    constructor(){
      this.img={water:{player1:[],neutral:[],player2:[]},ships:{},explosion:[],ui:{}};
      this.questions=[];
      this.questionsLoaded=false;
      this.assetsReady=false;
      this.audio=new AudioEngine();
      this.buttons=[];
      this.fleetButtons=[];
      this.hover={x:-1,y:-1,cell:null,button:null};
      this.pointerDown=null;
      this.geom={w:0,h:0,dpr:1,cell:32,gx:0,gy:0,gw:960,gh:320};
      this.live=null;
      this.a11yRoot=null;
      this.a11yControls={};
      this.a11yFocusAction=null;
      this.a11yPaletteOpen=false;
      this.lastA11ySync=0;
      this.state=this.createState();
      this.lastTime=0;
    }

    createState(){
      return {
        phase:'loading',
        difficulty:'medio',
        placementOwner:'player1',
        turn:'player1',
        roundStarter:'player1',
        round:1,
        ships:{player1:[],player2:[]},
        traps:[],
        selectedShipId:null,
        action:null,
        cursor:{row:0,col:0},
        detected:{player1:new Set(),player2:new Set()},
        revealed:{player1:new Set(),player2:new Set()},
        analysisAvailable:{player1:true,player2:true},
        marks:{player1:new Map(),player2:new Map()},
        usedQuestionIds:new Set(),
        modal:null,
        toast:null,
        effects:[],
        stats:{
          player1:{attacks:0,hits:0,verificationAttempts:0,verificationCorrect:0,shipsDestroyed:0,trapsDiscovered:0,trapsTriggered:0},
          player2:{attacks:0,hits:0,verificationAttempts:0,verificationCorrect:0,shipsDestroyed:0,trapsDiscovered:0,trapsTriggered:0}
        },
        settings:{highContrast:false,fontScale:1,music:true,sfx:true},
        winner:null,
        finalScores:null,
        platformScore:null,
        startAt:0
      };
    }

    async init(){
      this.createA11yLayer();
      this.resize();
      window.addEventListener('resize',()=>this.resize());
      this.bindInput();
      try{
        await this.loadAssets();
        this.assetsReady=true;
      }catch(err){
        console.error(err);
      }
      await this.loadQuestions();
      this.resetMatch(getPlatformDifficulty());
      this.state.phase='placement';
      this.announce('Jogador 1. Posicione sua frota no oceano esquerdo. F1 abre o tutorial. F2 abre acessibilidade. F3 abre os controles acessíveis.');
      requestAnimationFrame(t=>this.loop(t));
    }

    createA11yLayer(){
      const root=document.createElement('div');
      root.className='sr-only';
      root.id='accessibilityLayer';
      root.setAttribute('role','region');
      root.setAttribute('aria-label','Controles acessíveis do Guerra dos Mares');
      root.innerHTML='<div id="gdmInstructions"></div><div id="gdmVisualDescription"></div><div id="gdmState" role="status" aria-live="off"></div><div id="gdmLive" role="status" aria-live="polite" aria-atomic="true"></div><div id="gdmControls" role="group" aria-label="Comandos do jogo"></div>';
      document.body.appendChild(root);
      this.a11yRoot=root;
      this.live=root.querySelector('#gdmLive');
      root.querySelector('#gdmInstructions').textContent='Controles: setas ou WASD movem o cursor. Enter confirma. R gira no posicionamento. P posiciona automaticamente. F1 tutorial. F2 acessibilidade. F3 coloca o foco no primeiro controle acessível. Durante a batalha: 1 atacar, 2 mover, 3 armadilha, 4 analisar e Espaço encerrar turno.';
      root.querySelector('#gdmVisualDescription').textContent='Mapa naval top-down em pixel art com três áreas de dez por dez: Oceano do Jogador 1, Oceano Neutro e Oceano do Jogador 2. Cada área usa colunas A até J e linhas 1 até 10, com A1 no canto superior esquerdo. Navios, água, minas, contatos de radar e efeitos são desenhados no canvas.';
      const controls=root.querySelector('#gdmControls');
      const defs=[
        ['help','Abrir tutorial'],['settings','Abrir configurações de acessibilidade'],['music','Alternar música'],['sfx','Alternar efeitos sonoros'],
        ['up','Mover cursor para cima'],['down','Mover cursor para baixo'],['left','Mover cursor para esquerda'],['right','Mover cursor para direita'],['confirm','Confirmar na posição atual'],
        ['rotate','Girar navio'],['auto','Posicionar frota automaticamente'],['difficulty','Alterar dificuldade'],['ready','Confirmar frota pronta'],
        ['attack','Selecionar ataque'],['move','Selecionar movimento'],['trap','Selecionar armadilha'],['analyze','Selecionar análise'],['end','Encerrar turno'],
        ['true','Responder Verdadeiro'],['false','Responder Falso'],['continue','Continuar'],['cancel','Cancelar'],['restart','Jogar novamente']
      ];
      for(const [action,label] of defs){
        const button=document.createElement('button');
        button.type='button';button.dataset.action=action;button.textContent=label;button.setAttribute('aria-label',label);
        button.addEventListener('focus',()=>{this.a11yFocusAction=action;this.a11yPaletteOpen=true;});
        button.addEventListener('click',()=>this.runA11yAction(action));
        controls.appendChild(button);this.a11yControls[action]=button;
      }
      controls.addEventListener('focusout',()=>setTimeout(()=>{if(!controls.contains(document.activeElement)){this.a11yPaletteOpen=false;this.a11yFocusAction=null;}},0));
      canvas.setAttribute('aria-describedby','gdmInstructions gdmVisualDescription gdmState');
      this.syncA11y(true);
    }

    announce(text){ if(this.live){ this.live.textContent=''; setTimeout(()=>{this.live.textContent=text;},10); } this.syncA11y(); }

    focusA11yControls(){
      const first=Object.values(this.a11yControls).find(b=>!b.disabled);
      if(first) first.focus();
    }

    runA11yAction(action){
      this.audio.ensure();
      if(action==='help'){this.openHelp();return;}
      if(action==='settings'){this.openSettings();return;}
      if(action==='music'){this.toggleMusic();return;}
      if(action==='sfx'){this.toggleSfx();return;}
      if(['up','down','left','right'].includes(action)){
        const d={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]}[action];
        if(this.state.modal) return;
        if(this.state.phase==='placement'){
          const h=GDM_LOGIC.home(this.state.placementOwner);
          this.state.cursor.row=clamp(this.state.cursor.row+d[0],0,9);
          this.state.cursor.col=clamp(this.state.cursor.col+d[1],h.minCol,h.maxCol);
        }else if(this.state.phase==='battle'&&this.state.action==='move'&&this.selectedShip()) this.moveSelected(d[0],d[1]);
        else{
          this.state.cursor.row=clamp(this.state.cursor.row+d[0],0,9);
          this.state.cursor.col=clamp(this.state.cursor.col+d[1],0,29);
        }
        this.announce(`Coordenada ${GDM_LOGIC.coordWithZone(this.state.cursor.row,this.state.cursor.col)}.`);return;
      }
      if(action==='confirm'){
        if(this.state.modal){this.runA11yAction('continue');return;}
        if(this.state.phase==='placement')this.placeSelectedAtCursor();
        else if(this.state.phase==='battle'){
          if(this.state.action)this.executeCellAction(this.state.cursor.row,this.state.cursor.col);
          else{const ship=GDM_LOGIC.shipAt(this.state,this.state.cursor.row,this.state.cursor.col,this.state.turn);if(ship)this.selectShip(ship.uid);}
        }
        return;
      }
      if(action==='rotate'){this.rotateSelected();return;}
      if(action==='auto'){this.autoPlace();return;}
      if(action==='difficulty'){this.cycleDifficulty();return;}
      if(action==='ready'){this.readyPlacement();return;}
      if(action==='attack'||action==='move'||action==='trap'||action==='analyze'){this.setAction(action);return;}
      if(action==='end'){this.endTurn();return;}
      if(action==='true'){this.answerQuestion(true);return;}
      if(action==='false'){this.answerQuestion(false);return;}
      if(action==='cancel'){
        if(this.state.modal?.type==='risk')this.confirmRisk(false);
        else if(['help','settings'].includes(this.state.modal?.type))this.state.modal=null;
        return;
      }
      if(action==='continue'){
        const m=this.state.modal;
        if(!m)return;
        if(m.type==='handoff'){this.acceptHandoff();return;}
        if(m.type==='feedback'){this.state.modal=null;this.computeRadar(this.state.turn);return;}
        if(m.type==='risk'){this.confirmRisk(true);return;}
        if(['help','settings'].includes(m.type)){this.state.modal=null;return;}
        if(m.type==='end'){this.restart();return;}
        return;
      }
      if(action==='restart'){this.restart();return;}
    }

    syncA11y(force=false){
      if(!this.a11yRoot)return;
      const m=this.state.modal;
      const allowed=new Set(['help','settings','music','sfx']);
      if(m){
        allowed.clear();
        if(m.type==='question'){allowed.add('true');allowed.add('false');}
        else if(m.type==='risk'){allowed.add('continue');allowed.add('cancel');}
        else if(m.type==='end'){allowed.add('restart');}
        else{allowed.add('continue');if(['help','settings'].includes(m.type))allowed.add('cancel');}
      }else if(this.state.phase==='placement'){
        ['up','down','left','right','confirm','rotate','auto','ready'].forEach(x=>allowed.add(x));
        if(this.state.placementOwner==='player1'&&!this.state.ships.player1.some(s=>s.row!==null)&&!hasPlatformDifficulty())allowed.add('difficulty');
      }else if(this.state.phase==='battle'){
        ['up','down','left','right','confirm','attack','move','trap','analyze','end'].forEach(x=>allowed.add(x));
      }
      for(const [action,button] of Object.entries(this.a11yControls)) button.disabled=!allowed.has(action);
      const owner=this.currentOwner(),scores=this.currentScores(),elapsed=this.elapsedText();
      const selected=this.selectedShip();
      const status=[
        `Fase ${this.state.phase==='placement'?'posicionamento':this.state.phase==='battle'?'batalha':this.state.phase==='end'?'fim de partida':'carregamento'}.`,
        `${this.ownerLabel(owner)}. Dificuldade ${GDM_CONFIG.difficulties[this.state.difficulty].label}. Rodada ${this.state.round}.`,
        `Tempo decorrido ${elapsed}. Pontuação Jogador 1 ${scores.player1} de 100. Pontuação Jogador 2 ${scores.player2} de 100.`,
        `Cursor em ${GDM_LOGIC.coordWithZone(this.state.cursor.row,this.state.cursor.col)}.`
      ];
      if(selected)status.push(`${selected.name}, ${Math.max(0,selected.hp)} de ${selected.maxHp} pontos de vida, ${selected.availableCharges} de ${selected.maxCharges} cargas disponíveis.`);
      this.a11yRoot.querySelector('#gdmState').textContent=status.join(' ');
    }

    async loadAssets(){
      const waterPromises=[];
      for(const zone of ['player1','neutral','player2']){
        ASSET_PATHS.water[zone].forEach((p,idx)=>waterPromises.push(loadImage(p).then(i=>this.img.water[zone][idx]=i)));
      }
      const shipPromises=Object.entries(ASSET_PATHS.ships).map(([k,p])=>loadImage(p).then(i=>this.img.ships[k]=i));
      const expPromises=ASSET_PATHS.explosion.map((p,idx)=>loadImage(p).then(i=>this.img.explosion[idx]=i));
      const uiPromises=Object.entries(ASSET_PATHS.ui).map(([k,p])=>loadImage(p).then(i=>this.img.ui[k]=i));
      await Promise.all([...waterPromises,...shipPromises,...expPromises,...uiPromises]);
    }

    async loadQuestions(){
      try{
        const r=await fetch('assets/data/perguntas.json',{cache:'no-store'});
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        this.questions=await r.json();
        this.questionsLoaded=Array.isArray(this.questions)&&this.questions.length>0;
      }catch(err){
        this.questionsLoaded=false;
        console.warn('Perguntas indisponíveis. Execute assets/tools/JOGAR_AGORA.bat para testar via servidor local.',err);
      }
    }

    resize(){
      const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
      const w=Math.max(320,window.innerWidth), h=Math.max(240,window.innerHeight);
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
      canvas.style.width=w+'px'; canvas.style.height=h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.imageSmoothingEnabled=false;
      const cell=Math.max(9,Math.floor(Math.min((w-12)/30,(h-120)/10)));
      const gw=cell*30, gh=cell*10;
      this.geom={w,h,dpr,cell,gx:Math.floor((w-gw)/2),gy:Math.floor((h-gh)/2),gw,gh};
    }

    bindInput(){
      canvas.addEventListener('pointermove',e=>this.onPointerMove(e));
      canvas.addEventListener('pointerdown',e=>{this.audio.ensure(); canvas.focus(); this.pointerDown={x:e.clientX,y:e.clientY};});
      canvas.addEventListener('pointerup',e=>this.onPointerUp(e));
      canvas.addEventListener('contextmenu',e=>e.preventDefault());
      window.addEventListener('keydown',e=>this.onKey(e));
    }

    pointerPos(e){ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
    cellAt(x,y){
      const g=this.geom;
      if(x<g.gx||y<g.gy||x>=g.gx+g.gw||y>=g.gy+g.gh) return null;
      return {row:Math.floor((y-g.gy)/g.cell),col:Math.floor((x-g.gx)/g.cell)};
    }

    onPointerMove(e){
      const p=this.pointerPos(e); this.hover.x=p.x; this.hover.y=p.y;
      this.hover.cell=this.cellAt(p.x,p.y);
      this.hover.button=this.buttons.find(b=>hit(b,p.x,p.y))||null;
    }

    onPointerUp(e){
      const p=this.pointerPos(e); const down=this.pointerDown; this.pointerDown=null;
      if(down && Math.hypot(p.x-down.x,p.y-down.y)>GDM_CONFIG.input.dragThreshold) return;
      this.handleClick(p.x,p.y);
    }

    onKey(e){
      if(e.key==='F1'){ e.preventDefault(); this.openHelp(); return; }
      if(e.key==='F2'){ e.preventDefault(); this.openSettings(); return; }
      if(e.key==='F3'){ e.preventDefault(); this.focusA11yControls(); return; }
      if(e.key.toLowerCase()==='m'){ this.toggleMusic(); return; }
      if(this.state.modal){ this.handleModalKey(e); return; }
      if(this.state.phase==='placement') this.handlePlacementKey(e);
      else if(this.state.phase==='battle') this.handleBattleKey(e);
    }

    handleModalKey(e){
      const m=this.state.modal;
      if(m.type==='handoff' && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); this.acceptHandoff(); return; }
      if(m.type==='feedback' && e.key==='Enter'){e.preventDefault();this.state.modal=null;this.computeRadar(this.state.turn);return;}
      if(m.type==='question'){
        const k=e.key.toLowerCase();
        if(k==='v'){e.preventDefault();this.answerQuestion(true);return;}
        if(k==='f'){e.preventDefault();this.answerQuestion(false);return;}
      }
      if(m.type==='risk'){
        if(e.key==='Enter'){e.preventDefault();this.confirmRisk(true);return;}
        if(e.key==='Escape'){e.preventDefault();this.confirmRisk(false);return;}
      }
      if(['help','settings'].includes(m.type) && e.key==='Escape'){e.preventDefault();this.state.modal=null;return;}
      if(m.type==='end' && e.key==='Enter'){e.preventDefault();this.restart();return;}
    }

    handlePlacementKey(e){
      const k=e.key.toLowerCase();
      if(k==='r'){e.preventDefault();this.rotateSelected();return;}
      if(k==='p'){e.preventDefault();this.autoPlace();return;}
      if(e.key==='Enter'){e.preventDefault();this.placeSelectedAtCursor();return;}
      const delta={arrowup:[-1,0],w:[-1,0],arrowdown:[1,0],s:[1,0],arrowleft:[0,-1],a:[0,-1],arrowright:[0,1],d:[0,1]}[k];
      if(delta){
        e.preventDefault();
        const h=GDM_LOGIC.home(this.state.placementOwner);
        this.state.cursor.row=clamp(this.state.cursor.row+delta[0],0,9);
        this.state.cursor.col=clamp(this.state.cursor.col+delta[1],h.minCol,h.maxCol);
        this.announce(`Coordenada ${GDM_LOGIC.coordWithZone(this.state.cursor.row,this.state.cursor.col)}.`);
      }
    }

    handleBattleKey(e){
      const k=e.key.toLowerCase();
      if(k==='1'){e.preventDefault();this.setAction('attack');return;}
      if(k==='2'){e.preventDefault();this.setAction('move');return;}
      if(k==='3'){e.preventDefault();this.setAction('trap');return;}
      if(k==='4'){e.preventDefault();this.setAction('analyze');return;}
      if(e.key===' '){e.preventDefault();this.endTurn();return;}
      const delta={arrowup:[-1,0],w:[-1,0],arrowdown:[1,0],s:[1,0],arrowleft:[0,-1],a:[0,-1],arrowright:[0,1],d:[0,1]}[k];
      if(delta){
        e.preventDefault();
        if(this.state.action==='move' && this.selectedShip()) this.moveSelected(delta[0],delta[1]);
        else{
          this.state.cursor.row=clamp(this.state.cursor.row+delta[0],0,9);
          this.state.cursor.col=clamp(this.state.cursor.col+delta[1],0,29);
          this.announce(`Coordenada ${GDM_LOGIC.coordWithZone(this.state.cursor.row,this.state.cursor.col)}.`);
        }
        return;
      }
      if(e.key==='Enter'){
        e.preventDefault();
        if(this.state.action) this.executeCellAction(this.state.cursor.row,this.state.cursor.col);
        else{
          const s=GDM_LOGIC.shipAt(this.state,this.state.cursor.row,this.state.cursor.col,this.state.turn);
          if(s) this.selectShip(s.uid);
        }
      }
    }

    handleClick(x,y){
      if(this.state.modal){ this.handleModalClick(x,y); return; }
      const b=this.buttons.find(r=>hit(r,x,y));
      if(b){ b.onClick(); return; }
      const fb=this.fleetButtons.find(r=>hit(r,x,y));
      if(fb){ this.selectShip(fb.shipId); return; }
      const c=this.cellAt(x,y);
      if(!c) return;
      this.state.cursor={...c};
      if(this.state.phase==='placement'){
        const own=GDM_LOGIC.shipAt(this.state,c.row,c.col,this.state.placementOwner);
        if(own){ this.selectShip(own.uid); return; }
        this.placeSelected(c.row,c.col);
      }else if(this.state.phase==='battle'){
        if(this.state.action) this.executeCellAction(c.row,c.col);
        else{
          const own=GDM_LOGIC.shipAt(this.state,c.row,c.col,this.state.turn);
          if(own) this.selectShip(own.uid);
        }
      }
    }

    handleModalClick(x,y){
      const m=this.state.modal;
      const b=(m.buttons||[]).find(r=>hit(r,x,y));
      if(b){ b.onClick(); return; }
    }

    resetMatch(diff='medio'){
      const settings=this.state.settings||{highContrast:false,fontScale:1,music:true,sfx:true};
      this.state=this.createState(); this.state.settings=settings; this.state.difficulty=normalizeDifficulty(diff)||'medio';
      this.state.startAt=Date.now();
      if(typeof resetScoreSubmission==='function')resetScoreSubmission();
      this.audio.music=settings.music; this.audio.sfx=settings.sfx; this.audio.syncMusic();
      this.createFleets();
      this.state.placementOwner='player1';
      this.state.selectedShipId=this.state.ships.player1[0]?.uid||null;
      this.state.cursor={row:0,col:0};
      this.syncA11y(true);
    }

    createFleets(){
      const ids=this.presetFleet(this.state.difficulty);
      for(const owner of ['player1','player2']){
        this.state.ships[owner]=ids.map((id,i)=>this.makeShip(owner,id,i));
      }
    }

    presetFleet(diff){
      const budget=GDM_CONFIG.difficulties[diff].coins;
      const ids=[]; let spent=0;
      for(const id of ['trap-layer','battleship','cruiser','destroyer']){
        const c=GDM_CONFIG.ships[id]; if(spent+c.price<=budget){ids.push(id);spent+=c.price;}
      }
      while(spent+300<=budget && ids.length<7){ids.push('destroyer');spent+=300;}
      return ids;
    }

    makeShip(owner,typeId,i){
      const c=GDM_CONFIG.ships[typeId];
      return {uid:`${owner}-${typeId}-${i}`,owner,typeId,name:c.name,size:c.size,maxHp:c.hp,hp:c.hp,maxCharges:c.charges,availableCharges:c.charges,rechargeQueue:[],damage:c.damage,chargeType:c.chargeType,trapStock:c.trapStock||0,row:null,col:null,orientation:'horizontal',cells:[],destroyed:false,turnLocked:false,movedThisTurn:false};
    }

    currentOwner(){ return this.state.phase==='placement'?this.state.placementOwner:this.state.turn; }
    ownerLabel(o){ return o==='player1'?'JOGADOR 1':'JOGADOR 2'; }
    selectedShip(){
      const owner=this.currentOwner();
      return this.state.ships[owner].find(s=>s.uid===this.state.selectedShipId&&!s.destroyed)||null;
    }

    selectShip(uid){
      const owner=this.currentOwner();
      const s=this.state.ships[owner].find(x=>x.uid===uid&&!x.destroyed); if(!s) return;
      this.state.selectedShipId=uid;
      this.state.action=null;
      if(s.row!==null) this.state.cursor={row:s.row,col:s.col};
      this.announce(`${s.name} selecionado. ${Math.max(0,s.hp)} de ${s.maxHp} pontos de vida. ${s.availableCharges} cargas disponíveis.`);
      this.audio.beep(520,.05,.035);
    }

    rotateSelected(){
      const s=this.selectedShip(); if(!s||this.state.phase!=='placement') return;
      const next=s.orientation==='horizontal'?'vertical':'horizontal';
      if(s.row!==null && !GDM_LOGIC.canPlace(this.state,s,s.row,s.col,next)){this.toast('NÃO CABE NESSA POSIÇÃO');this.audio.beep(150,.08);return;}
      s.orientation=next;
      if(s.row!==null) GDM_LOGIC.refresh(s);
      this.toast(next==='horizontal'?'HORIZONTAL':'VERTICAL');
    }

    placeSelectedAtCursor(){ this.placeSelected(this.state.cursor.row,this.state.cursor.col); }
    placeSelected(row,col){
      const s=this.selectedShip(); if(!s||this.state.phase!=='placement') return;
      if(!GDM_LOGIC.canPlace(this.state,s,row,col,s.orientation)){this.toast('POSIÇÃO INVÁLIDA');this.audio.beep(150,.08);return;}
      s.row=row;s.col=col;GDM_LOGIC.refresh(s);this.audio.beep(720,.05,.04);
      const next=this.state.ships[this.state.placementOwner].find(x=>x.row===null);
      if(next){this.state.selectedShipId=next.uid;const h=GDM_LOGIC.home(this.state.placementOwner);this.state.cursor={row:0,col:h.minCol};}
      else this.toast('FROTA PRONTA');
    }

    autoPlace(){
      if(this.state.phase!=='placement') return;
      const owner=this.state.placementOwner, h=GDM_LOGIC.home(owner);
      for(const s of this.state.ships[owner]){s.row=null;s.col=null;s.cells=[];}
      for(const s of this.state.ships[owner]){
        let ok=false;
        for(let tries=0;tries<1000&&!ok;tries++){
          const ori=Math.random()<.5?'horizontal':'vertical';
          const row=rand(10), col=h.minCol+rand(h.maxCol-h.minCol+1);
          if(GDM_LOGIC.canPlace(this.state,s,row,col,ori)){s.orientation=ori;s.row=row;s.col=col;GDM_LOGIC.refresh(s);ok=true;}
        }
        if(!ok){this.toast('AUTO POSICIONAMENTO FALHOU');return;}
      }
      this.state.selectedShipId=this.state.ships[owner][0]?.uid||null;
      this.toast('FROTA POSICIONADA'); this.audio.beep(760,.08,.04);
    }

    fleetReady(owner=this.state.placementOwner){ return this.state.ships[owner].length>0&&this.state.ships[owner].every(s=>s.row!==null); }

    readyPlacement(){
      if(!this.fleetReady()){this.toast('POSICIONE TODOS OS NAVIOS');return;}
      if(this.state.placementOwner==='player1'){
        this.openHandoff('player2','JOGADOR 1 PRONTO','PASSE O CONTROLE PARA O JOGADOR 2',()=>{
          this.state.placementOwner='player2';this.state.selectedShipId=this.state.ships.player2[0]?.uid||null;this.state.cursor={row:0,col:20};
          this.announce('Jogador 2. Posicione sua frota no oceano direito.');
        });
      }else this.beginBattle();
    }

    beginBattle(){
      this.state.phase='battle';
      this.state.turn=Math.random()<.5?'player1':'player2';this.state.roundStarter=this.state.turn;this.state.round=1;this.state.selectedShipId=null;this.state.action=null;
      const first=this.state.turn;
      this.openHandoff(first,'BATALHA PRONTA',`${this.ownerLabel(first)} COMEÇA`,()=>this.startTurn(first));
    }

    startTurn(owner){
      this.state.phase='battle';this.state.turn=owner;this.state.analysisAvailable[owner]=true;this.state.selectedShipId=null;this.state.action=null;
      for(const s of this.state.ships[owner]){s.turnLocked=false;s.movedThisTurn=false;if(!s.destroyed)GDM_LOGIC.recoverCharges(s,this.state.round);}
      this.computeRadar(owner);
      this.toast(`VEZ DO ${this.ownerLabel(owner)}`);
      this.announce(`Rodada ${this.state.round}. Vez do ${this.ownerLabel(owner)}.`);
    }

    endTurn(){
      if(this.state.phase!=='battle'||this.state.modal) return;
      const current=this.state.turn, next=GDM_LOGIC.other(current);
      const newRound=next===this.state.roundStarter?this.state.round+1:this.state.round;
      this.openHandoff(next,`${this.ownerLabel(current)} ENCERROU`,`PASSE O CONTROLE PARA ${this.ownerLabel(next)}`,()=>{this.state.round=newRound;this.startTurn(next);});
    }

    setAction(action){
      if(this.state.phase!=='battle'||this.state.modal) return;
      if(action==='analyze'){
        if(!this.state.analysisAvailable[this.state.turn]){this.toast('ANÁLISE JÁ USADA');return;}
        if(!this.questionsLoaded){this.toast('ABRA PELO JOGAR_AGORA.BAT');return;}
        this.state.action='analyze';this.toast('SELECIONE UM CONTATO DO RADAR');return;
      }
      const s=this.selectedShip(); if(!s){this.toast('SELECIONE UM NAVIO');return;}
      if(s.turnLocked){this.toast('NAVIO JÁ MOVEU/ARMOU');return;}
      if(action==='attack' && s.chargeType!=='missile'){this.toast('ESSE NAVIO NÃO TEM MÍSSEIS');return;}
      if(action==='trap' && s.typeId!=='trap-layer'){this.toast('USE O LANÇA-ARMADILHAS');return;}
      if((action==='attack'||action==='trap')&&s.availableCharges<=0){this.toast('SEM CARGA • AGUARDE RECARGA');return;}
      if(action==='trap'&&s.trapStock<=0){this.toast('SEM ARMADILHAS NO ESTOQUE');return;}
      this.state.action=action;
      this.toast(action==='attack'?'MODO ATAQUE':action==='move'?'MODO MOVIMENTO':'MODO ARMADILHA');
    }

    executeCellAction(row,col){
      if(this.state.action==='attack') this.attack(row,col);
      else if(this.state.action==='move') this.moveByClickedCell(row,col);
      else if(this.state.action==='trap') this.placeTrap(row,col);
      else if(this.state.action==='analyze') this.analyze(row,col);
    }

    attack(row,col,skipRisk=false){
      const owner=this.state.turn, opponent=GDM_LOGIC.other(owner), s=this.selectedShip();
      if(!s||s.chargeType!=='missile'||s.availableCharges<=0||s.turnLocked) return;
      const targetShip=GDM_LOGIC.shipAt(this.state,row,col,opponent), targetTrap=GDM_LOGIC.trapAt(this.state,row,col,opponent), obj=targetShip||targetTrap;
      if(obj&&!skipRisk){
        const id=GDM_LOGIC.objectId(obj,targetShip?'ship':'trap');
        if(this.state.detected[owner].has(id)&&!this.state.revealed[owner].has(id)){
          this.state.modal={type:'risk',row,col,buttons:[]}; this.announce('Contato de radar não analisado. Enter confirma o ataque ou Escape cancela.'); return;
        }
      }
      GDM_LOGIC.spendCharge(s,this.state.round);this.state.stats[owner].attacks++;this.audio.beep(210,.08,.06);
      if(targetTrap){
        targetTrap.active=false;s.hp-=GDM_CONFIG.traps.damage;this.state.stats[owner].trapsTriggered++;this.state.revealed[owner].add(GDM_LOGIC.objectId(targetTrap,'trap'));
        this.state.marks[owner].set(`${row}:${col}`,'hit');this.spawnExplosion(row,col);this.toast('ARMADILHA! -1500 HP');
        if(s.hp<=0){s.destroyed=true;s.cells=[];this.toast(`${s.name} DESTRUÍDO`);}
      }else if(targetShip){
        targetShip.hp-=s.damage;this.state.stats[owner].hits++;this.state.marks[owner].set(`${row}:${col}`,'hit');this.spawnExplosion(row,col);
        if(targetShip.hp<=0){targetShip.destroyed=true;targetShip.cells=[];this.state.stats[owner].shipsDestroyed++;this.toast(`${targetShip.name} DESTRUÍDO`);}else this.toast(`ACERTO • ${s.damage} DANO`);
      }else{
        this.state.marks[owner].set(`${row}:${col}`,'miss');this.audio.beep(120,.06,.035);this.toast('ÁGUA');
      }
      this.state.action=null;this.computeRadar(owner);this.checkEnd();
    }

    moveByClickedCell(row,col){
      const s=this.selectedShip();if(!s)return;
      const minR=Math.min(...s.cells.map(c=>c.row)),maxR=Math.max(...s.cells.map(c=>c.row)),minC=Math.min(...s.cells.map(c=>c.col)),maxC=Math.max(...s.cells.map(c=>c.col));
      let dr=0,dc=0;
      if(row===minR-1&&col>=minC&&col<=maxC)dr=-1;else if(row===maxR+1&&col>=minC&&col<=maxC)dr=1;else if(col===minC-1&&row>=minR&&row<=maxR)dc=-1;else if(col===maxC+1&&row>=minR&&row<=maxR)dc=1;else{this.toast('CLIQUE EM UMA CASA AO LADO');return;}
      this.moveSelected(dr,dc);
    }

    moveSelected(dr,dc){
      const s=this.selectedShip();if(!s||s.turnLocked)return;
      if(!GDM_LOGIC.canMove(this.state,s,dr,dc)){this.toast('MOVIMENTO BLOQUEADO');this.audio.beep(140,.06);return;}
      s.row+=dr;s.col+=dc;GDM_LOGIC.refresh(s);s.turnLocked=true;s.movedThisTurn=true;this.state.action=null;this.audio.beep(350,.05,.035);this.computeRadar(this.state.turn);this.toast('NAVIO MOVEU 1 CASA');
    }

    placeTrap(row,col){
      const owner=this.state.turn,s=this.selectedShip();if(!s||s.typeId!=='trap-layer'||s.availableCharges<=0||s.trapStock<=0||s.turnLocked)return;
      const zone=GDM_LOGIC.zone(col);const allowed=owner==='player1'?['player1','neutral']:['player2','neutral'];
      if(!allowed.includes(zone)){this.toast('USE SEU OCEANO OU O NEUTRO');return;}
      if(GDM_LOGIC.distanceToShip({row,col},s)>GDM_CONFIG.traps.launchRadius){this.toast('FORA DO ALCANCE 7');return;}
      if(GDM_LOGIC.shipAt(this.state,row,col)||GDM_LOGIC.trapAt(this.state,row,col)){this.toast('CASA OCUPADA');return;}
      GDM_LOGIC.spendCharge(s,this.state.round);s.trapStock--;s.turnLocked=true;this.state.traps.push({uid:`trap-${owner}-${Date.now()}-${Math.random()}`,owner,row,col,active:true});this.state.action=null;this.audio.beep(520,.08,.045);this.computeRadar(owner);this.toast('ARMADILHA LANÇADA');
    }

    analyze(row,col){
      const owner=this.state.turn,opponent=GDM_LOGIC.other(owner);if(!this.state.analysisAvailable[owner])return;
      const ship=GDM_LOGIC.shipAt(this.state,row,col,opponent),trap=GDM_LOGIC.trapAt(this.state,row,col,opponent),obj=ship||trap;
      if(!obj){this.toast('NENHUM CONTATO NESSA CASA');return;}
      const type=ship?'ship':'trap',id=GDM_LOGIC.objectId(obj,type);
      if(!this.state.detected[owner].has(id)){this.toast('FORA DO RADAR');return;}
      if(this.state.revealed[owner].has(id)){this.toast('OBJETO JÁ IDENTIFICADO');return;}
      if(!this.questionsLoaded){this.toast('PERGUNTAS NÃO CARREGADAS');return;}
      const q=this.pickQuestion();if(!q){this.toast('20 PERGUNTAS DESTE NÍVEL JÁ USADAS');this.announce('Todas as vinte perguntas deste nível já foram usadas nesta partida. Não haverá repetição.');return;}
      this.state.analysisAvailable[owner]=false;this.state.action=null;
      this.state.stats[owner].verificationAttempts++;
      this.state.modal={type:'question',question:q,target:obj,targetType:type,owner,buttons:[]};
      this.announce(`Pergunta de verdadeiro ou falso. ${q.pergunta} Pressione V para verdadeiro ou F para falso.`);
    }

    pickQuestion(){
      const pool=this.questions.filter(q=>q.dificuldade===this.state.difficulty&&!this.state.usedQuestionIds.has(q.id));
      return pool.length?pool[rand(pool.length)]:null;
    }

    answerQuestion(answer){
      const m=this.state.modal;if(!m||m.type!=='question')return;const q=m.question;this.state.usedQuestionIds.add(q.id);const correct=answer===q.resposta;
      if(correct){this.state.stats[m.owner].verificationCorrect++;this.state.revealed[m.owner].add(GDM_LOGIC.objectId(m.target,m.targetType));if(m.targetType==='trap')this.state.stats[m.owner].trapsDiscovered++;this.audio.beep(800,.12,.055);}else this.audio.beep(150,.14,.055);
      this.state.modal={type:'feedback',correct,question:q,buttons:[],until:0};
      this.announce(`${correct?'Resposta correta.':'Resposta incorreta.'} ${q.explicacao}`);
    }

    computeRadar(viewer){
      const opponent=GDM_LOGIC.other(viewer),det=this.state.detected[viewer];det.clear();const own=this.state.ships[viewer].filter(s=>!s.destroyed);
      for(const enemy of this.state.ships[opponent].filter(s=>!s.destroyed)){
        if(enemy.cells.some(ec=>own.some(os=>GDM_LOGIC.distanceToShip(ec,os)<=GDM_CONFIG.radar.radius)))det.add(GDM_LOGIC.objectId(enemy,'ship'));
      }
      for(const t of this.state.traps.filter(t=>t.active&&t.owner===opponent)){
        if(own.some(os=>GDM_LOGIC.distanceToShip(t,os)<=GDM_CONFIG.radar.radius))det.add(GDM_LOGIC.objectId(t,'trap'));
      }
    }

    elapsedSeconds(){ return Math.max(0,Math.floor((Date.now()-(this.state.startAt||Date.now()))/1000)); }
    elapsedText(){ const total=this.elapsedSeconds(),m=Math.floor(total/60),sec=total%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
    performanceScore(owner){
      const opponent=GDM_LOGIC.other(owner),enemy=this.state.ships[opponent];
      if(!enemy.length)return 0;
      const totalHp=enemy.reduce((sum,s)=>sum+s.maxHp,0)||1;
      const remaining=enemy.reduce((sum,s)=>sum+Math.max(0,s.hp),0);
      const combat=clamp((totalHp-remaining)/totalHp,0,1);
      const st=this.state.stats[owner];
      const analysis=st.verificationAttempts?st.verificationCorrect/st.verificationAttempts:0;
      const accuracy=st.attacks?st.hits/st.attacks:0;
      return clamp(Math.round(combat*55+analysis*35+accuracy*10),0,100);
    }
    currentScores(){
      if(this.state.finalScores)return this.state.finalScores;
      return {player1:this.performanceScore('player1'),player2:this.performanceScore('player2')};
    }

    checkEnd(){
      const a=this.state.ships.player1.some(s=>!s.destroyed),b=this.state.ships.player2.some(s=>!s.destroyed);if(a&&b)return false;
      this.state.winner=a?'player1':'player2';
      this.state.finalScores={player1:this.performanceScore('player1'),player2:this.performanceScore('player2')};
      this.state.platformScore=this.state.finalScores.player1;
      this.state.phase='end';this.state.modal={type:'end',buttons:[]};
      sendFinalScore({score:this.state.platformScore,difficulty:getPlatformDifficulty()});
      this.audio.beep(900,.25,.07);this.announce(`${this.ownerLabel(this.state.winner)} venceu. Pontuação do Jogador 1 enviada para a plataforma: ${this.state.platformScore} de 100. Enter para jogar novamente.`);return true;
    }

    restart(){ const d=this.state.difficulty;this.state.modal=null;this.resetMatch(d);this.state.phase='placement';this.announce('Nova partida. Jogador 1, posicione sua frota.'); }

    openHandoff(owner,title,detail,onAccept){this.state.modal={type:'handoff',owner,title,detail,onAccept,buttons:[]};this.announce(`${title}. ${detail}. Pressione Enter quando ${this.ownerLabel(owner)} estiver pronto.`);}
    acceptHandoff(){const m=this.state.modal;if(!m||m.type!=='handoff')return;const cb=m.onAccept;this.state.modal=null;if(cb)cb();}

    confirmRisk(yes){const m=this.state.modal;if(!m||m.type!=='risk')return;this.state.modal=null;if(yes)this.attack(m.row,m.col,true);else this.toast('ATAQUE CANCELADO');}

    openHelp(){ if(this.state.modal?.type==='handoff')return;this.state.modal={type:'help',buttons:[]};this.announce('Tutorial aberto. Escape fecha.'); }
    openSettings(){ if(this.state.modal?.type==='handoff')return;this.state.modal={type:'settings',buttons:[]};this.announce('Configurações de acessibilidade abertas. Escape fecha.'); }
    toggleMusic(){this.state.settings.music=!this.state.settings.music;this.audio.music=this.state.settings.music;this.audio.syncMusic();this.toast(this.state.settings.music?'MÚSICA LIGADA':'MÚSICA DESLIGADA');}
    toggleSfx(){this.state.settings.sfx=!this.state.settings.sfx;this.audio.sfx=this.state.settings.sfx;this.toast(this.state.settings.sfx?'EFEITOS LIGADOS':'EFEITOS DESLIGADOS');}
    cycleFont(){const vals=[1,1.25,1.5],i=vals.indexOf(this.state.settings.fontScale);this.state.settings.fontScale=vals[(i+1)%vals.length];this.toast(`TEXTO ${Math.round(this.state.settings.fontScale*100)}%`);}
    toggleContrast(){this.state.settings.highContrast=!this.state.settings.highContrast;this.toast(this.state.settings.highContrast?'ALTO CONTRASTE':'CONTRASTE NORMAL');}
    cycleDifficulty(){
      if(hasPlatformDifficulty()){this.toast('DIFICULDADE DEFINIDA PELA PLATAFORMA');return;}
      if(this.state.phase!=='placement'||this.state.placementOwner!=='player1'||this.state.ships.player1.some(s=>s.row!==null)){this.toast('MUDE A DIFICULDADE ANTES DE POSICIONAR');return;}
      const arr=['facil','medio','dificil'];const next=arr[(arr.indexOf(this.state.difficulty)+1)%arr.length];const settings=this.state.settings;this.resetMatch(next);this.state.settings=settings;this.state.phase='placement';this.toast(`DIFICULDADE ${GDM_CONFIG.difficulties[next].label}`);
    }

    spawnExplosion(row,col){this.state.effects.push({row,col,start:now()});}
    toast(text,ms=1700){this.state.toast={text,until:now()+ms};this.announce(text);}

    loop(t){
      this.lastTime=t;this.draw(t);requestAnimationFrame(tt=>this.loop(tt));
    }

    waterFrame(t){return Math.floor(t/GDM_CONFIG.animation.waterFrameMs)%4;}

    draw(t){
      const g=this.geom;ctx.setTransform(g.dpr,0,0,g.dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
      this.buttons=[];this.fleetButtons=[];
      this.drawOcean(t);
      if(this.assetsReady){
        this.drawGrid(t);
        this.drawWorld(t);
        this.drawHud(t);
      }else this.drawText('CARREGANDO SPRITES...',g.w/2,g.h/2,18,'#f3d99a','center');
      if(this.state.toast&&this.state.toast.until>t)this.drawToast(this.state.toast.text);else if(this.state.toast&&this.state.toast.until<=t)this.state.toast=null;
      if(this.state.modal)this.drawModal(t);
      if(this.a11yPaletteOpen&&this.a11yFocusAction)this.drawA11yFocus();
      if(t-this.lastA11ySync>500){this.syncA11y();this.lastA11ySync=t;}
    }

    drawOcean(t){
      const g=this.geom,frame=this.waterFrame(t),tile=64;
      ctx.fillStyle='#06191f';ctx.fillRect(0,0,g.w,g.h);
      if(!this.assetsReady)return;
      for(let y=0;y<g.h;y+=tile){
        for(let x=0;x<g.w;x+=tile){
          let zone='neutral';
          if(x<g.gx+g.cell*10)zone='player1';else if(x>=g.gx+g.cell*20)zone='player2';
          const img=this.img.water[zone][frame];if(img)ctx.drawImage(img,x,y,tile,tile);
        }
      }
      ctx.globalAlpha=.18;ctx.fillStyle='#000';ctx.fillRect(0,0,g.w,g.h);ctx.globalAlpha=1;
    }

    drawGrid(t){
      const g=this.geom,grid=this.img.ui[this.state.settings.highContrast?'grid_hc':'grid'];
      for(let r=0;r<10;r++)for(let c=0;c<30;c++)ctx.drawImage(grid,g.gx+c*g.cell,g.gy+r*g.cell,g.cell,g.cell);
      const buoy=this.img.ui.buoy;
      for(const boundary of [10,20]){
        const x=g.gx+boundary*g.cell;
        for(let r=0;r<10;r+=2)ctx.drawImage(buoy,x-8,g.gy+r*g.cell+g.cell/2-8,16,16);
      }
      if(g.cell>=10){
        const fs=Math.max(8,Math.min(11,g.cell*.34))*this.state.settings.fontScale;
        for(let c=0;c<30;c++)this.drawText(String.fromCharCode(65+(c%10)),g.gx+c*g.cell+g.cell/2,g.gy-4,fs,'#d5e7db','center');
        for(const start of [0,10,20])for(let r=0;r<10;r++)this.drawText(String(r+1),g.gx+start*g.cell+2,g.gy+r*g.cell+g.cell*.62,Math.max(8,fs*.85),'#d5e7db','left');
      }
    }

    drawWorld(t){
      if(this.state.phase==='placement')this.drawPlacementWorld(t);else if(['battle','end'].includes(this.state.phase))this.drawBattleWorld(t);
      this.drawCursor();this.drawEffects(t);
    }

    drawPlacementWorld(t){
      const owner=this.state.placementOwner;
      for(const s of this.state.ships[owner])if(s.row!==null)this.drawShip(s,1,s.uid===this.state.selectedShipId,t);
      const s=this.selectedShip();
      if(s&&this.hover.cell&&this.hover.cell.col>=GDM_LOGIC.home(owner).minCol&&this.hover.cell.col<=GDM_LOGIC.home(owner).maxCol){
        const valid=GDM_LOGIC.canPlace(this.state,s,this.hover.cell.row,this.hover.cell.col,s.orientation);
        this.drawShip({...s,row:this.hover.cell.row,col:this.hover.cell.col,cells:GDM_LOGIC.cells(this.hover.cell.row,this.hover.cell.col,s.size,s.orientation)},.55,false,t);
        this.drawCellCursor(this.hover.cell.row,this.hover.cell.col,valid?'valid':'invalid');
      }
    }

    drawBattleWorld(t){
      const viewer=this.state.turn,opponent=GDM_LOGIC.other(viewer);
      for(const s of this.state.ships[viewer])if(!s.destroyed)this.drawShip(s,1,s.uid===this.state.selectedShipId,t);
      for(const s of this.state.ships[opponent]){
        if(s.destroyed)continue;const id=GDM_LOGIC.objectId(s,'ship');
        if(this.state.revealed[viewer].has(id))this.drawShip(s,.95,false,t);
        else if(this.state.detected[viewer].has(id))for(const c of s.cells)this.drawCellSprite(this.img.ui.unknown,c.row,c.col,.82);
      }
      for(const tr of this.state.traps.filter(t=>t.active)){
        if(tr.owner===viewer)this.drawCellSprite(this.img.ui.mine,tr.row,tr.col,.86);
        else{
          const id=GDM_LOGIC.objectId(tr,'trap');
          if(this.state.revealed[viewer].has(id))this.drawCellSprite(this.img.ui.mine,tr.row,tr.col,.95);
          else if(this.state.detected[viewer].has(id))this.drawCellSprite(this.img.ui.unknown,tr.row,tr.col,.82);
        }
      }
      for(const [key,kind] of this.state.marks[viewer]){const [r,c]=key.split(':').map(Number);this.drawCellSprite(this.img.ui[kind],r,c,.9);}
    }

    drawShip(ship,alpha=1,selected=false,t=0){
      if(ship.row===null||ship.col===null)return;const img=this.img.ships[ship.typeId];if(!img)return;const g=this.geom,cell=g.cell;
      const horizontal=ship.orientation==='horizontal';
      const cx=g.gx+(ship.col+(horizontal?ship.size/2:.5))*cell;
      const cy=g.gy+(ship.row+(horizontal?.5:ship.size/2))*cell;
      const maxLen=cell*ship.size*.92,maxWidth=cell*.72;
      const scale=Math.min(maxLen/img.height,maxWidth/img.width);
      const dw=Math.max(1,Math.round(img.width*scale)),dh=Math.max(1,Math.round(img.height*scale));
      const bob=(Math.floor(t/GDM_CONFIG.animation.bobFrameMs)%2===0)?0:1;
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(cx),Math.round(cy+bob));if(horizontal)ctx.rotate(Math.PI/2);
      const wake=this.img.ui.wake;if(wake&&!ship.destroyed){ctx.globalAlpha=alpha*.55;const ww=Math.min(cell*.7,dw*1.5),wh=ww*.5;ctx.drawImage(wake,-ww/2,dh/2-wh*.15,ww,wh);ctx.globalAlpha=alpha;}
      ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
      if(selected){
        for(const c of ship.cells)this.drawCellCursor(c.row,c.col,'cursor');
      }
    }

    drawCellSprite(img,row,col,alpha=1){const g=this.geom;if(!img)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,g.gx+col*g.cell,g.gy+row*g.cell,g.cell,g.cell);ctx.restore();}
    drawCellCursor(row,col,type='cursor'){this.drawCellSprite(this.img.ui[type],row,col,1);}
    drawCursor(){
      if(this.state.modal)return;const c=this.hover.cell||this.state.cursor;if(!c)return;
      let type='cursor';if(this.state.phase==='battle'&&this.state.action==='attack')type='target';
      this.drawCellCursor(c.row,c.col,type);
    }

    drawEffects(t){
      const keep=[];
      for(const e of this.state.effects){const i=Math.floor((t-e.start)/GDM_CONFIG.animation.explosionFrameMs);if(i>=this.img.explosion.length)continue;keep.push(e);this.drawCellSprite(this.img.explosion[i],e.row,e.col,1);}
      this.state.effects=keep;
    }

    drawHud(t){
      const g=this.geom;
      this.drawTopStatus();
      if(this.state.phase==='placement')this.drawPlacementHud();else if(['battle','end'].includes(this.state.phase))this.drawBattleHud();
      const icon=g.w<600?32:42,sp=g.w<600?4:7;let x=g.w-icon-8,y=8;
      this.addIconButton('help',x,y,icon,icon,()=>this.openHelp(),'AJUDA');x-=icon+sp;
      this.addIconButton('settings',x,y,icon,icon,()=>this.openSettings(),'ACESSIBILIDADE');x-=icon+sp;
      this.addIconButton('music',x,y,icon,icon,()=>this.toggleMusic(),this.state.settings.music?'MÚSICA ON':'MÚSICA OFF');
    }

    drawTopStatus(){
      const g=this.geom,owner=this.currentOwner(),diff=GDM_CONFIG.difficulties[this.state.difficulty].label,scores=this.currentScores();
      const line1=this.state.phase==='placement'?`${this.ownerLabel(owner)} • POSICIONAMENTO • ${diff}`:`${this.ownerLabel(owner)} • RODADA ${this.state.round} • ${diff}`;
      const line2=`J1 ${scores.player1}/100 • J2 ${scores.player2}/100 • TEMPO ${this.elapsedText()}`;
      const w=g.w<700?Math.min(g.w-12,520):Math.min(520,g.w-280),h=52,x=(g.w-w)/2,y=g.w<700?46:6;
      this.drawPanel(x,y,w,h);this.drawText(line1,g.w/2,y+21,12*this.state.settings.fontScale,'#f4dda0','center');this.drawText(line2,g.w/2,y+41,10*this.state.settings.fontScale,'#d8ebe0','center');
    }

    drawPlacementHud(){
      const g=this.geom,owner=this.state.placementOwner,icon=g.w<600?32:42,sp=g.w<600?4:7;
      this.addIconButton('auto',8,8,icon,icon,()=>this.autoPlace(),'AUTO POSICIONAR');
      this.addIconButton('rotate',8+(icon+sp),8,icon,icon,()=>this.rotateSelected(),'GIRAR NAVIO');
      this.addIconButton('difficulty',8+2*(icon+sp),8,icon,icon,()=>this.cycleDifficulty(),hasPlatformDifficulty()?'DIFICULDADE DA PLATAFORMA':'DIFICULDADE',hasPlatformDifficulty());
      const ready=this.fleetReady(owner);this.addIconButton('ready',8+3*(icon+sp),8,icon,icon,()=>this.readyPlacement(),ready?'PRONTO':'POSICIONE A FROTA',!ready);
      this.drawFleetDock(owner,false);
      if(this.hover.button)this.drawTooltip(this.hover.button.label,this.hover.x,this.hover.y);
    }

    drawBattleHud(){
      const owner=this.state.turn,g=this.geom,icon=46,sp=8,total=icon*5+sp*4,x0=(g.w-total)/2,y=g.h-icon-10;
      this.addIconButton('attack',x0,y,icon,icon,()=>this.setAction('attack'),'ATACAR');
      this.addIconButton('move',x0+(icon+sp),y,icon,icon,()=>this.setAction('move'),'MOVER');
      this.addIconButton('trap',x0+2*(icon+sp),y,icon,icon,()=>this.setAction('trap'),'ARMADILHA');
      this.addIconButton('analyze',x0+3*(icon+sp),y,icon,icon,()=>this.setAction('analyze'),'ANALISAR');
      this.addIconButton('end',x0+4*(icon+sp),y,icon,icon,()=>this.endTurn(),'PASSAR TURNO');
      this.drawFleetDock(owner,true);
      const s=this.selectedShip();
      if(s){const bx=10,by=g.h-112,bw=Math.min(300,g.w*.34),bh=54;this.drawPanel(bx,by,bw,bh);const charges='●'.repeat(s.availableCharges)+'○'.repeat(Math.max(0,s.maxCharges-s.availableCharges));this.drawText(`${s.name}  HP ${Math.max(0,s.hp)}/${s.maxHp}  ${charges}`,bx+12,by+32,11*this.state.settings.fontScale,'#d9e9dd','left');}
      if(this.hover.button)this.drawTooltip(this.hover.button.label,this.hover.x,this.hover.y);
    }

    drawFleetDock(owner,battle){
      const g=this.geom,list=this.state.ships[owner],slot=Math.min(70,Math.max(36,(g.w-20)/Math.max(1,list.length))),total=slot*list.length,start=Math.max(6,(g.w-total)/2),y=g.h-(battle?66:74);
      for(let i=0;i<list.length;i++){
        const s=list[i],x=start+i*slot,w=slot-6,h=54;
        if(s.uid===this.state.selectedShipId)this.drawFrameSprite(this.img.ui.cursor,x,y,w,h,.9);
        if(s.destroyed)ctx.globalAlpha=.28;
        this.drawShipThumb(s,x+4,y+4,w-8,28);
        ctx.globalAlpha=1;
        const hp=Math.max(0,s.hp/s.maxHp),barW=w-10;ctx.drawImage(this.img.ui.panel,x+5,y+37,barW,11);
        ctx.save();ctx.beginPath();ctx.rect(x+7,y+40,(barW-4)*hp,5);ctx.clip();ctx.drawImage(this.img.ui.valid,x+7,y+40,barW-4,5);ctx.restore();
        this.drawText(String(i+1),x+w-6,y+14,9,'#f2dfa4','right');
        this.fleetButtons.push({x,y,w,h,shipId:s.uid});
      }
    }

    drawShipThumb(ship,x,y,w,h){
      const img=this.img.ships[ship.typeId];if(!img)return;const scale=Math.min(w/img.height,h/img.width);const dw=img.width*scale,dh=img.height*scale;ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI/2);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
    }

    addIconButton(icon,x,y,w,h,onClick,label,disabled=false){
      const img=this.img.ui[icon];ctx.save();ctx.globalAlpha=disabled?.35:1;if(img)ctx.drawImage(img,x,y,w,h);ctx.restore();
      const active=this.state.action===icon;if(active)this.drawFrameSprite(this.img.ui.target,x-2,y-2,w+4,h+4,.9);
      this.buttons.push({id:icon,x,y,w,h,onClick:()=>{if(!disabled){this.audio.beep(430,.035,.025);onClick();}},label,disabled});
    }

    drawTooltip(text,x,y){
      const fs=10*this.state.settings.fontScale,w=Math.max(90,ctx.measureText(text).width+18),h=28,tx=clamp(x-w/2,4,this.geom.w-w-4),ty=clamp(y-36,4,this.geom.h-h-4);this.drawPanel(tx,ty,w,h);this.drawText(text,tx+w/2,ty+19,fs,'#f3dfa3','center');
    }

    drawToast(text){
      const g=this.geom,fs=13*this.state.settings.fontScale;ctx.font=`bold ${fs}px monospace`;const w=Math.min(g.w-20,Math.max(180,ctx.measureText(text).width+34)),h=38,x=(g.w-w)/2,y=g.gy+g.gh+10;this.drawPanel(x,y,w,h);this.drawText(text,g.w/2,y+25,fs,'#f3dfa3','center');
    }

    drawModal(t){
      const m=this.state.modal,g=this.geom;m.buttons=[];
      this.tileOverlay(this.img.ui.handoff,.96);
      if(m.type==='handoff'){
        const w=Math.min(560,g.w-30),h=190,x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText(m.title,g.w/2,y+54,22*this.state.settings.fontScale,'#f3d48b','center');this.drawText(m.detail,g.w/2,y+88,12*this.state.settings.fontScale,'#dbe5d8','center');
        const bw=240,bh=48,bx=(g.w-bw)/2,by=y+118;this.drawPanel(bx,by,bw,bh);this.drawText(`${this.ownerLabel(m.owner)} • CONTINUAR`,g.w/2,by+30,12*this.state.settings.fontScale,'#e9efdf','center');m.buttons.push({x:bx,y:by,w:bw,h:bh,onClick:()=>this.acceptHandoff()});
      }else if(m.type==='risk'){
        const w=Math.min(500,g.w-30),h=180,x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText('CONTATO NÃO ANALISADO',g.w/2,y+45,18*this.state.settings.fontScale,'#f0c36d','center');this.drawText('ATACAR MESMO ASSIM?',g.w/2,y+76,13*this.state.settings.fontScale,'#dfe9dc','center');this.twoChoiceButtons(m,y+105,'ATACAR','CANCELAR',()=>this.confirmRisk(true),()=>this.confirmRisk(false));
      }else if(m.type==='question'){
        const q=m.question,w=Math.min(720,g.w-30),h=Math.min(340,g.h-30),x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText(`ANÁLISE • ${q.habilidade||''}`,g.w/2,y+34,12*this.state.settings.fontScale,'#83dbe9','center');
        this.drawWrapped(q.pergunta,x+38,y+72,w-76,18*this.state.settings.fontScale,'#f0eadb','center',28*this.state.settings.fontScale);
        this.twoChoiceButtons(m,y+h-72,'VERDADEIRO [V]','FALSO [F]',()=>this.answerQuestion(true),()=>this.answerQuestion(false));
      }else if(m.type==='feedback'){
        const q=m.question,w=Math.min(660,g.w-30),h=260,x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText(m.correct?'RESPOSTA CORRETA':'RESPOSTA INCORRETA',g.w/2,y+45,20*this.state.settings.fontScale,m.correct?'#83e0a0':'#ef806e','center');this.drawWrapped(q.explicacao,x+35,y+82,w-70,14*this.state.settings.fontScale,'#e6ebdf','center',23*this.state.settings.fontScale);const bw=180,bh=42,bx=(g.w-bw)/2,by=y+h-58;this.drawPanel(bx,by,bw,bh);this.drawText('CONTINUAR',g.w/2,by+27,12*this.state.settings.fontScale,'#eee3c5','center');m.buttons.push({x:bx,y:by,w:bw,h:bh,onClick:()=>{this.state.modal=null;this.computeRadar(this.state.turn);}});
      }else if(m.type==='help'){
        const w=Math.min(720,g.w-30),h=Math.min(480,g.h-30),x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText('TUTORIAL',g.w/2,y+38,20*this.state.settings.fontScale,'#f0d392','center');const lines=['1×1 local: cada jogador posiciona sua frota em segredo.','Radar: contatos a até 3 casas aparecem como blocos desconhecidos.','Analisar: use uma pergunta V/F para identificar o contato.','Ataque: selecione um navio com míssil e escolha uma coordenada.','Mover: um navio pode avançar apenas 1 casa e encerra a ação dele.','Armadilha: Lança-Armadilhas alcança 7 casas no seu oceano ou Neutro.','Recarga: carga usada na rodada N volta na rodada N+2.','Coordenadas: letras A-J nas colunas, números 1-10 nas linhas e A1 no canto superior esquerdo.','Teclado: WASD/setas, Enter, R, P, 1-4, Espaço, F1, F2 e F3.'];let yy=y+76;for(const line of lines){this.drawWrapped(line,x+36,yy,w-72,12*this.state.settings.fontScale,'#dbe5d9','left',19*this.state.settings.fontScale);yy+=39;}const bw=160,bh=40,bx=(g.w-bw)/2,by=y+h-52;this.drawPanel(bx,by,bw,bh);this.drawText('FECHAR [ESC]',g.w/2,by+26,11*this.state.settings.fontScale,'#efe3bd','center');m.buttons.push({x:bx,y:by,w:bw,h:bh,onClick:()=>this.state.modal=null});
      }else if(m.type==='settings'){
        const w=Math.min(560,g.w-30),h=330,x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText('ACESSIBILIDADE / ÁUDIO',g.w/2,y+38,18*this.state.settings.fontScale,'#f0d392','center');const items=[['ALTO CONTRASTE',this.state.settings.highContrast?'ON':'OFF',()=>this.toggleContrast()],['TAMANHO DO TEXTO',`${Math.round(this.state.settings.fontScale*100)}%`,()=>this.cycleFont()],['MÚSICA',this.state.settings.music?'ON':'OFF',()=>this.toggleMusic()],['EFEITOS SONOROS',this.state.settings.sfx?'ON':'OFF',()=>this.toggleSfx()]];let yy=y+70;for(const [label,val,fn] of items){const bx=x+45,bw=w-90,bh=44;this.drawPanel(bx,yy,bw,bh);this.drawText(label,bx+14,yy+28,11*this.state.settings.fontScale,'#dfe9dc','left');this.drawText(val,bx+bw-14,yy+28,11*this.state.settings.fontScale,'#f0c978','right');m.buttons.push({x:bx,y:yy,w:bw,h:bh,onClick:fn});yy+=52;}const bx=(g.w-170)/2,by=y+h-50;this.drawPanel(bx,by,170,38);this.drawText('FECHAR [ESC]',g.w/2,by+25,11*this.state.settings.fontScale,'#efe3bd','center');m.buttons.push({x:bx,y:by,w:170,h:38,onClick:()=>this.state.modal=null});
      }else if(m.type==='end'){
        const scores=this.currentScores(),w=Math.min(600,g.w-30),h=292,x=(g.w-w)/2,y=(g.h-h)/2;this.drawPanel(x,y,w,h);this.drawText(`${this.ownerLabel(this.state.winner)} VENCEU`,g.w/2,y+50,24*this.state.settings.fontScale,'#f1d184','center');this.drawText(`RODADAS ${this.state.round} • TEMPO ${this.elapsedText()}`,g.w/2,y+82,12*this.state.settings.fontScale,'#dfe8db','center');this.drawText(`PONTUAÇÃO J1 ${scores.player1}/100 • J2 ${scores.player2}/100`,g.w/2,y+108,13*this.state.settings.fontScale,'#f0d392','center');const p1=this.state.stats.player1,p2=this.state.stats.player2;this.drawText(`J1 ACERTOS ${p1.hits}/${p1.attacks} • ANÁLISES ${p1.verificationCorrect}/${p1.verificationAttempts}`,g.w/2,y+140,10*this.state.settings.fontScale,'#cfe2d6','center');this.drawText(`J2 ACERTOS ${p2.hits}/${p2.attacks} • ANÁLISES ${p2.verificationCorrect}/${p2.verificationAttempts}`,g.w/2,y+163,10*this.state.settings.fontScale,'#cfe2d6','center');this.drawWrapped(`Score da sessão/plataforma: Jogador 1 = ${this.state.platformScore}/100`,x+30,y+191,w-60,10*this.state.settings.fontScale,'#dce9df','center',16*this.state.settings.fontScale);const bw=200,bh=42,bx=(g.w-bw)/2,by=y+h-58;this.drawPanel(bx,by,bw,bh);this.drawText('JOGAR NOVAMENTE',g.w/2,by+27,11*this.state.settings.fontScale,'#efe1b8','center');m.buttons.push({x:bx,y:by,w:bw,h:bh,onClick:()=>this.restart()});
      }
    }

    drawA11yFocus(){
      const button=this.a11yControls[this.a11yFocusAction];if(!button)return;
      const label=button.getAttribute('aria-label')||this.a11yFocusAction,g=this.geom;
      const w=Math.min(420,g.w-24),h=64,x=(g.w-w)/2,y=Math.max(6,g.h-150);
      this.drawPanel(x,y,w,h);this.drawText('FOCO ACESSÍVEL',g.w/2,y+22,10*this.state.settings.fontScale,'#83dbe9','center');this.drawText(label.toUpperCase(),g.w/2,y+44,12*this.state.settings.fontScale,'#ffffff','center');
      this.drawFrameSprite(this.img.ui.cursor,x-3,y-3,w+6,h+6,.72);
    }

    twoChoiceButtons(m,y,left,right,leftFn,rightFn){const g=this.geom,bw=Math.min(210,(g.w-50)/2),bh=48,gap=18,total=bw*2+gap,x=(g.w-total)/2;this.drawPanel(x,y,bw,bh);this.drawPanel(x+bw+gap,y,bw,bh);this.drawText(left,x+bw/2,y+30,11*this.state.settings.fontScale,'#dff0df','center');this.drawText(right,x+bw+gap+bw/2,y+30,11*this.state.settings.fontScale,'#f0dad5','center');m.buttons.push({x,y,w:bw,h:bh,onClick:leftFn},{x:x+bw+gap,y,w:bw,h:bh,onClick:rightFn});}

    drawPanel(x,y,w,h){
      const img=this.img.ui.panel;if(!img)return;
      const sx=10,sy=10,sw=img.width,sh=img.height,dx=Math.min(sx,Math.max(1,w/2)),dy=Math.min(sy,Math.max(1,h/2));
      ctx.save();
      ctx.drawImage(img,0,0,sx,sy,x,y,dx,dy);ctx.drawImage(img,sw-sx,0,sx,sy,x+w-dx,y,dx,dy);
      ctx.drawImage(img,0,sh-sy,sx,sy,x,y+h-dy,dx,dy);ctx.drawImage(img,sw-sx,sh-sy,sx,sy,x+w-dx,y+h-dy,dx,dy);
      ctx.drawImage(img,sx,0,sw-2*sx,sy,x+dx,y,w-2*dx,dy);ctx.drawImage(img,sx,sh-sy,sw-2*sx,sy,x+dx,y+h-dy,w-2*dx,dy);
      ctx.drawImage(img,0,sy,sx,sh-2*sy,x,y+dy,dx,h-2*dy);ctx.drawImage(img,sw-sx,sy,sx,sh-2*sy,x+w-dx,y+dy,dx,h-2*dy);
      ctx.drawImage(img,sx,sy,sw-2*sx,sh-2*sy,x+dx,y+dy,w-2*dx,h-2*dy);ctx.restore();
    }
    drawFrameSprite(img,x,y,w,h,alpha=1){
      if(!img)return;const c=Math.min(20,img.width/2,img.height/2),d=Math.min(c,w/2,h/2);
      ctx.save();ctx.globalAlpha=alpha;
      ctx.drawImage(img,0,0,c,c,x,y,d,d);ctx.drawImage(img,img.width-c,0,c,c,x+w-d,y,d,d);
      ctx.drawImage(img,0,img.height-c,c,c,x,y+h-d,d,d);ctx.drawImage(img,img.width-c,img.height-c,c,c,x+w-d,y+h-d,d,d);
      ctx.restore();
    }
    drawImageFit(img,x,y,w,h,alpha=1){if(!img)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,x,y,w,h);ctx.restore();}
    tileOverlay(img,alpha=.95){if(!img)return;const g=this.geom;ctx.save();ctx.globalAlpha=alpha;for(let y=0;y<g.h;y+=128)for(let x=0;x<g.w;x+=128)ctx.drawImage(img,x,y,128,128);ctx.restore();}

    drawText(text,x,y,size=12,color='#fff',align='left'){
      ctx.save();ctx.font=`bold ${Math.max(8,size)}px monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillText(text,x+1,y+2);ctx.fillStyle=this.state.settings.highContrast?'#fff':color;ctx.fillText(text,x,y);ctx.restore();
    }

    drawWrapped(text,x,y,maxWidth,size,color,align='left',lineHeight=null){
      ctx.save();ctx.font=`bold ${Math.max(8,size)}px monospace`;const words=String(text).split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);ctx.restore();let yy=y;for(const l of lines){const xx=align==='center'?x+maxWidth/2:x;this.drawText(l,xx,yy,size,color,align);yy+=lineHeight||size*1.35;}return yy;
    }
  }

  window.GDM_GAME = new SpriteOnlyGame();
  window.GDM_GAME.init();
})();
