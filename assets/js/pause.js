(() => {
  'use strict';

  // MENU DE PAUSA — abre no meio da tela com Esc (quando não há nada para cancelar).
  // Continuar, opções rápidas (acessibilidade e som), ajuda e voltar ao menu inicial.

  const game = window.GDM_GAME;
  if (!game) return;

  const SIZES = [[1, 'Normal'], [1.25, 'Grande'], [1.5, 'Gigante']];
  const OPTIONS = [
    { key: 'screenReader', label: 'Modo leitor de tela', toggle: () => game.toggleScreenReader() },
    { key: 'highContrast', label: 'Alto contraste', toggle: () => game.toggleContrast() },
    { key: 'fontScale', label: 'Tamanho do texto', toggle: () => game.cycleFont() },
    { key: 'reduceMotion', label: 'Menos animação', toggle: () => game.toggleMotion() },
    { key: 'music', label: 'Música', toggle: () => game.toggleMusic() },
    { key: 'sfx', label: 'Efeitos sonoros', toggle: () => game.toggleSfx() },
    { key: 'mapSounds', label: 'Sons do mapa', toggle: () => game.toggleMapSounds() }
  ];

  const el = document.createElement('div');
  el.id = 'gdmPause';
  el.className = 'pause-screen';
  el.hidden = true;
  el.innerHTML = `
    <div class="pause-card" role="dialog" aria-modal="true" aria-labelledby="gdmPauseTitle" aria-describedby="gdmPauseDesc">
      <h2 id="gdmPauseTitle" class="pause-title">Jogo pausado</h2>
      <p id="gdmPauseDesc" class="pause-desc tc-read" tabindex="0">Setas ou Tab escolhem. Enter confirma. Esc volta para o jogo.</p>
      <div class="pause-view" data-view="main">
        <button type="button" class="tc-btn tc-primary" data-go="resume">Continuar jogando</button>
        <button type="button" class="tc-btn tc-ghost" data-go="options">Opções e acessibilidade</button>
        <button type="button" class="tc-btn tc-ghost" data-go="help">Ajuda e dúvidas</button>
        <button type="button" class="tc-btn tc-second" data-go="menu">Sair para o menu inicial</button>
        <p class="pause-note" id="gdmPauseNote"></p>
      </div>
      <div class="pause-view" data-view="options" hidden>
        ${OPTIONS.map(o => `<button type="button" class="tm-row" data-opt="${o.key}" ${o.key === 'fontScale' ? '' : 'role="switch" aria-checked="false"'}>
          <span class="tm-label">${o.label}</span><span class="tm-value" aria-hidden="true"></span></button>`).join('')}
        <button type="button" class="tm-back" data-go="main">Voltar</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  const views = { main: el.querySelector('[data-view="main"]'), options: el.querySelector('[data-view="options"]') };
  let view = 'main', armedMenu = false;
  const list = () => [el.querySelector('.pause-desc'), ...views[view].querySelectorAll('button')];

  const sync = () => {
    const s = game.state.settings;
    for (const row of el.querySelectorAll('.tm-row')) {
      const k = row.dataset.opt, out = row.querySelector('.tm-value');
      if (k === 'fontScale') {
        const name = (SIZES.find(([v]) => v === (s.fontScale || 1)) || SIZES[0])[1];
        out.textContent = name; row.setAttribute('aria-label', `Tamanho do texto: ${name}. Enter muda`);
      } else { const on = !!s[k]; out.textContent = on ? 'Ligado' : 'Desligado'; row.setAttribute('aria-checked', String(on)); }
    }
    game.applyLook();
  };

  const show = (name, focusKey) => {
    view = name;
    for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
    el.querySelector('.pause-title').textContent = name === 'options' ? 'Opções' : 'Jogo pausado';
    const btns = [...views[name].querySelectorAll('button')];
    (btns.find(b => b.dataset.go === focusKey || b.dataset.opt === focusKey) || btns[0]).focus();
  };

  const open = () => {
    if (game.titleOpen || !el.hidden) return;
    armedMenu = false;
    el.querySelector('[data-go="menu"]').textContent = 'Sair para o menu inicial';
    el.querySelector('#gdmPauseNote').textContent = game.state.phase === 'battle' ? 'Sua partida fica salva: no menu, escolha Continuar partida.' : '';
    sync();
    el.hidden = false;
    game.pauseOpen = true;
    game.audio.play('select');
    show('main');
    game.notify();
  };

  const close = () => {
    if (el.hidden) return;
    el.hidden = true;
    game.pauseOpen = false;
    game.audio.play('click');
    if (game.a11y) game.a11y.focusCursor();
    game.announce('De volta ao jogo.', true);
    game.notify();
  };

  el.addEventListener('click', e => {
    if (e.target === el) { close(); return; }
    const b = e.target.closest('button');
    if (!b) return;
    const go = b.dataset.go;
    if (go === 'resume') return close();
    if (go === 'options') { game.audio.play('select'); return show('options'); }
    if (go === 'main') { game.audio.play('select'); return show('main', 'options'); }
    if (go === 'help') { close(); if (game.panel) game.panel.open('help', true); return; }
    if (go === 'menu') {
      // pede confirmação (toque de novo) para não sair sem querer
      if (!armedMenu) {
        armedMenu = true; b.textContent = 'Tem certeza? Aperte de novo para sair';
        game.announce('Tem certeza? Aperte de novo para sair para o menu inicial.', true);
        return;
      }
      game.saveMatch();
      location.reload();
      return;
    }
    const opt = OPTIONS.find(o => o.key === b.dataset.opt);
    if (opt) { opt.toggle(); game.audio.play('select'); sync(); }
  });

  // Teclado: o menu cuida das próprias teclas enquanto está aberto.
  window.addEventListener('keydown', e => {
    if (el.hidden) return;
    const items = list(), i = items.indexOf(document.activeElement);
    const step = d => { e.preventDefault(); items[(i + d + items.length) % items.length].focus(); };
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); if (view !== 'main') show('main', 'options'); else close(); return; }
    if (e.key === 'Tab') return step(e.shiftKey ? -1 : 1);
    if (e.key === 'ArrowDown') return step(1);
    if (e.key === 'ArrowUp') return step(-1);
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.activeElement?.classList.contains('tm-row')) { e.preventDefault(); document.activeElement.click(); return; }
    if (e.key.toLowerCase() === 'q') { e.preventDefault(); game.announce('Você está no MENU DE PAUSA. Setas ou Tab escolhem um botão, Enter confirma e Esc volta para o jogo.', true); }
  }, true);

  game.openPause = open;
  game.closePause = close;
})();
