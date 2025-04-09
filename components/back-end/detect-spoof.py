import asyncio
import websockets
import base64
import cv2
import numpy as np
import json
from deepface import DeepFace

async def handler(websocket):
    print("Клиент подключён")
    while True:
        try:
            message = await websocket.recv()
            print("Message received from client: ", message[:50], "...")
            
            data = json.loads(message)
            image_data = data["img"]

            img_bytes = base64.b64decode(image_data.split(",")[1])
            nparray = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparray, cv2.IMREAD_COLOR) 
            if img is None:
                print("Не удалось декодировать изображение")
                await websocket.send(json.dumps({"error": "Invalid image"}))
                continue

            try:
                face_objs = DeepFace.extract_faces(
                    img_path=img,
                    detector_backend="mtcnn",
                    anti_spoofing=True,
                    enforce_detection=False 
                )
                if face_objs and len(face_objs) > 0:
                    is_real = face_objs[0]["is_real"] 
                    print(f"Лицо настоящее: {is_real}")
                    await websocket.send(json.dumps({"is_real": is_real}))
                else:
                    print("Лицо не обнаружено")
                    await websocket.send(json.dumps({"is_real": False}))
            except Exception as e:
                print(f"Ошибка DeepFace: {e}")
                await websocket.send(json.dumps({"is_real": False}))

        except websockets.ConnectionClosed:
            print("Клиент отключился")
            break
        except Exception as e:
            print(f"Ошибка: {e}")
            continue

async def main():
    async with websockets.serve(handler, "localhost", 3429):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        cv2.destroyAllWindows()