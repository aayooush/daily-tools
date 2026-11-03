"use server";

import { PDFDocument, CompressionLevel } from "pdf-lib";

export async function compressPDF(
  file: File,
  level: "low" | "medium" | "high" = "medium"
): Promise<{
  success: boolean;
  originalSize?: string;
  compressedSize?: string;
  base64?: string;
  pageCount?: number;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const originalBytes = arrayBuffer.byteLength;

    // Load the PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      updateMetadata: false,
    });

    // Map levels to pdf-lib compression constants
    const levelMap: Record<string, CompressionLevel> = {
      low: CompressionLevel.Low,
      medium: CompressionLevel.Medium,
      high: CompressionLevel.High,
    };

    // Save with compression
    const compressed = await pdfDoc.save({
      compressionLevel: levelMap[level],
      updateMetadata: false,
    });

    const compressedArray = new Uint8Array(compressed);

    // Return as base64 — Server Actions can't pass Uint8Array directly
    const base64 = compressedArray.toString("base64");

    return {
      success: true,
      originalSize: formatBytes(originalBytes),
      compressedSize: formatBytes(compressedArray.byteLength),
      base64,
      pageCount: pdfDoc.getPageCount(),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
