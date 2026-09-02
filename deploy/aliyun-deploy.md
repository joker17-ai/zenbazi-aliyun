# ZenBazi Aliyun Deploy

## Upload Package

Upload the generated release zip to your Aliyun ECS instance and extract it, for example:

```bash
unzip zenbazi-aliyun-release.zip -d /opt/zenbazi
cd /opt/zenbazi
```

## Prepare Environment

1. Install Node.js 18+ on the server.
2. Copy `.env.example` to `.env.local` and fill in production values.
3. Keep `STORAGE_DRIVER=local` if you want to continue using the bundled `cloud/` directory.

```bash
cp .env.example .env.local
```

## Install And Start

```bash
chmod +x deploy/aliyun-start.sh
./deploy/aliyun-start.sh
```

## Default Ports

- Frontend static files are served by the backend from `dist/`
- Backend listens on `8787` by default

## Notes

- The backend runs `server/server.mjs` directly, so keep both `server/` and `src/` in the release package.
- The frontend production assets must exist in `dist/`.
- If you use nginx, reverse proxy traffic to `http://127.0.0.1:8787`.
