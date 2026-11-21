'use strict';

(() => {
  const key = 'jelly-jam.club-v2';
  const legacyKey = 'jelly-jam.club-v1';
  const get = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } };
  const put = (k, value) => { try { localStorage.setItem(k, value); } catch {} };
  const countBits = n => (n >>> 0).toString(2).replace(/0/g, '').length;

  const todayStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const checkinRewards = [
    { day: 1, title: '80 音符币',          type: 'coins', amount: 80,  badge: '第1天', icon: 'coin' },
    { day: 2, title: '小锤子 ×2',          type: 'prop',  prop: 'hammer', amount: 2, badge: '第2天', icon: 'hammer' },
    { day: 3, title: '果汁软糖皮肤',       type: 'skin',  skin: 'gummy', fallbackCoins: 200, badge: '第3天', icon: 'layers' },
    { day: 4, title: '抬杠 ×2 + 100币',    type: 'bundle', prop: 'lift', propAmt: 2, coins: 100, badge: '第4天', icon: 'lift' },
    { day: 5, title: '彩虹球 ×2',          type: 'prop',  prop: 'wild', amount: 2, badge: '第5天', icon: 'spark' },
    { day: 6, title: '220 音符币',         type: 'coins', amount: 220, badge: '第6天', icon: 'coin' },
    { day: 7, title: '极光贝母皮肤+300币', type: 'skin_bundle', skin: 'holo', coins: 300, fallbackCoins: 450, badge: '第7天大奖', icon: 'star' }
  ];

  const dailyQuestDefs = [
    { id: 'q_merge', title: '今日合成 15 次', target: 15, field: 'merges', rewardType: 'coins', amount: 60, icon: 'merge', rewardText: '+60 币' },
    { id: 'q_combo', title: '达成 2 次连击',   target: 2,  field: 'combos', rewardType: 'prop', prop: 'lift', amount: 1, icon: 'lift', rewardText: '抬杠 ×1' },
    { id: 'q_prop',  title: '使用 1 次道具',   target: 1,  field: 'props',  rewardType: 'coins', amount: 80, icon: 'spark', rewardText: '+80 币' }
  ];

  const wheelPrizes = [
    { id: 'w_coin1', label: '80 币',    type: 'coins', amount: 80, color: '#ffe07d', icon: 'coin' },
    { id: 'w_ham',   label: '小锤子×2', type: 'prop',  prop: 'hammer', amount: 2, color: '#ffb8a6', icon: 'hammer' },
    { id: 'w_lift',  label: '抬杠×2',   type: 'prop',  prop: 'lift', amount: 2, color: '#c8f5c4', icon: 'lift' },
    { id: 'w_coin2', label: '150 币',   type: 'coins', amount: 150, color: '#b8e8ff', icon: 'coin' },
    { id: 'w_wild',  label: '彩虹球×1', type: 'prop',  prop: 'wild', amount: 1, color: '#e2ccff', icon: 'spark' },
    { id: 'w_skin',  label: '限定皮肤', type: 'skin_or_coins', fallbackCoins: 300, color: '#ffd1e8', icon: 'layers' }
  ];

  // Endless-aligned Achievement Badges
  const badges = [
    { id: 'first',    name: '初次合拍',   goal: '完成 1 次合成',            icon: 'merge',    max: 1,    reward: 30,  read: s => s.merges },
    { id: 'trio',     name: '三轨齐发',   goal: '三个发射位都发射过',       icon: 'bars',     max: 3,    reward: 40,  read: s => countBits(s.lanes) },
    { id: 'duet',     name: '双倍连击',   goal: '单次达成 2 连击',          icon: 'music',    max: 2,    reward: 50,  read: s => s.combo },
    { id: 'propuse',  name: '道具能手',   goal: '累计使用道具 5 次',        icon: 'spark',    max: 5,    reward: 70,  read: s => s.propsUsed },
    { id: 'adfan',    name: '补给达人',   goal: '领取免费补给 3 次',        icon: 'gift',     max: 3,    reward: 80,  read: s => s.adsWatched },
    { id: 'session',  name: '合成熟手',   goal: '累计合成 50 次',           icon: 'disc',     max: 50,   reward: 80,  read: s => s.merges },
    { id: 'survive3', name: '三分钟试炼', goal: '无尽模式坚持满 3 分钟',    icon: 'clock',    max: 180,  reward: 100, read: s => s.bestTime },
    { id: 'silver',   name: '银碟登场',   goal: '合出银碟队长（256）',      icon: 'disc',     max: 8,    reward: 100, read: s => s.top },
    { id: 'quartet',  name: '四连暴击',   goal: '单次达成 4 连击',          icon: 'bars',     max: 4,    reward: 120, read: s => s.combo },
    { id: 'thousand', name: '千分大关',   goal: '单局得分达到 1024',        icon: 'trophy',   max: 1024, reward: 120, read: s => s.record },
    { id: 'dresser',  name: '百变衣橱',   goal: '解锁 5 套不同皮肤',        icon: 'layers',   max: 5,    reward: 120, read: s => s.skinsCount },
    { id: 'checkin3', name: '忠实乐迷',   goal: '累计签到 3 天',            icon: 'gift',     max: 3,    reward: 100, read: s => s.checkins },
    { id: 'survive6', name: '六分钟大师', goal: '无尽模式坚持满 6 分钟',    icon: 'infinity', max: 360,  reward: 240, read: s => s.bestTime },
    { id: 'high5k',   name: '五千分传奇', goal: '单局得分达到 5000',        icon: 'trophy',   max: 5000, reward: 260, read: s => s.record },
    { id: 'all',      name: '终极黑胶',   goal: '合出终极黑胶主唱',         icon: 'star',     max: 19,   reward: 500, read: s => s.top }
  ];

  const skinCatalog = {
    cartoon:   { free: true,  coins: 0,   ads: 0 },
    metal:     { free: true,  coins: 0,   ads: 0 },
    glass:     { free: false, coins: 180, ads: 1 },
    neon:      { free: false, coins: 220, ads: 1 },
    plush:     { free: false, coins: 200, ads: 1 },
    pixel:     { free: false, coins: 200, ads: 1 },
    gummy:     { free: false, coins: 240, ads: 1 },
    porcelain: { free: false, coins: 280, ads: 1 },
    sakura:    { free: false, coins: 300, ads: 1 },
    holo:      { free: false, coins: 360, ads: 1 }
  };

  const stageCatalog = {
    cartoon:   { free: true,  coins: 0,   ads: 0 },
    metal:     { free: true,  coins: 0,   ads: 0 },
    glass:     { free: false, coins: 120, ads: 1 },
    neon:      { free: false, coins: 150, ads: 1 },
    plush:     { free: false, coins: 120, ads: 1 },
    pixel:     { free: false, coins: 120, ads: 1 },
    gummy:     { free: false, coins: 150, ads: 1 },
    porcelain: { free: false, coins: 180, ads: 1 },
    sakura:    { free: false, coins: 180, ads: 1 },
    holo:      { free: false, coins: 200, ads: 1 }
  };

  class Progress {
    constructor() {
      let s = {};
      try { s = JSON.parse(get(key, '')) || JSON.parse(get(legacyKey, '{}')) || {}; } catch {}

      this.stats = {
        merges: 0, lanes: 0, combo: 0, wardrobe: 0, top: 0, record: 0,
        bestTime: 0, propsUsed: 0, adsWatched: 0, checkins: 0, skinsCount: 2
      };
      for (const name of Object.keys(this.stats)) {
        const n = Number(s[name]);
        if (Number.isSafeInteger(n) && n > 0) this.stats[name] = n;
      }
      this.stats.record = Math.max(this.stats.record, Number(get('jelly-jam.best', '0')) || 0);

      this.coins = Number.isFinite(Number(s.coins)) ? Math.max(0, Math.floor(Number(s.coins))) : 120;
      this.mode = 'endless';
      const oldBest = s.modeBest && typeof s.modeBest === 'object' ? Math.max(Number(s.modeBest.endless) || 0, this.stats.record) : this.stats.record;
      this.modeBest = { endless: oldBest };
      this.stats.record = Math.max(this.stats.record, oldBest);

      const defProps = { hammer: 2, shake: 2, wild: 1, freeze: 1, lift: 1 };
      this.props = {};
      for (const id of Object.keys(defProps)) {
        const v = s.props?.[id];
        this.props[id] = Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : defProps[id];
      }

      this.unlockedSkins = Array.isArray(s.unlockedSkins) ? [...new Set(['cartoon', 'metal', ...s.unlockedSkins])] : ['cartoon', 'metal'];
      this.unlockedStages = Array.isArray(s.unlockedStages) ? [...new Set(['cartoon', 'metal', ...s.unlockedStages])] : ['cartoon', 'metal'];
      const themes = Jelly.art?.themes || skinCatalog;
      this.skin = (s.skin && themes[s.skin] && this.unlockedSkins.includes(s.skin)) ? s.skin : 'cartoon';
      this.stageMode = (s.stageMode && (s.stageMode === 'auto' || themes[s.stageMode])) ? s.stageMode : 'auto';
      if (this.stageMode !== 'auto' && !this.unlockedStages.includes(this.stageMode)) this.stageMode = 'auto';

      this.claimedBadges = Array.isArray(s.claimedBadges) ? [...new Set(s.claimedBadges)] : [];
      this.checkin = {
        streak: Number(s.checkin?.streak) || 0,
        lastDate: s.checkin?.lastDate || '',
        total: Number(s.checkin?.total) || 0,
        dayOffset: Number(s.checkin?.dayOffset) || 0
      };

      this.failStreak = Math.max(0, Number(s.failStreak) || 0);

      this.discovered = Array.isArray(s.discovered)
        ? [...new Set([0, 1, 2, 3, 4, 5, ...s.discovered])].sort((a, b) => a - b)
        : [0, 1, 2, 3, 4, 5];

      const today = todayStr(this.checkin.dayOffset);
      this.daily = (s.daily && s.daily.date === today)
        ? { ...s.daily, claimed: Array.isArray(s.daily.claimed) ? [...s.daily.claimed] : [] }
        : { date: today, merges: 0, combos: 0, props: 0, claimed: [], chestClaimed: false };

      this.wheel = (s.wheel && s.wheel.date === today)
        ? { ...s.wheel }
        : { date: today, freeUsed: false, adSpins: 0, pity: Number(s.wheel?.pity) || 0 };

      this.haptics = s.haptics !== false;
      this.showNumbers = s.showNumbers !== false;
      this.tutorialDone = !!s.tutorialDone;
      this.syncDerivedStats();
    }

    ensureToday() {
      const today = todayStr(this.checkin.dayOffset);
      if (this.daily.date !== today) {
        this.daily = { date: today, merges: 0, combos: 0, props: 0, claimed: [], chestClaimed: false };
      }
      if (this.wheel.date !== today) {
        this.wheel = { date: today, freeUsed: false, adSpins: 0, pity: this.wheel.pity || 0 };
      }
    }

    syncDerivedStats() {
      this.stats.skinsCount = this.unlockedSkins.length;
      this.stats.checkins = Math.max(this.stats.checkins, this.checkin.total);
    }

    get activeStage() { return this.stageMode === 'auto' ? this.skin : this.stageMode; }

    persist() {
      this.syncDerivedStats();
      put(key, JSON.stringify({
        ...this.stats,
        coins: this.coins, mode: 'endless',
        modeBest: this.modeBest, props: this.props,
        unlockedSkins: this.unlockedSkins, unlockedStages: this.unlockedStages,
        skin: this.skin, stageMode: this.stageMode, claimedBadges: this.claimedBadges,
        checkin: this.checkin, failStreak: this.failStreak,
        discovered: this.discovered, daily: this.daily, wheel: this.wheel,
        haptics: this.haptics, showNumbers: this.showNumbers, tutorialDone: this.tutorialDone
      }));
    }

    change(fn) {
      const before = this.earned();
      fn(this.stats);
      this.persist();
      return this.earned().filter(id => !before.includes(id)).map(id => badges.find(b => b.id === id));
    }

    setShowNumbers(on) { this.showNumbers = !!on; this.persist(); }
    markTutorialDone() { if (!this.tutorialDone) { this.tutorialDone = true; this.persist(); } }
    addCoins(amount) { this.coins = Math.max(0, this.coins + Math.round(amount)); this.persist(); }
    spendCoins(amount) { if (this.coins < amount) return false; this.coins -= amount; this.persist(); return true; }
    addProp(id, amount = 1) { this.props[id] = (this.props[id] || 0) + amount; this.persist(); }

    useProp(id) {
      if ((this.props[id] || 0) <= 0) return false;
      this.props[id]--;
      this.ensureToday();
      this.daily.props++;
      return this.change(s => { s.propsUsed++; });
    }

    recordAdWatch() { return this.change(s => { s.adsWatched++; }); }

    recordSurvival(seconds) {
      const sec = Math.max(0, Math.floor(seconds));
      if (sec <= this.stats.bestTime) return [];
      return this.change(s => { s.bestTime = Math.max(s.bestTime, sec); });
    }

    recordModeScore(_mode, score) {
      if (score > (this.modeBest.endless || 0)) this.modeBest.endless = score;
      if (score > this.stats.record) { this.stats.record = score; put('jelly-jam.best', String(score)); }
      this.persist();
    }

    isSkinUnlocked(id) { return this.unlockedSkins.includes(id) || !!skinCatalog[id]?.free; }
    isStageUnlocked(id) { return id === 'auto' || this.unlockedStages.includes(id) || !!stageCatalog[id]?.free; }

    unlockSkin(id) {
      if (!this.unlockedSkins.includes(id)) this.unlockedSkins.push(id);
      if (!this.unlockedStages.includes(id)) this.unlockedStages.push(id);
      return this.change(() => { this.syncDerivedStats(); });
    }
    unlockStage(id) { if (!this.unlockedStages.includes(id)) this.unlockedStages.push(id); this.persist(); }

    wear(skin) {
      if (!Object.hasOwn(Jelly.art.themes, skin) || !this.isSkinUnlocked(skin)) return false;
      this.skin = skin; this.persist(); return true;
    }
    setStage(stageId) {
      if (stageId !== 'auto' && (!Object.hasOwn(Jelly.art.themes, stageId) || !this.isStageUnlocked(stageId))) return false;
      this.stageMode = stageId; this.persist(); return true;
    }

    shot(index, skin) {
      const bit = 1 << index;
      const material = 1 << Math.max(0, Object.keys(Jelly.art.themes).indexOf(skin));
      if ((this.stats.lanes & bit) && (this.stats.wardrobe & material)) return [];
      return this.change(s => { s.lanes |= bit; s.wardrobe |= material; });
    }

    merge(level, combo, score) {
      this.ensureToday();
      this.daily.merges++;
      if (combo >= 2) this.daily.combos++;
      let isNewDiscovery = false;
      if (!this.discovered.includes(level)) {
        this.discovered.push(level);
        this.discovered.sort((a, b) => a - b);
        isNewDiscovery = true;
      }
      const earned = this.change(s => {
        s.merges++; s.top = Math.max(s.top, level);
        s.combo = Math.max(s.combo, combo); s.record = Math.max(s.record, score);
      });
      return { earned, isNewDiscovery };
    }

    hasClaimableDaily() {
      this.ensureToday();
      const anyQuest = dailyQuestDefs.some(q => (this.daily[q.field] || 0) >= q.target && !this.daily.claimed.includes(q.id));
      const chestReady = this.daily.claimed.length >= dailyQuestDefs.length && !this.daily.chestClaimed;
      return this.canCheckinToday() || anyQuest || chestReady;
    }

    claimDailyQuest(id) {
      this.ensureToday();
      const q = dailyQuestDefs.find(x => x.id === id);
      if (!q || this.daily.claimed.includes(id) || (this.daily[q.field] || 0) < q.target) return null;
      this.daily.claimed.push(id);
      if (q.rewardType === 'coins') this.coins += q.amount;
      else if (q.rewardType === 'prop') this.props[q.prop] = (this.props[q.prop] || 0) + q.amount;
      this.persist();
      return q.rewardText;
    }

    claimDailyChest(isDouble = false) {
      this.ensureToday();
      if (this.daily.claimed.length < dailyQuestDefs.length || this.daily.chestClaimed) return null;
      this.daily.chestClaimed = true;
      const mult = isDouble ? 2 : 1;
      const coins = 150 * mult, wilds = 1 * mult;
      this.coins += coins;
      this.props.wild = (this.props.wild || 0) + wilds;
      this.persist();
      return `${coins} 音符币 + 彩虹球 ×${wilds}`;
    }

    canFreeWheel() { this.ensureToday(); return !this.wheel.freeUsed; }
    wheelAdLeft() { this.ensureToday(); return Math.max(0, 5 - (this.wheel.adSpins || 0)); }

    spinWheel(isAd = false) {
      this.ensureToday();
      if (!isAd && this.wheel.freeUsed) return null;
      if (isAd && this.wheel.adSpins >= 5) return null;

      if (!isAd) this.wheel.freeUsed = true;
      else this.wheel.adSpins++;
      this.wheel.pity = (this.wheel.pity || 0) + 1;

      let idx = this.wheel.pity >= 5 ? 5 : Math.floor(Math.random() * wheelPrizes.length);
      if (idx === 5) this.wheel.pity = 0;

      const prize = wheelPrizes[idx];
      let text = prize.label;
      const earned = isAd ? this.recordAdWatch() : [];

      if (prize.type === 'coins') {
        this.coins += prize.amount;
        text = `${prize.amount} 音符币`;
      } else if (prize.type === 'prop') {
        this.props[prize.prop] = (this.props[prize.prop] || 0) + prize.amount;
      } else if (prize.type === 'skin_or_coins') {
        const locked = Object.keys(skinCatalog).filter(k => !this.isSkinUnlocked(k));
        if (locked.length) {
          const picked = locked[Math.floor(Math.random() * locked.length)];
          earned.push(...this.unlockSkin(picked));
          text = `限定皮肤「${Jelly.art.themes[picked]?.name || picked}」`;
        } else {
          this.coins += prize.fallbackCoins;
          text = `${prize.fallbackCoins} 音符币`;
        }
      }
      this.persist();
      return { idx, prize, text, earned };
    }

    earned() { this.syncDerivedStats(); return badges.filter(b => b.read(this.stats) >= b.max).map(b => b.id); }
    unclaimedBadges() { return this.earned().filter(id => !this.claimedBadges.includes(id)); }
    claimBadge(id) {
      if (!this.earned().includes(id) || this.claimedBadges.includes(id)) return 0;
      const b = badges.find(x => x.id === id); if (!b) return 0;
      this.claimedBadges.push(id); this.coins += b.reward; this.persist(); return b.reward;
    }

    canCheckinToday() { return this.checkin.lastDate !== todayStr(this.checkin.dayOffset); }
    nextCheckinDayIndex() { return this.checkin.streak % 7; }

    performCheckin(doubleReward = false) {
      if (!this.canCheckinToday()) return null;
      const idx = this.nextCheckinDayIndex(), item = checkinRewards[idx], mult = doubleReward ? 2 : 1, summary = [];
      if (item.type === 'coins') { const amt = item.amount * mult; this.coins += amt; summary.push(`${amt} 音符币`); }
      else if (item.type === 'prop') {
        const amt = item.amount * mult; this.props[item.prop] = (this.props[item.prop] || 0) + amt;
        summary.push(`${JellyProps.find(p => p.id === item.prop)?.name || '道具'} ×${amt}`);
      } else if (item.type === 'bundle') {
        const pAmt = item.propAmt * mult, cAmt = item.coins * mult;
        this.props[item.prop] = (this.props[item.prop] || 0) + pAmt; this.coins += cAmt;
        summary.push(`${JellyProps.find(p => p.id === item.prop)?.name || '道具'} ×${pAmt} + ${cAmt} 音符币`);
      } else if (item.type === 'skin') {
        if (!this.isSkinUnlocked(item.skin)) {
          this.unlockSkin(item.skin); summary.push(`皮肤「${Jelly.art.themes[item.skin]?.name || item.skin}」`);
          if (doubleReward) { this.coins += 120; summary.push('120 音符币'); }
        } else { const amt = item.fallbackCoins * mult; this.coins += amt; summary.push(`${amt} 音符币`); }
      } else if (item.type === 'skin_bundle') {
        if (!this.isSkinUnlocked(item.skin)) {
          this.unlockSkin(item.skin); summary.push(`皮肤「${Jelly.art.themes[item.skin]?.name || item.skin}」`);
          const cAmt = item.coins * mult; this.coins += cAmt; summary.push(`${cAmt} 音符币`);
        } else { const amt = item.fallbackCoins * mult; this.coins += amt; summary.push(`${amt} 音符币`); }
      }
      this.checkin.lastDate = todayStr(this.checkin.dayOffset);
      this.checkin.streak++; this.checkin.total++;
      const earned = this.change(s => { s.checkins = this.checkin.total; });
      return { day: item.day, summary: summary.join(' + '), earned };
    }

    simulateNextDay() {
      this.checkin.dayOffset = (this.checkin.dayOffset || 0) + 1;
      this.ensureToday();
      this.persist();
    }
    vibrate(on) { this.haptics = on; this.persist(); }
  }

  Jelly.club = { Progress, badges, checkinRewards, dailyQuestDefs, wheelPrizes, skinCatalog, stageCatalog, get, put };
})();
