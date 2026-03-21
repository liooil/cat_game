window.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // INITIALIZATION & SAFE START
    // ==========================================
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Canvas element not found! Game cannot start.");
        return;
    }
    const ctx = canvas.getContext("2d", { alpha: false }); // Fast render

    // Handle high DPI / Retina displays correctly to keep pixels crisp
    // However, for simplicity in logic, we maintain 800x600 logical bounds
    // We will rely on CSS to scale the 800x600.
    
    let gold = 150;
    let lastTime = performance.now();
    let logs = [];
    let floatingTexts = [];
    let selectedCatIndex = -1;

    let playerInventory = []; // {type, polish, beadColors}
    let selectedItemIndex = -1;

    let isPolishingCanvas = false;
    let itemRotation = 0;
    let targetItemRotation = 0;

    let placedFurniture = []; // {type, x, y}
    let salmonCount = 0;
    let unlockedRooms = ["default"];
    let currentRoom = "default";
    let currentSubScene = "f1"; // For garden room: f1, f2, garden
    let totalFurnitureBonus = 0;

    // Time system
    let worldTimeString = "白天";
    const overlay = document.getElementById("day-night-overlay");

    // ==========================================
    // DATA DICTIONARIES
    // ==========================================
    const BREEDS = {
        orange: { name: "橘猫", body: "#e67e22", stripe: "#d35400", ear: "#d35400", tail: "#d35400", paws: "#e67e22" },
        tuxedo: { name: "奶牛猫", body: "#ffffff", stripe: "#2c3e50", ear: "#2c3e50", tail: "#2c3e50", paws: "#ffffff" },
        tabby: { name: "狸花猫", body: "#95a5a6", stripe: "#2c3e50", ear: "#7f8c8d", tail: "#7f8c8d", paws: "#95a5a6" },
        white: { name: "白猫", body: "#ffffff", stripe: "#ecf0f1", ear: "#ffb6c1", tail: "#ffffff", paws: "#ffffff" },
        black: { name: "黑猫", body: "#2c3e50", stripe: "#1a252f", ear: "#1a252f", tail: "#2c3e50", paws: "#2c3e50" },
        siamese: { name: "暹罗猫", body: "#d2b48c", stripe: "#4a3b32", ear: "#4a3b32", tail: "#4a3b32", paws: "#4a3b32" },
        calico: { name: "三花猫", body: "#ffffff", stripe: "#111", ear: "#d35400", tail: "#111", paws: "#ffffff" }
    };

    const ITEMS = {
        zijin: { name: "紫金鼠", cost: 10, baseValue: 5, difficulty: 0.5, size: 4.5, colorStart: [60, 30, 20], colorEnd: [20, 5, 5] },
        kuka: { name: "库克", cost: 30, baseValue: 20, difficulty: 0.8, size: 4, colorStart: [150, 90, 40], colorEnd: [80, 30, 10] },
        bodhi: { name: "菩提根", cost: 50, baseValue: 30, difficulty: 1.0, size: 5, isDuobao: true },
        monkey: { name: "猴头", cost: 100, baseValue: 60, difficulty: 1.5, size: 5.5, colorStart: [210, 140, 50], colorEnd: [160, 60, 20] },
        xingyue: { name: "星月", cost: 150, baseValue: 100, difficulty: 2.0, size: 5, colorStart: [160, 180, 150], colorEnd: [120, 140, 110] }
    };

    const FURNITURE = {
        catTree: { name: "豪华猫爬架", cost: 200, bonus: 0.1 },
        scratchBoard: { name: "特大猫抓板", cost: 150, bonus: 0.05 },
        catBed: { name: "猫窝", cost: 100, bonus: 0.02 }
    };

    const ROOMS = {
        default: { name: "默认小屋" },
        cozy: { name: "温馨小屋", cost: 500 },
        garden: { name: "花园洋房", cost: 1000 }
    };

    const CONSUMABLES = {
        salmon: { name: "三文鱼", cost: 20 }
    };

    // ==========================================
    // UI BINDINGS
    // ==========================================
    const UI = {
        gold: document.getElementById("gold"),
        worldTime: document.getElementById("world-time"),
        inventorySelect: document.getElementById("inventory-select"),
        catMood: document.getElementById("cat-mood"),
        catBreed: document.getElementById("cat-breed"),
        catItem: document.getElementById("cat-item"),
        catItemDetails: document.getElementById("cat-item-details"),
        catItemPolish: document.getElementById("cat-item-polish"),
        catItemValue: document.getElementById("cat-item-value"),
        logs: document.getElementById("game-log"),
        shopPanel: document.getElementById("shop-panel"),
        sceneNav: document.getElementById("scene-nav")
    };

    const BTN = {
        buyZijin: document.getElementById("btn-buy-zijin"),
        buyKuka: document.getElementById("btn-buy-kuka"),
        buyBodhi: document.getElementById("btn-buy-bodhi"),
        buyMonkey: document.getElementById("btn-buy-monkey"),
        buyXingyue: document.getElementById("btn-buy-xingyue"),
        sell: document.getElementById("btn-sell"),
        play: document.getElementById("btn-play"),
        feed: document.getElementById("btn-feed"),
        feedSalmon: document.getElementById("btn-feed-salmon"),
        adopt: document.getElementById("btn-adopt"),
        giveCat: document.getElementById("btn-give-cat"),
        takeCat: document.getElementById("btn-take-cat"),
        manualPolish: document.getElementById("btn-manual-polish"),
        shop: document.getElementById("btn-shop"),
        closeShop: document.getElementById("btn-close-shop"),
        buyCatTree: document.getElementById("btn-buy-cat-tree"),
        buyScratchBoard: document.getElementById("btn-buy-scratch-board"),
        buyCatBed: document.getElementById("btn-buy-cat-bed"),
        buySalmon: document.getElementById("btn-buy-salmon"),
        buyRoomCozy: document.getElementById("btn-buy-room-cozy"),
        buyRoomGarden: document.getElementById("btn-buy-room-garden"),
        sceneF1: document.getElementById("btn-scene-f1"),
        sceneF2: document.getElementById("btn-scene-f2"),
        sceneGarden: document.getElementById("btn-scene-garden")
    };

    function safeBind(btn, event, handler) {
        if(btn) btn.addEventListener(event, handler);
    }

    // ==========================================
    // CAT CLASS
    // ==========================================
    const cats = []; // All cats in game

    class Cat {
        constructor(breed, x, y, scene) {
            this.x = x; 
            this.y = y; 
            this.breed = breed;
            this.scene = scene || "default"; // "default", "cozy", "f1", "f2", "garden"
            this.state = "sit"; 
            this.stateTime = 2000; 
            this.vx = 0; 
            this.mood = 100;
            this.item = null; 
            this.itemPolish = 0; 
            this.itemBeadColors = null;
            this.polishBuff = null; 
        }

        update(dt) {
            // Only update logic if they are in the current scene/room context
            let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
            if (this.scene !== activeScene) {
                // If not in current scene, just decay mood slightly and return
                this.mood = Math.max(0, this.mood - (dt / 1000) * 0.05);
                return;
            }

            this.stateTime -= dt;
            
            if (this.polishBuff) {
                this.polishBuff.duration -= dt;
                if (this.polishBuff.duration <= 0) {
                    this.polishBuff = null;
                    floatingTexts.push({ x: this.x, y: this.y - 60, text: "Buff结束", life: 1.5 });
                }
            }

            // State Machine (with Furniture interaction)
            if (this.stateTime <= 0) {
                const r = Math.random();
                let possibleStates = ["sit", "walk_left", "walk_right", "sleep"];
                
                // Furniture interactions
                if (placedFurniture.some(f => f.type === "catTree")) possibleStates.push("on_cattree");
                if (placedFurniture.some(f => f.type === "scratchBoard")) possibleStates.push("scratching");
                if (placedFurniture.some(f => f.type === "catBed")) possibleStates.push("in_bed");
                // Scene interactions
                if (currentRoom === "default" || currentRoom === "cozy" || activeScene === "f1") possibleStates.push("on_sofa");
                if (currentRoom === "default") possibleStates.push("on_desk");

                this.state = possibleStates[Math.floor(Math.random() * possibleStates.length)];
                
                if (this.state === "sit") { this.stateTime = 3000 + Math.random()*2000; this.vx = 0; }
                else if (this.state.includes("walk")) { this.stateTime = 3000 + Math.random()*2000; this.vx = (this.state === "walk_left" ? -0.04 : 0.04); }
                else if (this.state === "sleep" || this.state === "in_bed") { this.stateTime = 6000 + Math.random()*4000; this.vx = 0; }
                else if (this.state === "scratching") { this.stateTime = 4000; this.vx = 0; }
                else { this.stateTime = 5000; this.vx = 0; } // on_sofa, on_desk, on_cattree
            }

            // Movement & Collision
            if (this.state.includes("walk")) {
                this.x += this.vx * dt;
                // Floor limits
                if (this.x < 50) { this.x = 50; this.vx *= -1; this.state = "walk_right"; }
                if (this.x > canvas.width - 50) { this.x = canvas.width - 50; this.vx *= -1; this.state = "walk_left"; }
                
                // Snap to floor Y if walking
                if(activeScene === "garden") this.y = 350 + Math.random()*50;
                else this.y = 320 + Math.random()*30;
            } else {
                // Snap to specific interaction points if not walking
                if (this.state === "on_cattree") { this.x = 200; this.y = 190; } // Matches tree platform
                else if (this.state === "scratching") { this.x = 420; this.y = 310; } // Next to scratchboard
                else if (this.state === "in_bed") { this.x = 650; this.y = 330; } // In bed
                else if (this.state === "on_sofa" && currentRoom === "default") { this.x = 180; this.y = 230; }
                else if (this.state === "on_sofa" && currentRoom === "cozy") { this.x = 250; this.y = 240; }
                else if (this.state === "on_sofa" && activeScene === "f1") { this.x = 250; this.y = 240; }
                else if (this.state === "on_desk" && currentRoom === "default") { this.x = 600; this.y = 200; }
            }

            // Mood decay (slower)
            this.mood = Math.max(0, this.mood - (dt / 1000) * 0.1);

            // Polish item
            if (this.item && ITEMS[this.item]) {
                let polishRate = 0.5; // default sit/sleep
                if (this.state === "play" || this.state === "scratching") polishRate = 2.0;
                else if (this.state.includes("walk") || this.state === "on_cattree") polishRate = 1.0;
                
                const moodFactor = this.mood > 50 ? 1.0 : (this.mood > 20 ? 0.5 : 0.1);
                const buffMultiplier = this.polishBuff ? this.polishBuff.multiplier : 1.0;
                const difficulty = ITEMS[this.item].difficulty || 1.0;
                
                let increase = (dt / 1000) * (polishRate * moodFactor * buffMultiplier * 0.5 / difficulty + totalFurnitureBonus);
                this.itemPolish = Math.min(100, this.itemPolish + increase);
            }
        }

        draw(ctx, isSelected) {
            let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
            if (this.scene !== activeScene) return; // Don't draw if not in current room

            ctx.save();
            ctx.translate(this.x, this.y);
            const scale = 3.5;
            const c = BREEDS[this.breed] || BREEDS["orange"]; 
            const isSleep = this.state === "sleep" || this.state === "in_bed" || this.state === "on_cattree";
            const isScratch = this.state === "scratching";
            
            // No vertical bounce for tail, just smooth body translation for walking
            let bounceY = this.state.includes("walk") ? Math.abs(Math.sin(Date.now() / 150)) * scale : 0;
            
            const bW = 24 * scale; const bH = isSleep ? 8 * scale : 12 * scale; const bY = isSleep ? -8 * scale : -12 * scale;
            
            if (isSelected) {
                ctx.strokeStyle = "rgba(241, 196, 15, 0.8)";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(0, 10, bW/1.5, 6*scale, 0, 0, Math.PI*2); ctx.stroke();
            }

            // Drop shadow
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath(); ctx.ellipse(0, 5, bW/2, 4*scale, 0, 0, Math.PI*2); ctx.fill();

            ctx.translate(0, -bounceY);
            if (this.state === "walk_left" || this.vx < 0) ctx.scale(-1, 1);

            // Tail: Left-right slight swing when walking, still otherwise
            ctx.fillStyle = c.tail; 
            if (isSleep) {
                ctx.fillRect(-bW / 2 - 8 * scale, bY + bH - 3 * scale, 8 * scale, 3 * scale);
            } else {
                let tailSway = this.state.includes("walk") ? Math.sin(Date.now() / 200) * 3 * scale : 0;
                ctx.beginPath();
                ctx.roundRect(-bW / 2 - 3 * scale + tailSway, bY - 4 * scale, 3 * scale, 10 * scale, 2);
                ctx.fill();
            }
            
            // Back Legs
            ctx.fillStyle = c.paws; 
            if (!isSleep) { 
                ctx.beginPath(); ctx.roundRect(-bW / 2 + 2 * scale, bY + bH - 2*scale, 3 * scale, 4 * scale, 2); ctx.fill();
                ctx.beginPath(); ctx.roundRect(bW / 2 - 6 * scale, bY + bH - 2*scale, 3 * scale, 4 * scale, 2); ctx.fill();
            }
            
            // Fluffy Body (Rounded rect)
            ctx.fillStyle = c.body; 
            ctx.beginPath(); ctx.roundRect(-bW / 2, bY, bW, bH, 4*scale); ctx.fill();
            
            // Stripes
            ctx.fillStyle = c.stripe; 
            if (this.breed === "orange" || this.breed === "tabby") { 
                ctx.fillRect(-bW / 2 + 4 * scale, bY + 2 * scale, 3 * scale, 4 * scale); 
                ctx.fillRect(-bW / 2 + 12 * scale, bY + 2 * scale, 3 * scale, 4 * scale); 
            } else if (this.breed === "tuxedo") {
                ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-bW/2 + 2*scale, bY+bH/2, bW - 4*scale, bH/2, 2*scale); ctx.fill();
            }
            
            // Front Legs
            if (!isSleep) {
                ctx.fillStyle = c.paws;
                let scratchReach = isScratch ? -Math.abs(Math.sin(Date.now()/100))*3*scale : 0;
                ctx.beginPath(); ctx.roundRect(-bW / 2 + 7 * scale, bY + bH - 1*scale + scratchReach, 3 * scale, 3.5 * scale, 1); ctx.fill();
                ctx.beginPath(); ctx.roundRect(bW / 2 - 2 * scale, bY + bH - 1*scale + scratchReach, 3 * scale, 3.5 * scale, 1); ctx.fill();
            }

            // Head
            const hW = 14 * scale; const hH = 11 * scale; const hX = bW / 2 - 12 * scale; const hY = isSleep ? -14 * scale : -19 * scale;
            ctx.fillStyle = c.body; 
            ctx.beginPath(); ctx.roundRect(hX, hY, hW, hH, 3*scale); ctx.fill();
            
            // Head stripes
            ctx.fillStyle = c.stripe; 
            if (this.breed === "orange" || this.breed === "tabby") { 
                ctx.fillRect(hX + 3 * scale, hY, 1.5 * scale, 3 * scale); 
                ctx.fillRect(hX + 6 * scale, hY, 2 * scale, 4 * scale); 
                ctx.fillRect(hX + 9.5 * scale, hY, 1.5 * scale, 3 * scale); 
            } else if (this.breed === "tuxedo") {
                ctx.fillStyle = "#ffffff"; ctx.fillRect(hX+3*scale, hY+4*scale, hW-6*scale, hH-4*scale);
            } else if (this.breed === "siamese") {
                ctx.fillStyle = c.stripe; ctx.beginPath(); ctx.roundRect(hX+2*scale, hY+2*scale, hW-4*scale, hH-2*scale, 2*scale); ctx.fill();
            }
            
            // Ears
            ctx.fillStyle = c.ear; 
            ctx.beginPath(); ctx.moveTo(hX, hY+3*scale); ctx.lineTo(hX, hY-3*scale); ctx.lineTo(hX+5*scale, hY+1*scale); ctx.fill();
            ctx.beginPath(); ctx.moveTo(hX+hW, hY+3*scale); ctx.lineTo(hX+hW, hY-3*scale); ctx.lineTo(hX+hW-5*scale, hY+1*scale); ctx.fill();
            ctx.fillStyle = "#f1948a"; // inner
            ctx.beginPath(); ctx.moveTo(hX+1*scale, hY+2*scale); ctx.lineTo(hX+1*scale, hY-1*scale); ctx.lineTo(hX+3*scale, hY+1*scale); ctx.fill();
            ctx.beginPath(); ctx.moveTo(hX+hW-1*scale, hY+2*scale); ctx.lineTo(hX+hW-1*scale, hY-1*scale); ctx.lineTo(hX+hW-3*scale, hY+1*scale); ctx.fill();

            // Eyes
            ctx.fillStyle = "#111111"; 
            if (isSleep) { 
                ctx.fillRect(hX + 3 * scale, hY + 6 * scale, 2.5 * scale, 1 * scale); 
                ctx.fillRect(hX + hW - 5.5 * scale, hY + 6 * scale, 2.5 * scale, 1 * scale); 
            } else { 
                ctx.fillRect(hX + 3 * scale, hY + 4 * scale, 2 * scale, 2.5 * scale); 
                ctx.fillRect(hX + hW - 5 * scale, hY + 4 * scale, 2 * scale, 2.5 * scale); 
                ctx.fillStyle = "#ffffff"; // glint
                ctx.fillRect(hX + 3 * scale, hY + 4 * scale, 1 * scale, 1 * scale);
                ctx.fillRect(hX + hW - 5 * scale, hY + 4 * scale, 1 * scale, 1 * scale);
            }
            
            // Nose and mouth
            ctx.fillStyle = "#f1948a"; 
            ctx.fillRect(hX + hW / 2 - 1 * scale, hY + 6.5 * scale, 2 * scale, 1 * scale);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(hX + hW / 2 - 0.5 * scale, hY + 7.5 * scale, 1 * scale, 1 * scale);
            
            // Buff Effect
            if (this.polishBuff) {
                ctx.fillStyle = "rgba(255, 215, 0, 0.3)"; 
                ctx.beginPath(); ctx.arc(hX + hW/2, hY + hH/2, hW + Math.sin(Date.now()/100)*2*scale, 0, Math.PI*2); ctx.fill();
            }

            // Collar / Item
            if (this.item && ITEMS[this.item]) { 
                const data = ITEMS[this.item]; 
                const p = this.itemPolish / 100; 
                const neckX = hX + hW / 2; 
                const neckY = hY + hH - 1*scale; 
                const beadRadius = data.size * 0.8 * (scale / 2.5);
                
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI * 0.1 + (Math.PI * 0.8 * (i / 5)); 
                    const dist = 4 * scale;
                    const bx = neckX + Math.cos(angle) * dist; 
                    const by = neckY + Math.sin(angle) * dist * 0.6;
                    
                    let color = [150, 150, 150]; 
                    if (data.isDuobao && this.itemBeadColors && Array.isArray(this.itemBeadColors) && this.itemBeadColors.length > 0) {
                        const bCol = this.itemBeadColors[i % this.itemBeadColors.length];
                        if (Array.isArray(bCol) && bCol.length >= 3) color = [...bCol];
                    } else if (data.colorStart && data.colorEnd) {
                        color[0] = Math.floor(data.colorStart[0] + (data.colorEnd[0] - data.colorStart[0]) * p);
                        color[1] = Math.floor(data.colorStart[1] + (data.colorEnd[1] - data.colorStart[1]) * p);
                        color[2] = Math.floor(data.colorStart[2] + (data.colorEnd[2] - data.colorStart[2]) * p);
                    }
                    drawBead(ctx, bx, by, beadRadius, p, this.item, color);
                }
            }
            ctx.restore();
            
            if (this.state === "sleep" || this.state === "in_bed") {
                ctx.fillStyle = "#2c3e50"; ctx.font = "bold 16px monospace"; ctx.fillText("Zzz...", this.x + 10, this.y - 40);
            } else if (this.state === "play" || this.state === "scratching") {
                ctx.fillStyle = "#e74c3c"; ctx.font = "bold 16px monospace"; ctx.fillText("♪", this.x + 20, this.y - 50);
            }
        }
    }

    // ==========================================
    // RENDERING FUNCTIONS (Background & Props)
    // ==========================================
    function drawBead(ctx, bx, by, radius, p, itemType, beadColor) {
        let finalColor = [150, 150, 150]; 
        if (Array.isArray(beadColor) && beadColor.length >= 3) {
            finalColor = [beadColor[0] || 150, beadColor[1] || 150, beadColor[2] || 150];
        }

        if (itemType === "bodhi") { 
            finalColor[0] = Math.max(0, finalColor[0] - 30 - p*30);
            finalColor[1] = Math.max(0, finalColor[1] - 20 - p*30);
            finalColor[2] = Math.max(0, finalColor[2] - 10 - p*30);
        }
        
        // Base Drop Shadow for 3D effect
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath(); ctx.arc(bx + radius*0.2, by + radius*0.2, radius, 0, Math.PI*2); ctx.fill();

        // Main Bead
        ctx.fillStyle = `rgb(${finalColor[0]},${finalColor[1]},${finalColor[2]})`;
        ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI * 2); ctx.fill();

        // Inner Bevel / Gradient
        const grad = ctx.createRadialGradient(bx-radius*0.3, by-radius*0.3, 0, bx, by, radius);
        grad.addColorStop(0, "rgba(255,255,255,0.2)");
        grad.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI*2); ctx.fill();

        // Detail texturing
        if (itemType === "xingyue") {
            ctx.fillStyle = "#1e272e"; 
            ctx.fillRect(bx - radius*0.3, by - radius*0.2, 1.5, 1.5);
            ctx.fillRect(bx + radius*0.3, by - radius*0.4, 1.5, 1.5);
            ctx.fillRect(bx - radius*0.1, by + radius*0.3, 1.5, 1.5);
        } else if (itemType === "zijin") {
            ctx.fillStyle = "#a67c52"; 
            ctx.fillRect(bx - radius*0.4, by - radius*0.1, 1.5, 1.5);
            ctx.fillRect(bx + radius*0.4, by - radius*0.1, 1.5, 1.5);
            ctx.fillRect(bx, by + radius*0.4, 1.5, 1.5);
        } else if (itemType === "monkey") {
            ctx.strokeStyle = `rgba(0,0,0,0.5)`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(bx, by, radius*0.8, Math.PI*1.2, Math.PI*1.8); ctx.stroke();
            ctx.beginPath(); ctx.arc(bx, by+radius*0.2, radius*0.6, Math.PI*1.2, Math.PI*1.8); ctx.stroke();
        }

        // Specular highlight (Gloss)
        if (p > 0.1) {
            ctx.fillStyle = `rgba(255,255,255,${0.3 + p * 0.5})`;
            ctx.beginPath(); ctx.ellipse(bx - radius * 0.4, by - radius * 0.4, radius * 0.3, radius*0.15, Math.PI/4, 0, Math.PI * 2); ctx.fill();
        }
    }

    function drawPixelCatTree(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        // Base
        ctx.fillStyle = "#5c4033"; ctx.fillRect(-50, 0, 100, 20);
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(-50, 20, 100, 5); // shadow
        // Posts
        ctx.fillStyle = "#d2b48c"; ctx.fillRect(-25, -150, 20, 150); ctx.fillRect(15, -80, 20, 80);
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth = 2;
        ctx.beginPath(); for(let i=10; i<=140; i+=8) { ctx.moveTo(-25, -i); ctx.lineTo(-5, -i+4); } ctx.stroke();
        ctx.beginPath(); for(let i=10; i<=70; i+=8) { ctx.moveTo(15, -i); ctx.lineTo(35, -i+4); } ctx.stroke();
        // Platforms
        ctx.fillStyle = "#8b4513"; ctx.roundRect(0, -80, 60, 15, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(2, -80, 56, 8, 3); ctx.fill(); // cushion
        ctx.fillStyle = "#8b4513"; ctx.roundRect(-60, -150, 70, 15, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(-58, -150, 66, 8, 3); ctx.fill();
        ctx.restore();
    }

    function drawPixelScratchBoard(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-45, 10, 90, 10);
        // Frame
        ctx.fillStyle = "#8b4513"; 
        ctx.beginPath(); ctx.moveTo(-40, 10); ctx.lineTo(40, 10); ctx.lineTo(60, -50); ctx.lineTo(-20, -50); ctx.closePath(); ctx.fill();
        // Sisal
        ctx.fillStyle = "#d2b48c"; 
        ctx.beginPath(); ctx.moveTo(-30, 5); ctx.lineTo(30, 5); ctx.lineTo(47, -45); ctx.lineTo(-13, -45); ctx.closePath(); ctx.fill();
        // Texture
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth=2;
        for(let i=0; i<8; i++) { ctx.beginPath(); ctx.moveTo(-25+i*5, 0-i*5); ctx.lineTo(25+i*5, 0-i*5); ctx.stroke(); }
        ctx.restore();
    }

    function drawPixelCatBed(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 10, 45, 20, 0, 0, Math.PI*2); ctx.fill();
        // Outer bed
        ctx.fillStyle = "#cd5c5c"; ctx.beginPath(); ctx.ellipse(0, 0, 50, 25, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#a52a2a"; ctx.beginPath(); ctx.ellipse(0, 5, 45, 18, 0, 0, Math.PI*2); ctx.fill(); // inner depth
        // Inner cushion
        ctx.fillStyle = "#f08080"; ctx.beginPath(); ctx.ellipse(0, 3, 38, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
    
    function drawSofa(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-70, 40, 140, 10);
        ctx.fillStyle = "#2c3e50"; ctx.roundRect(-80, -30, 160, 60, 10); ctx.fill(); // back
        ctx.fillStyle = "#34495e"; ctx.roundRect(-75, 10, 150, 40, 5); ctx.fill(); // seat
        ctx.fillStyle = "#1a252f"; ctx.roundRect(-90, 0, 20, 50, 5); ctx.fill(); // arm L
        ctx.fillStyle = "#1a252f"; ctx.roundRect(70, 0, 20, 50, 5); ctx.fill(); // arm R
        ctx.restore();
    }
    
    function drawDesk(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-60, 80, 120, 10); // shadow
        ctx.fillStyle = "#7f8c8d"; ctx.fillRect(-50, 0, 10, 80); ctx.fillRect(40, 0, 10, 80); // legs
        ctx.fillStyle = "#95a5a6"; ctx.roundRect(-60, -10, 120, 15, 2); ctx.fill(); // top
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(-30, -50, 60, 40); // monitor
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(-25, -45, 50, 30); // screen
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-10, -10, 20, 10); // stand
        ctx.restore();
    }
    
    function drawDiningTable(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 50, 80, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#8b4513"; ctx.fillRect(-60, 0, 10, 50); ctx.fillRect(50, 0, 10, 50); // legs
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, 0, 90, 30, 0, 0, Math.PI*2); ctx.fill(); // tablecloth
        // Vase
        ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.ellipse(0, -15, 10, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(-5, -35, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(5, -38, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#27ae60"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(-5, -30); ctx.moveTo(0,-15); ctx.lineTo(5, -30); ctx.stroke();
        ctx.restore();
    }

    function drawWindow(ctx, x, y, width, height, type) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "#87CEEB"; // sky blue
        ctx.fillRect(0, 0, width, height);
        
        // Window Frame
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 10;
        if(type==="cozy") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 15; }
        if(type==="garden") { ctx.strokeStyle = "#d2b48c"; ctx.lineWidth = 12; }
        ctx.strokeRect(0, 0, width, height);
        ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();
        
        // Sunshine rays
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(width*0.8, height); ctx.lineTo(width, height); ctx.lineTo(width*0.2, 0); ctx.fill();
        ctx.restore();
    }

    function drawSceneBackground(ctx) {
        // Base structure based on scene
        if (currentRoom === "default") {
            ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0, 0, canvas.width, 200); // Wall
            for (let i = 0; i < canvas.width; i += 40) { ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fillRect(i, 0, 2, 200); }
            ctx.fillStyle = "#7f8c8d"; ctx.fillRect(0, 190, canvas.width, 10); // Baseboard
            ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0, 200, canvas.width, 400); // Floor
            
            drawWindow(ctx, 350, 40, 100, 120, "default");
            drawSofa(ctx, 180, 200);
            drawDesk(ctx, 600, 190);
        } 
        else if (currentRoom === "cozy") {
            ctx.fillStyle = "#f5deb3"; ctx.fillRect(0, 0, canvas.width, 200); 
            for (let i = 0; i < canvas.width; i += 60) { ctx.fillStyle = "rgba(139,69,19,0.1)"; ctx.fillRect(i, 0, 10, 200); }
            ctx.fillStyle = "#8b4513"; ctx.fillRect(0, 190, canvas.width, 10); 
            ctx.fillStyle = "#d2b48c"; ctx.fillRect(0, 200, canvas.width, 400); 
            
            drawWindow(ctx, 100, 30, 150, 140, "cozy");
            // Painting
            ctx.fillStyle = "#8b4513"; ctx.fillRect(500, 50, 120, 80); ctx.fillStyle="#ecf0f1"; ctx.fillRect(510, 60, 100, 60);
            ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(560, 90, 15, 0, Math.PI*2); ctx.fill();
            // Lamp
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(700, 80, 5, 120); ctx.fillStyle="#f1c40f"; ctx.beginPath(); ctx.moveTo(680, 80); ctx.lineTo(725, 80); ctx.lineTo(710, 40); ctx.lineTo(695, 40); ctx.fill();
            drawDiningTable(ctx, 400, 220);
        }
        else if (currentRoom === "garden") {
            if (currentSubScene === "f1") {
                ctx.fillStyle = "#e8f8f5"; ctx.fillRect(0, 0, canvas.width, 200); 
                ctx.fillStyle = "#b2babb"; ctx.fillRect(0, 190, canvas.width, 10); 
                ctx.fillStyle = "#d0d3d4"; ctx.fillRect(0, 200, canvas.width, 400); 
                
                drawWindow(ctx, 400, 20, 120, 150, "garden");
                // Stairs
                ctx.fillStyle = "#8b4513"; 
                for(let i=0; i<6; i++) { ctx.fillRect(0, 190 - i*30, 150 - i*20, 30); ctx.fillStyle="#a0522d"; ctx.fillRect(0, 190 - i*30, 150 - i*20, 5); ctx.fillStyle="#8b4513"; }
                drawSofa(ctx, 650, 210);
            } 
            else if (currentSubScene === "f2") {
                ctx.fillStyle = "#f4f6f7"; ctx.fillRect(0, 0, canvas.width, 200); 
                ctx.fillStyle = "#99a3a4"; ctx.fillRect(0, 190, canvas.width, 10); 
                ctx.fillStyle = "#e5e8e8"; ctx.fillRect(0, 200, canvas.width, 400); 
                
                drawWindow(ctx, 100, 30, 100, 120, "garden");
                drawWindow(ctx, 600, 30, 100, 120, "garden");
                // Bookshelf
                ctx.fillStyle = "#5c4033"; ctx.fillRect(300, 20, 150, 170); ctx.fillStyle="#8b4513"; ctx.fillRect(310, 30, 130, 150);
                for(let i=0; i<4; i++) { ctx.fillStyle="#5c4033"; ctx.fillRect(310, 60+i*30, 130, 5); } // shelves
                ctx.fillStyle = "#e74c3c"; ctx.fillRect(320, 40, 15, 20); ctx.fillStyle = "#3498db"; ctx.fillRect(340, 35, 10, 25); // books
                // Desk & Pen
                drawDesk(ctx, 400, 220);
                ctx.fillStyle = "#000"; ctx.fillRect(380, 210, 15, 15); // ink
                ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(390, 215); ctx.lineTo(410, 200); ctx.stroke(); // pen
            }
            else if (currentSubScene === "garden") {
                ctx.fillStyle = "#a9dfbf"; ctx.fillRect(0, 0, canvas.width, 150); // Sky
                ctx.fillStyle = "#2ecc71"; ctx.fillRect(0, 150, canvas.width, 450); // Grass
                
                // Tulips
                for(let i=0; i<20; i++) {
                    let tx = 50 + Math.random()*700; let ty = 160 + Math.random()*150;
                    ctx.fillStyle = "#27ae60"; ctx.fillRect(tx, ty, 3, 20); // stem
                    ctx.fillStyle = ["#e74c3c", "#f1c40f", "#9b59b6"][Math.floor(Math.random()*3)];
                    ctx.beginPath(); ctx.arc(tx+1.5, ty-5, 8, 0, Math.PI); ctx.fill(); // flower
                }
                
                // Cat Topiary (Grass sculpture)
                ctx.fillStyle = "#1e8449";
                ctx.beginPath(); ctx.ellipse(400, 250, 60, 40, 0, 0, Math.PI*2); ctx.fill(); // body
                ctx.beginPath(); ctx.ellipse(360, 200, 30, 25, 0, 0, Math.PI*2); ctx.fill(); // head
                ctx.beginPath(); ctx.moveTo(340, 180); ctx.lineTo(350, 150); ctx.lineTo(370, 180); ctx.fill(); // ear L
                ctx.beginPath(); ctx.moveTo(370, 180); ctx.lineTo(380, 150); ctx.lineTo(390, 180); ctx.fill(); // ear R
            }
        }
    }

    function drawFurnitures(ctx) {
        let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
        placedFurniture.forEach(item => {
            // Only draw furniture in f1 or default/cozy
            if (activeScene === "f2" || activeScene === "garden") return; 

            if (item.type === "catTree") drawPixelCatTree(ctx, item.x, item.y);
            else if (item.type === "scratchBoard") drawPixelScratchBoard(ctx, item.x, item.y);
            else if (item.type === "catBed") drawPixelCatBed(ctx, item.x, item.y);
        });
    }

    // ==========================================
    // LOGIC & UPDATES
    // ==========================================
    function updateWorldTime() {
        const hour = new Date().getHours();
        let opacity = 0;
        let color = "0,0,0";
        
        if (hour >= 6 && hour < 9) { worldTimeString = "清晨"; color="255,200,100"; opacity = 0.2; }
        else if (hour >= 9 && hour < 17) { worldTimeString = "白天"; color="255,255,255"; opacity = 0; }
        else if (hour >= 17 && hour < 19) { worldTimeString = "黄昏"; color="230,126,34"; opacity = 0.3; }
        else { worldTimeString = "夜晚"; color="0,0,50"; opacity = 0.5; }
        
        if(UI.worldTime) UI.worldTime.innerText = worldTimeString;
        if(overlay) overlay.style.backgroundColor = `rgba(${color}, ${opacity})`;
    }

    function addLog(msg) { 
        logs.unshift(msg); 
        if (logs.length > 50) logs.pop(); 
        if(UI.logs) UI.logs.innerHTML = logs.map(l => `<li>${l}</li>`).join(""); 
    }

    function updateInventoryDropdown() {
        if (!UI.inventorySelect) return;
        if (playerInventory.length === 0) { 
            UI.inventorySelect.innerHTML = '<option value="-1">空</option>'; 
            selectedItemIndex = -1;
        } else {
            if (selectedItemIndex < 0 || selectedItemIndex >= playerInventory.length) selectedItemIndex = 0;
            UI.inventorySelect.innerHTML = playerInventory.map((item, idx) => {
                const name = ITEMS[item.type] ? ITEMS[item.type].name : "未知";
                return `<option value="${idx}" ${idx === selectedItemIndex ? 'selected' : ''}>${name} (${item.polish.toFixed(1)}%)</option>`;
            }).join('');
        }
    }

    function updateUI(activeCat) {
        if (!UI.gold) return;
        UI.gold.innerText = Math.floor(gold);
        const hasItem = selectedItemIndex !== -1;
        
        if (BTN.sell) BTN.sell.disabled = !hasItem;
        if (BTN.manualPolish) BTN.manualPolish.style.filter = hasItem ? "grayscale(0%)" : "grayscale(100%)";
        
        // Show scene nav if in garden
        if (UI.sceneNav) {
            UI.sceneNav.style.display = currentRoom === "garden" ? "block" : "none";
        }
        if (BTN.sceneF1) BTN.sceneF1.style.border = currentSubScene === "f1" ? "2px solid #f1c40f" : "none";
        if (BTN.sceneF2) BTN.sceneF2.style.border = currentSubScene === "f2" ? "2px solid #f1c40f" : "none";
        if (BTN.sceneGarden) BTN.sceneGarden.style.border = currentSubScene === "garden" ? "2px solid #f1c40f" : "none";

        // We receive the activeCat to continuously update its polish values smoothly
        let targetCat = activeCat;
        if (!targetCat && cats.length > 0 && selectedCatIndex > -1) {
            targetCat = cats[selectedCatIndex];
        }

        if (targetCat) {
            UI.catMood.innerText = Math.floor(targetCat.mood); 
            UI.catBreed.innerText = BREEDS[targetCat.breed] ? BREEDS[targetCat.breed].name : "未知";
            
            if (targetCat.item && ITEMS[targetCat.item]) { 
                UI.catItem.innerText = ITEMS[targetCat.item].name; 
                UI.catItemDetails.style.display = "block"; 
                // CONTINUOUS REFRESH format to 2 decimals for smooth look
                UI.catItemPolish.innerText = targetCat.itemPolish.toFixed(2); 
                UI.catItemValue.innerText = Math.floor(ITEMS[targetCat.item].baseValue * (1 + (targetCat.itemPolish / 100) * 5)); 
            } else { 
                UI.catItem.innerText = "无"; 
                UI.catItemDetails.style.display = "none"; 
            }
            
            if(BTN.giveCat) BTN.giveCat.disabled = !hasItem || !!targetCat.item; 
            if(BTN.takeCat) BTN.takeCat.disabled = !targetCat.item;
            
            if (BTN.feedSalmon) {
                if (salmonCount > 0) {
                    BTN.feedSalmon.style.display = 'block';
                    BTN.feedSalmon.innerText = `喂三文鱼 (${salmonCount})`;
                } else {
                    BTN.feedSalmon.style.display = 'none';
                }
            }
        } else {
            if(UI.catBreed) UI.catBreed.innerText = "无"; 
            if(UI.catMood) UI.catMood.innerText = "N/A"; 
            if(UI.catItem) UI.catItem.innerText = "无";
            if(UI.catItemDetails) UI.catItemDetails.style.display = "none";
            if(BTN.giveCat) BTN.giveCat.disabled = true; 
            if(BTN.takeCat) BTN.takeCat.disabled = true;
            if(BTN.feedSalmon) BTN.feedSalmon.style.display = 'none';
        }

        // Shop buttons
        if(BTN.buyCatTree) BTN.buyCatTree.disabled = gold < FURNITURE.catTree.cost;
        if(BTN.buyScratchBoard) BTN.buyScratchBoard.disabled = gold < FURNITURE.scratchBoard.cost;
        if(BTN.buyCatBed) BTN.buyCatBed.disabled = gold < FURNITURE.catBed.cost;
        if(BTN.buySalmon) BTN.buySalmon.disabled = gold < CONSUMABLES.salmon.cost;
        
        if(BTN.buyRoomCozy) {
            BTN.buyRoomCozy.disabled = gold < ROOMS.cozy.cost && !unlockedRooms.includes('cozy');
            BTN.buyRoomCozy.innerText = unlockedRooms.includes('cozy') ? "切换到温馨小屋" : `温馨小屋 (${ROOMS.cozy.cost})`;
        }
        if(BTN.buyRoomGarden) {
            BTN.buyRoomGarden.disabled = gold < ROOMS.garden.cost && !unlockedRooms.includes('garden');
            BTN.buyRoomGarden.innerText = unlockedRooms.includes('garden') ? "切换到花园洋房" : `花园洋房 (${ROOMS.garden.cost})`;
        }
    }

    // ==========================================
    // EVENT BINDINGS
    // ==========================================
    safeBind(BTN.shop, "click", () => { if(UI.shopPanel) UI.shopPanel.style.display = 'flex'; updateUI(); });
    safeBind(BTN.closeShop, "click", () => { if(UI.shopPanel) UI.shopPanel.style.display = 'none'; });
    
    function buyAndLog(cost, name, action) {
        if (gold >= cost) { gold -= cost; addLog(`购买了【${name}】！`); action(); updateUI(); } 
        else { addLog(`金币不足！`); }
    }
    
    safeBind(BTN.buyCatTree, "click", () => buyAndLog(FURNITURE.catTree.cost, FURNITURE.catTree.name, () => { 
        placedFurniture.push({ type: 'catTree', x: 200, y: 340 }); 
        totalFurnitureBonus += FURNITURE.catTree.bonus; 
    }));
    safeBind(BTN.buyScratchBoard, "click", () => buyAndLog(FURNITURE.scratchBoard.cost, FURNITURE.scratchBoard.name, () => { 
        placedFurniture.push({ type: 'scratchBoard', x: 450, y: 360 }); 
        totalFurnitureBonus += FURNITURE.scratchBoard.bonus; 
    }));
    safeBind(BTN.buyCatBed, "click", () => buyAndLog(FURNITURE.catBed.cost, FURNITURE.catBed.name, () => { 
        placedFurniture.push({ type: 'catBed', x: 650, y: 350 }); 
        totalFurnitureBonus += FURNITURE.catBed.bonus; 
    }));
    safeBind(BTN.buySalmon, "click", () => buyAndLog(CONSUMABLES.salmon.cost, CONSUMABLES.salmon.name, () => salmonCount++));
    
    function buyRoom(type) {
        const data = ROOMS[type];
        if(!data) return;
        if (unlockedRooms.includes(type)) { 
            currentRoom = type; 
            currentSubScene = "f1"; // Reset subscene
            addLog(`切换到【${data.name}】。`); 
        }
        else if (gold >= data.cost) { 
            gold -= data.cost; unlockedRooms.push(type); currentRoom = type; currentSubScene="f1";
            addLog(`解锁【${data.name}】！`); 
        }
        updateUI();
    }
    safeBind(BTN.buyRoomCozy, "click", () => buyRoom('cozy'));
    safeBind(BTN.buyRoomGarden, "click", () => buyRoom('garden'));

    safeBind(BTN.sceneF1, "click", () => { currentSubScene = "f1"; addLog("来到了一楼大厅"); updateUI(); });
    safeBind(BTN.sceneF2, "click", () => { currentSubScene = "f2"; addLog("来到了二楼书房"); updateUI(); });
    safeBind(BTN.sceneGarden, "click", () => { currentSubScene = "garden"; addLog("来到了室外花园"); updateUI(); });

    safeBind(BTN.adopt, "click", () => {
        if (gold >= 100) {
            gold -= 100;
            const breedKeys = Object.keys(BREEDS);
            const randomBreed = breedKeys[Math.floor(Math.random() * breedKeys.length)];
            let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
            cats.push(new Cat(randomBreed, 100 + Math.random() * 600, 300, activeScene));
            selectedCatIndex = cats.length - 1;
            addLog(`在当前区域领养了一只【${BREEDS[randomBreed].name}】！`);
            updateUI();
        }
    });

    const itemButtons = { zijin: BTN.buyZijin, kuka: BTN.buyKuka, bodhi: BTN.buyBodhi, monkey: BTN.buyMonkey, xingyue: BTN.buyXingyue };
    Object.keys(itemButtons).forEach(key => {
        safeBind(itemButtons[key], "click", () => {
            const itemData = ITEMS[key];
            if(!itemData) return;
            buyAndLog(itemData.cost, itemData.name, () => {
                let beadColors = null;
                if (itemData.isDuobao) beadColors = Array.from({length: 18}, () => [100+Math.random()*100, 80+Math.random()*80, 60+Math.random()*60]);
                playerInventory.push({ type: key, polish: 0, beadColors });
                selectedItemIndex = playerInventory.length - 1;
                updateInventoryDropdown();
            });
        });
    });
    
    safeBind(BTN.sell, "click", () => {
        if (selectedItemIndex !== -1 && playerInventory[selectedItemIndex]) {
            const item = playerInventory[selectedItemIndex];
            if(ITEMS[item.type]) {
                const value = Math.floor(ITEMS[item.type].baseValue * (1 + (item.polish / 100) * 5));
                gold += value;
                addLog(`出售了【${ITEMS[item.type].name}】，获得 ${value} 金币！`);
            }
            playerInventory.splice(selectedItemIndex, 1);
            if (selectedItemIndex >= playerInventory.length) selectedItemIndex = playerInventory.length - 1;
            updateInventoryDropdown();
            updateUI();
        }
    });

    safeBind(BTN.feed, "click", () => {
        if (gold >= 5 && cats.length > 0) {
            gold -= 5;
            let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
            cats.filter(c => c.scene === activeScene).forEach(c => {
                c.mood = Math.min(100, c.mood + 20);
                floatingTexts.push({ x: c.x, y: c.y - 60, text: "🐟", life: 1.0 });
            });
            addLog(`喂了猫罐头，当前区域的猫猫心情变好。`);
            updateUI();
        }
    });

    safeBind(BTN.feedSalmon, "click", () => {
        if (salmonCount > 0 && selectedCatIndex !== -1 && cats[selectedCatIndex]) {
            salmonCount--;
            const c = cats[selectedCatIndex];
            c.mood = Math.min(100, c.mood + 50);
            c.polishBuff = { multiplier: 2.0, duration: 30000 }; 
            floatingTexts.push({ x: c.x, y: c.y - 60, text: "🍣 大满足!", life: 1.5 });
            addLog(`给【${BREEDS[c.breed].name}】吃了三文鱼，包浆速度翻倍！`);
            updateUI();
        }
    });

    safeBind(BTN.play, "click", () => {
        if (selectedCatIndex !== -1 && cats[selectedCatIndex]) {
            const c = cats[selectedCatIndex];
            c.mood = Math.min(100, c.mood + 15);
            c.state = "play"; c.stateTime = 3000;
            floatingTexts.push({ x: c.x, y: c.y - 60, text: "🎵", life: 1.0 });
            addLog(`陪猫猫玩耍，它很开心！`);
            updateUI();
        }
    });
    
    safeBind(BTN.giveCat, "click", () => {
        if (selectedCatIndex !== -1 && selectedItemIndex !== -1 && cats[selectedCatIndex] && !cats[selectedCatIndex].item) {
            const item = playerInventory.splice(selectedItemIndex, 1)[0];
            cats[selectedCatIndex].item = item.type;
            cats[selectedCatIndex].itemPolish = item.polish;
            cats[selectedCatIndex].itemBeadColors = item.beadColors;
            if (selectedItemIndex >= playerInventory.length) selectedItemIndex = playerInventory.length - 1;
            addLog(`把手串给猫猫戴上了。`);
            updateInventoryDropdown();
            updateUI();
        }
    });
    
    safeBind(BTN.takeCat, "click", () => {
        if (selectedCatIndex !== -1 && cats[selectedCatIndex] && cats[selectedCatIndex].item) {
            const c = cats[selectedCatIndex];
            playerInventory.push({ type: c.item, polish: c.itemPolish, beadColors: c.itemBeadColors });
            c.item = null; c.itemPolish = 0; c.itemBeadColors = null;
            selectedItemIndex = playerInventory.length - 1;
            addLog(`从猫猫身上取回了手串。`);
            updateInventoryDropdown();
            updateUI();
        }
    });

    if(UI.inventorySelect) {
        UI.inventorySelect.addEventListener("change", (e) => {
            selectedItemIndex = parseInt(e.target.value);
            updateUI();
        });
    }

    safeBind(BTN.manualPolish, "mousedown", () => isPolishingCanvas = true);
    safeBind(BTN.manualPolish, "mouseup", () => isPolishingCanvas = false);
    safeBind(BTN.manualPolish, "mouseleave", () => isPolishingCanvas = false);
    
    // Exact click mapping on Canvas
    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        let activeScene = currentRoom === "garden" ? currentSubScene : currentRoom;
        let clickedCat = false;
        
        for (let i = cats.length - 1; i >= 0; i--) {
            const c = cats[i];
            if (c.scene !== activeScene) continue;

            if (mouseX > c.x - 50 && mouseX < c.x + 50 && mouseY > c.y - 70 && mouseY < c.y + 30) {
                selectedCatIndex = i;
                clickedCat = true;
                c.mood = Math.min(100, c.mood + 5);
                floatingTexts.push({ x: c.x, y: c.y - 60, text: "♥", life: 1.0 });
                const breedName = BREEDS[c.breed] ? BREEDS[c.breed].name : "猫猫";
                addLog(`抚摸了【${breedName}】。`);
                updateUI();
                break;
            }
        }
        
        if (!clickedCat && mouseY > 350) {
            isPolishingCanvas = true;
        }
    });
    
    canvas.addEventListener("mouseup", () => isPolishingCanvas = false);
    canvas.addEventListener("mouseleave", () => isPolishingCanvas = false);

    // ==========================================
    // GAME LOOP (FAIL-SAFE WRAPPED)
    // ==========================================
    function gameLoop(time) {
        try {
            let dt = time - lastTime;
            if (dt > 50) dt = 50; 
            lastTime = time;

            // Manual Polishing
            if (isPolishingCanvas && selectedItemIndex !== -1 && playerInventory[selectedItemIndex]) {
                const item = playerInventory[selectedItemIndex];
                if(ITEMS[item.type]) {
                    const difficulty = ITEMS[item.type].difficulty || 1.0;
                    item.polish += (dt / 1000) * (20.0 / difficulty); 
                    if (item.polish > 100) item.polish = 100;
                    targetItemRotation += (dt / 1000) * Math.PI * 6; 
                    updateInventoryDropdown();
                    
                    if (Math.random() < 0.05) {
                        floatingTexts.push({ x: canvas.width/2 + (Math.random()*100-50), y: 450 + (Math.random()*100-50), text: "✨", life: 0.5 });
                    }
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 1. Draw Background
            drawSceneBackground(ctx);
            
            // 2. Draw Furniture
            drawFurnitures(ctx);

            // 3. Update & Draw Cats
            cats.forEach(c => c.update(dt));
            cats.sort((a, b) => a.y - b.y).forEach((c, idx) => c.draw(ctx, idx === selectedCatIndex));

            // 4. Draw Floating Texts
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const ft = floatingTexts[i];
                ft.y -= dt * 0.05;
                ft.life -= dt / 1000;
                ctx.fillStyle = `rgba(231, 76, 60, ${Math.max(0, ft.life)})`;
                if (ft.text === "✨") ctx.fillStyle = `rgba(241, 196, 15, ${Math.max(0, ft.life)})`;
                ctx.font = "bold 24px Arial";
                ctx.fillText(ft.text, ft.x, ft.y);
                if (ft.life <= 0) floatingTexts.splice(i, 1);
            }

            // 5. Draw Player Bracelet (for manual polish)
            if (selectedItemIndex !== -1 && playerInventory[selectedItemIndex]) {
                const item = playerInventory[selectedItemIndex];
                if(ITEMS[item.type]) {
                    ctx.save();
                    const centerX = canvas.width / 2;
                    const centerY = 450;
                    ctx.translate(centerX, centerY);
                    
                    ctx.fillStyle = isPolishingCanvas ? "rgba(241, 196, 15, 0.2)" : "rgba(255,255,255,0.1)";
                    ctx.beginPath(); ctx.arc(0,0, 120, 0, Math.PI*2); ctx.fill();

                    itemRotation += (targetItemRotation - itemRotation) * 0.3;
                    ctx.rotate(itemRotation);
                    
                    const data = ITEMS[item.type];
                    const p = item.polish / 100;
                    const beadCount = 18;
                    const beadRadius = data.size * 3;
                    for (let i = 0; i < beadCount; i++) {
                        const angle = Math.PI * 2 * (i / beadCount);
                        const bx = Math.cos(angle) * 90;
                        const by = Math.sin(angle) * 90;
                        
                        let beadColor = [150, 150, 150]; 
                        
                        if (data.isDuobao && item.beadColors && Array.isArray(item.beadColors) && item.beadColors.length > 0) {
                            const bCol = item.beadColors[i % item.beadColors.length];
                            if(Array.isArray(bCol) && bCol.length >= 3) beadColor = [...bCol];
                        } else if (data.colorStart && data.colorEnd && data.colorStart.length >= 3 && data.colorEnd.length >= 3) {
                            beadColor[0] = Math.floor(data.colorStart[0] + (data.colorEnd[0] - data.colorStart[0]) * p);
                            beadColor[1] = Math.floor(data.colorStart[1] + (data.colorEnd[1] - data.colorStart[1]) * p);
                            beadColor[2] = Math.floor(data.colorStart[2] + (data.colorEnd[2] - data.colorStart[2]) * p);
                        }
                        
                        drawBead(ctx, bx, by, beadRadius, p, item.type, beadColor);
                    }
                    ctx.restore();
                }
            }

            // Real-time world time and continuous UI updates
            if (Math.floor(time) % 60 === 0) {
                updateWorldTime();
            }
            // Pass the active cat to update UI continuously every frame without flickering buttons
            let targetCat = (selectedCatIndex > -1 && cats[selectedCatIndex]) ? cats[selectedCatIndex] : null;
            if(targetCat) updateUI(targetCat);

        } catch (error) {
            console.error("Critical error in gameLoop! Rendering aborted.", error);
        }
        
        requestAnimationFrame(gameLoop);
    }

    // ==========================================
    // START UP
    // ==========================================
    updateWorldTime();
    addLog("🐾 欢迎来到像素猫猫文玩店！");
    updateInventoryDropdown();
    updateUI();
    
    // Initial Cat
    cats.push(new Cat("orange", 400, 300, "default"));
    selectedCatIndex = 0;
    
    // START THE LOOP
    requestAnimationFrame(gameLoop);
});