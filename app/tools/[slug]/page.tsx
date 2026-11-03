import { getTools } from "../../../lib/registry";
import Link from "next/link";

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tools = await getTools();
  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Tool not found</h2>
        <p style={{ color: "#888", marginBottom: 24 }}>
          This tool hasn't been added yet.
        </p>
        <Link href="/">
          <span className="btn">← Back to Home</span>
        </Link>
      </div>
    );
  }

  const { default: ToolUI } = await import(`./${slug}/page`);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
      <Link
        href="/"
        style={{
          color: "#888",
          textDecoration: "none",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 36,
        }}
      >
        ← Back to Home
      </Link>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{tool.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          {tool.name}
        </h1>
        <p style={{ color: "#888", fontSize: 14 }}>
          {tool.description}
        </p>
      </div>

      <div
        style={{
          background: "#141414",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <ToolUI />
      </div>
    </div>
  );
}
