import styles from './styles.module.css';

// Constants for initiative management
const INITIATIVE_PLAYER = "player";
const INITIATIVE_BEAST = "beast";

// Global variables to track game state
let playerSpirit = 50;
let playerPower = 0; // Tracks the player's power stat
let playerShield = 0; // Tracks the player's shield stat
let currentBeast = null; // The beast the player is fighting
let currentInitiative = INITIATIVE_PLAYER; // Tracks whose initiative it is
let attackRoll = 0; // Stores the current attack roll
let turnCount = 1; // Tracks the current turn count
let playerInitiativeCompleted = false; // Tracks if the player has completed their initiative
let beastInitiativeCompleted = false; // Tracks if the beast has completed their initiative
let selectedItem = null; // Tracks the currently selected item

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  createPlayerCard();
  generateBeast();
  preparePlayerInitiative(); // Updated to call the renamed function

  // Add event listener to the "Start Game" button
  const startGameBtn = document.getElementById("start-game-btn");
  if (startGameBtn) {
    startGameBtn.addEventListener("click", startGame);
  }

  // Add event listener to the toggle hand button
  const toggleHandBtn = document.getElementById("toggle-hand-btn");
  if (toggleHandBtn) {
    toggleHandBtn.addEventListener("click", toggleHand); // Only toggle visibility, no auto-population
  }

  // Apply styles to static containers
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.classList.add(styles.gameContainer);
  }

  const diceArea = document.getElementById("dice-area");
  if (diceArea) {
    diceArea.classList.add(styles.diceArea);
  }

  const playerBeastContainer = document.getElementById("player-beast-container");
  if (playerBeastContainer) {
    playerBeastContainer.classList.add(styles.playerBeastContainer);
  }

  const handContainer = document.getElementById("hand-container");
  if (handContainer) {
    handContainer.classList.add(styles.handContainer);
  }

  const actionArea = document.getElementById("action-area");
  if (actionArea) {
    actionArea.classList.add(styles.actionArea);
  }

  const handArea = document.getElementById("hand-area");
  if (handArea) {
    handArea.classList.add(styles.handArea);
  }
});

// Function to fetch beasts from cards.json
async function fetchBeasts() {
  const response = await fetch("/cards.json");
  const data = await response.json();
  return data.cards.filter((card) => card.type === "beast"); // Return only beasts
}

// Function to fetch items from cards.json
async function fetchItems() {
  const response = await fetch("/cards.json");
  const data = await response.json();
  return data.cards.filter((card) => card.type === "item"); // Return only items
}

// Function to create the player card
function createPlayerCard() {
  const playerCardContainer = document.getElementById("player-card-container");

  if (!playerCardContainer) {
    console.error("Player card container not found!");
    return;
  }

  // Add the container style
  playerCardContainer.classList.add(styles.playerCardContainer);

  playerCardContainer.innerHTML = `
    <div class="${styles.playerCard}">
      <div class="${styles.spirit}" id="player-spirit">${playerSpirit}</div>
      <h2>Player</h2>
    </div>
  `;
}

// Function to randomly select a beast and create its card
async function generateBeast() {
  const beasts = [
    { id: 1, name: "Lioness", spirit: 21, attackDice: 2 },
    { id: 2, name: "Sloth", spirit: 30, attackDice: 1 },
  ];
  const randomIndex = Math.floor(Math.random() * beasts.length);
  currentBeast = beasts[randomIndex];
  currentBeast.power = 0; // Tracks the beast's power stat
  currentBeast.shield = 0; // Tracks the beast's shield stat

  const beastCardContainer = document.getElementById("beast-card-container");

  if (!beastCardContainer) {
    console.error("Beast card container not found!");
    return;
  }

  // Add the container style
  beastCardContainer.classList.add(styles.beastCardContainer);

  beastCardContainer.innerHTML = `
    <div class="${styles.beastCard}" data-id="${currentBeast.id}">
      <div class="${styles.spirit}" id="beast-spirit">${currentBeast.spirit}</div>
      <h2>${currentBeast.name}</h2>
      <div class="${styles.traits}">
        ${currentBeast.attackDice === 1 ? "Passive: Only rolls one dice" : ""}
      </div>
    </div>
  `;
}

// Function to draw a random card from the items deck
async function drawCard() {
  const items = await fetchItems(); // Fetch the list of items from cards.json
  if (items.length === 0) {
    console.log("No more cards available to draw!");
    return;
  }

  // Randomly select a card
  const randomIndex = Math.floor(Math.random() * items.length);
  const card = items[randomIndex];

  // Add the card to the player's hand
  addItemToHand(card);

  console.log(`Drew card: ${card.name}`);
}

