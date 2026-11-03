"use server";

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const TEMP_DIR = join(process.cwd(), ".temp-video");

export async function trimVideo(
  file: File,
  startTime: number,
  endTime: number
): Promise<{
  success: boolean;
  base64?: string;
  outputName?: string;
  fileSize?: string;
  error?: string;
}> {
  const bytes = await file.arrayBuffer();
  const fileSize = bytes.byteLength;

  if (fileSize > MAX_SIZE) {
    return { success: false, error: `File too large. Max 50MB (you uploaded ${(fileSize / 1024 / 1024).toFixed(1)}MB)` };
  }

  try {
    mkdirSync(TEMP_DIR, { recursive: true });

    const inputName = `input-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const inputPath = join(TEMP_DIR, `${inputName}${getExtension(file.name)}`);
    const outputPath = join(TEMP_DIR, `trimmed-${Date.now()}.mp4`);

    // Write file to disk
    writeFileSync(inputPath, new Uint8Array(bytes));

    // Trim using FFmpeg (stream copy — no re-encode, fast)
    const ffmpegCmd = `ffmpeg -i "${inputPath}" -ss ${startTime} -to ${endTime} -c copy "${outputPath}" -y`;
    execSync(ffmpegCmd, { stdio: "pipe" });

    // Read trimmed file
    const trimmed = readFileSync(outputPath);
    const base64 = trimmed.toString("base64");
    const outSize = formatBytes(trimmed.byteLength);

    // Cleanup
    try {
      unlinkSync(inputPath);
      unlinkSync(outputPath);
    } catch {}

    return {
      success: true,
      base64,
      outputName: `trimmed-${file.name.replace(/\.[^.]+$/, "")}.mp4`,
      fileSize: outSize,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error — is FFmpeg installed?",
    };
  }
}

function getExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : ".mp4";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
