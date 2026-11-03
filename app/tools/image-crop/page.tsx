"use client";
import { useState, useRef, useCallback } from "react";
import { cropImage, CropResult } from "./action";

export default function ImageCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cropResult, setCropResult] = useState<CropResult | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  // Crop state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [selectEnd, setSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setCropResult(null);
      setShowCrop(false);
      setSelectStart(null);
      setSelectEnd(null);
    }
  };

  const handleCrop = async () => {
    if (!file || !selectStart || !selectEnd) return;
    setLoading(true);

    const x = Math.min(selectStart.x, selectEnd.x);
    const y = Math.min(selectStart.y, selectEnd.y);
    const width = Math.abs(selectEnd.x - selectStart.x);
    const height = Math.abs(selectEnd.y - selectStart.y);

    const result = await cropImage(file, x, y, width, height);
    setCropResult(result);
    setShowCrop(true);
    setLoading(false);
  };

  const handleDownload = () => {
    if (!cropResult?.success || !cropResult.base64) return;
    const binary = atob(cropResult.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file ? `cropped-${file.name.replace(/\.[^.]+$/, "")}.png` : "cropped.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !file) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsSelecting(true);
    setSelectStart({ x, y });
    setSelectEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSelectEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const resetCrop = () => {
    setShowCrop(false);
    setCropResult(null);
    setSelectStart(null);
    setSelectEnd(null);
  };

  const cropArea = selectStart && selectEnd ? (() => {
    const x = Math.min(selectStart.x, selectEnd.x);
    const y = Math.min(selectStart.y, selectEnd.y);
    const width = Math.abs(selectEnd.x - selectStart.x);
    const height = Math.abs(selectEnd.y - selectStart.y);
    return { x, y, width, height };
  })() : null;

  const cropDims = cropArea ? `${Math.round(cropArea.width)} × ${Math.round(cropArea.height)}` : "";

  return (
    <div>
      {/* Upload */}
      <label className="label">Upload Image</label>
      <div
        onClick={() => {
          const input = document.querySelector('input[type="file"]');
          (input as HTMLInputElement)?.click();
        }}
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
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✂️</div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>Click or drag an image file here</div>
        )}
      </div>

      {/* Image + Crop */}
      {preview && (
        <div>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: "relative",
              display: "inline-block",
              maxWidth: "100%",
              borderRadius: 8,
              overflow: "hidden",
              cursor: showCrop ? "default" : "crosshair",
              marginBottom: 20,
            }}
          >
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: 320,
                display: "block",
              }}
            />

            {/* Crop overlay */}
            {cropArea && (
              <div
                style={{
                  position: "absolute",
                  top: cropArea.y,
                  left: cropArea.x,
                  width: cropArea.width,
                  height: cropArea.height,
                  border: "2px solid #4fc3f7",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* Crop controls */}
          {cropDims && !showCrop && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#4fc3f7" }}>
                Crop: {cropDims}
              </span>
              <button className="btn" onClick={handleCrop} disabled={loading}>
                {loading ? "Cropping..." : "Crop Image"}
              </button>
              <button className="btn-outline" onClick={resetCrop}>
                Reset
              </button>
            </div>
          )}

          {/* Result */}
          {cropResult && (
            <div
              style={{
                padding: 16,
                background: cropResult.success ? "#1a2a1a" : "#2a1a1a",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {cropResult.success ? (
                <div>
                  <div style={{ marginBottom: 8 }}>✅ Cropped successfully!</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn" onClick={handleDownload}>
                      Download Cropped
                    </button>
                    <button className="btn-outline" onClick={resetCrop}>
                      Start Over
                    </button>
                  </div>
                </div>
              ) : (
                <span style={{ color: "#e88" }}>❌ {cropResult.error}</span>
              )}
            </div>
          )}

          {!file && (
            <p style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
              Click the area above to upload an image, then drag to select a crop region.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
