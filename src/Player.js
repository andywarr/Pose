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
    // Colors for the snowboard and rider
    this.boardColor = "#3498db"; // Blue
    this.riderColor = "#f39c12"; // Orange
    this.riderSize = 10; // Radius of the snowboarder
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

    // Draw the player oriented in the direction of travel
    ctx.save();
    ctx.rotate(movementAngle);

    // Draw the snowboard (rounded rectangle)
    this.drawSnowboard(ctx);

    // Draw the snowboarder (circle)
    this.drawRider(ctx);

    ctx.restore();
    ctx.restore();
  }

  drawSnowboard(ctx) {
    const radius = this.height / 4; // Rounded corners radius

    ctx.fillStyle = this.boardColor;
    ctx.beginPath();

    // Top-left corner
    ctx.moveTo(-this.width / 2 + radius, -this.height / 2);
    // Top-right corner
    ctx.lineTo(this.width / 2 - radius, -this.height / 2);
    ctx.arcTo(
      this.width / 2,
      -this.height / 2,
      this.width / 2,
      -this.height / 2 + radius,
      radius
    );

    // Bottom-right corner
    ctx.lineTo(this.width / 2, this.height / 2 - radius);
    ctx.arcTo(
      this.width / 2,
      this.height / 2,
      this.width / 2 - radius,
      this.height / 2,
      radius
    );

    // Bottom-left corner
    ctx.lineTo(-this.width / 2 + radius, this.height / 2);
    ctx.arcTo(
      -this.width / 2,
      this.height / 2,
      -this.width / 2,
      this.height / 2 - radius,
      radius
    );

    // Top-left corner
    ctx.lineTo(-this.width / 2, -this.height / 2 + radius);
    ctx.arcTo(
      -this.width / 2,
      -this.height / 2,
      -this.width / 2 + radius,
      -this.height / 2,
      radius
    );

    ctx.closePath();
    ctx.fill();
  }

  drawRider(ctx) {
    // Draw the snowboarder (circle) in the center of the board
    ctx.fillStyle = this.riderColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.riderSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Keep player within horizontal bounds on resize
  handleResize(canvasWidth) {
    this.x = Math.min(this.x, canvasWidth - this.width / 2);
    this.x = Math.max(this.width / 2, this.x); // Prevent going off left edge too
  }
}
