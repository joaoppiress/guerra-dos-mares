const PlacementController = {
    orientation: 'horizontal',
    previewOrigin: { row: 0, column: 0 },
    previewValidation: null,
    isBound: false,

    init() {
        if (this.isBound) return;

        this.bindGridEvents();
        this.bindKeyboardEvents();
        this.isBound = true;
    },

    bindGridEvents() {
        const grid = document.getElementById('mega-grid');

        if (!grid) return;

        grid.addEventListener('dragover', (event) => {
            const cell = event.target.closest('.ocean-cell');

            if (!cell || !GameState.draggingShipId) return;

            event.preventDefault();

            if (cell.dataset.zone !== 'ally') {
                GridView.clearPreview();
                this.setMessage('Navios so podem ser posicionados no Oceano Aliado.', 'warning');
                return;
            }

            this.showPreviewFromCell(GameState.draggingShipId, cell);
        });

        grid.addEventListener('dragleave', (event) => {
            if (!grid.contains(event.relatedTarget)) {
                GridView.clearPreview();
            }
        });

        grid.addEventListener('drop', (event) => {
            const cell = event.target.closest('.ocean-cell');

            if (!cell || !GameState.draggingShipId) return;

            event.preventDefault();

            if (cell.dataset.zone !== 'ally') {
                this.setMessage('Solte o navio apenas no Oceano Aliado.', 'warning');
                this.endDrag();
                return;
            }

            this.placeShip(GameState.draggingShipId, Number(cell.dataset.row), Number(cell.dataset.column));
            this.endDrag();
        });

        grid.addEventListener('click', (event) => {
            const cell = event.target.closest('.ocean-cell');

            if (!cell || !GameState.selectedShipId) return;

            if (cell.dataset.zone !== 'ally') {
                this.setMessage('Posicionamento permitido somente no Oceano Aliado.', 'warning');
                return;
            }

            this.showPreviewFromCell(GameState.selectedShipId, cell, { announce: true });
        });
    },

    bindKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (GameState.phase !== 'placement' || !GameState.selectedShipId) return;

            const key = event.key.toLowerCase();

            if (!['w', 'a', 's', 'd', 'r', 'enter', 'escape'].includes(key)) return;

            event.preventDefault();

            if (key === 'escape') {
                this.cancelKeyboardPlacement();
                return;
            }

            if (key === 'r') {
                this.rotateSelectedShip();
                return;
            }

            if (key === 'enter') {
                this.placeShip(GameState.selectedShipId, this.previewOrigin.row, this.previewOrigin.column);
                return;
            }

            this.moveKeyboardPreview(key);
        });
    },

    selectShip(shipId) {
        const ship = getShipConfig(shipId);

        if (!ship) return;

        if (GameState.coins < ship.price) {
            this.setMessage(`Moedas insuficientes para posicionar ${ship.name}.`, 'warning');
            return;
        }

        const origin = this.getInitialPreviewOrigin(ship);
        GameState.selectedShipId = shipId;

        ShopView.updateSelectedShip();
        this.showPreview(shipId, origin.row, origin.column);
        this.focusPlacementSurface();
        this.setMessage(`${ship.name} selecionado. Use WASD, R, Enter e Esc ou arraste para o aliado.`, 'info');
    },

    startDrag(event, shipId) {
        const ship = getShipConfig(shipId);

        if (!ship || GameState.coins < ship.price) {
            event.preventDefault();
            this.setMessage('Moedas insuficientes para este navio.', 'warning');
            return;
        }

        GameState.draggingShipId = shipId;
        GameState.selectedShipId = shipId;
        ShopView.updateSelectedShip();

        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', shipId);
    },

    endDrag() {
        GameState.draggingShipId = null;
        GridView.clearPreview();
    },

    showPreviewFromCell(shipId, cell, options = {}) {
        this.showPreview(shipId, Number(cell.dataset.row), Number(cell.dataset.column), options);
    },

    showPreview(shipId, row, column, options = {}) {
        const ship = getShipConfig(shipId);

        if (!ship) return null;

        const nextRow = clamp(row, 0, GameConfig.grid.rows - 1);
        const nextColumn = clamp(column, 0, GameConfig.grid.columns - 1);

        const positions = GridView.getCellsForPlacement('ally', nextRow, nextColumn, ship.size, this.orientation);
        const validation = validatePlacement(ship, positions);

        GridView.paintPreview('ally', positions, validation.isValid);
        this.previewOrigin = { row: nextRow, column: nextColumn };
        this.previewValidation = validation;
        GameState.keyboardPlacement = {
            shipId,
            row: nextRow,
            column: nextColumn,
            orientation: this.orientation
        };

        if (options.announce) {
            this.setMessage(validation.message, validation.isValid ? 'success' : 'warning');
        }

        return validation;
    },

    placeShip(shipId, row, column) {
        const ship = getShipConfig(shipId);

        if (!ship) return false;

        const positions = GridView.getCellsForPlacement('ally', row, column, ship.size, this.orientation);
        const validation = validatePlacement(ship, positions);

        if (!validation.isValid) {
            this.setMessage(validation.message, 'warning');
            GridView.paintPreview('ally', positions, false);
            return false;
        }

        const instanceId = `${ship.id}-${Date.now()}-${GameState.placedShips.length}`;
        let purchasedShip = null;

        try {
            purchasedShip = GameState.buyShip({
                ...ship,
                instanceId
            });
        } catch (error) {
            this.setMessage(error?.message || `Moedas insuficientes para posicionar ${ship.name}.`, 'warning');
            return false;
        }

        const placedShip = {
            instanceId,
            logicShipId: purchasedShip.id,
            shipId: ship.id,
            name: ship.name,
            zoneId: 'ally',
            row,
            column,
            orientation: this.orientation,
            hp: ship.hp,
            maxHp: ship.hp,
            price: ship.price,
            size: ship.size,
            charges: ship.charges,
            chargeType: ship.chargeType,
            positions
        };

        purchasedShip.atualizarPosicao({
            zoneId: 'ally',
            row,
            column,
            orientation: this.orientation,
            positions: positions.map((position) => ({
                zoneId: 'ally',
                row: position.row,
                column: position.column
            }))
        });

        positions.forEach((position) => {
            GameState.boards.ally[position.row][position.column].shipInstanceId = purchasedShip.id;
            GameState.boards.ally[position.row][position.column].state = 'ship';
        });

        GameState.placedShips.push(placedShip);
        GridView.paintPlacedShip(placedShip);
        GridView.clearPreview();
        GameState.selectedShipId = null;
        GameState.keyboardPlacement = null;
        this.previewValidation = null;
        ShopView.refreshHud();
        this.updateBattleStartAvailability();
        this.setMessage(`${ship.name} posicionado na coluna ${column + 1}, linha ${row + 1}.`, 'success');
        return true;
    },

    updateBattleStartAvailability() {
        const button = document.getElementById('start-battle-button');

        if (!button) return;

        button.disabled = GameState.placedShips.length === 0;
    },

    moveKeyboardPreview(key) {
        const placement = GameState.keyboardPlacement;
        const origin = placement && placement.shipId === GameState.selectedShipId
            ? { row: placement.row, column: placement.column }
            : this.previewOrigin;
        const movement = {
            w: [-1, 0],
            a: [0, -1],
            s: [1, 0],
            d: [0, 1]
        }[key];

        if (!movement) return;

        const row = clamp(origin.row + movement[0], 0, GameConfig.grid.rows - 1);
        const column = clamp(origin.column + movement[1], 0, GameConfig.grid.columns - 1);

        this.showPreview(GameState.selectedShipId, row, column, { announce: true });
    },

    rotateSelectedShip() {
        this.orientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        const validation = this.showPreview(GameState.selectedShipId, this.previewOrigin.row, this.previewOrigin.column);
        const orientationLabel = this.orientation === 'horizontal' ? 'horizontal' : 'vertical';
        const suffix = validation?.isValid ? 'Posicao valida.' : validation?.message;
        this.setMessage(`Orientacao: ${orientationLabel}. ${suffix}`, validation?.isValid ? 'info' : 'warning');
    },

    cancelKeyboardPlacement() {
        const selectedShip = GameState.selectedShipId ? getShipConfig(GameState.selectedShipId) : null;

        GameState.selectedShipId = null;
        GameState.keyboardPlacement = null;
        this.previewValidation = null;
        GridView.clearPreview();
        ShopView.updateSelectedShip();
        this.setMessage(selectedShip ? `${selectedShip.name} cancelado.` : 'Posicionamento cancelado.', 'info');
    },

    getInitialPreviewOrigin(ship) {
        const candidates = [
            this.previewOrigin,
            { row: 0, column: 0 }
        ];

        for (const candidate of candidates) {
            if (this.canPreviewAt(ship, candidate.row, candidate.column)) {
                return candidate;
            }
        }

        for (let row = 0; row < GameConfig.grid.rows; row += 1) {
            for (let column = 0; column < GameConfig.grid.columns; column += 1) {
                if (this.canPreviewAt(ship, row, column)) {
                    return { row, column };
                }
            }
        }

        return { row: 0, column: 0 };
    },

    canPreviewAt(ship, row, column) {
        const positions = GridView.getCellsForPlacement('ally', row, column, ship.size, this.orientation);
        return validatePlacement(ship, positions).isValid;
    },

    focusPlacementSurface() {
        const grid = document.getElementById('mega-grid');

        if (grid) {
            grid.focus({ preventScroll: true });
        }
    },

    setMessage(message, type = 'info') {
        const element = document.getElementById('placement-message');

        if (!element) return;

        element.textContent = message;
        element.dataset.type = type;
    }
};

function validatePlacement(ship, positions) {
    if (GameState.coins < ship.price) {
        return {
            isValid: false,
            message: `Moedas insuficientes para posicionar ${ship.name}.`
        };
    }

    const isInsideBoard = positions.every((position) =>
        position.row >= 0 &&
        position.row < GameConfig.grid.rows &&
        position.column >= 0 &&
        position.column < GameConfig.grid.columns
    );

    if (!isInsideBoard) {
        return {
            isValid: false,
            message: 'O navio nao cabe nessa posicao.'
        };
    }

    const overlapsShip = positions.some((position) =>
        GameState.boards.ally[position.row][position.column].shipInstanceId
    );

    if (overlapsShip) {
        return {
            isValid: false,
            message: 'Essa posicao sobrepoe outro navio.'
        };
    }

    return {
        isValid: true,
        message: 'Posicao valida.'
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
