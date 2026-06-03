class TurnManager {
    static isInitialized = false;

    static init() {
        if (this.isInitialized) return;

        this.ensureBattleControls();
        this.bindGridActions();
        this.isInitialized = true;
    }

    static startBattle() {
        if (!GameState.startBattle()) return false;

        this.init();
        AIManager.setupMachineFleet();
        const controls = document.getElementById('battle-controls');
        const startButton = document.getElementById('start-battle-button');

        if (controls) controls.classList.remove('is-hidden');
        if (startButton) startButton.classList.add('is-hidden');

        this.updateHud();
        this.showMessage(GameState.isHumanTurn() ? 'Vez do Jogador' : 'Vez da Maquina');
        this.lockInterface(!GameState.isHumanTurn());
        RadarManager.scanRadar();

        if (!GameState.isHumanTurn()) {
            AIManager.runAITurn();
        }

        return true;
    }

    static randomizeFirstPlayer() {
        if (!GameState.match) return 'player';

        GameState.match.jogadorAtivoId = GameState.match.sortearJogadorInicial();
        return GameState.match.jogadorAtivoId;
    }

    static ensureBattleControls() {
        const panel = document.querySelector('.fleet-panel');
        if (!panel || document.getElementById('battle-controls')) return;

        const controls = document.createElement('div');
        controls.id = 'battle-controls';
        controls.className = 'battle-controls is-hidden';
        controls.innerHTML = `
            <div class="battle-selection" id="battle-selection">Nenhum navio selecionado.</div>
            <div class="battle-actions" aria-label="Acoes de batalha">
                <button type="button" data-mode="attack">Atacar</button>
                <button type="button" data-mode="move">Mover</button>
                <button type="button" data-mode="trap">Armadilha</button>
                <button type="button" data-mode="analyze">Analisar</button>
                <button type="button" id="end-turn-button">Passar turno</button>
            </div>
        `;

        panel.appendChild(controls);
        controls.querySelectorAll('[data-mode]').forEach((button) => {
            button.addEventListener('click', () => {
                GameState.battle.actionMode = button.dataset.mode;
                this.updateActionButtons();
                this.setBattleMessage(`Modo: ${button.textContent}.`, 'info');
            });
        });
        controls.querySelector('#end-turn-button').addEventListener('click', () => this.nextTurn());

        let overlay = document.getElementById('turn-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'turn-overlay';
            overlay.className = 'turn-overlay is-hidden';
            document.body.appendChild(overlay);
        }
    }

    static bindGridActions() {
        const grid = document.getElementById('mega-grid');
        if (!grid) return;

        grid.addEventListener('click', (event) => {
            if (GameState.phase !== 'battle') return;

            const cell = event.target.closest('.ocean-cell');
            if (!cell) return;

            if (!GameState.isHumanTurn()) {
                this.showMessage('Vez da Maquina');
                return;
            }

            const position = {
                zoneId: cell.dataset.zone,
                row: Number(cell.dataset.row),
                column: Number(cell.dataset.column)
            };
            const ownShip = CombatManager.findShipAt(position, 'player');

            if (ownShip) {
                this.selectShip(ownShip);
                return;
            }

            const selectedShip = MovementManager.getShipById(GameState.battle.selectedShipId);
            const mode = GameState.battle.actionMode;

            if (mode === 'analyze') {
                AnalysisManager.analyzeUnknownObject(position);
                return;
            }

            if (!selectedShip || selectedShip.isDestroyed) {
                this.setBattleMessage('Selecione um navio aliado primeiro.', 'warning');
                return;
            }

            if (mode === 'move') {
                MovementManager.moveShip(selectedShip, position);
                return;
            }

            if (mode === 'trap') {
                CombatManager.placeTrap(selectedShip, position);
                return;
            }

            CombatManager.attackTarget(selectedShip, position);
            this.updateHud();
        });
    }

    static selectShip(ship) {
        GameState.battle.selectedShipId = ship.id;
        this.updateSelectionLabel(ship);
        this.setBattleMessage(`${ship.nome} selecionado.`, 'info');
    }

    static updateSelectionLabel(ship = null) {
        const selectedShip = ship || MovementManager.getShipById(GameState.battle.selectedShipId);
        const label = document.getElementById('battle-selection');

        if (!label) return;

        if (!selectedShip) {
            label.textContent = 'Nenhum navio selecionado.';
            return;
        }

        label.textContent = `${selectedShip.nome} | HP ${selectedShip.hp}/${selectedShip.maxHp} | Cargas ${selectedShip.cargasDisponiveis}/${selectedShip.capacidadeMaximaDeCargas}`;
    }

    static updateActionButtons() {
        document.querySelectorAll('#battle-controls [data-mode]').forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.mode === GameState.battle.actionMode);
        });
    }

    static setBattleMessage(message, type = 'info') {
        const element = document.getElementById('placement-message');

        if (!element) return;

        element.textContent = message;
        element.dataset.type = type;
    }

    static showMessage(message) {
        const overlay = document.getElementById('turn-overlay');

        if (!overlay) return;

        overlay.textContent = message;
        overlay.classList.remove('is-hidden');
        window.setTimeout(() => overlay.classList.add('is-hidden'), 900);
    }

    static lockInterface(shouldLock) {
        GameState.battle.isInterfaceLocked = shouldLock;

        const board = document.getElementById('game-board');
        if (board) board.classList.toggle('is-locked', shouldLock);

        document.querySelectorAll('#battle-controls button').forEach((button) => {
            button.disabled = shouldLock;
        });
    }

    static resetActionsForTurn() {
        GameState.battle.mainActionAvailable = true;
        GameState.battle.analysisAvailable = true;

        const player = GameState.getHumanPlayer();
        if (player && GameState.isHumanTurn()) {
            player.analiseDisponivel = true;
        }
    }

    static processReloads() {
        if (!GameState.match) return [];

        return GameState.match.processarTodasAsRecargas();
    }

    static nextTurn() {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        GameState.match.nextTurn();
        this.resetActionsForTurn();
        this.updateHud();
        this.updateSelectionLabel();
        RadarManager.scanRadar();

        const isHumanTurn = GameState.isHumanTurn();
        this.showMessage(isHumanTurn ? 'Vez do Jogador' : 'Vez da Maquina');
        this.lockInterface(!isHumanTurn);
        this.setBattleMessage(isHumanTurn ? 'Sua vez. Selecione uma acao.' : 'A maquina esta pensando.', 'info');

        if (!isHumanTurn) {
            AIManager.runAITurn();
        }

        return true;
    }

    static finishTurnIfNoActions() {
        if (!GameState.isHumanTurn()) return;

        if (!GameState.battle.mainActionAvailable && !GameState.battle.analysisAvailable) {
            this.nextTurn();
        }
    }

    static updateHud() {
        if (!GameState.match) return;

        const label = GameState.match.jogadorAtivoId === 'player' ? 'Jogador' : 'Maquina';
        gameUI.setStatus({
            coins: GameState.match.players.player.moedas,
            turn: `Rodada ${GameState.match.turnoAtual} - ${label}`
        });
        this.updateActionButtons();
    }
}

function randomizeFirstPlayer() {
    return TurnManager.randomizeFirstPlayer();
}

function nextTurn() {
    return TurnManager.nextTurn();
}

function processReloads() {
    return TurnManager.processReloads();
}

globalThis.TurnManager = TurnManager;
globalThis.randomizeFirstPlayer = randomizeFirstPlayer;
globalThis.nextTurn = nextTurn;
globalThis.processReloads = processReloads;
