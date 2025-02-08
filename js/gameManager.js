import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { PieceManager } from "./pieceManager.js";
import { AIManager } from "./aiManager.js";
import { ButtonManager } from "./buttonManager.js";
import { ChargeManager } from "./chargeManager.js";
import { StarButton } from "./buttonManager.js";


const r = 15; // Hex Grid radius 
const a = 2 * Math.PI / 6; // constant for drawing hexes

export class GameManager {
    constructor(aiInterval = 4500) { // ✅ Default to 4500 (Easy)
        this.pieceManager = new PieceManager(this);
        this.playerChargeManager = new ChargeManager(10, 1000);
        this.aiChargeManager = new ChargeManager(10, aiInterval);
        this.aiManager = new AIManager(this, aiInterval); // ✅ Pass AI interval

        

        this.starButton = new StarButton("launchStarButton", this);
        this.isRunning = false;
        this.isPaused = false;
      
        this.hexagons = [];
        this.directions = [
            { dx: 0, dy: -2 * r * Math.sin(a) },  // Top}
            { dx: r + r * Math.cos(a), dy: - r * Math.sin(a) },  // Top-right
            { dx: r + r * Math.cos(a), dy: r * Math.sin(a) },  // Bottom-Right
            { dx: 0, dy: 2 * r * Math.sin(a) },  // Bottom
            { dx: -(r + r * Math.cos(a)), dy:  r * Math.sin(a)  },  // Bottom-left
            { dx: -(r + r * Math.cos(a)), dy: - r * Math.sin(a) },  // Top - Left
        ];
    }

