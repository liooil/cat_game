const UI = {
    elements: {},
    
    init() {
        this.elements = {
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
        this.bindEvents();
    },

    safeBind(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    },

    bindEvents() {
        this.safeBind("btn-shop", "click", () => { this.elements.shopPanel.style.display = 'flex'; this.update(); });
        this.safeBind("btn-close-shop", "click", () => { this.elements.shopPanel.style.display = 'none'; });

        const buyAndLog = (cost, name, action) => {
            if (GameState.gold >= cost) { 
                GameState.gold -= cost; 
                this.addLog(`购买了【${name}】！`); 
                action(); 
                this.update(); 
            } else { 
                this.addLog(`金币不足！`); 
            }
        };

        this.safeBind("btn-buy-cat-tree", "click", () => buyAndLog(GAME_DATA.FURNITURE.catTree.cost, GAME_DATA.FURNITURE.catTree.name, () => { 
            GameState.placedFurniture.push({ type: 'catTree', x: 130, y: 380 }); 
            GameState.totalFurnitureBonus += GAME_DATA.FURNITURE.catTree.bonus; 
        }));
        this.safeBind("btn-buy-scratch-board", "click", () => buyAndLog(GAME_DATA.FURNITURE.scratchBoard.cost, GAME_DATA.FURNITURE.scratchBoard.name, () => { 
            GameState.placedFurniture.push({ type: 'scratchBoard', x: 300, y: 390 }); 
            GameState.totalFurnitureBonus += GAME_DATA.FURNITURE.scratchBoard.bonus; 
        }));
        this.safeBind("btn-buy-cat-bed", "click", () => buyAndLog(GAME_DATA.FURNITURE.catBed.cost, GAME_DATA.FURNITURE.catBed.name, () => { 
            GameState.placedFurniture.push({ type: 'catBed', x: 500, y: 380 }); 
            GameState.totalFurnitureBonus += GAME_DATA.FURNITURE.catBed.bonus; 
        }));
        this.safeBind("btn-buy-salmon", "click", () => buyAndLog(GAME_DATA.CONSUMABLES.salmon.cost, GAME_DATA.CONSUMABLES.salmon.name, () => GameState.salmonCount++));

        const buyRoom = (type) => {
            const data = GAME_DATA.ROOMS[type];
            if (GameState.unlockedRooms.includes(type)) { 
                GameState.currentRoom = type; 
                GameState.currentSubScene = "f1";
                this.addLog(`切换到【${data.name}】。`); 
                this.update(); 
            } else if (GameState.gold >= data.cost) { 
                GameState.gold -= data.cost; 
                GameState.unlockedRooms.push(type); 
                GameState.currentRoom = type; 
                GameState.currentSubScene="f1";
                this.addLog(`解锁【${data.name}】！`); 
                this.update(); 
            } else { 
                this.addLog(`金币不足！`); 
            }
        };
        this.safeBind("btn-buy-room-cozy", "click", () => buyRoom('cozy'));
        this.safeBind("btn-buy-room-garden", "click", () => buyRoom('garden'));

        this.safeBind("btn-scene-f1", "click", () => { GameState.currentSubScene = "f1"; this.addLog("来到了一楼"); this.update(); });
        this.safeBind("btn-scene-f2", "click", () => { GameState.currentSubScene = "f2"; this.addLog("来到了二楼"); this.update(); });
        this.safeBind("btn-scene-garden", "click", () => { GameState.currentSubScene = "garden"; this.addLog("来到了室外花园"); this.update(); });

        this.safeBind("btn-adopt", "click", () => {
            if (GameState.gold >= 100) {
                GameState.gold -= 100;
                const breedKeys = Object.keys(GAME_DATA.BREEDS);
                const randomBreed = breedKeys[Math.floor(Math.random() * breedKeys.length)];
                GameState.cats.push(new Cat(randomBreed, 50 + Math.random() * 540, 300));
                GameState.selectedCatIndex = GameState.cats.length - 1;
                this.addLog(`领养了一只【${GAME_DATA.BREEDS[randomBreed].name}】！`);
                this.update();
            }
        });

        const itemKeys = ["zijin", "kuka", "bodhi", "monkey", "xingyue"];
        itemKeys.forEach(key => {
            this.safeBind(`btn-buy-${key}`, "click", () => {
                const itemData = GAME_DATA.ITEMS[key];
                if(!itemData) return;
                buyAndLog(itemData.cost, itemData.name, () => {
                    let beadColors = null;
                    if (key === "bodhi") {
                        const style = Math.floor(Math.random() * 3); // 0, 1, 2
                        let c1 = MORANDI_COLORS[Math.floor(Math.random()*MORANDI_COLORS.length)];
                        let c2 = MORANDI_COLORS[Math.floor(Math.random()*MORANDI_COLORS.length)];
                        beadColors = [];
                        if (style === 0) { // Solid Morandi
                            for(let i=0;i<18;i++) beadColors.push(c1);
                        } else if (style === 1) { // Bead-to-bead gradient
                            for(let i=0; i<18; i++) {
                                let ratio = i/17;
                                beadColors.push([
                                    c1[0]*(1-ratio) + c2[0]*ratio,
                                    c1[1]*(1-ratio) + c2[1]*ratio,
                                    c1[2]*(1-ratio) + c2[2]*ratio
                                ]);
                            }
                        } else { // Single bead internal gradient
                            for(let i=0; i<18; i++) beadColors.push({ isSingleGradient: true, c1: c1, c2: c2 });
                        }
                    } else if (itemData.isDuobao) {
                        beadColors = Array.from({length: 18}, () => [100+Math.random()*100, 80+Math.random()*80, 60+Math.random()*60]);
                    }
                    GameState.playerInventory.push({ type: key, polish: 0, beadColors });
                    GameState.selectedItemIndex = GameState.playerInventory.length - 1;
                    this.updateInventoryDropdown();
                });
            });
        });

        this.safeBind("btn-sell", "click", () => {
            if (GameState.selectedItemIndex !== -1 && GameState.playerInventory[GameState.selectedItemIndex]) {
                const item = GameState.playerInventory[GameState.selectedItemIndex];
                if(GAME_DATA.ITEMS[item.type]) {
                    const value = Math.floor(GAME_DATA.ITEMS[item.type].baseValue * (1 + (item.polish / 100) * 5));
                    GameState.gold += value;
                    this.addLog(`出售了【${GAME_DATA.ITEMS[item.type].name}】，获得 ${value} 金币！`);
                }
                GameState.playerInventory.splice(GameState.selectedItemIndex, 1);
                if (GameState.selectedItemIndex >= GameState.playerInventory.length) {
                    GameState.selectedItemIndex = GameState.playerInventory.length - 1;
                }
                this.updateInventoryDropdown();
                this.update();
            }
        });

        this.safeBind("btn-feed", "click", () => {
            if (GameState.gold >= 5 && GameState.cats.length > 0) {
                GameState.gold -= 5;
                GameState.cats.forEach(c => {
                    c.mood = Math.min(100, c.mood + 20);
                    GameState.floatingTexts.push({ x: c.x, y: c.y - 60, text: "🐟", life: 1.0 });
                });
                this.addLog(`喂了猫罐头，所有猫猫心情变好。`);
                this.update();
            }
        });

        this.safeBind("btn-feed-salmon", "click", () => {
            if (GameState.salmonCount > 0 && GameState.selectedCatIndex !== -1 && GameState.cats[GameState.selectedCatIndex]) {
                GameState.salmonCount--;
                const c = GameState.cats[GameState.selectedCatIndex];
                c.mood = Math.min(100, c.mood + 50);
                c.polishBuff = { multiplier: 2.0, duration: 30000 }; 
                GameState.floatingTexts.push({ x: c.x, y: c.y - 60, text: "🍣 大满足!", life: 1.5 });
                this.addLog(`给【${GAME_DATA.BREEDS[c.breed].name}】吃了三文鱼，包浆速度翻倍！`);
                this.update();
            }
        });

        this.safeBind("btn-play", "click", () => {
            if (GameState.selectedCatIndex !== -1 && GameState.cats[GameState.selectedCatIndex]) {
                const c = GameState.cats[GameState.selectedCatIndex];
                c.mood = Math.min(100, c.mood + 15);
                c.state = "play"; c.stateTime = 3000;
                GameState.floatingTexts.push({ x: c.x, y: c.y - 60, text: "🎵", life: 1.0 });
                this.addLog(`陪猫猫玩耍，它很开心！`);
                this.update();
            }
        });

        this.safeBind("btn-give-cat", "click", () => {
            if (GameState.selectedCatIndex !== -1 && GameState.selectedItemIndex !== -1) {
                const cat = GameState.cats[GameState.selectedCatIndex];
                const item = GameState.playerInventory[GameState.selectedItemIndex];
                if (cat && item && !cat.item) {
                    cat.item = item.type;
                    cat.itemPolish = item.polish;
                    cat.itemBeadColors = item.beadColors;
                    
                    GameState.playerInventory.splice(GameState.selectedItemIndex, 1);
                    if (GameState.selectedItemIndex >= GameState.playerInventory.length) {
                        GameState.selectedItemIndex = GameState.playerInventory.length - 1;
                    }
                    this.addLog(`把手串给猫猫戴上了。`);
                    this.updateInventoryDropdown();
                    this.update();
                }
            }
        });

        this.safeBind("btn-take-cat", "click", () => {
            if (GameState.selectedCatIndex !== -1 && GameState.cats[GameState.selectedCatIndex]) {
                const c = GameState.cats[GameState.selectedCatIndex];
                if (c.item) {
                    GameState.playerInventory.push({ type: c.item, polish: c.itemPolish, beadColors: c.itemBeadColors });
                    c.item = null; c.itemPolish = 0; c.itemBeadColors = null;
                    GameState.selectedItemIndex = GameState.playerInventory.length - 1;
                    this.addLog(`从猫猫身上取回了手串。`);
                    this.updateInventoryDropdown();
                    this.update();
                }
            }
        });

        this.safeBind("inventory-select", "change", (e) => {
            GameState.selectedItemIndex = parseInt(e.target.value);
            this.update();
        });

        this.safeBind("btn-manual-polish", "mousedown", () => GameState.isPolishingCanvas = true);
        this.safeBind("btn-manual-polish", "mouseup", () => GameState.isPolishingCanvas = false);
        this.safeBind("btn-manual-polish", "mouseleave", () => GameState.isPolishingCanvas = false);
        
        const canvas = document.getElementById("gameCanvas");
        if(canvas) {
            canvas.addEventListener("mousedown", (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                let clickedCat = false;
                for (let i = GameState.cats.length - 1; i >= 0; i--) {
                    const c = GameState.cats[i];
                    // Relaxed hit box for 640x480 ratio
                    if (mouseX > c.x - 50 && mouseX < c.x + 50 && mouseY > c.y - 70 && mouseY < c.y + 30) {
                        GameState.selectedCatIndex = i;
                        clickedCat = true;
                        c.mood = Math.min(100, c.mood + 5);
                        GameState.floatingTexts.push({ x: c.x, y: c.y - 60, text: "♥", life: 1.0 });
                        this.addLog(`抚摸了猫猫。`);
                        this.update();
                        break;
                    }
                }
                
                // Allow manual polish clicking on bottom section
                if (!clickedCat && mouseY > 330) {
                    GameState.isPolishingCanvas = true;
                }
            });
            canvas.addEventListener("mouseup", () => GameState.isPolishingCanvas = false);
            canvas.addEventListener("mouseleave", () => GameState.isPolishingCanvas = false);
        }
    },

    addLog(msg) {
        GameState.logs.unshift(msg);
        if (GameState.logs.length > 50) GameState.logs.pop();
        if (this.elements.logs) {
            this.elements.logs.innerHTML = GameState.logs.map(l => `<li>${l}</li>`).join("");
        }
    },

    updateInventoryDropdown() {
        if (!this.elements.inventorySelect) return;
        if (GameState.playerInventory.length === 0) { 
            this.elements.inventorySelect.innerHTML = '<option value="-1">空</option>'; 
            GameState.selectedItemIndex = -1;
        } else {
            if (GameState.selectedItemIndex < 0 || GameState.selectedItemIndex >= GameState.playerInventory.length) {
                GameState.selectedItemIndex = 0;
            }
            this.elements.inventorySelect.innerHTML = GameState.playerInventory.map((item, idx) => {
                const name = GAME_DATA.ITEMS[item.type] ? GAME_DATA.ITEMS[item.type].name : "未知";
                return `<option value="${idx}" ${idx === GameState.selectedItemIndex ? 'selected' : ''}>${name} (${item.polish.toFixed(1)}%)</option>`;
            }).join('');
        }
    },

    update(activeCat = null) {
        if (!this.elements.gold) return;
        this.elements.gold.innerText = Math.floor(GameState.gold);
        
        const hasItem = GameState.selectedItemIndex !== -1;
        
        const btnSell = document.getElementById("btn-sell");
        const btnManualPolish = document.getElementById("btn-manual-polish");
        if (btnSell) btnSell.disabled = !hasItem;
        if (btnManualPolish) btnManualPolish.style.filter = hasItem ? "grayscale(0%)" : "grayscale(100%)";
        
        if (this.elements.sceneNav) {
            this.elements.sceneNav.style.display = GameState.currentRoom === "garden" ? "block" : "none";
        }
        
        const btnF1 = document.getElementById("btn-scene-f1");
        const btnF2 = document.getElementById("btn-scene-f2");
        const btnGarden = document.getElementById("btn-scene-garden");
        if (btnF1) btnF1.style.border = GameState.currentSubScene === "f1" ? "2px solid #f1c40f" : "none";
        if (btnF2) btnF2.style.border = GameState.currentSubScene === "f2" ? "2px solid #f1c40f" : "none";
        if (btnGarden) btnGarden.style.border = GameState.currentSubScene === "garden" ? "2px solid #f1c40f" : "none";

        let targetCat = activeCat || (GameState.selectedCatIndex > -1 ? GameState.cats[GameState.selectedCatIndex] : null);

        const btnGiveCat = document.getElementById("btn-give-cat");
        const btnTakeCat = document.getElementById("btn-take-cat");
        const btnFeedSalmon = document.getElementById("btn-feed-salmon");

        if (targetCat) {
            this.elements.catMood.innerText = Math.floor(targetCat.mood); 
            this.elements.catBreed.innerText = GAME_DATA.BREEDS[targetCat.breed] ? GAME_DATA.BREEDS[targetCat.breed].name : "未知";
            
            if (targetCat.item && GAME_DATA.ITEMS[targetCat.item]) { 
                this.elements.catItem.innerText = GAME_DATA.ITEMS[targetCat.item].name; 
                this.elements.catItemDetails.style.visibility = "visible"; 
                this.elements.catItemPolish.innerText = targetCat.itemPolish.toFixed(2); 
                this.elements.catItemValue.innerText = Math.floor(GAME_DATA.ITEMS[targetCat.item].baseValue * (1 + (targetCat.itemPolish / 100) * 5)); 
            } else { 
                this.elements.catItem.innerText = "无"; 
                this.elements.catItemDetails.style.visibility = "hidden"; 
            }
            
            if(btnGiveCat) btnGiveCat.disabled = !hasItem || !!targetCat.item; 
            if(btnTakeCat) btnTakeCat.disabled = !targetCat.item;
            
            if (btnFeedSalmon) {
                if (GameState.salmonCount > 0) {
                    btnFeedSalmon.style.display = 'block';
                    btnFeedSalmon.innerText = `喂三文鱼 (${GameState.salmonCount})`;
                } else {
                    btnFeedSalmon.style.display = 'none';
                }
            }
        } else {
            if(this.elements.catBreed) this.elements.catBreed.innerText = "无"; 
            if(this.elements.catMood) this.elements.catMood.innerText = "N/A"; 
            if(this.elements.catItem) this.elements.catItem.innerText = "无";
            if(this.elements.catItemDetails) this.elements.catItemDetails.style.visibility = "hidden";
            if(btnGiveCat) btnGiveCat.disabled = true; 
            if(btnTakeCat) btnTakeCat.disabled = true;
            if(btnFeedSalmon) btnFeedSalmon.style.display = 'none';
        }

        // Shop buttons
        const sCT = document.getElementById("btn-buy-cat-tree");
        const sSB = document.getElementById("btn-buy-scratch-board");
        const sCB = document.getElementById("btn-buy-cat-bed");
        const sS = document.getElementById("btn-buy-salmon");
        if(sCT) sCT.disabled = GameState.gold < GAME_DATA.FURNITURE.catTree.cost;
        if(sSB) sSB.disabled = GameState.gold < GAME_DATA.FURNITURE.scratchBoard.cost;
        if(sCB) sCB.disabled = GameState.gold < GAME_DATA.FURNITURE.catBed.cost;
        if(sS) sS.disabled = GameState.gold < GAME_DATA.CONSUMABLES.salmon.cost;
        
        const rCozy = document.getElementById("btn-buy-room-cozy");
        const rGarden = document.getElementById("btn-buy-room-garden");
        if(rCozy) {
            rCozy.disabled = GameState.gold < GAME_DATA.ROOMS.cozy.cost && !GameState.unlockedRooms.includes('cozy');
            rCozy.innerText = GameState.unlockedRooms.includes('cozy') ? "切换到温馨小屋" : `温馨小屋 (${GAME_DATA.ROOMS.cozy.cost})`;
        }
        if(rGarden) {
            rGarden.disabled = GameState.gold < GAME_DATA.ROOMS.garden.cost && !GameState.unlockedRooms.includes('garden');
            rGarden.innerText = GameState.unlockedRooms.includes('garden') ? "切换到花园洋房" : `花园洋房 (${GAME_DATA.ROOMS.garden.cost})`;
        }
    }
};