// Function to start the game
function startGame() {
  // Hide the start screen
  const startScreen = document.getElementById("start-screen");
  startScreen.style.display = "none";

  // Show the main game screen
  const gameContainer = document.getElementById("game-container");
  gameContainer.style.display = "block";

  // Generate a random beast
  generateBeast();

  console.log("Game has started!");
}

// Function to switch initiatives
function switchInitiative() {
  const initiativeIndicator = document.getElementById("initiative-indicator");
  const turnCounter = document.getElementById("turn-counter");

  if (!initiativeIndicator) {
    console.error("Initiative indicator element not found!");
    return;
  }

  if (currentInitiative === INITIATIVE_PLAYER) {
    // Player's initiative is completed
    playerInitiativeCompleted = true;

    currentInitiative = INITIATIVE_BEAST; // Switch to beast's initiative
    initiativeIndicator.textContent = "Beasts' action";
    prepareBeastInitiative(); // Set up the beast's attack
  } else if (currentInitiative === INITIATIVE_BEAST) {
    // Beast's initiative is completed
    beastInitiativeCompleted = true;

    currentInitiative = INITIATIVE_PLAYER; // Switch to player's initiative
    initiativeIndicator.textContent = "Player's action";
    preparePlayerInitiative(); // Set up the player's attack

    // Check if both initiatives are completed
    if (playerInitiativeCompleted && beastInitiativeCompleted) {
      turnCount++; // Increment the turn count
      playerInitiativeCompleted = false; // Reset for the next turn
      beastInitiativeCompleted = false; // Reset for the next turn

      // Update the turn counter display
      if (turnCounter) {
        turnCounter.textContent = `Turn: ${turnCount}`;
      }
    }
  }
}

// Function to handle the attack logic
function handleAttack() {
  const diceRolls = document.getElementById("dice-rolls");
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = currentInitiative === INITIATIVE_PLAYER || currentBeast.attackDice === 2 ? Math.floor(Math.random() * 6) + 1 : 0;
  const totalDamage = dice1 + dice2;

  if (currentInitiative === INITIATIVE_PLAYER) {
    console.log(`Player rolled: ${dice1} and ${dice2} (Total: ${totalDamage})`);
    diceRolls.textContent = `You rolled: ${dice1} and ${dice2} (Total: ${totalDamage})`;

    // Highlight the beast card as clickable
    const beastCard = document.querySelector(`.${styles.beastCard}`);
    beastCard.classList.add(styles.clickable);

    beastCard.addEventListener("click", function handlePlayerAttack() {
      currentBeast.spirit -= totalDamage;

      const spiritElement = document.getElementById("beast-spirit");
      spiritElement.textContent = `${Math.max(currentBeast.spirit, 0)}`;

      console.log(`Beast took ${totalDamage} damage. Remaining spirit: ${currentBeast.spirit}`);

      beastCard.classList.remove(styles.clickable);
      beastCard.removeEventListener("click", handlePlayerAttack);

      if (currentBeast.spirit <= 0) {
        alert(`${currentBeast.name} has been defeated!`);
        beastCard.innerHTML = `<h2>${currentBeast.name} (Defeated)</h2>`;
      } else {
        switchInitiative(); // Switch to the beast's initiative
      }
    });
  } else if (currentInitiative === INITIATIVE_BEAST) {
    console.log(`Beast rolled: ${dice1}${dice2 ? ` and ${dice2}` : ""} (Total: ${totalDamage})`);
    diceRolls.textContent = `Beast rolled: ${dice1}${dice2 ? ` and ${dice2}` : ""} (Total: ${totalDamage})`;

    // Highlight the player card as clickable
    const playerCard = document.querySelector(`.${styles.playerCard}`);
    playerCard.classList.add(styles.clickable);

    playerCard.addEventListener("click", function handleBeastAttack() {
      playerSpirit -= totalDamage;

      const spiritElement = document.getElementById("player-spirit");
      spiritElement.textContent = `${Math.max(playerSpirit, 0)}`;

      console.log(`Player took ${totalDamage} damage. Remaining spirit: ${playerSpirit}`);

      playerCard.classList.remove(styles.clickable);
      playerCard.removeEventListener("click", handleBeastAttack);

      if (playerSpirit <= 0) {
        alert("You have been defeated!");
        playerCard.innerHTML = `<h2>Player (Defeated)</h2>`;
      } else {
        switchInitiative(); // Switch to the player's initiative
      }
    });
  }
}

