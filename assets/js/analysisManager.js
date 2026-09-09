class AnalysisManager {
    static currentAnalysis = null;

    static loadQuestionsFromJSON() {
        return loadQuestions();
    }

    static normalizeDifficulty(difficulty) {
        const map = {
            facil: 'facil',
            normal: 'medio',
            medio: 'medio',
            dificil: 'dificil'
        };

        return map[difficulty] || 'facil';
    }

    static getQuestionForCurrentDifficulty() {
        const difficulty = this.normalizeDifficulty(GameState.difficulty);
        const pool = GameState.questions.filter((question) =>
            question.dificuldade === difficulty &&
            !GameState.usedQuestionIds.has(question.id)
        );

        if (pool.length === 0) return null;

        const question = pool[Math.floor(Math.random() * pool.length)];
        GameState.usedQuestionIds.add(question.id);

        return question;
    }

    static getAnalysisAvailable() {
        const player = GameState.getHumanPlayer();

        return Boolean(GameState.battle.analysisAvailable && (!player || player.analiseDisponivel));
    }

    static setAnalysisAvailable(isAvailable) {
        const player = GameState.getHumanPlayer();

        GameState.battle.analysisAvailable = isAvailable;

        if (player) {
            player.analiseDisponivel = isAvailable;
        }
    }

    static isTargetAlive(target) {
        if (!target) return false;

        if (target.type === 'trap') {
            return target.item?.isActive !== false;
        }

        return Boolean(target.item && !target.item.isDestroyed && target.item.hp > 0);
    }

    static isTargetRevealed(key, target) {
        if (GameState.battle.revealedObjects.get(key)?.item === target.item) return true;

        return [...GameState.battle.revealedObjects.values()].some((revealed) =>
            revealed.item === target.item
        );
    }

    static isPositionDetected(position) {
        const playerShips = GameState.match.players.player.inventario.navios
            .filter((ship) => !ship.isDestroyed);

        return RadarManager.isDetectedByAnyShip(position, playerShips);
    }

    static getAnalyzableUnknown(position) {
        const key = MovementManager.getCellKey(position);
        const knownUnknown = GameState.battle.unknownObjects.get(key);
        const target = knownUnknown || CombatManager.getTargetAt(position, 'player');

        if (!target) return null;
        if (!this.isTargetAlive(target)) return null;
        if (this.isTargetRevealed(key, target)) return null;
        if (!this.isPositionDetected(position)) return null;

        if (!knownUnknown) {
            RadarManager.showUnknownObject(position, target);
        }

        return {
            key,
            position,
            type: target.type,
            item: target.item
        };
    }

    static analyzeUnknownObject(position) {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        if (!GameState.isHumanTurn()) {
            TurnManager.showMessage('Vez da Maquina');
            return false;
        }

        if (!this.getAnalysisAvailable()) {
            TurnManager.setBattleMessage('Voce ja usou a analise desta rodada.', 'warning');
            return false;
        }

        const unknown = this.getAnalyzableUnknown(position);

        if (!unknown) {
            TurnManager.setBattleMessage('Nao ha objeto desconhecido nessa posicao.', 'warning');
            return false;
        }

        const question = this.getQuestionForCurrentDifficulty();

        if (!question) {
            TurnManager.setBattleMessage('Nenhuma pergunta disponivel para analise.', 'warning');
            return false;
        }

        ScoreManager.recordVerificationAttempt(GameState.getActivePlayerId());
        this.currentAnalysis = { key: unknown.key, unknown, question };
        this.openModal(question);
        return true;
    }

    static ensureModal() {
        let modal = document.getElementById('analysis-modal');

        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'analysis-modal';
        modal.className = 'analysis-modal is-hidden';
        modal.innerHTML = `
            <div class="analysis-dialog" role="dialog" aria-modal="true" aria-labelledby="analysis-title">
                <h2 id="analysis-title">Analise de objeto</h2>
                <p id="analysis-question"></p>
                <div class="analysis-actions">
                    <button type="button" data-answer="true">Verdadeiro</button>
                    <button type="button" data-answer="false">Falso</button>
                </div>
                <p id="analysis-feedback" class="analysis-feedback"></p>
                <button id="analysis-close" class="analysis-close is-hidden" type="button">Fechar</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelectorAll('[data-answer]').forEach((button) => {
            button.addEventListener('click', () => {
                this.answerQuestion(button.dataset.answer === 'true');
            });
        });
        modal.querySelector('#analysis-close').addEventListener('click', () => this.closeModal());

        return modal;
    }

    static openModal(question) {
        const modal = this.ensureModal();

        modal.classList.remove('is-hidden');
        modal.querySelector('#analysis-title').textContent =
            `Análise de objeto • Nível ${question.nivel} • ${question.habilidade}`;
        modal.querySelector('#analysis-question').textContent = question.pergunta;
        modal.querySelector('#analysis-feedback').textContent = '';
        modal.querySelector('#analysis-feedback').classList.remove('is-correct', 'is-incorrect');
        modal.querySelector('#analysis-close').classList.add('is-hidden');
        modal.querySelectorAll('[data-answer]').forEach((button) => {
            button.disabled = false;
        });
    }

    static answerQuestion(answer) {
        if (!this.currentAnalysis) return;

        const { key, unknown, question } = this.currentAnalysis;
        const acertou = answer === question.resposta;
        const modal = this.ensureModal();
        const feedback = modal.querySelector('#analysis-feedback');
        const expectedAnswer = question.gabarito || (question.resposta ? 'Verdadeiro' : 'Falso');

        this.setAnalysisAvailable(false);
        feedback.classList.add(acertou ? 'is-correct' : 'is-incorrect');

        if (acertou) {
            ScoreManager.recordVerificationCorrect(GameState.getActivePlayerId());
            GameState.battle.revealedObjects.set(key, {
                type: unknown.type,
                item: unknown.item
            });
            feedback.textContent = `Correto. Gabarito: ${expectedAnswer}. O contato é ${unknown.type === 'trap' ? 'uma armadilha' : 'uma embarcação inimiga'}. ${question.explicacao}`;
            TurnManager.setBattleMessage('Objeto revelado pela analise.', 'success');
        } else {
            feedback.textContent = `Resposta incorreta. Gabarito: ${expectedAnswer}. ${question.explicacao}`;
            TurnManager.setBattleMessage('Analise consumida sem revelar o objeto.', 'warning');
        }

        modal.querySelectorAll('[data-answer]').forEach((button) => {
            button.disabled = true;
        });
        modal.querySelector('#analysis-close').classList.remove('is-hidden');
        RadarManager.scanRadar();
        TurnManager.finishTurnIfNoActions();
    }

    static closeModal() {
        const modal = this.ensureModal();

        modal.classList.add('is-hidden');
        this.currentAnalysis = null;
    }
}

function loadQuestionsFromJSON() {
    return AnalysisManager.loadQuestionsFromJSON();
}

function analyzeUnknownObject(position) {
    return AnalysisManager.analyzeUnknownObject(position);
}

globalThis.AnalysisManager = AnalysisManager;
globalThis.loadQuestionsFromJSON = loadQuestionsFromJSON;
globalThis.analyzeUnknownObject = analyzeUnknownObject;
