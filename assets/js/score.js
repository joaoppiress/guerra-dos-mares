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

const ScoreManager = {
    getStats(ownerId) {
        return GameState.battle.stats[ownerId];
    },

    recordAttack(ownerId) {
        this.getStats(ownerId).attacks += 1;
    },

    recordHit(ownerId, damage, destroyed = false) {
        const stats = this.getStats(ownerId);
        stats.hits += 1;
        stats.damageCaused += Math.max(0, damage);
        if (destroyed) stats.shipsDestroyed += 1;
    },

    recordTrapDamage(ownerId, damage) {
        this.getStats(ownerId).damageCaused += Math.max(0, damage);
    },

    recordTrapTriggered(ownerId) {
        this.getStats(ownerId).trapsTriggered += 1;
    },

    recordVerificationAttempt(ownerId) {
        this.getStats(ownerId).verificationAttempts += 1;
    },

    recordVerificationCorrect(ownerId) {
        this.getStats(ownerId).verificationCorrect += 1;
    },

    calculateScore(ownerId = 'player') {
        const opponentId = ownerId === 'player' ? 'maquina' : 'player';
        const enemyShips = GameState.match?.players[opponentId]?.inventario?.navios || [];
        const totalEnemyHp = enemyShips.reduce((total, ship) => total + ship.maxHp, 0) || 1;
        const stats = this.getStats(ownerId);
        const combatProgress = Math.min(1, stats.damageCaused / totalEnemyHp);
        const pedagogicalPerformance = stats.verificationAttempts
            ? stats.verificationCorrect / stats.verificationAttempts
            : 0;
        const attackAccuracy = stats.attacks ? stats.hits / stats.attacks : 0;
        const score = Math.round(
            combatProgress * 55 +
            pedagogicalPerformance * 35 +
            attackAccuracy * 10
        );

        return Math.max(0, Math.min(100, score));
    },

    getMetrics(ownerId = 'player') {
        const stats = this.getStats(ownerId);

        return {
            ...stats,
            attackAccuracy: stats.attacks ? stats.hits / stats.attacks : 0,
            pedagogicalPerformance: stats.verificationAttempts
                ? stats.verificationCorrect / stats.verificationAttempts
                : 0,
            score: this.calculateScore(ownerId)
        };
    }
};

globalThis.ScoreManager = ScoreManager;
