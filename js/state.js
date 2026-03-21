const GameState = {
    // Player Stats
    gold: 150,
    energy: 100, // 0 to 100
    
    // Core timing
    lastTime: performance.now(),
    logs: [],
    floatingTexts: [],
    
    // Cats & Items
    cats: [], // Array of Cat instances
    selectedCatIndex: -1,
    playerInventory: [], // Array of {type, polish, beadColors}
    selectedItemIndex: -1,
    
    // Polishing Logic
    isPolishingCanvas: false,
    itemRotation: 0,
    targetItemRotation: 0,
    
    // World State
    placedFurniture: [], // Array of {type, x, y}
    salmonCount: 0,
    unlockedRooms: ["default"],
    currentRoom: "default",
    currentSubScene: "f1", // "f1", "f2", "garden"
    totalFurnitureBonus: 0,
    worldTimeString: "白天"
};