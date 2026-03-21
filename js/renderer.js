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

        // Apply Bodhi special darkening polish
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

    // 新增：星露谷风格的厨房大烤箱 (Oven)
    drawOven(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        
        // 投影 Drop Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(0, 5, 55, 10, 0, 0, Math.PI*2); ctx.fill();
        
        // 烤箱主体
        ctx.fillStyle = "#ecf0f1"; // 浅灰色烤箱漆面
        ctx.beginPath(); ctx.roundRect(-45, -90, 90, 95, 4); ctx.fill();
        // 底部深色边缘 (厚度感)
        ctx.fillStyle = "#bdc3c7"; 
        ctx.fillRect(-45, 0, 90, 5); 
        
        // 黑色炉架 (Stove Top)
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(-45, -90, 90, 15);
        ctx.fillStyle = "#e74c3c"; // 燃烧的火苗点缀
        ctx.beginPath(); ctx.arc(-20, -82, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -82, 3, 0, Math.PI*2); ctx.fill();
        
        // 控制面板区
        ctx.fillStyle = "#34495e"; 
        ctx.fillRect(-45, -75, 90, 20);
        // 旋钮 (Knobs)
        ctx.fillStyle = "#ecf0f1"; 
        ctx.beginPath(); ctx.arc(-30, -65, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-15, -65, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -65, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(30, -65, 4, 0, Math.PI*2); ctx.fill();
        
        // 烤箱玻璃门 (Oven Door)
        ctx.fillStyle = "#2c3e50"; 
        ctx.beginPath(); ctx.roundRect(-35, -45, 70, 35, 4); ctx.fill();
        // 内置火光 (Inner Glow)
        ctx.fillStyle = "rgba(230, 126, 34, 0.4)"; 
        ctx.beginPath(); ctx.roundRect(-30, -40, 60, 25, 2); ctx.fill();
        
        // 烤箱把手 (Handle)
        ctx.fillStyle = "#bdc3c7"; 
        ctx.beginPath(); ctx.roundRect(-25, -50, 50, 4, 2); ctx.fill();

        ctx.restore();
    },

    // 新增：星露谷风格的放着南瓜的橱柜 (Cabinet with Pumpkin)
    drawKitchenCabinet(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        
        // 投影 Drop Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(0, 5, 60, 15, 0, 0, Math.PI*2); ctx.fill();
        
        // 橱柜主体 (木制)
        ctx.fillStyle = "#c08c5c"; // 浅色木材
        ctx.beginPath(); ctx.roundRect(-55, -80, 110, 85, 2); ctx.fill();
        // 左边阴影，右边高光 (体积感)
        ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(-55, -80, 55, 85); 
        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(0, -80, 55, 85); 
        
        // 底部深色边缘 (厚度感)
        ctx.fillStyle = "#5c3a21"; 
        ctx.fillRect(-55, 0, 110, 5); 

        // 柜门细节
        ctx.strokeStyle = "#8b5a2b"; 
        ctx.lineWidth = 3;
        ctx.strokeRect(-45, -70, 40, 65); // 左门
        ctx.strokeRect(5, -70, 40, 65);   // 右门
        // 柜门把手
        ctx.fillStyle = "#2c3e50"; 
        ctx.beginPath(); ctx.arc(-15, -40, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -40, 3, 0, Math.PI*2); ctx.fill();

        // --- 绘制橱柜顶部的南瓜 (Pumpkin) ---
        ctx.translate(0, -80); // 移动到橱柜顶部
        // 南瓜投影
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI*2); ctx.fill();
        
        // 南瓜身体 (胖乎乎的多段圆角矩形组合)
        ctx.fillStyle = "#e67e22"; // 亮橘色
        ctx.beginPath(); ctx.ellipse(0, -12, 20, 15, 0, 0, Math.PI*2); ctx.fill();
        // 南瓜阴影条纹 (体积感纹理)
        ctx.fillStyle = "#d35400"; // 深橘色
        ctx.beginPath(); ctx.ellipse(-8, -12, 6, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -12, 6, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -12, 5, 15, 0, 0, Math.PI*2); ctx.fill();
        
        // 南瓜蒂 (Stem)
        ctx.fillStyle = "#27ae60"; // 绿色
        ctx.beginPath(); ctx.roundRect(-3, -32, 6, 8, 2); ctx.fill();
        // 藤蔓 (Vine)
        ctx.strokeStyle = "#2ecc71"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(15, -35, 10, -20); ctx.stroke();
        
        // 南瓜高光
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); ctx.ellipse(-10, -18, 4, 2, -Math.PI/6, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    drawSceneBackground(ctx) {
        const cw = this.canvas.width;  // 640
        const ch = this.canvas.height; // 480
        const floorY = 240; 

        if (GameState.currentRoom === "default") {
            ctx.fillStyle = "#ecf0f1"; ctx.fillRect(0, 0, cw, floorY); 
            for (let i = 0; i < cw; i += 40) { ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fillRect(i, 0, 2, floorY); }
            ctx.fillStyle = "#7f8c8d"; ctx.fillRect(0, floorY-10, cw, 10); 
            ctx.fillStyle = "#bdc3c7"; ctx.fillRect(0, floorY, cw, ch - floorY); 
            
            this.drawWindow(ctx, 270, 30, 100, 120, "default");
            this.drawSofa(ctx, 150, 230);
            this.drawDesk(ctx, 450, 210);
        } 
        else if (GameState.currentRoom === "cozy") {
            // 1. 格子花纹墙纸 (Plaid Wallpaper)
            ctx.fillStyle = "#e8d5c4"; // 柔和的米黄色底色
            ctx.fillRect(0, 0, cw, floorY); 
            ctx.fillStyle = "rgba(139, 90, 43, 0.1)"; // 低对比度的暖棕色线条
            for (let i = 0; i < cw; i += 30) { ctx.fillRect(i, 0, 4, floorY); } // 垂直线
            for (let j = 0; j < floorY; j += 30) { ctx.fillRect(0, j, cw, 4); } // 水平线

            // 踢脚线
            ctx.fillStyle = "#5c3a21"; 
            ctx.fillRect(0, floorY-12, cw, 12); 
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(0, floorY-2, cw, 2); // 踢脚线阴影

            // 2. 木纹拼花地板 (Parquet Wood Floor)
            ctx.fillStyle = "#8b5a2b"; // 温暖的胡桃木色
            ctx.fillRect(0, floorY, cw, ch - floorY); 
            
            // 地板深度渐变阴影
            const grad = ctx.createLinearGradient(0, floorY, 0, floorY + 80);
            grad.addColorStop(0, "rgba(0,0,0,0.4)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, floorY, cw, 80);

            // 拼花木纹细节 (错落的横竖线条)
            ctx.strokeStyle = "rgba(60, 30, 10, 0.4)"; // 深棕色缝隙
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < cw; i += 60) {
                for (let j = floorY; j < ch; j += 40) {
                    // 交错拼花：偶尔画横线，偶尔画竖线
                    if ((i + j) % 3 === 0) {
                        ctx.moveTo(i, j); ctx.lineTo(i + 60, j); // 横向缝隙
                    } else {
                        ctx.moveTo(i, j); ctx.lineTo(i, j + 40); // 纵向缝隙
                    }
                }
            }
            ctx.stroke();

            // 绘制场景物件
            this.drawWindow(ctx, 80, 40, 120, 130, "cozy");
            this.drawKitchenCabinet(ctx, 420, 240); // 放南瓜的橱柜
            this.drawOven(ctx, 250, 240);           // 大烤箱
        }
        else if (GameState.currentRoom === "garden") {
            if (GameState.currentSubScene === "f1") {
                ctx.fillStyle = "#e8f8f5"; ctx.fillRect(0, 0, cw, floorY); 
                ctx.fillStyle = "#b2babb"; ctx.fillRect(0, floorY-10, cw, 10); 
                ctx.fillStyle = "#d0d3d4"; ctx.fillRect(0, floorY, cw, ch - floorY); 
                
                this.drawWindow(ctx, 260, 30, 120, 150, "garden");
                // Stairs
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
                // Bookshelf
                ctx.fillStyle = "#5c4033"; ctx.fillRect(180, 20, 150, 170); ctx.fillStyle="#8b4513"; ctx.fillRect(190, 30, 130, 150);
                for(let i=0; i<4; i++) { ctx.fillStyle="#5c4033"; ctx.fillRect(190, 60+i*30, 130, 5); }
                ctx.fillStyle = "#e74c3c"; ctx.fillRect(200, 40, 15, 20); ctx.fillStyle = "#3498db"; ctx.fillRect(220, 35, 10, 25);
                
                this.drawDesk(ctx, 300, 220); // Desk with ink
                ctx.fillStyle = "#000"; ctx.fillRect(280, 210, 15, 15); // ink
                ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(290, 215); ctx.lineTo(310, 200); ctx.stroke(); // pen
                
                this.drawPiano(ctx, 500, 210);
            }
            else if (GameState.currentSubScene === "garden") {
                ctx.fillStyle = "#a9dfbf"; ctx.fillRect(0, 0, cw, 150); 
                ctx.fillStyle = "#2ecc71"; ctx.fillRect(0, 150, cw, ch - 150); 
                
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
        ctx.fillStyle = "#5c4033"; ctx.fillRect(-40, 0, 80, 20);
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(-40, 20, 80, 5); 
        ctx.fillStyle = "#d2b48c"; ctx.fillRect(-20, -120, 15, 120); ctx.fillRect(10, -60, 15, 60);
        ctx.strokeStyle = "#c8a064"; ctx.lineWidth = 2;
        ctx.beginPath(); for(let i=10; i<=110; i+=8) { ctx.moveTo(-20, -i); ctx.lineTo(-5, -i+4); } ctx.stroke();
        ctx.beginPath(); for(let i=10; i<=50; i+=8) { ctx.moveTo(10, -i); ctx.lineTo(25, -i+4); } ctx.stroke();
        ctx.fillStyle = "#8b4513"; ctx.roundRect(-5, -60, 50, 12, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(-3, -60, 46, 6, 3); ctx.fill(); 
        ctx.fillStyle = "#8b4513"; ctx.roundRect(-45, -120, 55, 12, 3); ctx.fill();
        ctx.fillStyle = "#a0522d"; ctx.roundRect(-43, -120, 51, 6, 3); ctx.fill();
        ctx.restore();
    },

    drawPixelScratchBoard(ctx, x, y) {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-55, 10, 110, 10);
        ctx.fillStyle = "#8b4513"; 
        ctx.beginPath(); ctx.moveTo(-50, 10); ctx.lineTo(50, 10); ctx.lineTo(70, -60); ctx.lineTo(-30, -60); ctx.closePath(); ctx.fill();
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