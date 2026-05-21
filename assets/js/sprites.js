const SpriteAnimator = {
    definitions: new Map(),
    cells: new Map(),
    effects: new Map(),
    running: false,
    lastTick: 0,

    init() {
        if (!SPRITE_CONFIG.enabled) return;

        this.defineTileSprites();
        this.defineShipSprites();
        this.defineEffectSprites();
        this.start();
    },

    defineTileSprites() {
        Object.entries(SPRITE_CONFIG.tiles).forEach(([key, path]) => {
            this.define(`tile:${key}`, path, {
                frameTime: SPRITE_CONFIG.defaultFrameTime,
                fit: 'cover'
            });
        });
    },

    defineShipSprites() {
        Object.entries(SPRITE_CONFIG.ships).forEach(([shipId, path]) => {
            ['horizontal', 'vertical'].forEach((orientation) => {
                this.define(`ship:${shipId}:${orientation}`, `${path}/${orientation}`, {
                    frameTime: SPRITE_CONFIG.defaultFrameTime,
                    fit: 'contain'
                });
            });
        });
    },

    defineEffectSprites() {
        Object.entries(SPRITE_CONFIG.effects).forEach(([key, path]) => {
            this.define(`effect:${key}`, path, {
                frameTime: SPRITE_CONFIG.defaultFrameTime,
                fit: 'cover'
            });
        });
    },

    define(key, relativePath, options = {}) {
        const definition = {
            key,
            relativePath,
            frames: [],
            frameIndex: 0,
            frameTime: options.frameTime || SPRITE_CONFIG.defaultFrameTime,
            fit: options.fit || 'cover',
            loaded: false,
            lastFrameAt: 0
        };

        this.definitions.set(key, definition);
        this.loadFrames(definition);
    },

    async loadFrames(definition) {
        const frames = [];

        for (let index = 1; index <= SPRITE_CONFIG.maxAutoFrames; index += 1) {
            const url = `${SPRITE_CONFIG.basePath}/${definition.relativePath}/${index}.png`;
            const exists = await this.imageExists(url);

            if (!exists) {
                if (index === 1) return;
                break;
            }

            frames.push(url);
        }

        definition.frames = frames;
        definition.loaded = frames.length > 0;
        this.applyDefinitionToRegisteredCells(definition.key);
    },

    imageExists(url) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            image.src = url;
        });
    },

    registerCell(cell, spriteKey, options = {}) {
        this.cells.set(cell, {
            spriteKey,
            fit: options.fit || null
        });
        this.applySprite(cell, spriteKey, options.fit);
    },

    registerEffect(cell, spriteKey, options = {}) {
        this.effects.set(cell, {
            spriteKey,
            fit: options.fit || null
        });
        this.applySprite(cell, spriteKey, options.fit, true);
    },

    unregisterEffect(cell) {
        this.effects.delete(cell);
        const base = this.cells.get(cell);

        if (base) {
            this.applySprite(cell, base.spriteKey, base.fit);
        }
    },

    applyDefinitionToRegisteredCells(spriteKey) {
        this.cells.forEach((entry, cell) => {
            if (entry.spriteKey === spriteKey && !this.effects.has(cell)) {
                this.applySprite(cell, spriteKey, entry.fit);
            }
        });

        this.effects.forEach((entry, cell) => {
            if (entry.spriteKey === spriteKey) {
                this.applySprite(cell, spriteKey, entry.fit, true);
            }
        });
    },

    applySprite(cell, spriteKey, fit, isEffect = false) {
        const definition = this.definitions.get(spriteKey);

        if (!definition || !definition.loaded) {
            if (!isEffect) {
                cell.style.removeProperty('--sprite-url');
                cell.style.removeProperty('--sprite-fit');
            }
            return;
        }

        const url = definition.frames[definition.frameIndex] || definition.frames[0];
        cell.style.setProperty('--sprite-url', `url("${url}")`);
        cell.style.setProperty('--sprite-fit', fit || definition.fit);
        cell.style.setProperty('image-rendering', SPRITE_CONFIG.imageRendering);
    },

    start() {
        if (this.running) return;

        this.running = true;
        requestAnimationFrame((timestamp) => this.tick(timestamp));
    },

    tick(timestamp) {
        if (!this.running) return;

        let changed = false;

        this.definitions.forEach((definition) => {
            if (!definition.loaded || definition.frames.length <= 1) return;

            if (timestamp - definition.lastFrameAt >= definition.frameTime) {
                definition.frameIndex = (definition.frameIndex + 1) % definition.frames.length;
                definition.lastFrameAt = timestamp;
                changed = true;
            }
        });

        if (changed) {
            this.cells.forEach((entry, cell) => {
                if (!this.effects.has(cell)) {
                    this.applySprite(cell, entry.spriteKey, entry.fit);
                }
            });

            this.effects.forEach((entry, cell) => {
                this.applySprite(cell, entry.spriteKey, entry.fit, true);
            });
        }

        requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
    }
};
