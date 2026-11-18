# Guerra dos Mares

Jogo educacional de estratégia naval (Projeto Integrador I — ADS), feito em HTML/CSS/JavaScript puro, para crianças a partir do 3º/4º ano. O mar, os navios, o placar e as perguntas são desenhados em um `canvas`; ao lado dele fica um **painel de comandos em HTML acessível** (teclado, toque e leitor de tela).

O jogo é **sempre contra o computador** (o capitão inimigo Barba-Rubra), com 3 níveis de dificuldade. Abre numa **tela inicial** com a logo, o botão JOGAR e as opções de acessibilidade.

## Acessibilidade (Narrador do Windows, teclado, alto contraste)

Feita seguindo as Xbox Accessibility Guidelines (narração de tela, navegação de interface, contraste, pistas sonoras):

- **Tela inicial com opções antes de jogar:** Modo leitor de tela, Alto contraste, Texto grande, Menos animação.
- **Mapa acessível** (`assets/js/a11y.js`): o mesmo mapa do canvas em três tabelas HTML (uma por oceano, com cabeçalhos A–J e 1–10). Cada casa é um botão com o que existe nela (“C7, água. Enter atira aqui”, “B3, seu Destroier, vida 600 de 600”, “E5, o Encouraçado cabe aqui”). Funciona no **modo de varredura do Narrador** (que o Chrome/Edge ligam sozinhos) e fora dele (setas andam de casa em casa, Page Up/Down trocam de oceano, Enter faz a ação).
- **Ir para a casa (tecla G):** campo de texto — digite “C7”, escolha o oceano e o foco vai para a casa.
- **Tecla Q (onde estou?):** diz o lugar, o campo atual (nome, tipo, ligado/desligado) e como se movimentar ali; Q duas vezes dá a explicação completa.
- **Atalhos falados:** I = situação da partida, C = casa atual, T = dica do Capitão, N = ir para o mapa; links “Ir para o mapa / Ir para o painel” no começo da página.
- **Duas regiões ao vivo:** avisos importantes (sua vez, acertos, tiros do computador, fim de jogo) interrompem; o resto espera o leitor terminar.
- **Modo leitor de tela:** o computador joga mais devagar (dá tempo de ouvir cada tiro), as dicas automáticas são faladas sem abrir caixas nem roubar o foco.
- **Sons do mapa:** ao andar pelas casas, o som vai da esquerda para a direita conforme a coluna e do grave ao agudo conforme a linha, com um som próprio para navio, contato do radar, acerto, água e mina.
- **Tutorial e janelas:** foco preso no diálogo (Tab/Shift+Tab), foco automático no botão certo (inclusive Verdadeiro/Falso, com a frase ligada ao botão), falas do Capitão anunciadas.
- **Alto contraste:** preto, branco e amarelo em todo o jogo (canvas, painel, tutorial, tela inicial); liga sozinho com o Alto Contraste do Windows (`forced-colors`) ou “mais contraste” do sistema.

## Primeira Missão (tutorial guiado pelo Capitão)

Na primeira vez que o jogo abre, o **Capitão Maré** (`assets/img/ui/capitao.png`) aparece da cintura para cima ao lado de uma caixa de diálogo, com o jogo escurecido atrás. Botões: **VAMOS LÁ!** ou **JÁ SEI JOGAR** (desliga o tutorial, mas a Dica do Capitão continua disponível).

Etapas (o jogador aprende fazendo — etapas de ação só avançam quando a ação real acontece):

1. **Conheça o mapa** — os três oceanos, as letras das colunas, os números das linhas e a coordenada **A1** com setas;
2. **Monte sua frota** — escolher um navio na lista; tocar numa casa verde (o Capitão marca uma casa boa; se errar, ele explica: “Esse navio não cabe aí. Procure uma área verde”);
3. **Girar** — apertar GIRAR;
4. **Termine sua frota** — continuar à mão ou usar AUTOMÁTICO, depois PRONTO;
5. **A batalha começou** — a regra principal: *1. escolha um navio → 2. escolha uma ação → 3. escolha uma casa*;
6. escolher um navio com canhões, ATACAR e atirar; resultado (ACERTO! / ÁGUA!);
7. **Radar** — um sinal de treino de Verdadeiro ou Falso (não conta pontos);
8. **Passar a vez**.

