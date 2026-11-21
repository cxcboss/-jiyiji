'use strict';

// The atlas baker and the game share this exact order.
globalThis.JellyCast = [
  ["橘子鼓手","phones","#ff8c2e","#ffd29d",24],
  ["冰蓝泡泡","bear","#3ecfe8","#b8f7ff",26],
  ["青柠刺头","spikes","#9be32c","#e2ff96",29],
  ["桃桃兔","rabbit","#f772b8","#ffd0ea",32],
  ["金铃天线","aerial","#ffe84d","#fff7b0",35],
  ["红椒鼓点","flame","#ef3b48","#ffada6",38],
  ["点阵搭档","bot","#f5a623","#ffe49e",41],
  ["紫电小角","horn","#9b51e0","#dfc2ff",44],
  ["银碟队长","disc","#b9d2dc","#edf9ff",47],
  ["薄荷花匠","flower","#32cf7c","#a9f7c9",50],
  ["金色面罩","visor","#ffae2b","#ffe694",54],
  ["午夜蓝调","hood","#4358e0","#b8c6ff",58],
  ["雪白音符","ivory","#f7f2e4","#fffdf5",62],
  ["桶桶鼓手","bucket","#b5653b","#f2bc91",66],
  ["太阳先生","sun","#ff7a2e","#ffd499",70],
  ["树冠歌手","oak","#4db848","#b7f0a3",74],
  ["彩帽小屏","terminal","#6ec2b8","#cbf7f0",78],
  ["沙丘帽客","ranger","#e2b46d","#ffdfaa",83],
  ["灰耳低音","ash","#7c7a96","#d6d4eb",88],
  ["黑胶主唱","hat","#2d3042","#c5cbe0",94]
];

// 4 Distinct Game Modes with bespoke vector icon IDs (zero emojis)
globalThis.JellyModes = {
  campaign: {
    id: 'campaign',
    name: '机关闯关',
    short: '闯关',
    icon: 'flag',
    desc: '12 关随时间变形地形（爱心/沙漏/钻石/圆碗）+ 破冰、圆鼓、Boss 机关！',
    timed: true
  },
  orders: {
    id: 'orders',
    name: '乐队点歌台',
    short: '点歌',
    icon: 'music',
    desc: '场地随时间缩成爱心！按点单合成上菜，撑开空间并 +10 秒！',
    timed: true,
    duration: 75
  },
  press: {
    id: 'press',
    name: '压板挤一挤',
    short: '压板',
    icon: 'wave',
    desc: '地形变形叠加节拍压板步步逼近，连续合成顶回压板冲击高分！',
    timed: false
  },
  endless: {
    id: 'endless',
    name: '硬核无尽',
    short: '无尽',
    icon: 'infinity',
    desc: '经典手感不限时！3/6/8 分钟地形逐步缩窄并降临重冰，巧用道具冲黑胶主唱！',
    timed: false
  }
};