// Function to handle the player's attack roll
function handleAttackRoll() {
  if (currentInitiative !== INITIATIVE_PLAYER) return; // Ensure it's the player's initiative

  // Disable the "Attack" button to prevent multiple clicks
  const attackBtn = document.getElementById("attack-btn");
  if (attackBtn) {
    attackBtn.disabled = true;
  }

  // Generate two random dice rolls (1-6)
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  attackRoll = dice1 + dice2;

  console.log(`Player rolled: ${dice1} and ${dice2} (Total: ${attackRoll})`);

  // Display the dice rolls
  const diceRolls = document.getElementById("dice-rolls");
  diceRolls.textContent = `You rolled: ${dice1} and ${dice2} (Total: ${attackRoll})`;

  // Highlight beasts as clickable
  const beastCard = document.querySelector(`.${styles.beastCard}`);
  if (beastCard) {
    beastCard.classList.add(styles.clickable);
    beastCard.addEventListener("click", handleBeastClick);
  }
}

// Function to handle clicking on a beast
function handleBeastClick(event) {
  const beastCard = event.currentTarget;

  // Subtract the attack roll from the beast's spirit
  currentBeast.spirit -= attackRoll;

  // Update the beast's spirit display
  const spiritElement = document.getElementById("beast-spirit");
  spiritElement.textContent = `${Math.max(currentBeast.spirit, 0)}`;

  console.log(`Beast took ${attackRoll} damage. Remaining spirit: ${currentBeast.spirit}`);

  // Remove the clickable class and event listener
  beastCard.classList.remove(styles.clickable);
  beastCard.removeEventListener("click", handleBeastClick);

  // Check if the beast is defeated
  if (currentBeast.spirit <= 0) {
    alert(`${currentBeast.name} has been defeated!`);
    beastCard.innerHTML = `<h2>${currentBeast.name} (Defeated)</h2>`;
  } else {
    switchInitiative(); // Switch to the beast's initiative
  }
}

// Function to handle the beast's attack
function handleBeastAttack() {
  console.log("Beast attack initiated..."); // Debugging log

  if (currentInitiative !== INITIATIVE_BEAST) {
    console.log("Not the beast's initiative. Exiting."); // Debugging log
    return;
  }

  // Disable the "Beast Attack" button to prevent multiple clicks
  const beastAttackBtn = document.getElementById("beast-attack-btn");
  if (beastAttackBtn) {
    beastAttackBtn.disabled = true;
  }

  // Generate dice rolls based on the beast's attackDice value
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = currentBeast.attackDice === 2 ? Math.floor(Math.random() * 6) + 1 : 0;
  const totalDamage = dice1 + dice2;

  console.log(`Beast rolled: ${dice1}${dice2 ? ` and ${dice2}` : ""} (Total: ${totalDamage})`);

  // Display the dice rolls
  const diceRolls = document.getElementById("dice-rolls");
  diceRolls.textContent = `Beast rolled: ${dice1}${dice2 ? ` and ${dice2}` : ""} (Total: ${totalDamage})`;

  // Highlight the player card as clickable
  const playerCard = document.querySelector(`.${styles.playerCard}`);
  playerCard.classList.add(styles.clickable);

  playerCard.addEventListener("click", function handlePlayerDamage() {
    playerSpirit -= totalDamage;

    // Update the player's spirit display
    const spiritElement = document.getElementById("player-spirit");
    spiritElement.textContent = `${Math.max(playerSpirit, 0)}`;

    console.log(`Player took ${totalDamage} damage. Remaining spirit: ${playerSpirit}`);

    // Remove the clickable class and event listener
    playerCard.classList.remove(styles.clickable);
    playerCard.removeEventListener("click", handlePlayerDamage);

    if (playerSpirit <= 0) {
      alert("You have been defeated!");
      playerCard.innerHTML = `<h2>Player (Defeated)</h2>`;
    } else {
      // At the end of the beast's attack, draw 2 cards for the player
      drawCard();
      drawCard();

      // Switch to the player's initiative
      switchInitiative();
    }
  });
}

// Function to prepare the beast's initiative
function prepareBeastInitiative() {
  const buttonsContainer = document.getElementById("buttons-container");

  // Update the initiative indicator
  const initiativeIndicator = document.getElementById("initiative-indicator");
  if (initiativeIndicator) {
    initiativeIndicator.textContent = "Beasts' action";
  }

  // Dynamically create the beast's action button
  buttonsContainer.innerHTML = `
    <button id="beast-attack-btn">Attack</button>
  `;

  // Attach event listener to the "Beast Attack" button after it is added to the DOM
  const beastAttackBtn = document.getElementById("beast-attack-btn");
  if (beastAttackBtn) {
    beastAttackBtn.addEventListener("click", handleBeastAttack);
  } else {
    console.error("Beast Attack button not found!");
  }
}

