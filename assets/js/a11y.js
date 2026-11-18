(() => {
  'use strict';

  // MAPA ACESSÍVEL — o mesmo mapa do canvas, em HTML de verdade, para leitores de tela
  // (Narrador do Windows, NVDA) e para quem joga só com teclado.
  //
  // Por que tabelas com botões: o Narrador liga o "modo de varredura" sozinho no Chrome/Edge e
  // usa as setas para ler a página. Tabelas e botões são lidos muito bem nesse modo (ele fala a
  // coluna e a linha), e Enter/Espaço ativa o botão. Fora do modo de varredura, as setas andam
  // casa por casa (foco itinerante). O campo "Ir para a casa" desliga a varredura sozinho
  // (é um campo de texto) e leva direto para a casa digitada.

  const game = window.GDM_GAME;
  if (!game) return;

  const LETTERS = 'ABCDEFGHIJ';
  const ZONE_NAMES = () => [GDM_LOGIC.zoneNames.player1, GDM_LOGIC.zoneNames.neutral, GDM_LOGIC.zoneNames.player2];

  // ---------- links de atalho (aparecem ao receber foco) ----------
  const skip = document.createElement('nav');
  skip.className = 'skip-links';
  skip.setAttribute('aria-label', 'Atalhos da página');
  skip.innerHTML = '<a href="#gdmMap">Ir para o mapa</a><a href="#gdmPanel">Ir para o painel de comandos</a>';
  document.body.prepend(skip);
  skip.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    if (a.getAttribute('href') === '#gdmMap') focusCursor();
    else if (game.panel) game.panel.open(null, true);
  });

  // ---------- estrutura ----------
  const sec = document.createElement('section');
  sec.id = 'gdmMap';
  sec.className = 'a11y-map';
  sec.setAttribute('aria-labelledby', 'gdmMapTitle');
  const tables = [0, 1, 2].map(z => `
    <table class="a11y-ocean" data-zone="${z}">
      <caption class="a11y-caption" data-zone-caption="${z}"></caption>
      <thead><tr><td></td>${[...LETTERS].map(l => `<th scope="col">${l}</th>`).join('')}</tr></thead>
      <tbody>${Array.from({ length: 10 }, (_, r) => `<tr><th scope="row">${r + 1}</th>${Array.from({ length: 10 }, (_, c) =>
        `<td><button type="button" class="a11y-cell" tabindex="-1" data-row="${r}" data-col="${z * 10 + c}"></button></td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>`).join('');
  sec.innerHTML = `
    <h2 id="gdmMapTitle">Mapa do mar</h2>
    <p id="gdmMapHelp">Cada botão é uma casa. As LETRAS de A a J são as colunas: andam na horizontal, da esquerda para a direita. Os NÚMEROS de 1 a 10 são as linhas: andam na vertical, de cima para baixo. C7 é a coluna C com a linha 7. No mapa use as SETAS para andar de casa em casa e Enter para agir. Tab sai do mapa e vai para o painel. Q explica onde você está.</p>
    <form class="a11y-jump" id="gdmJumpForm">
      <label for="gdmJump">Ir para a casa</label>
      <input id="gdmJump" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="4" aria-describedby="gdmJumpHelp">
      <label for="gdmJumpZone">Oceano</label>
      <select id="gdmJumpZone"></select>
      <button type="submit">Ir</button>
      <p id="gdmJumpHelp">Digite a letra e o número da casa, por exemplo C7, e aperte Enter.</p>
    </form>
    ${tables}`;
  const panel = document.getElementById('gdmPanel');
  if (panel) document.body.insertBefore(sec, panel); else document.body.appendChild(sec);

  const cells = new Map();
  sec.querySelectorAll('.a11y-cell').forEach(b => cells.set(`${b.dataset.row}:${b.dataset.col}`, b));
  const cellEl = (r, c) => cells.get(`${r}:${c}`);
  const jump = sec.querySelector('#gdmJump'), zoneSel = sec.querySelector('#gdmJumpZone');

  // ---------- rótulos ----------
  function label(r, c) {
    const coord = GDM_LOGIC.coord(r, c);
    const full = game.describeCell(r, c), base = GDM_LOGIC.coordWithZone(r, c);
    let what = full.startsWith(base) ? full.slice(base.length).replace(/^,\s*/, '') : full;
    if (!what) what = game.state.phase === 'battle' ? 'água' : 'vazio';
    if (game.state.phase === 'battle') {
      const st = game.state, s = game.selectedShip();
      if (st.action === 'attack' && s && GDM_LOGIC.zone(c) !== s.owner) what += game.attackCellAllowed(r, c, s) ? '. Enter atira aqui' : '. Longe demais para este navio';
      if (st.action === 'move' && s && GDM_LOGIC.moveTargets(st, s, game.shipMoveSteps(s)).some(m => m.row === r && m.col === c)) what += '. Casa verde: Enter anda até aqui';
      if (st.action === 'analyze' && s && !game.inScanRange(s, r, c)) what += '. Longe do radar deste navio';
    }
    return `${coord}, ${what}`;
  }

  let current = null;
  function refresh() {
    const names = ZONE_NAMES();
    sec.querySelectorAll('[data-zone-caption]').forEach(cap => { cap.textContent = names[+cap.dataset.zoneCaption]; });
    const opts = names.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    if (zoneSel.dataset.html !== opts) { const v = zoneSel.value; zoneSel.innerHTML = opts; zoneSel.dataset.html = opts; zoneSel.value = v || '0'; }
    if (game.state.phase === 'loading') return;
    for (const [k, b] of cells) {
      const [r, c] = k.split(':').map(Number);
      const l = label(r, c);
      if (b.getAttribute('aria-label') !== l) b.setAttribute('aria-label', l);
      b.dataset.kind = game.cellKind(r, c);
    }
    const cur = game.state.cursor, el = cellEl(cur.row, cur.col);
    if (el !== current) {
      if (current) current.tabIndex = -1;
      current = el; if (current) current.tabIndex = 0;
    }
  }
  let pending = false;
  game.onChange(() => { if (pending) return; pending = true; setTimeout(() => { pending = false; refresh(); }, 120); });
  setInterval(refresh, 1500);

  // ---------- foco e teclado ----------
  function focusCell(r, c, sound = true) {
    const el = cellEl(r, c);
    if (!el) return;
    game.state.cursor = { row: r, col: c };
    game.ensureVisible(r, c);
    el.setAttribute('aria-label', label(r, c));
    if (current && current !== el) current.tabIndex = -1;
    current = el; el.tabIndex = 0;
    el.focus({ preventScroll: true });
    if (sound && game.state.settings.mapSounds) game.audio.cue(game.cellKind(r, c), c, r);
    game.notify();
  }
  function focusCursor() {
    const cur = game.state.cursor;
    focusCell(cur.row, cur.col, false);
  }

  sec.addEventListener('focusin', e => {
    if (!e.target.classList.contains('a11y-cell')) return;
    game.a11yMapFocused = true;
    const r = +e.target.dataset.row, c = +e.target.dataset.col;
    if (game.state.cursor.row !== r || game.state.cursor.col !== c) { game.state.cursor = { row: r, col: c }; game.ensureVisible(r, c); }
  });
  sec.addEventListener('focusout', e => { if (!sec.contains(e.relatedTarget)) game.a11yMapFocused = false; });

  sec.addEventListener('keydown', e => {
    const b = e.target.closest('.a11y-cell');
    if (!b) return;
    const r = +b.dataset.row, c = +b.dataset.col, z = Math.floor(c / 10);
    let nr = r, nc = c;
    switch (e.key) {
      case 'ArrowUp': nr = Math.max(0, r - 1); break;
      case 'ArrowDown': nr = Math.min(9, r + 1); break;
      case 'ArrowLeft': nc = Math.max(0, c - 1); break;
      case 'ArrowRight': nc = Math.min(29, c + 1); break;
      case 'Home': nc = z * 10; break;
      case 'End': nc = z * 10 + 9; break;
      case 'PageUp': nc = Math.max(0, c - 10); break;
      case 'PageDown': nc = Math.min(29, c + 10); break;
      default: return;
    }
    e.preventDefault(); e.stopPropagation();
    if (nr === r && nc === c) { game.announce('Borda do mapa.', true); return; }
    focusCell(nr, nc);
  });

  sec.addEventListener('click', e => {
    const b = e.target.closest('.a11y-cell');
    if (!b) return;
    const r = +b.dataset.row, c = +b.dataset.col;
    game.state.cursor = { row: r, col: c };
    if (game.state.modal) { game.announce('Responda primeiro a janela aberta. Ela está no painel de comandos.', true); return; }
    if (game.blockedByAi()) return;
    game.audio.ensure();
    game.confirmAtCursor();
    setTimeout(refresh, 60);
  });

  // ---------- Ir para a casa ----------
  const parse = txt => {
    const t = String(txt).trim().toUpperCase().replace(/\s+/g, '');
    let m = t.match(/^([A-J])(10|[1-9])$/);
    if (m) return { c: LETTERS.indexOf(m[1]), r: +m[2] - 1 };
    m = t.match(/^(10|[1-9])([A-J])$/);
    if (m) return { c: LETTERS.indexOf(m[2]), r: +m[1] - 1 };
    return null;
  };
  jump.addEventListener('focus', () => {
    // sugere o oceano certo para o momento
    const st = game.state;
    zoneSel.value = st.phase === 'battle' && st.action === 'attack' ? '2' : '0';
  });
  jump.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); jump.blur(); requestAnimationFrame(() => focusCursor()); } });
  sec.querySelector('#gdmJumpForm').addEventListener('submit', e => {
    e.preventDefault();
    const p = parse(jump.value);
    if (!p) { game.announce('Não entendi a casa. Digite uma letra de A a J e um número de 1 a 10, por exemplo C7.', true); jump.focus(); return; }
    jump.value = '';
    const col = +zoneSel.value * 10 + p.c;
    // o formulário some ao sair do campo; foca a casa no quadro seguinte
    jump.blur();
    requestAnimationFrame(() => requestAnimationFrame(() => focusCell(p.r, col)));
  });
  // Atalho G: vai para o campo "Ir para a casa".
  window.addEventListener('keydown', e => {
    if (game.titleOpen || game.pauseOpen || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.key.toLowerCase() === 'g' && !game.state.modal) { e.preventDefault(); e.stopPropagation(); jump.focus(); }
    if (e.key.toLowerCase() === 'n' && !game.state.modal) { e.preventDefault(); e.stopPropagation(); focusCursor(); }
  }, true);

  // ---------- "Onde estou?" (tecla Q) e explicação na primeira vez ----------
  const COORD = 'As letras de A a J são as colunas, na horizontal, da esquerda para a direita. Os números de 1 a 10 são as linhas, na vertical, de cima para baixo. Exemplo: C7 é a coluna C com a linha 7.';
  function regionOf(el) {
    if (!el || el === document.body) return 'body';
    if (game.titleOpen) return 'title';
    if (game.state.modal && game.state.modal.type === 'question') return 'question';
    if (game.state.modal) return 'modal';
    if (el.closest && el.closest('#gdmMission')) return 'mission';
    if (el.id === 'gdmJump' || el.id === 'gdmJumpZone' || (el.closest && el.closest('#gdmJumpForm'))) return 'jump';
    if (el.classList && el.classList.contains('a11y-cell')) return 'map';
    if (el.getAttribute && el.getAttribute('role') === 'tab') return 'tabs';
    if (el.closest && el.closest('#gdmPanel')) return 'panel';
    return 'body';
  }
  function explain(region, el) {
    const tab = game.panel && game.panel.tab ? { game: 'Jogar', radar: 'Radar', help: 'Ajuda', settings: 'Ajustes' }[game.panel.tab] : '';
    switch (region) {
      case 'map': {
        const c = game.state.cursor, where = GDM_LOGIC.coordWithZone(c.row, c.col);
        return `Você está no MAPA, na casa ${where}. ${COORD} Aqui as SETAS andam de casa em casa e Enter faz a ação. G leva para uma casa digitando, por exemplo C7. Tab sai do mapa e vai para o painel de comandos.`;
      }
      case 'tabs': return 'Você está nas ABAS do painel: Jogar, Radar, Ajuda e Ajustes. Aqui as SETAS para esquerda e direita trocam de aba. Tab entra nos botões da aba. Para voltar ao mapa, aperte N.';
      case 'panel': return `Você está no PAINEL DE COMANDOS, na aba ${tab}. Aqui use TAB para ir ao próximo botão e SHIFT mais TAB para voltar. Enter aperta o botão. As setas não andam aqui. Para voltar ao mapa, aperte N ou use o botão Voltar para o mapa, no começo do painel.`;
      case 'jump': return 'Você está no campo IR PARA A CASA. Digite a letra e o número, por exemplo C7, e aperte Enter. Esc ou N voltam para o mapa.';
      case 'question': return 'Você está numa PERGUNTA do radar. Leia a frase e aperte V se for verdadeira ou F se for falsa. Tab anda entre as duas respostas.';
      case 'modal': return 'Uma janela está aberta. Tab anda pelos botões dela e Enter aperta. Esc fecha.';
      case 'mission': return 'Você está no QUADRO DO CAPITÃO, o tutorial. Tab anda pelos botões do quadro e Enter aperta. Quando o Capitão pedir uma casa do mapa, use as setas e Enter.';
      case 'title': return 'Você está na TELA INICIAL. Setas para cima e para baixo, ou Tab, escolhem um botão. Enter confirma.';
      default: return 'Aperte N para ir ao mapa ou Tab para ir aos botões. F1 abre o guia e F2 os ajustes.';
    }
  }
  game.whereAmI = () => explain(regionOf(document.activeElement), document.activeElement);
  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey || game.pauseOpen) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key.toLowerCase() === 'q') { e.preventDefault(); e.stopPropagation(); game.announce(game.whereAmI(), true); }
  }, true);
  // Na primeira vez em cada lugar (só para quem usa teclado ou leitor de tela), explica uma vez.
  const SEEN_KEY = 'gdm-a11y-explicado-v1';
  let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (_e) {}
  let lastKey = 0;
  window.addEventListener('keydown', () => { lastKey = Date.now(); }, true);
  document.addEventListener('focusin', e => {
    const region = regionOf(e.target);
    if (['body', 'modal', 'title'].includes(region) || seen[region]) return;
    const keyboardUser = game.state.settings.screenReader || Date.now() - lastKey < 1500;
    if (!keyboardUser || (game.mission && game.mission.active && region !== 'mission')) return;
    seen[region] = 1; try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (_e) {}
    setTimeout(() => game.announce(`${explain(region, e.target)} Para ouvir isto de novo, aperte Q.`), 500);
  });

  game.a11y = { refresh, focusCursor, focusCell, cursorCell: () => { const c = game.state.cursor; return cellEl(c.row, c.col); } };
  refresh();
})();
