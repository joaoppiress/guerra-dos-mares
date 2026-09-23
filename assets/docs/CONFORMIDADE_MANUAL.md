# Conformidade — Manual de Padronização de Jogos

- [x] Raiz somente com `index.html`, `README.md`, `assets/`.
- [x] `index.html` é a página principal.
- [x] CSS/JS/imagens/áudio organizados em `assets/`.
- [x] Fluxo direto e tutorial acessível a qualquer momento.
- [x] Interface consistente e responsiva.
- [x] Feedback contínuo: estado, rodada, tempo e pontuação.
- [x] Música e efeitos sonoros controlados separadamente.
- [x] Operação completa por teclado.
- [x] Camada semântica para leitor de tela com ARIA/live region.
- [x] Foco visual no Canvas e foco acessível espelhado visualmente no Canvas.
- [x] Alto contraste e ajuste de tamanho de texto.
- [x] Feedback auditivo e visual.
- [x] Pontuação inteira 0–100.
- [x] BNCC: EF03CO01, EF04CO01 e EF04CO08.
- [x] Exatamente 3 dificuldades: Fácil, Médio e Difícil.
- [x] Conteúdo pedagógico em JSON externo.
- [x] Evento `C4A_GAME_SCORE` e função `sendFinalScore()`.
- [x] Envio final único por partida com `scoreSent`.
- [x] Dificuldade obtida por `getPlatformDifficulty()`; parâmetro externo bloqueia alteração local.
- [x] README documenta mecânica, dependências e implementação.

## Banco pedagógico

- [x] 60 questões oficiais.
- [x] 20 nível 2 / 20 nível 3 / 20 nível 4.
- [x] 30 Verdadeiro / 30 Falso.
- [x] Explicação exibida após a resposta.
- [x] Embaralhamento.
- [x] Sem repetição de questão na mesma partida.
- [x] Colunas com letras, linhas com números, A1 no canto superior esquerdo.
