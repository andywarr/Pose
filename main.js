import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Game } from "./Game.js";

// --- Pose Detection Setup ---
const videoWidth = window.innerWidth / 5;
const videoHeight = window.innerHeight / 5;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(video);
  });
}

// --- Game Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const gameOverElement = document.getElementById("gameOver");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game State
let player = {
  x: canvas.width / 2,
  y: 50,
  width: 20,
  height: 40,
  angle: 0, // Radians, 0 = straight down
  speed: 0,
  turnSpeed: 0.05, // Radians per frame
  maxSpeed: 10,
  acceleration: 0.05,
  deceleration: 0.1,
};

let obstacles = [];
let score = 0;
let distanceTraveled = 0;
let gameOver = false;
let gameLoopId = null;

// Obstacle generation parameters
let obstacleSpawnRate = 0.02; // Initial chance per frame
const maxObstacleSpawnRate = 0.1;
const obstacleIncreaseFactor = 0.00001; // How much spawn rate increases per distance unit

// --- Game Logic ---

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = "red"; // Snowboarder color
  ctx.fillRect(
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );
  // Draw a small triangle to indicate front
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(0, -player.height / 2 - 5);
  ctx.lineTo(-5, -player.height / 2);
  ctx.lineTo(5, -player.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  obstacles.forEach((obs) => {
    ctx.fillStyle = obs.type === "rock" ? "grey" : "darkgreen";
    if (obs.type === "rock") {
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Simple triangle for trees
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y - obs.size / 2);
      ctx.lineTo(obs.x - obs.size / 2, obs.y + obs.size / 2);
      ctx.lineTo(obs.x + obs.size / 2, obs.y + obs.size / 2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function updatePlayerPosition(turnDirection) {
  const initialAngle = player.angle;
  // Turning
  if (turnDirection === "left") {
    player.angle -= player.turnSpeed;
  } else if (turnDirection === "right") {
    player.angle += player.turnSpeed;
  }

  // --- DEBUG LOG ---
  if (initialAngle !== player.angle) {
    console.log(
      `Player Angle Changed: ${initialAngle.toFixed(
        2
      )} -> ${player.angle.toFixed(2)}`
    );
  }
  // --- END DEBUG LOG ---

  // Keep angle within -PI to PI
  if (player.angle > Math.PI) player.angle -= Math.PI * 2;
  if (player.angle < -Math.PI) player.angle += Math.PI * 2;

  // Acceleration/Deceleration based on angle
  const angleFactor = Math.cos(player.angle); // 1 when straight, 0 when perpendicular

  if (angleFactor > 0) {
    // Accelerating
    player.speed += player.acceleration * angleFactor;
  } else {
    // Decelerating (braking)
    player.speed -= player.deceleration * Math.abs(angleFactor);
  }

  // Clamp speed
  player.speed = Math.max(0, Math.min(player.speed, player.maxSpeed));

  // Calculate movement components based on speed and angle
  const moveY = player.speed * Math.cos(player.angle); // Downward speed component
  const moveX = player.speed * Math.sin(player.angle); // Sideways speed component

  distanceTraveled += moveY; // Track vertical distance

  // Move obstacles relative to the player's movement
  obstacles.forEach((obs) => {
    obs.y -= moveY; // Move vertically
    obs.x -= moveX; // Move horizontally (opposite to player's sideways motion)
  });

  // Remove obstacles that have gone off-screen (top)
  obstacles = obstacles.filter((obs) => obs.y > -50);

  // Also remove obstacles that have gone too far off-screen horizontally
  const horizontalBuffer = 200; // Allow obstacles to be off-screen horizontally by this much
  obstacles = obstacles.filter(
    (obs) =>
      obs.x > -horizontalBuffer && obs.x < canvas.width + horizontalBuffer
  );
}

function spawnObstacles() {
  // Increase spawn rate based on distance
  const currentSpawnRate = Math.min(
    maxObstacleSpawnRate,
    obstacleSpawnRate + distanceTraveled * obstacleIncreaseFactor
  );

  if (Math.random() < currentSpawnRate) {
    const type = Math.random() < 0.5 ? "rock" : "tree";
    const size =
      type === "rock" ? 20 + Math.random() * 20 : 30 + Math.random() * 30;
    obstacles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + size, // Spawn below the screen
      type: type,
      size: size,
    });
  }
}

function checkCollisions() {
  const playerRadius = Math.max(player.width, player.height) / 2; // Approximate player collision radius

  for (const obs of obstacles) {
    const dx = player.x - obs.x;
    const dy = player.y - obs.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const collisionDistance = playerRadius + obs.size / 2;

    if (distance < collisionDistance) {
      gameOver = true;
      gameOverElement.classList.remove("hidden");
      if (gameLoopId) {
        cancelAnimationFrame(gameLoopId); // Stop the game loop
      }
      break; // Only need one collision
    }
  }
}

function updateScore() {
  if (!gameOver) {
    score = Math.floor(distanceTraveled / 10); // Score based on distance
    scoreElement.textContent = `Score: ${score}`;
  }
}

function gameLoop(turnDirection) {
  console.log("gameLoop called with direction:", turnDirection); // <-- Add log here
  if (gameOver) return;

  // 1. Update State
  updatePlayerPosition(turnDirection);
  spawnObstacles();
  checkCollisions();
  updateScore();

  // 2. Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 3. Draw Elements
  drawPlayer();
  drawObstacles();

  // 4. Request Next Frame
  // We will call this again from detectPosesRealTime
  // gameLoopId = requestAnimationFrame(() => gameLoop(turnDirection)); // Pass current turn direction
}

// --- Pose Detection Integration ---

async function initDetection() {
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING } // Use a faster model
  );

  let video;

  try {
    video = await setupCamera();
    video.play();
    detectPosesRealTime(detector, video); // Pass video element
  } catch (e) {
    console.error("Error setting up camera or detector:", e);
    alert("Could not initialize camera or pose detection.");
  }
}

