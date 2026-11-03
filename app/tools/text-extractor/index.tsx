"use client";
import { useState, useRef } from "react";
import { extractText } from "./action";

export default function TextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    | { type: "success"; text: string; pageCount?: number }
    | { type: "error"; message: string }
    | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setStatus(null);

    // Create preview for images
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);

    const isPdf = file.type === "application/pdf";

    if (isPdf) {
      // Server-side PDF text extraction
      const result = await extractText(file);
      setStatus(
        result.success
          ? { type: "success", text: result.text || "", pageCount: result.pageCount }
          : { type: "error", message: result.error || "Unknown error" }
      );
      setLoading(false);
    } else {
      // Client-side OCR with Tesseract.js
      try {
        const imageUrl = URL.createObjectURL(file);

        // Dynamically load Tesseract.js
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");

        const {
          data: { text },
        } = await worker.recognize(imageUrl);

        await worker.terminate();
        URL.revokeObjectURL(imageUrl);

        setStatus({ type: "success", text });
      } catch (err: unknown) {
        setStatus({
          type: "error",
          message: err instanceof Error ? err.message : "OCR failed — is your browser up to date?",
        });
      }
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!status?.text) return;
    const blob = new Blob([status.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file
      ? `extracted-${file.name.split(".")[0]}.txt`
      : "extracted.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!status?.text) return;
    navigator.clipboard.writeText(status.text);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus(null);
  };

  const isImage = file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf";

  return (
    <div>
      {/* Upload */}
      <label className="label">Upload Image or PDF</label>
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
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>
              {isImage ? "🖼️" : "📄"}
            </div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
              {isImage ? " (OCR via Tesseract.js)" : " (extracted server-side)"}
            </div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            <div style={{ marginBottom: 8 }}>📄</div>
            <div>Click or drag an image (PNG, JPG, WebP, BMP) or PDF</div>
          </div>
        )}
      </div>

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

      {/* Controls */}
      {file && (
        <>
          {!status && (
            <button className="btn" onClick={handleExtract} disabled={loading}>
              {loading
                ? isPdf
                  ? "Extracting..."
                  : "OCR in progress..."
                : "Extract Text"}
            </button>
          )}

          {/* Result */}
          {status && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: status.type === "success" ? "#1a2a1a" : "#2a1a1a",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {status.type === "success" ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    ✅ Text extracted!
                    {status.pageCount && (
                      <span style={{ color: "#888", fontSize: 13 }}>
                        {" "}
                        · {status.pageCount} page{status.pageCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
                  >
                    <button className="btn-outline" onClick={handleCopy} style={{ padding: "6px 14px", fontSize: 13 }}>
                      Copy Text
                    </button>
                    <button className="btn-outline" onClick={handleDownload} style={{ padding: "6px 14px", fontSize: 13 }}>
                      Download .txt
                    </button>
                    <button className="btn-outline" onClick={reset} style={{ padding: "6px 14px", fontSize: 13 }}>
                      New File
                    </button>
                  </div>
                  <textarea
                    value={status.text}
                    readOnly
                    style={{
                      width: "100%",
                      minHeight: 200,
                      resize: "vertical",
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "monospace",
                      background: "#0a0a0a",
                    }}
                  />
                </div>
              ) : (
                <span style={{ color: "#e88" }}>❌ {status.message}</span>
              )}
            </div>
          )}

          {!file && (
            <p style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
              Upload an image for OCR text extraction, or a PDF to extract its text content.
            </p>
          )}
        </>
      )}
    </div>
  );
}
