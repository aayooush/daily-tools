import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ToolMeta {
  slug: string;
  name: string;
  icon: string;
  description: string;
  version: string;
  category?: string;
}

const TOOLS_DIR = join(process.cwd(), "app", "tools");

export async function getTools(): Promise<ToolMeta[]> {
  try {
    const entries = await readdir(TOOLS_DIR, { withFileTypes: true });

    const tools: ToolMeta[] = [];

    for (const entry of entries) {
      // Skip dynamic routes (directories starting with [)
      if (entry.name.startsWith("[")) continue;
      if (!entry.isDirectory()) continue;

      const toolJsonPath = join(TOOLS_DIR, entry.name, "tool.json");

      try {
        const raw = await readFile(toolJsonPath, "utf-8");
        const meta = JSON.parse(raw) as ToolMeta;
        tools.push({ ...meta, slug: entry.name });
      } catch {
        continue;
      }
    }

    return tools.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
