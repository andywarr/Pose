class Obstacle {
  constructor(canvasWidth, canvasHeight) {
    this.type = Math.random() < 0.5 ? "rock" : "tree";
    this.size =
      this.type === "rock" ? 20 + Math.random() * 20 : 30 + Math.random() * 30;
    this.x = Math.random() * canvasWidth;
    this.y = canvasHeight + this.size; // Spawn below the screen
  }

  update(moveX, moveY) {
    this.y -= moveY;
    this.x -= moveX;
  }

  draw(ctx) {
    ctx.fillStyle = this.type === "rock" ? "grey" : "darkgreen";
    if (this.type === "rock") {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size / 2);
      ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
      ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  isOffScreen(canvasWidth) {
    const verticalBuffer = 50;
    const horizontalBuffer = 200;
    return (
      this.y < -verticalBuffer ||
      this.x < -horizontalBuffer ||
      this.x > canvasWidth + horizontalBuffer
    );
  }
}

export class ObstacleManager {
  constructor(canvasWidth, canvasHeight) {
    this.obstacles = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnRate = 0.02;
    this.maxSpawnRate = 0.1;
    this.increaseFactor = 0.00001;
  }

  spawn(distanceTraveled) {
    const currentSpawnRate = Math.min(
      this.maxSpawnRate,
      this.spawnRate + distanceTraveled * this.increaseFactor
    );
    if (Math.random() < currentSpawnRate) {
      this.obstacles.push(new Obstacle(this.canvasWidth, this.canvasHeight));
    }
  }

  update(moveX, moveY) {
    this.obstacles.forEach((obs) => obs.update(moveX, moveY));
    this.obstacles = this.obstacles.filter(
      (obs) => !obs.isOffScreen(this.canvasWidth)
    );
  }

  draw(ctx) {
    this.obstacles.forEach((obs) => obs.draw(ctx));
  }

  checkCollisions(player) {
    const playerRadius = Math.max(player.width, player.height) / 2;
    for (const obs of this.obstacles) {
      const dx = player.x - obs.x;
      const dy = player.y - obs.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const collisionDistance = playerRadius + obs.size / 2;
      if (distance < collisionDistance) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  handleResize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    // Existing obstacles don't need resizing, but new ones will use new dimensions
  }
}
