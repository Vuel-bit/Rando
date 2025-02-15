import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { GameManager } from "./gameManager.js";

let gameManager;
let currentLevel = 1;


// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEHMoyXjWt2lRlTy4jHPpycCFf9qZGML4",
    authDomain: "rando-2141.firebaseapp.com",
    projectId: "rando-2141",
    storageBucket: "rando-2141.firebasestorage.app",
    messagingSenderId: "159049931264",
    appId: "1:159049931264:web:db08a4a4d7d9564e71d6e5",
    measurementId: "G-BR4NEKT0B8"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);  // <-- Added Firestore initialization

// ✅ Store Firebase services in `window` so other files can use them
window.firebaseAuth = auth;
window.firebaseProvider = provider;
window.firebaseDB = db;  // Store Firestore globally


document.addEventListener("DOMContentLoaded", async () => {

    setupRulesModal();
    setupEndGameModal();

    // 🚀 Defer setting up lobby until Firebase checks auth state
    onAuthStateChanged(auth, async (user) => {
        console.log("🚀 Auth state changed:", user ? user.email : "No user");

        if (user) {
            console.log("✅ User logged in:", user.email);
            const userId = getCurrentUserId();

            try {
                const db = getFirestore();
                const userDocRef = doc(db, "users", userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().currentLevel) {
                    currentLevel = userDoc.data().currentLevel;
                    console.log("🔓 Loaded Current Level from Firestore:", currentLevel);
                } else {
                    console.log("🚀 First-time user detected. Creating profile...");
                    await setDoc(userDocRef, { currentLevel }, { merge: true });
                }

            } catch (error) {
                console.error("❌ Error in AuthStateChanged:", error);
            }

            setupLobby();  
            let chapter = Math.ceil(currentLevel / 5);  // 1-3
            let level = ((currentLevel - 1) % 5) + 1; 
       
        } else {
            console.log("❌ No user logged in.");
            setupLobby();
            updateStartButtonText(1,1); // takes chapter and level
        }
    });
});


function getCurrentUserId() {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user.uid : null;
}


async function initializeGame(levelIndex) {;

    // ✅ If a game is already running, stop it first
    if (gameManager) {
        console.log("🛑 Stopping existing game before starting a new one...");
        gameManager.stop();
        gameManager = null;
    }

    startGameAtLevel(levelIndex);

    // ✅ Enable "Return to Game" button
    const returnToGameButton = document.getElementById("returnToGameButton");
    if (returnToGameButton) {
        returnToGameButton.disabled = false;
    } else {
        console.error("❌ returnToGameButton not found in DOM!");
    }

    // ✅ Remove Old Button Event Listeners Before Re-Adding
    removeButtonEventListeners();

    // ✅ Re-Add Button Event Listeners Only Once
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

    // ✅ Update Button Displays
    gameManager.playerChargeManager.updateButtonDisplays();
}