// 12 Non-Repetitive Physical Toy-Box Campaign Levels with Time-Morphing Terrains
// terrain: 'heart' | 'bowl' | 'hourglass' | 'diamond' | 'funnel'
globalThis.JellyLevels = [
  {
    id: 1, title: '爱心破冰秀', gimmick: 'ice', gimmickName: '爱心·破冰', terrain: 'heart',
    time: 75, targetScore: 180, targetLevel: 3, targetIce: 2, reward: 65,
    desc: '场地渐缩成爱心，解救 2 个冰冻果冻并合出桃桃兔',
    setup: { iceSpots: [[0, 130, 42], [1, 270, 42]] }
  },
  {
    id: 2, title: '圆碗弹珠台', gimmick: 'bumper', gimmickName: '圆碗·圆鼓', terrain: 'bowl',
    time: 80, targetScore: 420, targetLevel: 4, reward: 85,
    desc: '场地渐变成圆碗，借圆鼓反弹合出金铃天线',
    setup: { bumpers: [[54, 255, 21], [346, 255, 21]] }
  },
  {
    id: 3, title: '沙漏压板房', gimmick: 'press', gimmickName: '沙漏·压板', terrain: 'hourglass',
    time: 85, targetScore: 680, targetLevel: 5, reward: 105,
    desc: '沙漏缩腰叠加压板，合出红椒鼓点并达 680 分',
    setup: { pressSpeed: 5.2, pressPush: 28 }
  },
  {
    id: 4, title: '瞌睡音箱王', gimmick: 'boss', gimmickName: '钻石·Boss', terrain: 'diamond',
    time: 95, targetScore: 0, targetLevel: 0, bossHp: 120, reward: 140,
    desc: '钻石舞台内靠近合成或撞击，击败 120 血音箱 Boss！',
    setup: { boss: { x: 200, y: 425, r: 42, hp: 120, name: '低音瞌睡王' } }
  },
  {
    id: 5, title: '爱心冰封阵', gimmick: 'ice', gimmickName: '爱心·破冰', terrain: 'heart',
    time: 95, targetScore: 950, targetLevel: 6, targetIce: 3, reward: 150,
    desc: '爱心缩紧前解救 3 个厚冰果冻并合出点阵搭档',
    setup: { iceSpots: [[2, 115, 44], [3, 200, 46], [2, 285, 44]] }
  },
  {
    id: 6, title: '漏斗弹射阵', gimmick: 'bumper', gimmickName: '漏斗·圆鼓', terrain: 'funnel',
    time: 100, targetScore: 1350, targetLevel: 7, reward: 170,
    desc: '聚能漏斗配合三枚圆鼓，合出紫电小角',
    setup: { bumpers: [[62, 230, 20], [338, 230, 20], [200, 305, 19]] }
  },
  {
    id: 7, title: '沙漏挤压机', gimmick: 'press', gimmickName: '沙漏·压板', terrain: 'hourglass',
    time: 105, targetScore: 1850, targetLevel: 7, reward: 190,
    desc: '沙漏收腰 + 节拍压板下达成 1850 分',
    setup: { pressSpeed: 7.2, pressPush: 26, bumpers: [[52, 290, 17], [348, 290, 17]] }
  },
  {
    id: 8, title: '重低音霸主', gimmick: 'boss', gimmickName: '圆碗·Boss', terrain: 'bowl',
    time: 115, targetScore: 0, targetLevel: 0, bossHp: 210, reward: 240,
    desc: '圆碗舞台联手圆鼓击败 210 血重低音 Boss！',
    setup: { boss: { x: 200, y: 420, r: 46, hp: 210, name: '重低音霸主' }, bumpers: [[50, 240, 18], [350, 240, 18]] }
  },
  {
    id: 9, title: '钻石冰霜夜', gimmick: 'ice', gimmickName: '钻石·破冰', terrain: 'diamond',
    time: 115, targetScore: 2400, targetLevel: 8, targetIce: 4, reward: 260,
    desc: '钻石地形中解救 4 个冰冻并合出银碟队长',
    setup: { iceSpots: [[1, 102, 42], [3, 168, 46], [3, 232, 46], [1, 298, 42]], bumpers: [[52, 255, 18], [348, 255, 18]] }
  },
  {
    id: 10, title: '极速爱心压', gimmick: 'press', gimmickName: '爱心·高压', terrain: 'heart',
    time: 105, targetScore: 3100, targetLevel: 9, reward: 290,
    desc: '爱心缩紧 + 高压压板下合出薄荷花匠并达 3100 分',
    setup: { pressSpeed: 8.8, pressPush: 25 }
  },
  {
    id: 11, title: '漏斗寒冰墙', gimmick: 'ice', gimmickName: '漏斗·冰压', terrain: 'funnel',
    time: 130, targetScore: 3900, targetLevel: 10, targetIce: 4, reward: 340,
    desc: '漏斗地形顶住压板、破冰 4 个并合出金色面罩',
    setup: { iceSpots: [[2, 115, 44], [4, 200, 50], [2, 285, 44], [1, 200, 108]], pressSpeed: 6.0, pressPush: 28 }
  },
  {
    id: 12, title: '黑胶终极战', gimmick: 'boss', gimmickName: '爱心·Boss', terrain: 'heart',
    time: 150, targetScore: 0, targetLevel: 0, bossHp: 320, reward: 500,
    desc: '爱心缩紧与压板夹击下击败 320 血黑胶音箱王！',
    setup: {
      boss: { x: 200, y: 416, r: 48, hp: 320, name: '黑胶音箱王' },
      bumpers: [[54, 245, 19], [346, 245, 19]],
      pressSpeed: 5.0, pressPush: 30
    }
  }
];

// 4 Kid-Friendly Power-Ups
globalThis.JellyProps = [
  { id: 'hammer', name: '小锤子', icon: 'hammer', desc: '点一下消除果冻或直接破冰/重击Boss' },
  { id: 'shake',  name: '晃一晃', icon: 'shake',  desc: '摇晃舞台并震裂全场冰块' },
  { id: 'wild',   name: '彩虹球', icon: 'spark',  desc: '碰谁就和谁一起升级变大' },
  { id: 'freeze', name: '冻时间', icon: 'snow',   desc: '冻住倒计时/横杆15秒（无尽附带双倍分）' },
  { id: 'lift',   name: '抬杠',   icon: 'lift',   desc: '强力顶起顶部横杠并压低上升地板！' }
];
