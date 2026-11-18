(() => {
  'use strict';

  // IA do adversário (Jogador 2 no modo "Contra o computador").
  // Ela usa exatamente as mesmas ações do jogador (attack, moveSelected, placeTrap),
  // então respeita as regras de cargas (N+2), alcance de armadilha (7), radar (Chebyshev 3)
  // e movimento/alcance de cada navio. A IA não espia a frota do jogador: só sabe o que o radar,
  // os tiros anteriores e as análises revelaram.

  const game = window.GDM_GAME;
  if (!game) return;

  const PROFILES = {
    // actions: quantas ações a IA faz por vez; think: pausa de "pensamento" (ms, no máximo 5 s)
    facil:   { actions: 2, think: [1200, 1900], step: [900, 1300], analyzeChance: 0.2, analyzeSkill: 0.4, riskyShot: 0.2, trapChance: 0.1, moveChance: 0.15, moveFirst: 0.6 },
    medio:   { actions: 3, think: [1300, 2300], step: [850, 1200], analyzeChance: 0.7, analyzeSkill: 0.7, riskyShot: 0.25, trapChance: 0.35, moveChance: 0.35, moveFirst: 0.45 },
    dificil: { actions: 5, think: [1500, 2600], step: [800, 1100], analyzeChance: 1, analyzeSkill: 0.85, riskyShot: 0, trapChance: 0.6, moveChance: 0.5, moveFirst: 0.35 }
  };
  const MAX_THINK_MS = 5000;
  const ME = 'player2', FOE = 'player1';

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const between = ([a, b]) => a + Math.random() * (b - a);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const key = (r, c) => `${r}:${c}`;

  class EnemyAI {
    constructor(g) {
      this.g = g;
      this.hits = []; // acertos em navios ainda não afundados: { row, col, round }
      this.lastMatch = null;
    }

    get st() { return this.g.state; }
    profile() { return PROFILES[this.st.difficulty] || PROFILES.medio; }

    alive(token) {
      const st = this.st;
      return st.matchId === token && st.phase === 'battle' && st.turn === ME && this.g.isAiMode();
    }

    resetIfNewMatch() {
      if (this.lastMatch !== this.st.matchId) { this.hits = []; this.lastMatch = this.st.matchId; }
    }

    async takeTurn() {
      const g = this.g, token = this.st.matchId;
      this.resetIfNewMatch();
      g.aiBusy = true; g.notify();
      const prof = this.profile();
      // No modo leitor de tela o computador joga mais devagar, para dar tempo de ouvir cada jogada.
      const slow = this.st.settings && this.st.settings.screenReader ? 2.2 : 1;
      try {
        await sleep(Math.min(MAX_THINK_MS, between(prof.think)));
        let done = 0;
        while (done < prof.actions && this.alive(token)) {
          // espera fechar qualquer janela (ex.: fim de jogo) antes de continuar
          if (this.st.modal) break;
          const plan = this.plan();
          if (!plan) break;
          this.execute(plan);
          done++;
          if (!this.alive(token)) break;
          await sleep(between(prof.step) * slow);
        }
        if (this.alive(token) && done === 0) g.toast('O Barba-Rubra preferiu esperar', 'info', 1400);
        if (this.alive(token)) await sleep(500);
      } catch (err) {
        console.error('IA:', err);
      } finally {
        g.aiBusy = false;
        if (this.alive(token) && !this.st.modal) g.endTurn();
        g.notify();
      }
    }

    /* ---------- o que a IA sabe ---------- */

    myShips() { return this.st.ships[ME].filter(s => !s.destroyed); }

    fired(r, c) { return this.st.marks[ME].has(key(r, c)); }

    // Casas onde faz sentido atirar: oceano do jogador e oceano neutro, sem navio/armadilha minha.
    targetable(r, c) {
      if (r < 0 || r > 9 || c < 0 || c > 19) return false;
      if (GDM_LOGIC.shipAt(this.st, r, c, ME)) return false;
      if (GDM_LOGIC.trapAt(this.st, r, c, ME)) return false;
      return true;
    }

    contacts() {
      const st = this.st, out = { revealedShips: [], unknown: [] };
      for (const s of st.ships[FOE]) {
        if (s.destroyed) continue;
        const id = GDM_LOGIC.objectId(s, 'ship');
        if (st.revealed[ME].has(id)) out.revealedShips.push(s);
        else if (st.detected[ME].has(id)) out.unknown.push({ obj: s, type: 'ship', id, cells: s.cells });
      }
      for (const t of st.traps) {
        if (!t.active || t.owner !== FOE) continue;
        const id = GDM_LOGIC.objectId(t, 'trap');
        if (!st.revealed[ME].has(id) && st.detected[ME].has(id)) out.unknown.push({ obj: t, type: 'trap', id, cells: [{ row: t.row, col: t.col }] });
      }
      return out;
    }

    huntCells() {
      const round = this.st.round, cells = [];
      this.hits = this.hits.filter(h => round - h.round <= 3);
      for (const h of this.hits) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const r = h.row + dr, c = h.col + dc;
          if (this.targetable(r, c) && !this.fired(r, c)) cells.push({ row: r, col: c });
        }
      }
      // No difícil, prefere continuar a linha de dois acertos vizinhos.
      if (this.st.difficulty === 'dificil' && this.hits.length >= 2) {
        const line = cells.filter(c => this.hits.some(a => this.hits.some(b => a !== b &&
          ((a.row === b.row && a.row === c.row) || (a.col === b.col && a.col === c.col)))));
        if (line.length) return line;
      }
      return cells;
    }

    searchCell(parity, shooters) {
      const options = [];
      const reach = (r, c) => shooters.some(s => this.g.inAttackRange(s, r, c));
      for (let r = 0; r < 10; r++) for (let c = 0; c < 20; c++) {
        if (!this.targetable(r, c) || this.fired(r, c) || !reach(r, c)) continue;
        if (parity && (r + c) % 2) continue;
        const weight = c <= 9 ? 4 : 1; // a frota do jogador começa no oceano dele
        for (let i = 0; i < weight; i++) options.push({ row: r, col: c });
      }
      if (!options.length && parity) return this.searchCell(false, shooters);
      return options.length ? pick(options) : null;
    }

    /* ---------- decidir ---------- */

    // Casas que algum navio meu consegue alcançar agora (alcance de cada navio).
    shooterFor(cell, shooters) {
      const ok = shooters.filter(s => this.g.inAttackRange(s, cell.row, cell.col));
      if (!ok.length) return null;
      return this.st.difficulty === 'facil' ? pick(ok) : ok.sort((a, b) => b.damage - a.damage)[0];
    }

    plan() {
      const st = this.st, g = this.g, prof = this.profile(), diff = st.difficulty;
      const ships = this.myShips();
      const shooters = ships.filter(s => s.chargeType === 'missile' && s.availableCharges > 0 && !s.turnLocked);
      const layer = ships.find(s => s.typeId === 'trap-layer' && s.availableCharges > 0 && s.trapStock > 0 && !s.turnLocked);
      const info = this.contacts();

      // 0) Navegar: o pirata mexe a frota de verdade (uma vez por vez, na maioria das vezes).
      if (this.movedRound !== st.round && Math.random() < (prof.moveFirst || 0)) {
        const mv = this.planMove(ships, true);
        if (mv) { this.movedRound = st.round; return mv; }
      }

      // 1) Analisar um contato desconhecido que esteja perto de algum navio meu.
      if (st.analysisAvailable[ME] && info.unknown.length && Math.random() < prof.analyzeChance) {
        const reachable = info.unknown.filter(u => ships.some(s => u.cells.some(c => g.inScanRange(s, c.row, c.col))));
        if (reachable.length) return { type: 'analyze', target: pick(reachable) };
      }

      // 2) Atirar em algo dentro do alcance.
      if (shooters.length) {
        const wanted = [];
        if (diff !== 'facil' && info.revealedShips.length) {
          const prey = diff === 'dificil'
            ? info.revealedShips.slice().sort((a, b) => (b.size - a.size) || (a.hp - b.hp))
            : info.revealedShips;
          for (const p of prey) wanted.push(...p.cells);
        }
        if (diff !== 'facil') wanted.push(...this.huntCells());
        if (info.unknown.length && Math.random() < prof.riskyShot) wanted.push(...pick(info.unknown).cells);
        if (diff === 'facil' && info.revealedShips.length && Math.random() < 0.3) wanted.push(...pick(info.revealedShips).cells);
        for (const cell of wanted) {
          if (!this.targetable(cell.row, cell.col)) continue;
          const shooter = this.shooterFor(cell, shooters);
          if (shooter) return { type: 'attack', ship: shooter, row: cell.row, col: cell.col };
        }
        const cell = this.searchCell(diff === 'dificil', shooters);
        if (cell && (Math.random() > 0.15 || !layer)) return { type: 'attack', ship: this.shooterFor(cell, shooters), row: cell.row, col: cell.col };
      }

      // 3) Esconder uma armadilha.
      if (layer && Math.random() < prof.trapChance) {
        const cell = this.trapCell(layer, info);
        if (cell) return { type: 'trap', ship: layer, row: cell.row, col: cell.col };
      }

      // 4) Aproximar navios para o alcance chegar ao oceano do jogador.
      return this.planMove(ships, false);
    }

    planMove(ships, eager) {
      const st = this.st, g = this.g, prof = this.profile(), diff = st.difficulty;
      const movers = ships.filter(s => !s.turnLocked);
      if (movers.length) {
        const front = s => Math.min(...s.cells.map(c => c.col));
        // prioridade: quem tem canhão e ainda está longe
        const far = movers.filter(s => s.chargeType === 'missile' && front(s) - g.shipRange(s) > 6);
        const pool = far.length ? far : (eager || Math.random() < prof.moveChance ? movers : []);
        if (pool.length) {
          const s = pick(pool), steps = g.shipMoveSteps(s);
          const opts = GDM_LOGIC.moveTargets(st, s, steps)
            .filter((m, i, arr) => arr.findIndex(x => x.dr === m.dr && x.dc === m.dc) === i)
            .filter(m => front(s) + m.dc >= 10); // não entra no oceano do jogador
          if (opts.length) {
            const forward = opts.filter(m => m.dc < 0).sort((a, b) => a.dc - b.dc);
            const m = forward.length && (diff !== 'facil' || Math.random() < 0.7) ? forward[0] : pick(opts);
            return { type: 'move', ship: s, dr: m.dr, dc: m.dc };
          }
        }
      }
      return null;
    }

    trapCell(layer, info) {
      const g = this.g, st = this.st, options = [];
      for (let r = 0; r < 10; r++) for (let c = 10; c < 30; c++) {
        if (!g.trapCellAllowed(r, c, layer)) continue;
        let w = c < 20 ? 3 : 1;
        if (st.difficulty === 'dificil') {
          // perto de onde os navios do jogador foram vistos, no caminho até o meu oceano
          const near = info.unknown.concat(info.revealedShips.map(s => ({ cells: s.cells })))
            .some(o => o.cells.some(cc => Math.abs(cc.row - r) <= 2 && Math.abs(cc.col - c) <= 2));
          if (near) w += 6;
          if (c >= 10 && c <= 13) w += 2;
        }
        for (let i = 0; i < w; i++) options.push({ row: r, col: c });
      }
      return options.length ? pick(options) : null;
    }

    /* ---------- executar (pelas mesmas regras do jogador) ---------- */

    execute(plan) {
      const g = this.g, st = this.st;
      if (plan.type === 'analyze') { this.analyze(plan.target); return; }
      st.selectedShipId = plan.ship.uid;
      if (plan.type === 'attack') {
        const target = GDM_LOGIC.shipAt(st, plan.row, plan.col, FOE);
        const before = target ? target.cells.map(c => ({ ...c })) : null;
        g.attack(plan.row, plan.col, true);
        if (target) {
          if (target.destroyed) this.hits = this.hits.filter(h => !before.some(c => c.row === h.row && c.col === h.col));
          else this.hits.push({ row: plan.row, col: plan.col, round: st.round });
        }
      } else if (plan.type === 'move') {
        g.moveSelected(plan.dr, plan.dc);
      } else if (plan.type === 'trap') {
        g.placeTrap(plan.row, plan.col);
      }
      st.selectedShipId = null;
      g.notify();
    }

    // A IA "responde" uma pergunta do radar com chance de acerto conforme a dificuldade.
    analyze(target) {
      const g = this.g, st = this.st, prof = this.profile();
      st.analysisAvailable[ME] = false;
      st.stats[ME].verificationAttempts++;
      g.audio.play('radar');
      if (Math.random() < prof.analyzeSkill) {
        st.stats[ME].verificationCorrect++;
        st.revealed[ME].add(target.id);
        if (target.type === 'trap') st.stats[ME].trapsDiscovered++;
        g.toast('O Barba-Rubra decifrou um sinal do radar!', 'warn', 2000);
      } else {
        g.toast('O Barba-Rubra errou a pergunta do radar!', 'info', 2000);
      }
      g.notify();
    }
  }

  game.ai = new EnemyAI(game);
})();
