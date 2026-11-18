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
  // Expressões: assets/img/ui/capitao_<humor>.png e vilao_<humor>.png. Sem o arquivo, usa a imagem padrão.
  const MOODS = { capitao: ['feliz', 'medo', 'bravo', 'surpreso', 'pensando', 'comemorando'], vilao: ['rindo', 'bravo', 'medo', 'chorando', 'surpreso', 'convencido'] };
  const moodOk = {};
  for (const [who, list] of Object.entries(MOODS)) for (const m of list) {
    const im = new Image(); im.onload = () => { moodOk[`${who}_${m}`] = true; }; im.src = `assets/img/ui/${who}_${m}.png`;
  }
  const pic = (who, mood) => mood && moodOk[`${who}_${mood}`] ? `assets/img/ui/${who}_${mood}.png` : (who === 'vilao' ? VILLAIN_PNG : HERO_PNG);
  const HERO_RATIO = 671 / 900;
  const IDLE_HINT_MS = 8000;
  const IDLE_POINT_MS = 16000;

  const ICON = {
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M5 12l7 7 7-7"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M12 5l-7 7 7 7"/></svg>'
  };
  // Dúvidas de cada etapa do tutorial (botão "Dúvida?").
  const FAQ_STEP = {
    moveSel: [['Por que preciso andar?', 'Cada canhão só atira até uma distância. Chegando mais perto do oceano do pirata, seus tiros alcançam os navios dele.']],
    moveAct: [['Quanto cada navio anda?', 'Destroier anda 3 casas, Cruzador e Encouraçado andam 2, e o Lança-Armadilhas anda 1.']],
    moveGo: [['Posso andar na diagonal?', 'Não: o navio anda em linha reta, para cima, para baixo, para a esquerda ou para a direita.'], ['E pelo teclado?', 'Use as setas até uma casa verde e aperte Enter.']],
    hello: [['Preciso saber jogar batalha naval?', 'Não! O Capitão mostra tudo, passo por passo. É só seguir o quadro.'],
      ['Posso sair do tutorial?', 'Pode. Use "Pular tutorial". Para ver de novo depois: aba Ajuda, botão "Rever tutorial".']],
    villain: [['Quem joga pelo Barba-Rubra?', 'O computador. Ele escolhe as jogadas sozinho e não espia onde estão os seus navios.']],
    map: [['Quais são os três oceanos?', 'À esquerda fica o SEU oceano, onde você esconde seus navios. No meio fica o Oceano Neutro, onde todos podem navegar. À direita fica o oceano do Barba-Rubra, com os navios dele escondidos.']],
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
      ['Tenho que colocar todos?', 'Sim: todos os navios da lista. A batalha só começa com a frota completa.']],
    ready: [['O que acontece quando aperto PRONTO?', 'A batalha começa! Na batalha seus navios podem navegar com a ação MOVER.']],
    battle: [['Quantas jogadas faço na minha vez?', 'Cada navio pode agir uma vez. Quando terminar, aperte PASSAR A VEZ.']],
    select: [['Por que não posso escolher o Lança-Armadilhas aqui?', 'Ele não tem canhões: ele esconde minas. Neste treino vamos atirar, então escolha um navio com canhões.'],
      ['E pelo teclado?', 'Use as setas até o navio e aperte Enter.']],
    chest: [['Como pego um baú?', 'Escolha um navio, escolha MOVER e leve o navio até a casa do baú. O prêmio aparece na hora.'], ['Que prêmios tem?', 'Balas novas para atirar, conserto de parte da vida do navio, ou uma luneta que mostra onde está um navio do Barba-Rubra.']],
    action: [['O que cada ação faz?', 'ATACAR atira numa casa dentro do alcance. MOVER navega em linha reta. ARMADILHA esconde uma mina. ANALISAR decifra um "?" do radar.'],
      ['Onde ficam as ações?', 'Em dois lugares: nos botões redondos que aparecem em volta do navio quando você toca nele, no mapa, e nos botões do painel. Os dois fazem a mesma coisa.'],
      ['Tem atalho?', 'A tecla 1 escolhe Atacar, a tecla 2 Mover, a tecla 3 Armadilha e a tecla 4 Analisar.']],
    fire: [['Onde eu atiro?', 'Nas casas clarinhas: é até onde o canhão do navio alcança. Para atirar mais longe, chegue mais perto com MOVER.'],
      ['E pelo teclado?', 'Use as setas para escolher a casa e Enter para atirar. Ou aperte G e digite a casa.']],
    shotResult: [['Como sei se acertei?', 'Fogo e "ACERTO!" quer dizer que pegou um navio. Respingo e "ÁGUA!" quer dizer que não tinha nada ali.']],
    radar: [['Para que servem as perguntas?', 'O radar mostra "?" perto dos seus navios. Acertando a pergunta, você descobre se é um navio ou uma armadilha.'],
      ['E se eu errar?', 'Não tem problema: você vê a resposta certa com a explicação e aprende para a próxima.']],
    radarResult: [['Quando aparecem os "?"', 'Quando o radar de um navio seu percebe algo por perto.']],
    end: [['Qual é a tecla para passar a vez?', 'Espaço. Ou o botão PASSAR A VEZ no painel.']],
    done: [['Onde vejo as dúvidas depois?', 'Na aba Ajuda, em "Dúvidas frequentes". F1 abre o Guia do Capitão.']]
  };
  // Etapas que ganham a demonstração animada (mouse/toque ou teclado).
  const DEMO_STEP = { place: 'place', fire: 'fire', moveGo: 'move' };

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

    // Tutorial: garante um “?” de verdade perto da frota (um navio do pirata chega pelo Oceano Neutro).
    forceContact() {
      const st = game.state, me = 'player1', foe = 'player2', L = GDM_LOGIC;
      const known = game.radarContacts().find(c => !c.revealed && c.type === 'ship');
      if (known) { this.data.contact = known; return true; }
      const mine = st.ships[me].filter(x => !x.destroyed);
      const foes = st.ships[foe].filter(x => !x.destroyed).sort((a, b) => a.size - b.size);
      const enemy = foes[0];
      if (!enemy || !mine.length) return false;
      let best = null;
      for (const ori of ['horizontal', 'vertical']) for (let row = 0; row < 10; row++) for (let col = 10; col <= 19; col++) {
        const cells = L.cells(row, col, enemy.size, ori);
        if (cells.some(c => c.row > 9 || c.col > 19)) continue;
        if (cells.some(c => { const o = L.shipAt(st, c.row, c.col); return (o && o !== enemy) || L.trapAt(st, c.row, c.col) || (st.chests || []).some(h => !h.taken && h.row === c.row && h.col === c.col); })) continue;
        const d = Math.min(...mine.map(x => Math.min(...cells.map(c => L.distanceToShip(c, x)))));
        if (d >= 1 && d <= GDM_CONFIG.radar.radius && (!best || d > best.d)) best = { row, col, d, ori };
      }
      if (!best) return false;
      Object.assign(enemy, { row: best.row, col: best.col, orientation: best.ori });
      L.refresh(enemy);
      game.computeRadar(me);
      this.data.contact = game.radarContacts().find(c => !c.revealed && c.type === 'ship');
      return !!this.data.contact;
    }

    locksBoard() {
      if (!this.active || this.mode !== 'mission') return false;
      const st = this.step();
      return !!st && (!st.wait || st.id === 'pick');
    }

    avatar() { return this.faceOk ? FACE_PNG : ''; }
    completed() { try { return localStorage.getItem(DONE_KEY) === '1'; } catch (_e) { return false; } }
    markDone() { try { localStorage.setItem(DONE_KEY, '1'); } catch (_e) {} }

    waitForGame() {
      const tick = () => {
        if (game.state.phase === 'placement' && game.assetsReady && !game.titleOpen) { if (!this.completed() && game.state.settings.tutorialAuto !== false) setTimeout(() => { if (!this.active && !this.suppressAuto) this.start(); }, 350); return; }
        setTimeout(tick, 200);
      };
      tick();
    }

    human() { return game.isAiMode() ? 'player1' : game.currentOwner(); }
    zoneOf(owner) { return owner === 'player1' ? 0 : 2; }

    /* ---------- etapas ---------- */

    steps() {
      const human = () => this.human();
      // há algum navio com canhão que já alcança o mar fora do nosso oceano?
      const canShoot = () => game.state.ships[human()].some(sh => !sh.destroyed && sh.chargeType === 'missile' && sh.availableCharges > 0 && game.hasAttackCells(sh));
      const enemyZone = () => this.zoneOf(game.isAiMode() ? 'player2' : (game.state.turn === 'player1' ? 'player2' : 'player1'));
      return [
        { id: 'hello', title: 'OLÁ, MARUJO!', big: true, mood: 'feliz',
          text: () => 'Ahoy! Eu sou o Capitão Maré! Que bom que você chegou! Os mares estavam tão calminhos... até agora.',
          text2: () => 'Eu vou ficar com você nessa primeira missão e mostrar tudo, passo por passo!',
          buttons: [['VAMOS LÁ!', () => this.next(), 'primary'], ['JÁ SEI JOGAR', () => this.skip(), 'soft']] },
        { id: 'ask', title: 'UMA PERGUNTA, MARUJO', mood: 'pensando',
          text: () => 'Antes de começar: você vai jogar usando só o teclado, ou com um leitor de tela, como o Narrador do Windows?',
          text2: () => 'Se sim, eu explico as teclas primeiro. Se não, vamos direto para a aventura!',
          buttons: [['SIM, TECLADO OU LEITOR DE TELA', () => this.chooseA11y(true), 'primary'], ['NÃO, VOU USAR O MOUSE OU O DEDO', () => this.chooseA11y(false), 'soft']] },
        { id: 'villain', title: 'QUEM VEM LÁ?', villain: true, speaker: 'villain', villainMood: 'rindo', skip: () => !game.isAiMode(),
          enter: () => game.audio.play('tutorialNext'),
          text: () => 'HA HA HA! Eu sou o Barba-Rubra, o pirata mais malvado dos sete mares! Vou afundar todos os seus barquinhos, um por um!',
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'scared', title: 'GLUP...', villain: true, mood: 'medo', villainMood: 'convencido', skip: () => !game.isAiMode(),
          text: () => 'Glup... ele é bem assustador, né? Minhas pernas estão tremendo! Mas eu sei de um segredo...',
          buttons: [['QUAL SEGREDO?', () => this.next(), 'primary']] },
        { id: 'brave', title: 'CORAGEM!', villain: true, mood: 'bravo', villainMood: 'surpreso', skip: () => !game.isAiMode(),
          text: () => 'Com você no comando, a gente fica corajoso! Ei, Barba-Rubra: deixa os nossos mares em paz!',
          buttons: [['ISSO AÍ!', () => this.next(), 'primary']] },
        { id: 'villainMad', title: 'ARRR!', villain: true, speaker: 'villain', mood: 'bravo', villainMood: 'bravo', skip: () => !game.isAiMode(),
          text: () => 'Corajosos? ARRR! Vocês nem sabem onde estão os meus navios! Vamos ver quem ri por último!',
          buttons: [['VAMOS VENCER ELE!', () => this.next(), 'primary']] },
        { id: 'map', title: 'CONHEÇA O MAPA', mood: 'feliz', target: { board: true }, enter: () => game.resetCamera(),
          text: () => `Primeiro, vamos estudar o mapa, como todo bom capitão! À esquerda fica o ${GDM_LOGIC.zoneNames.player1}, no meio o Oceano Neutro e à direita o ${GDM_LOGIC.zoneNames.player2}.`,
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'cols', title: 'CONHEÇA O MAPA', target: { cols: 0 },
          text: () => 'As LETRAS ficam em cima e mostram as colunas. Elas andam na HORIZONTAL, da esquerda para a direita: A, B, C... até J.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'rows', title: 'CONHEÇA O MAPA', target: { rows: 0 },
          text: () => 'Os NÚMEROS ficam do lado e mostram as linhas. Eles andam na VERTICAL, de cima para baixo: 1, 2, 3... até 10.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'a1', title: 'CONHEÇA O MAPA', target: { cell: [0, 0] }, guides: true,
          text: () => 'Juntando a letra e o número temos o endereço da casa: a coordenada! Coluna A + linha 1 = A1, a casa do canto de cima, à esquerda. C7 seria 3 casas para a direita e 7 para baixo.',
          buttons: [['ENTENDI!', () => this.next(), 'primary']] },
        { id: 'pick', title: 'MONTE SUA FROTA', target: { dom: '#gdmTabPanel-game .ships' },
          enter: () => { if (game.panel) game.panel.setTab('game'); },
          text: () => 'Antes da batalha, precisamos esconder nossos navios. Escolha qualquer navio aqui.',
          wait: ev => ev.name === 'selectShip' || game.fleetReady(human()) },
        { id: 'place', title: 'MONTE SUA FROTA', target: { zone: () => 0 }, legend: true,
          enter: () => this.suggestCell(),
          text: () => `Boa escolha! Agora toque numa casa do seu oceano onde o navio aparece VERDE. Eu marquei uma casa boa para você.`,
          wait: ev => (ev.name === 'placeShip' && ev.data) || game.fleetReady(human()),
          fail: ev => ev.name === 'placeFail' ? 'Ops! Esse navio não cabe aí. Procure uma área verde.' : null,
          leave: () => { game.hintCell = null; },
          done: () => this.cheer('Muito bem!') },
        { id: 'rotate', title: 'GIRAR O NAVIO', target: { dom: '[data-key="rotate"]' },
          text: () => 'Também podemos girar nossos navios. Aperte GIRAR (tecla R).',
          wait: ev => ev.name === 'rotate' || game.fleetReady(human()), done: () => this.cheer('Perfeito! Navios podem ficar em pé ou deitados.') },
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
        { id: 'select', skip: () => !canShoot() && !this.data.fired, title: 'PASSO 1 · ESCOLHA UM NAVIO', target: { zone: () => this.zoneOf(game.state.turn) },
          enter: () => game.focusZone(this.zoneOf(game.state.turn), true),
          text: () => 'Primeiro escolha um navio que ainda pode agir. Toque em um dos SEUS navios com canhões (Encouraçado, Cruzador ou Destroier).',
          wait: ev => ev.name === 'battleSelect' && ev.data && ev.data.ship.chargeType === 'missile' && ev.data.ship.availableCharges > 0 && game.hasAttackCells(ev.data.ship),
          fail: ev => {
            if (ev.name !== 'battleSelect' || !ev.data) return null;
            const sh = ev.data.ship;
            if (!(sh.chargeType === 'missile' && sh.availableCharges > 0)) return 'Esse navio não tem canhões. Para o treino, escolha o Encouraçado, o Cruzador ou um Destroier.';
            if (!game.hasAttackCells(sh)) return 'Esse navio está muito no fundo e o canhão não alcança. Escolha um navio com canhões mais para a direita!';
            return null;
          } },
        { id: 'action', skip: () => !canShoot() && !this.data.fired, title: 'PASSO 2 · ESCOLHA UMA AÇÃO', target: { dom: '[data-key="act:attack"]' }, open: true,
          text: () => 'Agora escolha ATACAR. Você pode escolher de dois jeitos: no MAPA, tocando no botão vermelho ATACAR que apareceu em volta do navio, ou aqui no PAINEL, no botão Atacar. No teclado, é a tecla 1.',
          wait: ev => ev.name === 'chooseAction' && game.state.action === 'attack',
          fail: ev => ev.name === 'chooseAction' && game.state.action !== 'attack' ? 'Nesse treino, vamos usar ATACAR. Toque em Cancelar e depois no botão vermelho Atacar.' : null },
        { id: 'fire', skip: () => !canShoot() && !this.data.fired, title: 'PASSO 3 · ESCOLHA NO MAPA', target: { board: true }, enter: () => game.focusZone(1, true),
          text: () => 'Cada canhão tem um alcance. As casas CLARINHAS são onde ele consegue atirar. Toque numa casa clarinha!',
          wait: ev => ev.name === 'actionDone' && ev.data && ev.data.type === 'attack',
          done: ev => { this.data.hit = !!(ev.data && ev.data.hit); this.data.fired = true; } },
        { id: 'shotResult', mood: () => this.data.hit ? 'comemorando' : 'surpreso', skip: () => !canShoot() && !this.data.fired, title: () => this.data.hit ? 'ACERTO!' : 'ÁGUA!', light: true,
          text: () => this.data.hit ? 'Na mosca, capitão! Cada acerto tira vida do navio inimigo.' : 'Splash! Ali só tinha água. Os navios do pirata estão mais longe, no oceano da direita.',
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'chest', title: 'BAÚS DO TESOURO!', mood: 'surpreso', target: { zone: () => 1 }, skip: () => !(game.state.chests || []).some(c => !c.taken),
          enter: () => game.focusZone(1, true),
          text: () => 'Olha só! Essas caixinhas marrons no Oceano Neutro são BAÚS DO TESOURO! Leve um navio seu até a casa do baú e ele ganha um prêmio surpresa: balas novas, conserto do navio ou uma luneta que mostra um navio do pirata.',
          text2: () => 'Mas seja rápido: o Barba-Rubra também quer os baús!',
          buttons: [['QUERO UM BAÚ!', () => this.next(), 'primary']] },
        { id: 'moveSel', title: 'CHEGUE MAIS PERTO!', target: { zone: () => this.zoneOf(game.state.turn) },
          enter: () => game.focusZone(this.zoneOf(game.state.turn), true),
          text: () => 'Agora vamos navegar! Assim chegamos mais perto do pirata, ou de um baú. Escolha OUTRO navio seu, que ainda não jogou.',
          wait: ev => ev.name === 'battleSelect' && ev.data && !ev.data.ship.turnLocked,
          fail: ev => ev.name === 'battleSelect' && ev.data && ev.data.ship.turnLocked ? 'Esse navio já jogou nesta vez. Escolha outro!' : null },
        { id: 'moveAct', title: 'MOVER', target: { dom: '[data-key="act:move"]' }, open: true,
          text: () => 'Agora escolha MOVER: no botão verde em volta do navio, no mapa, ou no botão Mover do painel (tecla 2). Navios pequenos andam mais: o Destroier anda 3 casas!',
          wait: ev => ev.name === 'chooseAction' && game.state.action === 'move',
          fail: ev => ev.name === 'chooseAction' && game.state.action !== 'move' ? 'Agora vamos usar MOVER. Toque em Cancelar e depois em Mover.' : null },
        { id: 'moveGo', title: 'MOVER', target: { board: true },
          text: () => 'Toque numa casa VERDE para o navio andar até lá. O navio vira para o lado em que anda! Ir para a direita deixa você mais perto do pirata.',
          wait: ev => ev.name === 'actionDone' && ev.data && ev.data.type === 'move',
          done: () => this.cheer('Vrum! Navegando!') },
        { id: 'trapInfo', title: 'O LANÇA-ARMADILHAS', mood: 'pensando', target: { dom: '#gdmTabPanel-game .ships' },
          text: () => 'Sabe o nosso maior navio, o LANÇA-ARMADILHAS? Ele não atira: ele esconde MINAS no mar, até 7 casas longe dele, no nosso oceano ou no Oceano Neutro.',
          text2: () => 'Se um navio do pirata passar por cima de uma mina: BUM! 1500 de dano! Para usar: escolha o Lança-Armadilhas, depois ARMADILHA (tecla 3) e toque numa casa. Cuidado: o Barba-Rubra também esconde minas!',
          buttons: [['QUE ESPERTO!', () => this.next(), 'primary']] },
        { id: 'contact', title: 'BIP, BIP! O RADAR!', mood: 'surpreso', skip: () => !game.questionsLoaded,
          enter: () => { this.data.live = this.forceContact(); if (this.data.live) game.focusZone(1, true); },
          target: { cell: () => this.data.contact ? [this.data.contact.row, this.data.contact.col] : null },
          text: () => this.data.live
            ? 'Olha esse “?” no mapa! O radar achou alguma coisa perto do nosso navio. Pode ser um navio do Barba-Rubra... ou uma MINA escondida!'
            : 'O radar acha sinais misteriosos “?” perto dos nossos navios. Pode ser um navio do Barba-Rubra... ou uma MINA escondida!',
          text2: () => 'Se você atirar sem saber o que é, pode gastar a bala numa bomba! Por isso, primeiro a gente ANALISA: responde uma pergunta e descobre o que é.',
          buttons: [['VAMOS ANALISAR!', () => this.next(), 'primary']] },
        { id: 'anSel', title: 'ANALISAR · ESCOLHA UM NAVIO', mood: 'pensando', target: { board: true }, skip: () => !this.data.live,
          text: () => 'Escolha o navio seu que está MAIS PERTO do “?”. O radar dele alcança até 5 casas.',
          wait: ev => ev.name === 'battleSelect' && ev.data },
        { id: 'anAct', title: 'ANALISAR · ESCOLHA A AÇÃO', target: { dom: '[data-key="act:analyze"]' }, open: true, skip: () => !this.data.live,
          text: () => 'Agora escolha ANALISAR: no botão azul com a lupa, em volta do navio, ou no painel. No teclado, é a tecla 4.',
          wait: ev => ev.name === 'analyzeMode' },
        { id: 'anGo', title: 'ANALISAR · TOQUE NO “?”', target: { board: true }, skip: () => !this.data.live,
          text: () => 'Toque no “?” no mapa e responda: a frase é VERDADEIRA ou FALSA?',
          wait: ev => ev.name === 'answerRight' || ev.name === 'answerWrong',
          done: ev => { this.data.correct = ev.name === 'answerRight'; } },
        { id: 'radar', title: 'O RADAR', mood: 'pensando', target: { dom: '[data-tab="radar"]' }, skip: () => !game.questionsLoaded || this.data.live,
          text: () => 'Vamos treinar com um sinal de mentirinha. Responda se a frase é VERDADEIRA ou FALSA!',
          buttons: [['DECIFRAR SINAL', () => { if (!game.openPracticeQuestion()) this.next(); }, 'primary']],
          wait: ev => ev.name === 'practiceClosed' },
        { id: 'radarResult', mood: () => this.data.correct ? 'comemorando' : 'feliz', title: () => this.data.correct ? 'EXCELENTE!' : 'QUASE!', light: true,
          text: () => {
            if (!this.data.live) return this.data.correct ? 'Você decifrou o sinal! Na batalha, acertar a frase mostra se o “?” é um navio ou uma mina.' : 'Essa era difícil, mas agora você já sabe! Na batalha, acertar a frase mostra se o “?” é um navio ou uma mina.';
            return this.data.correct
              ? 'Você decifrou! Era um NAVIO do Barba-Rubra! Agora ele aparece no mapa e você sabe exatamente onde atirar. E ainda ganhou uma bala extra!'
              : 'Ops, essa frase era difícil! O “?” continua um mistério. Na próxima vez você analisa de novo: lembre, nunca atire no escuro!';
          },
          buttons: [['CONTINUAR', () => this.next(), 'primary']] },
        { id: 'end', title: 'PASSAR A VEZ', target: { dom: '[data-key="end"]' },
          text: () => 'Quando terminar suas jogadas, aperte PASSAR A VEZ (tecla Espaço).',
          wait: ev => ev.name === 'endTurn' },
        { id: 'watch', hidden: true, wait: ev => ev.name === 'turnStart' },
        { id: 'done', title: 'MISSÃO CUMPRIDA!', mood: 'comemorando', villain: true, villainMood: 'medo',
          enter: () => { game.audio.play('win'); this.confetti(); this.markDone(); game.achieve('tutorial', 'MARUJO TREINADO!', 'Você terminou o tutorial'); },
          text: () => 'Você já sabe jogar, capitão! Olha só: o Barba-Rubra já está com medo de você! Se ficar em dúvida, olhe o quadro AGORA FAÇA ISTO ou peça uma Dica do Capitão.',
          buttons: [['BORA JOGAR!', () => this.stop(), 'primary']] }
      ];
    }

    // Guia opcional: só aparece para quem escolhe saber mais sobre acessibilidade.
    a11ySteps(thenTutorial) {
      const sr = () => game.state.settings.screenReader;
      return [
        { id: 'ax-intro', title: 'TECLADO E LEITOR DE TELA',
          text: () => 'Vou mostrar como jogar sem mouse e com o Narrador do Windows. Você pode pular quando quiser.',
          buttons: [['COMEÇAR', () => this.next(), 'primary']] },
        { id: 'ax-sr', title: 'MODO LEITOR DE TELA', mood: 'pensando',
          text: () => `Você usa o Narrador do Windows? Para ligar o Narrador, aperte as teclas Windows, Control e Enter juntas. Depois, ligue aqui o Modo leitor de tela. Com ele ligado, o Barba-Rubra joga mais devagar e o Capitão fala as dicas sem mudar o lugar onde você está. Agora o Modo leitor de tela está ${sr() ? 'LIGADO' : 'DESLIGADO'}.`,
          buttons: [[() => sr() ? 'DESLIGAR MODO LEITOR' : 'LIGAR MODO LEITOR', () => { game.toggleScreenReader(); this.render(true); }, 'soft'], ['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-coords', title: 'AS CASAS DO MAPA',
          text: () => 'O mapa tem 3 oceanos. Cada oceano tem 10 colunas e 10 linhas. As LETRAS, de A até J, são as colunas. Elas mudam quando você anda na HORIZONTAL, para a esquerda ou para a direita. Os NÚMEROS, de 1 até 10, são as linhas. Eles mudam quando você anda na VERTICAL, para cima ou para baixo. Exemplo: a casa C7 fica na coluna C e na linha 7.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-move', title: 'TAB OU SETAS?',
          text: () => 'A tecla TAB pula para o próximo lugar: do mapa para o painel, e de um botão para outro. As teclas SHIFT e TAB juntas voltam para o lugar anterior. As SETAS andam de casa em casa dentro do mapa, e trocam de aba no painel. A tecla ENTER aperta o botão ou faz a ação. A tecla ESC cancela o que você escolheu.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-back', title: 'VOLTAR PARA O MAPA',
          text: () => 'A tecla N leva você de volta para o mapa, de qualquer lugar. No painel, o primeiro botão de cada aba também é "Voltar para o mapa". Se ficar perdido, aperte a tecla Q: ela diz onde você está, em qual campo, e quais teclas usar ali.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-goto', title: 'IR DIRETO PARA UMA CASA',
          text: () => 'A tecla G abre o campo Ir para a casa. Digite a letra e o número da casa, por exemplo C7, e aperte Enter. Você vai direto para essa casa.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-listen', title: 'OUVIR O JOGO',
          text: () => 'A tecla I fala como está a partida: de quem é a vez e quantos navios cada um ainda tem. A tecla C fala a casa onde você está no mapa. A tecla T repete a dica do Capitão. A tecla Q diz onde você está e como se movimentar. Se a opção Sons do mapa estiver ligada, o som muda quando você anda: ele vai da esquerda para a direita conforme a coluna, e do grave para o agudo conforme a linha.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-keys', title: 'ATALHOS DA BATALHA',
          text: () => 'Ao montar a frota: a tecla R gira o navio, e a tecla P coloca todos os navios sozinha. Na batalha: a tecla 1 escolhe Atacar, a tecla 2 escolhe Mover, a tecla 3 escolhe Armadilha e a tecla 4 escolhe Analisar. A tecla ESPAÇO passa a vez. Nas perguntas: a tecla V responde Verdadeiro e a tecla F responde Falso.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-settings', title: 'AJUSTES E AJUDA',
          text: () => 'A tecla ESC, ou o botão amarelo da engrenagem no canto, abre o menu. Lá ficam as Opções: alto contraste, tamanho do texto, menos animação e volume. A tecla F2 abre as Opções direto. A tecla F1 abre o Guia do Capitão, e na aba Ajuda tem as Dúvidas frequentes.',
          buttons: [['PRÓXIMO', () => this.next(), 'primary']] },
        { id: 'ax-done', title: 'PRONTO!',
          text: () => thenTutorial || !this.completed() ? 'Agora vamos aprender a jogar, passo a passo.' : 'Agora é com você, capitão!',
          buttons: thenTutorial || !this.completed()
            ? [['VER O TUTORIAL DO JOGO', () => this.start(true), 'primary'], ['JÁ SEI JOGAR', () => this.skip(), 'soft']]
            : [['VAMOS JOGAR!', () => this.stop(), 'primary']] }
      ];
    }

    // Resposta da pergunta do Capitão: com teclado/leitor, as explicações de acessibilidade entram no tutorial.
    chooseA11y(yes) {
      if (yes && !this.list.some(x => x.id === 'ax-sr')) {
        const extra = this.a11ySteps(true).filter(x => !['ax-intro', 'ax-done'].includes(x.id));
        this.list.splice(this.index + 1, 0, ...extra);
        if (game.panel) game.panel.open(null);
      }
      this.next();
    }

    // Atalho antigo (botão da Ajuda): abre o tutorial já com a parte de teclado e leitor de tela.
    startA11yGuide() {
      this.start();
      if (!this.active || !this.list) return;
      this.index = this.list.findIndex(x => x.id === 'ask');
      this.chooseA11y(true);
    }

    start(skipHello = false) {
      if (game.state.phase !== 'placement' || game.state.placementOwner !== 'player1') return;
      this.mode = 'mission'; this.active = true; this.data = {}; this.index = -1;
      this.list = this.steps();
      if (skipHello) this.index = 0;  // vindo do guia de acessibilidade: pula o "Olá"
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
        if (game.isAiTurn()) return 'Espere: o Barba-Rubra está jogando.';
        const a = st.action;
        if (a === 'attack') return 'Toque numa casa clarinha para atirar.';
        if (a === 'move') return 'Toque numa casa verde para navegar.';
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
        if (game.isAiTurn()) return 'É a vez do Barba-Rubra. Observe o seu oceano e espere a sua vez!';
        const a = st.action;
        if (a === 'attack') return 'As casas clarinhas são onde o canhão alcança. Se o pirata estiver longe, use MOVER para chegar mais perto.';
        if (a === 'move') return 'Toque numa casa verde: o navio navega até lá. Navios pequenos andam mais!';
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
    quip(title, text, ms = 2200, speaker = null, mood = null) {
      if (this.active && (this.mode === 'mission' || this.mode === 'tip')) return;
      if (game.state.settings.screenReader) return;
      this.mode = 'quip'; this.active = true; this.index = 0;
      this.list = [{ id: 'quip', title, light: true, small: true, speaker, mood: speaker === 'villain' ? null : mood, villainMood: speaker === 'villain' ? mood : null, text: () => text, buttons: [] }];
      this.render(true);
      clearTimeout(this.quipTimer);
      this.quipTimer = setTimeout(() => { if (this.mode === 'quip') this.hideTip(); }, ms);
    }

    // Falas do Barba-Rubra: dão personalidade ao adversário (curtas e rápidas).
    villainSays(kind) {
      const L = {
        aiHit: ['Arrr! Acertei em cheio!', 'Ha! Achei um navio seu!', 'Bem no alvo, marujo!'],
        aiMiss: ['Bolas! Só água...', 'Errei? Isso nunca acontece!', 'Splash... da próxima eu acerto!'],
        aiSink: ['Ha ha ha! Mais um pro fundo do mar!', 'Glub, glub! Seu navio afundou!'],
        playerHit: ['Ai! Meu navio!', 'Ei! Isso doeu!', 'Sorte de principiante!'],
        playerSink: ['Nãããão! Meu navio!', 'Arrr... você é bom nisso!'],
        chest: ['Ei! Esse tesouro era meu!', 'Devolve o meu baú!']
      }[kind];
      if (!L || window.innerHeight < 500) return;
      if (kind === 'playerHit' && Math.random() < 0.5) return;
      const MOOD = { aiHit: 'rindo', aiMiss: 'bravo', aiSink: 'rindo', playerHit: 'surpreso', playerSink: 'chorando', chest: 'bravo' };
      this.quip('BARBA-RUBRA', L[Math.floor(Math.random() * L.length)], 1900, 'villain', MOOD[kind]);
    }

    reactQuip(name, data) {
      if (name === 'villain') { this.villainSays(data && data.kind); return; }
      if (game.isAiTurn()) return;
      // Tiros já têm a palavra grande no mapa e o aviso no topo; o Capitão só aparece em momentos especiais.
      if (window.innerHeight < 500) return;
      if (name === 'radarContact') {
        this.quip('CONTATO NO RADAR!', 'Tem alguma coisa por perto! Veja a aba Radar.', 2600, null, 'surpreso');
        const tab = $('[data-tab="radar"]');
        if (tab) { tab.classList.remove('m-attention'); void tab.offsetWidth; tab.classList.add('m-attention'); }
      } else if (name === 'answerRight' && data && data.stars === 3) setTimeout(() => this.quip('3 ESTRELAS!', 'Você está mandando muito bem!', 2600, null, 'comemorando'), 1600);
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
        <section class="m-bubble" role="dialog" aria-modal="true" aria-labelledby="gdmMissionTitle">
          <p class="m-name"><span class="m-name-tag">Capitão Maré</span><span class="m-count"></span></p>
          <h2 class="m-title" id="gdmMissionTitle"></h2>
          <p class="m-text m-read" id="gdmMissionText" tabindex="0"></p>
          <p class="m-text m-text2 m-read" tabindex="0"></p>
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
      // o texto do Capitão também recebe foco: o leitor de tela lê com calma, palavra por palavra
      list.push(...[...this.bubble.querySelectorAll('.m-read')].filter(p => !p.hidden && p.textContent.trim()));
      if (target) list.push(target);
      list.push(...[...this.bubble.querySelectorAll('button, .m-faq')].filter(x => !x.hidden && x.offsetParent !== null));
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
      const villainTalks = st.speaker === 'villain';
      this.nameTag.textContent = villainTalks ? 'Barba-Rubra' : 'Capitão Maré';
      this.el.classList.toggle('is-villain-talk', villainTalks);
      const val = v => (typeof v === 'function' ? v() : v) || '';
      const heroMood = val(st.mood), villMood = val(st.villainMood);
      // fala rápida do pirata (sem o Capitão na tela): a imagem grande vira o pirata
      const want = villainTalks && !st.villain ? pic('vilao', villMood) : pic('capitao', heroMood);
      if (!this.hero.src.endsWith(want)) this.hero.src = want;
      this.hero.dataset.mood = villainTalks && !st.villain ? villMood : heroMood;
      const wantV = pic('vilao', villMood);
      if (!this.villain.src.endsWith(wantV)) this.villain.src = wantV;
      this.villain.dataset.mood = villMood;
      this.el.classList.toggle('villain-speaks', villainTalks && !!st.villain);
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
        b.type = 'button'; b.className = `btn ${kind === 'primary' ? 'btn-primary' : 'btn-soft'}`; b.textContent = typeof label === 'function' ? label() : label;
        b.addEventListener('click', () => { if (st.finished && this.mode === 'mission') return; game.audio.play('click'); fn(); });
        this.btns.appendChild(b);
      }
      if (this.mode === 'mission' && !(st.buttons || []).some(([l]) => l === 'JÁ SEI JOGAR') && st.id !== 'done' && st.id !== 'ax-done') {
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
        fire: { mouse: 'Clique numa casa clarinha para atirar.', keyboard: 'Setas escolhem a casa. Enter atira. (Ou G e digite a casa.)' },
        move: { mouse: 'Clique numa casa verde: o navio navega até lá.', keyboard: 'Setas até uma casa verde. Enter faz o navio andar.' }
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
          <div class="dg-path"></div>
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
      if (kind === 'move') frames = input === 'mouse' ? [
        () => { set('placed'); at(ship, 0, 1); at(cur, 5, 2); rip.className = 'dg-ripple'; stage.classList.add('show-path'); },
        () => { at(cur, 3.6, 1); },
        () => { rip.className = 'dg-ripple go'; at(rip, 3.6, 1); },
        () => { at(ship, 2, 1); },
        () => {}
      ] : [
        () => { set('placed'); at(ship, 0, 1); key(''); stage.classList.add('show-path'); },
        () => { key('→'); },
        () => { key('→'); },
        () => { key('Enter'); at(ship, 2, 1); },
        () => { key(''); }
      ];
      else if (kind === 'place' && input === 'mouse') frames = [
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
      if (t.cell) { const tc = typeof t.cell === 'function' ? t.cell() : t.cell; if (!tc) return null; const [row, col] = tc; return clip({ x: ox + game.colX(col) - 4, y: oy + game.rowY(row) - 4, w: g.cell + 8, h: g.cell + 8 }); }
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
