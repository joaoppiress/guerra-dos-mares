const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({
    console,
    globalThis: null,
    window: { parent: { postMessage() {} } }
});
context.globalThis = context;

function load(file) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

load('assets/js/config.js');
load('assets/js/game-logic.js');
load('assets/js/state.js');
load('assets/js/score.js');

const result = vm.runInContext(`(() => {
    GameState.match = {
        players: {
            player: { inventario: { navios: [] } },
            maquina: { inventario: { navios: [{ maxHp: 1000 }] } }
        }
    };

    const stats = GameState.battle.stats.player;
    stats.damageCaused = 500;
    stats.verificationAttempts = 4;
    stats.verificationCorrect = 3;
    stats.attacks = 4;
    stats.hits = 2;

    return ScoreManager.getMetrics('player');
})()`, context);

assert.equal(result.score, 59);
assert.equal(result.attackAccuracy, 0.5);
assert.equal(result.pedagogicalPerformance, 0.75);

vm.runInContext('GameState.battle.stats.player.damageCaused = 5000', context);
vm.runInContext('GameState.battle.stats.player.verificationCorrect = 4', context);
vm.runInContext('GameState.battle.stats.player.hits = 4', context);
assert.equal(vm.runInContext('ScoreManager.calculateScore(\'player\')', context), 100);

console.log('score: calculo, metricas e limite 0-100 aprovados');
