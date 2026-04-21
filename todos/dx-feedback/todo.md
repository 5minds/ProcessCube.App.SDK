# DX-Verbesserungen aus Consumer-Feedback

## Quelle

Feedback aus `/Users/moellenbeck/projects/moellenbeck/reps/agent-dev-with-appsdk/sdk-feedback.md`

## Analyse

### Feedback #1: CSS-Exports fehlen in der exports-Map

**Problem:** `build/client/root.css` und `build/client/index.css` sind nicht exportiert.
Consumer können sie nicht importieren (`Package path not exported`).

**Ist-Zustand:**

- `./client/components/*.css` — nur Komponenten-CSS per Wildcard
- `root.css` (43KB, Tailwind-Utilities) und `index.css` (3KB) liegen in `build/client/` aber ohne Export

**Lösung:** Zwei neue Exports hinzufügen. Am sinnvollsten `./client/styles` als
dokumentierter Single-Import-Pfad für `root.css` (enthält alles) + `./client/index.css`.

**Aufwand:** Klein

### Feedback #2: DynamicUi importiert CSS nicht

**Problem:** `DynamicUi.tsx` hat keinen `import './DynamicUi.css'`. Consumer müssen
manuell die CSS-Datei importieren. Komponente rendert ungestyled.

**Ist-Zustand:**

- `BPMNViewer.tsx` importiert `'./BPMNHeatmap.css'` — hat also bereits CSS-Import
- `DynamicUi.tsx` hat **keinen** CSS-Import
- `sideEffects: ["*.css"]` ist in package.json gesetzt (gut)

**Lösung:** `import './DynamicUi.css'` in `DynamicUi.tsx` hinzufügen. Exakt gleiches
Pattern wie `BPMNViewer.tsx`. Der CSS-Build löst das `@import '../../root.css'` darin
bereits auf, d.h. der Import zieht automatisch alle Tailwind-Utilities mit rein.

**Aufwand:** 1 Zeile

### Feedback #3: identity: false bei getUserTasks() fehlerhaft

**Problem:** `identity: false` → `undefined` an Engine-Client übergeben → 401 oder leere Ergebnisse.

**Ist-Zustand (UserTaskFunctions.ts, Zeile 124-139):**

```typescript
case false:
  options.identity = undefined;
  break;
```

Danach: `Client.userTasks.query(query, options)` — `options.identity` ist `undefined`.

**Analyse:** Der Engine-Client interpretiert `undefined` als "kein Identity-Feld im Options-Objekt",
was abhängig von der Engine-Konfiguration entweder anonym funktioniert oder einen 401 wirft.
Das Problem ist, dass `identity: undefined` im Options-Objekt bleibt — der Engine-Client
könnte das anders behandeln als wenn `identity` gar nicht im Objekt wäre.

**Lösung:** Bei `identity: false` das `identity`-Feld komplett aus dem Options-Objekt entfernen
(`delete options.identity`), statt es auf `undefined` zu setzen. So verhält sich der
Engine-Client korrekt als anonymer Zugriff.

Betrifft: `getUserTasks`, `getWaitingUserTasks`, `getWaitingUserTasksByProcessInstanceId`,
`getWaitingUserTasksByFlowNodeId`, `getWaitingUserTaskByFlowNodeInstanceId`,
`getWaitingUserTasksByCorrelationId`, `getActiveProcessInstances`.

**Aufwand:** Mittel (7 Funktionen anpassen)

### Feedback #4: Blocking vs. Non-Blocking Dokumentation

**Problem:** `waitForUserTask()` blockt (Event-Subscription), `getWaitingUserTasks()` nicht.
Die Namen sind leicht zu verwechseln.

**Lösung:** Tabelle in README.md ergänzen mit Blocking-Information.

**Aufwand:** Klein (nur Doku)

### Feedback #5: withApplicationSdk nutzt deprecated Config-Key

**Problem:** `experimental.serverComponentsExternalPackages` → in Next.js 15 verschoben
nach `serverExternalPackages`. Erzeugt Build-Warning.

**Ist-Zustand (withApplicationSDK.ts, Zeile 37):**

```typescript
experimental: {
  ...nextConfig.experimental,
  serverComponentsExternalPackages: [..., 'esbuild'],
},
```

**Lösung:** Beide Keys setzen (Rückwärtskompatibilität für Next.js 14.x falls nötig,
oder nur den neuen Key wenn wir Next.js >= 15 als Peer-Dep haben). Da `peerDependencies`
`"next": ">=15"` sagt, können wir sicher auf `serverExternalPackages` wechseln.

**Aufwand:** Klein

## Plan

### Phase 1: CSS-Fixes (Feedback #1 + #2)

- [x] 1.1 CSS-Exports in `package.json` exports-Map ergänzen (`./client/styles`, `./client/index.css`)
- [x] 1.2 CSS-Import in `DynamicUi.tsx` hinzufügen (`import './DynamicUi.css'`)
- [x] 1.3 Build testen — CSS korrekt gebündelt
- [x] 1.4 `files`-Array prüfen — `build/client` ist bereits enthalten, passt

### Phase 2: identity: false Fix (Feedback #3)

- [x] 2.1 7 Funktionen identifiziert (6× UserTaskFunctions, 1× ProcessInstanceFunctions)
- [x] 2.2 `identity: false` → `delete options.identity` in allen 7 Stellen
- [x] 2.3 Konsistenz geprüft — alle Switch-Blöcke konsistent

### Phase 3: withApplicationSdk Fix (Feedback #5)

- [x] 3.1 `experimental.serverComponentsExternalPackages` → `serverExternalPackages` (Top-Level)
- [x] 3.2 test-app Build OK — Warning ist weg

### Phase 4: Dokumentation (Feedback #4 + CSS-Doku)

- [x] 4.1 Blocking vs. Non-Blocking Tabelle in README.md (User Tasks Abschnitt)
- [x] 4.2 CSS-Import-Doku: `./client/styles` als Single-Import + DynamicUi Auto-Import Hinweis

### Phase 5: Build & Format

- [x] 5.1 `npm run build` OK, `npm run format` OK
- [x] 5.2 test-app Build OK (Next.js 15, keine Warnings)
