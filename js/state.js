const GameState = {
    gold: 150,
    lastTime: performance.now(),
    logs: [],
    floatingTexts: [],
    
    cats: [], // Array of Cat instances
    selectedCatIndex: -1,
    
    playerInventory: [], // Array of {type, polish, beadColors}
    selectedItemIndex: -1,
    
    isPolishingCanvas: false,
    itemRotation: 0,
    targetItemRotation: 0,
    
    placedFurniture: [], // Array of {type, x, y}
    salmonCount: 0,
    unlockedRooms: ["default"],
    currentRoom: "default",
    currentSubScene: "f1", // "f1", "f2", "garden" - only used when room is garden
    totalFurnitureBonus: 0,
    
    worldTimeString: "白天"
};