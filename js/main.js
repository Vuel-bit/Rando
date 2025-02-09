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

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 DOM loaded, setting up game...");

    setupLobby();
    setupRulesModal();
    setupEndGameModal();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User logged in:", user.email);
            const userId = getCurrentUserId(); // ✅ Use new function
            if (userId) await checkGameState(userId); // ✅ Fix missing function

            try {
                const db = getFirestore();
                const userDocRef = doc(db, "users", userId);
                const userDoc = await getDoc(userDocRef);

                let unlockedLevels = { medium: false, hard: false };

                if (userDoc.exists()) {
                    unlockedLevels = userDoc.data().unlockedLevels || unlockedLevels;
                    console.log("🔓 Loaded Unlocked Levels from Firestore:", unlockedLevels);
                } else {
                    console.log("🚀 First-time user detected. Creating profile...");
                    await setDoc(userDocRef, { unlockedLevels }, { merge: true });
                }

                await setupLobby();
            } catch (error) {
                console.error("❌ Error in AuthStateChanged:", error);
            }
        } else {
            console.log("❌ No user logged in.");
        }
    });
});





async function initializeGame() {
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
    
  
        const auth = getAuth();
        const user = auth.currentUser;
    
        let selectedBoard = "board1"; // Default to Easy
        let aiInterval = 4500; // Default AI difficulty
    
        if (user) {
            try {
                const db = getFirestore();
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
    
                if (userDoc.exists() && userDoc.data().selectedBoard) {
                    selectedBoard = userDoc.data().selectedBoard;
                    console.log("📄 Loaded selected board from Firestore:", selectedBoard);
                } else {
                    console.log("⚠️ No board selection found in Firestore. Using default.");
                }
            } catch (error) {
                console.error("❌ Error fetching selected board:", error);
            }
        } else {
            console.warn("⚠️ No user logged in. Using default board.");
        }
    
        // ✅ Set AI interval based on selected board
        if (selectedBoard === "board2") {
            aiInterval = 4000; // Medium
        } else if (selectedBoard === "board3") {
            aiInterval = 3500; // Hard
        }
    
        console.log(`🎮 Starting game on difficulty: ${selectedBoard}, AI interval: ${aiInterval}ms`);
    
        // ✅ Initialize the game with the correct difficulty
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
    



    async function checkGameState(userId) {
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
    
        if (userSnap.exists() && userSnap.data().gameOver) {
            console.log("🔥 Previous game ended. Showing Game Over.");
            document.getElementById("endGameModal").style.display = "block";
        } else {
            console.log("✅ No previous game state. Starting fresh.");
            document.getElementById("endGameModal").style.display = "none";
        }
    }
    
    
    
    
    
    



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



async function setupLobby() {
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

    const userId = getCurrentUserId(); // Ensure this function gets the correct Firebase user
    

    if (!userId) {
        console.warn("⚠️ No user logged in. Lobby setup skipped.");
        return;
    }

    const levels = await loadUnlockedLevels(userId);

    if (!Array.isArray(levels)) {
        console.error("❌ Error: Unlocked levels is not an array!", levels);
        return;
    }

        // ✅ Ensure the board selector reflects the player's progress
        document.getElementById("boardSelector").innerHTML = `
        <option value="board1">Easy</option>
        <option value="board2" ${levels.includes("medium") ? "" : "disabled"}>Medium</option>
        <option value="board3" ${levels.includes("hard") ? "" : "disabled"}>Hard</option>
    `;

    // ✅ Add event listener for end game button (ensuring it's only attached once)
    let endGameButton = document.getElementById("endGameButton");
    if (endGameButton) {
        endGameButton.replaceWith(endGameButton.cloneNode(true));
        endGameButton = document.getElementById("endGameButton");

        endGameButton.addEventListener("click", async () => {
            console.log("🔄 Resetting game & returning to lobby...");

            gameManager.stop();
            gameManager.isRunning = false;
            gameManager.isPaused = false;
            gameManager.reset();

            document.getElementById("endGameModal").style.display = "none"; // Hide modal
            document.getElementById("lobbyOverlay").style.display = "flex"; // Show lobby

            // ✅ Fetch fresh unlocked levels from Firestore
            const levels = await loadUnlockedLevels(userId);

            // ✅ Update the board selector again to reflect changes
            document.getElementById("boardSelector").innerHTML = `
                <option value="board1">Easy</option>
                <option value="board2" ${levels.includes("medium") ? "" : "disabled"}>Medium</option>
                <option value="board3" ${levels.includes("hard") ? "" : "disabled"}>Hard</option>
            `;
        });
    }

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

    logoutButton.addEventListener("click", async () => {
        console.log("🔹 Logout button clicked!");
    
        try {
            await signOut(auth);  // ✅ Logs out the user from Firebase
            console.log("✅ User successfully logged out.");
    
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
    startGameButton.addEventListener("click", async () => {
        console.log("🔹 Start Game button clicked!");
    
        const selectedBoard = boardSelector.value;
    
        // ✅ Get the logged-in user from Firebase Auth
        const auth = getAuth();
        const user = auth.currentUser;
    
        if (user) {
            try {
                const db = getFirestore();
                const userDocRef = doc(db, "users", user.uid);
    
                // ✅ Save the selected board in Firestore
                await setDoc(userDocRef, { selectedBoard }, { merge: true });
    
                console.log("✅ Selected board saved in Firestore:", selectedBoard);
            } catch (error) {
                console.error("❌ Error saving selected board:", error);
            }
        } else {
            console.warn("⚠️ No user logged in, board selection will not be saved.");
        }
    
        initializeGame();
        console.log("✅ Hiding lobby...");
        lobbyOverlay.style.display = "none"; // Hide lobby
    });
}

function getCurrentUserId() {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? user.uid : null;
}


async function loadUnlockedLevels(userId) {
    console.log("🔄 Fetching unlocked levels from Firestore...");

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.warn("⚠️ No user logged in. Defaulting to Easy mode.");
        return ["easy"]; // ✅ Ensure a default array is returned
    }

    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        let unlockedLevels = { medium: false, hard: false }; // Default values

        if (userDoc.exists() && userDoc.data().unlockedLevels) {
            unlockedLevels = userDoc.data().unlockedLevels;
        }

        console.log("🔓 Loaded Unlocked Levels from Firestore:", unlockedLevels);

        // ✅ Convert unlockedLevels object into an array format for `.includes()`
        const levelsArray = ["easy"];
        if (unlockedLevels.medium) levelsArray.push("medium");
        if (unlockedLevels.hard) levelsArray.push("hard");

        return levelsArray;
    } catch (error) {
        console.error("❌ Error loading unlocked levels from Firestore:", error);
        return ["easy"]; // ✅ Default to an array to prevent crashes
    }
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

