async function loadQuestions() {
    try {
        const response = await fetch('assets/data/perguntas.json', { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const questions = await response.json();
        validateQuestionBank(questions);
        GameState.questions = shuffleQuestions(questions);
    } catch (error) {
        console.log('Falha ao carregar perguntas:', error?.message || error);
        GameState.questions = [];
    }
}

function validateQuestionBank(questions) {
    const expectedDifficulties = ['facil', 'medio', 'dificil'];

    if (!Array.isArray(questions) || questions.length !== 60) {
        throw new Error('O banco deve conter exatamente 60 perguntas.');
    }

    const ids = new Set();
    const totals = Object.fromEntries(expectedDifficulties.map((difficulty) => [difficulty, 0]));

    questions.forEach((question, index) => {
        const validAnswer = typeof question?.resposta === 'boolean';
        const requiredText = ['id', 'dificuldade', 'pergunta', 'explicacao'];
        const hasRequiredText = requiredText.every((field) =>
            question?.[field] !== undefined && String(question[field]).trim().length > 0
        );

        if (!question || typeof question !== 'object' || !hasRequiredText || !validAnswer) {
            throw new Error(`Pergunta invalida na posicao ${index + 1}.`);
        }

        if (!Object.hasOwn(totals, question.dificuldade)) {
            throw new Error(`Dificuldade invalida na pergunta ${question.id}.`);
        }

        if (ids.has(question.id)) {
            throw new Error(`ID de pergunta duplicado: ${question.id}.`);
        }

        ids.add(question.id);
        totals[question.dificuldade] += 1;
    });

    expectedDifficulties.forEach((difficulty) => {
        if (totals[difficulty] !== 20) {
            throw new Error(`A dificuldade ${difficulty} deve conter 20 perguntas.`);
        }
    });

    return true;
}

function shuffleQuestions(questions) {
    const shuffled = [...questions];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
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
    createBattleStartButton();
    SpriteAnimator.start();
}

function createBattleStartButton() {
    const panel = document.querySelector('.fleet-panel');

    if (!panel || document.getElementById('start-battle-button')) return;

    const button = document.createElement('button');
    button.id = 'start-battle-button';
    button.className = 'primary-action start-battle-action';
    button.type = 'button';
    button.disabled = true;
    button.textContent = 'Iniciar batalha';
    button.addEventListener('click', () => {
        const shopList = document.getElementById('ship-shop-list');
        const keyboardHelp = document.querySelector('.keyboard-help');

        if (shopList) shopList.classList.add('is-hidden');
        if (keyboardHelp) keyboardHelp.classList.add('is-hidden');

        TurnManager.startBattle();
    });

    panel.appendChild(button);
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
