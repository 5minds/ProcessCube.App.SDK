# ETW Stabilität bei Verbindungsverlust

## Analyse

Der ExternalTask-Worker-Mechanismus hat mehrere Schwachstellen, die dazu führen, dass Worker bei Verbindungsverlust zur Engine oder Authority nicht zuverlässig wiederhergestellt werden.

### Identifizierte Probleme

#### 1. connectionRetryCount wird sofort zurückgesetzt (kritisch)

**Datei:** `ExternalTaskWorkerProcess.ts`, Zeile 164-165

- `connectionRetryCount = 0` wird synchron nach `start()` ausgeführt, bevor der Error-Callback feuert
- Der Counter erreicht nie 6/6, Backoff ist immer 1s statt exponentiell
- Worker retried endlos mit 1s Delay (kein echtes Backoff)

#### 2. Token-Refresh-Zyklus stirbt permanent (kritisch)

**Datei:** `ExternalTaskAdapter.ts`, Zeilen 259-305

- Bei Fehler im Token-Refresh: nur 5 Retries mit 2s Delay (= max 10 Sekunden Toleranz)
- Nach 5 Fehlversuchen: **alle Worker werden gekillt und der Refresh-Zyklus stoppt für immer**
- Der Adapter-Restart-Mechanismus startet zwar Worker neu, aber **nicht den Token-Refresh-Zyklus**

#### 3. IPC send kann den Refresh-Zyklus crashen (kritisch)

**Datei:** `ExternalTaskAdapter.ts`, Zeilen 274-281

- `externalTaskWorkerProcess.send()` kann eine Exception werfen, wenn der Worker-Prozess gerade disconnected/beendet wird
- Diese Exception wird im catch-Block gefangen und als Token-Refresh-Fehler gezählt

#### 4. Kein Retry beim initialen Start (mittel)

**Datei:** `ExternalTaskAdapter.ts`, Zeile 47

- `getFreshTokenSet()` beim Start hat keinen Retry-Mechanismus
- Wenn Authority beim App-Start nicht erreichbar -> Adapter startet gar nicht

#### 5. start() Exception im Worker nicht als Connection Error behandelt (mittel)

**Datei:** `ExternalTaskWorkerProcess.ts`, Zeile 164

- Wenn `externalTaskWorker.start()` synchron eine Exception wirft, wird kein Reconnect ausgelöst

---

## Plan

### [x] 1. connectionRetryCount-Bug fixen (ExternalTaskWorkerProcess.ts)

- `isReconnecting`-Flag eingeführt, Counter wird nur bei nicht-Retry zurückgesetzt
- Reconnect-Logik in `scheduleReconnectOrExit()` extrahiert

### [x] 2. start() im Worker-Prozess absichern

- `try/catch` um `externalTaskWorker.start()`
- Bei Fehler: `scheduleReconnectOrExit()` aufrufen

### [x] 3. Token-Refresh robuster machen (ExternalTaskAdapter.ts)

- Exponentielles Backoff statt festes 2s-Delay (1s, 2s, 4s, 8s ... bis 60s)
- 10 Retries mit Logging, danach weiter retrien (gibt nie auf)
- Worker werden nicht mehr gekillt bei Token-Refresh-Fehler
- `refreshCycleActive`-Flag zum Tracking

### [x] 4. IPC send absichern

- `try/catch` um jeden `send()`-Aufruf im Token-Refresh
- Fehler beim send wird als Warning geloggt, nicht als Refresh-Fehler gezählt

### [x] 5. Initialen Token-Fetch mit Retry versehen

- `getFreshTokenSetWithRetry()` mit 10 Versuchen und exponentiellem Backoff (bis 30s)
- App startet auch wenn Authority kurz verzögert hochfährt

### [x] 6. Token-Refresh-Zyklus bei Worker-Restart wiederherstellen

- Im Adapter-Restart-Handler: Prüfung ob `refreshCycleActive`
- Wenn nicht: neuen Token holen und Refresh-Zyklus starten

---

## Review

### Geänderte Dateien

- `src/server/lib/ExternalTaskWorkerProcess.ts` — Backoff-Bug gefixt, start() abgesichert, Reconnect-Logik extrahiert
- `src/server/lib/ExternalTaskAdapter.ts` — Token-Refresh robuster, IPC abgesichert, initialer Retry, Refresh-Zyklus-Recovery

### Testergebnisse

| Test                                         | Ergebnis                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Engine-Ausfall (ohne Last)                   | Backoff 1s->2s->4s->8s->16s->30s korrekt, Recovery nach Engine-Neustart      |
| Engine-Ausfall (unter Last, zyklische Tasks) | Worker erholt sich, pollt wieder normal                                      |
| Authority beim Start nicht da                | Token-Retry 1s->2s->4s->8s->16s (10 Versuche), Recovery nach Authority-Start |

### Konfigurierbare Parameter

- `PROCESSCUBE_APP_SDK_ETW_RETRY` — Anzahl Worker-Reconnect-Versuche (Default: 6)
- Adapter-Restart: max 6 Restarts in 5 Minuten pro Worker
- Token-Refresh: retried unbegrenzt mit max 60s Backoff
- Initialer Token-Fetch: 10 Versuche mit max 30s Backoff