    start() {  

        if (this.isRunning) {
           
            this.stop(); // Stop existing game loop and AI
        }
    
            this.reset();
            this.isRunning = true;
          

            this.playerChargeManager.resume();
            this.aiManager.startAI();
            this.aiChargeManager.resume();

            this.aiManager.makeMove(); // put initial pieces on the board
            this.aiManager.makeMove(); 
            this.aiManager.makeMove(); 
            this.aiManager.makeMove(); 
            this.aiManager.makeMove(); 

            this.animationFrameId = requestAnimationFrame(() => this.loop());
                   
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.playerChargeManager.pause();
            this.aiChargeManager.pause();
            this.aiManager.stopAI();
        } else {
            this.playerChargeManager.resume();
            this.aiChargeManager.resume();
            this.aiManager.startAI();
        }
    }

    loop() {
        if (!this.isRunning) return;
        if (this.isPaused) {
            this.animationFrameId = requestAnimationFrame(() => this.loop());
            return;
        }
    
        this.update();
        this.render();
        this.calculateScore();
        this.checkForWinner();
    
        // Ensure there's only one active loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
    

    update() {
        this.pieceManager.updatePieces();
    }

    render() {
        const canvas = document.getElementById("colorCanvas");
        const ctx = canvas.getContext("2d");

        this.clearCanvas();
        generateHexGrid(ctx, canvas.width, canvas.height, this.hexagons, this.pieceManager.pieces, this.directions);
        this.pieceManager.drawPieces(ctx);
    }

    clearCanvas() {
        const canvas = document.getElementById("colorCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    activateBoost() {
        if (this.isBoosting) return;  // Prevent multiple calls due to star button listener acting twice
        this.isBoosting = true;
    
        let newChargeValue = this.playerChargeManager.currentCharges + 5;
        if (newChargeValue > this.playerChargeManager.MaxCharges) {
            newChargeValue = this.playerChargeManager.MaxCharges;
        }
    
        this.playerChargeManager.currentCharges = newChargeValue;
    
        this.playerChargeManager.updateButtonDisplays();
    
        this.starButton.button.disabled = false;
        this.starButton.attachClickListener();
    
        // Workaround to stop two clicks from the starbutton
        setTimeout(() => { this.isBoosting = false; }, 100); 
    }
    
    
    
    

    reset() {

        document.getElementById('scoreBlue').textContent = '0';
        document.getElementById('scoreGreen').textContent = '0';
        this.playerChargeManager.reset();
        this.aiChargeManager.reset();
        this.stop();

        this.isPaused = false;

        
        

        this.pieceManager.pieces.length = 0;// Clear all pieces
        this.hexagons.length = 0;

        // clear the board
        const canvas = document.getElementById("colorCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
             
        this.pieceManager.blueBoostCounter = 0;
        this.pieceManager.greenBoostCounter = 0;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Stop AI interval to prevent AI from launching too many pieces
        this.aiManager.stopAI();
    
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null; // Clear the stored frame ID
        }

        // Reset the charge manager intervals
        this.playerChargeManager.pause();
        this.aiChargeManager.pause();
    }

    calculateScore() {
        let scoreBlue = 0;
        let scoreGreen = 0;
        this.hexagons.forEach(hex => {
            if (hex.color === 'rgba(0, 0, 255, 0.3)') scoreBlue++;
            if (hex.color === 'rgba(0, 255, 0, 0.3)') scoreGreen++;
        });
        document.getElementById('scoreBlue').textContent = scoreBlue;
        document.getElementById('scoreGreen').textContent = scoreGreen;
    }

    checkForWinner() {
        const winningScore = 175;
    
        if (!this.isRunning) {
            console.warn("⚠️ checkForWinner() was called, but the game isn't running yet.");
            return;
        }
    
        let scoreBlue = parseInt(document.getElementById('scoreBlue').textContent) || 0;
        let scoreGreen = parseInt(document.getElementById('scoreGreen').textContent) || 0;
    
        if (scoreGreen >= winningScore) { 
            this.endGame("🎉 You Won! 🏆");  // ✅ Green is the player, so this means the player won
        } else if (scoreBlue >= winningScore) {
            this.endGame("😞 You Lost. Try Again!"); // ✅ Blue is the AI, so this means the AI won
        }
    }
    
    
    endGame(message) {
        console.log("🏁 Game Over:", message);
    
        const endGameModal = document.getElementById("endGameModal");
        const endGameMessage = document.getElementById("endGameMessage");
        const endGameButton = document.getElementById("endGameButton");
        const returnToGameButton = document.getElementById("returnToGameButton");
        const boardSelector = document.getElementById("boardSelector");
    
        if (!endGameModal || !endGameMessage || !endGameButton || !returnToGameButton || !boardSelector) {
            console.error("❌ End Game Modal elements missing!");
            return;
        }

        if (message.includes("You Won")) {
            const user = JSON.parse(localStorage.getItem("user"));
    
            if (user) {
                debugLog(`🎉 Player Won! Unlocking next level for: ${user.displayName}`);
                unlockNextLevel(user);
            } else {
                debugLog("⚠️ No user logged in, cannot sync unlocks to Firebase.");
            }
        }

        // ✅ Show the end game popup
        endGameMessage.textContent = message;
        endGameModal.style.display = "flex";
    
        // ✅ Pause the game
        this.togglePause();
    
        // ✅ Disable "Return to Game" since no game is running
        returnToGameButton.disabled = true;
    
        // ✅ Unlock the next level if the player won
        if (message.includes("You Won")) {
            const user = JSON.parse(localStorage.getItem("user")); // Retrieve logged-in user
        
            if (user) {
                console.log("🎉 Player Won! Unlocking next level for:", user.displayName);
                unlockNextLevel(user); // ✅ Pass the user parameter
            } else {
                console.warn("⚠️ No user logged in, cannot sync unlocks to Firebase.");
            }
        }
    
        // ✅ Remove old event listener before adding a new one
        endGameButton.replaceWith(endGameButton.cloneNode(true));
        let newEndGameButton = document.getElementById("endGameButton");
    
        // ✅ Reset the game and return to lobby
        newEndGameButton.addEventListener("click", () => {
            console.log("🔄 Resetting game & returning to lobby...");
    
            this.stop(); // Stops the game
            this.isRunning = false;
            this.isPaused = false;
            this.reset(); // Resets the game board
    
            endGameModal.style.display = "none"; // Hide modal
            document.getElementById("lobbyOverlay").style.display = "flex"; // Show lobby
            this.loadUnlockedLevels(); // Update unlocked levels
        });
    }
    loadUnlockedLevels() {
        let unlockedLevels = JSON.parse(localStorage.getItem("unlockedLevels"));
    
        // Ensure default values if storage is empty
        if (!unlockedLevels) {
            unlockedLevels = { medium: false, hard: false };
            localStorage.setItem("unlockedLevels", JSON.stringify(unlockedLevels));
        }
    
        console.log("🔓 Loaded Unlocked Levels:", unlockedLevels);
    
        const boardSelector = document.getElementById("boardSelector");
        if (boardSelector) {
            boardSelector.options[1].disabled = !unlockedLevels.medium;
            boardSelector.options[2].disabled = !unlockedLevels.hard;
        }
    }
    
}




async function unlockNextLevel(user) {
    if (!user) {
        debugLog("⚠️ No user logged in. Cannot sync to Firebase.");
        return;
    }

    debugLog("🔄 Checking if next level should be unlocked...");

    const selectedBoard = localStorage.getItem("selectedBoard");
    let unlockedLevels = JSON.parse(localStorage.getItem("unlockedLevels")) || { medium: false, hard: false };

    if (selectedBoard === "board1" && !unlockedLevels.medium) {
        debugLog("🔓 Unlocking Medium Level!");
        unlockedLevels.medium = true;
    } else if (selectedBoard === "board2" && !unlockedLevels.hard) {
        debugLog("🔓 Unlocking Hard Level!");
        unlockedLevels.hard = true;
    } else {
        debugLog("⚠️ No new levels to unlock.");
        return;
    }

    localStorage.setItem("unlockedLevels", JSON.stringify(unlockedLevels));
    debugLog("✅ LocalStorage updated with new unlocks.");

    try {
        const db = window.firebaseDB;
        if (!db) throw new Error("Firestore not initialized!");

        const userDocRef = doc(db, "users", user.uid);
        debugLog("📤 Writing to Firestore...");
        await setDoc(userDocRef, { unlockedLevels }, { merge: true });

        debugLog("✅ Successfully updated Firebase.");
    } catch (error) {
        debugLog(`❌ Failed to update Firebase: ${error}`);
    }
}







function generateHexGrid(ctx, width, height, hexagons, pieces, directions){
        
    for (let y = r; y + r * Math.sin(a) < height; y += r * Math.sin(a)) {
        for (let x = r, j = 0; x + r * (1 + Math.cos(a)) < width; x += r * (1 + Math.cos(a)), y += (-1) ** j++ * r * Math.sin(a)) {
            if (!hexagons.some(hex => hex.x === x && hex.y === y)) {
                hexagons.push({ x, y, size: r, color: 'white', occupied: false });
            }
        }
    }

    // Constants for the top and bottom rows
    const topRowY = [r, r + r * Math.sin(a)];
    const bottomRowY = [height - r, height - (r - r * Math.sin(a))];

    // This iteration through the hex array sets all colors correctly
    hexagons.forEach(hex => {
                                        
            // This checks to see if the piece is over the hexagon and colors the hex the piece color
        pieces.forEach(piece => {



            if (calculateDistance(piece, hex) < r && piece.type === 'circle') {
                hex.color = piece.color;
                
                // Makes background color transperant
                if (
                    (hex.color === 'blue' || hex.color === 'rgba(0, 0, 255, 0.3)') &&
                    checkNeighborProperties(hex, directions, hexagons)) {
                    hex.color = 'rgba(0, 0, 255, 0.3)'; // Muted blue with transparency
                    } else if (
                        (hex.color === 'green' || hex.color === 'rgba(0, 255, 0, 0.3)') &&
                        checkNeighborProperties(hex, directions, hexagons)) {
                        hex.color = 'rgba(0, 255, 0, 0.3)'; // Muted green with transparency
                            }   else hex.color = 'white';
            }
            if (calculateDistance(piece, hex) < r && piece.type === 'rectangle') {
                hex.color = piece.color;

                if (
                    (hex.color === 'blue' || hex.color === 'rgba(0, 0, 255, 0.3)')) {
                    hex.color = 'rgba(0, 0, 255, 0.3)'; // Muted blue with transparency
                    } else if (
                        (hex.color === 'green' || hex.color === 'rgba(0, 255, 0, 0.3)')) {
                        hex.color = 'rgba(0, 255, 0, 0.3)'; // Muted green with transparency
                            }   
            }

            if (calculateDistance(piece, hex) < r && piece.type === 'triangle') {
                if (piece.color === 'blue' && hex.color === 'rgba(0, 255, 0, 0.3)') {
                    hex.color = 'white';
                }
                if (piece.color === 'green' && hex.color === 'rgba(0, 0, 255, 0.3)') {
                    hex.color = 'white';
                }
            }
        
        });

            // Makes the top row blue and bottom row green
            //Issue: The bottom will only work with certain canvas hight sizes
            if (
                (topRowY[0] - hex.y < 1 && topRowY[0] - hex.y > -1) ||
                (topRowY[1] - hex.y < 1 && topRowY[1] - hex.y > -1)
                ) {
                hex.color = 'blue';
                    } else if   ((bottomRowY[0] - hex.y < 1 && bottomRowY[0] - hex.y > -1) ||
                                (bottomRowY[1] - hex.y < 1 && bottomRowY[1] - hex.y > -1)) {
                    hex.color = 'green';
                    }
    });
     
    hexagons.forEach(hex => drawHexagon(ctx, hex.x, hex.y, hex.color));         
}

//Draw the Hexagon
function drawHexagon(ctx, x, y, color){
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + r * Math.cos(a * i), y + r * Math.sin(a * i));
    }
    ctx.closePath();
    ctx.stroke();
 
            if (color) {       
                ctx.fillStyle = color;
                ctx.fill();
                } 
}

