/**
 * Representa uma armadilha compravel no jogo.
 * A classe esta simples de proposito para permitir expansao posterior
 * com efeitos, area de ativacao, duracao ou dano.
 */
class Trap {
    constructor({ id, nome, custo, dano = 0, efeito = null, ownerId = null, position = null }) {
        this.id = id;
        this.nome = nome;
        this.custo = custo;
        this.dano = dano;
        this.efeito = efeito;
        this.ownerId = ownerId;
        this.position = position;
        this.isActive = true;
    }
}

/**
 * Representa um navio com cargas individuais e fila de recarga.
 * Cada ataque consome uma carga e agenda a recuperacao dessa carga
 * para depois de um turno completo do adversario.
 */
class Ship {
    constructor({
        id,
        nome,
        custo,
        dano,
        capacidadeMaximaDeCargas,
        cargasDisponiveis,
        ownerId = null,
        hp = 1,
        size = 1,
        chargeType = 'missil',
        zoneId = null,
        row = null,
        column = null,
        orientation = 'horizontal',
        positions = [],
        metadata = {}
    }) {
        this.id = id;
        this.nome = nome;
        this.custo = custo;
        this.dano = dano;
        this.capacidadeMaximaDeCargas = capacidadeMaximaDeCargas;
        this.cargasDisponiveis = cargasDisponiveis ?? capacidadeMaximaDeCargas;
        this.filaDeRecarga = [];
        this.ownerId = ownerId;
        this.hp = hp;
        this.maxHp = hp;
        this.size = size;
        this.chargeType = chargeType;
        this.zoneId = zoneId;
        this.row = row;
        this.column = column;
        this.orientation = orientation;
        this.positions = positions;
        this.isDestroyed = false;
        this.metadata = metadata;
    }

    /**
     * Retorna true quando o navio ainda possui ao menos uma carga pronta.
     */
    podeAtacar() {
        return this.cargasDisponiveis > 0;
    }

    /**
     * Executa um ataque contra um alvo e agenda a recarga da carga gasta.
     * @param {unknown} alvo - Qualquer estrutura que represente o alvo no jogo.
     * @param {number} turnoAtual - Contador global do jogo no momento do ataque.
     * @returns {{navioId: string|number, alvo: unknown, dano: number, turno: number}}
     */
    atacar(alvo, turnoAtual) {
        if (!this.podeAtacar()) {
            throw new Error(`${this.nome} nao possui cargas disponiveis.`);
        }

        this.cargasDisponiveis -= 1;
        this.filaDeRecarga.push({ recoverOnTurn: turnoAtual + 2 });

        return {
            navioId: this.id,
            alvo,
            dano: this.dano,
            turno: turnoAtual
        };
    }

    /**
     * Processa todas as cargas cuja recarga venceu no turno informado.
     * Cada item da fila representa uma carga gasta individualmente.
     * @param {number} turnoAtual
     * @returns {number} quantidade de cargas recuperadas
     */
    processarRecargas(turnoAtual) {
        let cargasRecuperadas = 0;
        const pendentes = [];

        this.filaDeRecarga.forEach((recarga) => {
            if (recarga.recoverOnTurn <= turnoAtual) {
                cargasRecuperadas += 1;
                return;
            }

            pendentes.push(recarga);
        });

        this.cargasDisponiveis = Math.min(
            this.capacidadeMaximaDeCargas,
            this.cargasDisponiveis + cargasRecuperadas
        );
        this.filaDeRecarga = pendentes;

        return cargasRecuperadas;
    }

    receberDano(dano) {
        if (this.isDestroyed) return;

        this.hp = Math.max(0, this.hp - dano);
        this.isDestroyed = this.hp <= 0;
    }

    destruir() {
        this.hp = 0;
        this.isDestroyed = true;
    }

    atualizarPosicao({ zoneId, row, column, orientation, positions }) {
        this.zoneId = zoneId;
        this.row = row;
        this.column = column;
        this.orientation = orientation;
        this.positions = positions;
    }
}

/**
 * Participante da partida. Controla moedas e inventario proprio.
 */
class Player {
    constructor({ id, nome, moedas }) {
        this.id = id;
        this.nome = nome;
        this.moedas = moedas;
        this.inventario = {
            navios: [],
            armadilhas: []
        };
        this.analiseDisponivel = true;
    }

    /**
     * Verifica saldo antes de qualquer compra.
     */
    podeComprar(custo) {
        return this.moedas >= custo;
    }

    /**
     * Desconta moedas e adiciona o navio ao inventario.
     */
    comprarNavio(navio) {
        if (!this.podeComprar(navio.custo)) {
            throw new Error(`${this.nome} nao possui moedas suficientes para comprar ${navio.nome}.`);
        }

        this.moedas -= navio.custo;
        this.inventario.navios.push(navio);

        return navio;
    }

    /**
     * Desconta moedas e adiciona a armadilha ao inventario.
     */
    comprarArmadilha(armadilha) {
        if (!this.podeComprar(armadilha.custo)) {
            throw new Error(`${this.nome} nao possui moedas suficientes para comprar ${armadilha.nome}.`);
        }

        this.moedas -= armadilha.custo;
        this.inventario.armadilhas.push(armadilha);

        return armadilha;
    }
}

/**
 * Orquestrador da partida: cria jogadores, sorteia inicio, valida turnos,
 * compra itens, executa ataques e processa recargas.
 */
