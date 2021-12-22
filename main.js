import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

const videoWidth = window.innerWidth /5;
const videoHeight = window.innerHeight /5;

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

async function initDetection() {
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );

  let video;

  try {
    video = await setupCamera();
    video.play();
    detectPosesRealTime(detector);
  } catch (e) {
    throw e;
  }
};

async function detectPosesRealTime(detector) {
  let previousPositions = [];

  const app = document.getElementById("app");

  async function poseDetection() {
    const poses = await detector.estimatePoses(video);

    console.log(poses);

    if (poses[0]) {
      const leftShoulder = poses[0].keypoints.find(
         (k) => k.name === "left_shoulder"
      );

      const rightShoulder = poses[0].keypoints.find(
        (k) => k.name === "right_shoulder"
      );

      const leftWrist = poses[0].keypoints.find(
         (k) => k.name === "left_wrist"
      );

      const rightWrist = poses[0].keypoints.find(
        (k) => k.name === "right_wrist"
      );

      if (leftWrist.y >= leftShoulder.y - 20 &&
        leftWrist.y <= leftShoulder.y + 20) {
          app.classList.remove('right');
          app.classList.add('left');
      }
      else if (rightWrist.y >= rightShoulder.y - 20 &&
        rightWrist.y <= rightShoulder.y + 20) {
          app.classList.remove('left');
          app.classList.add('right');
      }
      else {
        app.classList.remove('left');
        app.classList.remove('right');
      }

      // const currentPositions = [
      //   {
      //     x: leftShoulder.x,
      //     y: leftShoulder.y,
      //     movementThreshold: 15,
      //   },
      //   {
      //     x: rightShoulder.x,
      //     y: rightShoulder.y,
      //     movementThreshold: 15,
      //   },
      //   {
      //     x: leftElbow.x,
      //     y: leftElbow.y,
      //     movementThreshold: 20,
      //   },
      //   {
      //     x: rightElbow.x,
      //     y: rightElbow.y,
      //     movementThreshold: 20,
      //   },
      //   {
      //     x: leftHip.x,
      //     y: leftHip.y,
      //     movementThreshold: 100,
      //   },
      //   {
      //     x: rightHip.x,
      //     y: rightHip.y,
      //     movementThreshold: 100,
      //   },
      //   {
      //     x: leftKnee.x,
      //     y: leftKnee.y,
      //     movementThreshold: 100,
      //   },
      //   {
      //     x: rightKnee.x,
      //     y: rightKnee.y,
      //     movementThreshold: 100,
      //   },
      //   {
      //     x: leftAnkle.x,
      //     y: leftAnkle.y,
      //     movementThreshold: 100,
      //   },
      //   {
      //     x: rightAnkle.x,
      //     y: rightAnkle.y,
      //     movementThreshold: 100,
      //   },
      // ];
    }

    requestAnimationFrame(poseDetection);
  }

  poseDetection();
}

initDetection();
