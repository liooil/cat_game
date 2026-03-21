const GAME_DATA = {
    BREEDS: {
        orange: { name: "橘猫", body: "#e67e22", stripe: "#d35400", ear: "#d35400", tail: "#d35400", paws: "#e67e22" },
        tuxedo: { name: "奶牛猫", body: "#ffffff", stripe: "#2c3e50", ear: "#2c3e50", tail: "#2c3e50", paws: "#ffffff" },
        tabby: { name: "狸花猫", body: "#95a5a6", stripe: "#2c3e50", ear: "#7f8c8d", tail: "#7f8c8d", paws: "#95a5a6" },
        white: { name: "白猫", body: "#ffffff", stripe: "#ecf0f1", ear: "#ffb6c1", tail: "#ffffff", paws: "#ffffff" },
        black: { name: "黑猫", body: "#2c3e50", stripe: "#1a252f", ear: "#1a252f", tail: "#2c3e50", paws: "#2c3e50" },
        siamese: { name: "暹罗猫", body: "#d2b48c", stripe: "#4a3b32", ear: "#4a3b32", tail: "#4a3b32", paws: "#4a3b32" },
        calico: { name: "三花猫", body: "#ffffff", stripe: "#111", ear: "#d35400", tail: "#111", paws: "#ffffff" }
    },
    ITEMS: {
        zijin: { name: "紫金鼠", cost: 10, baseValue: 5, difficulty: 0.5, size: 4.5, colorStart: [60, 30, 20], colorEnd: [20, 5, 5] },
        kuka: { name: "库克", cost: 30, baseValue: 20, difficulty: 0.8, size: 4, colorStart: [150, 90, 40], colorEnd: [80, 30, 10] },
        bodhi: { name: "菩提根", cost: 50, baseValue: 30, difficulty: 1.0, size: 5, isDuobao: true },
        monkey: { name: "猴头", cost: 100, baseValue: 60, difficulty: 1.5, size: 5.5, colorStart: [210, 140, 50], colorEnd: [160, 60, 20] },
        xingyue: { name: "星月", cost: 150, baseValue: 100, difficulty: 2.0, size: 5, colorStart: [160, 180, 150], colorEnd: [120, 140, 110] }
    },
    FURNITURE: {
        catTree: { name: "豪华猫爬架", cost: 200, bonus: 0.1 },
        scratchBoard: { name: "大号猫抓板", cost: 150, bonus: 0.05 },
        catBed: { name: "猫窝", cost: 100, bonus: 0.02 }
    },
    ROOMS: {
        default: { name: "默认小屋" },
        cozy: { name: "温馨小屋", cost: 500 },
        garden: { name: "花园洋房", cost: 1000 }
    },
    CONSUMABLES: {
        salmon: { name: "三文鱼", cost: 20 }
    }
};