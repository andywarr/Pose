import { Player } from "./Player.js";
import { ObstacleManager } from "./Obstacles.js";
import { UI } from "./UI.js";
import { PoseController } from "./PoseController.js";

export class Game {
  constructor(canvasId, videoId, scoreId, gameOverId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.videoElementId = videoId; // Store ID for PoseController

    this.ui = new UI(scoreId, gameOverId);
    this.player = null; // Initialized after resize
    this.obstacleManager = null; // Initialized after resize
    this.poseController = null; // Initialized async

    this.score = 0;
    this.distanceTraveled = 0;
    this.gameOver = false;
    this.gameLoopId = null;

    this.handleResize = this.handleResize.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  async initialize() {
    // Initial resize to set canvas and component sizes
    this.handleResize();
    window.addEventListener("resize", this.handleResize);

    // Initialize Pose Controller (which includes camera setup)
    const videoWidth = window.innerWidth / 5;
    const videoHeight = window.innerHeight / 5;
    this.poseController = new PoseController(
      this.videoElementId,
      videoWidth,
      videoHeight
    );
    try {
      await this.poseController.initialize();
      // Start game loop only after pose detection is ready
      this.startGameLoop();
    } catch (error) {
      console.error("Failed to initialize game due to pose controller error.");
      // Optionally display an error message to the user via UI
    }
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Initialize or update components that depend on canvas size
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

    // Redraw canvas immediately after resize if game is running
    if (!this.gameOver && this.gameLoopId) {
      this.draw();
    }
  }

  async gameLoop() {
    if (this.gameOver) return;

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
    if (!this.gameLoopId) {
      console.log("Starting game loop...");
      this.gameOver = false;
      this.ui.hideGameOver();
      // Reset state if needed (e.g., score, player position)
      this.score = 0;
      this.distanceTraveled = 0;
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
    this.ui.showGameOver();
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    // Dispose pose controller resources when game ends
    if (this.poseController) {
      this.poseController.dispose();
    }
    // Consider adding a restart button/mechanism here
  }
}
