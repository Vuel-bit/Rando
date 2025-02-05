import { ButtonManager } from "./buttonManager.js";
import { StarButton } from "./buttonManager.js";

export class ChargeManager {
    constructor(MaxCharges, refreshTime, startingCharges = 5) {
        this.MaxCharges = MaxCharges;
        this.currentCharges = startingCharges;
        this.refreshTime = refreshTime;
        this.refreshInterval = null;
        this.buttons = [];
        this.paused = false;
    }

    addButton(buttonId, type, onClickAction) {
        const buttonManager = new ButtonManager(buttonId, type, onClickAction, this, this.gameManager);
        
        this.buttons.push(buttonManager);
       
        // Immediately update button display after registration
  
    }

    startRecharging() {
      
        if (this.refreshInterval || this.paused) return; //Prevent duplicate intervals
      
        this.refreshInterval = setInterval(() => {
            if (this.currentCharges < this.MaxCharges) {
                this.currentCharges++; 
                this.updateButtonDisplays(); 
            }
    
            if (this.currentCharges === this.MaxCharges) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null; 
            }
        }, this.refreshTime);
    }

    updateButtonDisplays() {
      
        this.buttons.forEach(button => {

            button.button.innerText = `${this.currentCharges}`;
            button.button.disabled = this.currentCharges === 0;
        });
        
    }
    
    consumeCharge() {
        if (this.currentCharges > 0) {
            this.currentCharges--;  
  
            this.updateButtonDisplays(); 
            this.startRecharging(); 
        }
    }  

    reset() {
        this.currentCharges = 5;
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        this.updateButtonDisplays();
    }

    pause() {
        this.paused = true;
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
    }

    resume() {
        this.paused = false;
        this.startRecharging();
    }
}
