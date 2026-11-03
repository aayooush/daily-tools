import { getTools } from "../lib/registry";
import Link from "next/link";

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  image: { label: "Image Tools", icon: "🎨" },
  document: { label: "Document Tools", icon: "📁" },
  video: { label: "Video Tools", icon: "🎬" },
};

export default async function HomePage() {
  const tools = await getTools();

  // Group tools by category (skip tools without category)
  const grouped = tools.reduce<Record<string, typeof tools>>((acc, tool) => {
    const cat = tool.category || "uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  // Sort categories in a logical order
  const categoryOrder = ["image", "document", "video", "uncategorized"];
  const sortedCategories = categoryOrder.filter((c) => grouped[c]);

  return (
    <>
      {/* Banner */}
      <section className="banner">
        <h1 className="banner-title gradient-text">
          Daily Tools
        </h1>
        <p className="banner-subtitle">
          Compress images, shrink PDFs, and more.
          <br />
          Fast, private, no sign-up needed.
        </p>

        {/* Tool Groups */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {sortedCategories.map((cat) => {
            const meta = CATEGORIES[cat] || { label: cat, icon: "🔧" };
            const catTools = grouped[cat];

            return (
              <div key={cat}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#888", marginBottom: 16, letterSpacing: "0.02em" }}>
                  {meta.icon} {meta.label} ({catTools.length})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 20,
                  }}
                >
                  {catTools.map((tool) => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                      <div className="tool-card">
                        <div style={{ fontSize: 28, marginBottom: 14 }}>
                          {tool.icon}
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
                          {tool.name}
                        </h3>
                        <p style={{ fontSize: 13, color: "#777", lineHeight: 1.5 }}>
                          {tool.description}
                        </p>
                        <div style={{ marginTop: 14, fontSize: 11, color: "#555" }}>
                          v{tool.version}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About section */}
      <section
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "64px 24px 80px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 16,
            letterSpacing: "-0.01em",
          }}
        >
          Why Daily Tools?
        </h2>
        <p
          style={{
            color: "#888",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 48,
          }}
        >
          We believe tools should be simple, fast, and private.{" "}
          <strong style={{ color: "#ccc" }}>
            Daily Tools handles everything on our servers
          </strong>{" "}
          so your files never sit on your device longer than needed.
          No accounts, no watermark, no limits. Just pick a tool,
          upload your file, and get your result.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 24,
          }}
        >
          <FeatureCard icon="⚡" title="Fast" desc="Compressed on our servers, not your device" />
          <FeatureCard icon="🔒" title="Private" desc="Files are processed and discarded" />
          <FeatureCard icon="🎨" title="Flexible" desc="Choose format, quality, and output" />
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #222",
        borderRadius: 14,
        padding: 24,
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#777", lineHeight: 1.5 }}>
        {desc}
      </div>
    </div>
  );
}
