import { GameManager } from "./gameManager.js";
import { ChargeManager } from "./chargeManager.js";
import { ButtonManager } from "./buttonManager.js";
import { PieceManager } from "./pieceManager.js";
import { StarButton } from "./buttonManager.js";

let gameManager;



document.addEventListener("DOMContentLoaded", () => {

    initializeGame();

    // Attach event listeners AFTER gameManager is initialized
    document.getElementById("startButton").removeEventListener("click", startGame);
    document.getElementById("startButton").addEventListener("click", startGame);

    document.getElementById("pauseButton").removeEventListener("click", pauseGame);
    document.getElementById("pauseButton").addEventListener("click", pauseGame);



});

function initializeGame() {
    gameManager = new GameManager();

    // Ensure ChargeManager is initialized first
    gameManager.playerChargeManager.addButton("launchCircleButton", "circle", () => {
        gameManager.pieceManager.createPiece("circle");
    });

    gameManager.playerChargeManager.addButton("launchTriangleButton", "triangle", () => {
        gameManager.pieceManager.createPiece("triangle");
    });

    gameManager.playerChargeManager.addButton("launchRectangleButton", "rectangle", () => {
        gameManager.pieceManager.createPiece("rectangle");
    });

    gameManager.playerChargeManager.addButton("launchSquareButton", "square", () => {
        gameManager.pieceManager.createPiece("square");
    });



    // Make sure button displays are updated after registration
    gameManager.playerChargeManager.updateButtonDisplays();
}


function startGame() {
    if (gameManager) {
        gameManager.start();
    }
}

function pauseGame() {
    if (gameManager) {
        gameManager.togglePause();
    }
}