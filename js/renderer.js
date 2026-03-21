const Renderer = {
    ctx: null,
    canvas: null,
    flowers: [],
    
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext("2d", { alpha: false });
        
        // Static flowers for garden
        for(let i=0; i<20; i++) {
            this.flowers.push({
                x: 50 + Math.random()*540,
                y: 160 + Math.random()*150,
                color: ["#e74c3c", "#f1c40f", "#9b59b6"][Math.floor(Math.random()*3)]
            });
        }
    },

    drawBead(ctx, bx, by, radius, p, itemType, beadColor) {
        let finalColor = [150, 150, 150]; 
        let isSingleGradient = false;
        let c1, c2;

        if (beadColor && beadColor.isSingleGradient) {
            isSingleGradient = true;
            c1 = [...beadColor.c1];
            c2 = [...beadColor.c2];
        } else if (Array.isArray(beadColor) && beadColor.length >= 3) {
            finalColor = [beadColor[0], beadColor[1], beadColor[2]];
        } else if (GAME_DATA.ITEMS[itemType] && GAME_DATA.ITEMS[itemType].colorStart) {
            const data = GAME_DATA.ITEMS[itemType];
            finalColor[0] = Math.floor(data.colorStart[0] + (data.colorEnd[0] - data.colorStart[0]) * p);
            finalColor[1] = Math.floor(data.colorStart[1] + (data.colorEnd[1] - data.colorStart[1]) * p);
            finalColor[2] = Math.floor(data.colorStart[2] + (data.colorEnd[2] - data.colorStart[2]) * p);
        }

        if (itemType === "bodhi") {
            if (isSingleGradient) {
                c1 = c1.map((c, i) => Math.max(0, c - (i===0?30:20) - p*30));
                c2 = c2.map((c, i) => Math.max(0, c - (i===0?30:20) - p*30));
            } else {
                finalColor = finalColor.map((c, i) => Math.max(0, c - (i === 0 ? 30 : 20) - p*30));
            }
        }

        // Drop Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath(); ctx.arc(bx + radius*0.2, by + radius*0.2, radius, 0, Math.PI*2); ctx.fill();

        // Main Bead
        if (isSingleGradient) {
            const gradDir = ctx.createLinearGradient(bx-radius, by-radius, bx+radius, by+radius);
            gradDir.addColorStop(0, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
            gradDir.addColorStop(1, `rgb(${c2[0]},${c2[1]},${c2[2]})`);
            ctx.fillStyle = gradDir;
        } else {
            ctx.fillStyle = `rgb(${finalColor[0]},${finalColor[1]},${finalColor[2]})`;
        }
        ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI * 2); ctx.fill();

        // Inner Bevel (3D effect)
        const grad = ctx.createRadialGradient(bx-radius*0.3, by-radius*0.3, 0, bx, by, radius);
        grad.addColorStop(0, "rgba(255,255,255,0.2)");
        grad.addColorStop(1, "rgba(0,0,0,0.4)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI*2); ctx.fill();

        // Specific Textures
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

        // Specular highlight
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
        // Detail lines
        ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(-30, 30); ctx.moveTo(30, -30); ctx.lineTo(30, 30); ctx.stroke();
        ctx.restore();
    },
    
    drawDesk(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-60, 80, 120, 10); // shadow
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-50, 0, 10, 80); ctx.fillRect(40, 0, 10, 80); // legs
        ctx.fillStyle = "#8b5a2b"; ctx.roundRect(-60, -10, 120, 15, 2); ctx.fill(); // top
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-60, 5, 120, 3); // top edge thickness
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(-30, -50, 60, 40); // monitor
        ctx.fillStyle = "#ecf0f1"; ctx.fillRect(-25, -45, 50, 30); // screen
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-10, -10, 20, 10); // stand
        ctx.restore();
    },

    drawPiano(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-50, 60, 100, 10); // shadow
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(-50, -40, 100, 100); // body
        ctx.fillStyle = "#1a252f"; ctx.fillRect(-45, -30, 90, 30); // stand
        ctx.fillStyle = "#ffffff"; ctx.fillRect(-50, 20, 100, 10); // keys
        for(let i=-45; i<50; i+=8) { ctx.fillStyle="#000"; ctx.fillRect(i, 20, 4, 6); }
        ctx.restore();
    },

    drawWindow(ctx, x, y, width, height, type) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "#87CEEB"; // pure sky
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 10;
        if(type==="cozy") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 15; }
        if(type==="garden") { ctx.strokeStyle = "#d2b48c"; ctx.lineWidth = 12; }
        ctx.strokeRect(0, 0, width, height);
        ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();
        ctx.restore();
    },

    // StarDew style Oven
    drawOven(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 5, 55, 10, 0, 0, Math.PI*2); ctx.fill(); // shadow
        
        ctx.fillStyle = "#ecf0f1"; ctx.beginPath(); ctx.roundRect(-45, -90, 90, 95, 4); ctx.fill(); // body
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-45, 0, 90, 5); // thickness edge
        
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(-45, -90, 90, 15); // stove top
        ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(-20, -82, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(20, -82, 3, 0, Math.PI*2); ctx.fill(); // fire
        
        ctx.fillStyle = "#34495e"; ctx.fillRect(-45, -75, 90, 20); // panel
        ctx.fillStyle = "#ecf0f1"; // knobs
        ctx.beginPath(); ctx.arc(-30, -65, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-15, -65, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -65, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(30, -65, 4, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.roundRect(-35, -45, 70, 35, 4); ctx.fill(); // door
        ctx.fillStyle = "rgba(230, 126, 34, 0.4)"; ctx.beginPath(); ctx.roundRect(-30, -40, 60, 25, 2); ctx.fill(); // glow
        ctx.fillStyle = "#bdc3c7"; ctx.beginPath(); ctx.roundRect(-25, -50, 50, 4, 2); ctx.fill(); // handle
        ctx.restore();
    },

    // StarDew style Cabinet with Pumpkin
    drawKitchenCabinet(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 5, 60, 15, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#c08c5c"; ctx.beginPath(); ctx.roundRect(-55, -80, 110, 85, 2); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(-55, -80, 55, 85); 
        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(0, -80, 55, 85); 
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-55, 0, 110, 5); 

        ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth = 3;
        ctx.strokeRect(-45, -70, 40, 65); ctx.strokeRect(5, -70, 40, 65);
        ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.arc(-15, -40, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(15, -40, 3, 0, Math.PI*2); ctx.fill();

        // Pumpkin
        ctx.translate(0, -80); 
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#e67e22"; ctx.beginPath(); ctx.ellipse(0, -12, 20, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#d35400"; ctx.beginPath(); ctx.ellipse(-8, -12, 6, 14, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(8, -12, 6, 14, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -12, 5, 15, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.roundRect(-3, -32, 6, 8, 2); ctx.fill();
        ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(15, -35, 10, -20); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.ellipse(-10, -18, 4, 2, -Math.PI/6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    },

    drawSceneBackground(ctx) {
        const cw = this.canvas.width;  // 640
        const ch = this.canvas.height; // 480
        const floorY = 240; 

        if (GameState.currentRoom === "default") {
            ctx.fillStyle = "#e8e4c9"; ctx.fillRect(0, 0, cw, floorY); // warm beige wall
            for (let i = 0; i < cw; i += 40) { ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fillRect(i, 0, 2, floorY); }
            ctx.fillStyle = "#8b5a2b"; ctx.fillRect(0, floorY-12, cw, 12); // wood baseboard
            ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, floorY-2, cw, 2); // baseboard shadow
            
            ctx.fillStyle = "#a87b51"; ctx.fillRect(0, floorY, cw, ch - floorY); // wood floor
            ctx.strokeStyle = "rgba(60, 30, 10, 0.4)"; ctx.lineWidth = 2;
            ctx.beginPath(); for (let i = 0; i < cw; i += 60) { ctx.moveTo(i, floorY); ctx.lineTo(i, ch); } ctx.stroke();
            
            this.drawWindow(ctx, 270, 30, 100, 120, "default");
            this.drawSofa(ctx, 150, 230);
            this.drawDesk(ctx, 450, 210);
        } 
        else if (GameState.currentRoom === "cozy") {
            // Plaid Wallpaper
            ctx.fillStyle = "#e8d5c4"; ctx.fillRect(0, 0, cw, floorY); 
            ctx.fillStyle = "rgba(139, 90, 43, 0.1)"; 
            for (let i = 0; i < cw; i += 30) { ctx.fillRect(i, 0, 4, floorY); } 
            for (let j = 0; j < floorY; j += 30) { ctx.fillRect(0, j, cw, 4); } 

            // Baseboard
            ctx.fillStyle = "#5c3a21"; ctx.fillRect(0, floorY-12, cw, 12); 
            ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, floorY-2, cw, 2); 

            // Parquet Wood Floor
            ctx.fillStyle = "#8b5a2b"; ctx.fillRect(0, floorY, cw, ch - floorY); 
            const grad = ctx.createLinearGradient(0, floorY, 0, floorY + 80);
            grad.addColorStop(0, "rgba(0,0,0,0.4)"); grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad; ctx.fillRect(0, floorY, cw, 80);

            ctx.strokeStyle = "rgba(60, 30, 10, 0.4)"; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < cw; i += 60) {
                for (let j = floorY; j < ch; j += 40) {
                    if ((i + j) % 3 === 0) { ctx.moveTo(i, j); ctx.lineTo(i + 60, j); } 
                    else { ctx.moveTo(i, j); ctx.lineTo(i, j + 40); }
                }
            }
            ctx.stroke();

            this.drawWindow(ctx, 80, 40, 120, 130, "cozy");
            this.drawKitchenCabinet(ctx, 420, 240); 
            this.drawOven(ctx, 250, 240);          
        }
        else if (GameState.currentRoom === "garden") {
            if (GameState.currentSubScene === "f1") {
                ctx.fillStyle = "#e8f8f5"; ctx.fillRect(0, 0, cw, floorY); 
                ctx.fillStyle = "#b2babb"; ctx.fillRect(0, floorY-10, cw, 10); 
                ctx.fillStyle = "#d0d3d4"; ctx.fillRect(0, floorY, cw, ch - floorY); 
                
                this.drawWindow(ctx, 260, 30, 120, 150, "garden");
                ctx.fillStyle = "#8b4513"; 
                for(let i=0; i<6; i++) { ctx.fillRect(0, floorY-10 - i*30, 150 - i*20, 30); ctx.fillStyle="#a0522d"; ctx.fillRect(0, floorY-10 - i*30, 150 - i*20, 5); ctx.fillStyle="#8b4513"; }
                this.drawSofa(ctx, 500, 210);
            } 
            else if (GameState.currentSubScene === "f2") {
                ctx.fillStyle = "#f4f6f7"; ctx.fillRect(0, 0, cw, floorY); 
                ctx.fillStyle = "#99a3a4"; ctx.fillRect(0, floorY-10, cw, 10); 
                ctx.fillStyle = "#e5e8e8"; ctx.fillRect(0, floorY, cw, ch - floorY); 
                
                this.drawWindow(ctx, 50, 30, 100, 120, "garden");
                this.drawWindow(ctx, 480, 30, 100, 120, "garden");
                ctx.fillStyle = "#5c4033"; ctx.fillRect(180, 20, 150, 170); ctx.fillStyle="#8b4513"; ctx.fillRect(190, 30, 130, 150);
                for(let i=0; i<4; i++) { ctx.fillStyle="#5c4033"; ctx.fillRect(190, 60+i*30, 130, 5); }
                ctx.fillStyle = "#e74c3c"; ctx.fillRect(200, 40, 15, 20); ctx.fillStyle = "#3498db"; ctx.fillRect(220, 35, 10, 25);
                
                this.drawDesk(ctx, 300, 220); 
                ctx.fillStyle = "#000"; ctx.fillRect(280, 210, 15, 15); 
                ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(290, 215); ctx.lineTo(310, 200); ctx.stroke(); 
                
                this.drawPiano(ctx, 500, 210);
            }
            else if (GameState.currentSubScene === "garden") {
                ctx.fillStyle = "#a9dfbf"; ctx.fillRect(0, 0, cw, 150); 
                ctx.fillStyle = "#7ea258"; ctx.fillRect(0, 150, cw, ch - 150); // warm grass green
                
                // Grass textures
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                for(let i=0; i<100; i++) { ctx.fillRect(Math.random()*cw, 150+Math.random()*(ch-150), 4, 4); }

                this.flowers.forEach(f => {
                    ctx.fillStyle = "#27ae60"; ctx.fillRect(f.x, f.y, 3, 20);
                    ctx.fillStyle = f.color;
                    ctx.beginPath(); ctx.arc(f.x+1.5, f.y-5, 8, 0, Math.PI); ctx.fill();
                });
                
                ctx.fillStyle = "#1e8449";
                ctx.beginPath(); ctx.ellipse(320, 250, 60, 40, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.ellipse(280, 200, 30, 25, 0, 0, Math.PI*2); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(260, 180); ctx.lineTo(270, 150); ctx.lineTo(290, 180); ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(290, 180); ctx.lineTo(300, 150); ctx.lineTo(310, 180); ctx.fill(); 
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
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 20, 50, 10, 0, 0, Math.PI*2); ctx.fill(); // Base shadow
        
        ctx.fillStyle = "#8b5a2b"; ctx.beginPath(); ctx.roundRect(-40, 0, 80, 20, 4); ctx.fill(); // Base wood
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-40, 15, 80, 5); // thickness
        
        ctx.fillStyle = "#d2b48c"; ctx.fillRect(-20, -120, 15, 120); ctx.fillRect(10, -60, 15, 60);
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth = 2;
        ctx.beginPath(); for(let i=10; i<=110; i+=8) { ctx.moveTo(-20, -i); ctx.lineTo(-5, -i+4); } ctx.stroke();
        ctx.beginPath(); for(let i=10; i<=50; i+=8) { ctx.moveTo(10, -i); ctx.lineTo(25, -i+4); } ctx.stroke();
        
        ctx.fillStyle = "#8b5a2b"; ctx.beginPath(); ctx.roundRect(-5, -60, 50, 12, 3); ctx.fill();
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-5, -53, 50, 5); 
        ctx.fillStyle = "#8b5a2b"; ctx.beginPath(); ctx.roundRect(-45, -120, 55, 12, 3); ctx.fill();
        ctx.fillStyle = "#5c3a21"; ctx.fillRect(-45, -113, 55, 5); 
        ctx.restore();
    },

    drawPixelScratchBoard(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 15, 65, 10, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#8b5a2b"; 
        ctx.beginPath(); ctx.moveTo(-50, 10); ctx.lineTo(50, 10); ctx.lineTo(70, -60); ctx.lineTo(-30, -60); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#5c3a21"; // thickness
        ctx.beginPath(); ctx.moveTo(-50, 10); ctx.lineTo(50, 10); ctx.lineTo(50, 15); ctx.lineTo(-50, 15); ctx.closePath(); ctx.fill();
        
        ctx.fillStyle = "#d2b48c"; 
        ctx.beginPath(); ctx.moveTo(-40, 5); ctx.lineTo(40, 5); ctx.lineTo(57, -55); ctx.lineTo(-23, -55); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth=2;
        for(let i=0; i<12; i++) { ctx.beginPath(); ctx.moveTo(-35+i*5, 0-i*4); ctx.lineTo(35+i*5, 0-i*4); ctx.stroke(); }
        ctx.restore();
    },

    drawPixelCatBed(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 10, 45, 15, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = "#cd5c5c"; ctx.beginPath(); ctx.ellipse(0, 0, 50, 20, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#a52a2a"; ctx.beginPath(); ctx.ellipse(0, 5, 45, 15, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = "#f08080"; ctx.beginPath(); ctx.ellipse(0, 3, 38, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
};