O elemento certo fica aberto no véu, com contorno dourado pulsando e uma seta. Tab/Shift+Tab ficam presos no diálogo (e no elemento destacado), Enter ativa, as falas vão para `aria-live`. Dá para pular a qualquer momento e **rever** pela aba Ajuda. Se o PNG do Capitão não existir, o tutorial funciona normalmente sem a imagem.

**AGORA FAÇA ISTO:** quadro fixo no topo da aba Jogar (e faixa “AGORA:” embaixo do mapa) com a próxima ação, sempre atualizado. Botões **Mostrar onde** (destaca o próximo elemento) e **Dica** (Dica do Capitão, pelo estado real da partida). Se o jogador ficar ~8 segundos parado, o Capitão aparece com “Precisa de uma mão?” e o botão **MOSTRAR ONDE CLICAR**.

**Troca de jogador (2 jogadores):** tela que cobre tudo, com o Capitão: “Hora de passar o comando!” e o botão grande **SOU O JOGADOR 2**.

**Durante a partida:** falas curtas do Capitão (“Na mosca!”, “Passou perto!”, “Tem alguma coisa por perto!”), palavras grandes no mapa (ACERTO!, ÁGUA!, ARMADILHA ESCONDIDA!), tremida curta em acertos, coordenada grande ao lado do cursor (ex.: “ALVO: C7”), estrelas por resposta certa e conquistas da partida (PRIMEIRO ACERTO!, MIRA AFIADA!, MESTRE DO RADAR!, CAPITÃO CURIOSO!, NAVIO AFUNDADO!).

## IA do computador

A IA (`assets/js/ai.js`) usa **as mesmas ações e regras do jogador** (cargas N+2, alcance de ataque de cada navio, alcance 7 das armadilhas, radar de Chebyshev raio 3, movimento em linha reta de 1 a 3 casas) e **não espia** a frota do jogador: só sabe o que os próprios tiros, o radar e as análises revelaram.

| Dificuldade | Comportamento |
|---|---|
| Fácil | até 2 ações por vez; tiros aleatórios em casas válidas; às vezes atira em “?” sem analisar e esconde armadilhas ao acaso |
| Médio | até 3 ações; lembra acertos e persegue navios danificados; analisa contatos (acerta ~70% das perguntas) |
| Difícil | até 5 ações; prioriza os navios maiores já revelados, continua a linha de acertos, procura em xadrez, analisa antes de atirar em “?” (~85%) e esconde armadilhas no caminho dos navios vistos |

Antes de jogar, a IA “pensa” por 1–2,6 s (nunca mais de 5 s) e depois faz uma ação por vez, para dar tempo de ver. Durante a vez do computador o jogador não consegue mexer no tabuleiro (o jogo explica: “Espere! O computador está jogando agora”). Os tiros do computador caem do céu (para não revelar onde estão os navios dele) e ficam marcados no oceano do jogador. Contra o computador o jogador sempre começa.

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

Recursos ficam em `assets/css`, `assets/js`, `assets/img`, `assets/audio`, `assets/fonts`, `assets/data`, `assets/docs` e `assets/tools`.

Scripts (na ordem de carregamento):

- `config.js` — regras, navios e dificuldade da plataforma;
- `logic.js` — posicionamento, movimento, radar e recarga;
- `score.js` — `sendFinalScore()` e bloqueio `scoreSent`;
- `game.js` — estado da partida, modos de jogo, entrada, áudio e desenho no canvas;
- `ai.js` — IA do computador (3 dificuldades);
- `panel.js` — painel lateral acessível (abas Jogar, Radar, Ajuda e Ajustes);
- `mission.js` — Primeira Missão e Dica do Capitão.

## Banco pedagógico oficial

`assets/data/perguntas.json` contém as 60 questões do documento **Banco Pedagógico de Perguntas — Guerra dos Mares**, sem questões inventadas nesta build:

- 20 questões de nível 2 → interface **Fácil**;
- 20 questões de nível 3 → interface **Médio**;
- 20 questões de nível 4 → interface **Difícil**;
- habilidades da **BNCC de Computação**: `EF03CO01`, `EF04CO01`, `EF04CO08` (3º e 4º ano do Ensino Fundamental);
- 30 gabaritos Verdadeiro e 30 Falso;
- cada item mantém pergunta, gabarito e explicação.

As perguntas são embaralhadas e um ID usado não volta a aparecer na mesma partida. Ao esgotar as 20 perguntas do nível atual, a análise informa que o banco daquele nível foi esgotado, em vez de repetir questões.

