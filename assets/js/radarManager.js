class RadarManager {
    static detectionRadius = 3;

    static getPositionKey(position) {
        return MovementManager.getCellKey(position);
    }

    static clearUnknownVisuals() {
        document.querySelectorAll('.ocean-cell.is-unknown, .ocean-cell.is-revealed, .ocean-cell.is-trap').forEach((cell) => {
            cell.classList.remove('is-unknown', 'is-revealed', 'is-trap');
        });
    }

    static scanRadar() {
        if (!GameState.match || GameState.phase !== 'battle') return [];

        this.clearUnknownVisuals();
        GameState.battle.unknownObjects.clear();

        const playerShips = GameState.match.players.player.inventario.navios
            .filter((ship) => !ship.isDestroyed);
        const enemyShips = GameState.match.players.maquina.inventario.navios
            .filter((ship) => !ship.isDestroyed);
        const enemyTraps = GameState.battle.traps
            .filter((trap) => trap.isActive && trap.ownerId === 'maquina');

        enemyShips.forEach((ship) => {
            ship.positions.forEach((position) => {
                if (this.isDetectedByAnyShip(position, playerShips)) {
                    this.showUnknownObject(position, { type: 'ship', item: ship });
                }
            });
        });

        enemyTraps.forEach((trap) => {
            if (this.isDetectedByAnyShip(trap.position, playerShips)) {
                this.showUnknownObject(trap.position, { type: 'trap', item: trap });
            }
        });

        return [...GameState.battle.unknownObjects.values()];
    }

    static isDetectedByAnyShip(position, ships) {
        return ships.some((ship) =>
            ship.positions.some((shipPosition) => {
                const rowDistance = Math.abs(shipPosition.row - position.row);
                const columnDistance = Math.abs(
                    MovementManager.getGlobalColumn(shipPosition) - MovementManager.getGlobalColumn(position)
                );

                return Math.max(rowDistance, columnDistance) <= this.detectionRadius;
            })
        );
    }

    static showUnknownObject(position, target) {
        const key = this.getPositionKey(position);
        const revealed = GameState.battle.revealedObjects.get(key);
        const cell = GridView.getCell(position.zoneId, position.row, position.column);

        GameState.battle.unknownObjects.set(key, {
            key,
            position,
            type: target.type,
            item: target.item
        });

        if (!cell) return;

        if (revealed) {
            cell.classList.add('is-revealed');
            cell.classList.toggle('is-trap', revealed.type === 'trap');
            cell.setAttribute('aria-label', `${position.zoneId}, linha ${position.row + 1}, coluna ${position.column + 1}, ${revealed.type === 'trap' ? 'armadilha revelada' : 'navio revelado'}`);
            return;
        }

        cell.classList.add('is-unknown');
        cell.setAttribute('aria-label', `${position.zoneId}, linha ${position.row + 1}, coluna ${position.column + 1}, objeto desconhecido`);
    }
}

function scanRadar() {
    return RadarManager.scanRadar();
}

function showUnknownObject(position) {
    return RadarManager.showUnknownObject(position);
}

globalThis.RadarManager = RadarManager;
globalThis.scanRadar = scanRadar;
globalThis.showUnknownObject = showUnknownObject;
