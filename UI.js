export class UI {
  constructor(scoreElementId, gameOverElementId) {
    this.scoreElement = document.getElementById(scoreElementId);
    this.gameOverElement = document.getElementById(gameOverElementId);
    if (!this.scoreElement || !this.gameOverElement) {
      console.error("UI elements not found!");
    }
  }

  updateScore(score) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${score}`;
    }
  }

  showGameOver() {
    if (this.gameOverElement) {
      this.gameOverElement.classList.remove("hidden");
    }
  }

  hideGameOver() {
    if (this.gameOverElement) {
      this.gameOverElement.classList.add("hidden");
    }
  }
}
