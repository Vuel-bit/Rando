export class ButtonManager {
    constructor(buttonId, type, onClickAction, chargeManager, gameManager) {
        this.button = document.getElementById(buttonId);

        if (!this.button) {
            console.error(`Button with ID "${buttonId}" not found in the DOM.`);
            return;
        }

        this.type = type; // Shape type (circle, square, etc.)
        this.onClickAction = onClickAction;
        this.chargeManager = chargeManager;
        this.gameManager = gameManager; // Store reference to GameManager

        this.button.addEventListener('click', () => this.handleClick());
 
    }

 

    handleClick() {
        if (this.chargeManager.currentCharges > 0) {
            this.onClickAction(); // Launch a piece
            this.chargeManager.consumeCharge(); 
        }
    }
}

export class StarButton extends ButtonManager {
    constructor(buttonId, gameManager) {
        super(buttonId, "star", () => gameManager.activateBoost(), null, gameManager);
        this.attachClickListener(); 
    }

    attachClickListener() {
        this.button.addEventListener("click", () => this.handleClick());
    }

    // This is launching twice per click 
    handleClick() {
        //console.log("StarButton Click");
        this.gameManager.activateBoost();
        this.button.disabled = true; // Prevent multiple activations
        this.gameManager.pieceManager.greenBoostCounter = 0;
    }

    updateText(newText) {
        this.button.innerText = newText;
    }
}

