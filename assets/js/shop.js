const ShopView = {
    renderSetup() {
        this.renderDifficultyOptions();
        this.renderShipReference();
        this.updateSetupBalance();
    },

    renderDifficultyOptions() {
        const container = document.getElementById('difficulty-options');

        if (!container) return;

        container.innerHTML = '';

        Object.values(GameConfig.difficulties).forEach((difficulty) => {
            const option = document.createElement('button');
            option.className = 'difficulty-option';
            option.type = 'button';
            option.dataset.difficulty = difficulty.id;
            option.setAttribute('role', 'radio');
            option.setAttribute('aria-checked', difficulty.id === GameState.difficulty ? 'true' : 'false');

            option.innerHTML = `
                <strong>${difficulty.label}</strong>
                <span>${difficulty.description}</span>
                <em>${formatCoins(difficulty.coins)}</em>
            `;

            option.addEventListener('click', () => {
                GameState.difficulty = difficulty.id;
                this.updateDifficultySelection();
                this.updateSetupBalance();
            });

            container.appendChild(option);
        });
    },

    updateDifficultySelection() {
        document.querySelectorAll('.difficulty-option').forEach((option) => {
            const isSelected = option.dataset.difficulty === GameState.difficulty;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        });
    },

    updateSetupBalance() {
        const balance = document.getElementById('setup-coins-value');
        const difficulty = GameConfig.difficulties[GameState.difficulty] || GameConfig.difficulties.facil;

        if (balance) {
            balance.textContent = `${formatCoins(difficulty.coins)} moedas`;
        }

        this.updateDifficultySelection();
    },

    renderShipReference() {
        const container = document.getElementById('setup-ship-list');

        if (!container) return;

        container.innerHTML = '';
        GameConfig.ships.forEach((ship) => {
            container.appendChild(createShipInfoCard(ship, false));
        });
    },

    renderPlacementShop() {
        const container = document.getElementById('ship-shop-list');

        if (!container) return;

        container.innerHTML = '';

        GameConfig.ships.forEach((ship) => {
            const card = createShipInfoCard(ship, true);
            const canAfford = GameState.coins >= ship.price;

            card.classList.toggle('is-unavailable', !canAfford);
            card.dataset.shipId = ship.id;
            card.draggable = canAfford;
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-pressed', GameState.selectedShipId === ship.id ? 'true' : 'false');
            card.setAttribute('aria-label', `${ship.name}, custa ${ship.price} moedas, tamanho ${ship.size}`);

            card.addEventListener('click', () => PlacementController.selectShip(ship.id));
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    PlacementController.selectShip(ship.id);
                }
            });
            card.addEventListener('dragstart', (event) => PlacementController.startDrag(event, ship.id));
            card.addEventListener('dragend', () => PlacementController.endDrag());

            container.appendChild(card);
        });

        this.updateSelectedShip();
    },

    updateSelectedShip() {
        document.querySelectorAll('.ship-card').forEach((card) => {
            const isSelected = card.dataset.shipId === GameState.selectedShipId;
            card.classList.toggle('is-selected', isSelected);
            card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
    },

    refreshHud() {
        gameUI.setStatus({
            coins: GameState.coins,
            turn: GameState.phase === 'placement' ? 'Posicionamento' : 'Preparacao'
        });
        this.renderPlacementShop();
    }
};

function createShipInfoCard(ship, compact) {
    const card = document.createElement('article');
    card.className = `ship-card${compact ? ' ship-card-action' : ''}`;

    card.innerHTML = `
        <div class="ship-card-main">
            <strong>${ship.name}</strong>
            <span>${ship.chargeLabel}</span>
        </div>
        <dl class="ship-stats">
            <div><dt>Preco</dt><dd>${formatCoins(ship.price)}</dd></div>
            <div><dt>HP</dt><dd>${ship.hp}</dd></div>
            <div><dt>Tam.</dt><dd>${ship.size}</dd></div>
            <div><dt>Cargas</dt><dd>${ship.charges}</dd></div>
        </dl>
    `;

    return card;
}

function formatCoins(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}