function startGameAtLevel(level) {
    console.log(`🎮 Starting game at Level ${level}`);
    GameManager.instance = null; 
    gameManager = new GameManager(level);
    gameManager.start();

    document.getElementById("lobbyOverlay").style.display = "none"; // Hide lobby
}


    function removeButtonEventListeners() {
        const buttons = ["launchCircleButton", "launchTriangleButton", "launchRectangleButton", "launchSquareButton"];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.replaceWith(button.cloneNode(true)); // Clears listeners
            }
        });
    }
    
    async function setupLobby() {
    console.log("🔹 Setting up lobby...");

    const lobbyOverlay = document.getElementById("lobbyOverlay");
    const startGameButton = document.getElementById("startGameButton");
    const chapterSelect = document.getElementById("chapterSelect");
    const levelSelect = document.getElementById("levelSelect");
    const returnToGameButton = document.getElementById("returnToGameButton");
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const playerInfo = document.getElementById("playerInfo");

    returnToGameButton.disabled = true;

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
        console.warn("⚠️ No user logged in. Enabling login button...");
        if (loginButton.style.display !== "block") loginButton.style.display = "block";
        if (logoutButton.style.display !== "none") logoutButton.style.display = "none";
        playerInfo.textContent = "";
        
        // Remove old event listeners before adding new one
        loginButton.replaceWith(loginButton.cloneNode(true));
        const newLoginButton = document.getElementById("loginButton");

        newLoginButton.addEventListener("click", async () => {
            console.log("🔹 Login button clicked!");
            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                console.log("✅ User logged in:", result.user.email);
                playerInfo.textContent = `Welcome, ${result.user.displayName}`;
                newLoginButton.style.display = "none";
                logoutButton.style.display = "block";
           
            } catch (error) {
                console.error("❌ Login failed:", error);
            }
        });
    }

    if (user) {
        // ✅ User is logged in, set up logout button
        console.log("✅ User is logged in. Setting up logout...");
        if (loginButton.style.display !== "none") loginButton.style.display = "none";
        if (logoutButton.style.display !== "block") logoutButton.style.display = "block";
        playerInfo.textContent = `Welcome, ${user.displayName}`;  // ✅ Display user info

        logoutButton.replaceWith(logoutButton.cloneNode(true));
        const newLogoutButton = document.getElementById("logoutButton");

        newLogoutButton.addEventListener("click", async () => {
            console.log("🔹 Logout button clicked!");
            try {
                await signOut(auth);
                console.log("✅ User successfully logged out.");
                window.location.reload();
            } catch (error) {
                console.error("❌ Logout failed:", error);
            }
        });
    }

    populateLevels();
    console.log("✅ Lobby setup complete.");
    
    const pauseButton = document.getElementById("pauseButton");
    if (pauseButton) {
        pauseButton.addEventListener("click", () => {
            console.log("⏸️ Pausing game & opening lobby...");
            if (gameManager && gameManager.isRunning && !gameManager.isPaused) {
                gameManager.togglePause(); 
            }
            document.getElementById("lobbyOverlay").style.display = "flex"; // ✅ Show lobby overlay
        });
    }

    // ✅ Return to Game button resumes the game and hides the lobby
    if (returnToGameButton) {
        returnToGameButton.addEventListener("click", () => {
            console.log("▶️Return Button clicked... Resuming game...");
            const gameManager = GameManager.getInstance(); // ✅ Ensure we use the same instance
            if (gameManager && gameManager.isPaused) {
                gameManager.togglePause();
            }
        });
    }

    startGameButton.addEventListener("click", async () => {

        let chapter = parseInt(chapterSelect.value);
        let level = parseInt(levelSelect.value);
        let levelIndex = (chapter - 1) * 5 + level; 
     
        console.log(`🔹 Start Game button clicked! Starting Level ${levelIndex}`);
        initializeGame(levelIndex);
    
        console.log("✅ Hiding lobby...");
        document.getElementById("lobbyOverlay").style.display = "none"; // Hide lobby
    });

    // updates the chapter listener - it was firing twice, so this removes the old one
    updateChapterListener();

    levelSelect.addEventListener("change", () => {
       
        updateStartButtonText(chapterSelect.value, levelSelect.value);

        console.log("levelSelect Value = ", levelSelect.value);
    });    
}

function updateChapterListener() {
    chapterSelect.removeEventListener("change", handleChapterChange); // Remove any existing listener
    chapterSelect.addEventListener("change", handleChapterChange); // Attach a fresh listener
}

function handleChapterChange() {
    populateLevels();
    updateStartButtonText(chapterSelect.value, levelSelect.value);
}


async function loadProgressFromFirestore() {

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.warn("⚠️ No user logged in. Defaulting to Level 1.");
        return 1;
    }

    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().currentLevel) {
            return userDoc.data().currentLevel;
        } else {
            console.log("🚀 First-time user detected. Creating profile...");
            await setDoc(userDocRef, { currentLevel: 1 }, { merge: true });
            return 1;
        }
    } catch (error) {
        console.error("❌ Error fetching progress from Firestore:", error);
        return 1; // Default to Level 1 on error
    }
}


