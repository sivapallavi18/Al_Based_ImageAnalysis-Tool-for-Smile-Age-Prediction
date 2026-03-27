# 🐦 AI Image Analysis Tool

An end-to-end web application for **real-time facial analysis** powered by **FastAPI**, **DeepFace**, **OpenCV**, and a **React frontend**.  
It detects **Age, Gender, and Emotions** with improved accuracy and provides features like **selfie capture, gallery management, and benchmarking**.

---

## 📌 Features

- 🎥 **Real-time Camera Feed** — analyze faces live from your webcam  
- 👶👩‍🦰👨 **Face Analysis** — Age (smoothed), Gender (retinaface backend), Emotion (stabilized predictions)  
- 📸 **Selfie Capture & Gallery** — save, view, and delete captured selfies  
- 📊 **Benchmark Tool** — run processing benchmarks on stored selfies  
- 📂 **Full-Stack Setup** — FastAPI backend with a React + TailwindCSS frontend  

---

## 🛠️ Tech Stack

### **Backend**
- FastAPI + Uvicorn
- DeepFace (TensorFlow/Keras models)
- OpenCV
- NumPy, Pandas

### **Frontend**
- React + Vite
- TailwindCSS
- Axios (API calls)
- Recharts (charts & graphs)
- Framer Motion (animations)

---

## 📂 Project Structure

AI-Image-Analysis-Tool/
│
├── backend/
│ ├── server.py # FastAPI backend
│ ├── requirements.txt # Python dependencies
│ └── selfies/ # Saved selfies
│
├── frontend/
│ ├── src/
│ │ ├── App.jsx # React frontend main
│ │ ├── components/ # UI components
│ │ └── assets/ # Images & logo (birdlogo.png)
│ ├── package.json # Frontend dependencies
│
└── README.md


---

## ⚡ Installation & Setup

### 🔹 1. Clone Repository
```bash
git clone https://github.com/Springboard-Internship-2025/AI-Based-Image-Analysis-Tool-for-Smile-Age-Prediction_August_2025.git
cd AI-Based-Image-Analysis-Tool-for-Smile-Age-Prediction_August_2025


##  Backend Setup

cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload


## Frontend setup

cd frontend
npm install
npm run dev


| Endpoint                    | Method | Description                    |
| --------------------------- | ------ | ------------------------------ |
| `/analyze_frame`            | POST   | Analyze face from Base64 image |
| `/capture_selfie`           | POST   | Capture & save selfie          |
| `/list_selfies`             | GET    | List saved selfies             |
| `/delete_selfie/{filename}` | DELETE | Delete a selfie                |
| `/benchmark`                | GET    | Run benchmark on latest selfie |
| `/health`                   | GET    | Health check                   |

