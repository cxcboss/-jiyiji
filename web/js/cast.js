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

// Single focused core mode: Endless Mode
globalThis.JellyModes = {
  endless: {
    id: 'endless',
    name: '无尽模式',
    short: '无尽',
    icon: 'infinity',
    desc: '连续合成升级果冻，抵挡加速下压的横杆；3 分钟起底部地板抬升并出现冰冻，冲击最高分！',
    timed: false
  }
};

globalThis.JellyLevels = [];

// 5 Endless Tactical Power-Ups
globalThis.JellyProps = [
  { id: 'hammer', name: '小锤子', icon: 'hammer', desc: '点选任意果冻直接消除，或敲碎厚冰块' },
  { id: 'shake',  name: '晃一晃', icon: 'shake',  desc: '摇晃舞台打乱位置并震裂全场冰块' },
  { id: 'wild',   name: '彩虹球', icon: 'spark',  desc: '万能球，碰谁就和谁一起升级变大' },
  { id: 'freeze', name: '双倍冻', icon: 'snow',   desc: '冻住上下横杆 12 秒，同时开启双倍得分' },
  { id: 'lift',   name: '抬杠',   icon: 'lift',   desc: '强力顶起顶部横杆并压低上升地板' }
];
