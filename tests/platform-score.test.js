const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const messages = [];
const context = vm.createContext({
    console,
    globalThis: null,
    window: {
        parent: {
            postMessage(message, target) {
                messages.push({ message, target });
            }
        }
    }
});
context.globalThis = context;

vm.runInContext(
    fs.readFileSync(path.resolve(__dirname, '..', 'assets/js/score.js'), 'utf8'),
    context
);

context.sendFinalScore({ score: 81.6, difficulty: 'medio' });
context.sendFinalScore({ score: 10, difficulty: 'facil' });

assert.equal(messages.length, 1);
assert.equal(messages[0].target, '*');
assert.equal(JSON.stringify(messages[0].message), JSON.stringify({
    type: 'C4A_GAME_SCORE',
    payload: {
        score: 82,
        difficulty: 'medio'
    }
}));

context.resetScoreSubmission();
context.sendFinalScore({ score: 500, difficulty: 'dificil' });
assert.equal(messages.length, 2);
assert.equal(messages[1].message.payload.score, 100);

console.log('platform-score: payload, normalizacao e envio unico aprovados');
