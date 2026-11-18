(() => {
  'use strict';

  // Tela inicial no estilo menu de jogo: JOGAR e OPÇÕES.
  // As opções (acessibilidade e som) ficam disponíveis ANTES de começar a partida.

  const game = window.GDM_GAME;
  if (!game) return;
  game.titleOpen = true;

  const SIZES = [[1, 'Normal'], [1.25, 'Grande'], [1.5, 'Gigante']];
  const OPTIONS = [
    { key: 'screenReader', label: 'Modo leitor de tela', toggle: () => game.toggleScreenReader() },
    { key: 'highContrast', label: 'Alto contraste', toggle: () => game.toggleContrast() },
    { key: 'fontScale', label: 'Tamanho do texto', toggle: () => game.cycleFont() },
    { key: 'reduceMotion', label: 'Reduzir animações', toggle: () => game.toggleMotion() },
    { key: 'music', label: 'Música', toggle: () => game.toggleMusic() },
    { key: 'sfx', label: 'Efeitos sonoros', toggle: () => game.toggleSfx() },
    { key: 'mapSounds', label: 'Sons do mapa', toggle: () => game.toggleMapSounds() }
  ];

  const svg = d => `<svg class="ti" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
  const I = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    book: '<path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="m17 9 5 6M22 9l-5 6"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M4 14a8 8 0 0 0 16 0"/>',
    a11y: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5c4 1 10 1 14 0M12 9.5v5M12 14.5l-3 6M12 14.5l3 6"/>'
  };

  const el = document.createElement('div');
  el.id = 'gdmTitle';
  el.className = 'title-screen';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'gdmTitleHeading');
  el.setAttribute('aria-describedby', 'gdmTitleDesc');
  el.innerHTML = `
        <p id="gdmTitleDesc" class="sr-only">Você contra o Barba-Rubra. Use Tab ou as setas para escolher. Em Opções ficam o modo leitor de tela, alto contraste e os sons.</p>
    <div class="tc-card">
      <div class="tc-quick">
        <button type="button" class="tc-round" data-go="sound" aria-pressed="true" aria-label="Som">${svg(I.sound)}</button>
        <button type="button" class="tc-round tc-gear" data-go="options" aria-label="Opções e acessibilidade">${svg(I.gear)}</button>
      </div>
      <header class="tc-head">
        <h1 id="gdmTitleHeading" class="tc-title">Guerra dos Mares</h1>
        <p class="tc-sub">${svg(I.anchor)}Batalha naval de perguntas</p>
      </header>
      <div class="title-menu" data-view="main">
        <div class="tc-hello">
          <img src="assets/img/ui/capitao_rosto.png" alt="">
          <p>Olá! Eu sou o <b>Capitão Maré</b>. Vamos vencer o <b>Barba-Rubra</b> e proteger os mares?</p>
        </div>
        <nav class="tc-buttons" aria-label="Menu principal">
          <button type="button" class="tm-item tc-btn tc-primary" data-go="play">${svg(I.play)}<span>Jogar</span></button>
          <button type="button" class="tm-item tc-btn tc-second" data-go="tutorial">${svg(I.book)}<span>Como jogar</span></button>
          <button type="button" class="tm-item tc-btn tc-ghost" data-go="options">${svg(I.a11y)}<span>Opções e acessibilidade</span></button>
        </nav>
        <section class="tc-seas" aria-label="Os três oceanos">
          <h2>Os três oceanos</h2>
          <ul>
            <li><span class="tc-sea tc-sea-me"><img src="assets/img/ships/icon_p1.png" alt=""></span>Seu oceano</li>
            <li><span class="tc-sea tc-sea-mid"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/></svg></span>Oceano neutro</li>
            <li><span class="tc-sea tc-sea-foe"><img src="assets/img/ships/icon_p2.png" alt=""></span>Oceano inimigo</li>
          </ul>
        </section>
        <p class="tc-foot">4º ano do Ensino Fundamental</p>
      </div>
      <div class="title-board">
      <section class="title-menu title-options" data-view="options" aria-labelledby="gdmOptHeading" hidden>
        <h2 id="gdmOptHeading" class="tm-heading">Opções</h2>
        ${OPTIONS.map(o => `<button type="button" class="tm-row" data-opt="${o.key}" ${o.key === 'fontScale' ? '' : 'role="switch" aria-checked="false"'}>
          <span class="tm-label">${o.label}</span><span class="tm-value" aria-hidden="true"></span></button>`).join('')}
        <button type="button" class="tm-item tm-back" data-go="main">Voltar</button>
      </section>
    </div>
    </div>
`;
  document.body.appendChild(el);

  const views = { main: el.querySelector('[data-view="main"]'), options: el.querySelector('[data-view="options"]') };
  let view = 'main';
  const focusables = () => view === 'main'
    ? [...views.main.querySelectorAll('button'), ...el.querySelectorAll('.tc-quick button')]
    : [...views[view].querySelectorAll('button')];

  const sync = () => {
    const s = game.state.settings;
    for (const row of el.querySelectorAll('.tm-row')) {
      const k = row.dataset.opt, out = row.querySelector('.tm-value');
      if (k === 'fontScale') {
        const name = (SIZES.find(([v]) => v === (s.fontScale || 1)) || SIZES[0])[1];
        out.textContent = name;
        row.setAttribute('aria-label', `Tamanho do texto: ${name}. Enter muda`);
      } else {
        const on = !!s[k];
        out.textContent = on ? 'Ligado' : 'Desligado';
        row.setAttribute('aria-checked', String(on));
      }
    }
    const snd = el.querySelector('[data-go="sound"]'), on = !!(s.music || s.sfx);
    snd.setAttribute('aria-pressed', String(on));
    snd.innerHTML = svg(on ? I.sound : I.mute);
    game.applyLook();
  };

  const show = (name, focusKey) => {
    view = name;
    for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
    el.classList.toggle('is-options', name === 'options');
    game.audio.play('select');
    const list = focusables();
    const target = focusKey ? list.find(b => b.dataset.opt === focusKey || b.dataset.go === focusKey) : list[0];
    (target || list[0]).focus();
  };

  const start = () => {
    if (!el.isConnected || !game.titleOpen) return;
    game.audio.ensure();
    game.audio.play('handoff');
    el.classList.add('is-leaving');
    game.titleOpen = false;
    setTimeout(() => { el.remove(); if (game.panel) game.panel.render(true); }, game.state.settings.reduceMotion ? 0 : 400);
    game.announce('Vamos jogar! Você contra o computador.');
  };

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go === 'play') return start();
    if (b.dataset.go === 'tutorial') { start(); setTimeout(() => game.mission && game.mission.restart(), 450); return; }
    if (b.dataset.go === 'sound') {
      const st = game.state.settings, on = !(st.music || st.sfx);
      if (!!st.music !== on) game.toggleMusic();
      if (!!st.sfx !== on) game.toggleSfx();
      sync(); return;
    }
    if (b.dataset.go === 'options') return show('options');
    if (b.dataset.go === 'main') return show('main', 'options');
    const opt = OPTIONS.find(o => o.key === b.dataset.opt);
    if (opt) { opt.toggle(); game.audio.play('select'); sync(); }
  });

  // Teclado: setas e Tab circulam dentro da tela; Esc volta; Enter em lugar nenhum começa.
  window.addEventListener('keydown', e => {
    if (!game.titleOpen) return;
    const list = focusables();
    const i = list.indexOf(document.activeElement);
    const step = d => { e.preventDefault(); list[(i + d + list.length) % list.length].focus(); game.audio.play('click'); };
    if (e.key === 'Tab') { e.stopPropagation(); return step(e.shiftKey ? -1 : 1); }
    if (e.key === 'ArrowDown') { e.stopPropagation(); return step(1); }
    if (e.key === 'ArrowUp') { e.stopPropagation(); return step(-1); }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.activeElement?.classList.contains('tm-row')) {
      e.preventDefault(); e.stopPropagation(); document.activeElement.click(); return;
    }
    if (e.key === 'Escape' && view === 'options') { e.preventDefault(); e.stopPropagation(); show('main', 'options'); return; }
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); start(); }
    e.stopPropagation();
  }, true);

  const ready = () => {
    if (game.state.phase === 'loading') { setTimeout(ready, 150); return; }
    sync();
    el.classList.add('is-ready');
    views.main.querySelector('button').focus();
  };
  sync();
  ready();
})();
