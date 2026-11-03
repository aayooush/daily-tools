#!/usr/bin/env node

const { mkdirSync, writeFileSync, statSync, readdirSync, readFileSync, existsSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const args = process.argv.slice(2);
const subcommand = args[0];

if (!subcommand || subcommand === "--help" || subcommand === "-h") {
  console.log(`
Parent Node CLI

Usage:
  npx parent-node-tool create <tool-name>   Scaffold a new tool
  npx parent-node-tool list                  List all registered tools
  npx parent-node-tool clean                 Remove all temp files
`);
  process.exit(0);
}

const ROOT = join(__dirname, "..", "..", "..");
const TOOLS_DIR = join(ROOT, "app", "tools");

if (subcommand === "create") {
  const toolName = args[1];

  if (!toolName) {
    console.error("Error: tool name is required.");
    console.log("Usage: npx parent-node-tool create <tool-name>");
    process.exit(1);
  }

  const slug = toolName.toLowerCase().replace(/\s+/g, "-");
  const toolDir = join(TOOLS_DIR, slug);

  // Check if already exists
  try {
    statSync(toolDir);
    console.error(`Error: Tool "${slug}" already exists.`);
    process.exit(1);
  } catch {
    // Doesn't exist, good
  }

  mkdirSync(toolDir, { recursive: true });

  // tool.json
  const toolMeta = {
    slug,
    name: slug.split("-").map(capitalize).join(" "),
    icon: "🔧",
    description: "A new tool. Update this description.",
    version: "1.0.0",
  };

  writeFileSync(join(toolDir, "tool.json"), JSON.stringify(toolMeta, null, 2));

  // page.tsx (UI — "use client")
  const safeName = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  writeFileSync(
    join(toolDir, "page.tsx"),
    `"use client";

export default function ${safeName}() {
  return (
    <div>
      <h2>${toolMeta.name}</h2>
      <p style={{ color: "#888" }}>
        Build your tool UI here.
      </p>
    </div>
  );
}
`
  );

  // action.ts (server action)
  writeFileSync(
    join(toolDir, "action.ts"),
    `"use server";

export async function executeTool(input: Record<string, unknown>) {
  // TODO: Implement your tool logic here
  console.log("Tool input:", input);
  return { success: true };
}
`
  );

  console.log(`
✅ Tool "${slug}" created!

   ${toolDir}
   ├── tool.json
   ├── page.tsx  (UI — "use client")
   └── action.ts (server action)

Your tool is live — no restart needed!
`);
}

if (subcommand === "clean") {
  // Remove all temp directories
  const tempDirs = [".uploads", ".temp-video"];
  let cleaned = 0;
  for (const dir of tempDirs) {
    const path = join(ROOT, dir);
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      cleaned++;
    }
  }
  console.log(`Cleaned ${cleaned} temp directory/directories.`);
}

if (subcommand === "list") {
  try {
    const tools = readdirSync(TOOLS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("["))
      .map((entry) => {
        try {
          const meta = JSON.parse(
            readFileSync(join(TOOLS_DIR, entry.name, "tool.json"), "utf-8")
          );
          return { ...meta, slug: entry.name };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (tools.length === 0) {
      console.log("No tools found. Create one with: npx parent-node-tool create <name>");
      return;
    }

    console.log(`\nRegistered Tools (${tools.length}):\n`);
    tools.forEach((t) => {
      console.log(`  ${t.icon}  ${t.name}  (v${t.version}) — /tools/${t.slug}`);
    });
    console.log("");
  } catch {
    console.log("No tools directory found.");
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
