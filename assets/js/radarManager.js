class RadarManager {
    static visibleObjectKeys = new Set();

    static getPositionKey(position) {
        return MovementManager.getCellKey(position);
    }

    static getDetectionRadius(ship) {
        return ship?.metadata?.detectionRadius ?? GameConfig.radar.detectionRadius;
    }

    static clearObjectVisual(key) {
        const [zoneId, row, column] = key.split(':');
        const cell = GridView.getCell(zoneId, Number(row), Number(column));

        if (!cell) return;

        cell.classList.remove('is-unknown', 'is-revealed', 'is-trap', 'is-revealed-ship');
        cell.setAttribute(
            'aria-label',
            `Coluna ${MovementManager.getGlobalColumn({ zoneId, column: Number(column) }) + 1}, linha ${Number(row) + 1}, ${GridView.getZoneTitle(zoneId)}`
        );

        if (!cell.classList.contains('is-destroyed') && !cell.classList.contains('is-trap-triggered')) {
            SpriteAnimator.registerCell(cell, `tile:${zoneId}`, { fit: 'cover' });
        }
    }

    static clearUnknownVisuals() {
        this.visibleObjectKeys.forEach((key) => this.clearObjectVisual(key));
        this.visibleObjectKeys.clear();
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

    static getRevealedTarget(key, target) {
        const revealedByPosition = GameState.battle.revealedObjects.get(key);

        if (revealedByPosition?.item === target.item) return revealedByPosition;

        return [...GameState.battle.revealedObjects.values()].find((revealed) =>
            revealed.item === target.item
        ) || null;
    }

    static isDetectedByAnyShip(position, ships) {
        return ships.some((ship) =>
            ship.positions.some((shipPosition) => {
                const rowDistance = Math.abs(shipPosition.row - position.row);
                const columnDistance = Math.abs(
                    MovementManager.getGlobalColumn(shipPosition) - MovementManager.getGlobalColumn(position)
                );

                return Math.max(rowDistance, columnDistance) <= this.getDetectionRadius(ship);
            })
        );
    }

    static showUnknownObject(position, target) {
        const key = this.getPositionKey(position);
        const revealed = this.getRevealedTarget(key, target);
        const cell = GridView.getCell(position.zoneId, position.row, position.column);

        GameState.battle.unknownObjects.set(key, {
            key,
            position,
            type: target.type,
            item: target.item
        });
        this.visibleObjectKeys.add(key);

        if (!cell) return;

        if (revealed) {
            cell.classList.add('is-revealed');
            cell.classList.toggle('is-trap', revealed.type === 'trap');
            cell.classList.toggle('is-revealed-ship', revealed.type === 'ship');

            if (revealed.type === 'ship') {
                const shipId = revealed.item.metadata?.id || revealed.item.id;
                SpriteAnimator.registerCell(cell, `ship:${shipId}:${revealed.item.orientation}`, { fit: 'contain' });
            }

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
