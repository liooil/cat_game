class Cat {
    constructor(breed, x, y) {
        this.x = x; 
        this.y = y; 
        this.breed = breed;
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
        this.stateTime -= dt;
        
        // Handle buff
        if (this.polishBuff) {
            this.polishBuff.duration -= dt;
            if (this.polishBuff.duration <= 0) {
                this.polishBuff = null;
                GameState.floatingTexts.push({ x: this.x, y: this.y - 60, text: "Buff结束", life: 1.5 });
            }
        }

        // Determine if we are in Garden outdoor scene
        let isOutdoor = GameState.currentRoom === "garden" && GameState.currentSubScene === "garden";
        let floorY = isOutdoor ? 350 : 320; // Grass is lower than indoor floor

        // State Machine (with Furniture interaction)
        if (this.stateTime <= 0) {
            const r = Math.random();
            let possibleStates = ["sit", "walk_left", "walk_right", "sleep"];
            
            // Interaction logic only applies to indoor rooms (excluding garden outdoor)
            if (!isOutdoor) {
                if (GameState.placedFurniture.some(f => f.type === "catTree")) possibleStates.push("on_cattree");
                if (GameState.placedFurniture.some(f => f.type === "scratchBoard")) possibleStates.push("scratching");
                if (GameState.placedFurniture.some(f => f.type === "catBed")) possibleStates.push("in_bed");
                // Sofa & Desk
                if (GameState.currentRoom === "default" || GameState.currentRoom === "cozy" || (GameState.currentRoom === "garden" && GameState.currentSubScene === "f1")) {
                    possibleStates.push("on_sofa");
                }
                if (GameState.currentRoom === "default" || (GameState.currentRoom === "garden" && GameState.currentSubScene === "f2")) {
                    possibleStates.push("on_desk");
                }
            }

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
            if (this.x < 50) { this.x = 50; this.vx *= -1; this.state = "walk_right"; }
            if (this.x > 800 - 50) { this.x = 800 - 50; this.vx *= -1; this.state = "walk_left"; } // 800 is canvas width
            
            // Smoothly move towards floorY if not already there
            if (this.y < floorY) this.y += 0.1 * dt;
            else if (this.y > floorY + 30) this.y -= 0.1 * dt;
            else {
                // Occasional wander up/down
                if(Math.random() < 0.01) this.y += (Math.random() > 0.5 ? 1 : -1) * 10;
            }
            if(this.y > 450) this.y = 450; // Max depth

        } else {
            // Snap to specific interaction points if not walking
            if (this.state === "on_cattree") { this.x = 200; this.y = 190; } // Matches tree platform
            else if (this.state === "scratching") { this.x = 420; this.y = 290; } // Next to scratchboard
            else if (this.state === "in_bed") { this.x = 650; this.y = 310; } // In bed
            else if (this.state === "on_sofa") { 
                // Context aware sofa placement
                if (GameState.currentRoom === "default") { this.x = 180; this.y = 230; }
                else if (GameState.currentRoom === "cozy") { this.x = 250; this.y = 240; } // Dining chair area actually, but we'll use it
                else { this.x = 650; this.y = 210; } // Garden f1 sofa
            }
            else if (this.state === "on_desk") { 
                if (GameState.currentRoom === "default") { this.x = 600; this.y = 200; }
                else { this.x = 400; this.y = 220; } // Garden f2 desk
            }
            else {
                // If just sitting/sleeping on floor, ensure it's on the floor
                if (this.y < floorY) this.y += 0.5 * dt;
            }
        }

        // Mood decay
        this.mood = Math.max(0, this.mood - (dt / 1000) * 0.1);

        // Polish item
        if (this.item && GAME_DATA.ITEMS[this.item]) {
            let polishRate = 0.5; // default sit/sleep
            if (this.state === "play" || this.state === "scratching") polishRate = 2.0;
            else if (this.state.includes("walk") || this.state === "on_cattree") polishRate = 1.0;
            
            const moodFactor = this.mood > 50 ? 1.0 : (this.mood > 20 ? 0.5 : 0.1);
            const buffMultiplier = this.polishBuff ? this.polishBuff.multiplier : 1.0;
            const difficulty = GAME_DATA.ITEMS[this.item].difficulty || 1.0;
            
            let increase = (dt / 1000) * (polishRate * moodFactor * buffMultiplier * 0.5 / difficulty + GameState.totalFurnitureBonus);
            this.itemPolish = Math.min(100, this.itemPolish + increase);
        }
    }

    draw(ctx, isSelected) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 3.5;
        const c = GAME_DATA.BREEDS[this.breed] || GAME_DATA.BREEDS["orange"]; 
        const isSleep = this.state === "sleep" || this.state === "in_bed" || this.state === "on_cattree";
        const isScratch = this.state === "scratching";
        
        // No vertical bounce for tail, just smooth body sway
        let bounceY = this.state.includes("walk") ? Math.sin(Date.now() / 150) * 1.5 : 0;
        
        const bW = 24 * scale; const bH = isSleep ? 8 * scale : 12 * scale; const bY = isSleep ? -8 * scale : -12 * scale;
        
        if (isSelected) {
            ctx.strokeStyle = "rgba(241, 196, 15, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 10, bW/1.5, 6*scale, 0, 0, Math.PI*2); ctx.stroke();
        }

        // Drop shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
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
            let scratchReach = isScratch ? -Math.abs(Math.sin(Date.now()/100))*4*scale : 0;
            ctx.beginPath(); ctx.roundRect(-bW / 2 + 7 * scale, bY + bH - 1*scale + scratchReach, 3 * scale, 3.5 * scale, 1); ctx.fill();
            ctx.beginPath(); ctx.roundRect(bW / 2 - 2 * scale, bY + bH - 1*scale + scratchReach, 3 * scale, 3.5 * scale, 1); ctx.fill();
        }

        // Head
        const hW = 14 * scale; const hH = 11 * scale; const hX = bW / 2 - 12 * scale; const hY = isSleep ? -14 * scale : -19 * scale;
        ctx.fillStyle = c.body; 
        ctx.beginPath(); ctx.roundRect(hX, hY, hW, hH, 3*scale); ctx.fill();
        
        // Head stripes/patterns
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
        if (this.item && GAME_DATA.ITEMS[this.item]) { 
            const data = GAME_DATA.ITEMS[this.item]; 
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
                Renderer.drawBead(ctx, bx, by, beadRadius, p, this.item, color);
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