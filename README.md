# LEARN web

Standalone private web repository. Public contracts 1.6.0 are pinned in vendor/ with SHA-256 (`npm run sync:contracts` verifies the pinned artifact; pass `-- --source <released.tgz>` to restore or add one after checking its checksum). No backend or other client checkout is required.

Setup: npm ci, npm run lint, npm run typecheck, npm test, npm run build.

Copy .env.example to .env.local. API paths include /api/v1; the configured base is the origin only.

Local development with the backend sandbox (backend repo: `npm run sandbox:up`, then API on port 4400 and the worker for AI jobs): run the web on port 3000, because the API only allows CORS from `http://127.0.0.1:3000` and `http://localhost:3000`:

    NEXT_PUBLIC_API_URL=http://127.0.0.1:4400 APP_URL=http://127.0.0.1:3000 npx next dev -p 3000 -H 127.0.0.1

`npm run check:long-text` defaults to port 3100; set `LEARN_APP_URL=http://127.0.0.1:3000` when the app runs as above.

A single `401` on `POST /api/v1/auth/refresh` in the console when no one is signed in is expected: the app probes for a session before showing the login page.

Deploy: the image is built with an empty NEXT_PUBLIC_API_URL by default, so the browser calls relative /api paths. Serve it behind the one-origin reverse proxy in the backend repository (infra/onebox), where /api/* goes to the API on the same hostname. Set an absolute origin only for a separate-origin deployment.
