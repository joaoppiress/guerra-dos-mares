const GridView = {
    cellsByKey: new Map(),
    previewCells: new Set(),

    renderBoards() {
        const layout = document.getElementById('boards-layout');

        if (!layout) return;

        this.cellsByKey.clear();
        this.previewCells.clear();
        layout.innerHTML = `
            <div class="zone-strip" aria-hidden="true">
                <span>Aliado</span>
                <span>Neutro</span>
                <span>Inimigo</span>
            </div>
            <div class="mega-board">
                <div class="corner-label" aria-hidden="true"></div>
                <div id="mega-column-labels" class="mega-column-labels" aria-hidden="true"></div>
                <div id="mega-row-labels" class="mega-row-labels" aria-hidden="true"></div>
                <div id="mega-grid" class="mega-ocean-grid" role="grid" aria-label="Grid unica 30 por 10 dos Oceanos Aliado, Neutro e Inimigo"></div>
            </div>
        `;

        this.renderLabels();
        this.renderMegaGrid();
    },

    renderLabels() {
        const columnLabels = document.getElementById('mega-column-labels');
        const rowLabels = document.getElementById('mega-row-labels');

        if (!columnLabels || !rowLabels) return;

        const columnFragment = document.createDocumentFragment();
        const rowFragment = document.createDocumentFragment();

        for (let column = 1; column <= GameConfig.grid.totalColumns; column += 1) {
            const item = document.createElement('span');
            item.textContent = String(column);
            columnFragment.appendChild(item);
        }

        for (let row = 1; row <= GameConfig.grid.rows; row += 1) {
            const item = document.createElement('span');
            item.textContent = this.getRowLetter(row);
            rowFragment.appendChild(item);
        }

        columnLabels.appendChild(columnFragment);
        rowLabels.appendChild(rowFragment);
    },

    renderMegaGrid() {
        const gridElement = document.getElementById('mega-grid');

        if (!gridElement) return;

        gridElement.tabIndex = -1;
        const fragment = document.createDocumentFragment();

        for (let row = 0; row < GameConfig.grid.rows; row += 1) {
            for (let globalColumn = 0; globalColumn < GameConfig.grid.totalColumns; globalColumn += 1) {
                const zone = getZoneByGlobalColumn(globalColumn);
                const coordinate = getGlobalCoordinate(row, globalColumn);
                const cell = document.createElement('button');

                cell.className = `ocean-cell zone-${zone.zoneId}`;
                cell.type = 'button';
                cell.dataset.zone = zone.zoneId;
                cell.dataset.row = String(row);
                cell.dataset.column = String(zone.localColumn);
                cell.dataset.globalColumn = String(globalColumn);
                cell.dataset.coordinate = coordinate;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Coluna ${globalColumn + 1}, linha ${this.getRowLetter(row + 1)}, ${this.getZoneTitle(zone.zoneId)}`);
                cell.tabIndex = -1;

                if (globalColumn === GameConfig.grid.zoneWidth || globalColumn === GameConfig.grid.zoneWidth * 2) {
                    cell.classList.add('zone-divider');
                }

                this.cellsByKey.set(this.getCellKey(zone.zoneId, row, zone.localColumn), cell);
                SpriteAnimator.registerCell(cell, `tile:${zone.zoneId}`, { fit: 'cover' });
                fragment.appendChild(cell);
            }
        }

        gridElement.appendChild(fragment);
    },

    getRowLetter(rowNumber) {
        // Converte um numero de linha (1-based) para letra estilo Excel: 1 -> A, 26 -> Z, 27 -> AA, 28 -> AB...
        let letters = '';
        let value = rowNumber;

        while (value > 0) {
            const remainder = (value - 1) % 26;
            letters = String.fromCharCode(65 + remainder) + letters;
            value = Math.floor((value - 1) / 26);
        }

        return letters;
    },

    getCell(zoneId, row, column) {
        return this.cellsByKey.get(this.getCellKey(zoneId, row, column)) || null;
    },

    getCellKey(zoneId, row, column) {
        return `${zoneId}:${row}:${column}`;
    },

    getCellsForPlacement(zoneId, row, column, size, orientation) {
        const cells = [];

        for (let index = 0; index < size; index += 1) {
            const targetRow = orientation === 'vertical' ? row + index : row;
            const targetColumn = orientation === 'horizontal' ? column + index : column;
            cells.push({ row: targetRow, column: targetColumn });
        }

        return cells;
    },

    clearPreview() {
        this.previewCells.forEach((cell) => {
            cell.classList.remove('is-preview-valid', 'is-preview-invalid');
            cell.removeAttribute('aria-selected');
            SpriteAnimator.unregisterEffect(cell);
        });
        this.previewCells.clear();
    },

    paintPreview(zoneId, positions, isValid) {
        this.clearPreview();

        positions.forEach((position) => {
            const cell = this.getCell(zoneId, position.row, position.column);

            if (!cell) return;

            cell.classList.add(isValid ? 'is-preview-valid' : 'is-preview-invalid');
            cell.setAttribute('aria-selected', 'true');
            SpriteAnimator.registerEffect(cell, isValid ? 'effect:valid' : 'effect:invalid', { fit: 'cover' });
            this.previewCells.add(cell);
        });
    },

    paintPlacedShip(ship) {
        ship.positions.forEach((position) => {
            const cell = this.getCell(ship.zoneId, position.row, position.column);

            if (!cell) return;

            cell.classList.remove('is-preview-valid', 'is-preview-invalid');
            cell.classList.add('has-ship');
            cell.dataset.shipInstanceId = ship.instanceId;
            cell.setAttribute('aria-label', `${getCoordinate(position.row, position.column)}, ${ship.name} posicionado`);
            SpriteAnimator.registerCell(cell, `ship:${ship.shipId}:${ship.orientation}`, { fit: 'contain' });
        });
    },

    getZoneTitle(zoneId) {
        const zone = GameConfig.zones.find((item) => item.id === zoneId);
        return zone ? zone.title : 'Oceano';
    }
};