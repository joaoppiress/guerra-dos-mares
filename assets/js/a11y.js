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
    <p id="gdmMapHelp">Cada botão é uma casa. Enter faz a ação naquela casa. Setas andam de casa em casa; Page Up e Page Down trocam de oceano. Atalhos: I situação, C casa atual, T dica do Capitão.</p>
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
    if (game.state.phase === 'battle' && game.state.action === 'attack' && c >= 10) what += '. Enter atira aqui';
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
    if (game.state.phase === 'battle' && game.state.action === 'move' && game.selectedShip()) {
      // no modo mover, as setas mexem o navio (igual ao jogo visual)
      const dr = nr - r, dc = nc - c;
      game.moveSelected(Math.sign(dr), Math.sign(dc));
      return;
    }
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
    if (game.titleOpen || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.key.toLowerCase() === 'g' && !game.state.modal) { e.preventDefault(); e.stopPropagation(); jump.focus(); }
    if (e.key.toLowerCase() === 'n' && !game.state.modal) { e.preventDefault(); e.stopPropagation(); focusCursor(); }
  }, true);

  game.a11y = { refresh, focusCursor, focusCell, cursorCell: () => { const c = game.state.cursor; return cellEl(c.row, c.col); } };
  refresh();
})();
