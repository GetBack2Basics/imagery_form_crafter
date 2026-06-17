# imagery_form_crafter
WebGL-accelerated temporal remote-sensing imagery comparison and metadata form builder.

Quick start
- **Dev (npm):** `npm install` then `npm run dev`
- **Production (Docker):** `docker compose up --build`

Configuration
- `.env.example` controls data source mode.
- `VITE_IMAGERY_MODE=open` uses the public STAC API.
- `VITE_IMAGERY_MODE=internal` uses local/S3-compatible storage paths.

Docker notes
- Compose maps **8080:8080**.
- Optional local imagery mount is present as a commented volume.
- The Nginx template includes an internal **/proxy?target=...** endpoint for routing internal sources.

