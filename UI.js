export class UI {
  constructor(
    scoreElementId,
    gameOverElementId,
    instructionModalId,
    standByMessageId,
    countdownElementId,
    countdownTextId
  ) {
    this.scoreElement = document.getElementById(scoreElementId);
    this.gameOverElement = document.getElementById(gameOverElementId);
    this.instructionModal = document.getElementById(instructionModalId);
    this.standByMessage = document.getElementById(standByMessageId);
    this.countdownElement = document.getElementById(countdownElementId);
    this.countdownText = document.getElementById(countdownTextId);

    if (
      !this.scoreElement ||
      !this.gameOverElement ||
      !this.instructionModal ||
      !this.standByMessage ||
      !this.countdownElement ||
      !this.countdownText
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

  showStandByMessage() {
    if (this.standByMessage) {
      this.standByMessage.classList.remove("hidden");
    }
  }

  hideStandByMessage() {
    if (this.standByMessage) {
      this.standByMessage.classList.add("hidden");
    }
  }

  showCountdown() {
    if (this.countdownElement) {
      this.countdownElement.classList.remove("hidden");
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
}
