'use strict';

(() => {
  const { get, put } = Jelly.club;

  // 10 Rich 4-Bar (64-Step) Studio-Groove Stage Soundtracks
  // Inspired by Incredibox beatbox bounce + lush Rhodes chords + organic marimba/kalimba/synth leads + Bar-4 drum fills!
  // chords: 4 bars of chord tones (semitones from root)
  // bass:   4 bars (each bar 16 steps, or 4 root offsets + rhythmic groove)
  // melody: 4 distinct bars (64 steps total, -1 = rest) so the music tells a real musical story instead of repeating 1 bar!
  const stageTracks = {
    cartoon: {
      // Sunny Pop-Funk Beatbox (C major / A minor bounce, 108 BPM) — IV -> V -> iii -> vi
      bpm: 108, root: 130.81, leadInst: 'kalimba', chordInst: 'rhodes',
      chords: [
        [5, 9, 12, 16],  // Fmaj7
        [7, 11, 14, 17], // G7
        [4, 7, 11, 14],  // Em7
        [9, 12, 16, 19]  // Am7
      ],
      bassRoots: [5, 7, 4, 9],
      kick:  [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0],
      melody: [
        [16,-1,-1,19, -1,-1,21,-1, 19,-1,16,-1, 12,-1,-1,-1],
        [14,-1,-1,16, -1,-1,19,-1, 17,-1,14,-1, 11,-1,-1,-1],
        [16,-1,-1,19, -1,23,-1,21, 19,-1,-1,16, -1,14,-1,-1],
        [12,-1,14,-1, 16,-1,-1,19, -1,-1,16,-1, 12,-1,-1,-1]
      ]
    },
    toy3d: {
      bpm: 112, root: 146.83, leadInst: 'kalimba', chordInst: 'rhodes',
      chords: [
        [0, 4, 7, 11],
        [5, 9, 12, 16],
        [7, 11, 14, 17],
        [9, 12, 16, 19]
      ],
      bassRoots: [0, 5, 7, 9],
      kick:  [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,1],
      melody: [
        [12,-1,16,-1, -1,19,-1,16, 14,-1,12,-1, 11,-1,-1,-1],
        [17,-1,16,-1, -1,14,-1,12, 16,-1,14,-1, 12,-1,-1,-1],
        [19,-1,-1,17, -1,16,-1,14, 16,-1,-1,19, -1,16,-1,-1],
        [14,-1,16,-1, 12,-1,-1,14, -1,-1,12,-1, -1,-1,-1,-1]
      ]
    },
    metal: {
      // Sleek Studio Neo-Soul Beatbox (D minor, 110 BPM) — i -> VII -> VI -> V
      bpm: 110, root: 146.83, leadInst: 'epiano', chordInst: 'rhodes',
      chords: [
        [0, 3, 7, 10],   // Dm7
        [-2, 2, 5, 10],  // C9
        [-4, 0, 3, 7],   // Bbmaj7
        [-5, -1, 2, 7]   // A7sus4
      ],
      bassRoots: [0, -2, -4, -5],
      kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,1,0],
      melody: [
        [12,-1,15,-1, -1,-1,17,-1, 15,-1,12,-1, 10,-1,-1,-1],
        [10,-1,12,-1, -1,-1,14,-1, 12,-1,10,-1, 7,-1,-1,-1],
        [12,-1,15,-1, 19,-1,17,-1, 15,-1,-1,14, -1,12,-1,-1],
        [10,-1,-1,12, -1,14,-1,12, 10,-1,7,-1, -1,-1,-1,-1]
      ]
    },
    glass: {
      // Chill Tropical Glass Marimba Beatbox (F major, 98 BPM)
      bpm: 98, root: 174.61, leadInst: 'glassbell', chordInst: 'pad',
      chords: [
        [0, 4, 7, 11],   // Fmaj7
        [2, 5, 9, 12],   // Gm7
        [4, 7, 11, 14],  // Am7
        [7, 11, 14, 17]  // C9
      ],
      bassRoots: [0, 2, 4, 7],
      kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,1,0, 0,1,1,0, 0,0,1,0, 0,1,1,0],
      melody: [
        [12,-1,-1,16, -1,-1,19,-1, 16,-1,-1,14, -1,-1,-1,-1],
        [14,-1,-1,17, -1,-1,21,-1, 19,-1,-1,17, -1,-1,-1,-1],
        [16,-1,-1,19, -1,-1,23,-1, 21,-1,19,-1, 16,-1,-1,-1],
        [19,-1,16,-1, 14,-1,-1,12, -1,-1,14,-1, 12,-1,-1,-1]
      ]
    },
    neon: {
      // Smooth Synthwave Beatbox (A minor, 116 BPM) — i -> VI -> III -> VII
      bpm: 116, root: 110.00, leadInst: 'synth', chordInst: 'pad',
      chords: [
        [0, 3, 7, 12],   // Am
        [8, 12, 15, 19], // Fmaj7
        [3, 7, 10, 15],  // C
        [10, 14, 17, 22] // G
      ],
      bassRoots: [0, 8, 3, 10],
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,1,0, 0,0,1,1, 0,0,1,0, 0,0,1,1],
      melody: [
        [15,-1,-1,19, -1,-1,22,-1, 19,-1,15,-1, 12,-1,-1,-1],
        [15,-1,-1,19, -1,-1,24,-1, 22,-1,19,-1, 15,-1,-1,-1],
        [19,-1,-1,22, -1,24,-1,22, 19,-1,-1,15, -1,-1,-1,-1],
        [17,-1,15,-1, 14,-1,-1,12, -1,-1,14,-1, 12,-1,-1,-1]
      ]
    },
    plush: {
      // Cozy Lullaby Swing Beatbox (G major, 100 BPM)
      bpm: 100, root: 196.00, leadInst: 'kalimba', chordInst: 'rhodes',
      chords: [
        [0, 4, 7, 11],
        [-3, 0, 4, 7],
        [5, 9, 12, 16],
        [7, 11, 14, 17]
      ],
      bassRoots: [0, -3, 5, 7],
      kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,1,0],
      melody: [
        [12,-1,-1,14, -1,-1,16,-1, 14,-1,12,-1, 7,-1,-1,-1],
        [9,-1,-1,12, -1,-1,14,-1, 12,-1,9,-1, 7,-1,-1,-1],
        [12,-1,14,-1, 16,-1,19,-1, 16,-1,14,-1, 12,-1,-1,-1],
        [14,-1,-1,12, -1,-1,11,-1, 9,-1,-1,7, -1,-1,-1,-1]
      ]
    },
    pixel: {
      // Groovy Chiptune Funk (E minor, 118 BPM)
      bpm: 118, root: 164.81, leadInst: 'chip', chordInst: 'rhodes',
      chords: [
        [0, 3, 7, 10],
        [5, 8, 12, 15],
        [3, 7, 10, 14],
        [7, 10, 14, 17]
      ],
      bassRoots: [0, 5, 3, 7],
      kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      melody: [
        [12,-1,15,-1, 19,-1,-1,17, 15,-1,12,-1, 10,-1,-1,-1],
        [12,-1,17,-1, 20,-1,-1,19, 17,-1,15,-1, 12,-1,-1,-1],
        [15,-1,19,-1, 22,-1,-1,19, 17,-1,15,-1, 14,-1,-1,-1],
        [15,-1,14,-1, 12,-1,10,-1, 12,-1,-1,-1, -1,-1,-1,-1]
      ]
    },
    gummy: {
      // Bouncy Kawaii Candy Pop (G major, 114 BPM)
      bpm: 114, root: 196.00, leadInst: 'kalimba', chordInst: 'rhodes',
      chords: [
        [5, 9, 12, 16],
        [7, 11, 14, 17],
        [4, 7, 11, 14],
        [9, 12, 16, 19]
      ],
      bassRoots: [5, 7, 4, 9],
      kick:  [1,0,0,0, 0,0,1,0, 1,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,1,1,0, 0,1,1,0, 0,1,1,0, 0,1,1,1],
      melody: [
        [12,-1,14,-1, 16,-1,-1,19, -1,-1,16,-1, 14,-1,-1,-1],
        [14,-1,16,-1, 19,-1,-1,21, -1,-1,19,-1, 16,-1,-1,-1],
        [16,-1,19,-1, 21,-1,24,-1, 21,-1,19,-1, 16,-1,-1,-1],
        [19,-1,16,-1, 14,-1,12,-1, 14,-1,-1,12, -1,-1,-1,-1]
      ]
    },
    porcelain: {
      // Guofeng Lo-Fi Guzheng Beatbox (C pentatonic, 96 BPM)
      bpm: 96, root: 130.81, leadInst: 'guzheng', chordInst: 'pad',
      chords: [
        [0, 4, 7, 12],
        [9, 12, 16, 19],
        [5, 9, 12, 16],
        [7, 11, 14, 19]
      ],
      bassRoots: [0, 9, 5, 7],
      kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,0],
      melody: [
        [12,-1,-1,14, -1,-1,16,-1, 19,-1,-1,16, -1,-1,14,-1],
        [16,-1,-1,19, -1,-1,21,-1, 19,-1,16,-1, 12,-1,-1,-1],
        [14,-1,-1,16, -1,-1,19,-1, 21,-1,19,-1, 16,-1,-1,-1],
        [19,-1,16,-1, 14,-1,-1,12, -1,-1,14,-1, 12,-1,-1,-1]
      ]
    },
    sakura: {
      // Warm Sakura Lo-Fi Koto Beatbox (D pentatonic, 94 BPM)
      bpm: 94, root: 146.83, leadInst: 'guzheng', chordInst: 'rhodes',
      chords: [
        [0, 4, 7, 11],
        [9, 12, 16, 19],
        [5, 9, 12, 16],
        [7, 11, 14, 19]
      ],
      bassRoots: [0, 9, 5, 7],
      kick:  [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
      melody: [
        [14,-1,-1,16, -1,-1,19,-1, 16,-1,-1,14, -1,-1,-1,-1],
        [12,-1,-1,14, -1,-1,16,-1, 19,-1,-1,16, -1,-1,-1,-1],
        [19,-1,-1,21, -1,-1,19,-1, 16,-1,14,-1, 12,-1,-1,-1],
        [14,-1,16,-1, 19,-1,-1,14, -1,-1,12,-1, -1,-1,-1,-1]
      ]
    },
    holo: {
      // Dreamy Future-Chill Rhodes & Bell Beatbox (E minor9, 104 BPM)
      bpm: 104, root: 164.81, leadInst: 'glassbell', chordInst: 'rhodes',
      chords: [
        [0, 3, 7, 14],
        [8, 12, 15, 19],
        [3, 7, 10, 14],
        [5, 9, 12, 17]
      ],
      bassRoots: [0, 8, 3, 5],
      kick:  [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0],
      melody: [
        [12,-1,-1,15, -1,-1,19,-1, 17,-1,-1,15, -1,-1,-1,-1],
        [15,-1,-1,19, -1,-1,22,-1, 19,-1,-1,17, -1,-1,-1,-1],
        [19,-1,-1,17, -1,-1,15,-1, 14,-1,15,-1, 12,-1,-1,-1],
        [15,-1,14,-1, 12,-1,-1,10, -1,-1,12,-1, -1,-1,-1,-1]
      ]
    }
  };

  const skinFoley = {
    cartoon:   { hitLo: 150, hitHi: 74,  shimmer: 0.00 },
    toy3d:     { hitLo: 195, hitHi: 108, shimmer: 0.03 },
    metal:     { hitLo: 260, hitHi: 165, shimmer: 0.05 },
    glass:     { hitLo: 540, hitHi: 420, shimmer: 0.08 },
    neon:      { hitLo: 210, hitHi: 92,  shimmer: 0.04 },
    plush:     { hitLo: 118, hitHi: 58,  shimmer: 0.00 },
    pixel:     { hitLo: 210, hitHi: 115, shimmer: 0.03 },
    gummy:     { hitLo: 175, hitHi: 265, shimmer: 0.02 },
    porcelain: { hitLo: 490, hitHi: 380, shimmer: 0.07 },
    sakura:    { hitLo: 380, hitHi: 295, shimmer: 0.05 },
    holo:      { hitLo: 340, hitHi: 450, shimmer: 0.06 }
  };

  // 20 Distinct Musical Character Voices (harmonized in key, warm organic timbres, zero harsh buzz!)
  const charVoices = [
    { kind: 'beatbox_kick',  semi: 0  }, // 0  橘子鼓手: punchy beatbox kick+hi-hat
    { kind: 'water_bloop',   semi: 12 }, // 1  冰蓝泡泡: bubbly upward marimba-bloop
    { kind: 'funk_pluck',    semi: 15 }, // 2  青柠刺头: crisp funky guitar pluck
    { kind: 'double_hop',    semi: 19 }, // 3  桃桃兔:   playful double-hop kalimba
    { kind: 'soft_chime',    semi: 24 }, // 4  金铃天线: sweet warm bell chime
    { kind: 'conga_pop',     semi: 7  }, // 5  红椒鼓点: snappy Latin conga + snare
    { kind: 'chip_arpeggio', semi: 12 }, // 6  点阵搭档: playful 3-note arcade blip
    { kind: 'bass_slide',    semi: 0  }, // 7  紫电小角: funky warm synth-bass slide
    { kind: 'rhodes_stab',   semi: 12 }, // 8  银碟队长: lush neo-soul Rhodes chord
    { kind: 'harp_roll',     semi: 15 }, // 9  薄荷花匠: breezy 4-note harp roll
    { kind: 'brass_stab',    semi: 7  }, // 10 金色面罩: warm horn swell
    { kind: 'blues_slide',   semi: 10 }, // 11 午夜蓝调: jazzy warm blues glide
    { kind: 'musicbox_duo',  semi: 22 }, // 12 雪白音符: delicate music-box duet
    { kind: 'taiko_double',  semi: -5 }, // 13 桶桶鼓手: deep double bongo/taiko thump
    { kind: 'sunny_triad',   semi: 12 }, // 14 太阳先生: radiant warm major triad
    { kind: 'wood_flute',    semi: 19 }, // 15 树冠歌手: organic hollow ocarina/flute
    { kind: 'robot_trill',   semi: 15 }, // 16 彩帽小屏: cute dual-tone vocoder trill
    { kind: 'guitar_strum',  semi: 7  }, // 17 沙丘帽客: acoustic guitar chord strum
    { kind: 'sub_cello',     semi: -12}, // 18 灰耳低音: deep warm upright bass/cello
    { kind: 'vinyl_choir',   semi: 12 }  // 19 黑胶主唱: lush Rhodes + bell grand chord!
  ];

  const semiToHz = (root, semi) => root * Math.pow(2, semi / 12);

  class Band {
    constructor() {
      this.on = get('jelly-jam.sound', 'on') !== 'off';
      this.musicOn = get('jelly-jam.music', 'on') !== 'off';
      this.running = false;
      this.fever = false;
      this.skin = 'cartoon';
      this.stage = 'cartoon';
      this.ctx = null;
      this.lastHit = -10;
      this.nextChime = 0;
    }
    setTheme(skin, stage) {
      if (skinFoley[skin]) this.skin = skin;
      if (stageTracks[stage]) this.stage = stage;
    }
    _initCtx() {
      if (this.ctx) return true;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      try {
        const c = this.ctx = new Audio();
        this.master = c.createDynamicsCompressor();
        this.master.threshold.value = -12;
        this.master.ratio.value = 3;
        this.master.attack.value = .010;
        this.master.release.value = .18;
        this.master.connect(c.destination);

        this.sfxFilter = c.createBiquadFilter();
        this.sfxFilter.type = 'lowpass';
        this.sfxFilter.frequency.value = 2800;
        this.sfxFilter.Q.value = 0.55;
        this.effects = c.createGain();
        this.effects.gain.value = .50;
        this.effects.connect(this.sfxFilter);
        this.sfxFilter.connect(this.master);

        this.bgmFilter = c.createBiquadFilter();
        this.bgmFilter.type = 'lowpass';
        this.bgmFilter.frequency.value = 3200;
        this.bgmFilter.Q.value = 0.5;
        this.music = c.createGain();
        this.music.gain.value = this.musicOn ? .46 : 0;
        this.duck = c.createGain();
        this.music.connect(this.bgmFilter);
        this.bgmFilter.connect(this.duck);
        this.duck.connect(this.master);

        this.echoSend = c.createGain();
        this.echoSend.gain.value = 0.28;
        this.echoDelay = c.createDelay(0.6);
        this.echoDelay.delayTime.value = 0.22;
        this.echoFb = c.createGain();
        this.echoFb.gain.value = 0.24;
        this.echoTone = c.createBiquadFilter();
        this.echoTone.type = 'lowpass';
        this.echoTone.frequency.value = 1400;
        this.echoSend.connect(this.echoDelay);
        this.echoDelay.connect(this.echoTone);
        this.echoTone.connect(this.music);
        this.echoTone.connect(this.echoFb);
        this.echoFb.connect(this.echoDelay);

        this.noise = c.createBuffer(1, Math.round(c.sampleRate * .18), c.sampleRate);
        const a = this.noise.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
        return true;
      } catch { this.ctx = null; return false; }
    }
    unlock() {
      if (!this.on) return;
      if (!this._initCtx()) return;
      this.sync();
    }
    ensureUiAudio(cb) {
      if (!this.on || !this._initCtx()) return;
      clearTimeout(this.suspendAt);
      const run = () => { try { cb(); } catch {} };
      if (this.ctx.state === 'running') run();
      else this.ctx.resume().then(run).catch(() => {});
    }
    enable(on) { this.on = on; put('jelly-jam.sound', on ? 'on' : 'off'); if (on) this.unlock(); else this.sync(); }
    musicEnabled(on) { this.musicOn = on; put('jelly-jam.music', on ? 'on' : 'off'); if (this.ctx) this.music.gain.setTargetAtTime(on ? .46 : 0, this.ctx.currentTime, .03); }
    setFever(on) { this.fever = !!on; }
    active(on, tail = false) { this.running = on; this.sync(tail); }
    sync(tail = false) {
      const c = this.ctx;
      if (!c) return;
      clearTimeout(this.suspendAt);
      if (!this.on || !this.running || document.hidden) {
        clearInterval(this.timer); this.timer = null;
        const off = () => { if (c.state === 'running') c.suspend().catch(() => {}); };
        if (tail && this.on && !document.hidden) this.suspendAt = setTimeout(off, 600); else off();
        return;
      }
      if (c.state !== 'running') c.resume().then(() => this.schedule()).catch(() => {});
      if (this.timer) return;
      this.when = c.currentTime + .055;
      this.beat = 0;
      this.timer = setInterval(() => this.schedule(), 55);
      this.schedule();
    }

    tone(hz, end, at, duration, type, level, bus, attack = .010) {
      const c = this.ctx;
      const osc = c.createOscillator(), env = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(28, hz), at);
      if (end !== hz) osc.frequency.exponentialRampToValueAtTime(Math.max(28, end), at + duration);
      env.gain.setValueAtTime(.0001, at);
      env.gain.linearRampToValueAtTime(level, at + attack);
      env.gain.exponentialRampToValueAtTime(.0001, at + duration);
      osc.connect(env); env.connect(bus);
      osc.start(at); osc.stop(at + duration + .012);
      osc.onended = () => { osc.disconnect(); env.disconnect(); };
    }

    // Organic Plucked Instrument (Kalimba / Marimba / Guzheng / Soft Synth) with Filter Envelope!
    pluckedTone(hz, at, duration, level, inst, bus, sendEcho = false) {
      const c = this.ctx;
      const osc = c.createOscillator(), osc2 = c.createOscillator();
      const flt = c.createBiquadFilter(), env = c.createGain();

      if (inst === 'guzheng') {
        osc.type = 'triangle'; osc2.type = 'sine';
        osc.frequency.setValueAtTime(hz, at);
        osc2.frequency.setValueAtTime(hz * 2, at);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(2400, at);
        flt.frequency.exponentialRampToValueAtTime(620, at + duration * 0.85);
      } else if (inst === 'glassbell') {
        osc.type = 'sine'; osc2.type = 'sine';
        osc.frequency.setValueAtTime(hz, at);
        osc2.frequency.setValueAtTime(hz * 2.002, at);
        flt.type = 'lowpass'; flt.frequency.value = 2600;
      } else if (inst === 'chip') {
        osc.type = 'square'; osc2.type = 'triangle';
        osc.frequency.setValueAtTime(hz, at);
        osc2.frequency.setValueAtTime(hz * 0.5, at);
        flt.type = 'lowpass'; flt.frequency.value = 1650;
      } else if (inst === 'synth') {
        osc.type = 'triangle'; osc2.type = 'sawtooth';
        osc.frequency.setValueAtTime(hz, at);
        osc2.frequency.setValueAtTime(hz * 1.004, at);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(1900, at);
        flt.frequency.exponentialRampToValueAtTime(540, at + duration);
      } else {
        // kalimba / epiano: warm woody fundamental + soft bell overtone
        osc.type = 'sine'; osc2.type = 'triangle';
        osc.frequency.setValueAtTime(hz, at);
        osc2.frequency.setValueAtTime(hz * 2, at);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(2100, at);
        flt.frequency.exponentialRampToValueAtTime(700, at + duration * 0.7);
      }

      const g2 = c.createGain();
      g2.gain.value = (inst === 'glassbell' || inst === 'guzheng') ? 0.32 : (inst === 'chip' ? 0.25 : 0.22);

      env.gain.setValueAtTime(.0001, at);
      env.gain.linearRampToValueAtTime(level, at + .008);
      env.gain.exponentialRampToValueAtTime(.0001, at + duration);

      osc.connect(flt); osc2.connect(g2); g2.connect(flt);
      flt.connect(env); env.connect(bus);
      if (sendEcho && this.echoSend) env.connect(this.echoSend);

      osc.start(at); osc2.start(at);
      osc.stop(at + duration + .015); osc2.stop(at + duration + .015);
      osc.onended = () => { osc.disconnect(); osc2.disconnect(); g2.disconnect(); flt.disconnect(); env.disconnect(); };
    }

    // Lush Warm Electric Piano / Pad Chord (plays rich 4-note harmonies across 4 bars!)
    chordStab(rootHz, semis, at, duration, level, inst, bus) {
      const c = this.ctx;
      const flt = c.createBiquadFilter(), env = c.createGain();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(inst === 'pad' ? 1100 : 1650, at);
      flt.frequency.exponentialRampToValueAtTime(620, at + duration);

      env.gain.setValueAtTime(.0001, at);
      env.gain.linearRampToValueAtTime(level, at + (inst === 'pad' ? .06 : .014));
      env.gain.exponentialRampToValueAtTime(.0001, at + duration);

      flt.connect(env); env.connect(bus);
      if (this.echoSend) env.connect(this.echoSend);

      const oscs = semis.map((s, idx) => {
        const o = c.createOscillator();
        o.type = (idx === 0 || inst === 'rhodes') ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(semiToHz(rootHz, s) * (1 + (idx - 1.5) * 0.0012), at);
        o.connect(flt);
        o.start(at);
        o.stop(at + duration + .02);
        return o;
      });
      oscs[0].onended = () => { oscs.forEach(o => o.disconnect()); flt.disconnect(); env.disconnect(); };
    }

    noiseTap(at, volume, cutoff, duration, bus, q = 1.6) {
      const c = this.ctx, src = c.createBufferSource(), filter = c.createBiquadFilter(), env = c.createGain();
      src.buffer = this.noise;
      filter.type = 'bandpass'; filter.frequency.value = cutoff; filter.Q.value = q;
      env.gain.setValueAtTime(volume, at);
      env.gain.exponentialRampToValueAtTime(.0001, at + duration);
      src.connect(filter); filter.connect(env); env.connect(bus);
      src.start(at); src.stop(at + duration + .005);
      src.onended = () => { src.disconnect(); filter.disconnect(); env.disconnect(); };
    }

    beatboxKick(at, vol, bus) {
      this.tone(128, 46, at, .14, 'sine', vol, bus, .004);
      this.noiseTap(at, vol * .20, 420, .026, bus, 1.2);
    }
    beatboxSnare(at, vol, bus) {
      this.tone(205, 125, at, .075, 'triangle', vol * .52, bus, .003);
      this.noiseTap(at, vol * .80, 1650, .085, bus, 1.3);
    }
    beatboxHat(at, vol, bus) {
      this.noiseTap(at, vol, 4200, .034, bus, 2.2);
    }

    schedule() {
      const c = this.ctx;
      if (!this.running || !this.on || c?.state !== 'running') return;
      if (this.when < c.currentTime - .08) this.when = c.currentTime + .018;
      const track = stageTracks[this.stage] || stageTracks.cartoon;
      const bpm = this.fever ? Math.min(130, track.bpm + 12) : track.bpm;
      const stepSec = 60 / bpm / 4; // 16th-note groove

      while (this.when < c.currentTime + .18) {
        const stepIn64 = this.beat % 64;
        const bar = Math.floor(stepIn64 / 16);      // 0, 1, 2, 3 (4-bar progression!)
        const i = stepIn64 % 16;                    // 0..15 within bar
        const phrase = Math.floor((this.beat % 128) / 64); // 0 = Verse, 1 = Rich Chorus with arpeggio!
        const swing = (i % 2 === 1) ? stepSec * 0.13 : 0;
        const t = this.when + swing;

        if (this.musicOn) {
          // 1. Tight Beatbox Drum Groove + Musical Bar-4 Fill (beats 13-15 of bar 3!)
          const isFill = (bar === 3 && i >= 13);
          if (track.kick[i] || (isFill && i === 13)) this.beatboxKick(t, .30, this.music);
          if (track.snare[i] || (isFill && (i === 14 || i === 15))) {
            this.beatboxSnare(t, isFill ? .15 : .17, this.music);
          }
          if (track.hat[i]) this.beatboxHat(t, (i % 4 === 2) ? .060 : .034, this.music);

          // 2. Lush 4-Bar Rhodes / Pad Chord Progression (hits on beat 1 & syncopated beat 10!)
          const chord = track.chords[bar];
          if (i === 0) {
            this.chordStab(track.root * 2, chord, t, stepSec * 8.5, .072, track.chordInst, this.music);
          } else if (i === 10) {
            this.chordStab(track.root * 2, chord, t, stepSec * 5.0, .052, track.chordInst, this.music);
          }

          // 3. Warm Groovy Bassline following the 4-bar chord roots
          const bRoot = track.bassRoots[bar];
          if (i === 0 || i === 6 || i === 10 || (bar === 3 && i === 14)) {
            const offset = (i === 10) ? 7 : (i === 14 ? 5 : 0);
            const bHz = semiToHz(track.root, bRoot + offset);
            this.tone(bHz * 1.02, bHz, t, stepSec * 2.4, 'sine', .24, this.music, .010);
            this.tone(bHz, bHz, t, stepSec * 1.8, 'triangle', .11, this.music, .010);
          }

          // 4. Evolving 4-Bar Organic Melody (never repeats after 1 bar!)
          const mSemi = track.melody[bar][i];
          if (mSemi !== -1 && mSemi !== undefined) {
            const mHz = semiToHz(track.root, mSemi);
            const lvl = track.leadInst === 'chip' ? .075 : .125;
            this.pluckedTone(mHz, t, stepSec * 3.0, lvl, track.leadInst, this.music, true);
          }

          // 5. Phrase 2 (Bars 5-8) adds a delicate sparkling counter-arpeggio so long play stays rich!
          if (phrase === 1 && (i % 4 === 2)) {
            const arpSemi = chord[(i / 4 | 0) % chord.length] + 12;
            const aHz = semiToHz(track.root, arpSemi);
            this.pluckedTone(aHz, t, stepSec * 2.2, .055, 'glassbell', this.music, true);
          }
        }

        this.when += stepSec;
        this.beat++;
      }
    }

    canPlay() { return this.on && this.running && this.ctx?.state === 'running'; }
    canUiPlay() { return this.on && this._initCtx(); }

    fire(power, level = 0) {
      if (!this.canPlay()) return;
      const t = this.ctx.currentTime;
      const base = 155 + (level % 6) * 16;
      this.tone(base, base + 90 + power * 110, t, .085, 'sine', .15, this.effects, .008);
    }

    hit(speed, level = 0) {
      if (!this.canPlay() || this.ctx.currentTime - this.lastHit < .13) return;
      this.lastHit = this.ctx.currentTime;
      const mat = skinFoley[this.skin] || skinFoley.cartoon;
      const pitchShift = 1 + (level % 6) * 0.055;
      const vol = Math.min(.14, .04 + speed * .00011);
      this.tone(mat.hitLo * pitchShift, mat.hitHi * pitchShift, this.lastHit, .075, 'sine', vol, this.effects, .006);
      if (mat.shimmer > 0) {
        this.tone(mat.hitLo * 1.8 * pitchShift, mat.hitHi * 1.8 * pitchShift, this.lastHit, .09, 'sine', vol * mat.shimmer * 4, this.effects, .006);
      }
    }

    previewSkin(skinKey) {
      this.ensureUiAudio(() => {
        const mat = skinFoley[skinKey] || skinFoley.cartoon;
        const t = this.ctx.currentTime + 0.005;
        this.tone(mat.hitLo * 1.15, mat.hitHi * 1.15, t, .095, 'sine', .16, this.effects, .006);
        if (mat.shimmer > 0) {
          this.tone(mat.hitLo * 1.9, mat.hitHi * 1.9, t + .01, .11, 'sine', Math.min(.16, mat.shimmer * 1.2), this.effects, .006);
        }
      });
    }

    tickWarn(urgent = false) {
      if (!this.canPlay()) return;
      const t = this.ctx.currentTime;
      this.beatboxHat(t, urgent ? .14 : .08, this.effects);
      this.tone(urgent ? 587.33 : 493.88, urgent ? 523.25 : 440, t, .06, 'sine', urgent ? .13 : .08, this.effects, .005);
    }

    prop(kind) {
      this.ensureUiAudio(() => {
        const t = this.ctx.currentTime + 0.005;
        const r = (stageTracks[this.stage] || stageTracks.cartoon).root * 2;
        if (kind === 'hammer') {
          this.beatboxKick(t, .32, this.effects);
          this.beatboxSnare(t + .02, .20, this.effects);
        } else if (kind === 'shake') {
          this.tone(110, 220, t, .16, 'triangle', .22, this.effects, .01);
          this.tone(220, 120, t + .10, .16, 'triangle', .18, this.effects, .01);
        } else if (kind === 'wild') {
          [0, 4, 7, 12].forEach((s, i) => this.pluckedTone(semiToHz(r, s), t + i * .045, .24, .18, 'glassbell', this.effects, false));
        } else {
          [7, 11, 14].forEach((s, i) => this.pluckedTone(semiToHz(r, s), t + i * .05, .22, .16, 'kalimba', this.effects, false));
        }
      });
    }

    reward() {
      this.ensureUiAudio(() => {
        const t = this.ctx.currentTime + 0.005;
        const r = (stageTracks[this.stage] || stageTracks.cartoon).root * 2;
        [0, 4, 7, 12].forEach((s, i) => this.pluckedTone(semiToHz(r, s), t + i * .055, .24, .18, 'kalimba', this.effects, false));
      });
    }

    win() {
      this.ensureUiAudio(() => {
        const t = this.ctx.currentTime + 0.005;
        const r = (stageTracks[this.stage] || stageTracks.cartoon).root * 2;
        [0, 4, 7, 11, 12].forEach((s, i) => this.pluckedTone(semiToHz(r, s), t + i * .065, .34, .20, 'glassbell', this.effects, false));
      });
    }

    fail() {
      this.ensureUiAudio(() => {
        const t = this.ctx.currentTime + 0.005;
        [329.63, 293.66, 246.94].forEach((hz, i) => this.tone(hz, hz * .95, t + i * .12, .24, 'triangle', .16, this.effects, .015));
      });
    }

    audition(level) {
      this.ensureUiAudio(() => {
        const t = this.ctx.currentTime + 0.008;
        this._playVoiceAt(level, 1, t);
      });
    }

    auditionConcert(levels) {
      if (!levels || !levels.length) return;
      const subset = levels.slice(-10);
      this.ensureUiAudio(() => {
        const base = this.ctx.currentTime + 0.02;
        subset.forEach((lv, idx) => {
          this._playVoiceAt(lv, idx % 3 === 2 ? 2 : 1, base + idx * 0.165);
        });
      });
    }

    merge(level, combo) {
      if (!this.canPlay()) return;
      const c = this.ctx, t = Math.max(c.currentTime + .001, this.nextChime);
      this.nextChime = t + .042;
      this._playVoiceAt(level, combo, t);
      const g = this.duck.gain; g.cancelScheduledValues(t);
      g.setTargetAtTime(.80, t, .012);
      g.setTargetAtTime(1, t + .14, .10);
    }

    _playVoiceAt(level, combo, t) {
      const track = stageTracks[this.stage] || stageTracks.cartoon;
      const mat = skinFoley[this.skin] || skinFoley.cartoon;
      const v = charVoices[Math.max(0, Math.min(charVoices.length - 1, level))] || charVoices[0];
      const comboSemi = Math.min(5, Math.max(0, combo - 1));
      const hz = semiToHz(track.root, v.semi + (combo > 1 ? comboSemi : 0));

      if (v.kind === 'beatbox_kick') {
        this.beatboxKick(t, .32, this.effects);
        this.beatboxHat(t + .075, .11, this.effects);
      } else if (v.kind === 'water_bloop') {
        this.tone(hz * 0.72, hz * 1.42, t, .20, 'sine', .24, this.effects, .010);
      } else if (v.kind === 'funk_pluck') {
        this.pluckedTone(hz, t, .16, .22, 'guzheng', this.effects, false);
        this.pluckedTone(hz * 1.25, t + .06, .14, .16, 'guzheng', this.effects, false);
      } else if (v.kind === 'double_hop') {
        this.pluckedTone(hz, t, .15, .22, 'kalimba', this.effects, false);
        this.pluckedTone(hz * 1.25, t + .075, .18, .22, 'kalimba', this.effects, false);
      } else if (v.kind === 'soft_chime') {
        this.pluckedTone(hz, t, .28, .19, 'glassbell', this.effects, false);
      } else if (v.kind === 'conga_pop') {
        this.beatboxSnare(t, .24, this.effects);
        this.tone(hz * 1.35, hz * 0.85, t + .035, .15, 'triangle', .22, this.effects, .005);
      } else if (v.kind === 'chip_arpeggio') {
        [0, 4, 7].forEach((s, i) => this.pluckedTone(semiToHz(hz, s), t + i * .045, .11, .13, 'chip', this.effects, false));
      } else if (v.kind === 'bass_slide') {
        this.tone(hz * 1.3, hz, t, .24, 'triangle', .24, this.effects, .010);
        this.tone(hz * 0.5, hz * 0.5, t, .24, 'sine', .20, this.effects, .010);
      } else if (v.kind === 'rhodes_stab') {
        this.chordStab(hz, [0, 4, 7, 11], t, .34, .12, 'rhodes', this.effects);
      } else if (v.kind === 'harp_roll') {
        [0, 4, 7, 12].forEach((s, i) => this.pluckedTone(semiToHz(hz, s), t + i * .036, .26, .16, 'guzheng', this.effects, false));
      } else if (v.kind === 'brass_stab') {
        this.pluckedTone(hz, t, .28, .22, 'synth', this.effects, false);
        this.pluckedTone(hz * 1.5, t + .02, .24, .14, 'synth', this.effects, false);
      } else if (v.kind === 'blues_slide') {
        this.tone(hz * 0.94, hz * 1.12, t, .24, 'sine', .24, this.effects, .014);
        this.pluckedTone(hz * 1.5, t + .07, .22, .14, 'kalimba', this.effects, false);
      } else if (v.kind === 'musicbox_duo') {
        this.pluckedTone(hz, t, .26, .18, 'glassbell', this.effects, false);
        this.pluckedTone(hz * 0.75, t + .07, .24, .16, 'glassbell', this.effects, false);
      } else if (v.kind === 'taiko_double') {
        this.beatboxKick(t, .34, this.effects);
        this.beatboxKick(t + .095, .28, this.effects);
      } else if (v.kind === 'sunny_triad') {
        this.chordStab(hz, [0, 4, 7], t, .32, .14, 'rhodes', this.effects);
      } else if (v.kind === 'wood_flute') {
        this.tone(hz * 0.96, hz, t, .28, 'sine', .22, this.effects, .032);
        this.noiseTap(t, .035, 2200, .10, this.effects, 3.0);
      } else if (v.kind === 'robot_trill') {
        this.pluckedTone(hz, t, .11, .18, 'synth', this.effects, false);
        this.pluckedTone(hz * 1.25, t + .08, .14, .18, 'synth', this.effects, false);
      } else if (v.kind === 'guitar_strum') {
        [0, 4, 7].forEach((s, i) => this.pluckedTone(semiToHz(hz, s), t + i * .025, .28, .16, 'guzheng', this.effects, false));
      } else if (v.kind === 'sub_cello') {
        this.tone(hz, hz * 1.01, t, .34, 'triangle', .28, this.effects, .022);
        this.tone(hz * 2, hz * 2, t + .02, .28, 'sine', .14, this.effects, .02);
      } else {
        this.chordStab(hz, [0, 4, 7, 11, 14], t, .44, .14, 'rhodes', this.effects);
        this.pluckedTone(hz * 2, t + .05, .38, .16, 'glassbell', this.effects, false);
      }

      if (mat.shimmer > 0) {
        this.tone(hz * 2, hz * 2, t + .02, .16, 'sine', mat.shimmer * .7, this.effects, .01);
      }
    }
  }

  class Haptics {
    constructor() { this.queue = []; this.timer = 0; }
    get supported() { return typeof navigator.vibrate === 'function'; }
    pulse(level, combo) {
      if (!this.supported || document.hidden) return;
      const strength = Math.min(40, 16 + level * 1.2);
      this.queue.push(combo > 1 ? [Math.round(strength), 22, 14] : Math.round(strength));
      this.play();
    }
    play() {
      if (this.timer || !this.queue.length) return;
      const pattern = this.queue.shift();
      try { navigator.vibrate(pattern); } catch { this.queue = []; return; }
      const duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
      this.timer = setTimeout(() => { this.timer = 0; this.play(); }, duration + 17);
    }
    stop() { clearTimeout(this.timer); this.timer = 0; this.queue.length = 0; if (this.supported) try { navigator.vibrate(0); } catch {} }
  }

  Jelly.Band = Band;
  Jelly.Haptics = Haptics;
})();
