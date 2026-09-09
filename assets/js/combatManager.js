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
        if (!trap || !trap.isActive || trap.wasTriggered) return false;

        trap.isActive = false;
        trap.wasTriggered = true;
        GameState.battle.unknownObjects.delete(this.getPositionKey(trap.position));
        GameState.battle.revealedObjects.forEach((revealed, key) => {
            if (revealed.item === trap) GameState.battle.revealedObjects.delete(key);
        });

        const cell = GridView.getCell(trap.position.zoneId, trap.position.row, trap.position.column);
        if (cell) {
            cell.classList.remove('is-unknown', 'is-trap', 'is-revealed', 'is-owned-trap');
            cell.classList.add('is-trap-triggered');
            SpriteAnimator.registerEffect(cell, 'effect:explosion', { fit: 'cover' });
        }

        return true;
    }

    static attackTarget(ship, targetPosition, options = {}) {
        if (!GameState.match || GameState.phase !== 'battle') return false;

        const isHumanAction = ship.ownerId === 'player';

        if (isHumanAction && !GameState.isHumanTurn()) {
            TurnManager.showMessage('Vez da Maquina');
            return false;
        }

        if (!this.canShipAttack(ship)) {
            TurnManager.setBattleMessage(`${ship.nome} nao possui carga disponivel.`, 'warning');
            return false;
        }

        const targetKey = this.getPositionKey(targetPosition);
        const target = this.getTargetAt(targetPosition, ship.ownerId);
        const isUnknownTarget = GameState.battle.unknownObjects.has(targetKey) &&
            target && !AnalysisManager.isTargetRevealed(targetKey, target);

        if (isHumanAction && isUnknownTarget && !options.skipUnknownConfirmation) {
            const confirmed = window.confirm('Este alvo e desconhecido. Pode ser um navio inimigo ou uma armadilha. Deseja atacar mesmo assim?');

            if (!confirmed) return false;
        }

        ship.atacar(targetPosition, GameState.match.turnoAtual);
        ScoreManager.recordAttack(ship.ownerId);
        TurnManager.updateSelectedShipPanel();

        if (!target) {
            TurnManager.setBattleMessage('Ataque na agua. Nenhum alvo atingido.', 'info');
            TurnManager.updateSelectedShipPanel();
            TurnManager.finishTurnIfNoActions();
            return true;
        }

        if (target.type === 'trap') {
            if (!this.removeTrap(target.item)) return false;

            const hpBeforeTrap = ship.hp;
            ship.receberDano(GameConfig.traps.damage);
            ScoreManager.recordTrapTriggered(ship.ownerId);
            ScoreManager.recordTrapDamage(target.item.ownerId, hpBeforeTrap - ship.hp);
            if (ship.isDestroyed) this.markShipDestroyed(ship);

            TurnManager.setBattleMessage(
                `${ship.nome} ativou uma armadilha e sofreu ${GameConfig.traps.damage} de dano${ship.isDestroyed ? ', sendo destruido' : ''}.`,
                'warning'
            );
            RadarManager.scanRadar();
            TurnManager.updateSelectedShipPanel();
            TurnManager.finishTurnIfNoActions();
            return true;
        }

        const hpBeforeAttack = target.item.hp;
        target.item.receberDano(ship.dano);
        ScoreManager.recordHit(
            ship.ownerId,
            hpBeforeAttack - target.item.hp,
            target.item.isDestroyed
        );
        TurnManager.updateSelectedShipPanel();

        if (target.item.isDestroyed) {
            this.markShipDestroyed(target.item);
            TurnManager.setBattleMessage(isUnknownTarget ? 'Embarcacao inimiga desconhecida destruida.' : `${target.item.nome} foi destruido.`, 'success');
        } else {
            TurnManager.setBattleMessage(
                isUnknownTarget
                    ? 'Embarcacao inimiga desconhecida recebeu dano e continua sem identificacao.'
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
            TurnManager.showMessage('Vez da Maquina');
            return false;
        }

        if (ship.chargeType !== 'armadilha') {
            TurnManager.setBattleMessage('Apenas o Lanca-Armadilhas pode lancar armadilhas.', 'warning');
            return false;
        }

        if (ship.isDestroyed || !Array.isArray(ship.positions) || ship.positions.length === 0) {
            TurnManager.setBattleMessage('O Lanca-Armadilhas precisa estar vivo e posicionado.', 'warning');
            return false;
        }

        if (!this.canShipAttack(ship)) {
            TurnManager.setBattleMessage(`${ship.nome} nao possui armadilha disponivel.`, 'warning');
            return false;
        }

        if (!GameState.battle.mainActionAvailable) {
            TurnManager.setBattleMessage('A acao principal deste turno ja foi usada.', 'warning');
            return false;
        }

        if (!this.isValidBoardPosition(position)) {
            TurnManager.setBattleMessage('A posicao esta fora dos limites da grid.', 'warning');
            return false;
        }

        if (!this.canOwnerPlaceTrapInZone(ship.ownerId, position.zoneId)) {
            TurnManager.setBattleMessage('Nao e permitido lancar armadilhas nessa area.', 'warning');
            return false;
        }

        if (!this.isWithinTrapRange(ship, position)) {
            TurnManager.setBattleMessage('A posicao esta fora do raio de lancamento.', 'warning');
            GridView.paintPreview(position.zoneId, [position], false);
            return false;
        }

        if (this.findShipAt(position) || this.findTrapAt(position)) {
            TurnManager.setBattleMessage('Essa posicao ja esta ocupada.', 'warning');
            GridView.paintPreview(position.zoneId, [position], false);
            return false;
        }

        ship.atacar(position, GameState.match.turnoAtual);
        TurnManager.updateSelectedShipPanel();

        const trap = new Trap({
            id: `trap-${GameState.battle.nextTrapId}`,
            nome: 'Armadilha naval',
            custo: 0,
            dano: GameConfig.traps.damage,
            ownerId: ship.ownerId,
            position: { ...position },
            sourceShipId: ship.id
        });

        GameState.battle.nextTrapId += 1;
        GameState.battle.traps.push(trap);
        GameState.battle.mainActionAvailable = false;
        GridView.clearPreview();
        RadarManager.scanRadar();
        TurnManager.setBattleMessage('Armadilha lancada.', 'success');
        TurnManager.updateSelectedShipPanel();
        TurnManager.finishTurnIfNoActions();
        return true;
    }

    static isWithinTrapRange(ship, position) {
        if (!ship || !position) return false;

        return ship.positions.some((shipPosition) => {
            const rowDistance = Math.abs(shipPosition.row - position.row);
            const columnDistance = Math.abs(
                MovementManager.getGlobalColumn(shipPosition) - MovementManager.getGlobalColumn(position)
            );

            return Math.max(rowDistance, columnDistance) <= GameConfig.traps.launchRadius;
        });
    }

    static isValidBoardPosition(position) {
        return Boolean(
            position &&
            GameConfig.zones.some((zone) => zone.id === position.zoneId) &&
            Number.isInteger(position.row) &&
            Number.isInteger(position.column) &&
            position.row >= 0 &&
            position.row < GameConfig.grid.rows &&
            position.column >= 0 &&
            position.column < GameConfig.grid.columns
        );
    }

    static canOwnerPlaceTrapInZone(ownerId, zoneId) {
        return (GameConfig.traps.allowedZonesByOwner[ownerId] || []).includes(zoneId);
    }

    static canPlaceTrapAt(ship, position) {
        return Boolean(
            ship &&
            !ship.isDestroyed &&
            ship.chargeType === 'armadilha' &&
            this.canShipAttack(ship) &&
            GameState.battle.mainActionAvailable &&
            this.isValidBoardPosition(position) &&
            this.canOwnerPlaceTrapInZone(ship.ownerId, position.zoneId) &&
            this.isWithinTrapRange(ship, position) &&
            !this.findShipAt(position) &&
            !this.findTrapAt(position)
        );
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