O grid pedagógico usa **letras A–J nas colunas, números 1–10 nas linhas e A1 no canto superior esquerdo**. Como o mapa possui três zonas 10×10, a nomenclatura A–J/1–10 é repetida em cada zona e o leitor de tela também informa qual oceano contém a coordenada.

## Visual infantil e limpo

- tema de mar com saturação baixa (não compete com navios e interface), com peixinhos, bolhas e algas (Kenney Fish Pack);
- três oceanos 10×10 em cartões arredondados: azul (Jogador 1), verde-água (Neutro) e vermelho claro (Jogador 2), separados por cordas com boias;
- navios montados com peças do Kenney Pirate Pack: casco + velas da cor do time + bandeira + tripulação. O casco é dividido em proa, meio e popa e o meio é repetido para formar navios de 2 a 5 casas, **sem esticar** nenhum sprite;
- navio com menos da metade da vida troca para velas rasgadas e pega fogo;
- tiros com bala de canhão animada, explosões e splash na água;
- contatos do radar aparecem como bolhas com “?”; minas são desenhadas com a cor do dono;
- placar com estrelas, botões “gordinhos” e fonte arredondada Fredoka;
- telas de pergunta, resposta, risco, guia, troca de jogador e vitória em cartões grandes com botões coloridos;
- a tela de troca de jogador cobre o mapa inteiro para ninguém espiar.
- ao tocar/clicar em um navio seu na batalha, a câmera dá um zoom suave nele, o resto do mar escurece (holofote com borda brilhante) e quatro botões redondos voam do navio até ficarem em volta dele: **Atacar (1), Mover (2), Armadilha (3) e Analisar (4)**. Ações indisponíveis aparecem em cinza e, se tocadas, explicam o motivo. Escolher uma ação, tocar fora ou apertar Esc desfaz o zoom. Os botões abrem em leque, voam em curva e voltam para o navio ao fechar; há um cartão com vida/cargas, um botão ✕ e dicas ao passar o mouse.
- **Cancelar uma ação antes de fazer:** ao escolher Atacar/Mover/Armadilha/Analisar aparece uma barra com o botão **Cancelar** (embaixo do mapa, ou no topo em telas baixas) e um cartão “Ação escolhida” com **Cancelar ação** no painel. Também cancelam: Esc, botão direito do mouse, a mesma tecla/botão de novo ou tocar no próprio navio. Nada é gasto ao cancelar.

## Celular

O jogo é jogado com o **celular deitado**. Em pé (telas de até 600 px de largura) aparece a tela **“VIRE SEU CELULAR — Os navios precisam de mais espaço!”**, com um celular girando (parado se “Reduzir animações” estiver ligado). Deitado, botões e navios têm pelo menos 44 px de toque.

- quando os três oceanos não cabem com um tamanho bom de toque, o mapa usa a altura toda (casas de até 34 px) e mostra um oceano por vez;
- botões **Jogador 1 (você) · Neutro · Jogador 2** no topo deslizam entre os oceanos; também dá para arrastar o mapa com o dedo e dar zoom com pinça;
- a câmera acompanha o jogo: mostra o oceano certo no posicionamento, no início de cada vez, ao escolher navio, ao mover o cursor e ao girar o celular;
- os números das linhas (1–10) ficam grudados na borda da tela enquanto o mapa desliza;
- arrastar nunca coloca navio nem atira por engano: só um toque curto conta como jogada;
- deitado, o painel fica numa lateral estreita (em tablets em pé ele vira uma gaveta embaixo);
- janelas (pergunta, vitória etc.) encolhem inteiras em telas baixas, sem cortar texto nem botões;
- vibração curta em acertos e avisos (desliga junto com os efeitos sonoros);
- respeita as áreas seguras do aparelho (notch e barra inferior).

## Fluxo contra o computador

1. O Capitão posiciona a frota (ou aperta Automático) e aperta Pronto.
2. O computador arruma a frota dele sozinho.
3. O Capitão começa; a cada troca aparece uma faixa grande “Sua vez, Capitão!” / “Vez do Computador”.
4. Vence quem destruir toda a frota adversária.

## Modo 2 jogadores (desativado)

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
- **MOVER** em linha reta: Destroier anda até 3 casas, Cruzador e Encouraçado até 2, Lança-Armadilhas 1 (casas verdes mostram onde dá para ir);
- **alcance de ataque** por navio (Chebyshev): Encouraçado 11, Cruzador 9, Destroier 8 — as casas clarinhas mostram o alcance;
- **alcance do radar para ANALISAR**: 5 casas a partir do navio escolhido;
- armadilhas podem ser lançadas no oceano próprio ou no Neutro.

