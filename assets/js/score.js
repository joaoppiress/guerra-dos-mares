let scoreSent = false;
function sendFinalScore({
  score,
  difficulty
} = {}) {
  if (scoreSent) return;
  // Garante o contrato da plataforma: inteiro de 0 a 100 e dificuldade válida.
  const n = Math.round(Number(score));
  score = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  difficulty = (typeof normalizeDifficulty === 'function' && normalizeDifficulty(difficulty)) || 'medio';
  try {
    window.parent.postMessage({
      type: 'C4A_GAME_SCORE',
      payload: {
        score,
        difficulty
      }
    }, '*');
    scoreSent = true;
  } catch (error) {
    console.log('⚠️ Falha ao enviar score:', error?.message || error);
  }
}

function resetScoreSubmission(){
  scoreSent = false;
}
