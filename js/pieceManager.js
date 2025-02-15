

export class PieceManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.pieces = [];
        this.toRemove = new Set();
        this.blueBoostCounter = 0;
        this.greenBoostCounter = 0;
    }

    /*** 🔹 Create and add a piece ***/
    createPiece(type, color = 'green') {

        const canvas = document.getElementById("colorCanvas");
        const width = canvas.width;
        const height = canvas.height;

        // If it's an AI piece, start at the top
        let startY = (color === "green") ? height - 15 : 15; 

        let piece = {
            x: width / 2,
            y: startY,
            color: color,
            type: type,
            speed: this.getSpeedForType(type),
            target: null,
        };
        
        piece.target = this.assignTarget(piece, this.gameManager.hexagons, this.pieces);
        this.pieces.push(piece);
       

    }

    /*** 🔹 Get speed based on type ***/
    getSpeedForType(type) {
        switch (type) {
            case "circle": return .5;
            case "rectangle": return 0.1;
            case "square": return 0.25;
            case "triangle": return 1;
            default: return 0.1;
        }
    }

    /*** 🔹 Assigns a target to a piece ***/
    assignTarget(piece, hexagons, pieces) {
        switch (piece.type) {
            case "circle":
                let colors = piece.color === "blue"
                    ? ["rgba(0, 255, 0, 0.3)", null, "white"]
                    : ["rgba(0, 0, 255, 0.3)", null, "white"];

                const filteredHexes = hexagons.filter(hex => colors.includes(hex.color));
                return filteredHexes.length > 0 ? filteredHexes[Math.floor(Math.random() * filteredHexes.length)] : null;

                case "rectangle":

                let closestHexForRec = null;
                let minRectangleDistance = Infinity;
        
                let rectangleColors = piece.color === "blue"
                ? ["rgba(0, 255, 0, 0.3)", null, "white"]
                : ["rgba(0, 0, 255, 0.3)", null, "white"];
    
                        // Filter hexagons to find valid targets
                        const filteredRectangleHexes = hexagons.filter(hex => rectangleColors.includes(hex.color)
                            && calculateDistance(piece, hex) > 15);
                        if (filteredRectangleHexes.length > 0) {
                            filteredRectangleHexes.forEach(frHex => {
    
                          
                            const rectangleDistance = calculateDistance(piece, frHex);
                            if (rectangleDistance < minRectangleDistance) {
                            minRectangleDistance = rectangleDistance;
                            closestHexForRec = frHex;
                            }
                            }) 
                        } return closestHexForRec;

            case "square":

                let selectedHex = null;

                let color = piece.color === 'blue'
                    ? 'rgba(0, 0, 255, 0.3)'
                    : 'rgba(0, 255, 0, 0.3)';

                // Filter hexagons to find valid targets that are not occupied
                const fHexes = hexagons.filter(hex => 
                    color === hex.color && !hex.occupied
                );
         
                if (fHexes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fHexes.length);
                    selectedHex = fHexes[randomIndex];
                    selectedHex.occupied = true; // keep squares from stacking
                    return selectedHex;
                } else return null;
                

            case "triangle":
                let closestPiece = null;
                let minDistance = Infinity;
                pieces.forEach(otherPiece => {
                    if (otherPiece !== piece && otherPiece.color !== piece.color) {
                        const distance = calculateDistance(piece, otherPiece);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestPiece = otherPiece;
                        }
                    }
                });

                // Triangle Destroyed if there are no targets
                if (!closestPiece) {this.toRemove.add(piece); }
                return closestPiece;

            default:
                return null;
        }
    }

    /*** 🔹 Moves all pieces ***/
    updatePieces() {
        this.pieces.forEach(piece => {
            if (!piece.target) {
                piece.target = this.assignTarget(piece, this.gameManager.hexagons, this.pieces);
            }
            this.movePiece(piece);
        });
    
        this.pieces.forEach(piece => {
            let collidingPieces = checkCollision(piece, this.pieces);
            if (collidingPieces.length > 0) { 
                collidingPieces.forEach(otherPiece => {
                    handleCollision(piece, otherPiece, this.pieces, this.toRemove, this.gameManager.hexagons,
                        this.gameManager.directions, this.gameManager.starButton, this
                    );
                });
            }
        });
    
        // Remove pieces marked for deletion
        this.removeMarkedPieces();
    }
    
  /*** 🔹 Moves a piece towards its target ***/
    movePiece(piece) {

        // Triangle checks target with each loop so it can adjust in flight if target is destroyed
        if(piece.type === 'triangle') 
            {piece.target = this.assignTarget(piece, this.gameManager.hexagons, this.pieces);}

        // If triangle does not have a target, destory it. Any other peice, kick out of method. 
        if (!piece.target && piece.type === 'triangle') {this.toRemove.add(piece);}
      
        if(!piece.target) return;  // 

        const dx = piece.target.x - piece.x;
        const dy = piece.target.y - piece.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            piece.x += (dx / distance) * piece.speed;
            piece.y += (dy / distance) * piece.speed;
        } else {
            switch (piece.type) {
                case "circle":
                    paintNeighbors(piece, getNeighbors(piece, this.gameManager.directions, this.gameManager.hexagons));
                    circleBomb(piece, this.pieces, this.toRemove);
                    break;
                case "triangle":
                    this.toRemove.add(piece);
                    break;
                case "rectangle":
                    piece.target = this.assignTarget(piece, this.gameManager.hexagons, this.pieces);          
                    break;
                case "square":    
            
                    paintNeighbors(piece, getNeighbors(piece, this.gameManager.directions, this.gameManager.hexagons));
                    let neighbors = getNeighbors(piece, this.gameManager.directions, this.gameManager.hexagons);
                    neighbors.forEach(neighbor => {
                        neighbor.occupied = true;
                    })
                    break;
            }
        }
    }

    
    /*** 🔹 Draw all pieces (called from GameManager) ***/
    drawPieces(ctx) {
        if (!ctx) {
            console.error("Canvas context is undefined!");
            return;
        }
        

        this.pieces.forEach(piece => this.drawPiece(ctx, piece));
    }

    /*** 🔹 Draw a single piece ***/
    drawPiece(ctx, piece) {

        ctx.fillStyle = piece.color;
        ctx.strokeStyle = "white";
        ctx.beginPath();

        switch (piece.type) {
            case "circle":
                ctx.arc(piece.x, piece.y, 5, 0, Math.PI * 2);
                break;
            case "triangle":
                ctx.moveTo(piece.x, piece.y - 5);
                ctx.lineTo(piece.x + 5, piece.y + 5);
                ctx.lineTo(piece.x - 5, piece.y + 5);
                ctx.closePath();
                break;
            case "rectangle":
                ctx.rect(piece.x - 5, piece.y - 5, 10, 6);
                break;
            case "square":
                ctx.rect(piece.x - 5, piece.y - 5, 12, 12);
                break;
        }

        ctx.fill();
        ctx.stroke();
    }

    removeMarkedPieces() {
        // Keep only pieces that are NOT in `toRemove`
        this.pieces = this.pieces.filter(piece => !this.toRemove.has(piece));
   
        // Clear the `toRemove` set
        this.toRemove.clear();
    }   

    manageBoostCounter(piece, starButton) {
        if (piece.color === "blue") {
            this.blueBoostCounter++;
            document.getElementById("blueBoostCounter").innerText = this.blueBoostCounter;
        }
        if (piece.color === "green" && this.greenBoostCounter < 10) {
            this.greenBoostCounter++;
            starButton.updateText(this.greenBoostCounter);
        }

        if (this.blueBoostCounter >= 10) {
            this.gameManager.aiManager.handleBoost();

            this.blueBoostCounter = 0;
            document.getElementById("blueBoostCounter").innerText = this.blueBoostCounter;
        }

        if (this.greenBoostCounter >= 10) {
            starButton.button.disabled = false; // Enable star button
            starButton.updateText("!");
        }
    }
}