## Pontuação 0–100 e plataforma

A pontuação de cada jogador é atualizada continuamente e mostrada no Canvas junto do tempo decorrido.

Fórmula desta build, permitida pelo Manual porque a lógica de cálculo é responsabilidade do jogo:

- 55%: dano acumulado na frota adversária;
- 35%: precisão pedagógica nas análises V/F;
- 10%: precisão dos ataques.

O resultado é sempre arredondado e limitado a 0–100.

`assets/js/score.js` mantém a função obrigatória `sendFinalScore()` e o bloqueio `scoreSent`. Ao terminar a partida, o envio é realizado uma única vez. A plataforma possui uma única sessão, então **o Jogador 1 (o Capitão, contra o computador) é o jogador da sessão no payload**. Antes do envio o valor é validado de novo (inteiro, 0–100) e a dificuldade é normalizada. O placar de J1 é enviado com `difficulty: getPlatformDifficulty()`.

A dificuldade pode ser fornecida pela plataforma por `?difficulty=facil`, `?difficulty=medio` ou `?difficulty=dificil` (também aceita 2/3/4). Quando há dificuldade externa, o seletor local fica bloqueado. Sem parâmetro externo, o 1x1 de teste permite selecionar Fácil/Médio/Difícil localmente.

## Acessibilidade

O canvas mostra o jogo; todos os comandos também existem no **painel lateral em HTML**, que funciona com mouse, toque, teclado e leitor de tela.

Painel lateral:

- abas **Jogar**, **Radar**, **Ajuda** e **Ajustes** no padrão ARIA de abas (setas ←/→, Home e End trocam de aba; só a aba ativa entra no Tab);
- o painel pode ser escondido ou mostrado pelo botão do cabeçalho (`aria-expanded`), e o mapa cresce para ocupar o espaço;
- sem armadilha de foco: Tab percorre o painel e sai normalmente;
- quando o conteúdo muda, o foco volta para o mesmo botão (ou para o próximo botão útil), em vez de se perder;
- quando abre uma janela no mapa (troca de jogador, pergunta, resposta, risco, vitória), o painel mostra os mesmos botões e o foco vai para o principal;
- ações indisponíveis continuam focáveis com `aria-disabled` e, ao serem ativadas, dizem o motivo (ex.: “Esse navio já agiu nesta vez”);
- direcional (▲ ▼ ◀ ▶ + confirmar) mostrando a coordenada atual, útil para toque e leitor de tela;
- lista de navios com vida, cargas e estado; lista de contatos do radar com botão de análise;
- Enter/Espaço em um botão do painel ativam apenas aquele botão (não disparam atalhos do jogo);
- alvos de toque com pelo menos 44 px e foco visível bem forte (contorno amarelo + borda escura).

Ajustes (salvos no navegador):

- alto contraste (canvas e painel);
- tamanho do texto: Normal, Grande e Gigante (100%, 125%, 150%), aplicado no canvas e no painel;
- reduzir animações (já vem ligado quando o sistema pede menos movimento);
- música e efeitos sonoros independentes;
- zoom e centralização do mapa.

Layout à prova de texto grande:

- no canvas, textos que não cabem diminuem até 70% e só então ganham reticências (nunca são espremidos);
- botões tiram o atalho “(Enter)” do rótulo quando falta espaço; pares de botões ficam empilhados em telas estreitas;
- janelas calculam a altura pelo conteúdo, usam mais largura antes de encolher e nunca cortam texto;
- o placar do topo cresce com o tamanho do texto e esconde itens menos importantes se faltar espaço;
- no painel, grades viram uma coluna conforme a largura real de cada cartão (container queries); com pouco espaço as abas mostram o ícone em cima do nome e, no limite, só o ícone (o nome continua para o leitor de tela).

Outros recursos:

