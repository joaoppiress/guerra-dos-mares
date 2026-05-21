async function loadQuestions() {
    try {
        const response = await fetch('assets/js/perguntas.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        GameState.questions = await response.json();
    } catch (error) {
        console.log('Falha ao carregar perguntas:', error?.message || error);
        GameState.questions = [];
    }
}

function startGame() {
    GameState.startPlacement(GameState.difficulty);

    const setupScreen = document.getElementById('setup-screen');
    const gameBoard = document.getElementById('game-board');

    if (setupScreen) setupScreen.classList.add('is-hidden');
    if (gameBoard) gameBoard.classList.remove('is-hidden');

    GridView.renderBoards();
    ShopView.refreshHud();
    PlacementController.init();
    SpriteAnimator.start();
}

function bindSetupActions() {
    const startButton = document.getElementById('start-game-button');

    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
}

function initGame() {
    SpriteAnimator.init();
    GameState.resetBoards();
    ShopView.renderSetup();
    bindSetupActions();
    loadQuestions();
}

document.addEventListener('DOMContentLoaded', initGame);
