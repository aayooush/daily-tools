"use client";
import { useState, useRef } from "react";
import { compressImage } from "./action";

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    null | {
      success: boolean;
      originalSize?: string;
      compressedSize?: string;
      mimeType?: string;
      base64?: string;
      error?: string;
    }
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg|tiff|tif)$/i.test(f.name))) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setStatus(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    const width = resizeWidth ? Number(resizeWidth) : undefined;
    const result = await compressImage(file, quality, format, width);
    setStatus(result);
    setLoading(false);
  };

  const handleDownload = () => {
    if (!status?.success || !status.base64) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = file?.name?.replace(/\.[^.]+$/, "") || "image";

    // Server returns raw base64 (no data URL prefix)
    const binary = atob(status.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: status.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-compressed.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Upload area */}
      <label className="label">Upload Image</label>
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
          transition: "background 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.tiff,.tif"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
              {" · "}
              {file.type || (/\.(jpg|jpeg)$/i.test(file.name) ? "image/jpeg" : /\.(png)$/i.test(file.name) ? "image/png" : /\.(webp)$/i.test(file.name) ? "image/webp" : /\.(gif)$/i.test(file.name) ? "image/gif" : /\.(bmp)$/i.test(file.name) ? "image/bmp" : /\.(svg)$/i.test(file.name) ? "image/svg+xml" : /\.(tiff|tif)$/i.test(file.name) ? "image/tiff" : "image")}</div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            Click or drag an image file here
          </div>
        )}
      </div>

      {/* Preview + Controls */}
      {file && (
        <div>
          {/* Preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: 280,
                borderRadius: 8,
                marginBottom: 24,
                objectFit: "contain",
              }}
            />
          )}

          {/* Controls: 3 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <label className="label">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div>
              <label className="label">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="label">Resize Width (px)</label>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button
              className="btn"
              onClick={handleCompress}
              disabled={loading}
            >
              {loading ? "Compressing..." : "Compress Image"}
            </button>
          </div>

          {/* Result */}
          {status && (
            <div
              style={{
                padding: 16,
                background: status.success ? "#1a2a1a" : "#2a1a1a",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {status.success ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    ✅ Compressed!{" "}
                    {status.originalSize}{" "}
                    <span style={{ color: "#888" }}>→</span>{" "}
                    <strong>{status.compressedSize}</strong>
                  </div>
                  <button className="btn" onClick={handleDownload}>
                    Download Compressed Image
                  </button>
                </div>
              ) : (
                <span style={{ color: "#e88" }}>
                  ❌ {status.error}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
