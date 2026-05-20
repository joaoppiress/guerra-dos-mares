const gameUI = {
    setStatus({ coins, turn } = {}) {
        const coinsElement = document.getElementById('coins-value');
        const turnElement = document.getElementById('turn-value');

        if (typeof coins === 'number' && coinsElement) {
            coinsElement.textContent = String(coins);
        }

        if (turn && turnElement) {
            turnElement.textContent = turn;
        }
    }
};
