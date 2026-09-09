const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({
    console,
    globalThis: null,
    window: { confirm: () => true, setTimeout: () => 0 },
    document: { getElementById: () => null, body: { appendChild() {} } }
});
context.globalThis = context;

function load(file) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

load('assets/js/config.js');
load('assets/js/game-logic.js');
load('assets/js/state.js');
load('assets/js/score.js');

vm.runInContext(`
    const testCells = new Map();
    function makeClassList() {
        const values = new Set();
        return {
            add: (...names) => names.forEach((name) => values.add(name)),
            remove: (...names) => names.forEach((name) => values.delete(name)),
            contains: (name) => values.has(name),
            toggle: (name, force) => force ? values.add(name) : values.delete(name)
        };
    }
    const GridView = {
        getCellKey: (zoneId, row, column) => zoneId + ':' + row + ':' + column,
        getCell(zoneId, row, column) {
            const key = this.getCellKey(zoneId, row, column);
            if (!testCells.has(key)) {
                testCells.set(key, {
                    classList: makeClassList(),
                    dataset: {},
                    style: {},
                    setAttribute() {}
                });
            }
            return testCells.get(key);
        },
        getCellsForPlacement(zoneId, row, column, size, orientation) {
            return Array.from({ length: size }, (_, index) => ({
                row: orientation === 'vertical' ? row + index : row,
                column: orientation === 'horizontal' ? column + index : column
            }));
        },
        getZoneTitle: (zoneId) => zoneId,
        paintPlacedShip() {},
        paintPreview() {},
        clearPreview() {}
    };
    const SpriteAnimator = { registerCell() {}, registerEffect() {}, unregisterEffect() {} };
    const TurnManager = {
        showMessage() {}, setBattleMessage() {}, updateSelectedShipPanel() {}, finishTurnIfNoActions() {}
    };
`, context);

load('assets/js/movementManager.js');
load('assets/js/radarManager.js');
load('assets/js/analysisManager.js');
load('assets/js/combatManager.js');

