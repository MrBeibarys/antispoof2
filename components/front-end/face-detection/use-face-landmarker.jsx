import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";

export function useFaceLandmarker(webcamRef, onDetections) {
  const resultRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const startTimeMs = useRef(performance.now());
  const faceLandmarkerRef = useRef(null);
  const requestAnimationFrameRef = useRef(null);

  async function createFaceLandmarker() {
    const runningMode = "VIDEO";
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    const faceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode,
        numFaces: 1,
      }
    );
    console.log("FaceLandmarker создан:", !!faceLandmarker);
    faceLandmarkerRef.current = faceLandmarker;
  }

  const predictWebcam = () => {
    if (!webcamRef.current?.video) {

      return;
    }
    if (webcamRef.current.video.readyState !== 4) {
      console.log(
        "Видео не готово, readyState:",
        webcamRef.current.video.readyState
      );
      return;
    }
    if (!faceLandmarkerRef.current) {
      console.log("FaceLandmarker не инициализирован");
      return;
    }

    if (lastVideoTimeRef.current !== webcamRef.current.video.currentTime) {
      lastVideoTimeRef.current = webcamRef.current.video.currentTime;
      startTimeMs.current = performance.now();
      try {
        const result = faceLandmarkerRef.current.detectForVideo(
          webcamRef.current.video,
          startTimeMs.current
        );
        resultRef.current = result;

        if (onDetections) onDetections(resultRef.current);
      } catch (error) {
        console.error(error);
      }
    }
    requestAnimationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    console.log("useEffect запущен");

    const checkVideoReady = setInterval(() => {
      if (webcamRef.current?.video) {
        if (webcamRef.current.video.readyState === 4) {
          clearInterval(checkVideoReady);
          webcamRef.current.video
            .play()
            .catch((e) => console.error("Ошибка запуска видео:", e));
          requestAnimationFrame(predictWebcam);
        }
      }
    }, 100);

    (async () => {
      await createFaceLandmarker();
    })();

    return () => {
      clearInterval(checkVideoReady);
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      cancelAnimationFrame(requestAnimationFrameRef.current);
    };
  }, []);

  return null;
}
