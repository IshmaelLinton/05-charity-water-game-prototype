
// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected (score shown to player)
let collectedSinceLastScore = 0; // Tracks how many droplets have been collected since last score update
let gameActive = false;      // Tracks if game is currently running
let spawnTimeout;            // Holds the timeout for spawning items
let timerInterval;           // Holds the interval for the countdown timer
const GAME_TIME = 60;        // Total game time in seconds
let timeLeft = GAME_TIME;    // Time left in the game

// Jerry can fill state (0 = empty, 1-5 = filling, 5 = full)
let jerrCanState = 0;
const jerrCanImages = [
  'img/jerr-can.png', // empty
  'img/jerr-can-1.png', // placeholder for 1/5 full
  'img/jerr-can-2.png', // placeholder for 2/5 full
  'img/jerr-can-3.png', // placeholder for 3/5 full
  'img/jerr-can-4.png', // placeholder for 4/5 full
  'img/jerr-can-5.png'  // placeholder for full
];

// Game mode: 'easy', 'intermediate', 'hard'
let currentMode = null;

// Mode settings
const modeSettings = {
  easy: {
    spawnMin: 120, // ms
    spawnMax: 350, // ms
    dirtyChance: 0.25
  },
  intermediate: {
    spawnMin: 200,
    spawnMax: 600,
    dirtyChance: 0.5
  },
  hard: {
    spawnMin: 200,
    spawnMax: 600,
    dirtyChance: 0.8
  }
};

// Creates the 10x10 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell (water or dirty droplet)
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  const settings = modeSettings[currentMode] || modeSettings.intermediate;

  // Select a random cell
  const randomIndex = Math.floor(Math.random() * cells.length);
  const randomCell = cells[randomIndex];

  // Get the position of the cell relative to the grid
  const grid = document.querySelector('.game-grid');
  const top = randomCell.offsetTop;
  const left = randomCell.offsetLeft;
  const width = randomCell.offsetWidth;
  const height = randomCell.offsetHeight;

  // Decide if this is a water droplet or dirty droplet based on mode
  const isDirty = Math.random() < settings.dirtyChance;

  // Create the floating droplet
  const floatingCan = document.createElement('div');
  floatingCan.className = isDirty ? 'floating-dirty-droplet' : 'floating-water-can';
  floatingCan.style.position = 'absolute';
  floatingCan.style.top = `${top}px`;
  floatingCan.style.left = `${left}px`;
  floatingCan.style.width = `${width}px`;
  floatingCan.style.height = `${height}px`;
  floatingCan.style.zIndex = '10';

  // Generate a random size multiplier between 0.6 and 1.0
  const sizeMult = 0.6 + Math.random() * 0.4;

  floatingCan.innerHTML = `
    <div class="water-can-wrapper">
      <div class="${isDirty ? 'dirty-droplet' : 'water-can'}" style="--size-mult: ${sizeMult};"></div>
    </div>
  `;

  // Add the floating droplet to the grid
  grid.appendChild(floatingCan);

  // Find the droplet element
  const droplet = floatingCan.querySelector(isDirty ? '.dirty-droplet' : '.water-can');

  if (isDirty) {
    // Dirty droplet logic: reset batch and jerry can, then remove
    droplet.addEventListener('click', () => {
      collectedSinceLastScore = 0;
      jerrCanState = 0;
      const jerrCanImg = document.querySelector('.jerr-can-overlay');
      if (jerrCanImg) {
        jerrCanImg.src = jerrCanImages[0];
      }
      floatingCan.remove();
    });
  } else {
    droplet.addEventListener('click', () => {
      collectedSinceLastScore += 1;
      jerrCanState += 1;
      if (jerrCanState > 5) jerrCanState = 0;
      const jerrCanImg = document.querySelector('.jerr-can-overlay');
      if (jerrCanImg) {
        jerrCanImg.src = jerrCanImages[jerrCanState];
      }
      if (collectedSinceLastScore === 5) {
        currentCans += 5;
        document.getElementById('current-cans').textContent = currentCans;
        collectedSinceLastScore = 0;
        setTimeout(() => {
          jerrCanState = 0;
          if (jerrCanImg) {
            jerrCanImg.src = jerrCanImages[0];
          }
        }, 600);
      }
      floatingCan.remove();
    });
  }

  // The droplet despawns after a certain time
  const despawnTime = 1200 + Math.random() * 800;
  const despawnTimeout = setTimeout(() => {
    if (grid.contains(floatingCan)) {
      floatingCan.remove();
    }
  }, despawnTime);

  floatingCan._despawnTimeout = despawnTimeout;
}

