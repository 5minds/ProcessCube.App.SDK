# External Task Worker Reconnect mit Backoff

## Kontext

Worker beenden sich sofort bei Connection-Fehlern (`process.exit(3)`), Adapter startet nach 1s neu, nach 3 Fehlschlägen in 60s permanent gestoppt. Worker erholen sich nie.

## Aufgaben

- [x] Todo-Datei erstellen
- [x] `ExternalTaskWorkerProcess.ts` — Connection-Fehler im Prozess mit Backoff behandeln
  - [x] `isConnectionError`-Hilfsfunktion hinzufügen
  - [x] Retry-State und Konstanten auf Modul-Ebene
  - [x] `onWorkerError`-Callback: bei Connection-Fehlern retry statt exit
  - [x] State-Variablen für create-Parameter speichern
  - [x] Retry-Counter bei erfolgreichem Start zurücksetzen
- [x] `ExternalTaskAdapter.ts` — Exponentielles Backoff beim Restart
  - [x] Konstanten anpassen (MAX_RESTART_ATTEMPTS, RESTART_WINDOW_MS, MAX_RESTART_DELAY_MS)
  - [x] Restart-Delay mit Backoff berechnen statt festes 1s
- [x] Build prüfen (`npm run build`)

## Review

### Geänderte Dateien

1. **`src/server/lib/ExternalTaskWorkerProcess.ts`**
   - `isConnectionError()` erkennt ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN, socket hang up, fetch failed
   - Bei Connection-Fehlern: Worker bleibt im Prozess, retried mit exponentiellem Backoff (1s, 2s, 4s, 8s, 16s, 30s max)
   - Max 6 Retries (konfigurierbar via `PROCESSCUBE_APP_SDK_ETW_RETRY`)
   - Bei erfolgreichem `start()` wird der Retry-Counter zurückgesetzt
   - State-Variablen (`currentIdentity`, `currentModuleString`, `currentWorkerPath`) ermöglichen erneuten `create()`-Aufruf
   - Nicht-Connection-Fehler: Verhalten wie bisher (`process.exit(3)`)

2. **`src/server/lib/ExternalTaskAdapter.ts`**
   - `MAX_RESTART_ATTEMPTS`: 3 → 6 (Safety-Net, da Connection-Fehler jetzt im Worker gehandelt werden)
   - `RESTART_WINDOW_MS`: 60s → 300s (5 Min, passend zum Backoff)
   - Neues `MAX_RESTART_DELAY_MS`: 30s
   - Restart-Delay: exponentielles Backoff (1s, 2s, 4s, ..., max 30s) statt festes 1s

### Was sich nicht geändert hat

- Exit-Codes 1, 2, 4 — unverändert
- SIGTERM/SIGINT/SIGHUP-Handling — unverändert
- Identity-Refresh-Zyklus — unverändert
- File-Watcher (chokidar) — unverändert
- `restart()`-Funktion (Code-Änderungen) — unverändert
