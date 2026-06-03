const GameState = {
    phase: 'setup',
    difficulty: 'facil',
    coins: 0,
    match: null,
    questions: [],
    boards: {},
    placedShips: [],
    selectedShipId: null,
    keyboardPlacement: null,
    draggingShipId: null,
    battle: {
        selectedShipId: null,
        actionMode: 'attack',
        mainActionAvailable: true,
        analysisAvailable: true,
        isInterfaceLocked: false,
        unknownObjects: new Map(),
        revealedObjects: new Map(),
        traps: [],
        messages: []
    },

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
        this.match = new Game({ moedasIniciais: difficulty.coins });
        this.coins = this.match.players.player.moedas;
        this.placedShips = [];
        this.selectedShipId = null;
        this.keyboardPlacement = null;
        this.draggingShipId = null;
        this.resetBoards();
    },

    startBattle() {
        if (!this.match) return false;

        this.phase = 'battle';
        this.selectedShipId = null;
        this.keyboardPlacement = null;
        this.draggingShipId = null;
        this.battle.selectedShipId = null;
        this.battle.actionMode = 'attack';
        this.battle.mainActionAvailable = true;
        this.battle.analysisAvailable = true;
        this.battle.isInterfaceLocked = false;
        this.battle.unknownObjects = new Map();
        this.battle.revealedObjects = new Map();
        this.battle.traps = [];
        this.battle.messages = [];

        if (this.match.players.player) {
            this.match.players.player.analiseDisponivel = true;
        }

        return true;
    },

    getHumanPlayer() {
        return this.match?.players.player || null;
    },

    getMachinePlayer() {
        return this.match?.players.maquina || null;
    },

    getActivePlayerId() {
        return this.match?.jogadorAtivoId || 'player';
    },

    isHumanTurn() {
        return this.getActivePlayerId() === 'player';
    },

    spendCoins(amount) {
        const player = this.match?.players.player;
        const currentCoins = player ? player.moedas : this.coins;

        if (currentCoins < amount) return false;

        if (player) {
            player.moedas -= amount;
            this.coins = player.moedas;
            return true;
        }

        this.coins -= amount;
        return true;
    },

    buyShip(shipConfig) {
        if (!this.match) return null;

        const purchasedShip = this.match.comprarNavio('player', shipConfig);
        this.coins = this.match.players.player.moedas;

        return purchasedShip;
    },

    refundCoins(amount) {
        const player = this.match?.players.player;

        if (player) {
            player.moedas += amount;
            this.coins = player.moedas;
            return;
        }

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
