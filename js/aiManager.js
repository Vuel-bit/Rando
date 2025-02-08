export class AIManager {
    constructor(gameManager, aiInterval = 4500) {
        this.gameManager = gameManager;
        this.pieceManager = gameManager.pieceManager;
        this.chargeManager = gameManager.aiChargeManager;
        this.aiInterval = aiInterval;
        this.aiTimer = null;
        this.halfIntervalCount = 0;
        this.chargeManager.currentCharges = 5; // AI starts with 5 charges
        console.log(`🤖 AI starts with ${this.chargeManager.currentCharges} charges`);
    }

    startAI() {
        if (this.aiTimer) return; // Prevent multiple intervals

        console.log(`🤖 AI starting with interval: ${this.aiInterval}ms`);
        this.aiTimer = setInterval(() => {
            this.halfIntervalCount++;
            this.evaluateMove();
            
            if (this.halfIntervalCount % 2 === 0) {
                console.log(`🤖 AI Charge Check: ${this.chargeManager.currentCharges}`);
            }
        }, this.aiInterval / 2); // Run logic every half interval
    }

    stopAI() {
        console.log("🤖 AI stopped.");
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
            this.throwPieces(3); // Ensure AI throws 3 pieces if it has 10 charges
            return;
        }

        const decisionRoll = Math.random();
        if (decisionRoll < 0.60) {
            return; // 60% of the time, throw no pieces
        } else if (decisionRoll < 0.85) {
            this.throwPieces(1); // 25% of the time, throw one piece
        } else {
            const randomCount = Math.floor(Math.random() * (this.chargeManager.currentCharges + 1));
            this.throwPieces(randomCount); // 15% of the time, throw a random amount
        }
    }

    throwPieces(count) {
        for (let i = 0; i < count; i++) {
            if (this.chargeManager.currentCharges <= 0) return;
            this.chargeManager.consumeCharge(); // Consume a charge per thrown piece
            console.log(`🤖 AI throws a piece. Remaining charges: ${this.chargeManager.currentCharges}`);
            const pieceType = this.choosePieceType();
            const closestTarget = this.findClosestEnemy(pieceType);

            if (pieceType === 'triangle' && closestTarget) {
                if (closestTarget.type === 'rectangle' && Math.random() < 0.5) {
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
        const weights = { circle: 0.25, triangle: 0.25, rectangle: 0.25, square: 0.25 };
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
