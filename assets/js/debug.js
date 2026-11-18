// Menu de cenários (para apresentar rápido): Ctrl + Shift + D, ou abra o jogo com ?debug=1.
(function () {
  'use strict';
  const game = window.GDM_GAME;
  if (!game) return;
  const L = GDM_LOGIC;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const st = () => game.state;

  async function closeTitle() {
    const t = document.getElementById('gdmTitle');
    if (game.titleOpen && t) {
      t.querySelector('[data-go="play"]').click(); await wait(300);
      const d = t.querySelector('[data-diff="facil"]');
      if (d && d.offsetParent !== null) { d.click(); }
      await wait(900);
    }
  }
  async function toBattle() {
    await closeTitle();
    if (game.mission && game.mission.active) game.mission.stop();
    if (st().phase === 'end') { st().modal = null; game.resetMatch(st().difficulty); st().phase = 'placement'; }
    if (st().phase === 'placement') {
      game.autoPlace(); await wait(200);
      game.readyPlacement();
    }
    for (let i = 0; i < 60 && (st().phase !== 'battle' || game.isAiTurn() || st().modal); i++) {
      if (st().modal && st().modal.type !== 'question' && st().modal.buttons && st().modal.buttons[0]) { try { st().modal.buttons[0].onClick(); } catch (_e) {} }
      await wait(250);
    }
    if (game.mission && game.mission.active) game.mission.stop();
  }
  function jump(id, data = {}) {
    const m = game.mission;
    m.mode = 'mission'; m.active = true; m.data = { fired: true, ...data }; m.list = m.steps();
    m.index = m.list.findIndex(x => x.id === id);
    const s = m.step();
    if (s && s.enter) s.enter();
    m.render(true);
  }
  const sink = s => { s.destroyed = true; s.hp = 0; s.cells = []; };

  const SCENES = [
    ['Tutorial do começo', async () => { await closeTitle(); game.mission.restart(); }],
    ['Batalha (frota pronta)', toBattle],
    ['Baús do tesouro', async () => { await toBattle(); jump('chest'); }],
    ['Armadilhas (explicação)', async () => { await toBattle(); jump('trapInfo'); }],
    ['Analisar na prática', async () => { await toBattle(); jump('contact'); }],
    ['Vez do Barba-Rubra', async () => { await toBattle(); game.endTurn(); }],
    ['Quase vencendo', async () => {
      await toBattle();
      const g = game, S = st();
      const foes = S.ships.player2.filter(s => !s.destroyed).sort((a, b) => a.size - b.size);
      foes.slice(1).forEach(sink);
      const last = foes[0];
      // nosso melhor canhão, carregado e pronto
      const shooter = S.ships.player1.filter(s => !s.destroyed && s.chargeType === 'missile').sort((a, b) => g.shipRange(b) - g.shipRange(a))[0];
      if (!last || !shooter) return;
      shooter.turnLocked = false; shooter.availableCharges = Math.max(1, shooter.availableCharges); shooter.rechargeQueue = [];
      // leva o último navio do pirata para dentro do alcance (no oceano dele ou no Neutro)
      const free = cells => cells.every(c => c.col >= 10 && c.col <= 29 && c.row >= 0 && c.row <= 9 && !(L.shipAt(S, c.row, c.col) && L.shipAt(S, c.row, c.col) !== last) && !L.trapAt(S, c.row, c.col));
      let spot = null;
      for (const startCol of [20, 21, 22, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10]) {
        for (let row = 0; row < 10 && !spot; row++) {
          const cells = L.cells(row, startCol, last.size, 'horizontal');
          if (free(cells) && cells.every(c => g.inAttackRange(shooter, c.row, c.col))) spot = { row, col: startCol };
        }
        if (spot) break;
      }
      if (spot) { Object.assign(last, { row: spot.row, col: spot.col, orientation: 'horizontal' }); L.refresh(last); }
      last.hp = Math.min(last.maxHp, Math.max(1, (shooter.damage || 200) - 1));
      S.revealed.player1.add(L.objectId(last, 'ship'));
      g.computeRadar('player1');
      g.selectShip(shooter.uid);
      g.focusZone(2, true);
      g.toast(`Só falta 1 navio! Use o ${g.shipName(shooter)}: ATACAR e um tiro nele!`, 'success', 3200);
    }],
    ['Vitória', async () => { await toBattle(); st().ships.player2.forEach(sink); game.checkEnd(); }],
    ['Derrota', async () => { await toBattle(); st().ships.player1.forEach(sink); game.checkEnd(); }]
  ];

  const el = document.createElement('div');
  el.id = 'gdmDebug';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Cenários do jogo');
  el.innerHTML = `<p class="dbg-title">Cenários <small>Ctrl+Shift+D</small></p>` +
    SCENES.map(([name], i) => `<button type="button" data-i="${i}">${name}</button>`).join('') +
    `<button type="button" data-close class="dbg-close">Fechar</button>`;
  document.body.appendChild(el);
  el.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-close')) { el.hidden = true; return; }
    el.hidden = true;
    try { await SCENES[Number(b.dataset.i)][1](); } catch (err) { console.error(err); game.toast('Não deu para abrir esse cenário', 'warn'); }
  });
  const toggle = () => { el.hidden = !el.hidden; if (!el.hidden) el.querySelector('button').focus(); };
  window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); e.stopPropagation(); toggle(); }
  }, true);
  if (/[?&]debug=1/.test(location.search)) {
    const fab = document.createElement('button');
    fab.type = 'button'; fab.id = 'gdmDebugFab'; fab.textContent = 'Cenários'; fab.addEventListener('click', toggle);
    document.body.appendChild(fab);
  }
  game.debugScenes = { open: toggle, scenes: SCENES };
})();