function calculateDistance(piece1, piece2) {
    const dx = piece2.x - piece1.x;
    const dy = piece2.y - piece1.y;
    return Math.sqrt(dx * dx + dy * dy);
}  

function sameTeam(piece1, piece2) {
    return piece1.color === piece2.color;
}

// Checks if a peice has collided with otherPiece and returns otherPiece
function checkCollision(piece, pieces) {
    const bigHitBox = 30;
    let collidingPieces = [];

    for (let otherPiece of pieces) {
        if (piece === otherPiece) continue; // Skip self-collision

        const distance = calculateDistance(piece, otherPiece);
        if (distance <= bigHitBox && !sameTeam(piece, otherPiece)) {
            collidingPieces.push(otherPiece); // Collect all colliding pieces
        }
    }

    return collidingPieces; // Return array of all valid collisions
}



function handleCollision(piece, otherPiece, pieces, toRemove, hexagons, directions, starButton, pieceManager) {
    const bigHitBox = 30;
    const hitBox = 10;
    const distance = calculateDistance(piece, otherPiece);

    switch (piece.type) {
            case "circle": 
                if (otherPiece.type === "rectangle" && distance < hitBox) {
                    circleBomb(piece, pieces, toRemove);
                    paintNeighbors(piece, getNeighbors(piece, directions, hexagons));
                } else if (otherPiece.type === "square" && distance < hitBox) {
                    paintNeighbors(piece, getNeighbors(piece, directions, hexagons));
                    let neighbors = getNeighbors(otherPiece, directions, hexagons);
                    neighbors.forEach(neighbor => {
                        neighbor.occupied = false;
                    });
                    circleBomb(piece, pieces, toRemove);

                } else if ((otherPiece.type === "circle" || otherPiece.type === "triangle") && distance < hitBox) {
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
                break;
            case "rectangle": 
                if (otherPiece.type === "rectangle" && distance < bigHitBox) {
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
                if (otherPiece.type === "triangle" && distance < hitBox && Math.random() < 0.5) {
                    toRemove.add(otherPiece);
                } else if (otherPiece.type === "triangle" && distance < hitBox) {
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
                if (otherPiece.type === "square" && distance < bigHitBox) {
                    let neighbors = getNeighbors(otherPiece, directions, hexagons);
                    neighbors.forEach(neighbor => {
                        neighbor.occupied = false;
                    });
                    toRemove.add(piece);
                }
                break;
            case "square": 
                let neighbors = getNeighbors(piece, directions, hexagons);
                    neighbors.forEach(neighbor => {
                    neighbor.occupied = false;
                });
                
                if (otherPiece.type === "triangle" && distance < hitBox) {
                    pieceManager.manageBoostCounter(piece, starButton);
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
                if (otherPiece.type === "square" && distance < hitBox) {
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
                break;
            case "triangle": 
                if (otherPiece.type === "triangle" && distance < hitBox) {
                    toRemove.add(piece);
                    toRemove.add(otherPiece);
                }
            default: return ;
        }
}

function getNeighbors(piece, directions, hexagons) {
  
    let neighbors = [];
    let closestHex = null;

    hexagons.forEach(hex => {
        if (calculateDistance(piece, hex) < 15) {
            neighbors.push(hex);
            closestHex = hex;
        }
    });

    directions.forEach(direction => {
        const neighborX = closestHex.x + direction.dx;
        const neighborY = closestHex.y + direction.dy;

        hexagons.forEach(hex => {
            if (Math.abs(hex.x - neighborX) < 1 && Math.abs(hex.y - neighborY) < 1) {
                neighbors.push(hex);
            }
        });
    });
    return neighbors;
}

function paintNeighbors(piece, neighbors) {


    let pieceColor = piece.color === 'blue' ? 'rgba(0, 0, 255, 0.3)' : 'rgba(0, 255, 0, 0.3)';

    neighbors.forEach(neighbor => {
        neighbor.color = pieceColor;
    })

}


function circleBomb(piece, pieces, toRemove) {
    const radius = 40;
    for (let i = 0; i < pieces.length; i++) {
        const otherPiece = pieces[i];
        if (calculateDistance(piece, otherPiece) <= radius) {
            // setHexUnoccupied(otherPiece);
            toRemove.add(otherPiece); // 
        }
    }
}

