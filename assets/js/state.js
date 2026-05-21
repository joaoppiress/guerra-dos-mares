const GameState = {
    phase: 'setup',
    difficulty: 'facil',
    coins: 0,
    questions: [],
    boards: {},
    placedShips: [],
    selectedShipId: null,
    keyboardPlacement: null,
    draggingShipId: null,

    resetBoards() {
        this.boards = {};

        GameConfig.zones.forEach((zone) => {
            this.boards[zone.id] = createBoard(zone.id);
        });
    },

    startPlacement(difficultyId) {
        const difficulty = GameConfig.difficulties[difficultyId] || GameConfig.difficulties.facil;

        this.phase = 'placement';
        this.difficulty = difficulty.id;
        this.coins = difficulty.coins;
        this.placedShips = [];
        this.selectedShipId = null;
        this.keyboardPlacement = null;
        this.draggingShipId = null;
        this.resetBoards();
    },

    spendCoins(amount) {
        if (this.coins < amount) return false;

        this.coins -= amount;
        return true;
    },

    refundCoins(amount) {
        this.coins += amount;
    }
};

function createBoard(zoneId) {
    return Array.from({ length: GameConfig.grid.rows }, (_, row) =>
        Array.from({ length: GameConfig.grid.columns }, (_, column) => ({
            zoneId,
            row,
            column,
            coordinate: getCoordinate(row, column),
            shipInstanceId: null,
            state: 'water'
        }))
    );
}

function getCoordinate(row, column) {
    return `${GameConfig.grid.labels[column]}${row + 1}`;
}

function getGlobalCoordinate(row, globalColumn) {
    return `${globalColumn + 1}:${row + 1}`;
}

function getZoneByGlobalColumn(globalColumn) {
    if (globalColumn < GameConfig.grid.zoneWidth) {
        return {
            zoneId: 'ally',
            localColumn: globalColumn
        };
    }

    if (globalColumn < GameConfig.grid.zoneWidth * 2) {
        return {
            zoneId: 'neutral',
            localColumn: globalColumn - GameConfig.grid.zoneWidth
        };
    }

    return {
        zoneId: 'enemy',
        localColumn: globalColumn - (GameConfig.grid.zoneWidth * 2)
    };
}

function getShipConfig(shipId) {
    return GameConfig.ships.find((ship) => ship.id === shipId) || null;
}
