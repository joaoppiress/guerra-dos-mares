class MovementManager {
    static getCellKey(position) {
        return `${position.zoneId}:${position.row}:${position.column}`;
    }

    static getGlobalColumn(position) {
        const offset = {
            ally: 0,
            neutral: GameConfig.grid.zoneWidth,
            enemy: GameConfig.grid.zoneWidth * 2
        }[position.zoneId] ?? 0;

        return offset + position.column;
    }

    static getZoneFromGlobalColumn(globalColumn) {
        const zone = getZoneByGlobalColumn(globalColumn);

        return {
            zoneId: zone.zoneId,
            column: zone.localColumn
        };
    }

    static getShipById(shipId) {
        const players = GameState.match?.players;
        if (!players) return null;

        return [...players.player.inventario.navios, ...players.maquina.inventario.navios]
            .find((ship) => ship.id === shipId) || null;
    }

    static getShips() {
        const players = GameState.match?.players;
        if (!players) return [];

        return [...players.player.inventario.navios, ...players.maquina.inventario.navios];
    }

    static getPositions(zoneId, row, column, size, orientation) {
        return GridView.getCellsForPlacement(zoneId, row, column, size, orientation)
            .map((position) => ({ zoneId, row: position.row, column: position.column }));
    }

    static isInsideBoard(positions) {
        return positions.every((position) =>
            position.row >= 0 &&
            position.row < GameConfig.grid.rows &&
            position.column >= 0 &&
            position.column < GameConfig.grid.columns
        );
    }

    static canOwnerUseZone(ownerId, zoneId) {
        if (ownerId === 'player') return zoneId === 'ally' || zoneId === 'neutral';
        return zoneId === 'enemy' || zoneId === 'neutral';
    }

    static isOccupied(positions, movingShipId = null) {
        const positionKeys = new Set(positions.map((position) => this.getCellKey(position)));

        return this.getShips().some((ship) => {
            if (ship.id === movingShipId || ship.isDestroyed) return false;

            return ship.positions.some((position) => positionKeys.has(this.getCellKey(position)));
        });
    }

    static canMoveShip(ship, zoneId, row, column) {
        if (!ship || ship.isDestroyed) return false;
        if (!this.canOwnerUseZone(ship.ownerId, zoneId)) return false;

        const positions = this.getPositions(zoneId, row, column, ship.size, ship.orientation);

        return this.isInsideBoard(positions) && !this.isOccupied(positions, ship.id);
    }

    static clearShipCells(ship) {
        ship.positions.forEach((position) => {
            const cell = GridView.getCell(position.zoneId, position.row, position.column);
            const boardCell = GameState.boards[position.zoneId]?.[position.row]?.[position.column];

            if (boardCell) {
                boardCell.shipInstanceId = null;
                boardCell.state = 'water';
            }

            if (!cell) return;

            cell.classList.remove('has-ship', 'is-destroyed');
            delete cell.dataset.shipInstanceId;
            SpriteAnimator.registerCell(cell, `tile:${position.zoneId}`, { fit: 'cover' });
        });
    }

    static occupyShipCells(ship, shouldPaint = true) {
        ship.positions.forEach((position) => {
            const boardCell = GameState.boards[position.zoneId]?.[position.row]?.[position.column];

            if (boardCell) {
                boardCell.shipInstanceId = ship.id;
                boardCell.state = 'ship';
            }
        });

        if (shouldPaint) {
            GridView.paintPlacedShip({
                instanceId: ship.id,
                shipId: ship.metadata.id || ship.id,
                name: ship.nome,
                zoneId: ship.zoneId,
                orientation: ship.orientation,
                positions: ship.positions
            });
        }
    }

    static moveShip(ship, newPosition) {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        const isHumanAction = ship.ownerId === 'player';

        if (isHumanAction && !GameState.isHumanTurn()) {
            TurnManager.showMessage('Vez da Maquina');
            return false;
        }

        if (isHumanAction && !GameState.battle.mainActionAvailable) {
            TurnManager.setBattleMessage('A acao principal deste turno ja foi usada.', 'warning');
            return false;
        }

        if (!this.canMoveShip(ship, newPosition.zoneId, newPosition.row, newPosition.column)) {
            TurnManager.setBattleMessage('Movimento invalido para este navio.', 'warning');
            return false;
        }

        this.clearShipCells(ship);

        const positions = this.getPositions(
            newPosition.zoneId,
            newPosition.row,
            newPosition.column,
            ship.size,
            ship.orientation
        );

        ship.atualizarPosicao({
            zoneId: newPosition.zoneId,
            row: newPosition.row,
            column: newPosition.column,
            orientation: ship.orientation,
            positions
        });

        this.occupyShipCells(ship, ship.ownerId === 'player');
        RadarManager.scanRadar();

        if (isHumanAction) {
            GameState.battle.mainActionAvailable = false;
            TurnManager.setBattleMessage(`${ship.nome} movido.`, 'success');
            TurnManager.finishTurnIfNoActions();
        }

        return true;
    }
}

function moveShip(ship, newPosition) {
    return MovementManager.moveShip(ship, newPosition);
}

globalThis.MovementManager = MovementManager;
globalThis.moveShip = moveShip;
