import * as poseDetection from "@tensorflow-models/pose-detection";

export class PoseController {
  constructor(videoElementId, videoWidth, videoHeight) {
    this.video = document.getElementById(videoElementId);
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.detector = null;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.shoulderThreshold = 0.3;
    this.wristThreshold = 0.2;
    this.turnThresholdYOffset = 10; // Pixels (wrist Y < shoulder Y + offset)
    this.lastPose = null; // Store the last detected pose
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }
    this.video.width = this.videoWidth;
    this.video.height = this.videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: this.isMobile ? undefined : this.videoWidth,
        height: this.isMobile ? undefined : this.videoHeight,
      },
    });
    this.video.srcObject = stream;

    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => resolve(this.video);
    });
  }

  async initialize() {
    try {
      await this.setupCamera();
      this.video.play();
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      console.log("Pose detector initialized.");
    } catch (e) {
      console.error("Error initializing pose detection:", e);
      alert("Could not initialize camera or pose detection.");
      throw e; // Re-throw error to prevent game start
    }
  }

  isReady() {
    return !!this.detector;
  }

  async estimateCurrentPose() {
    if (!this.detector || this.video.paused || this.video.ended) {
      this.lastPose = null;
      return null;
    }
    try {
      const poses = await this.detector.estimatePoses(this.video, {
        flipHorizontal: false,
      });
      // Add log to see if any poses are detected at all
      console.log("Pose estimation result:", poses);
      this.lastPose = poses && poses.length > 0 ? poses[0] : null;
      return this.lastPose;
    } catch (error) {
      console.error("Error during pose estimation:", error);
      this.lastPose = null;
      return null;
    }
  }

  async getCurrentPose() {
    // Use the last estimated pose if available, otherwise estimate again
    return this.lastPose || (await this.estimateCurrentPose());
  }

  async detectTurnDirection() {
    // Estimate pose before detecting turn direction
    const currentPose = await this.estimateCurrentPose();
    let turnDirection = "none";

    if (currentPose) {
      const keypoints = currentPose.keypoints;
      const leftShoulder = keypoints.find((k) => k.name === "left_shoulder");
      const rightShoulder = keypoints.find((k) => k.name === "right_shoulder");
      const leftWrist = keypoints.find((k) => k.name === "left_wrist");
      const rightWrist = keypoints.find((k) => k.name === "right_wrist");

      // Check Left Arm
      if (
        leftShoulder &&
        leftShoulder.score > this.shoulderThreshold &&
        leftWrist &&
        leftWrist.score > this.wristThreshold
      ) {
        if (leftWrist.y < leftShoulder.y + this.turnThresholdYOffset) {
          turnDirection = "left";
        }
      }

      // Check Right Arm (only if left wasn't triggered)
      if (
        turnDirection === "none" &&
        rightShoulder &&
        rightShoulder.score > this.shoulderThreshold &&
        rightWrist &&
        rightWrist.score > this.wristThreshold
      ) {
        if (rightWrist.y < rightShoulder.y + this.turnThresholdYOffset) {
          turnDirection = "right";
        }
      }
    }
    // console.log("Detected Turn:", turnDirection); // Optional debug log
    return turnDirection;
  }

  dispose() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      console.log("Pose detector disposed.");
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
  }
}
