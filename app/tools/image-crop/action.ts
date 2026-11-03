"use server";

import sharp from "sharp";

export interface CropResult {
  success: boolean;
  base64?: string;
  width?: number;
  height?: number;
  error?: string;
}

export async function cropImage(
  file: File,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<CropResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const cropped = await sharp(arrayBuffer)
      .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
      .toBuffer();

    return {
      success: true,
      base64: cropped.toString("base64"),
      width: cropped.byteLength,
      height: cropped.byteLength,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
