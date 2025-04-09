import clsx from "clsx";
import { useRef, useEffect, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { UseFaceDetect } from "./face-detection/use-face-detector";

export function Webcamera({ className }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isReal, setIsReal] = useState(null)
  const isRealRef = useRef()

  useEffect(() => {
    isRealRef.current = isReal;
  }, [isReal]);

  const drawResults = useCallback((detections) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 640, 480);
    if (detections && detections.length > 0) {
      const { originX, originY, width, height } = detections[0].boundingBox;
      ctx.beginPath();
      ctx.rect(originX, originY, width, height);
      ctx.lineWidth = 2;
      // if (isRealRef.current !== "Real" || isRealRef.current !== "Spoof") {
      //   ctx.strokeStyle = "gray";
      //   ctx.stroke();
      //   ctx.font = "24px inter";
      //   ctx.fillStyle = "gray";
      //   ctx.fillText("detecting", originX, originY - 20);
      // }
      ctx.strokeStyle = isRealRef.current === "Real" ? "cyan" : "red";
      ctx.stroke();
      ctx.font = "24px inter";
      ctx.fillStyle = isRealRef.current === "Real" ? "cyan" : "red";
      ctx.fillText(isRealRef.current, originX, originY-20);
    }
  }, []);

  UseFaceDetect(webcamRef, drawResults);

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
        className="absolute top-1"
      />
    </div>
  );
}
