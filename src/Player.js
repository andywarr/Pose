export class Player {
  constructor(canvasWidth, startY) {
    this.x = canvasWidth / 2;
    this.y = startY;
    this.width = 20;
    this.height = 40;
    this.angle = 0; // Radians, 0 = straight down
    this.speed = 0;
    this.turnSpeed = 0.05; // Radians per frame
    this.maxSpeed = 10;
    this.acceleration = 0.05;
    this.deceleration = 0.1;
  }

  update(turnDirection) {
    // Turning
    if (turnDirection === "left") {
      this.angle -= this.turnSpeed;
    } else if (turnDirection === "right") {
      this.angle += this.turnSpeed;
    }

    // Keep angle within -PI to PI
    if (this.angle > Math.PI) this.angle -= Math.PI * 2;
    if (this.angle < -Math.PI) this.angle += Math.PI * 2;

    // Acceleration/Deceleration based on angle
    const angleFactor = Math.cos(this.angle);
    if (angleFactor > 0) {
      this.speed += this.acceleration * angleFactor;
    } else {
      this.speed -= this.deceleration * Math.abs(angleFactor);
    }

    // Clamp speed
    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
  }

  getMovement() {
    const moveY = this.speed * Math.cos(this.angle);
    const moveX = this.speed * Math.sin(this.angle);
    return { moveX, moveY };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Calculate the direction of travel based on movement
    const { moveX, moveY } = this.getMovement();
    // Calculate the angle of movement (actual travel direction)
    const movementAngle = Math.atan2(moveY, moveX) - Math.PI / 2;

    // Draw the player body oriented in the direction of travel
    ctx.save();
    ctx.rotate(movementAngle);
    ctx.fillStyle = "red";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Draw front indicator at the actual front of the player (bottom of rectangle)
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2 + 5); // Point at the bottom (front)
    ctx.lineTo(-5, this.height / 2); // Left corner at bottom edge
    ctx.lineTo(5, this.height / 2); // Right corner at bottom edge
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Keep player within horizontal bounds on resize
  handleResize(canvasWidth) {
    this.x = Math.min(this.x, canvasWidth - this.width / 2);
    this.x = Math.max(this.width / 2, this.x); // Prevent going off left edge too
  }
}
