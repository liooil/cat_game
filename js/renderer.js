const Renderer = {
    ctx: null,
    canvas: null,
    flowers: [],
    
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext("2d", { alpha: false });
        
        // Init static flowers for garden to prevent jittering
        for(let i=0; i<20; i++) {
            this.flowers.push({
                x: 50 + Math.random()*700,
                y: 160 + Math.random()*150,
                color: ["#e74c3c", "#f1c40f", "#9b59b6"][Math.floor(Math.random()*3)]
            });
        }
    },

    drawBead(ctx, bx, by, radius, p, itemType, beadColor) {
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
    },

    drawSofa(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-70, 40, 140, 10);
        ctx.fillStyle = "#2c3e50"; ctx.roundRect(-80, -30, 160, 60, 10); ctx.fill(); // back
        ctx.fillStyle = "#34495e"; ctx.roundRect(-75, 10, 150, 40, 5); ctx.fill(); // seat
        ctx.fillStyle = "#1a252f"; ctx.roundRect(-90, 0, 20, 50, 5); ctx.fill(); // arm L
        ctx.fillStyle = "#1a252f"; ctx.roundRect(70, 0, 20, 50, 5); ctx.fill(); // arm R
        ctx.restore();
    },
    
    drawDesk(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-60, 80, 120, 10); // shadow
        ctx.fillStyle = "#7f8c8d"; ctx.fillRect(-50, 0, 10, 80); ctx.fillRect(40, 0, 10, 80); // legs
        ctx.fillStyle = "#95a5a6"; ctx.roundRect(-60, -10, 120, 15, 2); ctx.fill(); // top
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(-30, -50, 60, 40); // monitor
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(-25, -45, 50, 30); // screen
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-10, -10, 20, 10); // stand
        ctx.restore();
    },
    
    drawDiningTable(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 50, 80, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#8b4513"; ctx.fillRect(-60, 0, 10, 50); ctx.fillRect(50, 0, 10, 50); // legs
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, 0, 90, 30, 0, 0, Math.PI*2); ctx.fill(); // tablecloth
        // Vase
        ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.ellipse(0, -15, 10, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(-5, -35, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(5, -38, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#27ae60"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(-5, -30); ctx.moveTo(0,-15); ctx.lineTo(5, -30); ctx.stroke();
        ctx.restore();
    },

    drawWindow(ctx, x, y, width, height, type) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "#87CEEB"; // pure sky blue
        ctx.fillRect(0, 0, width, height);
        
        // Window Frame
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 10;
        if(type==="cozy") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 15; }
        if(type==="garden") { ctx.strokeStyle = "#d2b48c"; ctx.lineWidth = 12; }
        ctx.strokeRect(0, 0, width, height);
        ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();
        // Removed diagonal slash
        ctx.restore();
    },

    drawSceneBackground(ctx) {
        const cw = this.canvas.width;
        const ch = this.canvas.height; // Now 480
        const floorY = 200; // adjusted for 480 height

        if (GameState.currentRoom === "default") {
            ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0, 0, cw, floorY); 
            for (let i = 0; i < cw; i += 40) { ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fillRect(i, 0, 2, floorY); }
            ctx.fillStyle = "#7f8c8d"; ctx.fillRect(0, floorY-10, cw, 10); 
            ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0, floorY, cw, ch - floorY); 
            
            this.drawWindow(ctx, 350, 20, 100, 120, "default");
            this.drawSofa(ctx, 180, 200);
            this.drawDesk(ctx, 600, 190);
        } 
        else if (GameState.currentRoom === "cozy") {
            ctx.fillStyle = "#f5deb3"; ctx.fillRect(0, 0, cw, floorY); 
            for (let i = 0; i < cw; i += 60) { ctx.fillStyle = "rgba(139,69,19,0.1)"; ctx.fillRect(i, 0, 10, floorY); }
            ctx.fillStyle = "#8b4513"; ctx.fillRect(0, floorY-10, cw, 10); 
            ctx.fillStyle = "#d2b48c"; ctx.fillRect(0, floorY, cw, ch - floorY); 
            
            this.drawWindow(ctx, 100, 20, 150, 140, "cozy");
            ctx.fillStyle = "#8b4513"; ctx.fillRect(500, 30, 120, 80); ctx.fillStyle="#ecf0f1"; ctx.fillRect(510, 40, 100, 60);
            ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(560, 70, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#2c3e50"; ctx.fillRect(700, 60, 5, 140); ctx.fillStyle="#f1c40f"; ctx.beginPath(); ctx.moveTo(680, 60); ctx.lineTo(725, 60); ctx.lineTo(710, 20); ctx.lineTo(695, 20); ctx.fill();
            this.drawDiningTable(ctx, 400, 220);
        }
        else if (GameState.currentRoom === "garden") {
            if (GameState.currentSubScene === "f1") {
                ctx.fillStyle = "#e8f8f5"; ctx.fillRect(0, 0, cw, floorY); 
                ctx.fillStyle = "#b2babb"; ctx.fillRect(0, floorY-10, cw, 10); 
                ctx.fillStyle = "#d0d3d4"; ctx.fillRect(0, floorY, cw, ch - floorY); 
                
                this.drawWindow(ctx, 400, 20, 120, 150, "garden");
                ctx.fillStyle = "#8b4513"; 
                for(let i=0; i<6; i++) { ctx.fillRect(0, floorY-10 - i*30, 150 - i*20, 30); ctx.fillStyle="#a0522d"; ctx.fillRect(0, floorY-10 - i*30, 150 - i*20, 5); ctx.fillStyle="#8b4513"; }
                this.drawSofa(ctx, 650, 210);
            } 
            else if (GameState.currentSubScene === "f2") {
                ctx.fillStyle = "#f4f6f7"; ctx.fillRect(0, 0, cw, floorY); 
                ctx.fillStyle = "#99a3a4"; ctx.fillRect(0, floorY-10, cw, 10); 
                ctx.fillStyle = "#e5e8e8"; ctx.fillRect(0, floorY, cw, ch - floorY); 
                
                this.drawWindow(ctx, 100, 20, 100, 120, "garden");
                this.drawWindow(ctx, 600, 20, 100, 120, "garden");
                ctx.fillStyle = "#5c4033"; ctx.fillRect(300, 10, 150, 170); ctx.fillStyle="#8b4513"; ctx.fillRect(310, 20, 130, 150);
                for(let i=0; i<4; i++) { ctx.fillStyle="#5c4033"; ctx.fillRect(310, 50+i*30, 130, 5); }
                ctx.fillStyle = "#e74c3c"; ctx.fillRect(320, 30, 15, 20); ctx.fillStyle = "#3498db"; ctx.fillRect(340, 25, 10, 25);
                this.drawDesk(ctx, 400, 220);
                ctx.fillStyle = "#000"; ctx.fillRect(380, 210, 15, 15); 
                ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(390, 215); ctx.lineTo(410, 200); ctx.stroke(); 
            }
            else if (GameState.currentSubScene === "garden") {
                ctx.fillStyle = "#a9dfbf"; ctx.fillRect(0, 0, cw, 150); 
                ctx.fillStyle = "#2ecc71"; ctx.fillRect(0, 150, cw, ch - 150); 
                
                // Static flowers to avoid jitter
                this.flowers.forEach(f => {
                    ctx.fillStyle = "#27ae60"; ctx.fillRect(f.x, f.y, 3, 20);
                    ctx.fillStyle = f.color;
                    ctx.beginPath(); ctx.arc(f.x+1.5, f.y-5, 8, 0, Math.PI); ctx.fill();
                });
                
                ctx.fillStyle = "#1e8449";
                ctx.beginPath(); ctx.ellipse(400, 250, 60, 40, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.ellipse(360, 200, 30, 25, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(340, 180); ctx.lineTo(350, 150); ctx.lineTo(370, 180); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(370, 180); ctx.lineTo(380, 150); ctx.lineTo(390, 180); ctx.fill(); 
            }
        }
    },

    drawFurnitures(ctx) {
        let isOutdoor = GameState.currentRoom === "garden" && GameState.currentSubScene === "garden";
        if (isOutdoor) return; 

        GameState.placedFurniture.forEach(item => {
            if (item.type === "catTree") this.drawPixelCatTree(ctx, item.x, item.y);
            else if (item.type === "scratchBoard") this.drawPixelScratchBoard(ctx, item.x, item.y);
            else if (item.type === "catBed") this.drawPixelCatBed(ctx, item.x, item.y);
        });
    },

    drawPixelCatTree(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "#5c4033"; ctx.fillRect(-50, 0, 100, 20);
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(-50, 20, 100, 5); 
        ctx.fillStyle = "#d2b48c"; ctx.fillRect(-25, -150, 20, 150); ctx.fillRect(15, -80, 20, 80);
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth = 2;
        ctx.beginPath(); for(let i=10; i<=140; i+=8) { ctx.moveTo(-25, -i); ctx.lineTo(-5, -i+4); } ctx.stroke();
        ctx.beginPath(); for(let i=10; i<=70; i+=8) { ctx.moveTo(15, -i); ctx.lineTo(35, -i+4); } ctx.stroke();
        ctx.fillStyle = "#8b4513"; ctx.roundRect(0, -80, 60, 15, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(2, -80, 56, 8, 3); ctx.fill(); 
        ctx.fillStyle = "#8b4513"; ctx.roundRect(-60, -150, 70, 15, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(-58, -150, 66, 8, 3); ctx.fill();
        ctx.restore();
    },

    drawPixelScratchBoard(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        // Larger board
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-65, 10, 130, 10);
        ctx.fillStyle = "#8b4513"; 
        ctx.beginPath(); ctx.moveTo(-60, 10); ctx.lineTo(60, 10); ctx.lineTo(80, -70); ctx.lineTo(-40, -70); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#d2b48c"; 
        ctx.beginPath(); ctx.moveTo(-50, 5); ctx.lineTo(50, 5); ctx.lineTo(67, -65); ctx.lineTo(-23, -65); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth=2;
        for(let i=0; i<15; i++) { ctx.beginPath(); ctx.moveTo(-45+i*5, 0-i*4); ctx.lineTo(45+i*5, 0-i*4); ctx.stroke(); }
        ctx.restore();
    },

    drawPixelCatBed(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 10, 55, 20, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#cd5c5c"; ctx.beginPath(); ctx.ellipse(0, 0, 60, 25, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#a52a2a"; ctx.beginPath(); ctx.ellipse(0, 5, 55, 18, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = "#f08080"; ctx.beginPath(); ctx.ellipse(0, 3, 48, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
};