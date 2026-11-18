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
    { key: 'musicVol', label: 'Volume da música', vol: 'music' },
    { key: 'sfx', label: 'Efeitos sonoros', toggle: () => game.toggleSfx() },
    { key: 'sfxVol', label: 'Volume dos efeitos', vol: 'sfx' },
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

  const star = n => '<img src="assets/img/ui/star.png" alt="">'.repeat(n) + '<img src="assets/img/ui/star_grey.png" alt="">'.repeat(3 - n);

  const el = document.createElement('div');
  el.id = 'gdmTitle';
  el.className = 'title-screen';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'gdmTitleHeading');
  el.setAttribute('aria-describedby', 'gdmTitleDesc');
  el.innerHTML = `
        <p id="gdmTitleDesc" class="sr-only">Use as setas para cima e para baixo, ou Tab, para andar pelos textos e botões. Enter confirma. A tecla Q diz onde você está e como se movimentar.</p>
    <div class="tc-card">
      <div class="tc-quick">
        <button type="button" class="tc-round" data-go="sound" aria-pressed="true" aria-label="Som">${svg(I.sound)}</button>
        <button type="button" class="tc-round tc-gear" data-go="options" aria-label="Opções e acessibilidade">${svg(I.gear)}</button>
      </div>
      <header class="tc-head">
        <h1 id="gdmTitleHeading" class="tc-title"><img class="tc-logo" src="assets/img/ui/logo.png" alt="Guerra dos Mares"></h1>
        <p class="tc-sub">${svg(I.anchor)}Batalha naval de perguntas</p>
      </header>
      <div class="title-menu" data-view="main">
        <nav class="tc-buttons" aria-label="Menu principal">
          <button type="button" class="tm-item tc-btn tc-primary tc-resume" data-go="resume" hidden>${svg(I.play)}<span>Continuar partida</span></button>
          <button type="button" class="tm-item tc-btn tc-primary" data-go="play">${svg(I.play)}<span>Jogar</span></button>
          <button type="button" class="tm-item tc-btn tc-second" data-go="tutorial">${svg(I.book)}<span>Tutorial</span></button>
          <button type="button" class="tm-item tc-btn tc-ghost" data-go="options">${svg(I.gear)}<span>Opções</span></button>
        </nav>
      </div>
      <section class="title-menu tc-diff" data-view="difficulty" aria-labelledby="gdmDiffHeading" hidden>
        <h2 id="gdmDiffHeading" class="tm-heading">Qual desafio você quer?</h2>
        <p class="tc-diff-sub tc-read" id="gdmDiffSub" tabindex="0">O Barba-Rubra joga do jeito que você escolher.</p>
        <button type="button" class="tm-item tc-level tc-easy" data-diff="facil" aria-describedby="gdmDiffSub"><span class="tc-stars" aria-hidden="true">${star(1)}</span><span class="tc-level-text"><b>Fácil</b><small>O pirata joga devagar</small></span></button>
        <button type="button" class="tm-item tc-level tc-mid" data-diff="medio"><span class="tc-stars" aria-hidden="true">${star(2)}</span><span class="tc-level-text"><b>Médio</b><small>Uma batalha equilibrada</small></span></button>
        <button type="button" class="tm-item tc-level tc-hard" data-diff="dificil"><span class="tc-stars" aria-hidden="true">${star(3)}</span><span class="tc-level-text"><b>Difícil</b><small>O pirata joga com tudo!</small></span></button>
        <button type="button" class="tm-back" data-go="main">Voltar</button>
      </section>
      <div class="title-board">
      <section class="title-menu title-options" data-view="options" aria-labelledby="gdmOptHeading" hidden>
        <h2 id="gdmOptHeading" class="tm-heading">Opções</h2>
        ${OPTIONS.map(o => `<button type="button" class="tm-row${o.vol ? ' tm-vol' : ''}" data-opt="${o.key}" ${o.vol ? `data-vol="${o.vol}" role="slider" aria-valuemin="0" aria-valuemax="10"` : o.key === 'fontScale' ? '' : 'role="switch" aria-checked="false"'}>
          <span class="tm-label">${o.label}</span><span class="tm-value" aria-hidden="true"></span></button>`).join('')}
        <button type="button" class="tm-item tm-back" data-go="main">Voltar</button>
      </section>
    </div>
    </div>
`;
  document.body.appendChild(el);

  const views = { main: el.querySelector('[data-view="main"]'), options: el.querySelector('[data-view="options"]'), difficulty: el.querySelector('[data-view="difficulty"]') };
  let afterStart = null;   // 'tutorial' | 'a11y' | null
  const hasSave = () => !!game.savedMatch();
  let view = 'main';
  const focusables = () => view === 'main'
    ? [...views.main.querySelectorAll('.tc-read, button'), ...el.querySelectorAll('.tc-quick button')].filter(b => !b.hidden)
    : [...views[view].querySelectorAll('.tc-read, button')];

  const sync = () => {
    const s = game.state.settings;
    for (const row of el.querySelectorAll('.tm-row')) {
      const k = row.dataset.opt, out = row.querySelector('.tm-value');
      if (row.dataset.vol) {
        const v = s[k] ?? (k === 'musicVol' ? 6 : 8);
        out.innerHTML = `<span class="tm-step" data-step="-1" aria-hidden="true">−</span><span class="tm-bar" aria-hidden="true"><i style="width:${v * 10}%"></i></span><b>${v}</b><span class="tm-step" data-step="1" aria-hidden="true">+</span>`;
        row.setAttribute('aria-valuenow', String(v));
        row.setAttribute('aria-valuetext', v === 0 ? 'mudo' : `${v} de 10`);
        row.setAttribute("aria-label", row.querySelector(".tm-label").textContent);
        continue;
      }
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
    el.classList.toggle('is-options', name !== 'main');
    game.audio.play('select');
    const list = focusables();
    const target = focusKey ? list.find(b => b.dataset.opt === focusKey || b.dataset.go === focusKey || b.dataset.diff === focusKey) : list[0];
    (target || list[0]).focus();
  };

  // Começa uma partida nova na dificuldade escolhida (apaga o jogo salvo antigo).
  const begin = diff => {
    game.clearSave();
    if (game.state.difficulty !== diff || game.state.phase !== 'placement') { game.resetMatch(diff); game.state.phase = 'placement'; }
    game.announce(`Dificuldade ${game.difficultyName(diff)}.`);
    if (afterStart && game.mission) game.mission.suppressAuto = true;
    start();
    if (afterStart === 'tutorial') setTimeout(() => game.mission && game.mission.restart(), 450);
    if (afterStart === 'a11y') setTimeout(() => game.mission && game.mission.startA11yGuide(), 450);
  };

  const start = (resumed = false) => {
    if (!el.isConnected || !game.titleOpen) return;
    game.audio.ensure();
    game.audio.play('handoff');
    el.classList.add('is-leaving');
    game.titleOpen = false;
    setTimeout(() => { el.remove(); if (game.panel) game.panel.render(true); }, game.state.settings.reduceMotion ? 0 : 400);
    if (!resumed) game.announce('Vamos jogar! Você contra o Barba-Rubra.');
  };

  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go === 'resume') { if (game.resumeMatch()) start(true); return; }
    if (['play', 'tutorial', 'a11y'].includes(b.dataset.go)) {
      afterStart = b.dataset.go === 'play' ? null : b.dataset.go;
      // dificuldade já escolhida pela plataforma: começa direto
      if (typeof hasPlatformDifficulty === 'function' && hasPlatformDifficulty()) return begin(getPlatformDifficulty());
      return show('difficulty', 'medio');
    }
    if (b.dataset.diff) return begin(b.dataset.diff);
    if (b.dataset.go === 'sound') {
      const st = game.state.settings, on = !(st.music || st.sfx);
      if (!!st.music !== on) game.toggleMusic();
      if (!!st.sfx !== on) game.toggleSfx();
      sync(); return;
    }
    if (b.dataset.go === 'options') return show('options');
    if (b.dataset.go === 'main') return show('main', view === 'options' ? 'options' : 'play');
    if (b.dataset.vol) {
      const k = b.dataset.opt, cur = game.state.settings[k] ?? (k === 'musicVol' ? 6 : 8);
      const stepEl = e.target.closest && e.target.closest('.tm-step');
      const d = stepEl ? Number(stepEl.dataset.step) : (cur >= 10 ? -10 : 1);
      game.setVolume(b.dataset.vol, cur + d); sync(); return;
    }
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
      e.preventDefault(); e.stopPropagation();
      const r = document.activeElement;
      if (r.dataset.vol) { const k = r.dataset.opt; game.setVolume(r.dataset.vol, (game.state.settings[k] ?? (k === 'musicVol' ? 6 : 8)) + (e.key === 'ArrowRight' ? 1 : -1)); sync(); }
      else r.click();
      return;
    }
    if (e.key === 'Escape' && view !== 'main') { e.preventDefault(); e.stopPropagation(); show('main', view === 'options' ? 'options' : 'play'); return; }
    e.stopPropagation();
  }, true);

  const ready = () => {
    if (game.state.phase === 'loading') { setTimeout(ready, 150); return; }
    sync();
    const resume = el.querySelector('[data-go="resume"]'), play = el.querySelector('[data-go="play"]');
    if (hasSave()) {
      resume.hidden = false;
      play.querySelector('span').textContent = 'Novo jogo';
      play.classList.replace('tc-primary', 'tc-second');
      el.querySelector('[data-go="tutorial"]').classList.replace('tc-second', 'tc-ghost');
    }
    el.classList.add('is-ready');
    views.main.querySelector('button:not([hidden])').focus();
  };
  sync();
  ready();
})();