// Function to prepare the player's initiative
function preparePlayerInitiative() {
  const buttonsContainer = document.getElementById("buttons-container");

  // Update the initiative indicator
  const initiativeIndicator = document.getElementById("initiative-indicator");
  if (initiativeIndicator) {
    initiativeIndicator.textContent = "Player's action";
  }

  // Dynamically create the player's action buttons
  buttonsContainer.innerHTML = `
    <button id="attack-btn" class="${styles.button}">Attack</button>
    <button id="meditate-btn" class="${styles.button}">Meditate</button>
  `;

  // Attach event listener to the "Attack" button
  const attackBtn = document.getElementById("attack-btn");
  if (attackBtn) {
    attackBtn.addEventListener("click", handleAttackRoll);
  } else {
    console.error("Attack button not found!");
  }

  // Attach event listener to the "Meditate" button
  const meditateBtn = document.getElementById("meditate-btn");
  if (meditateBtn) {
    meditateBtn.addEventListener("click", handleMeditation);
  } else {
    console.error("Meditate button not found!");
  }
}

// Function to toggle the hand container visibility
function toggleHand() {
  const handArea = document.getElementById("hand-area");
  const toggleButton = document.getElementById("toggle-hand-btn");

  if (handArea.style.display === "none") {
    handArea.style.display = "block";
    toggleButton.textContent = "Hide Hand ▲";
  } else {
    handArea.style.display = "none";
    toggleButton.textContent = "Show Hand ▼";
  }
}

// Function to add an item card to the player's hand
function addItemToHand(item) {
  const cardList = document.getElementById("card-list");

  // Ensure the player's hand container exists
  if (!cardList) {
    console.error("Card list container not found!");
    return;
  }

  // Create the item card
  const itemCard = document.createElement("li");
  itemCard.classList.add(styles.itemCard);
  itemCard.innerHTML = `
    <h4>${item.name}</h4>
    <p>${item.effect}</p>
  `;

  // Add hover and click functionality
  itemCard.addEventListener("mouseenter", () => {
    itemCard.classList.add(styles.highlight);
  });
  itemCard.addEventListener("mouseleave", () => {
    itemCard.classList.remove(styles.highlight);
  });
  itemCard.addEventListener("click", () => {
    selectItem(item);
  });

  // Append the item card to the player's hand
  cardList.appendChild(itemCard);
}

// Function to handle item selection
function selectItem(item) {
  console.log(`Selected item: ${item.name}`);
  selectedItem = item; // Store the selected item

  // Highlight the selected item
  const cardList = document.getElementById("card-list");
  const itemCards = cardList.querySelectorAll(`.${styles.itemCard}`);
  itemCards.forEach((card) => card.classList.remove(styles.selected)); // Remove the 'selected' class from all items
  const selectedCard = Array.from(itemCards).find((card) => card.querySelector("h4").textContent === item.name);
  if (selectedCard) {
    selectedCard.classList.add(styles.selected); // Add the 'selected' class to the clicked item
  }

  // Highlight valid targets (player and beast cards)
  const playerCard = document.querySelector(`.${styles.playerCard}`);
  const beastCard = document.querySelector(`.${styles.beastCard}`);
  if (playerCard) playerCard.classList.add(styles.clickable);
  if (beastCard) beastCard.classList.add(styles.clickable);

  // Add event listeners to targets
  if (playerCard) {
    playerCard.addEventListener("click", () => handleTargetSelection("player", playerCard));
  }
  if (beastCard) {
    beastCard.addEventListener("click", () => handleTargetSelection("beast", beastCard));
  }
}

// Function to handle meditation
function handleMeditation() {
  console.log("Player is meditating...");

  // Draw 3 random cards
  drawCard();
  drawCard();
  drawCard();

  // Switch initiative to the beast
  switchInitiative();
}

function handleTargetSelection(target, targetElement) {
  if (!selectedItem) return; // Ensure an item is selected

  // Show a confirmation popup
  const confirmation = confirm(`Would you like to use ${selectedItem.name} on ${target === "player" ? "Player" : currentBeast.name}?`);
  if (confirmation) {
    // Apply the item's effect to the target
    applyItemEffect(selectedItem, target);
  }

  // Reset selection and unhighlight everything
  resetSelection();
}