function calculateDistance(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    return Math.sqrt(dx * dx + dy * dy);
}  

function checkNeighborProperties(hex, directions, hexagons) {
    let blueNeighbors = 0; 
    let greenNeighbors = 0; 

    // Iterate through each direction to calculate neighbors
    directions.forEach(direction => {
        const neighborX = hex.x + direction.dx;
        const neighborY = hex.y + direction.dy;

        // Check each hexagon to see if it matches the neighbor coordinates
        hexagons.forEach(neighborHex => {  // Renamed variable to avoid conflict
            if (
                Math.abs(neighborHex.x - neighborX) < 1 &&
                Math.abs(neighborHex.y - neighborY) < 1
            ) {
                // If the neighbor's color matches the input color, increment count
                if (hex.color === 'blue' && (neighborHex.color === 'blue' || neighborHex.color === 'rgba(0, 0, 255, 0.3)')) {
                    blueNeighbors++;
                }
                if (hex.color === 'green' && (neighborHex.color === 'green' || neighborHex.color === 'rgba(0, 255, 0, 0.3)')) {
                    greenNeighbors++;
                }
            }
        });
    });

    // Return true if 2 or more neighbors are filled with the same color
    if (hex.color === 'blue') {
        return blueNeighbors >= 2;
    } else if (hex.color === 'green') {
        return greenNeighbors >= 2;
    }

    return false;
}

function saveProgress(score) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        localStorage.setItem(`progress_${user.uid}`, JSON.stringify({ score }));
        console.log("Progress saved for", user.name);
    }
}

function loadProgress() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        const progress = JSON.parse(localStorage.getItem(`progress_${user.uid}`));
        if (progress) {
            console.log(`Welcome back, ${user.name}! Your last score was: ${progress.score}`);
            return progress.score;
        }
    }
    return 0;
}


