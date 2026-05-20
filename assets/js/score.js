let scoreSent = false;

function sendFinalScore({ score, difficulty } = {}) {
    if (scoreSent) return;
    try {
        window.parent.postMessage({
            type: 'C4A_GAME_SCORE',
            payload: { score, difficulty }
        }, '*');
        scoreSent = true;
    } catch (error) {
        console.log('Falha ao enviar score:', error?.message || error);
    }
}
