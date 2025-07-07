// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the countdown timer
const GAME_TIME = 30;        // Total game time in seconds
let timeLeft = GAME_TIME;    // Time left in the game

// Creates the 10x10 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  // Remove any existing floating water can
  const existingCan = document.querySelector('.floating-water-can');
  if (existingCan) {
    existingCan.remove();
  }

  // Clear all cells (optional, if you want to keep them empty)
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell
  const randomIndex = Math.floor(Math.random() * cells.length);
  const randomCell = cells[randomIndex];

  // Get the position of the cell relative to the grid using offsetTop/offsetLeft
  const grid = document.querySelector('.game-grid');
  const top = randomCell.offsetTop;
  const left = randomCell.offsetLeft;
  const width = randomCell.offsetWidth;
  const height = randomCell.offsetHeight;

  // Create the floating water can
  const floatingCan = document.createElement('div');
  floatingCan.className = 'floating-water-can';
  floatingCan.style.position = 'absolute';
  floatingCan.style.top = `${top}px`;
  floatingCan.style.left = `${left}px`;
  floatingCan.style.width = `${width}px`;
  floatingCan.style.height = `${height}px`;
  floatingCan.style.zIndex = '10'; // Make sure it's on top
  floatingCan.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;

  // Add the floating can to the grid
  grid.appendChild(floatingCan);

  // Find the water can element
  const waterCan = floatingCan.querySelector('.water-can');

  // Add a click event to the water can
  waterCan.addEventListener('click', () => {
    // Increase the score
    currentCans += 1;
    // Update the score display
    document.getElementById('current-cans').textContent = currentCans;
    // Remove the can after clicking
    floatingCan.remove();
  });
}

// Function to update the timer display
function updateTimerDisplay() {
  document.getElementById('timer').textContent = timeLeft;
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  currentCans = 0;
  timeLeft = GAME_TIME;
  document.getElementById('current-cans').textContent = currentCans;
  updateTimerDisplay();
  createGrid(); // Set up the game grid

  // Start spawning water cans every second
  spawnInterval = setInterval(spawnWaterCan, 1000);

  // Start the countdown timer
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();
    // If time runs out, end the game
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Ends the game and stops all intervals
function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the timer

  // Optionally, remove any remaining water can
  const existingCan = document.querySelector('.floating-water-can');
  if (existingCan) {
    existingCan.remove();
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);