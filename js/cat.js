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
        
        // Jump variables
        this.jumpStartX = 0;
        this.jumpStartY = 0;
        this.jumpTargetX = 0;
        this.jumpTargetY = 0;
        this.jumpTime = 0;
        this.jumpProgress = 0;
        this.nextStateAfterJump = "sit";
    }

    jumpTo(targetX, targetY, nextState, duration = 800) {
        this.state = "jumping";
        this.jumpStartX = this.x;
        this.jumpStartY = this.y;
        this.jumpTargetX = targetX;
        this.jumpTargetY = targetY;
        this.jumpTime = duration;
        this.jumpProgress = 0;
        this.nextStateAfterJump = nextState;
        
        // Face the target direction
        if (targetX < this.x) this.vx = -0.04; else this.vx = 0.04;
    }

    update(dt) {
        if (this.polishBuff) {
            this.polishBuff.duration -= dt;
            if (this.polishBuff.duration <= 0) {
                this.polishBuff = null;
                GameState.floatingTexts.push({ x: this.x, y: this.y - 60, text: "Buff结束", life: 1.5 });
            }
        }

        // --- JUMPING STATE MACHINE ---
        if (this.state === "jumping") {
            this.jumpProgress += dt;
            if (this.jumpProgress >= this.jumpTime) {
                // Landed
                this.x = this.jumpTargetX;
                this.y = this.jumpTargetY;
                this.state = this.nextStateAfterJump;
                this.stateTime = 3000 + Math.random()*2000;
            } else {
                let t = this.jumpProgress / this.jumpTime;
                this.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * t;
                // Parabola: arch height scales with distance
                let h = 40 + Math.abs(this.jumpTargetX - this.jumpStartX) * 0.2;
                this.y = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * t - Math.sin(t * Math.PI) * h;
            }
            this.processPolish(dt);
            return; // Skip normal movement updates
        }

        this.stateTime -= dt;

        let isOutdoor = GameState.currentRoom === "garden" && GameState.currentSubScene === "garden";
        let floorY = isOutdoor ? 350 : 360; 

        // --- NORMAL STATE MACHINE ---
        if (this.stateTime <= 0) {
            const r = Math.random();
            let possibleStates = ["sit", "walk_left", "walk_right", "sleep"];
            
            // Furniture targets mapping (adjusted for 640x480 resolution)
            const targets = {
                on_cattree: { x: 130, y: 220 }, // Cat tree platform
                scratching: { x: 300, y: 350 }, // Next to scratchboard
                in_bed: { x: 500, y: 340 },     // Inside bed
                on_sofa_def: { x: 150, y: 230 },
                on_desk_def: { x: 450, y: 200 },
                on_oven_cozy: { x: 250, y: 150 }, // Cozy oven top
                on_desk_f2: { x: 300, y: 220 },
                on_piano_f2: { x: 500, y: 200 }
            };

            let nextState = "";

            if (!isOutdoor) {
                if (GameState.placedFurniture.some(f => f.type === "catTree")) possibleStates.push("on_cattree");
                if (GameState.placedFurniture.some(f => f.type === "scratchBoard")) possibleStates.push("scratching");
                if (GameState.placedFurniture.some(f => f.type === "catBed")) possibleStates.push("in_bed");
                if (GameState.currentRoom === "default" || (GameState.currentRoom === "garden" && GameState.currentSubScene === "f1")) {
                    possibleStates.push("on_sofa");
                }
                if (GameState.currentRoom === "cozy") {
                    possibleStates.push("on_oven"); 
                }
                if (GameState.currentRoom === "default" || (GameState.currentRoom === "garden" && GameState.currentSubScene === "f2")) {
                    possibleStates.push("on_desk");
                }
            }

            nextState = possibleStates[Math.floor(Math.random() * possibleStates.length)];
            
            // Should we jump to the target?
            if (nextState === "on_cattree") {
                this.jumpTo(targets.on_cattree.x, targets.on_cattree.y, "on_cattree", 800);
                return;
            } else if (nextState === "in_bed") {
                this.jumpTo(targets.in_bed.x, targets.in_bed.y, "in_bed", 600);
                return;
            } else if (nextState === "scratching") {
                this.jumpTo(targets.scratching.x, targets.scratching.y, "scratching", 600);
                return;
            } else if (nextState === "on_sofa") {
                let tx = targets.on_sofa_def.x;
                let ty = targets.on_sofa_def.y;
                if(GameState.currentSubScene === "f1") { tx=480; ty=210; }
                this.jumpTo(tx, ty, "on_sofa", 700);
                return;
            } else if (nextState === "on_oven") {
                this.jumpTo(targets.on_oven_cozy.x, targets.on_oven_cozy.y, "on_sofa", 700); // Reuse sitting state for resting
                return;
            } else if (nextState === "on_desk") {
                let tx = GameState.currentRoom === "default" ? targets.on_desk_def.x : targets.on_desk_f2.x;
                let ty = GameState.currentRoom === "default" ? targets.on_desk_def.y : targets.on_desk_f2.y;
                if(GameState.currentSubScene === "f2" && Math.random()>0.5) { tx=targets.on_piano_f2.x; ty=targets.on_piano_f2.y; } // jump to piano sometimes
                this.jumpTo(tx, ty, "on_desk", 700);
                return;
            }

            // Normal floor states
            this.state = nextState;
            if (this.state === "sit") { this.stateTime = 3000 + Math.random()*2000; this.vx = 0; }
            else if (this.state.includes("walk")) { this.stateTime = 3000 + Math.random()*2000; this.vx = (this.state === "walk_left" ? -0.04 : 0.04); }
            else if (this.state === "sleep") { this.stateTime = 6000 + Math.random()*4000; this.vx = 0; }
        }

        // --- MOVEMENT ---
        if (this.state.includes("walk")) {
            this.x += this.vx * dt;
            if (this.x < 50) { this.x = 50; this.vx *= -1; this.state = "walk_right"; }
            if (this.x > 640 - 50) { this.x = 640 - 50; this.vx *= -1; this.state = "walk_left"; } // 640 canvas width
            
            // Ease back to floor Y if walking
            if (this.y < floorY) this.y += 0.1 * dt;
            else if (this.y > floorY + 30) this.y -= 0.1 * dt;
            else if(Math.random() < 0.01) this.y += (Math.random() > 0.5 ? 1 : -1) * 10;
            
            if(this.y > 450) this.y = 450; 
        } else if (this.state === "sit" || this.state === "sleep" || this.state === "play") {
            // Drop to floor if floating
            if (this.y < floorY) this.y += 0.3 * dt;
        }

        this.mood = Math.max(0, this.mood - (dt / 1000) * 0.1);
        this.processPolish(dt);
    }

    processPolish(dt) {
        if (this.item && GAME_DATA.ITEMS[this.item]) {
            let polishRate = 0.5; // default
            if (this.state === "play" || this.state === "scratching") polishRate = 2.0;
            else if (this.state.includes("walk") || this.state === "on_cattree" || this.state === "jumping") polishRate = 1.0;
            
            const moodFactor = this.mood > 50 ? 1.0 : (this.mood > 20 ? 0.5 : 0.1);
            const buffMultiplier = this.polishBuff ? this.polishBuff.multiplier : 1.0;
            
            // 🔥 Player Energy Factor!
            // 100 energy = 1.5x global speed; 0 energy = 0.1x global speed
            const playerEnergyFactor = 0.1 + (GameState.energy / 100) * 1.4; 
            
            const difficulty = GAME_DATA.ITEMS[this.item].difficulty || 1.0;
            
            let baseIncrease = polishRate * moodFactor * buffMultiplier * 0.5 / difficulty + GameState.totalFurnitureBonus;
            
            // Apply player energy factor
            let finalIncrease = (dt / 1000) * (baseIncrease * playerEnergyFactor);
            
            this.itemPolish = Math.min(100, this.itemPolish + finalIncrease);
        }
    }

    draw(ctx, isSelected) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 3.5;
        const c = GAME_DATA.BREEDS[this.breed] || GAME_DATA.BREEDS["orange"]; 
        const isSleep = this.state === "sleep" || this.state === "in_bed" || this.state === "on_cattree";
        const isScratch = this.state === "scratching";
        const isJump = this.state === "jumping";
        
        // No vertical bounce for tail, just smooth body sway
        let bounceY = this.state.includes("walk") ? Math.sin(Date.now() / 150) * 1.5 : 0;
        
        const bW = 24 * scale; const bH = isSleep ? 8 * scale : 12 * scale; const bY = isSleep ? -8 * scale : -12 * scale;
        
        if (isSelected) {
            ctx.strokeStyle = "rgba(241, 196, 15, 0.8)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 10, bW/1.5, 6*scale, 0, 0, Math.PI*2); ctx.stroke();
        }

        // Shadow - scales down when jumping
        let shadowScale = isJump ? Math.max(0.5, 1 - Math.abs(this.jumpProgress/this.jumpTime - 0.5)*1.5) : 1;
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        let shadowY = isJump ? (this.jumpStartY + (this.jumpTargetY - this.jumpStartY)*(this.jumpProgress/this.jumpTime) - this.y) : 5;
        ctx.beginPath(); ctx.ellipse(0, shadowY, (bW/2)*shadowScale, 4*scale*shadowScale, 0, 0, Math.PI*2); ctx.fill();

        ctx.translate(0, -bounceY);
        
        // Stretch slightly when jumping
        if(isJump) {
            let stretch = 1 + Math.abs(this.jumpTargetX - this.jumpStartX)/500;
            ctx.scale(stretch, 1/stretch);
        }
        
        if (this.state === "walk_left" || this.vx < 0) ctx.scale(-1, 1);

        // Tail: Smooth sway
        ctx.fillStyle = c.tail; 
        if (isSleep) {
            ctx.fillRect(-bW / 2 - 8 * scale, bY + bH - 3 * scale, 8 * scale, 3 * scale);
        } else {
            let tailSway = this.state.includes("walk") || isJump ? Math.sin(Date.now() / 200) * 3 * scale : 0;
            ctx.beginPath(); ctx.roundRect(-bW / 2 - 3 * scale + tailSway, bY - 4 * scale, 3 * scale, 10 * scale, 2); ctx.fill();
        }
        
        // Back Legs
        ctx.fillStyle = c.paws; 
        if (!isSleep) { 
            let jumpTuck = isJump ? -2*scale : 0;
            ctx.beginPath(); ctx.roundRect(-bW / 2 + 2 * scale, bY + bH - 2*scale + jumpTuck, 3 * scale, 4 * scale, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(bW / 2 - 6 * scale, bY + bH - 2*scale + jumpTuck, 3 * scale, 4 * scale, 2); ctx.fill();
        }
        
        // Fluffy Body
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
            let jumpTuck = isJump ? -2*scale : 0;
            ctx.beginPath(); ctx.roundRect(-bW / 2 + 7 * scale, bY + bH - 1*scale + scratchReach + jumpTuck, 3 * scale, 3.5 * scale, 1); ctx.fill();
            ctx.beginPath(); ctx.roundRect(bW / 2 - 2 * scale, bY + bH - 1*scale + scratchReach + jumpTuck, 3 * scale, 3.5 * scale, 1); ctx.fill();
        }

        // Head
        const hW = 14 * scale; const hH = 11 * scale; const hX = bW / 2 - 12 * scale; const hY = isSleep ? -14 * scale : -19 * scale;
        ctx.fillStyle = c.body; 
        ctx.beginPath(); ctx.roundRect(hX, hY, hW, hH, 3*scale); ctx.fill();
        
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
        ctx.fillStyle = "#f1948a";
        ctx.beginPath(); ctx.moveTo(hX+1*scale, hY+2*scale); ctx.lineTo(hX+1*scale, hY-1*scale); ctx.lineTo(hX+3*scale, hY+1*scale); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hX+hW-1*scale, hY+2*scale); ctx.lineTo(hX+hW-1*scale, hY-1*scale); ctx.lineTo(hX+hW-3*scale, hY+1*scale); ctx.fill();

        ctx.fillStyle = "#111111"; 
        if (isSleep) { 
            ctx.fillRect(hX + 3 * scale, hY + 6 * scale, 2.5 * scale, 1 * scale); 
            ctx.fillRect(hX + hW - 5.5 * scale, hY + 6 * scale, 2.5 * scale, 1 * scale); 
        } else { 
            ctx.fillRect(hX + 3 * scale, hY + 4 * scale, 2 * scale, 2.5 * scale); 
            ctx.fillRect(hX + hW - 5 * scale, hY + 4 * scale, 2 * scale, 2.5 * scale); 
            ctx.fillStyle = "#ffffff"; 
            ctx.fillRect(hX + 3 * scale, hY + 4 * scale, 1 * scale, 1 * scale);
            ctx.fillRect(hX + hW - 5 * scale, hY + 4 * scale, 1 * scale, 1 * scale);
        }
        
        ctx.fillStyle = "#f1948a"; 
        ctx.fillRect(hX + hW / 2 - 1 * scale, hY + 6.5 * scale, 2 * scale, 1 * scale);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(hX + hW / 2 - 0.5 * scale, hY + 7.5 * scale, 1 * scale, 1 * scale);
        
        if (this.polishBuff) {
            ctx.fillStyle = "rgba(255, 215, 0, 0.3)"; 
            ctx.beginPath(); ctx.arc(hX + hW/2, hY + hH/2, hW + Math.sin(Date.now()/100)*2*scale, 0, Math.PI*2); ctx.fill();
        }

        // Draw Bead Item on Cat
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
                Renderer.drawBead(ctx, bx, by, beadRadius, p, this.item, this.itemBeadColors ? this.itemBeadColors[i%this.itemBeadColors.length] : null);
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