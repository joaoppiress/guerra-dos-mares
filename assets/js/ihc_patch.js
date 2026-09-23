(() => {
  const game = window.GDM_GAME;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!game || !canvas || !ctx) return;
  ctx.imageSmoothingEnabled = false;

  const navalExtraIcons = {
    musicOff: 'assets/img/ui/music_off.png',
    zoomIn: 'assets/img/ui/zoom_in.png',
    zoomOut: 'assets/img/ui/zoom_out.png',
    cameraCenter: 'assets/img/ui/camera_center.png',
    warning: 'assets/img/ui/warning.png'
  };
  for (const [name, src] of Object.entries(navalExtraIcons)) {
    const img = new Image();
    img.onload = () => { game.img.ui[name] = img; };
    img.src = src;
  }


  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const measureTextWidth = (txt, size) => {
    ctx.save();
    ctx.font = `bold ${Math.max(8, size)}px monospace`;
    const w = ctx.measureText(String(txt)).width;
    ctx.restore();
    return w;
  };

  const base = {
    createState: game.createState.bind(game),
    resize: game.resize.bind(game),
    resetMatch: game.resetMatch.bind(game),
    handlePlacementKey: game.handlePlacementKey.bind(game),
    handleBattleKey: game.handleBattleKey.bind(game),
    rotateSelected: game.rotateSelected.bind(game),
    placeSelected: game.placeSelected.bind(game),
    autoPlace: game.autoPlace.bind(game),
    readyPlacement: game.readyPlacement.bind(game),
    setAction: game.setAction.bind(game),
    attack: game.attack.bind(game),
    analyze: game.analyze.bind(game),
    answerQuestion: game.answerQuestion.bind(game),
    endTurn: game.endTurn.bind(game),
    draw: game.draw.bind(game),
    drawGrid: game.drawGrid.bind(game),
    drawHud: game.drawHud.bind(game),
    drawPlacementHud: game.drawPlacementHud.bind(game),
    drawBattleHud: game.drawBattleHud.bind(game),
    drawTopStatus: game.drawTopStatus.bind(game),
    drawModal: game.drawModal.bind(game),
    drawTooltip: game.drawTooltip.bind(game),
    drawText: game.drawText.bind(game),
    openHelp: game.openHelp.bind(game)
  };

  function enhanceState(state) {
    state.settings = Object.assign({ highContrast: true, fontScale: 1.25, music: true, sfx: true }, state.settings || {});
    state.camera = Object.assign({ zoom: 1, offsetX: 0, offsetY: 0, minZoom: 0.85, maxZoom: 2.2 }, state.camera || {});
    state.tutorial = Object.assign({ active: true, step: 0, dismissed: false }, state.tutorial || {});
    return state;
  }

  game.createState = function () {
    return enhanceState(base.createState());
  };
  enhanceState(game.state);

  game.applyCameraLayout = function (w = this.geom?.w || window.innerWidth, h = this.geom?.h || window.innerHeight, dpr = this.geom?.dpr || Math.max(1, Math.min(2, window.devicePixelRatio || 1))) {
    const cam = this.state.camera || (this.state.camera = { zoom: 1, offsetX: 0, offsetY: 0, minZoom: 0.85, maxZoom: 2.2 });
    const zoom = clamp(cam.zoom || 1, cam.minZoom || 0.85, cam.maxZoom || 2.2);
    const cell = Math.max(9, Math.floor((this.baseCell || 24) * zoom));
    const gw = cell * 30;
    const gh = cell * 10;
    const maxOffsetX = Math.max(0, (gw - w) / 2) + 140;
    const maxOffsetY = Math.max(0, (gh - h) / 2) + 120;
    cam.offsetX = clamp(cam.offsetX || 0, -maxOffsetX, maxOffsetX);
    cam.offsetY = clamp(cam.offsetY || 0, -maxOffsetY, maxOffsetY);
    this.geom = { w, h, dpr, cell, gx: Math.floor((w - gw) / 2 + cam.offsetX), gy: Math.floor((h - gh) / 2 + 10 + cam.offsetY), gw, gh };
  };

  game.resize = function () {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(240, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.baseCell = Math.max(9, Math.floor(Math.min((w - 12) / 30, (h - 170) / 10)));
    this.applyCameraLayout(w, h, dpr);
  };

  game.resetMatch = function (diff = 'medio') {
    base.resetMatch(diff);
    enhanceState(this.state);
    this.applyCameraLayout();
  };

  game.panCamera = function (dx, dy) {
    enhanceState(this.state);
    this.state.camera.offsetX += dx;
    this.state.camera.offsetY += dy;
    this.applyCameraLayout();
    this.toast('CÂMERA MOVIDA', 700);
  };

  game.zoomCamera = function (delta) {
    enhanceState(this.state);
    const cam = this.state.camera;
    cam.zoom = clamp((cam.zoom || 1) + delta, cam.minZoom, cam.maxZoom);
    this.applyCameraLayout();
    this.toast(`ZOOM ${Math.round(cam.zoom * 100)}%`, 700);
  };

  game.resetCamera = function () {
    enhanceState(this.state);
    Object.assign(this.state.camera, { zoom: 1, offsetX: 0, offsetY: 0 });
    this.applyCameraLayout();
    this.toast('CÂMERA CENTRALIZADA', 900);
  };

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    game.zoomCamera(e.deltaY < 0 ? 0.1 : -0.1);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const delta = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[key];
    if (e.shiftKey && delta) {
      e.preventDefault();
      e.stopImmediatePropagation();
      game.panCamera(delta[0] * 36, delta[1] * 36);
      return;
    }
    if (key === '+' || key === '=' || key === 'add') {
      e.preventDefault(); e.stopImmediatePropagation(); game.zoomCamera(0.1); return;
    }
    if (key === '-' || key === '_' || key === 'subtract') {
      e.preventDefault(); e.stopImmediatePropagation(); game.zoomCamera(-0.1); return;
    }
    if (key === '0') {
      e.preventDefault(); e.stopImmediatePropagation(); game.resetCamera(); return;
    }
  }, true);

  game.tutorialSteps = function () {
    return [
      { title: 'Bem-vindo, capitão!', goal: 'Mova o cursor pelo mapa.', hint: 'Use WASD ou as setas. O cursor mostra onde você vai agir.' },
      { title: 'Gire o navio', goal: 'Troque a orientação do navio selecionado.', hint: 'Pressione R ou clique no botão GIRAR.' },
      { title: 'Ancore sua primeira peça', goal: 'Posicione um navio no seu oceano.', hint: 'Clique em uma casa válida ou pressione Enter.' },
      { title: 'Feche a formação', goal: 'Complete a frota do Jogador 1.', hint: 'Você pode continuar manualmente ou usar AUTO para preencher rápido.' },
      { title: 'Hora da batalha', goal: 'Escolha o modo ATACAR.', hint: 'Clique no botão ATACAR ou pressione a tecla 1.' },
      { title: 'Dê o primeiro disparo', goal: 'Ataque qualquer coordenada.', hint: 'Escolha um alvo no mapa para ver o feedback imediato.' },
      { title: 'Inteligência naval', goal: 'Analise um contato do radar.', hint: 'Use ANALISAR [4] sobre um bloco desconhecido.' },
      { title: 'Responda a pergunta', goal: 'Marque Verdadeiro ou Falso.', hint: 'Se acertar, o contato será revelado com explicação pedagógica.' },
      { title: 'Passe o comando', goal: 'Encerre o turno.', hint: 'Clique em PASSAR TURNO ou pressione Espaço.' }
    ];
  };

  game.tutorialEvent = function (name) {
    const t = this.state.tutorial;
    if (!t || !t.active || t.dismissed) return;
    const expected = {
      moveCursor: 0,
      rotate: 1,
      placeShip: 2,
      autoPlace: 3,
      player1Ready: 3,
      chooseAttack: 4,
      attackDone: 5,
      analyzeOpened: 6,
      answerQuestion: 7,
      endTurn: 8
    }[name];
    if (expected === undefined || expected !== t.step) return;
    t.step += 1;
    if (t.step >= this.tutorialSteps().length) {
      t.active = false;
      this.toast('TUTORIAL CONCLUÍDO! VOCÊ JÁ SABE O BÁSICO.', 2600);
      this.announce('Tutorial concluído. Continue jogando livremente.');
      return;
    }
    const next = this.tutorialSteps()[t.step];
    this.toast(`TUTORIAL: ${next.title.toUpperCase()}`, 1800);
    this.announce(`Próxima etapa do tutorial: ${next.goal} ${next.hint}`);
  };

  game.currentTutorial = function () {
    const t = this.state.tutorial;
    if (!t || !t.active || t.dismissed) return null;
    return this.tutorialSteps()[t.step] || null;
  };

  game.dismissTutorial = function () {
    if (!this.state.tutorial) return;
    this.state.tutorial.active = false;
    this.state.tutorial.dismissed = true;
    this.toast('TUTORIAL OCULTO', 900);
  };

  game.actionDescription = function () {
    const phase = this.state.phase;
    if (phase === 'placement') {
      return {
        title: 'FASE DE POSICIONAMENTO',
        body: 'Escolha um navio na barra inferior e coloque-o apenas dentro do seu oceano. Verde indica casa válida e vermelho indica que a posição é proibida ou colide com outra peça.',
        tips: ['R gira o navio.', 'P auto-posiciona a frota.', 'Enter confirma a posição.']
      };
    }
    if (phase === 'battle') {
      if (this.state.action === 'attack') return { title: 'MODO ATAQUE', body: 'Seu navio vai disparar na coordenada escolhida. A ação causa dano e gasta carga. O feedback é imediato: explosão quando acerta e marcação de água quando erra.', tips: ['Selecione um navio com míssil.', 'Clique numa casa do mapa.', 'A carga volta na rodada N+2.'] };
      if (this.state.action === 'move') return { title: 'MODO MOVIMENTO', body: 'O navio selecionado pode avançar apenas 1 casa por turno. Isso ajuda a alcançar o radar, fugir de armadilhas e preparar melhores ataques.', tips: ['Clique em uma casa vizinha.', 'Cada navio move no máximo 1 casa.', 'Depois de mover, o navio trava no turno.'] };
      if (this.state.action === 'trap') return { title: 'MODO ARMADILHA', body: 'Somente o Lança-Armadilhas cria minas. Use essa ação para proteger seu oceano e controlar o oceano neutro.', tips: ['Alcance máximo: 7 casas.', 'Só vale no seu oceano ou no neutro.', 'Cada mina consome 1 carga.'] };
      if (this.state.action === 'analyze') return { title: 'MODO ANÁLISE', body: 'Use uma pergunta pedagógica para revelar um contato do radar. Essa mecânica junta estratégia naval e conteúdo escolar.', tips: ['Só pode analisar 1 vez por rodada.', 'Escolha um bloco desconhecido do radar.', 'Responda Verdadeiro ou Falso.'] };
      const s = this.selectedShip();
      return {
        title: 'FASE DE BATALHA',
        body: s ? `Navio selecionado: ${s.name}. Agora escolha uma ação na barra central. Cada ação tem ícone, texto e atalho para reduzir dúvidas.` : 'Primeiro selecione um navio da sua frota. Depois escolha ATACAR, MOVER, ARMADILHA ou ANALISAR.',
        tips: ['1 atacar', '2 mover', '3 armadilha', '4 analisar']
      };
    }
    return { title: 'RESUMO DA PARTIDA', body: 'Acompanhe placar, tempo, vida dos navios e resultado das análises.', tips: ['Enter reinicia ao final da partida.'] };
  };

  game.shipDescription = function (ship) {
    if (!ship) return '';
    if (ship.typeId === 'destroyer') return 'Unidade leve: barata, ágil e com 3 cargas de míssil.';
    if (ship.typeId === 'cruiser') return 'Navio intermediário: bom equilíbrio entre resistência e poder de fogo.';
    if (ship.typeId === 'battleship') return 'Peça pesada: dano alto e presença forte na linha de frente.';
    return 'Especialista tático: instala armadilhas e controla espaço.';
  };

  game.handlePlacementKey = function (e) {
    const before = { row: this.state.cursor.row, col: this.state.cursor.col };
    base.handlePlacementKey(e);
    if (before.row !== this.state.cursor.row || before.col !== this.state.cursor.col) this.tutorialEvent('moveCursor');
  };

  game.handleBattleKey = function (e) {
    const before = { row: this.state.cursor.row, col: this.state.cursor.col };
    base.handleBattleKey(e);
    if (before.row !== this.state.cursor.row || before.col !== this.state.cursor.col) this.tutorialEvent('moveCursor');
  };

  game.rotateSelected = function () { base.rotateSelected(); this.tutorialEvent('rotate'); };
  game.placeSelected = function (row, col) { const before = this.selectedShip()?.row; base.placeSelected(row, col); if (before === null || before === undefined) this.tutorialEvent('placeShip'); };
  game.autoPlace = function () { base.autoPlace(); this.tutorialEvent('autoPlace'); };
  game.readyPlacement = function () { const owner = this.state.placementOwner; const ready = this.fleetReady(); base.readyPlacement(); if (owner === 'player1' && ready) this.tutorialEvent('player1Ready'); };
  game.setAction = function (action) { base.setAction(action); if (this.state.action === 'attack') this.tutorialEvent('chooseAttack'); };
  game.attack = function (row, col, skipRisk = false) { const before = this.state.stats[this.state.turn]?.attacks || 0; base.attack(row, col, skipRisk); if ((this.state.stats[this.state.turn]?.attacks || 0) > before) this.tutorialEvent('attackDone'); };
  game.analyze = function (row, col) { base.analyze(row, col); if (this.state.modal?.type === 'question') this.tutorialEvent('analyzeOpened'); };
  game.answerQuestion = function (answer) { const wasQuestion = this.state.modal?.type === 'question'; base.answerQuestion(answer); if (wasQuestion) this.tutorialEvent('answerQuestion'); };
  game.endTurn = function () { const can = this.state.phase === 'battle' && !this.state.modal; base.endTurn(); if (can) this.tutorialEvent('endTurn'); };

  game.drawText = function (text, x, y, size = 12, color = '#fff', align = 'left') {
    ctx.save();
    ctx.font = `bold ${Math.max(8, size)}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(0,0,0,.95)';
    ctx.fillText(String(text), x + 2, y + 2);
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillText(String(text), x + 1, y + 1);
    ctx.fillStyle = this.state.settings?.highContrast ? '#ffffff' : color;
    ctx.fillText(String(text), x, y);
    ctx.restore();
  };

  game.drawWrappedBlock = function (text, x, y, maxWidth, size, color, align = 'left', lineHeight = null) {
    ctx.save();
    ctx.font = `bold ${Math.max(8, size)}px monospace`;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    let yy = y;
    for (const l of lines) {
      const xx = align === 'center' ? x + maxWidth / 2 : x;
      this.drawText(l, xx, yy, size, color, align);
      yy += lineHeight || size * 1.35;
    }
    return yy;
  };

  game.addIconButton = function (icon, x, y, w, h, onClick, label, disabled = false) {
    const img = this.img.ui[icon];
    ctx.save();
    ctx.globalAlpha = disabled ? 0.34 : 1;
    ctx.imageSmoothingEnabled = true;
    if (img) ctx.drawImage(img, x, y, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.restore();
    const active = this.state.action === icon || (icon === 'trap' && this.state.action === 'trap') || (icon === 'analyze' && this.state.action === 'analyze');
    if (active) {
      ctx.save();
      ctx.strokeStyle = '#ffe089';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,210,95,.75)';
      ctx.shadowBlur = 10;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.restore();
    }
    this.buttons.push({ id: icon, x, y, w, h, onClick: () => { if (!disabled) { this.audio.beep(430, .035, .025); onClick(); } }, label, disabled });
  };

  game.drawTooltip = function (text, x, y) {
    const fs = 10 * this.state.settings.fontScale;
    const w = Math.max(120, measureTextWidth(text, fs) + 22);
    const h = 32;
    const tx = clamp(x - w / 2, 4, this.geom.w - w - 4);
    const ty = clamp(y - 40, 4, this.geom.h - h - 4);
    this.drawPanel(tx, ty, w, h);
    this.drawText(text, tx + w / 2, ty + 21, fs, '#fff2b6', 'center');
  };

  game.drawGrid = function (t) {
    base.drawGrid(t);
    if (window.innerWidth < 900) return;
    const g = this.geom;
    const labelW = Math.max(140, g.cell * 10 - 8);
    const labelY = clamp(g.gy + g.gh + 10, 132, g.h - 92);
    this.drawPanel(g.gx + 4, labelY, labelW, 28);
    this.drawText('OCEANO JOGADOR 1', g.gx + g.cell * 5, labelY + 19, 10 * this.state.settings.fontScale, '#8fe8ff', 'center');
    this.drawPanel(g.gx + g.cell * 10 + 4, labelY, labelW, 28);
    this.drawText('OCEANO NEUTRO', g.gx + g.cell * 15, labelY + 19, 10 * this.state.settings.fontScale, '#f7e59d', 'center');
    this.drawPanel(g.gx + g.cell * 20 + 4, labelY, labelW, 28);
    this.drawText('OCEANO JOGADOR 2', g.gx + g.cell * 25, labelY + 19, 10 * this.state.settings.fontScale, '#ff9d9d', 'center');
  };

  game.drawTopStatus = function () {
    const g = this.geom;
    const owner = this.currentOwner();
    const diff = GDM_CONFIG.difficulties[this.state.difficulty].label;
    const scores = this.currentScores();
    const title = this.state.phase === 'placement' ? `${this.ownerLabel(owner)} • POSICIONAMENTO` : `${this.ownerLabel(owner)} • RODADA ${this.state.round}`;
    const leftW = Math.min(300, Math.max(220, g.w * 0.25));
    const centerW = Math.min(430, Math.max(280, g.w * 0.32));
    const rightW = Math.min(270, Math.max(190, g.w * 0.18));
    const y = 6, h = 62, gap = 8;
    const total = leftW + centerW + rightW + gap * 2;
    const start = Math.max(6, (g.w - total) / 2);
    this.drawPanel(start, y, leftW, h);
    this.drawText(title, start + leftW / 2, y + 22, 12 * this.state.settings.fontScale, '#fff3c0', 'center');
    this.drawText(`Dificuldade: ${diff}`, start + leftW / 2, y + 45, 10.5 * this.state.settings.fontScale, '#dcefe8', 'center');
    this.drawPanel(start + leftW + gap, y, centerW, h);
    this.drawText('PLACAR E TEMPO', start + leftW + gap + centerW / 2, y + 18, 10 * this.state.settings.fontScale, '#8fe8ff', 'center');
    this.drawText(`J1 ${scores.player1}/100  •  J2 ${scores.player2}/100`, start + leftW + gap + centerW / 2, y + 38, 11.5 * this.state.settings.fontScale, '#ffffff', 'center');
    this.drawText(`Tempo: ${this.elapsedText()}`, start + leftW + gap + centerW / 2, y + 56, 10 * this.state.settings.fontScale, '#dcefe8', 'center');
    this.drawPanel(start + leftW + gap + centerW + gap, y, rightW, h);
    this.drawText('LEGENDA RÁPIDA', start + leftW + gap + centerW + gap + rightW / 2, y + 18, 10 * this.state.settings.fontScale, '#ffddb0', 'center');
    this.drawText('Verde = válido • Vermelho = risco', start + leftW + gap + centerW + gap + rightW / 2, y + 38, 9.5 * this.state.settings.fontScale, '#ffffff', 'center');
    this.drawText('Amarelo = neutro • Azul = radar', start + leftW + gap + centerW + gap + rightW / 2, y + 56, 9.5 * this.state.settings.fontScale, '#ffffff', 'center');
  };

  game.drawContextPanel = function () {
    const g = this.geom;
    const info = this.actionDescription();
    const x = 8, y = 58, w = Math.min(340, Math.max(240, g.w * 0.28)), h = 160;
    this.drawPanel(x, y, w, h);
    this.drawText(info.title, x + 14, y + 22, 11 * this.state.settings.fontScale, '#fff0bf', 'left');
    let yy = this.drawWrappedBlock(info.body, x + 14, y + 46, w - 28, 10.5 * this.state.settings.fontScale, '#eef8f0', 'left', 17 * this.state.settings.fontScale);
    yy += 6;
    for (const tip of info.tips || []) {
      this.drawText(`• ${tip}`, x + 16, yy, 9.5 * this.state.settings.fontScale, '#8fe8ff', 'left');
      yy += 16 * this.state.settings.fontScale;
    }
  };

  game.drawCameraPanel = function () {
    const g = this.geom, cam = this.state.camera;
    const w = Math.min(305, Math.max(230, g.w * 0.23)), h = 132, x = g.w - w - 8, y = 58;
    this.drawPanel(x, y, w, h);
    this.drawText('CÂMERA LIVRE', x + w / 2, y + 20, 11 * this.state.settings.fontScale, '#fff0bf', 'center');
    this.drawText(`Zoom: ${Math.round(cam.zoom * 100)}%`, x + 14, y + 43, 9.5 * this.state.settings.fontScale, '#eef8f0', 'left');
    this.drawText('Shift+WASD = mover câmera', x + 14, y + 61, 9.3 * this.state.settings.fontScale, '#eef8f0', 'left');
    this.drawText('Roda / + / - = zoom', x + 14, y + 78, 9.3 * this.state.settings.fontScale, '#8fe8ff', 'left');
    const icon = 36, gap = 8, total = icon * 3 + gap * 2, bx = x + w - total - 12, by = y + h - icon - 9;
    this.addIconButton('zoomOut', bx, by, icon, icon, () => this.zoomCamera(-0.1), 'DIMINUIR ZOOM');
    this.addIconButton('cameraCenter', bx + icon + gap, by, icon, icon, () => this.resetCamera(), 'CENTRALIZAR CÂMERA');
    this.addIconButton('zoomIn', bx + (icon + gap) * 2, by, icon, icon, () => this.zoomCamera(0.1), 'AUMENTAR ZOOM');
  };

  game.drawPlacementLegend = function (owner) {
    const g = this.geom;
    const w = Math.min(360, Math.max(250, g.w * 0.32)), h = 86, x = g.w - w - 8, y = g.h - 170;
    this.drawPanel(x, y, w, h);
    this.drawText('O QUE FAZER AGORA', x + 12, y + 20, 11 * this.state.settings.fontScale, '#fff0bf', 'left');
    const text = this.fleetReady(owner)
      ? 'Sua frota já está completa. Clique em PRONTO para passar o controle ou revise posições selecionando navios na barra inferior.'
      : '1) Escolha um navio na barra inferior. 2) Posicione dentro do seu oceano. 3) Verde significa permitido e vermelho significa posição inválida.';
    this.drawWrappedBlock(text, x + 12, y + 42, w - 24, 10 * this.state.settings.fontScale, '#eef8f0', 'left', 16 * this.state.settings.fontScale);
  };

  game.drawActionLabels = function (x0, y, icon, sp) {
    const labels = [['ATACAR', '1'], ['MOVER', '2'], ['ARMADILHA', '3'], ['ANALISAR', '4'], ['PASSAR', 'ESPAÇO']];
    labels.forEach((entry, i) => {
      const x = x0 + i * (icon + sp);
      this.drawText(entry[0], x + icon / 2, y + 60, 9.5 * this.state.settings.fontScale, '#ffffff', 'center');
      this.drawText(entry[1], x + icon / 2, y + 74, 8.5 * this.state.settings.fontScale, '#8fe8ff', 'center');
    });
  };

  game.drawPlacementHud = function () {
    base.drawPlacementHud();
    this.drawPlacementLegend(this.state.placementOwner);
  };

  game.drawBattleHud = function () {
    base.drawBattleHud();
    const g = this.geom;
    const icon = 46, sp = 8, total = icon * 5 + sp * 4, x0 = (g.w - total) / 2, y = g.h - icon - 10;
    this.drawActionLabels(x0, y, icon, sp);
    const s = this.selectedShip();
    if (s) {
      const bx = 10, by = g.h - 132, bw = Math.min(350, g.w * 0.38), bh = 74;
      this.drawPanel(bx, by, bw, bh);
      const charges = '●'.repeat(s.availableCharges) + '○'.repeat(Math.max(0, s.maxCharges - s.availableCharges));
      this.drawText(s.name, bx + 12, by + 20, 11.5 * this.state.settings.fontScale, '#fff0bf', 'left');
      this.drawText(`Vida: ${Math.max(0, s.hp)}/${s.maxHp}  |  Cargas: ${charges}`, bx + 12, by + 41, 10.5 * this.state.settings.fontScale, '#eef8f0', 'left');
      this.drawWrappedBlock(this.shipDescription(s), bx + 12, by + 58, bw - 24, 9 * this.state.settings.fontScale, '#8fe8ff', 'left', 13 * this.state.settings.fontScale);
    }
  };

  game.drawHud = function (t) {
    const g = this.geom;
    this.drawTopStatus();
    this.drawContextPanel();
    this.drawCameraPanel();
    if (this.state.phase === 'placement') this.drawPlacementHud();
    else if (['battle', 'end'].includes(this.state.phase)) this.drawBattleHud();
    const icon = g.w < 600 ? 38 : 46, sp = g.w < 600 ? 6 : 8;
    let x = g.w - icon - 8, y = 8;
    this.addIconButton('help', x, y, icon, icon, () => this.openHelp(), 'AJUDA / TUTORIAL'); x -= icon + sp;
    this.addIconButton('settings', x, y, icon, icon, () => this.openSettings(), 'CONFIGURAÇÕES'); x -= icon + sp;
    const musicIcon = this.state.settings.music && this.img.ui.music ? 'music' : (this.img.ui.musicOff ? 'musicOff' : 'music');
    this.addIconButton(musicIcon, x, y, icon, icon, () => this.toggleMusic(), this.state.settings.music ? 'DESLIGAR MÚSICA' : 'LIGAR MÚSICA');
  };

  game.drawHelpModalEnhanced = function () {
    const g = this.geom, m = this.state.modal;
    const w = Math.min(780, g.w - 24), h = Math.min(520, g.h - 24), x = (g.w - w) / 2, y = (g.h - h) / 2;
    this.drawPanel(x, y, w, h);
    this.drawText('ACADEMIA NAVAL • TUTORIAL INTERATIVO', g.w / 2, y + 34, 18 * this.state.settings.fontScale, '#f0d392', 'center');
    const sections = [
      ['OBJETIVO DO JOGO', 'Destrua toda a frota adversária. Para vencer você precisa combinar posicionamento, leitura do radar, ataques e análise pedagógica.'],
      ['COMO LER O MAPA', 'Cada zona usa colunas A até J e linhas 1 até 10. Oceano esquerdo é do Jogador 1, centro é neutro e direita é do Jogador 2.'],
      ['O QUE FAZ CADA AÇÃO', 'ATACAR causa dano; MOVER reposiciona; ARMADILHA cria minas com o Lança-Armadilhas; ANALISAR usa uma pergunta Verdadeiro ou Falso para revelar contatos do radar.'],
      ['COMANDOS IMPORTANTES', 'WASD/setas movem o cursor. Shift+WASD move a câmera. R gira navio. P auto-posiciona. 1-4 escolhem ações. Espaço passa turno. Mouse wheel faz zoom.'],
      ['DICA DE ESTRATÉGIA', 'Use análise antes de arriscar ataque em contato desconhecido. Proteja o neutro com armadilhas. Movimente-se para entrar no alcance do radar sem se expor demais.']
    ];
    let yy = y + 66;
    for (const [title, body] of sections) {
      this.drawText(title, x + 28, yy, 11 * this.state.settings.fontScale, '#8fe8ff', 'left');
      yy = this.drawWrappedBlock(body, x + 28, yy + 22, w - 56, 10.5 * this.state.settings.fontScale, '#eef8f0', 'left', 17 * this.state.settings.fontScale) + 10;
    }
    const bx1 = x + 40, by = y + h - 52, bw = 220, bh = 38;
    this.drawPanel(bx1, by, bw, bh);
    this.drawText('REINICIAR TUTORIAL GUIADO', bx1 + bw / 2, by + 25, 10 * this.state.settings.fontScale, '#fff2b6', 'center');
    const bx2 = x + w - 200;
    this.drawPanel(bx2, by, 160, bh);
    this.drawText('FECHAR [ESC]', bx2 + 80, by + 25, 10 * this.state.settings.fontScale, '#fff2b6', 'center');
    m.buttons = [
      { x: bx1, y: by, w: bw, h: bh, onClick: () => { this.state.modal = null; this.state.tutorial = { active: true, step: 0, dismissed: false }; this.announce('Tutorial guiado reiniciado.'); } },
      { x: bx2, y: by, w: 160, h: bh, onClick: () => { this.state.modal = null; } }
    ];
  };

  game.drawModal = function (t) {
    if (this.state.modal?.type === 'help') {
      this.tileOverlay(this.img.ui.handoff, .96);
      this.drawHelpModalEnhanced();
      return;
    }
    base.drawModal(t);
  };

  game.drawTutorialCoach = function () {
    const tip = this.currentTutorial();
    if (!tip || this.state.modal) return;
    const g = this.geom, w = Math.min(520, g.w - 20), h = 110, x = (g.w - w) / 2, y = g.h - h - 96;
    this.drawPanel(x, y, w, h);
    this.drawText('MISSÃO DO TUTORIAL', x + 14, y + 22, 11 * this.state.settings.fontScale, '#fff0bf', 'left');
    this.drawText(tip.title.toUpperCase(), x + 14, y + 42, 11 * this.state.settings.fontScale, '#8fe8ff', 'left');
    this.drawWrappedBlock(tip.goal, x + 14, y + 63, w - 28, 11 * this.state.settings.fontScale, '#ffffff', 'left', 16 * this.state.settings.fontScale);
    this.drawWrappedBlock(`Dica: ${tip.hint}`, x + 14, y + 84, w - 120, 9.5 * this.state.settings.fontScale, '#dcefe8', 'left', 14 * this.state.settings.fontScale);
    const bx = x + w - 94, by = y + h - 38;
    this.drawPanel(bx, by, 78, 26);
    this.drawText('OCULTAR', bx + 39, by + 18, 8.5 * this.state.settings.fontScale, '#fff2b6', 'center');
    this.buttons.push({ id: 'dismissTutorial', x: bx, y: by, w: 78, h: 26, onClick: () => this.dismissTutorial(), label: 'OCULTAR TUTORIAL' });
  };

  game.draw = function (t) {
    base.draw(t);
    this.drawTutorialCoach();
  };

  function isCompactLandscape() {
    return window.innerWidth < 900;
  }

  function dockWidth() {
    return window.innerWidth >= 900 ? Math.min(364, Math.max(320, window.innerWidth * 0.26)) : 0;
  }

  function readableActionName(action) {
    return { attack: 'Atacar', move: 'Mover', trap: 'Armadilha', analyze: 'Analisar' }[action] || action;
  }

  function describeShipStatus(ship) {
    if (!ship) return 'Escolha um navio para liberar as ações.';
    if (ship.destroyed) return 'Este navio foi destruído.';
    if (ship.turnLocked) return 'Turno indisponível para este navio. Ele já agiu nesta rodada.';
    return `${ship.name}. Vida ${Math.max(0, ship.hp)}/${ship.maxHp}. Cargas ${ship.availableCharges}/${ship.maxCharges}.`;
  }

  function simpleCoord(row, col) {
    return GDM_LOGIC.coordWithZone(row, col).replace('Oceano do ', '').replace('Oceano ', '');
  }

  function dockButton(label, action, opts = {}) {
    const disabled = opts.disabled ? ' disabled' : '';
    const primary = opts.primary ? ' primary' : '';
    const extra = opts.extra || '';
    return `<button class="dock-button${primary}" type="button" data-action="${action}" ${extra}${disabled}>${label}</button>`;
  }

  function currentRadarItems(game) {
    if (game.state.phase !== 'battle') return [];
    const owner = game.state.turn;
    const opponent = GDM_LOGIC.other(owner);
    const items = [];
    for (const ship of game.state.ships[opponent]) {
      if (ship.destroyed) continue;
      const id = GDM_LOGIC.objectId(ship, 'ship');
      if (!game.state.detected[owner].has(id)) continue;
      const cell = ship.cells[0] || { row: ship.row, col: ship.col };
      items.push({ id, type: 'ship', label: game.state.revealed[owner].has(id) ? ship.name : 'Contato de radar', row: cell.row, col: cell.col, revealed: game.state.revealed[owner].has(id) });
    }
    for (const trap of game.state.traps.filter(t => t.active && t.owner === opponent)) {
      const id = GDM_LOGIC.objectId(trap, 'trap');
      if (!game.state.detected[owner].has(id)) continue;
      items.push({ id, type: 'trap', label: game.state.revealed[owner].has(id) ? 'Mina revelada' : 'Contato de radar', row: trap.row, col: trap.col, revealed: game.state.revealed[owner].has(id) });
    }
    return items;
  }

  game.ensureCommandDock = function () {
    if (this.commandDock) return this.commandDock;
    canvas.tabIndex = -1;
    canvas.setAttribute('aria-hidden', 'true');
    const legacyControls = document.getElementById('gdmControls');
    if (legacyControls) {
      legacyControls.inert = true;
      legacyControls.setAttribute('aria-hidden', 'true');
      legacyControls.querySelectorAll('button').forEach(button => { button.tabIndex = -1; });
    }

    const rotate = document.createElement('div');
    rotate.id = 'gdmRotateNotice';
    rotate.innerHTML = '<div><strong>Gire o celular</strong><span>Este jogo foi ajustado para jogar no celular deitado, com botões grandes e toque.</span></div>';
    document.body.appendChild(rotate);

    const dock = document.createElement('nav');
    dock.id = 'gdmCommandDock';
    dock.setAttribute('aria-label', 'Painel principal de comandos do jogo');
    dock.innerHTML = `
      <h2 class="dock-title">Guerra dos Mares</h2>
      <p class="dock-subtitle" id="dockSubtitle">Comandos separados para jogar sem dúvida.</p>
      <div class="dock-tabs" role="tablist" aria-label="Abas de comandos">
        <button class="dock-tab" type="button" role="tab" data-tab="game" aria-selected="true">Jogo</button>
        <button class="dock-tab" type="button" role="tab" data-tab="settings" aria-selected="false">Config</button>
        <button class="dock-tab" type="button" role="tab" data-tab="help" aria-selected="false">Dúvidas</button>
        <button class="dock-tab" type="button" role="tab" data-tab="radar" aria-selected="false">Radar</button>
      </div>
      <section class="dock-panel is-active" role="tabpanel" data-panel="game"></section>
      <section class="dock-panel" role="tabpanel" data-panel="settings"></section>
      <section class="dock-panel" role="tabpanel" data-panel="help"></section>
      <section class="dock-panel" role="tabpanel" data-panel="radar"></section>`;
    document.body.appendChild(dock);
    this.commandDock = dock;
    this.commandDockTab = 'game';

    dock.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) {
        this.commandDockTab = tab.dataset.tab;
        this.syncCommandDock(true);
        return;
      }
      const button = event.target.closest('[data-action]');
      if (button && !button.disabled) this.runDockAction(button.dataset.action, button.dataset);
    });

    dock.addEventListener('keydown', (event) => {
      const tabbables = [...dock.querySelectorAll('button:not([disabled])')];
      if (event.key === 'Tab' && tabbables.length) {
        const first = tabbables[0], last = tabbables[tabbables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (['ArrowLeft', 'ArrowRight'].includes(event.key) && document.activeElement?.classList.contains('dock-tab')) {
        event.preventDefault();
        const tabs = [...dock.querySelectorAll('.dock-tab')];
        const i = tabs.indexOf(document.activeElement);
        const next = tabs[(i + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        next.click();
      }
    });

    return dock;
  };

  game.runDockAction = function (action, data = {}) {
    this.audio.ensure();
    if (action === 'tab-game' || action === 'tab-settings' || action === 'tab-help' || action === 'tab-radar') {
      this.commandDockTab = action.replace('tab-', '');
      this.syncCommandDock(true);
      return;
    }
    if (action === 'select-ship') { this.selectShip(data.shipId); return; }
    if (action === 'modal-continue') {
      const m = this.state.modal;
      if (!m) return;
      if (m.type === 'handoff') this.acceptHandoff();
      else if (m.type === 'feedback') { this.state.modal = null; this.computeRadar(this.state.turn); }
      else if (m.type === 'risk') this.confirmRisk(true);
      else if (m.type === 'end') this.restart();
      else if (['help', 'settings'].includes(m.type)) this.state.modal = null;
      return;
    }
    if (action === 'modal-cancel') {
      if (this.state.modal?.type === 'risk') this.confirmRisk(false);
      else if (this.state.modal) this.state.modal = null;
      return;
    }
    if (action === 'answer-true') { this.answerQuestion(true); return; }
    if (action === 'answer-false') { this.answerQuestion(false); return; }
    if (action === 'rotate') { this.rotateSelected(); return; }
    if (action === 'auto') { this.autoPlace(); return; }
    if (action === 'ready') { this.readyPlacement(); return; }
    if (action === 'difficulty') { this.cycleDifficulty(); return; }
    if (['attack', 'move', 'trap'].includes(action)) { this.setAction(action); return; }
    if (action === 'end') { this.endTurn(); return; }
    if (action === 'analyze-contact') {
      this.setAction('analyze');
      this.analyze(Number(data.row), Number(data.col));
      return;
    }
    if (action === 'help') { this.openHelp(); return; }
    if (action === 'tutorial-reset') {
      this.state.tutorial = { active: true, step: 0, dismissed: false };
      this.commandDockTab = 'help';
      this.toast('TUTORIAL REINICIADO');
      this.announce('Tutorial reiniciado. Siga uma missão por vez.');
      return;
    }
    if (action === 'tutorial-hide') { this.dismissTutorial(); return; }
    if (action === 'contrast') { this.toggleContrast(); return; }
    if (action === 'font') { this.cycleFont(); return; }
    if (action === 'music') { this.toggleMusic(); return; }
    if (action === 'sfx') { this.toggleSfx(); return; }
    if (action === 'zoom-in') { this.zoomCamera(0.1); return; }
    if (action === 'zoom-out') { this.zoomCamera(-0.1); return; }
    if (action === 'camera-center') { this.resetCamera(); }
  };

  game.renderDockGamePanel = function () {
    const modal = this.state.modal;
    if (modal?.type === 'handoff') {
      return `
        <div class="dock-card">
          <h3>${modal.title}</h3>
          <p>${modal.detail}</p>
          ${dockButton(`${this.ownerLabel(modal.owner)} continuar`, 'modal-continue', { primary: true })}
        </div>`;
    }
    if (modal?.type === 'question') {
      return `
        <div class="dock-card">
          <h3>Pergunta Verdadeiro ou Falso</h3>
          <p>${modal.question.pergunta}</p>
          <div class="dock-grid">
            ${dockButton('Verdadeiro', 'answer-true', { primary: true })}
            ${dockButton('Falso', 'answer-false')}
          </div>
        </div>`;
    }
    if (modal?.type === 'feedback') {
      return `
        <div class="dock-card">
          <h3>${modal.correct ? 'Resposta correta' : 'Resposta incorreta'}</h3>
          <p>${modal.question.explicacao}</p>
          ${dockButton('Continuar', 'modal-continue', { primary: true })}
        </div>`;
    }
    if (modal?.type === 'risk') {
      return `
        <div class="dock-card">
          <h3>Contato não analisado</h3>
          <p>Você ainda não sabe se é navio ou armadilha. Quer atacar mesmo assim?</p>
          <div class="dock-grid">
            ${dockButton('Atacar', 'modal-continue', { primary: true })}
            ${dockButton('Cancelar', 'modal-cancel')}
          </div>
        </div>`;
    }
    if (modal?.type === 'end') {
      return `
        <div class="dock-card">
          <h3>Fim da partida</h3>
          <p>${this.ownerLabel(this.state.winner)} venceu. Score J1: ${this.state.platformScore}/100.</p>
          ${dockButton('Jogar novamente', 'modal-continue', { primary: true })}
        </div>`;
    }
    const owner = this.currentOwner();
    const selected = this.selectedShip();
    const ships = this.state.ships[owner].filter(s => !s.destroyed);
    const shipButtons = ships.map((ship, i) => dockButton(`${i + 1}. ${ship.name}`, 'select-ship', {
      primary: selected?.uid === ship.uid,
      extra: `data-ship-id="${ship.uid}"`
    })).join('');

    if (this.state.phase === 'placement') {
      const ready = this.fleetReady(owner);
      return `
        <div class="dock-card">
          <h3>1. Escolha o navio</h3>
          <p>${selected ? `${selected.name}: coloque dentro do seu oceano.` : 'Escolha um navio para começar.'}</p>
          <div class="dock-list">${shipButtons}</div>
        </div>
        <div class="dock-card">
          <h3>2. Posicione sem pressa</h3>
          <p>Verde pode. Vermelho não pode. Toque no mapa para colocar.</p>
          <div class="dock-grid">
            ${dockButton('Girar', 'rotate')}
            ${dockButton('Auto', 'auto')}
            ${dockButton('Dificuldade', 'difficulty', { disabled: hasPlatformDifficulty() })}
            ${dockButton(ready ? 'Pronto' : 'Falta navio', 'ready', { primary: ready, disabled: !ready })}
          </div>
        </div>`;
    }

    const unavailable = !selected || selected.turnLocked || selected.destroyed;
    const canAttack = selected && !unavailable && selected.chargeType === 'missile' && selected.availableCharges > 0;
    const canMove = selected && !unavailable;
    const canTrap = selected && !unavailable && selected.typeId === 'trap-layer' && selected.availableCharges > 0 && selected.trapStock > 0;
    return `
      <div class="dock-card">
        <h3>1. Selecione seu navio</h3>
        <p>${describeShipStatus(selected)}</p>
        <div class="dock-list">${shipButtons || '<p>Nenhum navio disponível.</p>'}</div>
      </div>
      <div class="dock-card">
        <h3>2. Escolha a ação</h3>
        <p>${unavailable ? 'Turno indisponível até escolher um navio pronto.' : 'Agora toque no mapa para completar a ação.'}</p>
        <div class="dock-grid">
          ${dockButton('Atacar', 'attack', { disabled: !canAttack })}
          ${dockButton('Mover', 'move', { disabled: !canMove })}
          ${dockButton('Armadilha', 'trap', { disabled: !canTrap })}
          ${dockButton('Passar turno', 'end', { primary: true })}
        </div>
      </div>`;
  };

  game.renderDockSettingsPanel = function () {
    const cam = this.state.camera;
    return `
      <div class="dock-card">
        <h3>Leitura e som</h3>
        <div class="dock-grid">
          ${dockButton(this.state.settings.highContrast ? 'Contraste alto' : 'Contraste normal', 'contrast')}
          ${dockButton(`Texto ${Math.round(this.state.settings.fontScale * 100)}%`, 'font')}
          ${dockButton(this.state.settings.music ? 'Música ligada' : 'Música desligada', 'music')}
          ${dockButton(this.state.settings.sfx ? 'Efeitos ligados' : 'Efeitos desligados', 'sfx')}
        </div>
      </div>
      <div class="dock-card">
        <h3>Mapa e zoom</h3>
        <p>Zoom atual: ${Math.round((cam?.zoom || 1) * 100)}%. No celular, use os botões e toque no mapa.</p>
        <div class="dock-grid">
          ${dockButton('Zoom -', 'zoom-out')}
          ${dockButton('Zoom +', 'zoom-in')}
          ${dockButton('Centralizar', 'camera-center', { primary: true })}
        </div>
      </div>`;
  };

  game.renderDockHelpPanel = function () {
    const tip = this.currentTutorial();
    return `
      <div class="dock-card">
        <h3>Tutorial dinâmico</h3>
        <p>${tip ? `${tip.title}: ${tip.goal} ${tip.hint}` : 'Tutorial concluído. Você pode reiniciar quando quiser.'}</p>
        <div class="dock-grid">
          ${dockButton('Reiniciar tutorial', 'tutorial-reset', { primary: true })}
          ${dockButton('Ocultar dica', 'tutorial-hide', { disabled: !tip })}
        </div>
      </div>
      <div class="dock-card">
        <h3>Regra simples</h3>
        <p>1. Coloque seus navios. 2. Passe o controle. 3. Na sua vez, escolha um navio. 4. Escolha atacar, mover, armadilha ou radar.</p>
        <p class="dock-note">As coordenadas começam no A1, no canto superior esquerdo de cada oceano.</p>
      </div>`;
  };

  game.renderDockRadarPanel = function () {
    const items = currentRadarItems(this);
    const canAnalyze = this.state.phase === 'battle' && this.state.analysisAvailable[this.state.turn] && this.questionsLoaded;
    const buttons = items.map((item, i) => dockButton(`${i + 1}. ${item.label} - ${simpleCoord(item.row, item.col)}`, 'analyze-contact', {
      disabled: item.revealed || !canAnalyze,
      extra: `data-row="${item.row}" data-col="${item.col}"`
    })).join('');
    return `
      <div class="dock-card">
        <h3>Analisar no alcance</h3>
        <p>${this.state.phase === 'battle' ? 'O radar mostra contatos a até 3 casas de qualquer navio seu.' : 'O radar libera quando a batalha começar.'}</p>
        <div class="dock-list">${buttons || '<p>Nenhum contato no alcance agora.</p>'}</div>
        <p class="dock-note">${canAnalyze ? 'Ao analisar, responda Verdadeiro ou Falso para revelar o contato.' : 'Análise indisponível neste turno ou perguntas ainda carregando.'}</p>
      </div>`;
  };

  game.syncCommandDock = function (force = false) {
    const dock = this.ensureCommandDock();
    const active = this.commandDockTab || 'game';
    for (const tab of dock.querySelectorAll('.dock-tab')) {
      tab.setAttribute('aria-selected', String(tab.dataset.tab === active));
    }
    const subtitle = dock.querySelector('#dockSubtitle');
    if (subtitle) subtitle.textContent = `${this.ownerLabel(this.currentOwner())} - ${this.state.phase === 'placement' ? 'posicionamento' : this.state.phase === 'battle' ? 'batalha' : 'fim'} - use Tab para circular.`;
    const panels = {
      game: this.renderDockGamePanel(),
      settings: this.renderDockSettingsPanel(),
      help: this.renderDockHelpPanel(),
      radar: this.renderDockRadarPanel()
    };
    for (const panel of dock.querySelectorAll('.dock-panel')) {
      panel.classList.toggle('is-active', panel.dataset.panel === active);
      const html = panels[panel.dataset.panel] || '';
      if (force || panel.dataset.lastHtml !== html) {
        panel.innerHTML = html;
        panel.dataset.lastHtml = html;
      }
    }
  };

  game.applyCameraLayout = function (w = this.geom?.w || window.innerWidth, h = this.geom?.h || window.innerHeight, dpr = this.geom?.dpr || Math.max(1, Math.min(2, window.devicePixelRatio || 1))) {
    const cam = this.state.camera || (this.state.camera = { zoom: 1, offsetX: 0, offsetY: 0, minZoom: 0.85, maxZoom: 2.2 });
    const zoom = clamp(cam.zoom || 1, cam.minZoom || 0.85, cam.maxZoom || 2.2);
    const reservedRight = dockWidth();
    const reservedBottom = isCompactLandscape() ? Math.min(180, Math.max(142, h * 0.4)) : 0;
    const playW = Math.max(320, w - reservedRight - 22);
    const playH = Math.max(210, h - reservedBottom);
    const baseCell = Math.max(8, Math.floor(Math.min((playW - 22) / 30, (playH - 106) / 10)));
    const cell = Math.max(8, Math.floor(baseCell * zoom));
    const gw = cell * 30;
    const gh = cell * 10;
    const maxOffsetX = Math.max(0, (gw - playW) / 2) + 120;
    const maxOffsetY = Math.max(0, (gh - playH) / 2) + 90;
    cam.offsetX = clamp(cam.offsetX || 0, -maxOffsetX, maxOffsetX);
    cam.offsetY = clamp(cam.offsetY || 0, -maxOffsetY, maxOffsetY);
    this.geom = {
      w, h, dpr, cell,
      gx: Math.floor((playW - gw) / 2 + cam.offsetX + 8),
      gy: Math.floor(84 + Math.max(0, (playH - gh - 116) / 2) + cam.offsetY),
      gw, gh,
      playW,
      playH,
      reservedRight,
      reservedBottom
    };
  };

  game.resize = function () {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(240, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.applyCameraLayout(w, h, dpr);
    this.syncCommandDock(true);
  };

  game.drawOcean = function (t) {
    const g = this.geom, frame = this.waterFrame(t), tile = 64;
    ctx.save();
    ctx.fillStyle = '#071a20';
    ctx.fillRect(0, 0, g.w, g.h);
    if (this.assetsReady) {
      ctx.filter = 'saturate(24%) brightness(62%) contrast(82%)';
      ctx.globalAlpha = 0.72;
      for (let y = 0; y < g.h; y += tile) {
        for (let x = 0; x < g.w; x += tile) {
          let zone = 'neutral';
          if (x < g.gx + g.cell * 10) zone = 'player1';
          else if (x >= g.gx + g.cell * 20) zone = 'player2';
          const img = this.img.water[zone][frame];
          if (img) ctx.drawImage(img, x, y, tile, tile);
        }
      }
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(3,18,23,.56)';
    ctx.fillRect(0, 0, g.w, g.h);
    ctx.restore();
  };

  game.drawGrid = function (t) {
    base.drawGrid(t);
    if (window.innerWidth < 900) return;
    const g = this.geom;
    const y = Math.max(58, g.gy - 30);
    const zones = [
      ['JOGADOR 1', g.gx + g.cell * 5, '#9fe8ff'],
      ['NEUTRO', g.gx + g.cell * 15, '#f7e59d'],
      ['JOGADOR 2', g.gx + g.cell * 25, '#ffb3b3']
    ];
    for (const [label, x, color] of zones) {
      this.drawText(label, x, y, Math.max(9, Math.min(12, g.cell * 0.36)) * this.state.settings.fontScale, color, 'center');
    }
  };

  game.drawTopStatus = function () {
    const g = this.geom;
    const owner = this.currentOwner();
    const scores = this.currentScores();
    const diff = GDM_CONFIG.difficulties[this.state.difficulty].label;
    const x = 10, y = 10, w = Math.min(g.playW ? g.playW - 20 : g.w - 20, 720), h = 58;
    this.drawPanel(x, y, w, h);
    this.drawText(`${this.ownerLabel(owner)} - ${this.state.phase === 'placement' ? 'POSICIONE A FROTA' : this.state.phase === 'battle' ? 'SUA VEZ' : 'FIM DE JOGO'}`, x + 14, y + 23, 12 * this.state.settings.fontScale, '#fff1bc', 'left');
    this.drawText(`J1 ${scores.player1}/100  |  J2 ${scores.player2}/100  |  ${diff}  |  ${this.elapsedText()}`, x + 14, y + 46, 10 * this.state.settings.fontScale, '#d7efe5', 'left');
  };

  game.drawPlacementHud = function () {
    if (window.innerWidth < 900) return;
    const selected = this.selectedShip();
    const g = this.geom;
    const w = Math.min(410, (g.playW || g.w) - 20), h = 54, x = 10, y = Math.min(g.h - h - 14, g.gy + g.gh + 32);
    this.drawPanel(x, y, w, h);
    this.drawText('Use o painel Jogo: escolha navio, toque no mapa, depois aperte Pronto.', x + 12, y + 22, 9.5 * this.state.settings.fontScale, '#eef8ef', 'left');
    this.drawText(selected ? `Selecionado: ${selected.name}` : 'Nenhum navio selecionado', x + 12, y + 42, 9.5 * this.state.settings.fontScale, '#8fe8ff', 'left');
  };

  game.drawBattleHud = function () {
    if (window.innerWidth < 900) return;
    const selected = this.selectedShip();
    const g = this.geom;
    const w = Math.min(440, (g.playW || g.w) - 20), h = 58, x = 10, y = Math.min(g.h - h - 14, g.gy + g.gh + 28);
    this.drawPanel(x, y, w, h);
    this.drawText(selected ? `${selected.name} selecionado - ${readableActionName(this.state.action || 'escolha ação')}` : 'Escolha primeiro um navio no painel Jogo.', x + 12, y + 23, 10 * this.state.settings.fontScale, '#fff1bc', 'left');
    this.drawText('Radar e perguntas ficam na aba Radar. Botões grandes funcionam com touch.', x + 12, y + 44, 9.2 * this.state.settings.fontScale, '#d7efe5', 'left');
  };

  game.drawHud = function (t) {
    this.drawTopStatus();
    if (this.state.phase === 'placement') this.drawPlacementHud();
    else if (['battle', 'end'].includes(this.state.phase)) this.drawBattleHud();
  };

  game.tutorialSteps = function () {
    return [
      { title: 'Passo 1', goal: 'Escolha um navio no painel Jogo.', hint: 'Depois toque em uma casa verde do seu oceano.' },
      { title: 'Passo 2', goal: 'Use Girar se o navio não couber.', hint: 'Navio grande precisa de espaço livre.' },
      { title: 'Passo 3', goal: 'Coloque todos os navios.', hint: 'O botão Auto ajuda quando você quiser começar rápido.' },
      { title: 'Passo 4', goal: 'Aperte Pronto e passe o controle.', hint: 'A tela esconde o mapa para ninguém ver a frota do outro.' },
      { title: 'Passo 5', goal: 'Na batalha, selecione um navio primeiro.', hint: 'As ações só liberam quando o navio pode jogar.' },
      { title: 'Passo 6', goal: 'Escolha Atacar, Mover ou Armadilha.', hint: 'Depois toque no mapa.' },
      { title: 'Passo 7', goal: 'Abra a aba Radar para analisar contatos.', hint: 'Responda Verdadeiro ou Falso para revelar o que é.' },
      { title: 'Passo 8', goal: 'Passe o turno.', hint: 'O outro jogador confirma antes de ver o próprio mapa.' }
    ];
  };

  game.drawTutorialCoach = function () {
    const tip = this.currentTutorial();
    if (!tip || this.state.modal) return;
    if (window.innerWidth < 900) return;
    const g = this.geom;
    const w = Math.min(430, (g.playW || g.w) - 20), h = 86, x = 10, y = 76;
    this.drawPanel(x, y, w, h);
    this.drawText('TUTORIAL', x + 12, y + 21, 10 * this.state.settings.fontScale, '#8fe8ff', 'left');
    this.drawText(`${tip.title}: ${tip.goal}`, x + 12, y + 43, 10.5 * this.state.settings.fontScale, '#ffffff', 'left');
    this.drawWrappedBlock(tip.hint, x + 12, y + 64, w - 24, 9.2 * this.state.settings.fontScale, '#d7efe5', 'left', 13 * this.state.settings.fontScale);
  };

  game.draw = function (t) {
    base.draw(t);
    this.drawTutorialCoach();
    this.syncCommandDock();
  };

  const oldInstructions = document.getElementById('gdmInstructions');
  if (oldInstructions) {
    oldInstructions.textContent = 'Use Tab para entrar no painel circular de comandos. As abas são Jogo, Config, Dúvidas e Radar. O canvas não recebe foco por Tab. No celular, jogue com a tela deitada e use os botões grandes por toque.';
  }

  game.resize();
  game.ensureCommandDock();
  game.syncCommandDock(true);
  game.toast('VISUAL LIMPO, PAINEL ACESSÍVEL E TOUCH ATUALIZADOS.', 2400);
})();
