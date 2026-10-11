# FMRE affiliation verification

Public, bilingual (Spanish/English) membership verification for FMRE. It only calls `POST /api/public` with the `id` and `rnd` from the page URL; these values are never displayed.

## Local development

```sh
npm install
npm run dev
```

Open `http://localhost:5173/validaafiliacion?id=1073741824&rnd=1073741824` (replace the example values with a valid link). The local Vite proxy forwards `/api` to `http://localhost:8080` by default. The example values return no record on the current backend.

Copy `.env.example` to `.env.local` to configure:

- `VITE_API_PROXY_TARGET`: the backend origin used by the local dev proxy.
- `VITE_API_BASE_URL`: an optional backend origin (or same-origin path prefix) for direct browser requests. Leave blank for same-origin `/api/public`. If using a different origin, the backend must permit requests from the web app's origin.

For deployment, run `npm run build` and serve `dist/` with SPA fallback so `/validaafiliacion` loads `index.html`. Proxy `/api/public` to the backend (remove or set the forwarded `Origin` header to one the backend accepts), or configure `VITE_API_BASE_URL` at build time if the backend allows cross-origin requests. `npm test` runs the domain tests.
