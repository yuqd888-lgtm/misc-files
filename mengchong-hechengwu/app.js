const TILE_TYPES = ["cat_food", "dog_food", "dried_fish", "bone", "toy_ball", "bell"];
const TILE_LABELS = {
  cat_food: "猫粮",
  dog_food: "狗粮",
  dried_fish: "鱼干",
  bone: "骨头",
  toy_ball: "玩具",
  bell: "铃铛"
};
const TILE_ASSETS = {
  cat_food: "./assets/tiles/cat_food.png",
  dog_food: "./assets/tiles/dog_food.png",
  dried_fish: "./assets/tiles/dried_fish.png",
  bone: "./assets/tiles/bone.png",
  toy_ball: "./assets/tiles/toy_ball.png",
  bell: "./assets/tiles/bell.png"
};
const TILE_CAPTIONS = {
  cat_food: "猫粮",
  dog_food: "狗粮",
  dried_fish: "鱼干",
  bone: "骨头",
  toy_ball: "毛线",
  bell: "铃铛"
};
const SAVE_KEY = "mengchong_hechengwu_prototype_v1";
const EXTRA_MOVES_COST = 120;
const PET_SHARD_COST = 200;
const PROP_SHOP = {
  bomb: { label: "炸弹", cost: 80 },
  shuffle: { label: "刷新", cost: 60 },
  magic_paw: { label: "魔法爪", cost: 100 }
};
const PLAYER_LEVEL_CAP = 50;
const LEVEL_MILESTONE_REWARDS = [
  {
    level: 10,
    title: "小屋地毯礼包",
    desc: "金币 300、炸弹 2、小屋地毯装饰",
    coins: 300,
    props: { bomb: 2 }
  },
  {
    level: 20,
    title: "温馨小屋礼包",
    desc: "金币 600、刷新 3、窗帘/墙纸装饰",
    coins: 600,
    props: { shuffle: 3 }
  },
  {
    level: 30,
    title: "萌宠表情包第1弹",
    desc: "金币 1000、魔法爪 3、微信表情包奖励",
    coins: 1000,
    props: { magic_paw: 3 },
    stickerPack: true
  },
  {
    level: 40,
    title: "高级家具礼包",
    desc: "金币 1600、炸弹 3、刷新 3、稀有家具",
    coins: 1600,
    props: { bomb: 3, shuffle: 3 }
  },
  {
    level: 50,
    title: "满级限定主题",
    desc: "金币 3000、魔法爪 5、限定称号和小屋主题",
    coins: 3000,
    props: { magic_paw: 5 },
    titleReward: "满级铲屎官"
  }
];
const ROOM_INTERACTION_LINES = {
  pet: ["{name}蹭了蹭你，亲密度 +3。", "{name}开心地眨了眨眼，亲密度 +3。", "{name}伸出小爪打招呼，亲密度 +3。"],
  food: ["{name}吃饱啦，亲密度 +5。", "食盆满满的，{name}很满意，亲密度 +5。", "{name}闻到香香的宠物粮，亲密度 +5。"],
  toy: ["{name}追着毛线球转了一圈，亲密度 +5。", "毛线球滚起来了，{name}玩得很开心，亲密度 +5。", "{name}扑向了最喜欢的小玩具，亲密度 +5。"],
  fish: ["{name}收到小鱼干啦，亲密度 +6。", "{name}闻到鱼干香味，眼睛亮了，亲密度 +6。", "小鱼干太香了，{name}开心贴贴，亲密度 +6。"],
  empty: ["先去闯关收集碎片，让宠物入住吧。", "小屋还空着，等第一只宠物回家。"]
};
const ROOM_AFFINITY_GAIN = {
  pet: 3,
  food: 5,
  toy: 5,
  fish: 6
};
const ROOM_INTERACTION_COST = 50;
const PAID_ROOM_INTERACTIONS = new Set(["food", "toy", "fish"]);
const PET_ROOM_ASSETS = {
  P001: "./assets/pets/orange-kitten-cutout.png",
  P002: "./assets/pets/cream-kitten-cutout.png"
};
const ROOM_PET_VISUALS = {
  P001: { species: "cat", theme: "orange", pattern: "stripes" },
  P002: { species: "cat", theme: "cream", pattern: "soft" },
  P003: { species: "cat", theme: "blue", pattern: "round" },
  P004: { species: "cat", theme: "ragdoll", pattern: "mask" },
  P005: { species: "cat", theme: "siamese", pattern: "mask" },
  P006: { species: "dog", theme: "shiba", pattern: "cheeks" },
  P007: { species: "dog", theme: "corgi", pattern: "blaze" },
  P008: { species: "dog", theme: "golden", pattern: "soft" },
  P009: { species: "dog", theme: "samoyed", pattern: "fluffy" },
  P010: { species: "dog", theme: "collie", pattern: "blaze" },
  P011: { species: "dog", theme: "labrador", pattern: "solid" },
  P012: { species: "dog", theme: "husky", pattern: "mask" }
};

const APP_BASE_URL = new URL(".", import.meta.url);
const DATA_BASE_URL = APP_BASE_URL.pathname.endsWith("/prototype/") ? "/data" : "./data";

let levels = [];
let pets = [];
let items = [];
let board = [];
let currentLevel = null;
let path = [];
let state = loadSave();
let selectedTool = null;
let roomDialogueTimer = null;
let audioContext = null;
let bgmGainNode = null;
let bgmInterval = null;
let bgmStep = 0;
let bgmNodes = new Set();
let toolAnimationLocked = false;

const $ = (id) => document.getElementById(id);

function getDataUrl(fileName) {
  return `${DATA_BASE_URL}/${fileName}`;
}

async function main() {
  [levels, pets, items] = await Promise.all([
    fetch(getDataUrl("levels.json")).then((res) => res.json()),
    fetch(getDataUrl("pets.json")).then((res) => res.json()),
    fetch(getDataUrl("items.json")).then((res) => res.json())
  ]);

  bindEvents();
  renderHome();
}

function bindEvents() {
  $("startButton").addEventListener("click", () => startLevel(state.highestLevel));
  $("backButton").addEventListener("click", showHome);
  $("petBackButton").addEventListener("click", showHome);
  $("roomBackButton").addEventListener("click", showHome);
  $("levelRewardBackButton").addEventListener("click", showHome);
  $("taskBackButton").addEventListener("click", showHome);
  $("petBookButton").addEventListener("click", showPetBook);
  $("signInButton").addEventListener("click", showLevelRewards);
  $("playerLevelCard").addEventListener("click", showLevelRewards);
  $("dailySignInRewardButton").addEventListener("click", claimDailySignIn);
  $("roomButton").addEventListener("click", showRoom);
  $("roomFeaturedPet").addEventListener("click", (event) => {
    event.stopPropagation();
    interactWithRoom("pet");
  });
  $("roomFoodButton").addEventListener("click", (event) => {
    event.stopPropagation();
    interactWithRoom("food");
  });
  $("roomToyButton").addEventListener("click", (event) => {
    event.stopPropagation();
    interactWithRoom("toy");
  });
  $("roomFishButton").addEventListener("click", (event) => {
    event.stopPropagation();
    interactWithRoom("fish");
  });
  $("taskButton").addEventListener("click", showTasks);
  $("settingsButton").addEventListener("click", showSettings);
  $("shuffleButton").addEventListener("click", useShuffle);
  $("bombButton").addEventListener("click", () => selectTool("bomb"));
  $("pawButton").addEventListener("click", () => selectTool("magic_paw"));
  document.addEventListener("pointerdown", startBackgroundMusic, { once: true });
}

function getDefaultSave() {
  return {
    highestLevel: 1,
    coins: 0,
    props: { bomb: 2, shuffle: 2, magic_paw: 2 },
    petShards: {},
    unlockedPets: {},
    featuredPetId: "",
    roomAffinity: {},
    playerExp: 0,
    claimedLevelRewards: {},
    lastSignInDate: "",
    musicEnabled: true,
    soundEnabled: true
  };
}

function normalizeSave(saved = {}) {
  const fallback = getDefaultSave();
  return {
    ...fallback,
    ...saved,
    highestLevel: Math.max(1, Number(saved.highestLevel ?? fallback.highestLevel) || fallback.highestLevel),
    coins: Math.max(0, Number(saved.coins ?? fallback.coins) || fallback.coins),
    props: { ...fallback.props, ...(saved.props || {}) },
    petShards: { ...fallback.petShards, ...(saved.petShards || {}) },
    unlockedPets: { ...fallback.unlockedPets, ...(saved.unlockedPets || {}) },
    featuredPetId: typeof saved.featuredPetId === "string" ? saved.featuredPetId : fallback.featuredPetId,
    roomAffinity: { ...fallback.roomAffinity, ...(saved.roomAffinity || {}) },
    playerExp: Math.max(0, Number(saved.playerExp ?? fallback.playerExp) || fallback.playerExp),
    claimedLevelRewards: { ...fallback.claimedLevelRewards, ...(saved.claimedLevelRewards || {}) },
    lastSignInDate: typeof saved.lastSignInDate === "string" ? saved.lastSignInDate : fallback.lastSignInDate,
    musicEnabled: typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : fallback.musicEnabled,
    soundEnabled: typeof saved.soundEnabled === "boolean" ? saved.soundEnabled : fallback.soundEnabled
  };
}

function loadSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"));
  } catch {
    return getDefaultSave();
  }
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showHome() {
  $("homeView").classList.remove("hidden");
  $("gameView").classList.add("hidden");
  $("petBookView").classList.add("hidden");
  $("levelRewardView").classList.add("hidden");
  $("roomView").classList.add("hidden");
  $("taskView").classList.add("hidden");
  $("resultModal").classList.add("hidden");
  renderHome();
}

function showGame() {
  $("homeView").classList.add("hidden");
  $("gameView").classList.remove("hidden");
  $("petBookView").classList.add("hidden");
  $("levelRewardView").classList.add("hidden");
  $("roomView").classList.add("hidden");
  $("taskView").classList.add("hidden");
}

function showPetBook() {
  $("homeView").classList.add("hidden");
  $("gameView").classList.add("hidden");
  $("petBookView").classList.remove("hidden");
  $("levelRewardView").classList.add("hidden");
  $("roomView").classList.add("hidden");
  $("taskView").classList.add("hidden");
  $("bookCoins").textContent = state.coins;
  renderPetBook();
}

function showLevelRewards() {
  $("homeView").classList.add("hidden");
  $("gameView").classList.add("hidden");
  $("petBookView").classList.add("hidden");
  $("levelRewardView").classList.remove("hidden");
  $("roomView").classList.add("hidden");
  $("taskView").classList.add("hidden");
  renderLevelRewards();
}

function showRoom() {
  $("homeView").classList.add("hidden");
  $("gameView").classList.add("hidden");
  $("petBookView").classList.add("hidden");
  $("levelRewardView").classList.add("hidden");
  $("roomView").classList.remove("hidden");
  $("taskView").classList.add("hidden");
  renderRoom();
}

function showTasks() {
  $("homeView").classList.add("hidden");
  $("gameView").classList.add("hidden");
  $("petBookView").classList.add("hidden");
  $("levelRewardView").classList.add("hidden");
  $("roomView").classList.add("hidden");
  $("taskView").classList.remove("hidden");
  renderTasks();
}

function renderHome() {
  $("homeLevel").textContent = state.highestLevel;
  $("startLevelText").textContent = state.highestLevel;
  $("homeCoinsTop").textContent = state.coins;
  const unlockedCount = getUnlockedPetCount();
  $("homePetCount").textContent = `${unlockedCount}/${pets.length || 12}`;
  $("petProgressText").textContent = `${unlockedCount}/${pets.length || 12}`;
  const nextPet = getNextPetProgress();
  $("nextPetName").textContent = nextPet
    ? `下一只：${nextPet.name} ${nextPet.shards}/${nextPet.required}`
    : "图鉴已全部解锁";
  $("nextPetProgress").style.width = `${nextPet ? nextPet.percent : 100}%`;
  const featuredPet = getFeaturedPet();
  $("homeFeaturedPet").textContent = featuredPet
    ? `首页萌宠：${featuredPet.name}`
    : "首页萌宠：待入住";
  const today = getTodayKey();
  const signedInToday = state.lastSignInDate === today;
  $("signInStatus").textContent = signedInToday ? "奖励" : "奖励";
  $("rewardDot").classList.toggle("hidden", signedInToday);
  $("petBubble").textContent = getHomeBubbleText(unlockedCount);
  renderPlayerLevelSummary();
}

function syncStateUi() {
  renderHome();
  $("bookCoins").textContent = state.coins;
  if (!$("levelRewardView").classList.contains("hidden")) renderLevelRewards();
  if (!$("taskView").classList.contains("hidden")) renderTasks();
  if (!$("roomView").classList.contains("hidden")) renderRoomEconomy();
  if (!currentLevel) return;
  $("coins").textContent = state.coins;
  $("bombCount").textContent = state.props.bomb;
  $("shuffleCount").textContent = state.props.shuffle;
  $("pawCount").textContent = state.props.magic_paw;
}

function getUnlockedPetCount() {
  return pets.filter((pet) => state.unlockedPets[pet.id]).length;
}

function getFeaturedPet() {
  const selected = pets.find((pet) => pet.id === state.featuredPetId && state.unlockedPets[pet.id]);
  if (selected) return selected;
  return pets.find((pet) => state.unlockedPets[pet.id]) ?? null;
}

function getNextPetProgress() {
  const lockedPet = pets.find((pet) => !state.unlockedPets[pet.id]);
  if (!lockedPet) return null;
  const shards = state.petShards[lockedPet.id] || 0;
  return {
    name: lockedPet.name,
    shards,
    required: lockedPet.unlockShards,
    percent: Math.min(100, Math.round((shards / lockedPet.unlockShards) * 100))
  };
}

function getHomeBubbleText(unlockedCount) {
  if (unlockedCount >= 6) return "小屋越来越热闹啦！";
  if (state.highestLevel >= 6) return "再闯几关，就能认识新朋友！";
  if (state.lastSignInDate === getTodayKey()) return "奖励收好，出发闯关！";
  return "今天也要收集鱼干喵！";
}

function getExpForNextLevel(level) {
  if (level >= PLAYER_LEVEL_CAP) return 0;
  return Math.round((80 + level * level * 1.6) / 10) * 10;
}

function getPlayerLevelInfo() {
  let level = 1;
  let expIntoLevel = state.playerExp || 0;
  while (level < PLAYER_LEVEL_CAP) {
    const required = getExpForNextLevel(level);
    if (expIntoLevel < required) break;
    expIntoLevel -= required;
    level += 1;
  }
  const nextRequired = getExpForNextLevel(level);
  return {
    level,
    expIntoLevel: level >= PLAYER_LEVEL_CAP ? 0 : expIntoLevel,
    nextRequired,
    percent: level >= PLAYER_LEVEL_CAP ? 100 : Math.min(100, Math.round((expIntoLevel / nextRequired) * 100))
  };
}

function getLevelClearExp(level, movesLeft) {
  return Math.min(520, 70 + level.levelId * 14 + Math.max(0, movesLeft) * 4);
}

function grantPlayerExp(amount) {
  const before = getPlayerLevelInfo();
  state.playerExp = Math.max(0, (state.playerExp || 0) + amount);
  const after = getPlayerLevelInfo();
  return {
    amount,
    beforeLevel: before.level,
    afterLevel: after.level,
    leveledUp: after.level > before.level
  };
}

function renderPlayerLevelSummary() {
  const info = getPlayerLevelInfo();
  $("playerLevelText").textContent = info.level;
  $("playerExpText").textContent =
    info.level >= PLAYER_LEVEL_CAP ? "已满级" : `${info.expIntoLevel}/${info.nextRequired}`;
  $("playerExpFill").style.width = `${info.percent}%`;
}

