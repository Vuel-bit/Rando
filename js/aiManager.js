
const aiPortraits = {
    "rectangle": "images/rectangle.png", 
    "square": "images/square.png",
    "circle": "images/circle.png",    
    "triangle": "images/triangle.png",
    "balanced": "images/balanced.png"
};

const aiPieceWeights = {
    rectangle: { circle: 0.10, triangle: 0.20, rectangle: 0.50, square: 0.20 },
    square: { circle: 0.15, triangle: 0.10, rectangle: 0.25, square: 0.50 },
    circle: { circle: 0.50, triangle: 0.20, rectangle: 0.15, square: 0.15 },
    triangle: { circle: 0.15, triangle: 0.50, rectangle: 0.20, square: 0.15 },
    balanced: { circle: 0.25, triangle: 0.25, rectangle: 0.25, square: 0.25 }
};

export class AIManager {
    constructor(gameManager, aiInterval = 4500) {
        this.gameManager = gameManager;
        this.pieceManager = gameManager.pieceManager;
        this.chargeManager = gameManager.aiChargeManager;
        this.aiInterval = aiInterval;
        this.aiTimer = null;
        this.halfIntervalCount = 0;
        this.chargeManager.currentCharges = 5; // AI starts with 5 charges
        this.currentAI = null;
    }    

    setAIForLevel(level) {
        const aiOrder = {
            1: "rectangle", 6: "rectangle", 11: "rectangle", // Recton
            2: "square", 7: "square", 12: "square", // Bulwark
            3: "circle", 8: "circle", 13: "circle", // Cirrus
            4: "triangle", 9: "triangle", 14: "triangle", // Tess
            5: "balanced", 10: "balanced", 15: "balanced" // The Visionary
        };


        this.currentAI = aiOrder[level] || "rectangle"; // Default to Recton if something goes wrong

        this.updateAIPortrait(this.currentAI);

        console.log(`🎭 AI for Level ${level}: ${this.currentAI}`);
    }

    updateAIPortrait(aiName) {
        const portraitElement = document.getElementById("aiPortraitImg");
        if (!portraitElement) return; // Ensure the element exists
    
        if (aiPortraits[aiName]) {
            portraitElement.src = aiPortraits[aiName];
            portraitElement.alt = aiName.charAt(0).toUpperCase() + aiName.slice(1) + " Portrait";
        } else {
            portraitElement.src = "";
            portraitElement.alt = "No portrait available";
        }
    }

    startAI() {
        if (this.aiTimer) return; // Prevent multiple intervals
        
        this.aiTimer = setInterval(() => {
            this.halfIntervalCount++;
            this.evaluateMove();

        }, this.aiInterval / 2); // Run logic every half interval
    }

    stopAI() {
        clearInterval(this.aiTimer);
        this.aiTimer = null;
        this.halfIntervalCount = 0;
    }

    handleBoost() {
        while (this.chargeManager.currentCharges > 4) {
            this.throwPieces(1); // Reduce charges to 4
        }
        this.chargeManager.currentCharges += 5; // Add 5 charges
        console.log(`🤖 AI Boost Activated! New Charges: ${this.chargeManager.currentCharges}`);
    }

    evaluateMove() {
        if (this.chargeManager.currentCharges >= 10) {
            this.throwPieces(3);
            return;
        }
    
        const decisionRoll = Math.random();
        const randomCount = Math.floor(Math.random() * (this.chargeManager.currentCharges + 1));
    
        switch (this.currentAI) {
            case "rectangle":
                if (decisionRoll < 0.50) return;
                this.throwPieces(decisionRoll < 0.90 ? 1 : randomCount);
                break;
            
            case "square":
                if (decisionRoll < 0.50) return;
                this.throwPieces(decisionRoll < 0.70 ? 1 : randomCount);
                break;
    
            case "circle":
                if (decisionRoll < 0.60) return;
                this.throwPieces(decisionRoll < 0.85 ? 1 : randomCount);
                break;
    
            case "triangle":
                if (decisionRoll < 0.70) return;
                this.throwPieces(decisionRoll < 0.80 ? 1 : randomCount);
                break;
    
            case "balanced":
            default:
                if (decisionRoll < 0.60) return;
                this.throwPieces(decisionRoll < 0.80 ? 1 : randomCount);
                break;
        }
    }
    

    throwPieces(count) {
        for (let i = 0; i < count; i++) {
            if (this.chargeManager.currentCharges <= 0) return;
            
            this.chargeManager.consumeCharge(); // Consume a charge per thrown piece

            const pieceType = this.choosePieceType();
            const closestTarget = this.findClosestEnemy(pieceType);

            if (pieceType === 'triangle' && closestTarget) {
                if ((closestTarget.type === 'rectangle' && Math.random() < 0.5) || !closestTarget)  {
                    const otherShapes = ['circle', 'square', 'rectangle']; // Exclude triangle
                    const randomShapeKey = otherShapes[Math.floor(Math.random() * otherShapes.length)];
                    this.pieceManager.createPiece(randomShapeKey, "blue");
                } else {
                    this.pieceManager.createPiece(pieceType, "blue");
                }
            } else {
                this.pieceManager.createPiece(pieceType, "blue");
            }
        }
    }

    choosePieceType() {
        const weights = aiPieceWeights[this.currentAI]; // Use current AI's probability distribution
        const cumulativeWeights = [];
        let total = 0;
    
        for (const weight of Object.values(weights)) {
            total += weight;
            cumulativeWeights.push(total);
        }
    
        const randomNum = Math.random();
        return Object.keys(weights).find((_, index) => randomNum < cumulativeWeights[index]);
    }

    findClosestEnemy() {
        let closestPiece = null;
        let minDistance = Infinity;

        this.pieceManager.pieces.forEach(piece => {
            if (piece.color === 'green') {
                const distance = calculateDistance(piece, { x: this.gameManager.width / 2, y: 15 });
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPiece = piece;
                }
            }
        });

        return closestPiece;
    }
}

function calculateDistance(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
