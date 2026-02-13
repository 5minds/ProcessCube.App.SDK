# ETW Stabilität bei Verbindungsverlust

## Analyse

Der ExternalTask-Worker-Mechanismus hat mehrere Schwachstellen, die dazu führen, dass Worker bei Verbindungsverlust zur Engine oder Authority nicht zuverlässig wiederhergestellt werden.

### Identifizierte Probleme

#### 1. Token-Refresh-Zyklus stirbt permanent (kritisch)
**Datei:** `ExternalTaskAdapter.ts`, Zeilen 259-305

- Bei Fehler im Token-Refresh: nur 5 Retries mit 2s Delay (= max 10 Sekunden Toleranz)
- Nach 5 Fehlversuchen: **alle Worker werden gekillt und der Refresh-Zyklus stoppt für immer**
- Wenn die Authority nur kurz nicht erreichbar ist (z.B. Neustart, Netzwerk-Glitch > 10s), gibt es keine Wiederherstellung
- Der Adapter-Restart-Mechanismus startet zwar Worker neu, aber **nicht den Token-Refresh-Zyklus**
- Folge: Worker laufen mit abgelaufenem Token und scheitern erneut

#### 2. IPC send kann den Refresh-Zyklus crashen (kritisch)
**Datei:** `ExternalTaskAdapter.ts`, Zeilen 274-281

- `externalTaskWorkerProcess.send()` kann eine Exception werfen, wenn der Worker-Prozess gerade disconnected/beendet wird
- Diese Exception wird im catch-Block gefangen und als Token-Refresh-Fehler gezählt
- Kann den Refresh-Zyklus vorzeitig killen, obwohl das Token-Holen selbst erfolgreich war

#### 3. Token-Refresh Retries zu wenig tolerant (hoch)
**Datei:** `ExternalTaskAdapter.ts`, Zeilen 260, 297-300

- 5 Retries × 2s Delay = max 10 Sekunden Toleranz
- Kein exponentielles Backoff beim Token-Refresh
- Authority-Neustart oder Netzwerk-Problem > 10s = permanenter Ausfall

#### 4. Kein Retry beim initialen Start (mittel)
**Datei:** `ExternalTaskAdapter.ts`, Zeile 47

- `getFreshTokenSet()` beim Start hat keinen Retry-Mechanismus
- Wenn Authority beim App-Start nicht erreichbar → Adapter startet gar nicht
- Kein Recovery möglich ohne App-Neustart

#### 5. start() Exception im Worker nicht als Connection Error behandelt (mittel)
**Datei:** `ExternalTaskWorkerProcess.ts`, Zeile 164

- Wenn `externalTaskWorker.start()` synchron eine Exception wirft, wird sie vom IPC Message Handler gefangen (Zeile 46-52)
- Dort wird nur geloggt, kein Reconnect ausgelöst
- Worker-Prozess bleibt am Leben, tut aber nichts

---

## Plan

### [ ] 1. Token-Refresh robuster machen
- Exponentielles Backoff statt festes 2s-Delay (1s, 2s, 4s, 8s, 16s, 30s)
- Mehr Retries: 10 statt 5 (→ mehrere Minuten Toleranz)
- Nach Ausschöpfen der Retries: **nicht aufgeben**, sondern weiter mit maximalem Delay retrien
- Worker nicht sofort killen, sondern erst nach deutlich längerer Wartezeit

### [ ] 2. IPC send absichern
- `try/catch` um jeden `send()`-Aufruf im Token-Refresh
- Fehler beim send nicht als Token-Refresh-Fehler zählen

### [ ] 3. Initialen Token-Fetch mit Retry versehen
- `getFreshTokenSet()` in `subscribeToExternalTasks` mit Retry-Logik umgeben
- Exponentielles Backoff, damit der Adapter auch startet wenn die Authority kurz verzögert hochfährt

### [ ] 4. start() im Worker-Prozess absichern
- `try/catch` um `externalTaskWorker.start()` in der `create`-Funktion
- Bei Connection Error: Reconnect mit Backoff auslösen (gleiche Logik wie bei onWorkerError)

### [ ] 5. Token-Refresh-Zyklus bei Worker-Restart wiederherstellen
- Tracking ob der Refresh-Zyklus noch aktiv ist
- Wenn Worker neugestartet werden und kein Refresh-Zyklus läuft: neuen starten

---

## Review
(wird nach Umsetzung ausgefüllt)