- região `aria-live` anuncia cada acontecimento (acerto, água, troca de vez, coordenada do cursor, etc.);
- descrição textual do mapa e estado da partida (fase, jogador, rodada, dificuldade, tempo, placares, coordenada e navio selecionado);
- Primeira Missão acessível: falas anunciadas, foco no controle certo e opção de pular/rever;
- o menu que voa em volta do navio é um atalho visual: as mesmas ações continuam no painel e nas teclas 1–4; ao selecionar o navio o leitor de tela anuncia as opções; Esc fecha o menu; com “Reduzir animações” nada voa nem dá zoom animado (aparece direto); no alto contraste os botões ficam brancos com contorno preto;
- zoom do navegador liberado (sem `user-scalable=no`).

Atalhos: setas/WASD movem o cursor, Enter confirma, R gira, P posiciona automático, 1 Atacar, 2 Mover, 3 Armadilha, 4 Analisar, Espaço passa a vez, Esc cancela/fecha, V/F nas perguntas, M música, F1 Guia do Capitão, F2 Ajustes, F3 vai para o painel, Shift+setas arrastam o mapa, + / − / 0 controlam o zoom.

## Som e animações

- **Trilha procedural** (WebAudio) de aventura naval: valsa de marinheiro em 6/8 com baixo, acordes suaves e percussão leve, bem baixinha;
- **efeitos distintos**: clique, seleção, tiro, explosão, água (splash), sonar do radar, mina, movimento, resposta certa, resposta errada, troca de turno (sua vez / vez do computador), vitória, derrota e conquista;
- música e efeitos ligam/desligam separadamente (tecla M para a música);
- **feedback visual**: bala de canhão, explosão, splash, número de dano flutuando (“-900”), onda de radar saindo dos navios quando surge um “?”, faixa grande de troca de turno;
- **microconquistas** durante a partida: primeiro acerto, primeiro navio afundado, primeiro sinal decodificado e armadilha que funcionou;
- “Reduzir animações” deixa tudo parado (faixas aparecem sem deslizar, sem ondas de radar nem confete).

## Dependências

Nenhuma biblioteca ou framework externo. HTML, CSS, JavaScript, Canvas 2D e WebAudio nativos. A fonte Fredoka é servida localmente de `assets/fonts/`.

## Créditos dos assets

Todos os sprites e sons vêm de pacotes gratuitos CC0 da Kenney (kenney.nl): Pirate Pack, Fish Pack e UI Pack. O Capitão é um personagem criado para o jogo. Música e a maior parte dos efeitos são sintetizados por código. A fonte Fredoka é licenciada pela SIL Open Font License. Detalhes em `assets/docs/LICENSES_AND_CREDITS.txt`.

## Partida salva

Durante a batalha o jogo salva sozinho (no navegador) sempre que é a vez do jogador. Se a página for fechada no meio da partida, a tela inicial mostra **Continuar partida**. Escolher **Novo jogo** apaga o jogo salvo.

## Escolha da dificuldade

Ao apertar **Jogar** o jogo pergunta a dificuldade (Fácil, Médio ou Difícil). Se a plataforma já mandou a dificuldade (`?difficulty=`), essa pergunta é pulada.

## Diversão extra

- **Álbum de conquistas:** botão Conquistas na tela inicial com 11 conquistas (tutorial, primeiro acerto, mira afiada, navio afundado, tesouro, armadilha, perguntas, radar e vitória em cada dificuldade). Ficam salvas no navegador; as bloqueadas dizem como ganhar.
- **Navio vira ao andar:** a proa aponta para onde o navio anda; andando de lado, ele gira em volta do meio se houver espaço.

- **História no tutorial:** o Capitão Maré e o Barba-Rubra conversam com emoções (medo, raiva, risada, comemoração). As expressões usam `assets/img/ui/capitao_<humor>.png` (feliz, medo, bravo, surpreso, pensando, comemorando) e `vilao_<humor>.png` (rindo, bravo, medo, chorando, surpreso, convencido); se o arquivo não existir, o jogo usa a imagem padrão.
- **Tutorial único:** antes de começar, o Capitão pergunta se a criança joga com teclado ou leitor de tela; se sim, as explicações de acessibilidade entram no mesmo tutorial.

- **Baús do tesouro:** 4 baús aparecem no Oceano Neutro no começo da batalha. O navio que passar por cima ganha um prêmio surpresa: balas recarregadas, conserto (+40% de vida) ou uma luneta que revela um navio inimigo. O computador também pode pegar baús.
- **Pergunta certa vale bala:** acertar a pergunta do radar dá +1 bala para o navio que analisou.
- **Barba-Rubra fala:** o pirata comenta os próprios tiros e reclama quando leva um tiro ou perde um baú.
- **Vitória com confete.**
