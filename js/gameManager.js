import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { PieceManager } from "./pieceManager.js";
import { AIManager } from "./aiManager.js";
import { ButtonManager } from "./buttonManager.js";
import { ChargeManager } from "./chargeManager.js";
import { StarButton } from "./buttonManager.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { endGame } from "./main.js";




const r = 15; // Hex Grid radius 
const a = 2 * Math.PI / 6; // constant for drawing hexes



export class GameManager {

    static instance = null;

    constructor(currentLevel = 1) {

        if (GameManager.instance) {
            console.warn("⚠️ GameManager already exists! Returning existing instance.");
            return GameManager.instance; // ✅ Return existing instance if already created
        }        

        console.log("🎮 Creating new GameManager instance...");

        this.currentLevel = currentLevel; // ✅ Track current level
        this.pieceManager = new PieceManager(this);
        this.playerChargeManager = new ChargeManager(this, 10, 4000);
        this.aiChargeManager = new ChargeManager(this, 10, this.getAIInterval()); 
        this.aiManager = new AIManager(this, this.getAIInterval()); // ✅ Use dynamic AI interval
    
    
        

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

        GameManager.instance = this;
    }

    static getInstance(currentLevel = 1) {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager(currentLevel);
        }
        return GameManager.instance;
    }

    getAIInterval() {
        if (this.currentLevel >= 11) return 3500;
        if (this.currentLevel >= 6) return 4000;
        return 4500;
    }


    
    

    
    

    start() {  

        if (this.isRunning) {
           
            this.stop(); // Stop existing game loop and AI
        }
    
            this.reset();
            this.isRunning = true;
            this.aiManager.setAIForLevel(this.currentLevel);
            console.log(this.aiManager, this.currentLevel);

            this.playerChargeManager.resume();
        
            this.aiChargeManager.resume();
            this.aiManager.startAI();

      

            this.animationFrameId = requestAnimationFrame(() => this.loop());
                   
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? "⏸️ Game Paused" : "▶️ Game Resumed");

        if (this.isPaused) {
            this.playerChargeManager.pause();
            this.aiChargeManager.pause();
            this.aiManager.stopAI();
            cancelAnimationFrame(this.animationFrameId);
            document.getElementById("lobbyOverlay").style.display = "flex";
        } else {
            if (!this.isRunning) {
                console.warn("⚠️ Game is not running. Ignoring unpause.");
                return;
            }
            this.playerChargeManager.resume();
            this.aiChargeManager.resume();
            this.aiManager.startAI();
            this.animationFrameId = requestAnimationFrame(() => this.loop());
            document.getElementById("lobbyOverlay").style.display = "none";
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
    
    updateGameInfo() {
        let chapter = Math.ceil(this.currentLevel / 5);
        let levelInChapter = ((this.currentLevel - 1) % 5) + 1;
        document.getElementById("currentChapter").innerText = convertToRoman(chapter);
        document.getElementById("currentLevel").innerText = levelInChapter;
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
        this.starButton.updateText(this.pieceManager.greenBoostCounter);
        this.updateGameInfo(); 

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
            endGame("🎉 You Won! 🏆");  // ✅ Call `endGame()` from `main.js`
        } else if (scoreBlue >= winningScore) {
            endGame("😞 You Lost. Try Again!");
        }
    }    
}




function convertToRoman(num) {
    return ["I", "II", "III"][num - 1] || "I";
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
    ctx.strokeStyle = "white";
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




