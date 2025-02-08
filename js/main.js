import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { GameManager } from "./gameManager.js";
import { ChargeManager } from "./chargeManager.js";
import { ButtonManager } from "./buttonManager.js";
import { PieceManager } from "./pieceManager.js";
import { StarButton } from "./buttonManager.js";
console.log("🚀 Checking Firebase Auth:", window.firebaseAuth);
console.log("🚀 Checking Firebase Provider:", window.firebaseProvider);

let gameManager;


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

console.log("🔥 Firebase Initialized:", app);

document.addEventListener("DOMContentLoaded", () => {
    setupLobby();
    setupRulesModal();
    setupEndGameModal();
});




    function initializeGame() {
        console.log("Game initialized.");
    
        if (!window.firebaseAuth) {
            console.error("❌ Firebase Auth is still undefined!");
            return;
        }
    
        // ✅ If a game is already running, stop it before starting a new one
        if (gameManager && gameManager.isRunning) {
            console.log("🛑 Stopping existing game before starting a new one...");
            gameManager.stop();
            gameManager = null; // Clear reference to prevent stacking
        }
    
        // ✅ Get the correct AI interval for the selected difficulty
        const selectedBoard = localStorage.getItem("selectedBoard") || "board1";
        let aiInterval = 4500; // Default to Easy
    
        if (selectedBoard === "board2") {
            aiInterval = 4000; // Medium
        } else if (selectedBoard === "board3") {
            aiInterval = 3500; // Hard
        }
    
        console.log(`🎮 Starting game on difficulty: ${selectedBoard}, AI interval: ${aiInterval}ms`);
    
        // ✅ Pass the correct interval to GameManager
        gameManager = new GameManager(aiInterval);
        gameManager.start();
    
        // ✅ Enable "Return to Game" button when a new game starts
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
    



    onAuthStateChanged(auth, async (user) => {
        if (user) {
           
    
            try {
                const db = window.firebaseDB;
                if (!db) throw new Error("Firestore not initialized!");
    
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
    
                if (userDoc.exists()) {
                    const unlockedLevels = userDoc.data().unlockedLevels;
                    
    
                    // ✅ Store user info in localStorage
                    localStorage.setItem("unlockedLevels", JSON.stringify(unlockedLevels));
                    localStorage.setItem("user", JSON.stringify({ uid: user.uid, name: user.displayName }));
    
                    loadUnlockedLevels();
                } else {
                   
                    const defaultLevels = { medium: false, hard: false };
                    localStorage.setItem("unlockedLevels", JSON.stringify(defaultLevels));
                    localStorage.setItem("user", JSON.stringify({ uid: user.uid, name: user.displayName }));
    
                    await setDoc(userDocRef, { unlockedLevels: defaultLevels }, { merge: true });
                }
            } catch (error) {
               
            }
        } else {
            
            localStorage.removeItem("unlockedLevels");
            localStorage.removeItem("user");
        }
    });
    
    
    
    
    
    



        /** ✅ Helper Function to Remove Old Event Listeners */
        function removeButtonEventListeners() {
            console.log("🔹 Removing old button event listeners...");
            const buttons = ["launchCircleButton", "launchTriangleButton", "launchRectangleButton", "launchSquareButton"];

            buttons.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button) {
                    const newButton = button.cloneNode(true); // Clone button to remove all listeners
                    button.parentNode.replaceChild(newButton, button); // Replace with clean version
                }
            });
        }



/** ✅ NEW FUNCTION: Updates the Lobby Login UI **/
function updateLobbyUI(user) {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const playerInfo = document.getElementById("playerInfo");

    if (!loginButton || !logoutButton || !playerInfo) {
        console.error("❌ Login/Logout elements are missing from the DOM.");
        return;
    }

    if (user) {
        playerInfo.textContent = `Welcome, ${user.displayName}`;
        loginButton.style.display = "none";
        logoutButton.style.display = "block";
    } else {
        playerInfo.textContent = "";
        loginButton.style.display = "block";
        logoutButton.style.display = "none";
    }
}


