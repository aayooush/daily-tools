"use client";
import { useState, useRef } from "react";
import { trimVideo } from "./action";

export default function VideoTrim() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    null | {
      success: boolean;
      base64?: string;
      outputName?: string;
      fileSize?: string;
      error?: string;
    }
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("video/")) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);

      // Auto-calculate end time from video duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(f);
      video.onloadedmetadata = () => {
        setEndTime(Math.round(video.duration));
      };
    }
  };

  const handleTrim = async () => {
    if (!file) return;
    setLoading(true);

    const res = await trimVideo(file, startTime, endTime);
    setResult(res);
    setLoading(false);
  };

  const handleDownload = () => {
    if (!result?.success || !result.base64) return;
    const binary = atob(result.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputName || "trimmed-video.mp4";
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeStr = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      {/* Upload */}
      <label className="label">Upload Video</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #333",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 24,
          background: file ? "#1a1a2a" : "#111",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            Click or drag a video file here (max 50MB)
          </div>
        )}
      </div>

      {/* Preview + Controls */}
      {file && (
        <div>
          {/* Video preview */}
          {preview && (
            <video
              ref={videoRef}
              src={preview}
              controls
              style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8, marginBottom: 24 }}
            />
          )}

          {/* Time controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label className="label">Start Time (sec)</label>
              <input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                min={0}
                max={endTime - 1}
              />
              <span style={{ fontSize: 12, color: "#666" }}>{timeStr(startTime)}</span>
            </div>
            <div>
              <label className="label">End Time (sec)</label>
              <input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                min={startTime + 1}
              />
              <span style={{ fontSize: 12, color: "#666" }}>{timeStr(endTime)}</span>
            </div>
          </div>

          <button className="btn" onClick={handleTrim} disabled={loading}>
            {loading ? "Trimming..." : "Trim Video"}
          </button>

          {/* Result */}
          {result && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: result.success ? "#1a2a1a" : "#2a1a1a",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {result.success ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    ✅ Trimmed!{" "}
                    {timeStr(startTime)} → {timeStr(endTime)}
                    {result.fileSize && (
                      <span style={{ color: "#888" }}> · {(result.fileSize as string)}</span>
                    )}
                  </div>
                  <button className="btn" onClick={handleDownload}>
                    Download Trimmed Video
                  </button>
                </div>
              ) : (
                <span style={{ color: "#e88" }}>❌ {result.error}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