class Game {
    constructor({ moedasIniciais, random = Math.random } = {}) {
        if (!Number.isFinite(moedasIniciais) || moedasIniciais < 0) {
            throw new Error('A quantidade inicial de moedas deve ser um numero positivo ou zero.');
        }

        this.turnoAtual = 1;
        this.random = random;
        this.players = {
            player: new Player({ id: 'player', nome: 'Jogador', moedas: moedasIniciais }),
            maquina: new Player({ id: 'maquina', nome: 'Maquina', moedas: moedasIniciais })
        };
        this.jogadorAtivoId = this.sortearJogadorInicial();
    }

    get jogadorAtivo() {
        return this.players[this.jogadorAtivoId];
    }

    get adversarioAtivoId() {
        return this.jogadorAtivoId === 'player' ? 'maquina' : 'player';
    }

    /**
     * Sorteia 50% para o jogador humano e 50% para a maquina.
     */
    sortearJogadorInicial() {
        return this.random() < 0.5 ? 'player' : 'maquina';
    }

    /**
     * Busca um participante pelo id conhecido.
     */
    getPlayer(playerId) {
        const player = this.players[playerId];

        if (!player) {
            throw new Error(`Jogador invalido: ${playerId}.`);
        }

        return player;
    }

    /**
     * Garante que somente o participante ativo execute acoes de turno.
     */
    validarTurno(playerId) {
        if (playerId !== this.jogadorAtivoId) {
            throw new Error(`Nao e o turno de ${playerId}. Turno atual: ${this.jogadorAtivoId}.`);
        }
    }

    /**
     * Compra um navio para o participante informado.
     * @param {'player'|'maquina'} playerId
     * @param {object} config - Configuracao de navio vinda do jogo ou da loja.
     */
    comprarNavio(playerId, config) {
        const player = this.getPlayer(playerId);
        const navio = Game.criarNavioPorConfig({
            ...config,
            ownerId: playerId
        });

        return player.comprarNavio(navio);
    }

    /**
     * Compra uma armadilha para o participante informado.
     */
    comprarArmadilha(playerId, config) {
        const player = this.getPlayer(playerId);
        const armadilha = new Trap({
            id: config.id,
            nome: config.nome || config.name,
            custo: config.custo ?? config.price,
            dano: config.dano ?? config.damage ?? 0,
            efeito: config.efeito ?? null,
            ownerId: playerId,
            position: config.position ?? null
        });

        return player.comprarArmadilha(armadilha);
    }

    /**
     * Executa ataque apenas se o dono do navio estiver no turno ativo.
     */
    atacarComNavio(playerId, navioId, alvo) {
        this.validarTurno(playerId);

        const player = this.getPlayer(playerId);
        const navio = player.inventario.navios.find((item) => item.id === navioId);

        if (!navio) {
            throw new Error(`${player.nome} nao possui o navio ${navioId}.`);
        }

        return navio.atacar(alvo, this.turnoAtual);
    }

    /**
     * Troca o jogador ativo, avanca o contador de turnos e processa
     * todas as recargas pendentes de todos os navios da partida.
     */
    nextTurn() {
        this.jogadorAtivoId = this.adversarioAtivoId;
        this.turnoAtual += 1;

        return this.processarTodasAsRecargas();
    }

    /**
     * Processa recargas de ambos os jogadores. Retorna um resumo util
     * para HUD, logs ou animacoes.
     */
    processarTodasAsRecargas() {
        const resumo = [];

        Object.values(this.players).forEach((player) => {
            player.inventario.navios.forEach((navio) => {
                const cargasRecuperadas = navio.processarRecargas(this.turnoAtual);

                if (cargasRecuperadas > 0) {
                    resumo.push({
                        playerId: player.id,
                        navioId: navio.id,
                        cargasRecuperadas
                    });
                }
            });
        });

        return resumo;
    }

    /**
     * Adaptador para aceitar tanto o formato pedido no enunciado quanto
     * o formato ja existente em GameConfig.ships.
     */
    static criarNavioPorConfig(config) {
        return new Ship({
            id: config.instanceId || config.id,
            nome: config.nome || config.name,
            custo: config.custo ?? config.price,
            dano: config.dano ?? config.damage,
            capacidadeMaximaDeCargas: config.capacidadeMaximaDeCargas ?? config.charges,
            cargasDisponiveis: config.cargasDisponiveis ?? config.charges,
            ownerId: config.ownerId ?? null,
            hp: config.hp ?? config.vida ?? 1,
            size: config.size ?? config.tamanho ?? 1,
            chargeType: config.chargeType ?? 'missil',
            zoneId: config.zoneId ?? null,
            row: config.row ?? null,
            column: config.column ?? null,
            orientation: config.orientation ?? 'horizontal',
            positions: config.positions ?? [],
            metadata: config
        });
    }
}

/**
 * Exemplo minimo para testar no console do navegador:
 *
 * const game = GameExample.create(1000);
 * const navio = game.comprarNavio('player', {
 *   id: 'destroyer-1',
 *   nome: 'Destroyer',
 *   custo: 300,
 *   dano: 50,
 *   capacidadeMaximaDeCargas: 2
 * });
 * game.atacarComNavio('player', navio.id, { row: 2, column: 4 });
 * game.nextTurn();
 * game.nextTurn();
 */
const GameExample = {
    create(moedasIniciais = 1000) {
        return new Game({ moedasIniciais });
    }
};

globalThis.Trap = Trap;
globalThis.Ship = Ship;
globalThis.Player = Player;
globalThis.Game = Game;
globalThis.GameExample = GameExample;