// ✅ Save user data locally
function saveUserData(user) {
    localStorage.setItem("user", JSON.stringify({ uid: user.uid, name: user.displayName }));
    document.getElementById("googleLogin").style.display = "none";
    document.getElementById("logoutButton").style.display = "block";
}

function setupLobby() {
    console.log("🔹 Setting up lobby...");

    const lobbyOverlay = document.getElementById("lobbyOverlay");
    const startGameButton = document.getElementById("startGameButton");
    const pauseButton = document.getElementById("pauseButton");
    const returnToGameButton = document.getElementById("returnToGameButton");
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const playerInfo = document.getElementById("playerInfo");
    const boardSelector = document.getElementById("boardSelector");

    if (!lobbyOverlay || !startGameButton || !pauseButton || !returnToGameButton || !loginButton || !logoutButton || !playerInfo || !boardSelector) {
        console.error("❌ Some elements are missing from the DOM! Check index.html.");
        return;
    }


    // ✅ Check if user is already logged in
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    loadUnlockedLevels();

    // ✅ Handle login
    loginButton.addEventListener("click", () => {
        console.log("🔹 Login button clicked!");
        signInWithPopup(auth, provider)
            .then((result) => {
                playerInfo.textContent = `Welcome, ${result.user.displayName}`;
                loginButton.style.display = "none";
                logoutButton.style.display = "block";
            })
            .catch((error) => console.error("❌ Login failed:", error));
    });

        logoutButton.addEventListener("click", async () => {  // 🔹 Add `async` here
        console.log("🔹 Logout button clicked!");
    
        try {
            await signOut(auth);  // ✅ Now `await` works correctly
            console.log("✅ User successfully logged out.");
    
            // ✅ Clear localStorage to remove unlock progress from the previous user
            localStorage.removeItem("unlockedLevels");
            localStorage.removeItem("user");
    
            // ✅ Refresh the page to ensure a clean state for the next user
            window.location.reload();
        } catch (error) {
            console.error("❌ Logout failed:", error);
        }
        signOut(auth).then(() => {
            playerInfo.textContent = "";
            loginButton.style.display = "block";
            logoutButton.style.display = "none";
        }).catch((error) => console.error("❌ Logout failed:", error));
    });

       // ✅ Pause button now pauses the game and opens the lobby
       pauseButton.addEventListener("click", () => {
        console.log("⏸️ Pausing game & opening lobby...");
        if (gameManager && gameManager.isRunning && !gameManager.isPaused) {
            gameManager.togglePause(); // Pause the game
        }
        lobbyOverlay.style.display = "flex"; // Show lobby overlay
    });

    // ✅ Return to Game button resumes the game and hides the lobby
    returnToGameButton.addEventListener("click", () => {
        console.log("▶️ Resuming game...");
        if (gameManager && gameManager.isPaused) {
            gameManager.togglePause(); // Unpause the game
        }
        lobbyOverlay.style.display = "none"; // Hide lobby overlay
    });

    // ✅ Start game button initializes game before hiding lobby
    startGameButton.addEventListener("click", () => {
        console.log("🔹 Start Game button clicked!");
        

        const selectedBoard = boardSelector.value;
        localStorage.setItem("selectedBoard", selectedBoard);
        initializeGame();
        console.log("✅ Hiding lobby...");
        lobbyOverlay.style.display = "none"; // Hide lobby
    });


}

    /** ✅ Load unlocked levels from local storage */
    function loadUnlockedLevels() {
        const unlockedLevels = JSON.parse(localStorage.getItem("unlockedLevels")) || { medium: false, hard: false };
        console.log("🔓 Loaded Unlocked Levels:", unlockedLevels);

        const boardSelector = document.getElementById("boardSelector");
        if (unlockedLevels.medium) {
            boardSelector.options[1].disabled = false; // Unlock Medium
        }
        if (unlockedLevels.hard) {
            boardSelector.options[2].disabled = false; // Unlock Hard
        }
    }




function startGame() {
    if (!gameManager) {
        console.error("❌ gameManager is undefined! Cannot start the game.");
        return;
    }

    console.log("🎮 Starting game...");
    gameManager.start();
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

