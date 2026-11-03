"use client";
import { useState, useRef } from "react";
import { extractText } from "./action";

export default function PDFtoText() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    null | { success: boolean; text?: string; pageCount?: number; error?: string }
  >(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    const res = await extractText(file);
    setResult(res);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result?.success || !result.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Upload */}
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
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: "#777", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div style={{ color: "#666" }}>Click or drag a PDF file here</div>
        )}
      </div>

      {/* Extract */}
      {file && (
        <>
          <button className="btn" onClick={handleExtract} disabled={loading}>
            {loading ? "Extracting..." : "Extract Text"}
          </button>

          {/* Result */}
          {result && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: result.success ? "#141414" : "#2a1a1a",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {result.success ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ color: "#888", fontSize: 13 }}>
                      {result.pageCount} page{result.pageCount !== 1 ? "s" : ""} extracted
                    </span>
                    <button
                      className="btn-outline"
                      onClick={handleCopy}
                      style={{ padding: "6px 14px", fontSize: 13 }}
                    >
                      {copied ? "✓ Copied" : "Copy Text"}
                    </button>
                  </div>
                  <textarea
                    value={result.text}
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
                <span style={{ color: "#e88" }}>❌ {result.error}</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
