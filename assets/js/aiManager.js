class AIManager {
    static hasSetupFleet = false;

    static setupMachineFleet() {
        if (this.hasSetupFleet || !GameState.match) return;

        const preferredShips = ['destroyer', 'cruiser', 'battleship', 'trap-layer'];
        let row = 1;

        preferredShips.forEach((shipId, index) => {
            const config = GameConfig.ships.find((ship) => ship.id === shipId);
            if (!config) return;

            try {
                const ship = GameState.match.comprarNavio('maquina', {
                    ...config,
                    instanceId: `maquina-${config.id}-${index}`
                });
                const column = Math.max(0, GameConfig.grid.columns - config.size - 1);
                const positions = MovementManager.getPositions('enemy', row, column, config.size, 'horizontal');

                if (!MovementManager.isInsideBoard(positions) || MovementManager.isOccupied(positions, ship.id)) {
                    return;
                }

                ship.atualizarPosicao({
                    zoneId: 'enemy',
                    row,
                    column,
                    orientation: 'horizontal',
                    positions
                });
                MovementManager.occupyShipCells(ship, false);
                row = Math.min(GameConfig.grid.rows - 1, row + 2);
            } catch (error) {
                console.log('IA nao conseguiu comprar navio:', error?.message || error);
            }
        });

        this.hasSetupFleet = true;
    }

    static runAITurn() {
        if (!GameState.match || GameState.match.jogadorAtivoId !== 'maquina') return;

        const delay = 1000 + Math.floor(Math.random() * 4000);

        window.setTimeout(() => {
            this.chooseAction();
            TurnManager.nextTurn();
        }, delay);
    }

    static chooseAction() {
        const ships = GameState.match.players.maquina.inventario.navios
            .filter((ship) => !ship.isDestroyed);

        if (ships.length === 0) return;

        const attacker = ships.find((ship) => CombatManager.canShipAttack(ship) && ship.chargeType !== 'armadilha');
        const target = this.findAttackTarget();

        if (attacker && target) {
            CombatManager.attackTarget(attacker, target, { skipUnknownConfirmation: true });
            return;
        }

        const trapLayer = ships.find((ship) => ship.chargeType === 'armadilha' && CombatManager.canShipAttack(ship));

        if (trapLayer) {
            const trapPosition = this.findTrapPosition(trapLayer);

            if (trapPosition) {
                CombatManager.placeTrap(trapLayer, trapPosition);
                return;
            }
        }

        const movable = ships.find((ship) => !ship.isDestroyed);
        const movePosition = movable ? this.findMovePosition(movable) : null;

        if (movable && movePosition) {
            MovementManager.moveShip(movable, movePosition);
        }
    }

    static findAttackTarget() {
        const playerShips = GameState.match.players.player.inventario.navios
            .filter((ship) => !ship.isDestroyed);

        if (playerShips.length === 0) return null;

        const ship = playerShips[Math.floor(Math.random() * playerShips.length)];
        return ship.positions[Math.floor(Math.random() * ship.positions.length)];
    }

    static findTrapPosition(ship) {
        const candidates = [
            { zoneId: ship.zoneId, row: ship.row + 1, column: ship.column },
            { zoneId: ship.zoneId, row: ship.row - 1, column: ship.column },
            { zoneId: 'neutral', row: ship.row, column: 8 }
        ];

        return candidates.find((position) =>
            position.row >= 0 &&
            position.row < GameConfig.grid.rows &&
            position.column >= 0 &&
            position.column < GameConfig.grid.columns &&
            !CombatManager.findShipAt(position) &&
            !CombatManager.findTrapAt(position)
        ) || null;
    }

    static findMovePosition(ship) {
        const currentGlobalColumn = MovementManager.getGlobalColumn({
            zoneId: ship.zoneId,
            row: ship.row,
            column: ship.column
        });
        const nextGlobalColumn = Math.max(GameConfig.grid.zoneWidth, currentGlobalColumn - 1);
        const zone = MovementManager.getZoneFromGlobalColumn(nextGlobalColumn);
        const candidate = {
            zoneId: zone.zoneId,
            row: ship.row,
            column: zone.column
        };

        return MovementManager.canMoveShip(ship, candidate.zoneId, candidate.row, candidate.column)
            ? candidate
            : null;
    }
}

function runAITurn() {
    return AIManager.runAITurn();
}

globalThis.AIManager = AIManager;
globalThis.runAITurn = runAITurn;
