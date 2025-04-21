import { Player } from "./Player.js";
import { ObstacleManager } from "./Obstacles.js";
import { UI } from "./UI.js";
import { PoseController } from "./PoseController.js";

export class Game {
  constructor(
    canvasId,
    videoId,
    scoreId,
    gameOverId,
    instructionModalId,
    confirmInstructionsButtonId,
    countdownElementId,
    countdownTextId,
    waitingMessageId // Add new ID
  ) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.videoElementId = videoId; // Store ID for PoseController

    this.ui = new UI(
      scoreId,
      gameOverId,
      instructionModalId,
      countdownElementId,
      countdownTextId,
      waitingMessageId // Pass new ID to UI
    );
    this.confirmInstructionsButton = document.getElementById(
      confirmInstructionsButtonId
    );

    this.player = null; // Initialized after resize
    this.obstacleManager = null; // Initialized after resize
    this.poseController = null; // Initialized async

    this.score = 0;
    this.distanceTraveled = 0;
    this.gameOver = false;
    this.gameLoopId = null;
    this.gameStarted = false; // Flag to prevent game loop before countdown
    this.poseCheckInterval = null;

    this.handleResize = this.handleResize.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.startPreGameSequence = this.startPreGameSequence.bind(this);
    this.checkPoseReadiness = this.checkPoseReadiness.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.restart = this.restart.bind(this);
  }

  async initialize() {
    // Initial resize to set canvas and component sizes
    this.handleResize();
    window.addEventListener("resize", this.handleResize);

    // Show instructions first
    this.ui.showInstructions();

    // Add listener for instruction confirmation
    this.confirmInstructionsButton.addEventListener(
      "click",
      this.startPreGameSequence,
      { once: true } // Remove listener after first click
    );

    // Add listener for restart button
    this.ui.setupRestartButton(this.restart);

    // Initialize Pose Controller (but don't start game loop yet)
    const videoWidth = window.innerWidth / 5;
    const videoHeight = window.innerHeight / 5;
    this.poseController = new PoseController(
      this.videoElementId,
      videoWidth,
      videoHeight
    );
    try {
      await this.poseController.initialize();
      // Pose controller is ready, but wait for user interaction
      console.log("Pose controller initialized.");
    } catch (error) {
      console.error("Failed to initialize pose controller:", error);
      // Optionally display a more specific error message to the user via UI
      this.ui.hideInstructions(); // Hide instructions if setup fails
      // Display a general error message (consider adding a dedicated UI element)
      alert(
        "Failed to initialize camera or pose detection. Please check permissions and refresh."
      );
    }
  }

  startPreGameSequence() {
    this.ui.hideInstructions();
    this.ui.showCountdown(); // Show the combined countdown/standby modal
    this.ui.updateCountdown(3); // Set initial countdown number display
    this.ui.showWaitingMessage(); // Show the waiting message
    // Start checking for pose readiness
    this.poseCheckInterval = setInterval(this.checkPoseReadiness, 500); // Check every 500ms
  }

  async checkPoseReadiness() {
    if (!this.poseController || !this.poseController.isReady()) {
      console.log("Pose controller not ready yet...");
      return; // Wait if controller isn't fully initialized
    }

    console.log("Checking pose readiness..."); // Add log: function called
    const poseData = await this.poseController.getCurrentPose();

    if (poseData && poseData.keypoints) {
      console.log("Pose data received:", poseData); // Add log: pose data details
      const leftShoulder = poseData.keypoints.find(
        (k) => k.name === "left_shoulder"
      );
      const rightShoulder = poseData.keypoints.find(
        (k) => k.name === "right_shoulder"
      );
      const leftWrist = poseData.keypoints.find((k) => k.name === "left_wrist");
      const rightWrist = poseData.keypoints.find(
        (k) => k.name === "right_wrist"
      );
      const shoulderConfidenceThreshold = 0.05; // Keep shoulder threshold
      const wristConfidenceThreshold = 0.01; // Lower wrist threshold further

      // Log individual keypoint statuses
      console.log(
        `Left Shoulder: ${
          leftShoulder ? `Score ${leftShoulder.score.toFixed(2)}` : "Not found"
        } (Threshold: ${shoulderConfidenceThreshold})`
      );
      console.log(
        `Right Shoulder: ${
          rightShoulder
            ? `Score ${rightShoulder.score.toFixed(2)}`
            : "Not found"
        } (Threshold: ${shoulderConfidenceThreshold})`
      );
      console.log(
        `Left Wrist: ${
          leftWrist ? `Score ${leftWrist.score.toFixed(2)}` : "Not found"
        } (Threshold: ${wristConfidenceThreshold})`
      );
      console.log(
        `Right Wrist: ${
          rightWrist ? `Score ${rightWrist.score.toFixed(2)}` : "Not found"
        } (Threshold: ${wristConfidenceThreshold})`
      );

      const lsReady = leftShoulder?.score > shoulderConfidenceThreshold;
      const rsReady = rightShoulder?.score > shoulderConfidenceThreshold;
      const lwReady = leftWrist?.score > wristConfidenceThreshold; // Use lower threshold
      const rwReady = rightWrist?.score > wristConfidenceThreshold; // Use lower threshold

      console.log(
        `Readiness Check: LS=${lsReady}, RS=${rsReady}, LW=${lwReady}, RW=${rwReady}`
      ); // Add log: individual checks

      if (lsReady && rsReady && lwReady && rwReady) {
        console.log("Pose detected! Starting countdown.");
        clearInterval(this.poseCheckInterval); // Stop checking
        this.poseCheckInterval = null;
        this.ui.hideWaitingMessage(); // Hide the waiting message
        this.startCountdown();
      } else {
        console.log(
          "Waiting for clearer pose detection (threshold not met or keypoints missing)."
        ); // Updated log message
      }
    } else {
      console.log(
        "No pose data available yet or poseData.keypoints is missing."
      ); // Updated log message
    }
  }

  startCountdown() {
    let count = 3;
    this.ui.updateCountdown(count); // Ensure the timed sequence starts visually at 3

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        this.ui.updateCountdown(count);
      } else {
        clearInterval(countdownInterval);
        this.ui.hideCountdown();
        this.startGameLoop(); // Start the actual game
      }
    }, 1000);
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Initialize or update components that depend on canvas size
    // Ensure player/obstacles are created *before* game loop starts
    if (!this.player) {
      this.player = new Player(this.canvas.width, 50);
    }
    if (!this.obstacleManager) {
      this.obstacleManager = new ObstacleManager(
        this.canvas.width,
        this.canvas.height
      );
    }

    // Notify components of resize
    this.player.handleResize(this.canvas.width);
    this.obstacleManager.handleResize(this.canvas.width, this.canvas.height);

    // Redraw canvas immediately after resize only if game has actually started
    if (this.gameStarted && !this.gameOver && this.gameLoopId) {
      this.draw();
    }
  }

  async gameLoop() {
    if (this.gameOver || !this.gameStarted) return; // Don't run if game hasn't started or is over

    // 1. Get Input
    const turnDirection = await this.poseController.detectTurnDirection();

    // 2. Update State
    this.player.update(turnDirection);
    const { moveX, moveY } = this.player.getMovement();
    this.distanceTraveled += moveY;
    this.obstacleManager.spawn(this.distanceTraveled);
    this.obstacleManager.update(moveX, moveY);

    // 3. Check Collisions
    if (this.obstacleManager.checkCollisions(this.player)) {
      this.endGame();
      return; // Stop loop immediately on game over
    }

    // 4. Update Score
    this.score = Math.floor(this.distanceTraveled / 10);
    this.ui.updateScore(this.score);

    // 5. Draw
    this.draw();

    // 6. Request Next Frame
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.player.draw(this.ctx);
    this.obstacleManager.draw(this.ctx);
  }

  startGameLoop() {
    if (!this.gameLoopId && !this.gameOver) {
      console.log("Starting game loop...");
      this.gameStarted = true; // Set the flag
      this.gameOver = false;
      this.ui.hideGameOver();
      // Reset state if needed (ensure player/obstacles are ready)
      this.score = 0;
      this.distanceTraveled = 0;
      // Re-initialize player and obstacles to ensure correct starting state
      this.player = new Player(this.canvas.width, 50);
      this.obstacleManager = new ObstacleManager(
        this.canvas.width,
        this.canvas.height
      );

      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  }

  endGame() {
    console.log("Game Over!");
    this.gameOver = true;
    this.gameStarted = false; // Reset flag
    this.ui.showGameOver();
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    if (this.poseCheckInterval) {
      // Clear pose check interval if game ends early
      clearInterval(this.poseCheckInterval);
      this.poseCheckInterval = null;
    }
    // Dispose pose controller resources when game ends
    if (this.poseController) {
      this.poseController.dispose();
    }
  }

  restart() {
    console.log("Restarting game...");

    // Reset game state
    this.score = 0;
    this.distanceTraveled = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.ui.updateScore(0);

    // Hide game over screen
    this.ui.hideGameOver();

    // Re-initialize pose controller
    const videoWidth = window.innerWidth / 5;
    const videoHeight = window.innerHeight / 5;
    this.poseController = new PoseController(
      this.videoElementId,
      videoWidth,
      videoHeight
    );

    // Reinitialize the game
    this.poseController
      .initialize()
      .then(() => {
        console.log("Pose controller reinitialized");
        this.startPreGameSequence();
      })
      .catch((error) => {
        console.error("Failed to reinitialize pose controller:", error);
        alert(
          "Failed to reinitialize camera or pose detection. Please refresh the page."
        );
      });
  }
}
