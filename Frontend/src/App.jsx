import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from "file-saver";
import birdLogo from './birdlogo.png';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import "./App.css";

export default function App() {
  const webcamRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);

  // Analysis + selfies
  const [analysis, setAnalysis] = useState({});
  const [selfies, setSelfies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [latestSelfieUrl, setLatestSelfieUrl] = useState(null);

  // Modal preview
  const [preview, setPreview] = useState(null);
  const [previewInfo, setPreviewInfo] = useState({});

  // Toast
  const [toast, setToast] = useState("");

  // Benchmark
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [avgTime, setAvgTime] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState(null);

  // Camera
  const [cameraOn, setCameraOn] = useState(true);
  const lastSmileTime = useRef(0);
  const SMILE_COOLDOWN = 3000;

  // 🔹 Backend calls
  const analyzeFrame = async (imageSrc) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze_frame", {
        image: imageSrc,
      });
      return res.data;
    } catch {
      return null;
    }
  };

  const saveSelfieToBackend = async (imageSrc) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/capture_selfie", {
        image: imageSrc,
      });
      return res.data.filename;
    } catch {
      return null;
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/list_selfies");
      setSelfies(res.data.selfies || []);
    } catch {}
  };

  const deleteSelfies = async (files) => {
    for (let f of files) {
      await axios.delete(`http://127.0.0.1:8000/delete_selfie/${f}`);
    }
    fetchGallery();
    setSelected([]);
  };

  const downloadSelfies = (files) => {
    files.forEach((f) =>
      saveAs(`http://127.0.0.1:8000/selfies/${f}`, f)
    );
  };

  const onManualCapture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const filename = await saveSelfieToBackend(imageSrc);
    if (filename) {
      setLatestSelfieUrl(`http://127.0.0.1:8000/selfies/${filename}`);
      fetchGallery();
      showToast("📸 Selfie captured!");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  useEffect(() => {
    fetchGallery();
    const id = setInterval(async () => {
      if (!cameraOn || !webcamRef.current) return;
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const data = await analyzeFrame(imageSrc);
      if (!data) return;

      const emotions = data.emotions ?? data?.faces?.[0]?.emotions ?? {};
      setAnalysis({
        age: data.age ?? data?.faces?.[0]?.age,
        gender:
          data.gender ?? data?.faces?.[0]?.gender ?? data?.faces?.[0]?.dominant_gender,
        emotions,
        dominant_emotion: data.dominant_emotion ?? data?.faces?.[0]?.dominant_emotion,
      });

      const happinessScore = emotions.happy ?? 0;
      if (happinessScore >= 0.85) {
        const now = Date.now();
        if (now - lastSmileTime.current > SMILE_COOLDOWN) {
          lastSmileTime.current = now;
          const filename = await saveSelfieToBackend(imageSrc);
          if (filename) {
            setLatestSelfieUrl(`http://127.0.0.1:8000/selfies/${filename}`);
            fetchGallery();
            showToast("✅ Auto selfie captured!");
          }
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [cameraOn]);

  const runBenchmark = async () => {
    setBenchmarkLoading(true);
    setBenchmarkError(null);
    try {
      const res = await axios.get("http://127.0.0.1:8000/benchmark");
      setBenchmarkData(res.data.results || []);
      setAvgTime(res.data.average_time_ms);
    } catch {
      setBenchmarkError("Benchmark failed");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="wallpaper-bg"></div>

      <div className="title-card">
        <img src={birdLogo} alt="LOGO" className="title-logo" />
        AI IMAGE ANALYSIS TOOL
      </div>

      {!activeTab && (
        <>
          {/* Landing cards */}
          <div className="card-container">
            {[
              { key: "camera", label: "Camera", icon: "📸" },
              { key: "gallery", label: "Gallery", icon: "🖼️" },
              { key: "benchmark", label: "Benchmark", icon: "⚡" },
            ].map((item) => (
              <motion.div
                key={item.key}
                className="option-card"
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(item.key)}
              >
                <div className="card-content">
                  <span className="card-icon">{item.icon}</span>
                  <h3>{item.label}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Project info section */}
          <div className="project-info">
            <h2><b>About This Project</b></h2>
            <p>
              <b>The AI Image Analysis Tool</b> allows you to analyze live camera feed for age, gender, and emotions. 
              You can capture selfies automatically when a smile is detected, view them in the gallery, 
              and benchmark the performance of the analysis engine.
            </p>
            <p>
              Built using <b>React, Python, DeepFace, and Recharts </b>for visualization. This tool demonstrates 
              real-time AI-based facial analysis with easy-to-use UI.
            </p>
            <ul>
              <li>Automatic & manual selfie capture</li>
              <li>Real-time emotion detection</li>
              <li>Gallery with select, download, delete functionality</li>
              <li>Benchmarking module for performance testing</li>
            </ul>
          </div>
        </>
      )}

      {/* Interfaces */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            key={activeTab}
            className="interface"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="back-btn" onClick={() => setActiveTab(null)}>
              ⬅ Back
            </button>

            {activeTab === "camera" && (
              <div className="camera-panel">
                <div className="camera-left">
                  {cameraOn ? (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="webcam"
                    />
                  ) : (
                    <div className="placeholder">Camera OFF</div>
                  )}
                  {toast && <div className="toast-capture">{toast}</div>}
                </div>

                <div className="camera-right">
                  <div className="latest-selfie-container">
                    <h3>Latest Selfie</h3>
                    {latestSelfieUrl ? (
                      <img src={latestSelfieUrl} alt="latest" className="latest-selfie" />
                    ) : (
                      <div className="placeholder" style={{ height: "120px" }}>
                        No selfie yet
                      </div>
                    )}
                  </div>

                  <div className="analysis-card">
                    <h4>Analysis</h4>
                    <p>Age: {analysis.age || "N/A"}</p>
                    <p>Gender: {analysis.gender || "N/A"}</p>
                    <p>Dominant Emotion: {analysis.dominant_emotion || "N/A"}</p>
                    {analysis.emotions &&
                      Object.entries(analysis.emotions).map(([k, v]) => (
                        <p key={k}>
                          {k}: {Math.min(v * 100, 100).toFixed(1)}%
                        </p>
                      ))}
                  </div>

                  <div className="buttons-container controls">
                    <button onClick={onManualCapture}>📸 Capture</button>
                    <button onClick={() => setCameraOn(!cameraOn)}>
                      {cameraOn ? "🔴 Turn Off" : "🟢 Turn On"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="panel gallery-panel">
                <h2>Selfie Gallery</h2>
                <div className="gallery-actions">
                  <button onClick={() => setSelected(selfies)}>Select All</button>
                  <button onClick={() => setSelected([])}>Deselect All</button>
                  {selected.length > 0 && (
                    <>
                      <button onClick={() => downloadSelfies(selected)}>⬇ Download</button>
                      <button onClick={() => deleteSelfies(selected)}>🗑 Delete</button>
                    </>
                  )}
                </div>

                <div className="gallery-grid">
                  {selfies.map((f) => (
                    <div
                      key={f}
                      className={`gallery-item-wrap ${selected.includes(f) ? "selected" : ""}`}
                      onClick={() =>
                        setSelected((prev) =>
                          prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                        )
                      }
                    >
                      <img
                        src={`http://127.0.0.1:8000/selfies/${f}`}
                        alt={f}
                        className="gallery-item"
                        onDoubleClick={() => {
                          setPreview(`http://127.0.0.1:8000/selfies/${f}`);
                          setPreviewInfo({
                            name: f,
                            date: new Date().toLocaleString(),
                            size: "Unknown",
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "benchmark" && (
              <div className="panel benchmark-panel">
                <div className="benchmark-actions">
                  <motion.button
                    className="benchmark-btn"
                    onClick={runBenchmark}
                    disabled={benchmarkLoading}
                    whileHover={{ scale: 1.05 }}
                  >
                    {benchmarkLoading ? "Running..." : "Run Benchmark"}
                  </motion.button>
                </div>

                {benchmarkError && <div className="error">{benchmarkError}</div>}

                {benchmarkData.length > 0 && (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={benchmarkData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="iteration" />
                        <YAxis domain={[0,3]}/>
                        <Tooltip />
                        <Line dataKey="time_ms" stroke="#874949ff" strokeWidth={2}>
                          <LabelList dataKey="time_ms" position="top" />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                    <h4>Avg: {avgTime?.toFixed(2)} ms</h4>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {preview && (
        <div className="preview-modal" onClick={() => setPreview(null)}>
          <div className="preview-content">
            <img src={preview} alt="preview" />
            <div className="preview-info">
              <p>Name: {previewInfo.name}</p>
              <p>Date: {previewInfo.date}</p>
              <div className="preview-buttons">
                <button onClick={() => downloadSelfies([previewInfo.name])}>⬇ Download</button>
                <button onClick={() => deleteSelfies([previewInfo.name])}>🗑 Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
