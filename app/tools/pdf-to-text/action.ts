"use server";

import pdfParse from "pdf-parse";

export async function extractText(file: File): Promise<{
  success: boolean;
  text?: string;
  pageCount?: number;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(arrayBuffer);

    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
