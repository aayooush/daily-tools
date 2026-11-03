"use server";

import sharp from "sharp";

export async function compressImage(
  file: File,
  quality: number,
  format: "jpeg" | "png" | "webp",
  resizeWidth?: number
): Promise<{
  success: boolean;
  originalSize?: string;
  compressedSize?: string;
  mimeType?: string;
  base64?: string;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const originalBytes = arrayBuffer.byteLength;

    let pipeline = sharp(arrayBuffer);

    // Optional resize (maintain aspect ratio, don't enlarge)
    if (resizeWidth && resizeWidth > 0) {
      pipeline = pipeline.resize({
        width: resizeWidth,
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Compress based on output format
    switch (format) {
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality,
          effort: 4,
        });
        break;
      case "png":
        pipeline = pipeline.png({
          compressionLevel: 9,
        });
        break;
    }

    const compressed = await pipeline.toBuffer();
    const mimeType = `image/${format === "jpeg" ? "jpeg" : format}`;

    // Return as base64 — Server Actions can't pass Uint8Array directly
    const base64 = compressed.toString("base64");

    return {
      success: true,
      originalSize: formatBytes(originalBytes),
      compressedSize: formatBytes(compressed.byteLength),
      mimeType,
      base64,
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
