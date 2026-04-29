Guerra dos Mares - Jogo Educativo
1. Introdução
Guerra dos Mares é um jogo de estratégia por turnos desenvolvido em HTML, CSS e JavaScript. O projeto visa auxiliar alunos do Ensino Fundamental I (3º e 4º ano) a compreenderem fundamentos de sistemas distribuídos, redes e lógica computacional, alinhando-se às competências da BNCC Computação.

2. Estrutura de Diretórios
Seguindo o Manual de Padronização, o projeto está organizado da seguinte forma:

Plaintext

guerra-dos-mares/
├── assets/
│   ├── audio/   # Efeitos sonoros e trilha sonora (com controles independentes)
│   ├── css/     # Estilização responsiva e animações
│   ├── img/     # Sprites de navios, radar e interface
│   └── js/      # Lógica do jogo e comunicação com a plataforma
├── index.html   # Ponto de entrada principal
└── README.md    # Documentação técnica (este arquivo)

3. Alinhamento Pedagógico (BNCC)
O jogo foi concebido para trabalhar habilidades específicas de forma integrada à mecânica:

(EF03CO01): Praticada no Sistema de Análise de Objetos, onde o aluno valida sentenças lógicas (Verdadeiro/Falso) para identificar alvos.

(EF04CO08): Trabalhada na Confiabilidade de Fontes, penalizando ataques a alvos não verificados, simulando o risco de informações incertas na internet.

(EF04CO01): Aplicada na Manipulação de Matrizes, onde o posicionamento e movimentação das embarcações exigem o uso de coordenadas em um grid bidimensional.

4. Mecânicas Principais
Gestão de Recursos: Compra estratégica de frotas (Lança-Armadilhas, Encouraçado, Cruzador e Destróier) usando um saldo inicial de moedas.

Sistema de Radar: Detecção de objetos desconhecidos que exigem verificação lógica para serem revelados.

Combate por Turnos: Movimentação tática em grade e ataques baseados em precisão.

Parametrização: Todas as perguntas do sistema de análise são carregadas via arquivos JSON externos, permitindo fácil atualização pedagógica.

5. Implementação Técnica
Lógica de Pontuação (Escala 0-100)
A pontuação final é calculada de forma ponderada e normalizada:

PONTOS_NAVIOS (Max 35): Baseado no valor de custo dos navios inimigos destruídos em relação ao saldo inicial.

PONTOS_APROVEITAMENTO (Max 65): Composto por:

Veracidade: Precisão nas respostas de lógica (40 pts).

Descoberta: Bônus por identificar armadilhas e penalidade por cair nelas (10 pts).

Eficiência: Taxa de acerto de disparos (15 pts).

Comunicação com a Plataforma
O jogo utiliza a função obrigatória sendFinalScore para reportar o desempenho via postMessage:

JavaScript

// Exemplo de integração no final da partida
sendFinalScore({
    score: Math.min(100, Math.max(0, pontuacaoTotal)),
    difficulty: getPlatformDifficulty()
});
Acessibilidade e UX
Níveis de Dificuldade: Implementação de 3 níveis (Fácil, Médio, Difícil).

Navegação: Suporte total a teclado e indicadores de foco visíveis.

Feedback: Respostas visuais e sonoras imediatas para cada ação do jogador.

Persistência: Progresso e preferências salvos via localStorage.

6. Tecnologias Utilizadas
HTML5 / CSS3: Estrutura e design responsivo.

JavaScript (ES6+): Motor de lógica e manipulação de estado.

JSON: Armazenamento de dados de configuração e perguntas.

Anime.js (Opcional): Utilizado para transições suaves de interface e movimento dos navios.

7. Autores
João Lucas Theodoro Martins

João Pedro Pires Sá