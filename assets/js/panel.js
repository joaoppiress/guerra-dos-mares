(() => {
  'use strict';

  const game = window.GDM_GAME;
  if (!game) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONS = {
    game: '<path d="M4 15c3 3 13 3 16 0l-2 4H6z"/><path d="M12 3v10M12 4l6 7h-6"/>',
    radar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6"/>',
    attack: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    trap: '<circle cx="12" cy="13" r="6"/><path d="M12 3v4M12 19v2M4 13H2M22 13h-2M6.3 7.3 5 6M17.7 7.3 19 6"/>',
    analyze: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/><path d="M8.5 8.5a2 2 0 1 1 2.5 1.9V11"/>',
    end: '<path d="M5 12h12M13 7l5 5-5 5"/><path d="M20 5v14"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    auto: '<path d="m12 3 2 5 5 .5-4 3.5 1.3 5L12 14l-4.3 3 1.3-5-4-3.5L10 8z"/>',
    ready: '<path d="m5 12 5 5 9-10"/>',
    level: '<path d="M5 19V13M12 19V9M19 19V5"/>',
    mode: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>',
    ok: '<circle cx="12" cy="12" r="4"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M14 4v16"/>',
    point: '<path d="M9 11V5a2 2 0 1 1 4 0v5"/><path d="M13 10a2 2 0 1 1 4 0v1a2 2 0 1 1 4 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-3-5a2 2 0 0 1 3-2l2 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 5 5 9-10"/>'
  };

  const icon = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;


  // Dúvidas frequentes da aba Ajuda, separadas por fase do jogo.
  const FAQ = [
    ['Antes de começar', [
      ['Contra quem eu jogo?', 'Contra o computador, que comanda a frota do Barba-Rubra. Ele não espia onde estão os seus navios.'],
      ['Como ganho a partida?', 'Afundando todos os navios do computador antes que ele afunde os seus.'],
      ['O que são os três oceanos?', 'À esquerda, o seu oceano. No meio, o Oceano Neutro, onde todos podem navegar. À direita, o oceano do computador.'],
      ['Como leio uma casa, tipo C7?', 'A letra é a coluna (em cima) e o número é a linha (ao lado). C7 é a coluna C com a linha 7.']
    ]],
    ['Montando a frota', [
      ['Como coloco um navio?', 'Escolha o navio na lista. Depois, com o mouse, passe pelo seu oceano e clique quando ficar verde. Pelo teclado: setas para andar e Enter para colocar.'],
      ['Por que o navio fica vermelho?', 'Vermelho quer dizer que não cabe: ele sairia do seu oceano ou encostaria em outro navio. Troque de casa ou gire.'],
      ['Como giro o navio?', 'Botão GIRAR ou tecla R. Ele fica em pé ou deitado.'],
      ['Tem jeito mais rápido?', 'O botão AUTOMÁTICO (tecla P) coloca todos os navios que faltam.'],
      ['Quando a batalha começa?', 'Quando todos os navios estiverem no mapa e você apertar PRONTO.']
    ]],
    ['Na sua vez', [
      ['O que faço na minha vez?', 'Sempre em três passos: escolha um navio seu, escolha uma ação e escolha uma casa no mapa.'],
      ['Quais são as ações?', 'ATACAR (1) atira numa casa dentro do alcance. MOVER (2) navega até 3 casas (navios pequenos andam mais). ARMADILHA (3) esconde uma mina no seu oceano ou no Neutro. ANALISAR (4) decifra um "?" do radar.'],
      ['Por que não consigo usar um navio?', 'Cada navio age uma vez por vez. E os tiros usados voltam duas rodadas depois. O Lança-Armadilhas não atira: ele esconde minas.'],
      ['Escolhi a ação errada. E agora?', 'Aperte Cancelar, Esc ou o botão direito do mouse. Nada é gasto ao cancelar.'],
      ['Como termino a minha vez?', 'Aperte PASSAR A VEZ ou a tecla Espaço.']
    ]],
    ['Radar e perguntas', [
      ['O que é o "?" no mapa?', 'É algo que o radar de um navio seu percebeu por perto (até 3 casas). Pode ser um navio ou uma armadilha.'],
      ['Como descubro o que é?', 'Use ANALISAR no "?" e responda se a frase é Verdadeira ou Falsa. Acertando, o contato é revelado.'],
      ['E se eu errar a pergunta?', 'Você vê a resposta certa com a explicação. Dá para analisar de novo na próxima vez (uma análise por vez).']
    ]],
    ['Vez do computador', [
      ['O que faço enquanto ele joga?', 'Espere e observe o seu oceano: os tiros dele aparecem no mapa e são avisados em voz e na tela.'],
      ['Ele pode trapacear?', 'Não. Ele usa as mesmas regras que você e só sabe o que os próprios tiros e o radar mostraram.']
    ]],
    ['Pontos e fim de jogo', [
      ['Como ganho pontos?', 'Causando dano nos navios do computador, acertando as perguntas do radar e acertando os tiros. A nota vai de 0 a 100.'],
      ['O que as estrelas do final mostram?', 'O seu desempenho na partida: quanto mais pontos, mais estrelas.']
    ]],
    ['Teclado, leitor de tela e acessibilidade', [
      ['Quando uso Tab e quando uso as setas?', 'Tab pula de um lugar para outro (do mapa para o painel, de botão em botão) e Shift+Tab volta. As setas andam de casa em casa dentro do mapa e trocam as abas do painel. Perdido? Aperte Q.'],
      ['Como volto para o mapa?', 'Aperte N de qualquer lugar. No painel, o primeiro botão de cada aba é Voltar para o mapa.'],
      ['Dá para jogar só com o teclado?', 'Sim. Tab anda pelos botões, setas andam no mapa, Enter confirma e Esc cancela. G leva para o campo "Ir para a casa", onde você digita a casa (ex.: C7).'],
      ['Uso o Narrador do Windows. O que ligo?', 'Em Opções ou Ajustes, ligue "Modo leitor de tela": o computador joga mais devagar e as dicas são faladas sem roubar o foco. I fala a situação da partida, C fala a casa atual e T repete a dica do Capitão.'],
      ['A tela está difícil de ver.', 'Ligue Alto contraste, aumente o tamanho das letras ou troque o tipo de letra em Ajustes, na seção Texto.'],
      ['As animações me incomodam.', 'Ligue "Menos movimento" em Ajustes, na seção Tela.']
    ]]
  ];

  const TABS = [
    { id: 'game', label: 'Jogar' },
    { id: 'radar', label: 'Radar' },
    { id: 'help', label: 'Ajuda' },
    { id: 'settings', label: 'Ajustes' }
  ];

  // Botão do painel. "blocked" mantém o botão focável (aria-disabled) para que o motivo possa ser lido.
  function btn(key, label, { cls = '', ico = null, pressed = null, blocked = false, attrs = '', kbd = null, aria = null } = {}) {
    const a = [`type="button"`, `class="btn ${cls}"`, `data-key="${esc(key)}"`];
    if (pressed !== null) a.push(`aria-pressed="${pressed}"`);
    if (blocked) a.push('aria-disabled="true"');
    if (aria) a.push(`aria-label="${esc(aria)}"`);
    return `<button ${a.join(' ')} ${attrs}>${ico ? icon(ico) : ''}<span class="btn-label">${esc(label)}</span>${kbd ? `<kbd aria-hidden="true">${esc(kbd)}</kbd>` : ''}</button>`;
  }

  function sw(key, label, on, desc) {
    return `<button type="button" class="switch" role="switch" aria-checked="${on}" data-key="${key}">
      <span class="switch-text"><span class="switch-label">${esc(label)}</span>${desc ? `<span class="switch-desc">${esc(desc)}</span>` : ''}</span>
      <span class="switch-state" aria-hidden="true">${on ? 'Ligado' : 'Desligado'}</span>
    </button>`;
  }

  class SidePanel {
    constructor() {
      this.tab = 'game';
      this.collapsed = false;
      this.lastModal = null;
      this.pending = false;
      this.build();
      game.panel = this;
      game.onChange(() => this.schedule());
      setInterval(() => this.render(), 500);
      this.render(true);
      this.measure();
    }

    build() {
      const aside = document.createElement('aside');
      aside.id = 'gdmPanel';
      aside.setAttribute('aria-labelledby', 'gdmPanelTitle');
      aside.innerHTML = `
        <header class="panel-head">
          <img class="panel-logo" src="assets/img/ships/icon_p1.png" alt="">
          <div class="panel-titles">
            <h1 id="gdmPanelTitle">Guerra dos Mares</h1>
            <p class="panel-status" id="gdmPanelStatus"></p>
          </div>
          <button type="button" class="panel-toggle" id="gdmPanelToggle" aria-expanded="true" aria-controls="gdmPanelBody">
            ${icon('panel')}<span class="panel-toggle-text">Esconder</span>
          </button>
        </header>
        <div class="panel-body" id="gdmPanelBody">
          <div class="tabs" role="tablist" aria-label="Seções do painel">
            ${TABS.map(t => `<button type="button" role="tab" class="tab" id="gdmTab-${t.id}" data-tab="${t.id}" aria-controls="gdmTabPanel-${t.id}" aria-selected="false" tabindex="-1">${icon(t.id)}<span>${t.label}</span></button>`).join('')}
          </div>
          ${TABS.map(t => `<section class="tabpanel" role="tabpanel" id="gdmTabPanel-${t.id}" aria-labelledby="gdmTab-${t.id}" hidden></section>`).join('')}
        </div>`;
      document.body.appendChild(aside);
      this.el = aside;
      this.body = aside.querySelector('#gdmPanelBody');
      this.toggle = aside.querySelector('#gdmPanelToggle');
      this.status = aside.querySelector('#gdmPanelStatus');
      this.tabs = [...aside.querySelectorAll('[role="tab"]')];
      this.panels = Object.fromEntries(TABS.map(t => [t.id, aside.querySelector(`#gdmTabPanel-${t.id}`)]));

      this.toggle.addEventListener('click', () => this.setCollapsed(!this.collapsed));
      aside.addEventListener('click', e => {
        const tab = e.target.closest('[role="tab"]');
        if (tab) { this.setTab(tab.dataset.tab); return; }
        const b = e.target.closest('[data-key]');
        if (b && this.body.contains(b) && !b.disabled) {
          this.run(b.dataset.key, b);
          // Clique de mouse/toque não deixa o foco preso no botão: assim Espaço/Enter voltam a ser do jogo.
          if (e.detail > 0) requestAnimationFrame(() => { if (document.activeElement === b) b.blur(); });
        }
      });
      aside.querySelector('.tabs').addEventListener('keydown', e => {
        const i = this.tabs.indexOf(document.activeElement);
        if (i < 0) return;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: this.tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const t = this.tabs[(next + this.tabs.length) % this.tabs.length];
        this.setTab(t.dataset.tab);
        t.focus();
      });

      if ('ResizeObserver' in window) new ResizeObserver(() => this.measure()).observe(aside);
      window.addEventListener('resize', () => this.measure());
      this.setTab('game');
    }

    // Informa ao jogo quanto espaço o painel ocupa, para o mapa não ficar escondido embaixo dele.
    measure() {
      if (this.collapsed) { game.setReserved(0, 0); return; }
      const r = this.el.getBoundingClientRect();
      if (r.height >= window.innerHeight * 0.6) game.setReserved(Math.round(window.innerWidth - r.left), 0);
      else game.setReserved(0, Math.round(window.innerHeight - r.top));
    }

    setCollapsed(v) {
      this.collapsed = v;
      this.el.classList.toggle('is-collapsed', v);
      this.toggle.setAttribute('aria-expanded', String(!v));
      this.toggle.querySelector('.panel-toggle-text').textContent = v ? 'Mostrar painel' : 'Esconder';
      this.toggle.setAttribute('aria-label', v ? 'Mostrar painel de comandos' : 'Esconder painel de comandos');
      this.body.hidden = v;
      this.measure();
      game.announce(v ? 'Painel escondido.' : 'Painel aberto.');
    }

    setTab(id) {
      this.tab = id;
      for (const t of this.tabs) {
        const on = t.dataset.tab === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      }
      for (const [pid, p] of Object.entries(this.panels)) p.hidden = pid !== id;
      this.render(true);
    }

    open(tab, focus) {
      if (this.collapsed) this.setCollapsed(false);
      if (tab) this.setTab(tab);
      if (focus) {
        const panel = this.panels[this.tab];
        const first = panel.querySelector('button:not([disabled])');
        (first || this.tabs.find(t => t.dataset.tab === this.tab)).focus();
      }
    }

    schedule() {
      if (this.pending) return;
      this.pending = true;
      requestAnimationFrame(() => { this.pending = false; this.render(); });
    }

    // Troca o conteúdo só quando muda e devolve o foco ao mesmo botão (pela data-key).
    patch(el, html) {
      if (el.dataset.html === html) return;
      const active = document.activeElement;
      const hadFocus = el.contains(active);
      const key = hadFocus && active.dataset ? active.dataset.key : null;
      el.innerHTML = html;
      el.dataset.html = html;
      if (!hadFocus) return;
      const again = (key && el.querySelector(`[data-key="${CSS.escape(key)}"]`))
        || el.querySelector('[data-primary="true"], .ship.is-selected, button.ship, .btn:not(.btn-link)');
      (again || el).focus({ preventScroll: true });
    }

    render(force = false) {
      const st = game.state;
      const root = document.documentElement;
      game.applyLook();
      const owner = game.currentOwner();
      root.dataset.team = owner;
      const phase = { placement: 'Posicionando', battle: game.isAiTurn() ? `Rodada ${st.round} · jogando…` : `Rodada ${st.round}`, end: 'Fim de jogo' }[st.phase] || 'Carregando…';
      const status = `${game.ownerLabel(owner)} · ${phase}`;
      if (this.status.textContent !== status) this.status.textContent = status;
      const logo = `assets/img/ships/icon_${owner === 'player1' ? 'p1' : 'p2'}.png`;
      const img = this.el.querySelector('.panel-logo');
      if (!img.src.endsWith(logo)) img.src = logo;

      const actionOpened = st.action && st.action !== this.lastAction;
      this.lastAction = st.action;
      const modalKey = st.modal ? `${st.modal.type}:${st.modal.openedAt}` : null;
      const modalOpened = modalKey && modalKey !== this.lastModal;
      this.lastModal = modalKey;
      if (modalOpened && this.tab !== 'game' && st.modal.type !== 'help') this.setTab('game');

      // primeiro item de cada aba: voltar para o mapa (aparece ao receber foco do Tab)
      const back = `<button type="button" class="back-map" data-key="back-map">Voltar para o mapa (tecla N)</button>`;
      const html = { game: back + this.renderGame(), radar: back + this.renderRadar(), settings: back + this.renderSettings(), help: back + this.renderHelp() };
      for (const [id, p] of Object.entries(this.panels)) {
        if (force || id === this.tab || p.dataset.html === undefined) this.patch(p, html[id]);
      }

      if (actionOpened && !st.modal && !this.collapsed && this.tab === 'game' && this.el.contains(document.activeElement)) {
        const cancel = this.panels.game.querySelector('[data-key="cancel-action"]');
        if (cancel) cancel.focus({ preventScroll: true });
      }

      // Ao abrir uma janela no mapa, o foco vai para o botão principal dela (exceto se o painel estiver escondido).
      if (modalOpened && !this.collapsed) {
        const primary = this.panels.game.querySelector('[data-primary="true"]');
        const a = document.activeElement;
        const focusInGame = !a || a === document.body || this.el.contains(a) || !!a.closest('#gdmMission, #gdmMap, #gdmTitle');
        if (primary && focusInGame) primary.focus({ preventScroll: true });
      }
    }

    /* ---------- abas ---------- */

    renderModal(m) {
      const team = m.owner ? game.ownerLabel(m.owner) : '';
      const card = (title, body, buttons, tone = '') => `<div class="card card-modal ${tone}" role="group" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${body}<div class="btn-row">${buttons}</div></div>`;
      if (m.type === 'handoff') return card(m.title, `<p>${esc(m.detail)}</p>`, btn('m-continue', `Sou o ${team}!`, { cls: 'btn-primary', kbd: 'Enter', attrs: 'data-primary="true"' }), 'tone-blue');
      if (m.type === 'question') return card(m.practice ? 'Treino do radar' : 'Sinal misterioso no radar', `<p>Decifre o sinal: a frase é verdadeira ou falsa?</p><p class="question" id="gdmQText">${esc(m.question.pergunta)}</p>`,
        btn('m-true', 'Verdadeiro', { cls: 'btn-green', kbd: 'V', attrs: 'data-primary="true" aria-describedby="gdmQText"' }) + btn('m-false', 'Falso', { cls: 'btn-red', kbd: 'F', attrs: 'aria-describedby="gdmQText"' }), 'tone-purple');
      if (m.type === 'feedback') return card(m.correct ? 'EXCELENTE!' : 'QUASE!',
        `<p>${m.correct ? (m.found ? `Você acertou e o radar identificou o contato: ${esc(m.found)}!` : 'Você acertou e decifrou o sinal!') : `Essa era difícil! A resposta correta é ${m.question.resposta ? 'VERDADEIRO' : 'FALSO'}.`}</p><p>${esc(m.question.explicacao)}${m.correct ? '' : ' Agora você já sabe para a próxima!'}</p>`,
        btn('m-continue', 'Continuar', { cls: 'btn-primary', kbd: 'Enter', attrs: 'data-primary="true"' }), m.correct ? 'tone-green' : 'tone-orange');
      if (m.type === 'risk') return card('Esse ponto é um mistério!', '<p>Pode ser um navio ou uma armadilha. Quer atirar mesmo assim?</p>',
        btn('m-continue', 'Atirar', { cls: 'btn-red', kbd: 'Enter' }) + btn('m-cancel', 'Cancelar', { cls: 'btn-soft', kbd: 'Esc', attrs: 'data-primary="true"' }), 'tone-orange');
      if (m.type === 'help') return card('Guia do Capitão aberto', '<p>Leia as regras no mapa ou na aba Ajuda.</p>', btn('m-close', 'Fechar guia', { cls: 'btn-primary', kbd: 'Esc', attrs: 'data-primary="true"' }), 'tone-blue');
      if (m.type === 'end') {
        const s = game.currentScores();
        return card(game.winTitle(), `<p>Pontos: ${esc(game.ownerLabel('player1'))} ${s.player1}, ${esc(game.ownerLabel('player2'))} ${s.player2}.</p><p>Pontuação enviada: ${game.state.platformScore}/100.</p>`,
          btn('m-restart', 'Jogar de novo', { cls: 'btn-green', kbd: 'Enter', attrs: 'data-primary="true"' }), 'tone-green');
      }
      return '';
    }

    // AGORA FAÇA ISTO: a próxima ação, sempre visível e atualizada.
    renderCaptain() {
      const m = game.mission;
      if (!m) return '';
      const now = m.nowText() || '';
      const face = m.avatar();
      return `<div class="card card-now">
          <div class="now-row">${face ? `<img src="${esc(face)}" alt="" class="captain-face">` : ''}
          <div><p class="eyebrow">Agora faça isto</p><p class="now-text">${esc(now)}</p></div></div>
          <div class="grid2 now-actions">
            ${btn('captain-point', 'Mostrar onde', { cls: 'btn-soft', ico: 'point' })}
            ${btn('captain-tip', 'Dica', { cls: 'btn-soft', ico: 'help' })}
          </div>
        </div>`;
    }

    renderShips(owner, battle) {
      const selected = game.selectedShip();
      const items = game.state.ships[owner].map((s, i) => {
        const pct = Math.max(0, Math.round((s.hp / s.maxHp) * 100));
        const name = game.shipName(s);
        if (s.destroyed) return `<li class="ship is-sunk"><img src="assets/img/ships/icon_${owner === 'player1' ? 'p1' : 'p2'}.png" alt=""><span class="ship-text"><span class="ship-name">${esc(name)}</span><span class="ship-meta">Afundado</span></span></li>`;
        let state;
        if (!battle) state = s.row === null ? 'Falta posicionar' : `No mapa · ${s.orientation === 'horizontal' ? 'deitado' : 'em pé'}`;
        else state = s.turnLocked ? 'Já agiu nesta vez' : `Vida ${Math.max(0, s.hp)}/${s.maxHp} · Munição ${s.availableCharges}/${s.maxCharges}${s.typeId === 'trap-layer' ? ` · Minas ${s.trapStock}` : ''}`;
        const isSel = selected && selected.uid === s.uid;
        return `<li><button type="button" class="ship${isSel ? ' is-selected' : ''}${!battle && s.row !== null ? ' is-placed' : ''}${battle && s.turnLocked ? ' is-done' : ''}" data-key="ship:${esc(s.uid)}" data-ship="${esc(s.uid)}" aria-pressed="${!!isSel}">
          <img src="assets/img/ships/icon_${owner === 'player1' ? 'p1' : 'p2'}.png" alt="">
          <span class="ship-text"><span class="ship-name">${i + 1}. ${esc(name)} <span class="ship-size">${s.size} casas</span></span><span class="ship-meta">${esc(state)}</span>
          ${battle ? `<span class="hp" aria-hidden="true"><span style="width:${pct}%" class="${pct > 50 ? 'ok' : pct > 25 ? 'mid' : 'low'}"></span></span>` : ''}</span>
          ${!battle && s.row !== null ? `<span class="tick" aria-hidden="true">${icon('check')}</span>` : ''}${battle && s.turnLocked ? `<span class="tick is-lock" aria-hidden="true">${icon('lock')}</span>` : ''}
        </button></li>`;
      }).join('');
      return `<ul class="ships" role="list">${items}</ul>`;
    }

    renderPad() {
      const st = game.state, c = st.cursor;
      let ok = 'Selecionar navio';
      if (st.phase === 'placement') ok = 'Colocar aqui';
      else if (st.action) ok = { attack: 'Atirar aqui', move: 'Andar para cá', trap: 'Armadilha aqui', analyze: 'Analisar aqui' }[st.action];
      const moving = st.phase === 'battle' && st.action === 'move';
      const where = GDM_LOGIC.coordWithZone(c.row, c.col);
      return `<details class="card card-pad"${moving ? ' open' : ''}>
        <summary><span>${moving ? 'Mover o navio por botões' : 'Usar o mapa por botões'}</span><strong class="pad-coord">${esc(GDM_LOGIC.coord(c.row, c.col))}</strong></summary>
        <p class="coord" aria-live="off"><strong>${esc(GDM_LOGIC.coord(c.row, c.col))}</strong> <span>${esc(where.replace(/ [A-J]\d+$/, ''))}</span></p>
        <div class="pad" role="group" aria-label="${moving ? 'Direções do navio' : 'Mover cursor'}">
          ${btn('pad-up', '', { cls: 'pad-up', ico: 'up', aria: moving ? 'Navio para cima' : 'Cursor para cima' })}
          ${btn('pad-left', '', { cls: 'pad-left', ico: 'left', aria: moving ? 'Navio para a esquerda' : 'Cursor para a esquerda' })}
          ${btn('pad-ok', ok, { cls: 'pad-ok btn-primary', kbd: 'Enter', aria: `${ok} em ${where}` })}
          ${btn('pad-right', '', { cls: 'pad-right', ico: 'right', aria: moving ? 'Navio para a direita' : 'Cursor para a direita' })}
          ${btn('pad-down', '', { cls: 'pad-down', ico: 'down', aria: moving ? 'Navio para baixo' : 'Cursor para baixo' })}
        </div>
      </details>`;
    }

    renderGame() {
      const st = game.state;
      if (st.phase === 'loading') return '<div class="card"><p>Carregando o jogo…</p></div>';
      if (st.modal) return this.renderModal(st.modal);
      const owner = game.currentOwner();
      if (st.phase === 'placement') {
        const ready = game.fleetReady(owner);
        const canDiff = game.canChangeDifficulty();
        const canMode = game.canChangeMode();
        return `${this.renderCaptain()}
          <div class="card">
            <h2><span class="step-n">1</span>Escolha um navio</h2>
            ${this.renderShips(owner, false)}
          </div>
          <div class="card">
            <h2><span class="step-n">2</span>Coloque no mapa</h2>
            <p>Toque numa casa do seu oceano onde o navio fica verde.</p>
            <div class="grid2">
              ${btn('rotate', 'Girar', { ico: 'rotate', kbd: 'R' })}
              ${btn('auto', 'Automático', { ico: 'auto', kbd: 'P' })}
            </div>
          </div>
          ${owner === 'player1' ? `<details class="card card-opts"${canMode ? '' : ''}>
            <summary>Opções da partida</summary>
            ${btn('difficulty', `Dificuldade: ${game.difficultyName()}`, { cls: 'btn-wide btn-soft', ico: 'level', blocked: !canDiff })}
            ${!canDiff ? `<p class="note">${hasPlatformDifficulty() ? 'A plataforma escolheu a dificuldade.' : 'A dificuldade só muda antes do primeiro navio.'}</p>` : ''}
          </details>` : ''}
          ${this.renderPad()}
          <div class="card">
            ${btn('ready', ready ? 'Pronto!' : 'Falta posicionar navios', { cls: 'btn-wide btn-green', ico: 'ready', blocked: !ready })}
          </div>`;
      }
      if (st.phase !== 'battle') return '';
      if (game.isAiTurn()) {
        return `<div class="card card-ai" role="status">
            <div class="captain-row"><img src="assets/img/ui/vilao_rosto.png" alt="" class="captain-face villain-face">
            <div><p class="eyebrow">Vez do adversário</p>
            <h2>Barba-Rubra está jogando…</h2></div></div>
            <p>Observe o seu oceano: os tiros dele aparecem no mapa. Quando ele terminar, a vez volta para você.</p>
          </div>
          <div class="card">
            <h2>Sua frota</h2>
            ${this.renderShips(game.viewer(), true)}
          </div>`;
      }
      const s = game.selectedShip();
      const PHRASE = { attack: 'Atire numa casa clarinha (no alcance).', move: 'Navegue até a casa verde.', trap: 'Esconda uma mina no mar.', analyze: 'Decifre um “?” perto do navio.' };
      const act = (id, label, key, cls) => `<button type="button" class="btn act ${cls}" data-key="act:${id}" aria-pressed="${st.action === id}">${icon(id)}<span class="act-text"><span class="btn-label">${esc(label)}</span><span class="act-desc">${esc(PHRASE[id])}</span></span><kbd aria-hidden="true">${key}</kbd></button>`;
      const avail = ['attack', 'move', 'trap', 'analyze'].filter(a => !game.actionBlocker(a) && (a === 'analyze' || s));
      const why = !s ? (avail.includes('analyze') ? 'Escolha um navio para ver as ações dele (ou analise um contato do radar).' : 'Escolha um navio para ver as ações dele.')
        : (s.turnLocked ? 'Esse navio já cumpriu sua missão nesta vez. Escolha outro navio ou passe a vez.' : (!avail.filter(a => a !== 'analyze').length ? (game.actionBlocker('attack') || '') : ''));
      const actNames = { attack: 'Atacar', move: 'Mover', trap: 'Armadilha', analyze: 'Analisar' };
      const actWhat = { attack: 'Escolha uma casa clarinha para atirar.', move: 'Escolha uma casa verde para o navio navegar.', trap: 'Escolha uma casa roxa para esconder a mina.', analyze: 'Escolha um “?” no mapa ou na aba Radar.' };
      const activeCard = st.action ? `<div class="card card-active act-${st.action}" role="group" aria-label="Ação escolhida">
          <p class="eyebrow">Ação escolhida</p>
          <h2>${esc(actNames[st.action])}</h2>
          <p>${esc(actWhat[st.action])} Mudou de ideia? Cancele antes de tocar no mapa.</p>
          ${btn('cancel-action', 'Cancelar ação', { cls: 'btn-wide btn-cancel', ico: 'close', kbd: 'Esc', attrs: 'data-primary="true"' })}
        </div>` : '';
      return `${activeCard}${this.renderCaptain()}
        <div class="card">
          <h2><span class="step-n">1</span>Escolha um navio</h2>
          ${this.renderShips(owner, true)}
        </div>
        <div class="card">
          <h2><span class="step-n">2</span>Escolha uma ação</h2>
          ${avail.length ? `<div class="acts">
            ${avail.includes('attack') ? act('attack', 'Atacar', '1', 'act-attack') : ''}
            ${avail.includes('move') ? act('move', 'Mover', '2', 'act-move') : ''}
            ${avail.includes('trap') ? act('trap', 'Armadilha', '3', 'act-trap') : ''}
            ${avail.includes('analyze') ? act('analyze', 'Analisar', '4', 'act-analyze') : ''}
          </div>` : ''}
          ${why ? `<p class="note">${esc(why)}</p>` : ''}
        </div>
        <div class="card">
          <h2><span class="step-n">3</span>Escolha no mapa</h2>
          <p>${st.action ? 'Toque na casa do mapa onde a ação vai acontecer.' : 'Depois de escolher a ação, toque numa casa do mapa.'}</p>
        </div>
        ${this.renderPad()}
        <div class="card">
          ${btn('end', 'Passar a vez', { cls: 'btn-wide btn-sun', ico: 'end', kbd: 'Espaço' })}
        </div>`;
    }

    renderRadar() {
      const st = game.state;
      if (st.phase !== 'battle') return '<div class="card"><h2>Contatos encontrados</h2><p>O radar liga quando a batalha começar. Ele encontra inimigos a até 3 casas dos seus navios.</p></div>';
      const items = game.radarContacts();
      const blocker = game.actionBlocker('analyze');
      const list = items.map((it, i) => `<li>${btn(`radar:${it.row}:${it.col}`, it.revealed ? `${it.label} · ${GDM_LOGIC.coord(it.row, it.col)}` : `Analisar contato em ${GDM_LOGIC.coord(it.row, it.col)}`, {
        cls: `radar-item${it.revealed ? ' is-known' : ''}`, ico: it.revealed ? 'ready' : 'analyze', blocked: it.revealed || !!blocker,
        attrs: `data-row="${it.row}" data-col="${it.col}"`,
        aria: `${it.label} em ${GDM_LOGIC.coordWithZone(it.row, it.col)}${it.revealed ? ', já descoberto' : ', analisar'}`
      })}</li>`).join('');
      return `<div class="card">
        <h2>Contatos encontrados</h2>
        ${items.length ? `<p><strong>Encontramos algo!</strong> Toque em ANALISAR e responda Verdadeiro ou Falso para descobrir o que é.</p><ul class="radar-list" role="list">${list}</ul>`
          : '<p><strong>Nada no radar ainda.</strong></p><p>Chegue mais perto do inimigo para procurar: mova um navio para o meio do mar.</p>'}
        <p class="note">${blocker ? esc(blocker) + '.' : 'Você pode analisar 1 vez por vez de jogar.'}</p>
      </div>`;
    }

    renderSettings() {
      const s = game.state.settings, z = Math.round((game.state.camera.zoom || 1) * 100);
      const sec = this.settingsSec || 'som';
      const SECS = [['som', 'Som'], ['tela', 'Tela'], ['texto', 'Texto'], ['tutorial', 'Tutorial']];
      const FALA = {
        som: 'Deixe os sons do jeito que fica bom para você.',
        tela: 'Deixe a tela confortável para os seus olhos.',
        texto: 'Escolha o tamanho e o tipo de letra mais fáceis de ler.',
        tutorial: 'Quer que eu explique tudo de novo? É só pedir.'
      };
      const row = (label, control, desc = '') => `<div class="opt-row"><span class="switch-text"><span class="switch-label">${esc(label)}</span>${desc ? `<span class="switch-desc">${esc(desc)}</span>` : ''}</span>${control}</div>`;
      const vol = (kind, label, v, dep) => {
        const bars = Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
        return `<div class="opt-row opt-vol${dep ? '' : ' is-off'}" role="group" aria-label="${esc(label)}">
          <span class="switch-label">${esc(label)}</span>
          <span class="opt-stepper">
            ${btn(`vol:${kind}:-1`, '−', { cls: 'opt-step', aria: `Diminuir ${label.toLowerCase()}. Agora ${v === 0 ? 'mudo' : v + ' de 10'}` })}
            <span class="opt-meter" aria-hidden="true">${bars}</span>
            ${btn(`vol:${kind}:1`, '+', { cls: 'opt-step', aria: `Aumentar ${label.toLowerCase()}. Agora ${v === 0 ? 'mudo' : v + ' de 10'}` })}
          </span></div>`;
      };
      const choices = (key, list, cur, label) => `<span class="opt-choices" role="group" aria-label="${esc(label)}">${list.map(([v, l]) => btn(`${key}:${v}`, l, { pressed: cur === v, aria: `${label}: ${l}` })).join('')}</span>`;
      let body = '';
      if (sec === 'som') body = `
          ${sw('music', 'Música', !!s.music)}
          ${vol('music', 'Volume da música', s.musicVol ?? 6, s.music)}
          ${sw('sfx', 'Efeitos sonoros', !!s.sfx, 'Tiros, splash e acertos')}
          ${vol('sfx', 'Volume dos efeitos', s.sfxVol ?? 8, s.sfx)}
          ${sw('mapsounds', 'Sons do mapa', !!s.mapSounds, 'Esquerda/direita e grave/agudo mostram onde você está')}`;
      else if (sec === 'tela') body = `
          ${sw('screenreader', 'Modo leitor de tela', !!s.screenReader, 'Para o Narrador: computador mais devagar e dicas faladas')}
          ${sw('contrast', 'Alto contraste', !!s.highContrast, 'Preto, branco e amarelo')}
          ${sw('motion', 'Menos movimento', !!s.reduceMotion, 'Peixes, ondas e tremidas param')}
          ${row('Tamanho do mapa', `<span class="opt-stepper">${btn('zoom-out', '−', { cls: 'opt-step', aria: 'Diminuir zoom' })}<span class="opt-zoom-val">${z}%</span>${btn('zoom-in', '+', { cls: 'opt-step', aria: 'Aumentar zoom' })}</span>`)}`;
      else if (sec === 'texto') body = `
          ${row('Tamanho das letras', choices('font', [[1, 'A'], [1.25, 'A+'], [1.5, 'A++']], s.fontScale || 1, 'Tamanho das letras'))}
          ${row('Tipo de letra', choices('family', [['padrao', 'Padrão'], ['simples', 'Simples'], ['ampla', 'Ampla']], s.fontFamily || 'padrao', 'Tipo de letra'))}
          ${sw('airy', 'Mais espaço no texto', !!s.airyText, 'Afasta letras e linhas para ler com calma')}
          <p class="opt-preview" aria-hidden="true">Capitão, o navio inimigo está em C7!</p>`;
      else body = `
          ${sw('tutorialauto', 'Tutorial na primeira partida', s.tutorialAuto !== false, 'Desligue se você já sabe jogar')}
          ${row('Rever o tutorial', btn('mission-restart', 'Rever', { cls: 'opt-action' }), 'O Capitão explica tudo de novo')}
          ${row('Voltar ao padrão', btn('reset-settings', this.resetArmed ? 'Tem certeza?' : 'Restaurar', { cls: `opt-action${this.resetArmed ? ' is-armed' : ''}`, aria: this.resetArmed ? 'Tem certeza? Aperte de novo para voltar tudo ao padrão' : 'Restaurar preferências' }), 'Som, tela e letras como no começo')}`;
      return `<div class="opt-secs" role="group" aria-label="Seções dos ajustes">${SECS.map(([id, l]) => btn(`sec:${id}`, l, { cls: 'opt-sec', pressed: sec === id })).join('')}</div>
        <p class="opt-say"><img src="assets/img/ui/capitao_rosto.png" alt="" class="captain-face">${esc(FALA[sec])}</p>
        <div class="card opt-group" role="group" aria-label="${esc(SECS.find(x => x[0] === sec)[1])}">${body}</div>`;
    }

    renderHelp() {
      const keys = [['Q', 'Onde estou? Explica onde você está e quais teclas usar'], ['I', 'Ouvir a situação da partida'], ['C', 'Ouvir a casa atual'], ['T', 'Ouvir a dica do Capitão'], ['G', 'Ir para a casa (digitar, ex.: C7)'], ['N', 'Ir para o mapa acessível'], ['Tab / Shift+Tab', 'Andar pelos botões'], ['Setas ou WASD', 'Mover no mapa'], ['Enter', 'Confirmar'], ['R', 'Girar navio'], ['P', 'Posicionar automático'], ['1 2 3 4', 'Atacar, Mover, Armadilha, Analisar'], ['Espaço', 'Passar a vez'], ['Esc', 'Cancelar / fechar'], ['V / F', 'Verdadeiro / Falso'], ['M', 'Música'], ['F1', 'Guia do Capitão'], ['F2', 'Ajustes'], ['+ / −', 'Zoom']];
      const m = game.mission, face = m ? m.avatar() : '';
      return `<div class="card card-captain">
          <div class="now-row">${face ? `<img src="${esc(face)}" alt="" class="captain-face">` : ''}
          <div><p class="eyebrow">Dica do Capitão</p><p class="now-text">${esc(m ? m.tipText() : '')}</p></div></div>
          ${btn('captain-point', 'Mostrar onde clicar', { cls: 'btn-wide btn-primary', ico: 'point' })}
        </div>
        <div class="card">
          ${btn('mission-restart', 'Rever tutorial', { cls: 'btn-wide btn-soft', ico: 'rotate' })}
        </div>
        <section class="card faq-card" aria-labelledby="gdmFaqTitle">
          <h2 id="gdmFaqTitle">Dúvidas frequentes</h2>
          ${FAQ.map(([group, qs]) => `<details class="faq-group"><summary>${esc(group)}</summary>
            ${qs.map(([q, a]) => `<details class="faq-q"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
          </details>`).join('')}
        </section>
        <details class="card"><summary>Como jogar</summary>
          <ol class="steps">
            <li>Esconda seus navios no seu oceano.</li>
            <li>Na sua vez: escolha um navio, escolha uma ação e escolha uma casa no mapa.</li>
            <li>O radar mostra “?” perto dos seus navios. Analise e responda Verdadeiro ou Falso para descobrir o que é.</li>
            <li>Afunde todos os navios do ${game.isAiMode() ? 'computador' : 'outro jogador'}!</li>
          </ol>
        </details>
        <details class="card"><summary>Coordenadas</summary>
          <p>As letras (A a J) são as colunas. Os números (1 a 10) são as linhas. Juntando os dois temos a casa: A1 fica no canto de cima, à esquerda.</p>
        </details>
        <details class="card"><summary>Controles</summary>
          <dl class="keys">${keys.map(([k, d]) => `<div><dt><kbd>${esc(k)}</kbd></dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
        </details>
        <p class="note">Versão do jogo: ${esc(GDM_CONFIG.version)}</p>`;
    }

    /* ---------- ações ---------- */

    run(key, el) {
      game.audio.ensure();
      const [cmd, ...rest] = key.split(':'); const arg = rest.join(':');
      const g = game, st = g.state;
      if (el.getAttribute('aria-disabled') === 'true') {
        if (cmd === 'act') { g.setAction(arg); return; }
        if (cmd === 'radar') { g.toast(el.classList.contains('is-known') ? 'Esse contato já foi descoberto' : (g.actionBlocker('analyze') || 'Indisponível'), 'warn'); return; }
        if (cmd === 'ready') { g.readyPlacement(); return; }
        if (cmd === 'difficulty') { g.cycleDifficulty(); return; }
        if (cmd === 'mode') { g.toggleMode(); return; }
        return;
      }
      const gameplay = ['captain-point', 'ship', 'act', 'cancel-action', 'end', 'pad-up', 'pad-down', 'pad-left', 'pad-right', 'pad-ok', 'radar'];
      if (gameplay.includes(cmd) && g.blockedByAi()) return;
      g.audio.play('click');
      switch (cmd) {
        case 'ship': g.selectShip(key.slice(5)); break;
        case 'rotate': g.rotateSelected(); break;
        case 'auto': g.autoPlace(); break;
        case 'difficulty': g.cycleDifficulty(); break;
        case 'mode': g.toggleMode(); break;
        case 'ready': g.readyPlacement(); break;
        case 'act': g.setAction(arg); break;
        case 'cancel-action': g.cancelAction(); break;
        case 'end': g.endTurn(); break;
        case 'pad-up': g.moveCursor(-1, 0); break;
        case 'pad-down': g.moveCursor(1, 0); break;
        case 'pad-left': g.moveCursor(0, -1); break;
        case 'pad-right': g.moveCursor(0, 1); break;
        case 'pad-ok': g.confirmAtCursor(); break;
        case 'radar': g.analyzeContact(Number(el.dataset.row), Number(el.dataset.col)); break;
        case 'm-continue':
          if (st.modal?.type === 'handoff') g.acceptHandoff();
          else if (st.modal?.type === 'feedback') g.closeFeedback();
          else if (st.modal?.type === 'risk') g.confirmRisk(true);
          break;
        case 'm-cancel': g.confirmRisk(false); break;
        case 'm-true': g.answerQuestion(true); break;
        case 'm-false': g.answerQuestion(false); break;
        case 'm-close': g.closeModal(); break;
        case 'm-restart': g.restart(); break;
        case 'captain-tip': if (g.mission) g.mission.showTip(); break;
        case 'captain-point': if (g.mission) g.mission.pointAt(g.mission.nextTarget()); break;
        case 'mission-restart': g.restartTutorial(); break;
        case 'back-map': if (g.a11y) g.a11y.focusCursor(); break;
        case 'open-guide': g.openHelp(); break;
        case 'contrast': g.toggleContrast(); break;
        case 'screenreader': g.toggleScreenReader(); break;
        case 'mapsounds': g.toggleMapSounds(); break;
        case 'motion': g.toggleMotion(); break;
        case 'music': g.toggleMusic(); break;
        case 'sfx': g.toggleSfx(); break;
        case 'font': g.setFontScale(Number(arg)); break;
        case 'family': g.setFontFamily(arg); break;
        case 'airy': g.toggleAiry(); break;
        case 'tutorialauto': g.toggleTutorialAuto(); break;
        case 'sec': this.settingsSec = arg; this.resetArmed = false; break;
        case 'vol': { const [kind, d] = arg.split(':'); const k = kind === 'music' ? 'musicVol' : 'sfxVol'; g.setVolume(kind, (st.settings[k] ?? (kind === 'music' ? 6 : 8)) + Number(d)); break; }
        case 'reset-settings':
          if (this.resetArmed) { this.resetArmed = false; g.resetSettings(); }
          else { this.resetArmed = true; clearTimeout(this.resetTimer); this.resetTimer = setTimeout(() => { this.resetArmed = false; this.render(true); }, 4000); g.announce('Tem certeza? Aperte de novo para voltar tudo ao padrão.'); }
          break;
        case 'zoom-in': g.zoomCamera(0.1); break;
        case 'zoom-out': g.zoomCamera(-0.1); break;
        case 'zoom-reset': g.resetCamera(); break;
      }
      this.render(true);
    }
  }

  new SidePanel();
})();
