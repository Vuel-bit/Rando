export class AIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.pieceManager = gameManager.pieceManager;
        this.chargeManager = gameManager.aiChargeManager;
        this.aiInterval = null;
    }

    startAI(interval = 4000) {
        if (this.aiInterval) return; // Prevent multiple intervals



        this.aiInterval = setInterval(() => {
            this.makeMove();
        }, interval);
    }

    stopAI() {
        clearInterval(this.aiInterval);
        this.aiInterval = null;
    }

    makeMove() {
        if (this.chargeManager.currentCharges <= 0) return;
    
        const pieceType = this.choosePieceType();
    
        // AI logic: 50% chance - if triangle's closest target is rectangle, AI will substitute another piece
        const closestTarget = this.findClosestEnemy(pieceType);

        if (pieceType === 'triangle' && closestTarget) {
                if (closestTarget.type === 'rectangle' && Math.random() < 0.5) {
                
                const otherShapes = ['circle', 'square', 'rectangle']; // Exclude triangle
                const randomShapeKey = otherShapes[Math.floor(Math.random() * otherShapes.length)];
                this.pieceManager.createPiece(randomShapeKey, "blue"); 
                } else this.pieceManager.createPiece(pieceType, "blue"); return;
        } 
    

        this.pieceManager.createPiece(pieceType, "blue"); 
    }
    

    choosePieceType() {
        // Define selection weights
        const weights = {
            circle: 0.25,    
            triangle: 0.25,  
            rectangle: 0.25, 
            square: 0.25,   
        };
    
        // Create a cumulative weight array
        const cumulativeWeights = [];
        let total = 0;
    
        for (const weight of Object.values(weights)) {
            total += weight;
            cumulativeWeights.push(total);
        }
    
        // Generate a random number between 0 and 1
        const randomNum = Math.random();
    
        // Determine which piece to select based on the random number
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