// Function to reset selection
function resetSelection() {
  selectedItem = null;

  // Remove highlights from items
  const cardList = document.getElementById("card-list");
  const itemCards = cardList.querySelectorAll(`.${styles.itemCard}`);
  itemCards.forEach((card) => card.classList.remove(styles.highlight, styles.selected)); // Remove both 'highlight' and 'selected' classes

  // Remove clickable class and event listeners from targets
  const playerCard = document.querySelector(`.${styles.playerCard}`);
  const beastCard = document.querySelector(`.${styles.beastCard}`);
  if (playerCard) {
    playerCard.classList.remove(styles.clickable);
    playerCard.replaceWith(playerCard.cloneNode(true)); // Remove event listeners
  }
  if (beastCard) {
    beastCard.classList.remove(styles.clickable);
    beastCard.replaceWith(beastCard.cloneNode(true)); // Remove event listeners
  }
}

function applyItemEffect(item, target) {
  console.log(`Applying ${item.name} to ${target === "player" ? "Player" : currentBeast.name}`);

  // Determine the target's stats
  let targetStats;
  if (target === "player") {
    targetStats = {
      spirit: playerSpirit,
      power: playerPower || 0, // Default to 0 if not initialized
      shield: playerShield || 0 // Default to 0 if not initialized
    };
  } else if (target === "beast") {
    targetStats = {
      spirit: currentBeast.spirit,
      power: currentBeast.power || 0, // Default to 0 if not initialized
      shield: currentBeast.shield || 0 // Default to 0 if not initialized
    };
  }

  // Apply Heal
  if (item.Heal !== null) {
    targetStats.spirit = Math.min(targetStats.spirit + item.Heal, 50); // Cap spirit at 50
  }

  // Apply Damage
  if (item.Damage !== null) {
    targetStats.spirit = Math.max(targetStats.spirit - item.Damage, 0); // Minimum spirit is 0
  }

  // Apply Power
  if (item.Power !== null) {
    targetStats.power += item.Power;
  }

  // Apply Shield
  if (item.Shield !== null) {
    targetStats.shield += item.Shield;
  }

  // Update the target's stats
  if (target === "player") {
    playerSpirit = targetStats.spirit;
    playerPower = targetStats.power;
    playerShield = targetStats.shield;

    // Update the UI
    const playerSpiritElement = document.getElementById("player-spirit");
    if (playerSpiritElement) {
      playerSpiritElement.textContent = playerSpirit;
    } else {
      console.warn("player-spirit element not found!");
    }

    const playerPowerElement = document.getElementById("player-power");
    if (playerPowerElement) {
      playerPowerElement.textContent = `Power: ${playerPower}`;
    }

    const playerShieldElement = document.getElementById("player-shield");
    if (playerShieldElement) {
      playerShieldElement.textContent = `Shield: ${playerShield}`;
    }
  } else if (target === "beast") {
    currentBeast.spirit = targetStats.spirit;
    currentBeast.power = targetStats.power;
    currentBeast.shield = targetStats.shield;

    // Update the UI
    const beastSpiritElement = document.getElementById("beast-spirit");
    if (beastSpiritElement) {
      beastSpiritElement.textContent = currentBeast.spirit;
    } else {
      console.warn("beast-spirit element not found!");
    }

    const beastPowerElement = document.getElementById("beast-power");
    if (beastPowerElement) {
      beastPowerElement.textContent = `Power: ${currentBeast.power}`;
    }

    const beastShieldElement = document.getElementById("beast-shield");
    if (beastShieldElement) {
      beastShieldElement.textContent = `Shield: ${currentBeast.shield}`;
    }
  }

  // Check if the beast is defeated
  if (target === "beast" && currentBeast.spirit <= 0) {
    alert(`${currentBeast.name} has been defeated!`);
    const beastCard = document.querySelector(`.${styles.beastCard}`);
    if (beastCard) beastCard.innerHTML = `<h2>${currentBeast.name} (Defeated)</h2>`;
  }

  // Remove the item from the hand
  const cardList = document.getElementById("card-list");
  const itemCards = cardList.querySelectorAll(`.${styles.itemCard}`);
  const selectedCard = Array.from(itemCards).find((card) => card.querySelector("h4").textContent === item.name);
  if (selectedCard) {
    selectedCard.remove();
    console.log(`Removed card: ${item.name} from the hand.`);
  } else {
    console.warn(`Card: ${item.name} not found in the hand.`);
  }

  // Reset the selection
  resetSelection();
}