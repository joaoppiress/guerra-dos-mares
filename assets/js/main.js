const GRID_SIZE = 10;
const GRID_COLUMNS = 'ABCDEFGHIJ'.split('');

const gameState = {
    gridSize: GRID_SIZE,
    difficulty: 'facil',
    coins: 5000,
    turn: 'player',
    boards: {
        ally: [],
        neutral: [],
        enemy: []
    },
    questions: []
};

function createEmptyBoard() {
    return Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({
            type: 'water',
            revealed: false
        }))
    );
}

function getCoordinate(row, column) {
    return `${GRID_COLUMNS[column]}${row + 1}`;
}

function renderGrid(boardName, containerId) {
    const gridElement = document.getElementById(containerId);

    if (!gridElement) return;

    gridElement.innerHTML = '';

    for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let column = 0; column < GRID_SIZE; column += 1) {
            const coordinate = getCoordinate(row, column);
            const cell = document.createElement('button');

            cell.className = 'ocean-cell';
            cell.type = 'button';
            cell.dataset.board = boardName;
            cell.dataset.row = String(row);
            cell.dataset.column = String(column);
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-label', `${coordinate}, ${getBoardLabel(boardName)}`);

            cell.addEventListener('click', () => {
                handleCellSelection(boardName, row, column);
            });

            gridElement.appendChild(cell);
        }
    }
}

function getBoardLabel(boardName) {
    const labels = {
        ally: 'Oceano Aliado',
        neutral: 'Oceano Neutro',
        enemy: 'Oceano Inimigo'
    };

    return labels[boardName] || 'Oceano';
}

function handleCellSelection(boardName, row, column) {
    const coordinate = getCoordinate(row, column);
    console.log(`Selecionou ${coordinate} em ${getBoardLabel(boardName)}.`);
}

async function loadQuestions() {
    try {
        const response = await fetch('assets/js/perguntas.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        gameState.questions = await response.json();
    } catch (error) {
        console.log('Falha ao carregar perguntas:', error?.message || error);
        gameState.questions = [];
    }
}

function setupBoards() {
    gameState.boards.ally = createEmptyBoard();
    gameState.boards.neutral = createEmptyBoard();
    gameState.boards.enemy = createEmptyBoard();

    renderGrid('ally', 'ally-grid');
    renderGrid('neutral', 'neutral-grid');
    renderGrid('enemy', 'enemy-grid');
}

function initGame() {
    setupBoards();
    loadQuestions();
}

document.addEventListener('DOMContentLoaded', initGame);
