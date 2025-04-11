import clsx from "clsx";
import { useRef, useEffect, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { useFaceLandmarker } from "./face-detection/use-face-landmarker";
import { DrawingUtils, FaceLandmarker } from "@mediapipe/tasks-vision";

export function Webcamera({ className }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isReal, setIsReal] = useState(null)
  const isRealRef = useRef()

  useEffect(() => {
    isRealRef.current = isReal;
  }, [isReal]);

  const drawResults = useCallback((results) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const drawingUtils = new DrawingUtils(ctx);
    ctx.clearRect(0, 0, 640, 480);
    if (results?.faceLandmarks) {
      const landmarks = results.faceLandmarks[0];
      for (const landmarks of results.faceLandmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#C0C0C070", lineWidth: 0.5 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: "#C0C0C070" }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
          { color: "#C0C0C070" }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: "#C0C0C070" }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          { color: "#C0C0C070" }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: "#E0E0E0", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: "#E0E0E0", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: "#C0C0C070" }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: "#C0C0C070" }
        );
      }
      let minY = Infinity;
      let centerX = 0;
      landmarks.forEach((point) => {
        if (point.y < minY) minY = point.y;
        centerX += point.x;
      });
      centerX /= landmarks.length;

     
      const textX = centerX * 640; 
      const textY = minY * 480 - 20; 
      ctx.font = "24px Inter";
      const text = isRealRef.current || "Detecting";
      ctx.fillStyle = isRealRef.current === "Real" ? "cyan" : isRealRef.current === "Spoof" ? "red" : "gray"
      ctx.fillText(text, textX-90, textY);
      // const { originX, originY, width, height } = detections[0].boundingBox;
      // ctx.beginPath();
      // ctx.rect(originX, originY, width, height);
      // ctx.lineWidth = 2;
      // // if (isRealRef.current !== "Real" || isRealRef.current !== "Spoof") {
      // //   ctx.strokeStyle = "gray";
      // //   ctx.stroke();
      // //   ctx.font = "24px inter";
      // //   ctx.fillStyle = "gray";
      // //   ctx.fillText("detecting", originX, originY - 20);
      // // }
      // ctx.strokeStyle = isRealRef.current === "Real" ? "cyan" : "red";
      // ctx.stroke();
      // ctx.font = "24px inter";
      // ctx.fillStyle = isRealRef.current === "Real" ? "cyan" : "red";
      // ctx.fillText(isRealRef.current, originX, originY-20);
    }
  }, []);
  useFaceLandmarker(webcamRef, drawResults)

  useEffect(() => {
    console.log("useEffect запущен");
    socketRef.current = new WebSocket("ws://localhost:3429");

    socketRef.current.onopen = () => {
      console.log("Есть соединение! ReadyState:", socketRef.current.readyState);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const result = data.is_real; 
      setIsReal(result? "Real" : "Spoof")
      console.log(`сообщение полученно: ${result}`);
    };

    socketRef.current.onclose = (event) => {
      console.log(
        "Соединение закрыто. Код:",
        event.code,
        "Причина:",
        event.reason
      );
    };

    socketRef.current.onerror = (error) => {
      console.error("Ошибка WebSocket:", error);
    };

    const sendMessageIntervalId = setInterval(() => {
      if (
        webcamRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        const img = webcamRef.current.getScreenshot();
        if (img) {
          socketRef.current.send(JSON.stringify({ img }));
          console.log("Сообщение отправлено!");
        } else {
          console.log("Изображение не получено");
        }
      } else {
        console.log("Текущее состояние:", {
          exists: !!socketRef.current,
          readyState: socketRef.current?.readyState,
          webcam: !!webcamRef.current,
        });
      }
    }, 500);

    return () => {
      console.log("Очистка useEffect");
      clearInterval(sendMessageIntervalId);
      if (
        socketRef.current &&
        socketRef.current.readyState !== WebSocket.CLOSED
      ) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div
      className={clsx(
        className,
        "bg-white w-[800px] m-auto p-4 rounded-l shadow relative flex justify-center"
      )}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        width={640}
        height={480}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.4}
        className=" rounded-m"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-4 left-1/2 transform -translate-x-1/2"
      />
    </div>
  );
}