function renderLevelRewards() {
  const info = getPlayerLevelInfo();
  $("rewardLevelText").textContent = info.level;
  $("rewardExpTitle").textContent = info.level >= PLAYER_LEVEL_CAP ? "已达到满级" : "距离下一级";
  $("rewardExpText").textContent =
    info.level >= PLAYER_LEVEL_CAP ? "Lv.50" : `${info.expIntoLevel}/${info.nextRequired}`;
  $("rewardExpFill").style.width = `${info.percent}%`;
  const today = getTodayKey();
  const signedInToday = state.lastSignInDate === today;
  $("dailyRewardText").textContent = signedInToday ? "今日已领取" : "签到：金币 +120，经验 +60，炸弹 +1";

  const list = $("levelRewardList");
  list.innerHTML = "";
  LEVEL_MILESTONE_REWARDS.forEach((reward) => {
    const claimed = Boolean(state.claimedLevelRewards?.[reward.level]);
    const available = info.level >= reward.level && !claimed;
    const card = document.createElement("article");
    card.className = `level-reward-card${available ? " available" : ""}${claimed ? " claimed" : ""}`;
    card.innerHTML = `
      <div class="reward-level-badge">Lv.${reward.level}</div>
      <div>
        <strong>${reward.title}</strong>
        <p>${reward.desc}</p>
        ${reward.stickerPack ? '<span class="sticker-reward-tag">30级微信表情包奖励</span>' : ""}
      </div>
      <button type="button">${claimed ? "已领取" : available ? "领取" : "未解锁"}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = !available;
    button.addEventListener("click", () => claimLevelReward(reward.level));
    list.append(card);
  });
}

function renderTasks() {
  $("taskCoins").textContent = state.coins;
  const today = getTodayKey();
  const signedInToday = state.lastSignInDate === today;
  const unlockedCount = getUnlockedPetCount();
  const featuredPet = getFeaturedPet();
  const affinity = featuredPet ? getRoomAffinity(featuredPet) : 0;
  const nextPet = getNextPetProgress();
  const canBuyShard = Boolean(nextPet && state.coins >= PET_SHARD_COST);
  const tasks = [
    {
      icon: "关",
      title: `继续挑战第 ${state.highestLevel} 关`,
      desc: "通关后获得金币、经验和宠物碎片。",
      complete: false,
      actionLabel: "去闯关",
      action: () => startLevel(state.highestLevel)
    },
    {
      icon: signedInToday ? "✓" : "礼",
      title: signedInToday ? "今日奖励已领取" : "领取今日奖励",
      desc: signedInToday ? "明天再来可以继续领金币和经验。" : "金币 +120，经验 +60，炸弹 +1。",
      complete: signedInToday,
      actionLabel: signedInToday ? "查看奖励" : "去领取",
      action: showLevelRewards
    },
    {
      icon: canBuyShard ? "片" : "图",
      title: nextPet ? `收集 ${nextPet.name} 碎片` : "图鉴已全部解锁",
      desc: nextPet
        ? `当前 ${nextPet.shards}/${nextPet.required}${canBuyShard ? "，金币足够补 1 片。" : "，继续闯关收集更多碎片。"}`
        : `${unlockedCount}/${pets.length || 12} 只宠物已入住。`,
      complete: !nextPet,
      actionLabel: "看图鉴",
      action: showPetBook
    },
    {
      icon: featuredPet ? "亲" : "屋",
      title: featuredPet ? `和 ${featuredPet.name} 互动` : "让宠物入住小屋",
      desc: featuredPet ? `亲密度 ${affinity}/100，投喂、玩耍、小鱼干都能提升。` : "先去图鉴解锁宠物，小屋才会热闹起来。",
      complete: featuredPet ? affinity >= 100 : false,
      actionLabel: featuredPet ? "去小屋" : "去图鉴",
      action: featuredPet ? showRoom : showPetBook
    }
  ];

  const list = $("taskList");
  list.innerHTML = "";
  tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = `task-card${task.complete ? " complete" : ""}`;
    card.innerHTML = `
      <div class="task-icon-badge">${task.icon}</div>
      <div>
        <strong>${task.title}</strong>
        <p>${task.desc}</p>
      </div>
      <button type="button">${task.actionLabel}</button>
    `;
    card.querySelector("button").addEventListener("click", task.action);
    list.append(card);
  });
}

function claimLevelReward(level) {
  const reward = LEVEL_MILESTONE_REWARDS.find((item) => item.level === level);
  if (!reward) return;
  const info = getPlayerLevelInfo();
  if (info.level < reward.level) {
    showTip(`达到 ${reward.level} 级后可以领取。`);
    return;
  }
  state.claimedLevelRewards = state.claimedLevelRewards || {};
  if (state.claimedLevelRewards[reward.level]) {
    showTip("这个等级奖励已经领取过了。");
    return;
  }
  state.coins += reward.coins || 0;
  Object.entries(reward.props || {}).forEach(([key, value]) => {
    state.props[key] = (state.props[key] || 0) + value;
  });
  state.claimedLevelRewards[reward.level] = true;
  save();
  syncStateUi();
  renderLevelRewards();
  showResult(
    "领取成功",
    `${reward.title} 已到账。${reward.stickerPack ? "已解锁 30级萌宠表情包第1弹，可作为微信聊天图片使用。" : ""}`,
    [["知道了", () => $("resultModal").classList.add("hidden")]]
  );
}

function startLevel(levelId) {
  const level = levels.find((item) => item.levelId === levelId) || levels[0];
  $("resultModal").classList.add("hidden");
  selectedTool = null;
  path = [];
  currentLevel = {
    config: level,
    movesLeft: level.moveLimit,
    score: 0,
    collected: Object.fromEntries(TILE_TYPES.map((type) => [type, 0])),
    hintTargetType: ""
  };
  delete $("movesLeft").dataset.value;
  delete $("score").dataset.value;
  board = createSolvableBoard(level);
  showGame();
  renderGame();
}

function createSolvableBoard(level) {
  const size = level.boardSize;
  const pool = getTilePool(level);
  const seedType = getSeedTileType(level, pool);
  const result = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      result[row][col] = pickTileForPosition(level, pool, result, row, col);
    }
  }
  placeTargetPath(result, seedType, level);
  return result;
}

function getSeedTileType(level, pool) {
  return level.targets[0]?.itemId ?? pool[0];
}

function getTilePool(level) {
  const targetTypes = level.targets.map((target) => target.itemId);
  const poolSize = Math.min(TILE_TYPES.length, 3 + Math.max(1, level.difficulty));
  return Array.from(new Set([...targetTypes, ...TILE_TYPES.slice(0, poolSize)]));
}

function randomTile(pool = TILE_TYPES) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTileWeight(level, tileType) {
  const difficulty = Math.max(1, level.difficulty || 1);
  const targetIndex = level.targets.findIndex((target) => target.itemId === tileType);
  if (targetIndex >= 0) {
    return Math.max(0.72, 1.5 - difficulty * 0.16 - targetIndex * 0.1);
  }
  return Math.min(1.35, 0.92 + difficulty * 0.07);
}

function weightedRandomTile(level, pool = TILE_TYPES) {
  const totalWeight = pool.reduce((sum, tileType) => sum + getTileWeight(level, tileType), 0);
  let roll = Math.random() * totalWeight;
  for (const tileType of pool) {
    roll -= getTileWeight(level, tileType);
    if (roll <= 0) return tileType;
  }
  return pool[pool.length - 1] || TILE_TYPES[0];
}

function pickTileForPosition(level, pool, targetBoard, row, col) {
  let fallback = pool[0];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const tileType = weightedRandomTile(level, pool);
    fallback = tileType;
    if (!createsLocalCrowd(targetBoard, row, col, tileType)) return tileType;
  }
  return fallback;
}

function createsLocalCrowd(targetBoard, row, col, tileType) {
  const neighborPositions = [
    [row - 1, col],
    [row, col - 1],
    [row - 1, col - 1],
    [row - 1, col + 1]
  ];
  const sameNeighbors = neighborPositions.filter(([nextRow, nextCol]) => targetBoard[nextRow]?.[nextCol] === tileType).length;
  if (sameNeighbors >= 3) return true;
  const horizontalRun =
    targetBoard[row]?.[col - 1] === tileType && targetBoard[row]?.[col - 2] === tileType;
  const verticalRun =
    targetBoard[row - 1]?.[col] === tileType && targetBoard[row - 2]?.[col] === tileType;
  return horizontalRun || verticalRun;
}

function renderGame() {
  $("levelId").textContent = currentLevel.config.levelId;
  $("levelTitle").textContent = `第 ${currentLevel.config.levelId} 关`;
  $("coins").textContent = state.coins;
  updateGameStat("movesLeft", currentLevel.movesLeft, "movesStat");
  updateGameStat("score", currentLevel.score, "scoreStat");
  renderScoreTarget();
  renderMoveWarning();
  $("targetText").innerHTML = formatTargets();
  $("bombCount").textContent = state.props.bomb;
  $("shuffleCount").textContent = state.props.shuffle;
  $("pawCount").textContent = state.props.magic_paw;
  $("bombButton").classList.toggle("active", selectedTool === "bomb");
  $("pawButton").classList.toggle("active", selectedTool === "magic_paw");
  renderBoard();
}

function formatTargets() {
  const targetParts = currentLevel.config.targets.map((target) => {
    const done = currentLevel.collected[target.itemId] || 0;
    const complete = done >= target.count;
    return `
      <span class="target-pill${complete ? " complete" : ""}">
        <img src="${TILE_ASSETS[target.itemId]}" alt="" />
        <b>${complete ? "✓" : `${Math.min(done, target.count)}/${target.count}`}</b>
        <i>${TILE_LABELS[target.itemId]}</i>
      </span>
    `;
  });
  if (currentLevel.config.scoreTarget > 0) {
    const scoreDone = currentLevel.score >= currentLevel.config.scoreTarget;
    targetParts.push(`
      <span class="target-pill score-target${scoreDone ? " complete" : ""}">
        <em>★</em>
        <b>${scoreDone ? "✓" : `${currentLevel.score}/${currentLevel.config.scoreTarget}`}</b>
        <i>分数</i>
      </span>
    `);
  }
  return targetParts.join("") || `
    <span class="target-pill score-target">
      <em>★</em>
      <b>${currentLevel.score}/${currentLevel.config.scoreTarget}</b>
      <i>分数</i>
    </span>
  `;
}

function updateGameStat(valueId, nextValue, cardId) {
  const valueEl = $(valueId);
  const cardEl = $(cardId);
  const previousValue = Number(valueEl.dataset.value || nextValue);
  valueEl.textContent = nextValue;
  valueEl.dataset.value = String(nextValue);
  if (!cardEl || previousValue === nextValue) return;
  cardEl.classList.remove("stat-pop");
  void cardEl.offsetWidth;
  cardEl.classList.add("stat-pop");
  if (valueId === "score" && nextValue > previousValue) {
    showScoreGain(nextValue - previousValue);
  }
}

function renderScoreTarget() {
  const scoreTarget = currentLevel.config.scoreTarget || 0;
  $("scoreTargetText").textContent = scoreTarget > 0 ? `/${scoreTarget}` : "";
  $("scoreStat").classList.toggle("complete", scoreTarget > 0 && currentLevel.score >= scoreTarget);
}

function renderMoveWarning() {
  const moves = currentLevel.movesLeft;
  const movesStat = $("movesStat");
  const warning = $("moveWarning");
  movesStat.classList.toggle("low", moves <= 5 && moves > 2);
  movesStat.classList.toggle("danger", moves <= 2);
  warning.textContent = moves <= 1 ? "最后一步" : moves <= 5 ? "步数紧张" : "";
}

function showScoreGain(amount) {
  const gain = $("scoreGain");
  gain.textContent = `+${amount}`;
  gain.classList.remove("show");
  void gain.offsetWidth;
  gain.classList.add("show");
  setTimeout(() => gain.classList.remove("show"), 620);
}

function renderBoard() {
  const boardEl = $("board");
  boardEl.innerHTML = "";
  boardEl.dataset.size = String(board.length);
  boardEl.style.setProperty("--board-size", board.length);
  board.forEach((row, rowIndex) => {
    row.forEach((tileType, colIndex) => {
      const tile = document.createElement("button");
      tile.className = "tile";
      tile.dataset.type = tileType;
      tile.dataset.row = rowIndex;
      tile.dataset.col = colIndex;
      tile.title = TILE_LABELS[tileType];
      tile.setAttribute("aria-label", TILE_LABELS[tileType]);
      const icon = document.createElement("img");
      icon.className = "tile-image";
      icon.src = TILE_ASSETS[tileType];
      icon.alt = "";
      icon.draggable = false;
      tile.append(icon);
      tile.addEventListener("pointerdown", startPath);
      tile.addEventListener("pointerenter", extendPath);
      tile.addEventListener("pointermove", movePath);
      tile.addEventListener("pointerup", finishPath);
      tile.addEventListener("click", flashTile);
      boardEl.append(tile);
    });
  });
}

function startPath(event) {
  event.preventDefault();
  if (selectedTool) {
    const tileEl = event.currentTarget;
    useTargetTool(Number(tileEl.dataset.row), Number(tileEl.dataset.col));
    return;
  }
  path = [];
  addTileToPath(event.currentTarget);
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function extendPath(event) {
  if (path.length === 0 || event.buttons !== 1) return;
  addTileToPath(event.currentTarget);
}

function movePath(event) {
  if (path.length === 0) return;
  if (event.pointerType === "mouse" && event.buttons !== 1) return;
  const tileEl = document.elementFromPoint(event.clientX, event.clientY)?.closest(".tile");
  if (!tileEl) return;
  addTileToPath(tileEl);
}

function flashTile(event) {
  const tileEl = event.currentTarget;
  tileEl.classList.add("tile-click-feedback");
  setTimeout(() => tileEl.classList.remove("tile-click-feedback"), 220);
}

function finishPath(event) {
  event?.preventDefault();
  const selectedEls = Array.from(document.querySelectorAll(".tile.selected"));
  const result = clearPath(path);
  path = [];

  if (!result.valid) {
    selectedEls.forEach((tile) => tile.classList.add("tile-tap-feedback"));
    setTimeout(() => {
      selectedEls.forEach((tile) => {
        tile.classList.remove("selected");
        tile.classList.remove("tile-tap-feedback");
      });
    }, 160);
    return;
  }

  selectedEls.forEach((tile) => tile.classList.remove("selected"));

  applyClearCounts(result.counts);

  if (result.bonus === "same_type") {
    const bonus = clearSameType(result.tileType);
    applyClearCounts(bonus.counts, false);
  }

  ensurePlayableTargetPath();
  renderGame();
  checkResult();
}

function addTileToPath(tileEl) {
  const row = Number(tileEl.dataset.row);
  const col = Number(tileEl.dataset.col);
  const next = { row, col, type: board[row][col], el: tileEl };
  if (!canAdd(next)) return;
  path.push(next);
  tileEl.classList.add("selected");
}

function canAdd(next) {
  if (path.some((tile) => tile.row === next.row && tile.col === next.col)) return false;
  if (path.length === 0) return true;
  const first = path[0];
  const last = path[path.length - 1];
  return (
    first.type === next.type &&
    Math.abs(last.row - next.row) <= 1 &&
    Math.abs(last.col - next.col) <= 1
  );
}

function clearPath(selectedPath) {
  if (selectedPath.length < 3) return { valid: false, clearedCount: 0 };
  const tileType = selectedPath[0].type;
  const keys = new Set(selectedPath.map((tile) => `${tile.row}:${tile.col}`));
  const counts = countKeys(keys);
  collapseAndFill(keys);
  return {
    valid: true,
    clearedCount: selectedPath.length,
    counts,
    tileType,
    bonus: selectedPath.length >= 10 ? "same_type" : selectedPath.length >= 7 ? "line" : selectedPath.length >= 5 ? "bomb" : "none"
  };
}

function countKeys(keys) {
  const counts = Object.fromEntries(TILE_TYPES.map((type) => [type, 0]));
  keys.forEach((key) => {
    const [row, col] = key.split(":").map(Number);
    counts[board[row][col]] += 1;
  });
  return counts;
}

function applyClearCounts(counts, spendMove = true) {
  if (spendMove) currentLevel.movesLeft -= 1;
  Object.entries(counts).forEach(([tileType, count]) => {
    currentLevel.collected[tileType] += count;
    currentLevel.score += count * 100;
  });
}

function collapseAndFill(keys) {
  const size = board.length;
  const level = currentLevel?.config;
  const pool = level ? getTilePool(level) : TILE_TYPES;
  for (let col = 0; col < size; col += 1) {
    const survivors = [];
    for (let row = size - 1; row >= 0; row -= 1) {
      if (!keys.has(`${row}:${col}`)) survivors.push(board[row][col]);
    }
    const column = [];
    while (column.length < size - survivors.length) {
      const row = column.length;
      column.push(level ? pickTileForPosition(level, pool, board, row, col) : randomTile(pool));
    }
    column.push(...survivors.reverse());
    for (let row = 0; row < size; row += 1) board[row][col] = column[row];
  }
  ensurePlayableTargetPath();
}

function clearSameType(tileType) {
  const keys = new Set();
  board.forEach((row, rowIndex) => {
    row.forEach((type, colIndex) => {
      if (type === tileType) keys.add(`${rowIndex}:${colIndex}`);
    });
  });
  const counts = countKeys(keys);
  collapseAndFill(keys);
  return { clearedCount: keys.size, counts };
}

function getActiveTargetType() {
  if (!currentLevel) return null;
  const unfinished = currentLevel.config.targets.filter(
    (item) => currentLevel.collected[item.itemId] < item.count
  );
  if (!unfinished.length) return null;
  const alternatives = unfinished.filter((item) => item.itemId !== currentLevel.hintTargetType);
  const candidates = alternatives.length && Math.random() < 0.72 ? alternatives : unfinished;
  const weighted = candidates.map((target) => {
    const done = currentLevel.collected[target.itemId] || 0;
    const remainingRatio = Math.max(0.15, (target.count - done) / target.count);
    return {
      itemId: target.itemId,
      weight: remainingRatio + Math.random() * 0.48
    };
  });
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const target of weighted) {
    roll -= target.weight;
    if (roll <= 0) {
      currentLevel.hintTargetType = target.itemId;
      return target.itemId;
    }
  }
  currentLevel.hintTargetType = weighted[0].itemId;
  return weighted[0].itemId;
}

function ensurePlayableTargetPath() {
  const targetType = getActiveTargetType() || getScoreFallbackTileType();
  if (!targetType || board.length < 2 || board[0].length < 3) return;
  placeTargetPath(board, targetType, currentLevel.config);
}

function getScoreFallbackTileType() {
  if (!currentLevel) return null;
  const scoreTarget = currentLevel.config.scoreTarget || 0;
  if (scoreTarget <= 0 || currentLevel.score >= scoreTarget) return null;
  const pool = getTilePool(currentLevel.config);
  return randomTile(pool);
}

function placeTargetPath(targetBoard, tileType, level = currentLevel?.config) {
  const size = targetBoard.length;
  if (!tileType || size < 3) return;
  const horizontal = Math.random() > 0.5;
  const maxRow = horizontal ? size - 1 : size - 3;
  const maxCol = horizontal ? size - 3 : size - 1;
  const row = Math.floor(Math.random() * (maxRow + 1));
  const col = Math.floor(Math.random() * (maxCol + 1));
  const pathKeys = new Set();
  for (let index = 0; index < 3; index += 1) {
    const nextRow = horizontal ? row : row + index;
    const nextCol = horizontal ? col + index : col;
    targetBoard[nextRow][nextCol] = tileType;
    pathKeys.add(`${nextRow}:${nextCol}`);
  }
  trimTargetPathCrowd(targetBoard, pathKeys, tileType, level);
}

function trimTargetPathCrowd(targetBoard, pathKeys, tileType, level) {
  if (!level || level.difficulty < 3) return;
  const pool = getTilePool(level).filter((type) => type !== tileType);
  if (!pool.length) return;
  const crowdRadius = level.difficulty >= 5 ? 2 : 1;
  const replaceKeys = new Set();
  pathKeys.forEach((key) => {
    const [row, col] = key.split(":").map(Number);
    for (let rowOffset = -crowdRadius; rowOffset <= crowdRadius; rowOffset += 1) {
      for (let colOffset = -crowdRadius; colOffset <= crowdRadius; colOffset += 1) {
        if (rowOffset === 0 && colOffset === 0) continue;
        const nextRow = row + rowOffset;
        const nextCol = col + colOffset;
        const nextKey = `${nextRow}:${nextCol}`;
        if (!pathKeys.has(nextKey) && targetBoard[nextRow]?.[nextCol] === tileType) {
          replaceKeys.add(nextKey);
        }
      }
    }
  });
  replaceKeys.forEach((key) => {
    const [row, col] = key.split(":").map(Number);
    targetBoard[row][col] = pickTileForPosition(level, pool, targetBoard, row, col);
  });
}

function checkResult() {
  const targetsDone = currentLevel.config.targets.every(
    (target) => currentLevel.collected[target.itemId] >= target.count
  );
  const scoreDone =
    currentLevel.config.scoreTarget <= 0 || currentLevel.score >= currentLevel.config.scoreTarget;

  if (targetsDone && scoreDone) {
    completeLevel();
  } else if (currentLevel.movesLeft <= 0) {
    showFail();
  }
}

function completeLevel() {
  const config = currentLevel.config;
  const expReward = getLevelClearExp(config, currentLevel.movesLeft);
  const expResult = grantPlayerExp(expReward);
  const isFinalLevel = config.levelId >= levels.length;
  const nextLevelId = isFinalLevel ? config.levelId : config.levelId + 1;
  state.coins += config.rewardCoins;
  const unlocked = [];
  for (const reward of config.rewardPetShards) {
    const pet = pets.find((item) => item.id === reward.petId);
    state.petShards[reward.petId] = (state.petShards[reward.petId] || 0) + reward.count;
    if (pet && !state.unlockedPets[pet.id] && state.petShards[pet.id] >= pet.unlockShards) {
      state.unlockedPets[pet.id] = true;
      if (!state.featuredPetId) state.featuredPetId = pet.id;
      unlocked.push(pet.name);
      if (pet.rewardType === "coins") state.coins += pet.rewardCount;
      else state.props[pet.rewardId] += pet.rewardCount;
    }
  }
  state.highestLevel = Math.max(state.highestLevel, nextLevelId);
  save();
  syncStateUi();
  showResult("通关成功", `金币 +${config.rewardCoins}，经验 +${expReward}${expResult.leveledUp ? `，升到 Lv.${expResult.afterLevel}` : ""}${unlocked.length ? `，解锁 ${unlocked.join("、")}` : ""}`, [
    [isFinalLevel ? "再玩一次" : "下一关", () => startLevel(nextLevelId)],
    ["返回首页", showHome]
  ]);
}

function showFail() {
  showResult("挑战失败", `还差一点点，可用 ${EXTRA_MOVES_COST} 金币购买 5 步继续。`, [
    [`${EXTRA_MOVES_COST} 金币 +5 步`, buyExtraMoves],
    ["重新开始", () => startLevel(currentLevel.config.levelId)],
    ["返回首页", showHome]
  ]);
}

function buyExtraMoves() {
  if (!currentLevel) return;
  if (state.coins < EXTRA_MOVES_COST) {
    showTip(`金币不足，还需要 ${EXTRA_MOVES_COST - state.coins} 金币。`);
    return;
  }
  state.coins -= EXTRA_MOVES_COST;
  currentLevel.movesLeft += 5;
  save();
  $("resultModal").classList.add("hidden");
  syncStateUi();
  renderGame();
}

function showResult(title, body, actions) {
  $("resultEyebrow").textContent = "Result";
  $("resultTitle").textContent = title;
  $("resultBody").textContent = body;
  const actionEl = $("resultActions");
  actionEl.innerHTML = "";
  actions.forEach(([label, handler]) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => {
      $("resultModal").classList.add("hidden");
      handler();
    });
    actionEl.append(button);
  });
  $("resultModal").classList.remove("hidden");
}

function showSettings() {
  const audioSupported = isAudioSupported();
  const musicStatus = audioSupported
    ? state.musicEnabled
      ? "轻快循环 BGM 播放中"
      : "已静音，不影响音效"
    : "当前浏览器不支持音频";
  const soundStatus = audioSupported
    ? state.soundEnabled
      ? "消除、道具、小屋互动音效开启"
      : "所有短音效关闭"
    : "当前浏览器不支持音频";
  const audioDisabledAttr = audioSupported ? "" : " disabled aria-disabled=\"true\"";
  $("resultEyebrow").textContent = "Settings";
  $("resultTitle").textContent = "设置";
  $("resultBody").innerHTML = `
    <div class="settings-panel">
      <div class="setting-row">
        <div>
          <strong>背景音乐</strong>
          <span>${musicStatus}</span>
        </div>
        <button class="setting-toggle${state.musicEnabled && audioSupported ? " on" : ""}" id="musicSwitchButton" type="button" aria-pressed="${state.musicEnabled && audioSupported}"${audioDisabledAttr}>
          <i></i><b>${state.musicEnabled && audioSupported ? "开" : "关"}</b>
        </button>
      </div>
      <div class="setting-row">
        <div>
          <strong>点击音效</strong>
          <span>${soundStatus}</span>
        </div>
        <button class="setting-toggle${state.soundEnabled && audioSupported ? " on" : ""}" id="soundSwitchButton" type="button" aria-pressed="${state.soundEnabled && audioSupported}"${audioDisabledAttr}>
          <i></i><b>${state.soundEnabled && audioSupported ? "开" : "关"}</b>
        </button>
      </div>
    </div>
  `;
  const actionEl = $("resultActions");
  actionEl.innerHTML = "";
  const closeButton = document.createElement("button");
  closeButton.textContent = "继续游戏";
  closeButton.addEventListener("click", () => $("resultModal").classList.add("hidden"));
  const resetButton = document.createElement("button");
  resetButton.textContent = "重置进度";
  resetButton.addEventListener("click", showResetProgressConfirm);
  actionEl.append(closeButton, resetButton);
  $("musicSwitchButton").addEventListener("click", toggleMusic);
  $("soundSwitchButton").addEventListener("click", toggleSound);
  $("resultModal").classList.remove("hidden");
}

function toggleMusic() {
  if (!isAudioSupported()) {
    showSettings();
    return;
  }
  state.musicEnabled = !state.musicEnabled;
  save();
  if (state.musicEnabled) startBackgroundMusic();
  else stopBackgroundMusic();
  showSettings();
}

function toggleSound() {
  if (!isAudioSupported()) {
    showSettings();
    return;
  }
  state.soundEnabled = !state.soundEnabled;
  save();
  showSettings();
}

function showResetProgressConfirm() {
  showResult(
    "确认重置进度",
    "会清空关卡、金币、宠物、小屋亲密度和奖励记录。此操作无法撤销。",
    [
      ["确认重置", resetProgress],
      ["取消", showSettings]
    ]
  );
}

function resetProgress() {
  localStorage.removeItem(SAVE_KEY);
  state = loadSave();
  $("resultModal").classList.add("hidden");
  if (state.musicEnabled) startBackgroundMusic();
  else stopBackgroundMusic();
  renderHome();
}

function useShuffle() {
  if (!currentLevel || toolAnimationLocked) return;
  if (state.props.shuffle <= 0) {
    shakeToolButton("shuffleButton");
    showBuyTool("shuffle");
    return;
  }
  toolAnimationLocked = true;
  state.props.shuffle -= 1;
  save();
  animateToolButton("shuffleButton", "tool-spin");
  playToolSound("shuffle");
  $("board").classList.remove("board-shuffle");
  void $("board").offsetWidth;
  $("board").classList.add("board-shuffle");
  setTimeout(() => {
    const flattened = board.flat();
    for (let index = flattened.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [flattened[index], flattened[swapIndex]] = [flattened[swapIndex], flattened[index]];
    }
    board = Array.from({ length: currentLevel.config.boardSize }, (_, row) =>
      flattened.slice(row * currentLevel.config.boardSize, (row + 1) * currentLevel.config.boardSize)
    );
    ensurePlayableTargetPath();
    renderGame();
    $("board").classList.remove("board-shuffle");
    popToolCount("shuffleCount");
    toolAnimationLocked = false;
  }, 430);
}

function selectTool(toolType) {
  if (!currentLevel || toolAnimationLocked) return;
  if (state.props[toolType] <= 0) {
    shakeToolButton(toolType === "bomb" ? "bombButton" : "pawButton");
    showBuyTool(toolType);
    return;
  }
  selectedTool = selectedTool === toolType ? null : toolType;
  if (selectedTool) playToolSound(toolType === "bomb" ? "select_bomb" : "select_paw");
  renderGame();
}

function showBuyTool(toolType) {
  const item = PROP_SHOP[toolType];
  if (!item) return;
  showResult("道具不足", `${item.label}已经用完，可花 ${item.cost} 金币购买 1 个。`, [
    [`购买 ${item.label}`, () => buyTool(toolType)],
    ["取消", () => $("resultModal").classList.add("hidden")]
  ]);
}

function buyTool(toolType) {
  const item = PROP_SHOP[toolType];
  if (!item) return;
  if (state.coins < item.cost) {
    showTip(`金币不足，还需要 ${item.cost - state.coins} 金币。`);
    return;
  }
  state.coins -= item.cost;
  state.props[toolType] += 1;
  selectedTool = toolType === "shuffle" ? null : toolType;
  save();
  $("resultModal").classList.add("hidden");
  syncStateUi();
  renderGame();
}

function useTargetTool(row, col) {
  const tool = selectedTool;
  if (!tool || state.props[tool] <= 0 || toolAnimationLocked) return;

  const keys = new Set();
  if (tool === "bomb") {
    for (let nextRow = row - 1; nextRow <= row + 1; nextRow += 1) {
      for (let nextCol = col - 1; nextCol <= col + 1; nextCol += 1) {
        if (board[nextRow]?.[nextCol]) keys.add(`${nextRow}:${nextCol}`);
      }
    }
  }

  if (tool === "magic_paw") {
    keys.add(`${row}:${col}`);
  }

  toolAnimationLocked = true;
  triggerTargetToolEffect(tool, row, col, keys);
  animateToolButton(tool === "bomb" ? "bombButton" : "pawButton", tool === "bomb" ? "tool-boom" : "tool-paw");
  playToolSound(tool);
  setTimeout(() => {
    const counts = countKeys(keys);
    collapseAndFill(keys);
    state.props[tool] -= 1;
    selectedTool = null;
    applyClearCounts(counts, false);
    save();
    renderGame();
    popToolCount(tool === "bomb" ? "bombCount" : "pawCount");
    toolAnimationLocked = false;
    checkResult();
  }, tool === "bomb" ? 360 : 300);
}

function animateToolButton(buttonId, className) {
  const button = $(buttonId);
  if (!button) return;
  button.classList.remove("tool-spin", "tool-boom", "tool-paw", "tool-shake");
  void button.offsetWidth;
  button.classList.add(className);
  setTimeout(() => button.classList.remove(className), 720);
}

function shakeToolButton(buttonId) {
  animateToolButton(buttonId, "tool-shake");
}

function popToolCount(countId) {
  const count = $(countId);
  if (!count) return;
  count.classList.remove("tool-count-pop");
  void count.offsetWidth;
  count.classList.add("tool-count-pop");
  setTimeout(() => count.classList.remove("tool-count-pop"), 420);
}

function getTileElement(row, col) {
  return document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
}

function getElementCenterInBoardWrap(element) {
  const wrap = document.querySelector(".board-wrap");
  const wrapRect = wrap.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - wrapRect.left,
    y: rect.top + rect.height / 2 - wrapRect.top
  };
}

function triggerTargetToolEffect(tool, row, col, keys) {
  const wrap = document.querySelector(".board-wrap");
  const tile = getTileElement(row, col);
  if (!wrap || !tile) return;
  wrap.querySelectorAll(".tool-burst, .tool-spark, .tool-paw-stamp").forEach((effect) => effect.remove());
  const center = getElementCenterInBoardWrap(tile);
  const burst = document.createElement("span");
  burst.className = `tool-burst ${tool === "bomb" ? "bomb-burst" : "paw-burst"}`;
  burst.style.left = `${center.x}px`;
  burst.style.top = `${center.y}px`;
  wrap.append(burst);

  if (tool === "magic_paw") {
    const paw = document.createElement("span");
    paw.className = "tool-paw-stamp";
    paw.style.left = `${center.x}px`;
    paw.style.top = `${center.y}px`;
    paw.textContent = "🐾";
    wrap.append(paw);
    setTimeout(() => paw.remove(), 650);
  }

  keys.forEach((key, index) => {
    const [nextRow, nextCol] = key.split(":").map(Number);
    const hitTile = getTileElement(nextRow, nextCol);
    if (!hitTile) return;
    hitTile.classList.add(tool === "bomb" ? "tile-bomb-hit" : "tile-paw-hit");
    const hitCenter = getElementCenterInBoardWrap(hitTile);
    const spark = document.createElement("span");
    spark.className = `tool-spark ${tool === "bomb" ? "bomb-spark" : "paw-spark"} spark-${(index % 4) + 1}`;
    spark.style.left = `${hitCenter.x}px`;
    spark.style.top = `${hitCenter.y}px`;
    spark.textContent = tool === "bomb" ? "✦" : index % 2 ? "♥" : "★";
    wrap.append(spark);
    setTimeout(() => {
      hitTile.classList.remove("tile-bomb-hit", "tile-paw-hit");
      spark.remove();
    }, 620);
  });

  setTimeout(() => burst.remove(), 680);
}

function playToolSound(tool) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  if (tool === "bomb") {
    playTone(context, { frequency: 120, endFrequency: 58, startTime: now, duration: 0.22, type: "sawtooth", volume: 0.08 });
    playTone(context, { frequency: 260, endFrequency: 90, startTime: now + 0.03, duration: 0.18, type: "triangle", volume: 0.055 });
    return;
  }
  if (tool === "shuffle") {
    playTone(context, { frequency: 420, endFrequency: 840, startTime: now, duration: 0.18, type: "triangle", volume: 0.05 });
    playTone(context, { frequency: 720, endFrequency: 520, startTime: now + 0.16, duration: 0.2, type: "sine", volume: 0.045 });
    return;
  }
  if (tool === "magic_paw") {
    playTone(context, { frequency: 680, endFrequency: 920, startTime: now, duration: 0.12, type: "sine", volume: 0.06 });
    playTone(context, { frequency: 920, endFrequency: 520, startTime: now + 0.1, duration: 0.2, type: "triangle", volume: 0.05 });
    return;
  }
  if (tool === "select_bomb") {
    playTone(context, { frequency: 210, endFrequency: 260, startTime: now, duration: 0.08, type: "sine", volume: 0.035 });
    return;
  }
  if (tool === "select_paw") {
    playTone(context, { frequency: 740, endFrequency: 860, startTime: now, duration: 0.1, type: "sine", volume: 0.035 });
  }
}

function claimDailySignIn() {
  const today = getTodayKey();
  if (state.lastSignInDate === today) {
    showResult("今日已签到", "明天再来，可以继续领取金币和道具。", [["知道了", showLevelRewards]]);
    return;
  }

  state.lastSignInDate = today;
  state.coins += 120;
  state.props.bomb += 1;
  const expResult = grantPlayerExp(60);
  save();
  renderHome();
  if (!$("levelRewardView").classList.contains("hidden")) renderLevelRewards();
  showResult("签到成功", `获得金币 +120，经验 +60，炸弹 +1${expResult.leveledUp ? `，升到 Lv.${expResult.afterLevel}` : ""}。`, [["收下奖励", showLevelRewards]]);
}

function showTip(message) {
  showResult("道具提示", message, [["知道了", () => $("resultModal").classList.add("hidden")]]);
}

function buyPetShard(petId) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet || state.unlockedPets[pet.id]) return;
  if (state.coins < PET_SHARD_COST) {
    showTip(`金币不足，还需要 ${PET_SHARD_COST - state.coins} 金币。`);
    return;
  }
  state.coins -= PET_SHARD_COST;
  state.petShards[pet.id] = (state.petShards[pet.id] || 0) + 1;
  if (state.petShards[pet.id] >= pet.unlockShards) {
    state.unlockedPets[pet.id] = true;
    if (!state.featuredPetId) state.featuredPetId = pet.id;
    if (pet.rewardType === "coins") state.coins += pet.rewardCount;
    else state.props[pet.rewardId] += pet.rewardCount;
  }
  save();
  syncStateUi();
  renderPetBook();
}

function getPetRewardLabel(pet) {
  if (pet.rewardType === "coins") return `奖励：金币 +${pet.rewardCount}`;
  return `奖励：${PROP_SHOP[pet.rewardId]?.label ?? "道具"} +${pet.rewardCount}`;
}

function getPetFaceLabel(pet) {
  return pet.name.slice(0, 1);
}

function setFeaturedPet(petId, options = {}) {
  const pet = pets.find((item) => item.id === petId);
  if (!pet || !state.unlockedPets[pet.id]) return;
  state.featuredPetId = pet.id;
  save();
  syncStateUi();
  renderPetBook();
  if (!$("roomView").classList.contains("hidden")) {
    renderRoom();
    showRoomDialogue(`${pet.name} 已在小屋中间展示。`, "pet");
  }
  if (options.silent) return;
  showResult("设置成功", `${pet.name} 已设为首页萌宠，返回首页就能看到。`, [
    ["回首页查看", showHome],
    ["继续看图鉴", () => $("resultModal").classList.add("hidden")]
  ]);
}

function showPetDetail(pet) {
  if (!state.unlockedPets[pet.id]) return;
  const isFeatured = state.featuredPetId === pet.id;
  showResult(
    pet.name,
    `${pet.star} 星宠物 · 已入住小屋\n${pet.description}\n${getPetRewardLabel(pet)}${isFeatured ? "\n当前首页萌宠" : ""}`,
    [
      [isFeatured ? "已在首页展示" : "设为首页萌宠", () => setFeaturedPet(pet.id)],
      ["返回图鉴", () => $("resultModal").classList.add("hidden")]
    ]
  );
}

function getRoomInteractionLine(type, pet) {
  const lines = pet ? ROOM_INTERACTION_LINES[type] : ROOM_INTERACTION_LINES.empty;
  const line = lines[Math.floor(Math.random() * lines.length)];
  return pet ? line.replace("{name}", pet.name) : line;
}

function getPetRoomAsset(pet) {
  return pet ? PET_ROOM_ASSETS[pet.id] : "";
}

function getRoomPetVisual(pet) {
  return pet ? ROOM_PET_VISUALS[pet.id] : null;
}

function getRoomPetAvatarMarkup(pet, size = "large") {
  const visual = getRoomPetVisual(pet);
  if (!visual) {
    return `
      <span class="room-pet-avatar room-pet-avatar-${size} room-pet-avatar-empty" aria-hidden="true">
        <span class="avatar-face"><i class="avatar-eye left"></i><i class="avatar-eye right"></i><i class="avatar-nose"></i></span>
      </span>
    `;
  }
  return `
    <span class="room-pet-avatar room-pet-avatar-${size} avatar-${visual.species} avatar-theme-${visual.theme} avatar-pattern-${visual.pattern}" aria-hidden="true">
      <span class="avatar-ear left"></span>
      <span class="avatar-ear right"></span>
      <span class="avatar-face">
        <i class="avatar-mark"></i>
        <i class="avatar-eye left"></i>
        <i class="avatar-eye right"></i>
        <i class="avatar-nose"></i>
        <i class="avatar-mouth"></i>
        <i class="avatar-cheek left"></i>
        <i class="avatar-cheek right"></i>
      </span>
      <span class="avatar-body"></span>
    </span>
  `;
}

function interactWithRoom(type) {
  const pet = getFeaturedPet();
  if (!pet) {
    showRoomDialogue(getRoomInteractionLine(type, pet), "empty");
    return;
  }

  const cost = getRoomInteractionCost(type);
  if (cost && state.coins < cost) {
    markRoomPropUnavailable(type);
    showRoomDialogue(`金币不足，还需要 ${cost - state.coins} 金币。先去闯关赚金币吧。`, "empty");
    return;
  }

  if (cost) state.coins -= cost;
  const gain = ROOM_AFFINITY_GAIN[type] || 0;
  const beforeAffinity = getRoomAffinity(pet);
  addRoomAffinity(pet, gain);
  const actualGain = getRoomAffinity(pet) - beforeAffinity;
  grantPlayerExp(type === "pet" ? 2 : 4);
  save();
  syncStateUi();
  renderRoomAffinity(pet);
  playRoomSound(type);
  triggerRoomInteractionEffect(type, { cost, gain: actualGain });
  const baseMessage = actualGain === gain
    ? getRoomInteractionLine(type, pet)
    : actualGain > 0
      ? `${pet.name} 更喜欢这里了，亲密度 +${actualGain}。`
      : `${pet.name} 已经和你很亲密啦，今天也开心陪你玩。`;
  showRoomDialogue(cost ? `${baseMessage} 金币 -${cost}。` : baseMessage, type);
}

function getRoomInteractionCost(type) {
  return PAID_ROOM_INTERACTIONS.has(type) ? ROOM_INTERACTION_COST : 0;
}

function markRoomPropUnavailable(type) {
  const propMap = {
    food: "roomFoodButton",
    toy: "roomToyButton",
    fish: "roomFishButton"
  };
  const prop = propMap[type] ? $(propMap[type]) : null;
  if (!prop) return;
  prop.classList.remove("room-prop-denied");
  void prop.offsetWidth;
  prop.classList.add("room-prop-denied");
  setTimeout(() => prop.classList.remove("room-prop-denied"), 420);
}

function getRoomAffinity(pet) {
  if (!pet) return 0;
  return Math.min(100, state.roomAffinity?.[pet.id] || 0);
}

function getRoomAffinityLevel(value) {
  if (value >= 75) return 4;
  if (value >= 50) return 3;
  if (value >= 25) return 2;
  return 1;
}

function addRoomAffinity(pet, gain) {
  if (!pet || !gain) return;
  state.roomAffinity = state.roomAffinity || {};
  state.roomAffinity[pet.id] = Math.min(100, getRoomAffinity(pet) + gain);
  save();
  renderRoomAffinity(pet);
}

function renderRoomAffinity(pet) {
  const panel = $("roomAffinity");
  panel.classList.toggle("hidden", !pet);
  if (!pet) return;
  const value = getRoomAffinity(pet);
  $("roomAffinityLabel").textContent = `亲密度 Lv.${getRoomAffinityLevel(value)}`;
  $("roomAffinityValue").textContent = `${value}/100`;
  $("roomAffinityFill").style.width = `${value}%`;
}

function showRoomDialogue(message, type = "pet") {
  const dialogue = $("roomDialogue");
  const seat = $("roomFeaturedPet");
  dialogue.textContent = message;
  dialogue.classList.remove("hidden", "pop");
  seat.classList.remove("room-pet-hop", "room-pet-wiggle", "room-pet-snooze", "room-pet-eat");
  void dialogue.offsetWidth;
  void seat.offsetWidth;
  dialogue.classList.add("pop");
  if (type === "toy") seat.classList.add("room-pet-wiggle");
  else if (type === "food") seat.classList.add("room-pet-eat");
  else if (type === "fish") seat.classList.add("room-pet-hop");
  else if (type !== "empty") seat.classList.add("room-pet-hop");
  clearTimeout(roomDialogueTimer);
  roomDialogueTimer = setTimeout(() => {
    seat.classList.remove("room-pet-hop", "room-pet-wiggle", "room-pet-snooze", "room-pet-eat");
  }, 900);
}

function getBaseAudioContext() {
  if (!isAudioSupported()) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioContext = audioContext || new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function isAudioSupported() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

function getAudioContext() {
  if (!state.soundEnabled) return null;
  return getBaseAudioContext();
}

function playTone(context, { frequency, endFrequency, startTime, duration, type = "sine", volume = 0.08 }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function startBackgroundMusic() {
  if (!state.musicEnabled || bgmInterval) return;
  const context = getBaseAudioContext();
  if (!context) return;
  const gain = getBgmGainNode(context);
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setTargetAtTime(1, context.currentTime, 0.08);
  scheduleBackgroundMusic(context);
  bgmInterval = window.setInterval(() => scheduleBackgroundMusic(context), 3600);
}

function stopBackgroundMusic() {
  if (bgmInterval) {
    window.clearInterval(bgmInterval);
    bgmInterval = null;
  }
  if (audioContext && bgmGainNode) {
    bgmGainNode.gain.cancelScheduledValues(audioContext.currentTime);
    bgmGainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  }
  stopBgmNodes();
}

function stopBgmNodes() {
  bgmNodes.forEach((node) => {
    try {
      node.stop(0);
    } catch {
      // The node may already have ended; removing it is enough.
    }
  });
  bgmNodes.clear();
}

function scheduleBackgroundMusic(context) {
  const startTime = context.currentTime + 0.04;
  const phrases = [
    [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392],
    [493.88, 587.33, 739.99, 587.33, 523.25, 587.33, 440, 392],
    [523.25, 659.25, 880, 783.99, 659.25, 587.33, 523.25, 493.88],
    [440, 523.25, 659.25, 587.33, 523.25, 493.88, 440, 392]
  ];
  const bass = [
    [261.63, 261.63, 329.63, 329.63],
    [246.94, 246.94, 293.66, 293.66],
    [261.63, 261.63, 329.63, 329.63],
    [220, 220, 196, 196]
  ];
  const phrase = phrases[bgmStep % phrases.length];
  const bassLine = bass[bgmStep % bass.length];
  phrase.forEach((note, index) => {
    playBgmNote(context, note, startTime + index * 0.42, 0.24, "triangle", 0.018);
    if (index % 2 === 0) playBgmNote(context, note * 2, startTime + index * 0.42 + 0.08, 0.1, "sine", 0.006);
  });
  bassLine.forEach((note, index) => {
    playBgmNote(context, note, startTime + index * 0.84, 0.36, "sine", 0.009);
  });
  bgmStep += 1;
}

function playBgmNote(context, frequency, startTime, duration, type, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const masterGain = getBgmGainNode(context);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1600, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(filter).connect(gain).connect(masterGain);
  bgmNodes.add(oscillator);
  oscillator.onended = () => bgmNodes.delete(oscillator);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function getBgmGainNode(context) {
  if (bgmGainNode) return bgmGainNode;
  bgmGainNode = context.createGain();
  bgmGainNode.gain.setValueAtTime(state.musicEnabled ? 1 : 0.0001, context.currentTime);
  bgmGainNode.connect(context.destination);
  return bgmGainNode;
}

function playRoomSound(type) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  if (type === "toy") {
    playTone(context, { frequency: 720, endFrequency: 980, startTime: now, duration: 0.16, type: "triangle", volume: 0.06 });
    playTone(context, { frequency: 980, endFrequency: 640, startTime: now + 0.12, duration: 0.2, type: "triangle", volume: 0.05 });
    return;
  }
  if (type === "food") {
    playTone(context, { frequency: 430, endFrequency: 520, startTime: now, duration: 0.13, type: "sine", volume: 0.045 });
    playTone(context, { frequency: 520, endFrequency: 390, startTime: now + 0.12, duration: 0.22, type: "sine", volume: 0.055 });
    return;
  }
  if (type === "fish") {
    playTone(context, { frequency: 560, endFrequency: 840, startTime: now, duration: 0.18, type: "sine", volume: 0.065 });
    playTone(context, { frequency: 760, endFrequency: 500, startTime: now + 0.16, duration: 0.22, type: "sine", volume: 0.06 });
    return;
  }
  playTone(context, { frequency: 520, endFrequency: 740, startTime: now, duration: 0.18, type: "sine", volume: 0.065 });
  playTone(context, { frequency: 740, endFrequency: 430, startTime: now + 0.15, duration: 0.24, type: "sine", volume: 0.055 });
}

function triggerRoomInteractionEffect(type, meta = {}) {
  const scene = $("roomView").querySelector(".room-scene");
  scene.querySelectorAll(".room-float-effect").forEach((effect) => effect.remove());
  const propMap = {
    food: "roomFoodButton",
    toy: "roomToyButton",
    fish: "roomFishButton"
  };
  const prop = propMap[type] ? $(propMap[type]) : null;
  if (prop) {
    prop.classList.remove("room-prop-pop", "room-prop-roll", "room-prop-glow");
    void prop.offsetWidth;
    prop.classList.add(type === "toy" ? "room-prop-roll" : type === "food" ? "room-prop-glow" : "room-prop-pop");
    setTimeout(() => prop.classList.remove("room-prop-pop", "room-prop-roll", "room-prop-glow"), 850);
  }
  const effects = {
    pet: ["♥", "喵", "♥"],
    food: ["喵", "♥", "♪"],
    toy: ["★", "♪", "★"],
    fish: ["♥", "喵", "✦"]
  };
  getRoomFloatLabels(type, meta).forEach((label, index) => {
    const bubble = document.createElement("span");
    bubble.className = `room-float-effect effect-${index + 1}`;
    bubble.textContent = label;
    scene.append(bubble);
    setTimeout(() => bubble.remove(), 900);
  });
}

function getRoomFloatLabels(type, meta = {}) {
  const petGain = meta.gain ?? ROOM_AFFINITY_GAIN.pet;
  const propGain = meta.gain ?? 0;
  const labels = {
    pet: ["喵", `+${petGain}`, "♡"],
    food: ["-50", `+${propGain}`, "♡"],
    toy: ["-50", `+${propGain}`, "★"],
    fish: ["-50", `+${propGain}`, "♡"]
  };
  return (labels[type] || labels.pet).filter((label) => label !== "+0");
}

function renderRoom() {
  const unlockedPets = pets.filter((pet) => state.unlockedPets[pet.id]);
  const featuredPet = getFeaturedPet();
  const featuredPetAsset = getPetRoomAsset(featuredPet);
  $("roomPetCount").textContent = `${unlockedPets.length}/${pets.length || 12}`;
  renderRoomEconomy();
  $("roomFeaturedPet").setAttribute("aria-label", featuredPet ? `和${featuredPet.name}互动` : "等待宠物入住");
  $("roomFeaturedPetImage").src = featuredPetAsset;
  $("roomFeaturedPetImage").alt = featuredPet ? featuredPet.name : "";
  $("roomFeaturedPetImage").classList.toggle("hidden", !featuredPetAsset);
  $("roomFeaturedPetFallback").innerHTML = getRoomPetAvatarMarkup(featuredPet, "large");
  $("roomFeaturedPetFallback").classList.toggle("hidden", Boolean(featuredPetAsset));
  renderRoomAffinity(featuredPet);
  $("roomDialogue").textContent = featuredPet ? `${featuredPet.name} 正在小屋等你。` : "点点道具，等第一只宠物入住。";
  $("roomDialogue").classList.toggle("hidden", !featuredPet);
  $("roomHint").textContent = featuredPet
    ? "点击宠物免费互动；食盆、毛线球、小鱼干每次消耗 50 金币。"
    : "解锁宠物后，它们会住进这里。";

  const grid = $("roomPetGrid");
  grid.innerHTML = "";
  if (unlockedPets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "room-empty";
    empty.textContent = "还没有宠物入住，去闯关收集碎片吧。";
    grid.append(empty);
    return;
  }

  unlockedPets.forEach((pet) => {
    const card = document.createElement("button");
    const isFeatured = featuredPet?.id === pet.id;
    card.className = `room-pet-card${isFeatured ? " active" : ""}`;
    card.innerHTML = `
      ${getRoomPetAvatarMarkup(pet, "small")}
      <strong>${pet.name}</strong>
      <small>${isFeatured ? "首页展示中" : `${pet.star} 星 · 点击展示`}</small>
    `;
    card.addEventListener("click", () => setFeaturedPet(pet.id, { silent: true }));
    grid.append(card);
  });
}

function renderRoomEconomy() {
  $("roomCoins").textContent = state.coins;
  [
    ["roomFoodButton", "food"],
    ["roomToyButton", "toy"],
    ["roomFishButton", "fish"]
  ].forEach(([id, type]) => {
    const button = $(id);
    const unavailable = state.coins < getRoomInteractionCost(type);
    button.classList.toggle("unavailable", unavailable);
    button.setAttribute("aria-disabled", String(unavailable));
    button.title = unavailable ? `金币不足，需要 ${ROOM_INTERACTION_COST} 金币` : `消耗 ${ROOM_INTERACTION_COST} 金币互动`;
  });
}

function renderPetBook() {
  const grid = $("petGrid");
  grid.innerHTML = "";
  pets.forEach((pet) => {
    const shards = state.petShards[pet.id] || 0;
    const unlocked = state.unlockedPets[pet.id] || shards >= pet.unlockShards;
    const progress = Math.min(100, (shards / pet.unlockShards) * 100);
    const remaining = Math.max(0, pet.unlockShards - shards);
    const canBuyShard = !unlocked && state.coins >= PET_SHARD_COST;
    const card = document.createElement("article");
    card.className = `book-card star-${pet.star}${unlocked ? " unlocked" : " locked"}`;
    if (unlocked) {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `查看${pet.name}详情`);
      card.addEventListener("click", () => showPetDetail(pet));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showPetDetail(pet);
        }
      });
    }
    card.innerHTML = `
      <div class="book-card-head">
        <div class="pet-face">${getPetFaceLabel(pet)}</div>
        <div class="pet-meta">
          <strong>${unlocked ? pet.name : "待解锁"}</strong>
          <span class="pet-star">${"★".repeat(pet.star)}<i>${pet.star}星</i></span>
        </div>
      </div>
      <p>${pet.description}</p>
      <div class="pet-reward">${getPetRewardLabel(pet)}</div>
      <div class="pet-progress-row">
        <span>${unlocked ? "已收集" : `还差 ${remaining} 片`}</span>
        <b>${Math.min(shards, pet.unlockShards)}/${pet.unlockShards}</b>
      </div>
      <div class="progress"><i style="width:${progress}%"></i></div>
    `;
    const action = document.createElement("button");
    action.className = `pet-shard-button${unlocked ? " unlocked" : ""}${remaining === 1 ? " urgent" : ""}`;
    if (unlocked) {
      action.textContent = "已入住";
      action.disabled = true;
    } else if (!canBuyShard) {
      action.textContent = "金币不足";
      action.disabled = true;
    } else {
      action.textContent = remaining === 1 ? `${PET_SHARD_COST} 金币马上解锁` : `${PET_SHARD_COST} 金币补 1 片`;
      action.addEventListener("click", () => buyPetShard(pet.id));
    }
    card.append(action);
    grid.append(card);
  });
}

main();