const results = vm.runInContext(`(() => {
    function ship(config) {
        return Game.criarNavioPorConfig(config);
    }

    function setPosition(item, ownerId, zoneId, row, column, size = 1, orientation = 'horizontal') {
        const positions = MovementManager.getPositions(zoneId, row, column, size, orientation);
        item.ownerId = ownerId;
        item.atualizarPosicao({ zoneId, row, column, orientation, positions });
        return item;
    }

    GameState.resetBoards();
    GameState.match = new Game({ moedasIniciais: 10000, random: () => 0 });
    GameState.phase = 'battle';
    GameState.match.jogadorAtivoId = 'player';
    GameState.battle.mainActionAvailable = true;
    GameState.battle.analysisAvailable = true;
    GameState.battle.unknownObjects = new Map();
    GameState.battle.revealedObjects = new Map();
    GameState.battle.traps = [];
    GameState.battle.nextTrapId = 1;

    const detectorA = setPosition(ship({ id: 'detector-a', nome: 'A', hp: 100, size: 1, charges: 1, damage: 1 }), 'player', 'neutral', 5, 7);
    const detectorB = setPosition(ship({ id: 'detector-b', nome: 'B', hp: 100, size: 1, charges: 1, damage: 1 }), 'player', 'enemy', 0, 4);
    const enemy = setPosition(ship({ id: 'enemy-ship', nome: 'Inimigo', hp: 500, size: 1, charges: 1, damage: 1 }), 'maquina', 'enemy', 5, 0);
    GameState.match.players.player.inventario.navios.push(detectorA, detectorB);
    GameState.match.players.maquina.inventario.navios.push(enemy);

    const inside = RadarManager.isDetectedByAnyShip(enemy.positions[0], [detectorA]);
    const outside = RadarManager.isDetectedByAnyShip({ zoneId: 'enemy', row: 9, column: 1 }, [detectorA]);
    const corner = RadarManager.isDetectedByAnyShip({ zoneId: 'enemy', row: 3, column: 7 }, [detectorB]);
    const overlap = RadarManager.isDetectedByAnyShip(enemy.positions[0], [detectorA, detectorB]);
    const firstScan = RadarManager.scanRadar();
    const enemyKey = MovementManager.getCellKey(enemy.positions[0]);
    const unknownClass = GridView.getCell('enemy', 5, 0).classList.contains('is-unknown');
    const analyzableBeforeReveal = Boolean(AnalysisManager.getAnalyzableUnknown(enemy.positions[0]));

    GameState.battle.revealedObjects.set(enemyKey, { type: 'ship', item: enemy });
    RadarManager.scanRadar();
    const revealedClass = GridView.getCell('enemy', 5, 0).classList.contains('is-revealed-ship');
    detectorA.atualizarPosicao({ zoneId: 'ally', row: 9, column: 0, orientation: 'horizontal', positions: [{ zoneId: 'ally', row: 9, column: 0 }] });
    detectorB.atualizarPosicao({ zoneId: 'ally', row: 0, column: 0, orientation: 'horizontal', positions: [{ zoneId: 'ally', row: 0, column: 0 }] });
    RadarManager.scanRadar();
    const leftRange = !GridView.getCell('enemy', 5, 0).classList.contains('is-revealed');
    const discoveryPersisted = GameState.battle.revealedObjects.has(enemyKey);

    detectorA.atualizarPosicao({ zoneId: 'neutral', row: 5, column: 7, orientation: 'horizontal', positions: [{ zoneId: 'neutral', row: 5, column: 7 }] });
    RadarManager.scanRadar();
    const analysisTarget = AnalysisManager.getAnalyzableUnknown(enemy.positions[0]);

    const layer = setPosition(ship({ id: 'layer', nome: 'Lanca-Armadilhas', hp: 2000, size: 5, charges: 1, damage: 1500, chargeType: 'armadilha' }), 'player', 'ally', 2, 5, 5);
    GameState.match.players.player.inventario.navios.push(layer);
    const inRange = { zoneId: 'neutral', row: 9, column: 6 };
    const outOfRange = { zoneId: 'neutral', row: 9, column: 7 };
    const launchRangeInside = CombatManager.isWithinTrapRange(layer, inRange);
    const launchRangeOutside = CombatManager.isWithinTrapRange(layer, outOfRange);
    const outsideGrid = !CombatManager.isValidBoardPosition({ zoneId: 'neutral', row: 10, column: 0 });
    const forbiddenZone = !CombatManager.canOwnerPlaceTrapInZone('player', 'enemy');

    GameState.battle.mainActionAvailable = true;
    const placed = CombatManager.placeTrap(layer, inRange);
    const placedTrap = GameState.battle.traps[0];
    const consumedCharge = layer.cargasDisponiveis === 0 && !GameState.battle.mainActionAvailable;
    const duplicateBlocked = !CombatManager.canPlaceTrapAt(layer, inRange);
    const movementBlocked = MovementManager.isOccupied([inRange]);
    const noChargeBlocked = !CombatManager.placeTrap(layer, { zoneId: 'neutral', row: 8, column: 6 });

    const deadLayer = setPosition(ship({ id: 'dead-layer', nome: 'Lanca-Armadilhas', hp: 2000, size: 5, charges: 1, damage: 1500, chargeType: 'armadilha' }), 'player', 'ally', 0, 0, 5);
    deadLayer.destruir();
    GameState.battle.mainActionAvailable = true;
    const destroyedBlocked = !CombatManager.placeTrap(deadLayer, { zoneId: 'ally', row: 1, column: 5 });

    const attacker = setPosition(ship({ id: 'attacker', nome: 'Atacante', hp: 2000, size: 1, charges: 2, damage: 100 }), 'player', 'neutral', 0, 0);
    GameState.match.players.player.inventario.navios.push(attacker);
    const enemyTrap = new Trap({ id: 'enemy-trap', nome: 'Armadilha', custo: 0, dano: 1500, ownerId: 'maquina', position: { zoneId: 'neutral', row: 0, column: 1 } });
    GameState.battle.traps.push(enemyTrap);
    GameState.battle.mainActionAvailable = true;
    const triggered = CombatManager.attackTarget(attacker, enemyTrap.position, { skipUnknownConfirmation: true });
    const exactDamage = attacker.hp === 500;
    const deactivated = !enemyTrap.isActive && enemyTrap.wasTriggered;
    const secondAttack = CombatManager.attackTarget(attacker, enemyTrap.position, { skipUnknownConfirmation: true });
    const noDuplicateDamage = attacker.hp === 500;

    return {
        inside, outside: !outside, corner, overlap,
        detectedOnce: firstScan.length === 1,
        unknownClass, revealedClass, leftRange, discoveryPersisted,
        analysisIntegration: analyzableBeforeReveal,
        revealedObjectNotAnalyzableAgain: analysisTarget === null,
        launchRangeInside, launchRangeOutside: !launchRangeOutside,
        outsideGrid, forbiddenZone, placed, consumedCharge, duplicateBlocked,
        movementBlocked, noChargeBlocked, destroyedBlocked,
        triggered, exactDamage, deactivated, secondAttack, noDuplicateDamage,
        trapDamageConfigured: placedTrap.dano === 1500
    };
})()`, context);

Object.entries(results).forEach(([name, passed]) => assert.equal(passed, true, name));
console.log(`phase4: ${Object.keys(results).length} assertions passed`);
