(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const FONT = 'Fredoka, "Trebuchet MS", "Segoe UI", sans-serif';
  const SETTINGS_KEY = 'gdm-settings-v2';
  const NATIVE_CELL = 64;

  const C = {
    ink: '#13283f', inkSoft: '#4f6479', paper: '#ffffff', cream: '#fbf8f1',
    p1: '#2f6fb5', p1Soft: '#d8e7f6', p1Deep: '#1f4f86',
    p2: '#cf5a43', p2Soft: '#f7ddd6', p2Deep: '#a13f2c',
    neutral: '#2a9184', neutralSoft: '#d4ece8', neutralDeep: '#1c6b61',
    sun: '#e2b33d', sunDeep: '#a87c16', grass: '#2f9e5b', grassDeep: '#21744a',
    orange: '#e07b39', purple: '#7a5ad6', grey: '#93a4b8',
    // Mar com saturação baixa: não compete com navios e interface.
    sea1: '#a6cfe2', sea2: '#73abcb', sea3: '#4a7fa6'
  };

  const TEAM = {
    player1: { label: 'Jogador 1', short: 'J1', color: C.p1, soft: C.p1Soft, deep: C.p1Deep, key: 'p1', bow: -Math.PI / 2 },
    player2: { label: 'Jogador 2', short: 'J2', color: C.p2, soft: C.p2Soft, deep: C.p2Deep, key: 'p2', bow: Math.PI / 2 }
  };

  const ZONES = [
    { id: 'player1', label: 'Oceano do Jogador 1', fill: C.p1Soft, deep: C.p1Deep },
    { id: 'neutral', label: 'Oceano Neutro', fill: C.neutralSoft, deep: C.neutralDeep },
    { id: 'player2', label: 'Oceano do Jogador 2', fill: C.p2Soft, deep: C.p2Deep }
  ];

  // Nomes usados em cada modo: contra o computador (padrão) ou 2 jogadores no mesmo computador.
  const MODE_LABELS = {
    ai: {
      player1: { label: 'Capitão', short: 'Você', chip: 'Você', zone: 'Oceano do Capitão' },
      player2: { label: 'Computador', short: 'PC', chip: 'Computador', zone: 'Oceano do Computador' }
    },
    pvp: {
      player1: { label: 'Jogador 1', short: 'J1', chip: 'Jogador 1', zone: 'Oceano do Jogador 1' },
      player2: { label: 'Jogador 2', short: 'J2', chip: 'Jogador 2', zone: 'Oceano do Jogador 2' }
    }
  };

  function normalizeMode(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (['ai', 'ia', 'cpu', 'computador', '1'].includes(raw)) return 'ai';
    if (['pvp', 'hotseat', '2', 'local', '2jogadores'].includes(raw)) return 'pvp';
    return null;
  }

  function getPlatformMode() {
    try { return normalizeMode(new URLSearchParams(window.location.search).get('mode')); } catch (_e) { return null; }
  }

  const IMAGE_PATHS = {
    hull: 'ships/hull.png', sail_p1: 'ships/sail_p1.png', sail_p2: 'ships/sail_p2.png',
    sail_p1_torn: 'ships/sail_p1_torn.png', sail_p2_torn: 'ships/sail_p2_torn.png',
    flag_p1: 'ships/flag_p1.png', flag_p2: 'ships/flag_p2.png', nest: 'ships/nest.png', cannon: 'ships/cannon.png',
    crew1: 'ships/crew1.png', crew2: 'ships/crew2.png', crew3: 'ships/crew3.png', crew4: 'ships/crew4.png',
    icon_p1: 'ships/icon_p1.png', icon_p2: 'ships/icon_p2.png', cannonball: 'ships/cannonball.png',
    explosion1: 'effects/explosion1.png', explosion2: 'effects/explosion2.png', explosion3: 'effects/explosion3.png',
    fire1: 'effects/fire1.png', fire2: 'effects/fire2.png',
    water: 'sea/water.png', leaf: 'sea/leaf.png', rock: 'sea/rock_a.png',
    fish_blue: 'sea/fish_blue.png', fish_green: 'sea/fish_green.png', fish_orange: 'sea/fish_orange.png',
    fish_pink: 'sea/fish_pink.png', fish_red: 'sea/fish_red.png',
    bubble_a: 'sea/bubble_a.png', bubble_b: 'sea/bubble_b.png', bubble_c: 'sea/bubble_c.png',
    seaweed_green: 'sea/seaweed_green_a.png', seaweed_pink: 'sea/seaweed_pink_a.png', seaweed_orange: 'sea/seaweed_orange_a.png',
    star: 'ui/star.png', star_grey: 'ui/star_grey.png', hero: 'ui/capitao.png', villain: 'ui/vilao.png', check: 'ui/check.png', cross: 'ui/cross.png'
  };

  // Ícones das ações (caixa 24x24, os mesmos do painel).
  const ACTION_ICONS = {
    attack: 'M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M14.5 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0M12 2v4M12 18v4M2 12h4M18 12h4',
    move: 'M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3',
    trap: 'M18 13a6 6 0 1 1-12 0a6 6 0 1 1 12 0M12 3v4M12 19v2M4 13H2M22 13h-2M6.3 7.3L5 6M17.7 7.3L19 6',
    analyze: 'M16 10a6 6 0 1 1-12 0a6 6 0 1 1 12 0M15 15l6 6M8.5 8.5a2 2 0 1 1 2.5 1.9V11'
  };

  const SHIP_ACTIONS = [
    { id: 'attack', label: 'Atacar', key: '1', color: '#ef5a4c', deep: '#bf3326' },
    { id: 'move', label: 'Mover', key: '2', color: '#1fb39a', deep: '#0f7f6c' },
    { id: 'trap', label: 'Armadilha', key: '3', color: '#8b5cf6', deep: '#6a3fd1' },
    { id: 'analyze', label: 'Analisar', key: '4', color: '#2f80ed', deep: '#1858b0' }
  ];

  function easeBack(t) { const c = 1.6; t = clamp(t, 0, 1) - 1; return 1 + (c + 1) * t * t * t + c * t * t; }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      img.src = src;
    });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function now() { return performance.now(); }
  function rand(n) { return Math.floor(Math.random() * n); }
  function hit(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  function ease(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  function loadSettings() {
    const defaults = { highContrast: false, fontScale: 1, music: true, sfx: true, reduceMotion: false, mode: 'ai', screenReader: false, mapSounds: true, musicVol: 6, sfxVol: 8, fontFamily: 'padrao', airyText: false, tutorialAuto: true };
    try { defaults.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_e) {}
    // Alto contraste do Windows (ou "mais contraste" no sistema) liga o alto contraste do jogo.
    try { defaults.highContrast = window.matchMedia('(forced-colors: active)').matches || window.matchMedia('(prefers-contrast: more)').matches; } catch (_e) {}
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (saved && typeof saved === 'object') return Object.assign(defaults, saved);
    } catch (_e) {}
    return defaults;
  }

  function saveSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_e) {}
  }

  class AudioEngine {
    constructor() {
      this.ctx = null; this.music = true; this.sfx = true; this.musicVol = 6; this.sfxVol = 8; this.bus = null;
      this.musicGain = null; this.samples = {}; this.timer = null; this.step = 0; this.nextNote = 0;
    }

    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.music ? this.musicVol / 6 : 0;
      this.musicGain.connect(this.ctx.destination);
      this.bus = this.ctx.createGain();
      this.bus.gain.value = this.sfxVol / 8;
      this.bus.connect(this.ctx.destination);
      for (const name of ['click', 'switch']) {
        fetch(`assets/audio/${name}.ogg`)
          .then(r => r.arrayBuffer())
          .then(b => this.ctx.decodeAudioData(b))
          .then(buf => { this.samples[name] = buf; })
          .catch(() => {});
      }
      this.startMusic();
    }

    // Trilha procedural de aventura naval: valsa de marinheiro em 6/8 (Ré maior),
    // com baixo, um "acordeão" suave e percussão leve de barril. Tudo bem baixinho.
    startMusic() {
      if (!this.ctx || this.timer) return;
      const N = { D3: 147, A2: 110, G2: 98, E3: 165, F3: 185, G3: 196, A3: 220, B3: 247, C4: 262, D4: 294, E4: 330, F4: 370, G4: 392, A4: 440, B4: 494, D5: 587, C5: 523, E5: 659 };
      // 4 frases de 2 compassos (12 colcheias cada); 0 = pausa
      const melody = [
        'A4', 0, 'D5', 'D5', 0, 'E5', 'D5', 0, 'B4', 'A4', 0, 0,
        'G4', 0, 'B4', 'B4', 0, 'A4', 'G4', 0, 'E4', 'F4', 0, 0,
        'A4', 0, 'D5', 'D5', 0, 'E5', 'D5', 0, 'B4', 'A4', 0, 'G4',
        'F4', 0, 'A4', 'G4', 0, 'E4', 'D4', 0, 0, 'D4', 0, 0
      ];
      const roots = ['D3', 'G2', 'D3', 'A2'];
      const chords = { D3: ['F4', 'A4'], G2: ['G4', 'B4'], A2: ['E4', 'C5'] };
      const beat = 0.21; // colcheia
      this.nextNote = this.ctx.currentTime + 0.15;
      this.timer = setInterval(() => {
        if (!this.ctx) return;
        while (this.nextNote < this.ctx.currentTime + 0.5) {
          const i = this.step % melody.length, bar = Math.floor(i / 12), inBar = i % 6;
          const note = melody[i];
          // a cada volta a melodia sobe uma oitava em parte das frases e ganha notas de enfeite
          const lap = Math.floor(this.step / melody.length) % 4, up = lap === 2 && bar < 2 ? 2 : 1;
          if (note) this.voice(N[note] * up, this.nextNote, beat * 1.5, 'triangle', 0.014, this.musicGain);
          if (note && lap === 3 && inBar === 1) this.voice(N[note] * 1.5, this.nextNote + beat * 0.5, beat * 0.4, 'triangle', 0.008, this.musicGain);
          const root = roots[bar];
          if (inBar === 0) this.voice(N[root], this.nextNote, beat * 2.6, 'sine', 0.03, this.musicGain);
          if (inBar === 3) this.voice(N[root] * 1.5, this.nextNote, beat * 1.8, 'sine', 0.018, this.musicGain);
          // "pizzicato" dos acordes (corda beliscada simulada)
          if (inBar === 2 || inBar === 5) for (const c of chords[root]) this.voice(N[c], this.nextNote, beat * 0.5, 'triangle', 0.007, this.musicGain);
          if (inBar === 0) this.noise(this.nextNote, 0.08, 0.035, 400, this.musicGain);
          if (inBar === 3) this.noise(this.nextNote, 0.05, 0.02, 2500, this.musicGain);
          this.step++;
          this.nextNote += beat;
        }
      }, 120);
    }

    // Pista sonora ao andar no mapa: esquerda/direita pela coluna e grave/agudo pela linha.
    cue(kind, col, row) {
      if (!this.sfx) return;
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime, pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const out = this.ctx.createGain(); out.gain.value = 1;
      if (pan) { pan.pan.value = Math.max(-1, Math.min(1, (col - 14.5) / 14.5)); out.connect(pan).connect((this.bus || this.ctx.destination)); } else out.connect((this.bus || this.ctx.destination));
      const base = 300 + (9 - row) * 45;
      const v = (f, at, d, type, vol, slide = 0) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, at); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), at + d);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
        o.connect(g).connect(out); o.start(at); o.stop(at + d + 0.05);
      };
      v(base, t, 0.06, 'sine', 0.03);
      if (kind === 'ship') v(140, t + 0.05, 0.14, 'triangle', 0.06, -40);
      else if (kind === 'contact') { v(1200, t + 0.05, 0.12, 'sine', 0.035); v(1200, t + 0.18, 0.1, 'sine', 0.015); }
      else if (kind === 'enemy') v(220, t + 0.05, 0.16, 'square', 0.02, -60);
      else if (kind === 'hit') v(110, t + 0.05, 0.18, 'sawtooth', 0.02);
      else if (kind === 'miss') v(900, t + 0.05, 0.08, 'sine', 0.015, -500);
      else if (kind === 'mine') { v(500, t + 0.05, 0.06, 'square', 0.015); v(500, t + 0.14, 0.06, 'square', 0.015); }
      else if (kind === 'ok') v(base * 1.5, t + 0.05, 0.08, 'triangle', 0.03);
      else if (kind === 'no') v(160, t + 0.05, 0.1, 'triangle', 0.03);
    }

    syncMusic() {
      if (this.musicGain) this.musicGain.gain.value = this.music ? this.musicVol / 6 : 0;
      if (this.bus) this.bus.gain.value = this.sfxVol / 8;
    }

    voice(freq, at, dur, type, vol, dest, slide = 0) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, at);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), at + dur);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(dest || (this.bus || this.ctx.destination));
      o.start(at); o.stop(at + dur + 0.05);
    }

    noise(at, dur, vol, freq, dest = null) {
      const len = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(dest || (this.bus || this.ctx.destination)); src.start(at);
    }

    play(name) {
      if (!this.sfx) return;
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const sample = this.samples[name === 'select' ? 'switch' : name];
      if ((name === 'click' || name === 'select') && sample) {
        const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
        src.buffer = sample; g.gain.value = 0.5; src.connect(g).connect((this.bus || this.ctx.destination)); src.start(t);
        return;
      }
      switch (name) {
        case 'click': this.voice(880, t, 0.06, 'sine', 0.05); break;
        case 'select': this.voice(660, t, 0.08, 'sine', 0.05); this.voice(990, t + 0.05, 0.08, 'sine', 0.04); break;
        case 'pop': this.voice(420, t, 0.12, 'sine', 0.08, null, 380); break;
        case 'error': this.voice(294, t, 0.1, 'sine', 0.05); this.voice(262, t + 0.09, 0.14, 'sine', 0.045); break;
        case 'tutorialNext': this.voice(659, t, 0.08, 'sine', 0.04); this.voice(880, t + 0.07, 0.12, 'sine', 0.035); break;
        case 'handoff': this.noise(t, 0.3, 0.05, 1200); this.voice(523, t + 0.12, 0.2, 'triangle', 0.045); this.voice(784, t + 0.24, 0.3, 'triangle', 0.045); break;
        case 'fire': this.noise(t, 0.18, 0.18, 1800); this.voice(180, t, 0.2, 'sine', 0.08, null, -120); break;
        case 'boom': this.noise(t, 0.45, 0.32, 900); this.voice(110, t, 0.4, 'sine', 0.12, null, -70); break;
        case 'splash': this.noise(t, 0.35, 0.16, 2600); this.voice(600, t, 0.2, 'sine', 0.03, null, -400); break;
        case 'move': this.voice(300, t, 0.18, 'sine', 0.05, null, 120); break;
        case 'trap': case 'mine': this.voice(180, t, 0.18, 'sine', 0.08, null, -90); this.noise(t + 0.02, 0.2, 0.08, 1200); this.voice(1400, t + 0.16, 0.05, 'square', 0.02); this.voice(1400, t + 0.26, 0.05, 'square', 0.02); break;
        case 'radar': this.voice(1180, t, 0.5, 'sine', 0.05); this.voice(1180, t + 0.32, 0.45, 'sine', 0.022); this.voice(1180, t + 0.6, 0.4, 'sine', 0.01); break;
        case 'achievement': [784, 988, 1175, 1568].forEach((f, i) => this.voice(f, t + i * 0.07, 0.22, 'triangle', 0.05)); this.voice(2093, t + 0.3, 0.4, 'sine', 0.03); break;
        case 'correct': [523, 659, 784, 1047].forEach((f, i) => this.voice(f, t + i * 0.08, 0.18, 'triangle', 0.06)); break;
        case 'wrong': this.voice(440, t, 0.18, 'sine', 0.045); this.voice(392, t + 0.16, 0.28, 'sine', 0.04); break;
        case 'whoosh': this.noise(t, 0.28, 0.07, 1400); this.voice(380, t, 0.25, 'sine', 0.03, null, 500); break;
        case 'turn': this.voice(587, t, 0.12, 'triangle', 0.05); this.voice(784, t + 0.1, 0.18, 'triangle', 0.05); break;
        case 'enemyTurn': this.voice(392, t, 0.14, 'triangle', 0.05); this.voice(330, t + 0.12, 0.2, 'triangle', 0.05); break;
        case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.voice(f, t + i * 0.12, 0.25, 'triangle', 0.07)); break;
        case 'lose': [440, 415, 392, 330].forEach((f, i) => this.voice(f, t + i * 0.2, 0.3, 'triangle', 0.06)); break;
        default: this.voice(660, t, 0.06, 'sine', 0.04);
      }
    }
  }

  class SeaBattleGame {
    constructor() {
      this.img = {};
      this.questions = [];
      this.questionsLoaded = false;
      this.assetsReady = false;
      this.audio = new AudioEngine();
      this.buttons = [];
      this.hover = { x: -1, y: -1, cell: null };
      this.pointerDown = null;
      this.reserved = { right: 0, bottom: 0 };
      this.geom = { w: 0, h: 0, dpr: 1, cell: 32, gap: 12, gx: 0, gy: 0, gw: 960, gh: 320, playW: 0, playH: 0, compact: false };
      this.live = null;
      this.a11yRoot = null;
      this.listeners = new Set();
      this.shipCache = new Map();
      this.bgCache = null;
      this.boardCache = null;
      this.lastFrame = 0;
      this.lastA11ySync = 0;
      this.spot = { uid: null, open: false, a: 0, openedAt: 0, rect: null };
      this.view = { a: 0, k: 1, S: { x: 0, y: 0 }, off: { x: 0, y: 0 } };
      this.actionIcons = {};
      try { for (const [k, d] of Object.entries(ACTION_ICONS)) this.actionIcons[k] = new Path2D(d); } catch (_e) {}
      this.state = this.createState();
      this.state.settings = loadSettings();
      this.decor = this.createDecor();
    }

    createState() {
      return {
        phase: 'loading',
        difficulty: 'medio',
        mode: 'ai',
        matchId: 0,
        placementOwner: 'player1',
        turn: 'player1',
        roundStarter: 'player1',
        round: 1,
        ships: { player1: [], player2: [] },
        traps: [],
        selectedShipId: null,
        action: null,
        cursor: { row: 0, col: 0 },
        detected: { player1: new Set(), player2: new Set() },
        revealed: { player1: new Set(), player2: new Set() },
        analysisAvailable: { player1: true, player2: true },
        marks: { player1: new Map(), player2: new Map() },
        usedQuestionIds: new Set(),
        modal: null,
        toast: null,
        effects: [],
        stats: {
          player1: { attacks: 0, hits: 0, verificationAttempts: 0, verificationCorrect: 0, shipsDestroyed: 0, trapsDiscovered: 0, trapsTriggered: 0 },
          player2: { attacks: 0, hits: 0, verificationAttempts: 0, verificationCorrect: 0, shipsDestroyed: 0, trapsDiscovered: 0, trapsTriggered: 0 }
        },
        settings: null,
        camera: { zoom: 1, offsetX: 0, offsetY: 0, minZoom: 0.8, maxZoom: 2.2 },
        winner: null,
        finalScores: null,
        platformScore: null,
        startAt: 0
      };
    }

    createDecor() {
      const fish = ['fish_blue', 'fish_orange', 'fish_pink', 'fish_green', 'fish_red', 'fish_orange'];
      return {
        fish: fish.map((key, i) => ({ key, y: 0.12 + i * 0.15, speed: 18 + rand(22), phase: Math.random() * 1000, size: 34 + rand(16), dir: i % 2 ? -1 : 1 })),
        bubbles: Array.from({ length: 14 }, () => ({ x: Math.random(), speed: 14 + rand(20), phase: Math.random() * 1000, size: 8 + rand(14), key: ['bubble_a', 'bubble_b', 'bubble_c'][rand(3)] }))
      };
    }

    /* ---------- eventos para o painel lateral ---------- */

    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    notify() { for (const fn of this.listeners) { try { fn(this); } catch (err) { console.error(err); } } }

    async init() {
      this.createA11yLayer();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.bindInput();
      const fontReady = document.fonts ? Promise.race([document.fonts.load(`600 16px Fredoka`), new Promise(r => setTimeout(r, 1500))]).catch(() => {}) : Promise.resolve();
      try {
        await Promise.all([this.loadAssets(), fontReady]);
        this.assetsReady = true;
      } catch (err) {
        console.error(err);
      }
      await this.loadQuestions();
      this.resetMatch(getPlatformDifficulty());
      this.state.phase = 'placement';
      this.invalidateCaches();
      this.announce(`${TEAM.player1.label}, posicione sua frota no oceano da esquerda. F1 abre o guia, F2 os ajustes de acessibilidade e F3 leva ao painel de comandos.`);
      if (window.innerHeight > window.innerWidth && window.innerWidth < 700) this.toast('Dica: deite o celular para ver mais mar', 'info', 3500);
      requestAnimationFrame(t => this.loop(t));
    }

    createA11yLayer() {
      const root = document.createElement('div');
      root.className = 'sr-only';
      root.id = 'accessibilityLayer';
      root.innerHTML = '<p id="gdmInstructions"></p><p id="gdmVisualDescription"></p><p id="gdmState"></p><div id="gdmLive" role="status" aria-live="polite" aria-atomic="true"></div><div id="gdmAlert" aria-live="assertive" aria-atomic="true"></div>';
      document.body.appendChild(root);
      this.a11yRoot = root;
      this.live = root.querySelector('#gdmLive');
      this.alertLive = root.querySelector('#gdmAlert');
      root.querySelector('#gdmInstructions').textContent = 'Use o mapa acessível (tabelas com as casas) ou o campo Ir para a casa. No mapa, setas mudam de casa e Enter faz a ação. Atalhos: I situação da partida, C casa atual, T dica do Capitão, R gira, P posiciona tudo, 1 atacar, 2 mover, 3 armadilha, 4 analisar, Espaço passa a vez, F1 guia, F2 ajustes, F3 painel.';
      root.querySelector('#gdmVisualDescription').textContent = 'Mapa do mar visto de cima com três oceanos de dez por dez casas: o seu oceano à esquerda, o Oceano Neutro no meio e o Oceano do Computador à direita. Cada oceano usa colunas A até J e linhas 1 até 10, com A1 no canto superior esquerdo.';
      canvas.setAttribute('aria-describedby', 'gdmInstructions gdmVisualDescription gdmState');
      this.syncA11y();
    }

    // urgent = fala na hora (interrompe); senão espera o leitor terminar o que está falando.
    announce(text, urgent = false) {
      const region = urgent && this.alertLive ? this.alertLive : this.live;
      if (region) {
        region.textContent = '';
        setTimeout(() => { region.textContent = text; }, 40);
      }
      this.syncA11y();
      this.notify();
    }

    syncA11y() {
      if (!this.a11yRoot) return;
      const owner = this.currentOwner(), scores = this.currentScores();
      const phase = { placement: 'posicionamento', battle: 'batalha', end: 'fim de partida' }[this.state.phase] || 'carregando';
      const status = [
        `Fase de ${phase}. Vez do ${TEAM[owner].label}. Dificuldade ${GDM_CONFIG.difficulties[this.state.difficulty].label}. Rodada ${this.state.round}.`,
        `Tempo ${this.elapsedText()}. Pontos: ${TEAM.player1.label} ${scores.player1} de 100, ${TEAM.player2.label} ${scores.player2} de 100.`,
        `Cursor em ${GDM_LOGIC.coordWithZone(this.state.cursor.row, this.state.cursor.col)}.`
      ];
      const selected = this.selectedShip();
      if (selected) status.push(`${this.shipName(selected)} selecionado: ${Math.max(0, selected.hp)} de ${selected.maxHp} de vida, ${selected.availableCharges} de ${selected.maxCharges} cargas.`);
      this.a11yRoot.querySelector('#gdmState').textContent = status.join(' ');
    }

    async loadAssets() {
      await Promise.all(Object.entries(IMAGE_PATHS).map(([key, path]) => loadImage(`assets/img/${path}`).then(img => { this.img[key] = img; })));
    }

    async loadQuestions() {
      try {
        const r = await fetch('assets/data/perguntas.json', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const raw = await r.json();
        // Validação: só entram perguntas completas, sem id repetido e com nível conhecido.
        const seen = new Set(), levels = ['facil', 'medio', 'dificil'];
        this.questions = (Array.isArray(raw) ? raw : []).filter(q => q && !seen.has(q.id) && seen.add(q.id) &&
          typeof q.pergunta === 'string' && q.pergunta.trim() && typeof q.resposta === 'boolean' &&
          levels.includes(q.dificuldade) && typeof q.explicacao === 'string');
        if (Array.isArray(raw) && this.questions.length !== raw.length) console.warn(`Perguntas ignoradas por estarem incompletas: ${raw.length - this.questions.length}`);
        this.questionsLoaded = this.questions.length > 0;
      } catch (err) {
        this.questionsLoaded = false;
        console.warn('Perguntas indisponíveis. Execute assets/tools/JOGAR_AGORA.bat para testar via servidor local.', err);
      }
    }

    /* ---------- layout e câmera ---------- */

    setReserved(right, bottom) {
      if (this.reserved.right === right && this.reserved.bottom === bottom) return;
      this.reserved = { right, bottom };
      this.resize();
    }

    resize() {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(320, window.innerWidth), h = Math.max(240, window.innerHeight);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      this.layout(w, h, dpr);
      if (this.geom.maxX) this.focusZone(Math.floor(this.state.cursor.col / 10), true);
    }

    layout(w = this.geom.w, h = this.geom.h, dpr = this.geom.dpr) {
      const playW = Math.max(300, w - this.reserved.right);
      const playH = Math.max(220, h - this.reserved.bottom);
      const compact = playW < 760 || playH < 520;
      const short = playH < 430;
      const fsc = this.state.settings.fontScale || 1;
      const hudH = Math.round((compact ? 46 : 66) * (1 + (fsc - 1) * 0.6));
      const labelH = compact ? 22 : 30;
      const infoH = short ? 0 : (compact ? 50 : 60);
      const side = compact ? 18 : 28;
      const gapRatio = 0.45, chipsH = 32;
      const cam = this.state.camera;
      const zoom = clamp(cam.zoom || 1, cam.minZoom, cam.maxZoom);
      // No celular o mapa inteiro fica minúsculo; nesse caso ele usa a altura toda
      // e o jogador desliza entre os oceanos (botões de oceano ou arrastando).
      const widthCell = (playW - 24 - side * 2) / (30 + gapRatio * 2);
      const topPan = 10 + hudH + 6 + chipsH + 6 + labelH;
      const panCell = Math.min(34, (playH - topPan - infoH - 14) / 10);
      const pan = widthCell < 22 && panCell > widthCell + 2;
      const top = pan ? topPan : 10 + hudH + 10 + labelH;
      const fitCell = pan ? panCell : Math.min(widthCell, (playH - top - infoH - 14) / 10);
      const cell = Math.max(10, Math.floor(fitCell * zoom));
      const gap = Math.max(8, Math.round(cell * gapRatio));
      const gw = cell * 30 + gap * 2, gh = cell * 10;
      const freeH = playH - top - infoH - 14;
      const maxX = gw > playW - side * 2 ? (gw - playW) / 2 + side + 12 : 0;
      const maxY = gh > freeH ? (gh - freeH) / 2 + 16 : 0;
      cam.offsetX = clamp(cam.offsetX || 0, -maxX, maxX);
      cam.offsetY = clamp(cam.offsetY || 0, -maxY, maxY);
      if (cam.targetX !== null && cam.targetX !== undefined) cam.targetX = clamp(cam.targetX, -maxX, maxX);
      this.geom = {
        w, h, dpr, cell, gap, gw, gh, playW, playH, compact, hudH, labelH, infoH, side, pan, maxX, maxY,
        chipsY: 10 + hudH + 6, chipsH,
        gx: Math.floor((playW - gw) / 2 + cam.offsetX),
        gy: Math.floor(top + Math.max(0, (freeH - gh) / 2) + cam.offsetY)
      };
    }

    invalidateCaches() { this.bgCache = null; this.boardCache = null; }

    colX(col) { const g = this.geom; return g.gx + col * g.cell + Math.floor(col / 10) * g.gap; }
    rowY(row) { return this.geom.gy + row * this.geom.cell; }
    zoneX(z) { return this.colX(z * 10); }

    // Converte um ponto da tela para o mapa, desfazendo o zoom do navio em foco.
    screenToWorld(x, y) {
      const v = this.view;
      if (!v || v.a < 0.001) return { x, y };
      return { x: (x - v.S.x - v.off.x) / v.k + v.S.x, y: (y - v.S.y - v.off.y) / v.k + v.S.y };
    }

    worldToScreen(x, y) {
      const v = this.view;
      if (!v || v.a < 0.001) return { x, y };
      return { x: (x - v.S.x) * v.k + v.S.x + v.off.x, y: (y - v.S.y) * v.k + v.S.y + v.off.y };
    }

    cellAtScreen(x, y) { const p = this.screenToWorld(x, y); return this.cellAt(p.x, p.y); }

    cellAt(x, y) {
      const g = this.geom;
      if (y < g.gy || y >= g.gy + g.gh) return null;
      for (let z = 0; z < 3; z++) {
        const zx = this.zoneX(z);
        if (x >= zx && x < zx + g.cell * 10) return { row: Math.floor((y - g.gy) / g.cell), col: z * 10 + Math.floor((x - zx) / g.cell) };
      }
      return null;
    }

    panCamera(dx, dy) { const cam = this.state.camera; cam.targetX = null; cam.offsetX += dx; cam.offsetY += dy; this.layout(); }
    zoomCamera(delta) {
      const cam = this.state.camera;
      cam.zoom = clamp(Math.round(((cam.zoom || 1) + delta) * 10) / 10, cam.minZoom, cam.maxZoom);
      this.layout();
      this.ensureVisible(this.state.cursor.row, this.state.cursor.col, true);
      this.toast(`Zoom ${Math.round(cam.zoom * 100)}%`, 'info', 800);
    }
    resetCamera() {
      Object.assign(this.state.camera, { zoom: 1, offsetX: 0, offsetY: 0, targetX: null });
      this.layout();
      this.ensureVisible(this.state.cursor.row, this.state.cursor.col, true);
      this.toast('Mapa centralizado', 'info', 900);
    }

    // Centraliza a câmera no oceano z (0, 1 ou 2) quando o mapa não cabe na tela.
    focusZone(z, instant = false) {
      const g = this.geom, cam = this.state.camera;
      if (!g.maxX) return;
      const target = clamp(g.gw / 2 - (z * (10 * g.cell + g.gap) + 5 * g.cell), -g.maxX, g.maxX);
      if (instant || this.still) { cam.offsetX = target; cam.targetX = null; this.layout(); }
      else cam.targetX = target;
    }

    ensureVisible(row, col, instant = false) {
      const g = this.geom;
      if (!g.maxX || col === null || col === undefined) return;
      const cam = this.state.camera;
      const offset = cam.targetX ?? cam.offsetX;
      const x = this.colX(col) + (offset - cam.offsetX), margin = g.cell * 0.5;
      if (x < margin || x + g.cell > g.playW - margin) this.focusZone(Math.floor(col / 10), instant);
    }

    visibleZone() {
      const g = this.geom;
      let best = 0, dist = Infinity;
      for (let z = 0; z < 3; z++) {
        const d = Math.abs(this.zoneX(z) + g.cell * 5 - g.playW / 2);
        if (d < dist) { dist = d; best = z; }
      }
      return best;
    }

    // Oceanos que aparecem inteiros na tela (ou o mais central, se nenhum couber).
    shownZones() {
      const g = this.geom, set = new Set();
      for (let z = 0; z < 3; z++) { const x = this.zoneX(z); if (x >= -2 && x + g.cell * 10 <= g.playW + 2) set.add(z); }
      if (!set.size) set.add(this.visibleZone());
      return set;
    }

    stepCamera() {
      const cam = this.state.camera;
      if (cam.targetX === null || cam.targetX === undefined) return;
      const d = cam.targetX - cam.offsetX;
      if (Math.abs(d) < 0.8) { cam.offsetX = cam.targetX; cam.targetX = null; }
      else cam.offsetX += d * 0.22;
      this.layout();
    }

    /* ---------- entrada ---------- */

    bindInput() {
      this.pointers = new Map();
      this.gesture = null;
      canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
      canvas.addEventListener('pointermove', e => this.onPointerMove(e));
      canvas.addEventListener('pointerup', e => this.onPointerUp(e));
      canvas.addEventListener('pointercancel', e => { this.pointers.delete(e.pointerId); if (!this.pointers.size) { this.gesture = null; this.pointerDown = null; } });
      canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { this.hover.cell = null; this.hover.x = -1; } });
      canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (this.state.modal) return;
        if (this.state.action) this.cancelAction();
        else if (this.spot.open) this.closeSpot();
      });
      canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoomCamera(e.deltaY < 0 ? 0.1 : -0.1); }, { passive: false });
      window.addEventListener('keydown', e => this.onKey(e));
    }

    pointerPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    onPointerDown(e) {
      // Só o botão principal joga; o botão direito serve para cancelar (menu de contexto).
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.audio.ensure();
      try { canvas.setPointerCapture(e.pointerId); } catch (_e) {}
      const p = this.pointerPos(e), cam = this.state.camera;
      this.pointers.set(e.pointerId, p);
      this.pointerDown = p;
      if (e.pointerType !== 'mouse') { this.hover.x = p.x; this.hover.y = p.y; }
      if (this.pointers.size === 1) this.gesture = { type: 'tap', x: p.x, y: p.y, ox: cam.offsetX, oy: cam.offsetY, touch: e.pointerType !== 'mouse' };
      else if (this.pointers.size === 2 && !this.state.modal) {
        const [a, b] = [...this.pointers.values()];
        this.gesture = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: cam.zoom || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ox: cam.offsetX, oy: cam.offsetY };
      }
    }

    onPointerMove(e) {
      const p = this.pointerPos(e), cam = this.state.camera, gs = this.gesture;
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);
      if (gs && gs.type === 'pinch' && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        cam.targetX = null;
        cam.zoom = clamp(gs.zoom * Math.hypot(a.x - b.x, a.y - b.y) / gs.dist, cam.minZoom, cam.maxZoom);
        cam.offsetX = gs.ox + (a.x + b.x) / 2 - gs.mx;
        cam.offsetY = gs.oy + (a.y + b.y) / 2 - gs.my;
        this.layout();
        return;
      }
      if (gs && (gs.type === 'tap' || gs.type === 'pan') && this.pointers.size === 1 && !this.state.modal) {
        const dx = p.x - gs.x, dy = p.y - gs.y;
        const limit = gs.touch ? 10 : GDM_CONFIG.input.dragThreshold;
        if (gs.type === 'tap' && Math.hypot(dx, dy) > limit && (this.geom.maxX || this.geom.maxY)) gs.type = 'pan';
        if (gs.type === 'pan') {
          cam.targetX = null;
          cam.offsetX = gs.ox + dx; cam.offsetY = gs.oy + dy;
          this.layout();
          canvas.style.cursor = 'grabbing';
          return;
        }
      }
      this.hover.x = p.x; this.hover.y = p.y;
      this.hover.cell = this.state.modal ? null : this.cellAtScreen(p.x, p.y);
      const list = this.state.modal ? (this.state.modal.buttons || []) : this.buttons, mp = this.modalPoint(p.x, p.y);
      const overButton = list.some(b => hit(b, mp.x, mp.y) && !b.disabled);
      canvas.style.cursor = overButton ? 'pointer' : (this.hover.cell ? 'crosshair' : (this.geom.maxX ? 'grab' : 'default'));
    }

    onPointerUp(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const p = this.pointerPos(e), gs = this.gesture;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size) return;
      this.gesture = null;
      this.pointerDown = null;
      if (!gs || gs.type !== 'tap') return;
      if (Math.hypot(p.x - gs.x, p.y - gs.y) > (gs.touch ? 14 : GDM_CONFIG.input.dragThreshold)) return;
      this.handleClick(p.x, p.y);
    }

    // Converte um ponto da tela para as coordenadas da janela aberta (que pode estar reduzida).
    modalPoint(x, y) {
      const v = this.state.modal && this.state.modal.view;
      if (!v || v.k === 1) return { x, y };
      return { x: v.cx + (x - v.cx) / v.k, y: v.cy + (y - v.cy) / v.k };
    }

    buzz(pattern) {
      if (!this.state.settings.sfx || !navigator.vibrate) return;
      try { navigator.vibrate(pattern); } catch (_e) {}
    }

    // Teclas que pertencem ao controle focado no painel (Enter/Espaço ativam botões, setas trocam abas).
    keyBelongsToControl(e) {
      const el = e.target;
      if (!(el instanceof HTMLElement) || el === document.body || el === canvas) return false;
      if (el.matches('input, select, textarea, [contenteditable="true"]')) return true;
      // Na casa do mapa acessível, Espaço continua sendo "passar a vez" (Enter é que age na casa).
      if (el.matches('.a11y-cell') && e.key === ' ') return false;
      if (el.matches('button, a, [role="button"], [role="tab"]') && (e.key === 'Enter' || e.key === ' ')) return true;
      if (el.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return true;
      return false;
    }

    onKey(e) {
      if (e.key === 'F1') { e.preventDefault(); this.openHelp(); return; }
      if (e.key === 'F2') { e.preventDefault(); this.openSettings(); return; }
      if (e.key === 'F3') { e.preventDefault(); this.focusPanel(); return; }
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (this.keyBelongsToControl(e)) return;
      this.audio.ensure();
      const key = e.key.toLowerCase();
      if (!this.state.modal) {
        const pan = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[key];
        if (e.shiftKey && pan) { e.preventDefault(); this.panCamera(pan[0] * -40, pan[1] * -40); return; }
        if (key === '+' || key === '=') { e.preventDefault(); this.zoomCamera(0.1); return; }
        if (key === '-' || key === '_') { e.preventDefault(); this.zoomCamera(-0.1); return; }
        if (key === '0') { e.preventDefault(); this.resetCamera(); return; }
      }
      if (key === 'm') { this.toggleMusic(); return; }
      if (key === 'i') { e.preventDefault(); this.announce(this.statusText(), true); return; }
      if (key === 'c' && !this.state.modal) { e.preventDefault(); this.announce(this.describeCell(this.state.cursor.row, this.state.cursor.col), true); return; }
      if (key === 't') { e.preventDefault(); this.announce(`Dica do Capitão: ${this.mission ? this.mission.tipText() : ''}`, true); return; }
      if (this.state.modal) { this.handleModalKey(e); return; }
      if (this.state.phase === 'placement') this.handlePlacementKey(e);
      else if (this.state.phase === 'battle') {
        if (this.isAiTurn()) { if (['1', '2', '3', '4', ' ', 'enter'].includes(key)) { e.preventDefault(); this.blockedByAi(); } return; }
        this.handleBattleKey(e);
      }
    }

    handleModalKey(e) {
      const m = this.state.modal, k = e.key.toLowerCase();
      if (m.type === 'handoff' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.acceptHandoff(); return; }
      if (m.type === 'feedback' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.closeFeedback(); return; }
      if (m.type === 'question') {
        if (k === 'v') { e.preventDefault(); this.answerQuestion(true); return; }
        if (k === 'f') { e.preventDefault(); this.answerQuestion(false); return; }
      }
      if (m.type === 'risk') {
        if (e.key === 'Enter') { e.preventDefault(); this.confirmRisk(true); return; }
        if (e.key === 'Escape') { e.preventDefault(); this.confirmRisk(false); return; }
      }
      if (m.type === 'help' && (e.key === 'Escape' || e.key === 'Enter')) { e.preventDefault(); this.closeModal(); return; }
      if (m.type === 'end' && e.key === 'Enter') { e.preventDefault(); this.restart(); }
    }

    handlePlacementKey(e) {
      const k = e.key.toLowerCase();
      if (k === 'r') { e.preventDefault(); this.rotateSelected(); return; }
      if (k === 'p') { e.preventDefault(); this.autoPlace(); return; }
      if (e.key === 'Enter') { e.preventDefault(); this.confirmAtCursor(); return; }
      const d = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
      if (d) { e.preventDefault(); this.moveCursor(d[0], d[1]); }
    }

    handleBattleKey(e) {
      const k = e.key.toLowerCase();
      if (k === '1') { e.preventDefault(); this.setAction('attack'); return; }
      if (k === '2') { e.preventDefault(); this.setAction('move'); return; }
      if (k === '3') { e.preventDefault(); this.setAction('trap'); return; }
      if (k === '4') { e.preventDefault(); this.setAction('analyze'); return; }
      if (e.key === ' ') { e.preventDefault(); this.endTurn(); return; }
      if (e.key === 'Escape' && this.state.action) { e.preventDefault(); this.cancelAction(); return; }
      if (e.key === 'Escape' && this.spot.open) { e.preventDefault(); this.closeSpot(); return; }
      const d = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
      if (d) { e.preventDefault(); this.moveCursor(d[0], d[1]); return; }
      if (e.key === 'Enter') { e.preventDefault(); this.confirmAtCursor(); }
    }

    moveCursor(dr, dc) {
      if (this.state.modal) return;
      if (this.state.phase === 'battle' && this.state.action === 'move' && this.selectedShip()) { this.moveSelected(dr, dc); return; }
      const before = { ...this.state.cursor };
      if (this.state.phase === 'placement') {
        const h = GDM_LOGIC.home(this.state.placementOwner);
        this.state.cursor.row = clamp(this.state.cursor.row + dr, 0, 9);
        this.state.cursor.col = clamp(this.state.cursor.col + dc, h.minCol, h.maxCol);
      } else {
        this.state.cursor.row = clamp(this.state.cursor.row + dr, 0, 9);
        this.state.cursor.col = clamp(this.state.cursor.col + dc, 0, 29);
      }
      this.hover.cell = null;
      this.ensureVisible(this.state.cursor.row, this.state.cursor.col);
      if (before.row !== this.state.cursor.row || before.col !== this.state.cursor.col) {
        if (this.state.settings.mapSounds) this.audio.cue(this.cellKind(this.state.cursor.row, this.state.cursor.col), this.state.cursor.col, this.state.cursor.row);
        else this.audio.play('click');
        if (!this.a11yMapFocused) this.announce(`${this.describeCell(this.state.cursor.row, this.state.cursor.col)}.`);
      } else {
        this.announce('Borda do mapa.');
      }
    }

    describeCell(row, col) {
      const viewer = this.viewer(), base = GDM_LOGIC.coordWithZone(row, col);
      const own = GDM_LOGIC.shipAt(this.state, row, col, viewer);
      if (own) return `${base}, seu ${this.shipName(own)}${this.state.phase === 'battle' ? `, vida ${Math.max(0, own.hp)} de ${own.maxHp}${own.turnLocked ? ', já agiu' : ''}` : ''}`;
      if (this.state.phase === 'placement') {
        const s = this.selectedShip(), h = GDM_LOGIC.home(viewer);
        if (s && col >= h.minCol && col <= h.maxCol) return `${base}, ${GDM_LOGIC.canPlace(this.state, s, row, col, s.orientation) ? `o ${this.shipName(s)} cabe aqui` : `o ${this.shipName(s)} não cabe aqui`}`;
        if (col > h.maxCol) return `${base}, fora do seu oceano`;
      }
      if (this.state.phase === 'battle') {
        const mark = this.state.marks[viewer].get(`${row}:${col}`);
        const opp = GDM_LOGIC.other(viewer);
        const enemy = GDM_LOGIC.shipAt(this.state, row, col, opp), trap = GDM_LOGIC.trapAt(this.state, row, col, opp);
        const obj = enemy || trap;
        if (obj) {
          const id = GDM_LOGIC.objectId(obj, enemy ? 'ship' : 'trap');
          if (this.state.revealed[viewer].has(id)) return `${base}, ${enemy ? 'navio inimigo ' + this.shipName(enemy) : 'armadilha inimiga'}`;
          if (this.state.detected[viewer].has(id)) return `${base}, contato misterioso no radar`;
        }
        if (GDM_LOGIC.trapAt(this.state, row, col, viewer)) return `${base}, sua armadilha`;
        if (mark === 'hit') return `${base}, acerto anterior`;
        if (mark === 'miss') return `${base}, tiro na água`;
      }
      return base;
    }

    confirmAtCursor() {
      if (this.state.modal) return;
      const { row, col } = this.state.cursor;
      if (this.state.phase === 'placement') { this.placeSelected(row, col); return; }
      if (this.state.phase !== 'battle') return;
      const ship = GDM_LOGIC.shipAt(this.state, row, col, this.state.turn);
      // Igual ao toque: Enter num navio seu sempre o seleciona, mesmo com outra ação escolhida.
      if (ship && !(this.state.action === 'move' && ship.uid === this.state.selectedShipId)) { this.selectShip(ship.uid); return; }
      if (this.state.action) { this.executeCellAction(row, col); return; }
      if (ship) this.selectShip(ship.uid);
      else this.toast('Escolha um navio primeiro', 'warn');
    }

    handleClick(x, y) {
      const list = this.state.modal ? (this.state.modal.buttons || []) : this.buttons;
      const mp = this.modalPoint(x, y);
      const b = list.find(r => hit(r, mp.x, mp.y));
      if (b) { if (!b.disabled) { this.audio.play('click'); b.onClick(); } return; }
      if (this.state.modal) return;
      const c = this.cellAtScreen(x, y);
      if (c && this.blockedByAi()) return;
      if (!c) { if (this.spot.open) this.closeSpot(); return; }
      this.state.cursor = { ...c };
      if (this.state.phase === 'placement') {
        const own = GDM_LOGIC.shipAt(this.state, c.row, c.col, this.state.placementOwner);
        if (own && own.uid !== this.state.selectedShipId) { this.selectShip(own.uid); return; }
        this.placeSelected(c.row, c.col);
      } else if (this.state.phase === 'battle') {
        // Tocar em um navio seu sempre o seleciona e abre o menu de ações (mesmo com outra ação escolhida).
        const own = GDM_LOGIC.shipAt(this.state, c.row, c.col, this.state.turn);
        if (own && !(this.state.action === 'move' && own.uid === this.state.selectedShipId)) this.selectShip(own.uid);
        else if (this.state.action) this.executeCellAction(c.row, c.col);
        else if (this.spot.open) this.closeSpot();
      }
    }

    /* ---------- navio em foco: zoom, holofote e botões voando ---------- */

    openSpot(uid) {
      if (this.state.phase !== 'battle') return;
      if (!(this.spot.open && this.spot.uid === uid)) this.audio.play('whoosh');
      this.spot = { ...this.spot, uid, open: true, openedAt: now() };
    }

    beginSpotClosing(chosen = null) {
      if (this.lastSpotMenu && this.menuOpen()) this.spotClosing = { ...this.lastSpotMenu, t0: now(), chosen };
    }

    closeSpot(silent = false) {
      if (!this.spot.open) return;
      this.beginSpotClosing();
      this.spot.open = false;
      if (!silent) this.announce('Menu de ações fechado. As ações continuam no painel e nas teclas 1 a 4.');
    }

    spotShip() {
      const st = this.state;
      if (!this.spot.uid || st.phase !== 'battle') return null;
      return st.ships[st.turn].find(s => s.uid === this.spot.uid && !s.destroyed && s.cells.length) || null;
    }

    menuOpen() {
      const st = this.state;
      return this.spot.open && !st.modal && !st.action && st.selectedShipId === this.spot.uid && !!this.spotShip();
    }

    // Anima o zoom/escurecimento e calcula a transformação do mapa.
    stepSpot() {
      const g = this.geom, ship = this.spotShip();
      if (ship) this.spot.rect = this.shipRect(ship);
      const target = this.menuOpen() ? 1 : 0;
      const sp = this.spot;
      if (this.still) sp.a = target;
      else { sp.a += (target - sp.a) * 0.2; if (Math.abs(target - sp.a) < 0.004) sp.a = target; }
      if (sp.a === 0 && !sp.open) sp.uid = null;
      const r = sp.rect;
      if (!r || sp.a <= 0) { this.view = { a: 0, k: 1, S: { x: 0, y: 0 }, off: { x: 0, y: 0 } }; return; }
      const S = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      const top = 10 + g.hudH + 10, bottom = g.playH - (g.infoH || 0) - 10;
      const D = { x: g.playW / 2, y: (top + bottom) / 2 };
      const K = clamp(Math.min(1.45, (g.playW * 0.55) / r.w, ((bottom - top) * 0.45) / r.h), 1, 1.45);
      const k = 1 + (K - 1) * sp.a;
      this.view = { a: sp.a, k, S, off: { x: (D.x - S.x) * 0.55 * sp.a, y: (D.y - S.y) * 0.55 * sp.a } };
    }

    addRoundRect(x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    spotHole() {
      const r = this.spot.rect, v = this.view;
      if (!r) return null;
      const a = this.worldToScreen(r.x, r.y), b = this.worldToScreen(r.x + r.w, r.y + r.h), pad = 8;
      return { x: a.x - pad, y: a.y - pad, w: b.x - a.x + pad * 2, h: b.y - a.y + pad * 2, r: this.geom.cell * v.k * 0.4 };
    }

    // Escurece tudo em volta do navio escolhido.
    drawSpotlight(t) {
      const v = this.view, g = this.geom;
      if (v.a <= 0.01) return;
      const hole = this.spotHole();
      if (!hole) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, g.playW, g.playH);
      this.addRoundRect(hole.x, hole.y, hole.w, hole.h, hole.r);
      ctx.fillStyle = this.hc ? `rgba(0,0,0,${0.8 * v.a})` : `rgba(6,24,46,${0.62 * v.a})`;
      ctx.fill('evenodd');
      ctx.beginPath();
      this.addRoundRect(hole.x, hole.y, hole.w, hole.h, hole.r);
      ctx.lineWidth = 4; ctx.strokeStyle = this.hc ? `rgba(255,255,255,${v.a})` : `rgba(255,201,60,${v.a})`;
      if (!this.hc && !this.still) { ctx.shadowColor = 'rgba(255,201,60,.8)'; ctx.shadowBlur = 14 + Math.sin(t / 250) * 4; }
      ctx.stroke();
      ctx.restore();
    }

    // O que cada ação faz (ou por que está bloqueada), para a dica do botão.
    actionHint(id) {
      const s = this.selectedShip(), blocker = this.actionBlocker(id);
      if (blocker) return { text: blocker, blocked: true };
      if (!s) return { text: '', blocked: false };
      const text = {
        attack: `Atira um míssil: ${s.damage} de dano`,
        move: 'Anda 1 casa para qualquer lado',
        trap: `Esconde uma mina (${s.trapStock} sobrando)`,
        analyze: 'Responda V ou F para revelar um “?”'
      }[id];
      return { text, blocked: false };
    }

    // Abre os botões em leque em volta do navio. Tenta em cima, embaixo, à direita e à esquerda;
    // se nada couber, usa uma fileira (ou 2x2) simples.
    spotMenuLayout() {
      const g = this.geom, hole = this.spotHole();
      if (!hole) return null;
      const n = SHIP_ACTIONS.length, labelFs = this.fs(13), labelH = labelFs + 12;
      const B = clamp(g.cell * 1.55, 54, 78);
      const top = g.pan ? g.chipsY + g.chipsH + 6 : 10 + g.hudH + 6;
      const bottom = this.infoRect ? this.infoRect.y - 8 : g.playH - 8;
      const left = 8, right = g.playW - 8;
      const cx = hole.x + hole.w / 2, cy = hole.y + hole.h / 2;
      const labelW = SHIP_ACTIONS.map(a => Math.min(B + 40, this.measure(a.label, labelFs) + 18));
      const boxOf = (c, i) => {
        const w = Math.max(B, labelW[i]);
        return { x: c.x - w / 2, y: c.y - B / 2, w, h: B + 6 + labelH };
      };
      const overlap = (a, b, pad = 4) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
      const holeBox = { x: hole.x, y: hole.y, w: hole.w, h: hole.h };
      const inside = b => b.x >= left && b.x + b.w <= right && b.y >= top && b.y + b.h <= bottom;
      const fans = [[-160, -20, 'up'], [20, 160, 'down'], [-70, 70, 'right'], [110, 250, 'left']];
      for (const [a0, a1, dir] of fans) {
        for (let k = 1; k <= 2.4; k += 0.1) {
          const rx = (hole.w / 2 + B * 0.75) * k, ry = (hole.h / 2 + B * 0.75) * k;
          const items = SHIP_ACTIONS.map((_, i) => {
            const ang = (a0 + (a1 - a0) * (i / (n - 1))) * Math.PI / 180;
            return { cx: cx + Math.cos(ang) * rx, cy: cy + Math.sin(ang) * ry };
          });
          const boxes = items.map((c, i) => boxOf({ x: c.cx, y: c.cy }, i));
          if (boxes.some(b => overlap(b, holeBox, 6))) continue;
          if (boxes.some((b, i) => boxes.some((o, j) => j > i && overlap(b, o)))) continue;
          if (!boxes.every(inside)) break;
          return { B, labelH, labelFs, labelW, items, dir, top, bottom };
        }
      }
      // Plano B: fileira em cima/embaixo; se não couber, grade 2x2 (em cima, embaixo ou ao lado).
      const keepInside = L => {
        const xs = L.items.map((c, i) => [c.cx - Math.max(B, labelW[i]) / 2, c.cx + Math.max(B, labelW[i]) / 2]);
        const minX = Math.min(...xs.map(v => v[0])), maxX = Math.max(...xs.map(v => v[1]));
        const dx = minX < left ? left - minX : maxX > right ? right - maxX : 0;
        L.items.forEach(c => { c.cx += dx; });
        return L;
      };
      const step = Math.max(B, ...labelW) + 8, itemH = B + 6 + labelH;
      const base = { B, labelH, labelFs, labelW, top, bottom };
      const rowW = step * n;
      if (rowW <= right - left) {
        const rowAt = y => SHIP_ACTIONS.map((_, i) => ({ cx: clamp(cx - rowW / 2, left, right - rowW) + i * step + step / 2, cy: y + B / 2 }));
        if (hole.y - 14 - itemH >= top) return keepInside({ ...base, items: rowAt(hole.y - 14 - itemH), dir: 'up' });
        if (hole.y + hole.h + 14 + itemH <= bottom) return keepInside({ ...base, items: rowAt(hole.y + hole.h + 14), dir: 'down' });
      }
      const gridW = step * 2, gridH = itemH * 2 + 8;
      const gridAt = (x, y) => SHIP_ACTIONS.map((_, i) => ({ cx: x + (i % 2) * step + step / 2, cy: y + Math.floor(i / 2) * (itemH + 8) + B / 2 }));
      const gx = clamp(cx - gridW / 2, left, right - gridW);
      if (hole.y - 14 - gridH >= top) return keepInside({ ...base, items: gridAt(gx, hole.y - 14 - gridH), dir: 'up' });
      if (hole.y + hole.h + 14 + gridH <= bottom) return keepInside({ ...base, items: gridAt(gx, hole.y + hole.h + 14), dir: 'down' });
      const side = hole.x + hole.w + 14 + gridW <= right ? hole.x + hole.w + 14 : Math.max(left, hole.x - 14 - gridW);
      const gy = clamp(cy - gridH / 2, top, Math.max(top, bottom - gridH));
      return keepInside({ ...base, items: gridAt(side, gy), dir: 'side' });
    }

    // Cadeado pequeno para ações bloqueadas.
    drawLock(x, y, r) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = this.hc ? '#000' : '#4c6885'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = Math.max(1.5, r * 0.18);
      ctx.beginPath(); ctx.arc(x, y - r * 0.12, r * 0.3, Math.PI, 0); ctx.stroke();
      ctx.fillRect(x - r * 0.42, y - r * 0.12, r * 0.84, r * 0.6);
      ctx.restore();
    }

    drawActionBubble(act, x, y, r, { blocked, hover, chosen, spin, alpha }) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      if (hover && !blocked && !this.hc) {
        ctx.beginPath(); ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
        ctx.fillStyle = act.color; ctx.globalAlpha = alpha * 0.3; ctx.fill(); ctx.globalAlpha = alpha;
      }
      if (!this.hc) { ctx.shadowColor = 'rgba(4,20,40,.45)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5; }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      if (this.hc) ctx.fillStyle = '#fff';
      else {
        const base = blocked ? '#9aa9b9' : act.color, deep = blocked ? '#6b7a8c' : act.deep;
        const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r);
        grad.addColorStop(0, this.lighten(base, 60)); grad.addColorStop(0.55, base); grad.addColorStop(1, deep);
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = this.hc ? 3 : 3.5; ctx.strokeStyle = this.hc ? '#000' : '#fff'; ctx.stroke();
      if (!this.hc) {
        ctx.beginPath(); ctx.ellipse(-r * 0.12, -r * 0.5, r * 0.52, r * 0.24, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.fill();
      }
      const icon = this.actionIcons[act.id];
      if (icon) {
        const k = (r * 1.08) / 24;
        ctx.save(); ctx.rotate(spin); ctx.scale(k, k); ctx.translate(-12, -12);
        ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalAlpha = alpha * (blocked ? 0.75 : 1);
        ctx.strokeStyle = this.hc ? '#000' : '#fff'; ctx.stroke(icon); ctx.restore();
      }
      const kr = Math.max(10, r * 0.3);
      ctx.beginPath(); ctx.arc(r * 0.74, -r * 0.74, kr, 0, Math.PI * 2);
      ctx.fillStyle = this.hc ? '#000' : '#fff'; ctx.fill();
      if (!this.hc) { ctx.lineWidth = 2; ctx.strokeStyle = blocked ? '#6b7a8c' : act.deep; ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = alpha;
      this.text(act.key, x + r * 0.74, y - r * 0.74 + 1, { size: kr * 1.15, color: this.hc ? '#fff' : (blocked ? '#4c6885' : act.deep), align: 'center', baseline: 'middle', weight: 700 });
      ctx.restore();
      if (blocked) { ctx.save(); ctx.globalAlpha = alpha; this.drawLock(x + r * 0.7, y + r * 0.7, Math.max(9, r * 0.28)); ctx.restore(); }
      if (chosen && !this.hc) {
        ctx.save(); ctx.globalAlpha = alpha * 0.6; ctx.lineWidth = 4; ctx.strokeStyle = act.color;
        ctx.beginPath(); ctx.arc(x, y, r * (1.2 + (1 - alpha) * 0.8), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }

    drawShipCard(L, hole, alpha) {
      const s = this.spotShip();
      if (!s) return null;
      const g = this.geom, fsName = this.fs(15), fsInfo = this.fs(12.5);
      const charges = '●'.repeat(Math.max(0, s.availableCharges)) + '○'.repeat(Math.max(0, s.maxCharges - s.availableCharges));
      const info = `Vida ${Math.max(0, s.hp)}/${s.maxHp} · Cargas ${charges}${s.turnLocked ? ' · já agiu' : ''}`;
      const w = Math.min(g.playW - 70, Math.max(this.measure(this.shipName(s), fsName, 700), this.measure(info, fsInfo, 500)) + 28);
      const h = fsName + fsInfo + 30;
      const cx = hole.x + hole.w / 2;
      let y = L.dir === 'down' ? hole.y - h - 12 : hole.y + hole.h + 12;
      if (y < L.top || y + h > L.bottom) {
        y = L.dir === 'down' ? hole.y + hole.h + 12 : hole.y - h - 12;
        if (y < L.top || y + h > L.bottom) return null;
      }
      const x = clamp(cx - (w + 44) / 2, 8, g.playW - 8 - w - 44);
      const box = { x, y, w, h };
      // Não desenha por cima dos botões.
      const hit = L.items.some((c, i) => {
        const bw = Math.max(L.B, L.labelW[i]);
        return c.cx + bw / 2 > x && c.cx - bw / 2 < x + w + 44 && c.cy + L.B / 2 + L.labelH > y && c.cy - L.B / 2 < y + h;
      });
      if (hit) return null;
      ctx.save(); ctx.globalAlpha = alpha;
      this.card(x, y, w, h, { r: 16 });
      this.text(this.shipName(s), x + 14, y + 10 + fsName * 0.85, { size: fsName, color: this.hc ? '#000' : TEAM[s.owner].deep, weight: 700, maxWidth: w - 28 });
      const pct = clamp(s.hp / s.maxHp, 0, 1), by = y + 14 + fsName, bw = w - 28;
      this.rr(x + 14, by, bw, 6, 3); ctx.fillStyle = this.hc ? '#ccc' : '#e3ebf3'; ctx.fill();
      this.rr(x + 14, by, Math.max(6, bw * pct), 6, 3); ctx.fillStyle = pct > 0.5 ? C.grass : pct > 0.25 ? C.sun : C.p2; ctx.fill();
      this.text(info, x + 14, by + 10 + fsInfo * 0.85, { size: fsInfo, color: this.hc ? '#000' : C.inkSoft, weight: 500, maxWidth: w - 28 });
      ctx.restore();
      return box;
    }

    drawSpotMenu(t) {
      const v = this.view, open = this.menuOpen();
      // Ao fechar, os botões voltam para dentro do navio (ou o escolhido "estoura").
      if (!open) {
        const c = this.spotClosing;
        if (!c) return;
        const q = this.still ? 1 : clamp((t - c.t0) / 240, 0, 1);
        if (q >= 1) { this.spotClosing = null; return; }
        SHIP_ACTIONS.forEach((act, i) => {
          const it = c.L.items[i], chosen = act.id === c.chosen;
          const k = chosen ? 1 + q * 0.5 : 1 - q;
          const x = chosen ? it.cx : it.cx + (c.origin.x - it.cx) * q, y = chosen ? it.cy : it.cy + (c.origin.y - it.cy) * q;
          this.drawActionBubble(act, x, y, (c.L.B / 2) * Math.max(0.05, k), { blocked: false, hover: false, chosen, spin: chosen ? 0 : q * 2, alpha: 1 - q });
        });
        return;
      }
      if (v.a <= 0.05) return;
      const L = this.spotMenuLayout(), hole = this.spotHole();
      if (!L || !hole) return;
      const origin = { x: hole.x + hole.w / 2, y: hole.y + hole.h / 2 };
      this.spotClosing = null;
      this.lastSpotMenu = { L, origin };
      const age = t - this.spot.openedAt;
      // Onda saindo do navio
      if (!this.still && age < 500 && !this.hc) {
        const q = age / 500;
        ctx.save(); ctx.globalAlpha = (1 - q) * 0.7; ctx.lineWidth = 4; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(origin.x, origin.y, hole.w / 2 + q * 60, hole.h / 2 + q * 60, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      const cardBox = this.drawShipCard(L, hole, Math.min(1, v.a * 1.2));
      // Botão de fechar ao lado do cartão do navio (ou no canto do navio).
      const cr = 18;
      const close = cardBox ? { x: cardBox.x + cardBox.w + 10 + cr, y: cardBox.y + cardBox.h / 2 }
        : { x: clamp(hole.x + hole.w + cr * 0.4, cr + 8, this.geom.playW - cr - 8), y: clamp(L.dir === 'down' ? hole.y - cr * 0.4 : hole.y + hole.h + cr * 0.4, L.top + cr, L.bottom - cr) };
      ctx.save(); ctx.globalAlpha = Math.min(1, v.a * 1.2);
      ctx.beginPath(); ctx.arc(close.x, close.y, cr, 0, Math.PI * 2); ctx.fillStyle = this.hc ? '#000' : '#fff'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = this.hc ? '#fff' : '#c7d4e1'; ctx.stroke();
      ctx.strokeStyle = this.hc ? '#fff' : C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(close.x - 6, close.y - 6); ctx.lineTo(close.x + 6, close.y + 6); ctx.moveTo(close.x + 6, close.y - 6); ctx.lineTo(close.x - 6, close.y + 6); ctx.stroke();
      ctx.restore();
      this.buttons.push({ x: close.x - cr - 4, y: close.y - cr - 4, w: cr * 2 + 8, h: cr * 2 + 8, onClick: () => this.closeSpot() });

      let tip = null;
      SHIP_ACTIONS.forEach((act, i) => {
        const it = L.items[i];
        const p = this.still ? 1 : easeBack((age - i * 70) / 380);
        if (p <= 0) return;
        // voa numa curva, girando
        const pp = Math.min(1, p), dx = it.cx - origin.x, dy = it.cy - origin.y, len = Math.hypot(dx, dy) || 1;
        const swing = Math.sin(pp * Math.PI) * Math.min(40, len * 0.25) * (i % 2 ? 1 : -1);
        const x = origin.x + dx * p + (-dy / len) * swing, y = origin.y + dy * p + (dx / len) * swing;
        const blocked = !!this.actionBlocker(act.id);
        const hover = Math.hypot(this.hover.x - it.cx, this.hover.y - it.cy) <= L.B / 2 + 4;
        const bob = this.still ? 0 : Math.sin(t / 420 + i * 1.3) * 2.5 * pp;
        const r = (L.B / 2) * (0.3 + 0.7 * pp) * (hover && !blocked ? 1.1 : 1);
        this.drawActionBubble(act, x, y + bob, r, { blocked, hover, chosen: false, spin: this.still ? 0 : (1 - pp) * -Math.PI * 1.2, alpha: Math.min(1, v.a * 1.2) * (blocked ? 0.8 : 1) });
        if (pp > 0.65) {
          const lw = L.labelW[i], lh = L.labelH - 4, lx = it.cx - lw / 2, ly = it.cy + L.B / 2 + 6 + bob;
          ctx.save();
          ctx.globalAlpha = Math.min(1, v.a * 1.2) * clamp((pp - 0.65) / 0.35, 0, 1);
          this.rr(lx, ly, lw, lh, lh / 2);
          ctx.fillStyle = this.hc ? '#000' : (blocked ? 'rgba(235,241,247,.95)' : '#fff'); ctx.fill();
          if (!this.hc) { ctx.lineWidth = 2; ctx.strokeStyle = blocked ? '#c7d4e1' : act.color; ctx.stroke(); }
          this.text(act.label, it.cx, ly + lh / 2 + 1, { size: L.labelFs, color: this.hc ? '#fff' : (blocked ? C.inkSoft : act.deep), align: 'center', baseline: 'middle', maxWidth: lw - 10 });
          ctx.restore();
          this.buttons.push({ x: it.cx - Math.max(L.B, lw) / 2, y: it.cy - L.B / 2, w: Math.max(L.B, lw), h: L.B + 6 + L.labelH, onClick: () => this.setAction(act.id) });
          if (hover) tip = { act, it, hint: this.actionHint(act.id) };
        }
      });
      if (tip && tip.hint.text) this.drawActionTip(tip, L);
    }

    drawActionTip({ act, it, hint }, L) {
      const g = this.geom, fsz = this.fs(13), w = Math.min(g.playW - 16, this.measure(hint.text, fsz, 600) + 24), h = fsz + 18;
      let y = it.cy - L.B / 2 - h - 10;
      if (y < L.top) y = it.cy + L.B / 2 + L.labelH + 10;
      const x = clamp(it.cx - w / 2, 8, g.playW - 8 - w);
      ctx.save();
      if (!this.hc) { ctx.shadowColor = 'rgba(4,20,40,.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3; }
      this.rr(x, y, w, h, h / 2); ctx.fillStyle = this.hc ? '#000' : (hint.blocked ? '#c25e12' : C.ink); ctx.fill();
      ctx.restore();
      this.text(hint.text, x + w / 2, y + h / 2 + 1, { size: fsz, color: '#fff', align: 'center', baseline: 'middle', maxWidth: w - 20 });
    }

    /* ---------- partida ---------- */

    resetMatch(diff = 'medio') {
      const settings = this.state.settings || loadSettings();
      const camera = this.state.camera;
      this.state = this.createState();
      this.spot = { uid: null, open: false, a: 0, openedAt: 0, rect: null };
      this.state.settings = settings;
      this.state.camera = camera || this.state.camera;
      this.state.difficulty = normalizeDifficulty(diff) || 'medio';
      // O jogo é sempre contra o computador.
      this.state.mode = 'ai';
      this.matchSeq = (this.matchSeq || 0) + 1;
      this.state.matchId = this.matchSeq;
      this.aiBusy = false;
      this.applyModeLabels();
      this.state.startAt = Date.now();
      if (typeof resetScoreSubmission === 'function') resetScoreSubmission();
      this.audio.music = settings.music; this.audio.sfx = settings.sfx; this.audio.musicVol = settings.musicVol ?? 6; this.audio.sfxVol = settings.sfxVol ?? 8; this.audio.syncMusic();
      this.createFleets();
      this.state.placementOwner = 'player1';
      this.state.selectedShipId = this.state.ships.player1[0]?.uid || null;
      this.state.cursor = { row: 0, col: 0 };
      this.layout();
      this.focusZone(0, true);
      this.syncA11y();
      this.notify();
    }

    createFleets() {
      const ids = this.presetFleet(this.state.difficulty);
      for (const owner of ['player1', 'player2']) this.state.ships[owner] = ids.map((id, i) => this.makeShip(owner, id, i));
    }

    presetFleet(diff) {
      const budget = GDM_CONFIG.difficulties[diff].coins;
      const ids = []; let spent = 0;
      for (const id of ['trap-layer', 'battleship', 'cruiser', 'destroyer']) {
        const c = GDM_CONFIG.ships[id];
        if (spent + c.price <= budget) { ids.push(id); spent += c.price; }
      }
      while (spent + 300 <= budget && ids.length < 7) { ids.push('destroyer'); spent += 300; }
      return ids;
    }

    makeShip(owner, typeId, i) {
      const c = GDM_CONFIG.ships[typeId];
      return { uid: `${owner}-${typeId}-${i}`, owner, typeId, name: c.name, size: c.size, maxHp: c.hp, hp: c.hp, maxCharges: c.charges, availableCharges: c.charges, rechargeQueue: [], damage: c.damage, chargeType: c.chargeType, trapStock: c.trapStock || 0, row: null, col: null, orientation: 'horizontal', cells: [], destroyed: false, turnLocked: false, movedThisTurn: false };
    }

    shipName(ship) {
      const name = ship.name.charAt(0) + ship.name.slice(1).toLowerCase();
      return name.replace('Lança-armadilhas', 'Lança-Armadilhas');
    }

    currentOwner() { return this.state.phase === 'placement' ? this.state.placementOwner : this.state.turn; }
    ownerLabel(o) { return TEAM[o].label; }

    /* ---------- modo de jogo: contra o computador ou 2 jogadores ---------- */

    isAiMode() { return this.state.mode === 'ai'; }
    isAiOwner(owner) { return this.isAiMode() && owner === 'player2'; }
    isAiTurn() { return this.isAiMode() && this.state.phase === 'battle' && this.state.turn === 'player2'; }
    // Quem está olhando a tela: contra o computador é sempre o jogador humano.
    viewer() { return this.isAiMode() ? 'player1' : this.currentOwner(); }
    modeName(mode = this.state.mode) { return mode === 'ai' ? 'Contra o computador' : '2 jogadores'; }

    applyModeLabels() {
      const labels = MODE_LABELS[this.state.mode] || MODE_LABELS.ai;
      for (const owner of ['player1', 'player2']) Object.assign(TEAM[owner], labels[owner]);
      ZONES[0].label = labels.player1.zone; ZONES[2].label = labels.player2.zone;
      if (GDM_LOGIC.zoneNames) { GDM_LOGIC.zoneNames.player1 = labels.player1.zone; GDM_LOGIC.zoneNames.player2 = labels.player2.zone; }
      this.invalidateCaches();
    }

    canChangeMode() {
      return false && this.state.phase === 'placement' && this.state.placementOwner === 'player1' && !this.state.ships.player1.some(s => s.row !== null);
    }

    toggleMode() {
      if (getPlatformMode()) { this.toast('A plataforma já escolheu o modo de jogo', 'warn'); return; }
      if (!this.canChangeMode()) { this.toast('Troque o modo antes de posicionar o primeiro navio', 'warn'); this.audio.play('error'); return; }
      const next = this.state.mode === 'ai' ? 'pvp' : 'ai';
      this.state.settings.mode = next;
      saveSettings(this.state.settings);
      this.resetMatch(this.state.difficulty);
      this.state.phase = 'placement';
      this.toast(next === 'ai' ? 'Modo: contra o computador' : 'Modo: 2 jogadores no mesmo computador', 'info', 2200);
    }

    // Durante a vez do computador o jogador só assiste; o jogo explica o motivo.
    blockedByAi() {
      if (!this.isAiTurn()) return false;
      this.toast('Espere! O computador está jogando agora', 'warn', 1600);
      return true;
    }
    selectedShip() {
      const owner = this.currentOwner();
      return this.state.ships[owner].find(s => s.uid === this.state.selectedShipId && !s.destroyed) || null;
    }

    selectShip(uid) {
      const owner = this.currentOwner();
      const s = this.state.ships[owner].find(x => x.uid === uid && !x.destroyed);
      if (!s) return;
      this.state.selectedShipId = uid;
      this.state.action = null;
      if (s.row !== null) { this.state.cursor = { row: s.row, col: s.col }; this.ensureVisible(s.row, s.col); }
      this.audio.play('select');
      if (this.state.phase === 'battle') { this.tutorialEvent('battleSelect', { ship: s }); this.openSpot(uid); }
      else this.tutorialEvent('selectShip', { ship: s });
      const extra = this.state.phase === 'placement'
        ? (s.row === null ? 'Escolha uma casa no seu oceano.' : 'Já está no mapa. Escolha outra casa para mudar de lugar.')
        : `${Math.max(0, s.hp)} de ${s.maxHp} de vida. ${s.availableCharges} de ${s.maxCharges} cargas. Escolha a ação: 1 atacar, 2 mover, 3 armadilha, 4 analisar. Esc fecha.`;
      this.announce(`${this.shipName(s)} selecionado. ${extra}`);
    }

    rotateSelected() {
      const s = this.selectedShip();
      if (!s || this.state.phase !== 'placement') return;
      const next = s.orientation === 'horizontal' ? 'vertical' : 'horizontal';
      if (s.row !== null && !GDM_LOGIC.canPlace(this.state, s, s.row, s.col, next)) { this.toast('Não cabe girado aqui', 'warn'); this.audio.play('error'); return; }
      s.orientation = next;
      if (s.row !== null) GDM_LOGIC.refresh(s);
      this.audio.play('pop');
      this.toast(next === 'horizontal' ? 'Navio deitado (horizontal)' : 'Navio em pé (vertical)', 'info');
      this.tutorialEvent('rotate');
    }

    placeSelected(row, col) {
      const s = this.selectedShip();
      if (!s || this.state.phase !== 'placement') return;
      if (this.mission && !this.mission.allowPlace(s, row, col)) return;
      if (!GDM_LOGIC.canPlace(this.state, s, row, col, s.orientation)) {
        this.toast('Ops! Esse navio não cabe aí. Procure uma área verde', 'warn', 2400); this.audio.play('error');
        this.tutorialEvent('placeFail', { row, col });
        return;
      }
      s.row = row; s.col = col; GDM_LOGIC.refresh(s);
      this.audio.play('pop');
      this.tutorialEvent('placeShip', { ship: s, row, col });
      const next = this.state.ships[this.state.placementOwner].find(x => x.row === null);
      if (next) {
        this.state.selectedShipId = next.uid;
        this.announce(`${this.shipName(s)} posicionado em ${GDM_LOGIC.coord(row, col)}. Agora o ${this.shipName(next)}.`);
      } else {
        this.toast('Frota pronta! Aperte Pronto', 'success');
      }
    }

    autoPlace(owner = this.state.placementOwner, quiet = false) {
      if (this.state.phase !== 'placement') return false;
      const h = GDM_LOGIC.home(owner);
      for (const s of this.state.ships[owner]) { s.row = null; s.col = null; s.cells = []; }
      for (const s of this.state.ships[owner]) {
        let ok = false;
        for (let tries = 0; tries < 1000 && !ok; tries++) {
          const ori = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          const row = rand(10), col = h.minCol + rand(h.maxCol - h.minCol + 1);
          if (GDM_LOGIC.canPlace(this.state, s, row, col, ori)) { s.orientation = ori; s.row = row; s.col = col; GDM_LOGIC.refresh(s); ok = true; }
        }
        if (!ok) { if (!quiet) this.toast('Não deu certo, tente de novo', 'warn'); return false; }
      }
      if (quiet) return true;
      this.state.selectedShipId = this.state.ships[owner][0]?.uid || null;
      this.audio.play('pop');
      this.toast('Frota posicionada!', 'success');
      this.tutorialEvent('placeShip');
      return true;
    }

    fleetReady(owner = this.state.placementOwner) { return this.state.ships[owner].length > 0 && this.state.ships[owner].every(s => s.row !== null); }

    readyPlacement() {
      if (!this.fleetReady()) { this.toast('Ainda falta posicionar navios', 'warn'); this.audio.play('error'); return; }
      this.tutorialEvent('ready');
      if (this.isAiMode()) {
        // O computador arruma a frota dele sozinho, sem espiar a sua.
        let ok = false;
        for (let i = 0; i < 20 && !ok; i++) ok = this.autoPlace('player2', true);
        this.beginBattle();
        return;
      }
      if (this.state.placementOwner === 'player1') {
        this.openHandoff('player2', 'Hora de passar o comando!', 'Frota do Jogador 1 escondida. Entregue o aparelho para o Jogador 2 (sem espiar!).', () => {
          this.state.placementOwner = 'player2';
          this.state.selectedShipId = this.state.ships.player2[0]?.uid || null;
          this.state.cursor = { row: 0, col: 20 };
          this.focusZone(2, true);
          this.announce('Jogador 2, posicione sua frota no oceano da direita.');
        });
      } else this.beginBattle();
    }

    beginBattle() {
      if (this.isAiMode()) {
        this.state.phase = 'battle';
        this.state.turn = 'player1'; this.state.roundStarter = 'player1'; this.state.round = 1; this.state.selectedShipId = null; this.state.action = null;
        this.focusZone(0, true);
        this.startTurn('player1');
        this.toast('Hora da batalha! Você começa, Capitão', 'success', 2400);
        return;
      }
      this.state.phase = 'battle';
      this.state.turn = Math.random() < 0.5 ? 'player1' : 'player2';
      this.state.roundStarter = this.state.turn; this.state.round = 1; this.state.selectedShipId = null; this.state.action = null;
      const first = this.state.turn;
      this.openHandoff(first, 'Hora da batalha!', `O sorteio escolheu: ${TEAM[first].label} começa.`, () => this.startTurn(first));
    }

    startTurn(owner) {
      this.state.phase = 'battle'; this.state.turn = owner; this.state.analysisAvailable[owner] = true; this.state.selectedShipId = null; this.state.action = null;
      for (const s of this.state.ships[owner]) { s.turnLocked = false; s.movedThisTurn = false; if (!s.destroyed) GDM_LOGIC.recoverCharges(s, this.state.round); }
      const first = this.state.ships[owner].find(s => !s.destroyed);
      if (first) { this.state.cursor = { row: first.row, col: first.col }; this.ensureVisible(first.row, first.col, true); }
      this.computeRadar(owner);
      this.audio.play(this.isAiOwner(owner) ? 'enemyTurn' : 'turn');
      this.banner(this.isAiOwner(owner) ? 'Vez do Computador' : (this.isAiMode() ? 'Sua vez, Capitão!' : `${TEAM[owner].label}: sua vez!`), owner);
      if (this.isAiOwner(owner)) {
        this.toast('Vez do Computador! Ele está pensando…', 'info', 2200);
        this.announce(`Rodada ${this.state.round}. Vez do Computador. Espere a jogada dele.`, true);
        if (this.ai) this.ai.takeTurn();
        return;
      }
      this.toast(`Vez do ${TEAM[owner].label}!`, 'info');
      this.announce(`Rodada ${this.state.round}. Sua vez, ${TEAM[owner].label}. Escolha um navio. Tecla I fala a situação da partida.`, true);
      this.tutorialEvent('turnStart', { owner });
    }

    endTurn() {
      if (this.state.phase !== 'battle' || this.state.modal) return;
      this.tutorialEvent('endTurn');
      const current = this.state.turn, next = GDM_LOGIC.other(current);
      const newRound = next === this.state.roundStarter ? this.state.round + 1 : this.state.round;
      if (this.isAiMode()) {
        this.state.action = null; this.state.selectedShipId = null;
        this.spot = { uid: null, open: false, a: 0, openedAt: 0, rect: null };
        this.state.round = newRound;
        this.startTurn(next);
        return;
      }
      this.openHandoff(next, `${TEAM[current].label}: missão concluída!`, `Passe o comando: entregue o aparelho para o ${TEAM[next].label}.`, () => { this.state.round = newRound; this.startTurn(next); });
    }

    // Motivo pelo qual uma ação não pode ser usada agora (null = liberada).
    actionBlocker(action) {
      if (this.state.phase !== 'battle' || this.state.modal) return 'Disponível só na batalha';
      if (action === 'analyze') {
        if (!this.state.analysisAvailable[this.state.turn]) return 'Análise já usada nesta vez';
        if (!this.questionsLoaded) return 'Abra o jogo pelo JOGAR_AGORA.bat';
        return null;
      }
      const s = this.selectedShip();
      if (!s) return 'Escolha um navio primeiro';
      if (s.turnLocked) return 'Esse navio já cumpriu sua missão nesta vez. Escolha outro ou passe a vez';
      if (action === 'attack' && s.chargeType !== 'missile') return 'Esse navio não tem mísseis';
      if (action === 'trap' && s.typeId !== 'trap-layer') return 'Só o Lança-Armadilhas solta minas';
      if ((action === 'attack' || action === 'trap') && s.availableCharges <= 0) return 'Esse navio está sem munição. Ela volta depois de algumas rodadas';
      if (action === 'trap' && s.trapStock <= 0) return 'Acabaram as armadilhas';
      return null;
    }

    setAction(action) {
      if (this.state.phase !== 'battle' || this.state.modal) return;
      if (this.state.action === action) { this.cancelAction(); return; }
      const blocker = this.actionBlocker(action);
      if (blocker) { this.toast(blocker, 'warn'); this.audio.play('error'); return; }
      this.beginSpotClosing(action);
      this.state.action = action;
      this.spot.open = false;
      this.audio.play('select');
      this.tutorialEvent(action === 'analyze' ? 'analyzeMode' : 'chooseAction');
      const msg = {
        attack: 'Modo ataque: escolha uma casa para atirar',
        move: 'Modo mover: escolha uma casa ao lado do navio',
        trap: 'Modo armadilha: escolha uma casa até 7 de distância',
        analyze: 'Modo radar: escolha um ponto de interrogação'
      }[action];
      this.toast(msg, 'info', 2200);
    }

    cancelAction() {
      if (!this.state.action) return;
      this.state.action = null;
      const s = this.selectedShip();
      if (s && !s.turnLocked) this.openSpot(s.uid);
      this.toast('Ação cancelada. Escolha outra', 'info', 1200);
    }

    executeCellAction(row, col) {
      if (this.state.action === 'attack') this.attack(row, col);
      else if (this.state.action === 'move') this.moveByClickedCell(row, col);
      else if (this.state.action === 'trap') this.placeTrap(row, col);
      else if (this.state.action === 'analyze') this.analyze(row, col);
    }

    attack(row, col, skipRisk = false) {
      const owner = this.state.turn, opponent = GDM_LOGIC.other(owner), s = this.selectedShip();
      if (!s || s.chargeType !== 'missile' || s.availableCharges <= 0 || s.turnLocked) return;
      const targetShip = GDM_LOGIC.shipAt(this.state, row, col, opponent), targetTrap = GDM_LOGIC.trapAt(this.state, row, col, opponent), obj = targetShip || targetTrap;
      if (obj && !skipRisk) {
        const id = GDM_LOGIC.objectId(obj, targetShip ? 'ship' : 'trap');
        if (this.state.detected[owner].has(id) && !this.state.revealed[owner].has(id)) {
          this.state.modal = { type: 'risk', row, col, buttons: [], openedAt: now() };
          this.announce('Esse ponto ainda é um mistério. Pode ser navio ou armadilha. Enter atira mesmo assim, Escape cancela.');
          return;
        }
      }
      GDM_LOGIC.spendCharge(s, this.state.round); this.state.stats[owner].attacks++;
      const byAi = this.isAiOwner(owner), where = GDM_LOGIC.coord(row, col);
      if (byAi) this.ensureVisible(row, col);
      this.audio.play('fire');
      this.spawnShot(s, row, col);
      if (targetTrap) {
        targetTrap.active = false; s.hp -= GDM_CONFIG.traps.damage; this.spawnFloat(row, col, `-${GDM_CONFIG.traps.damage}`, C.purple);
        this.spawnWord(row, col, 'BUM! ARMADILHA!', C.purple); this.shakeScreen(9);
        if (byAi) this.achieve('trapWorked', 'ARMADILHA PERFEITA!', 'O inimigo caiu na sua mina'); this.state.stats[owner].trapsTriggered++; this.state.revealed[owner].add(GDM_LOGIC.objectId(targetTrap, 'trap'));
        this.state.marks[owner].set(`${row}:${col}`, 'hit'); this.spawnExplosion(row, col);
        this.audio.play('boom');
        if (byAi) this.toast(`O computador caiu na sua armadilha em ${where}!`, 'success', 2400);
        else this.toast(`Era uma armadilha! Seu navio perdeu ${GDM_CONFIG.traps.damage} de vida`, 'danger', 2400);
        if (s.hp <= 0) { s.destroyed = true; s.cells = []; this.toast(byAi ? 'Sua armadilha afundou um navio do computador!' : `Que pena! Seu ${this.shipName(s)} afundou`, byAi ? 'success' : 'danger', 2400); }
      } else if (targetShip) {
        this.buzz(50);
        targetShip.hp -= s.damage; this.state.stats[owner].hits++; this.state.marks[owner].set(`${row}:${col}`, 'hit'); this.spawnExplosion(row, col);
        this.audio.play('boom');
        this.spawnFloat(row, col, `-${s.damage}`, byAi ? C.p2Deep : '#c2410c');
        this.spawnWord(row, col, 'ACERTO!', byAi ? C.p2 : C.grass);
        this.shakeScreen(6);
        const streak = this.state.streak || (this.state.streak = { player1: 0, player2: 0 });
        streak[owner] = (streak[owner] || 0) + 1;
        if (!byAi) {
          this.achieve('firstHit', 'PRIMEIRO ACERTO!', 'Seu primeiro tiro certeiro');
          if (streak[owner] >= 2) this.achieve('streak2', 'MIRA AFIADA!', '2 tiros certos seguidos');
          this.tutorialEvent('shot', { hit: true });
        }
        if (targetShip.hp <= 0) {
          if (!byAi) this.achieve('firstSink', 'NAVIO AFUNDADO!', 'Você afundou um navio inimigo');
          targetShip.destroyed = true; targetShip.cells = []; this.state.stats[owner].shipsDestroyed++;
          this.toast(byAi ? `O computador afundou seu ${this.shipName(targetShip)} em ${where}!` : `Afundou o ${this.shipName(targetShip)} inimigo em ${where}!`, byAi ? 'danger' : 'success', 2400);
        } else this.toast(byAi ? `O computador acertou seu ${this.shipName(targetShip)} em ${where}!` : `Na mosca! Acertou em ${where}: ${s.damage} de dano`, byAi ? 'danger' : 'success', byAi ? 2200 : 1800);
      } else {
        this.state.marks[owner].set(`${row}:${col}`, 'miss'); this.spawnSplash(row, col);
        this.spawnWord(row, col, 'ÁGUA!', C.p1Deep);
        if (this.state.streak) this.state.streak[owner] = 0;
        if (!byAi) this.tutorialEvent('shot', { hit: false });
        this.audio.play('splash');
        this.toast(byAi ? `O computador errou! Água em ${where}` : `Splash! Água em ${where}`, 'info');
      }
      this.state.action = null; this.computeRadar(owner);
      this.tutorialEvent('actionDone', { type: 'attack', owner, hit: !!(targetShip || targetTrap) });
      this.checkEnd();
    }

    moveByClickedCell(row, col) {
      const s = this.selectedShip();
      if (!s) return;
      const rows = s.cells.map(c => c.row), cols = s.cells.map(c => c.col);
      const minR = Math.min(...rows), maxR = Math.max(...rows), minC = Math.min(...cols), maxC = Math.max(...cols);
      let dr = 0, dc = 0;
      if (row === minR - 1 && col >= minC && col <= maxC) dr = -1;
      else if (row === maxR + 1 && col >= minC && col <= maxC) dr = 1;
      else if (col === minC - 1 && row >= minR && row <= maxR) dc = -1;
      else if (col === maxC + 1 && row >= minR && row <= maxR) dc = 1;
      else { this.toast('Escolha uma casa colada no navio', 'warn'); this.audio.play('error'); return; }
      this.moveSelected(dr, dc);
    }

    moveSelected(dr, dc) {
      const s = this.selectedShip();
      if (!s || s.turnLocked) return;
      if (!GDM_LOGIC.canMove(this.state, s, dr, dc)) { this.toast('Caminho bloqueado', 'warn'); this.audio.play('error'); return; }
      s.row += dr; s.col += dc; GDM_LOGIC.refresh(s); s.turnLocked = true; s.movedThisTurn = true; this.state.action = null;
      if (this.isAiOwner(s.owner)) {
        // Movimento do computador fica escondido: o jogador só fica sabendo que algo mudou.
        this.audio.play('move'); this.computeRadar(this.state.turn);
        this.toast('O computador moveu um navio escondido', 'info');
        return;
      }
      this.state.cursor = { row: s.row, col: s.col };
      this.ensureVisible(s.row, s.col);
      this.audio.play('move'); this.computeRadar(this.state.turn);
      this.toast('O navio andou 1 casa', 'success');
      this.tutorialEvent('actionDone');
    }

    trapCellAllowed(row, col, s = this.selectedShip()) {
      if (!s) return false;
      const owner = this.state.turn, zone = GDM_LOGIC.zone(col);
      const allowed = owner === 'player1' ? ['player1', 'neutral'] : ['player2', 'neutral'];
      return allowed.includes(zone) && GDM_LOGIC.distanceToShip({ row, col }, s) <= GDM_CONFIG.traps.launchRadius && !GDM_LOGIC.shipAt(this.state, row, col) && !GDM_LOGIC.trapAt(this.state, row, col);
    }

    placeTrap(row, col) {
      const owner = this.state.turn, s = this.selectedShip();
      if (!s || s.typeId !== 'trap-layer' || s.availableCharges <= 0 || s.trapStock <= 0 || s.turnLocked) return;
      const zone = GDM_LOGIC.zone(col), allowed = owner === 'player1' ? ['player1', 'neutral'] : ['player2', 'neutral'];
      if (!allowed.includes(zone)) { this.toast('Use o seu oceano ou o Neutro', 'warn'); this.audio.play('error'); return; }
      if (GDM_LOGIC.distanceToShip({ row, col }, s) > GDM_CONFIG.traps.launchRadius) { this.toast('Muito longe! Alcance de 7 casas', 'warn'); this.audio.play('error'); return; }
      if (GDM_LOGIC.shipAt(this.state, row, col) || GDM_LOGIC.trapAt(this.state, row, col)) { this.toast('Essa casa está ocupada', 'warn'); this.audio.play('error'); return; }
      GDM_LOGIC.spendCharge(s, this.state.round); s.trapStock--; s.turnLocked = true;
      this.state.traps.push({ uid: `trap-${owner}-${Date.now()}-${Math.random()}`, owner, row, col, active: true });
      this.state.action = null; this.audio.play('trap'); this.computeRadar(owner);
      if (!this.isAiOwner(owner)) this.spawnWord(row, col, 'ARMADILHA ESCONDIDA!', C.purple);
      this.toast(this.isAiOwner(owner) ? 'O computador escondeu uma armadilha no mar!' : 'Armadilha escondida!', this.isAiOwner(owner) ? 'warn' : 'success');
      this.tutorialEvent('actionDone');
    }

    analyze(row, col) {
      const owner = this.state.turn, opponent = GDM_LOGIC.other(owner);
      if (!this.state.analysisAvailable[owner]) return;
      const ship = GDM_LOGIC.shipAt(this.state, row, col, opponent), trap = GDM_LOGIC.trapAt(this.state, row, col, opponent), obj = ship || trap;
      if (!obj) { this.toast('Nenhum contato nessa casa', 'warn'); return; }
      const type = ship ? 'ship' : 'trap', id = GDM_LOGIC.objectId(obj, type);
      if (!this.state.detected[owner].has(id)) { this.toast('Fora do alcance do radar', 'warn'); return; }
      if (this.state.revealed[owner].has(id)) { this.toast('Esse já foi descoberto', 'info'); return; }
      if (!this.questionsLoaded) { this.toast('Perguntas não carregadas', 'warn'); return; }
      const q = this.pickQuestion();
      if (!q) { this.toast('As 20 perguntas deste nível já foram usadas', 'warn'); this.announce('Todas as vinte perguntas deste nível já foram usadas nesta partida. Não haverá repetição.'); return; }
      this.state.analysisAvailable[owner] = false; this.state.action = null;
      this.state.stats[owner].verificationAttempts++;
      this.state.modal = { type: 'question', question: q, target: obj, targetType: type, owner, buttons: [], openedAt: now() };
      this.audio.play('radar');
      this.tutorialEvent('analyzeMode');
      this.tutorialEvent('signal');
      this.announce(`Capitão! Nosso radar encontrou um sinal misterioso. Vamos decifrar esse sinal! A frase é verdadeira ou falsa? ${q.pergunta} Pressione V para verdadeiro ou F para falso.`);
    }

    pickQuestion() {
      const pool = this.questions.filter(q => q.dificuldade === this.state.difficulty && !this.state.usedQuestionIds.has(q.id));
      return pool.length ? pool[rand(pool.length)] : null;
    }

    answerQuestion(answer) {
      const m = this.state.modal;
      if (!m || m.type !== 'question') return;
      const q = m.question;
      this.state.usedQuestionIds.add(q.id);
      const correct = answer === q.resposta;
      if (m.practice) {
        this.audio.play(correct ? 'correct' : 'wrong');
        this.state.modal = { type: 'feedback', practice: true, correct, answer, question: q, found: null, buttons: [], openedAt: now() };
        this.tutorialEvent('practiceAnswered', { correct });
        this.announce(`${correct ? 'Excelente, capitão! Sinal decodificado.' : 'Quase! Agora você já sabe.'} ${q.explicacao}`);
        return;
      }
      const human = !this.isAiOwner(m.owner);
      const answered = this.state.stats[m.owner].verificationAttempts;
      if (human && answered >= 3) this.achieve('curious', 'CAPITÃO CURIOSO!', '3 perguntas respondidas');
      if (correct) {
        this.state.stats[m.owner].verificationCorrect++;
        if (human) {
          const stars = this.state.stars || (this.state.stars = { player1: 0, player2: 0 });
          stars[m.owner]++;
          this.flash(C.grass);
          if (this.state.stats[m.owner].verificationCorrect >= 3) this.achieve('radarMaster', 'MESTRE DO RADAR!', '3 análises corretas');
          this.tutorialEvent('answerRight', { stars: stars[m.owner] });
        }
        this.state.revealed[m.owner].add(GDM_LOGIC.objectId(m.target, m.targetType));
        if (m.targetType === 'trap') this.state.stats[m.owner].trapsDiscovered++;
        this.audio.play('correct');
      } else { this.audio.play('wrong'); if (human) this.tutorialEvent('answerWrong'); }
      const found = m.targetType === 'trap' ? 'uma armadilha' : `o ${this.shipName(m.target)}`;
      this.state.modal = { type: 'feedback', correct, answer, question: q, found: correct ? found : null, buttons: [], openedAt: now() };
      this.tutorialEvent('analyzeMode');
      this.announce(`${correct ? `Excelente! Você acertou e o radar identificou o contato: ${found}.` : `Quase! Essa era difícil. A resposta correta é ${q.resposta ? 'Verdadeiro' : 'Falso'}.`} ${q.explicacao}${correct ? '' : ' Agora você já sabe para a próxima!'}`);
    }

    closeFeedback() {
      if (this.state.modal?.type !== 'feedback') return;
      const practice = !!this.state.modal.practice;
      this.state.modal = null;
      if (practice) { this.tutorialEvent('practiceClosed'); this.notify(); return; }
      this.computeRadar(this.state.turn);
      this.notify();
    }

    computeRadar(viewer) {
      const opponent = GDM_LOGIC.other(viewer), det = this.state.detected[viewer];
      const before = new Set(det);
      det.clear();
      const own = this.state.ships[viewer].filter(s => !s.destroyed);
      for (const enemy of this.state.ships[opponent].filter(s => !s.destroyed)) {
        if (enemy.cells.some(ec => own.some(os => GDM_LOGIC.distanceToShip(ec, os) <= GDM_CONFIG.radar.radius))) det.add(GDM_LOGIC.objectId(enemy, 'ship'));
      }
      for (const t of this.state.traps.filter(t => t.active && t.owner === opponent)) {
        if (own.some(os => GDM_LOGIC.distanceToShip(t, os) <= GDM_CONFIG.radar.radius)) det.add(GDM_LOGIC.objectId(t, 'trap'));
      }
      // Contato novo no radar do jogador humano: som de sonar e onda saindo dos navios.
      const fresh = [...det].filter(id => !before.has(id) && !this.state.revealed[viewer].has(id));
      if (fresh.length && !this.isAiOwner(viewer) && this.state.phase === 'battle') {
        this.audio.play('radar');
        for (const s of own) { const c = s.cells[Math.floor(s.cells.length / 2)]; if (c) this.spawnRadar(c.row, c.col); }
        this.toast(fresh.length === 1 ? 'CONTATO NO RADAR!' : `${fresh.length} CONTATOS NO RADAR!`, 'info', 2200);
        this.tutorialEvent('radarContact', { count: fresh.length });
      }
      this.notify();
    }

    radarContacts() {
      if (this.state.phase !== 'battle') return [];
      const owner = this.viewer(), opponent = GDM_LOGIC.other(owner), items = [];
      for (const ship of this.state.ships[opponent]) {
        if (ship.destroyed) continue;
        const id = GDM_LOGIC.objectId(ship, 'ship');
        if (!this.state.detected[owner].has(id)) continue;
        const revealed = this.state.revealed[owner].has(id), cell = ship.cells[0];
        items.push({ id, type: 'ship', revealed, row: cell.row, col: cell.col, label: revealed ? `${this.shipName(ship)} inimigo` : 'Contato misterioso' });
      }
      for (const trap of this.state.traps.filter(t => t.active && t.owner === opponent)) {
        const id = GDM_LOGIC.objectId(trap, 'trap');
        if (!this.state.detected[owner].has(id)) continue;
        const revealed = this.state.revealed[owner].has(id);
        items.push({ id, type: 'trap', revealed, row: trap.row, col: trap.col, label: revealed ? 'Armadilha inimiga' : 'Contato misterioso' });
      }
      return items;
    }

    analyzeContact(row, col) {
      const blocker = this.actionBlocker('analyze');
      if (blocker) { this.toast(blocker, 'warn'); return; }
      this.state.cursor = { row, col };
      this.ensureVisible(row, col, true);
      this.analyze(row, col);
    }

    elapsedSeconds() { return Math.max(0, Math.floor((Date.now() - (this.state.startAt || Date.now())) / 1000)); }
    elapsedText() { const t = this.elapsedSeconds(); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }

    performanceScore(owner) {
      const opponent = GDM_LOGIC.other(owner), enemy = this.state.ships[opponent];
      if (!enemy.length) return 0;
      const totalHp = enemy.reduce((sum, s) => sum + s.maxHp, 0) || 1;
      const remaining = enemy.reduce((sum, s) => sum + Math.max(0, s.hp), 0);
      const combat = clamp((totalHp - remaining) / totalHp, 0, 1);
      const st = this.state.stats[owner];
      const analysis = st.verificationAttempts ? st.verificationCorrect / st.verificationAttempts : 0;
      const accuracy = st.attacks ? st.hits / st.attacks : 0;
      return clamp(Math.round(combat * 55 + analysis * 35 + accuracy * 10), 0, 100);
    }

    currentScores() {
      if (this.state.finalScores) return this.state.finalScores;
      return { player1: this.performanceScore('player1'), player2: this.performanceScore('player2') };
    }

    checkEnd() {
      const a = this.state.ships.player1.some(s => !s.destroyed), b = this.state.ships.player2.some(s => !s.destroyed);
      if (a && b) return false;
      this.state.winner = a ? 'player1' : 'player2';
      this.aiBusy = false;
      this.state.finalScores = { player1: this.performanceScore('player1'), player2: this.performanceScore('player2') };
      this.state.platformScore = this.state.finalScores.player1;
      this.state.phase = 'end';
      this.state.toast = null; this.state.action = null; this.closeSpot && this.closeSpot();
      this.state.modal = { type: 'end', buttons: [], openedAt: now() };
      sendFinalScore({ score: this.state.platformScore, difficulty: getPlatformDifficulty() });
      this.audio.play(this.isAiMode() && this.state.winner === 'player2' ? 'lose' : 'win');
      this.announce(`${this.winTitle()} Pontuação do ${TEAM.player1.label} enviada para a plataforma: ${this.state.platformScore} de 100. Enter para jogar de novo.`);
      return true;
    }

    restart() {
      const d = this.state.difficulty;
      this.state.modal = null;
      this.resetMatch(d);
      this.state.phase = 'placement';
      this.announce(`Nova partida! ${TEAM.player1.label}, posicione sua frota.`);
    }

    openHandoff(owner, title, detail, onAccept) {
      this.state.action = null;
      this.spot = { uid: null, open: false, a: 0, openedAt: 0, rect: null };
      this.state.modal = { type: 'handoff', owner, title, detail, onAccept, buttons: [], openedAt: now() };
      this.audio.play('handoff');
      this.announce(`${title} ${detail} Pressione Enter quando o ${TEAM[owner].label} estiver pronto.`);
    }

    acceptHandoff() {
      const m = this.state.modal;
      if (!m || m.type !== 'handoff') return;
      const cb = m.onAccept;
      this.state.modal = null;
      if (cb) cb();
      this.notify();
    }

    confirmRisk(yes) {
      const m = this.state.modal;
      if (!m || m.type !== 'risk') return;
      this.state.modal = null;
      if (yes) this.attack(m.row, m.col, true);
      else this.toast('Ataque cancelado', 'info');
    }

    closeModal() {
      const m = this.state.modal;
      if (!m) return;
      if (m.type === 'help') { this.state.modal = null; this.announce('Guia fechado.'); }
      else if (m.type === 'feedback') this.closeFeedback();
      else if (m.type === 'risk') this.confirmRisk(false);
    }

    openHelp() {
      if (this.state.modal && this.state.modal.type !== 'help') return;
      if (this.state.modal?.type === 'help') { this.closeModal(); return; }
      this.state.modal = { type: 'help', buttons: [], openedAt: now() };
      this.announce('Guia do capitão aberto. Escape fecha.');
    }

    openSettings() { if (this.panel) this.panel.open('settings', true); }
    focusPanel() { if (this.panel) this.panel.open(null, true); }

    updateSetting(key, value, message) {
      this.state.settings[key] = value;
      saveSettings(this.state.settings);
      this.invalidateCaches();
      this.toast(message, 'info', 1200);
    }

    // Aplica no documento as preferências visuais (contraste, movimento, tamanho, tipo e espaço do texto).
    applyLook() {
      const s = this.state.settings, root = document.documentElement;
      root.classList.toggle('hc', !!s.highContrast);
      root.classList.toggle('still', !!s.reduceMotion);
      root.classList.toggle('airy', !!s.airyText);
      root.style.setProperty('--fs', String(s.fontScale || 1));
      const fam = { simples: 'Arial, Helvetica, sans-serif', ampla: 'Verdana, Geneva, sans-serif' }[s.fontFamily];
      if (fam) root.style.setProperty('--font', fam); else root.style.removeProperty('--font');
    }
    setVolume(kind, v) {
      v = Math.max(0, Math.min(10, Math.round(v)));
      const key = kind === 'music' ? 'musicVol' : 'sfxVol';
      this.state.settings[key] = v; saveSettings(this.state.settings);
      this.audio[key] = v; this.audio.ensure(); this.audio.syncMusic();
      if (kind === 'sfx') this.audio.play('splash');
      this.announce(`${kind === 'music' ? 'Volume da música' : 'Volume dos efeitos'}: ${v === 0 ? 'mudo' : v + ' de 10'}`);
    }
    setFontFamily(v) { const n = { padrao: 'Padrão do jogo', simples: 'Simples', ampla: 'Ampla' }[v] || 'Padrão do jogo'; this.updateSetting('fontFamily', v, `Letra: ${n}`); this.applyLook(); this.layout(); }
    toggleAiry() { const on = !this.state.settings.airyText; this.updateSetting('airyText', on, on ? 'Mais espaço no texto' : 'Espaço normal no texto'); this.applyLook(); }
    toggleTutorialAuto() { const on = !this.state.settings.tutorialAuto; this.updateSetting('tutorialAuto', on, on ? 'Tutorial na primeira partida: ligado' : 'Tutorial na primeira partida: desligado'); }
    resetSettings() {
      const keep = { mode: 'ai' };
      try { localStorage.removeItem(SETTINGS_KEY); } catch (_e) {}
      this.state.settings = Object.assign(loadSettings(), keep);
      const st = this.state.settings;
      this.audio.music = st.music; this.audio.sfx = st.sfx; this.audio.musicVol = st.musicVol; this.audio.sfxVol = st.sfxVol; this.audio.syncMusic();
      saveSettings(st); this.invalidateCaches(); this.applyLook(); this.layout();
      this.toast('Preferências voltaram ao padrão', 'info', 1600);
    }

    toggleMusic() {
      const on = !this.state.settings.music;
      this.audio.music = on; this.audio.ensure(); this.audio.syncMusic();
      this.updateSetting('music', on, on ? 'Música ligada' : 'Música desligada');
    }
    toggleSfx() {
      const on = !this.state.settings.sfx;
      this.audio.sfx = on;
      this.updateSetting('sfx', on, on ? 'Efeitos sonoros ligados' : 'Efeitos sonoros desligados');
    }
    setFontScale(v) { this.updateSetting('fontScale', v, `Texto em ${Math.round(v * 100)}%`); this.layout(); }
    cycleFont() { const vals = [1, 1.25, 1.5], i = vals.indexOf(this.state.settings.fontScale); this.setFontScale(vals[(i + 1) % vals.length]); }
    toggleContrast() { const on = !this.state.settings.highContrast; this.updateSetting('highContrast', on, on ? 'Alto contraste ligado' : 'Alto contraste desligado'); }
    toggleScreenReader() {
      const on = !this.state.settings.screenReader;
      this.updateSetting('screenReader', on, on ? 'Modo leitor de tela ligado' : 'Modo leitor de tela desligado');
      if (on) this.announce('Modo leitor de tela ligado. O computador joga mais devagar e as dicas não roubam o foco. Use o mapa acessível ou o campo Ir para a casa. Tecla I fala a situação da partida.', true);
    }
    toggleMapSounds() { const on = !this.state.settings.mapSounds; this.updateSetting('mapSounds', on, on ? 'Sons do mapa ligados' : 'Sons do mapa desligados'); }

    // Tipo de conteúdo da casa (para sons e descrições).
    cellKind(row, col) {
      const viewer = this.viewer(), opp = GDM_LOGIC.other(viewer), st = this.state;
      if (GDM_LOGIC.shipAt(st, row, col, viewer)) return 'ship';
      if (st.phase === 'placement') {
        const s = this.selectedShip();
        if (s && GDM_LOGIC.home(viewer).minCol <= col && col <= GDM_LOGIC.home(viewer).maxCol) return GDM_LOGIC.canPlace(st, s, row, col, s.orientation) ? 'ok' : 'no';
        return 'water';
      }
      if (GDM_LOGIC.trapAt(st, row, col, viewer)) return 'mine';
      const enemy = GDM_LOGIC.shipAt(st, row, col, opp), trap = GDM_LOGIC.trapAt(st, row, col, opp), obj = enemy || trap;
      if (obj) {
        const id = GDM_LOGIC.objectId(obj, enemy ? 'ship' : 'trap');
        if (st.revealed[viewer].has(id)) return enemy ? 'enemy' : 'mine';
        if (st.detected[viewer].has(id)) return 'contact';
      }
      const mark = st.marks[viewer].get(`${row}:${col}`);
      return mark || 'water';
    }

    // Tecla I: a situação inteira da partida em uma frase.
    statusText() {
      const st = this.state, me = this.viewer(), opp = GDM_LOGIC.other(me);
      if (st.phase === 'placement') {
        const left = st.ships[me].filter(s => s.row === null).length;
        return left ? `Montando a frota. Faltam ${left} navios para posicionar. Navio escolhido: ${this.selectedShip() ? this.shipName(this.selectedShip()) : 'nenhum'}.` : 'Frota completa. Aperte Pronto.';
      }
      if (st.phase === 'end') return `${this.winTitle()} Pontuação ${this.currentScores()[me]} de 100.`;
      const mine = st.ships[me].filter(s => !s.destroyed), sunk = st.ships[opp].filter(s => s.destroyed).length;
      const ready = mine.filter(s => !s.turnLocked).length, contacts = this.radarContacts().filter(c => !c.revealed).length;
      return `Rodada ${st.round}. ${this.isAiTurn() ? 'Vez do computador.' : 'Sua vez.'} Você tem ${mine.length} navios, ${ready} ainda podem agir. Você afundou ${sunk} de ${st.ships[opp].length} navios inimigos. ${contacts ? `${contacts} contatos misteriosos no radar.` : 'Nenhum contato no radar.'} Pontos: ${this.currentScores()[me]} de 100.`;
    }

    toggleMotion() { const on = !this.state.settings.reduceMotion; this.updateSetting('reduceMotion', on, on ? 'Animações reduzidas' : 'Animações completas'); }

    canChangeDifficulty() {
      return !hasPlatformDifficulty() && this.state.phase === 'placement' && this.state.placementOwner === 'player1' && !this.state.ships.player1.some(s => s.row !== null);
    }

    cycleDifficulty() {
      if (hasPlatformDifficulty()) { this.toast('A plataforma já escolheu a dificuldade', 'warn'); return; }
      if (!this.canChangeDifficulty()) { this.toast('Mude a dificuldade antes de posicionar', 'warn'); return; }
      const arr = ['facil', 'medio', 'dificil'], next = arr[(arr.indexOf(this.state.difficulty) + 1) % arr.length];
      this.resetMatch(next);
      this.state.phase = 'placement';
      this.toast(`Dificuldade: ${this.difficultyName(next)}`, 'info');
    }

    winTitle() {
      const w = this.state.winner;
      if (this.isAiMode()) return w === 'player1' ? 'Vitória, Capitão!' : 'O Barba-Rubra venceu desta vez!';
      return `${TEAM[w].label} venceu!`;
    }

    difficultyName(id = this.state.difficulty) { return { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' }[id] || id; }

    /* ---------- Primeira Missão (assets/js/mission.js) ---------- */

    // Avisa a Primeira Missão sobre o que o jogador acabou de fazer.
    tutorialEvent(name, data) { if (this.mission) { try { this.mission.onEvent(name, data); } catch (err) { console.error(err); } } }
    restartTutorial() { if (this.mission) this.mission.restart(); }

    // Pergunta de treino do radar: ensina o V/F sem mexer na pontuação nem revelar nada.
    openPracticeQuestion() {
      if (this.state.modal || !this.questionsLoaded) return false;
      const q = this.pickQuestion();
      if (!q) return false;
      this.state.modal = { type: 'question', question: q, practice: true, owner: this.viewer(), buttons: [], openedAt: now() };
      this.audio.play('radar');
      this.announce(`Sinal de treino do radar. Verdadeiro ou falso? ${q.pergunta} Pressione V para verdadeiro ou F para falso.`);
      return true;
    }

    /* ---------- efeitos ---------- */

    spawnExplosion(row, col) { this.state.effects.push({ type: 'explosion', row, col, start: now() }); }
    spawnFloat(row, col, text, color) { this.state.effects.push({ type: 'float', row, col, text, color, start: now() }); }
    spawnRadar(row, col) { this.state.effects.push({ type: 'radar', row, col, start: now() }); }

    // Faixa grande de troca de turno (some sozinha).
    banner(text, owner) { this.turnBanner = { text, owner, start: now() }; }

    // Microconquistas: pequenas comemorações durante a partida (uma vez por partida cada).
    achieve(id, title, detail = '') {
      const got = this.state.achievements || (this.state.achievements = new Set());
      if (got.has(id)) return;
      got.add(id);
      setTimeout(() => {
        this.audio.play('achievement');
        this.award = { title, detail, start: now() };
        this.announce(`Conquista: ${title} ${detail}`);
      }, 900);
    }
    spawnWord(row, col, text, color) { this.state.effects.push({ type: 'word', row, col, text, color, start: now() }); }
    shakeScreen(amp) { if (!this.still) this.shake = { amp, start: now() }; }
    flash(color) { if (!this.still) this.flashFx = { color, start: now() }; }
    spawnSplash(row, col) { this.state.effects.push({ type: 'splash', row, col, start: now() }); }
    spawnShot(ship, row, col) {
      // O tiro do computador cai do céu para não revelar onde o navio dele está.
      const from = this.isAiOwner(ship.owner) ? { row: -2, col } : (ship.cells[Math.floor(ship.cells.length / 2)] || { row: ship.row, col: ship.col });
      this.state.effects.push({ type: 'shot', from, row, col, start: now() });
    }

    toast(text, tone = 'info', ms = 1800) {
      if (tone === 'warn') this.buzz(25);
      else if (tone === 'danger') this.buzz([60, 40, 60]);
      this.state.toast = { text, tone, start: now(), until: now() + ms };
      this.announce(text, tone === 'danger' || tone === 'success' || this.isAiTurn());
    }

    /* ---------- laço de desenho ---------- */

    loop(t) {
      requestAnimationFrame(tt => this.loop(tt));
      if (t - this.lastFrame < 1000 / 45) return;
      this.lastFrame = t;
      this.draw(t);
    }

    get hc() { return !!this.state.settings.highContrast; }
    get still() { return !!this.state.settings.reduceMotion; }
    fs(size) { return size * (this.state.settings.fontScale || 1); }

    draw(t) {
      this.stepCamera();
      const g = this.geom;
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = 1;
      this.buttons = [];
      this.drawBackground(t);
      if (!this.assetsReady || this.state.phase === 'loading') {
        this.drawLoading(t);
        return;
      }
      this.stepSpot();
      const v = this.view;
      ctx.save();
      if (v.a > 0.001) {
        ctx.translate(v.S.x + v.off.x, v.S.y + v.off.y);
        ctx.scale(v.k, v.k);
        ctx.translate(-v.S.x, -v.S.y);
      }
      if (this.shake) {
        const age = t - this.shake.start;
        if (age > 320) this.shake = null;
        else { const k = this.shake.amp * (1 - age / 320); ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }
      }
      this.drawBoard(t);
      this.drawWorld(t);
      ctx.restore();
      this.drawSpotlight(t);
      this.drawHud(t);
      this.drawInfoStrip(t);
      this.drawSpotMenu(t);
      this.drawToast(t);
      this.drawTurnBanner(t);
      this.drawAward(t);
      if (this.state.modal) this.drawModal(t);
      if (this.flashFx) {
        const age = t - this.flashFx.start;
        if (age > 450) this.flashFx = null;
        else { ctx.save(); ctx.globalAlpha = 0.22 * (1 - age / 450); ctx.fillStyle = this.flashFx.color; ctx.fillRect(0, 0, this.geom.w, this.geom.h); ctx.restore(); }
      }
      if (t - this.lastA11ySync > 1000) { this.syncA11y(); this.lastA11ySync = t; }
    }

    drawLoading(t) {
      const g = this.geom;
      this.text('Preparando os navios...', g.playW / 2, g.playH / 2, { size: 26, color: '#fff', align: 'center', weight: 600, shadow: true });
      for (let i = 0; i < 3; i++) {
        const a = (Math.sin(t / 200 - i) + 1) / 2;
        ctx.fillStyle = `rgba(255,255,255,${0.4 + a * 0.6})`;
        ctx.beginPath(); ctx.arc(g.playW / 2 - 24 + i * 24, g.playH / 2 + 30, 6, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ---------- primitivas ---------- */

    rr(x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    card(x, y, w, h, { r = 20, fill = '#fff', stroke = null, lineWidth = 3, shadow = true } = {}) {
      ctx.save();
      if (shadow) { ctx.shadowColor = 'rgba(12,32,56,.16)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; }
      this.rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
      ctx.restore();
      if (stroke || this.hc) {
        ctx.save(); this.rr(x, y, w, h, r);
        ctx.lineWidth = this.hc ? Math.max(3, lineWidth) : lineWidth;
        ctx.strokeStyle = this.hc ? '#000' : stroke; ctx.stroke(); ctx.restore();
      }
    }

    font(size, weight = 600) { return `${weight} ${Math.max(9, size)}px ${FONT}`; }

    // maxWidth: se o texto não couber, a fonte diminui até 70% e só então ganha reticências.
    text(str, x, y, { size = 14, color = C.ink, align = 'left', weight = 600, baseline = 'alphabetic', shadow = false, outline = null, maxWidth } = {}) {
      let s = String(str);
      if (maxWidth > 0) ({ text: s, size } = this.shrink(s, maxWidth, size, weight));
      ctx.save();
      ctx.font = this.font(size, weight);
      ctx.textAlign = align; ctx.textBaseline = baseline;
      if (outline) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = outline; ctx.strokeText(s, x, y); }
      if (shadow && !this.hc) { ctx.fillStyle = 'rgba(10,40,70,.35)'; ctx.fillText(s, x, y + 2); }
      ctx.fillStyle = color;
      ctx.fillText(s, x, y);
      ctx.restore();
      return size;
    }

    shrink(str, maxWidth, size, weight = 600, min = 0.7) {
      let fsz = size;
      while (fsz > size * min && this.measure(str, fsz, weight) > maxWidth) fsz *= 0.94;
      fsz = Math.max(fsz, size * min);
      return { text: this.fit(str, maxWidth, fsz, weight), size: fsz };
    }

    measure(str, size, weight = 600) { ctx.save(); ctx.font = this.font(size, weight); const w = ctx.measureText(String(str)).width; ctx.restore(); return w; }

    // Corta o texto com reticências para caber na largura.
    fit(str, maxWidth, size, weight = 600) {
      let s = String(str);
      if (this.measure(s, size, weight) <= maxWidth) return s;
      while (s.length > 1 && this.measure(s + '…', size, weight) > maxWidth) s = s.slice(0, -1);
      return s.trimEnd() + '…';
    }

    wrap(str, maxWidth, size, weight = 500) {
      ctx.save(); ctx.font = this.font(size, weight);
      const words = String(str).split(/\s+/), lines = [];
      let line = '';
      for (let word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width <= maxWidth) { line = test; continue; }
        if (line) lines.push(line);
        while (ctx.measureText(word).width > maxWidth && word.length > 1) {
          let cut = word.length - 1;
          while (cut > 1 && ctx.measureText(word.slice(0, cut) + '-').width > maxWidth) cut--;
          lines.push(word.slice(0, cut) + '-');
          word = word.slice(cut);
        }
        line = word;
      }
      if (line) lines.push(line);
      ctx.restore();
      return lines;
    }

    paragraph(str, x, y, maxWidth, { size = 15, color = C.ink, align = 'left', weight = 500, lineHeight = 1.4 } = {}) {
      const lines = this.wrap(str, maxWidth, size, weight);
      const xx = align === 'center' ? x + maxWidth / 2 : x;
      lines.forEach((l, i) => this.text(l, xx, y + i * size * lineHeight, { size, color, align, weight }));
      return y + lines.length * size * lineHeight;
    }

    // Botão "gordinho" com sombra de profundidade, no estilo do UI Pack.
    pill(x, y, w, h, label, { color = C.p1, deep = C.p1Deep, textColor = '#fff', onClick, disabled = false, icon = null, hint = null, list = this.buttons, size = 16 } = {}) {
      const hp = list === this.buttons ? { x: this.hover.x, y: this.hover.y } : this.modalPoint(this.hover.x, this.hover.y);
      const hover = !disabled && hit({ x, y, w, h }, hp.x, hp.y);
      const press = hover && this.pointerDown ? 2 : 0;
      const depth = 3, rad = Math.min(14, h / 2);
      ctx.save();
      ctx.globalAlpha = disabled ? 0.45 : 1;
      this.rr(x, y + depth, w, h - depth, rad); ctx.fillStyle = this.hc ? '#000' : deep; ctx.fill();
      this.rr(x, y + press, w, h - depth, rad); ctx.fillStyle = hover && !this.hc ? this.lighten(color) : color; ctx.fill();
      if (this.hc) { ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke(); }
      const cy = y + press + (h - depth) / 2;
      // Sem espaço: tira o atalho "(Enter)", depois diminui a fonte, por fim usa reticências.
      let fsz = Math.min(this.fs(size), (h - depth) * 0.55), text = label;
      const room = () => w - 24 - (icon ? fsz + 8 : 0);
      if (this.measure(text, fsz) > room()) text = text.replace(/\s*\([^)]*\)\s*$/, '');
      const fitted = this.shrink(text, room(), fsz, 600, 0.65);
      text = fitted.text; fsz = fitted.size;
      const labelW = this.measure(text, fsz) + (icon ? fsz + 8 : 0);
      let tx = x + w / 2 - labelW / 2;
      if (icon && this.img[icon]) { ctx.drawImage(this.img[icon], tx, cy - fsz / 2, fsz, fsz); tx += fsz + 8; }
      this.text(text, tx, cy, { size: fsz, color: textColor, baseline: 'middle', weight: 600 });
      if (hint) this.text(hint, x + w / 2, y + h + this.fs(13), { size: this.fs(12), color: C.inkSoft, align: 'center', weight: 500 });
      ctx.restore();
      list.push({ x, y, w, h, onClick, disabled });
    }

    choiceLayout(w, count, bh, gap) {
      const each = (w - 48 - gap * (count - 1)) / count;
      const stacked = count > 1 && (each < 150 || each < this.fs(16) * 8);
      return { stacked, height: stacked ? count * bh + (count - 1) * gap : bh, bw: stacked ? Math.min(320, w - 48) : Math.min(250, each) };
    }

    choiceRow(b, top, defs, bh, gap, list) {
      const L = this.choiceLayout(b.w, defs.length, bh, gap), cx = b.x + b.w / 2;
      defs.forEach((d, i) => {
        const x = L.stacked ? cx - L.bw / 2 : cx - (defs.length * L.bw + (defs.length - 1) * gap) / 2 + i * (L.bw + gap);
        const y = L.stacked ? top + i * (bh + gap) : top;
        this.pill(x, y, L.bw, bh, d.label, { ...d, list });
      });
    }

    lighten(hex, amount = 24) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.min(255, (n >> 16) + amount), g = Math.min(255, ((n >> 8) & 255) + amount), b = Math.min(255, (n & 255) + amount);
      return `rgb(${r},${g},${b})`;
    }

    /* ---------- cenário ---------- */

    drawBackground(t) {
      const g = this.geom;
      if (!this.bgCache || this.bgCache.w !== g.w || this.bgCache.h !== g.h || this.bgCache.playW !== g.playW || this.bgCache.hc !== this.hc || this.bgCache.ready !== this.assetsReady) {
        const c = makeCanvas(g.w * g.dpr, g.h * g.dpr), x = c.getContext('2d');
        x.scale(g.dpr, g.dpr);
        if (this.hc) {
          x.fillStyle = '#062038'; x.fillRect(0, 0, g.w, g.h);
        } else {
          const grad = x.createLinearGradient(0, 0, 0, g.h);
          grad.addColorStop(0, C.sea1); grad.addColorStop(0.55, C.sea2); grad.addColorStop(1, C.sea3);
          x.fillStyle = grad; x.fillRect(0, 0, g.w, g.h);
          if (this.img.water) {
            x.globalAlpha = 0.28;
            const pat = x.createPattern(this.img.water, 'repeat');
            x.fillStyle = pat; x.fillRect(0, 0, g.w, g.h);
            x.globalAlpha = 1;
          }
          // Ondinhas desenhadas
          x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 3; x.lineCap = 'round';
          for (let yy = 40; yy < g.h; yy += 90) {
            for (let xx = (yy / 90 % 2) * 70; xx < g.w; xx += 140) {
              x.beginPath(); x.arc(xx, yy, 14, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
              x.beginPath(); x.arc(xx + 26, yy, 14, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
            }
          }
          // Algas e pedras no fundo
          const deco = [['seaweed_green', 0.02, 1], ['rock', 0.07, 0.8], ['seaweed_pink', 0.12, 0.9], ['seaweed_orange', 0.86, 0.8], ['seaweed_green', 0.92, 1.1], ['rock', 0.96, 0.7]];
          for (const [key, fx, s] of deco) {
            const img = this.img[key];
            if (!img) continue;
            const size = 90 * s;
            x.globalAlpha = 0.85;
            x.drawImage(img, fx * g.playW - size / 2, g.h - size + 8, size, size);
          }
          x.globalAlpha = 1;
        }
        this.bgCache = { canvas: c, w: g.w, h: g.h, playW: g.playW, hc: this.hc, ready: this.assetsReady };
      }
      ctx.drawImage(this.bgCache.canvas, 0, 0, g.w, g.h);
      if (this.hc || !this.assetsReady) return;
      const time = this.still ? 0 : t / 1000;
      ctx.save();
      for (const f of this.decor.fish) {
        const img = this.img[f.key];
        if (!img) continue;
        const span = g.playW + 200;
        let px = ((f.phase + time * f.speed) % span) - 100;
        if (f.dir < 0) px = g.playW - px;
        const py = f.y * g.h + Math.sin(time * 1.5 + f.phase) * 8;
        ctx.globalAlpha = 0.5;
        ctx.save(); ctx.translate(px, py); if (f.dir < 0) ctx.scale(-1, 1);
        ctx.drawImage(img, -f.size / 2, -f.size / 2, f.size, f.size); ctx.restore();
      }
      for (const b of this.decor.bubbles) {
        const img = this.img[b.key];
        if (!img) continue;
        const py = g.h - ((b.phase + time * b.speed) % (g.h + 40));
        const px = b.x * g.playW + Math.sin(time * 2 + b.phase) * 6;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, px - b.size / 2, py - b.size / 2, b.size, b.size);
      }
      ctx.restore();
    }

    drawBoard(t) {
      const g = this.geom;
      const key = `${g.dpr}:${g.cell}:${g.gap}:${this.hc}:${this.state.settings.fontScale}`;
      if (!this.boardCache || this.boardCache.key !== key) {
        const pad = 60, gx = g.gx, gy = g.gy;
        const c = makeCanvas((g.gw + pad * 2) * g.dpr, (g.gh + pad * 2) * g.dpr), x = c.getContext('2d');
        x.scale(g.dpr, g.dpr);
        x.translate(pad, pad);
        g.gx = 0; g.gy = 0;
        try { this.renderBoard(x); } finally { g.gx = gx; g.gy = gy; }
        this.boardCache = { key, canvas: c, pad };
      }
      const bc = this.boardCache;
      ctx.drawImage(bc.canvas, g.gx - bc.pad, g.gy - bc.pad, g.gw + bc.pad * 2, g.gh + bc.pad * 2);
      this.drawZoneOverlays(t);
    }

    // Desenha os três oceanos (fica em cache até mudar o tamanho ou o contraste).
    renderBoard(x) {
      const g = this.geom, cell = g.cell, r = Math.max(8, cell * 0.45);
      for (let z = 0; z < 3; z++) {
        const zone = ZONES[z], zx = this.zoneX(z), w = cell * 10, h = g.gh;
        x.save();
        x.shadowColor = 'rgba(8,40,80,.28)'; x.shadowBlur = 16; x.shadowOffsetY = 6;
        roundRectPath(x, zx - 4, g.gy - 4, w + 8, h + 8, r + 4);
        x.fillStyle = this.hc ? '#000' : '#fff'; x.fill();
        x.restore();
        x.save();
        roundRectPath(x, zx, g.gy, w, h, r); x.clip();
        x.fillStyle = this.hc ? '#ffffff' : zone.fill; x.fillRect(zx, g.gy, w, h);
        if (!this.hc && this.img.water) {
          x.globalAlpha = 0.35;
          for (let yy = 0; yy < h; yy += cell * 2) for (let xx = 0; xx < w; xx += cell * 2) x.drawImage(this.img.water, zx + xx, g.gy + yy, cell * 2, cell * 2);
          x.globalAlpha = 1;
        }
        // Xadrez suave para facilitar contar casas
        x.fillStyle = this.hc ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.22)';
        for (let rr = 0; rr < 10; rr++) for (let cc = 0; cc < 10; cc++) if ((rr + cc) % 2 === 0) x.fillRect(zx + cc * cell, g.gy + rr * cell, cell, cell);
        x.strokeStyle = this.hc ? 'rgba(0,0,0,.75)' : 'rgba(255,255,255,.75)';
        x.lineWidth = this.hc ? 1.5 : 1;
        x.beginPath();
        for (let i = 1; i < 10; i++) {
          x.moveTo(zx + i * cell + 0.5, g.gy); x.lineTo(zx + i * cell + 0.5, g.gy + h);
          x.moveTo(zx, g.gy + i * cell + 0.5); x.lineTo(zx + w, g.gy + i * cell + 0.5);
        }
        x.stroke();
        x.restore();
        roundRectPath(x, zx, g.gy, w, h, r);
        x.lineWidth = this.hc ? 4 : 3; x.strokeStyle = this.hc ? '#000' : zone.deep; x.globalAlpha = this.hc ? 1 : 0.35; x.stroke(); x.globalAlpha = 1;
        // Letras das colunas
        const fsz = Math.max(10, Math.min(16, cell * 0.38)) * (this.state.settings.fontScale || 1);
        x.font = this.font(fsz, 600); x.textAlign = 'center'; x.textBaseline = 'bottom';
        for (let cc = 0; cc < 10; cc++) {
          x.fillStyle = '#fff';
          if (!this.hc) { x.lineWidth = 3; x.strokeStyle = 'rgba(16,60,100,.45)'; x.strokeText(String.fromCharCode(65 + cc), zx + cc * cell + cell / 2, g.gy - 7); }
          x.fillText(String.fromCharCode(65 + cc), zx + cc * cell + cell / 2, g.gy - 7);
        }
      }
      // Números das linhas nas laterais
      const fsz = Math.max(10, Math.min(16, cell * 0.38)) * (this.state.settings.fontScale || 1);
      x.font = this.font(fsz, 600); x.textBaseline = 'middle';
      for (let rr = 0; rr < 10; rr++) {
        const yy = g.gy + rr * cell + cell / 2;
        for (const [xx, align] of [[g.gx - 10, 'right'], [g.gx + g.gw + 10, 'left']]) {
          x.textAlign = align;
          if (!this.hc) { x.lineWidth = 3; x.strokeStyle = 'rgba(16,60,100,.45)'; x.strokeText(String(rr + 1), xx, yy); }
          x.fillStyle = '#fff'; x.fillText(String(rr + 1), xx, yy);
        }
      }
      // Cordas com boias entre os oceanos
      for (const z of [1, 2]) {
        const bx = this.zoneX(z) - g.gap / 2;
        x.strokeStyle = this.hc ? '#fff' : 'rgba(255,255,255,.8)'; x.lineWidth = 2; x.setLineDash([4, 5]);
        x.beginPath(); x.moveTo(bx, g.gy + 6); x.lineTo(bx, g.gy + g.gh - 6); x.stroke(); x.setLineDash([]);
        const br = Math.max(4, Math.min(9, g.gap * 0.42));
        for (let rr = 0; rr < 10; rr += 2) drawBuoy(x, bx, g.gy + rr * cell + cell, br);
      }
    }

    drawZoneOverlays(t) {
      const g = this.geom, cell = g.cell, r = Math.max(8, cell * 0.45);
      // Na hora de posicionar, destaca só o oceano de quem está jogando.
      if (this.state.phase === 'placement') {
        const home = this.state.placementOwner === 'player1' ? 0 : 2;
        for (let z = 0; z < 3; z++) {
          if (z === home) continue;
          ctx.save(); this.rr(this.zoneX(z), g.gy, cell * 10, g.gh, r);
          ctx.fillStyle = this.hc ? 'rgba(0,0,0,.55)' : 'rgba(240,250,255,.6)'; ctx.fill(); ctx.restore();
        }
      }
      // Zona do mar com o nome (no modo deslizante os botões de oceano fazem esse papel)
      for (let z = 0; z < 3 && !g.pan; z++) {
        const zone = ZONES[z], cx = this.zoneX(z) + cell * 5;
        const label = g.compact ? [TEAM.player1.chip, 'Neutro', TEAM.player2.chip][z] : zone.label;
        const fsz = this.fs(g.compact ? 12 : 14), w = Math.min(cell * 10 - 8, this.measure(label, fsz) + 26), h = fsz + 12;
        const y = g.gy - g.labelH - 8 - h / 2 - (g.compact ? 0 : 4);
        if (y < 10 + g.hudH) continue;
        ctx.save();
        this.rr(cx - w / 2, y, w, h, h / 2);
        ctx.fillStyle = this.hc ? '#000' : zone.deep; ctx.fill(); ctx.restore();
        this.text(label, cx, y + h / 2 + 1, { size: fsz, color: '#fff', align: 'center', baseline: 'middle', maxWidth: w - 16 });
      }
      if (g.pan && this.view.a < 0.01) this.drawStickyRows();
      const s = this.selectedShip();
      if (this.state.phase !== 'battle' || !s) return;
      const pulse = this.still ? 0.5 : (Math.sin(t / 260) + 1) / 2;
      if (this.state.action === 'move' && !s.turnLocked) {
        const rows = s.cells.map(c => c.row), cols = s.cells.map(c => c.col);
        const minR = Math.min(...rows), maxR = Math.max(...rows), minC = Math.min(...cols), maxC = Math.max(...cols);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (!GDM_LOGIC.canMove(this.state, s, dr, dc)) continue;
          const cells = dr ? [{ row: dr < 0 ? minR - 1 : maxR + 1, cols: [minC, maxC] }] : [{ col: dc < 0 ? minC - 1 : maxC + 1, rows: [minR, maxR] }];
          for (const c of cells) {
            if (c.cols) for (let cc = c.cols[0]; cc <= c.cols[1]; cc++) this.cellTint(c.row, cc, C.grass, 0.35 + pulse * 0.2);
            else for (let rr = c.rows[0]; rr <= c.rows[1]; rr++) this.cellTint(rr, c.col, C.grass, 0.35 + pulse * 0.2);
          }
        }
      }
      if (this.state.action === 'trap') {
        for (let row = 0; row < 10; row++) for (let col = 0; col < 30; col++) if (this.trapCellAllowed(row, col, s)) this.cellTint(row, col, C.purple, 0.16 + pulse * 0.1);
      }
    }

    // No celular só um oceano aparece por vez: mostra os números 1–10 colados na borda da tela.
    drawStickyRows() {
      const g = this.geom;
      if (g.gx - 30 >= 0) return;
      const fsz = Math.max(10, Math.min(14, g.cell * 0.38)) * (this.state.settings.fontScale || 1), w = fsz * 1.6 + 6;
      ctx.save();
      this.rr(2, g.gy - 2, w, g.gh + 4, w / 2);
      ctx.fillStyle = this.hc ? '#000' : 'rgba(22,50,79,.55)'; ctx.fill();
      ctx.restore();
      for (let r = 0; r < 10; r++) this.text(String(r + 1), 2 + w / 2, g.gy + r * g.cell + g.cell / 2 + 1, { size: fsz, color: '#fff', align: 'center', baseline: 'middle' });
    }

    cellTint(row, col, color, alpha) {
      const g = this.geom, x = this.colX(col), y = this.rowY(row);
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      this.rr(x + 2, y + 2, g.cell - 4, g.cell - 4, g.cell * 0.22); ctx.fill(); ctx.restore();
    }

    /* ---------- navios ---------- */

    // Monta o navio com casco + velas do Pirate Pack, sem esticar os sprites.
    buildShip(team, size, lenCells, damaged) {
      const key = `${team}:${size}:${lenCells.toFixed(2)}:${damaged}`;
      if (this.shipCache.has(key)) return this.shipCache.get(key);
      const hull = this.img.hull, sail = this.img[`sail_${team}${damaged ? '_torn' : ''}`], flag = this.img[`flag_${team}`];
      const L = Math.max(100, Math.round(lenCells * NATIVE_CELL - 10)), W = 76;
      const c = makeCanvas(W, L), x = c.getContext('2d');
      const hx = (W - hull.width) / 2, STERN = 30, MID = 36, BOW = 42;
      x.drawImage(hull, 0, 0, hull.width, STERN, hx, 0, hull.width, STERN);
      let y = STERN;
      const midEnd = L - BOW;
      while (y < midEnd) {
        const h = Math.min(MID, midEnd - y);
        x.drawImage(hull, 0, STERN, hull.width, h, hx, y, hull.width, h);
        y += h;
      }
      x.drawImage(hull, 0, hull.height - BOW, hull.width, BOW, hx, midEnd, hull.width, BOW);
      const sails = { 2: 1, 3: 2, 4: 3, 5: 3 }[size] || 1;
      const top = STERN + 4, bottom = L - BOW + 6, seg = (bottom - top) / sails;
      const scale = clamp(seg / 44, 0.72, 1);
      const crewKeys = ['crew1', 'crew2', 'crew3', 'crew4'];
      if (size >= 3) {
        for (let i = 1; i < sails; i++) {
          const crew = this.img[crewKeys[(i + size) % 4]];
          if (crew) x.drawImage(crew, W / 2 - crew.width / 2, top + seg * i - crew.height / 2 + 4);
        }
      }
      if (size === 4 && this.img.cannon) {
        const cn = this.img.cannon;
        for (const side of [-1, 1]) {
          x.save(); x.translate(W / 2 + side * 21, L * 0.55); x.rotate(side < 0 ? Math.PI : 0);
          x.drawImage(cn, -4, -cn.height / 2, cn.width * 0.7, cn.height * 0.7); x.restore();
        }
      }
      for (let i = 0; i < sails; i++) {
        const cy = top + seg * (i + 0.5), sw = sail.width * scale, sh = sail.height * scale;
        x.drawImage(sail, W / 2 - sw / 2, cy - sh / 2, sw, sh);
        if (this.img.nest) { const n = this.img.nest; x.drawImage(n, W / 2 - n.width * 0.35, cy - sh / 2 - n.height * 0.15, n.width * 0.7, n.height * 0.7); }
      }
      if (flag) x.drawImage(flag, W / 2 - flag.width / 2, 2, flag.width, flag.height);
      if (size === 5 && this.img.cannonball) {
        const b = this.img.cannonball;
        for (let i = 0; i < 3; i++) x.drawImage(b, W / 2 - 13 + i * 9, L - BOW + 4, b.width * 0.8, b.height * 0.8);
      }
      this.shipCache.set(key, c);
      return c;
    }

    shipRect(ship) {
      const g = this.geom, rows = ship.cells.map(c => c.row), cols = ship.cells.map(c => c.col);
      const minR = Math.min(...rows), maxR = Math.max(...rows), minC = Math.min(...cols), maxC = Math.max(...cols);
      const x = this.colX(minC), y = this.rowY(minR);
      return { x, y, w: this.colX(maxC) + g.cell - x, h: this.rowY(maxR) + g.cell - y };
    }

    drawShip(ship, { alpha = 1, selected = false, t = 0, ghost = false, valid = true } = {}) {
      if (ship.row === null || ship.col === null || !ship.cells.length || !this.img.hull) return;
      const g = this.geom, team = TEAM[ship.owner], rect = this.shipRect(ship);
      const horizontal = ship.orientation === 'horizontal';
      const lenPx = horizontal ? rect.w : rect.h;
      const damaged = !ghost && ship.hp / ship.maxHp < 0.5;
      const sprite = this.buildShip(team.key, ship.size, lenPx / g.cell, damaged);
      const scale = g.cell / NATIVE_CELL;
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      const bob = this.still || ghost ? 0 : Math.sin(t / 600 + ship.size) * 1.2;
      if (ghost) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        this.rr(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, g.cell * 0.3);
        ctx.fillStyle = valid ? 'rgba(52,192,106,.35)' : 'rgba(239,90,76,.4)'; ctx.fill();
        ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.strokeStyle = valid ? C.grassDeep : C.p2Deep; ctx.stroke();
        ctx.restore();
      }
      if (selected) {
        const pulse = this.still ? 0.6 : (Math.sin(t / 220) + 1) / 2;
        ctx.save();
        this.rr(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, g.cell * 0.32);
        ctx.fillStyle = `rgba(255,201,60,${0.25 + pulse * 0.15})`; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = this.hc ? '#000' : C.sunDeep; ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy + bob);
      if (horizontal) ctx.rotate(team.bow);
      ctx.fillStyle = 'rgba(10,50,90,.18)';
      ctx.beginPath(); ctx.ellipse(3, 4, sprite.width * scale * 0.36, sprite.height * scale * 0.48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(sprite, -sprite.width * scale / 2, -sprite.height * scale / 2, sprite.width * scale, sprite.height * scale);
      ctx.restore();
      if (damaged && this.img.fire1) {
        const frame = this.still ? 0 : Math.floor(t / 180) % 2;
        const fire = this.img[frame ? 'fire2' : 'fire1'], fc = ship.cells[Math.floor(ship.cells.length / 2)];
        const fh = g.cell * 0.6, fw = fh * fire.width / fire.height;
        ctx.drawImage(fire, this.colX(fc.col) + g.cell / 2 - fw / 2, this.rowY(fc.row) + g.cell * 0.15, fw, fh);
      }
      if (!ghost && !this.state.modal && g.cell >= 22 && ship.owner === this.viewer() && this.state.phase === 'battle') this.drawHpBar(ship, rect);
    }

    drawHpBar(ship, rect) {
      const g = this.geom, pct = clamp(ship.hp / ship.maxHp, 0, 1);
      const w = Math.min(rect.w - 8, g.cell * 1.6), h = Math.max(5, g.cell * 0.14), x = rect.x + rect.w / 2 - w / 2, y = rect.y + rect.h - h - 3;
      ctx.save();
      this.rr(x - 1, y - 1, w + 2, h + 2, h); ctx.fillStyle = this.hc ? '#000' : 'rgba(255,255,255,.9)'; ctx.fill();
      this.rr(x, y, Math.max(h, w * pct), h, h / 2);
      ctx.fillStyle = pct > 0.5 ? C.grass : pct > 0.25 ? C.sun : C.p2; ctx.fill();
      ctx.restore();
    }

    /* ---------- mundo ---------- */

    drawWorld(t) {
      if (this.state.phase === 'placement') this.drawPlacementWorld(t);
      else if (['battle', 'end'].includes(this.state.phase)) this.drawBattleWorld(t);
      this.drawHintCell(t);
      this.drawCursor(t);
      this.drawEffects(t);
    }

    // Casa sugerida pelo Capitão (contorno pulsando).
    drawHintCell(t) {
      const h = this.hintCell;
      if (!h || this.state.modal) return;
      const g = this.geom, x = this.colX(h.col), y = this.rowY(h.row), s = g.cell;
      const pulse = this.still ? 0 : (Math.sin(t / 220) + 1) * 2;
      ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeStyle = this.hc ? '#000' : C.grass;
      this.rr(x + 2 - pulse, y + 2 - pulse, s - 4 + pulse * 2, s - 4 + pulse * 2, 8); ctx.stroke();
      ctx.restore();
    }

    drawPlacementWorld(t) {
      const owner = this.state.placementOwner, s = this.selectedShip();
      for (const ship of this.state.ships[owner]) if (ship.row !== null) this.drawShip(ship, { selected: ship.uid === this.state.selectedShipId, t });
      const c = this.state.modal ? null : (this.hover.cell || this.state.cursor);
      const home = GDM_LOGIC.home(owner);
      if (s && c && c.col >= home.minCol && c.col <= home.maxCol) {
        const valid = GDM_LOGIC.canPlace(this.state, s, c.row, c.col, s.orientation);
        const cells = GDM_LOGIC.cells(c.row, c.col, s.size, s.orientation).filter(x => x.row < 10 && x.col < 30);
        if (cells.length) this.drawShip({ ...s, row: c.row, col: c.col, cells }, { alpha: 0.6, t, ghost: true, valid });
      }
    }

    drawBattleWorld(t) {
      const viewer = this.viewer(), opponent = GDM_LOGIC.other(viewer);
      // Contra o computador, os tiros dele no seu oceano também aparecem (mais clarinhos).
      if (this.isAiMode()) {
        ctx.save(); ctx.globalAlpha = 0.75;
        for (const [key, kind] of this.state.marks.player2) {
          const [r, c] = key.split(':').map(Number);
          if (c > 9) continue;
          if (kind === 'miss') this.drawSplashMark(r, c); else this.drawHitMark(r, c);
        }
        ctx.restore();
      }
      for (const [key, kind] of this.state.marks[viewer]) {
        const [r, c] = key.split(':').map(Number);
        if (kind === 'miss') this.drawSplashMark(r, c);
        else this.drawHitMark(r, c);
      }
      for (const tr of this.state.traps.filter(x => x.active)) {
        if (tr.owner === viewer) this.drawMine(tr.row, tr.col, viewer, t);
        else {
          const id = GDM_LOGIC.objectId(tr, 'trap');
          if (this.state.revealed[viewer].has(id)) this.drawMine(tr.row, tr.col, opponent, t);
          else if (this.state.detected[viewer].has(id)) this.drawContact(tr.row, tr.col, t);
        }
      }
      for (const s of this.state.ships[viewer]) if (!s.destroyed) this.drawShip(s, { selected: s.uid === this.state.selectedShipId, t });
      for (const s of this.state.ships[opponent]) {
        if (s.destroyed) continue;
        const id = GDM_LOGIC.objectId(s, 'ship');
        if (this.state.revealed[viewer].has(id)) this.drawShip(s, { alpha: 0.95, t });
        else if (this.state.detected[viewer].has(id)) for (const c of s.cells) this.drawContact(c.row, c.col, t);
      }
    }

    drawContact(row, col, t) {
      const g = this.geom, cx = this.colX(col) + g.cell / 2, cy = this.rowY(row) + g.cell / 2;
      const highlight = this.state.action === 'analyze';
      const pulse = this.still ? 0 : Math.sin(t / 300 + row + col) * 0.06;
      const r = g.cell * (0.36 + pulse + (highlight ? 0.04 : 0));
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = this.hc ? '#fff' : 'rgba(255,255,255,.92)'; ctx.fill();
      ctx.lineWidth = highlight ? 4 : 3; ctx.strokeStyle = this.hc ? '#000' : (highlight ? C.purple : C.p1); ctx.stroke();
      ctx.restore();
      this.text('?', cx, cy + 1, { size: g.cell * 0.5, color: this.hc ? '#000' : (highlight ? C.purple : C.p1Deep), align: 'center', baseline: 'middle', weight: 700 });
    }

    drawMine(row, col, owner, t) {
      const g = this.geom, cx = this.colX(col) + g.cell / 2, cy = this.rowY(row) + g.cell / 2, r = g.cell * 0.26;
      const bob = this.still ? 0 : Math.sin(t / 400 + col) * 1.2;
      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.strokeStyle = '#2b3a4f'; ctx.lineWidth = Math.max(2, g.cell * 0.07); ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = owner === 'player1' ? '#2c4a7a' : '#7a2c2c'; ctx.fill();
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fillStyle = TEAM[owner].color; ctx.fill();
      ctx.restore();
    }

    drawHitMark(row, col) {
      const g = this.geom, cx = this.colX(col) + g.cell / 2, cy = this.rowY(row) + g.cell / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, g.cell * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = this.hc ? '#000' : 'rgba(255,138,61,.85)'; ctx.fill();
      ctx.restore();
      const img = this.img.explosion3;
      if (img) { const s = g.cell * 0.55; ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s); }
    }

    drawSplashMark(row, col) {
      const g = this.geom, cx = this.colX(col) + g.cell / 2, cy = this.rowY(row) + g.cell / 2;
      ctx.save();
      ctx.strokeStyle = this.hc ? '#000' : 'rgba(255,255,255,.95)'; ctx.lineWidth = Math.max(2, g.cell * 0.07);
      ctx.beginPath(); ctx.arc(cx, cy, g.cell * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, g.cell * 0.12, 0, Math.PI * 2); ctx.fillStyle = this.hc ? '#000' : 'rgba(255,255,255,.95)'; ctx.fill();
      ctx.restore();
    }

    drawCursor(t) {
      if (this.state.modal || !['placement', 'battle'].includes(this.state.phase)) return;
      const c = this.hover.cell || this.state.cursor;
      if (!c) return;
      const g = this.geom, x = this.colX(c.col), y = this.rowY(c.row), s = g.cell;
      const attack = this.state.phase === 'battle' && this.state.action === 'attack';
      const color = attack ? C.p2 : (this.state.action === 'analyze' ? C.purple : (this.hc ? '#000' : '#fff'));
      const grow = this.still ? 0 : (Math.sin(t / 200) + 1) * 1.2;
      ctx.save();
      ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.lineCap = 'round';
      if (!this.hc) { ctx.shadowColor = 'rgba(10,40,80,.4)'; ctx.shadowBlur = 6; }
      const k = s * 0.3, p = 1 - grow;
      const corners = [[x + p, y + p, 1, 1], [x + s - p, y + p, -1, 1], [x + p, y + s - p, 1, -1], [x + s - p, y + s - p, -1, -1]];
      for (const [cx, cy, dx, dy] of corners) {
        ctx.beginPath(); ctx.moveTo(cx, cy + dy * k); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * k, cy); ctx.stroke();
      }
      // Coordenada grande ao lado do cursor (reforça letra + número).
      if (this.state.phase === 'placement' || this.state.action) {
        const label = `${attack ? 'ALVO: ' : ''}${GDM_LOGIC.coord(c.row, c.col)}`, fsz = Math.max(13, this.fs(Math.min(18, s * 0.5)));
        const lw = this.measure(label, fsz, 700) + 16, lh = fsz + 10;
        let lx = x + s / 2 - lw / 2, ly = y - lh - 6;
        if (ly < 4) ly = y + s + 6;
        ctx.restore(); ctx.save();
        ctx.globalAlpha = 0.95; this.rr(lx, ly, lw, lh, 8); ctx.fillStyle = this.hc ? '#fff' : C.ink; ctx.fill();
        if (this.hc) { ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); }
        this.text(label, lx + lw / 2, ly + lh / 2 + 1, { size: fsz, color: this.hc ? '#000' : '#fff', align: 'center', baseline: 'middle', weight: 700 });
        ctx.restore(); ctx.save();
        ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.lineCap = 'round';
      }
      if (attack) {
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.22, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.18); ctx.lineTo(x + s / 2, y + s * 0.82); ctx.moveTo(x + s * 0.18, y + s / 2); ctx.lineTo(x + s * 0.82, y + s / 2); ctx.stroke();
      }
      ctx.restore();
    }

    drawEffects(t) {
      const g = this.geom, keep = [];
      for (const e of this.state.effects) {
        const age = t - e.start;
        if (e.type === 'shot') {
          const dur = 260;
          if (age > dur) continue;
          keep.push(e);
          const p = ease(age / dur), fx = this.colX(e.from.col) + g.cell / 2, fy = this.rowY(e.from.row) + g.cell / 2;
          const tx = this.colX(e.col) + g.cell / 2, ty = this.rowY(e.row) + g.cell / 2;
          const x = fx + (tx - fx) * p, y = fy + (ty - fy) * p - Math.sin(p * Math.PI) * g.cell * 1.5;
          const img = this.img.cannonball, s = g.cell * 0.32;
          if (img) ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
        } else if (e.type === 'explosion') {
          const dur = 650;
          if (age > dur + 260) continue;
          keep.push(e);
          if (age < 260) continue;
          const p = (age - 260) / dur, frames = ['explosion3', 'explosion2', 'explosion1', 'explosion2'];
          const img = this.img[frames[Math.min(frames.length - 1, Math.floor(p * frames.length))]];
          const s = g.cell * (0.9 + p * 0.9);
          ctx.save(); ctx.globalAlpha = 1 - Math.max(0, p - 0.6) * 2.5;
          if (img) ctx.drawImage(img, this.colX(e.col) + g.cell / 2 - s / 2, this.rowY(e.row) + g.cell / 2 - s / 2, s, s);
          ctx.restore();
        } else if (e.type === 'float') {
          const dur = this.still ? 900 : 1100;
          if (age < 260) { keep.push(e); continue; }
          if (age > dur + 260) continue;
          keep.push(e);
          const p = (age - 260) / dur, cx = this.colX(e.col) + g.cell / 2, cy = this.rowY(e.row) - (this.still ? 4 : p * g.cell * 0.9);
          ctx.save(); ctx.globalAlpha = 1 - Math.max(0, p - 0.65) * 2.8;
          this.text(e.text, cx, cy, { size: Math.max(14, g.cell * 0.46), color: this.hc ? '#000' : e.color, align: 'center', weight: 700, outline: this.hc ? null : '#fff' });
          ctx.restore();
        } else if (e.type === 'word') {
          const dur = 1200;
          if (age < 240) { keep.push(e); continue; }
          if (age > dur + 240) continue;
          keep.push(e);
          const p = (age - 240) / dur, cx = this.colX(e.col) + g.cell / 2;
          const cy = this.rowY(e.row) - g.cell * 0.55 - (this.still ? 0 : p * g.cell * 0.6);
          const pop = this.still ? 1 : 0.7 + 0.3 * easeBack(Math.min(1, p * 4));
          ctx.save(); ctx.globalAlpha = 1 - Math.max(0, p - 0.7) * 3.3;
          ctx.translate(cx, cy); ctx.scale(pop, pop);
          this.text(e.text, 0, 0, { size: Math.max(16, g.cell * 0.55), color: this.hc ? '#000' : e.color, align: 'center', weight: 700, outline: this.hc ? null : '#fff' });
          ctx.restore();
        } else if (e.type === 'radar') {
          const dur = 1100;
          if (age > dur || this.still) continue;
          keep.push(e);
          const p = age / dur, cx = this.colX(e.col) + g.cell / 2, cy = this.rowY(e.row) + g.cell / 2;
          ctx.save(); ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = this.hc ? '#000' : C.purple; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, g.cell * (0.5 + p * GDM_CONFIG.radar.radius), 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        } else if (e.type === 'splash') {
          const dur = 700;
          if (age > dur + 260) continue;
          keep.push(e);
          if (age < 260) continue;
          const p = (age - 260) / dur, cx = this.colX(e.col) + g.cell / 2, cy = this.rowY(e.row) + g.cell / 2;
          ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, g.cell * (0.15 + p * 0.6 + i * 0.12), 0, Math.PI * 2); ctx.stroke(); }
          ctx.restore();
        }
      }
      this.state.effects = keep;
    }

    /* ---------- HUD ---------- */

    // Três botões para pular entre os oceanos quando o mapa não cabe inteiro na tela.
    drawZoneChips() {
      const g = this.geom;
      if (!g.pan || this.state.modal) return;
      const shown = this.shownZones(), owner = this.viewer();
      const names = [TEAM.player1.chip, 'Neutro', TEAM.player2.chip];
      const gap = 6, total = Math.min(g.playW - 24, 420), w = (total - gap * 2) / 3, h = g.chipsH;
      const x0 = (g.playW - total) / 2, y = g.chipsY;
      for (let z = 0; z < 3; z++) {
        const zone = ZONES[z], x = x0 + z * (w + gap), on = shown.has(z);
        const mine = (z === 0 && owner === 'player1') || (z === 2 && owner === 'player2');
        ctx.save();
        if (!this.hc) { ctx.shadowColor = 'rgba(12,46,82,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
        this.rr(x, y, w, h, h / 2);
        ctx.fillStyle = on ? (this.hc ? '#000' : zone.deep) : '#fff'; ctx.fill();
        ctx.restore();
        if (this.hc || !on) { ctx.save(); this.rr(x, y, w, h, h / 2); ctx.lineWidth = 2.5; ctx.strokeStyle = this.hc ? '#000' : zone.deep; ctx.stroke(); ctx.restore(); }
        const full = mine && !/você/i.test(names[z]) ? `${names[z]} (você)` : names[z];
        const label = this.measure(full, this.fs(13)) <= w - 16 ? full : names[z];
        this.text(label, x + w / 2, y + h / 2 + 1, { size: this.fs(13), color: on ? '#fff' : (this.hc ? '#000' : zone.deep), align: 'center', baseline: 'middle', maxWidth: w - 16 });
        this.buttons.push({ x, y, w, h, onClick: () => { this.focusZone(z); this.announce(`Mostrando ${zone.label}.`); } });
      }
    }

    drawHud() {
      this.drawZoneChips();
      const g = this.geom, owner = this.currentOwner(), team = TEAM[owner], scores = this.currentScores();
      const x = 12, y = 10, w = g.playW - 24, h = g.hudH;
      this.card(x, y, w, h, { r: h / 2 });
      // Selo do time
      const badge = h - 14, bx = x + 8, by = y + 7;
      ctx.save(); ctx.beginPath(); ctx.arc(bx + badge / 2, by + badge / 2, badge / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.hc ? '#000' : team.soft; ctx.fill(); ctx.restore();
      const icon = this.img[`icon_${team.key}`];
      if (icon) { const ih = badge * 0.86, iw = ih * icon.width / icon.height; ctx.drawImage(icon, bx + badge / 2 - iw / 2, by + badge / 2 - ih / 2, iw, ih); }
      const phaseText = this.state.phase === 'placement' ? 'Posicione sua frota' : this.state.phase === 'end' ? 'Fim de jogo' : this.isAiTurn() ? `Rodada ${this.state.round} · pensando…` : `Rodada ${this.state.round}`;
      const tx = bx + badge + 12;
      // Lado direito: placar, tempo e dificuldade
      let rx = x + w - 10;
      const chipH = h - 18, cy = y + 9, minTitle = this.fs(g.compact ? 90 : 150);
      const chipFont = Math.min(this.fs(g.compact ? 13 : 15), chipH * 0.55);
      const chipWidth = (label, iconKey) => this.measure(label, chipFont) + 24 + (iconKey ? chipH * 0.72 + 6 : 0);
      const chip = (label, fill, color, iconKey) => {
        const fsz = chipFont, iw = iconKey ? chipH * 0.72 + 6 : 0, cw = chipWidth(label, iconKey);
        if (rx - cw - 8 - tx < minTitle) return false;
        rx -= cw;
        ctx.save(); this.rr(rx, cy, cw, chipH, chipH / 2); ctx.fillStyle = this.hc ? '#fff' : fill; ctx.fill();
        if (this.hc) { ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); }
        ctx.restore();
        if (iconKey && this.img[iconKey]) { const s = chipH * 0.72; ctx.drawImage(this.img[iconKey], rx + 10, cy + (chipH - s) / 2, s, s); }
        this.text(label, rx + 12 + iw, cy + chipH / 2 + 1, { size: fsz, color: this.hc ? '#000' : color, baseline: 'middle' });
        rx -= 8;
        return true;
      };
      const diffColors = { facil: [C.neutralSoft, C.neutralDeep], medio: ['#ffeaa8', '#8a5a00'], dificil: [C.p2Soft, C.p2Deep] }[this.state.difficulty];
      // Prioridade: tempo, dificuldade e placar; o que não couber fica de fora (o painel também mostra).
      if (chip(this.elapsedText(), '#eef4fa', C.ink) && chip(this.difficultyName(), diffColors[0], diffColors[1])) {
        const s1 = `${TEAM.player1.short}  ${scores.player1}`, s2 = `${TEAM.player2.short}  ${scores.player2}`;
        if (rx - chipWidth(s2, 'star') - chipWidth(s1, 'star') - 16 - tx >= minTitle) {
          chip(s2, C.p2Soft, C.p2Deep, 'star');
          chip(s1, C.p1Soft, C.p1Deep, 'star');
        }
      }
      const maxW = rx - tx - 4, color = this.hc ? '#000' : team.deep;
      if (g.compact) {
        this.text(`${team.label} · ${phaseText}`, tx, y + h / 2 + 1, { size: this.fs(15), color, baseline: 'middle', maxWidth: maxW });
      } else {
        this.text(this.state.phase === 'end' ? this.winTitle() : `Vez do ${team.label}`, tx, y + h * 0.47, { size: this.fs(19), color, weight: 700, maxWidth: maxW });
        this.text(phaseText, tx, y + h * 0.47 + this.fs(19), { size: this.fs(14), color: this.hc ? '#000' : C.inkSoft, weight: 500, maxWidth: maxW });
      }
    }

    infoText() {
      const st = this.state, s = this.selectedShip();
      if (st.phase === 'placement') {
        if (this.fleetReady()) return { text: 'Frota completa! Aperte Pronto no painel.', color: C.grassDeep };
        return { text: s ? `Posicionando: ${this.shipName(s)} (${s.size} casas) · R gira · P automático` : 'Escolha um navio no painel', color: C.ink };
      }
      if (st.phase === 'battle') {
        if (this.isAiTurn()) return { text: 'O computador está jogando… observe o seu oceano!', color: C.p2Deep };
        if (this.menuOpen()) return { text: 'Escolha uma ação nos botões do navio · toque fora para fechar', color: C.ink };
        if (st.action === 'attack') return { text: 'Escolha uma casa para atirar! (Esc cancela)', color: C.p2Deep };
        if (st.action === 'move') return { text: 'Escolha uma casa verde para andar (Esc cancela)', color: C.grassDeep };
        if (st.action === 'trap') return { text: 'Escolha uma casa roxa para a armadilha (Esc cancela)', color: C.purple };
        if (st.action === 'analyze') return { text: 'Escolha um ponto de interrogação para analisar', color: C.purple };
        if (s) return { text: `${this.shipName(s)} · Vida ${Math.max(0, s.hp)}/${s.maxHp} · Cargas ${s.availableCharges}/${s.maxCharges}${s.turnLocked ? ' · já agiu' : ''}`, color: C.ink };
        return { text: 'Toque em um dos seus navios para começar', color: C.ink };
      }
      return { text: 'Partida encerrada', color: C.ink };
    }

    // Enquanto uma ação está escolhida: barra com o que fazer + botão grande de Cancelar.
    drawActionBar(t) {
      const g = this.geom, act = SHIP_ACTIONS.find(a => a.id === this.state.action);
      if (!act) return;
      const what = { attack: 'escolha uma casa para atirar', move: 'escolha uma casa verde para andar', trap: 'escolha uma casa roxa para a mina', analyze: 'escolha um “?” para analisar' }[act.id];
      // Cabe no espaço reservado embaixo do mapa; em telas baixas fica no lugar do placar de cima.
      const fsz = this.fs(g.compact ? 14 : 16), h = g.infoH ? g.infoH - 2 : g.hudH, ic = h - 14;
      const btnLabel = 'Cancelar (Esc)', btnW = Math.min(200, Math.max(110, this.measure(btnLabel, fsz) + 40));
      const label = `${act.label}: ${what}`;
      const maxW = g.playW - 24;
      const w = Math.min(maxW, ic + 28 + this.measure(label, fsz) + 16 + btnW + 12);
      const x = (g.playW - w) / 2;
      const y = g.infoH ? Math.min(g.playH - h - 10, g.gy + g.gh + 8) : 10;
      const pulse = this.still ? 0 : (Math.sin(t / 300) + 1) / 2;
      this.card(x, y, w, h, { r: h / 2, stroke: act.color, lineWidth: 3 + pulse });
      this.infoRect = { x, y, w, h };
      // ícone da ação
      const icx = x + 8 + ic / 2, icy = y + h / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(icx, icy, ic / 2, 0, Math.PI * 2); ctx.fillStyle = this.hc ? '#000' : act.color; ctx.fill();
      const icon = this.actionIcons[act.id];
      if (icon) {
        const k = (ic * 0.6) / 24;
        ctx.translate(icx, icy); ctx.scale(k, k); ctx.translate(-12, -12);
        ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.stroke(icon);
      }
      ctx.restore();
      const textX = x + 8 + ic + 10, textW = w - (ic + 18) - btnW - 20;
      this.text(label, textX, y + h / 2 + 1, { size: fsz, color: this.hc ? '#000' : act.deep, baseline: 'middle', maxWidth: textW });
      this.pill(x + w - btnW - 6, y + 5, btnW, h - 8, btnLabel, { color: '#ffffff', deep: '#c7d4e1', textColor: C.ink, icon: 'cross', onClick: () => this.cancelAction(), size: g.compact ? 14 : 15 });
    }

    drawInfoStrip(t) {
      const g = this.geom, info = this.infoText();
      this.infoRect = null;
      if (this.state.phase === 'battle' && this.state.action && !this.state.modal) { this.drawActionBar(t); return; }
      if (!g.infoH || (this.state.modal && this.state.modal.type === 'end')) return;
      const fsz = this.fs(g.compact ? 13 : 15), maxW = g.playW - 40;
      const nowText = this.mission && this.mission.nowText ? this.mission.nowText() : null;
      if (nowText) info.text = `AGORA: ${nowText.replace(/^agora,?\s+/i, '').replace(/^./, ch => ch.toUpperCase())}`;
      const fitted = this.shrink(info.text, maxW - 40, fsz, 600, 0.8), label = fitted.text;
      const w = Math.min(maxW, this.measure(label, fitted.size) + 40), h = fsz + 20;
      const x = (g.playW - w) / 2, y = Math.min(g.playH - h - 10, g.gy + g.gh + (g.compact ? 10 : 18));
      this.card(x, y, w, h, { r: h / 2 });
      this.infoRect = { x, y, w, h };
      this.text(label, g.playW / 2, y + h / 2 + 1, { size: fitted.size, color: this.hc ? '#000' : info.color, align: 'center', baseline: 'middle' });
    }

    // Faixa de troca de turno: entra deslizando, fica um instante e sai (parada se "reduzir animações").
    drawTurnBanner(t) {
      const b = this.turnBanner;
      if (!b || this.state.modal) return;
      const age = t - b.start, dur = 1500;
      if (age > dur) { this.turnBanner = null; return; }
      const g = this.geom, team = TEAM[b.owner];
      const fsz = this.fs(g.compact ? 26 : 38), h = fsz + 34, w = Math.min(g.playW - 20, this.measure(b.text, fsz, 700) + 90);
      const inP = this.still ? 1 : ease(age / 300), outP = this.still ? 0 : clamp((age - dur + 300) / 300, 0, 1);
      const x = (g.playW - w) / 2 + (1 - inP) * -g.playW * 0.6 + outP * g.playW * 0.6, y = g.playH / 2 - h / 2;
      ctx.save();
      ctx.globalAlpha = this.still ? clamp((dur - age) / 300, 0, 1) : 1;
      this.rr(x, y + 7, w, h, h / 2); ctx.fillStyle = this.hc ? '#000' : team.deep; ctx.fill();
      this.rr(x, y, w, h, h / 2); ctx.fillStyle = this.hc ? '#fff' : team.color; ctx.fill();
      if (this.hc) { ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.stroke(); }
      this.text(b.text, x + w / 2, y + h / 2 + 2, { size: fsz, color: this.hc ? '#000' : '#fff', align: 'center', baseline: 'middle', weight: 700, maxWidth: w - 30 });
      ctx.restore();
    }

    // Cartão de conquista: aparece no topo do mapa por alguns segundos.
    drawAward(t) {
      const a = this.award;
      if (!a || this.state.modal) return;
      const age = t - a.start, dur = 2800;
      // Em tela pequena não cobre os botões do navio aberto.
      if (this.geom.compact && (this.spot.open || this.state.action)) { if (age > dur) this.award = null; return; }
      if (age > dur) { this.award = null; return; }
      const g = this.geom, tsz = this.fs(g.compact ? 17 : 21), dsz = this.fs(g.compact ? 12 : 14);
      const ic = tsz * 1.9, w = Math.min(g.playW - 24, Math.max(this.measure(a.title, tsz, 700), this.measure(a.detail || '', dsz, 500)) + ic + 56);
      // Três linhas empilhadas (rótulo, título, detalhe) sem se sobrepor.
      const l1 = 12 + dsz * 0.85, l2 = l1 + tsz + 4, l3 = l2 + (a.detail ? dsz + 6 : 0), h = Math.max(ic + 22, l3 + 12);
      const appear = this.still ? 1 : ease(age / 260), fade = clamp((dur - age) / 300, 0, 1);
      // Canto inferior direito da área de jogo: não briga com placar, avisos nem nomes dos oceanos.
      const x = g.playW - w - 16, y = g.playH - h - 16 + (1 - appear) * 20;
      ctx.save(); ctx.globalAlpha = fade;
      this.card(x, y, w, h, { r: 12, stroke: this.hc ? '#000' : C.sun, lineWidth: 2 });
      const star = this.img.star;
      if (star) ctx.drawImage(star, x + 14, y + (h - ic * 0.94) / 2, ic, ic * 0.94);
      const tx = x + ic + 28, mw = w - ic - 40;
      this.text('CONQUISTA', tx, y + l1, { size: dsz * 0.85, color: this.hc ? '#000' : C.sunDeep, weight: 700 });
      this.text(a.title, tx, y + l2, { size: tsz, color: C.ink, weight: 700, maxWidth: mw });
      if (a.detail) this.text(a.detail, tx, y + l3, { size: dsz, color: C.inkSoft, weight: 500, maxWidth: mw });
      ctx.restore();
    }

    drawToast(t) {
      const toast = this.state.toast;
      if (!toast) return;
      if (toast.until <= t) { this.state.toast = null; return; }
      const g = this.geom, fsz = this.fs(g.compact ? 15 : 18);
      const tones = { success: [C.grass, C.grassDeep], warn: [C.orange, '#c25e12'], danger: [C.p2, C.p2Deep], info: [C.p1, C.p1Deep] };
      const [fill, deep] = tones[toast.tone] || tones.info;
      const appear = this.still ? 1 : ease((t - toast.start) / 220), fade = clamp((toast.until - t) / 250, 0, 1);
      const w = Math.min(g.playW - 30, this.measure(toast.text, fsz) + 44), h = fsz + 24;
      // Fica no espaço livre entre o placar e o mapa; se não houver espaço, cobre o topo do mapa.
      const top = 10 + g.hudH + 8, bottom = g.gy - g.labelH - 34;
      const x = (g.playW - w) / 2, y = !g.pan && bottom - top >= h ? (top + bottom) / 2 - h / 2 : g.gy + 8;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(g.playW / 2, y + h / 2); ctx.scale(0.85 + appear * 0.15, 0.85 + appear * 0.15); ctx.translate(-g.playW / 2, -(y + h / 2));
      this.rr(x, y + 5, w, h, h / 2); ctx.fillStyle = this.hc ? '#000' : deep; ctx.fill();
      this.rr(x, y, w, h, h / 2); ctx.fillStyle = this.hc ? '#fff' : fill; ctx.fill();
      if (this.hc) { ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke(); }
      this.text(toast.text, g.playW / 2, y + h / 2 + 1, { size: fsz, color: this.hc ? '#000' : '#fff', align: 'center', baseline: 'middle', maxWidth: w - 24 });
      ctx.restore();
    }

    /* ---------- janelas ---------- */

    drawModal(t) {
      const m = this.state.modal, g = this.geom;
      m.buttons = [];
      const appear = this.still ? 1 : ease((t - (m.openedAt || 0)) / 260);
      if (m.type === 'handoff') {
        const grad = ctx.createLinearGradient(0, 0, 0, g.h);
        grad.addColorStop(0, this.hc ? '#000' : '#5fc9f3'); grad.addColorStop(1, this.hc ? '#000' : '#1f7fc4');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, g.w, g.h);
      } else {
        ctx.fillStyle = this.hc ? 'rgba(0,0,0,.85)' : `rgba(10,36,64,${0.5 * appear})`; ctx.fillRect(0, 0, g.w, g.h);
      }
      ctx.save();
      const cx = g.playW / 2, cy = g.playH / 2;
      ctx.translate(cx, cy); ctx.scale(0.9 + 0.1 * appear, 0.9 + 0.1 * appear); ctx.translate(-cx, -cy);
      ctx.globalAlpha = appear;
      const draw = { handoff: this.drawHandoff, question: this.drawQuestion, feedback: this.drawFeedback, risk: this.drawRisk, help: this.drawHelp, end: this.drawEnd }[m.type];
      if (draw) draw.call(this, m, t);
      ctx.restore();
    }

    // height pode ser um número ou uma função largura -> altura.
    modalBox(maxW, height) {
      const g = this.geom, m = this.state.modal, availW = g.playW - 24, availH = g.playH - 16;
      const H = typeof height === 'function' ? height : () => height;
      let w = Math.min(maxW, availW), h = H(w), k = Math.min(1, availH / h);
      // Telas baixas: antes de encolher a janela inteira, usa mais largura (o texto quebra menos e a janela fica mais baixa).
      for (let i = 0; i < 6 && k < 1; i++) {
        const w2 = Math.min(maxW, availW / k);
        if (w2 <= w + 2) break;
        w = w2; h = H(w); k = Math.min(1, availH / h, availW / w);
      }
      k = Math.min(k, availW / w);
      const cx = g.playW / 2, cy = g.playH / 2;
      if (m) m.view = { cx, cy, k };
      if (k < 1) { ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); }
      return { x: (g.playW - w) / 2, y: (g.playH - h) / 2, w, h };
    }

    drawHandoff(m, t) {
      const g = this.geom, team = TEAM[m.owner];
      const titleH = w => this.wrap(m.title, w - 48, this.fs(26), 700).length * this.fs(26) * 1.2;
      const b = this.modalBox(560, w => Math.min(110, g.playH * 0.3) + 60 + titleH(w) + this.wrap(m.detail, w - 60, this.fs(17)).length * this.fs(17) * 1.4 + 30 + 58 + 26);
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: team.color, lineWidth: 5 });
      const icon = this.img[`icon_${team.key}`];
      if (icon) {
        const ih = Math.min(110, b.h * 0.3), iw = ih * icon.width / icon.height, bob = this.still ? 0 : Math.sin(t / 400) * 4;
        ctx.save(); ctx.translate(g.playW / 2, b.y + 22 + ih / 2 + bob); ctx.rotate(team.bow);
        ctx.drawImage(icon, -iw / 2, -ih / 2, iw, ih); ctx.restore();
      }
      let y = b.y + Math.min(110, b.h * 0.3) + 60;
      y = this.paragraph(m.title, b.x + 24, y, b.w - 48, { size: this.fs(26), color: this.hc ? '#000' : C.ink, align: 'center', weight: 700, lineHeight: 1.2 });
      y = this.paragraph(m.detail, b.x + 30, y + this.fs(6), b.w - 60, { size: this.fs(17), color: C.inkSoft, align: 'center' });
      const bw = Math.min(360, b.w - 48), bh = 58;
      this.pill(g.playW / 2 - bw / 2, b.y + b.h - bh - 26, bw, bh, `Sou o ${team.label}! (Enter)`, { color: team.color, deep: team.deep, onClick: () => this.acceptHandoff(), list: m.buttons, size: 18 });
    }

    drawQuestion(m) {
      const g = this.geom, q = m.question, qSize = this.fs(g.compact ? 18 : 23);
      const b = this.modalBox(720, w => 122 + this.wrap(q.pergunta, w - 72, qSize, 600).length * qSize * 1.35 + 36 + this.choiceLayout(w, 2, 64, 14).height + 28);
      const choice = this.choiceLayout(b.w, 2, 64, 14);
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: C.purple, lineWidth: 5 });
      const tag = m.practice ? 'TREINO DO RADAR' : 'SINAL MISTERIOSO NO RADAR', fsz = this.fs(14), tw = Math.min(b.w - 48, this.measure(tag, fsz) + 30);
      ctx.save(); this.rr(g.playW / 2 - tw / 2, b.y + 22, tw, fsz + 14, 99); ctx.fillStyle = this.hc ? '#000' : C.purple; ctx.fill(); ctx.restore();
      this.text(tag, g.playW / 2, b.y + 22 + (fsz + 14) / 2 + 1, { size: fsz, color: '#fff', align: 'center', baseline: 'middle', maxWidth: tw - 20 });
      this.text(m.practice ? 'Treino: a frase abaixo é verdadeira ou falsa?' : 'Capitão, vamos decifrar esse sinal! A frase é verdadeira ou falsa?', g.playW / 2, b.y + 84, { size: this.fs(15), color: this.hc ? '#000' : C.inkSoft, align: 'center', weight: 500, maxWidth: b.w - 48 });
      this.paragraph(q.pergunta, b.x + 36, b.y + 122, b.w - 72, { size: qSize, color: this.hc ? '#000' : C.ink, align: 'center', weight: 600, lineHeight: 1.35 });
      this.choiceRow(b, b.y + b.h - choice.height - 28, [
        { label: 'Verdadeiro (V)', color: C.grass, deep: C.grassDeep, icon: 'check', onClick: () => this.answerQuestion(true), size: 18 },
        { label: 'Falso (F)', color: C.p2, deep: C.p2Deep, icon: 'cross', onClick: () => this.answerQuestion(false), size: 18 }
      ], 64, 14, m.buttons);
    }

    drawFeedback(m, t) {
      const g = this.geom, ok = m.correct;
      const expl = m.question.explicacao + (ok ? '' : ' Agora você já sabe para a próxima!');
      const b = this.modalBox(640, w => 118 + this.fs(64) + this.wrap(expl, w - 72, this.fs(16)).length * this.fs(16) * 1.4 + 30 + 56 + 24 + (ok && !m.practice ? this.fs(13) + 26 : 0));
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: ok ? C.grass : C.orange, lineWidth: 5 });
      const star = this.img[ok ? 'star' : 'star_grey'];
      if (star) for (let i = 0; i < 3; i++) {
        const s = i === 1 ? 54 : 40, spin = this.still || !ok ? 0 : Math.sin(t / 300 + i) * 0.15;
        const sx = g.playW / 2 + (i - 1) * 58, sy = b.y + 50 + (i === 1 ? -6 : 4);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(spin); ctx.drawImage(star, -s / 2, -s / 2, s, s * 0.94); ctx.restore();
      }
      this.text(ok ? 'EXCELENTE!' : 'QUASE!', g.playW / 2, b.y + 118, { size: this.fs(28), color: this.hc ? '#000' : (ok ? C.grassDeep : '#c25e12'), align: 'center', weight: 700, maxWidth: b.w - 48 });
      const sub = ok ? (m.found ? `Você acertou e o radar identificou o contato: ${m.found}!` : 'Você acertou e decifrou o sinal!') : `Essa era difícil! A resposta correta é ${m.question.resposta ? 'VERDADEIRO' : 'FALSO'}.`;
      this.text(sub, g.playW / 2, b.y + 118 + this.fs(28), { size: this.fs(16), color: C.inkSoft, align: 'center', maxWidth: b.w - 48 });
      this.paragraph(m.question.explicacao + (ok ? '' : ' Agora você já sabe para a próxima!'), b.x + 36, b.y + 118 + this.fs(64), b.w - 72, { size: this.fs(16), color: this.hc ? '#000' : C.ink, align: 'center' });
      if (ok && !m.practice) {
        const chips = ['+ CONHECIMENTO', '+ CONTATO REVELADO'], csz = this.fs(13);
        const cw = chips.map(c => this.measure(c, csz, 700) + 22), total = cw[0] + cw[1] + 10;
        let cx = g.playW / 2 - total / 2; const cy = b.y + b.h - 56 - 24 - csz - 22;
        chips.forEach((c, i) => {
          ctx.save(); this.rr(cx, cy, cw[i], csz + 12, 8); ctx.fillStyle = this.hc ? '#fff' : C.neutralSoft; ctx.fill(); ctx.restore();
          this.text(c, cx + cw[i] / 2, cy + (csz + 12) / 2 + 1, { size: csz, color: this.hc ? '#000' : C.grassDeep, align: 'center', baseline: 'middle', weight: 700 });
          cx += cw[i] + 10;
        });
      }
      const bw = Math.min(260, b.w - 48), bh = 56;
      this.pill(g.playW / 2 - bw / 2, b.y + b.h - bh - 24, bw, bh, 'Continuar (Enter)', { color: C.p1, deep: C.p1Deep, onClick: () => this.closeFeedback(), list: m.buttons });
    }

    drawRisk(m) {
      const g = this.geom, w = Math.min(560, g.playW - 24), body = 'Pode ser um navio... ou uma armadilha que machuca o seu navio. Que tal analisar antes? Quer atirar mesmo assim?';
      const topFor = w => 40 + this.wrap('Esse ponto é um mistério!', w - 48, this.fs(25), 700).length * this.fs(25) * 1.2;
      const b = this.modalBox(560, w => topFor(w) + 16 + this.wrap(body, w - 72, this.fs(16)).length * this.fs(16) * 1.4 + 24 + this.choiceLayout(w, 2, 56, 12).height + 24);
      const top = topFor(b.w), choice = this.choiceLayout(b.w, 2, 56, 12);
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: C.orange, lineWidth: 5 });
      this.paragraph('Esse ponto é um mistério!', b.x + 24, b.y + 40 + this.fs(25) * 0.8, b.w - 48, { size: this.fs(25), color: this.hc ? '#000' : C.ink, align: 'center', weight: 700, lineHeight: 1.2 });
      this.paragraph(body, b.x + 36, b.y + top + 16, b.w - 72, { size: this.fs(16), color: C.inkSoft, align: 'center' });
      this.choiceRow(b, b.y + b.h - choice.height - 24, [
        { label: 'Atirar (Enter)', color: C.p2, deep: C.p2Deep, onClick: () => this.confirmRisk(true) },
        { label: 'Cancelar (Esc)', color: '#e6edf5', deep: C.grey, textColor: C.ink, onClick: () => this.confirmRisk(false) }
      ], 56, 12, m.buttons);
    }

    drawHelp(m) {
      const g = this.geom;
      const sections = [
        ['Dica agora', this.mission ? this.mission.tipText() : 'Escolha um navio no painel.', C.sunDeep],
        ['Como jogar', 'Na sua vez é sempre: 1. escolha um navio, 2. escolha uma ação, 3. escolha uma casa no mapa. Afunde todos os navios do adversário!', C.p1],
        ['Coordenadas', 'As letras (A a J) mostram as colunas e os números (1 a 10) mostram as linhas. A1 fica no canto de cima, à esquerda.', C.neutral],
        ['Radar', 'Inimigos a até 3 casas dos seus navios aparecem como “?”. Use Analisar e responda Verdadeiro ou Falso para descobrir o que é.', C.purple],
        ['Ações', 'Atacar: atire numa casa. Mover: ande 1 casa. Armadilha: esconda uma mina (só o Lança-Armadilhas). Analisar: descubra um “?”.', C.p2]
      ];
      const w = Math.min(820, g.playW - 24), two = w > 640, colW = two ? (w - 90) / 2 : w - 60;
      // Mede o conteúdo; se não couber na tela, diminui um pouco o texto.
      let k = 1, layout;
      for (; k >= 0.6; k -= 0.05) {
        const colY = [84, 84], items = [];
        let col = 0;
        for (const [title, body, color] of sections) {
          const lines = this.wrap(body, colW, this.fs(14.5) * k, 500).length;
          items.push({ title, body, color, col, y: colY[col] });
          colY[col] += this.fs(24) * k + lines * this.fs(14.5) * k * 1.4 + 16;
          if (two) col = colY[0] <= colY[1] ? 0 : 1;
        }
        layout = { items, h: Math.max(colY[0], colY[1]) + 22 + this.choiceLayout(w, 2, 52, 12).height + 22 };
        if (layout.h <= g.playH - 16) break;
      }
      k = Math.max(0.6, k);
      const b = this.modalBox(820, layout.h);
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: C.p1, lineWidth: 5 });
      this.text('GUIA DO CAPITÃO', g.playW / 2, b.y + 50, { size: this.fs(28) * k, color: this.hc ? '#000' : C.p1Deep, align: 'center', weight: 700, maxWidth: b.w - 48 });
      for (const it of layout.items) {
        const xx = b.x + 30 + it.col * (colW + 30), yy = b.y + it.y;
        ctx.save(); ctx.beginPath(); ctx.arc(xx + 7, yy - 6, 7, 0, Math.PI * 2); ctx.fillStyle = this.hc ? '#000' : it.color; ctx.fill(); ctx.restore();
        this.text(it.title, xx + 22, yy, { size: this.fs(17) * k, color: this.hc ? '#000' : C.ink, weight: 700, maxWidth: colW - 22 });
        this.paragraph(it.body, xx, yy + this.fs(24) * k, colW, { size: this.fs(14.5) * k, color: this.hc ? '#000' : C.inkSoft });
      }
      const choice = this.choiceLayout(b.w, 2, 52, 12);
      this.choiceRow(b, b.y + b.h - choice.height - 22, [
        { label: 'Rever tutorial', color: C.sun, deep: C.sunDeep, textColor: C.ink, onClick: () => { this.closeModal(); this.restartTutorial(); }, size: 16 * k },
        { label: 'Fechar (Esc)', color: C.p1, deep: C.p1Deep, onClick: () => this.closeModal(), size: 16 * k }
      ], 52, 12, m.buttons);
    }

    drawEnd(m, t) {
      const g = this.geom, win = TEAM[this.state.winner], scores = this.currentScores();
      const stackFor = w => (w - 70) / 2 < Math.max(170, this.fs(17) * 9.5);
      const boxH = 26 + this.fs(17) + this.fs(14) * 2 + 18;
      const b = this.modalBox(620, w => 150 + this.fs(66) + (stackFor(w) ? boxH * 2 + 12 : boxH) + 24 + 58 + 24);
      const stackScores = stackFor(b.w);
      // Personagem de meio corpo ao lado da janela: Capitão comemora, Barba-Rubra provoca.
      const who = this.img[this.state.winner === 'player1' ? 'hero' : 'villain'];
      if (who && !this.hc && g.playW > 700) {
        const ph = Math.min(g.playH * 0.72, 560), pw = ph * who.width / who.height;
        const left = this.state.winner === 'player1';
        const rise = this.still ? 0 : (1 - ease(clamp((t - (m.openedAt || 0)) / 500, 0, 1))) * 60;
        const px = left ? Math.max(-pw * 0.12, b.x - pw * 0.72) : Math.min(g.playW - pw * 0.88, b.x + b.w - pw * 0.28);
        ctx.save();
        ctx.drawImage(who, px, g.playH - ph * 0.86 + rise, pw, ph);
        ctx.restore();
      }
      this.card(b.x, b.y, b.w, b.h, { r: 32, stroke: win.color, lineWidth: 6 });
      // Estrelas medem o desempenho do jogador (não do vencedor).
      const mine = scores.player1, stars = mine >= 70 ? 3 : mine >= 40 ? 2 : mine >= 15 ? 1 : 0;
      for (let i = 0; i < 3; i++) {
        const img = this.img[i < stars ? 'star' : 'star_grey'], s = i === 1 ? 70 : 52;
        const bounce = this.still ? 0 : Math.abs(Math.sin(t / 350 + i)) * 6;
        if (img) ctx.drawImage(img, g.playW / 2 + (i - 1) * 78 - s / 2, b.y + 30 + (i === 1 ? 0 : 14) - bounce, s, s * 0.94);
      }
      this.text(this.winTitle(), g.playW / 2, b.y + 150, { size: this.fs(32), color: this.hc ? '#000' : win.deep, align: 'center', weight: 700, maxWidth: b.w - 48 });
      this.text(`${this.state.round} ${this.state.round === 1 ? 'rodada' : 'rodadas'} · ${this.elapsedText()} de jogo`, g.playW / 2, b.y + 150 + this.fs(30), { size: this.fs(15), color: C.inkSoft, align: 'center', maxWidth: b.w - 48 });
      const rowY = b.y + 150 + this.fs(66);
      for (const [i, owner] of ['player1', 'player2'].entries()) {
        const st = this.state.stats[owner], team = TEAM[owner];
        const rw = stackScores ? b.w - 48 : Math.min(250, (b.w - 64) / 2);
        const rx = stackScores ? b.x + 24 : g.playW / 2 + (i === 0 ? -rw - 8 : 8), ry = stackScores ? rowY + i * (boxH + 12) : rowY;
        ctx.save(); this.rr(rx, ry, rw, boxH, 18); ctx.fillStyle = this.hc ? '#fff' : team.soft; ctx.fill();
        if (this.hc) { ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke(); } ctx.restore();
        const tw = rw - 24, l1 = ry + 14 + this.fs(17), l2 = l1 + this.fs(14) * 1.45, l3 = l2 + this.fs(14) * 1.45;
        this.text(`${team.label}: ${scores[owner]} pts`, rx + rw / 2, l1, { size: this.fs(17), color: this.hc ? '#000' : team.deep, align: 'center', weight: 700, maxWidth: tw });
        this.text(`Tiros certos ${st.hits}/${st.attacks}`, rx + rw / 2, l2, { size: this.fs(14), color: C.ink, align: 'center', maxWidth: tw });
        this.text(`Perguntas ${st.verificationCorrect}/${st.verificationAttempts}`, rx + rw / 2, l3, { size: this.fs(14), color: C.ink, align: 'center', maxWidth: tw });
      }
      const bw = Math.min(280, b.w - 48), bh = 58;
      this.pill(g.playW / 2 - bw / 2, b.y + b.h - bh - 24, bw, bh, 'Jogar de novo (Enter)', { color: C.grass, deep: C.grassDeep, onClick: () => this.restart(), list: m.buttons, size: 18 });
    }
  }

  function roundRectPath(x, px, py, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  function drawBuoy(x, cx, cy, r) {
    x.save();
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    x.beginPath(); x.arc(cx, cy, r, Math.PI * 0.25, Math.PI * 0.75); x.lineTo(cx, cy); x.closePath(); x.fillStyle = '#ef5a4c'; x.fill();
    x.beginPath(); x.arc(cx, cy, r, Math.PI * 1.25, Math.PI * 1.75); x.lineTo(cx, cy); x.closePath(); x.fill();
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.lineWidth = 1.5; x.strokeStyle = '#a3322a'; x.stroke();
    x.restore();
  }

  window.GDM_GAME = new SeaBattleGame();
  window.GDM_GAME.init();
})();
