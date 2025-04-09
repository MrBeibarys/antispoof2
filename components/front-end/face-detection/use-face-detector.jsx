import { useEffect, useRef } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export function UseFaceDetect(webcamRef, onDetections) {
  const faceDetectorRef = useRef(null);

  useEffect(() => {
    let runningMode = "VIDEO";

    const initializefaceDetector = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      const faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU",
        },
        runningMode: runningMode,
        min_detection_confidence: 1.0,
      });

      faceDetectorRef.current = faceDetector;
      predictWebcam();
    };

    initializefaceDetector();

    let lastVideoTime = -1;

    async function predictWebcam() {
      if (webcamRef.current && faceDetectorRef.current && webcamRef.current) {
        if (webcamRef.current.video.currentTime !== lastVideoTime) {
          if (webcamRef.current.video.readyState === 4) {
            lastVideoTime = webcamRef.current.video.currentTime;
            let startTimeMs = performance.now();
            const detections = await faceDetectorRef.current.detectForVideo(
              webcamRef.current.video,
              startTimeMs
            ).detections;
            if (onDetections) onDetections(detections);
          }
        }
        requestAnimationFrame(predictWebcam);
      }
    }
    return () => {
      if (faceDetectorRef.current) faceDetectorRef.current.close();
    };
  }, [webcamRef, onDetections]);
}
