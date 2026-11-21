'use strict';

(() => {
  const placements = {
    revive:         { label: '免费复活',     toast: '复活成功！顶部障碍已清空' },
    add_time:       { label: '免费加时',     toast: '加时成功！倒计时 +30 秒' },
    prop_hammer:    { label: '看广告领小锤子', toast: '已获得小锤子，点果冻消除吧' },
    prop_wild:      { label: '看广告领彩虹球', toast: '已装填彩虹万能球！' },
    prop_freeze:    { label: '看广告领双倍冻', toast: '已激活冻杆 + 双倍得分！' },
    prop_lift:      { label: '看广告领抬杠',   toast: '已发动抬杠，横杠立刻顶起！' },
    double_coins:   { label: '双倍领币',     toast: '奖励已翻倍到账！' },
    free_coins:     { label: '免费领音符币', toast: '已免费领取 +150 音符币！' },
    checkin_2x:     { label: '双倍签到',     toast: '签到奖励已双倍到账！' },
    unlock_skin:    { label: '免费解锁皮肤', toast: '新皮肤已免费解锁并穿戴！' },
    unlock_stage:   { label: '免费解锁舞台', toast: '新舞台背景已免费解锁！' },
    airdrop:        { label: '免费领空投',   toast: '空投礼包到账：随机道具 +1 & 50 币！' },
    wheel_spin:     { label: '免费再抽一次', toast: '转盘启动！祝你好运！' },
    quest_chest_2x: { label: '双倍开宝箱',   toast: '今日大宝箱已双倍开启！' },
    new_char_2x:    { label: '新伙伴双倍礼', toast: '新伙伴欢迎礼已双倍到账！' },
    emergency_save: { label: '紧急救场消除', toast: '急救成功！最高障碍已清除' },
    comeback_wild:  { label: '开局彩虹加持', toast: '翻盘加持生效：开局赠送彩虹球！' }
  };

  class AdManager {
    constructor() { this.listeners = []; }
    onReward(fn) { this.listeners.push(fn); }
    watch(placementId, onGrant, customMessage) {
      const info = placements[placementId] || { label: '免费奖励', toast: '奖励已立即到账！' };
      try { if (typeof onGrant === 'function') onGrant(); } catch (err) { console.error(err); }
      const message = customMessage || info.toast;
      for (const fn of this.listeners) {
        try { fn({ placementId, label: info.label, message }); } catch {}
      }
      return true;
    }
  }

  Jelly.ads = new AdManager();
})();
