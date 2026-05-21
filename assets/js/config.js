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
            subtitle: 'Area rival',
            className: 'zone-enemy'
        }
    ],

    difficulties: {
        facil: {
            id: 'facil',
            label: 'Facil',
            description: 'Mais moedas para testar formacoes com calma.',
            coins: 5000
        },
        normal: {
            id: 'normal',
            label: 'Normal',
            description: 'Saldo equilibrado para uma partida padrao.',
            coins: 3600
        },
        dificil: {
            id: 'dificil',
            label: 'Dificil',
            description: 'Menos moedas e escolhas mais importantes.',
            coins: 2700
        }
    },

    ships: [
        {
            id: 'trap-layer',
            name: 'Lanca-Armadilhas',
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
            name: 'Encouracado',
            shortName: 'Encouracado',
            price: 900,
            hp: 1500,
            size: 4,
            chargeLabel: '1 missil forte',
            chargeType: 'missil',
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
            chargeLabel: '2 misseis medios',
            chargeType: 'missil',
            charges: 2,
            damage: 300
        },
        {
            id: 'destroyer',
            name: 'Destroier',
            shortName: 'Destroier',
            price: 300,
            hp: 600,
            size: 2,
            chargeLabel: '3 misseis leves',
            chargeType: 'missil',
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
        miss: 'effects/miss',
        explosion: 'effects/explosion'
    }
};
