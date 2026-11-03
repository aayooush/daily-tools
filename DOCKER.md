# Daily Tools — Docker deployment

## Build & Run

```bash
docker build -t daily-tools .
docker run -p 3000:3000 daily-tools
```

## Docker Compose (optional)

```yaml
services:
  daily-tools:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

## What's included

- **FFmpeg 9.x** — Video trim, stream copy (no re-encode)
- **sharp (libvips)** — Image compress + crop (JPEG, PNG, WebP, GIF, BMP, SVG, TIFF)
- **pdf-lib** — PDF compression (pure JS, no native deps)
- **pdf-parse** — PDF text extraction (pure JS)
- **Tesseract.js** — Client-side OCR (runs in browser, no server cost)
- **Next.js 15** — App Router, Server Actions, file-based routing

## Notes

- Max upload: 25 MB (configured in next.config.js)
- All tools return base64 — no files written to disk
- FFmpeg trim writes temp files during processing, then auto-deletes them
- Server must expose port 3000
