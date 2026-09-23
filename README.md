# Guerra dos Mares — 1x1 Local Sprite-Only

Build de teste hotseat para dois jogadores na mesma máquina, feita em HTML/CSS/JavaScript puro. A interface visível é desenhada em um único `canvas`: mapa, água animada, navios, ícones, HUD, perguntas, feedbacks e telas de passagem de controle. Não há `h1`, cards ou painéis HTML visíveis sobre o jogo.

## Como executar

1. Abra `assets/tools/`.
2. Execute `JOGAR_AGORA.bat`.
3. O navegador abrirá `http://127.0.0.1:8765/`.

O servidor local existe somente para permitir o carregamento dos JSON externos via `fetch()`. Não há backend nem framework.

## Estrutura exigida pelo Manual

Na raiz existem somente:

- `index.html`
- `README.md`
- `assets/`

Recursos ficam em `assets/css`, `assets/js`, `assets/img`, `assets/audio`, `assets/data`, `assets/docs` e `assets/tools`.

## Banco pedagógico oficial

`assets/data/perguntas.json` contém as 60 questões do documento **Banco Pedagógico de Perguntas — Guerra dos Mares**, sem questões inventadas nesta build:

- 20 questões de nível 2 → interface **Fácil**;
- 20 questões de nível 3 → interface **Médio**;
- 20 questões de nível 4 → interface **Difícil**;
- habilidades: `EF03CO01`, `EF04CO01`, `EF04CO08`;
- 30 gabaritos Verdadeiro e 30 Falso;
- cada item mantém pergunta, gabarito e explicação.

As perguntas são embaralhadas e um ID usado não volta a aparecer na mesma partida. Ao esgotar as 20 perguntas do nível atual, a análise informa que o banco daquele nível foi esgotado, em vez de repetir questões.

O grid pedagógico usa **letras A–J nas colunas, números 1–10 nas linhas e A1 no canto superior esquerdo**. Como o mapa possui três zonas 10×10, a nomenclatura A–J/1–10 é repetida em cada zona e o leitor de tela também informa qual oceano contém a coordenada.

## Visual sprite-only

- água animada com quatro frames em loop;
- mapa 30×10 aberto na tela;
- três zonas 10×10 separadas por boias em pixel art;
- navios usam os arquivos-fonte do Sea Warfare Set e são escalados uniformemente, sem deformação;
- orientação horizontal usa rotação de 90°, sem alterar a proporção do sprite;
- efeitos de explosão em nove frames;
- minas, contatos de radar, cursor, hit/miss e botões são sprites;
- o Canvas continua sendo a única interface visual do jogo.

## Fluxo 1x1 local

1. Jogador 1 posiciona a frota em segredo.
2. A tela cobre completamente o mapa antes da troca de pessoa.
3. Jogador 2 posiciona a frota em segredo.
4. O jogo sorteia quem começa.
5. A tela é coberta em toda troca de turno.
6. Cada jogador vê a própria frota e apenas informações inimigas permitidas pelo radar/análise.
7. Vence quem destruir toda a frota adversária.

## Regras principais

- grid global 30×10;
- radar por distância de Chebyshev, raio 3;
- análise V/F uma vez por turno;
- Lança-Armadilhas: tamanho 5, 2000 HP, alcance 7, dano 1500;
- Encouraçado: tamanho 4, 1500 HP, 1 míssil de 900;
- Cruzador: tamanho 3, 900 HP, 2 mísseis de 300;
- Destroier: tamanho 2, 600 HP, 3 mísseis de 170;
- cargas usadas na rodada N retornam na rodada N+2;
- movimento de batalha em passo único de uma casa;
- armadilhas podem ser lançadas no oceano próprio ou no Neutro.

## Pontuação 0–100 e plataforma

A pontuação de cada jogador é atualizada continuamente e mostrada no Canvas junto do tempo decorrido.

Fórmula desta build, permitida pelo Manual porque a lógica de cálculo é responsabilidade do jogo:

- 55%: dano acumulado na frota adversária;
- 35%: precisão pedagógica nas análises V/F;
- 10%: precisão dos ataques.

O resultado é sempre arredondado e limitado a 0–100.

`assets/js/score.js` mantém a função obrigatória `sendFinalScore()` e o bloqueio `scoreSent`. Ao terminar a partida, o envio é realizado uma única vez. Como este modo é hotseat e a plataforma possui uma única sessão, **Jogador 1 é tratado como o jogador da sessão para o payload da plataforma**. O placar de J1 é enviado com `difficulty: getPlatformDifficulty()`.

A dificuldade pode ser fornecida pela plataforma por `?difficulty=facil`, `?difficulty=medio` ou `?difficulty=dificil` (também aceita 2/3/4). Quando há dificuldade externa, o seletor local fica bloqueado. Sem parâmetro externo, o 1x1 de teste permite selecionar Fácil/Médio/Difícil localmente.

## Acessibilidade

A interface continua visualmente 100% Canvas/sprites, mas existe uma camada semântica invisível criada por JavaScript para leitores de tela.

- Canvas focável com foco visual;
- teclado completo por WASD/setas e atalhos;
- `aria-live` para feedback imediato;
- descrição textual do mapa, coordenadas e estado atual;
- controles semânticos equivalentes para leitor de tela;
- quando um controle semântico recebe foco, o Canvas desenha um indicador **FOCO ACESSÍVEL**, mantendo o foco visível sem colocar UI HTML na tela;
- F1: tutorial a qualquer momento;
- F2: menu de acessibilidade/áudio;
- F3: foco nos controles acessíveis;
- alto contraste;
- texto 100%, 125% e 150%;
- música e efeitos sonoros independentes;
- feedback visual e auditivo;
- estado acessível inclui fase, jogador, rodada, dificuldade, tempo, placares, coordenada e HP/cargas do navio selecionado.

Atalhos: WASD/setas, Enter, R, P, 1 Atacar, 2 Mover, 3 Armadilha, 4 Analisar, Espaço Encerrar turno, F1 Tutorial, F2 Acessibilidade, F3 Controles acessíveis, V/F nas perguntas.

## Dependências

Nenhuma biblioteca ou framework externo. HTML, CSS, JavaScript, Canvas 2D e WebAudio nativos.

## Atualização de IHC / Usabilidade
- Interface mais limpa, contrastada e com painéis explicativos.
- Tutoriais com muito mais texto explicando objetivo, mapa, ações e estratégia.
- Tutorial guiado interativo por etapas durante a partida.
- Câmera livre com Shift+WASD, zoom com roda do mouse e teclas + / -.
- Elementos melhor separados e ações com rótulos visíveis.

## Atualização visual — UI Naval
Os botões principais foram substituídos por uma identidade visual naval consistente em azul-marinho e latão/dourado, inspirada em interfaces de jogos de estratégia militar. Foram atualizados: atacar, mover, armadilha, analisar/radar, encerrar turno, ajuda, configurações, música, girar, auto-posicionar, dificuldade e pronto. A câmera recebeu botões próprios de zoom -, centralizar e zoom +.
