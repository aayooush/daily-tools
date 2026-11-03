"use client";
import { useState, useRef } from "react";
import { compressPDF } from "./action";

export default function PDFCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    null | {
      success: boolean;
      originalSize?: string;
      compressedSize?: string;
      pageCount?: number;
      data?: Uint8Array;
      error?: string;
    }
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setStatus(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    const result = await compressPDF(file, compressionLevel);
    setStatus(result);
    setLoading(false);
  };

  const handleDownload = () => {
    if (!status?.success || !status.base64) return;

    // Server returns raw base64 (no data URL prefix)
    const binary = atob(status.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file ? `compressed-${file.name}` : "compressed.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const savings =
    status?.success && status.originalSize && status.compressedSize
      ? `Saved ${(parseFloat(status.originalSize.replace(/[^0-9.]/g, "")) / (status.originalSize.match(/MB/) ? 1 : status.originalSize.match(/KB/) ? 1024 : 1)) - (parseFloat(status.compressedSize.replace(/[^0-9.]/g, "")) / (status.compressedSize.match(/MB/) ? 1 : status.compressedSize.match(/KB/) ? 1024 : 1))}`
      : "";

  return (
    <div>
      {/* Upload area */}
      <label className="label">Upload PDF</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #333",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 24,
          background: file ? "#1a2a1a" : "#111",
          transition: "background 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB · {status?.pageCount ? status.pageCount + " page" + (status.pageCount !== 1 ? "s" : "") : ""}
            </div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            Click or drag a PDF file here
          </div>
        )}
      </div>

      {/* Compression options + result */}
      {file && (
        <>
          <label className="label">Compression Level</label>
          <select
            value={compressionLevel}
            onChange={(e) => setCompressionLevel(e.target.value as any)}
            style={{ marginBottom: 24 }}
          >
            <option value="low">Low — Fastest, minimal compression</option>
            <option value="medium">Medium — Balanced (default)</option>
            <option value="high">High — Best compression, slower</option>
          </select>

          <button
            className="btn"
            onClick={handleCompress}
            disabled={loading}
          >
            {loading ? "Compressing..." : "Compress PDF"}
          </button>

          {/* Result */}
          {status && (
            <div
              style={{
                marginTop: 20,
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
                    {status.pageCount && (
                      <span style={{ color: "#666" }}>
                        {" "}
                        · {status.pageCount} page
                        {status.pageCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button className="btn" onClick={handleDownload}>
                    Download Compressed PDF
                  </button>
                </div>
              ) : (
                <span style={{ color: "#e88" }}>
                  ❌ {status.error}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
