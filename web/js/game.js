'use strict';

(() => {
  const { W, H, DT, TAU, WARNING_Y, FLOOR_PAD, crew, clamp, art, World, Band } = Jelly;
  const canvas = document.getElementById('play'), c = canvas.getContext('2d');
  const under = document.getElementById('underlay'), bg = under.getContext('2d'), skins = document.getElementById('skins');
  const layer = new art.SkinLayer(skins), band = new Band(), pulses = new Jelly.Haptics();
  const profile = new Jelly.club.Progress();

  function applyVisualTheme() {
    art.setSkin(profile.skin);
    art.setStage(profile.activeStage);
    band.setTheme(profile.skin, profile.activeStage);
    document.body.dataset.skin = profile.skin;
    document.body.dataset.stage = profile.activeStage;
  }
  applyVisualTheme();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const homes = [68, 200, 332], rackY = 52;
  const BEAT_PERIOD = 60 / 112; // 112 BPM global beat ring pulse

  const state = {
    phase: 'home', mode: profile.mode, levelObj: null,
    score: 0, best: profile.modeBest[profile.mode] || profile.stats.record,
    hasRun: false, slots: [], choice: 1, shots: 0, time: 0, elapsed: 0, lastFireTime: -10, bag: [], drag: null,
    combo: 0, maxCombo: 0, maxLevel: 0, lastMerge: -10, over: 0,
    timeLeft: 0, freezeLeft: 0, doubleLeft: 0, lastTickSec: -1, lastHudSec: -1,
    // Mode-specific states
    iceBroken: 0,
    orders: [], ordersDone: 0,
    endlessTier: 0, endlessFrostTimer: 22, pressRetreat: 0, floorRetreat: 0,
    crushQueue: [], crushSwelling: [], crushTimer: 0, crushDoneWait: 0,
    activeProp: null, revived: false, extended: false, doubledCoins: false, earnedCoins: 0, clearStars: 0,
    emergencyUsed: false, emergencyVisible: false,
    newCharTimer: 0, newCharPending: false,
    showTutorial: false,
    fx: [], rings: [], labels: [], bridges: [], shake: 0, encore: false, finish: null
  };

  const world = new World(onPhysics);
  let menuOrigin = 'home';
  const panels = [];

  Jelly.ads.onReward(({ message }) => {
    band.reward();
    hud.toast(message, 'video');
    hud.syncHome(state.hasRun);
    hud.syncProps(state.activeProp, state.mode);
  });

  const setSound = on => { band.enable(on); hud.audio(on); };
  const setShowNumbers = on => {
    profile.setShowNumbers(on);
    hud.syncNumToggle(on);
    if (state.slots.length) render(state.time, 1);
  };

  const hud = new Jelly.UI.HUD({
    panel: openPanel,
    dismiss,
    restart: () => restart(false),
    home: goHome,
    start,
    setShowNumbers,
    toggleNumbers() {
      const next = !profile.showNumbers;
      setShowNumbers(next);
      hud.toast(next ? '已显示角色数字' : '已隐藏角色数字', next ? 'num' : 'num_off');
    },
    pokeMascot() { band.prop('wild'); },
    previewSkinSound(skinKey) { band.previewSkin(skinKey); },
    playBandNote(level) { band.audition(level); },
    playBandConcert(levels) {
      if (!levels || !levels.length) return;
      hud.toast(`已解锁的 ${levels.length} 位角色开始合奏试听！`, 'music');
      band.auditionConcert(levels);
    },
    spinWheel(isAd) {
      const exec = () => {
        const res = profile.spinWheel(isAd);
        if (!res) return;
        band.prop('wild');
        hud.animateWheelTo(res.idx, () => {
          band.reward();
          hud.badgesEarned(res.earned);
          hud.toast(`恭喜抽中：${res.text}！`, res.prize.icon || 'wheel');
          hud.syncHome(state.hasRun);
          hud.open('wheel', state);
        });
      };
      if (isAd) Jelly.ads.watch('wheel_spin', exec);
      else exec();
    },
    claimDailyQuest(id) {
      const rewardText = profile.claimDailyQuest(id);
      if (rewardText) {
        band.reward();
        hud.toast(`任务完成！获得 ${rewardText}`, 'gift');
        hud.syncHome(state.hasRun);
        hud.open('checkin', state);
      }
    },
    claimDailyChest(isDouble) {
      const exec = () => {
        const summary = profile.claimDailyChest(isDouble);
        if (!summary) return;
        if (!isDouble) { band.reward(); hud.toast(`开启今日大宝箱：${summary}！`, 'chest'); }
        hud.syncHome(state.hasRun);
        hud.open('checkin', state);
      };
      if (isDouble) {
        Jelly.ads.watch('quest_chest_2x', () => { hud.badgesEarned(profile.recordAdWatch()); exec(); });
      } else {
        exec();
      }
    },
    comebackRestart() {
      Jelly.ads.watch('comeback_wild', () => {
        hud.badgesEarned(profile.recordAdWatch());
        restart(true);
      });
    },
    emergencySave() {
      if (state.emergencyUsed || state.phase !== 'playing') return;
      Jelly.ads.watch('emergency_save', () => {
        state.emergencyUsed = true;
        state.emergencyVisible = false;
        hud.showEmergencySave(false);
        hud.badgesEarned(profile.recordAdWatch());
        const removed = world.clearTop(2);
        for (const b of removed) {
          state.rings.push({ x: b.x, y: b.y, t: 0, d: .45, r: b.r + 18, color: '#ff8a8a', flat: .9 });
          for (let i = 0; i < 6; i++) speck(b.x, b.y, rand(-90, 90), rand(-90, 40), '#ffe4a6', .4, 2.3, 'star');
        }
        if (world.pressY > WARNING_Y + 4) state.pressRetreat += 55;
        if (world.floorRise > 0) state.floorRetreat += 40;
        state.over = 0;
        hud.danger(false);
        hud.cheer('紧急救场！');
      });
    },
    claimNewCharDouble() {
      if (!state.newCharPending || state.phase !== 'playing') return;
      Jelly.ads.watch('new_char_2x', () => {
        state.newCharPending = false;
        state.newCharTimer = 0;
        hud.showNewCharBanner('');
        profile.addCoins(50);
        hud.badgesEarned(profile.recordAdWatch());
      });
    },
    replayTutorial() {
      profile.tutorialDone = false;
      profile.persist();
      state.showTutorial = true;
      if (state.phase === 'modal' && menuOrigin === 'playing') dismiss();
      else restart(false);
    },
    selectMode(mode) {
      if (state.mode !== mode) state.hasRun = false;
      profile.setMode(mode);
      state.mode = mode;
      state.best = profile.modeBest[mode] || profile.stats.record;
      hud.syncHome(state.hasRun);
    },
    playLevel(levelId) {
      profile.setMode('campaign');
      profile.setLevel(levelId);
      state.mode = 'campaign';
      restart(false);
    },
    wear(skin) {
      if (!profile.wear(skin)) return;
      applyVisualTheme();
      hud.syncHome(state.hasRun);
      if (state.slots.length) render(state.time, 1);
      dismiss();
    },
    wearStage(stageId) {
      if (!profile.setStage(stageId)) return;
      applyVisualTheme();
      hud.syncHome(state.hasRun);
      if (state.slots.length) render(state.time, 1);
      dismiss();
    },
    adUnlockSkin(skin) {
      Jelly.ads.watch('unlock_skin', () => {
        hud.badgesEarned(profile.recordAdWatch());
        hud.badgesEarned(profile.unlockSkin(skin));
        profile.wear(skin);
        applyVisualTheme();
        hud.open('skins', state);
      }, `已免费解锁「${art.themes[skin].name}」！`);
    },
    buySkin(skin) {
      const cat = Jelly.club.skinCatalog[skin];
      if (!profile.spendCoins(cat.coins)) {
        hud.toast(`音符币不足（需 ${cat.coins}），点左侧免费立刻解锁！`, 'coin');
        return;
      }
      hud.badgesEarned(profile.unlockSkin(skin));
      profile.wear(skin);
      applyVisualTheme();
      band.reward();
      hud.toast(`已解锁并穿戴「${art.themes[skin].name}」！`, 'layers');
      hud.open('skins', state);
    },
    adUnlockStage(stageId) {
      Jelly.ads.watch('unlock_stage', () => {
        hud.badgesEarned(profile.recordAdWatch());
        profile.unlockStage(stageId);
        profile.setStage(stageId);
        applyVisualTheme();
        hud.open('skins', state);
      }, `已免费解锁「${art.themes[stageId].stage}」！`);
    },
    buyStage(stageId) {
      const cat = Jelly.club.stageCatalog[stageId];
      if (!profile.spendCoins(cat.coins)) {
        hud.toast(`音符币不足（需 ${cat.coins}），点左侧免费立刻解锁！`, 'coin');
        return;
      }
      profile.unlockStage(stageId);
      profile.setStage(stageId);
      applyVisualTheme();
      band.reward();
      hud.toast(`已解锁舞台「${art.themes[stageId].stage}」！`, 'layers');
      hud.open('skins', state);
    },
    claimCheckin(isDouble) {
      const exec = () => {
        const res = profile.performCheckin(isDouble);
        if (!res) return;
        hud.badgesEarned(res.earned);
        if (!isDouble) { band.reward(); hud.toast(`签到成功：${res.summary}`, 'gift'); }
        hud.syncHome(state.hasRun);
        hud.open('checkin', state);
      };
      if (isDouble) {
        Jelly.ads.watch('checkin_2x', () => { hud.badgesEarned(profile.recordAdWatch()); exec(); });
      } else {
        exec();
      }
    },
    simulateNextDay() {
      profile.simulateNextDay();
      hud.syncHome(state.hasRun);
      hud.open('checkin', state);
    },
    claimBadge(id) {
      const reward = profile.claimBadge(id);
      if (reward > 0) {
        band.reward();
        hud.toast(`已领取 +${reward} 音符币！`, 'coin');
        hud.syncHome(state.hasRun);
        hud.open('badges', state);
      }
    },
    freeCoins() {
      Jelly.ads.watch('free_coins', () => {
        profile.addCoins(150);
        hud.badgesEarned(profile.recordAdWatch());
      });
    },
    triggerProp(propId) {
      if (state.phase !== 'playing') return;
      if (propId === 'hammer' && state.activeProp === 'hammer') {
        state.activeProp = null;
        hud.syncProps(null, state.mode);
        hud.floatTip('');
        return;
      }
      if ((profile.props[propId] || 0) <= 0) {
        Jelly.ads.watch('prop_' + propId, () => {
          profile.addProp(propId, 1);
          hud.badgesEarned(profile.recordAdWatch());
          activateProp(propId);
        });
      } else {
        activateProp(propId);
      }
    },
    adRevive() {
      Jelly.ads.watch('revive', () => {
        hud.badgesEarned(profile.recordAdWatch());
        const removed = world.clearTop(4);
        for (const b of removed) {
          state.rings.push({ x: b.x, y: b.y, t: 0, d: .42, r: b.r + 16, color: '#def986', flat: .9 });
          for (let i = 0; i < 5; i++) speck(b.x, b.y, rand(-80, 80), rand(-80, 40), '#fff3cf', .38, 2.2, 'star');
        }
        // Fully restore top bar and rising floor back to their normal positions
        if (world.pressY > 0) world.pressY = WARNING_Y + 2;
        world.floorRise = 0;
        state.pressRetreat = 0;
        state.floorRetreat = 0;
        state.over = 0; state.revived = true; state.hasRun = true;
        hud.danger(false); resume();
      }, '复活成功！上下横杆已恢复正常');
    },
    declineRevive() {
      state.revived = true;
      hud.close(); panels.length = 0;
      state.phase = 'playing';
      startCrushSequence();
    },
    adExtendTime(extraSec = 30) {
      Jelly.ads.watch('add_time', () => {
        hud.badgesEarned(profile.recordAdWatch());
        state.timeLeft += extraSec; state.extended = true; state.hasRun = true; state.lastTickSec = -1;
        resume();
      }, `倒计时已 +${extraSec} 秒！`);
    },
    adDoubleCoins() {
      if (state.doubledCoins || state.earnedCoins <= 0) return;
      Jelly.ads.watch('double_coins', () => {
        profile.addCoins(state.earnedCoins);
        state.doubledCoins = true;
        hud.badgesEarned(profile.recordAdWatch());
        hud.open(hud.page, state);
      }, `已双倍领取 +${state.earnedCoins} 音符币！`);
    },
    encore: () => { state.encore = true; resume(); },
    sound: () => setSound(!band.on),
    setSound,
    setMusic: on => band.musicEnabled(on),
    setVibration: on => { profile.vibrate(on); if (!on) pulses.stop(); else pulses.pulse(1, 1); },
    options: () => ({ sound: band.on, music: band.musicOn, vibration: profile.haptics, showNumbers: profile.showNumbers, supported: pulses.supported })
  }, profile);

  let height = H, ratioX = 1, ratioY = 1, last = 0, accumulator = 0, keyAngle = 0, keyMarker = false;
  const rand = (a, b) => a + Math.random() * (b - a);

  function phase(value) {
    state.phase = value;
    document.body.dataset.state = value;
    band.active(value === 'playing' && !document.hidden, value === 'end');
    last = 0; accumulator = 0;
  }

  function nextOrderLevel(existing) {
    const base = Math.min(7, 3 + Math.floor(state.ordersDone / 3));
    const pool = [base, Math.min(8, base + 1), Math.max(3, base - 1)];
    for (const lv of pool) if (!existing.includes(lv)) return lv;
    return base;
  }

  function activateProp(propId) {
    if (propId === 'hammer') {
      if (!world.bodies.length && !(world.boss && world.boss.hp > 0)) { hud.toast('场上还没有目标哦', 'hammer'); return; }
      state.activeProp = 'hammer';
      hud.syncProps('hammer', state.mode);
      hud.floatTip('点任意果冻消除/破冰，或直接敲击音箱Boss！');
      return;
    }
    const badges = profile.useProp(propId);
    if (!badges) return;
    hud.badgesEarned(badges);
    band.prop(propId);

    if (propId === 'shake') {
      world.shakeAll();
      state.shake = reduced ? 0 : 3.0;
      hud.cheer('晃一晃！');
      for (let i = 0; i < 10; i++) speck(rand(40, W - 40), rand(220, height - 40), rand(-70, 70), rand(-110, -25), '#e5ff9c', .45, 2.4, 'star');
    } else if (propId === 'wild') {
      const idx = state.choice;
      state.slots[idx].wild = true;
      state.slots[idx].born = state.time;
      hud.queue(state.slots);
      hud.cheer('彩虹球就位！');
      state.rings.push({ x: state.slots[idx].x, y: rackY, t: 0, d: .42, r: 42, color: '#ffffff', flat: .85 });
    } else if (propId === 'freeze') {
      if (state.mode === 'endless') {
        state.freezeLeft = 12;
        state.doubleLeft = 12;
        hud.cheer('冻住横杆 + 双倍分！');
      } else if (JellyModes[state.mode].timed || state.mode === 'press') {
        state.freezeLeft = 15;
        hud.cheer(state.mode === 'press' ? '压板冻住啦！' : '时间冻住啦！');
      } else {
        state.doubleLeft = 12;
        hud.cheer('双倍得分！');
      }
    } else if (propId === 'lift') {
      if (world.pressY <= WARNING_Y + 4 && world.floorRise <= 2) {
        profile.addProp('lift', 1); // refund if bar is already at top
        hud.toast('横杠已经在最高处啦！', 'lift');
        hud.syncProps(state.activeProp, state.mode);
        return;
      }
      state.pressRetreat = Math.min(180, state.pressRetreat + 115);
      if (world.floorRise > 0) state.floorRetreat = Math.min(120, state.floorRetreat + 65);
      state.over = 0;
      hud.danger(false);
      hud.cheer('强力抬杠！');
      band.prop('wild');
      for (let i = 0; i < 12; i++) speck(rand(35, W - 35), Math.max(WARNING_Y + 10, world.pressY), rand(-40, 40), rand(-150, -60), '#ffe066', .45, 2.5, 'star');
    }
    hud.syncProps(state.activeProp, state.mode);
  }

  function restart(withWildStart = false) {
    cancelDrag(); hud.close(); panels.length = 0; state.hasRun = true; hud.home(false, true);
    const mode = 'endless';

    Object.assign(state, {
      mode, levelObj: null,
      score: 0, best: profile.modeBest.endless || profile.stats.record,
      choice: 1, shots: 0, time: 0, elapsed: 0, lastFireTime: -10, combo: 0, maxCombo: 0, maxLevel: 0, lastMerge: -10, over: 0,
      timeLeft: 0, freezeLeft: 0, doubleLeft: 0, lastTickSec: -1, lastHudSec: -1,
      iceBroken: 0, orders: [], ordersDone: 0,
      endlessTier: 0, endlessFrostTimer: 22, pressRetreat: 0, floorRetreat: 0,
      crushQueue: [], crushSwelling: [], crushTimer: 0, crushDoneWait: 0,
      activeProp: null, revived: false, extended: false, doubledCoins: false, earnedCoins: 0, clearStars: 0,
      emergencyUsed: false, emergencyVisible: false,
      newCharTimer: 0, newCharPending: false,
      showTutorial: !profile.tutorialDone,
      shake: 0, encore: false, finish: null
    });

    state.slots = [2, 0, 3].map((level, i) => ({
      level, wild: withWildStart && i === 1, x: homes[i], born: -1, readyAt: 0, view: art.makeView(level)
    }));
    state.bag = []; state.fx = []; state.rings = []; state.labels = []; state.bridges = [];
    keyAngle = 0; keyMarker = false;
    band.setFever(false);
    applyVisualTheme();
    hud.resetFx();

    world.seed('standard', { pressSpeed: 2.8, pressPush: 24 });

    hud.score(0, state.best);
    hud.queue(state.slots);
    hud.syncProps(null, mode);
    hud.syncNumToggle(profile.showNumbers);
    hud.updateTimer(0, false, false);
    hud.updateGoalBar(mode, null, state, world);
    phase('playing');
    band.unlock();
    canvas.focus({ preventScroll: true });
  }

  function openPanel(page) {
    if (state.phase === 'end' && !['skins', 'settings', 'checkin', 'wheel', 'badges', 'levels', 'help', 'guide'].includes(page)) return;
    if (state.phase !== 'modal') { menuOrigin = state.phase; panels.length = 0; cancelDrag(); phase('modal'); }
    if (panels.at(-1) !== page) panels.push(page);
    hud.open(page, state);
  }

  function start() {
    if (state.hasRun && state.mode === profile.mode) resume();
    else restart(false);
  }

  function goHome() {
    if (hud.page === 'milestone') state.encore = true;
    cancelDrag(); hud.close(); panels.length = 0; state.activeProp = null;
    phase('home'); hud.home(true, state.hasRun);
    document.getElementById('start').focus({ preventScroll: true });
  }

  function resume() {
    hud.close(); panels.length = 0; hud.home(false, true); phase('playing');
    hud.syncProps(state.activeProp, state.mode);
    band.unlock(); canvas.focus({ preventScroll: true });
  }

  function dismiss() {
    if (state.phase !== 'modal') return;
    panels.pop();
    if (panels.length) { hud.open(panels.at(-1), state); return; }
    if (menuOrigin === 'home') goHome(); else resume();
  }

  function startCrushSequence() {
    if (state.phase !== 'playing') return;
    cancelDrag();
    state.activeProp = null;
    hud.danger(false);
    hud.showEmergencySave(false);
    hud.floatTip('');
    hud.cheer('挤爆啦！！');
    world.allowMerge = false;
    state.crushQueue = [...world.bodies].sort((a, b) => a.y - b.y);
    state.crushSwelling = [];
    for (const b of world.bodies) { b.hit = 1.5; b.swell = 0; }
    state.crushTimer = 0.06;
    state.crushDoneWait = 0.28;
    phase('crushing');
  }

  function tickCrushing() {
    state.time += DT;
    // Fast dramatic squeeze from bar + floor
    if (world.pressY > WARNING_Y) world.pressY = Math.min(height - 90, world.pressY + 55 * DT);
    for (const b of world.bodies) {
      b.hit = 1.2;
      if (Math.random() < 0.10) b.pulse(rand(-1, 1), rand(-1, 1), 3.8);
    }
    // Rapid-fire overlapping chain-pop wave!
    state.crushTimer -= DT;
    if (state.crushTimer <= 0 && state.crushQueue.length) {
      while (state.crushQueue.length && !world.bodies.includes(state.crushQueue[0])) state.crushQueue.shift();
      if (state.crushQueue.length) {
        const next = state.crushQueue.shift();
        next.swell = 0.01;
        state.crushSwelling.push(next);
        state.crushTimer = Math.max(0.024, 0.048 - (18 - Math.min(18, state.crushQueue.length)) * 0.0014);
      }
    }
    for (let idx = state.crushSwelling.length - 1; idx >= 0; idx--) {
      const target = state.crushSwelling[idx];
      target.swell = Math.min(1, (target.swell || 0) + DT * 14.0);
      if (target.swell >= 1) {
        state.crushSwelling.splice(idx, 1);
        const d = crew[target.level] || crew[0];
        world.removeBody(target);
        band.hit(520, target.level);
        state.shake = reduced ? 0 : 4.2;
        state.rings.push({ x: target.x, y: target.y, t: 0, d: .36, r: target.r * 1.9 + 18, color: d.light, flat: .95 });
        state.rings.push({ x: target.x, y: target.y, t: 0, d: .28, r: target.r * 1.3 + 10, color: '#ffffff', flat: .92 });
        const words = ['啵!', '噗!', '啪!', '挤爆!'];
        state.labels.push({
          x: clamp(target.x, 38, W - 38), y: clamp(target.y, 64, height - 40),
          text: words[target.id % words.length], t: 0, d: .52, color: d.light
        });
        for (let i = 0; i < 14; i++) {
          const a = i * TAU / 14 + rand(-.12, .12), spd = rand(85, 210);
          speck(target.x, target.y, Math.cos(a) * spd, Math.sin(a) * spd - 38, i % 3 === 0 ? '#ffffff' : d.color, rand(.28, .48), rand(2.2, 4.0), i % 2 === 0 ? 'star' : 'dot');
        }
      }
    }
    if (!state.crushQueue.length && !state.crushSwelling.length) {
      state.crushDoneWait -= DT;
      if (state.crushDoneWait <= 0) {
        state.phase = 'playing';
        end('loss');
        return;
      }
    }
    for (const p of state.fx) { p.t += DT; p.x += p.vx * DT; p.y += p.vy * DT; p.vy += 150 * DT; }
    for (const list of [state.rings, state.labels, state.bridges]) for (const p of list) p.t += DT;
    for (const list of [state.fx, state.rings, state.labels, state.bridges]) for (let i = list.length - 1; i >= 0; i--) if (list[i].t >= list[i].d) list.splice(i, 1);
    state.shake = Math.max(0, state.shake - DT * 7);
  }

  function end(page) {
    if (state.phase !== 'playing') return;
    band.setFever(false); world.magnet = false;
    if (page !== 'milestone') state.hasRun = false;

    profile.recordModeScore('endless', state.score);
    hud.badgesEarned(profile.recordSurvival(state.elapsed));
    state.best = profile.modeBest.endless || profile.stats.record;

    if (page === 'win') {
      state.earnedCoins = Math.max(40, Math.min(300, Math.round(state.score / 18)));
      profile.addCoins(state.earnedCoins);
      band.win();
    } else if (page === 'loss') {
      state.earnedCoins = Math.max(10, Math.min(100, Math.round(state.score / 40)));
      profile.addCoins(state.earnedCoins);
      band.fail();
    }

    cancelDrag(); phase('end'); hud.open(page, state);
  }

  // Smart bag generator: in Endless mode, widens tier spread & applies anti-freebie weighting at 3 / 6 / 8 min
  function replacement(index) {
    if (!state.bag.length) {
      if (state.mode === 'endless' && state.endlessTier >= 3) {
        state.bag = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7];
      } else if (state.mode === 'endless' && state.endlessTier === 2) {
        state.bag = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6];
      } else if (state.mode === 'endless' && state.endlessTier === 1) {
        state.bag = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5];
      } else {
        state.bag = [0, 0, 0, 1, 1, 2, 2, 3, 3];
        if (state.shots >= 5) state.bag.push(4);
        if (state.shots >= 16) state.bag.push(5);
      }
      for (let i = state.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
      }
    }
    const current = state.slots[index].level;
    const others = state.slots.filter((_, i) => i !== index).map(s => s.level);

    // At Endless 3m+, avoid handing exact freebie matches for the top-most jellies
    if (state.mode === 'endless' && state.endlessTier >= 1 && world.bodies.length > 4) {
      const topLevels = [...world.bodies].sort((a, b) => a.top - b.top).slice(0, 3).map(b => b.level);
      const hardIdx = state.bag.findIndex(n => n !== current && !others.includes(n) && !topLevels.includes(n));
      if (hardIdx >= 0) return state.bag.splice(hardIdx, 1)[0];
    }

    let i = state.bag.findIndex(n => n !== current && !others.includes(n));
    if (i < 0) i = state.bag.findIndex(n => !others.includes(n));
    return state.bag.splice(Math.max(0, i), 1)[0];
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * height / r.height };
  }

  function canFireSlot(i) {
    if (i < 0 || i > 2 || state.phase !== 'playing' || !state.slots[i]) return false;
    const slot = state.slots[i];
    if (state.time < (slot.readyAt || 0)) return false;
    if (state.time - state.lastFireTime < 0.16) return false;
    const r = slot.wild ? 27 : crew[slot.level].r;
    for (let k = 0; k < world.bodies.length; k++) {
      const b = world.bodies[k];
      if (Math.hypot(b.x - slot.x, b.y - rackY) < (b.r + r) * 1.15) return false;
    }
    return true;
  }

  function directSlot(p) {
    return homes.findIndex((x, i) => {
      const r = state.slots[i].wild ? 28 : crew[state.slots[i].level].r;
      return ((p.x - x) / Math.max(32, r * 1.28)) ** 2 + ((p.y - rackY) / Math.max(30, r * 1.28)) ** 2 <= 1;
    });
  }

  function updateAim(p) {
    const d = state.drag; if (!d || d.key) return;
    const down = p.y - d.start.y, side = p.x - d.start.x;
    d.travel = Math.max(d.travel, Math.hypot(side, down));
    if (down >= 5) d.engaged = true;
    d.valid = d.engaged && down >= 3.5;
    if (!d.valid) return;
    const span = clamp((height - d.start.y) * .82, 42, 120);
    d.power = clamp((down - 3.5) / span, 0, 1);
    d.angle = clamp(Math.atan2(side, Math.max(11, down)), -1.20, 1.20);
    state.choice = d.slot;
  }

  function cancelDrag() {
    const d = state.drag; state.drag = null; canvas.classList.remove('is-held');
    if (d?.id !== undefined && canvas.hasPointerCapture?.(d.id)) canvas.releasePointerCapture(d.id);
  }

  function slotPose(index, t) {
    const s = state.slots[index], d = state.drag?.slot === index && (state.drag.valid || state.drag.key) ? state.drag : null;
    const progress = clamp((t - s.born) / .28, 0, 1);
    const pop = 1 - (1 - progress) ** 3, move = d?.valid ? 42 * d.power : 0;
    const baseR = s.wild ? 27 : crew[s.level].r;
    const r = baseR * (.82 + .18 * pop), a = d?.angle || 0;
    const y = rackY - 30 * (1 - pop) + (d ? 0 : Math.sin(t * 2.6 + index * 2.11) * 1.4) + Math.cos(a) * move;
    return art.pose(s.view, s.level, s.x + Math.sin(a) * move, y, r, t, {
      seed: 2 + index * 1.64, wild: s.wild,
      mode: d ? 'aim' : 'idle', angle: a, stretch: d ? (d.valid ? .44 * d.power : -.12) : (1 - pop) * .24
    });
  }

  function isOnBeat(t) {
    const ph = (t % BEAT_PERIOD) / BEAT_PERIOD;
    return Math.min(ph, 1 - ph) < 0.16;
  }

  function fire() {
    const d = state.drag; if (!d) return;
    if (!d.valid || !canFireSlot(d.slot)) { cancelDrag(); return; }
    const slot = state.slots[d.slot], view = slotPose(d.slot, state.time);
    const dx = Math.sin(d.angle), dy = Math.cos(d.angle), speed = d.drop ? 54 : 168 + 640 * d.power;
    const level = slot.level, isWild = !!slot.wild;
    const beatHit = state.shots > 0 && isOnBeat(state.time);
    const b = world.add(level, view.x, view.y, dx * speed, dy * speed, { dx, dy, scale: d.drop ? 1.015 : 1.08 + .32 * d.power }, isWild);
    b.beatBoost = beatHit;
    b.trail = [];
    state.shots++;
    state.lastFireTime = state.time;
    if (state.showTutorial) { state.showTutorial = false; profile.markTutorialDone(); }
    slot.level = replacement(d.slot);
    slot.wild = false;
    slot.born = state.time;
    slot.readyAt = state.time + 0.30;
    hud.queue(state.slots); band.fire(d.power, level);
    state.rings.push({ x: slot.x, y: beatHit ? view.y : 15, t: 0, d: beatHit ? .36 : .26, r: beatHit ? 48 : 30, color: beatHit ? '#ffe852' : isWild ? '#ffffff' : crew[level].light, flat: beatHit ? .92 : .21 });
    if (beatHit) {
      state.labels.push({ x: clamp(view.x, 42, W - 42), y: view.y + 18, text: '节拍!', t: 0, d: .55, color: '#ffe852' });
    }
    for (let i = 0; i < (beatHit ? 7 : 4); i++) speck(slot.x + rand(-8, 8), 26, rand(-52, 52), rand(20, 80), beatHit ? '#ffe852' : isWild ? '#ffe98a' : crew[level].light, .28, beatHit ? 1.8 : 1.15, beatHit ? 'star' : 'dot');
    hud.badgesEarned(profile.shot(d.slot, profile.skin));
    cancelDrag();
  }

  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary || state.drag || state.phase !== 'playing') return;
    const p = point(e);
    if (state.activeProp === 'hammer') {
      // Allow Hammer to directly whack Boss or smash/thaw any jelly!
      if (world.boss && world.boss.hp > 0 && Math.hypot(p.x - world.boss.x, p.y - world.boss.y) <= world.boss.r * 1.18) {
        e.preventDefault();
        hud.badgesEarned(profile.useProp('hammer'));
        band.prop('hammer');
        world.damageBoss(35, world.boss.x, world.boss.y);
        state.shake = reduced ? 0 : 3.2;
        state.activeProp = null;
        hud.syncProps(null, state.mode);
        hud.floatTip('');
        return;
      }
      const target = world.bodyAt(p);
      if (target) {
        e.preventDefault();
        hud.badgesEarned(profile.useProp('hammer'));
        band.prop('hammer');
        if (target.frozen > 0) {
          world.crackIce(target, 2);
        } else {
          world.removeBody(target);
        }
        state.rings.push({ x: target.x, y: target.y, t: 0, d: .40, r: target.r + 16, color: '#ffe28a', flat: .92 });
        for (let i = 0; i < 9; i++) speck(target.x, target.y, rand(-95, 95), rand(-95, 50), crew[target.level].light, .38, 2.2, 'star');
        state.shake = reduced ? 0 : 2.2;
        state.activeProp = null;
        hud.syncProps(null, state.mode);
        hud.floatTip('');
      }
      return;
    }
    const head = directSlot(p);
    const col = head >= 0 ? head : clamp(Math.floor(p.x / (W / 3)), 0, 2);
    if (!canFireSlot(col)) return;
    e.preventDefault(); canvas.focus({ preventScroll: true }); band.unlock(); keyMarker = false;
    state.choice = col;
    state.drag = {
      id: e.pointerId, slot: col, start: p, started: performance.now(),
      travel: 0, engaged: false, canTap: true, valid: false, power: 0, angle: 0, key: false
    };
    canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('is-held');
  });

  canvas.addEventListener('pointermove', e => {
    if (state.phase !== 'playing') return;
    const p = point(e);
    if (state.drag?.id === e.pointerId) { e.preventDefault(); updateAim(p); }
    else if (e.pointerType === 'mouse') canvas.classList.toggle('is-near', p.y >= 0 && p.y <= height);
  });

  canvas.addEventListener('pointerup', e => {
    const d = state.drag; if (!d || d.id !== e.pointerId) return;
    e.preventDefault(); updateAim(point(e));
    if (d.canTap && !d.engaged && d.travel < 12 && performance.now() - d.started < 480) {
      d.angle = 0; d.power = 0; d.valid = true; d.drop = true;
    }
    fire();
  });

  for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, e => { if (state.drag?.id === e.pointerId) cancelDrag(); });
  canvas.addEventListener('pointerleave', () => canvas.classList.remove('is-near'));

  canvas.addEventListener('keydown', e => {
    if (state.phase !== 'playing') return;
    if (/^[1-3]$/.test(e.key) && !state.drag) { e.preventDefault(); state.choice = Number(e.key) - 1; keyMarker = true; return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); keyMarker = true; keyAngle = clamp(keyAngle + (e.key === 'ArrowRight' ? .105 : -.105), -1.16, 1.16);
      if (state.drag?.key) state.drag.angle = keyAngle; return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat && !state.drag && canFireSlot(state.choice)) {
        band.unlock(); keyMarker = true;
        state.drag = { key: true, slot: state.choice, since: state.time, angle: keyAngle, power: .12, valid: true };
      }
    }
  });
  canvas.addEventListener('keyup', e => { if (e.code === 'Space' && state.drag?.key) { e.preventDefault(); fire(); } });
  canvas.addEventListener('blur', () => { if (state.drag?.key) cancelDrag(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.phase === 'playing') { e.preventDefault(); openPanel('pause'); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.phase === 'playing' && (state.shots || state.drag)) openPanel('pause');
    band.active(!document.hidden && state.phase === 'playing'); last = 0; accumulator = 0;
  });
  window.addEventListener('blur', cancelDrag);

  function speck(x, y, vx, vy, color, d, size, kind = 'dot') {
    if (state.fx.length < 64) state.fx.push({ x, y, vx, vy, color, d, t: 0, size, kind, rot: rand(-.7, .7) });
  }

  function checkCampaignWin() {
    if (state.mode !== 'campaign' || !state.levelObj || state.finish) return;
    const lv = state.levelObj;
    if (lv.bossHp > 0) {
      if (world.boss && world.boss.hp <= 0) state.finish = 'stage_clear';
      return;
    }
    const scoreOk = !lv.targetScore || state.score >= lv.targetScore;
    const lvOk = !lv.targetLevel || state.maxLevel >= lv.targetLevel;
    const iceOk = !lv.targetIce || state.iceBroken >= lv.targetIce;
    if (scoreOk && lvOk && iceOk) state.finish = 'stage_clear';
  }

  function onPhysics(e) {
    if (e.type === 'merge') {
      const b = e.body, level = b.level, d = crew[level];
      state.combo = state.time - state.lastMerge < 1.55 ? state.combo + 1 : 1;
      state.lastMerge = state.time;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.maxLevel = Math.max(state.maxLevel, level);

      const mult = (state.doubleLeft > 0 ? 2 : 1) * (e.beatBoost ? 2 : 1);
      const gain = d.value * Math.min(5, state.combo) * mult;
      state.score += gain;
      if (state.score > state.best) state.best = state.score;

      // Smoothly lift top bar & gently lower rising floor by a small amount on every NEW merge!
      if (world.pressY > WARNING_Y + 2) {
        const basePush = state.mode === 'endless'
          ? Math.max(12, 22 - state.elapsed * 0.028)
          : (state.levelObj?.setup?.pressPush || 26);
        state.pressRetreat = Math.min(48, state.pressRetreat + basePush * (e.beatBoost ? 1.35 : 1));
      }
      if (world.floorRise > 0) {
        const baseDrop = Math.max(10, 18 - Math.max(0, state.elapsed - 180) * 0.025);
        state.floorRetreat = Math.min(42, state.floorRetreat + baseDrop * (e.beatBoost ? 1.35 : 1));
      }

      // 乐队点歌台 (Orders Mode): fulfill matching order & free board space!
      if (state.mode === 'orders') {
        const oIdx = state.orders.indexOf(level);
        if (oIdx >= 0) {
          world.removeBody(b);
          state.ordersDone++;
          state.timeLeft += 10;
          const bonus = 220 + level * 45;
          state.score += bonus;
          profile.addCoins(15);
          state.orders.splice(oIdx, 1);
          state.orders.push(nextOrderLevel(state.orders));
          if (state.ordersDone === 3 && state.orders.length < 3) state.orders.push(nextOrderLevel(state.orders));
          hud.cheer('上菜成功 +10秒！');
          state.rings.push({ x: e.x, y: e.y, t: 0, d: .5, r: b.r + 30, color: '#ffe052', flat: .95 });
          for (let i = 0; i < 12; i++) speck(e.x, e.y, rand(-110, 110), rand(-130, -20), '#ffe052', .48, 2.5, 'star');
        }
      }

      hud.score(state.score, state.best, true);
      hud.announce(d.name + '合成，得分' + state.score);
      if (e.wild) hud.cheer('彩虹进化！');
      else if (e.beatBoost) hud.cheer('节拍暴击 ×2！');
      else if (state.combo > 1) hud.cheer(state.combo + ' 连击' + (mult > 1 ? ' ×2' : ''));

      band.merge(level, state.combo);
      if (profile.haptics) pulses.pulse(level, state.combo);

      const mergeRes = profile.merge(level, state.combo, state.score);
      hud.badgesEarned(mergeRes.earned);

      if (mergeRes.isNewDiscovery) {
        profile.addCoins(50);
        state.newCharPending = true;
        state.newCharTimer = 6.5;
        hud.showNewCharBanner(d.name);
      }

      state.bridges.push({ x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y, body: b, r: e.a.r, color: crew[Math.min(crew.length - 1, e.a.level)].color, t: 0, d: .22 });
      state.rings.push({ x: e.x, y: e.y, t: 0, d: .40, r: b.r + (e.beatBoost ? 28 : 14), color: e.beatBoost ? '#ffe852' : d.light, flat: .88 });
      state.labels.push({ x: clamp(e.x, 34, W - 34), y: Math.max(54, e.y - 9), text: '+' + gain, t: 0, d: .80, color: mult > 1 ? '#ffe97d' : d.light });
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + rand(-.13, .13), speed = rand(35, 95);
        speck(e.x + Math.cos(a) * b.r * .65, e.y + Math.sin(a) * b.r * .55, Math.cos(a) * speed, Math.sin(a) * speed - 14,
          i % 2 === 0 ? d.light : '#fff3cf', rand(.28, .46), rand(1.6, 2.8), i % 3 === 0 ? 'star' : 'dot');
      }
      state.shake = reduced ? 0 : Math.min(2.4, 1.1 + state.combo * .20);
      hud.updateGoalBar(state.mode, state.levelObj, state, world);

      if (state.mode === 'campaign') checkCampaignWin();
      else if (level === crew.length - 1) state.finish = 'win';
      else if (state.mode === 'endless' && level === 10 && !state.encore) {
        state.encore = true;
        hud.cheer('合出 1024！');
        hud.toast('太棒啦！合出 1024，继续冲更高分！', 'trophy');
      }
    } else if (e.type === 'ice_break') {
      state.iceBroken++;
      band.prop('wild');
      state.rings.push({ x: e.x, y: e.y, t: 0, d: .42, r: e.body.r + 18, color: '#99f6ff', flat: .92 });
      for (let i = 0; i < 9; i++) speck(e.x, e.y, rand(-95, 95), rand(-100, 30), '#cffafe', .42, 2.4, 'star');
      hud.cheer('破冰解救！');
      hud.updateGoalBar(state.mode, state.levelObj, state, world);
      checkCampaignWin();
    } else if (e.type === 'ice_crack') {
      band.hit(240, 2);
      for (let i = 0; i < 5; i++) speck(e.x, e.y, rand(-65, 65), rand(-70, 20), '#e0f7ff', .32, 1.8, 'dot');
    } else if (e.type === 'bumper') {
      band.hit(340, 4);
      state.score += 15;
      hud.score(state.score, state.best);
      state.rings.push({ x: e.x, y: e.y, t: 0, d: .28, r: e.r + 16, color: '#ffe066', flat: .95 });
    } else if (e.type === 'boss_hit') {
      band.hit(420, 6);
      state.shake = reduced ? 0 : 2.6;
      state.labels.push({ x: clamp(e.x, 40, W - 40), y: Math.max(70, e.y - 16), text: '-' + e.dmg, t: 0, d: .72, color: '#ff7575' });
      state.rings.push({ x: world.boss.x, y: world.boss.y, t: 0, d: .36, r: world.boss.r + 22, color: '#ff8a8a', flat: .95 });
      hud.updateGoalBar(state.mode, state.levelObj, state, world);
    } else if (e.type === 'boss_defeat') {
      band.win();
      hud.cheer('音箱 Boss 击败！');
      for (let i = 0; i < 18; i++) speck(e.x, e.y, rand(-140, 140), rand(-150, 40), i % 2 ? '#ffe066' : '#ff7575', .55, 2.8, 'star');
      checkCampaignWin();
    } else {
      band.hit(e.speed, e.level || 0);
      if (e.speed > 215) {
        state.rings.push({ x: e.x, y: clamp(e.y, 6, height - 5), t: 0, d: .20, r: 9 + Math.min(10, e.speed * .016), color: '#fff1d9', flat: .86 });
      }
    }
  }

  function refreshSize() {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const pr = Math.min(window.devicePixelRatio || 1, 3), w = Math.round(rect.width * pr), h = Math.round(rect.height * pr);
    const newH = W * rect.height / rect.width; if (Math.abs(height - newH) > 2) cancelDrag();
    for (const surf of [canvas, skins, under]) { if (surf.width !== w) surf.width = w; if (surf.height !== h) surf.height = h; }
    c.imageSmoothingQuality = 'high'; bg.imageSmoothingQuality = 'high';
    height = newH; world.resize(height); ratioX = w / W; ratioY = h / height; hud.refresh(); hud.audio(band.on);
    if (state.slots.length) render(state.time, 1);
  }

  function freezeRandomEndlessJelly(layers) {
    const candidates = world.bodies.filter(b => b.landed && !b.wild && b.frozen <= 0 && b.y > WARNING_Y + 45);
    if (!candidates.length) return;
    // Prefer mid-to-upper jellies so freezing creates genuine tactical pressure
    candidates.sort((a, b) => a.y - b.y);
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(4, candidates.length)))];
    pick.setFrozen(layers);
    state.rings.push({ x: pick.x, y: pick.y, t: 0, d: .45, r: pick.r + 18, color: '#7dd3fc', flat: .95 });
    for (let i = 0; i < 6; i++) speck(pick.x, pick.y, rand(-60, 60), rand(-60, 20), '#bae6fd', .38, 2.0, 'star');
  }

  function tick() {
    state.time += DT;
    if (state.shots) {
      state.elapsed += DT;
      world.step();
    }

    if (state.freezeLeft > 0) state.freezeLeft = Math.max(0, state.freezeLeft - DT);
    if (state.doubleLeft > 0) {
      state.doubleLeft = Math.max(0, state.doubleLeft - DT);
    }
    if (state.newCharTimer > 0) {
      state.newCharTimer -= DT;
      if (state.newCharTimer <= 0) { state.newCharPending = false; hud.showNewCharBanner(''); }
    }

    // Dynamic Time-Morphing Terrain (Heart / Hourglass / Diamond / Bowl / Funnel)
    if (state.shots > 0 && state.freezeLeft <= 0) {
      if (state.mode === 'campaign' && state.levelObj?.terrain) {
        const total = Math.max(1, state.levelObj.time);
        const prog = clamp(1 - state.timeLeft / total, 0, 1);
        const smooth = prog * prog * (3 - 2 * prog);
        world.setTerrain(state.levelObj.terrain, smooth * 0.92);
      } else if (state.mode === 'orders') {
        const prog = clamp(1 - state.timeLeft / 75, 0, 1);
        const targetMorph = prog * 0.90;
        world.setTerrain('heart', world.terrainMorph + (targetMorph - world.terrainMorph) * DT * 2.5);
      } else if (state.mode === 'press') {
        const shapes = ['heart', 'hourglass', 'diamond', 'bowl'];
        const idx = Math.floor(state.elapsed / 35) % shapes.length;
        const local = (state.elapsed % 35) / 35;
        world.setTerrain(shapes[idx], clamp(Math.sin(local * Math.PI) * 0.92, 0.12, 0.92));
      } else if (state.mode === 'endless') {
        // Keep vertical walls clean in Endless so sloped terrain never causes accidental free merges
        world.setTerrain('none', 0);
      }
    }

    // Smooth gradual bar lift & floor drop queued by new merges (never snaps to top/bottom!)
    if (state.pressRetreat > 0) {
      const step = Math.min(state.pressRetreat, 48 * DT);
      state.pressRetreat -= step;
      world.pressY = Math.max(WARNING_Y + 2, world.pressY - step);
    }
    if (state.floorRetreat > 0) {
      const step = Math.min(state.floorRetreat, 40 * DT);
      state.floorRetreat -= step;
      world.floorRise = Math.max(0, world.floorRise - step);
    }

    // Continuous accelerating top bar + Rising Floor (starting at 3:00 in Endless)
    if (state.shots > 0 && state.freezeLeft <= 0) {
      let pressRate = 0;
      if (state.mode === 'campaign' && state.levelObj?.setup?.pressSpeed > 0) {
        pressRate = state.levelObj.setup.pressSpeed;
      } else if (state.mode === 'press') {
        pressRate = 5.8 + state.elapsed * 0.045;
      } else if (state.mode === 'endless') {
        if (world.pressY <= 0) world.pressY = WARNING_Y + 2;
        const el = state.elapsed;
        if (el < 120) pressRate = 2.8 + el * 0.020;
        else if (el < 240) pressRate = 5.2 + (el - 120) * 0.036;
        else if (el < 360) pressRate = 9.5 + (el - 240) * 0.055;
        else pressRate = 16.2 + (el - 360) * 0.045;

        // From 3:00 (180s) onward, bottom floor slowly rises upward; only merges gently lower it a bit
        if (el >= 180) {
          const over3 = el - 180;
          const floorRate = over3 < 180 ? (2.4 + over3 * 0.024) : (6.7 + (over3 - 180) * 0.022);
          const maxRise = Math.max(40, height - FLOOR_PAD - world.pressY - 125);
          world.floorRise = Math.min(maxRise, world.floorRise + floorRate * DT);
        }
      }
      if (pressRate > 0) {
        const beatPulse = isOnBeat(state.time) ? 1.32 : 0.90;
        const maxPress = height - FLOOR_PAD - world.floorRise - 120;
        world.pressY = Math.min(maxPress, world.pressY + pressRate * beatPulse * DT);
      }
    }

    // Hardcore Endless 3 / 6 / 8-minute difficulty escalation (zero physics feel change!)
    if (state.mode === 'endless' && state.shots > 0) {
      const nextTier = state.elapsed >= 480 ? 3 : state.elapsed >= 360 ? 2 : state.elapsed >= 180 ? 1 : 0;
      if (nextTier > state.endlessTier) {
        state.endlessTier = nextTier;
        state.bag.length = 0; // refresh bag immediately for new tier
        hud.badgesEarned(profile.recordSurvival(state.elapsed));
        const banners = ['', '3分钟 · 地板抬升！', '6分钟 · 冰封危机！', '8分钟 · 终极狂潮！'];
        hud.cheer(banners[nextTier]);
        hud.floatTip(nextTier === 1 ? '底部地板开始缓慢抬升，同时出现冰冻果冻！' : nextTier === 2 ? '厚冰降临！善用小锤子、晃一晃与抬杠顶住压力' : '终极狂潮！连续合成稳住上下横杆！', 3200);
        hud.updateGoalBar(state.mode, null, state, world);
      }
      if (state.endlessTier >= 1) {
        state.endlessFrostTimer -= DT;
        if (state.endlessFrostTimer <= 0) {
          if (state.endlessTier === 1) {
            state.endlessFrostTimer = 22;
            freezeRandomEndlessJelly(1);
          } else if (state.endlessTier === 2) {
            state.endlessFrostTimer = 15;
            freezeRandomEndlessJelly(2);
          } else {
            state.endlessFrostTimer = 11;
            freezeRandomEndlessJelly(2);
            if (world.bodies.length > 8) freezeRandomEndlessJelly(1);
          }
        }
      }
    }

    // Periodic HUD clock refresh for non-timed modes (press / endless)
    const hudSec = Math.floor(state.elapsed);
    if ((state.mode === 'press' || state.mode === 'endless') && hudSec !== state.lastHudSec) {
      state.lastHudSec = hudSec;
      hud.updateGoalBar(state.mode, state.levelObj, state, world);
    }

    const timed = JellyModes[state.mode].timed;
    if (timed && state.shots > 0 && state.freezeLeft <= 0 && !state.finish) {
      state.timeLeft = Math.max(0, state.timeLeft - DT);
      const sec = Math.ceil(state.timeLeft);
      if (sec !== state.lastTickSec) {
        state.lastTickSec = sec;
        hud.updateTimer(state.timeLeft, false, true);
        if (sec > 0 && sec <= 10) band.tickWarn(sec <= 5);
      }
      if (state.timeLeft <= 0) state.finish = state.mode === 'campaign' ? 'timeout' : 'mode_end';
    } else if (timed) {
      hud.updateTimer(state.timeLeft, state.freezeLeft > 0, true);
    }

    for (const b of world.bodies) {
      if (!b.trail) continue;
      if (b.landed) { if (b.trail.length) b.trail.length = 0; continue; }
      b.trail.unshift({ x: b.x, y: b.y }); if (b.trail.length > 6) b.trail.pop();
    }
    if (state.drag?.key) state.drag.power = clamp(.12 + (state.time - state.drag.since) * .95, .12, 1);

    const warnLine = world.pressY > WARNING_Y + 2 ? world.pressY + 4 : WARNING_Y;
    const over = state.shots && world.bodies.some(b => b.landed && b.age > .72 && b.top < warnLine && Math.abs(b.vy) < 85);
    state.over = over ? state.over + DT : 0;
    hud.danger(state.over > .20);

    const shouldShowSave = !state.emergencyUsed && state.over > 0.55;
    if (shouldShowSave !== state.emergencyVisible) {
      state.emergencyVisible = shouldShowSave;
      hud.showEmergencySave(shouldShowSave);
    }

    const failLimit = state.mode === 'endless' ? 1.65 : 2.05;
    if (state.finish) { const result = state.finish; state.finish = null; end(result); }
    else if (state.over > failLimit) {
      if (state.mode === 'endless' && !state.revived) {
        cancelDrag();
        state.activeProp = null;
        hud.danger(false);
        hud.showEmergencySave(false);
        phase('end');
        hud.open('revive_prompt', state);
      } else {
        startCrushSequence();
      }
    }

    for (const p of state.fx) { p.t += DT; p.x += p.vx * DT; p.y += p.vy * DT; p.vy += 114 * DT; }
    for (const list of [state.rings, state.labels, state.bridges]) for (const p of list) p.t += DT;
    for (const list of [state.fx, state.rings, state.labels, state.bridges]) for (let i = list.length - 1; i >= 0; i--) if (list[i].t >= list[i].d) list.splice(i, 1);
    state.shake = Math.max(0, state.shake - DT * 7);
  }

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, TAU); ctx.fillStyle = fill; ctx.fill();
  }
  function star(x, y, s, color) {
    c.fillStyle = color; c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * .14, y - s * .13, x + s, y);
    c.quadraticCurveTo(x + s * .12, y + s * .12, x, y + s); c.quadraticCurveTo(x - s * .13, y + s * .15, x - s, y); c.quadraticCurveTo(x - s * .13, y - s * .13, x, y - s); c.fill();
  }

  function drawTerrain(t) {
    if (world.terrainMorph <= 0.008 || world.terrainShape === 'none') return;
    const floor = height - FLOOR_PAD;
    const steps = 28;
    const palettes = {
      heart:     ['rgba(255, 118, 166, 0.88)', '#ff4d88', '#7a1639'],
      hourglass: ['rgba(255, 196, 86, 0.88)',  '#f59e0b', '#6b3b06'],
      diamond:   ['rgba(86, 204, 242, 0.88)',  '#0ea5e9', '#0c4a6e'],
      bowl:      ['rgba(104, 224, 158, 0.88)', '#10b981', '#065f46'],
      funnel:    ['rgba(167, 139, 250, 0.88)', '#8b5cf6', '#3b0764']
    };
    const [fillCol, glowCol, strokeCol] = palettes[world.terrainShape] || palettes.heart;
    const pulse = world.terrainMorph > 0.72 ? (0.85 + 0.15 * Math.sin(t * 7)) : 1;

    bg.save();
    // Left morphing terrain wall
    bg.beginPath();
    bg.moveTo(0, WARNING_Y);
    for (let i = 0; i <= steps; i++) {
      const y = WARNING_Y + (floor - WARNING_Y) * (i / steps);
      bg.lineTo(4 + world.wallInset(y), y);
    }
    bg.lineTo(0, height);
    bg.closePath();
    bg.fillStyle = fillCol;
    bg.globalAlpha = pulse;
    bg.fill();
    bg.lineWidth = 3.2; bg.strokeStyle = strokeCol; bg.stroke();

    // Right morphing terrain wall
    bg.beginPath();
    bg.moveTo(W, WARNING_Y);
    for (let i = 0; i <= steps; i++) {
      const y = WARNING_Y + (floor - WARNING_Y) * (i / steps);
      bg.lineTo(W - 4 - world.wallInset(y), y);
    }
    bg.lineTo(W, height);
    bg.closePath();
    bg.fillStyle = fillCol;
    bg.fill();
    bg.lineWidth = 3.2; bg.strokeStyle = strokeCol; bg.stroke();

    // Crisp inner sheen along both curved walls
    bg.globalAlpha = 0.82; bg.strokeStyle = '#ffffff'; bg.lineWidth = 1.8;
    for (const dir of [-1, 1]) {
      bg.beginPath();
      for (let i = 0; i <= steps; i++) {
        const y = WARNING_Y + (floor - WARNING_Y) * (i / steps);
        const x = dir < 0 ? (4 + world.wallInset(y) - 3) : (W - 4 - world.wallInset(y) + 3);
        if (i === 0) bg.moveTo(x, y); else bg.lineTo(x, y);
      }
      bg.stroke();
    }

    // Cute heart cleft accent at top center when morphing into Heart
    if (world.terrainShape === 'heart' && world.terrainMorph > 0.15) {
      const m = world.terrainMorph;
      bg.globalAlpha = 0.72 * m;
      bg.fillStyle = glowCol;
      bg.beginPath();
      bg.moveTo(W * 0.5 - 26 * m, WARNING_Y);
      bg.quadraticCurveTo(W * 0.5, WARNING_Y + 26 * m, W * 0.5 + 26 * m, WARNING_Y);
      bg.closePath();
      bg.fill();
      bg.strokeStyle = strokeCol; bg.lineWidth = 2; bg.stroke();
    }
    bg.restore();
  }

  function drawGimmicks(t) {
    // 1. Beat Press / Endless Descending Danger Bar
    if (world.pressY > WARNING_Y) {
      const py = world.pressY;
      c.save();
      c.fillStyle = 'rgba(32, 48, 42, 0.16)';
      c.fillRect(0, WARNING_Y, W, py - WARNING_Y);
      c.fillStyle = '#5d736b';
      c.fillRect(68, WARNING_Y - 4, 12, py - WARNING_Y);
      c.fillRect(W - 80, WARNING_Y - 4, 12, py - WARNING_Y);
      const beamH = 15;
      c.fillStyle = '#ffd43b';
      c.fillRect(2, py - beamH, W - 4, beamH);
      c.save();
      c.beginPath(); c.rect(2, py - beamH, W - 4, beamH); c.clip();
      c.fillStyle = '#24352e';
      for (let x = -20; x < W + 20; x += 26) {
        c.beginPath();
        c.moveTo(x, py); c.lineTo(x + 12, py); c.lineTo(x + 22, py - beamH); c.lineTo(x + 10, py - beamH);
        c.closePath(); c.fill();
      }
      c.restore();
      c.strokeStyle = '#24352e'; c.lineWidth = 2.4;
      c.strokeRect(2, py - beamH, W - 4, beamH);
      // Glowing red fail-threshold laser edge right under the bar
      c.strokeStyle = state.over > 0.1 ? '#ff2e4c' : 'rgba(239, 68, 68, 0.85)';
      c.lineWidth = state.over > 0.1 ? 3.5 : 2.2;
      c.beginPath(); c.moveTo(4, py + 2); c.lineTo(W - 4, py + 2); c.stroke();
      c.restore();
    }

    // 1b. Endless Rising Hydraulic Floor Platform (starts at 3:00)
    if (world.floorRise > 0.5) {
      const fy = height - FLOOR_PAD - world.floorRise;
      c.save();
      c.fillStyle = 'rgba(24, 38, 34, 0.78)';
      c.fillRect(2, fy, W - 4, height - fy);
      c.fillStyle = '#4e635c';
      c.fillRect(62, fy + 10, 16, height - fy);
      c.fillRect(W - 78, fy + 10, 16, height - fy);
      const deckH = 14;
      c.fillStyle = '#ff9f2e';
      c.fillRect(2, fy, W - 4, deckH);
      c.save();
      c.beginPath(); c.rect(2, fy, W - 4, deckH); c.clip();
      c.fillStyle = '#24352e';
      for (let x = -20; x < W + 20; x += 26) {
        c.beginPath();
        c.moveTo(x, fy + deckH); c.lineTo(x + 12, fy + deckH); c.lineTo(x + 22, fy); c.lineTo(x + 10, fy);
        c.closePath(); c.fill();
      }
      c.restore();
      c.strokeStyle = '#24352e'; c.lineWidth = 2.4;
      c.strokeRect(2, fy, W - 4, deckH);
      c.restore();
    }

    // 2. Bouncy Drum Bumpers
    for (const bm of world.bumpers) {
      const scale = 1 + bm.hit * 0.22;
      c.save();
      c.translate(bm.x, bm.y);
      c.scale(scale, scale);
      c.fillStyle = '#ef4444'; c.strokeStyle = '#24352e'; c.lineWidth = 2.8;
      c.beginPath(); c.arc(0, 0, bm.r, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#fff5d6';
      c.beginPath(); c.arc(0, 0, bm.r * 0.72, 0, TAU); c.fill();
      c.fillStyle = '#ff981a';
      c.beginPath(); c.arc(0, 0, bm.r * 0.34, 0, TAU); c.fill();
      c.restore();
    }

    // 3. Sleeping Speaker Boss
    if (world.boss && world.boss.hp > 0) {
      const bs = world.boss;
      const thump = 1 + Math.sin(t * TAU / BEAT_PERIOD) * 0.03 + bs.hit * 0.12;
      c.save();
      c.translate(bs.x, bs.y);
      c.scale(thump, 2 - thump);
      // Outer cabinet body
      c.fillStyle = '#2a2d45'; c.strokeStyle = '#151726'; c.lineWidth = 3.5;
      c.beginPath(); c.arc(0, 0, bs.r, 0, TAU); c.fill(); c.stroke();
      // Speaker cone rim
      c.fillStyle = '#474c70';
      c.beginPath(); c.arc(0, 4, bs.r * 0.72, 0, TAU); c.fill();
      c.fillStyle = '#1e2033';
      c.beginPath(); c.arc(0, 4, bs.r * 0.44, 0, TAU); c.fill();
      // Cute angry/sleepy glowing eyes on top
      c.fillStyle = bs.hit > 0.1 ? '#ff6b6b' : '#ffe066';
      c.beginPath(); c.ellipse(-14, -14, 7, bs.hit > 0.1 ? 3 : 6, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(14, -14, 7, bs.hit > 0.1 ? 3 : 6, 0, 0, TAU); c.fill();
      c.restore();

      // Floating HP bar above Boss
      const bw = 78, bh = 10, bx = bs.x - bw / 2, by = bs.y - bs.r - 18;
      c.save();
      c.fillStyle = '#1f2937'; c.strokeStyle = '#ffffff'; c.lineWidth = 2;
      c.beginPath(); c.roundRect(bx, by, bw, bh, 5); c.fill(); c.stroke();
      c.fillStyle = '#ff4d5a';
      c.beginPath(); c.roundRect(bx + 1.5, by + 1.5, Math.max(0, (bw - 3) * (bs.hp / bs.maxHp)), bh - 3, 4); c.fill();
      c.restore();
    }
  }

  function drawBeatRing(t) {
    if (state.phase !== 'playing' || state.shots === 0) return;
    const slotIdx = state.drag ? state.drag.slot : state.choice;
    const slot = state.slots[slotIdx];
    if (!slot || !slot.view) return;
    const ph = (t % BEAT_PERIOD) / BEAT_PERIOD;
    const dist = Math.min(ph, 1 - ph);
    const inSweet = dist < 0.16;
    const r = (slot.wild ? 27 : crew[slot.level].r) + 6 + (1 - ph) * 16;
    c.save();
    c.strokeStyle = inSweet ? 'rgba(255, 232, 82, 0.92)' : 'rgba(255, 255, 255, 0.34)';
    c.lineWidth = inSweet ? 3.2 : 1.8;
    c.beginPath();
    c.arc(slot.view.x, slot.view.y, r, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawTutorial(t) {
    if (!state.showTutorial || state.drag || state.activeProp) return;
    const cycle = t % 3.6;
    const isTap = cycle < 1.5;
    const hx = homes[1];
    let hy = 185, label = '轻点任意果冻下方直落';

    c.save();
    if (isTap) {
      const k = (cycle % 0.75) / 0.75;
      hy = 182 - Math.sin(k * Math.PI) * 8;
      c.strokeStyle = `rgba(255, 245, 168, ${(1 - k) * 0.9})`;
      c.lineWidth = 3;
      c.beginPath(); c.arc(hx, 174, 12 + k * 28, 0, TAU); c.stroke();
    } else {
      label = '按住下滑可瞄准力度！';
      const k = clamp((cycle - 1.65) / 1.4, 0, 1);
      hy = 155 + k * 78;
      c.strokeStyle = 'rgba(255, 250, 190, 0.85)';
      c.lineWidth = 3; c.setLineDash([4, 6]);
      c.beginPath(); c.moveTo(hx, 155); c.lineTo(hx, hy); c.stroke(); c.setLineDash([]);
    }

    c.translate(hx + 4, hy);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#253c34'; c.lineWidth = 2.4;
    c.beginPath(); c.roundRect(-7, -18, 11, 22, 5.5); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(-12, -2, 24, 20, 9); c.fill(); c.stroke();

    c.font = '850 13px "PingFang SC","Microsoft YaHei",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = c.measureText(label).width + 24;
    c.fillStyle = 'rgba(26, 46, 40, 0.88)';
    c.beginPath(); c.roundRect(-tw / 2, 30, tw, 28, 14); c.fill();
    c.fillStyle = '#fff9d6';
    c.fillText(label, 0, 44.5);
    c.restore();
  }

  function dock(x, slot, active) {
    bg.save(); bg.translate(x, 13);
    const skin = art.skin;
    const tintMap = { cartoon: '#59927a', metal: '#526c76', plush: '#af8192', glass: '#74ced6', pixel: '#9b9aca', neon: '#7c3aed', gummy: '#e89838', porcelain: '#5b82b8', sakura: '#d988a5', holo: '#7ea8e8' };
    bg.fillStyle = tintMap[skin] || '#59927a';
    bg.beginPath(); bg.roundRect(-22, -8, 44, 9, 4.5); bg.fill();
    ellipse(bg, 0, -5, 15, 1.05, slot.wild ? '#ffffff' : active ? '#fff6bd' : crew[slot.level].light);
    bg.restore();
  }

  function tether(view) {
    const d = state.drag; if (!d || !d.valid || d.drop) return;
    const anchor = homes[d.slot], shade = view.wild ? '#ffffff' : crew[view.level].light;
    bg.save(); bg.lineCap = 'round';
    for (const side of [-1, 1]) {
      bg.strokeStyle = shade; bg.lineWidth = 2.4 - d.power * .8; bg.globalAlpha = .62;
      bg.beginPath(); bg.moveTo(anchor + side * 11, 15); bg.quadraticCurveTo(anchor + side * 10, view.y * .43, view.x + side * view.rx * .32, view.y - view.ry * .61); bg.stroke();
    }
    bg.restore();
  }

  function line(t) {
    const alert = state.over > .15, y = WARNING_Y;
    const isLightStage = !art.themes[art.stage]?.dark;
    bg.save();
    bg.strokeStyle = alert ? '#ef4444' : isLightStage ? 'rgba(65,91,79,.46)' : 'rgba(208,231,230,.52)';
    bg.lineWidth = .9;
    bg.setLineDash([3, 5.8]); bg.beginPath(); bg.moveTo(0, y); bg.lineTo(W, y); bg.stroke(); bg.setLineDash([]);
    if (alert) { bg.fillStyle = 'rgba(248,113,113,' + (.06 + .03 * Math.sin(t * 11)) + ')'; bg.fillRect(0, 0, W, y); }
    bg.restore();
  }

  function shadow(v) {
    const floor = height - FLOOR_PAD - world.floorRise, dist = floor - (v.y + v.ry), vis = clamp(1 - dist / 135, 0, 1);
    if (!vis) return;
    bg.save(); bg.translate(v.x + 2, floor - .2); bg.scale(v.rx * (1.02 + .32 * (1 - vis)), v.ry * .16 + 1);
    ellipse(bg, 0, 0, 1, 1, 'rgba(8,23,31,' + (.30 * vis) + ')'); bg.restore();
  }

  function trail(b) {
    if (!b.trail || b.landed || b.trail.length < 2) return;
    bg.save(); bg.lineCap = 'round'; bg.strokeStyle = b.beatBoost ? '#ffe852' : b.wild ? '#fff3a8' : crew[b.level].light;
    for (let i = b.trail.length - 1; i > 0; i--) {
      const u = b.trail[i], v = b.trail[i - 1], k = 1 - i / b.trail.length;
      bg.globalAlpha = (b.beatBoost ? .14 : .06) + .18 * k; bg.lineWidth = b.r * (.28 + .72 * k);
      bg.beginPath(); bg.moveTo(u.x, u.y); bg.lineTo(v.x, v.y); bg.stroke();
    }
    bg.restore();
  }

  function aim(view, d) {
    const r = view.wild ? 27 : crew[view.level].r;
    const len = 52 + d.power * 135;
    let dx = Math.sin(d.angle), dy = Math.cos(d.angle);
    const startX = view.x + dx * r * .92, startY = view.y + dy * r * .92;
    let endX = startX + dx * len, endY = startY + dy * len;
    const pts = [[startX, startY]];

    const minX = 16, maxX = W - 16;
    if (endX < minX && dx < -0.01) {
      const tHit = (minX - startX) / (endX - startX), hy = startY + (endY - startY) * tHit;
      pts.push([minX, hy]);
      const rem = len * (1 - tHit) * 0.72;
      endX = minX - dx * rem; endY = hy + dy * rem; dx = -dx;
    } else if (endX > maxX && dx > 0.01) {
      const tHit = (maxX - startX) / (endX - startX), hy = startY + (endY - startY) * tHit;
      pts.push([maxX, hy]);
      const rem = len * (1 - tHit) * 0.72;
      endX = maxX - dx * rem; endY = hy + dy * rem; dx = -dx;
    }
    pts.push([endX, endY]);

    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([2, 7.5]);
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = '#213d47'; c.lineWidth = 4.6; c.stroke();
    c.strokeStyle = '#eaffad'; c.lineWidth = 2.6; c.stroke(); c.setLineDash([]);

    const ang = Math.atan2(dx, dy);
    c.translate(endX, endY); c.rotate(-ang);
    c.fillStyle = '#e1fa8d'; c.beginPath(); c.moveTo(0, 6); c.lineTo(-7, -9); c.lineTo(0, -6); c.lineTo(7, -9); c.closePath();
    c.fill(); c.strokeStyle = '#36514d'; c.lineWidth = 1.3; c.stroke();
    c.restore();
  }

  function bridges() {
    for (const f of state.bridges) {
      const remain = 1 - f.t / f.d, tx = f.body.x, ty = f.body.y;
      bg.save(); bg.globalAlpha = remain * .82; bg.strokeStyle = f.color; bg.lineWidth = f.r * (.60 + remain * .45); bg.lineCap = 'round';
      bg.beginPath(); bg.moveTo(tx + (f.x1 - tx) * remain, ty + (f.y1 - ty) * remain); bg.lineTo(tx, ty); bg.lineTo(tx + (f.x2 - tx) * remain, ty + (f.y2 - ty) * remain); bg.stroke(); bg.restore();
    }
  }

  function effects() {
    for (const r of state.rings) {
      const k = r.t / r.d; c.save(); c.globalAlpha = (1 - k) * .75; c.beginPath(); c.ellipse(r.x, r.y, r.r * (.43 + .75 * k), r.r * (.43 + .75 * k) * r.flat, 0, 0, TAU); c.strokeStyle = r.color; c.lineWidth = 1.5 - k * .6; c.stroke(); c.restore();
    }
    for (const p of state.fx) {
      const k = p.t / p.d; c.save(); c.globalAlpha = Math.min(1, (1 - k) * 2); c.translate(p.x, p.y); c.rotate(p.rot + k * .8);
      if (p.kind === 'star') star(0, 0, p.size * 1.5, p.color);
      else ellipse(c, 0, 0, p.size, p.size * .83, p.color); c.restore();
    }
    for (const p of state.labels) {
      const k = p.t / p.d; c.save(); c.globalAlpha = clamp((1 - k) * 3.4, 0, 1); c.translate(p.x, p.y - Math.sin(k * 1.25) * 32);
      c.rotate(-.08); const zoom = .94 + .16 * Math.sin(Math.min(1, k * 4) * Math.PI); c.scale(zoom, zoom);
      c.font = 'italic 900 24px "Barlow Deck","Arial Black",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.strokeStyle = '#332239'; c.lineWidth = 3.8; c.strokeText(p.text, 0, 0); c.fillStyle = p.color; c.fillText(p.text, 0, 0); c.restore();
    }
    if (state.activeProp === 'hammer') {
      c.save(); c.strokeStyle = 'rgba(255, 224, 102, 0.9)'; c.lineWidth = 2.4; c.setLineDash([4, 4]);
      for (const b of world.bodies) { c.beginPath(); c.arc(b.x, b.y, b.r + 3, 0, TAU); c.stroke(); }
      if (world.boss && world.boss.hp > 0) { c.beginPath(); c.arc(world.boss.x, world.boss.y, world.boss.r + 5, 0, TAU); c.stroke(); }
      c.restore();
    }
  }

  const views = [];
  function render(t, alpha) {
    c.setTransform(ratioX, 0, 0, ratioY, 0, 0); c.clearRect(0, 0, W, height);
    bg.setTransform(ratioX, 0, 0, ratioY, 0, 0); bg.clearRect(0, 0, W, height);
    art.drawStage(bg, W, height, art.stage, t, state.doubleLeft > 0);
    line(t); views.length = 0;
    const ox = state.shake > .01 ? Math.sin(t * 81) * state.shake * .6 : 0;
    const oy = state.shake > .01 ? Math.sin(t * 67) * state.shake * .4 : 0;
    bg.save(); c.save();
    if (ox || oy) { bg.translate(ox, oy); c.translate(ox, oy); }
    drawTerrain(t);
    for (const b of world.bodies) { const v = art.bodyView(b, alpha); views.push(v); shadow(v); trail(b); }
    bridges();
    for (let i = 0; i < state.slots.length; i++) {
      const s = state.slots[i];
      dock(s.x, s, state.drag?.slot === i && (state.drag.valid || state.drag.key));
      const view = slotPose(i, t);
      if (state.drag?.slot === i) tether(view);
      views.push(view);
    }
    layer.paint(bg, views, height, ox, oy, t);
    const showNum = profile.showNumbers;
    for (let i = 0; i < views.length; i++) art.features(c, views[i], t, showNum);
    drawGimmicks(t);
    drawBeatRing(t);
    if (state.drag && (state.drag.valid || state.drag.key)) aim(state.slots[state.drag.slot].view, state.drag);
    effects();
    drawTutorial(t);
    c.restore(); bg.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (!last) last = now;
    const elapsed = Math.min(.034, (now - last) / 1000);
    last = now;
    if (state.phase === 'playing' || state.phase === 'crushing') {
      accumulator += elapsed;
      let steps = 0;
      while (accumulator >= DT && steps < 2 && (state.phase === 'playing' || state.phase === 'crushing')) {
        accumulator -= DT;
        if (state.phase === 'crushing') tickCrushing(); else tick();
        steps++;
      }
      if (accumulator > DT * 2) accumulator = 0;
      render(state.time, clamp(accumulator / DT, 0, 1));
    } else {
      hud.paint(reduced ? 1.2 : now / 1000);
    }
  }

  const observer = new ResizeObserver(refreshSize); observer.observe(canvas);
  window.addEventListener('resize', refreshSize);
  refreshSize(); phase('home'); hud.home(true, false); hud.audio(band.on); requestAnimationFrame(frame);
})();
