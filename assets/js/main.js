const gameState = {
    gridSize: 10,
    playerBoard: [], // Matriz 10x10
    machineBoard: [], // Matriz 10x10
    turn: 'player',
    moedas: 5000,
    score: 0
};

function gerarGrid(containerId) {
    const gridElement = document.getElementById(containerId);
    
    for (let linha = 0; l < 10; l++) {
        for (let coluna = 0; c < 10; c++) {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            
            // Define a coordenada da célula
            celula.dataset.linha = linha;
            celula.dataset.coluna = coluna;

            // Evento de clique para interagir (atacar ou analisar)
            celula.addEventListener('click', () => {
                console.log(`Clicou na posição: Linha ${linha}, Coluna ${coluna}`);
                // Aqui você chamará a função de ataque ou de pergunta lógica
            });

            gridElement.appendChild(celula);
        }
    }
}

// Inicializa os grids ao carregar o jogo
gerarGrid('player-grid');
gerarGrid('machine-grid');