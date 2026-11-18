(() => {
  'use strict';

  // CAPTAIN TUTORIAL — Primeira Missão guiada pelo Capitão Maré.
  //
  // Cada etapa tem: título, fala, alvo a destacar, condição para concluir e (opcional) botões.
  // O jogador aprende fazendo: etapas de ação só avançam quando a ação real acontece.
  // Também cuida de:
  //   - "AGORA FAÇA ISTO" (nowText) — instrução curta sempre atualizada;
  //   - Dica do Capitão (tipText) — explicação um pouco maior, pelo estado real do jogo;
  //   - ajuda automática quando o jogador fica parado (e "Mostrar onde clicar");
  //   - tela de troca de jogador (2 jogadores) cobrindo tudo;
  //   - falas curtas do Capitão durante a partida (acerto, água, radar...).

  const game = window.GDM_GAME;
  if (!game) return;

  const DONE_KEY = 'gdm-primeira-missao-v2';
  const FACE_PNG = 'assets/img/ui/capitao_rosto.png';
  const HERO_PNG = 'assets/img/ui/capitao.png';
  const VILLAIN_PNG = 'assets/img/ui/vilao.png';
  const HERO_RATIO = 671 / 900;
  const IDLE_HINT_MS = 8000;
  const IDLE_POINT_MS = 16000;

  const ICON = {
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M5 12l7 7 7-7"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M12 5l-7 7 7 7"/></svg>'
  };
  // Dúvidas de cada etapa do tutorial (botão "Dúvida?").
  const FAQ_STEP = {
    hello: [['Preciso saber jogar batalha naval?', 'Não! O Capitão mostra tudo, passo por passo. É só seguir o quadro.'],
      ['Posso sair do tutorial?', 'Pode. Use "Pular tutorial". Para ver de novo depois: aba Ajuda, botão "Rever tutorial".']],
    villain: [['Quem joga pelo Barba-Rubra?', 'O computador. Ele escolhe as jogadas sozinho e não espia onde estão os seus navios.']],
    map: [['Quais são os três oceanos?', 'À esquerda fica o SEU oceano, onde você esconde seus navios. No meio fica o Oceano Neutro, onde todos podem navegar. À direita fica o oceano do computador, com os navios dele escondidos.']],
    cols: [['Para que servem as letras?', 'Cada letra é uma coluna (de cima para baixo). A primeira é A, depois B, C... até J.']],
    rows: [['Para que servem os números?', 'Cada número é uma linha (da esquerda para a direita). Vão de 1 até 10.']],
    a1: [['Como acho uma casa?', 'Primeiro a letra (coluna), depois o número (linha). C7 é a coluna C com a linha 7.'],
      ['E pelo teclado?', 'Aperte G, digite a casa (por exemplo C7) e aperte Enter.']],
    pick: [['Onde ficam os navios?', 'Na lista do painel, em "Escolha um navio". Clique em qualquer um.'],
      ['E pelo teclado?', 'Aperte Tab até chegar na lista e Enter no navio que quiser.'],
      ['Qual escolher primeiro?', 'Tanto faz! Cada navio tem um tamanho diferente.']],
    place: [['Por que o navio ficou vermelho?', 'Vermelho quer dizer que não cabe ali: ele sairia do seu oceano ou encostaria em outro navio. Escolha outra casa ou gire o navio.'],
      ['Como coloco o navio?', 'Com o mouse: passe por cima do seu oceano e clique quando ficar verde. Com o teclado: use as setas para andar e Enter para colocar.'],
      ['Não estou achando a casa verde.', 'Use "Mostrar onde" ou a casa marcada pelo Capitão: ela sempre cabe.']],
    rotate: [['Para que serve girar?', 'O navio pode ficar deitado (horizontal) ou em pé (vertical). Girar ajuda a caber em mais lugares.'],
      ['Qual a tecla?', 'R gira o navio.']],
    finish: [['O que o botão AUTOMÁTICO faz?', 'Coloca todos os navios que faltam em lugares que cabem.'],
      ['Tenho que colocar todos?', 'Sim: são 6 navios. A batalha só começa com a frota completa.']],
    ready: [['O que acontece quando aperto PRONTO?', 'A batalha começa. Na batalha, seus navios ainda podem andar 1 casa com a ação MOVER.']],
    battle: [['Quantas jogadas faço na minha vez?', 'Cada navio pode agir uma vez. Quando terminar, aperte PASSAR A VEZ.']],
    select: [['Por que não posso escolher o Lança-Armadilhas aqui?', 'Ele não tem canhões: ele esconde minas. Neste treino vamos atirar, então escolha um navio com canhões.'],
      ['E pelo teclado?', 'Use as setas até o navio e aperte Enter.']],
    action: [['O que cada ação faz?', 'ATACAR atira numa casa. MOVER anda 1 casa. ARMADILHA esconde uma mina. ANALISAR decifra um "?" do radar.'],
      ['Tem atalho?', 'Teclas 1, 2, 3 e 4: Atacar, Mover, Armadilha e Analisar.']],
    fire: [['Onde eu atiro?', 'No oceano do computador, à direita. Os navios dele estão escondidos, então é só tentar!'],
      ['E pelo teclado?', 'Use as setas para escolher a casa e Enter para atirar. Ou aperte G e digite a casa.']],
    shotResult: [['Como sei se acertei?', 'Fogo e "ACERTO!" quer dizer que pegou um navio. Respingo e "ÁGUA!" quer dizer que não tinha nada ali.']],
    radar: [['Para que servem as perguntas?', 'O radar mostra "?" perto dos seus navios. Acertando a pergunta, você descobre se é um navio ou uma armadilha.'],
      ['E se eu errar?', 'Não tem problema: você vê a resposta certa com a explicação e aprende para a próxima.']],
    radarResult: [['Quando aparecem os "?"', 'Quando o radar de um navio seu percebe algo por perto.']],
    end: [['Qual é a tecla para passar a vez?', 'Espaço. Ou o botão PASSAR A VEZ no painel.']],
    done: [['Onde vejo as dúvidas depois?', 'Na aba Ajuda, em "Dúvidas frequentes". F1 abre o Guia do Capitão.']]
  };
  // Etapas que ganham a demonstração animada (mouse/toque ou teclado).
  const DEMO_STEP = { place: 'place', fire: 'fire' };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = sel => document.querySelector(sel);
  const canvasRect = () => document.getElementById('gameCanvas').getBoundingClientRect();

  class CaptainTutorial {
    constructor() {
      this.active = false;
      this.index = -1;
      this.mode = null;          // 'mission' | 'tip' | 'quip'
      this.data = {};
      this.lastInput = Date.now();
      this.idleStage = 0;
      this.pointUntil = 0;
      this.pointSel = null;
      this.faceOk = false;
      const probe = new Image();
      probe.onload = () => { this.faceOk = true; game.notify(); };
      probe.src = FACE_PNG;
      this.build();
      game.mission = this;
      ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { this.lastInput = Date.now(); this.idleStage = 0; }, true));
      // Lembra se a pessoa usa mouse/toque ou teclado, para a demonstração certa.
      this.inputKind = 'mouse';
      window.addEventListener('pointerdown', e => { if (e.pointerType) this.inputKind = 'mouse'; }, true);
      window.addEventListener('keydown', e => { if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) this.inputKind = 'keyboard'; }, true);
      setInterval(() => this.idleCheck(), 1000);
      this.waitForGame();
    }

    avatar() { return this.faceOk ? FACE_PNG : ''; }
    completed() { try { return localStorage.getItem(DONE_KEY) === '1'; } catch (_e) { return false; } }
    markDone() { try { localStorage.setItem(DONE_KEY, '1'); } catch (_e) {} }

    waitForGame() {
      const tick = () => {
        if (game.state.phase === 'placement' && game.assetsReady && !game.titleOpen) { if (!this.completed() && game.state.settings.tutorialAuto !== false) setTimeout(() => this.start(), 350); return; }
        setTimeout(tick, 200);
      };
      tick();
    }

    human() { return game.isAiMode() ? 'player1' : game.currentOwner(); }
    zoneOf(owner) { return owner === 'player1' ? 0 : 2; }

    /* ---------- etapas ---------- */

    steps() {
      const human = () => this.human();
      const enemyZone = () => this.zoneOf(game.isAiMode() ? 'player2' : (game.state.turn === 'player1' ? 'player2' : 'player1'));
      return [
        { id: 'hello', title: 'OLÁ, CAPITÃO!', big: true,
          text: () => 'Bem-vindo ao Guerra dos Mares! Eu vou ficar com você nessa primeira missão.',
          text2: () => 'Não se preocupe em decorar nada. Eu vou mostrar o que fazer, passo por passo!',
          buttons: [['VAMOS LÁ!', () => this.next(), 'primary'], ['JÁ SEI JOGAR', () => this.skip(), 'soft']] },
        { id: 'villain', title: 'O ADVERSÁRIO', villain: true, skip: () => !game.isAiMode(),
          text: () => 'Este é o Barba-Rubra, o capitão da frota inimiga. Ele quer afundar os nossos navios. Vamos treinar para vencer!',
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'map', title: 'CONHEÇA O MAPA', target: { board: true }, enter: () => game.resetCamera(),
          text: () => `Este é o nosso oceano, capitão! À esquerda fica o ${GDM_LOGIC.zoneNames.player1}, no meio o Oceano Neutro e à direita o ${GDM_LOGIC.zoneNames.player2}.`,
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'cols', title: 'CONHEÇA O MAPA', target: { cols: 0 },
          text: () => 'As letras mostram as colunas: A, B, C...',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'rows', title: 'CONHEÇA O MAPA', target: { rows: 0 },
          text: () => 'Os números mostram as linhas: 1, 2, 3...',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'a1', title: 'CONHEÇA O MAPA', target: { cell: [0, 0] }, guides: true,
          text: () => 'Quando juntamos os dois, temos uma coordenada! Coluna A + linha 1 = A1. Então A1 é esta casa!',
          buttons: [['ENTENDI!', () => this.next(), 'primary']] },
        { id: 'pick', title: 'MONTE SUA FROTA', target: { dom: '#gdmTabPanel-game .ships' },
          enter: () => { if (game.panel) game.panel.setTab('game'); },
          text: () => 'Antes da batalha, precisamos esconder nossos navios. Escolha qualquer navio aqui.',
          wait: ev => ev.name === 'selectShip' },
        { id: 'place', title: 'MONTE SUA FROTA', target: { zone: () => 0 }, legend: true,
          enter: () => this.suggestCell(),
          text: () => `Boa escolha! Agora toque numa casa do seu oceano onde o navio aparece VERDE. Eu marquei uma casa boa para você.`,
          wait: ev => ev.name === 'placeShip' && ev.data,
          fail: ev => ev.name === 'placeFail' ? 'Ops! Esse navio não cabe aí. Procure uma área verde.' : null,
          leave: () => { game.hintCell = null; },
          done: () => this.cheer('Muito bem!') },
        { id: 'rotate', title: 'GIRAR O NAVIO', target: { dom: '[data-key="rotate"]' },
          text: () => 'Também podemos girar nossos navios. Aperte GIRAR (tecla R).',
          wait: ev => ev.name === 'rotate', done: () => this.cheer('Perfeito! Navios podem ficar em pé ou deitados.') },
        { id: 'finish', title: 'TERMINE SUA FROTA', target: { dom: '[data-key="auto"]' }, open: true,
          text: () => 'Agora coloque o restante dos navios no mapa. Está com pressa? Este botão organiza tudo para você.',
          wait: () => game.fleetReady(human()) },
        { id: 'ready', title: 'TERMINE SUA FROTA', target: { dom: '[data-key="ready"]' },
          text: () => 'Frota completa! Aperte PRONTO.',
          wait: ev => ev.name === 'ready' || ev.name === 'turnStart' },
        { id: 'battleWait', hidden: true, wait: () => game.state.phase === 'battle' && !game.state.modal && !game.isAiTurn() },
        { id: 'battle', title: 'A BATALHA COMEÇOU!', flow: true,
          enter: () => game.audio.play('tutorialNext'),
          text: () => 'Não se preocupe: na sua vez é sempre NAVIO, depois AÇÃO, depois MAPA.',
          buttons: [['ENTENDI!', () => this.next(), 'primary']] },
        { id: 'select', title: 'PASSO 1 · ESCOLHA UM NAVIO', target: { zone: () => this.zoneOf(game.state.turn) },
          enter: () => game.focusZone(this.zoneOf(game.state.turn), true),
          text: () => 'Primeiro escolha um navio que ainda pode agir. Toque em um dos SEUS navios com canhões (Encouraçado, Cruzador ou Destroier).',
          wait: ev => ev.name === 'battleSelect' && ev.data && ev.data.ship.chargeType === 'missile' && ev.data.ship.availableCharges > 0,
          fail: ev => ev.name === 'battleSelect' && !(ev.data.ship.chargeType === 'missile' && ev.data.ship.availableCharges > 0) ? 'Esse navio não tem canhões. Para o treino, escolha o Encouraçado, o Cruzador ou um Destroier.' : null },
        { id: 'action', title: 'PASSO 2 · ESCOLHA UMA AÇÃO', target: { dom: '[data-key="act:attack"]' },
          text: () => 'Agora escolha ATACAR: atire em uma casa do mapa.',
          wait: ev => ev.name === 'chooseAction' && game.state.action === 'attack',
          fail: ev => ev.name === 'chooseAction' && game.state.action !== 'attack' ? 'Nesse treino, vamos usar ATACAR. Toque em Cancelar e depois em Atacar.' : null },
        { id: 'fire', title: 'PASSO 3 · ESCOLHA NO MAPA', target: { zone: enemyZone }, enter: () => game.focusZone(enemyZone(), true),
          text: () => 'Toque numa casa do oceano inimigo para atirar. Os navios dele estão escondidos: é só tentar!',
          wait: ev => ev.name === 'actionDone' && ev.data && ev.data.type === 'attack',
          done: ev => { this.data.hit = !!(ev.data && ev.data.hit); } },
        { id: 'shotResult', title: () => this.data.hit ? 'ACERTO!' : 'ÁGUA!', light: true,
          text: () => this.data.hit ? 'Na mosca, capitão! Cada acerto tira vida do navio inimigo.' : 'Passou perto! Agora você sabe que ali não tem navio.',
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'radar', title: 'O RADAR', target: { dom: '[data-tab="radar"]' }, skip: () => !game.questionsLoaded,
          text: () => 'Capitão! Nosso radar encontrou um sinal misterioso. Para decifrar, responda se a frase é VERDADEIRA ou FALSA. Vamos treinar!',
          buttons: [['DECIFRAR SINAL', () => { if (!game.openPracticeQuestion()) this.next(); }, 'primary']],
          wait: ev => ev.name === 'practiceClosed' },
        { id: 'radarResult', title: () => this.data.correct ? 'EXCELENTE!' : 'QUASE!', light: true,
          text: () => this.data.correct
            ? 'Você decifrou o sinal! Na batalha, acertar a frase revela se o “?” do radar é um navio ou uma armadilha.'
            : 'Essa era difícil, mas agora você já sabe! Na batalha, acertar a frase revela se o “?” do radar é um navio ou uma armadilha.',
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'end', title: 'PASSAR A VEZ', target: { dom: '[data-key="end"]' },
          text: () => 'Quando terminar suas jogadas, aperte PASSAR A VEZ (tecla Espaço).',
          wait: ev => ev.name === 'endTurn' },
        { id: 'watch', hidden: true, wait: ev => ev.name === 'turnStart' },
        { id: 'done', title: 'MISSÃO CUMPRIDA!',
          enter: () => { game.audio.play('win'); this.confetti(); this.markDone(); },
          text: () => 'Você já sabe jogar, capitão! Se ficar em dúvida, olhe o quadro AGORA FAÇA ISTO ou peça uma Dica do Capitão.',
          buttons: [['BORA JOGAR!', () => this.stop(), 'primary']] }
      ];
    }

    start() {
      if (game.state.phase !== 'placement' || game.state.placementOwner !== 'player1') return;
      this.mode = 'mission'; this.active = true; this.data = {}; this.index = -1;
      this.list = this.steps();
      this.next(true);
    }

    // Etapa anterior que dá para rever com segurança: só explicações (com botões) da mesma fase do jogo.
    backTarget() {
      if (this.mode !== 'mission' || !this.list) return -1;
      const phaseOf = i => i <= this.list.findIndex(x => x.id === 'ready') ? 'placement' : 'battle';
      const cur = this.index;
      for (let j = cur - 1; j >= 0; j--) {
        const st = this.list[j];
        if (st.hidden || (st.skip && st.skip())) continue;
        if (phaseOf(j) !== phaseOf(cur)) return -1;
        if (st.buttons && !st.wait && st.id !== 'hello') return j;
      }
      return -1;
    }

    back() {
      const j = this.backTarget();
      if (j < 0) return;
      const cur = this.step();
      if (cur && cur.leave) cur.leave();
      for (let k = j; k < this.list.length; k++) { this.list[k].finished = false; this.list[k].misses = 0; }
      this.index = j;
      const st = this.step();
      game.audio.play('tutorialNext');
      if (st.enter) st.enter();
      this.render(true);
    }

    restart() {
      if (game.state.phase !== 'placement' || game.state.ships.player1.some(s => s.row !== null)) {
        game.state.modal = null;
        game.resetMatch(game.state.difficulty);
        game.state.phase = 'placement';
      }
      if (game.panel) game.panel.setTab('game');
      this.start();
    }

    step() { return this.list && this.list[this.index]; }

    next(silent = false) {
      if (!this.active) return;
      const cur = this.step();
      if (cur && cur.leave) cur.leave();
      do { this.index++; } while (this.step() && this.step().skip && this.step().skip());
      const st = this.step();
      if (!st) { this.stop(); return; }
      if (!silent) game.audio.play('tutorialNext');
      if (st.enter) st.enter();
      if (st.target && st.target.dom && game.panel) game.panel.open(null);
      this.render(true);
      if (st.wait && !st.buttons && st.wait({ name: 'check' })) this.advance(st, 300);
    }

    onEvent(name, data) {
      // falas curtas durante a partida (fora da missão)
      if (this.mode !== 'mission') this.reactQuip(name, data);
      if (!this.active || this.mode !== 'mission') return;
      const st = this.step();
      if (!st) return;
      const ev = { name, data };
      if (name === 'practiceAnswered') this.data.correct = !!(data && data.correct);
      if (st.fail) {
        const msg = st.fail(ev);
        if (msg) {
          // Depois de 3 tentativas fora do alvo, o destaque fica mais forte.
          st.misses = (st.misses || 0) + 1;
          this.el.classList.toggle('is-strong', st.misses >= 3);
          this.say(msg, true); this.nudge(); return;
        }
      }
      if (!st.finished && st.wait && st.wait(ev)) {
        if (st.done) st.done(ev);
        // Acertou: o anel fica verde por um instante.
        this.el.classList.remove('is-strong');
        this.el.classList.add('is-right');
        setTimeout(() => this.el.classList.remove('is-right'), 700);
        this.advance(st, st.done ? 1000 : 250);
      }
    }

    // Avança uma única vez a partir da etapa indicada (eventos repetidos não pulam etapas).
    advance(from, ms) {
      if (from.finished) return;
      from.finished = true;
      setTimeout(() => { if (this.step() === from) this.next(); }, ms);
    }

    // Durante o desafio de posicionar, o jogo explica onde estão as casas verdes.
    allowPlace() { return true; }

    suggestCell() {
      const owner = this.human(), s = game.selectedShip();
      if (!s) return;
      const h = GDM_LOGIC.home(owner);
      for (let r = 1; r < 9; r++) for (let c = h.minCol + 1; c <= h.maxCol; c++) {
        if (GDM_LOGIC.canPlace(game.state, s, r, c, s.orientation)) { game.hintCell = { row: r, col: c }; game.state.cursor = { row: r, col: c }; return; }
      }
    }

    stop() {
      const st = this.step();
      if (st && st.leave) st.leave();
      game.hintCell = null; clearInterval(this.demoTimer);
      this.active = false; this.mode = null;
      this.el.hidden = true;
      game.notify();
      setTimeout(() => game.panel && game.panel.open(null, true), 50);
    }

    skip() {
      this.markDone();
      this.stop();
      game.toast('Tudo bem! A Dica do Capitão fica na aba Ajuda', 'info', 2600);
    }

    cheer(text) { game.audio.play('correct'); this.say(text, false); }
    nudge() { this.bubble.classList.remove('m-nudge'); void this.bubble.offsetWidth; this.bubble.classList.add('m-nudge'); }

    /* ---------- AGORA FAÇA ISTO / Dica do Capitão ---------- */

    nowText() {
      const st = game.state;
      if (st.modal && st.modal.type === 'help') { const m = st.modal; st.modal = null; try { return this.nowText(); } finally { st.modal = m; } }
      if (st.phase === 'loading') return null;
      if (st.modal) {
        if (st.modal.type === 'question') return 'Responda Verdadeiro ou Falso.';
        if (st.modal.type === 'feedback') return 'Leia a explicação e aperte Continuar.';
        if (st.modal.type === 'handoff') return 'Passe o aparelho e aperte o botão.';
        if (st.modal.type === 'end') return 'Aperte Jogar de novo.';
        return 'Aperte o botão da janela.';
      }
      if (st.phase === 'placement') {
        if (game.fleetReady()) return 'Aperte PRONTO.';
        if (!game.selectedShip()) return 'Escolha um navio na lista.';
        return `Toque numa casa verde para colocar o ${game.shipName(game.selectedShip())}.`;
      }
      if (st.phase === 'battle') {
        if (game.isAiTurn()) return 'Espere: o computador está jogando.';
        const a = st.action;
        if (a === 'attack') return 'Escolha a casa onde o navio vai atirar.';
        if (a === 'move') return 'Toque numa casa verde ao lado do navio.';
        if (a === 'trap') return 'Toque numa casa roxa para esconder a mina.';
        if (a === 'analyze') return 'Toque num “?” para decifrar o sinal.';
        const s = game.selectedShip();
        if (s && s.turnLocked) return 'Seu navio terminou. Escolha outro ou passe a vez.';
        if (s) return 'Agora escolha ATACAR, MOVER, ARMADILHA ou ANALISAR.';
        const free = st.ships[st.turn].some(x => !x.destroyed && !x.turnLocked);
        return free ? 'Escolha um dos seus navios.' : 'Todos agiram. Aperte PASSAR A VEZ.';
      }
      return 'Aperte Jogar de novo.';
    }

    tipText() {
      const st = game.state;
      if (st.modal && st.modal.type === 'help') { const m = st.modal; st.modal = null; try { return this.tipText(); } finally { st.modal = m; } }
      if (st.phase === 'loading') return 'Carregando o mar…';
      if (st.modal) {
        if (st.modal.type === 'question') return 'Leia com calma. Você pode responder Verdadeiro ou Falso.';
        if (st.modal.type === 'handoff') return 'Entregue o aparelho para o próximo jogador e aperte o botão quando ele estiver pronto.';
        if (st.modal.type === 'end') return 'A partida acabou! Aperte Jogar de novo para outra batalha.';
        return 'Leia a janela e aperte o botão para continuar.';
      }
      if (st.phase === 'placement') {
        if (game.fleetReady()) return 'Sua frota está pronta! Aperte PRONTO para começar a batalha.';
        return 'Escolha um navio e toque numa casa verde. GIRAR deixa o navio em pé ou deitado, AUTOMÁTICO arruma tudo.';
      }
      if (st.phase === 'battle') {
        if (game.isAiTurn()) return 'É a vez do computador. Observe o seu oceano e espere a sua vez!';
        const a = st.action;
        if (a === 'attack') return 'Agora escolha onde seu navio vai atirar.';
        if (a === 'move') return 'Toque numa casa verde colada no navio para ele andar 1 casa.';
        if (a === 'trap') return 'Toque numa casa roxa (até 7 casas) para esconder uma mina no seu mar ou no Neutro.';
        if (a === 'analyze') return 'Toque num “?” para decifrar o sinal do radar.';
        const s = game.selectedShip();
        if (s && s.turnLocked) return 'Esse navio já cumpriu sua missão nesta vez. Escolha outro navio ou passe a vez.';
        if (s && s.chargeType === 'missile' && s.availableCharges <= 0) return 'Esse navio está sem munição. Ela volta depois de algumas rodadas. Que tal movê-lo?';
        const contacts = game.radarContacts().filter(c => !c.revealed);
        if (contacts.length && st.analysisAvailable[st.turn]) return 'Tem “?” no radar! Use ANALISAR e responda Verdadeiro ou Falso para descobrir o que é.';
        if (!s) {
          if (!game.radarContacts().length) return 'Primeiro escolha um dos seus navios. Dica: seu radar ainda não encontrou ninguém; tente aproximar um navio do meio do mar.';
          return 'Primeiro escolha um dos seus navios.';
        }
        return 'Escolha uma ação: ATACAR, MOVER, ARMADILHA ou ANALISAR.';
      }
      return 'Aperte Jogar de novo para outra partida.';
    }

    // Seletor do que deve ser tocado agora (para "Mostrar onde clicar").
    nextTarget() {
      const st = game.state;
      if (st.modal || game.isAiTurn()) return null;
      if (st.phase === 'placement') {
        if (game.fleetReady()) return { dom: '[data-key="ready"]' };
        if (!game.selectedShip()) return { dom: '#gdmTabPanel-game .ships' };
        return { zone: () => this.zoneOf(game.currentOwner()) };
      }
      if (st.phase === 'battle') {
        const s = game.selectedShip(), a = st.action;
        if (a === 'attack') return { zone: () => this.zoneOf(game.state.turn === 'player1' ? 'player2' : 'player1') };
        if (a) return { zone: () => this.zoneOf(game.state.turn) };
        if (s && !s.turnLocked) {
          const free = ['attack', 'move', 'trap', 'analyze'].find(x => !game.actionBlocker(x));
          if (free) return { dom: `[data-key="act:${free}"]` };
        }
        const any = st.ships[st.turn].some(x => !x.destroyed && !x.turnLocked);
        return any ? { zone: () => this.zoneOf(st.turn) } : { dom: '[data-key="end"]' };
      }
      return null;
    }

    showTip(auto = false) {
      if (this.active && this.mode === 'mission') { this.render(true); return; }
      // Leitor de tela: a ajuda automática é falada, sem abrir caixa nem mexer no foco.
      if (auto && game.state.settings.screenReader) { game.announce(`Precisa de uma mão? ${this.tipText()}`); return; }
      this.autoTip = auto;
      this.mode = 'tip'; this.active = true; this.index = 0;
      const offerPoint = !!this.nextTarget();
      this.list = [{ id: 'tip', title: auto ? 'PRECISA DE UMA MÃO?' : 'DICA DO CAPITÃO', light: true,
        text: () => this.tipText(),
        buttons: [
          ...(offerPoint ? [['MOSTRAR ONDE CLICAR', () => { this.hideTip(); this.pointAt(this.nextTarget()); }, 'primary']] : []),
          ['ENTENDI', () => this.hideTip(), offerPoint ? 'soft' : 'primary']
        ] }];
      this.render(true);
      if (!auto) game.audio.play('select');
    }

    hideTip() { if (this.mode === 'tip' || this.mode === 'quip') { this.active = false; this.mode = null; this.el.hidden = true; } }

    // Destaca o próximo elemento por alguns segundos, sem bloquear nada.
    pointAt(target) {
      if (!target) return;
      this.pointTarget = target; this.pointUntil = Date.now() + 4500;
      this.mode = 'point'; this.active = true;
      this.list = [{ id: 'point', light: true, passive: true, noBubble: true, target }]; this.index = 0;
      this.render(true);
      clearTimeout(this.pointTimer);
      this.pointTimer = setTimeout(() => { if (this.mode === 'point') { this.active = false; this.mode = null; this.el.hidden = true; } }, 4500);
    }

    // Falas rápidas do Capitão durante a partida (sem bloquear).
    quip(title, text, ms = 2200) {
      if (this.active && (this.mode === 'mission' || this.mode === 'tip')) return;
      if (game.state.settings.screenReader) return;
      this.mode = 'quip'; this.active = true; this.index = 0;
      this.list = [{ id: 'quip', title, light: true, small: true, text: () => text, buttons: [] }];
      this.render(true);
      clearTimeout(this.quipTimer);
      this.quipTimer = setTimeout(() => { if (this.mode === 'quip') this.hideTip(); }, ms);
    }

    reactQuip(name, data) {
      if (game.isAiTurn()) return;
      // Tiros já têm a palavra grande no mapa e o aviso no topo; o Capitão só aparece em momentos especiais.
      if (window.innerHeight < 500) return;
      if (name === 'radarContact') {
        this.quip('CONTATO NO RADAR!', 'Tem alguma coisa por perto! Veja a aba Radar.', 2600);
        const tab = $('[data-tab="radar"]');
        if (tab) { tab.classList.remove('m-attention'); void tab.offsetWidth; tab.classList.add('m-attention'); }
      } else if (name === 'answerRight' && data && data.stars === 3) setTimeout(() => this.quip('3 ESTRELAS!', 'Você está mandando muito bem!', 2600), 1600);
    }

    idleCheck() {
      const st = game.state;
      if (game.titleOpen || (this.active && this.mode !== 'quip') || st.modal || !['placement', 'battle'].includes(st.phase) || game.isAiTurn() || !this.completed()) return;
      const idle = Date.now() - this.lastInput;
      if (idle > IDLE_POINT_MS && this.idleStage === 1) { this.idleStage = 2; this.pointAt(this.nextTarget()); }
      else if (idle > IDLE_HINT_MS && this.idleStage === 0) { this.idleStage = 1; this.showTip(true); }
    }

    /* ---------- tela ---------- */

    build() {
      const el = document.createElement('div');
      el.id = 'gdmMission';
      el.className = 'mission';
      el.hidden = true;
      el.innerHTML = `
        <div class="m-shade" data-side="top"></div><div class="m-shade" data-side="left"></div>
        <div class="m-shade" data-side="right"></div><div class="m-shade" data-side="bottom"></div>
        <div class="m-ring" aria-hidden="true"></div>
        <div class="m-arrow" aria-hidden="true">${ICON.down}</div>
        <div class="m-guide m-guide-col" aria-hidden="true"><b>A</b>${ICON.down}</div>
        <div class="m-guide m-guide-row" aria-hidden="true">${ICON.left}<b>1</b></div>
        <img class="m-hero" src="${HERO_PNG}" alt="">
        <img class="m-villain" src="${VILLAIN_PNG}" alt="">
        <section class="m-bubble" role="dialog" aria-modal="true" aria-labelledby="gdmMissionTitle" aria-describedby="gdmMissionText">
          <p class="m-name"><span class="m-name-tag">Capitão Maré</span><span class="m-count"></span></p>
          <h2 class="m-title" id="gdmMissionTitle"></h2>
          <p class="m-text" id="gdmMissionText"></p>
          <p class="m-text m-text2"></p>
          <div class="m-legend" hidden><span class="ok">Verde = pode</span><span class="no">Vermelho = não pode</span></div>
          <ol class="m-flow" hidden><li><b>1</b>Escolha um navio</li><li><b>2</b>Escolha uma ação</li><li><b>3</b>Escolha uma casa</li></ol>
          <div class="m-demo" hidden></div>
          <div class="m-faq" id="gdmMissionFaq" role="region" aria-label="Dúvidas desta etapa" tabindex="-1" hidden></div>
          <div class="m-btns"></div>
          <div class="m-progress" aria-hidden="true"></div>
        </section>
        <div class="sr-only" aria-live="assertive" aria-atomic="true" id="gdmMissionLive"></div>`;
      document.body.appendChild(el);
      this.el = el;
      this.shades = [...el.querySelectorAll('.m-shade')];
      this.ring = el.querySelector('.m-ring');
      this.arrow = el.querySelector('.m-arrow');
      this.guideCol = el.querySelector('.m-guide-col');
      this.guideRow = el.querySelector('.m-guide-row');
      this.hero = el.querySelector('.m-hero');
      this.villain = el.querySelector('.m-villain');
      this.bubble = el.querySelector('.m-bubble');
      this.nameTag = el.querySelector('.m-name-tag');
      this.count = el.querySelector('.m-count');
      this.titleEl = el.querySelector('.m-title');
      this.textEl = el.querySelector('#gdmMissionText');
      this.text2El = el.querySelector('.m-text2');
      this.legend = el.querySelector('.m-legend');
      this.flowEl = el.querySelector('.m-flow');
      this.btns = el.querySelector('.m-btns');
      this.demoEl = el.querySelector('.m-demo');
      this.faqEl = el.querySelector('.m-faq');
      this.progress = el.querySelector('.m-progress');
      this.live = el.querySelector('#gdmMissionLive');
      this.heroOk = true;
      this.hero.addEventListener('error', () => { this.heroOk = false; });
      this.hero.alt = 'Capitão Maré, o pirata que guia o jogo, conversando com você';
      this.villain.alt = 'Barba-Rubra, o capitão inimigo';
      this.shades.forEach(s => s.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        game.audio.play('error');
        this.nudge();
      }));
      // Foco preso no diálogo (e no elemento destacado, se houver).
      document.addEventListener('keydown', e => this.trapFocus(e), true);
      this.buildHandoff();
      const loop = () => { this.position(); this.syncHandoff(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    focusables() {
      const st = this.step();
      if (!this.active || !st || st.noBubble || this.el.hidden) return [];
      const list = [];
      const target = this.domTarget(st) || this.mapTarget(st);
      if (target) list.push(target);
      list.push(...this.bubble.querySelectorAll('button'));
      return list;
    }

    trapFocus(e) {
      if (this.handoffOpen) {
        if (e.key === 'Tab') { e.preventDefault(); this.handoffBtn.focus(); }
        return;
      }
      if (!this.active || this.mode === 'quip' || this.mode === 'point') return;
      const st = this.step();
      if (e.key === 'Escape' && this.mode === 'tip') { e.preventDefault(); this.hideTip(); return; }
      if (e.key !== 'Tab' || !st || st.light || (game.state.modal && game.state.modal.type !== 'help')) return;
      const list = this.focusables();
      if (!list.length) return;
      // Etapas no mapa: o teclado usa setas + Enter; Tab fica no diálogo.
      const i = list.indexOf(document.activeElement);
      e.preventDefault();
      const n = (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
      list[i < 0 ? 0 : n].focus();
    }

    say(text, warn) {
      this.textEl.textContent = text;
      this.textEl.classList.toggle('is-warn', !!warn);
      this.live.textContent = '';
      setTimeout(() => { this.live.textContent = `Capitão diz: ${text}`; }, 30);
    }

    render(fresh = false) {
      const st = this.step();
      if (!this.active || !st) { this.el.hidden = true; return; }
      this.el.hidden = false;
      const missionSteps = this.mode === 'mission' ? this.list.filter(s => !s.hidden) : [];
      const n = missionSteps.indexOf(st) + 1;
      this.el.classList.toggle('no-bubble', !!st.noBubble);
      if (!fresh) return;
      const title = typeof st.title === 'function' ? st.title() : (st.title || '');
      this.titleEl.textContent = title;
      this.titleEl.hidden = !title;
      this.nameTag.textContent = 'Capitão Maré';
      this.count.textContent = n ? `${n}/${missionSteps.length}` : '';
      this.progress.hidden = !n;
      if (n) this.progress.innerHTML = missionSteps.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
      if (st.text) this.say(st.text(), false);
      this.text2El.textContent = st.text2 ? st.text2() : '';
      this.text2El.hidden = !st.text2;
      if (st.text2) setTimeout(() => { this.live.textContent += ' ' + st.text2(); }, 60);
      this.legend.hidden = !st.legend;
      this.flowEl.hidden = !st.flow;
      this.btns.innerHTML = '';
      for (const [label, fn, kind] of (st.buttons || [])) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = `btn ${kind === 'primary' ? 'btn-primary' : 'btn-soft'}`; b.textContent = label;
        b.addEventListener('click', () => { if (st.finished && this.mode === 'mission') return; game.audio.play('click'); fn(); });
        this.btns.appendChild(b);
      }
      if (this.mode === 'mission' && !(st.buttons || []).some(([l]) => l === 'JÁ SEI JOGAR') && st.id !== 'done') {
        const sk = document.createElement('button');
        sk.type = 'button'; sk.className = 'btn btn-link m-skip'; sk.textContent = 'Pular tutorial';
        // Pular pede confirmação (toque de novo), para não sair do tutorial sem querer.
        sk.addEventListener('click', () => {
          if (sk.dataset.armed) { this.skip(); return; }
          sk.dataset.armed = '1'; sk.textContent = 'Sair do tutorial? Toque de novo';
          game.announce('Sair do tutorial? Aperte de novo para confirmar.', true);
          setTimeout(() => { if (sk.isConnected) { delete sk.dataset.armed; sk.textContent = 'Pular tutorial'; } }, 4000);
        });
        this.btns.appendChild(sk);
      }
      if (this.mode === 'mission') {
        // Voltar (para a explicação anterior) e Dúvida? (perguntas desta etapa)
        if (this.backTarget() >= 0) {
          const bk = document.createElement('button');
          bk.type = 'button'; bk.className = 'btn btn-soft m-back'; bk.textContent = 'Voltar';
          bk.setAttribute('aria-label', 'Voltar para a explicação anterior');
          bk.addEventListener('click', () => { game.audio.play('click'); this.back(); });
          this.btns.appendChild(bk);
        }
        if (FAQ_STEP[st.id]) {
          const dq = document.createElement('button');
          dq.type = 'button'; dq.className = 'btn btn-soft m-doubt'; dq.textContent = 'Dúvida?';
          dq.setAttribute('aria-expanded', 'false'); dq.setAttribute('aria-controls', 'gdmMissionFaq');
          dq.addEventListener('click', () => { game.audio.play('click'); this.toggleFaq(st, dq); });
          this.btns.appendChild(dq);
        }
      }
      // ordem visual = ordem do Tab: Pular, Voltar, Dúvida e por último o botão principal
      this.btns.querySelectorAll('.btn-primary').forEach(b => this.btns.appendChild(b));
      this.faqEl.hidden = true; this.faqEl.innerHTML = '';
      this.renderDemo(st);
      this.btns.hidden = !this.btns.children.length;
      this.el.classList.toggle('is-light', !!st.light);
      this.el.classList.toggle('is-small', !!st.small);
      this.el.classList.toggle('has-villain', !!st.villain);
      for (const img of [this.hero, this.villain]) { img.classList.remove('m-enter'); void img.offsetWidth; img.classList.add('m-enter'); }
      this.position();
      if (this.mode === 'quip' || this.mode === 'point' || (this.mode === 'tip' && this.autoTip)) return;
      setTimeout(() => {
        const target = this.domTarget(st) || this.mapTarget(st);
        const primary = this.btns.querySelector('.btn-primary');
        if (primary) primary.focus({ preventScroll: true });
        else if (target) {
          target.scrollIntoView({ block: 'nearest' });
          (target.matches('button') ? target : target.querySelector('button') || target).focus({ preventScroll: true });
          // no mapa o leitor fala a casa ao receber o foco; a instrução do Capitão vem logo depois
          if (target.classList.contains('a11y-cell') && st.text) setTimeout(() => game.announce(`Capitão diz: ${st.text()}`), 350);
        }
      }, 60);
    }

    toggleFaq(st, btn) {
      const open = this.faqEl.hidden;
      if (open) {
        this.faqEl.innerHTML = `<h3 class="m-faq-h">Dúvidas</h3>` + FAQ_STEP[st.id].map(([q, a]) =>
          `<div class="m-faq-item"><p class="m-faq-q">${esc(q)}</p><p class="m-faq-a">${esc(a)}</p></div>`).join('') +
          `<p class="m-faq-more">Mais dúvidas: aba Ajuda, em "Dúvidas frequentes".</p>`;
      }
      this.faqEl.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Fechar dúvidas' : 'Dúvida?';
      this.position();
      if (open) { this.faqEl.focus({ preventScroll: true }); this.faqEl.scrollIntoView({ block: 'nearest' }); }
    }

    /* ---------- demonstração animada: mouse/toque ou teclado ---------- */
    renderDemo(st) {
      clearInterval(this.demoTimer);
      const kind = DEMO_STEP[st.id];
      if (!kind || this.mode !== 'mission') { this.demoEl.hidden = true; this.demoEl.innerHTML = ''; return; }
      const input = this.demoInput || (game.state.settings.screenReader ? 'keyboard' : this.inputKind);
      const how = {
        place: { mouse: 'Passe o mouse no seu oceano. Quando o navio ficar VERDE, clique.', keyboard: 'Setas andam com o navio. R gira. Enter coloca. (Ou G e digite a casa.)' },
        fire: { mouse: 'Clique numa casa do oceano do computador para atirar.', keyboard: 'Setas escolhem a casa. Enter atira. (Ou G e digite a casa.)' }
      }[kind];
      this.demoEl.hidden = false;
      this.demoEl.innerHTML = `
        <div class="m-demo-head">
          <span class="m-demo-label" id="gdmDemoLabel">Veja como fazer</span>
          <div class="m-demo-switch" role="group" aria-labelledby="gdmDemoLabel">
            <button type="button" data-in="mouse" aria-pressed="${input === 'mouse'}">Mouse ou toque</button>
            <button type="button" data-in="keyboard" aria-pressed="${input === 'keyboard'}">Teclado</button>
          </div>
        </div>
        <div class="m-demo-stage" aria-hidden="true">
          <div class="dg">${'<i></i>'.repeat(18)}</div>
          <div class="dg-ship"></div><div class="dg-mark"></div>
          <svg class="dg-cursor" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L10 19z"/></svg>
          <div class="dg-ripple"></div>
          <div class="dg-keys">${['←', '↑', '↓', '→', kind === 'place' ? 'R' : '', 'Enter'].filter(Boolean).map(k => `<kbd data-k="${k}">${k}</kbd>`).join('')}</div>
        </div>
        <p class="m-demo-cap">${esc(how[input])}</p>`;
      this.demoEl.querySelectorAll('[data-in]').forEach(b => b.addEventListener('click', () => {
        this.demoInput = b.dataset.in; game.audio.play('click'); this.renderDemo(st);
        this.demoEl.querySelector(`[data-in="${b.dataset.in}"]`).focus();
        game.announce(how[b.dataset.in]);
      }));
      this.playDemo(kind, input);
    }

    playDemo(kind, input) {
      const stage = this.demoEl.querySelector('.m-demo-stage');
      const ship = stage.querySelector('.dg-ship'), mark = stage.querySelector('.dg-mark');
      const cur = stage.querySelector('.dg-cursor'), rip = stage.querySelector('.dg-ripple');
      stage.classList.toggle('is-kb', input === 'keyboard');
      stage.classList.toggle('is-fire', kind === 'fire');
      const at = (el, col, row) => { el.style.setProperty('--c', col); el.style.setProperty('--r', row); };
      const key = k => { stage.querySelectorAll('kbd').forEach(x => x.classList.toggle('on', x.dataset.k === k)); };
      const set = (cls) => { ship.className = 'dg-ship ' + cls; };
      let frames;
      if (kind === 'place' && input === 'mouse') frames = [
        () => { set('ghost'); at(ship, 4, 0); at(cur, 5, 0); rip.className = 'dg-ripple'; },
        () => { set('bad'); at(ship, 4, 1); at(cur, 4.6, 1); },
        () => { set('good'); at(ship, 1, 1); at(cur, 1.6, 1); },
        () => { rip.className = 'dg-ripple go'; at(rip, 1.6, 1); },
        () => { set('placed'); },
        () => {}
      ];
      else if (kind === 'place') frames = [
        () => { set('good'); at(ship, 0, 0); key(''); },
        () => { key('→'); at(ship, 1, 0); },
        () => { key('↓'); at(ship, 1, 1); },
        () => { key('→'); at(ship, 2, 1); },
        () => { key('Enter'); set('placed'); },
        () => { key(''); }
      ];
      else if (input === 'mouse') frames = [
        () => { mark.className = 'dg-mark'; at(cur, 5, 2); rip.className = 'dg-ripple'; set('none'); },
        () => { at(cur, 3.6, 1); at(mark, 3, 1); mark.className = 'dg-mark aim'; },
        () => { rip.className = 'dg-ripple go'; at(rip, 3.6, 1); },
        () => { mark.className = 'dg-mark hit'; },
        () => {}
      ];
      else frames = [
        () => { set('none'); at(mark, 1, 0); mark.className = 'dg-mark aim'; key(''); },
        () => { key('→'); at(mark, 2, 0); },
        () => { key('↓'); at(mark, 2, 1); },
        () => { key('→'); at(mark, 3, 1); },
        () => { key('Enter'); mark.className = 'dg-mark hit'; },
        () => { key(''); }
      ];
      if (game.state.settings.reduceMotion) { frames.forEach(f => f()); return; }
      let i = 0;
      frames[0]();
      this.demoTimer = setInterval(() => { i = (i + 1) % frames.length; frames[i](); }, 900);
    }

    // Etapas no mapa: o foco vai para a casa do mapa acessível (teclado e leitor de tela).
    mapTarget(st) {
      if (!st || !st.target || st.target.dom || !game.a11y || st.buttons) return null;
      return game.a11y.cursorCell();
    }

    domTarget(st) {
      if (!st || !st.target || !st.target.dom) return null;
      const el = $(st.target.dom);
      return el && el.offsetParent !== null ? el : null;
    }

    targetRect(st) {
      const t = st && st.target;
      if (!t) return null;
      if (t.dom) {
        const el = this.domTarget(st);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 };
      }
      const g = game.geom, c = canvasRect();
      const clip = rr => {
        const left = Math.max(c.left, rr.x), top = Math.max(c.top, rr.y);
        const right = Math.min(c.left + (g.playW || c.width), rr.x + rr.w), bottom = Math.min(c.top + (g.playH || c.height), rr.y + rr.h);
        return right - left < 12 || bottom - top < 12 ? null : { x: left, y: top, w: right - left, h: bottom - top };
      };
      const ox = c.left, oy = c.top;
      if (t.board) return clip({ x: ox + game.zoneX(0) - 30, y: oy + g.gy - 34, w: game.zoneX(2) + g.cell * 10 - game.zoneX(0) + 60, h: g.gh + 44 });
      if (t.cols !== undefined) return clip({ x: ox + game.zoneX(t.cols) - 4, y: oy + g.gy - Math.max(26, g.cell * 0.7), w: g.cell * 10 + 8, h: Math.max(24, g.cell * 0.68) });
      if (t.rows !== undefined) return clip({ x: ox + game.zoneX(t.rows) - Math.max(30, g.cell * 0.8), y: oy + g.gy - 2, w: Math.max(28, g.cell * 0.78), h: g.cell * 10 + 4 });
      if (t.cell) { const [row, col] = t.cell; return clip({ x: ox + game.colX(col) - 4, y: oy + game.rowY(row) - 4, w: g.cell + 8, h: g.cell + 8 }); }
      if (t.zone) { const z = t.zone(); return clip({ x: ox + game.zoneX(z) - 30, y: oy + g.gy - 34, w: g.cell * 10 + 60, h: g.gh + 44 }); }
      return null;
    }

    position() {
      const st = this.step();
      if (!this.active || !st || this.el.hidden) return;
      const modal = game.state.modal;
      const hide = st.hidden || this.handoffOpen || (modal && (modal.type !== 'help' || this.mode !== 'mission'));
      this.el.classList.toggle('is-waiting', !!hide);
      if (hide) return;
      const W = window.innerWidth, H = window.innerHeight;
      const r = this.targetRect(st);
      const set = (el, x, y, w, h) => { el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.width = `${Math.max(0, w)}px`; el.style.height = `${Math.max(0, h)}px`; };
      const [top, left, right, bottom] = this.shades;
      const open = st.light || st.passive || st.open;
      if (open) this.shades.forEach(s => set(s, 0, 0, 0, 0));
      else if (r) {
        set(top, 0, 0, W, r.y); set(bottom, 0, r.y + r.h, W, H - r.y - r.h);
        set(left, 0, r.y, r.x, r.h); set(right, r.x + r.w, r.y, W - r.x - r.w, r.h);
      } else { set(top, 0, 0, W, H); set(left, 0, 0, 0, 0); set(right, 0, 0, 0, 0); set(bottom, 0, 0, 0, 0); }
      this.ring.style.display = r ? 'block' : 'none';
      if (r) set(this.ring, r.x, r.y, r.w, r.h);
      // seta apontando para o alvo
      this.arrow.style.display = r && !st.guides ? 'block' : 'none';
      if (r) {
        const above = r.y > 56;
        this.arrow.classList.toggle('is-up', !above);
        this.arrow.style.left = `${r.x + r.w / 2 - 18}px`;
        this.arrow.style.top = `${above ? r.y - 46 : r.y + r.h + 8}px`;
      }
      // guias da coordenada A1
      const showGuides = !!st.guides && r;
      this.guideCol.style.display = showGuides ? 'flex' : 'none';
      this.guideRow.style.display = showGuides ? 'flex' : 'none';
      if (showGuides) {
        this.guideCol.style.left = `${r.x + r.w / 2 - 18}px`; this.guideCol.style.top = `${r.y - 70}px`;
        this.guideRow.style.left = `${r.x + r.w + 6}px`; this.guideRow.style.top = `${r.y + r.h / 2 - 18}px`;
      }
      if (st.noBubble) { this.hero.style.display = 'none'; this.villain.style.display = 'none'; return; }
      this.placeCharacters(st, r, W, H);
    }

    // Capitão da cintura para cima no canto de baixo, cartão de fala ao lado (nunca sobre o alvo).
    placeCharacters(st, r, W, H) {
      const b = this.bubble, m = 20;
      const overlaps = (a, c) => c && a.x < c.x + c.w && a.x + a.w > c.x && a.y < c.y + c.h && a.y + a.h > c.y;
      const SHOW = 0.55;
      let vis = st.small ? Math.min(H * 0.26, 170) : st.light ? Math.min(H * 0.36, 250) : st.big ? Math.min(H * 0.62, 480) : Math.min(H * 0.54, 420);
      vis = Math.min(vis, (st.villain ? 0.3 : 0.32) * W / HERO_RATIO * SHOW);
      const side = st.villain ? 'left' : (r && r.x + r.w / 2 < W / 2 ? 'right' : 'left');
      let hero;
      for (;;) {
        const full = vis / SHOW, w = full * HERO_RATIO;
        hero = { x: side === 'left' ? 0 : W - w, y: H - vis, w, h: vis, full };
        if (!overlaps(hero, r) || vis <= H * 0.2) break;
        vis *= 0.85;
      }
      const showHero = this.heroOk && !overlaps(hero, r) && hero.w >= 80;
      this.hero.style.display = showHero ? 'block' : 'none';
      this.hero.classList.toggle('is-flip', side === 'right');
      Object.assign(this.hero.style, { left: `${hero.x}px`, top: `${hero.y}px`, height: `${hero.full}px`, width: `${hero.w}px` });
      if (st.villain && showHero) Object.assign(this.villain.style, { display: 'block', left: `${W - hero.w}px`, top: `${hero.y}px`, height: `${hero.full}px`, width: `${hero.w}px` });
      else this.villain.style.display = 'none';
      const leftEdge = showHero && (side === 'left' || st.villain) ? hero.w * 0.92 : m;
      const rightEdge = showHero && (side === 'right' || st.villain) ? W - hero.w * 0.92 : W - m;
      const maxW = Math.min(st.small ? 360 : st.light ? 460 : 580, rightEdge - leftEdge - m);
      b.style.width = `${Math.max(260, maxW)}px`;
      const bw = b.offsetWidth, bh = b.offsetHeight;
      let x = st.villain || !showHero ? (W - bw) / 2 : side === 'left' ? leftEdge : rightEdge - bw;
      let y = showHero || r ? H - bh - m : (H - bh) / 2;
      x = Math.min(W - bw - 12, Math.max(12, x));
      if (overlaps({ x, y, w: bw, h: bh }, r)) {
        const above = r.y - bh - m, below = r.y + r.h + m;
        if (above >= 12) y = above; else if (below + bh <= H - 12) y = below; else y = 12;
        if (overlaps({ x, y, w: bw, h: bh }, r)) x = r.x + r.w / 2 < W / 2 ? Math.min(W - bw - 12, r.x + r.w + m) : Math.max(12, r.x - bw - m);
      }
      b.style.left = `${Math.round(x)}px`; b.style.top = `${Math.round(Math.max(12, y))}px`;
    }

    /* ---------- troca de jogador (2 jogadores) ---------- */

    buildHandoff() {
      const h = document.createElement('div');
      h.id = 'gdmHandoff';
      h.className = 'handoff';
      h.hidden = true;
      h.setAttribute('role', 'dialog');
      h.setAttribute('aria-modal', 'true');
      h.setAttribute('aria-labelledby', 'gdmHandoffTitle');
      h.innerHTML = `
        <img class="handoff-hero" src="${HERO_PNG}" alt="">
        <div class="handoff-card">
          <p class="m-name"><span class="m-name-tag">Capitão Maré</span></p>
          <h2 id="gdmHandoffTitle"></h2>
          <p class="handoff-text"></p>
          <button type="button" class="btn btn-primary handoff-btn"></button>
        </div>`;
      document.body.appendChild(h);
      this.handoff = h;
      this.handoffTitle = h.querySelector('h2');
      this.handoffText = h.querySelector('.handoff-text');
      this.handoffBtn = h.querySelector('.handoff-btn');
      h.querySelector('.handoff-hero').addEventListener('error', e => { e.target.style.display = 'none'; });
      this.handoffBtn.addEventListener('click', () => { game.audio.play('click'); game.acceptHandoff(); });
    }

    syncHandoff() {
      const m = game.state.modal;
      const open = !!m && m.type === 'handoff';
      if (open && this.handoffKey !== m.openedAt) {
        this.handoffKey = m.openedAt;
        this.handoffTitle.textContent = m.title.toUpperCase();
        this.handoffText.textContent = m.detail;
        this.handoffBtn.textContent = `SOU O ${game.ownerLabel(m.owner).toUpperCase()}`;
        this.handoff.dataset.team = m.owner;
        setTimeout(() => this.handoffBtn.focus(), 50);
      }
      if (open !== this.handoffOpen) { this.handoffOpen = open; this.handoff.hidden = !open; }
    }

    confetti() {
      if (game.state.settings.reduceMotion) return;
      const box = document.createElement('div');
      box.className = 'm-confetti'; box.setAttribute('aria-hidden', 'true');
      const colors = ['#e2b33d', '#2f6fb5', '#cf5a43', '#2a9184'];
      for (let i = 0; i < 36; i++) {
        const p = document.createElement('i');
        p.style.left = `${Math.random() * 100}%`;
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = `${Math.random() * 0.6}s`;
        box.appendChild(p);
      }
      document.body.appendChild(box);
      setTimeout(() => box.remove(), 3200);
    }
  }

  new CaptainTutorial();
})();