// Function to update the timer display
function updateTimerDisplay() {
  document.getElementById('timer').textContent = timeLeft;
}

// Initializes and starts a new game
function startGame(mode) {
  if (gameActive) return;
  if (mode) currentMode = mode;
  gameActive = true;
  currentCans = 0;
  collectedSinceLastScore = 0;
  jerrCanState = 0;
  timeLeft = GAME_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  updateTimerDisplay();
  createGrid();
  // Reset jerr-can image to empty at game start
  const jerrCanImg = document.querySelector('.jerr-can-overlay');
  if (jerrCanImg) {
    jerrCanImg.src = jerrCanImages[0];
  }

  // Highlight selected button
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
  if (currentMode) {
    const selBtn = document.getElementById(currentMode+'-btn');
    if (selBtn) selBtn.classList.add('selected');
  }

  function scheduleNextSpawn() {
    if (!gameActive) return;
    const settings = modeSettings[currentMode] || modeSettings.intermediate;
    const randomDelay = settings.spawnMin + Math.random() * (settings.spawnMax - settings.spawnMin);
    spawnTimeout = setTimeout(() => {
      spawnWaterCan();
      scheduleNextSpawn();
    }, randomDelay);
  }
  scheduleNextSpawn();

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Ends the game and stops all intervals
function endGame() {
  gameActive = false;
  clearTimeout(spawnTimeout);
  clearInterval(timerInterval);

  // Remove all remaining water and dirty droplets and their despawn timers
  const cans = document.querySelectorAll('.floating-water-can, .floating-dirty-droplet');
  cans.forEach(can => {
    if (can._despawnTimeout) {
      clearTimeout(can._despawnTimeout);
    }
    can.remove();
  });
  // If there are any unscored collected droplets, add them to the score at the end
  if (collectedSinceLastScore > 0) {
    currentCans += collectedSinceLastScore;
    document.getElementById('current-cans').textContent = currentCans;
    collectedSinceLastScore = 0;
  }

  // Show overlay for win or lose
  const winOverlay = document.getElementById('win-overlay');
  const winTitle = document.getElementById('win-title');
  const winMessage = document.getElementById('win-message');
  if (winOverlay && winTitle && winMessage) {
    if (currentCans >= 60) {
      winTitle.textContent = 'Congratulations!';
      winTitle.style.color = '#159A48';
      winMessage.textContent = 'You collected 60 liters or more and won!';
    } else {
      winTitle.textContent = 'Try Again!';
      winTitle.style.color = '#47403fff';
      winMessage.textContent = 'You did not collect 60 liters. Try again!';
    }
    winOverlay.style.display = 'flex';
    setTimeout(() => { winOverlay.style.opacity = 1; }, 10);
  }
}

// Play again and close (X) button handlers, and difficulty button setup
document.addEventListener('DOMContentLoaded', function() {
  // Difficulty button handlers
  const easyBtn = document.getElementById('easy-btn');
  const intBtn = document.getElementById('intermediate-btn');
  const hardBtn = document.getElementById('hard-btn');
  if (easyBtn) easyBtn.addEventListener('click', function() { startGame('easy'); });
  if (intBtn) intBtn.addEventListener('click', function() { startGame('intermediate'); });
  if (hardBtn) hardBtn.addEventListener('click', function() { startGame('hard'); });

  // Play again button
  const playAgainBtn = document.getElementById('play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      // Hide win overlay
      const winOverlay = document.getElementById('win-overlay');
      if (winOverlay) {
        winOverlay.style.display = 'none';
        winOverlay.style.opacity = 0;
      }
      // Reset score and start game in same mode
      startGame(currentMode);
    });
  }
  // Add handler for the close (X) button
  const closeBtn = document.getElementById('win-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      const winOverlay = document.getElementById('win-overlay');
      if (winOverlay) {
        winOverlay.style.display = 'none';
        winOverlay.style.opacity = 0;
      }
      // Show difficulty buttons again
      const btnRow = document.getElementById('difficulty-btn-row');
      if (btnRow) btnRow.style.display = 'flex';
      currentMode = null;
    });
  }
});

// Remove old start button handler (no longer needed)