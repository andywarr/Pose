export class UI {
  constructor(
    scoreElementId,
    gameOverElementId,
    instructionModalId,
    countdownElementId,
    countdownTextId,
    waitingMessageId // Add new ID
  ) {
    this.scoreElement = document.getElementById(scoreElementId);
    this.gameOverElement = document.getElementById(gameOverElementId);
    this.instructionModal = document.getElementById(instructionModalId);
    this.countdownElement = document.getElementById(countdownElementId);
    this.countdownText = document.getElementById(countdownTextId);
    this.waitingMessage = document.getElementById(waitingMessageId); // Get the new element
    this.restartButton = document.getElementById("restartButton");

    if (
      !this.scoreElement ||
      !this.gameOverElement ||
      !this.instructionModal ||
      !this.countdownElement ||
      !this.countdownText ||
      !this.waitingMessage // Check for the new element
    ) {
      console.error("One or more UI elements not found!");
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

  showInstructions() {
    if (this.instructionModal) {
      this.instructionModal.classList.remove("hidden");
    }
  }

  hideInstructions() {
    if (this.instructionModal) {
      this.instructionModal.classList.add("hidden");
    }
  }

  showCountdown() {
    if (this.countdownElement) {
      this.countdownElement.classList.remove("hidden");
      // Ensure countdown text itself is also visible initially
      if (this.countdownText) {
        this.countdownText.classList.remove("hidden"); // Make number visible
      }
    }
  }

  hideCountdown() {
    if (this.countdownElement) {
      this.countdownElement.classList.add("hidden");
    }
  }

  updateCountdown(value) {
    if (this.countdownText) {
      this.countdownText.textContent = value;
    }
  }

  // Add methods for waiting message
  showWaitingMessage() {
    if (this.waitingMessage) {
      console.log("Showing waiting message", this.waitingMessage); // Add log
      this.waitingMessage.classList.remove("invisible");
    } else {
      console.error("Waiting message element not found!"); // Add error log
    }
  }

  hideWaitingMessage() {
    if (this.waitingMessage) {
      console.log("Hiding waiting message", this.waitingMessage); // Add log
      this.waitingMessage.classList.add("invisible");
    } else {
      console.error("Waiting message element not found!"); // Add error log
    }
  }

  setupRestartButton(restartCallback) {
    if (this.restartButton) {
      this.restartButton.addEventListener("click", restartCallback);
    } else {
      console.error("Restart button not found!");
    }
  }
}
