window.addEventListener('DOMContentLoaded', () => {
    // Check initialization
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    // Initialize modules
    Renderer.init(canvas);
    UI.init();

    // Setup initial game state
    UI.addLog("🐾 欢迎来到像素猫猫文玩店！");
    GameState.cats.push(new Cat("orange", 320, 360));
    GameState.selectedCatIndex = 0;
    
    UI.updateInventoryDropdown();
    UI.update();

    // Start Game Loop
    requestAnimationFrame(gameLoop);
});

function updateWorldTime() {
    const hour = new Date().getHours();
    let opacity = 0;
    let color = "0,0,0";
    
    if (hour >= 6 && hour < 9) { GameState.worldTimeString = "清晨"; color="255,200,100"; opacity = 0.15; }
    else if (hour >= 9 && hour < 17) { GameState.worldTimeString = "白天"; color="255,255,255"; opacity = 0; }
    else if (hour >= 17 && hour < 19) { GameState.worldTimeString = "黄昏"; color="230,126,34"; opacity = 0.25; }
    else { GameState.worldTimeString = "夜晚"; color="0,0,50"; opacity = 0.4; }
    
    const uiTime = document.getElementById("world-time");
    const overlay = document.getElementById("day-night-overlay");
    if(uiTime) uiTime.innerText = GameState.worldTimeString;
    if(overlay) overlay.style.backgroundColor = `rgba(${color}, ${opacity})`;
}

function gameLoop(time) {
    try {
        let dt = time - GameState.lastTime;
        if (dt > 50) dt = 50; // Cap dt to prevent tunneling
        GameState.lastTime = time;

        // Manual Polishing logic
        if (GameState.isPolishingCanvas && GameState.selectedItemIndex !== -1 && GameState.playerInventory[GameState.selectedItemIndex]) {
            const item = GameState.playerInventory[GameState.selectedItemIndex];
            if(GAME_DATA.ITEMS[item.type]) {
                const difficulty = GAME_DATA.ITEMS[item.type].difficulty || 1.0;
                item.polish += (dt / 1000) * (20.0 / difficulty); 
                if (item.polish > 100) item.polish = 100;
                GameState.targetItemRotation += (dt / 1000) * Math.PI * 6; 
                UI.updateInventoryDropdown();
                
                if (Math.random() < 0.05) {
                    GameState.floatingTexts.push({ x: Renderer.canvas.width/2 + (Math.random()*100-50), y: 400 + (Math.random()*100-50), text: "✨", life: 0.5 });
                }
            }
        }

        // Clear Canvas
        Renderer.ctx.clearRect(0, 0, Renderer.canvas.width, Renderer.canvas.height);
        
        // 1. Draw Background
        Renderer.drawSceneBackground(Renderer.ctx);
        
        // 2. Draw Furniture
        Renderer.drawFurnitures(Renderer.ctx);

        // 3. Update & Draw Cats
        GameState.cats.forEach(c => c.update(dt));
        GameState.cats.sort((a, b) => a.y - b.y).forEach((c, idx) => c.draw(Renderer.ctx, idx === GameState.selectedCatIndex));

        // 4. Draw Floating Texts (Hearts, Buffs, Sparkles)
        for (let i = GameState.floatingTexts.length - 1; i >= 0; i--) {
            const ft = GameState.floatingTexts[i];
            ft.y -= dt * 0.05;
            ft.life -= dt / 1000;
            Renderer.ctx.fillStyle = `rgba(231, 76, 60, ${Math.max(0, ft.life)})`;
            if (ft.text === "✨") Renderer.ctx.fillStyle = `rgba(241, 196, 15, ${Math.max(0, ft.life)})`;
            Renderer.ctx.font = "bold 24px Arial";
            Renderer.ctx.fillText(ft.text, ft.x, ft.y);
            if (ft.life <= 0) GameState.floatingTexts.splice(i, 1);
        }

        // 5. Draw Player Bracelet (for manual polish)
        if (GameState.selectedItemIndex !== -1 && GameState.playerInventory[GameState.selectedItemIndex]) {
            const item = GameState.playerInventory[GameState.selectedItemIndex];
            if(GAME_DATA.ITEMS[item.type]) {
                const ctx = Renderer.ctx;
                ctx.save();
                const centerX = Renderer.canvas.width / 2;
                const centerY = 400; // Adjusted for 480 height
                ctx.translate(centerX, centerY);
                
                // Backdrop glow
                ctx.fillStyle = GameState.isPolishingCanvas ? "rgba(241, 196, 15, 0.2)" : "rgba(255,255,255,0.1)";
                ctx.beginPath(); ctx.arc(0,0, 100, 0, Math.PI*2); ctx.fill();

                GameState.itemRotation += (GameState.targetItemRotation - GameState.itemRotation) * 0.3;
                ctx.rotate(GameState.itemRotation);
                
                const data = GAME_DATA.ITEMS[item.type];
                const p = item.polish / 100;
                const beadCount = 18;
                const beadRadius = data.size * 3;
                for (let i = 0; i < beadCount; i++) {
                    const angle = Math.PI * 2 * (i / beadCount);
                    const bx = Math.cos(angle) * 75; 
                    const by = Math.sin(angle) * 75;
                    
                    let beadColor = [150, 150, 150]; 
                    
                    if (data.isDuobao && item.beadColors && Array.isArray(item.beadColors) && item.beadColors.length > 0) {
                        const bCol = item.beadColors[i % item.beadColors.length];
                        if (bCol.isSingleGradient) {
                             beadColor = bCol; // pass the object
                        } else if(Array.isArray(bCol) && bCol.length >= 3) {
                             beadColor = [...bCol];
                        }
                    } else if (data.colorStart && data.colorEnd && data.colorStart.length >= 3 && data.colorEnd.length >= 3) {
                        beadColor[0] = Math.floor(data.colorStart[0] + (data.colorEnd[0] - data.colorStart[0]) * p);
                        beadColor[1] = Math.floor(data.colorStart[1] + (data.colorEnd[1] - data.colorStart[1]) * p);
                        beadColor[2] = Math.floor(data.colorStart[2] + (data.colorEnd[2] - data.colorStart[2]) * p);
                    }
                    
                    Renderer.drawBead(ctx, bx, by, beadRadius, p, item.type, beadColor);
                }
                ctx.restore();
            }
        }

        // Real-time world time and continuous UI updates
        if (Math.floor(time) % 60 === 0) {
            updateWorldTime();
        }
        
        let targetCat = (GameState.selectedCatIndex > -1 && GameState.cats[GameState.selectedCatIndex]) ? GameState.cats[GameState.selectedCatIndex] : null;
        if(targetCat) UI.update(targetCat);

    } catch (error) {
        console.error("Critical error in gameLoop! Rendering aborted.", error);
    }
    
    requestAnimationFrame(gameLoop);
}