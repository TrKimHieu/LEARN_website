# LEARN web

Standalone private web repository. Public contracts 1.0.0 are pinned in vendor/ with SHA-256. No backend or other client checkout is required.

Setup: npm ci, npm run lint, npm run typecheck, npm test, npm run build.

Copy .env.example to .env.local (web) or .env (mobile). Use the shared API sandbox endpoint. API paths include /api/v1; the configured base is the origin only. Mobile APK: configure your Expo project and run npm run build:apk; export does not validate a native APK.

Deploy: the image is built with an empty NEXT_PUBLIC_API_URL by default, so the browser calls relative /api paths. Serve it behind the one-origin reverse proxy in the backend repository (infra/onebox), where /api/* goes to the API on the same hostname. Set an absolute origin only for a separate-origin deployment.
