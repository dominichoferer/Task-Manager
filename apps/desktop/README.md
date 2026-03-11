# TaskFlow Desktop

Electron-App, die TaskFlow als native Mac-App verpackt.

## Voraussetzungen
- Node.js 18+
- macOS (für .dmg Build)

## Setup

```bash
cd apps/desktop
npm install
```

## Vercel-URL eintragen

In `src/main.js` die Zeile anpassen:
```js
const VERCEL_URL = 'https://deine-url.vercel.app';
```

## .dmg bauen

```bash
npm run build
```

Die fertige `.dmg` Datei liegt dann in `apps/desktop/dist/`.
