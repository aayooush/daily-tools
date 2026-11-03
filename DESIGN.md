# Daily Tools — Technical Design

> Compress images, shrink PDFs, and more. Fast, private, no sign-up needed.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Daily Tools (Hosted Site)           │
│                                                  │
│  Header (sticky)  →  "Daily Tools"              │
│  Banner (home)    →  all tools listed            │
│  Tool Routes      →  /tools/<slug>              │
│                                                  │
│  Each tool = self-contained module               │
│  No cross-tool data sharing                      │
└─────────────────────────────────────────────────┘
```

### Routing Model

- **Explicit routes** take priority over dynamic routes (Next.js default)
- `app/tools/pdf-compressor/page.tsx` → matches `/tools/pdf-compressor`
- `app/tools/[slug]/page.tsx` → matches unknown slugs (404 fallback)

### Discovery

The registry at `lib/registry.ts` scans `app/tools/` for directories with `tool.json` and lists them on the homepage.

---

## File Cleanup Policy

**All tools are designed to clean up after themselves:**

| Tool | Approach | Traces on Server? |
|---|---|---|
| **Image Compressor** | Returns base64 directly (sharp) | ❌ None |
| **PDF Compressor** | Returns base64 directly (pdf-lib) | ❌ None |
| **Image Crop** | Returns base64 directly (sharp) | ❌ None |
| **PDF to Text** | Returns text directly (pdf-parse) | ❌ None |
| **Video Trim** | Writes temp → reads → deletes | ✅ Auto-cleaned |

**CLI command:** `npx dailytools clean` — removes stale temp directories.

---

## Tool: Image Compressor

| Field | Value |
|---|---|
| **Slug** | `image-compressor` |
| **Route** | `/tools/image-compressor` |
| **Category** | Image |
| **Library** | `sharp` (node-vips) |

### Features

- **Format conversion** — Output as JPEG, PNG, or WebP regardless of input
- **Quality control** — 0–100 slider, different per format
- **Resizing** — Optional width (maintains aspect ratio, doesn't enlarge)
- **Input formats** — JPEG, PNG, WebP, GIF, BMP, SVG, TIFF

### Data Flow

```
[User uploads image]
  → UI selects format + quality + optional resize
  → Server: sharp(buffer) → resize → toFormat → toBuffer()
  → Base64 returned → Client: decode → Blob → download
```

**Savings:** 40–80% reduction (JPEG with mozjpeg, or WebP with effort 4).

---

## Tool: Image Crop

| Field | Value |
|---|---|
| **Slug** | `image-crop` |
| **Route** | `/tools/image-crop` |
| **Category** | Image |
| **Library** | `sharp` (extract) |

### Features

- Drag-to-select crop region on client
- Server crops with exact coordinates
- Returns cropped image as base64

### Data Flow

```
[User uploads image]
  → Drag on image → track x, y, width, height
  → Server: sharp(buffer).extract({ left, top, width, height })
  → Base64 returned → Client: decode → Blob → download
```

---

## Tool: PDF Compressor

| Field | Value |
|---|---|
| **Slug** | `pdf-compressor` |
| **Route** | `/tools/pdf-compressor` |
| **Category** | Document |
| **Library** | `pdf-lib` (pure JS) |

### Compression Levels

| Level | What it does | Typical savings |
|---|---|---|
| **Low** (0) | Compresses page streams | 10–30% |
| **Medium** (1) | Compresses streams + images | 20–50% |
| **High** (2) | + object streams | 30–70% |

### Data Flow

```
[User uploads PDF]
  → Select compression level
  → Server: PDFDocument.load → PDFDocument.save({ compressionLevel })
  → Base64 returned → Client: decode → Blob → download
```

---

## Tool: PDF to Text

| Field | Value |
|---|---|
| **Slug** | `pdf-to-text` |
| **Route** | `/tools/pdf-to-text` |
| **Category** | Document |
| **Library** | `pdf-parse` |

### Features

- Extract all text from PDF, page by page
- Display in scrollable textarea
- Copy to clipboard button

### Data Flow

```
[User uploads PDF]
  → Server: pdfParse(arrayBuffer) → { text, numpages }
  → Text displayed in textarea → Copy button
```

---

## Tool: Video Trim

| Field | Value |
|---|---|
| **Slug** | `video-trim` |
| **Route** | `/tools/video-trim` |
| **Category** | Video |
| **Library** | `ffmpeg` (system binary) |
| **Max file size** | 50MB |

### Features

- Upload video + set start/end times
- Server trims with FFmpeg (stream copy — no re-encode)
- Returns trimmed video as base64

### Data Flow

```
[User uploads video]
  → Set start (sec) and end (sec)
  → Server: ffmpeg -i input.mp4 -ss 10 -to 30 -c copy output.mp4
  → Temp file read as base64, then deleted
  → Client: decode → Blob → download
```

### Deployment Note

FFmpeg must be installed on the server. For Docker:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

---

## Tool: Text Extractor (Stub)

| Field | Value |
|---|---|
| **Slug** | `text-extractor` |
| **Route** | `/tools/text-extractor` |
| **Category** | Document |
| **Status** | Scaffolded (no real logic yet) |

---

## Adding a New Tool

1. **Scaffold:** `npx dailytools create <tool-name>`
2. **Update `tool.json`:** Set icon, name, description
3. **Build UI in `page.tsx`:** Add `"use client"` at the top
4. **Implement logic in `action.ts`:** Use `"use server"`, return base64
5. **Test at `/tools/<slug>`** — it appears on the homepage instantly

### CLI Commands

```bash
npx dailytools create <name>   # Scaffold a new tool
npx dailytools list             # List all tools
npx dailytools clean            # Remove temp files
```

---

## Deployment

```bash
npx next dev --port 3000   # Development
npx next build             # Build
npx next start             # Production
```

| Platform | Command | FFmpeg? |
|---|---|---|
| **Vercel** | `npx vercel` | ❌ (pure-JS only) |
| **Railway** | `railway init` | ✅ (install FFmpeg) |
| **Docker** | `docker build .` | ✅ (included) |
| **Fly.io** | `fly launch` | ✅ (install FFmpeg) |

### Docker (recommended)

```bash
docker build -t daily-tools .
docker run -p 3000:3000 daily-tools
```

See `DOCKER.md` for details.

