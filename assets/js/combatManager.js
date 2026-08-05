class CombatManager {
    static getPositionKey(position) {
        return MovementManager.getCellKey(position);
    }

    static canShipAttack(ship) {
        return Boolean(ship && !ship.isDestroyed && ship.cargasDisponiveis > 0);
    }

    static findShipAt(position, ownerId = null) {
        return MovementManager.getShips().find((ship) => {
            if (ship.isDestroyed) return false;
            if (ownerId && ship.ownerId !== ownerId) return false;

            return ship.positions.some((shipPosition) =>
                this.getPositionKey(shipPosition) === this.getPositionKey(position)
            );
        }) || null;
    }

    static findTrapAt(position, ownerId = null) {
        return GameState.battle.traps.find((trap) => {
            if (!trap.isActive) return false;
            if (ownerId && trap.ownerId !== ownerId) return false;

            return this.getPositionKey(trap.position) === this.getPositionKey(position);
        }) || null;
    }

    static getTargetAt(position, attackerOwnerId) {
        const defenderId = attackerOwnerId === 'player' ? 'maquina' : 'player';
        const trap = this.findTrapAt(position, defenderId);
        const ship = this.findShipAt(position, defenderId);

        if (trap) return { type: 'trap', item: trap };
        if (ship) return { type: 'ship', item: ship };

        return null;
    }

    static markShipDestroyed(ship) {
        ship.positions.forEach((position) => {
            const cell = GridView.getCell(position.zoneId, position.row, position.column);
            const boardCell = GameState.boards[position.zoneId]?.[position.row]?.[position.column];

            if (boardCell) {
                boardCell.shipInstanceId = null;
                boardCell.state = 'destroyed';
            }

            if (!cell) return;

            cell.classList.remove('has-ship', 'is-unknown');
            cell.classList.add('is-destroyed');
            SpriteAnimator.registerEffect(cell, 'effect:explosion', { fit: 'cover' });
        });
    }

    static removeTrap(trap) {
        trap.isActive = false;

        const cell = GridView.getCell(trap.position.zoneId, trap.position.row, trap.position.column);
        if (cell) {
            cell.classList.remove('is-unknown', 'is-trap', 'is-revealed');
            cell.classList.add('is-trap-triggered');
            SpriteAnimator.registerEffect(cell, 'effect:explosion', { fit: 'cover' });
        }
    }

    static attackTarget(ship, targetPosition, options = {}) {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        const isHumanAction = ship.ownerId === 'player';

        if (isHumanAction && !GameState.isHumanTurn()) {
            TurnManager.showMessage('Vez da Maquina');
            return false;
        }

        if (!this.canShipAttack(ship)) {
            TurnManager.setBattleMessage(`${ship.nome} não possui carga disponivel.`, 'warning');
            return false;
        }

        const targetKey = this.getPositionKey(targetPosition);
        const isUnknownTarget = GameState.battle.unknownObjects.has(targetKey) &&
            !GameState.battle.revealedObjects.has(targetKey);

        if (isHumanAction && isUnknownTarget && !options.skipUnknownConfirmation) {
            const confirmed = window.confirm('Este alvo é desconhecido. Pode ser um navio inimigo ou uma armadilha. Deseja atacar mesmo assim?');

            if (!confirmed) return false;
        }

        ship.atacar(targetPosition, GameState.match.turnoAtual);
        TurnManager.updateSelectedShipPanel();
        const target = this.getTargetAt(targetPosition, ship.ownerId);

        if (!target) {
            TurnManager.setBattleMessage('Ataque na água. Nenhum alvo atingido.', 'info');
            TurnManager.updateSelectedShipPanel();
            TurnManager.finishTurnIfNoActions();
            return true;
        }

        if (target.type === 'trap') {
            this.removeTrap(target.item);
            ship.destruir();
            this.markShipDestroyed(ship);
            TurnManager.setBattleMessage(`${ship.nome} atacou uma armadilha e foi destruído.`, 'warning');
            TurnManager.updateSelectedShipPanel();
            TurnManager.finishTurnIfNoActions();
            return true;
        }

        target.item.receberDano(ship.dano);
        TurnManager.updateSelectedShipPanel();

        if (target.item.isDestroyed) {
            this.markShipDestroyed(target.item);
            TurnManager.setBattleMessage(isUnknownTarget ? 'Embarcação inimiga desconhecida destruida.' : `${target.item.nome} foi destruido.`, 'success');
        } else {
            TurnManager.setBattleMessage(
                isUnknownTarget
                    ? 'Embarcação inimiga desconhecida recebeu dano e continua sem identificação.'
                    : `${target.item.nome} recebeu ${ship.dano} de dano.`,
                'success'
            );
        }

        RadarManager.scanRadar();
        TurnManager.updateSelectedShipPanel();
        TurnManager.finishTurnIfNoActions();
        return true;
    }

    static placeTrap(ship, position) {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        const isHumanAction = ship.ownerId === 'player';

        if (isHumanAction && !GameState.isHumanTurn()) {
            TurnManager.showMessage('Vez da Máquina');
            return false;
        }

        if (ship.chargeType !== 'armadilha') {
            TurnManager.setBattleMessage('Apenas o Lança-Armadilhas pode lançar armadilhas.', 'warning');
            return false;
        }

        if (!this.canShipAttack(ship)) {
            TurnManager.setBattleMessage(`${ship.nome} não possui armadilha disponivel.`, 'warning');
            return false;
        }

        if (isHumanAction && !GameState.battle.mainActionAvailable) {
            TurnManager.setBattleMessage('A ação principal deste turno já foi usada.', 'warning');
            return false;
        }

        if (!this.isWithinTrapRange(ship, position)) {
            TurnManager.setBattleMessage('A posição está fora do raio de lancamento.', 'warning');
            return false;
        }

        if (this.findShipAt(position) || this.findTrapAt(position)) {
            TurnManager.setBattleMessage('Essa posição já está ocupada.', 'warning');
            return false;
        }

        ship.atacar(position, GameState.match.turnoAtual);
        TurnManager.updateSelectedShipPanel();

        const trap = new Trap({
            id: `trap-${Date.now()}-${GameState.battle.traps.length}`,
            nome: 'Armadilha naval',
            custo: 0,
            dano: 99999,
            ownerId: ship.ownerId,
            position
        });

        GameState.battle.traps.push(trap);
        GameState.battle.mainActionAvailable = false;
        RadarManager.scanRadar();
        TurnManager.setBattleMessage('Armadilha lançada.', 'success');
        TurnManager.updateSelectedShipPanel();
        TurnManager.finishTurnIfNoActions();
        return true;
    }

    static isWithinTrapRange(ship, position) {
        const maxDistance = 2;

        return ship.positions.some((shipPosition) => {
            const rowDistance = Math.abs(shipPosition.row - position.row);
            const columnDistance = Math.abs(
                MovementManager.getGlobalColumn(shipPosition) - MovementManager.getGlobalColumn(position)
            );

            return Math.max(rowDistance, columnDistance) <= maxDistance;
        });
    }
}

function canShipAttack(ship) {
    return CombatManager.canShipAttack(ship);
}

function attackTarget(ship, targetPosition) {
    return CombatManager.attackTarget(ship, targetPosition);
}

function placeTrap(ship, position) {
    return CombatManager.placeTrap(ship, position);
}

globalThis.CombatManager = CombatManager;
globalThis.canShipAttack = canShipAttack;
globalThis.attackTarget = attackTarget;
globalThis.placeTrap = placeTrap;
