# backend/server.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64, cv2, numpy as np, os, time
from deepface import DeepFace
from fastapi.staticfiles import StaticFiles
from collections import deque, Counter

app = FastAPI(title="AI-Image-Analysis-Tool API")

# CORS - allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure folders exist
os.makedirs("selfies", exist_ok=True)
os.makedirs("benchmarks", exist_ok=True)

# Static mount for served selfie images
app.mount("/selfies", StaticFiles(directory="selfies"), name="selfies")
app.mount("/benchmarks", StaticFiles(directory="benchmarks"), name="benchmarks")

# Smoothers (keep history for stable output)
age_history = deque(maxlen=10)
emotion_history = deque(maxlen=10)

# ========== Analyze Frame ==========
@app.post("/analyze_frame")
async def analyze_frame(payload: dict):
    image_b64 = payload.get("image")
    if not image_b64:
        return JSONResponse({"error": "no image provided"}, status_code=400)
    try:
        header, data = image_b64.split(",", 1) if "," in image_b64 else ("", image_b64)
        img_data = base64.b64decode(data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = DeepFace.analyze(
            frame,
            actions=["age", "emotion", "gender"],
            detector_backend="opencv",
            enforce_detection=False
        )
        if not isinstance(results, list):
            results = [results]

        faces_out = []
        for face in results:
            raw_age = face.get("age", 0)
            dominant_emotion = face.get("dominant_emotion", "")
            gender = face.get("dominant_gender", "")
            region = face.get("region", {})

            # ✅ Age correction & smoothing
            corrected_age = int(raw_age * 0.9)  # reduce ~10%
            age_history.append(corrected_age)
            smoothed_age = int(sum(age_history) / len(age_history))

            # ✅ Emotion smoothing
            emotion_history.append(dominant_emotion)
            common_emotion = Counter(emotion_history).most_common(1)[0][0]

            faces_out.append({
                "age": smoothed_age,
                "dominant_emotion": common_emotion,
                "gender": gender,
                "region": region,
                "emotions": face.get("emotion", {})
            })

        return {"faces": faces_out}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ========== Capture & Save Selfie ==========
@app.post("/capture_selfie")
async def capture_selfie(payload: dict):
    image_b64 = payload.get("image")
    if not image_b64:
        return JSONResponse({"error": "no image provided"}, status_code=400)
    try:
        header, data = image_b64.split(",", 1) if "," in image_b64 else ("", image_b64)
        img_data = base64.b64decode(data)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        filename = f"selfies/selfie_{int(time.time())}.jpg"
        cv2.imwrite(filename, img)
        return {"filename": os.path.basename(filename)}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ========== List Saved Selfies ==========
@app.get("/list_selfies")
def list_selfies():
    files = [f for f in os.listdir("selfies") if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    files.sort(reverse=True)
    return {"selfies": files}

# ========== Delete Selfie ==========
@app.delete("/delete_selfie/{filename}")
def delete_selfie(filename: str):
    path = os.path.join("selfies", filename)
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted"}
    return JSONResponse({"error": "file not found"}, status_code=404)

# ========== Run Benchmark ==========
@app.get("/benchmark")
def run_benchmark(filename: str = Query(None, description="Selfie filename from /selfies")):
    # If no filename provided, pick the most recent image from selfies
    if filename:
        img_path = os.path.join("selfies", filename)
    else:
        files = [f for f in os.listdir("selfies") if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        if not files:
            return JSONResponse({"error": "No images in selfies folder"}, status_code=400)
        files.sort(reverse=True)  # pick latest
        filename = files[0]
        img_path = os.path.join("selfies", filename)

    img = cv2.imread(img_path)
    if img is None:
        return JSONResponse({"error": f"No image found at {img_path}"}, status_code=400)

    results = []
    iterations = 10

    for i in range(iterations):
        start = time.time()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Simulated processing
        elapsed = (time.time() - start) * 1000  # ms
        results.append({"iteration": i + 1, "time_ms": elapsed})

    avg_time = sum(r["time_ms"] for r in results) / iterations

    return {
        "results": results,
        "average_time_ms": avg_time,
        "iterations": iterations,
        "filename": filename
    }

# ========== Health Check ==========
@app.get("/health")
def health():
    return {"status": "ok"}