async function detectPosesRealTime(detector, video) {
  let currentTurn = "none";

  async function poseDetectionFrame() {
    if (gameOver) {
      // Stop detection if game over
      detector.dispose(); // Clean up detector resources
      return;
    }

    const poses = await detector.estimatePoses(video, {
      flipHorizontal: false, // Input is already flipped by CSS
    });

    let turnDirection = "none";

    if (poses[0]) {
      const leftShoulder = poses[0].keypoints.find(
        (k) => k.name === "left_shoulder"
      );
      const rightShoulder = poses[0].keypoints.find(
        (k) => k.name === "right_shoulder"
      );
      const leftWrist = poses[0].keypoints.find((k) => k.name === "left_wrist");
      const rightWrist = poses[0].keypoints.find(
        (k) => k.name === "right_wrist"
      );

      // --- DETAILED POSE LOGGING ---
      console.log("--- Pose Data ---");
      if (leftShoulder)
        console.log(
          `Left Shoulder: y=${leftShoulder.y.toFixed(
            1
          )}, score=${leftShoulder.score.toFixed(2)}`
        );
      if (leftWrist)
        console.log(
          `Left Wrist:    y=${leftWrist.y.toFixed(
            1
          )}, score=${leftWrist.score.toFixed(2)}`
        );
      if (rightShoulder)
        console.log(
          `Right Shoulder: y=${rightShoulder.y.toFixed(
            1
          )}, score=${rightShoulder.score.toFixed(2)}`
        );
      if (rightWrist)
        console.log(
          `Right Wrist:   y=${rightWrist.y.toFixed(
            1
          )}, score=${rightWrist.score.toFixed(2)}`
        );
      // --- END DETAILED POSE LOGGING ---

      // Check confidence scores
      const shoulderThreshold = 0.3; // Lowered from 0.5
      const wristThreshold = 0.2; // Lowered from 0.4

      console.log(
        `Using Thresholds: Shoulder=${shoulderThreshold}, Wrist=${wristThreshold}`
      ); // Log thresholds

      // --- Check Left Arm ---
      if (
        leftShoulder &&
        leftShoulder.score > shoulderThreshold &&
        leftWrist &&
        leftWrist.score > wristThreshold
      ) {
        console.log("Left arm scores sufficient."); // Log success
        // Check if left wrist is raised significantly above the shoulder line
        const leftWristIsRaised = leftWrist.y < leftShoulder.y + 10; // Relaxed condition
        console.log(
          `Checking Left: WristY=${leftWrist.y.toFixed(
            1
          )}, ShoulderY=${leftShoulder.y.toFixed(1)}, Threshold=${(
            leftShoulder.y + 10
          ).toFixed(1)}, Raised=${leftWristIsRaised}`
        ); // Updated log
        if (leftWristIsRaised) {
          console.log("*** Left wrist detected as raised! ***");
          turnDirection = "left";
        }
      }

      // Check right arm only if left arm isn't raised
      if (
        turnDirection === "none" && // Avoid conflicting signals
        rightShoulder &&
        rightShoulder.score > shoulderThreshold &&
        rightWrist &&
        rightWrist.score > wristThreshold &&
        leftShoulder && // Need left shoulder for comparison
        leftShoulder.score > shoulderThreshold
      ) {
        console.log("Right arm scores sufficient."); // Log success
        // Check if right wrist is raised significantly above the shoulder line
        const rightWristIsRaised = rightWrist.y < rightShoulder.y + 10; // Relaxed condition
        console.log(
          `Checking Right: WristY=${rightWrist.y.toFixed(
            1
          )}, ShoulderY=${rightShoulder.y.toFixed(1)}, Threshold=${(
            rightShoulder.y + 10
          ).toFixed(1)}, Raised=${rightWristIsRaised}`
        ); // Updated log
        if (rightWristIsRaised) {
          console.log("*** Right wrist detected as raised! ***");
          turnDirection = "right";
        }
      }
    }

    // --- DEBUG LOG ---
    console.log("Detected Turn Direction:", turnDirection);
    // --- END DEBUG LOG ---

    // Update game loop with the detected turn direction
    gameLoop(turnDirection);

    // Continue the detection loop
    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame(); // Start the detection loop
}

// --- Start ---

// Ensure the DOM is fully loaded before starting the game
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game(
    "gameCanvas",
    "video",
    "score",
    "gameOver",
    "instructionModal", // Add ID for instruction modal
    "confirmInstructions", // Add ID for confirm button
    "standByMessage", // Add ID for stand by message
    "countdown", // Add ID for countdown element
    "countdownText" // Add ID for countdown text
  );
  game.initialize().catch((error) => {
    console.error("Game initialization failed:", error);
    // Display a user-friendly error message if initialization fails
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML =
        '<p style="color: red; text-align: center; margin-top: 50px;">Failed to initialize the game. Please ensure you have a webcam enabled and permissions are granted.</p>';
    }
  });
});

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Optional: Adjust player position or other elements if needed on resize
  player.x = Math.min(player.x, canvas.width - player.width / 2); // Keep player within bounds
});