async function endGame(message) {
    console.log("🏁 Game Over:", message);
    gameManager.stop();

    const endGameModal = document.getElementById("endGameModal");
    if (!endGameModal || endGameModal.style.display === "flex") return;
    const endGameMessage = document.getElementById("endGameMessage");

    if (!endGameModal || !endGameMessage) {
        console.error("❌ End Game Modal elements missing!");
        return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (message.includes("You Won")) {
        if (user) {
            console.log("🎉 Player Won! Checking for next level unlock...");

            try {
                const db = getFirestore();
                const userDocRef = doc(db, "users", user.uid);
                console.log(" Current Level before call to firestore: ", currentLevel);
                // Fetch the user's current highest unlocked level
                const userDoc = await getDoc(userDocRef);
                let highestUnlockedLevel = userDoc.exists() && userDoc.data().currentLevel 
                    ? userDoc.data().currentLevel 
                    : 1;
            
                console.log(highestUnlockedLevel, "🔥 Latest highest unlocked level from Firestore");
            
           
                console.log("GameManger Level: ", gameManager.currentLevel);
        
                if (gameManager.currentLevel === highestUnlockedLevel) {
                    console.log("🔓 Unlocking Level:", currentLevel + 1);
                    await setDoc(userDocRef, { currentLevel: currentLevel + 1}, { merge: true });
                }   else {
                    console.log(`✅ No update needed. Highest level remains: ${highestUnlockedLevel}`);
                }
            
                // ✅ Update UI with the correct highest level
                populateLevels();
            
            } catch (error) {
                console.error("❌ Error updating unlocked level:", error);
            }                  
        } else {
            console.warn("⚠️ No user logged in, cannot sync unlocks to Firebase.");
        }
    }
    // ✅ Show the end game popup
    endGameMessage.textContent = message;
    endGameModal.style.display = "flex";

    // ✅ Disable "Return to Game" since no game is running
    returnToGameButton.disabled = true;
}

async function populateLevels() {
    levelSelect.innerHTML = "";
    let unlockedLevel = await loadProgressFromFirestore(); // Get highest unlocked level
    let chapter = parseInt(document.getElementById("chapterSelect").value, 10); // ✅ Use selected chapter
    let chapterStart = (chapter - 1) * 5 + 1; // Convert chapter to level range (1-15)

    for (let i = 1; i <= 5; i++) {
        let levelNumber = chapterStart + (i - 1); // Convert to global level (1-15)
        let option = document.createElement("option");
        option.value = i;
        option.textContent = `Level ${i}`;

        if (levelNumber > unlockedLevel) {
            option.disabled = true; // ✅ Correctly disable locked levels
        }

        levelSelect.appendChild(option);
    }

    // Ensure the first enabled level is selected
    let firstEnabled = [...levelSelect.options].find(option => !option.disabled);
    if (firstEnabled) {
        levelSelect.value = firstEnabled.value;
    }
}

    function updateStartButtonText(chapter, level) {
        startGameButton.textContent = `Start Chapter ${convertToRoman(chapter)}, Level ${level}`;        
    }

    function convertToRoman(num) {
        return ["I", "II", "III"][num - 1] || "I";
    }

function setupRulesModal() {
    const modal = document.getElementById("rulesModal");
    const viewRulesButton = document.getElementById("viewRulesButton");
    const closeButton = document.querySelector(".close-button");

    if (!modal || !viewRulesButton || !closeButton) {
        console.error("❌ Missing modal elements in HTML!");
        return;
    }

    // ✅ Debugging: Make sure modal starts hidden
    console.log("✅ Ensuring Rules Modal is hidden at start.");
    modal.style.display = "none"; // Ensure it's hidden initially

    // ✅ Open modal when "View Rules" is clicked
    viewRulesButton.addEventListener("click", () => {
        console.log("📜 Opening rules modal...");
        modal.style.display = "flex";
    });

    // ✅ Close modal when clicking the "X" button
    closeButton.addEventListener("click", () => {
        console.log("📜 Closing rules modal...");
        modal.style.display = "none";
    });

    // ✅ Close modal if user clicks outside the box
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            console.log("📜 Closing rules modal (outside click)...");
            modal.style.display = "none";
        }
    });
}

function setupEndGameModal() {
    const endGameModal = document.getElementById("endGameModal");
    let endGameButton = document.getElementById("endGameButton");

    if (endGameModal) {
        endGameModal.style.display = "none"; // ✅ Ensure it's hidden at start
    }

    if (endGameButton) {
        // ✅ Ensure no duplicate event listeners
        let newEndGameButton = endGameButton.cloneNode(true);
        endGameButton.parentNode.replaceChild(newEndGameButton, endGameButton);
        endGameButton = newEndGameButton;

        endGameButton.addEventListener("click", () => {
            console.log("🔄 Returning to lobby...");
            endGameModal.style.display = "none"; // Hide modal
            document.getElementById("lobbyOverlay").style.display = "flex"; // Show lobby
        });
    } else {
        console.error("❌ End Game button not found!");
    }
}

export { endGame };

