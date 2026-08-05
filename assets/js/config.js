const GameConfig = {
    grid: {
        size: 10,
        rows: 10,
        columns: 10,
        totalColumns: 30,
        zoneWidth: 10,
        labels: 'ABCDEFGHIJ'.split('')
    },

    zones: [
        {
            id: 'ally',
            title: 'Oceano Aliado',
            subtitle: 'Base da frota',
            className: 'zone-ally'
        },
        {
            id: 'neutral',
            title: 'Oceano Neutro',
            subtitle: 'Mar aberto',
            className: 'zone-neutral'
        },
        {
            id: 'enemy',
            title: 'Oceano Inimigo',
            subtitle: 'Área rival',
            className: 'zone-enemy'
        }
    ],

    difficulties: {
        facil: {
            id: 'facil',
            label: 'Fácil',
            description: 'Mais moedas para testar formações com calma.',
            coins: 5000
        },
        normal: {
            id: 'normal',
            label: 'Normal',
            description: 'Saldo equilibrado para uma partida padrão.',
            coins: 3600
        },
        dificil: {
            id: 'dificil',
            label: 'Difícil',
            description: 'Menos moedas e escolhas mais importantes.',
            coins: 2700
        }
    },

    ships: [
        {
            id: 'trap-layer',
            name: 'Lança-Armadilhas',
            shortName: 'Armadilhas',
            price: 1200,
            hp: 2000,
            size: 5,
            chargeLabel: '1 armadilha',
            chargeType: 'armadilha',
            charges: 1,
            damage: 1500
        },
        {
            id: 'battleship',
            name: 'Encouraçado',
            shortName: 'Encouraçado',
            price: 900,
            hp: 1500,
            size: 4,
            chargeLabel: '1 míssil forte',
            chargeType: 'míssil',
            charges: 1,
            damage: 900
        },
        {
            id: 'cruiser',
            name: 'Cruzador',
            shortName: 'Cruzador',
            price: 600,
            hp: 900,
            size: 3,
            chargeLabel: '2 mísseis médios',
            chargeType: 'míssil',
            charges: 2,
            damage: 300
        },
        {
            id: 'destroyer',
            name: 'Destróier',
            shortName: 'Destróier',
            price: 300,
            hp: 600,
            size: 2,
            chargeLabel: '3 mísseis leves',
            chargeType: 'míssil',
            charges: 3,
            damage: 170
        }
    ]
};

const SPRITE_CONFIG = {
    enabled: true,
    defaultFrameTime: 1000,
    maxAutoFrames: 12,
    basePath: 'assets/sprites',
    fallback: true,
    imageRendering: 'auto',
    tiles: {
        ocean: 'tiles/ocean',
        ally: 'tiles/ally',
        neutral: 'tiles/neutral',
        enemy: 'tiles/enemy'
    },
    ships: {
        destroyer: 'ships/destroyer',
        cruiser: 'ships/cruiser',
        battleship: 'ships/battleship',
        trapLayer: 'ships/trap-layer',
        'trap-layer': 'ships/trap-layer'
    },
    effects: {
        hover: 'effects/hover',
        valid: 'effects/valid',
        invalid: 'effects/invalid',
        hit: 'effects/hit',
        míss: 'effects/míss',
        explosion: 'effects/explosion'
    }
};
